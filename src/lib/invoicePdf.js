import { LOGO } from "../assets/logo";
import { CFG, DEFAULT_STORE } from "./config";
import { num, rp } from "./format";

/* =====================================================================
   INVOICE PDF — nota tagihan A4 untuk dibagikan ke pelanggan (mis. via
   WhatsApp). Terpisah dari struk termal 58/80mm (lihat lib/printing.js
   & components/Receipt.jsx): struk termal untuk printer di kasir, PDF ini
   untuk dikirim/diarsipkan digital.

   jsPDF dimuat lewat DYNAMIC IMPORT (sama seperti ExcelJS) supaya tidak
   membebani waktu muat awal aplikasi — pustaka baru ditarik saat pertama
   kali pengguna benar-benar membuat invoice.
   ===================================================================== */

// jsPDF: dukung ekspor bernama (v2 ESM) maupun default, jadi aman terhadap
// perbedaan bundling.
const loadJsPDF = async () => {
  const mod = await import("jspdf");
  return mod.jsPDF || mod.default || (mod.default && mod.default.jsPDF);
};

// Font bawaan jsPDF (Helvetica) memakai Latin-1. Beberapa tanda tipografi
// (em/en dash, elipsis, bullet) bisa tampil rusak, jadi diratakan ke ASCII.
// Huruf beraksen Latin biasa dibiarkan.
const safe = (s) =>
  String(s == null ? "" : s)
    .replace(/[—–]/g, "-")
    .replace(/…/g, "...")
    .replace(/[•]/g, "-")
    .replace(/\u00A0/g, " ");

// Ukuran & marjin halaman (mm)
const PAGE = { w: 210, h: 297, mL: 16, mR: 16, mT: 16, mB: 18 };
const CONTENT_R = PAGE.w - PAGE.mR; // batas kanan area isi
const BOTTOM = PAGE.h - PAGE.mB;    // batas bawah sebelum kaki

// Palet cetak (di atas kertas putih — sengaja tidak memakai tema gelap layar)
const C = {
  ink: [31, 42, 36],       // teks utama
  soft: [107, 119, 114],   // teks sekunder
  line: [223, 220, 210],   // garis pemisah
  band: [244, 242, 236],   // latar baris header tabel
  accent: [200, 69, 61],   // merah Conflux
  ok: [46, 125, 85],        // lunas (hijau)
  okBg: [225, 240, 231],
  warn: [176, 121, 31],     // belum lunas (oranye)
  warnBg: [248, 240, 224],
  white: [255, 255, 255],
};

// Susun daftar item nota jadi baris {label, qty, amount}. Sumbernya bisa
// dari catatan hutang (d.items: {name, qtyLabel, lineTotal}).
const toRows = (items) =>
  (items || []).map((it) => ({
    label: safe(it.name || "Barang"),
    qty: safe(it.qtyLabel || (it.qty != null ? `${num(it.qty)}x` : "")),
    amount: Number(it.lineTotal) || 0,
  }));

// ------- primitif menggambar -------
const setInk = (doc, c) => doc.setTextColor(c[0], c[1], c[2]);
const setFill = (doc, c) => doc.setFillColor(c[0], c[1], c[2]);
const setStroke = (doc, c) => doc.setDrawColor(c[0], c[1], c[2]);

// Pil status membulat, rata kanan pada xRight
const drawStatusPill = (doc, xRight, y, paid) => {
  const label = paid ? "LUNAS" : "BELUM LUNAS";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const tw = doc.getTextWidth(label);
  const padX = 4, h = 7;
  const w = tw + padX * 2;
  const x = xRight - w;
  setFill(doc, paid ? C.ok : C.warn);
  doc.roundedRect(x, y, w, h, 1.6, 1.6, "F");
  setInk(doc, C.white);
  doc.text(label, x + w / 2, y + h / 2 + 1.6, { align: "center" });
  return { x, w, h };
};

// Kepala tabel item; dipakai ulang saat isi melimpah ke halaman berikutnya
const drawTableHead = (doc, cols, y) => {
  setFill(doc, C.band);
  doc.rect(PAGE.mL, y, CONTENT_R - PAGE.mL, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  setInk(doc, C.soft);
  doc.text("NO", cols.no, y + 5.4, { align: "center" });
  doc.text("BARANG", cols.itemL, y + 5.4);
  doc.text("QTY", cols.qtyR, y + 5.4, { align: "right" });
  doc.text("SUBTOTAL", cols.amtR, y + 5.4, { align: "right" });
  return y + 8;
};

// Bangun dokumen invoice dari objek data ternormalisasi
const renderInvoice = (doc, data, store) => {
  const s = store || CFG || DEFAULT_STORE;
  const nota = s?.nota || DEFAULT_STORE.nota;
  const name = safe(s?.name || DEFAULT_STORE.name);
  const addr1 = safe(s?.addr1 || "");
  const addr2 = safe(s?.addr2 || "");
  const phone = safe(s?.phone || "");
  const footer = safe(s?.footer || "");
  const brand = safe(nota?.brand || "");
  const paid = !!data.paid;

  // ---------------- KEPALA: identitas toko (kiri) ----------------
  let logoW = 0;
  const logoH = 18;
  try {
    const p = doc.getImageProperties(LOGO);
    const ratio = p && p.width && p.height ? p.width / p.height : 1;
    logoW = Math.min(24, logoH * ratio);
    doc.addImage(LOGO, "JPEG", PAGE.mL, PAGE.mT, logoW, logoH);
  } catch (_) {
    logoW = 0; // tanpa logo bila gagal decode — tetap lanjut
  }
  const tx = PAGE.mL + (logoW ? logoW + 6 : 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  setInk(doc, C.accent);
  doc.text(name, tx, PAGE.mT + 6);
  doc.setFont("helvetica", "normal");
  setInk(doc, C.soft);
  let ly = PAGE.mT + 11;
  if (addr1) { doc.setFontSize(9); doc.text(addr1, tx, ly); ly += 4.2; }
  if (addr2) { doc.setFontSize(8.5); doc.text(addr2, tx, ly); ly += 4.2; }
  if (phone) { doc.setFontSize(9); doc.text(phone, tx, ly); ly += 4.2; }

  // ---------------- KEPALA: blok INVOICE (kanan) ----------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  setInk(doc, C.accent);
  doc.text("INVOICE", CONTENT_R, PAGE.mT + 6, { align: "right" });
  drawStatusPill(doc, CONTENT_R, PAGE.mT + 10, paid);

  // Meta kanan: No / Tanggal / (Dibayar)
  const metaY = PAGE.mT + 24;
  doc.setFontSize(9.5);
  const metaLine = (label, value, yy, strong) => {
    doc.setFont("helvetica", "normal");
    setInk(doc, C.soft);
    doc.text(label, CONTENT_R - 42, yy, { align: "left" });
    doc.setFont("helvetica", strong ? "bold" : "normal");
    setInk(doc, C.ink);
    doc.text(safe(value), CONTENT_R, yy, { align: "right" });
  };
  metaLine("No. Invoice", data.no || "-", metaY, true);
  metaLine("Tanggal", data.date || "-", metaY + 5.2);
  if (paid && data.paidAt) metaLine("Dibayar", data.paidAt, metaY + 10.4);

  // Garis bawah kepala
  const headBottom = Math.max(ly + 2, metaY + (paid && data.paidAt ? 14 : 9));
  setStroke(doc, C.line);
  doc.setLineWidth(0.3);
  doc.line(PAGE.mL, headBottom, CONTENT_R, headBottom);

  // ---------------- DITAGIHKAN KEPADA ----------------
  let y = headBottom + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setInk(doc, C.soft);
  doc.text("DITAGIHKAN KEPADA", PAGE.mL, y);
  y += 5.6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  setInk(doc, C.ink);
  doc.text(safe(data.debtor || "Pelanggan"), PAGE.mL, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setInk(doc, C.soft);
  if (data.business) { doc.text(safe(data.business), PAGE.mL, y); y += 4.6; }
  if (data.phone) { doc.setFontSize(9.5); doc.text(safe(data.phone), PAGE.mL, y); y += 4.6; }

  // ---------------- TABEL ITEM ----------------
  const cols = { no: PAGE.mL + 5, itemL: PAGE.mL + 14, itemW: 92, qtyR: 155, amtR: CONTENT_R };
  y += 5;
  y = drawTableHead(doc, cols, y);

  const rows = toRows(data.items);
  doc.setFontSize(9.5);
  rows.forEach((r, i) => {
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(r.label, cols.itemW);
    const rowH = Math.max(8, lines.length * 4.6 + 3.4);

    // Halaman baru bila tak muat — ulang kepala tabel
    if (y + rowH > BOTTOM) {
      doc.addPage();
      y = PAGE.mT;
      y = drawTableHead(doc, cols, y);
      doc.setFontSize(9.5);
    }

    const midY = y + rowH / 2 + 1.4;
    setInk(doc, C.soft);
    doc.text(String(i + 1), cols.no, midY, { align: "center" });
    setInk(doc, C.ink);
    doc.text(lines, cols.itemL, y + 5.2);
    setInk(doc, C.soft);
    if (r.qty) doc.text(r.qty, cols.qtyR, midY, { align: "right" });
    setInk(doc, C.ink);
    doc.text(rp(r.amount), cols.amtR, midY, { align: "right" });

    setStroke(doc, C.line);
    doc.setLineWidth(0.2);
    doc.line(PAGE.mL, y + rowH, CONTENT_R, y + rowH);
    y += rowH;
  });

  if (rows.length === 0) {
    setInk(doc, C.soft);
    doc.setFont("helvetica", "italic");
    doc.text("(tidak ada rincian barang)", cols.itemL, y + 5.4);
    y += 8;
  }

  // ---------------- TOTAL ----------------
  y += 3;
  const boxW = 78;
  const boxX = CONTENT_R - boxW;
  const boxH = 11;
  if (y + boxH > BOTTOM) { doc.addPage(); y = PAGE.mT; }
  setFill(doc, paid ? C.okBg : C.warnBg);
  doc.roundedRect(boxX, y, boxW, boxH, 1.6, 1.6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  setInk(doc, C.ink);
  doc.text("TOTAL", boxX + 4, y + boxH / 2 + 1.6);
  doc.setFontSize(13);
  setInk(doc, paid ? C.ok : C.accent);
  doc.text(rp(data.total), CONTENT_R - 4, y + boxH / 2 + 1.6, { align: "right" });
  y += boxH + 8;

  // ---------------- CATATAN / PENGINGAT ----------------
  doc.setFont("helvetica", paid ? "bold" : "normal");
  doc.setFontSize(9.5);
  setInk(doc, paid ? C.ok : C.soft);
  const note = paid
    ? "Tagihan ini telah LUNAS. Terima kasih atas pembayarannya."
    : "Mohon pembayaran dapat diselesaikan. Konfirmasikan bila sudah dibayar. Terima kasih.";
  doc.text(doc.splitTextToSize(note, CONTENT_R - PAGE.mL), PAGE.mL, y);

  // ---------------- KAKI HALAMAN (semua halaman) ----------------
  const footLines = [footer, brand, phone].map(safe).filter(Boolean);
  const pageCount = doc.internal.getNumberOfPages();
  for (let pg = 1; pg <= pageCount; pg++) {
    doc.setPage(pg);
    setStroke(doc, C.line);
    doc.setLineWidth(0.3);
    doc.line(PAGE.mL, PAGE.h - 14, CONTENT_R, PAGE.h - 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setInk(doc, C.soft);
    const footText = footLines.join("  |  ");
    if (footText) doc.text(footText, PAGE.w / 2, PAGE.h - 9.5, { align: "center" });
    if (pageCount > 1) {
      doc.text(`Halaman ${pg}/${pageCount}`, CONTENT_R, PAGE.h - 9.5, { align: "right" });
    }
  }
  return doc;
};

// Ubah catatan hutang -> data invoice ternormalisasi
const debtToInvoice = (d) => ({
  no: d.id,
  date: d.date || "",
  debtor: d.debtor || "Pelanggan",
  business: d.business || "",
  phone: d.phone || "",
  items: d.items || [],
  total: Number(d.total) || 0,
  paid: d.status === "lunas",
  paidAt: d.paidAt || "",
});

// Nama berkas aman untuk sistem berkas (buang karakter terlarang)
const safeFileName = (s) => String(s || "invoice").replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "");

// Publik: hasilkan Blob PDF invoice dari catatan hutang.
// Mengembalikan { blob, filename } — pemanggil mengurus unduh / bagikan.
const buildDebtInvoiceBlob = async (debt, store) => {
  const JsPDF = await loadJsPDF();
  if (!JsPDF) throw new Error("Gagal memuat pustaka PDF");
  const doc = new JsPDF({ unit: "mm", format: "a4", compress: true });
  renderInvoice(doc, debtToInvoice(debt), store);
  const blob = doc.output("blob");
  const filename = `Invoice-${safeFileName(debt?.id || "hutang")}.pdf`;
  return { blob, filename };
};

export {
  buildDebtInvoiceBlob,
  debtToInvoice,
  renderInvoice,
  safeFileName,
};

import { useEffect, useState } from "react";
import { AlertTriangle, Boxes, Calendar, Download, Handshake, Minus, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Batches } from "../db";
import { hasSupabase } from "../supabaseClient";
import { LOGO } from "../assets/logo";
import { Modal, Pill } from "../components/ui";
import { fmtExpiry, num, rp, toLocalYMD } from "../lib/format";
import { expiryLabel, expiryStatus, hasCarton, hasPromo, rop, stockStatus } from "../lib/inventory";
import { ProductForm } from "./ProductForm";

/* ============================ Inventory / Stok ============================ */

function Inventory({ products, movements, pById, managerMode = true, onMove, onAdd, onUpdate, onDelete, onStockChange, onFlash }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [exportingXlsx, setExportingXlsx] = useState(false); // sedang membuat file Excel stok & harga
  const [moveFor, setMoveFor] = useState(null);
  const [moveType, setMoveType] = useState("in");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [buyCost, setBuyCost] = useState(0); // harga beli / satuan untuk stok masuk (batch FIFO)
  const [buyExpiry, setBuyExpiry] = useState(""); // tanggal kedaluwarsa batch stok masuk (opsional)
  const [batches, setBatches] = useState(null); // batch aktif produk pada modal
  const [formFor, setFormFor] = useState(null); // {} = tambah, product = edit
  const [delFor, setDelFor] = useState(null);
  const [expSummary, setExpSummary] = useState({}); // productId -> {date, status} batch aktif TERDEKAT kedaluwarsa
  const [expTick, setExpTick] = useState(0);        // pemicu muat ulang batch modal + ringkasan lencana
  const [savingExp, setSavingExp] = useState(null); // id batch yang tanggalnya sedang disimpan
  const [expDraft, setExpDraft] = useState({});     // draft tanggal kedaluwarsa per batch (ketik lokal; simpan saat blur)
  // ===== Kelola batch (edit/hapus per batch) =====
  const [batchFor, setBatchFor] = useState(null);    // produk yang dibuka di modal kelola batch
  const [allBatches, setAllBatches] = useState(null); // semua batch produk (incl. sisa 0)
  const [batchTick, setBatchTick] = useState(0);      // pemicu muat ulang daftar kelola batch
  const [editBatchId, setEditBatchId] = useState(null); // id batch yang sedang diedit inline
  const [bDraft, setBDraft] = useState(null);         // nilai form edit batch
  const [savingBatch, setSavingBatch] = useState(false);
  const [delBatchId, setDelBatchId] = useState(null); // batch menunggu konfirmasi hapus
  const [batchErr, setBatchErr] = useState("");

  // Muat batch aktif (FIFO) produk yang sedang dibuka di modal
  useEffect(() => {
    if (!moveFor || !hasSupabase) { setBatches(null); return; }
    let alive = true;
    setBatches(null);
    Batches.list(moveFor.id)
      .then((b) => { if (alive) setBatches(b); })
      .catch(() => { if (alive) setBatches([]); });
    return () => { alive = false; };
  }, [moveFor, expTick]);

  // Ringkasan kedaluwarsa (lintas produk) untuk lencana di daftar stok.
  // Hanya-baca & aman gagal: bila kolom/tabel belum siap, lencana sekadar kosong.
  useEffect(() => {
    if (!hasSupabase) { setExpSummary({}); return; }
    let alive = true;
    Batches.activeWithExpiry()
      .then((rows) => {
        if (!alive) return;
        const m = {};
        rows.forEach((r) => {
          // rows sudah urut kedaluwarsa menaik → yang pertama per produk = paling dekat
          if (!m[r.productId]) m[r.productId] = { date: r.expiryDate, status: expiryStatus(r.expiryDate) };
        });
        setExpSummary(m);
      })
      .catch(() => { if (alive) setExpSummary({}); });
    return () => { alive = false; };
  }, [expTick]);

  // Simpan tanggal kedaluwarsa satu batch, lalu muat ulang tampilan (murni aditif)
  const setBatchExpiry = async (batchId, dateStr) => {
    if (!hasSupabase) return;
    setSavingExp(batchId);
    try {
      await Batches.setExpiry(batchId, dateStr || null);
      setExpTick((t) => t + 1); // muat ulang batch modal + ringkasan lencana
    } catch (e) {
      console.error("[expiry]", e);
    } finally {
      setSavingExp(null);
    }
  };

  // Simpan tanggal kedaluwarsa hanya saat input SELESAI diisi (blur / tekan Enter),
  // BUKAN tiap ketikan — supaya bisa diketik lewat keyboard tanpa terputus reload.
  const commitBatchExpiry = async (batchId, val, current) => {
    if ((val || "") === (current || "")) {                       // tak ada perubahan → jangan menulis
      setExpDraft((m) => { const n = { ...m }; delete n[batchId]; return n; });
      return;
    }
    await setBatchExpiry(batchId, val || null);                  // menulis + muat ulang (expTick)
    setExpDraft((m) => { const n = { ...m }; delete n[batchId]; return n; }); // lepas draft → tampilkan nilai server
  };

  // Muat SEMUA batch (incl. sisa 0) untuk modal kelola batch
  useEffect(() => {
    if (!batchFor || !hasSupabase) { setAllBatches(null); return; }
    let alive = true;
    setAllBatches(null);
    Batches.listAll(batchFor.id)
      .then((b) => { if (alive) setAllBatches(b); })
      .catch(() => { if (alive) setAllBatches([]); });
    return () => { alive = false; };
  }, [batchFor, batchTick]);

  const openBatch = (p) => { setBatchFor(p); setEditBatchId(null); setBDraft(null); setDelBatchId(null); setBatchErr(""); };
  const closeBatch = () => { setBatchFor(null); setEditBatchId(null); setBDraft(null); setDelBatchId(null); setBatchErr(""); };

  // Buka form edit untuk satu batch (prefill nilai saat ini)
  const startEditBatch = (b) => {
    setDelBatchId(null);
    setBatchErr("");
    const recv = toLocalYMD(b.at); // tanggal LOKAL, konsisten dengan yang tampil di kartu
    setBDraft({
      origReceived: recv,          // untuk deteksi apakah tanggal diubah
      received: recv,
      qtyIn: String(b.qtyIn),
      qtyLeft: String(b.qtyLeft),
      unitCost: String(b.unitCost),
      expiryDate: b.expiryDate || "",
      note: b.note || "",
    });
    setEditBatchId(b.id);
  };

  // Simpan koreksi batch → server rekonsiliasi stok produk
  const saveBatch = async () => {
    if (!bDraft || !batchFor) return;
    const qtyIn = Number(bDraft.qtyIn), qtyLeft = Number(bDraft.qtyLeft), cost = Number(bDraft.unitCost);
    if (![qtyIn, qtyLeft, cost].every((n) => Number.isFinite(n) && n >= 0)) { setBatchErr("Angka tidak boleh kosong atau negatif."); return; }
    if (qtyLeft > qtyIn) { setBatchErr("Sisa tidak boleh melebihi jumlah masuk."); return; }
    // Kirim tanggal masuk HANYA bila diubah (bila tidak, server pertahankan timestamp
    // asli → urutan konsumsi FIFO tetap pasti). Pakai tengah hari LOKAL agar tanggal
    // yang tersimpan sama dengan yang dipilih di zona waktu mana pun.
    let received = null;
    if (bDraft.received && bDraft.received !== bDraft.origReceived) {
      const d = new Date(bDraft.received + "T12:00:00"); // waktu lokal peramban
      received = isNaN(d) ? null : d.toISOString();
    }
    setSavingBatch(true); setBatchErr("");
    try {
      const newStock = await Batches.edit(editBatchId, {
        received, qtyIn, qtyLeft, unitCost: cost,
        expiryDate: bDraft.expiryDate || null,
        note: bDraft.note || null,
      });
      if (newStock != null && onStockChange) onStockChange(batchFor.id, newStock);
      setEditBatchId(null); setBDraft(null);
      setBatchTick((t) => t + 1);
      setExpTick((t) => t + 1); // segarkan lencana kedaluwarsa di daftar barang
      onFlash && onFlash("Batch diperbarui");
    } catch (e) {
      setBatchErr(e?.message || "Gagal menyimpan batch.");
    } finally {
      setSavingBatch(false);
    }
  };

  // Hapus satu batch (koreksi) → sisa dikembalikan dari stok produk
  const removeBatch = async (id) => {
    if (!batchFor) return;
    setSavingBatch(true); setBatchErr("");
    try {
      const newStock = await Batches.remove(id);
      if (newStock != null && onStockChange) onStockChange(batchFor.id, newStock);
      setDelBatchId(null);
      if (editBatchId === id) { setEditBatchId(null); setBDraft(null); }
      setBatchTick((t) => t + 1);
      setExpTick((t) => t + 1);
      onFlash && onFlash("Batch dihapus");
    } catch (e) {
      setBatchErr(e?.message || "Gagal menghapus batch.");
    } finally {
      setSavingBatch(false);
    }
  };

  const cats = ["all", ...Array.from(new Set(products.map((p) => p.category)))];
  const hasConsign = products.some((p) => p.isConsign);
  const list = products.filter((p) => {
    const okQ = (p.name + p.sku + p.code).toLowerCase().includes(q.toLowerCase());
    const okF = filter === "all" || (filter === "__titipan" ? p.isConsign : p.category === filter);
    return okQ && okF;
  });

  // Kasir hanya boleh mencatat stok MASUK. Apa pun pemicunya, paksa "in" bila bukan
  // manajer (pertahanan berlapis di samping tombol "Keluar" yang memang disembunyikan).
  const openMove = (p, type) => { const t = managerMode ? type : "in"; setMoveFor(p); setMoveType(t); setQty(1); setBuyCost(p.cost || 0); setBuyExpiry(""); setNote(t === "in" ? (p.isConsign ? "Terima barang titipan" : "Pembelian supplier") : "Penyesuaian"); };
  const submitMove = () => { onMove(moveFor.id, moveType, Number(qty) || 0, note, moveType === "in" ? (Number(buyCost) || 0) : undefined, moveType === "in" ? (buyExpiry || null) : undefined); setMoveFor(null); };

  // ============ Export "Daftar Stok & Harga" (kirim ke coffee shop) ============
  // HANYA-BACA: tidak mengubah data apa pun. Menampilkan HARGA JUAL + STOK + STATUS
  // dalam bahasa pelanggan (Tersedia / Menipis / Habis). Sengaja TIDAK menampilkan
  // modal/HPP agar margin internal tidak bocor ke pelanggan. Mengikuti barang yang
  // sedang TAMPIL (filter kategori + kata kunci pencarian) supaya "yang dilihat =
  // yang diexport"; ruang lingkup ditulis jelas di dokumen agar tidak salah kirim.
  const exportStokHarga = async () => {
    if (!list.length) { onFlash && onFlash("Tidak ada barang untuk diexport"); return; }
    setExportingXlsx(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      wb.creator = "Conflux Coffee Club";
      wb.created = new Date();

      // Palet warna — sama dengan export Akuntansi agar tampilan konsisten
      const C = {
        dark: "FF121A16", surface: "FF1B2521", cream: "FFECE7DA", coral: "FFE2514D",
        teal: "FF3E7D5A", amber: "FFB4791F", ink: "FF24302B",
        rowA: "FFFFFFFF", rowB: "FFFAF4EA", hairline: "FFE7E0D2", habisBg: "FFFBECEB",
      };
      const money = '"Rp"#,##0';
      const fill = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });

      // Urutkan: kategori → nama, agar terkelompok rapi dan mudah dibaca pelanggan.
      // Barang tanpa kategori didorong ke paling akhir (sentinel) — bukan ke atas.
      const catKey = (p) => (p.category && p.category.trim()) ? p.category : "\uFFFF";
      const rows = [...list].sort((a, b) =>
        catKey(a).localeCompare(catKey(b), "id") ||
        (a.name || "").localeCompare(b.name || "", "id")
      );
      const withCarton = rows.some((p) => hasCarton(p)); // kolom karton hanya bila dipakai

      // Status versi PELANGGAN (bukan istilah re-stok internal "Kritis/Re-stok")
      const custStatus = (p) => {
        const s = Number(p.stock) || 0;
        if (s <= 0) return { label: "Habis", color: C.coral, bg: C.habisBg };
        if (s <= (Number(p.safetyStock) || 0)) return { label: "Menipis", color: C.amber, bg: null };
        return { label: "Tersedia", color: C.teal, bg: null };
      };

      // Definisi kolom (karton opsional)
      const cols = [
        { h: "No", w: 5, a: "center" },
        { h: "Barang", w: 34, a: "left" },
        { h: "Kategori", w: 18, a: "left" },
        { h: "Satuan", w: 11, a: "center" },
        { h: "Stok", w: 10, a: "right" },
        { h: "Status", w: 13, a: "center" },
        { h: withCarton ? "Harga / satuan" : "Harga", w: 16, a: "right" },
      ];
      if (withCarton) {
        cols.push({ h: "Isi / karton", w: 12, a: "right" });
        cols.push({ h: "Harga / karton", w: 16, a: "right" });
      }
      const nCols = cols.length;
      const HEAD = 5; // baris header tabel (1-2 banner, 3 tanggal, 4 ruang lingkup, 5 header)

      const ws = wb.addWorksheet("Stok & Harga", {
        // Bekukan banner + header agar tetap terlihat saat menggulir daftar panjang
        views: [{ showGridLines: false, state: "frozen", ySplit: HEAD }],
      });
      ws.columns = cols.map((c) => ({ width: c.w }));

      // ---------- Banner (logo + nama toko) ----------
      let imgId = null;
      try { imgId = wb.addImage({ base64: LOGO.split(",")[1], extension: "jpeg" }); } catch (e) {}
      ws.mergeCells(1, 1, 2, nCols);
      const t = ws.getCell(1, 1);
      t.value = { richText: [
        { text: "CONFLUX ", font: { bold: true, size: 18, color: { argb: C.coral }, name: "Arial" } },
        { text: "COFFEE CLUB", font: { bold: true, size: 18, color: { argb: C.cream }, name: "Arial" } },
      ] };
      t.alignment = { vertical: "middle", horizontal: "left", indent: imgId != null ? 6 : 1 };

      const now = new Date();
      const tgl = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      const jam = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      ws.mergeCells(3, 1, 3, nCols);
      const sub = ws.getCell(3, 1);
      sub.value = `Daftar Stok & Harga  ·  Berlaku per ${tgl}, pukul ${jam}`;
      sub.font = { italic: true, size: 11, color: { argb: C.cream }, name: "Arial" };
      sub.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

      for (let rr = 1; rr <= 2; rr++) for (let cc = 1; cc <= nCols; cc++) ws.getCell(rr, cc).fill = fill(C.dark);
      for (let cc = 1; cc <= nCols; cc++) ws.getCell(3, cc).fill = fill(C.surface);
      ws.getRow(1).height = 20; ws.getRow(2).height = 20; ws.getRow(3).height = 18;
      if (imgId != null) ws.addImage(imgId, { tl: { col: 0.15, row: 0.2 }, ext: { width: 46, height: 46 } });

      // ---------- Baris ruang lingkup (agar tidak salah kirim data) ----------
      const scope = [];
      scope.push(filter === "all" ? "Semua kategori" : (filter === "__titipan" ? "Barang titipan" : `Kategori: ${filter}`));
      if (q.trim()) scope.push(`Pencarian: "${q.trim()}"`);
      scope.push(`${rows.length} barang`);
      ws.mergeCells(4, 1, 4, nCols);
      const sc = ws.getCell(4, 1);
      sc.value = scope.join("   ·   ");
      sc.fill = fill(C.teal);
      sc.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" }, name: "Arial" };
      sc.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
      ws.getRow(4).height = 20;

      // ---------- Header tabel ----------
      cols.forEach((cc, i) => {
        const c = ws.getCell(HEAD, i + 1);
        c.value = cc.h;
        c.fill = fill(C.surface);
        c.font = { bold: true, size: 11, color: { argb: C.cream }, name: "Arial" };
        c.alignment = { vertical: "middle", horizontal: cc.a };
        c.border = { bottom: { style: "thin", color: { argb: C.coral } } };
      });
      ws.getRow(HEAD).height = 22;

      // ---------- Baris data ----------
      let r = HEAD + 1;
      rows.forEach((p, idx) => {
        const st = custStatus(p);
        const baseFill = st.bg || (idx % 2 ? C.rowB : C.rowA);
        const carton = hasCarton(p);
        const cells = [
          { v: idx + 1, a: "center" },
          { v: p.name || "—", a: "left", b: true },
          { v: p.category || "—", a: "left" },
          { v: p.unit || "—", a: "center" },
          { v: Number(p.stock) || 0, a: "right", stockCell: true },
          { v: st.label, a: "center", statusCell: true },
          { v: Number(p.price) || 0, a: "right", fmt: money, b: true },
        ];
        if (withCarton) {
          cells.push({ v: carton ? Number(p.cartonSize) : "—", a: "right" });
          cells.push({ v: carton ? Number(p.priceCarton) : "—", a: "right", fmt: carton ? money : undefined });
        }
        cells.forEach((cc, i) => {
          const c = ws.getCell(r, i + 1);
          c.value = cc.v;
          c.fill = fill(baseFill);
          let color = C.ink, bold = !!cc.b;
          if (cc.statusCell) { color = st.color; bold = true; }              // Status: warna sesuai kondisi
          if (cc.stockCell && st.label !== "Tersedia") { color = st.color; bold = true; } // Stok menonjol saat menipis/habis
          c.font = { size: 11, color: { argb: color }, name: "Arial", bold };
          c.alignment = { vertical: "middle", horizontal: cc.a };
          if (cc.fmt) c.numFmt = cc.fmt;
          c.border = { bottom: { style: "hair", color: { argb: C.hairline } } };
        });
        ws.getRow(r).height = 19;
        r++;
      });

      // ---------- Footer: total + keterangan ----------
      r++;
      ws.mergeCells(r, 1, r, nCols);
      const foot = ws.getCell(r, 1);
      foot.value = `Total ${rows.length} barang  ·  Dibuat ${tgl}, pukul ${jam}  ·  Harga sewaktu-waktu dapat berubah`;
      foot.fill = fill(C.dark);
      foot.font = { bold: true, size: 10, color: { argb: C.cream }, name: "Arial" };
      foot.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
      ws.getRow(r).height = 20;
      r += 2;
      ws.mergeCells(r, 1, r, nCols);
      const legend = ws.getCell(r, 1);
      legend.value = "Keterangan:  Tersedia = stok siap   ·   Menipis = stok terbatas, segera pesan   ·   Habis = stok kosong";
      legend.font = { italic: true, size: 10, color: { argb: C.ink }, name: "Arial" };
      legend.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

      // ---------- Unduh ----------
      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const a = document.createElement("a");
      a.href = url; a.download = `Stok-Harga-Conflux-${iso}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      onFlash && onFlash(`Daftar stok & harga (${rows.length} barang) diunduh`);
    } catch (err) {
      onFlash && onFlash("Gagal membuat Excel — coba lagi");
      console.error(err);
    } finally {
      setExportingXlsx(false);
    }
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="search">
          <Search size={16} />
          <input placeholder="Cari nama, ID, atau SKU…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="chips">
          {cats.map((c) => (
            <button key={c} className={`chip ${filter === c ? "on" : ""}`} onClick={() => setFilter(c)}>
              {c === "all" ? "Semua" : c}
            </button>
          ))}
          {hasConsign && (
            <button className={`chip ${filter === "__titipan" ? "on" : ""}`} onClick={() => setFilter("__titipan")}>
              <Handshake size={13} /> Titipan
            </button>
          )}
        </div>
        {managerMode && (
          <button className="btn ghost" onClick={exportStokHarga} disabled={exportingXlsx || !list.length}
            title="Unduh daftar stok & harga (Excel) untuk dikirim ke coffee shop">
            <Download size={16} /> {exportingXlsx ? "Menyiapkan…" : "Export Stok & Harga"}
          </button>
        )}
        <button className="btn" onClick={() => setFormFor({})}><Plus size={16} /> Tambah Barang</button>
      </div>

      <section className="card pad0">
        <table className="tbl">
          <thead>
            <tr>
              <th>ID</th><th>Barang</th><th>Kategori</th><th className="r">Harga jual</th>
              <th className="r">Stok</th><th className="r">ROP</th><th>Status</th><th className="r">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td><span className="idcode">{p.code}</span></td>
                <td>
                  <div className="strong">
                    {p.name}
                    {p.isConsign && <span className="consign-tag"><Handshake size={11} /> Titipan</span>}
                  </div>
                  {p.sku && <div className="muted xs">SKU {p.sku}</div>}
                  {p.isConsign && p.supplier && <div className="muted xs">Milik {p.supplier}</div>}
                  {expSummary[p.id] && expSummary[p.id].status !== "ok" && (
                    <div className={`exp-badge ${expSummary[p.id].status}`}>
                      <Calendar size={11} />
                      {expSummary[p.id].status === "expired"
                        ? "Ada stok kedaluwarsa"
                        : `Dekat kedaluwarsa · ${fmtExpiry(expSummary[p.id].date)}`}
                    </div>
                  )}
                </td>
                <td className="muted">{p.category}</td>
                <td className="r">
                  <div className="tab">{rp(p.price)}<span className="per"> /{p.unit}</span></div>
                  {hasCarton(p) && <div className="muted xs tab">{rp(p.priceCarton)} /ktn</div>}
                  {hasPromo(p) && <div className="promo-mini">promo {p.promo.type === "percent" ? p.promo.value + "%" : "−" + rp(p.promo.value)}</div>}
                </td>
                <td className="r tab strong">{num(p.stock)} <span className="unit">{p.unit}</span></td>
                <td className="r tab muted">{num(rop(p))}</td>
                <td><Pill status={stockStatus(p)} /></td>
                <td className="r">
                  <div className="row-actions">
                    <button className="mini in" onClick={() => openMove(p, "in")}><Plus size={14} /> Masuk</button>
                    {/* Aksi berikut khusus manajer: stok keluar (penyesuaian), kelola batch,
                        ubah data barang, dan hapus. Kasir hanya mencatat barang MASUK. */}
                    {managerMode && (
                      <>
                        <button className="mini out" onClick={() => openMove(p, "out")}><Minus size={14} /> Keluar</button>
                        <span className="act-div" />
                        {hasSupabase && <button className="icon-btn xs" title="Kelola batch" onClick={() => openBatch(p)}><Boxes size={15} /></button>}
                        <button className="icon-btn xs" title="Edit barang" onClick={() => setFormFor(p)}><Pencil size={15} /></button>
                        <button className="icon-btn xs danger-h" title="Hapus barang" onClick={() => setDelFor(p)}><Trash2 size={15} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={8} className="empty">Tidak ada barang cocok.</td></tr>}
          </tbody>
        </table>
      </section>

      <Modal
        open={!!moveFor}
        onClose={() => setMoveFor(null)}
        title={`Stok ${moveType === "in" ? "Masuk" : "Keluar"}`}
        footer={
          <>
            <button className="btn ghost" onClick={() => setMoveFor(null)}>Batal</button>
            <button className="btn" onClick={submitMove}>Simpan</button>
          </>
        }
      >
        {moveFor && (
          <div className="form">
            <div className="form-prod">
              <span>{moveFor.name}</span>
              <span className="muted">Stok saat ini: {num(moveFor.stock)}</span>
            </div>
            {managerMode && (
              <div className="seg">
                <button className={moveType === "in" ? "on" : ""} onClick={() => setMoveType("in")}>Masuk</button>
                <button className={moveType === "out" ? "on" : ""} onClick={() => setMoveType("out")}>Keluar</button>
              </div>
            )}
            <label className="fld">
              <span>Jumlah</span>
              <div className="stepper">
                <button onClick={() => setQty((v) => Math.max(1, Number(v) - 1))}><Minus size={16} /></button>
                <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
                <button onClick={() => setQty((v) => Number(v) + 1)}><Plus size={16} /></button>
              </div>
            </label>
            {moveType === "in" && (
              <label className="fld">
                <span>Harga {moveFor.isConsign ? "setoran" : "beli"} / {moveFor.unit || "satuan"} (Rp)</span>
                <input type="number" value={buyCost} onChange={(e) => setBuyCost(e.target.value)} />
                <span className="hint">Dicatat sebagai batch FIFO baru. Harga modal terakhir: {rp(moveFor.cost)}</span>
              </label>
            )}
            {moveType === "in" && (
              <label className="fld">
                <span>Tanggal kedaluwarsa <span className="muted">(opsional)</span></span>
                <input type="date" className="batch-exp-input" style={{ width: "100%" }} value={buyExpiry} onChange={(e) => setBuyExpiry(e.target.value)} />
                <span className="hint">
                  {buyExpiry
                    ? `Batch ini ${expiryLabel(buyExpiry).toLowerCase()}. Bisa diubah nanti di daftar batch.`
                    : "Kosongkan bila tidak perlu. Bisa diisi/diubah kapan saja per batch di bawah."}
                </span>
              </label>
            )}
            {moveType === "in" && moveFor.isConsign && (
              <div className="pay-note">
                Barang <b>titip jual</b> milik {moveFor.supplier || "distributor"}: harga di atas = nilai setoran per {moveFor.unit || "satuan"}.
                Belum jadi pengeluaran — kewajiban setor baru tercatat otomatis saat barangnya laku (lihat menu <b>Titip Jual</b>).
              </div>
            )}
            <label className="fld">
              <span>Catatan</span>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Keterangan…" />
            </label>
            {hasSupabase && (
              <div className="batch-box">
                <div className="batch-title">Batch aktif · urutan keluar otomatis</div>
                <div className="muted xs" style={{ marginTop: -2 }}>Sistem mengeluarkan batch yang paling dekat kedaluwarsa lebih dulu (FEFO). Batch tanpa tanggal ikut urutan terlama (FIFO).</div>
                {batches == null && <div className="muted xs">Memuat batch…</div>}
                {batches != null && batches.length === 0 && <div className="muted xs">Belum ada batch aktif.</div>}
                {batches != null && batches.map((b) => {
                  const est = expiryStatus(b.expiryDate);
                  return (
                    <div key={b.id} className="batch-item">
                      <div className="batch-row">
                        <span className="muted xs">{new Date(b.at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                        <span className="tab">{num(b.qtyLeft)} {moveFor.unit}</span>
                        <span className="tab">@ {rp(b.unitCost)}</span>
                      </div>
                      <div className="batch-exp">
                        <span className="batch-exp-lbl"><Calendar size={12} /> Kedaluwarsa</span>
                        <input
                          type="date"
                          className="batch-exp-input"
                          value={expDraft[b.id] !== undefined ? expDraft[b.id] : (b.expiryDate || "")}
                          onChange={(e) => setExpDraft((m) => ({ ...m, [b.id]: e.target.value }))}
                          onBlur={(e) => commitBatchExpiry(b.id, e.target.value, b.expiryDate || "")}
                          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                        />
                        {b.expiryDate && est && est !== "ok" && (
                          <span className={`exp-badge ${est}`}><AlertTriangle size={10} /> {expiryLabel(b.expiryDate)}</span>
                        )}
                        {b.expiryDate && est === "ok" && (
                          <span className="muted xs">{expiryLabel(b.expiryDate)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ===== Kelola batch: daftar batch masuk + edit tanggal/jumlah/harga/kedaluwarsa ===== */}
      <Modal
        open={!!batchFor}
        onClose={closeBatch}
        title="Kelola Batch"
        width={540}
        footer={<button className="btn ghost" onClick={closeBatch}>Tutup</button>}
      >
        {batchFor && (
          <div className="form">
            <div className="form-prod">
              <span>{batchFor.name}</span>
              <span className="muted">Stok saat ini: {num(batchFor.stock)} {batchFor.unit}</span>
            </div>
            <div className="pay-note">
              Tiap penerimaan stok = satu <b>batch</b> dengan harga belinya sendiri. Perubahan di sini langsung
              menyesuaikan stok &amp; nilai inventory (urutan keluar mengikuti FEFO/FIFO). Bagian yang <b>sudah terjual</b> tidak
              berubah — koreksi hanya berlaku untuk sisa ke depan.
            </div>
            {batchErr && <div className="bm-err"><AlertTriangle size={13} /> {batchErr}</div>}

            {allBatches == null && <div className="muted xs">Memuat batch…</div>}
            {allBatches != null && allBatches.length === 0 && <div className="muted xs">Belum ada batch untuk barang ini.</div>}

            {allBatches != null && allBatches.map((b) => {
              const est = expiryStatus(b.expiryDate);
              const depleted = b.qtyLeft <= 0;
              const editing = editBatchId === b.id;
              const used = Math.max(0, b.qtyIn - b.qtyLeft);
              return (
                <div key={b.id} className={`bm-card${depleted && !editing ? " depleted" : ""}${editing ? " editing" : ""}`}>
                  {!editing && (
                    <>
                      <div className="bm-top">
                        <div className="bm-when">
                          <Calendar size={12} />
                          {new Date(b.at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          {depleted && <span className="bm-tag">habis</span>}
                        </div>
                        <div className="bm-acts">
                          <button className="icon-btn xs" title="Edit batch" onClick={() => startEditBatch(b)}><Pencil size={14} /></button>
                          <button className="icon-btn xs danger-h" title="Hapus batch" onClick={() => { setDelBatchId(b.id); setBatchErr(""); }}><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <div className="bm-stats">
                        <span className="tab strong">{num(b.qtyLeft)}<span className="muted"> / {num(b.qtyIn)} {batchFor.unit}</span></span>
                        <span className="tab">@ {rp(b.unitCost)}</span>
                        {used > 0 && <span className="muted xs">terpakai {num(used)}</span>}
                      </div>
                      {b.expiryDate && (
                        <div className="bm-exp">
                          {est && est !== "ok"
                            ? <span className={`exp-badge ${est}`}><AlertTriangle size={10} /> {fmtExpiry(b.expiryDate)} · {expiryLabel(b.expiryDate)}</span>
                            : <span className="muted xs"><Calendar size={11} /> Kedaluwarsa {fmtExpiry(b.expiryDate)} · {expiryLabel(b.expiryDate)}</span>}
                        </div>
                      )}
                      {b.note && <div className="muted xs bm-note">{b.note}</div>}

                      {delBatchId === b.id && (
                        <div className="bm-confirm">
                          <span>Hapus batch ini? {b.qtyLeft > 0 ? `Sisa ${num(b.qtyLeft)} ${batchFor.unit} akan dikurangi dari stok.` : "Batch sudah habis, stok tidak berubah."}</span>
                          <div className="bm-confirm-btns">
                            <button className="btn ghost xs" disabled={savingBatch} onClick={() => setDelBatchId(null)}>Batal</button>
                            <button className="btn danger xs" disabled={savingBatch} onClick={() => removeBatch(b.id)}>{savingBatch ? "Menghapus…" : "Hapus"}</button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {editing && bDraft && (
                    <div className="bm-edit">
                      <div className="bm-grid">
                        <label className="fld">
                          <span>Tanggal masuk</span>
                          <input type="date" className="batch-exp-input" value={bDraft.received} onChange={(e) => setBDraft((d) => ({ ...d, received: e.target.value }))} />
                        </label>
                        <label className="fld">
                          <span>Kedaluwarsa <span className="muted">(opsional)</span></span>
                          <input type="date" className="batch-exp-input" value={bDraft.expiryDate} onChange={(e) => setBDraft((d) => ({ ...d, expiryDate: e.target.value }))} />
                        </label>
                        <label className="fld">
                          <span>Jumlah masuk ({batchFor.unit})</span>
                          <input type="number" min="0" step="any" value={bDraft.qtyIn} onChange={(e) => setBDraft((d) => ({ ...d, qtyIn: e.target.value }))} />
                        </label>
                        <label className="fld">
                          <span>Sisa sekarang ({batchFor.unit})</span>
                          <input type="number" min="0" step="any" value={bDraft.qtyLeft} onChange={(e) => setBDraft((d) => ({ ...d, qtyLeft: e.target.value }))} />
                        </label>
                        <label className="fld bm-wide">
                          <span>Harga modal / {batchFor.unit || "satuan"} (Rp)</span>
                          <input type="number" min="0" step="any" value={bDraft.unitCost} onChange={(e) => setBDraft((d) => ({ ...d, unitCost: e.target.value }))} />
                        </label>
                        <label className="fld bm-wide">
                          <span>Catatan</span>
                          <input value={bDraft.note} onChange={(e) => setBDraft((d) => ({ ...d, note: e.target.value }))} placeholder="Keterangan batch…" />
                        </label>
                      </div>
                      <div className="bm-hint muted xs">
                        Ubah <b>Sisa sekarang</b> untuk mengoreksi jumlah fisik batch — selisihnya otomatis masuk ke stok barang &amp; tercatat di riwayat.
                        {bDraft.expiryDate ? "" : " Tanggal kedaluwarsa kosong = batch tanpa peringatan."}
                      </div>
                      <div className="bm-edit-btns">
                        <button className="btn ghost xs" disabled={savingBatch} onClick={() => { setEditBatchId(null); setBDraft(null); setBatchErr(""); }}>Batal</button>
                        <button className="btn xs" disabled={savingBatch} onClick={saveBatch}>{savingBatch ? "Menyimpan…" : "Simpan"}</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {formFor && (
        <ProductForm
          product={formFor.id ? formFor : null}
          products={products}
          categories={Array.from(new Set(products.map((p) => p.category)))}
          onClose={() => setFormFor(null)}
          onSave={(data) => {
            if (formFor.id) onUpdate(formFor.id, data);
            else onAdd(data);
            setFormFor(null);
          }}
        />
      )}

      <Modal
        open={!!delFor}
        onClose={() => setDelFor(null)}
        title="Hapus barang?"
        footer={
          <>
            <button className="btn ghost" onClick={() => setDelFor(null)}>Batal</button>
            <button className="btn danger" onClick={() => { onDelete(delFor.id); setDelFor(null); }}><Trash2 size={15} /> Hapus</button>
          </>
        }
      >
        {delFor && (
          <p className="confirm-text">
            Barang <b>{delFor.code} — {delFor.name}</b> akan dihapus permanen dari daftar.
            Tindakan ini tidak bisa dibatalkan.
          </p>
        )}
      </Modal>
    </div>
  );
}

export {
  Inventory
};

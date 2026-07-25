

// Buka chat WhatsApp dengan pesan siap-kirim (nomor Indonesia otomatis dinormalkan)
const waLink = (phone, text) => {
  let p = String(phone || "").replace(/\D/g, "");
  if (p.startsWith("0")) p = "62" + p.slice(1);
  else if (p.startsWith("8")) p = "62" + p;
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
};

// ===== PELANGGAN =====
// Normalisasi nomor telepon PERSIS seperti fungsi norm_phone() di database,
// supaya pencocokan "pelanggan yang sama" di layar = pencocokan di server.
// Kurang dari 8 digit dianggap bukan nomor (kembalikan "").
const normPhone = (v) => {
  const d = String(v || "").replace(/\D/g, "");
  if (d.length < 8) return "";
  if (d.startsWith("0")) return "62" + d.slice(1);
  if (d.startsWith("8")) return "62" + d;
  if (d.startsWith("620")) return "62" + d.slice(3);
  return d;
};
// Kunci identitas pelanggan — URUTAN PERSIS SAMA dengan upsert_customer() di
// database, supaya pengelompokan di layar = pengelompokan di server:
//   1. Ada NAMA USAHA  -> itu identitasnya (siapa pun orang yang datang)
//   2. Tanpa usaha     -> nomor telepon
//   3. Tanpa keduanya  -> nama orang
const custKey = (c) => {
  const b = String(c?.business || "").trim().toLowerCase();
  if (b) return `b:${b}`;
  const p = normPhone(c?.phone);
  if (p) return `p:${p}`;
  return `n:${String(c?.name || "").trim().toLowerCase()}`;
};
// Untuk pelanggan usaha, NAMA USAHA yang ditonjolkan; nama orang jadi kontak.
const custTitle = (c) => String(c?.business || "").trim() || String(c?.name || "").trim() || "—";
const custSub = (c) => (String(c?.business || "").trim() ? String(c?.name || "").trim() : "");
const custLabel = (c) => { const t = custTitle(c); const u = custSub(c); return u ? `${t} — ${u}` : t; };
const isBiz = (c) => c?.kind === "bisnis" || !!String(c?.business || "").trim();

export {
  custKey,
  custLabel,
  custSub,
  custTitle,
  isBiz,
  normPhone,
  waLink
};

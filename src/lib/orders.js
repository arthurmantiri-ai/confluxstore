import { Globe, Truck } from "lucide-react";

/* ============================ Order Online ============================ */

const ORDER_FLOW = ["baru", "diproses", "dikirim", "selesai"];
const ORDER_LABEL = { baru: "Baru", diproses: "Diproses", dikirim: "Dikirim", selesai: "Selesai" };
const CHANNEL_ICON = { WhatsApp: Globe, Instagram: Globe, Marketplace: Truck };

// Cara bayar untuk order online. Ini adalah metode SUNGGUHAN (bukan "order") yang
// dipakai saat order diterima → penjualan tercatat rapi di akuntansi (tunai/non-tunai)
// dan lolos sinkron. "Hutang" membuat bon di menu Hutang, persis seperti kasir.
const ORDER_PAY_OPTIONS = [
  { key: "transfer", label: "Transfer" },
  { key: "qris", label: "QRIS" },
  { key: "cash", label: "Tunai (COD)" },
  { key: "hutang", label: "Hutang (bayar nanti)" },
];
const PAY_SHORT = { transfer: "Transfer", qris: "QRIS", cash: "COD", hutang: "Hutang" };

/* ---------- Urai pesan WhatsApp menjadi baris order ---------- */
// WA Business gratis TIDAK punya API untuk membaca pesan masuk otomatis, jadi alur
// yang realistis: operator MENEMPEL isi chat pesanan pelanggan, lalu fungsi ini
// mengubahnya menjadi daftar barang (dicocokkan ke katalog) + jumlah. Hasilnya SELALU
// ditinjau operator sebelum disimpan — jadi tebakan yang meleset gampang dibetulkan.
const COUNT_UNIT = "pcs|pc|botol|dus|box|karton|ktn|pack|pak|bungkus|sachet|renceng|buah|unit|biji|lusin|kaleng|kotak|sak|saset";
const WA_STOPWORDS = /\b(halo|hai|hi|selamat|pagi|siang|sore|malam|mau|order|pesan|pesen|pesanan|tolong|minta|kak|kakak|bang|mas|mbak|pak|bu|ibu|bapak|ya|yaa|yah|dong|nya|beli|terima|kasih|makasih|thx|kirim|dikirim|antar|diantar|alamat|nama|no|nomor|hp|wa|whatsapp|ready|stok|stock|ada|berapa|harga|total|rp|idr)\b/gi;
const normStr = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const extractPhone = (t) => { const m = String(t || "").match(/(?:\+?62|0)8[0-9][0-9\-\s]{6,13}/); return m ? m[0].replace(/[\s\-]/g, "") : ""; };
const hasNameToken = (frag) => normStr(frag).split(" ").some((t) => /[a-z]/i.test(t) && t.length >= 2);
// Buang bullet, penanda jumlah, & embel harga — SISAKAN token ukuran (760ml, 1kg, 70%)
// karena justru membantu mencocokkan ke produk yang tepat.
const matchFrag = (line) => line
  .replace(/^[\s\-*•·>().]+/, " ")
  .replace(/(\d+)\s*[x×]/gi, " ").replace(/[x×]\s*(\d+)/gi, " ")
  .replace(new RegExp("\\b\\d+\\s*(?:" + COUNT_UNIT + ")\\b", "gi"), " ")
  .replace(/\b\d+\s+kg\b/gi, " ")
  .replace(/\b(harga|total|rp|idr)\b[\s:]*[\d.,]+/gi, " ")
  .trim();
// Ambil JUMLAH tanpa tertipu angka pada nama produk (760ml, 800g, 70%, 1kg tanpa spasi)
const extractQty = (line) => {
  const s = " " + String(line).toLowerCase() + " ";
  let m = s.match(/(\d+)\s*[x×]/) || s.match(/[x×]\s*(\d+)/);
  if (m) return Math.max(1, parseInt(m[1], 10) || 1);
  m = s.match(new RegExp("(\\d+)\\s*(?:" + COUNT_UNIT + ")\\b"));
  if (m) return Math.max(1, parseInt(m[1], 10) || 1);
  m = s.match(/(\d+)\s+kg\b/); // "2 kg" (biji) = jumlah; "1kg" (nempel) = ukuran → diabaikan
  if (m) return Math.max(1, parseInt(m[1], 10) || 1);
  m = String(line).match(/^\s*[-*•·>().]*\s*(\d+)\s+(?=[a-z])/i); // "2 Kopi Toraja"
  if (m) return Math.max(1, parseInt(m[1], 10) || 1);
  return 1;
};
// Produk paling cocok untuk satu penggalan (skor = porsi kata penggalan yang muncul di nama produk)
const bestProductMatch = (frag, products) => {
  const q = normStr(frag).split(" ").filter((t) => t.length >= 2);
  if (!q.length) return null;
  let best = null, bestScore = 0;
  for (const p of products) {
    const hay = normStr(`${p.name} ${p.sku || ""} ${p.category || ""}`);
    let hit = 0;
    for (const t of q) if (hay.includes(t)) hit++;
    const score = hit / q.length;
    if (score > bestScore) { bestScore = score; best = p; }
  }
  return bestScore >= 0.5 ? best : null;
};
function parseWaOrder(text, products) {
  const src = String(text || "");
  const phone = extractPhone(src);
  let customer = "";
  const nm = src.match(/(?:nama|a\/?n|atas nama)\s*:?\s*([a-z][a-z0-9 .'&-]{1,40})/i);
  if (nm) customer = nm[1].replace(/\s+/g, " ").trim();
  const lines = [];
  const unmatched = [];
  for (const raw of src.split(/[\n\r]+/).map((l) => l.trim()).filter(Boolean)) {
    const noPhone = raw.replace(/(?:\+?62|0)8[0-9\-\s]{7,14}/g, " ");
    if (!/[a-z]{3,}/i.test(noPhone)) continue; // baris nomor/angka saja
    const frag = matchFrag(raw).replace(WA_STOPWORDS, " ").replace(/\s+/g, " ").trim();
    if (!hasNameToken(frag)) continue; // salam / basa-basi tanpa nama barang
    const p = bestProductMatch(frag, products);
    if (!p) { unmatched.push(raw.trim()); continue; }
    const qty = extractQty(raw);
    const ex = lines.find((x) => x.pid === p.id);
    if (ex) ex.qty += qty; else lines.push({ pid: p.id, qty });
  }
  return { phone, customer, lines, unmatched };
}

export {
  CHANNEL_ICON,
  COUNT_UNIT,
  ORDER_FLOW,
  ORDER_LABEL,
  ORDER_PAY_OPTIONS,
  PAY_SHORT,
  WA_STOPWORDS,
  bestProductMatch,
  extractPhone,
  extractQty,
  hasNameToken,
  matchFrag,
  normStr,
  parseWaOrder
};

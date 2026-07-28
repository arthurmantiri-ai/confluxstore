

const rp = (n) => "Rp" + new Intl.NumberFormat("id-ID").format(Math.round(n || 0));
const num = (n) => new Intl.NumberFormat("id-ID").format(Math.round(n || 0));
const uid = () => Math.random().toString(36).slice(2, 9);
// Profil cetak efektif: perangkat menang bila diaktifkan, selain itu ikut server.
const printProfile = (store, dev) =>
  dev && dev.on ? { ...store, paper: dev.paper, method: dev.method } : store;

// Tampilkan waktu ramah: ISO/epoch -> waktu lokal; label seperti "Baru saja" dibiarkan
const fmtAt = (at) => {
  if (at == null || at === "") return "—";
  if (typeof at === "string" && !/\d{4}-\d{2}-\d{2}T/.test(at)) return at;
  const d = new Date(at);
  if (isNaN(d.getTime())) return String(at);
  return d.toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

// Nomor nota unik berbasis tanggal+waktu (tidak bentrok antar perangkat/refresh)
const stampNo = (prefix, at) => {
  const d = at ? new Date(at) : new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${prefix}-${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};

// Periode bulan (YYYY-MM) -> label ramah; bulan sekarang & bulan sebelumnya
const ID_MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const periodLabel = (ym) => { if (!ym) return "-"; if (ym === "all") return "Semua waktu"; const [y, m] = String(ym).split("-").map(Number); return `${ID_MONTHS[(m || 1) - 1]} ${y}`; };
const thisPeriod = () => new Date().toISOString().slice(0, 7);
const prevPeriod = (ym) => { const [y, m] = String(ym).split("-").map(Number); const d = new Date(y, (m || 1) - 1, 1); d.setMonth(d.getMonth() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
// ===== Kedaluwarsa (expire) batch — pelengkap FIFO, murni tampilan & peringatan =====
// Ambang "dekat kedaluwarsa" (hari) — diatur di Pengaturan → Stok & Re-stok.
const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d)) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
};
const fmtExpiry = (dateStr) =>
  dateStr ? new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "";
// Peta nama bulan -> indeks (0..11), TOLERAN terhadap perbedaan ICU antar peramban.
// Dibangun dua lapis: (1) dari Intl peramban ini juga — jadi selalu cocok dengan
// singkatan yang DITULIS peramban ini saat menyimpan tanggal; (2) daftar statis
// mencakup varian umum (Agu/Ags/Agt) + nama panjang, agar tanggal yang ditulis di
// peramban lain tetap terbaca.
const MONTH_INDEX = (() => {
  const map = {};
  const put = (name, idx) => { if (name) map[String(name).toLowerCase().replace(/\./g, "").trim()] = idx; };
  for (let m = 0; m < 12; m++) {
    const d = new Date(2000, m, 1);
    try { put(d.toLocaleDateString("id-ID", { month: "short" }), m); } catch (_) {}
    try { put(d.toLocaleDateString("id-ID", { month: "long" }), m); } catch (_) {}
  }
  [["jan", 0], ["januari", 0], ["feb", 1], ["februari", 1], ["mar", 2], ["maret", 2],
   ["apr", 3], ["april", 3], ["mei", 4], ["may", 4], ["jun", 5], ["juni", 5],
   ["jul", 6], ["juli", 6], ["agu", 7], ["ags", 7], ["agt", 7], ["agustus", 7], ["aug", 7],
   ["sep", 8], ["sept", 8], ["september", 8], ["okt", 9], ["oct", 9], ["oktober", 9],
   ["nov", 10], ["november", 10], ["des", 11], ["dec", 11], ["desember", 11],
  ].forEach(([n, i]) => { if (!(n in map)) map[n] = i; });
  return map;
})();

// Tanggal tampilan Indonesia ("28 Jul 2026" / "5 Agu 2026") -> "YYYY-MM-DD" (bisa
// dibandingkan langsung, mis. dengan nilai <input type="date">). "" bila tak terbaca.
// String yang sudah ISO (mengandung "YYYY-MM-DD") dikembalikan apa adanya.
const parseIdDateYMD = (str) => {
  if (str == null) return "";
  const s = String(str).trim();
  if (!s) return "";
  const iso = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const parts = s.replace(/,/g, " ").split(/\s+/).filter(Boolean);
  if (parts.length < 3) return "";
  const day = parseInt(parts[0], 10);
  const mo = MONTH_INDEX[parts[1].toLowerCase().replace(/\./g, "")];
  const year = parseInt(parts[parts.length - 1], 10);
  if (!Number.isFinite(day) || mo == null || !Number.isFinite(year)) return "";
  if (day < 1 || day > 31 || year < 1900) return "";
  return `${year}-${String(mo + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

// ISO/epoch -> "YYYY-MM-DD" pada zona waktu LOKAL (agar cocok dengan tanggal yang
// ditampilkan via toLocaleDateString; input <type=date> selalu memakai kalender lokal).
const toLocalYMD = (v) => {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d)) return "";
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export {
  ID_MONTHS,
  daysUntil,
  fmtAt,
  fmtExpiry,
  num,
  parseIdDateYMD,
  periodLabel,
  prevPeriod,
  printProfile,
  rp,
  stampNo,
  thisPeriod,
  toLocalYMD,
  uid
};

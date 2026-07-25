

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
  periodLabel,
  prevPeriod,
  printProfile,
  rp,
  stampNo,
  thisPeriod,
  toLocalYMD,
  uid
};

import { stampNo } from "./format";

/* =====================================================================
   PENGATURAN SISTEM — satu-satunya tempat angka & daftar bawaan

   Dulu nilai seperti "ambang kedaluwarsa 30 hari", "siklus order 7 hari",
   atau daftar kategori biaya ditulis langsung di dalam kode, sehingga tiap
   perubahan kecil harus lewat upload ulang. Sekarang semuanya jadi NILAI
   BAWAAN saja: nilai yang benar-benar dipakai dibaca dari tabel `settings`
   (satu baris, kolom jsonb) dan bisa diubah lewat menu Pengaturan.

   Alur data:
     tabel settings  ->  state `store` di App  ->  cermin CFG (di bawah)

   CFG dibutuhkan karena banyak fungsi util tingkat modul (expiryStatus,
   targetLevel, invoiceNo, ...) dipanggil dari puluhan tempat yang TIDAK
   menerima prop. Mengoper pengaturan ke seluruh pohon komponen berisiko
   ada yang terlewat; cermin modul memastikan semuanya membaca nilai yang
   sama persis.

   ATURAN KETAT:
   1. Semua pembacaan lewat helper cfgX() — tidak pernah menyentuh CFG
      langsung — supaya baris settings lama/tidak lengkap tetap aman.
   2. normStore() SELALU dipanggil sebelum nilai dipakai/disimpan, jadi
      angka di luar akal (0, minus, teks) dijepit ke rentang yang sah.
      Tidak ada jalan bagi salah ketik di layar Pengaturan untuk membuat
      NaN merembes ke perhitungan stok atau uang.
   ===================================================================== */
const DEFAULT_STORE = {
  ver: 2,
  // — Identitas toko: kepala nota, pesan WhatsApp, judul export —
  name: "Conflux Coffee Club",
  addr1: "Tomohon · Manado, Sulawesi Utara",
  addr2: "Brewing Connection, One Cup at a Time",
  phone: "@conflux.coffee",
  footer: "Terima kasih sudah berbelanja!",
  pin: "1234",        // PIN mode manajer (hanya dipakai saat tanpa server)
  paper: 58,          // 58 atau 80 mm
  method: "browser",  // "browser" | "bluetooth" | "serial"
  // — Nota —
  nota: {
    invPrefix: "INV",              // awalan nomor nota penjualan
    brand: "CONFLUX COFFEE CLUB",  // baris merek di kaki nota
    logo: true,                    // tampilkan logo di kepala nota
    showCashier: true,             // tampilkan baris "Kasir"
    note: "",                      // catatan kaki tambahan (syarat retur dll.)
    autoPreview: true,             // buka pratinjau nota otomatis usai transaksi
  },
  // — Stok & re-stok —
  stok: {
    expiryWarnDays: 30,   // ambang "dekat kedaluwarsa" (hari)
    reviewDays: 7,        // siklus order untuk saran jumlah re-stok
    lowStockAlert: true,  // lonceng "perlu re-stok" di bilah atas
    newDailyUsage: 1,     // bawaan barang baru
    newLeadTime: 1,
    newSafetyStock: 0,
    newUnit: "pcs",
    units: ["pcs", "botol", "kg", "pack", "sachet", "box"],
  },
  // — Kasir —
  kasir: {
    methods: ["cash", "transfer", "qris", "card", "hutang", "split"],
    defaultMethod: "cash",
    quickCash: [50000, 100000],  // pembulatan tombol uang cepat
    requirePaid: false,          // tunai: wajib isi uang diterima
    requireCustomer: false,      // wajib pilih/isi pelanggan tiap transaksi
  },
  // — Pelanggan (CRM) —
  crm: {
    pasifDays: 45,   // batas "pelanggan pasif"
    newDays: 30,     // rentang saringan "pelanggan baru"
    waStokMax: 25,   // maksimal baris pada pesan WA "list stok & harga"
    wa: { sapa: "", promo: "", stok: "", hutang: "" }, // "" = pakai teks bawaan
  },
  // — Akuntansi —
  akun: {
    expenseCats: ["Sewa", "Gaji", "Utilitas", "Marketing", "Operasional", "Lain-lain"],
    accounts: [],  // daftar rekening tujuan setoran kas
  },
  // — Shift kasir —
  shift: {
    cashTolerance: 0,  // selisih kas (Rp) yang masih dianggap wajar
  },
  // — Sistem —
  sistem: {
    refreshSec: 120,  // tarik ulang data berkala (detik)
    salesDays: 90,    // rentang riwayat penjualan yang dimuat saat buka aplikasi
  },
};

// Bagian bersarang satu tingkat. Dipisah agar penggabungan tidak "menelan"
// kunci baru saat baris settings di server masih versi lama.
const CFG_SECTIONS = ["nota", "stok", "kasir", "crm", "akun", "shift", "sistem"];

// Jepit angka ke rentang sah. Teks/kosong/NaN -> nilai bawaan (bukan 0),
// karena 0 pada "siklus order" atau "ambang kedaluwarsa" akan diam-diam
// merusak saran re-stok dan peringatan kedaluwarsa.
const clampInt = (v, lo, hi, fb) => {
  // Kosong / null / undefined = "tidak diisi" -> pakai bawaan. Ini BUKAN sama
  // dengan angka 0: Number(null) dan Number("") keduanya 0, sehingga tanpa
  // penjagaan ini kolom yang dikosongkan akan berubah jadi batas bawah
  // (mis. "siklus order" jadi 1 hari) tanpa disadari.
  if (v === null || v === undefined || (typeof v === "string" && v.trim() === "")) return fb;
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fb;
  return Math.min(hi, Math.max(lo, n));
};
// Daftar teks: buang yang kosong/duplikat, rapikan spasi, batasi panjang.
const cleanList = (v, fb, max = 40) => {
  if (!Array.isArray(v)) return [...fb];
  const out = [];
  v.forEach((x) => {
    const s = String(x == null ? "" : x).trim().slice(0, 60);
    if (s && !out.includes(s)) out.push(s);
  });
  return out.slice(0, max);
};
const cleanText = (v, fb, max = 200) => {
  const s = v == null ? "" : String(v);
  return s.trim() ? s.slice(0, max) : fb;
};

// Gabungkan pengaturan server dengan bawaan, lalu sahkan setiap nilainya.
// Fungsi ini adalah SATU-SATUNYA pintu masuk: dipakai saat memuat dari server,
// saat menyimpan, dan saat menyetel cermin CFG.
const normStore = (raw) => {
  const src = raw && typeof raw === "object" ? raw : {};
  const o = { ...DEFAULT_STORE, ...src };
  CFG_SECTIONS.forEach((k) => {
    const s = src[k];
    o[k] = { ...DEFAULT_STORE[k], ...(s && typeof s === "object" && !Array.isArray(s) ? s : {}) };
  });

  // — identitas —
  o.name = cleanText(o.name, DEFAULT_STORE.name, 60);
  o.addr1 = String(o.addr1 == null ? "" : o.addr1).slice(0, 90);
  o.addr2 = String(o.addr2 == null ? "" : o.addr2).slice(0, 90);
  o.phone = String(o.phone == null ? "" : o.phone).slice(0, 60);
  o.footer = String(o.footer == null ? "" : o.footer).slice(0, 90);
  o.pin = String(o.pin == null ? "" : o.pin).replace(/\D/g, "").slice(0, 8) || DEFAULT_STORE.pin;
  o.paper = o.paper === 80 ? 80 : 58;
  o.method = ["browser", "bluetooth", "serial"].includes(o.method) ? o.method : "browser";

  // — nota —
  // Awalan nota: huruf/angka saja. "RTR" DILARANG karena dipakai sistem untuk
  // menandai baris retur (penjualan negatif) — memakainya akan membuat retur
  // dan penjualan tertukar di Riwayat maupun laporan.
  let pre = String(o.nota.invPrefix || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (!pre || pre === "RTR") pre = "INV";
  o.nota.invPrefix = pre;
  o.nota.brand = String(o.nota.brand == null ? "" : o.nota.brand).slice(0, 60);
  o.nota.note = String(o.nota.note == null ? "" : o.nota.note).slice(0, 240);
  o.nota.logo = o.nota.logo !== false;
  o.nota.showCashier = o.nota.showCashier !== false;
  o.nota.autoPreview = o.nota.autoPreview !== false;

  // — stok —
  o.stok.expiryWarnDays = clampInt(o.stok.expiryWarnDays, 1, 365, 30);
  o.stok.reviewDays = clampInt(o.stok.reviewDays, 1, 180, 7);
  o.stok.newDailyUsage = clampInt(o.stok.newDailyUsage, 0, 100000, 1);
  o.stok.newLeadTime = clampInt(o.stok.newLeadTime, 0, 365, 1);
  o.stok.newSafetyStock = clampInt(o.stok.newSafetyStock, 0, 100000, 0);
  o.stok.units = cleanList(o.stok.units, DEFAULT_STORE.stok.units, 24);
  if (!o.stok.units.length) o.stok.units = [...DEFAULT_STORE.stok.units];
  // Satuan bawaan WAJIB ada di daftar satuan, kalau tidak pilihan di layar
  // Tambah Barang akan tampil kosong dan barang baru lahir tanpa satuan.
  const nu = cleanText(o.stok.newUnit, o.stok.units[0], 20);
  o.stok.newUnit = o.stok.units.includes(nu) ? nu : o.stok.units[0];
  o.stok.lowStockAlert = o.stok.lowStockAlert !== false;

  // — kasir —
  const validPay = ["cash", "transfer", "qris", "card", "hutang", "split"];
  let ms = Array.isArray(o.kasir.methods) ? o.kasir.methods.filter((m) => validPay.includes(m)) : [];
  ms = validPay.filter((m) => ms.includes(m));           // urutan tetap konsisten
  if (!ms.length) ms = [...DEFAULT_STORE.kasir.methods]; // jangan sampai kasir tak bisa menagih
  if (!ms.includes("cash")) ms.unshift("cash");          // tunai selalu tersedia
  // "Campur" hanya masuk akal bila ada >=2 metode non-hutang yang aktif
  if (ms.includes("split") && ms.filter((m) => ["cash", "transfer", "qris", "card"].includes(m)).length < 2)
    ms = ms.filter((m) => m !== "split");
  o.kasir.methods = ms;
  o.kasir.defaultMethod = ms.includes(o.kasir.defaultMethod) && o.kasir.defaultMethod !== "split"
    ? o.kasir.defaultMethod : (ms.includes("cash") ? "cash" : ms[0]);
  const qc = (Array.isArray(o.kasir.quickCash) ? o.kasir.quickCash : [])
    .map((v) => {
      const n = Math.round(Number(v));
      // Nol, minus, dan teks BUKAN pecahan uang -> dibuang. Hanya angka yang
      // sudah masuk akal yang dijepit ke rentang sah.
      if (!Number.isFinite(n) || n <= 0) return 0;
      return Math.min(10000000, Math.max(1000, n));
    })
    .filter((v) => v > 0);
  o.kasir.quickCash = (qc.length ? Array.from(new Set(qc)) : [...DEFAULT_STORE.kasir.quickCash]).sort((a, b) => a - b).slice(0, 6);
  o.kasir.requirePaid = o.kasir.requirePaid === true;
  o.kasir.requireCustomer = o.kasir.requireCustomer === true;

  // — pelanggan —
  o.crm.pasifDays = clampInt(o.crm.pasifDays, 7, 730, 45);
  o.crm.newDays = clampInt(o.crm.newDays, 1, 365, 30);
  o.crm.waStokMax = clampInt(o.crm.waStokMax, 5, 100, 25);
  const wsrc = o.crm.wa && typeof o.crm.wa === "object" ? o.crm.wa : {};
  o.crm.wa = {
    sapa: String(wsrc.sapa || "").slice(0, 1200),
    promo: String(wsrc.promo || "").slice(0, 1200),
    stok: String(wsrc.stok || "").slice(0, 1200),
    hutang: String(wsrc.hutang || "").slice(0, 1200),
  };

  // — akuntansi —
  o.akun.expenseCats = cleanList(o.akun.expenseCats, DEFAULT_STORE.akun.expenseCats, 24);
  if (!o.akun.expenseCats.length) o.akun.expenseCats = [...DEFAULT_STORE.akun.expenseCats];
  o.akun.accounts = cleanList(o.akun.accounts, [], 20);

  // — shift & sistem —
  o.shift.cashTolerance = clampInt(o.shift.cashTolerance, 0, 10000000, 0);
  o.sistem.refreshSec = clampInt(o.sistem.refreshSec, 30, 3600, 120);
  o.sistem.salesDays = clampInt(o.sistem.salesDays, 7, 730, 90);

  o.ver = 2;
  return o;
};

// Cermin modul. Selalu hasil normStore(), jadi setiap bagian dijamin lengkap
// dan tidak pernah undefined — fungsi util boleh membacanya tanpa penjagaan.
let CFG = normStore(null);
const setCfg = (s) => { CFG = s && s.ver === 2 ? s : normStore(s); };
const cfgNota = () => CFG.nota;
const cfgStok = () => CFG.stok;
const cfgKasir = () => CFG.kasir;
const cfgCrm = () => CFG.crm;
const cfgAkun = () => CFG.akun;
const cfgSistem = () => CFG.sistem;
const invoiceNo = () => stampNo(cfgNota().invPrefix);
// Nomor nota retur. Awalan "RTR" SENGAJA TIDAK bisa diubah dari Pengaturan:
// baris retur disimpan sebagai penjualan negatif dan dipisahkan dari penjualan
// biasa lewat awalan ini (lihat Riwayat Penjualan & Retur & Tukar).
const RETURN_PREFIX = "RTR";
const returnNoGen = () => stampNo(RETURN_PREFIX);

export {
  CFG,
  CFG_SECTIONS,
  DEFAULT_STORE,
  RETURN_PREFIX,
  cfgAkun,
  cfgCrm,
  cfgKasir,
  cfgNota,
  cfgSistem,
  cfgStok,
  clampInt,
  cleanList,
  cleanText,
  invoiceNo,
  normStore,
  returnNoGen,
  setCfg
};

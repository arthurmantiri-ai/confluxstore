

// ===== ANTREAN OFFLINE (OUTBOX) =====
// Saat internet putus di tengah jam sibuk, transaksi kasir TIDAK boleh hilang.
// Setiap checkout disimpan permanen di perangkat (localStorage) sebagai satu
// paket "menunggu kirim". Paket dikirim ke server lewat SATU RPC atomik yang
// idempoten; begitu server menjawab berhasil ATAU "sudah pernah" (duplicate),
// paket dihapus dari antrean. Karena antrean ada di localStorage, ia SELAMAT
// dari reload maupun aplikasi tertutup, lalu terkirim otomatis begitu online.
const OUTBOX_KEY = "conflux.outbox.v1";
const loadOutbox = () => {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    // Buang isi yang rusak; hanya paket dengan clientId + minimal 1 baris yang sah.
    return Array.isArray(arr)
      ? arr.filter((x) => x && typeof x.clientId === "string" && Array.isArray(x.rows) && x.rows.length)
      : [];
  } catch (e) { return []; }
};
const saveOutbox = (list) => {
  try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(list || [])); } catch (e) {}
};
// Kumpulan txn_id yang masih menunggu kirim (untuk menandai baris di layar Riwayat).
const outboxTxnIds = (list) => {
  const s = new Set();
  (list || []).forEach((it) => (it.rows || []).forEach((r) => { if (r?.txn_id) s.add(r.txn_id); }));
  return s;
};
// Total rupiah satu paket antrean — dipakai di panel diagnostik agar pemilik toko
// bisa mencocokkan uang di laci dengan transaksi yang belum terkirim.
const outboxItemTotal = (it) => (it?.rows || []).reduce((a, r) => a + (Number(r?.revenue) || 0), 0);
// ID unik SEUMUR HIDUP per checkout — kunci anti-dobel di sisi server.
const clientTxnId = () => {
  try { if (crypto?.randomUUID) return crypto.randomUUID(); } catch (e) {}
  return "ct-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
};

// ===== DEAD-LETTER =====
// Paket yang DITOLAK PERMANEN server (mis. produk sudah dihapus perangkat lain
// selagi perangkat ini offline) dipindah ke sini. Tujuannya: satu paket bermasalah
// TIDAK memblokir seluruh antrean, tetapi juga TIDAK hilang diam-diam — datanya
// tersimpan permanen dan ditampilkan agar admin bisa memulihkan transaksinya.
const DEAD_KEY = "conflux.outbox.dead.v1";
const loadDead = () => {
  try { const a = JSON.parse(localStorage.getItem(DEAD_KEY) || "[]"); return Array.isArray(a) ? a : []; }
  catch (e) { return []; }
};
const saveDead = (list) => { try { localStorage.setItem(DEAD_KEY, JSON.stringify(list || [])); } catch (e) {} };
// Error dari SERVER yang PERMANEN (retry tidak akan menolong): raise eksplisit dari
// fungsi kita, atau data yang tidak valid (uuid rusak, pelanggaran integritas).
// SENGAJA konservatif: error yang bisa pulih (deadlock 40P01, serialisasi 40001,
// gangguan koneksi 08xxx, dsb.) TIDAK dianggap permanen — biar dicoba lagi, bukan
// dikarantina. Gagal jaringan murni juga transien (tak punya kode SQLSTATE).
const PERMANENT_SQLSTATES = new Set([
  "22P02", // invalid_text_representation (mis. uuid produk rusak)
  "22003", // numeric_value_out_of_range
  "23502", // not_null_violation
  "23503", // foreign_key_violation
  "23514", // check_violation
]);
// Error AUTENTIKASI: token kedaluwarsa selagi perangkat offline. INI BUKAN error
// permanen dan BUKAN error jaringan — obatnya menyegarkan sesi lalu mengirim ulang.
// Dulu kasus ini jatuh ke cabang "transien" dan diulang terus dengan token mati,
// sehingga antrean tidak pernah terkuras walau internet sudah kembali.
const isAuthError = (e) => {
  const msg = String(e?.message || "").toLowerCase();
  const code = String(e?.code || "");
  if (code === "PGRST301" || code === "401") return true;
  if (Number(e?.status) === 401) return true;
  return msg.includes("jwt") || msg.includes("token is expired") || msg.includes("not authenticated")
    || msg.includes("invalid claim") || msg.includes("unauthorized");
};
// Fungsi RPC belum ada / cache skema PostgREST belum menyegarkan (PGRST202).
// WAJIB dianggap TRANSIEN: penyebabnya di server (migrasi belum dijalankan atau
// cache belum reload), bukan pada data transaksi. Mengarantinanya = uang hilang.
const isSchemaError = (e) => {
  const msg = String(e?.message || "").toLowerCase();
  return String(e?.code || "") === "PGRST202"
    || msg.includes("could not find the function")
    || msg.includes("schema cache");
};
const isPermanentSyncError = (e) => {
  // PENJAGA UTAMA: apa pun yang berbau auth / skema / jaringan TIDAK PERNAH permanen.
  if (isAuthError(e) || isSchemaError(e)) return false;
  const msg = String(e?.message || "").toLowerCase();
  // Raise eksplisit dari sync_sale_txn (produk hilang / input tak valid).
  // Catatan: pencocokan "p_rows" dipersempit — pesan "could not find the function
  // …(p_rows…)" dari PostgREST juga mengandung "p_rows" dan dulu membuat transaksi
  // sah dikarantina ke dead-letter. Sekarang sudah disaring isSchemaError di atas.
  if (msg.includes("produk tidak ditemukan") || msg.includes("qty tidak valid")) return true;
  if (msg.includes("p_rows") && (msg.includes("kosong") || msg.includes("tidak valid"))) return true;
  const code = e?.code;
  return typeof code === "string" && PERMANENT_SQLSTATES.has(code);
};
// Penjelasan berbahasa manusia + langkah perbaikan, ditampilkan di panel diagnostik.
// Tujuannya kasir/pemilik tahu APA yang salah tanpa perlu membuka console browser —
// di tablet Android console tidak bisa dibuka sama sekali.
const syncErrorHint = (e) => {
  if (!e) return "";
  if (isAuthError(e)) return "Sesi login kedaluwarsa. Tekan “Segarkan sesi & kirim”, atau keluar lalu login ulang — antrean tetap aman.";
  if (isSchemaError(e)) return "Fungsi sync_sale_txn belum ada / belum terbaca di Supabase. Jalankan migrasi SQL-nya, lalu tekan “Kirim sekarang”.";
  const msg = String(e?.message || "").toLowerCase();
  if (msg.includes("failed to fetch") || msg.includes("networkerror") || msg.includes("abort") || msg.includes("timeout"))
    return "Perangkat belum benar-benar tersambung ke internet (sinyal ada tapi data tidak jalan). Cek koneksi lalu kirim ulang.";
  if (String(e?.code || "") === "42501") return "Izin database ditolak (RLS/grant). Hubungi admin — jangan hapus data antrean.";
  return "Kirim ulang setelah koneksi stabil. Jika tetap gagal, unduh cadangan antrean lalu kirim ke admin.";
};

// ===== CATATAN DIAGNOSTIK SINKRONISASI =====
// Disimpan permanen di perangkat agar penyebab kegagalan bisa dibaca KAPAN SAJA,
// termasuk setelah aplikasi ditutup/dibuka lagi. Ini yang selama ini hilang:
// error hanya masuk console.error sehingga di tablet tidak terlihat oleh siapa pun.
const DIAG_KEY = "conflux.sync.diag.v1";
const loadDiag = () => {
  try { const o = JSON.parse(localStorage.getItem(DIAG_KEY) || "null"); return o && typeof o === "object" ? o : null; }
  catch (e) { return null; }
};
const saveDiag = (d) => { try { localStorage.setItem(DIAG_KEY, JSON.stringify(d || null)); } catch (e) {} };

// ===== ANTREAN PENCATATAN PELANGGAN =====
// SENGAJA DIPISAH dari antrean penjualan. Alasannya penting: pencatatan
// pelanggan TIDAK BOLEH menunda atau memblokir pengiriman transaksi (uang &
// stok selalu prioritas satu). Jadi kalau pencatatan pelanggan gagal/lambat,
// penjualan tetap terkirim seperti biasa. Antrean ini tetap permanen di
// perangkat, jadi data pelanggan yang dicatat saat internet putus tidak hilang.
const CUSTBOX_KEY = "conflux.custbox.v1";
const loadCustbox = () => {
  try {
    const a = JSON.parse(localStorage.getItem(CUSTBOX_KEY) || "[]");
    return Array.isArray(a) ? a.filter((x) => x && x.txnId && (x.name || x.phone)) : [];
  } catch (e) { return []; }
};
const saveCustbox = (list) => { try { localStorage.setItem(CUSTBOX_KEY, JSON.stringify(list || [])); } catch (e) {} };

export {
  CUSTBOX_KEY,
  DEAD_KEY,
  DIAG_KEY,
  OUTBOX_KEY,
  PERMANENT_SQLSTATES,
  clientTxnId,
  isAuthError,
  isPermanentSyncError,
  isSchemaError,
  loadCustbox,
  loadDead,
  loadDiag,
  loadOutbox,
  outboxItemTotal,
  outboxTxnIds,
  saveCustbox,
  saveDead,
  saveDiag,
  saveOutbox,
  syncErrorHint
};

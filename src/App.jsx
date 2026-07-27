import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Check, Lock, LogOut, Menu, Printer, Settings, ShieldCheck, ShoppingCart } from "lucide-react";
import { Auth, Capital, CashDeposits, Consign, Customers as CustomersApi, Debts as DebtsApi, Expenses, Movements, Orders as OrdersApi, Products, Profiles, Returns as ReturnsApi, Sales, Settings as SettingsApi, Shifts } from "./db";
import { hasSupabase } from "./supabaseClient";
import { LOGO } from "./assets/logo";
import { AuthSplash, CashierNameGate, Login, RoleGate } from "./components/Gates";
import { Receipt } from "./components/Receipt";
import { Style } from "./components/Style";
import { PendingRescue, SyncBanner, SyncDiagModal } from "./components/SyncUI";
import { Modal, Toast } from "./components/ui";
import { DEFAULT_STORE, cfgNota, cfgSistem, cfgStok, invoiceNo, normStore, setCfg } from "./lib/config";
import { MANAGER_PIN, NAV, NAV_GROUPS, PAY_LABEL, RETURN_REASON_LABEL, payListLabel } from "./lib/constants";
import { custKey } from "./lib/customers";
import { loadDevice, saveDevice } from "./lib/device";
import { num, printProfile, rp, uid } from "./lib/format";
import { stockStatus } from "./lib/inventory";
import { connectBluetoothPrinter, printViaBluetooth, printViaSerial } from "./lib/printing";
import { SEED_CAPITAL, SEED_DEBTS, SEED_DEPOSITS, SEED_EXPENSES, SEED_MOVEMENTS, SEED_ORDERS, SEED_PRODUCTS, SEED_SALES_LOG, nextCode, nextDebtId, nextOrderId } from "./lib/seed";
import { clearCashierSession, loadCashierSession, saveCashierSession } from "./lib/session";
import { clientTxnId, isAuthError, isPermanentSyncError, loadCustbox, loadDead, loadDiag, loadOutbox, outboxTxnIds, saveCustbox, saveDead, saveDiag, saveOutbox, syncErrorHint } from "./lib/sync";
import { Accounting } from "./views/Accounting";
import { ConsignView } from "./views/ConsignView";
import { CustomersView } from "./views/CustomersView";
import { Dashboard } from "./views/Dashboard";
import { Debts } from "./views/Debts";
import { Inventory } from "./views/Inventory";
import { Kasir } from "./views/Kasir";
import { Orders } from "./views/Orders";
import { Restock } from "./views/Restock";
import { ReturnsView } from "./views/ReturnsView";
import { SalesHistory } from "./views/SalesHistory";
import { DevicePrinter, SettingsView } from "./views/Settings";
import { ShiftLog } from "./views/ShiftLog";
import { Simulation } from "./views/Simulation";

/* =============================== App =============================== */

export default function App() {
  const [view, setView] = useState("dashboard");
  const [products, setProducts] = useState(SEED_PRODUCTS);
  const [movements, setMovements] = useState(SEED_MOVEMENTS);
  const [orders, setOrders] = useState(SEED_ORDERS);
  const [debts, setDebts] = useState(SEED_DEBTS);
  const [capital, setCapital] = useState(SEED_CAPITAL);
  const [expenses, setExpenses] = useState(SEED_EXPENSES);
  const [cashDeposits, setCashDeposits] = useState(SEED_DEPOSITS); // setoran kas -> rekening
  const [salesLog, setSalesLog] = useState(SEED_SALES_LOG);
  const [consigns, setConsigns] = useState([]); // buku kewajiban setor titip jual
  const [consignPayments, setConsignPayments] = useState([]); // riwayat setoran (pembayaran bertahap ke distributor)
  const [returns, setReturns] = useState([]); // buku retur & tukar (kepala + baris barang)
  const [customers, setCustomers] = useState([]); // master pelanggan (CRM)
  const [custVisits, setCustVisits] = useState([]); // buku kunjungan: 1 baris / transaksi
  const [toast, setToast] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [role, setRole] = useState(null); // null = belum login, "cashier" | "manager"
  const [cashierName, setCashierName] = useState("");
  const [shiftStart, setShiftStart] = useState(null);
  const [shiftReport, setShiftReport] = useState(null); // { stage: "count" | "result", report, shift }
  const [shiftCash, setShiftCash] = useState("");
  const [shiftNote, setShiftNote] = useState("");
  const [shift, setShift] = useState(null); // shift kasir aktif (baris DB / objek lokal)
  const [shiftCashMoves, setShiftCashMoves] = useState([]); // kas laci non-penjualan (mode lokal)
  const [closingBusy, setClosingBusy] = useState(false);
  const [btName, setBtName] = useState("");
  const managerMode = role === "manager";
  const [store, setStore] = useState(DEFAULT_STORE);
  // Pengaturan printer khusus perangkat ini (opsional, tersimpan di localStorage).
  const [device, setDevice] = useState(loadDevice);
  // Profil cetak efektif = pengaturan server, ditimpa pengaturan perangkat bila aktif.
  const printCfg = printProfile(store, device);
  // Cermin pengaturan ke modul SEBELUM anak-anak dirender, supaya fungsi util
  // (expiryStatus, targetLevel, invoiceNo, buildWaText, ...) memakai nilai yang
  // sama persis dengan yang tampil di layar pada render ini juga.
  setCfg(store);
  const [printReceipt, setPrintReceipt] = useState(null);
  const [receiptModal, setReceiptModal] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2200); };
  const pById = (id) => products.find((p) => p.id === id);

  // ===== Sinkronisasi Supabase + Autentikasi =====
  const persist = (fn) => { if (hasSupabase) fn().catch((e) => { console.error("[sync]", e); flash(`Gagal menyimpan ke server — ${e?.message || "cek koneksi"}`); }); };

  // Pengaturan printer perangkat: hanya di alat ini, tidak pernah dikirim ke server.
  const applyDevice = (patch) => {
    setDevice((d) => { const next = { ...d, ...patch }; saveDevice(next); return next; });
  };

  // ===== Simpan pengaturan sistem =====
  // Satu-satunya jalan menulis tabel `settings`. Selalu dinormalkan lebih dulu,
  // jadi angka yang mustahil tidak pernah sampai ke database. Layar diperbarui
  // optimistis; bila server menolak, nilai lama dikembalikan supaya layar tidak
  // pernah menampilkan pengaturan yang sebenarnya gagal tersimpan.
  const [savingCfg, setSavingCfg] = useState(false);
  const saveSettings = async (raw) => {
    const next = normStore(raw);
    const prev = store;
    setStore(next);
    if (!hasSupabase) { flash("Pengaturan disimpan di perangkat ini"); return true; }
    setSavingCfg(true);
    try {
      await SettingsApi.save(next);
      flash("Pengaturan tersimpan — berlaku di semua perangkat");
      return true;
    } catch (e) {
      console.error("[settings]", e);
      setStore(prev);
      flash(e?.message?.includes("manajer") || e?.code === "42501"
        ? "Hanya manajer yang boleh mengubah pengaturan toko"
        : `Gagal menyimpan pengaturan — ${e?.message || "cek koneksi"}`);
      return false;
    } finally { setSavingCfg(false); }
  };

  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!hasSupabase);
  const [profileRole, setProfileRole] = useState(null);
  const loadedRef = useRef(false);
  const authUidRef = useRef(null);
  // Benar HANYA setelah daftar produk sungguhan berhasil ditarik dari server.
  // Selagi false (mis. sesi login pulih dari cache tapi katalog gagal dimuat),
  // penjualan DILARANG agar tidak menembak ID produk contoh (seed) yang tak ada
  // di database — yang akan membuat paket antrean gagal sinkron selamanya.
  const dataReadyRef = useRef(false);

  const loadAll = async () => {
    const res = await Promise.allSettled([
      Products.list(), Movements.list(), OrdersApi.list(), DebtsApi.list(),
      Capital.list(), Expenses.list(), Sales.list({ sinceDays: cfgSistem().salesDays }), SettingsApi.get(),
      Consign.list(), Consign.payments(), CashDeposits.list(), ReturnsApi.list({ limit: 300 }),
      CustomersApi.list(), CustomersApi.visits({ limit: 5000 }),
    ]);
    const [p, mv, od, dz, cap, exp, sl, st, cg, cp, cd, rt, cu, cv] = res;
    if (p.status === "fulfilled") { setProducts(p.value); dataReadyRef.current = true; }
    if (mv.status === "fulfilled") setMovements(mv.value);
    if (od.status === "fulfilled") setOrders(od.value);
    if (dz.status === "fulfilled") setDebts(dz.value);
    if (cap.status === "fulfilled") setCapital(cap.value);
    if (exp.status === "fulfilled") setExpenses(exp.value);
    if (sl.status === "fulfilled") setSalesLog(sl.value);
    if (cg.status === "fulfilled") setConsigns(cg.value);
    if (cp.status === "fulfilled") setConsignPayments(cp.value);
    if (cd.status === "fulfilled") setCashDeposits(cd.value);
    if (rt.status === "fulfilled") setReturns(rt.value);
    if (cu.status === "fulfilled") setCustomers(mergeLocalCustomers(cu.value));
    if (cv.status === "fulfilled") setCustVisits(cv.value);
    // Pengaturan dari server WAJIB lewat normStore(): baris versi lama tetap sah,
    // kunci baru terisi bawaan, dan angka di luar akal dijepit ke rentang aman.
    if (st.status === "fulfilled" && st.value) setStore(normStore(st.value));
    const failed = res.filter((r) => r.status === "rejected");
    if (failed.length) { console.error("[load]", failed.map((f) => f.reason)); flash("Sebagian data gagal dimuat — cek koneksi/akses"); }
    else flash("Tersambung ke database");
  };

  // Pantau sesi login
  useEffect(() => {
    if (!hasSupabase) return;
    let alive = true;
    const apply = async (s) => {
      if (!alive) return;
      setSession(s);
      const uid = s?.user?.id || null;
      if (!s) { authUidRef.current = null; setRole(null); setProfileRole(null); setCashierName(""); loadedRef.current = false; setAuthReady(true); return; }
      if (authUidRef.current === uid) { setAuthReady(true); return; } // refresh token sesi yang sama — jangan setup ulang
      authUidRef.current = uid;
      try {
        const prof = await Profiles.me();
        if (!alive) return;
        const r = prof?.role === "manager" ? "manager" : "cashier";
        setProfileRole(r);
        if (r === "manager") { setRole("manager"); setCashierName(prof?.name || "Manajer"); setView("dashboard"); setShiftStart(Date.now()); }
        else {
          const saved = loadCashierSession(uid);
          if (saved) {
            // Validasi ke server: kalau shift ternyata sudah ditutup (mis. oleh manajer),
            // sesi lokal dibuang dan kasir harus buka shift baru dengan modal awal baru.
            let sh = null, checked = false;
            try { sh = await Shifts.get(saved.shiftId); checked = true; }
            catch (e) { console.error("[shift]", e); }
            if (sh && sh.status === "open") {
              setShift(sh); setShiftCashMoves([]);
              setRole("cashier"); setCashierName(saved.name); setShiftStart(sh.openedAt || saved.start); setView("kasir");
            } else if (checked) { clearCashierSession(); }
            // gagal cek (offline sesaat): jangan hapus sesi — gate tampil, reload berikutnya dicoba lagi
          }
        }
      } catch (e) { console.error("[profile]", e); setProfileRole("cashier"); }
      setAuthReady(true);
    };
    Auth.getSession().then(apply);
    const { data: sub } = Auth.onChange(apply);
    return () => { alive = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  // Muat data hanya setelah login (RLS butuh sesi terautentikasi)
  useEffect(() => {
    if (!hasSupabase || !session || loadedRef.current) return;
    loadedRef.current = true;
    loadAll();
  }, [session]);

  // ===== Anti layar basi =====
  // Setiap perangkat memuat data saat login saja, sehingga stok di layar kasir dan
  // manajer bisa berbeda dari database sepanjang hari. Ini sumber utama keluhan
  // "stok tidak sesuai": angka yang dilihat (dan dipakai dasar opname) sudah basi.
  // Solusi: tarik ulang daftar produk saat tab kembali aktif, berkala tiap 2 menit,
  // dan (dipanggil manual) setelah transaksi/pembatalan.
  const lastProdRefreshRef = useRef(0);
  const pendingSyncRef = useRef(0);     // jumlah PENULISAN stok ke server yang masih berjalan
  const prodSeqRef = useRef(0);         // nomor urut respons; respons lama tak boleh menimpa yang baru
  const wantRefreshRef = useRef(false); // ada refresh yang ditunda karena penulisan sedang berjalan
  const refreshProducts = async (force = false) => {
    if (!hasSupabase || !session) return;
    // JANGAN menarik daftar produk SELAGI ada penulisan stok yang belum selesai.
    // Skenario nyata di kasir Android: bayar → pindah ke aplikasi printer → kembali.
    // Peristiwa "kembali" memicu refresh persis saat transaksi masih dikirim; hasil
    // tarikan berisi stok PRA-transaksi dan menimpa layar dengan angka lama — inilah
    // gejala "sudah diinput tapi stok tidak berubah". Solusi: tandai dulu, dan begitu
    // penulisan selesai endSync() menjalankan refresh paksa.
    if (pendingSyncRef.current > 0) { wantRefreshRef.current = true; return; }
    const now = Date.now();
    if (!force && now - lastProdRefreshRef.current < 15000) return; // rem: maks 1x / 15 dtk
    lastProdRefreshRef.current = now;
    const seq = ++prodSeqRef.current;
    try {
      const fresh = await Products.list();
      dataReadyRef.current = true; // katalog sungguhan sudah pernah termuat
      // Dua tarikan bisa tumpang-tindih (fokus tab + refresh pasca-transaksi) dan
      // jaringan tidak menjamin urutan respons: respons LAMA yang tiba belakangan
      // dulu bisa menimpa respons BARU. Token urut memastikan hanya tarikan
      // terakhir yang boleh mengisi layar.
      if (seq === prodSeqRef.current) setProducts(fresh);
    }
    catch (e) { console.error("[refresh]", e); }
  };
  // Pagar untuk SEMUA penulisan stok ke server (jual, stok masuk/keluar, opname,
  // pembatalan): selama berjalan, refresh apa pun ditunda; setelah selesai, refresh
  // yang tertunda otomatis dijalankan supaya layar = database.
  const beginSync = () => { pendingSyncRef.current += 1; };
  const endSync = () => {
    pendingSyncRef.current = Math.max(0, pendingSyncRef.current - 1);
    if (pendingSyncRef.current === 0 && wantRefreshRef.current) {
      wantRefreshRef.current = false;
      refreshProducts(true);
    }
  };
  useEffect(() => {
    if (!hasSupabase || !session) return;
    const onWake = () => { if (document.visibilityState === "visible") { refreshProducts(); refreshLedgers(); flushOutbox(); flushCustbox(); } };
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    const t = setInterval(onWake, cfgSistem().refreshSec * 1000);
    return () => {
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
      clearInterval(t);
    };
    // Interval ikut dipasang ulang saat manajer mengubah "tarik ulang data berkala",
    // jadi perubahan langsung berlaku tanpa perlu login ulang.
  }, [session, store.sistem.refreshSec]);

  // ===== ANTREAN OFFLINE (OUTBOX) — sumber kebenaran di ref, cermin di localStorage =====
  // Ref dipakai sebagai sumber kebenaran (bukan state) supaya checkout beruntun yang
  // sangat cepat tidak saling menimpa akibat penjadwalan render React. Panjang antrean
  // dicerminkan ke state hanya untuk tampilan banner.
  const outboxRef = useRef(loadOutbox());
  const [pendingCount, setPendingCount] = useState(outboxRef.current.length);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine !== false);
  const deadRef = useRef(loadDead());
  const [deadCount, setDeadCount] = useState(deadRef.current.length);
  const flushingRef = useRef(false);
  const flushPromiseRef = useRef(null); // promise flush yang sedang berjalan (agar bisa di-await)
  const [syncDiag, setSyncDiag] = useState(loadDiag());   // hasil percobaan kirim terakhir (permanen di perangkat)
  const [diagOpen, setDiagOpen] = useState(false);        // panel diagnostik terbuka?
  // Daftar no. transaksi yang MASIH di antrean. Dipakai menandai baris di Riwayat
  // dengan label "Belum tersinkron" — supaya "ada di perangkat tapi tidak ada di
  // server" langsung kelihatan, bukan baru ketahuan berhari-hari kemudian.
  const [pendingTxnIds, setPendingTxnIds] = useState(() => outboxTxnIds(loadOutbox()));
  const [pendingList, setPendingList] = useState(() => outboxRef.current);
  const [deadList, setDeadList] = useState(() => deadRef.current);
  const noteDiag = (d) => { const rec = { at: Date.now(), ...d }; saveDiag(rec); setSyncDiag(rec); };
  const persistOutbox = () => {
    saveOutbox(outboxRef.current);
    setPendingCount(outboxRef.current.length);
    setPendingTxnIds(outboxTxnIds(outboxRef.current));
    setPendingList(outboxRef.current);
  };
  const enqueueTxn = (payload) => { outboxRef.current = [...outboxRef.current, payload]; persistOutbox(); flushOutbox(); };

  // ===== ANTI LAYAR BASI UNTUK RIWAYAT & HUTANG =====
  // Sebelumnya `salesLog` dan `debts` HANYA ditarik sekali saat login (loadAll) —
  // penyegaran berkala hanya menyentuh daftar produk. Akibatnya komputer manajer
  // yang dibiarkan terbuka TIDAK PERNAH menampilkan transaksi baru dari perangkat
  // kasir, sebagus apa pun sinkronisasinya. Persis gejala "di device ada, di
  // komputer tidak terdeteksi". Sekarang keduanya ikut disegarkan.
  const salesLogRef = useRef([]);
  const debtsRef = useRef([]);
  const lastSalesRefreshRef = useRef(0);
  useEffect(() => { salesLogRef.current = salesLog; }, [salesLog]);
  useEffect(() => { debtsRef.current = debts; }, [debts]);

  // Baris penjualan yang MASIH di antrean belum ada di server. Tanpa penggabungan
  // ini, penyegaran akan menghapusnya dari layar — kasir akan mengira transaksinya
  // hilang, padahal hanya belum terkirim. Baris lokal dipertahankan sampai
  // benar-benar muncul di data server.
  const mergeLocalSales = (serverList) => {
    const pend = outboxTxnIds(outboxRef.current);
    if (!pend.size) return serverList || [];
    const onServer = new Set((serverList || []).map((s) => s.txnId));
    const keep = salesLogRef.current.filter((s) => s.txnId && pend.has(s.txnId) && !onServer.has(s.txnId));
    return [...keep, ...(serverList || [])];
  };
  const mergeLocalDebts = (serverList) => {
    const pend = new Set(outboxRef.current.map((x) => x.localDebtId).filter(Boolean));
    if (!pend.size) return serverList || [];
    const onServer = new Set((serverList || []).map((d) => d.id));
    const keep = debtsRef.current.filter((d) => pend.has(d.id) && !onServer.has(d.id));
    return [...keep, ...(serverList || [])];
  };

  const refreshLedgers = async (force = false) => {
    if (!hasSupabase || !session) return;
    if (pendingSyncRef.current > 0) return;   // jangan menyela penulisan yang sedang jalan
    const now = Date.now();
    if (!force && now - lastSalesRefreshRef.current < 45000) return; // rem: maks 1x / 45 dtk
    lastSalesRefreshRef.current = now;
    try {
      const [sl, dz] = await Promise.allSettled([Sales.list({ sinceDays: cfgSistem().salesDays }), DebtsApi.list()]);
      if (sl.status === "fulfilled") setSalesLog(mergeLocalSales(sl.value));
      if (dz.status === "fulfilled") setDebts(mergeLocalDebts(dz.value));
    } catch (e) { console.error("[riwayat]", e); }
  };

  // Kirim antrean ke server, PALING LAMA dulu, SATU per satu. Paket hanya dihapus
  // dari antrean SETELAH server memastikan tersimpan (ok) atau menyatakan sudah
  // pernah tersimpan (duplicate). Gagal jaringan → berhenti, antrean tetap utuh,
  // dicoba lagi nanti — jadi transaksi tidak mungkin hilang maupun tercatat dobel.
  // Selalu MENGEMBALIKAN promise: pemanggil (mis. tutup shift) bisa menunggu sampai
  // antrean benar-benar terkuras. Jika flush lain sedang jalan, promise itu yang
  // dikembalikan (tidak pernah menjalankan dua flush sekaligus).
  const flushOutbox = () => {
    if (!hasSupabase) return Promise.resolve();
    if (flushingRef.current) return flushPromiseRef.current || Promise.resolve();
    if (!outboxRef.current.length) return Promise.resolve();
    // PENTING: gerbang `session` (state React) DIHAPUS dari sini. Dulu, kalau token
    // kedaluwarsa selagi perangkat offline, supabase-js menganggap sesi hilang →
    // layar kembali ke Login → flushOutbox berhenti total → antrean terkurung di
    // balik layar login dan tidak pernah terkirim walau internet sudah kembali.
    // Sekarang sesi dicek langsung ke supabase (termasuk yang tersimpan di
    // localStorage) di dalam proses kirim, bukan lewat state layar.
    //
    // Catatan lama yang tetap berlaku: sengaja TIDAK memakai navigator.onLine sebagai
    // gerbang. Bila benar offline, permintaan gagal cepat lalu dicoba lagi; sebaliknya
    // kalau onLine "macet-false" (bug perangkat), antrean tetap terkuras.
    flushingRef.current = true;
    setSyncing(true);
    const run = (async () => {
      let drained = 0;
      try {
        // Sesi sungguhan (bukan state layar). Tanpa ini, RPC pasti ditolak 401.
        let sess = null;
        try { sess = await Auth.getSession(); } catch (e) { sess = null; }
        if (!sess) { sess = await Auth.refresh(); }
        if (!sess) {
          noteDiag({ ok: false, stage: "auth", message: "Belum login di perangkat ini",
            hint: "Antrean AMAN tersimpan. Login kembali dengan akun yang sama di perangkat ini, transaksi otomatis terkirim." });
          return;
        }
        let authRetried = false; // hanya satu kali segarkan sesi per putaran flush
        while (outboxRef.current.length) {
          const item = outboxRef.current[0];
          let res;
          try {
            res = await Sales.syncTxn(item);
          } catch (e) {
            // TOKEN KEDALUWARSA selagi offline: segarkan sesi lalu ulangi paket YANG SAMA.
            // Tanpa ini, setiap percobaan berikutnya memakai token mati juga — antrean
            // "mencoba selamanya" tanpa pernah berhasil. Inilah penyebab paling umum
            // transaksi offline tidak masuk walau internet sudah kembali.
            if (isAuthError(e) && !authRetried) {
              authRetried = true;
              const fresh = await Auth.refresh();
              if (fresh) {
                noteDiag({ ok: true, stage: "auth", message: "Sesi disegarkan — melanjutkan pengiriman" });
                continue; // ulangi paket yang sama dengan token baru
              }
              item.attempts = (item.attempts || 0) + 1;
              item.lastError = "sesi kedaluwarsa";
              persistOutbox();
              noteDiag({ ok: false, stage: "auth", message: "Sesi kedaluwarsa dan gagal disegarkan",
                hint: "Login ulang di perangkat ini dengan akun yang sama. Antrean tetap tersimpan dan akan terkirim otomatis setelah login.",
                pending: outboxRef.current.length });
              break;
            }
            // Karantina HANYA bila error benar-benar permanen DAN sudah dicoba berkali-kali.
            // Pengaman ganda: kalaupun penggolongan error meleset, transaksi sah tidak
            // langsung dibuang ke dead-letter pada kegagalan pertama.
            item.attempts = (item.attempts || 0) + 1;
            if (isPermanentSyncError(e) && item.attempts >= 3) {
              // DITOLAK PERMANEN server (mis. produk telah dihapus). Retry percuma dan
              // hanya memblokir paket lain di belakangnya. Pindah ke dead-letter
              // (tersimpan permanen + ditampilkan agar admin bisa memulihkan), lalu
              // LANJUT ke paket berikutnya — antrean tidak macet.
              console.error("[outbox:permanen]", e, item);
              item.deadReason = e?.message || "ditolak server";
              item.deadAt = Date.now();
              deadRef.current = [...deadRef.current, item];
              saveDead(deadRef.current); setDeadCount(deadRef.current.length); setDeadList(deadRef.current);
              outboxRef.current = outboxRef.current.slice(1);
              persistOutbox();
              noteDiag({ ok: false, stage: "tolak", message: e?.message || "ditolak server",
                code: e?.code || null, hint: "Buka Diagnostik Sinkronisasi → tab Ditolak untuk memulihkan transaksi ini." });
              flash("1 transaksi tidak dapat disinkronkan — buka Diagnostik Sinkronisasi untuk memulihkannya.");
              continue;
            }
            // Transien (koneksi putus/timeout/skema): simpan jejak error, hentikan loop,
            // pertahankan SELURUH antrean apa adanya untuk percobaan berikutnya.
            console.error("[outbox]", e);
            item.lastError = e?.message || "gagal";
            item.lastTryAt = Date.now();
            persistOutbox();
            noteDiag({ ok: false, stage: "kirim", message: e?.message || "gagal terkirim",
              code: e?.code || null, hint: syncErrorHint(e), pending: outboxRef.current.length });
            break;
          }
          // Berhasil / duplikat → paket ini selesai, keluarkan dari kepala antrean.
          // (Append checkout baru selagi menunggu tetap aman: ia di ekor referensi
          //  array terbaru; slice(1) hanya membuang kepala yang barusan diproses.)
          outboxRef.current = outboxRef.current.slice(1);
          persistOutbox();
          drained++;
          // Selaraskan nomor bon lokal bila server terpaksa memberi nomor lain
          // (dua perangkat offline sempat memilih nomor HTG yang sama).
          if (res?.debt_id && item.localDebtId && res.debt_id !== item.localDebtId) {
            setDebts((ds) => ds.map((d) => (d.id === item.localDebtId ? { ...d, id: res.debt_id } : d)));
          }
        }
        if (drained > 0) {
          noteDiag({ ok: true, stage: "kirim", message: `${drained} transaksi berhasil terkirim ke server`,
            pending: outboxRef.current.length });
        }
      } catch (e) {
        // Jaring pengaman: error tak terduga (mis. bug) TIDAK boleh membuat
        // flushingRef tersangkut sehingga antrean berhenti selamanya.
        console.error("[outbox:fatal]", e);
        noteDiag({ ok: false, stage: "internal", message: e?.message || "kesalahan tak terduga",
          hint: "Muat ulang aplikasi (Ctrl+Shift+R). Antrean tetap tersimpan di perangkat." });
      } finally {
        flushingRef.current = false;
        setSyncing(false);
        flushPromiseRef.current = null;
        if (drained > 0) {
          refreshProducts(true); // ada yang terkirim → tarik stok terbaru
          refreshLedgers(true);  // riwayat & hutang resmi dari server
          // Titipan yang laku saat offline baru dibuat server ketika sinkron; tarik
          // ulang agar kewajiban setor ke distributor langsung tampak.
          Consign.list().then((cg) => setConsigns(cg)).catch(() => {});
          Consign.payments().then((cp) => setConsignPayments(cp)).catch(() => {});
        }
      }
    })();
    flushPromiseRef.current = run;
    return run;
  };

  // ===== PEMULIHAN: kembalikan paket yang dikarantina ke antrean utama =====
  // Sebelumnya dead-letter hanya bisa DISALIN, tidak ada jalan pulang — artinya
  // transaksi yang salah dikarantina praktis hilang. Sekarang bisa dikirim ulang:
  // aman karena server tetap menolak client_id yang sudah pernah masuk (idempoten).
  const retryDead = () => {
    if (!deadRef.current.length) return;
    const back = deadRef.current.map((d) => { const { deadReason, deadAt, ...rest } = d; return { ...rest, attempts: 0 }; });
    const seen = new Set(outboxRef.current.map((x) => x.clientId));
    outboxRef.current = [...outboxRef.current, ...back.filter((b) => !seen.has(b.clientId))];
    deadRef.current = []; saveDead([]); setDeadCount(0); setDeadList([]);
    persistOutbox();
    flash(`${back.length} transaksi dikembalikan ke antrean — mencoba kirim…`);
    flushOutbox();
  };

  // ===== CADANGAN ANTREAN: unduh berkas .json =====
  // Jaring pengaman terakhir. Kalau satu perangkat rusak/hilang/di-reset, berkas ini
  // bisa dibuka di perangkat lain (menu yang sama → Pulihkan dari berkas) sehingga
  // transaksi tetap masuk ke server. Tanpa ini, data hanya ada di satu tablet.
  const exportQueue = () => {
    const payload = {
      app: "conflux", kind: "outbox-backup", v: 1, at: new Date().toISOString(),
      pending: outboxRef.current, dead: deadRef.current, custbox: custboxRef.current,
    };
    const txt = JSON.stringify(payload, null, 2);
    try {
      const blob = new Blob([txt], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const d = new Date(); const p2 = (n) => String(n).padStart(2, "0");
      a.href = url;
      a.download = `conflux-antrean-${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      flash("Cadangan antrean diunduh — simpan berkasnya sampai transaksi masuk server.");
    } catch (e) {
      console.log(txt);
      flash("Gagal mengunduh — data dicetak di console (F12), salin dari sana.");
    }
  };

  // ===== PULIHKAN ANTREAN dari berkas cadangan (perangkat lain) =====
  // Digabung berdasarkan clientId sehingga memuat berkas yang sama dua kali TIDAK
  // menggandakan apa pun; server pun tetap menolak client_id yang sudah tersimpan.
  const importQueue = async (file) => {
    try {
      const txt = await file.text();
      const o = JSON.parse(txt);
      const list = [...(Array.isArray(o?.pending) ? o.pending : []), ...(Array.isArray(o?.dead) ? o.dead : [])]
        .filter((x) => x && typeof x.clientId === "string" && Array.isArray(x.rows) && x.rows.length)
        .map((x) => { const { deadReason, deadAt, ...rest } = x; return { ...rest, attempts: 0 }; });
      if (!list.length) { flash("Berkas tidak berisi transaksi antrean yang sah."); return; }
      const seen = new Set(outboxRef.current.map((x) => x.clientId));
      const add = list.filter((x) => !seen.has(x.clientId));
      outboxRef.current = [...outboxRef.current, ...add];
      persistOutbox();
      flash(add.length ? `${add.length} transaksi dipulihkan — mencoba kirim…` : "Semua transaksi di berkas sudah ada di antrean.");
      flushOutbox();
    } catch (e) {
      console.error("[impor]", e);
      flash("Berkas tidak bisa dibaca — pastikan memilih berkas cadangan antrean (.json).");
    }
  };

  // Segarkan sesi lalu kirim ulang — tombol darurat saat token kedaluwarsa.
  const refreshAndFlush = async () => {
    const s = await Auth.refresh();
    if (s) { setSession(s); flash("Sesi disegarkan — mengirim antrean…"); }
    else flash("Sesi tidak bisa disegarkan — silakan login ulang di perangkat ini.");
    return flushOutbox();
  };

  // ===== PENDORONG ANTREAN YANG TIDAK BERGANTUNG PADA STATE LAYAR =====
  // Berjalan SELALU (termasuk saat layar sedang menampilkan Login atau gerbang shift),
  // selama masih ada isi antrean. Ini menutup lubang lama: kalau sesi sempat dianggap
  // hilang, seluruh pemicu sinkronisasi ikut mati bersama layar utamanya.
  useEffect(() => {
    if (!hasSupabase) return;
    const tick = () => { if (outboxRef.current.length || custboxRef.current.length) { flushOutbox(); flushCustbox(); } };
    const t = setInterval(tick, 15000);
    const onNet = () => { setOnline(navigator.onLine !== false); tick(); };
    window.addEventListener("online", onNet);
    window.addEventListener("pageshow", tick);
    tick();
    return () => { clearInterval(t); window.removeEventListener("online", onNet); window.removeEventListener("pageshow", tick); };
  }, []);

  // ===== Antrean pencatatan pelanggan (terpisah dari antrean penjualan) =====
  const custboxRef = useRef(loadCustbox());
  const [custPending, setCustPending] = useState(custboxRef.current.length);
  const custFlushingRef = useRef(false);
  const persistCustbox = () => { saveCustbox(custboxRef.current); setCustPending(custboxRef.current.length); };

  // Pelanggan yang BARU dibuat di perangkat ini dan belum sempat tersimpan di
  // server tetap dipertahankan di daftar (id sementara "tmp-…") supaya kasir
  // bisa langsung memilihnya lagi untuk transaksi berikutnya walau offline.
  // Salinan daftar pelanggan untuk dibaca dari dalam fungsi async (hindari state basi)
  const customersRef = useRef([]);
  const mergeLocalCustomers = (serverList) => {
    const pendingKeys = new Set(custboxRef.current.map((x) => custKey(x)));
    const serverKeys = new Set((serverList || []).map((c) => custKey(c)));
    const keepLocal = customersRef.current.filter(
      (c) => String(c.id || "").startsWith("tmp-") && pendingKeys.has(custKey(c)) && !serverKeys.has(custKey(c))
    );
    return [...(serverList || []), ...keepLocal];
  };
  useEffect(() => { customersRef.current = customers; }, [customers]);

  const refreshCustomers = async () => {
    if (!hasSupabase || !session) return;
    try {
      const [cu, cv] = await Promise.all([CustomersApi.list(), CustomersApi.visits({ limit: 5000 })]);
      setCustomers(mergeLocalCustomers(cu));
      setCustVisits(cv);
    } catch (e) { console.error("[pelanggan]", e); }
  };

  // Kirim antrean pelanggan, paling lama dulu, satu per satu. Server idempoten
  // pada txn_id, jadi kiriman ulang tidak pernah menggandakan statistik.
  const flushCustbox = async () => {
    if (!hasSupabase || !session) return;
    if (custFlushingRef.current || !custboxRef.current.length) return;
    custFlushingRef.current = true;
    let done = 0;
    try {
      while (custboxRef.current.length) {
        const item = custboxRef.current[0];
        try {
          await CustomersApi.link(item);
          done++;
        } catch (e) {
          item.attempts = (item.attempts || 0) + 1;
          item.lastError = e?.message || "gagal";
          // Transien (koneksi) → hentikan, antrean utuh, dicoba lagi nanti.
          if (!isPermanentSyncError(e) && item.attempts < 8) { persistCustbox(); break; }
          // Menyerah: catatan pelanggan dilepas agar tidak memblokir sisanya.
          // Transaksinya SENDIRI tetap aman — hanya kaitan pelanggannya hilang.
          console.error("[custbox:gagal]", e, item);
        }
        custboxRef.current = custboxRef.current.slice(1);
        persistCustbox();
      }
    } finally {
      custFlushingRef.current = false;
      if (done > 0) refreshCustomers();
    }
  };
  const enqueueCustomer = (payload) => {
    custboxRef.current = [...custboxRef.current, payload];
    persistCustbox();
    flushCustbox();
  };

  // ===== Kelola data pelanggan dari tab Data Customer =====
  // Semua melempar error bila gagal supaya layar bisa menampilkan sebabnya
  // (mis. nomor telepon bentrok) — tidak ada perubahan yang "diam-diam gagal".
  const saveCustomer = async (payload) => {
    if (!hasSupabase) {
      const row = {
        id: payload.id || `tmp-${uid()}`, name: payload.name || "", business: payload.business || "",
        phone: payload.phone || "", kind: payload.business ? "bisnis" : (payload.kind || "individu"),
        note: payload.note || "", txnCount: 0, totalSpent: 0, firstTxnAt: null, lastTxnAt: null, ts: Date.now(),
      };
      setCustomers((cs) => (payload.id ? cs.map((c) => (c.id === payload.id ? { ...c, ...row } : c)) : [row, ...cs]));
      return row;
    }
    const row = await CustomersApi.save(payload);
    setCustomers((cs) => {
      const rest = cs.filter((c) => c.id !== row.id && c.id !== payload.id);
      return [row, ...rest];
    });
    return row;
  };
  const deleteCustomer = async (id) => {
    if (hasSupabase) await CustomersApi.remove(id);
    setCustomers((cs) => cs.filter((c) => c.id !== id));
    setCustVisits((vs) => vs.filter((v) => v.customerId !== id));
  };
  const mergeCustomers = async (keepId, dropId) => {
    if (hasSupabase) {
      const row = await CustomersApi.merge(keepId, dropId);
      await refreshCustomers();
      return row;
    }
    setCustVisits((vs) => vs.map((v) => (v.customerId === dropId ? { ...v, customerId: keepId } : v)));
    setCustomers((cs) => cs.filter((c) => c.id !== dropId));
    return customersRef.current.find((c) => c.id === keepId) || null;
  };

  // Pemicu sinkronisasi: koneksi kembali, tab aktif kembali, berkala, dan saat login.
  useEffect(() => {
    if (!hasSupabase || !session) return;
    const goOnline = () => { setOnline(true); flushOutbox(); flushCustbox(); };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    flushOutbox(); // ada sisa dari sesi sebelumnya? kirim sekarang.
    flushCustbox();
    const t = setInterval(() => { flushOutbox(); flushCustbox(); }, 20000); // dorong tiap 20 dtk selama masih ada antrean
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      clearInterval(t);
    };
  }, [session]);

  const recordMovement = async (productId, type, qty, note, unitCost, expiry) => {
    qty = Number(qty) || 0;
    if (qty <= 0) { flash("Jumlah harus lebih dari 0"); return; }
    const prev = products.find((p) => p.id === productId);
    const prevStock = prev ? prev.stock : 0;
    const newStock = Math.max(0, prevStock + (type === "in" ? qty : -qty));
    // Stok masuk = batch FIFO baru dengan harga belinya sendiri; tanpa input harga, pakai modal terakhir
    const costIn = type === "in" ? (unitCost != null && unitCost !== "" ? Number(unitCost) : (prev?.cost || 0)) : null;
    const mid = uid();
    setProducts((ps) => ps.map((p) => (p.id === productId ? { ...p, stock: newStock, ...(type === "in" ? { cost: costIn } : {}) } : p)));
    setMovements((m) => [{ id: mid, productId, type, qty, note, at: "Baru saja" }, ...m]);
    if (!hasSupabase) return;
    beginSync(); // pagar: refresh berkala tidak boleh menyela penulisan ini
    let ok = false;
    try {
      if (type === "in") {
        // ATOMIK di server: riwayat + batch FIFO + kolom stok diperbarui dalam SATU transaksi (RPC stock_in).
        // Tidak mungkin lagi "pembelian tercatat tapi stok tidak berubah".
        // expiry (opsional) tersimpan langsung pada batch yang baru dibuat.
        const st = await Products.stockIn(productId, qty, costIn, note, expiry || null);
        if (st != null) setProducts((ps) => ps.map((p) => (p.id === productId ? { ...p, stock: Number(st) } : p)));
      } else {
        // ATOMIK di server: riwayat + potong batch FIFO + kolom stok dalam SATU transaksi (RPC stock_out)
        await Products.stockOut(productId, qty, note);
      }
      ok = true;
    } catch (e) {
      console.error("[sync]", e);
      // Gagal simpan → batalkan perubahan lokal supaya angka di layar = angka di database
      setProducts((ps) => ps.map((p) => (p.id === productId ? { ...p, stock: prevStock, ...(type === "in" ? { cost: prev?.cost || 0 } : {}) } : p)));
      setMovements((m) => m.filter((x) => x.id !== mid));
      flash(`GAGAL disimpan — stok tidak berubah. ${e?.message || "Cek koneksi"}`);
    } finally { endSync(); }
    // Stok KELUAR: RPC mengembalikan HPP, bukan stok akhir, sehingga angka lokal
    // dihitung dari layar yang bisa basi (perangkat lain mungkin baru saja jualan).
    // Tarik angka pasti dari database supaya layar = kenyataan.
    if (ok && type === "out") refreshProducts(true);
  };

  // Penjualan (kasir & order): potong stok FIFO + catat HPP sesuai batch yang benar-benar terpakai.
  // Aman jika produk yang sama muncul lebih dari satu baris.
  //
  // ===== TAHAN INTERNET PUTUS =====
  // Layar diperbarui seketika (optimistik). Untuk mode server, SATU paket transaksi
  // dimasukkan ke ANTREAN OFFLINE (localStorage) lalu dikirim lewat RPC atomik yang
  // idempoten. Jika koneksi putus, paket menunggu di antrean dan terkirim otomatis
  // saat online — TANPA risiko hilang (antrean permanen di perangkat) maupun dobel
  // (server menolak client_id yang sama). ctx.debt (bila bayar = hutang) ikut dalam
  // paket yang sama sehingga bon & penjualan tersimpan bersama atau batal bersama.
  const sellItems = (items, note, ctx = {}) => {
    // Penjaga: mode server tapi katalog sungguhan belum termuat → jangan proses.
    // Mencegah paket antrean berisi ID produk contoh yang tak ada di database.
    if (hasSupabase && !dataReadyRef.current) {
      flash("Data toko belum termuat dari server. Sambungkan internet lalu buka ulang aplikasi sebelum berjualan.");
      return;
    }
    const saleDate = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    const soldAt = new Date().toISOString();

    // 1) Perbarui layar seketika (stok, riwayat, log penjualan) — pengalaman kasir mulus.
    const newStock = {};
    items.forEach((it) => {
      const base = newStock[it.pid] != null ? newStock[it.pid] : (products.find((p) => p.id === it.pid)?.stock ?? 0);
      newStock[it.pid] = Math.max(0, base - it.qty);
    });
    setProducts((ps) => ps.map((p) => (newStock[p.id] != null ? { ...p, stock: newStock[p.id] } : p)));
    setMovements((m) => [...items.map((it) => ({ id: uid(), productId: it.pid, type: "out", qty: it.qty, note, at: "Baru saja" })), ...m]);

    const rows = [];
    items.forEach((it) => {
      const p = products.find((x) => x.id === it.pid);
      const est = (p?.cost || 0) * it.qty; // HPP perkiraan lokal; server menghitung FIFO sebenarnya
      const qtyLabel = it.qtyLabel || `${num(it.qty)} ${p?.unit || ""}`.trim();
      // Catatan penjualan untuk tampilan lokal (ts asli agar grafik & laporan benar
      // walau baru tersinkron nanti).
      setSalesLog((sl) => [{
        id: uid(), productId: it.pid, qty: it.qty, revenue: it.revenue, cost: est, date: saleDate,
        ts: Date.now(), txnId: ctx.txnId || null, cashier: ctx.cashier || null, method: ctx.method || null,
        shiftId: ctx.shiftId || null, qtyLabel, receiptNo: ctx.receiptNo || null, payments: ctx.payments || null,
      }, ...sl]);
      // Titip jual di mode lokal (tanpa server) dicatat langsung; di mode server,
      // kewajiban setor dibuat oleh RPC saat paket tersinkron.
      if (!hasSupabase && p?.isConsign) {
        setConsigns((cs) => [{
          id: uid(), productId: it.pid, productName: p?.name || "—", supplier: p?.supplier || "",
          txnId: ctx.txnId || null, qty: it.qty, amount: est, status: "belum", paidAt: null, ts: Date.now(),
        }, ...cs]);
      }
      // Baris untuk server (snake_case, TANPA cost — server yang mengisi HPP FIFO).
      rows.push({
        product_id: it.pid, qty: it.qty, revenue: it.revenue, date: saleDate,
        txn_id: ctx.txnId || null, cashier: ctx.cashier || null, method: ctx.method || null,
        qty_label: qtyLabel, receipt_no: ctx.receiptNo || null,
        shift_id: ctx.shiftId || null, payments: ctx.payments || null,
      });
    });

    // 1b) PELANGGAN. Dicatat untuk SETIAP transaksi (bukan hanya hutang) bila
    // kasir mengisi/memilih pelanggan. Layar diperbarui seketika supaya nama
    // langsung bisa dipilih lagi di transaksi berikutnya, lalu dikirim lewat
    // antrean terpisah — gagal/lambat di sini tidak pernah mengganggu penjualan.
    const cust = ctx.customer && String(ctx.customer.name || ctx.customer.phone || "").trim() ? ctx.customer : null;
    if (cust && ctx.txnId) {
      const amount = items.reduce((a, it) => a + (Number(it.revenue) || 0), 0);
      const key = custKey(cust);
      const existing = customersRef.current.find((c) => custKey(c) === key);
      // Id sementara SENGAJA diturunkan dari kunci identitas, bukan angka acak.
      // Kalau kasir menjual dua kali beruntun ke pelanggan yang sama sebelum
      // layar sempat menyegarkan, kedua kunjungan tetap menunjuk ke satu orang.
      const localId = existing?.id || `tmp-${key}`;
      // Perbarui daftar di layar (tambah baru / naikkan hitungan yang sudah ada)
      setCustomers((cs) => {
        const i = cs.findIndex((c) => custKey(c) === key);
        const base = i >= 0 ? cs[i] : {
          id: localId, name: "", business: "", phone: "", kind: "individu", note: "",
          txnCount: 0, totalSpent: 0, firstTxnAt: null, lastTxnAt: null, ts: Date.now(),
        };
        const merged = {
          ...base,
          name: cust.name || base.name,
          business: cust.business || base.business,
          phone: cust.phone || base.phone,
          kind: (cust.business || base.business) ? "bisnis" : (cust.kind || base.kind),
          txnCount: (base.txnCount || 0) + 1,
          totalSpent: (base.totalSpent || 0) + amount,
          firstTxnAt: base.firstTxnAt || Date.now(),
          lastTxnAt: Date.now(),
        };
        return i >= 0 ? cs.map((c, j) => (j === i ? merged : c)) : [merged, ...cs];
      });
      setCustVisits((vs) => [{
        txnId: ctx.txnId, customerId: localId, amount, pickedBy: cust.pickedBy || "",
        cashier: ctx.cashier || "", method: ctx.method || "", at: Date.now(),
      }, ...vs]);
      if (hasSupabase) {
        enqueueCustomer({
          txnId: ctx.txnId,
          name: cust.name || "", business: cust.business || "", phone: cust.phone || "",
          kind: cust.kind || "individu", pickedBy: cust.pickedBy || "",
          amount, at: soldAt, cashier: ctx.cashier || null, method: ctx.method || null,
          attempts: 0,
        });
      }
    }

    // 2) Mode server → titip ke antrean (idempoten + atomik). Mode lokal → cukup di memori.
    if (hasSupabase) {
      enqueueTxn({
        clientId: clientTxnId(),
        note,
        soldAt,
        rows,
        debt: ctx.debt || null,           // bon (bila metode = hutang) — atomik bersama penjualan
        localDebtId: ctx.debt?.id || null, // untuk menyelaraskan nomor bon bila server memberi nomor lain
        attempts: 0,
      });
    }
  };

  // ===== Hapus transaksi (mode manajer) =====
  // Stok dikembalikan (batch FIFO baru dengan modal = HPP saat terjual),
  // pergerakan tercatat, kewajiban titip jual yang belum disetor ikut terhapus.
  const voidTxn = async (t) => {
    if (hasSupabase) {
      beginSync(); // pagar: refresh berkala tidak boleh menyela pembatalan
      try { await Sales.voidTxn(t.txnId); }
      catch (e) { console.error("[void]", e); flash("Gagal menghapus transaksi — cek koneksi"); return false; }
      finally { endSync(); }
    }
    setSalesLog((sl) => sl.filter((s) => s.txnId !== t.txnId));
    setMovements((m) => [
      ...(t.items || []).filter((it) => it.pid).map((it) => ({ id: uid(), productId: it.pid, type: "in", qty: it.qty, note: "Pembatalan transaksi", at: "Baru saja" })),
      ...m,
    ]);
    setConsigns((cs) => cs.filter((c) => !(c.txnId === t.txnId && c.status === "belum")));
    if (hasSupabase) {
      // Mode server: angka stok pasca-pembatalan diambil langsung dari database.
      // Menambah manual dari layar (stok layar + qty) rawan salah bila layar basi —
      // hasilnya angka "melompat" sesaat lalu berubah lagi.
      await refreshProducts(true);
    } else {
      const back = {};
      (t.items || []).forEach((it) => { if (it.pid) back[it.pid] = (back[it.pid] || 0) + it.qty; });
      setProducts((ps) => ps.map((p) => (back[p.id] ? { ...p, stock: p.stock + back[p.id] } : p)));
    }
    flash("Transaksi dihapus — stok dikembalikan");
    return true;
  };

  // ===== Retur & tukar barang =====
  // ATOMIK + idempoten di server (satu RPC process_return): barang MASIH BAIK kembali
  // sebagai batch FIFO (modal = HPP saat terjual), barang RUSAK/KEDALUWARSA tidak kembali
  // ke stok (kerugian tercatat), barang pengganti dipotong FIFO. Uang net dicatat lewat
  // metode 'settlement' pada baris ber-shift_id, jadi cocokan kas & akuntansi otomatis benar.
  const applyReturnLocal = (pl) => {
    // Mode tanpa server (seed/demo): terapkan efek sederhana ke memori.
    const patch = {};
    (pl.returns || []).forEach((r) => { if (r.restock) patch[r.productId] = (patch[r.productId] || 0) + r.qty; });
    (pl.exchanges || []).forEach((e) => { patch[e.productId] = (patch[e.productId] || 0) - e.qty; });
    setProducts((ps) => ps.map((p) => (patch[p.id] != null ? { ...p, stock: Math.max(0, p.stock + patch[p.id]) } : p)));
    const rows = [];
    (pl.returns || []).forEach((r) => rows.push({ id: uid(), productId: r.productId, qty: -r.qty, revenue: -(r.qty * r.unitPrice), cost: r.restock ? -(r.qty * r.unitCost) : 0, date: pl.date, ts: Date.now(), txnId: pl.returnNo, cashier: pl.cashier, method: pl.settlement, qtyLabel: `Retur ${num(r.qty)}`, receiptNo: pl.returnNo, shiftId: pl.shiftId }));
    (pl.exchanges || []).forEach((e) => { const p = pById(e.productId); rows.push({ id: uid(), productId: e.productId, qty: e.qty, revenue: e.qty * e.unitPrice, cost: (p?.cost || 0) * e.qty, date: pl.date, ts: Date.now(), txnId: pl.returnNo, cashier: pl.cashier, method: pl.settlement, qtyLabel: `Tukar ${num(e.qty)}`, receiptNo: pl.returnNo, shiftId: pl.shiftId }); });
    setSalesLog((sl) => [...rows, ...sl]);
    const refundTotal = (pl.returns || []).reduce((a, r) => a + r.qty * r.unitPrice, 0);
    const exchangeTotal = (pl.exchanges || []).reduce((a, e) => a + e.qty * e.unitPrice, 0);
    setReturns((rs) => [{
      id: uid(), returnNo: pl.returnNo, originalTxnId: pl.originalTxnId, kind: exchangeTotal > 0 ? "exchange" : "refund",
      reason: pl.reason, settlement: pl.settlement, refundTotal, exchangeTotal, netAmount: exchangeTotal - refundTotal, costDelta: 0,
      cashier: pl.cashier, shiftId: pl.shiftId, note: pl.note || "", ts: Date.now(),
      items: [
        ...(pl.returns || []).map((r) => ({ productId: r.productId, productName: pById(r.productId)?.name || "—", direction: "in", qty: r.qty, unitPrice: r.unitPrice, lineTotal: r.qty * r.unitPrice, unitCost: r.unitCost, costTotal: r.qty * r.unitCost, restock: r.restock, condition: r.condition, reason: r.reason })),
        ...(pl.exchanges || []).map((e) => ({ productId: e.productId, productName: pById(e.productId)?.name || "—", direction: "out", qty: e.qty, unitPrice: e.unitPrice, lineTotal: e.qty * e.unitPrice, unitCost: pById(e.productId)?.cost || 0, costTotal: (pById(e.productId)?.cost || 0) * e.qty, restock: false, condition: null, reason: null })),
      ],
    }, ...rs]);
  };

  const processReturn = async (payload, receipt) => {
    const full = { ...payload, cashier: cashierName || "Kasir", shiftId: shift?.id || null };
    const refund = (full.returns || []).reduce((a, r) => a + r.qty * r.unitPrice, 0);
    const exch = (full.exchanges || []).reduce((a, e) => a + e.qty * e.unitPrice, 0);
    const net = exch - refund;
    const doneFlash = () => flash(
      exch > 0
        ? (net >= 0 ? `Tukar barang berhasil — pelanggan bayar ${rp(net)}` : `Tukar barang berhasil — kembalikan ${rp(-net)} ke pelanggan`)
        : `Retur berhasil — kembalikan ${rp(refund)} ke pelanggan`
    );
    if (!hasSupabase) {
      applyReturnLocal(full);
      showReceipt(receipt);
      doneFlash();
      return { status: "ok", local: true };
    }
    beginSync(); // pagar: refresh berkala tidak boleh menyela penulisan retur
    let res;
    try {
      res = await ReturnsApi.create(full);
    } catch (e) {
      console.error("[retur]", e);
      flash(e?.message || "Gagal memproses retur — cek koneksi & coba lagi");
      return { status: "error", error: e };
    } finally { endSync(); }
    // Tarik kondisi resmi dari database (stok, penjualan, buku retur) supaya layar = kenyataan.
    await Promise.all([
      refreshProducts(true),
      ReturnsApi.list({ limit: 300 }).then(setReturns).catch(() => {}),
      Sales.list({ sinceDays: cfgSistem().salesDays }).then(setSalesLog).catch(() => {}),
    ]);
    if (res?.status === "duplicate") { flash("Retur ini sudah pernah diproses"); return res; }
    showReceipt(receipt);
    doneFlash();
    return res || { status: "ok" };
  };

  // ===== Setoran titip jual: pembayaran (bisa bertahap) ke distributor =====
  // Jumlah yang disetor dialokasikan ke kewajiban TERTUA dulu (barang yang paling
  // lama laku). Bisa bayar sebagian — sisanya tetap tercatat sebagai kewajiban.
  const payConsign = (supplier, amount, note) => {
    const sup = supplier || "";
    const paidAt = today;
    const amt = Math.max(0, Math.round(Number(amount) || 0));
    if (amt <= 0) return;
    // Optimistis: alokasi lokal (tertua dulu) supaya UI langsung berubah
    setConsigns((cs) => {
      const queue = cs
        .filter((c) => (c.supplier || "") === sup && c.status === "belum" && c.amount > (c.paidAmount || 0))
        .sort((a, b) => (a.ts || 0) - (b.ts || 0) || String(a.id).localeCompare(String(b.id)));
      let rem = amt;
      const patch = {};
      for (const c of queue) {
        if (rem <= 0) break;
        const apply = Math.min(rem, c.amount - (c.paidAmount || 0));
        const np = (c.paidAmount || 0) + apply;
        patch[c.id] = np >= c.amount
          ? { paidAmount: c.amount, status: "lunas", paidAt }
          : { paidAmount: np };
        rem -= apply;
      }
      return cs.map((c) => (patch[c.id] ? { ...c, ...patch[c.id] } : c));
    });
    // Optimistis: catat baris riwayat setoran
    const tempId = uid();
    setConsignPayments((ps) => [{ id: tempId, supplier: sup, amount: amt, paidAt, note: note || "", ts: Date.now() }, ...ps]);
    flash(`Setoran ${rp(amt)} ke ${sup || "distributor"} dicatat`);
    // Simpan ke server + selaraskan dengan kondisi resmi database (alokasi otoritatif)
    if (hasSupabase) {
      persist(async () => {
        await Consign.pay(sup, amt, paidAt, note || null);
        const [cg, cp] = await Promise.all([Consign.list(), Consign.payments()]);
        setConsigns(cg); setConsignPayments(cp);
      });
    }
  };

  const logout = () => { if (hasSupabase) Auth.signOut(); clearCashierSession(); setRole(null); setSidebarOpen(false); setShiftReport(null); setShift(null); setShiftCashMoves([]); setShiftCash(""); setShiftNote(""); setCashierName(""); loadedRef.current = false; };

  // Ringkasan shift kasir (anti-kecurangan): transaksi kasir ini sejak login
  const buildShiftReport = () => {
    const mine = salesLog.filter((s) => s.txnId && (shift?.id
      ? s.shiftId === shift.id
      : (s.cashier === cashierName && (s.ts == null || s.ts >= (shiftStart || 0)))));
    // Kelompokkan per transaksi supaya pembayaran campur dihitung sekali per txn,
    // lalu pecah ke metode aslinya (bukan "Campur") agar kas laci akurat.
    const map = {};
    mine.forEach((s) => {
      if (!map[s.txnId]) map[s.txnId] = { total: 0, qty: 0, method: s.method || "-", payments: null };
      const t = map[s.txnId];
      t.total += s.revenue; t.qty += s.qty;
      if (!t.payments && s.payments && s.payments.length) t.payments = s.payments;
    });
    const txs = Object.values(map);
    const byMethod = {};
    txs.forEach((t) => {
      if (t.payments) t.payments.forEach((p) => { byMethod[p.method] = (byMethod[p.method] || 0) + (Number(p.amount) || 0); });
      else byMethod[t.method] = (byMethod[t.method] || 0) + t.total;
    });
    const total = txs.reduce((a, t) => a + t.total, 0);
    const items = txs.reduce((a, t) => a + t.qty, 0);
    return { cashier: cashierName, start: shiftStart, count: txs.length, total, items, byMethod, cash: byMethod.cash || 0 };
  };
  const requestLogout = () => {
    // Kasir tidak bisa keluar begitu saja: WAJIB tutup shift dengan hitungan kas fisik.
    if (role === "cashier") { setShiftCash(""); setShiftNote(""); setShiftReport({ stage: "count", report: buildShiftReport() }); }
    else logout();
  };

  // ===== Tutup shift (blind count) =====
  // Kasir mengetik jumlah uang fisik DULU tanpa pernah melihat "seharusnya berapa".
  // Server (close_shift) menghitung penjualan tunai + kas lain-lain shift ini,
  // MENGUNCI hasilnya, baru selisih ditampilkan. Kasir yang jujur tidak terganggu;
  // yang berniat curang tidak bisa lagi "menyesuaikan" angka dengan layar.
  const submitCloseShift = async () => {
    if (!shiftReport || shiftReport.stage !== "count" || closingBusy) return;
    if (shiftCash === "") { flash("Isi dulu jumlah uang tunai hasil hitungan fisik"); return; }
    const counted = Number(String(shiftCash).replace(/\D/g, "")) || 0;
    setClosingBusy(true);
    try {
      // WAJIB sinkron dulu: "seharusnya di laci" dihitung SERVER. Bila masih ada
      // transaksi offline yang belum terkirim, angka itu akan KURANG dari kenyataan
      // dan cocokan kas jadi salah. Coba kuras antrean; bila belum bisa (masih
      // offline), tolak menutup shift dan minta sambungkan internet dulu.
      if (hasSupabase && outboxRef.current.length) {
        await flushOutbox();
        if (outboxRef.current.length) {
          setClosingBusy(false);
          flash(`Belum bisa tutup shift: ${outboxRef.current.length} transaksi belum tersinkron. Sambungkan internet dulu agar cocokan kas akurat.`);
          return;
        }
      }
      // beri kesempatan penulisan stok terakhir selesai tersimpan (maks ~4 detik)
      for (let i = 0; i < 20 && pendingSyncRef.current > 0; i++) await new Promise((r) => setTimeout(r, 200));
      let closed = null;
      if (hasSupabase && shift?.id) {
        closed = await Shifts.close(shift.id, counted, (shiftNote || "").trim() || null);
      } else {
        const cash = (shiftReport.report?.byMethod?.cash) || 0;
        const moves = shiftCashMoves.reduce((a, m) => a + (m.type === "in" ? m.amount : -m.amount), 0);
        const expected = (shift?.openingCash || 0) + cash + moves;
        closed = { ...(shift || {}), status: "closed", closedAt: Date.now(), cashSales: cash, cashMoves: moves, expectedCash: expected, closingCash: counted, variance: counted - expected, note: (shiftNote || "").trim() || null };
      }
      setShiftReport((r) => ({ ...r, stage: "result", shift: closed }));
      setShift((sh) => (sh ? { ...sh, status: "closed" } : sh));
    } catch (e) {
      console.error("[shift]", e);
      flash("Gagal menutup shift — periksa koneksi lalu coba lagi");
    }
    setClosingBusy(false);
  };

  const addProduct = async (data) => {
    const code = nextCode(products);
    const initialStock = Number(data.stock) || 0;
    if (hasSupabase) {
      beginSync(); // pagar: tarikan daftar produk yang menyela bisa belum memuat barang baru
      // 1) Buat barang di katalog dulu (stok awal dicatat terpisah sebagai batch FIFO).
      let row;
      try {
        row = await Products.create({ code, ...data, stock: 0 });
      } catch (e) {
        console.error("[sync]", e);
        endSync();
        // Bila SERVER menolak (mis. akun kasir belum diberi izin menambah barang),
        // beri pesan yang jelas & bisa ditindaklanjuti — bukan galat mentah.
        const denied = e?.code === "42501" || /permission|policy|row-level|not allowed|denied|forbidden/i.test(e?.message || "");
        flash(denied
          ? "Akun ini belum diizinkan menambah barang baru di server — hubungi manajer untuk mengaktifkannya."
          : `Gagal menambah barang — ${e?.message || "cek koneksi"}`);
        return;
      }
      // 2) Stok awal → batch FIFO pertama (atomik di server). Bila langkah ini gagal,
      // barang TETAP sudah dibuat: tampilkan apa adanya (stok 0) supaya layar = server,
      // dan arahkan mengisi stok lewat tombol "Masuk".
      let stockOk = true;
      if (initialStock > 0) {
        try { await Products.stockIn(row.id, initialStock, Number(data.cost) || 0, "Stok awal"); }
        catch (e) { console.error("[sync]", e); stockOk = false; }
      }
      setProducts((ps) => [{ ...row, stock: stockOk ? initialStock : 0 }, ...ps]);
      endSync();
      flash(stockOk
        ? `Barang ${code} ditambahkan`
        : `Barang ${code} dibuat, tapi stok awal gagal dicatat — buka tombol "Masuk" untuk mengisi stoknya`);
      return;
    }
    setProducts((ps) => [{ id: uid(), code, ...data }, ...ps]);
    flash(`Barang ${code} ditambahkan`);
  };

  const updateProduct = (id, data) => {
    const prev = products.find((p) => p.id === id);
    const target = Number(data.stock);
    const adjust = prev && Number.isFinite(target) && target !== prev.stock;
    // Stok pada state lokal dijaga tetap NUMERIK: pakai target bila ada penyesuaian,
    // selain itu pertahankan angka lama (nilai mentah form bisa berupa string).
    const merged = { ...prev, ...data, stock: adjust ? target : (prev?.stock ?? 0) };
    // ===== Penyesuaian stok = ABSOLUT, bukan selisih dari layar =====
    // Dulu: selisih dihitung terhadap angka di layar perangkat ini (prev.stock) yang
    // bisa basi berjam-jam (perangkat lain sudah jualan) → hasil akhir di database
    // meleset persis sebesar penjualan yang tak terlihat. Ini biang keladi utama
    // "sudah diinput tapi stok tetap tidak cocok".
    // Sekarang: target hitungan fisik dikirim apa adanya; SERVER yang membandingkan
    // dengan stok database saat itu juga (baris dikunci), lalu menambah/memotong
    // batch FIFO + mencatat riwayat dalam SATU transaksi (RPC set_stock_absolute).
    if (adjust) {
      setMovements((m) => [
        { id: uid(), productId: id, type: target > prev.stock ? "in" : "out", qty: Math.abs(target - prev.stock), note: "Penyesuaian (edit barang)", at: "Baru saja" },
        ...m,
      ]);
      persist(async () => {
        beginSync(); // pagar: refresh berkala tidak boleh menyela penulisan opname
        try {
          const st = await Products.setStockAbsolute(id, target, Number(data.cost) || prev.cost || null, "Penyesuaian (edit barang)");
          if (st != null) setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, stock: Number(st) } : p)));
        } finally { endSync(); }
      });
    }
    setProducts((ps) => ps.map((p) => (p.id === id ? merged : p)));
    // Kolom stok TIDAK ditulis langsung — sepenuhnya dikelola RPC FIFO di atas
    persist(() => Products.updateInfo(id, merged));
    flash("Barang diperbarui");
  };

  const deleteProduct = (id) => {
    const p = products.find((x) => x.id === id);
    setProducts((ps) => ps.filter((x) => x.id !== id));
    persist(() => Products.remove(id));
    flash(`${p?.code || "Barang"} dihapus`);
  };

  const createOrder = async (data) => {
    const total = data.items.reduce((a, it) => a + (pById(it.pid)?.price || 0) * it.qty, 0);
    const id = nextOrderId(orders);
    const order = { id, customer: data.customer, phone: data.phone, channel: data.channel, payMethod: data.payMethod || "transfer", status: "baru", items: data.items, total, at: "Baru saja" };
    setOrders((os) => [order, ...os]);
    if (hasSupabase) { try { await OrdersApi.create(order); } catch (e) { console.error("[sync]", e); flash("Order tersimpan lokal — gagal ke server"); } }
    flash(`Order ${id} dibuat`);
  };

  // ===== Akuntansi =====
  const addCapital = async (e) => {
    if (hasSupabase) { try { const row = await Capital.create(e); setCapital((c) => [{ id: row.id, ...e }, ...c]); return; } catch (err) { console.error("[sync]", err); } }
    setCapital((c) => [{ id: uid(), ...e }, ...c]);
  };
  const updateCapital = (id, e) => { setCapital((c) => c.map((x) => (x.id === id ? { ...x, ...e } : x))); persist(() => Capital.update(id, e)); };
  const deleteCapital = (id) => { setCapital((c) => c.filter((x) => x.id !== id)); persist(() => Capital.remove(id)); };
  const addExpense = async (e) => {
    if (hasSupabase) { try { const row = await Expenses.create(e); setExpenses((x) => [{ id: row.id, ...e }, ...x]); return; } catch (err) { console.error("[sync]", err); } }
    setExpenses((x) => [{ id: uid(), ...e }, ...x]);
  };
  const updateExpense = (id, e) => { setExpenses((x) => x.map((y) => (y.id === id ? { ...y, ...e } : y))); persist(() => Expenses.update(id, e)); };
  const deleteExpense = (id) => { setExpenses((x) => x.filter((y) => y.id !== id)); persist(() => Expenses.remove(id)); };
  // Setoran kas -> rekening (pindah aset, bukan biaya; tidak menyentuh laba/shift)
  const addCashDeposit = async (d) => {
    if (hasSupabase) { try { const row = await CashDeposits.create(d); setCashDeposits((x) => [row, ...x]); return; } catch (err) { console.error("[sync]", err); } }
    setCashDeposits((x) => [{ id: uid(), ...d }, ...x]);
  };
  const updateCashDeposit = (id, d) => { setCashDeposits((x) => x.map((y) => (y.id === id ? { ...y, ...d } : y))); persist(() => CashDeposits.update(id, d)); };
  const deleteCashDeposit = (id) => { setCashDeposits((x) => x.filter((y) => y.id !== id)); persist(() => CashDeposits.remove(id)); };

  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  // Bangun objek bon + tampilkan seketika di daftar hutang, lalu KEMBALIKAN objeknya.
  // Penulisan ke server TIDAK dilakukan di sini: bon dititipkan ke paket penjualan
  // (antrean offline) agar tersimpan ATOMIK bersama transaksi & tahan internet putus.
  const buildDebt = (meta, total) => {
    const debt = {
      id: nextDebtId(debts),
      debtor: meta.debtor || "Pelanggan", business: meta.business || "", phone: meta.phone || "",
      items: meta.items || [], total, date: today, status: "belum", paidAt: null,
    };
    setDebts((ds) => [debt, ...ds]);
    return debt;
  };
  // Bon di luar alur kasir (mode lokal tanpa server): tulis langsung seperti biasa.
  const addDebt = (meta, total) => {
    const debt = buildDebt(meta, total);
    if (hasSupabase) persist(() => DebtsApi.create(debt));
    return debt;
  };
  const settleDebt = (id, method = "cash") => {
    const d = debts.find((x) => x.id === id);
    setDebts((ds) => ds.map((x) => (x.id === id ? { ...x, status: "lunas", paidAt: today, paidMethod: method } : x)));
    persist(() => DebtsApi.settle(id, today, method));
    // Pelunasan bon TUNAI = uang masuk laci. Tanpa pencatatan ini, kas fisik akan
    // "lebih" dari hitungan sistem saat tutup shift dan selisihnya bisa dikantongi
    // tanpa ketahuan. Dicatat ke shift yang sedang buka (server ikut menghitungnya
    // dalam "seharusnya di laci").
    if (method === "cash" && role === "cashier" && shift?.id) {
      const amt = Number(d?.total) || 0;
      if (amt > 0) {
        setShiftCashMoves((ms) => [...ms, { type: "in", amount: amt, note: `Pelunasan bon ${id}` }]);
        if (hasSupabase) persist(() => Shifts.cashMove(shift.id, "in", amt, `Pelunasan bon ${id}`));
      }
    }
    flash("Hutang ditandai lunas");
  };
  const deleteDebt = (id) => {
    setDebts((ds) => ds.filter((d) => d.id !== id));
    persist(() => DebtsApi.remove(id));
    flash("Catatan hutang dihapus");
  };

  // ===== Cetak nota =====
  // Pratinjau nota usai transaksi bisa dimatikan (Pengaturan → Nota) untuk toko
  // yang tidak selalu mencetak struk — nota tetap tersimpan & bisa dicetak ulang
  // dari Riwayat Penjualan kapan saja.
  const showReceipt = (data) => {
    if (!data) return;
    setPrintReceipt(data);
    if (cfgNota().autoPreview) setReceiptModal(true);
  };
  const nowStamp = () => new Date().toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const triggerPrint = (data) => {
    if (printCfg.method === "bluetooth") {
      printViaBluetooth(printCfg, data)
        .then(() => flash("Struk terkirim ke printer Bluetooth"))
        .catch((e) => { console.error(e); flash((e && e.message) ? e.message : "Bluetooth gagal — pakai dialog browser"); setPrintReceipt(data); setTimeout(() => window.print(), 80); });
      return;
    }
    if (printCfg.method === "serial") {
      printViaSerial(printCfg, data)
        .then(() => flash("Nota dikirim ke printer"))
        .catch((e) => { flash("Cetak langsung gagal — pakai dialog browser"); setPrintReceipt(data); setTimeout(() => window.print(), 80); });
      return;
    }
    setPrintReceipt(data);
    setTimeout(() => window.print(), 80);
  };
  const connectBt = async () => {
    try {
      const dev = await connectBluetoothPrinter();
      setBtName(dev.name || "Printer Bluetooth");
      flash("Printer Bluetooth terhubung");
    } catch (e) {
      console.error(e);
      flash((e && e.message) ? e.message : "Gagal menghubungkan Bluetooth");
    }
  };
  const testPrint = () => triggerPrint({
    kind: "jual", no: "TES-CETAK", date: nowStamp(), cashier: cashierName || "Manajer",
    items: [{ name: "Tes Cetak Struk", qtyLabel: "1", lineTotal: 0 }],
    total: 0, methodLabel: "Tes", paid: 0, change: 0,
  });
  // Nota contoh untuk melihat hasil pengaturan nota sebelum dipakai berjualan.
  // Nomornya memakai awalan yang sedang disetel, jadi ketahuan kalau salah ketik.
  const sampleReceipt = () => ({
    kind: "jual", no: invoiceNo(), date: nowStamp(), cashier: cashierName || "Manajer",
    items: [
      { name: "Dripp Syrup Caramel 760ml", qtyLabel: "1 karton", lineTotal: 690000 },
      { name: "Masterista Powder Original Matcha 800g", qtyLabel: "2 pcs", lineTotal: 390000 },
    ],
    total: 1080000, methodLabel: "Tunai", paid: 1100000, change: 20000,
  });
  const buildSaleReceipt = (total, method, meta, no) => {
    return {
      kind: method === "hutang" ? "hutang" : "jual",
      no: no || invoiceNo(), date: nowStamp(), cashier: cashierName || "Kasir",
      items: meta.items || [], total, methodLabel: PAY_LABEL[method] || method,
      paid: meta.paid, change: meta.change,
      payments: meta.payments || null,   // net (jumlah = total) — sama seperti yang diarsip
      paidParts: meta.paidParts || null, // gross (yang diserahkan pelanggan) — untuk tampilan nota
      debtor: meta.debtor, business: meta.business, phone: meta.phone,
      pickedBy: meta.customer?.pickedBy || "",   // siapa yang datang mengambil (pelanggan usaha)
      settled: method === "hutang" ? false : undefined, // nota hutang baru = stempel BELUM LUNAS
    };
  };
  const debtToReceipt = (d) => ({
    kind: "hutang", no: d.id, date: d.date, cashier: cashierName || "Kasir",
    items: d.items, total: d.total, debtor: d.debtor, business: d.business, phone: d.phone,
    settled: d.status === "lunas", paidAt: d.paidAt || null,
  });
  // Cetak ulang nota dari Riwayat Penjualan (data direkonstruksi dari log transaksi)
  const txnToReceipt = (t) => ({
    kind: t.method === "hutang" ? "hutang" : "jual",
    no: t.no,
    date: t.ts ? new Date(t.ts).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—",
    cashier: t.cashier || "—",
    items: (t.items || []).map((it) => ({ name: it.name, qtyLabel: it.qtyLabel, lineTotal: it.lineTotal })),
    total: t.total, methodLabel: PAY_LABEL[t.method] || t.method || "—",
    paid: t.total, change: null,
    payments: t.payments || null, // net dari arsip; kembalian tidak tercetak ulang
    reprint: true,
  });
  // Nota retur (dari buku retur) untuk dicetak / dicetak ulang
  const returnToReceipt = (r) => ({
    kind: "retur",
    no: r.returnNo,
    date: r.ts ? new Date(r.ts).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—",
    cashier: r.cashier || "—",
    reasonLabel: RETURN_REASON_LABEL[r.reason] || r.reason || "—",
    items: (r.items || []).filter((it) => it.direction === "in").map((it) => ({ name: it.productName, qtyLabel: `${num(it.qty)}× ${it.restock ? "" : "(rusak) "}`.trim(), lineTotal: it.lineTotal })),
    exItems: (r.items || []).filter((it) => it.direction === "out").map((it) => ({ name: it.productName, qtyLabel: `${num(it.qty)}×`, lineTotal: it.lineTotal })),
    refundTotal: r.refundTotal, exchangeTotal: r.exchangeTotal, net: r.netAmount,
    settlementLabel: r.settlement ? (PAY_LABEL[r.settlement] || r.settlement) : "—",
    reprint: true,
  });

  const applySimulation = (rows) => {
    rows.forEach((r) => {
      if (r.pid && Number(r.qty) > 0)
        recordMovement(r.pid, r.dir, Number(r.qty), r.dir === "in" ? "Simulasi: barang masuk" : "Simulasi: barang keluar");
    });
    flash("Simulasi diterapkan ke stok");
  };

  const lowStock = useMemo(
    () => products.filter((p) => stockStatus(p) !== "ok"),
    [products]
  );
  // Nilai inventory MILIK TOKO: dari harga batch FIFO (server) agar sinkron dengan
  // Akuntansi; barang titipan (milik distributor) tidak dihitung sebagai aset.
  // Fallback: stok × modal terbaru (mode lokal / sebelum data termuat)
  const localInvValue = useMemo(
    () => products.reduce((a, p) => a + (p.isConsign ? 0 : p.cost * p.stock), 0),
    [products]
  );
  const [inventoryValue, setInventoryValue] = useState(0);
  useEffect(() => {
    setInventoryValue(localInvValue);
    if (!hasSupabase) return;
    let alive = true;
    Products.inventoryValue().then((v) => { if (alive) setInventoryValue(v); }).catch(() => {});
    return () => { alive = false; };
  }, [localInvValue]);
  const newOrders = orders.filter((o) => o.status === "baru").length;
  const unpaidDebts = debts.filter((d) => d.status === "belum").length;

  // Chart 7 hari + penjualan hari ini, dari transaksi nyata (txnId terisi)
  const salesChart = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const dd = new Date(now); dd.setDate(now.getDate() - i);
      days.push({ key: dd.toDateString(), d: dd.toLocaleDateString("id-ID", { weekday: "short" }), v: 0 });
    }
    const map = Object.fromEntries(days.map((x) => [x.key, x]));
    salesLog.forEach((s) => {
      if (!s.txnId || s.ts == null) return;
      const k = new Date(s.ts).toDateString();
      if (map[k]) map[k].v += s.revenue;
    });
    return days;
  }, [salesLog]);
  const todayRev = salesChart[6]?.v || 0;
  const yRev = salesChart[5]?.v || 0;
  const deltaPct = yRev ? Math.round(((todayRev - yRev) / yRev) * 100) : 0;

  if (!role) {
    // Mode offline/demo (tanpa Supabase): tetap pakai gerbang PIN lama
    if (!hasSupabase) {
      return (
        <>
          <Style />
          <RoleGate onEnter={(r, name, opening) => { const start = Date.now(); setRole(r); setView(r === "manager" ? "dashboard" : "kasir"); setCashierName(r === "manager" ? "Manajer" : (name || "Kasir")); setShiftStart(start); if (r === "cashier") { const sh = { id: uid(), cashier: name || "Kasir", status: "open", openedAt: start, openingCash: Number(opening) || 0 }; setShift(sh); setShiftCashMoves([]); saveCashierSession(name || "Kasir", start, null, sh.id); } }} pin={store.pin || MANAGER_PIN} />
        </>
      );
    }
    // Online: autentikasi sungguhan
    if (!authReady) return (<><Style /><AuthSplash /></>);
    if (!session) return (<><Style /><PendingRescue /><Login flash={flash} /></>);
    if (profileRole === "cashier") {
      return (
        <>
          <Style />
          <CashierNameGate
            onEnter={async (name, opening) => {
              // Shift dibuka DI SERVER: user_id, jam buka, dan modal awal tercatat permanen
              // (baris shift tidak bisa diubah/dihapus dari klien — hanya RPC).
              let sh = null;
              try { sh = await Shifts.open(name || "Kasir", Number(opening) || 0); }
              catch (e) { console.error("[shift]", e); flash("Gagal membuka shift — periksa koneksi lalu coba lagi"); return; }
              setShift(sh); setShiftCashMoves([]);
              setRole("cashier"); setCashierName(sh.cashier); setShiftStart(sh.openedAt || Date.now()); setView("kasir");
              saveCashierSession(sh.cashier, sh.openedAt || Date.now(), session?.user?.id, sh.id);
            }}
            onBack={() => { clearCashierSession(); Auth.signOut(); }}
          />
        </>
      );
    }
    return (<><Style /><AuthSplash /></>);
  }

  return (
    <div className="app">
      <Style />

      {sidebarOpen && <div className="drawer-scrim" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <img className="brand-logo" src={LOGO} alt="Conflux" />
          <div className="brand-text">
            <div className="brand-name">Coffee Club</div>
            <div className="brand-sub">Manajemen Toko</div>
          </div>
        </div>

        <nav className="nav">
          {NAV_GROUPS.map((group) => {
            // Item yang boleh dilihat peran saat ini. Grup tanpa item apa pun
            // (mis. grup khusus manajer saat login sebagai kasir) tidak dirender —
            // termasuk judulnya — agar sidebar tetap ringkas.
            const items = group.items.filter((n) => n.roles.includes(role));
            if (items.length === 0) return null;
            return (
              <div key={group.title} className="nav-group">
                <div className="nav-group-title">{group.title}</div>
                {items.map((n) => {
                  const Icon = n.icon;
                  const active = view === n.key;
                  const badge = n.key === "order" ? newOrders : n.key === "restok" ? lowStock.length : n.key === "hutang" ? unpaidDebts : 0;
                  return (
                    <button
                      key={n.key}
                      className={`nav-item ${active ? "active" : ""}`}
                      onClick={() => { setView(n.key); setSidebarOpen(false); }}
                    >
                      <Icon size={18} strokeWidth={2} />
                      <span>{n.label}</span>
                      {badge > 0 && <span className="nav-badge">{badge}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          <div className={`role-badge ${role}`}>
            {role === "manager" ? <ShieldCheck size={14} /> : <ShoppingCart size={14} />}
            {role === "manager" ? "Mode Manajer" : `Kasir: ${cashierName || "—"}`}
          </div>
          <button className="logout-btn" onClick={requestLogout}><LogOut size={15} /> Keluar / ganti</button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="icon-btn only-mobile" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="topbar-title">
            <h1>{NAV.find((n) => n.key === view)?.label}</h1>
          </div>
          <div className="topbar-right">
            {managerMode && cfgStok().lowStockAlert && lowStock.length > 0 && (
              <button className="alert-chip" onClick={() => setView("restok")}>
                <Bell size={15} /> {lowStock.length} perlu re-stok
              </button>
            )}
            {/* Manajer: buka halaman Pengaturan lengkap. Kasir: hanya pengaturan
                printer perangkat ini — aturan toko tidak boleh diubah dari kasir. */}
            <button
              className="icon-btn"
              title={managerMode ? "Pengaturan" : "Pengaturan printer perangkat ini"}
              onClick={() => (managerMode ? setView("pengaturan") : setSettingsOpen(true))}
            ><Settings size={19} /></button>
          </div>
        </header>

        <div className="content">
          <SyncBanner
            online={online} syncing={syncing} pending={pendingCount} dead={deadCount} diag={syncDiag}
            onRetry={flushOutbox}
            onOpenDiag={() => setDiagOpen(true)}
          />
          <SyncDiagModal
            open={diagOpen} onClose={() => setDiagOpen(false)}
            pending={pendingList} deadList={deadList} diag={syncDiag}
            online={online} syncing={syncing}
            onRetry={flushOutbox} onRefreshAuth={refreshAndFlush} onRetryDead={retryDead}
            onExport={exportQueue} onImport={importQueue}
          />
          {view === "dashboard" && (
            <Dashboard
              products={products} chart={salesChart} todayRev={todayRev} deltaPct={deltaPct} lowStock={lowStock}
              inventoryValue={inventoryValue} newOrders={newOrders}
              movements={movements} pById={pById} setView={setView}
            />
          )}
          {view === "riwayat" && (
            <SalesHistory
              salesLog={salesLog} products={products} managerMode={managerMode}
              onPrint={(t) => triggerPrint(txnToReceipt(t))}
              onVoid={voidTxn} pendingTxnIds={pendingTxnIds}
            />
          )}
          {view === "retur" && (
            <ReturnsView
              products={products} salesLog={salesLog} returns={returns} managerMode={managerMode}
              cashierName={cashierName} onSubmit={processReturn}
              onPrint={(r) => triggerPrint(returnToReceipt(r))} flash={flash}
            />
          )}
          {view === "shiftlog" && managerMode && <ShiftLog flash={flash} />}
          {view === "stok" && (
            <Inventory products={products} movements={movements} pById={pById} managerMode={managerMode}
              onMove={(pid, type, qty, note, cost, expiry) => { recordMovement(pid, type, qty, note, cost, expiry); flash(`Stok ${type === "in" ? "masuk" : "keluar"} dicatat`); }}
              onAdd={addProduct} onUpdate={updateProduct} onDelete={deleteProduct}
              onStockChange={(pid, newStock) => setProducts((ps) => ps.map((p) => (p.id === pid ? { ...p, stock: newStock } : p)))}
              onFlash={flash}
            />
          )}
          {view === "kasir" && (
            <Kasir products={products} customers={customers}
              onCheckout={(lines, total, method, meta) => {
                // Penjaga awal: bila katalog belum termuat (mode server), hentikan sebelum
                // membuat bon lokal maupun memproses apa pun — cegah bon yatim.
                if (hasSupabase && !dataReadyRef.current) {
                  flash("Data toko belum termuat dari server. Sambungkan internet lalu buka ulang aplikasi sebelum berjualan.");
                  return;
                }
                const txnId = uid();
                const no = invoiceNo(); // nomor nota disimpan ke log agar bisa dicetak ulang
                // Bayar dengan hutang: bangun bon lokal DULU, lalu titipkan ke paket
                // penjualan agar bon & transaksi tersimpan atomik (satu RPC) dan sama-sama
                // tahan internet putus. Mode lokal (tanpa server) tetap seperti biasa.
                let debt = null;
                if (method === "hutang") {
                  debt = hasSupabase ? buildDebt(meta, total) : addDebt(meta, total);
                }
                sellItems(
                  (meta.items || []).map((it) => ({ pid: it.pid, qty: it.qty, revenue: it.lineTotal, qtyLabel: it.qtyLabel })),
                  `Penjualan kasir (${PAY_LABEL[method]})`,
                  { txnId, cashier: cashierName || "Kasir", method, receiptNo: no, payments: meta.payments || null, shiftId: shift?.id || null, debt, customer: meta.customer || null }
                );
                if (method === "hutang") flash(`Hutang ${rp(total)} dicatat — ${meta?.debtor || "Pelanggan"}`);
                else if (method === "split") flash(`Pembayaran ${rp(total)} campur (${payListLabel(meta.payments)}) berhasil`);
                else flash(`Pembayaran ${rp(total)} via ${PAY_LABEL[method]} berhasil`);
                showReceipt(buildSaleReceipt(total, method, meta, no));
              }}
            />
          )}
          {view === "order" && (
            <Orders orders={orders} setOrders={setOrders} pById={pById} products={products}
              onStatus={(id, status) => persist(() => OrdersApi.setStatus(id, status))}
              onCreate={createOrder}
              onAccept={(o) => {
                // Data katalog belum termuat → jangan proses (mencegah baris ID produk basi).
                if (hasSupabase && !dataReadyRef.current) {
                  flash("Data toko belum termuat dari server — buka ulang aplikasi sebelum memproses order.");
                  return false;
                }
                // Validasi: semua barang order harus ada di katalog. Bila ada yang hilang
                // (mis. produk dihapus setelah order dibuat), STOP dengan pesan jelas — jangan
                // kirim baris "hantu" yang akan ditolak server DIAM-DIAM lalu di-rollback
                // (itulah sebabnya dulu stok & keuangan gagal masuk).
                const missing = o.items.filter((it) => !pById(it.pid));
                if (missing.length) {
                  flash(`Tidak bisa terima ${o.id}: ada ${missing.length} barang yang sudah tidak ada di katalog. Perbarui order dulu.`);
                  return false;
                }
                const method = o.payMethod || "transfer";
                const txnId = uid();
                // Cara bayar = hutang → buat bon (atomik bersama penjualan), persis seperti kasir.
                let debt = null;
                if (method === "hutang") {
                  const debtItems = o.items.map((it) => { const p = pById(it.pid); return { name: p?.name || "Barang", qtyLabel: `${num(it.qty)} ${p?.unit || ""}`.trim(), lineTotal: (p?.price || 0) * it.qty }; });
                  const dtotal = o.items.reduce((a, it) => a + (pById(it.pid)?.price || 0) * it.qty, 0);
                  const meta = { debtor: o.customer || "Pelanggan", business: "", phone: o.phone || "", items: debtItems };
                  debt = hasSupabase ? buildDebt(meta, dtotal) : addDebt(meta, dtotal);
                }
                sellItems(
                  o.items.map((it) => { const p = pById(it.pid); return { pid: it.pid, qty: it.qty, revenue: (p?.price || 0) * it.qty }; }),
                  `Order ${o.id}`,
                  { txnId, cashier: "Order Online", method, receiptNo: o.id, shiftId: shift?.id || null, debt,
                    customer: String(o.customer || "").trim() ? { name: o.customer, business: "", phone: o.phone || "", kind: "individu" } : null }
                );
                flash(method === "hutang"
                  ? `${o.id} diterima — stok dipotong, dicatat sebagai hutang`
                  : `${o.id} diterima — stok dipotong (${PAY_LABEL[method] || method})`);
              }}
              flash={flash}
            />
          )}
          {view === "restok" && (
            <Restock products={products}
              onReceive={(p, qty, cost) => { recordMovement(p.id, "in", qty, "Penerimaan re-stok", cost); flash(`${qty} ${p.name} masuk stok`); }}
            />
          )}
          {view === "hutang" && (
            <Debts debts={debts} onSettle={settleDebt} onPrint={(d) => triggerPrint(debtToReceipt(d))}
              onDelete={managerMode ? deleteDebt : null} store={store} flash={flash} />
          )}
          {view === "pelanggan" && (
            <CustomersView
              customers={customers} visits={custVisits} salesLog={salesLog} debts={debts}
              products={products} store={store} managerMode={managerMode} pending={custPending}
              onSave={saveCustomer} onDelete={deleteCustomer} onMerge={mergeCustomers}
              onRefresh={refreshCustomers} flash={flash}
            />
          )}
          {view === "titipjual" && (
            <ConsignView products={products} consigns={consigns} payments={consignPayments} onPay={payConsign} setView={setView} />
          )}
          {view === "simulasi" && (
            <Simulation products={products} onApply={applySimulation} />
          )}
          {view === "akuntansi" && (
            <Accounting
              products={products} capital={capital} expenses={expenses} salesLog={salesLog} consigns={consigns} consignPayments={consignPayments} cashDeposits={cashDeposits} flash={flash}
              onAddCapital={addCapital} onUpdateCapital={updateCapital} onDeleteCapital={deleteCapital}
              onAddExpense={addExpense} onUpdateExpense={updateExpense} onDeleteExpense={deleteExpense}
              onAddDeposit={addCashDeposit} onUpdateDeposit={updateCashDeposit} onDeleteDeposit={deleteCashDeposit}
            />
          )}
          {view === "pengaturan" && managerMode && (
            <SettingsView
              store={store} saving={savingCfg} onSave={saveSettings}
              device={device} setDevice={applyDevice}
              btName={btName} onConnect={connectBt} onTest={testPrint}
              onSample={() => triggerPrint(sampleReceipt())}
              products={products} flash={flash}
            />
          )}
        </div>
      </main>

      {/* Preview nota setelah transaksi */}
      <Modal
        open={receiptModal}
        onClose={() => setReceiptModal(false)}
        width={400}
        title={printReceipt?.kind === "retur" ? "Nota Retur" : "Nota Pembayaran"}
        footer={
          <>
            <button className="btn ghost" onClick={() => setReceiptModal(false)}>Tutup</button>
            <button className="btn" onClick={() => triggerPrint(printReceipt)}><Printer size={15} /> Cetak Nota</button>
          </>
        }
      >
        <div className="receipt-preview"><Receipt store={printCfg} data={printReceipt} /></div>
      </Modal>

      {/* Pengaturan printer PERANGKAT INI — ringkas, boleh dibuka kasir.
          Aturan toko (harga, ambang, kategori, dsb.) ada di halaman Pengaturan
          yang khusus manajer. */}
      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        width={480}
        title="Printer Perangkat Ini"
        footer={<button className="btn" onClick={() => setSettingsOpen(false)}><Check size={15} /> Selesai</button>}
      >
        <DevicePrinter
          device={device} setDevice={applyDevice} store={store}
          btName={btName} onConnect={connectBt} onTest={testPrint} managerMode={managerMode}
        />
      </Modal>

      {/* Layer tersembunyi khusus untuk dicetak */}
      <div id="receipt-print">
        <style>{`@media print{@page{size:${printCfg.paper === 80 ? "80mm" : "58mm"} auto;margin:0}}`}</style>
        <Receipt store={printCfg} data={printReceipt} />
      </div>

      <Modal
        open={!!shiftReport}
        onClose={() => {
          if (!shiftReport) return;
          if (shiftReport.stage === "result") logout();            // hasil sudah terkunci — keluar
          else if (!closingBusy) setShiftReport(null);             // batal: shift tetap berjalan
        }}
        width={460}
        title={shiftReport?.stage === "result" ? "Shift Ditutup" : "Tutup Shift"}
        footer={shiftReport?.stage === "result" ? (
          <button className="btn" onClick={logout}><LogOut size={15} /> Selesai & Keluar</button>
        ) : (
          <>
            <button className="btn ghost" disabled={closingBusy} onClick={() => setShiftReport(null)}>Batal</button>
            <button className="btn" disabled={closingBusy || shiftCash === ""} onClick={submitCloseShift}><Lock size={15} /> {closingBusy ? "Menutup…" : "Tutup Shift"}</button>
          </>
        )}
      >
        {/* Tahap 1 — hitung buta (blind count): TIDAK ada angka penjualan/ekspektasi
            yang tampil sebelum hitungan fisik dikunci, supaya kasir tidak bisa
            sekadar mengetik angka yang "pas". */}
        {shiftReport && shiftReport.stage === "count" && (
          <div className="shift">
            <div className="shift-head">
              <div className="shift-ava">{((shiftReport.report?.cashier || "?")[0] || "?").toUpperCase()}</div>
              <div>
                <div className="shift-name">{shiftReport.report?.cashier}</div>
                <div className="muted xs">Buka {shift?.openedAt ? new Date(shift.openedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—"} · Modal awal {rp(shift?.openingCash || 0)}</div>
              </div>
            </div>
            <div className="shift-stats">
              <div className="shift-stat"><span>Transaksi</span><b>{shiftReport.report?.count ?? 0}</b></div>
              <div className="shift-stat"><span>Barang</span><b>{shiftReport.report?.items ?? 0}</b></div>
            </div>
            <div className="shift-recon">
              <label className="fld"><span>Uang tunai di laci sekarang — hitung fisik, termasuk modal awal</span>
                <input inputMode="numeric" autoFocus value={shiftCash} placeholder="cth. 750.000"
                  onChange={(e) => setShiftCash(e.target.value)} /></label>
              {shiftCash !== "" && <div className="muted xs">Terbaca: <b>{rp(Number(String(shiftCash).replace(/\D/g, "")) || 0)}</b></div>}
              <label className="fld"><span>Catatan (opsional)</span>
                <input value={shiftNote} placeholder="cth. Rp20.000 dipakai beli galon aqua"
                  onChange={(e) => setShiftNote(e.target.value)} /></label>
            </div>
            <div className="muted xs">Sistem mencocokkan hitungan Anda dengan catatan penjualan SETELAH angka dikunci — hitung dengan teliti.</div>
          </div>
        )}
        {/* Tahap 2 — hasil dari server: selisih tercatat permanen */}
        {shiftReport && shiftReport.stage === "result" && (() => {
          const c = shiftReport.shift || {};
          const v = Number(c.variance || 0);
          return (
            <div className="shift">
              <div className="shift-head">
                <div className="shift-ava">{((c.cashier || "?")[0] || "?").toUpperCase()}</div>
                <div>
                  <div className="shift-name">{c.cashier}</div>
                  <div className="muted xs">
                    {c.openedAt ? new Date(c.openedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    {" – "}
                    {c.closedAt ? new Date(c.closedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </div>
                </div>
              </div>
              <div className="shift-recon">
                <div className="shift-row"><span>Modal awal</span><span className="tab">{rp(c.openingCash || 0)}</span></div>
                <div className="shift-row"><span>Penjualan tunai</span><span className="tab">{rp(c.cashSales || 0)}</span></div>
                {Number(c.cashMoves || 0) !== 0 && (
                  <div className="shift-row"><span>Kas lain-lain (bon tunai dll)</span><span className="tab">{rp(c.cashMoves || 0)}</span></div>
                )}
                <div className="shift-row strong"><span>Seharusnya di laci</span><span className="tab">{rp(c.expectedCash || 0)}</span></div>
                <div className="shift-row"><span>Hasil hitungan Anda</span><span className="tab">{rp(c.closingCash || 0)}</span></div>
                {/* Selisih SELALU ditampilkan apa adanya. "Batas wajar" hanya
                    mengubah warna penanda, supaya manajer tahu mana yang perlu
                    ditelusuri dan mana yang sekadar pembulatan uang receh. */}
                {(() => {
                  const tol = store.shift.cashTolerance;
                  const wajar = v !== 0 && Math.abs(v) <= tol;
                  return (
                    <>
                      <div className={`shift-diff ${v === 0 || wajar ? "ok" : v > 0 ? "over" : "short"}`}>
                        {v === 0 ? "PAS ✓" : v > 0 ? `Lebih ${rp(v)}` : `Kurang ${rp(Math.abs(v))}`}
                      </div>
                      {wajar && <div className="muted xs" style={{ textAlign: "center" }}>Masih dalam batas wajar toko ({rp(tol)}) — tetap tercatat permanen.</div>}
                    </>
                  );
                })()}
              </div>
              {shiftReport.report && Object.keys(shiftReport.report.byMethod || {}).length > 0 && (
                <div className="shift-methods">
                  {Object.entries(shiftReport.report.byMethod).map(([m, val]) => (
                    <div key={m} className="shift-row"><span>{PAY_LABEL[m] || m}</span><span className="tab">{rp(val)}</span></div>
                  ))}
                </div>
              )}
              {c.note && <div className="muted xs">Catatan: {c.note}</div>}
              <div className="muted xs">Hasil cocokan tersimpan permanen dan terlihat manajer di menu Shift Kasir.</div>
            </div>
          );
        })()}
      </Modal>

      <Toast msg={toast} />
    </div>
  );
}

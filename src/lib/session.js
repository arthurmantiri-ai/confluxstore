

// Simpan sesi kasir (nama + jam mulai shift) di perangkat agar pulih otomatis
// setelah reload pada HARI yang sama. Beda hari atau beda akun -> shift baru.
const CASHIER_KEY = "conflux.cashier";
const saveCashierSession = (name, start, uid, shiftId) => {
  try { localStorage.setItem(CASHIER_KEY, JSON.stringify({ name, start, uid: uid || null, shiftId: shiftId || null, day: new Date(start).toDateString() })); } catch (e) {}
};
const loadCashierSession = (uid) => {
  try {
    const raw = localStorage.getItem(CASHIER_KEY); if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o || !o.name || !o.start) return null;
    if (!o.shiftId) return null;                            // format lama (pra sistem shift) -> buka shift baru
    if (uid && o.uid && o.uid !== uid) return null;        // akun berbeda
    if (o.day !== new Date().toDateString()) return null;   // hari berbeda -> mulai shift baru
    return o;
  } catch (e) { return null; }
};
const clearCashierSession = () => { try { localStorage.removeItem(CASHIER_KEY); } catch (e) {} };

export {
  CASHIER_KEY,
  clearCashierSession,
  loadCashierSession,
  saveCashierSession
};

import { Banknote, Bean, Calculator, ClipboardList, Clock, Coffee, Coins, CreditCard, CupSoda, Droplets, Globe, Handshake, History, Landmark, LayoutDashboard, LineChart, Package, QrCode, RefreshCcw, Settings, ShoppingCart, Undo2, Users, Wallet } from "lucide-react";
import { rp } from "./format";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["manager"] },
  { key: "stok", label: "Stok Barang", icon: Package, roles: ["manager"] },
  { key: "kasir", label: "Kasir", icon: ShoppingCart, roles: ["cashier", "manager"] },
  { key: "order", label: "Order Online", icon: Globe, roles: ["cashier", "manager"] },
  { key: "hutang", label: "Hutang", icon: ClipboardList, roles: ["cashier", "manager"] },
  { key: "pelanggan", label: "Data Customer", icon: Users, roles: ["cashier", "manager"] },
  { key: "restok", label: "Re-stok", icon: RefreshCcw, roles: ["manager"] },
  { key: "titipjual", label: "Titip Jual", icon: Handshake, roles: ["manager"] },
  { key: "simulasi", label: "Simulasi Stok", icon: Calculator, roles: ["manager"] },
  { key: "akuntansi", label: "Akuntansi", icon: LineChart, roles: ["manager"] },
  { key: "riwayat", label: "Riwayat Penjualan", icon: History, roles: ["cashier", "manager"] },
  { key: "retur", label: "Retur & Tukar", icon: Undo2, roles: ["cashier", "manager"] },
  { key: "shiftlog", label: "Shift Kasir", icon: Wallet, roles: ["manager"] },
  { key: "pengaturan", label: "Pengaturan", icon: Settings, roles: ["manager"] },
];

const PAY_METHODS = [
  { key: "cash", label: "Tunai", icon: Banknote },
  { key: "transfer", label: "Transfer", icon: Landmark },
  { key: "qris", label: "QRIS", icon: QrCode },
  { key: "card", label: "Kartu", icon: CreditCard },
  { key: "hutang", label: "Hutang", icon: Clock },
  { key: "split", label: "Campur", icon: Coins },
];
const PAY_LABEL = Object.fromEntries(PAY_METHODS.map((m) => [m.key, m.label]));
// Metode yang boleh dipakai dalam pembayaran campur (hutang tidak boleh dicampur)
const SPLIT_METHODS = PAY_METHODS.filter((m) => ["cash", "transfer", "qris", "card"].includes(m.key));
// "Tunai Rp100.000 + QRIS Rp60.000" — untuk pesan sukses & rincian
const payListLabel = (payments) => (payments || []).map((p) => `${PAY_LABEL[p.method] || p.method} ${rp(p.amount)}`).join(" + ");

// ===== Retur & tukar =====
// Alasan retur (kepala nota). Metode "kembali uang" pakai PAY_METHODS non-hutang.
const RETURN_REASONS = [
  { key: "rusak", label: "Barang rusak" },
  { key: "expired", label: "Kedaluwarsa" },
  { key: "salah_beli", label: "Salah beli" },
  { key: "tidak_cocok", label: "Tidak cocok / berubah pikiran" },
  { key: "lainnya", label: "Lainnya" },
];
const RETURN_REASON_LABEL = Object.fromEntries(RETURN_REASONS.map((r) => [r.key, r.label]));
// Kondisi barang yang diretur -> menentukan bisa dijual lagi (restock) atau tidak.
const RETURN_CONDITIONS = [
  { key: "baik", label: "Masih baik", restock: true, hint: "kembali ke stok jual" },
  { key: "rusak", label: "Rusak", restock: false, hint: "tidak bisa dijual (kerugian)" },
  { key: "expired", label: "Kedaluwarsa", restock: false, hint: "tidak bisa dijual (kerugian)" },
];
const RETURN_CONDITION_LABEL = Object.fromEntries(RETURN_CONDITIONS.map((c) => [c.key, c.label]));
// Metode pengembalian/penerimaan uang untuk retur (tanpa hutang & campur)
const REFUND_METHODS = PAY_METHODS.filter((m) => ["cash", "transfer", "qris", "card"].includes(m.key));

const catIcon = (category = "") => {
  const c = String(category).toLowerCase();
  if (/benih|biji|kopi|bean|roast|arabika|robusta/.test(c)) return Bean;
  if (/dripp|syrup|sirup|drip|saus|sauce|liquid/.test(c)) return Droplets;
  if (/master|powder|bubuk|matcha|choco|cokelat|coklat/.test(c)) return CupSoda;
  return Coffee;
};

// PIN manajer untuk membuka kunci edit & hapus barang.
// (Demo: nanti diganti otentikasi berbasis peran lewat Supabase Auth)
const MANAGER_PIN = "1234";

export {
  MANAGER_PIN,
  NAV,
  PAY_LABEL,
  PAY_METHODS,
  REFUND_METHODS,
  RETURN_CONDITIONS,
  RETURN_CONDITION_LABEL,
  RETURN_REASONS,
  RETURN_REASON_LABEL,
  SPLIT_METHODS,
  catIcon,
  payListLabel
};

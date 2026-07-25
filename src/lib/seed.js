import { cfgAkun } from "./config";
import { uid } from "./format";

const SEED_PRODUCTS = [
  // ===== BENIH — biji kopi (satuan: kg, tanpa karton) =====
  { id: uid(), name: "Robusta Temanggung (Fine)", sku: "BNH-ROB", category: "Benih", unit: "kg", cost: 185250, price: 195000, stock: 14, dailyUsage: 2, leadTime: 5, safetyStock: 6 },
  { id: uid(), name: "Sulawesi Blend 70% (Toraja-Robusta)", sku: "BNH-SL70", category: "Benih", unit: "kg", cost: 247000, price: 260000, stock: 8, dailyUsage: 2, leadTime: 5, safetyStock: 5 },
  { id: uid(), name: "Sulawesi Blend 50% (Toraja-Robusta)", sku: "BNH-SL50", category: "Benih", unit: "kg", cost: 228000, price: 240000, stock: 22, dailyUsage: 1, leadTime: 5, safetyStock: 4 },
  { id: uid(), name: "Java Blend 70% (Ijen-Robusta)", sku: "BNH-JV70", category: "Benih", unit: "kg", cost: 247000, price: 260000, stock: 4, dailyUsage: 2, leadTime: 5, safetyStock: 5 },
  { id: uid(), name: "Java Blend 50% (Ijen-Robusta)", sku: "BNH-JV50", category: "Benih", unit: "kg", cost: 228000, price: 240000, stock: 16, dailyUsage: 1, leadTime: 5, safetyStock: 4 },

  // ===== DRIPP — syrup (satuan: botol, 1 karton = 6 botol) =====
  { id: uid(), name: "Dripp Syrup Caramel 760ml", sku: "DRP-CRM", category: "Dripp", unit: "botol", cost: 99900, price: 118000, cartonSize: 6, priceCarton: 690000, promo: { active: true, type: "percent", value: 10 }, stock: 54, dailyUsage: 5, leadTime: 7, safetyStock: 24 },
  { id: uid(), name: "Dripp Syrup Butterscotch 760ml", sku: "DRP-BTS", category: "Dripp", unit: "botol", cost: 99900, price: 118000, cartonSize: 6, priceCarton: 690000, stock: 30, dailyUsage: 5, leadTime: 7, safetyStock: 30 },
  { id: uid(), name: "Dripp Syrup Cinnamon 760ml", sku: "DRP-CNM", category: "Dripp", unit: "botol", cost: 99900, price: 118000, cartonSize: 6, priceCarton: 690000, stock: 18, dailyUsage: 3, leadTime: 7, safetyStock: 18 },
  { id: uid(), name: "Dripp Syrup Hazelnut 760ml", sku: "DRP-HZL", category: "Dripp", unit: "botol", cost: 99900, price: 118000, cartonSize: 6, priceCarton: 690000, stock: 84, dailyUsage: 4, leadTime: 7, safetyStock: 24 },
  { id: uid(), name: "Dripp Syrup Passion Fruit 760ml", sku: "DRP-PSF", category: "Dripp", unit: "botol", cost: 99900, price: 118000, cartonSize: 6, priceCarton: 690000, stock: 42, dailyUsage: 3, leadTime: 7, safetyStock: 24 },
  { id: uid(), name: "Dripp Syrup Vanilla 760ml", sku: "DRP-VNL", category: "Dripp", unit: "botol", cost: 99900, price: 118000, cartonSize: 6, priceCarton: 690000, stock: 96, dailyUsage: 4, leadTime: 7, safetyStock: 24 },
  { id: uid(), name: "Dripp Syrup Sea Salt 760ml", sku: "DRP-SST", category: "Dripp", unit: "botol", cost: 99900, price: 118000, cartonSize: 6, priceCarton: 690000, stock: 24, dailyUsage: 3, leadTime: 7, safetyStock: 24 },

  // ===== MASTERISTA — powder & syrup (satuan: pcs; harga jual default, silakan disesuaikan) =====
  { id: uid(), name: "Masterista Gula Aren Pouch 1000g", sku: "LL4020", category: "Masterista", unit: "pcs", cost: 60125, price: 75000, stock: 30, dailyUsage: 3, leadTime: 3, safetyStock: 10 },
  { id: uid(), name: "Masterista Ice Shaken Lemon Tea 1kg", sku: "LL3481", category: "Masterista", unit: "pcs", cost: 69375, price: 85000, stock: 8, dailyUsage: 2, leadTime: 3, safetyStock: 8 },
  { id: uid(), name: "Masterista Syrup Classic Caramel 850ml", sku: "LL3861", category: "Masterista", unit: "pcs", cost: 101750, price: 125000, stock: 20, dailyUsage: 2, leadTime: 3, safetyStock: 8 },
  { id: uid(), name: "Masterista Syrup French Vanilla 850ml", sku: "LL3860", category: "Masterista", unit: "pcs", cost: 101750, price: 125000, stock: 12, dailyUsage: 2, leadTime: 3, safetyStock: 8 },
  { id: uid(), name: "Masterista Syrup Premium Hazelnut 850ml", sku: "LL3863", category: "Masterista", unit: "pcs", cost: 101750, price: 125000, stock: 18, dailyUsage: 2, leadTime: 3, safetyStock: 8 },
  { id: uid(), name: "Masterista Powder Classic Chocolate Base 800g", sku: "LL3064", category: "Masterista", unit: "pcs", cost: 155400, price: 190000, stock: 24, dailyUsage: 3, leadTime: 3, safetyStock: 12 },
  { id: uid(), name: "Masterista Powder Butterscotch Expecta 800g", sku: "LL3068", category: "Masterista", unit: "pcs", cost: 146150, price: 180000, stock: 14, dailyUsage: 3, leadTime: 3, safetyStock: 12 },
  { id: uid(), name: "Masterista Powder Dark Chocolate 800g", sku: "LL2895", category: "Masterista", unit: "pcs", cost: 155400, price: 190000, stock: 9, dailyUsage: 2, leadTime: 3, safetyStock: 10 },
  { id: uid(), name: "Masterista Powder Matcha Vanilla 800g", sku: "LL2892", category: "Masterista", unit: "pcs", cost: 161875, price: 195000, stock: 22, dailyUsage: 2, leadTime: 3, safetyStock: 10 },
  { id: uid(), name: "Masterista Powder Original Matcha 800g", sku: "LL3066", category: "Masterista", unit: "pcs", cost: 161875, price: 195000, stock: 16, dailyUsage: 2, leadTime: 3, safetyStock: 10 },
  { id: uid(), name: "Masterista Powder Taro Expecta 800g", sku: "LL2894", category: "Masterista", unit: "pcs", cost: 146150, price: 180000, stock: 11, dailyUsage: 2, leadTime: 3, safetyStock: 10 },
  { id: uid(), name: "Masterista Powder Red Velvet 800g", sku: "LL2891", category: "Masterista", unit: "pcs", cost: 146150, price: 180000, stock: 7, dailyUsage: 2, leadTime: 3, safetyStock: 10 },
  { id: uid(), name: "Masterista Syrup Butterscotch 850ml", sku: "LL6072", category: "Masterista", unit: "pcs", cost: 101750, price: 125000, stock: 19, dailyUsage: 2, leadTime: 3, safetyStock: 8 },
].map((p, i) => ({
  code: "BRG-" + String(i + 1).padStart(3, "0"),
  cartonSize: 0, priceCarton: 0, promo: { active: false, type: "percent", value: 0 },
  ...p,
}));

// Generate ID Barang berikutnya berdasarkan kode tertinggi yang ada
const nextCode = (ps) => {
  const max = ps.reduce((m, p) => {
    const n = parseInt(String(p.code || "").replace(/\D/g, ""), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return "BRG-" + String(max + 1).padStart(3, "0");
};

// SKU otomatis: prefiks 3 huruf dari kategori + nomor urut
const skuPrefix = (cat) => (String(cat || "").replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 3) || "BRG");
const genSku = (cat, ps) => {
  const pre = skuPrefix(cat);
  const re = new RegExp("^" + pre + "-(\\d+)$");
  const max = ps.reduce((m, p) => {
    const mt = String(p.sku || "").match(re);
    return mt ? Math.max(m, parseInt(mt[1], 10)) : m;
  }, 0);
  return `${pre}-${String(max + 1).padStart(3, "0")}`;
};

const SEED_MOVEMENTS = [
  { id: uid(), productId: SEED_PRODUCTS[12].id, type: "in", qty: 24, note: "Pembelian Masterista", at: "Hari ini, 08:12" },
  { id: uid(), productId: SEED_PRODUCTS[5].id, type: "out", qty: 3, note: "Penjualan kasir", at: "Hari ini, 09:40" },
  { id: uid(), productId: SEED_PRODUCTS[0].id, type: "out", qty: 5, note: "Penjualan kasir", at: "Hari ini, 10:05" },
  { id: uid(), productId: SEED_PRODUCTS[17].id, type: "in", qty: 24, note: "Pembelian Masterista", at: "Kemarin, 16:30" },
];

const SEED_ORDERS = [
  { id: "ORD-2041", customer: "Kopi Senja", channel: "WhatsApp", status: "baru", at: "10:24", items: [{ pid: SEED_PRODUCTS[14].id, qty: 6 }, { pid: SEED_PRODUCTS[5].id, qty: 2 }] },
  { id: "ORD-2040", customer: "Filosofi Kopi", channel: "Instagram", status: "baru", at: "09:58", items: [{ pid: SEED_PRODUCTS[1].id, qty: 3 }, { pid: SEED_PRODUCTS[18].id, qty: 4 }] },
  { id: "ORD-2039", customer: "Kafe Tomohon", channel: "WhatsApp", status: "diproses", at: "09:10", items: [{ pid: SEED_PRODUCTS[12].id, qty: 10 }] },
  { id: "ORD-2038", customer: "Janji Jiwa Manado", channel: "Marketplace", status: "dikirim", at: "Kemarin", items: [{ pid: SEED_PRODUCTS[20].id, qty: 5 }, { pid: SEED_PRODUCTS[8].id, qty: 2 }] },
];

const SEED_SALES7 = [
  { d: "Sen", v: 6240000 }, { d: "Sel", v: 4820000 }, { d: "Rab", v: 9130000 },
  { d: "Kam", v: 7340000 }, { d: "Jum", v: 11420000 }, { d: "Sab", v: 13180000 },
  { d: "Min", v: 8650000 },
];

const SEED_DEBTS = [
  {
    id: "HTG-001", debtor: "Andi Pratama", business: "Kopi Senja", phone: "0812-3456-7890",
    items: [{ name: "Dripp Syrup Caramel 760ml", qtyLabel: "1 karton", lineTotal: 690000 }, { name: "Masterista Powder Original Matcha 800g", qtyLabel: "4 pcs", lineTotal: 780000 }],
    total: 1470000, date: "13 Jun 2026", status: "belum", paidAt: null,
  },
  {
    id: "HTG-002", debtor: "Rina Wijaya", business: "Filosofi Kopi", phone: "0856-1122-3344",
    items: [{ name: "Sulawesi Blend 70% (Toraja-Robusta)", qtyLabel: "3 kg", lineTotal: 780000 }],
    total: 780000, date: "12 Jun 2026", status: "lunas", paidAt: "15 Jun 2026",
  },
];
const nextDebtId = (ds) => {
  const max = ds.reduce((m, d) => {
    const n = parseInt(String(d.id || "").replace(/\D/g, ""), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return "HTG-" + String(max + 1).padStart(3, "0");
};

const nextOrderId = (os) => {
  const max = os.reduce((m, o) => {
    const n = parseInt(String(o.id || "").replace(/\D/g, ""), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 1000);
  return "ORD-" + String(max + 1);
};

// ===== Akuntansi =====
const SEED_CAPITAL = [
  { id: uid(), name: "Renovasi & interior kedai", amount: 45000000, date: "Modal awal" },
  { id: uid(), name: "Mesin sangrai (roaster) & grinder", amount: 60000000, date: "Modal awal" },
  { id: uid(), name: "Mesin espresso & peralatan bar", amount: 35000000, date: "Modal awal" },
  { id: uid(), name: "Furniture & dekorasi", amount: 18000000, date: "Modal awal" },
  { id: uid(), name: "Branding, logo & signage", amount: 8000000, date: "Modal awal" },
  { id: uid(), name: "Sewa & deposit awal", amount: 24000000, date: "Modal awal" },
  { id: uid(), name: "Perizinan & legalitas", amount: 5000000, date: "Modal awal" },
];
// Kategori biaya: daftar hidup dari Pengaturan → Akuntansi (bawaan di DEFAULT_STORE)
const expenseCats = () => cfgAkun().expenseCats;
const SEED_EXPENSES = [
  { id: uid(), category: "Sewa", name: "Sewa tempat (bulanan)", amount: 8000000, date: "Bln ini" },
  { id: uid(), category: "Gaji", name: "Gaji karyawan", amount: 12000000, date: "Bln ini" },
  { id: uid(), category: "Utilitas", name: "Listrik & air", amount: 2400000, date: "Bln ini" },
  { id: uid(), category: "Utilitas", name: "Internet", amount: 500000, date: "Bln ini" },
  { id: uid(), category: "Marketing", name: "Konten & iklan IG", amount: 1500000, date: "Bln ini" },
  { id: uid(), category: "Operasional", name: "Transport & pengiriman", amount: 1200000, date: "Bln ini" },
  { id: uid(), category: "Operasional", name: "Kemasan & ATK", amount: 900000, date: "Bln ini" },
];
// Setoran kas ke rekening (mode lokal kosong; data asli dari tabel cash_deposits)
const SEED_DEPOSITS = [];
// Penjualan contoh per barang (± 1 bulan) untuk analisa
const SEED_SALES_LOG = SEED_PRODUCTS.map((p) => {
  const qty = Math.max(1, Math.round(p.dailyUsage * 24));
  return { id: uid(), productId: p.id, qty, revenue: p.price * qty, cost: p.cost * qty, date: "Bln ini" };
});

export {
  SEED_CAPITAL,
  SEED_DEBTS,
  SEED_DEPOSITS,
  SEED_EXPENSES,
  SEED_MOVEMENTS,
  SEED_ORDERS,
  SEED_PRODUCTS,
  SEED_SALES7,
  SEED_SALES_LOG,
  expenseCats,
  genSku,
  nextCode,
  nextDebtId,
  nextOrderId,
  skuPrefix
};

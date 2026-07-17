// =====================================================================
//  Lapisan data Conflux <-> Supabase
//  Modul ini sudah siap dipakai untuk menggantikan data di-memori (seed)
//  dengan data sungguhan dari database. Fungsi mengembalikan bentuk objek
//  yang SAMA dengan yang dipakai komponen (camelCase), jadi integrasi
//  tinggal: load saat mount, lalu panggil create/update/remove saat aksi.
//
//  Catatan: import { supabase, hasSupabase } from "./supabaseClient";
//  Selalu cek hasSupabase dulu; kalau false, pakai data seed seperti biasa.
// =====================================================================
import { supabase } from "./supabaseClient";

/* ---------- konversi baris DB (snake_case) <-> objek app (camelCase) ---------- */
const rowToProduct = (r) => ({
  id: r.id, code: r.code, name: r.name, sku: r.sku, category: r.category, unit: r.unit,
  cost: Number(r.cost), price: Number(r.price),
  cartonSize: r.carton_size, priceCarton: Number(r.price_carton),
  stock: Number(r.stock), dailyUsage: Number(r.daily_usage),
  leadTime: r.lead_time, safetyStock: Number(r.safety_stock),
  promo: { active: r.promo_active, type: r.promo_type, value: Number(r.promo_value) },
  isConsign: !!r.is_consign, supplier: r.supplier || "",
});
const productToRow = (p) => ({
  code: p.code, name: p.name, sku: p.sku, category: p.category, unit: p.unit,
  cost: p.cost, price: p.price, carton_size: p.cartonSize || 0, price_carton: p.priceCarton || 0,
  stock: p.stock, daily_usage: p.dailyUsage, lead_time: p.leadTime, safety_stock: p.safetyStock,
  promo_active: p.promo?.active || false, promo_type: p.promo?.type || "percent", promo_value: p.promo?.value || 0,
  is_consign: !!p.isConsign, supplier: p.supplier || "",
});

/* ============================ PRODUCTS ============================ */
export const Products = {
  async list() {
    const { data, error } = await supabase.from("products").select("*").order("code");
    if (error) throw error;
    return data.map(rowToProduct);
  },
  async create(p) {
    const { data, error } = await supabase.from("products").insert(productToRow(p)).select().single();
    if (error) throw error;
    return rowToProduct(data);
  },
  async update(id, p) {
    const { data, error } = await supabase.from("products").update(productToRow(p)).eq("id", id).select().single();
    if (error) throw error;
    return rowToProduct(data);
  },
  // Penyesuaian stok ABSOLUT (stock opname): kirim TARGET hitungan fisik, server yang
  // menghitung selisih terhadap stok database SAAT INI (bukan angka di layar yang bisa
  // basi), lalu menambah/memotong batch FIFO + mencatat riwayat — dalam satu transaksi.
  async setStockAbsolute(id, target, cost, note) {
    const { data, error } = await supabase.rpc("set_stock_absolute", {
      p_id: id, p_target: target, p_cost: cost ?? null, p_note: note ?? null,
    });
    if (error) throw error;
    return data == null ? null : Number(data);
  },
  // ===== FIFO: setiap penambahan stok = batch dengan harga belinya sendiri =====
  async restockFifo(id, qty, cost, note) {
    const { error } = await supabase.rpc("fifo_restock", { p_id: id, p_qty: qty, p_cost: cost, p_note: note ?? null });
    if (error) throw error;
  },
  // Stok MASUK atomik: riwayat + batch FIFO + kolom stok dalam SATU transaksi server.
  // Mengembalikan angka stok terbaru dari database.
  async stockIn(id, qty, cost, note) {
    const { data, error } = await supabase.rpc("stock_in", { p_id: id, p_qty: qty, p_cost: cost, p_note: note ?? null });
    if (error) throw error;
    return data == null ? null : Number(data);
  },
  // Stok KELUAR atomik: riwayat + potong batch FIFO + kolom stok dalam SATU
  // transaksi server. Mengembalikan total HPP dari batch yang terpakai.
  async stockOut(id, qty, note) {
    const { data, error } = await supabase.rpc("stock_out", { p_id: id, p_qty: qty, p_note: note ?? null });
    if (error) throw error;
    return Number(data || 0);
  },
  // Keluarkan stok FIFO; mengembalikan total HPP dari batch yang terpakai
  async consumeFifo(id, qty) {
    const { data, error } = await supabase.rpc("fifo_consume", { p_id: id, p_qty: qty });
    if (error) throw error;
    return Number(data || 0);
  },
  // Nilai stok MILIK TOKO berdasarkan harga batch (tanpa barang titipan;
  // fallback ke harga modal produk)
  async inventoryValue() {
    const { data, error } = await supabase.rpc("inventory_value");
    if (error) throw error;
    return Number(data || 0);
  },
  // Nilai stok barang TITIPAN (milik distributor)
  async inventoryValueConsign() {
    const { data, error } = await supabase.rpc("inventory_value_consign");
    if (error) throw error;
    return Number(data || 0);
  },
  // Update data barang TANPA menyentuh kolom stok (stok dikelola RPC FIFO)
  async updateInfo(id, p) {
    const row = productToRow(p);
    delete row.stock;
    const { data, error } = await supabase.from("products").update(row).eq("id", id).select().single();
    if (error) throw error;
    return rowToProduct(data);
  },
  async remove(id) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
  },
};

/* ============================ STOCK BATCHES (FIFO) ============================ */
export const Batches = {
  // Batch aktif (sisa > 0) sebuah produk, urut dari yang paling lama (urutan FIFO)
  async list(productId) {
    const { data, error } = await supabase
      .from("stock_batches").select("*")
      .eq("product_id", productId).gt("qty_left", 0)
      .order("created_at");
    if (error) throw error;
    return data.map((r) => ({
      id: r.id, qtyIn: Number(r.qty_in), qtyLeft: Number(r.qty_left),
      unitCost: Number(r.unit_cost), note: r.note, at: r.created_at,
    }));
  },
};

/* ============================ MOVEMENTS ============================ */
export const Movements = {
  async list() {
    const { data, error } = await supabase.from("movements").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data.map((r) => ({ id: r.id, productId: r.product_id, type: r.type, qty: Number(r.qty), note: r.note, at: r.created_at }));
  },
  async create(m) {
    const { error } = await supabase.from("movements").insert({ product_id: m.productId, type: m.type, qty: m.qty, note: m.note });
    if (error) throw error;
  },
};

/* ============================ ORDERS ============================ */
export const Orders = {
  async list() {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data.map((r) => ({ id: r.id, customer: r.customer, phone: r.phone, channel: r.channel, status: r.status, items: r.items || [], total: Number(r.total), at: r.created_at }));
  },
  async create(o) {
    const { error } = await supabase.from("orders").insert({
      id: o.id, customer: o.customer, phone: o.phone || null, channel: o.channel,
      status: o.status || "baru", items: o.items || [], total: o.total || 0,
    });
    if (error) throw error;
  },
  async setStatus(id, status) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) throw error;
  },
};

/* ============================ DEBTS ============================ */
export const Debts = {
  async list() {
    const { data, error } = await supabase.from("debts").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data.map((r) => ({
      id: r.id, debtor: r.debtor, business: r.business, phone: r.phone,
      items: r.items || [], total: Number(r.total), status: r.status, date: r.date, paidAt: r.paid_at,
    }));
  },
  async create(d) {
    const row = {
      id: d.id, debtor: d.debtor, business: d.business, phone: d.phone,
      items: d.items || [], total: d.total, status: d.status || "belum", date: d.date, paid_at: d.paidAt ?? null,
    };
    const { error } = await supabase.from("debts").insert(row);
    if (error) throw error;
  },
  async settle(id, paidAt) {
    const { error } = await supabase.from("debts").update({ status: "lunas", paid_at: paidAt }).eq("id", id);
    if (error) throw error;
  },
  async remove(id) {
    const { error } = await supabase.from("debts").delete().eq("id", id);
    if (error) throw error;
  },
};

/* ============================ CAPITAL / EXPENSES ============================ */
export const Capital = {
  async list() { const { data, error } = await supabase.from("capital").select("*").order("created_at"); if (error) throw error; return data.map((r) => ({ ...r, amount: Number(r.amount) })); },
  async create(e) { const { data, error } = await supabase.from("capital").insert(e).select().single(); if (error) throw error; return data; },
  async update(id, e) { const { error } = await supabase.from("capital").update(e).eq("id", id); if (error) throw error; },
  async remove(id) { const { error } = await supabase.from("capital").delete().eq("id", id); if (error) throw error; },
};
export const Expenses = {
  async list() { const { data, error } = await supabase.from("expenses").select("*").order("created_at"); if (error) throw error; return data.map((r) => ({ ...r, amount: Number(r.amount), items: r.items || [] })); },
  async create(e) { const { data, error } = await supabase.from("expenses").insert(e).select().single(); if (error) throw error; return data; },
  async update(id, e) { const { error } = await supabase.from("expenses").update(e).eq("id", id); if (error) throw error; },
  async remove(id) { const { error } = await supabase.from("expenses").delete().eq("id", id); if (error) throw error; },
};

/* ============================ SALES LOG ============================ */
export const Sales = {
  // opts.sinceDays: batasi ke N hari terakhir (skala besar); opts.limit: batas baris
  async list(opts = {}) {
    let q = supabase.from("sales_log").select("*").order("created_at", { ascending: false });
    if (opts.sinceDays) q = q.gte("created_at", new Date(Date.now() - opts.sinceDays * 86400000).toISOString());
    if (opts.limit) q = q.limit(opts.limit);
    const { data, error } = await q;
    if (error) throw error;
    return data.map((r) => ({
      id: r.id, productId: r.product_id, qty: Number(r.qty), revenue: Number(r.revenue), cost: Number(r.cost),
      date: r.date, ts: r.created_at ? Date.parse(r.created_at) : null,
      txnId: r.txn_id || null, cashier: r.cashier || null, method: r.method || null,
      qtyLabel: r.qty_label || null, receiptNo: r.receipt_no || null,
      payments: r.payments || null, // rincian bayar campur [{method, amount}] — null = metode tunggal
    }));
  },
  async create(s) {
    const { error } = await supabase.from("sales_log").insert({
      product_id: s.productId, qty: s.qty, revenue: s.revenue, cost: s.cost, date: s.date,
      txn_id: s.txnId || null, cashier: s.cashier || null, method: s.method || null,
      qty_label: s.qtyLabel || null, receipt_no: s.receiptNo || null,
      payments: s.payments || null,
    });
    if (error) throw error;
  },
  // Hapus satu transaksi utuh (semua baris txn_id yang sama) di server.
  // Stok dikembalikan sebagai batch FIFO & pergerakan tercatat — lihat void_txn di SQL.
  async voidTxn(txnId) {
    const { data, error } = await supabase.rpc("void_txn", { p_txn_id: txnId });
    if (error) throw error;
    return Number(data || 0);
  },
  // Agregat dihitung di server (akurat & ringan walau data besar). from/to = ISO string atau null.
  async agg(fromISO, toISO) {
    const { data, error } = await supabase.rpc("sales_agg", { p_from: fromISO ?? null, p_to: toISO ?? null });
    if (error) throw error;
    const r = (data && data[0]) || {};
    return { revenue: Number(r.revenue || 0), cost: Number(r.cost || 0), qty: Number(r.qty || 0), txns: Number(r.txns || 0) };
  },
  async byProduct(fromISO, toISO) {
    const { data, error } = await supabase.rpc("sales_by_product", { p_from: fromISO ?? null, p_to: toISO ?? null });
    if (error) throw error;
    return (data || []).map((r) => ({ productId: r.product_id, qty: Number(r.qty), revenue: Number(r.revenue), cost: Number(r.cost) }));
  },
  // Per bulan (untuk tren); from = ISO atau null
  async monthly(fromISO) {
    const { data, error } = await supabase.rpc("sales_monthly", { p_from: fromISO ?? null });
    if (error) throw error;
    return (data || []).map((r) => ({ period: r.period, revenue: Number(r.revenue), cost: Number(r.cost) }));
  },
};

/* ============================ TITIP JUAL (KONSINYASI) ============================ */
const rowToConsign = (r) => ({
  id: r.id, productId: r.product_id, productName: r.product_name || "—",
  supplier: r.supplier || "", txnId: r.txn_id || null,
  qty: Number(r.qty), amount: Number(r.amount),
  status: r.status || "belum", paidAt: r.paid_at || null,
  ts: r.created_at ? Date.parse(r.created_at) : null,
});
export const Consign = {
  async list() {
    const { data, error } = await supabase.from("consign_ledger").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data.map(rowToConsign);
  },
  // Catat kewajiban setoran saat barang titipan laku (amount = HPP FIFO)
  async create(c) {
    const { data, error } = await supabase.from("consign_ledger").insert({
      product_id: c.productId, product_name: c.productName, supplier: c.supplier || "",
      txn_id: c.txnId || null, qty: c.qty, amount: c.amount, status: "belum",
    }).select().single();
    if (error) throw error;
    return rowToConsign(data);
  },
  // Tandai beberapa baris sudah disetor ke distributor
  async settleMany(ids, paidAt) {
    const { error } = await supabase.from("consign_ledger")
      .update({ status: "lunas", paid_at: paidAt }).in("id", ids);
    if (error) throw error;
  },
};

/* ============================ SETTINGS ============================ */
export const Settings = {
  async get() { const { data, error } = await supabase.from("settings").select("data").eq("id", 1).single(); if (error) throw error; return data.data; },
  async save(obj) { const { error } = await supabase.from("settings").upsert({ id: 1, data: obj }); if (error) throw error; },
};

/* ============================ AUTH / PROFILES ============================ */
export const Auth = {
  async signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },
  async signOut() { await supabase.auth.signOut(); },
  async getSession() { const { data } = await supabase.auth.getSession(); return data.session; },
  onChange(cb) { return supabase.auth.onAuthStateChange((_e, s) => cb(s)); },
};

export const Profiles = {
  // Profil (peran + nama) milik user yang sedang login
  async me() {
    const { data: u } = await supabase.auth.getUser();
    const uid = u?.user?.id;
    if (!uid) return null;
    const { data, error } = await supabase.from("profiles").select("role,name").eq("id", uid).single();
    if (error) throw error;
    return data; // { role, name }
  },
};

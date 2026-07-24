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
  // Mengembalikan angka stok terbaru dari database. p_expiry opsional (YYYY-MM-DD/null).
  async stockIn(id, qty, cost, note, expiry) {
    const { data, error } = await supabase.rpc("stock_in", {
      p_id: id, p_qty: qty, p_cost: cost, p_note: note ?? null, p_expiry: expiry ?? null,
    });
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
      expiryDate: r.expiry_date || null, // tanggal kedaluwarsa batch (opsional; YYYY-MM-DD)
    }));
  },
  // Set / ubah tanggal kedaluwarsa SATU batch (kirim null untuk mengosongkan).
  // ADITIF murni: hanya menulis kolom expiry_date — TIDAK menyentuh qty, harga,
  // maupun urutan konsumsi FIFO batch.
  async setExpiry(batchId, dateStr) {
    const { error } = await supabase.rpc("set_batch_expiry", {
      p_batch: batchId, p_expiry: dateStr || null,
    });
    if (error) throw error;
  },
  // Semua batch aktif yang PUNYA tanggal kedaluwarsa (lintas produk), diurutkan
  // dari yang paling dekat kedaluwarsa. Untuk lencana peringatan di daftar stok.
  // Hanya-baca; jumlah baris kecil (hanya batch yang sudah ditandai).
  async activeWithExpiry() {
    const { data, error } = await supabase
      .from("stock_batches")
      .select("id, product_id, qty_left, expiry_date")
      .gt("qty_left", 0)
      .not("expiry_date", "is", null)
      .order("expiry_date");
    if (error) throw error;
    return (data || []).map((r) => ({
      id: r.id, productId: r.product_id,
      qtyLeft: Number(r.qty_left), expiryDate: r.expiry_date || null,
    }));
  },
  // SEMUA batch sebuah produk (termasuk yang sisanya sudah 0) untuk layar
  // "Kelola batch". Urut dari yang paling lama (searah urutan konsumsi FIFO).
  async listAll(productId) {
    const { data, error } = await supabase
      .from("stock_batches").select("*")
      .eq("product_id", productId)
      .order("created_at");
    if (error) throw error;
    return data.map((r) => ({
      id: r.id, qtyIn: Number(r.qty_in), qtyLeft: Number(r.qty_left),
      unitCost: Number(r.unit_cost), note: r.note, at: r.created_at,
      expiryDate: r.expiry_date || null,
    }));
  },
  // Koreksi SATU batch: tanggal masuk, jumlah masuk, sisa, harga modal, tanggal
  // kedaluwarsa, catatan. Server merekonsiliasi products.stock sebesar perubahan
  // sisa (invariant stok = Σ sisa) + mencatat jejak di movements — DALAM SATU
  // transaksi (RPC edit_batch). Mengembalikan angka stok produk terbaru.
  //   patch = { received?(ISO|null → null = jangan ubah tanggal masuk),
  //             qtyIn, qtyLeft, unitCost, expiryDate(YYYY-MM-DD|null), note|null }
  async edit(batchId, patch) {
    const { data, error } = await supabase.rpc("edit_batch", {
      p_batch: batchId,
      p_qty_in: patch.qtyIn,
      p_qty_left: patch.qtyLeft,
      p_cost: patch.unitCost,
      p_received: patch.received ?? null,
      p_expiry: patch.expiryDate ?? null,
      p_note: patch.note ?? null,
    });
    if (error) throw error;
    return data == null ? null : Number(data);
  },
  // Hapus SATU batch (koreksi entri keliru). Sisa batch dikembalikan dari stok
  // produk + jejak movements, atomik di server (RPC delete_batch).
  async remove(batchId) {
    const { data, error } = await supabase.rpc("delete_batch", { p_batch: batchId });
    if (error) throw error;
    return data == null ? null : Number(data);
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
    return data.map((r) => ({ id: r.id, customer: r.customer, phone: r.phone, channel: r.channel, payMethod: r.pay_method || null, status: r.status, items: r.items || [], total: Number(r.total), at: r.created_at }));
  },
  async create(o) {
    const { error } = await supabase.from("orders").insert({
      id: o.id, customer: o.customer, phone: o.phone || null, channel: o.channel,
      pay_method: o.payMethod || null,
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
      paidMethod: r.paid_method || null,
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
  async settle(id, paidAt, method) {
    const { error } = await supabase.from("debts").update({ status: "lunas", paid_at: paidAt, paid_method: method ?? null }).eq("id", id);
    if (error) throw error;
  },
  async remove(id) {
    const { error } = await supabase.from("debts").delete().eq("id", id);
    if (error) throw error;
  },
};

/* ============================ SHIFTS (buka/tutup kasir) ============================ */
// Semua penulisan lewat RPC security definer — klien tidak bisa mengubah baris shift
// secara langsung (tanpa policy insert/update/delete). Angka "seharusnya di laci"
// dihitung SERVER saat tutup, dan kasir baru melihatnya SETELAH hitungan fisik
// dikunci (blind count) — inti pencegahan kecurangan kas.
const rowToShift = (r) => ({
  id: r.id, cashier: r.cashier, status: r.status,
  openedAt: r.opened_at ? Date.parse(r.opened_at) : null,
  closedAt: r.closed_at ? Date.parse(r.closed_at) : null,
  openingCash: Number(r.opening_cash || 0),
  cashSales: r.cash_sales == null ? null : Number(r.cash_sales),
  cashMoves: r.cash_moves == null ? null : Number(r.cash_moves),
  expectedCash: r.expected_cash == null ? null : Number(r.expected_cash),
  closingCash: r.closing_cash == null ? null : Number(r.closing_cash),
  variance: r.variance == null ? null : Number(r.variance),
  note: r.note || null,
});
export const Shifts = {
  async open(cashier, openingCash) {
    const { data, error } = await supabase.rpc("open_shift", { p_cashier: cashier, p_opening: openingCash });
    if (error) throw error;
    return rowToShift(data);
  },
  async close(id, counted, note) {
    const { data, error } = await supabase.rpc("close_shift", { p_shift_id: id, p_counted: counted, p_note: note ?? null });
    if (error) throw error;
    return rowToShift(data);
  },
  // Kas laci non-penjualan (mis. pelunasan bon tunai) agar cocokan kas tetap akurat
  async cashMove(shiftId, type, amount, note) {
    const { error } = await supabase.rpc("shift_cash_move", { p_shift_id: shiftId, p_type: type, p_amount: amount, p_note: note ?? null });
    if (error) throw error;
  },
  async get(id) {
    const { data, error } = await supabase.from("shifts").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? rowToShift(data) : null;
  },
  async list(limit = 90) {
    const { data, error } = await supabase.from("shifts").select("*").order("opened_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return (data || []).map(rowToShift);
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

/* ===================== CASH DEPOSITS (setoran kas -> rekening) =====================
   Catatan uang tunai yang diambil dari kas terkumpul lalu disetor/transfer ke
   rekening bank. INI PINDAH ASET (Kas -> Bank), BUKAN biaya — tidak masuk laba-rugi.
   Insert langsung seperti Expenses; tidak menyentuh shift/cocokan kas.            */
const rowToDeposit = (r) => ({
  id: r.id,
  amount: Number(r.amount || 0),
  depositedAt: r.deposited_at || null,   // 'YYYY-MM-DD'
  account: r.account || "",              // rekening tujuan
  note: r.note || "",
  period: r.period || "",                // 'YYYY-MM' untuk filter periode
});
const depositToRow = (d) => ({
  amount: Number(d.amount) || 0,
  deposited_at: d.depositedAt || null,
  account: d.account || null,
  note: d.note || null,
  period: d.period || null,
});
export const CashDeposits = {
  async list() {
    const { data, error } = await supabase.from("cash_deposits").select("*").order("deposited_at", { ascending: false });
    if (error) throw error;
    return data.map(rowToDeposit);
  },
  async create(d) {
    const { data, error } = await supabase.from("cash_deposits").insert(depositToRow(d)).select().single();
    if (error) throw error;
    return rowToDeposit(data);
  },
  async update(id, d) {
    const { error } = await supabase.from("cash_deposits").update(depositToRow(d)).eq("id", id);
    if (error) throw error;
  },
  async remove(id) {
    const { error } = await supabase.from("cash_deposits").delete().eq("id", id);
    if (error) throw error;
  },
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
      shiftId: r.shift_id || null, // shift kasir tempat transaksi terjadi (audit + cocokan kas)
      payments: r.payments || null, // rincian bayar campur [{method, amount}] — null = metode tunggal
    }));
  },
  async create(s) {
    const { error } = await supabase.from("sales_log").insert({
      product_id: s.productId, qty: s.qty, revenue: s.revenue, cost: s.cost, date: s.date,
      txn_id: s.txnId || null, cashier: s.cashier || null, method: s.method || null,
      qty_label: s.qtyLabel || null, receipt_no: s.receiptNo || null,
      shift_id: s.shiftId || null,
      payments: s.payments || null,
    });
    if (error) throw error;
  },
  // ===== Sinkronisasi SATU transaksi penuh (online & offline) =====
  // Satu panggilan = satu transaksi database di server: potong batch FIFO +
  // kolom stok + riwayat + baris penjualan (+ hutang bila ada). Aman diulang:
  // server memakai client_id sebagai kunci idempotensi (buku besar synced_txns),
  // jadi kiriman ganda dijawab { status: "duplicate" } tanpa menulis apa pun.
  // item = { clientId, note, soldAt(ISO), rows:[{snake_case, tanpa cost}], debt? }
  async syncTxn(item) {
    // Timeout sisi klien: jaringan "black-hole" (tersambung tapi paket hilang) tidak
    // boleh menggantung flush selamanya. Batalkan setelah 20 dtk → dianggap transien
    // → dicoba lagi pada pemicu berikutnya. Antrean tetap utuh.
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), 20000) : null;
    try {
      let q = supabase.rpc("sync_sale_txn", {
        p_client_id: item.clientId,
        p_note: item.note ?? null,
        p_sold_at: item.soldAt ?? null,
        p_rows: item.rows,
        p_debt: item.debt ?? null,
      });
      if (ctrl && q.abortSignal) q = q.abortSignal(ctrl.signal);
      const { data, error } = await q;
      if (error) throw error;
      return data || {}; // { status:"ok"|"duplicate", items, revenue, at, debt_id }
    } finally {
      if (timer) clearTimeout(timer);
    }
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

/* ============================ RETUR & TUKAR ============================ */
const rowToReturn = (r) => ({
  id: r.id, returnNo: r.return_no, clientId: r.client_id || null,
  originalTxnId: r.original_txn_id || null, kind: r.kind || "refund",
  reason: r.reason || "", settlement: r.settlement || null,
  refundTotal: Number(r.refund_total || 0), exchangeTotal: Number(r.exchange_total || 0),
  netAmount: Number(r.net_amount || 0), costDelta: Number(r.cost_delta || 0),
  cashier: r.cashier || "—", shiftId: r.shift_id || null, note: r.note || "",
  ts: r.created_at ? Date.parse(r.created_at) : null,
});
const rowToReturnItem = (r) => ({
  id: r.id, returnId: r.return_id, productId: r.product_id || null,
  productName: r.product_name || "—", direction: r.direction,
  qty: Number(r.qty || 0), unitPrice: Number(r.unit_price || 0), lineTotal: Number(r.line_total || 0),
  unitCost: Number(r.unit_cost || 0), costTotal: Number(r.cost_total || 0),
  restock: !!r.restock, condition: r.condition || null, reason: r.reason || null,
});
export const Returns = {
  // Daftar retur (kepala) + baris barangnya, digabung per nota.
  async list(opts = {}) {
    let q = supabase.from("returns").select("*").order("created_at", { ascending: false });
    if (opts.limit) q = q.limit(opts.limit);
    const { data, error } = await q;
    if (error) throw error;
    const heads = data || [];
    if (!heads.length) return [];
    const { data: its, error: e2 } = await supabase
      .from("return_items").select("*").in("return_id", heads.map((h) => h.id));
    if (e2) throw e2;
    const byId = {};
    (its || []).forEach((r) => { (byId[r.return_id] = byId[r.return_id] || []).push(rowToReturnItem(r)); });
    return heads.map((h) => ({ ...rowToReturn(h), items: byId[h.id] || [] }));
  },
  // Proses retur/tukar ATOMIK + idempoten di server (RPC process_return).
  // payload = { clientId, returnNo, originalTxnId, kind, reason, settlement, cashier,
  //             shiftId, note, date, returns:[{productId,qty,unitPrice,unitCost,restock,condition,reason}],
  //             exchanges:[{productId,qty,unitPrice}] }
  async create(payload) {
    const { data, error } = await supabase.rpc("process_return", {
      p_client_id: payload.clientId,
      p_return_no: payload.returnNo,
      p_original_txn_id: payload.originalTxnId ?? null,
      p_kind: payload.kind || "refund",
      p_reason: payload.reason ?? null,
      p_settlement: payload.settlement ?? null,
      p_cashier: payload.cashier ?? null,
      p_shift_id: payload.shiftId ?? null,
      p_note: payload.note ?? null,
      p_date: payload.date ?? null,
      p_returns: (payload.returns || []).map((r) => ({
        product_id: r.productId, qty: r.qty, unit_price: r.unitPrice, unit_cost: r.unitCost,
        restock: !!r.restock, condition: r.condition || null, reason: r.reason || null,
      })),
      p_exchanges: (payload.exchanges || []).map((e) => ({
        product_id: e.productId, qty: e.qty, unit_price: e.unitPrice,
      })),
    });
    if (error) throw error;
    return data || {}; // { status:"ok"|"duplicate", id, return_no, refund_total, exchange_total, net_amount }
  },
};

/* ============================ TITIP JUAL (KONSINYASI) ============================ */
const rowToConsign = (r) => ({
  id: r.id, productId: r.product_id, productName: r.product_name || "—",
  supplier: r.supplier || "", txnId: r.txn_id || null,
  qty: Number(r.qty), amount: Number(r.amount),
  paidAmount: Number(r.paid_amount || 0), // sudah disetor sebagian (setoran bertahap)
  status: r.status || "belum", paidAt: r.paid_at || null,
  ts: r.created_at ? Date.parse(r.created_at) : null,
});
// Riwayat setoran (tiap pembayaran ke distributor = satu baris)
const rowToConsignPay = (r) => ({
  id: r.id, supplier: r.supplier || "", amount: Number(r.amount),
  paidAt: r.paid_at || null, note: r.note || "",
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
  // Tandai beberapa baris sudah disetor penuh ke distributor (fallback lama)
  async settleMany(ids, paidAt) {
    const { error } = await supabase.from("consign_ledger")
      .update({ status: "lunas", paid_at: paidAt }).in("id", ids);
    if (error) throw error;
  },
  // Setoran bertahap ke distributor. Jumlah dialokasikan otomatis ke kewajiban
  // TERTUA dulu (barang yang paling lama laku), atomik di server via RPC.
  async pay(supplier, amount, paidAt, note) {
    const { data, error } = await supabase.rpc("consign_pay", {
      p_supplier: supplier || "", p_amount: amount,
      p_paid_at: paidAt || null, p_note: note || null,
    });
    if (error) throw error;
    return data; // { payment_id, paid, allocated }
  },
  // Riwayat setoran (buku pembayaran ke distributor)
  async payments() {
    const { data, error } = await supabase.from("consign_payments").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(rowToConsignPay);
  },
};

/* ============================ PELANGGAN (CRM) ============================
   Master pelanggan + buku kunjungan (satu baris per transaksi).
   Semua PENULISAN lewat RPC security definer — baris tidak bisa diubah
   langsung dari klien. link() idempoten pada txn_id, jadi antrean offline
   boleh mengirim ulang tanpa menggandakan statistik.                     */
const rowToCustomer = (r) => ({
  id: r.id,
  name: r.name || "",
  business: r.business || "",
  phone: r.phone || "",
  phoneNorm: r.phone_norm || "",
  kind: r.kind === "bisnis" ? "bisnis" : "individu",
  note: r.note || "",
  txnCount: Number(r.txn_count || 0),
  totalSpent: Number(r.total_spent || 0),
  firstTxnAt: r.first_txn_at ? Date.parse(r.first_txn_at) : null,
  lastTxnAt: r.last_txn_at ? Date.parse(r.last_txn_at) : null,
  ts: r.created_at ? Date.parse(r.created_at) : null,
});
const rowToVisit = (r) => ({
  txnId: r.txn_id,
  customerId: r.customer_id,
  amount: Number(r.amount || 0),
  cashier: r.cashier || "",
  method: r.method || "",
  pickedBy: r.picked_by || "",   // siapa yang datang mengambil (pelanggan usaha)
  at: r.at ? Date.parse(r.at) : null,
});
export const Customers = {
  async list() {
    const { data, error } = await supabase
      .from("customers").select("*")
      .order("last_txn_at", { ascending: false, nullsFirst: false });
    if (error) throw error;
    return (data || []).map(rowToCustomer);
  },
  // Buku kunjungan untuk grafik & riwayat. Dibatasi agar tetap ringan
  // walau data sudah bertahun-tahun (grafik hanya butuh yang terbaru).
  async visits(opts = {}) {
    let q = supabase.from("customer_txns").select("*").order("at", { ascending: false });
    if (opts.sinceDays) q = q.gte("at", new Date(Date.now() - opts.sinceDays * 86400000).toISOString());
    q = q.limit(opts.limit || 5000);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(rowToVisit);
  },
  // Catat "pelanggan X bertransaksi di nota Y". Atomik + idempoten di server.
  // p = { txnId, name, business, phone, kind, amount, at(ISO), cashier, method, pickedBy }
  async link(p) {
    const { data, error } = await supabase.rpc("link_customer_txn", {
      p_txn_id: p.txnId,
      p_name: p.name || "",
      p_business: p.business || "",
      p_phone: p.phone || "",
      p_kind: p.kind || "individu",
      p_amount: Number(p.amount) || 0,
      p_at: p.at || null,
      p_cashier: p.cashier || null,
      p_method: p.method || null,
      p_picked_by: p.pickedBy || null,
    });
    if (error) throw error;
    const c = data?.customer;
    return { status: data?.status || "ok", customer: c ? rowToCustomer(c) : null };
  },
  // Tambah (id null) / ubah data pelanggan dari tab Data Customer
  async save(p) {
    const { data, error } = await supabase.rpc("customer_save", {
      p_id: p.id || null,
      p_name: p.name || "",
      p_business: p.business || "",
      p_phone: p.phone || "",
      p_kind: p.kind || "individu",
      p_note: p.note || "",
    });
    if (error) throw error;
    return data ? rowToCustomer(data) : null;
  },
  // Satukan dua data pelanggan yang ternyata orang yang sama (manajer)
  async merge(keepId, dropId) {
    const { data, error } = await supabase.rpc("customer_merge", { p_keep: keepId, p_drop: dropId });
    if (error) throw error;
    return data ? rowToCustomer(data) : null;
  },
  async remove(id) {
    const { error } = await supabase.rpc("customer_delete", { p_id: id });
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
  // Paksa tukar refresh-token menjadi access-token baru. Dipakai saat antrean offline
  // gagal terkirim karena token kedaluwarsa selama perangkat tidak punya internet:
  // sekali disegarkan, paket yang sama langsung dikirim ulang tanpa hilang.
  // Mengembalikan session baru, atau null bila refresh-token juga sudah mati
  // (berarti kasir memang harus login ulang — antrean tetap utuh di perangkat).
  async refresh() {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) return null;
      return data?.session || null;
    } catch (e) { return null; }
  },
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

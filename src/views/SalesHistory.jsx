import { useMemo, useState } from "react";
import { Banknote, ChevronRight, Landmark, Printer, Search, ShoppingCart, Trash2, User, Wallet } from "lucide-react";
import { Modal, Stat } from "../components/ui";
import { PAY_LABEL } from "../lib/constants";
import { num, rp } from "../lib/format";

/* ============================ Riwayat Penjualan ============================ */

function SalesHistory({ salesLog, products, managerMode, onPrint, onVoid, pendingTxnIds }) {
  const [range, setRange] = useState("today"); // today | all
  const [q, setQ] = useState("");
  const [open, setOpen] = useState({});
  const [del, setDel] = useState(null); // transaksi yang akan dihapus (manajer)
  const [busy, setBusy] = useState(false);
  const pName = (id) => products.find((p) => p.id === id)?.name || "Barang";
  const pUnit = (id) => products.find((p) => p.id === id)?.unit || "";

  // Nomor nota cadangan untuk transaksi lama (sebelum nomor nota disimpan ke log):
  // diturunkan dari waktu transaksi dengan format yang sama seperti nota asli.
  const noFromTs = (ts) => {
    if (!ts) return "INV-—";
    const d = new Date(ts); const p2 = (n) => String(n).padStart(2, "0");
    return `INV-${String(d.getFullYear()).slice(2)}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`;
  };

  // Kelompokkan baris per transaksi (txnId)
  const txns = useMemo(() => {
    const map = {};
    salesLog.forEach((s) => {
      if (!s.txnId || String(s.txnId).startsWith("RTR-")) return; // baris retur tampil di tab Retur & Tukar
      if (!map[s.txnId]) map[s.txnId] = { txnId: s.txnId, ts: s.ts, cashier: s.cashier || "—", method: s.method || "-", payments: null, no: null, items: [], total: 0, qty: 0 };
      const t = map[s.txnId];
      t.items.push({ pid: s.productId, name: pName(s.productId), qty: s.qty, qtyLabel: s.qtyLabel || `${num(s.qty)} ${pUnit(s.productId)}`.trim(), lineTotal: s.revenue });
      t.total += s.revenue; t.qty += s.qty;
      if (!t.payments && s.payments && s.payments.length) t.payments = s.payments;
      if (!t.no && s.receiptNo) t.no = s.receiptNo;
      if (s.ts && (!t.ts || s.ts < t.ts)) t.ts = s.ts;
    });
    return Object.values(map)
      .map((t) => ({ ...t, no: t.no || noFromTs(t.ts) }))
      .sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }, [salesLog, products]);

  const isToday = (ts) => ts && new Date(ts).toDateString() === new Date().toDateString();
  const effRange = managerMode ? range : "today"; // kasir: hanya hari ini
  let list = effRange === "today" ? txns.filter((t) => isToday(t.ts)) : txns;
  const term = q.trim().toLowerCase();
  if (term) list = list.filter((t) => (t.no + " " + t.cashier + " " + t.items.map((i) => i.name).join(" ")).toLowerCase().includes(term));

  const total = list.reduce((a, t) => a + t.total, 0);
  const byCashier = {};
  list.forEach((t) => { byCashier[t.cashier] = (byCashier[t.cashier] || 0) + t.total; });
  const byMethod = {};
  list.forEach((t) => {
    if (t.payments) t.payments.forEach((p) => { byMethod[p.method] = (byMethod[p.method] || 0) + (Number(p.amount) || 0); });
    else byMethod[t.method] = (byMethod[t.method] || 0) + t.total;
  });

  const fmtTime = (ts) => ts ? new Date(ts).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="stack">
      <div className="acc-toolbar">
        {managerMode ? (
          <div className="seg">
            <button className={`seg-btn ${range === "today" ? "on" : ""}`} onClick={() => setRange("today")}>Hari ini</button>
            <button className={`seg-btn ${range === "all" ? "on" : ""}`} onClick={() => setRange("all")}>90 hari</button>
          </div>
        ) : (
          <div className="muted" style={{ fontSize: 13 }}>Transaksi <b>hari ini</b> — cetak ulang nota bila pelanggan membutuhkan.</div>
        )}
        <div className="search" style={{ maxWidth: 300 }}>
          <Search size={15} />
          <input placeholder="Cari no. nota / kasir / barang…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {managerMode && (
        <div className="grid-4">
          <Stat icon={Wallet} accent label={effRange === "today" ? "Penjualan hari ini" : "Total penjualan"} value={rp(total)} sub={`${list.length} transaksi`} />
          <Stat icon={ShoppingCart} label="Barang terjual" value={num(list.reduce((a, t) => a + t.qty, 0))} sub="total unit" />
          <Stat icon={Banknote} label="Tunai" value={rp(byMethod.cash || 0)} sub="metode tunai" />
          <Stat icon={Landmark} label="Non-tunai" value={rp(total - (byMethod.cash || 0))} sub="transfer/qris/kartu/order" />
        </div>
      )}

      {managerMode && (
        <section className="card">
          <div className="card-head"><h2>Penjualan per kasir</h2></div>
          <div className="cashier-chips">
            {Object.keys(byCashier).length === 0 && <div className="empty">Belum ada transaksi.</div>}
            {Object.entries(byCashier).sort((a, b) => b[1] - a[1]).map(([c, v]) => (
              <div key={c} className="cashier-chip">
                <div className="cc-ava">{(c[0] || "?").toUpperCase()}</div>
                <div><div className="cc-name">{c}</div><div className="cc-val">{rp(v)}</div></div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <div className="card-head">
          <h2>Daftar transaksi</h2>
          <span className="muted">{list.length} transaksi{managerMode ? ` · ${rp(total)}` : ""}</span>
        </div>
        <div className="txn-list">
          {list.length === 0 && <div className="empty">Belum ada transaksi pada periode ini.</div>}
          {list.map((t) => (
            <div key={t.txnId} className={`txn ${open[t.txnId] ? "open" : ""}`}>
              <div className="txn-head" role="button" tabIndex={0}
                onClick={() => setOpen((o) => ({ ...o, [t.txnId]: !o[t.txnId] }))}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpen((o) => ({ ...o, [t.txnId]: !o[t.txnId] })); }}>
                <div className="txn-time">
                  {fmtTime(t.ts)} <span className="txn-no">{t.no}</span>
                  {pendingTxnIds?.has?.(t.txnId) && <span className="txn-unsynced" title="Masih tersimpan di perangkat, belum masuk server">Belum tersinkron</span>}
                </div>
                <div className="txn-cashier"><User size={12} /> {t.cashier}</div>
                <div className={`txn-method m-${t.method}`}>{PAY_LABEL[t.method] || t.method}</div>
                <div className="txn-qty">{t.qty} brg</div>
                <div className="txn-total">{rp(t.total)}</div>
                <div className="txn-acts" onClick={(e) => e.stopPropagation()}>
                  <button className="icon-btn xs" title="Cetak ulang nota" onClick={() => onPrint(t)}><Printer size={15} /></button>
                  {managerMode && (
                    <button className="icon-btn xs danger-h" title="Hapus transaksi (salah input)" onClick={() => setDel(t)}><Trash2 size={15} /></button>
                  )}
                </div>
                <ChevronRight size={15} className="txn-caret" />
              </div>
              {open[t.txnId] && (
                <div className="txn-items">
                  {t.items.map((it, i) => (
                    <div key={i} className="txn-item"><span>{it.qtyLabel} · {it.name}</span><span className="tab">{rp(it.lineTotal)}</span></div>
                  ))}
                  {t.payments && t.payments.length > 1 && (
                    <div className="txn-pays">
                      {t.payments.map((p, i) => (
                        <div key={i} className="txn-item pay"><span>Bayar · {PAY_LABEL[p.method] || p.method}</span><span className="tab">{rp(Number(p.amount) || 0)}</span></div>
                      ))}
                    </div>
                  )}
                  <div className="txn-item-foot">
                    <button className="btn ghost sm" onClick={() => onPrint(t)}><Printer size={14} /> Cetak ulang nota</button>
                    {managerMode && <button className="btn ghost sm danger-h" onClick={() => setDel(t)}><Trash2 size={14} /> Hapus transaksi</button>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <Modal
        open={!!del}
        onClose={() => { if (!busy) setDel(null); }}
        title="Hapus transaksi?"
        footer={
          <>
            <button className="btn ghost" disabled={busy} onClick={() => setDel(null)}>Batal</button>
            <button className="btn danger" disabled={busy} onClick={async () => {
              setBusy(true);
              const ok = await onVoid(del);
              setBusy(false);
              if (ok !== false) setDel(null);
            }}><Trash2 size={15} /> {busy ? "Menghapus…" : "Ya, hapus"}</button>
          </>
        }
      >
        {del && (
          <div className="confirm-text">
            <p style={{ margin: "0 0 8px" }}>
              Transaksi <b>{del.no}</b> ({fmtTime(del.ts)}) oleh <b>{del.cashier}</b> senilai <b>{rp(del.total)}</b> akan
              dihapus <b>permanen</b> dari riwayat & laporan akuntansi.
            </p>
            <p style={{ margin: "0 0 8px" }}>
              Stok barang <b>dikembalikan otomatis</b> ({del.items.map((it) => `${num(it.qty)}× ${it.name}`).join(", ")}).
            </p>
            {del.method === "hutang" && (
              <div className="pay-note warn">Transaksi ini tercatat sebagai <b>hutang</b>. Hapus juga catatan hutangnya di halaman <b>Hutang</b> agar tidak tertagih dua kali.</div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export {
  SalesHistory
};

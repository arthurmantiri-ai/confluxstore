import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowLeftRight, ArrowUpRight, Banknote, ChevronRight, PackageX, Printer, Search, Undo2 } from "lucide-react";
import { Stat } from "../components/ui";
import { PAY_LABEL, RETURN_CONDITION_LABEL, RETURN_REASON_LABEL } from "../lib/constants";
import { num, rp } from "../lib/format";
import { ReturnFlow } from "./ReturnFlow";

/* =============================== Styles =============================== */

/* ============================ Retur & Tukar ============================ */
function ReturnsView({ products, salesLog, returns, managerMode, cashierName, onSubmit, onPrint, flash }) {
  const [flowOpen, setFlowOpen] = useState(false);
  const [range, setRange] = useState("today");
  const [hq, setHq] = useState("");
  const [openRow, setOpenRow] = useState({});
  const pById = (id) => products.find((p) => p.id === id);

  // Kelompokkan penjualan jadi transaksi untuk pemilih "cari nota" (abaikan baris retur).
  const salesTxns = useMemo(() => {
    const map = {};
    salesLog.forEach((s) => {
      if (!s.txnId || String(s.txnId).startsWith("RTR-")) return;
      if (!map[s.txnId]) map[s.txnId] = { txnId: s.txnId, no: s.receiptNo || null, ts: s.ts, cashier: s.cashier || "—", method: s.method || "-", lines: {} };
      const t = map[s.txnId];
      if (s.ts && (!t.ts || s.ts < t.ts)) t.ts = s.ts;
      if (!t.no && s.receiptNo) t.no = s.receiptNo;
      const pid = s.productId;
      if (!t.lines[pid]) t.lines[pid] = { pid, qty: 0, revenue: 0, cost: 0 };
      t.lines[pid].qty += s.qty; t.lines[pid].revenue += s.revenue; t.lines[pid].cost += s.cost;
    });
    const noFromTs = (ts) => { if (!ts) return "INV-—"; const d = new Date(ts); const p = (n) => String(n).padStart(2, "0"); return `INV-${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; };
    return Object.values(map).map((t) => {
      const items = Object.values(t.lines).filter((l) => l.qty > 0).map((l) => {
        const p = pById(l.pid);
        return { pid: l.pid, name: p?.name || "Barang", unit: p?.unit || "", soldQty: l.qty, unitPrice: l.qty ? l.revenue / l.qty : 0, unitCost: l.qty ? l.cost / l.qty : 0 };
      });
      return { ...t, no: t.no || noFromTs(t.ts), items, total: items.reduce((a, l) => a + l.soldQty * l.unitPrice, 0), qty: items.reduce((a, l) => a + l.soldQty, 0) };
    }).filter((t) => t.items.length > 0).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }, [salesLog, products]);

  // Sudah diretur per (nota, barang) untuk cegah retur berlebih.
  const returnedByTxn = useMemo(() => {
    const m = {};
    (returns || []).forEach((r) => {
      if (!r.originalTxnId) return;
      (r.items || []).forEach((it) => {
        if (it.direction !== "in" || !it.productId) return;
        const k = r.originalTxnId + "|" + it.productId;
        m[k] = (m[k] || 0) + it.qty;
      });
    });
    return m;
  }, [returns]);

  const isToday = (ts) => ts && new Date(ts).toDateString() === new Date().toDateString();
  const effRange = managerMode ? range : "today";
  let hist = effRange === "today" ? (returns || []).filter((r) => isToday(r.ts)) : (returns || []);
  const term = hq.trim().toLowerCase();
  if (term) hist = hist.filter((r) => (r.returnNo + " " + r.cashier + " " + (r.items || []).map((i) => i.productName).join(" ")).toLowerCase().includes(term));

  const totRefund = hist.reduce((a, r) => a + (r.netAmount < 0 ? -r.netAmount : 0), 0);
  const totDamaged = hist.reduce((a, r) => a + (r.items || []).filter((it) => it.direction === "in" && !it.restock).reduce((x, it) => x + it.costTotal, 0), 0);
  const totExchange = hist.filter((r) => r.kind === "exchange").length;
  const fmtTime = (ts) => ts ? new Date(ts).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="stack">
      <div className="acc-toolbar">
        {managerMode ? (
          <div className="seg">
            <button className={range === "today" ? "on" : ""} onClick={() => setRange("today")}>Hari ini</button>
            <button className={range === "all" ? "on" : ""} onClick={() => setRange("all")}>Semua</button>
          </div>
        ) : <div className="muted" style={{ fontSize: 13 }}>Retur & tukar <b>hari ini</b></div>}
        <div className="search" style={{ maxWidth: 260 }}>
          <Search size={15} />
          <input placeholder="Cari no. retur / kasir / barang…" value={hq} onChange={(e) => setHq(e.target.value)} />
        </div>
        <button className="btn" onClick={() => setFlowOpen(true)}><Undo2 size={16} /> Retur Baru</button>
      </div>

      {managerMode && (
        <div className="grid-4">
          <Stat icon={Undo2} accent label="Jumlah retur" value={num(hist.length)} sub={effRange === "today" ? "hari ini" : "total"} />
          <Stat icon={Banknote} label="Uang dikembalikan" value={rp(totRefund)} sub="ke pelanggan" />
          <Stat icon={PackageX} label="Kerugian barang rusak" value={rp(totDamaged)} sub="tidak bisa dijual lagi" />
          <Stat icon={ArrowLeftRight} label="Tukar barang" value={num(totExchange)} sub="dari total retur" />
        </div>
      )}

      <section className="card">
        <div className="card-head"><h2>Riwayat retur & tukar</h2><span className="muted">{hist.length} retur</span></div>
        <div className="txn-list">
          {hist.length === 0 && <div className="empty">Belum ada retur pada periode ini. Klik <b>Retur Baru</b> untuk memulai.</div>}
          {hist.map((r) => {
            const ins = (r.items || []).filter((it) => it.direction === "in");
            const outs = (r.items || []).filter((it) => it.direction === "out");
            return (
              <div key={r.id} className={`txn ${openRow[r.id] ? "open" : ""}`}>
                <div className="txn-head" role="button" tabIndex={0}
                  onClick={() => setOpenRow((o) => ({ ...o, [r.id]: !o[r.id] }))}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpenRow((o) => ({ ...o, [r.id]: !o[r.id] })); }}>
                  <div className="txn-time">{fmtTime(r.ts)} <span className="txn-no">{r.returnNo}</span></div>
                  <div className={`ret-badge ${r.kind === "exchange" ? "ex" : "rf"}`}>{r.kind === "exchange" ? <><ArrowLeftRight size={11} /> Tukar</> : <><Undo2 size={11} /> Retur</>}</div>
                  <div className="ret-reason-col">{RETURN_REASON_LABEL[r.reason] || r.reason}</div>
                  <div className={`ret-net ${r.netAmount >= 0 ? "pos" : "neg"}`}>{r.netAmount >= 0 ? "+" : "−"}{rp(Math.abs(r.netAmount))}</div>
                  <div className="txn-acts" onClick={(e) => e.stopPropagation()}>
                    <button className="icon-btn xs" title="Cetak nota retur" onClick={() => onPrint(r)}><Printer size={15} /></button>
                  </div>
                  <ChevronRight size={15} className="txn-caret" />
                </div>
                {openRow[r.id] && (
                  <div className="txn-items">
                    {ins.map((it, i) => (
                      <div key={"i" + i} className="txn-item">
                        <span><ArrowDownRight size={13} className="ret-ic-in" /> {num(it.qty)}× {it.productName} {it.restock ? <span className="ret-tag ok">masuk stok</span> : <span className="ret-tag bad">{RETURN_CONDITION_LABEL[it.condition] || "rusak"}</span>}</span>
                        <span className="tab">−{rp(it.lineTotal)}</span>
                      </div>
                    ))}
                    {outs.map((it, i) => (
                      <div key={"o" + i} className="txn-item">
                        <span><ArrowUpRight size={13} className="ret-ic-out" /> {num(it.qty)}× {it.productName} <span className="ret-tag ex">pengganti</span></span>
                        <span className="tab">{rp(it.lineTotal)}</span>
                      </div>
                    ))}
                    <div className="txn-item ret-foot-sep">
                      <span className="muted">{r.netAmount >= 0 ? "Pelanggan bayar" : "Uang dikembalikan"}{r.settlement ? ` · ${PAY_LABEL[r.settlement] || r.settlement}` : ""} · Kasir {r.cashier}</span>
                      <span className="tab">{rp(Math.abs(r.netAmount))}</span>
                    </div>
                    {r.note && <div className="txn-item"><span className="muted">Catatan: {r.note}</span></div>}
                    <div className="txn-item-foot">
                      <button className="btn ghost sm" onClick={() => onPrint(r)}><Printer size={14} /> Cetak nota retur</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {flowOpen && (
        <ReturnFlow
          products={products} salesTxns={salesTxns} returnedByTxn={returnedByTxn}
          cashierName={cashierName} onClose={() => setFlowOpen(false)} onSubmit={onSubmit}
        />
      )}
    </div>
  );
}

export {
  ReturnsView
};

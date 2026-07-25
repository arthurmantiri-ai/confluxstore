import { useMemo, useState } from "react";
import { ArrowLeftRight, Banknote, Check, ClipboardList, Minus, PackageX, Pencil, Plus, Search, X } from "lucide-react";
import { Modal } from "../components/ui";
import { returnNoGen } from "../lib/config";
import { PAY_LABEL, REFUND_METHODS, RETURN_CONDITIONS, RETURN_REASONS, RETURN_REASON_LABEL } from "../lib/constants";
import { num, rp, uid } from "../lib/format";
import { effPrice } from "../lib/inventory";

function ReturnFlow({ products, salesTxns, returnedByTxn, cashierName, onClose, onSubmit }) {
  const [srcMode, setSrcMode] = useState("nota"); // 'nota' | 'manual'
  const [srcTxn, setSrcTxn] = useState(null);
  const [txnQ, setTxnQ] = useState("");
  const [retSel, setRetSel] = useState({});        // pid -> { qty, condition }
  const [manualItems, setManualItems] = useState([]); // [{pid, qty, unitPrice, condition}]
  const [manualQ, setManualQ] = useState("");
  const [exchange, setExchange] = useState(false);
  const [exSel, setExSel] = useState({});          // pid -> qty
  const [exQ, setExQ] = useState("");
  const [settlement, setSettlement] = useState("cash");
  const [reason, setReason] = useState("rusak");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const pById = (id) => products.find((p) => p.id === id);
  const fmtT = (ts) => ts ? new Date(ts).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

  const pickList = useMemo(() => {
    const t = txnQ.trim().toLowerCase();
    if (!t) return salesTxns.slice(0, 40);
    return salesTxns.filter((x) => (x.no + " " + x.items.map((i) => i.name).join(" ")).toLowerCase().includes(t)).slice(0, 40);
  }, [salesTxns, txnQ]);
  const filterProd = (term) => { const t = term.trim().toLowerCase(); if (!t) return []; return products.filter((p) => (p.name + " " + (p.sku || "") + " " + (p.code || "")).toLowerCase().includes(t)).slice(0, 8); };

  const srcLines = useMemo(() => {
    if (srcMode !== "nota" || !srcTxn) return [];
    return srcTxn.items.map((l) => {
      const already = returnedByTxn[srcTxn.txnId + "|" + l.pid] || 0;
      return { ...l, already, maxQty: Math.max(0, l.soldQty - already) };
    });
  }, [srcMode, srcTxn, returnedByTxn]);

  const returnLines = useMemo(() => {
    if (srcMode === "nota") {
      return srcLines.filter((l) => (retSel[l.pid]?.qty || 0) > 0).map((l) => {
        const cond = retSel[l.pid]?.condition || "baik";
        const c = RETURN_CONDITIONS.find((x) => x.key === cond);
        return { productId: l.pid, name: l.name, qty: retSel[l.pid].qty, unitPrice: l.unitPrice, unitCost: l.unitCost, restock: !!c?.restock, condition: cond };
      });
    }
    return manualItems.filter((m) => m.qty > 0 && m.pid).map((m) => {
      const c = RETURN_CONDITIONS.find((x) => x.key === m.condition) || RETURN_CONDITIONS[0];
      const p = pById(m.pid);
      return { productId: m.pid, name: p?.name || "Barang", qty: m.qty, unitPrice: Number(m.unitPrice) || 0, unitCost: p?.cost || 0, restock: !!c.restock, condition: m.condition };
    });
  }, [srcMode, srcLines, retSel, manualItems, products]);

  const exLines = useMemo(() => Object.entries(exSel).filter(([, q]) => q > 0).map(([pid, q]) => {
    const p = pById(pid);
    return { productId: pid, name: p?.name || "Barang", qty: q, unitPrice: effPrice(p?.price || 0, p?.promo), stock: p?.stock || 0 };
  }), [exSel, products]);

  const refundTotal = returnLines.reduce((a, l) => a + l.qty * l.unitPrice, 0);
  const exchangeTotal = exchange ? exLines.reduce((a, l) => a + l.qty * l.unitPrice, 0) : 0;
  const net = exchangeTotal - refundTotal;
  const exStockOk = !exchange || exLines.every((l) => l.qty <= l.stock);
  const canSubmit = returnLines.length > 0 && (!exchange || exLines.length > 0) && exStockOk && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    const returnNo = returnNoGen();
    const payload = {
      clientId: uid(), returnNo, originalTxnId: srcMode === "nota" ? (srcTxn?.txnId || null) : null,
      kind: exchange && exLines.length ? "exchange" : "refund", reason, settlement: net !== 0 ? settlement : null,
      note: note.trim() || null, date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
      returns: returnLines.map((l) => ({ productId: l.productId, qty: l.qty, unitPrice: l.unitPrice, unitCost: l.unitCost, restock: l.restock, condition: l.condition, reason })),
      exchanges: exchange ? exLines.map((l) => ({ productId: l.productId, qty: l.qty, unitPrice: l.unitPrice })) : [],
    };
    const receipt = {
      kind: "retur", no: returnNo,
      date: new Date().toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      cashier: cashierName || "Kasir", reasonLabel: RETURN_REASON_LABEL[reason] || reason,
      items: returnLines.map((l) => ({ name: l.name, qtyLabel: `${num(l.qty)}× ${l.restock ? "" : "(rusak) "}`.trim(), lineTotal: l.qty * l.unitPrice })),
      exItems: exchange ? exLines.map((l) => ({ name: l.name, qtyLabel: `${num(l.qty)}×`, lineTotal: l.qty * l.unitPrice })) : [],
      refundTotal, exchangeTotal, net, settlementLabel: PAY_LABEL[settlement] || settlement,
    };
    const res = await onSubmit(payload, receipt);
    setBusy(false);
    if (res && res.status !== "error") onClose();
  };

  const btnLabel = busy ? "Memproses…"
    : (!exchange || !exLines.length) ? `Proses — kembalikan ${rp(refundTotal)}`
    : net > 0 ? `Proses — tagih ${rp(net)}`
    : net < 0 ? `Proses — kembalikan ${rp(-net)}`
    : "Proses tukar (pas)";

  return (
    <Modal open onClose={() => { if (!busy) onClose(); }} width={640} title="Retur / Tukar Barang"
      footer={<>
        <button className="btn ghost" disabled={busy} onClick={onClose}>Batal</button>
        <button className="btn" disabled={!canSubmit} onClick={submit}>{busy ? btnLabel : <><Check size={15} /> {btnLabel}</>}</button>
      </>}>
      <div className="ret-flow">
        <div className="ret-seg">
          <button className={`ret-seg-btn ${srcMode === "nota" ? "on" : ""}`} onClick={() => { setSrcMode("nota"); }}><ClipboardList size={15} /> Dari nota penjualan</button>
          <button className={`ret-seg-btn ${srcMode === "manual" ? "on" : ""}`} onClick={() => { setSrcMode("manual"); }}><PackageX size={15} /> Tanpa nota</button>
        </div>

        {srcMode === "nota" && !srcTxn && (
          <div className="ret-block">
            <div className="ret-label">Pilih transaksi asal</div>
            <div className="search"><Search size={15} /><input placeholder="Cari no. nota / barang…" value={txnQ} onChange={(e) => setTxnQ(e.target.value)} /></div>
            <div className="ret-picker">
              {pickList.length === 0 && <div className="empty">Tidak ada transaksi cocok.</div>}
              {pickList.map((t) => (
                <button key={t.txnId} className="ret-opt" onClick={() => { setSrcTxn(t); setRetSel({}); }}>
                  <div className="ret-opt-l"><div className="ret-opt-no">{t.no}</div><div className="muted xs">{fmtT(t.ts)} · {num(t.qty)} brg · {t.items.map((i) => i.name).slice(0, 2).join(", ")}{t.items.length > 2 ? "…" : ""}</div></div>
                  <div className="ret-opt-tot">{rp(t.total)}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {srcMode === "nota" && srcTxn && (
          <div className="ret-block">
            <div className="ret-src-head">
              <div><span className="ret-label" style={{ display: "inline" }}>Nota</span> <b>{srcTxn.no}</b> <span className="muted xs">· {fmtT(srcTxn.ts)}</span></div>
              <button className="link-btn" onClick={() => { setSrcTxn(null); setRetSel({}); }}>Ganti nota</button>
            </div>
            <div className="ret-lines">
              {srcLines.map((l) => {
                const sel = retSel[l.pid] || { qty: 0, condition: "baik" };
                const off = l.maxQty <= 0;
                return (
                  <div key={l.pid} className={`ret-line ${sel.qty > 0 ? "on" : ""} ${off ? "off" : ""}`}>
                    <div className="ret-line-main">
                      <div className="ret-line-name">{l.name}</div>
                      <div className="muted xs">Beli {num(l.soldQty)} {l.unit} · {rp(l.unitPrice)}/{l.unit}{l.already > 0 ? ` · sudah diretur ${num(l.already)}` : ""}{off ? " · habis diretur" : ""}</div>
                    </div>
                    <div className="stepper sm">
                      <button disabled={sel.qty <= 0} onClick={() => setRetSel((s) => ({ ...s, [l.pid]: { ...sel, qty: Math.max(0, sel.qty - 1) } }))}><Minus size={14} /></button>
                      <span>{sel.qty}</span>
                      <button disabled={sel.qty >= l.maxQty} onClick={() => setRetSel((s) => ({ ...s, [l.pid]: { ...sel, qty: Math.min(l.maxQty, sel.qty + 1) } }))}><Plus size={14} /></button>
                    </div>
                    {sel.qty > 0 && (
                      <select className="ret-cond" value={sel.condition} onChange={(e) => setRetSel((s) => ({ ...s, [l.pid]: { ...sel, condition: e.target.value } }))}>
                        {RETURN_CONDITIONS.map((c) => <option key={c.key} value={c.key}>{c.label} — {c.hint}</option>)}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {srcMode === "manual" && (
          <div className="ret-block">
            <div className="ret-label">Barang yang diretur</div>
            {manualItems.map((m, i) => { const p = pById(m.pid); return (
              <div key={i} className="ret-line on">
                <div className="ret-line-main">
                  <div className="ret-line-name">{p?.name || "—"}</div>
                  <div className="ret-manual-row">
                    <div className="stepper sm">
                      <button disabled={m.qty <= 1} onClick={() => setManualItems((a) => a.map((x, j) => (j === i ? { ...x, qty: Math.max(1, x.qty - 1) } : x)))}><Minus size={14} /></button>
                      <span>{m.qty}</span>
                      <button onClick={() => setManualItems((a) => a.map((x, j) => (j === i ? { ...x, qty: x.qty + 1 } : x)))}><Plus size={14} /></button>
                    </div>
                    <div className="ret-price-in"><span>Rp</span><input type="number" value={m.unitPrice} onChange={(e) => setManualItems((a) => a.map((x, j) => (j === i ? { ...x, unitPrice: e.target.value } : x)))} /></div>
                    <select className="ret-cond" value={m.condition} onChange={(e) => setManualItems((a) => a.map((x, j) => (j === i ? { ...x, condition: e.target.value } : x)))}>
                      {RETURN_CONDITIONS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                    <button className="icon-btn xs" onClick={() => setManualItems((a) => a.filter((_, j) => j !== i))}><X size={13} /></button>
                  </div>
                </div>
              </div>
            ); })}
            <div className="search" style={{ marginTop: 8 }}><Search size={15} /><input placeholder="Cari barang untuk diretur…" value={manualQ} onChange={(e) => setManualQ(e.target.value)} /></div>
            {manualQ.trim() && (
              <div className="ret-cat-picker">
                {filterProd(manualQ).map((p) => (
                  <button key={p.id} className="ret-cat-opt" onClick={() => { if (!manualItems.find((m) => m.pid === p.id)) setManualItems((a) => [...a, { pid: p.id, qty: 1, unitPrice: effPrice(p.price, p.promo), condition: "baik" }]); setManualQ(""); }}>
                    <span>{p.name}</span><span className="muted xs">{rp(effPrice(p.price, p.promo))}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {returnLines.length > 0 && (
          <div className="ret-block">
            <div className="ret-label">Alasan retur</div>
            <div className="ret-pills">
              {RETURN_REASONS.map((r) => (
                <button key={r.key} className={`ret-pill ${reason === r.key ? "on" : ""}`} onClick={() => setReason(r.key)}>{r.label}</button>
              ))}
            </div>
          </div>
        )}

        {returnLines.length > 0 && (
          <div className="ret-block">
            <div className="ret-seg">
              <button className={`ret-seg-btn ${!exchange ? "on" : ""}`} onClick={() => setExchange(false)}><Banknote size={15} /> Kembalikan uang</button>
              <button className={`ret-seg-btn ${exchange ? "on" : ""}`} onClick={() => setExchange(true)}><ArrowLeftRight size={15} /> Tukar barang</button>
            </div>
            {exchange && (
              <div style={{ marginTop: 10 }}>
                <div className="ret-label">Barang pengganti</div>
                <div className="ret-lines">
                  {exLines.map((l) => (
                    <div key={l.productId} className="ret-line on">
                      <div className="ret-line-main">
                        <div className="ret-line-name">{l.name}</div>
                        <div className="muted xs">{rp(l.unitPrice)} · stok {num(l.stock)}{l.qty > l.stock ? " · STOK KURANG" : ""}</div>
                      </div>
                      <div className="stepper sm">
                        <button onClick={() => setExSel((s) => { const n = { ...s }; const v = (n[l.productId] || 0) - 1; if (v <= 0) delete n[l.productId]; else n[l.productId] = v; return n; })}><Minus size={14} /></button>
                        <span>{l.qty}</span>
                        <button disabled={l.qty >= l.stock} onClick={() => setExSel((s) => ({ ...s, [l.productId]: (s[l.productId] || 0) + 1 }))}><Plus size={14} /></button>
                      </div>
                      <div className="ret-line-tot tab">{rp(l.qty * l.unitPrice)}</div>
                    </div>
                  ))}
                </div>
                <div className="search" style={{ marginTop: 8 }}><Search size={15} /><input placeholder="Cari barang pengganti…" value={exQ} onChange={(e) => setExQ(e.target.value)} /></div>
                {exQ.trim() && (
                  <div className="ret-cat-picker">
                    {filterProd(exQ).map((p) => {
                      const left = p.stock - (exSel[p.id] || 0);
                      return (
                        <button key={p.id} className="ret-cat-opt" disabled={left < 1} onClick={() => { setExSel((s) => ({ ...s, [p.id]: (s[p.id] || 0) + 1 })); setExQ(""); }}>
                          <span>{p.name}</span><span className="muted xs">{rp(effPrice(p.price, p.promo))} · stok {num(p.stock)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {returnLines.length > 0 && (
          <div className="ret-summary">
            <div className="ret-sum-row"><span>Nilai barang diretur</span><span className="tab">−{rp(refundTotal)}</span></div>
            {exchange && <div className="ret-sum-row"><span>Nilai barang pengganti</span><span className="tab">+{rp(exchangeTotal)}</span></div>}
            <div className={`ret-sum-net ${net >= 0 ? "pos" : "neg"}`}>
              <span>{net > 0 ? "Pelanggan harus bayar" : net < 0 ? "Kembalikan ke pelanggan" : "Tidak ada uang berpindah"}</span>
              <span className="tab big">{rp(Math.abs(net))}</span>
            </div>
            {net !== 0 && (
              <>
                <div className="ret-label" style={{ marginTop: 4 }}>{net > 0 ? "Pelanggan bayar via" : "Kembalikan uang via"}</div>
                <div className="ret-methods">
                  {REFUND_METHODS.map((m) => { const Icon = m.icon; return (
                    <button key={m.key} className={`pay-method ${settlement === m.key ? "on" : ""}`} onClick={() => setSettlement(m.key)}><Icon size={16} /><span>{m.label}</span></button>
                  ); })}
                </div>
              </>
            )}
            <div className="ret-note"><Pencil size={13} /><input placeholder="Catatan (opsional)" value={note} onChange={(e) => setNote(e.target.value)} /></div>
            {exchange && !exStockOk && <div className="pay-note warn">Ada barang pengganti melebihi stok. Kurangi jumlahnya dulu.</div>}
          </div>
        )}
      </div>
    </Modal>
  );
}

export {
  ReturnFlow
};

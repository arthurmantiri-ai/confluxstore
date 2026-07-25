import { useRef, useState } from "react";
import { Check, ChevronRight, Globe, Phone, Plus } from "lucide-react";
import { waLink } from "../lib/customers";
import { fmtAt, num, rp } from "../lib/format";
import { CHANNEL_ICON, ORDER_FLOW, ORDER_LABEL, PAY_SHORT } from "../lib/orders";
import { OrderForm } from "./OrderForm";

function Orders({ orders, setOrders, pById, products, onAccept, onStatus, onCreate, flash }) {
  const [tab, setTab] = useState("baru");
  const [creating, setCreating] = useState(false);

  const orderTotal = (o) => o.items.reduce((a, it) => a + (pById(it.pid)?.price || 0) * it.qty, 0);
  const counts = ORDER_FLOW.reduce((acc, s) => ({ ...acc, [s]: orders.filter((o) => o.status === s).length }), {});

  const waText = (o) => {
    const lines = o.items.map((it) => `• ${it.qty}× ${pById(it.pid)?.name || "Barang"}`).join("\n");
    const status = { baru: "sudah kami terima ✅", diproses: "sedang kami siapkan 🛠️", dikirim: "sudah dikirim 🚚", selesai: "sudah selesai 🎉" }[o.status];
    return `Halo ${o.customer || ""}, pesanan *${o.id}* Anda ${status}.\n\n${lines}\n\nTotal: ${rp(orderTotal(o))}\n\nTerima kasih sudah berbelanja di Conflux Coffee Club! ☕`;
  };

  // Rem anti ketuk-ganda: "Terima order" memotong stok — dua ketukan cepat sebelum
  // layar sempat berganti akan memotong stok dua kali. (Diagnostik 16 Jul: belum
  // pernah terjadi; rem ini asuransi murah supaya tetap begitu.)
  const busyRef = useRef(false);
  const advance = (o) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setTimeout(() => { busyRef.current = false; }, 800);
    const i = ORDER_FLOW.indexOf(o.status);
    const next = ORDER_FLOW[Math.min(i + 1, ORDER_FLOW.length - 1)];
    // Terima order (baru → diproses) = potong stok + catat penjualan. Bila onAccept
    // menolak (barang hilang / data belum siap), JANGAN majukan status — biarkan order
    // tetap "baru" agar bisa diperbaiki dulu.
    if (o.status === "baru") {
      const ok = onAccept(o);
      if (ok === false) { busyRef.current = false; return; }
    }
    setOrders((os) => os.map((x) => (x.id === o.id ? { ...x, status: next } : x)));
    onStatus && onStatus(o.id, next);
    if (o.status !== "baru") flash(`${o.id} → ${ORDER_LABEL[next]}`);
  };

  const list = orders.filter((o) => o.status === tab);

  return (
    <div className="stack">
      <div className="acc-toolbar">
        <div className="muted" style={{ fontSize: 13 }}>Catat pesanan masuk (WhatsApp / IG / marketplace) lalu proses sampai selesai.</div>
        <button className="btn" onClick={() => setCreating(true)}><Plus size={16} /> Order Baru</button>
      </div>

      <div className="order-tabs">
        {ORDER_FLOW.map((s) => (
          <button key={s} className={`order-tab ${tab === s ? "on" : ""}`} onClick={() => setTab(s)}>
            {ORDER_LABEL[s]} {counts[s] > 0 && <span className="tab-count">{counts[s]}</span>}
          </button>
        ))}
      </div>

      <div className="order-grid">
        {list.length === 0 && <div className="empty card">Tidak ada order pada status ini.</div>}
        {list.map((o) => {
          const ChIcon = CHANNEL_ICON[o.channel] || Globe;
          const i = ORDER_FLOW.indexOf(o.status);
          const nextLabel = i < ORDER_FLOW.length - 1 ? ORDER_LABEL[ORDER_FLOW[i + 1]] : null;
          const cta = o.status === "baru" ? "Terima order" : nextLabel ? `Tandai ${nextLabel}` : null;
          return (
            <div key={o.id} className="order-card card">
              <div className="order-card-head">
                <div>
                  <div className="order-id">{o.id}</div>
                  <div className="muted xs">{o.customer} · {fmtAt(o.at)} · bayar: {PAY_SHORT[o.payMethod || "transfer"] || "Transfer"}</div>
                </div>
                <span className="channel"><ChIcon size={13} /> {o.channel}</span>
              </div>
              <div className="order-items">
                {o.items.map((it, idx) => {
                  const p = pById(it.pid);
                  const short = p && p.stock < it.qty;
                  return (
                    <div key={idx} className="order-item">
                      <span>{it.qty}× {p?.name}</span>
                      {short ? <span className="warn-text">stok {num(p.stock)}</span> : <span className="muted tab">{rp((p?.price || 0) * it.qty)}</span>}
                    </div>
                  );
                })}
              </div>
              <div className="order-card-foot">
                <span className="order-total">Total {rp(orderTotal(o))}</span>
                <div className="order-actions">
                  {o.phone && (
                    <a className="btn sm wa" href={waLink(o.phone, waText(o))} target="_blank" rel="noreferrer" title="Kirim update via WhatsApp">
                      <Phone size={14} /> WhatsApp
                    </a>
                  )}
                  {cta && <button className="btn sm" onClick={() => advance(o)}>{cta} <ChevronRight size={14} /></button>}
                  {!cta && <span className="done-tag"><Check size={14} /> Selesai</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {creating && (
        <OrderForm products={products} onClose={() => setCreating(false)} onSave={(data) => { onCreate(data); setCreating(false); }} />
      )}
    </div>
  );
}

export {
  Orders
};

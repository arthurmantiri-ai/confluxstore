import { useState } from "react";
import { Check, ClipboardList, Minus, Phone, Plus, X } from "lucide-react";
import { Modal } from "../components/ui";
import { rp } from "../lib/format";
import { ORDER_PAY_OPTIONS, parseWaOrder } from "../lib/orders";

function OrderForm({ products, onClose, onSave }) {
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState("WhatsApp");
  const [payMethod, setPayMethod] = useState("transfer");
  const [lines, setLines] = useState([]);
  const [pick, setPick] = useState(products[0]?.id || "");
  const [qty, setQty] = useState(1);
  const [waText, setWaText] = useState("");
  const [waInfo, setWaInfo] = useState(null); // { added, unmatched: [] } — ringkasan hasil urai

  const addLine = () => {
    if (!pick || qty < 1) return;
    setLines((ls) => {
      const ex = ls.find((l) => l.pid === pick);
      if (ex) return ls.map((l) => (l.pid === pick ? { ...l, qty: l.qty + Number(qty) } : l));
      return [...ls, { pid: pick, qty: Number(qty) }];
    });
    setQty(1);
  };
  const setLineQty = (pid, q) => setLines((ls) => ls.map((l) => (l.pid === pid ? { ...l, qty: Math.max(1, Math.round(q) || 1) } : l)));
  const removeLine = (pid) => setLines((ls) => ls.filter((l) => l.pid !== pid));

  // Urai pesan WhatsApp yang ditempel → gabungkan ke daftar barang (jumlah dijumlah bila
  // barang yang sama sudah ada). Nama & nomor terisi otomatis bila masih kosong.
  const parseWa = () => {
    const r = parseWaOrder(waText, products);
    setLines((ls) => {
      const next = ls.map((l) => ({ ...l }));
      for (const nl of r.lines) {
        const ex = next.find((x) => x.pid === nl.pid);
        if (ex) ex.qty += nl.qty; else next.push({ ...nl });
      }
      return next;
    });
    if (r.customer && !customer.trim()) setCustomer(r.customer);
    if (r.phone && !phone.trim()) setPhone(r.phone);
    setWaInfo({ added: r.lines.length, unmatched: r.unmatched });
  };

  const total = lines.reduce((a, l) => a + (products.find((p) => p.id === l.pid)?.price || 0) * l.qty, 0);
  const valid = customer.trim() && lines.length > 0;

  return (
    <Modal
      open onClose={onClose} width={540} title="Order Baru"
      footer={<>
        <button className="btn ghost" onClick={onClose}>Batal</button>
        <button className="btn" disabled={!valid} onClick={() => onSave({ customer: customer.trim(), phone: phone.trim(), channel, payMethod, items: lines })}><Check size={15} /> Simpan order</button>
      </>}
    >
      <div className="form">
        <div className="wa-paste">
          <label className="fld"><span><Phone size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />Tempel pesan WhatsApp (opsional)</span>
            <textarea className="wa-textarea" value={waText} onChange={(e) => setWaText(e.target.value)}
              placeholder={"Salin-tempel chat pesanan pelanggan, lalu klik “Urai jadi barang”.\ncth:\n- Kopi Toraja 2 kg\n- Dripp Caramel 1 dus\n- gula aren 3 pcs"} />
          </label>
          <button className="btn sm" type="button" onClick={parseWa} disabled={!waText.trim()}><ClipboardList size={14} /> Urai jadi barang</button>
          {waInfo && (
            <div className="wa-info">
              {waInfo.added > 0
                ? <span className="ok-text">{waInfo.added} barang dikenali & ditambahkan — cek jumlahnya di bawah.</span>
                : <span className="warn-text">Tidak ada barang yang cocok dari pesan itu.</span>}
              {waInfo.unmatched.length > 0 && (
                <div className="wa-unmatched">Tidak dikenali (tambah manual): {waInfo.unmatched.map((u, i) => (
                  <em key={i}>“{u}”{i < waInfo.unmatched.length - 1 ? ", " : ""}</em>
                ))}</div>
              )}
            </div>
          )}
        </div>

        <div className="grid2">
          <label className="fld"><span>Nama pelanggan</span>
            <input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="cth. Kedai Senja" /></label>
          <label className="fld"><span>No. WhatsApp</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" placeholder="cth. 0812xxxxxxx" /></label>
        </div>
        <div className="grid2">
          <label className="fld"><span>Sumber order</span>
            <select className="sim-select" value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option>WhatsApp</option><option>Instagram</option><option>Marketplace</option><option>Telepon</option>
            </select></label>
          <label className="fld"><span>Cara bayar</span>
            <select className="sim-select" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
              {ORDER_PAY_OPTIONS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select></label>
        </div>

        <div className="form-section">Barang dipesan</div>
        <div className="order-pick">
          <select className="sim-select" value={pick} onChange={(e) => setPick(e.target.value)}>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="number" min="1" className="qty-in" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} />
          <button className="btn sm" type="button" onClick={addLine}><Plus size={14} /> Tambah</button>
        </div>
        {lines.length > 0 ? (
          <div className="order-line-list">
            {lines.map((l) => {
              const p = products.find((x) => x.id === l.pid);
              return (
                <div key={l.pid} className="order-line">
                  <span className="ol-name">{p?.name || "— barang tak dikenal —"}</span>
                  <div className="ol-qty">
                    <button className="icon-btn xs" type="button" onClick={() => setLineQty(l.pid, l.qty - 1)} aria-label="kurangi"><Minus size={12} /></button>
                    <input type="number" min="1" className="qty-in" value={l.qty} onChange={(e) => setLineQty(l.pid, Number(e.target.value))} />
                    <button className="icon-btn xs" type="button" onClick={() => setLineQty(l.pid, l.qty + 1)} aria-label="tambah"><Plus size={12} /></button>
                  </div>
                  <span className="muted tab">{rp((p?.price || 0) * l.qty)}</span>
                  <button className="icon-btn xs danger-h" type="button" onClick={() => removeLine(l.pid)} aria-label="hapus"><X size={14} /></button>
                </div>
              );
            })}
            <div className="order-line grand"><span>Total</span><b>{rp(total)}</b></div>
          </div>
        ) : <div className="muted xs">Belum ada barang. Tempel pesan WA di atas, atau pilih barang lalu klik “Tambah”.</div>}
      </div>
    </Modal>
  );
}

export {
  OrderForm
};

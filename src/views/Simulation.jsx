import { useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Calculator, Check, Minus, Plus, RefreshCcw, ShieldCheck, Trash2, TrendingUp, Wallet, X } from "lucide-react";
import { Modal, Pill, Stat } from "../components/ui";
import { num, rp, uid } from "../lib/format";
import { rop, stockStatus, suggestQty } from "../lib/inventory";

/* ============================ Simulasi Stok (khusus manajer) ============================ */

function Simulation({ products, onApply }) {
  const [rows, setRows] = useState([]);
  const [confirm, setConfirm] = useState(false);
  const pById = (id) => products.find((p) => p.id === id);

  const addRow = () => setRows((rs) => [...rs, { id: uid(), pid: "", dir: "in", qty: 1 }]);
  const setRow = (id, patch) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const delRow = (id) => setRows((rs) => rs.filter((r) => r.id !== id));
  const reset = () => setRows([]);
  const fillFromRestock = () => {
    const need = products.filter((p) => stockStatus(p) !== "ok");
    setRows(need.map((p) => ({ id: uid(), pid: p.id, dir: "in", qty: suggestQty(p) })));
  };

  const valid = rows.filter((r) => r.pid && Number(r.qty) > 0);

  const agg = {};
  valid.forEach((r) => {
    if (!agg[r.pid]) agg[r.pid] = { in: 0, out: 0 };
    agg[r.pid][r.dir] += Number(r.qty);
  });

  let pembelian = 0, penjualan = 0, laba = 0;
  valid.forEach((r) => {
    const p = pById(r.pid); if (!p) return;
    if (r.dir === "in") pembelian += p.cost * Number(r.qty);
    else { penjualan += p.price * Number(r.qty); laba += (p.price - p.cost) * Number(r.qty); }
  });
  const arusKas = penjualan - pembelian;

  const proj = Object.keys(agg).map((pid) => {
    const p = pById(pid);
    const masuk = agg[pid].in, keluar = agg[pid].out;
    const akhir = p.stock + masuk - keluar;
    const status = akhir < 0 ? "neg" : akhir <= p.safetyStock ? "crit" : akhir <= rop(p) ? "warn" : "ok";
    const days = p.dailyUsage > 0 ? Math.floor(Math.max(0, akhir) / p.dailyUsage) : null;
    return { p, masuk, keluar, akhir, status, days };
  });
  const anyNeg = proj.some((x) => x.akhir < 0);

  return (
    <div className="stack">
      <div className="sim-intro card">
        <div className="formula-ic"><Calculator size={20} /></div>
        <div style={{ flex: 1 }}>
          <div className="formula-title">Simulasi & Kalkulasi Stok</div>
          <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.5 }}>
            Rencanakan barang masuk (pembelian) dan keluar (penjualan), lihat dampak biaya, pendapatan, laba,
            dan proyeksi stok akhir — <b>tanpa mengubah data asli</b>. Terapkan hanya bila sudah yakin.
          </div>
        </div>
        <span className="lock-chip on" title="Khusus manajer"><ShieldCheck size={15} /> Manajer</span>
      </div>

      <div className="grid-4">
        <Stat icon={ArrowDownRight} label="Total pembelian (modal)" value={rp(pembelian)} sub="dari barang masuk" />
        <Stat icon={ArrowUpRight} accent label="Total penjualan" value={rp(penjualan)} sub="dari barang keluar" />
        <Stat icon={TrendingUp} label="Estimasi laba kotor" value={rp(laba)} sub="penjualan − modal" />
        <Stat icon={Wallet} label="Arus kas bersih" value={rp(arusKas)}
          sub={<span className={arusKas >= 0 ? "up" : "down"}>{arusKas >= 0 ? "surplus" : "defisit"}</span>} />
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Rencana pergerakan barang</h2>
          <div className="sim-head-actions">
            <button className="btn ghost sm" onClick={fillFromRestock}><RefreshCcw size={14} /> Isi dari saran re-stok</button>
            {rows.length > 0 && <button className="btn ghost sm" onClick={reset}><X size={14} /> Reset</button>}
          </div>
        </div>

        {rows.length === 0 && <div className="empty">Belum ada baris. Tambahkan barang, atau isi otomatis dari saran re-stok.</div>}

        <div className="sim-rows">
          {rows.map((r) => {
            const p = pById(r.pid);
            const lineVal = p ? (r.dir === "in" ? p.cost : p.price) * Number(r.qty || 0) : 0;
            return (
              <div key={r.id} className="sim-row">
                <select className="sim-select" value={r.pid} onChange={(e) => setRow(r.id, { pid: e.target.value })}>
                  <option value="">— Pilih barang —</option>
                  {products.map((pp) => <option key={pp.id} value={pp.id}>{pp.code} · {pp.name}</option>)}
                </select>
                <div className="seg sim-seg">
                  <button className={r.dir === "in" ? "on" : ""} onClick={() => setRow(r.id, { dir: "in" })}>Masuk</button>
                  <button className={r.dir === "out" ? "on" : ""} onClick={() => setRow(r.id, { dir: "out" })}>Keluar</button>
                </div>
                <div className="stepper sm">
                  <button onClick={() => setRow(r.id, { qty: Math.max(1, Number(r.qty) - 1) })}><Minus size={14} /></button>
                  <input type="number" value={r.qty} onChange={(e) => setRow(r.id, { qty: Math.max(0, Number(e.target.value)) })} style={{ width: 52 }} />
                  <button onClick={() => setRow(r.id, { qty: Number(r.qty) + 1 })}><Plus size={14} /></button>
                </div>
                <span className="unit sim-unit">{p?.unit || ""}</span>
                <span className={`sim-line-val ${r.dir === "in" ? "neg" : "pos"}`}>
                  {r.dir === "in" ? "−" : "+"}{rp(lineVal)}
                </span>
                <button className="icon-btn xs" onClick={() => delRow(r.id)}><Trash2 size={14} /></button>
              </div>
            );
          })}
        </div>

        <button className="btn ghost sim-add" onClick={addRow}><Plus size={15} /> Tambah baris</button>
      </section>

      {proj.length > 0 && (
        <section className="card pad0">
          <div className="card-head" style={{ padding: "18px 18px 0" }}>
            <h2>Proyeksi stok setelah simulasi</h2>
            {anyNeg && <span className="warn-text">⚠ ada stok tidak mencukupi</span>}
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Barang</th><th className="r">Stok awal</th><th className="r">Masuk</th>
                <th className="r">Keluar</th><th className="r">Stok akhir</th><th>Status</th><th className="r">Tahan</th>
              </tr>
            </thead>
            <tbody>
              {proj.map(({ p, masuk, keluar, akhir, status, days }) => (
                <tr key={p.id}>
                  <td>
                    <div className="strong">{p.name}</div>
                    <div className="muted xs">{p.code}</div>
                  </td>
                  <td className="r tab muted">{num(p.stock)}</td>
                  <td className="r tab" style={{ color: masuk ? "var(--ok)" : "var(--ink-faint)" }}>{masuk ? "+" + num(masuk) : "—"}</td>
                  <td className="r tab" style={{ color: keluar ? "var(--crit)" : "var(--ink-faint)" }}>{keluar ? "−" + num(keluar) : "—"}</td>
                  <td className="r tab strong" style={status === "neg" ? { color: "var(--crit)" } : {}}>{num(akhir)} <span className="unit">{p.unit}</span></td>
                  <td>{status === "neg" ? <span className="pill pill-crit">Tak cukup</span> : <Pill status={status} />}</td>
                  <td className="r muted">{days === null ? "—" : `≈ ${num(days)} hari`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <div className="sim-apply">
        <div className="muted xs">{valid.length} baris valid · perubahan baru tersimpan setelah diterapkan.</div>
        <button className="btn" disabled={valid.length === 0} onClick={() => setConfirm(true)}>
          <ArrowRight size={16} /> Terapkan ke stok
        </button>
      </div>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Terapkan simulasi?"
        footer={
          <>
            <button className="btn ghost" onClick={() => setConfirm(false)}>Batal</button>
            <button className="btn" onClick={() => { onApply(valid); reset(); setConfirm(false); }}><Check size={15} /> Ya, terapkan</button>
          </>
        }
      >
        <p className="confirm-text">
          {valid.length} pergerakan barang akan dicatat ke stok asli dan masuk ke log aktivitas.
          {anyNeg && <span className="warn-text"> Sebagian barang akan jadi minus karena stok tidak cukup.</span>}
        </p>
      </Modal>
    </div>
  );
}

export {
  Simulation
};

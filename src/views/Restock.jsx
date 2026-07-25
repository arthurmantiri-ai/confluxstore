import { useState } from "react";
import { ChevronRight, RefreshCcw, Truck } from "lucide-react";
import { Pill } from "../components/ui";
import { num, rp } from "../lib/format";
import { reviewDays, rop, stockStatus, suggestQty, targetLevel } from "../lib/inventory";

/* ============================ Re-stok (ROP) ============================ */

function Restock({ products, onReceive }) {
  const need = products.filter((p) => stockStatus(p) !== "ok")
    .sort((a, b) => (stockStatus(a) === "crit" ? -1 : 1) - (stockStatus(b) === "crit" ? -1 : 1));
  const [open, setOpen] = useState(null);
  const [costs, setCosts] = useState({}); // harga beli / satuan per produk (batch FIFO)
  const costOf = (p) => (costs[p.id] != null ? costs[p.id] : (p.cost || 0));

  return (
    <div className="stack">
      <div className="formula-card card">
        <div className="formula-ic"><RefreshCcw size={20} /></div>
        <div>
          <div className="formula-title">Cara menghitung saran re-stok</div>
          <div className="formula-line">
            <b>ROP</b> = (Pemakaian harian × Lead time) + Stok aman
          </div>
          <div className="formula-line">
            <b>Saran jumlah</b> = Pemakaian harian × (Lead time + Siklus order {reviewDays()} hari) + Stok aman − Stok saat ini
          </div>
          <div className="muted xs">Barang dipesan ketika stok menyentuh atau di bawah ROP (titik pesan ulang).</div>
        </div>
      </div>

      {need.length === 0 && <div className="empty card">Tidak ada barang yang perlu di-re-stok. Semua aman.</div>}

      <div className="restock-list">
        {need.map((p) => {
          const r = rop(p), t = targetLevel(p), s = suggestQty(p);
          const st = stockStatus(p);
          return (
            <div key={p.id} className="restock-card card">
              <div className="restock-main">
                <div className="restock-name-row">
                  <div>
                    <div className="strong">{p.name}</div>
                    <div className="muted xs">{p.code} · {p.category}</div>
                  </div>
                  <Pill status={st} />
                </div>

                <div className="rop-meta">
                  <div className="rop-cell"><span className="muted xs">Stok saat ini</span><b className={st === "crit" ? "danger" : ""}>{num(p.stock)}</b></div>
                  <div className="rop-cell"><span className="muted xs">Titik pesan (ROP)</span><b>{num(r)}</b></div>
                  <div className="rop-cell"><span className="muted xs">Target stok</span><b>{num(t)}</b></div>
                  <div className="rop-cell highlight"><span className="muted xs">Saran pesan</span><b className="accent">{num(s)}</b></div>
                </div>

                <button className="detail-toggle" onClick={() => setOpen(open === p.id ? null : p.id)}>
                  {open === p.id ? "Sembunyikan" : "Lihat"} rincian perhitungan
                  <ChevronRight size={13} style={{ transform: open === p.id ? "rotate(90deg)" : "none" }} />
                </button>
                {open === p.id && (
                  <div className="calc">
                    <div><span>Pemakaian harian</span><b>{num(p.dailyUsage)} / hari</b></div>
                    <div><span>Lead time supplier</span><b>{num(p.leadTime)} hari</b></div>
                    <div><span>Stok aman</span><b>{num(p.safetyStock)}</b></div>
                    <hr />
                    <div><span>ROP = {p.dailyUsage}×{p.leadTime} + {p.safetyStock}</span><b>{num(r)}</b></div>
                    <div><span>Target = {p.dailyUsage}×({p.leadTime}+{reviewDays()}) + {p.safetyStock}</span><b>{num(t)}</b></div>
                    <div className="calc-final"><span>Saran = {num(t)} − {num(p.stock)}</span><b>{num(s)}</b></div>
                  </div>
                )}
              </div>

              <div className="restock-action">
                <label className="fld">
                  <span>Harga beli / {p.unit} (Rp)</span>
                  <input type="number" value={costOf(p)} onChange={(e) => setCosts((c) => ({ ...c, [p.id]: e.target.value }))} />
                  <span className="hint">Harga modal terakhir: {rp(p.cost)}</span>
                </label>
                <button className="btn full" onClick={() => onReceive(p, s, Number(costOf(p)) || 0)}>
                  <Truck size={15} /> Terima {num(s)} unit
                </button>
                <span className="muted xs center">Dicatat sebagai batch FIFO baru</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export {
  Restock
};

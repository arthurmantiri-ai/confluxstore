import { AlertTriangle, ArrowDownRight, ArrowUpRight, Boxes, ChevronRight, Globe, Minus, Plus, Wallet } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Pill, Stat } from "../components/ui";
import { fmtAt, num, rp } from "../lib/format";
import { rop, stockStatus } from "../lib/inventory";

/* ============================ Dashboard ============================ */

function Dashboard({ products, chart, todayRev, deltaPct, lowStock, inventoryValue, newOrders, movements, pById, setView }) {
  const todaySales = todayRev;
  const delta = deltaPct;
  const weekTotal = chart.reduce((a, d) => a + d.v, 0);

  return (
    <div className="stack">
      <div className="grid-4">
        <Stat icon={Wallet} accent label="Penjualan hari ini" value={rp(todaySales)}
          sub={<span className={delta >= 0 ? "up" : "down"}>{delta >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{Math.abs(delta)}% vs kemarin</span>} />
        <Stat icon={Boxes} label="Nilai inventory" value={rp(inventoryValue)}
          sub={products.some((p) => p.isConsign) ? `${products.length} jenis · milik toko (tanpa titipan)` : `${products.length} jenis barang`} />
        <Stat icon={Globe} label="Order online baru" value={num(newOrders)} sub="menunggu diproses" />
        <Stat icon={AlertTriangle} label="Perlu re-stok" value={num(lowStock.length)} sub="di bawah titik pesan" />
      </div>

      <div className="grid-2-1">
        <section className="card">
          <div className="card-head">
            <h2>Penjualan 7 hari</h2>
            <span className="muted">Total {rp(weekTotal)}</span>
          </div>
          <div className="chart-wrap">
            {weekTotal === 0 && <div className="chart-empty">Belum ada penjualan dalam 7 hari terakhir. Grafik akan terisi otomatis dari transaksi kasir.</div>}
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chart} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E2514D" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#E2514D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2C3A33" vertical={false} />
                <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fill: "#6F8077", fontSize: 12 }} />
                <YAxis tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${Math.round(v / 1000)}rb` : v)} tickLine={false} axisLine={false} tick={{ fill: "#6F8077", fontSize: 12 }} width={44} />
                <Tooltip formatter={(v) => rp(v)} contentStyle={{ borderRadius: 12, border: "1px solid #2C3A33", background: "#1B2521", color: "#ECE7DA", fontFamily: "Inter", fontSize: 13 }} labelStyle={{ color: "#9DAEA3" }} itemStyle={{ color: "#ECE7DA" }} />
                <Area type="monotone" dataKey="v" stroke="#E2514D" strokeWidth={2.4} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Peringatan stok</h2>
            <button className="link" onClick={() => setView("restok")}>Lihat semua <ChevronRight size={14} /></button>
          </div>
          <div className="alert-list">
            {lowStock.length === 0 && <div className="empty">Semua stok aman 🎉</div>}
            {lowStock.slice(0, 5).map((p) => (
              <div key={p.id} className="alert-row">
                <div>
                  <div className="alert-name">{p.name}</div>
                  <div className="alert-meta">Sisa {num(p.stock)} · ROP {num(rop(p))}</div>
                </div>
                <Pill status={stockStatus(p)} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card-head"><h2>Aktivitas stok terbaru</h2><span className="muted">{movements.length} catatan</span></div>
        <table className="tbl">
          <thead><tr><th>Barang</th><th>Tipe</th><th className="r">Jumlah</th><th>Catatan</th><th className="r">Waktu</th></tr></thead>
          <tbody>
            {movements.slice(0, 6).map((m) => {
              const p = pById(m.productId);
              return (
                <tr key={m.id}>
                  <td className="strong">{p?.name || "—"}</td>
                  <td><span className={`mv ${m.type}`}>{m.type === "in" ? <Plus size={12} /> : <Minus size={12} />}{m.type === "in" ? "Masuk" : "Keluar"}</span></td>
                  <td className="r tab">{num(m.qty)}</td>
                  <td className="muted">{m.note}</td>
                  <td className="r muted">{fmtAt(m.at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export {
  Dashboard
};

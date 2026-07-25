import { useEffect, useMemo, useState } from "react";
import { Boxes, Check, CheckCircle2, Handshake, Package } from "lucide-react";
import { Products } from "../db";
import { hasSupabase } from "../supabaseClient";
import { Modal, Stat } from "../components/ui";
import { num, rp } from "../lib/format";

function ConsignView({ products, consigns, payments = [], onPay, setView }) {
  const [tab, setTab] = useState("belum");
  const [confirm, setConfirm] = useState(null); // grup distributor terpilih untuk setoran
  const [payAmt, setPayAmt] = useState("");     // jumlah setoran (Rp) yang diketik
  const [payNote, setPayNote] = useState("");   // catatan setoran (opsional)
  const consignProducts = products.filter((p) => p.isConsign);

  const rem = (c) => c.amount - (c.paidAmount || 0);      // sisa yang belum disetor per baris
  const belum = consigns.filter((c) => c.status === "belum");
  const owed = belum.reduce((a, c) => a + rem(c), 0);     // total sisa kewajiban
  const paidTotal = consigns.reduce((a, c) => a + (c.paidAmount || 0), 0); // total yang sudah disetor
  const payHistory = useMemo(() => [...payments].sort((a, b) => (b.ts || 0) - (a.ts || 0)), [payments]);

  // Nilai stok titipan (milik distributor) — server RPC, fallback hitung lokal
  const [consignStock, setConsignStock] = useState(0);
  useEffect(() => {
    const local = consignProducts.reduce((a, p) => a + (p.cost || 0) * (p.stock || 0), 0);
    setConsignStock(local);
    if (!hasSupabase) return;
    let alive = true;
    Products.inventoryValueConsign()
      .then((v) => { if (alive) setConsignStock(v); })
      .catch(() => {});
    return () => { alive = false; };
  }, [products]);

  // Kelompokkan sisa kewajiban setor per distributor
  // supplier = kunci mentah (sesuai DB, "" untuk tanpa nama) → dipakai saat setor
  // label   = teks tampilan
  const bySupplier = useMemo(() => {
    const m = {};
    belum.forEach((c) => {
      const key = c.supplier || "";
      if (!m[key]) m[key] = { supplier: key, label: c.supplier || "Tanpa nama distributor", rows: [], remaining: 0, full: 0, paid: 0, qty: 0 };
      m[key].rows.push(c);
      m[key].remaining += rem(c);
      m[key].full += c.amount;
      m[key].paid += (c.paidAmount || 0);
      m[key].qty += c.qty;
    });
    return Object.values(m).sort((a, b) => b.remaining - a.remaining);
  }, [consigns]);

  const fmtTs = (ts) => ts ? new Date(ts).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="stack">
      <div className="grid-4">
        <Stat icon={Handshake} accent label="Sisa belum disetor" value={rp(owed)} sub={`${belum.length} item belum lunas`} />
        <Stat icon={Boxes} label="Nilai stok titipan" value={rp(consignStock)} sub="milik distributor" />
        <Stat icon={Package} label="Barang titipan" value={num(consignProducts.length)} sub="jenis barang" />
        <Stat icon={CheckCircle2} label="Sudah disetor" value={rp(paidTotal)} sub="sepanjang waktu" />
      </div>

      <div className="pay-note">
        <b>Cara kerjanya:</b> barang bertanda titip jual milik distributor — begitu laku, nilai setorannya (sebesar HPP) otomatis
        tercatat di sini. Setoran <b>bisa dicicil</b>: bayar sebagian dulu, sisanya tetap tercatat sebagai kewajiban sampai lunas.
        Setoran ini <b>bukan</b> biaya operasional baru karena modalnya sudah terhitung sebagai HPP di laporan laba-rugi, jadi tidak
        dihitung dua kali.
      </div>

      <div className="order-tabs">
        {[["belum", "Belum Disetor", bySupplier.length], ["lunas", "Riwayat Setoran", payHistory.length]].map(([k, label, count]) => (
          <button key={k} className={`order-tab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>
            {label} {count > 0 && <span className="tab-count">{count}</span>}
          </button>
        ))}
      </div>

      {tab === "belum" && (
        <div className="order-grid">
          {bySupplier.length === 0 && (
            <div className="empty card">
              {consignProducts.length === 0 ? (
                <>Belum ada barang titip jual. Tandai barang sebagai <b>titip jual</b> lewat form Tambah/Edit Barang di menu{" "}
                  <button className="link-btn" onClick={() => setView && setView("stok")}>Stok</button>.</>
              ) : (
                <>Tidak ada setoran tertunda — semua barang titipan yang laku sudah disetor. 🎉</>
              )}
            </div>
          )}
          {bySupplier.map((g) => (
            <div key={g.supplier || "—"} className="card debt-card">
              <div className="sup-head">
                <div className="sup-name"><Handshake size={15} /> {g.label}</div>
                <span className="pill pill-warn">{g.rows.length} item</span>
              </div>
              <div className="sup-rows">
                {g.rows.map((c) => (
                  <div key={c.id} className="sup-row">
                    <span>{c.productName} <span className="muted xs">× {num(c.qty)}</span>
                      {(c.paidAmount || 0) > 0 && <span className="part-pill">sebagian</span>}
                    </span>
                    <span className="muted xs">{fmtTs(c.ts)}</span>
                    <span className="tab">{rp(rem(c))}</span>
                  </div>
                ))}
              </div>
              <div className="sup-foot">
                <div className="debt-total">
                  <span className="muted xs">{g.paid > 0 ? `Sisa · terbayar ${rp(g.paid)} dari ${rp(g.full)}` : "Sisa setoran"}</span>
                  <span className="tab">{rp(g.remaining)}</span>
                </div>
                <button className="btn sm" onClick={() => { setConfirm(g); setPayAmt(String(g.remaining)); setPayNote(""); }}>
                  <CheckCircle2 size={15} /> Catat setoran
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "lunas" && (
        <section className="card pad0">
          <table className="tbl">
            <thead>
              <tr><th>Tanggal</th><th>Distributor</th><th className="r">Disetor</th><th>Catatan</th></tr>
            </thead>
            <tbody>
              {payHistory.length === 0 && (
                <tr><td colSpan={4}><div className="empty">Belum ada riwayat setoran.</div></td></tr>
              )}
              {payHistory.map((p) => (
                <tr key={p.id}>
                  <td><span className="done-tag"><Check size={14} /> {p.paidAt || fmtTs(p.ts)}</span></td>
                  <td><div className="strong">{p.supplier || "Tanpa nama distributor"}</div></td>
                  <td className="r tab">{rp(p.amount)}</td>
                  <td className="muted">{p.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Catat setoran ke distributor"
        footer={
          <>
            <button className="btn ghost" onClick={() => setConfirm(null)}>Batal</button>
            <button
              className="btn"
              disabled={!confirm || Math.round(Number(payAmt) || 0) <= 0}
              onClick={() => {
                if (!confirm) return;
                const amt = Math.min(Math.round(Number(payAmt) || 0), confirm.remaining);
                if (amt > 0) onPay(confirm.supplier, amt, payNote.trim());
                setConfirm(null);
              }}
            >
              <CheckCircle2 size={15} /> Simpan setoran
            </button>
          </>
        }
      >
        {confirm && (() => {
          const typed = Math.max(0, Math.round(Number(payAmt) || 0));
          const amt = Math.min(typed, confirm.remaining);
          const sisa = confirm.remaining - amt;
          const over = typed > confirm.remaining;
          return (
            <div className="stack-sm">
              <div className="pay-summary">
                <div className="pay-summary-row"><span>Distributor</span><b>{confirm.label}</b></div>
                <div className="pay-summary-row"><span>Sisa kewajiban</span><b className="tab">{rp(confirm.remaining)}</b></div>
              </div>
              <label className="fld">
                <span>Jumlah disetor sekarang (Rp)</span>
                <input type="number" inputMode="numeric" value={payAmt} onChange={(e) => setPayAmt(e.target.value)} autoFocus />
                <div className="amt-quick">
                  <button type="button" className="chip" onClick={() => setPayAmt(String(confirm.remaining))}>Bayar penuh</button>
                  <button type="button" className="chip" onClick={() => setPayAmt(String(Math.round(confirm.remaining / 2)))}>Setengah</button>
                </div>
                {over && <span className="warn-hint">Melebihi sisa — otomatis dibatasi ke {rp(confirm.remaining)}.</span>}
              </label>
              <label className="fld">
                <span>Catatan <span className="muted">(opsional)</span></span>
                <input value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="cth. transfer BCA / bayar tunai" />
              </label>
              <div className="pay-note">
                Setoran <b>{rp(amt)}</b> dialokasikan ke barang yang <b>paling lama laku</b> lebih dulu.{" "}
                {sisa > 0
                  ? <>Sisa <b>{rp(sisa)}</b> tetap tercatat sebagai kewajiban ke {confirm.label}.</>
                  : <>Kewajiban ke {confirm.label} menjadi <b>lunas</b>. 🎉</>}
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}

export {
  ConsignView
};

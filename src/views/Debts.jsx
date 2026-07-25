import { useState } from "react";
import { Banknote, Building2, Check, CheckCircle2, ClipboardList, Phone, Printer, QrCode, Trash2, User, Wallet } from "lucide-react";
import { Modal, Stat } from "../components/ui";
import { num, rp } from "../lib/format";

function Debts({ debts, onSettle, onPrint, onDelete }) {
  const [tab, setTab] = useState("belum");
  const [confirm, setConfirm] = useState(null);
  const [payMode, setPayMode] = useState("cash"); // tunai masuk laci shift; non-tunai tidak
  const [del, setDel] = useState(null); // catatan hutang yang akan dihapus (manajer)

  const counts = {
    belum: debts.filter((d) => d.status === "belum").length,
    lunas: debts.filter((d) => d.status === "lunas").length,
    semua: debts.length,
  };
  const outstanding = debts.filter((d) => d.status === "belum").reduce((a, d) => a + d.total, 0);
  const list = debts.filter((d) => (tab === "semua" ? true : d.status === tab));

  return (
    <div className="stack">
      <div className="grid-4">
        <Stat icon={ClipboardList} accent label="Hutang belum lunas" value={num(counts.belum)} sub="pelanggan" />
        <Stat icon={Wallet} label="Total piutang" value={rp(outstanding)} sub="belum tertagih" />
        <Stat icon={CheckCircle2} label="Sudah lunas" value={num(counts.lunas)} sub="riwayat" />
        <Stat icon={User} label="Total transaksi hutang" value={num(counts.semua)} sub="sepanjang waktu" />
      </div>

      <div className="order-tabs">
        {[["belum", "Belum Lunas"], ["lunas", "Lunas"], ["semua", "Semua"]].map(([k, label]) => (
          <button key={k} className={`order-tab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>
            {label} {counts[k] > 0 && <span className="tab-count">{counts[k]}</span>}
          </button>
        ))}
      </div>

      <div className="order-grid">
        {list.length === 0 && <div className="empty card">Tidak ada data pada status ini.</div>}
        {list.map((d) => (
          <div key={d.id} className="card debt-card">
            <div className="debt-head">
              <div>
                <div className="debt-id">{d.id}</div>
                <div className="muted xs">{d.date}</div>
              </div>
              {d.status === "belum"
                ? <span className="pill pill-warn">Belum lunas</span>
                : <span className="pill pill-ok">Lunas</span>}
            </div>

            <div className="debt-identity">
              <div className="debt-line"><User size={14} /> <b>{d.debtor}</b></div>
              {d.business && <div className="debt-line"><Building2 size={14} /> {d.business}</div>}
              {d.phone && <div className="debt-line"><Phone size={14} /> {d.phone}</div>}
            </div>

            <div className="debt-items">
              {d.items.map((it, i) => (
                <div key={i} className="debt-item">
                  <span>{it.qtyLabel ? `${it.qtyLabel} · ` : ""}{it.name}</span>
                  <span className="muted tab">{rp(it.lineTotal)}</span>
                </div>
              ))}
            </div>

            <div className="debt-foot">
              <div className="debt-total"><span className="muted xs">Total</span><span className="tab">{rp(d.total)}</span></div>
              <div className="debt-actions">
                {onDelete && (
                  <button className="icon-btn xs danger-h" title="Hapus catatan hutang (salah input)" onClick={() => setDel(d)}><Trash2 size={15} /></button>
                )}
                <button className="btn ghost sm" onClick={() => onPrint(d)}><Printer size={14} /> Cetak</button>
                {d.status === "belum"
                  ? <button className="btn sm" onClick={() => { setPayMode("cash"); setConfirm(d); }}><CheckCircle2 size={15} /> Lunas</button>
                  : <span className="done-tag"><Check size={14} /> {d.paidAt}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Konfirmasi pelunasan"
        footer={
          <>
            <button className="btn ghost" onClick={() => setConfirm(null)}>Batal</button>
            <button className="btn" onClick={() => { onSettle(confirm.id, payMode); setConfirm(null); }}><CheckCircle2 size={15} /> Ya, sudah lunas</button>
          </>
        }
      >
        {confirm && (
          <>
            <p className="confirm-text">
              Tandai hutang <b>{confirm.id}</b> dari <b>{confirm.debtor}{confirm.business ? ` (${confirm.business})` : ""}</b>
              {" "}sebesar <b>{rp(confirm.total)}</b> sebagai sudah dibayar?
            </p>
            <div className="muted xs" style={{ marginBottom: 6 }}>Dibayar via:</div>
            <div className="pm-toggle">
              <button type="button" className={payMode === "cash" ? "btn sm" : "btn ghost sm"} onClick={() => setPayMode("cash")}><Banknote size={14} /> Tunai</button>
              <button type="button" className={payMode === "noncash" ? "btn sm" : "btn ghost sm"} onClick={() => setPayMode("noncash")}><QrCode size={14} /> Transfer / QRIS</button>
            </div>
            {payMode === "cash" && <div className="muted xs" style={{ marginTop: 8 }}>Uang tunai pelunasan otomatis dihitung sebagai kas masuk laci pada shift yang sedang berjalan.</div>}
          </>
        )}
      </Modal>

      <Modal
        open={!!del}
        onClose={() => setDel(null)}
        title="Hapus catatan hutang?"
        footer={
          <>
            <button className="btn ghost" onClick={() => setDel(null)}>Batal</button>
            <button className="btn danger" onClick={() => { onDelete(del.id); setDel(null); }}><Trash2 size={15} /> Ya, hapus</button>
          </>
        }
      >
        {del && (
          <div className="confirm-text">
            <p style={{ margin: "0 0 8px" }}>
              Catatan hutang <b>{del.id}</b> dari <b>{del.debtor}{del.business ? ` (${del.business})` : ""}</b> sebesar{" "}
              <b>{rp(del.total)}</b> akan dihapus <b>permanen</b>.
            </p>
            <div className="pay-note warn">
              Menghapus catatan ini <b>tidak</b> mengembalikan stok atau menghapus penjualannya. Jika seluruh transaksinya
              salah input, hapus transaksinya lewat halaman <b>Riwayat Penjualan</b> (stok kembali otomatis), lalu hapus catatan ini.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export {
  Debts
};

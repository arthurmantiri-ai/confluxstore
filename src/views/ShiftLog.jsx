import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Lock, RefreshCcw, Wallet } from "lucide-react";
import { Shifts } from "../db";
import { hasSupabase } from "../supabaseClient";
import { Modal, Stat } from "../components/ui";
import { num, rp } from "../lib/format";

/* ============================ Hutang ============================ */

/* ============================ Shift Kasir (manajer) ============================ */
// Buku cocokan kas per shift: modal awal, penjualan tunai, seharusnya vs dihitung,
// dan selisihnya — permanen, tidak bisa diubah/dihapus dari aplikasi. Shift yang
// lupa ditutup kasir bisa ditutup paksa oleh manajer di sini.
function ShiftLog({ flash }) {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState(false);
  const [fc, setFc] = useState(null);      // shift yang akan ditutup paksa
  const [fcCash, setFcCash] = useState("");
  const [busy, setBusy] = useState(false);
  const load = async () => {
    setErr(false);
    try { setRows(await Shifts.list(120)); }
    catch (e) { console.error("[shiftlog]", e); setErr(true); setRows([]); }
  };
  useEffect(() => { if (hasSupabase) load(); else setRows([]); }, []);

  const list = rows || [];
  const openShifts = list.filter((x) => x.status === "open");
  const cut = Date.now() - 30 * 86400000;
  const last30 = list.filter((x) => x.status === "closed" && (x.closedAt || 0) >= cut);
  const short30 = last30.reduce((a, x) => a + Math.min(0, Number(x.variance || 0)), 0);
  const over30 = last30.reduce((a, x) => a + Math.max(0, Number(x.variance || 0)), 0);
  const fmtD = (t) => (t ? new Date(t).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "—");
  const fmtT = (t) => (t ? new Date(t).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—");

  const forceClose = async () => {
    if (!fc || fcCash === "" || busy) return;
    const counted = Number(String(fcCash).replace(/\D/g, "")) || 0;
    setBusy(true);
    try {
      await Shifts.close(fc.id, counted, "Ditutup manajer");
      setFc(null); setFcCash("");
      await load();
      flash("Shift ditutup oleh manajer");
    } catch (e) { console.error("[shiftlog]", e); flash("Gagal menutup shift — cek koneksi"); }
    setBusy(false);
  };

  return (
    <div className="stack">
      <div className="grid-4">
        <Stat icon={Clock} accent label="Shift terbuka" value={num(openShifts.length)} sub="sedang berjalan" />
        <Stat icon={Wallet} label="Shift tercatat" value={num(list.length)} sub="120 terakhir" />
        <Stat icon={AlertTriangle} label="Kurang (30 hari)" value={rp(Math.abs(short30))} sub="total kas kurang" />
        <Stat icon={CheckCircle2} label="Lebih (30 hari)" value={rp(over30)} sub="total kas lebih" />
      </div>

      <div className="slog-head">
        <div className="muted xs">Selisih <b>kurang</b> berulang pada kasir yang sama adalah sinyal paling penting untuk ditindaklanjuti.</div>
        <button className="btn ghost sm" onClick={load}><RefreshCcw size={14} /> Muat ulang</button>
      </div>

      {rows === null && <div className="muted">Memuat…</div>}
      {rows !== null && err && <div className="muted">Gagal memuat data shift — coba muat ulang.</div>}
      {rows !== null && !err && list.length === 0 && (
        <div className="muted">Belum ada shift tercatat. Shift pertama muncul setelah kasir login dan mengisi modal awal kas.</div>
      )}

      <div className="slog-list">
        {list.map((x) => {
          const v = Number(x.variance || 0);
          return (
            <div key={x.id} className="slog-card">
              <div className="slog-top">
                <div className="slog-who">
                  <div className="shift-ava">{((x.cashier || "?")[0] || "?").toUpperCase()}</div>
                  <div>
                    <div className="slog-name">{x.cashier}</div>
                    <div className="muted xs">{fmtD(x.openedAt)} · {fmtT(x.openedAt)} – {x.status === "open" ? "…" : fmtT(x.closedAt)}</div>
                  </div>
                </div>
                {x.status === "open"
                  ? <span className="slog-badge open">BERJALAN</span>
                  : <span className={`slog-badge ${v === 0 ? "ok" : v > 0 ? "over" : "short"}`}>{v === 0 ? "PAS" : v > 0 ? `+${rp(v)}` : `−${rp(Math.abs(v))}`}</span>}
              </div>
              <div className="slog-rows">
                <div className="shift-row"><span>Modal awal</span><span className="tab">{rp(x.openingCash || 0)}</span></div>
                {x.status === "closed" && (
                  <>
                    <div className="shift-row"><span>Penjualan tunai</span><span className="tab">{rp(x.cashSales || 0)}</span></div>
                    {Number(x.cashMoves || 0) !== 0 && <div className="shift-row"><span>Kas lain-lain</span><span className="tab">{rp(x.cashMoves || 0)}</span></div>}
                    <div className="shift-row strong"><span>Seharusnya</span><span className="tab">{rp(x.expectedCash || 0)}</span></div>
                    <div className="shift-row"><span>Dihitung kasir</span><span className="tab">{rp(x.closingCash || 0)}</span></div>
                  </>
                )}
                {x.note && <div className="muted xs">Catatan: {x.note}</div>}
              </div>
              {x.status === "open" && (
                <div className="slog-actions">
                  <button className="btn ghost sm" onClick={() => { setFcCash(""); setFc(x); }}><Lock size={14} /> Tutup paksa</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal
        open={!!fc}
        onClose={() => { if (!busy) setFc(null); }}
        title="Tutup shift (manajer)"
        footer={<>
          <button className="btn ghost" disabled={busy} onClick={() => setFc(null)}>Batal</button>
          <button className="btn" disabled={busy || fcCash === ""} onClick={forceClose}><Lock size={15} /> {busy ? "Menutup…" : "Tutup Shift"}</button>
        </>}
      >
        {fc && (
          <>
            <p className="confirm-text">Tutup shift <b>{fc.cashier}</b> ({fmtD(fc.openedAt)} · buka {fmtT(fc.openedAt)})? Hitung uang fisik di laci lalu masukkan jumlahnya.</p>
            <label className="fld"><span>Uang tunai di laci (termasuk modal awal)</span>
              <input inputMode="numeric" autoFocus value={fcCash} placeholder="cth. 750.000" onChange={(e) => setFcCash(e.target.value)} /></label>
            {fcCash !== "" && <div className="muted xs">Terbaca: <b>{rp(Number(String(fcCash).replace(/\D/g, "")) || 0)}</b></div>}
          </>
        )}
      </Modal>
    </div>
  );
}

export {
  ShiftLog
};

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Clock, Download, RefreshCcw, Undo2, Unlock } from "lucide-react";
import { Modal } from "./ui";
import { rp } from "../lib/format";
import { loadDead, loadOutbox, outboxItemTotal } from "../lib/sync";

// Banner status koneksi & antrean offline. Diam saat semuanya beres (online, tidak
// ada antrean). Muncul saat: offline, sedang menyinkron, atau ada transaksi
// menunggu (dengan tombol coba-lagi). Tujuannya kasir selalu tahu apakah data
// sudah aman di server atau masih menunggu — tanpa perlu paham teknisnya.
function SyncBanner({ online, syncing, pending, dead, diag, onRetry, onOpenDiag }) {
  const deadBar = dead > 0 ? (
    <div className="sync-banner dead">
      <AlertTriangle size={16} />
      <span><b>{dead} transaksi tertahan</b> — datanya tersimpan aman di perangkat dan masih bisa dikirim ulang.</span>
      <button className="sync-retry" onClick={onOpenDiag}>Pulihkan</button>
    </div>
  ) : null;

  // Kegagalan terakhir ditampilkan APA ADANYA. Dulu penyebabnya hanya masuk console
  // browser — di tablet kasir tidak ada yang pernah melihatnya, sehingga antrean bisa
  // macet berhari-hari tanpa seorang pun tahu.
  const errBar = (!syncing && pending > 0 && diag && diag.ok === false) ? (
    <div className="sync-banner dead">
      <AlertTriangle size={16} />
      <span><b>Penyebab: {diag.message}</b>{diag.hint ? ` — ${diag.hint}` : ""}</span>
      <button className="sync-retry" onClick={onOpenDiag}>Rincian</button>
    </div>
  ) : null;

  let statusBar = null;
  if (!online) {
    statusBar = (
      <div className="sync-banner offline">
        <AlertTriangle size={16} />
        <span>
          <b>Mode offline.</b>{" "}
          {pending > 0
            ? `${pending} transaksi tersimpan aman di perangkat & akan otomatis terkirim saat internet kembali.`
            : "Transaksi tetap bisa dijalankan; perubahan akan tersinkron saat internet kembali."}
        </span>
        {pending > 0 && <button className="sync-retry" onClick={onOpenDiag}>Lihat antrean</button>}
      </div>
    );
  } else if (syncing) {
    statusBar = (
      <div className="sync-banner syncing">
        <RefreshCcw size={16} className="spin" />
        <span>Menyinkronkan{pending > 0 ? ` ${pending} transaksi` : ""}…</span>
      </div>
    );
  } else if (pending > 0) {
    statusBar = (
      <div className="sync-banner pending">
        <Clock size={16} />
        <span><b>{pending} transaksi belum masuk server.</b> Jangan tutup/ganti perangkat ini sebelum angka jadi 0.</span>
        <button className="sync-retry" onClick={onRetry}>Kirim sekarang</button>
        <button className="sync-retry" onClick={onOpenDiag}>Rincian</button>
      </div>
    );
  }

  if (!statusBar && !deadBar && !errBar) return null;
  return <>{statusBar}{errBar}{deadBar}</>;
}

// ===== PANEL DIAGNOSTIK SINKRONISASI =====
// Satu tempat untuk menjawab pertanyaan "transaksinya ke mana?" tanpa perlu console
// browser: isi antrean (beserta nilai rupiahnya), penyebab kegagalan terakhir, dan
// tombol pemulihan — kirim ulang, segarkan sesi, unduh cadangan, pulihkan dari berkas.
function SyncDiagModal({ open, onClose, pending, deadList, diag, online, syncing,
  onRetry, onRefreshAuth, onRetryDead, onExport, onImport }) {
  const [tab, setTab] = useState("antre");
  const fileRef = useRef(null);
  if (!open) return null;
  const rows = tab === "antre" ? pending : deadList;
  const totalRp = (rows || []).reduce((a, it) => a + outboxItemTotal(it), 0);
  const when = (t) => (t ? new Date(t).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

  return (
    <Modal open={open} onClose={onClose} title="Diagnostik sinkronisasi" width={620}
      footer={
        <>
          <button className="btn ghost" onClick={onExport}><Download size={15} /> Unduh cadangan</button>
          <button className="btn ghost" onClick={() => fileRef.current?.click()}>Pulihkan dari berkas</button>
          <button className="btn" disabled={syncing} onClick={onRetry}>
            <RefreshCcw size={15} /> {syncing ? "Mengirim…" : "Kirim sekarang"}
          </button>
        </>
      }>
      <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ""; }} />

      <div className="diag-state">
        <div><span className="muted">Koneksi</span><b>{online ? "Tersambung" : "Terputus"}</b></div>
        <div><span className="muted">Menunggu kirim</span><b>{pending.length}</b></div>
        <div><span className="muted">Tertahan</span><b>{deadList.length}</b></div>
        <div><span className="muted">Nilai tertahan</span><b>{rp(totalRp)}</b></div>
      </div>

      {diag && (
        <div className={`diag-note ${diag.ok ? "ok" : "bad"}`}>
          <b>{diag.ok ? "Terakhir berhasil" : "Terakhir gagal"} · {when(diag.at)}</b>
          <div>{diag.message}{diag.code ? ` (kode ${diag.code})` : ""}</div>
          {diag.hint && <div className="muted">{diag.hint}</div>}
          {!diag.ok && (
            <button className="btn ghost sm" style={{ marginTop: 8 }} onClick={onRefreshAuth}>
              <Unlock size={14} /> Segarkan sesi &amp; kirim
            </button>
          )}
        </div>
      )}

      <div className="seg" style={{ marginTop: 12 }}>
        <button className={`seg-btn ${tab === "antre" ? "on" : ""}`} onClick={() => setTab("antre")}>Menunggu ({pending.length})</button>
        <button className={`seg-btn ${tab === "dead" ? "on" : ""}`} onClick={() => setTab("dead")}>Tertahan ({deadList.length})</button>
      </div>

      {tab === "dead" && deadList.length > 0 && (
        <button className="btn ghost sm" style={{ marginTop: 10 }} onClick={onRetryDead}>
          <Undo2 size={14} /> Kembalikan semua ke antrean &amp; kirim ulang
        </button>
      )}

      <div className="diag-list">
        {(!rows || rows.length === 0) && (
          <div className="empty">{tab === "antre" ? "Antrean kosong — semua transaksi sudah masuk server." : "Tidak ada transaksi tertahan."}</div>
        )}
        {(rows || []).map((it, i) => (
          <div key={it.clientId || i} className="diag-row">
            <div className="diag-row-top">
              <b>{it.rows?.[0]?.receipt_no || it.rows?.[0]?.txn_id || "—"}</b>
              <span className="tab">{rp(outboxItemTotal(it))}</span>
            </div>
            <div className="muted">
              {when(it.soldAt ? Date.parse(it.soldAt) : it.deadAt)} · {it.rows?.length || 0} baris
              {it.rows?.[0]?.cashier ? ` · ${it.rows[0].cashier}` : ""}
              {it.attempts ? ` · ${it.attempts}x dicoba` : ""}
            </div>
            {(it.lastError || it.deadReason) && <div className="diag-err">{it.deadReason || it.lastError}</div>}
          </div>
        ))}
      </div>

      <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
        Data di daftar ini <b>hanya ada di perangkat ini</b> sampai berhasil terkirim. Jangan bersihkan
        data browser, jangan berganti perangkat, dan jangan tutup shift sebelum angka “Menunggu kirim”
        menjadi 0. Bila perangkat harus diganti: tekan <b>Unduh cadangan</b>, lalu <b>Pulihkan dari berkas</b> di perangkat baru.
      </p>
    </Modal>
  );
}

// Peringatan penyelamat di layar LOGIN. Kalau sesi sempat hilang (mis. token
// kedaluwarsa selagi offline), antrean transaksi jadi tidak terlihat sama sekali —
// orang lalu mengira datanya hilang, padahal masih utuh di perangkat. Panel ini
// memastikan hal itu ketahuan SEBELUM ada yang membersihkan data browser.
function PendingRescue() {
  const [n, setN] = useState(0);
  const [d, setD] = useState(0);
  useEffect(() => {
    const read = () => { setN(loadOutbox().length); setD(loadDead().length); };
    read();
    const t = setInterval(read, 5000);
    return () => clearInterval(t);
  }, []);
  if (!n && !d) return null;
  return (
    <div className="sync-banner pending" style={{ maxWidth: 420, margin: "0 auto 14px" }}>
      <AlertTriangle size={16} />
      <span>
        <b>{n + d} transaksi belum terkirim</b> masih tersimpan di perangkat ini.
        Login dengan akun yang sama — transaksi akan otomatis terkirim. Jangan bersihkan data browser.
      </span>
    </div>
  );
}

export {
  PendingRescue,
  SyncBanner,
  SyncDiagModal
};

import { useState } from "react";
import { Banknote, Building2, Calendar, Check, CheckCircle2, ClipboardList, Download, ExternalLink, FileText, Loader2, MessageCircle, Phone, Printer, QrCode, RotateCcw, Share2, Trash2, User, Wallet, X } from "lucide-react";
import { Modal, Stat } from "../components/ui";
import { num, parseIdDateYMD, rp } from "../lib/format";
import { waLink } from "../lib/customers";
import { buildWaText } from "../lib/waText";
import { buildDebtInvoiceBlob } from "../lib/invoicePdf";

function Debts({ debts, onSettle, onPrint, onDelete, onUnsettle, store, flash }) {
  const [tab, setTab] = useState("belum");
  const [confirm, setConfirm] = useState(null);
  const [payMode, setPayMode] = useState("cash"); // tunai masuk laci shift; non-tunai tidak
  const [del, setDel] = useState(null); // catatan hutang yang akan dihapus (manajer)
  const [undo, setUndo] = useState(null); // pelunasan yang akan dibatalkan (manajer)
  const [wa, setWa] = useState(null);   // { d, text } — pengingat WhatsApp per catatan
  const [pdf, setPdf] = useState(null); // { d, busy, url, file, filename, canShare, err }
  // Filter tanggal PELUNASAN (bukan tanggal hutang). Nilai "YYYY-MM-DD" agar bisa
  // dibandingkan langsung dengan hasil parseIdDateYMD(paidAt).
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const counts = {
    belum: debts.filter((d) => d.status === "belum").length,
    lunas: debts.filter((d) => d.status === "lunas").length,
    semua: debts.length,
  };
  const outstanding = debts.filter((d) => d.status === "belum").reduce((a, d) => a + d.total, 0);

  // Rentang aktif? Bila salah satu ujung diisi, filter dianggap menyala. Karena
  // hanya bon LUNAS yang punya tanggal pelunasan, saat filter menyala daftar otomatis
  // menyempit ke pelunasan dalam rentang (tab "belum" tidak akan memuat apa pun).
  const dateActive = !!(from || to);
  const lo = from && to ? (from <= to ? from : to) : from; // toleran bila urutan terbalik
  const hi = from && to ? (from <= to ? to : from) : to;
  const inRange = (d) => {
    const p = parseIdDateYMD(d.paidAt);
    if (!p) return false;
    if (lo && p < lo) return false;
    if (hi && p > hi) return false;
    return true;
  };
  const list = debts.filter((d) => {
    if (tab !== "semua" && d.status !== tab) return false;
    if (dateActive) { if (d.status !== "lunas") return false; if (!inRange(d)) return false; }
    return true;
  });
  const rangeTotal = dateActive ? list.reduce((a, d) => a + d.total, 0) : 0;

  // Set rentang; bila sedang di tab "belum" (yang tak punya tanggal pelunasan),
  // pindah ke "lunas" agar hasil filter langsung terlihat — bukan layar kosong.
  const applyDate = (nf, nt) => { setFrom(nf); setTo(nt); if ((nf || nt) && tab === "belum") setTab("lunas"); };
  const clearDate = () => { setFrom(""); setTo(""); };
  const ymd = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  const preset = (kind) => {
    const now = new Date(); const t = ymd(now);
    if (kind === "today") return applyDate(t, t);
    if (kind === "7d") { const s = new Date(now); s.setDate(s.getDate() - 6); return applyDate(ymd(s), t); }
    if (kind === "month") { const s = new Date(now.getFullYear(), now.getMonth(), 1); return applyDate(ymd(s), t); }
  };

  // Pesan pengingat WhatsApp untuk SATU catatan hutang. Memakai templat
  // "hutang" yang sama dengan halaman Pelanggan (bisa disetel di Pengaturan →
  // Pelanggan), hanya dipersempit ke satu tagihan ini — jadi tetap satu sumber
  // teks, tidak ada versi kembar yang bisa berbeda-beda.
  const debtWaText = (d) =>
    buildWaText(
      "hutang",
      { name: d.debtor, business: d.business, phone: d.phone },
      { storeName: store?.name, unpaid: { list: [{ id: d.id, date: d.date, total: d.total }], total: d.total } }
    );
  const openWa = (d) => setWa({ d, text: debtWaText(d) });

  // Buat invoice PDF (pustaka jsPDF ditarik saat ini juga). Modal terbuka dengan
  // status "menyiapkan" lalu tombol Unduh / Bagikan muncul begitu berkas siap.
  const openPdf = async (d) => {
    setPdf({ d, busy: true, err: null });
    try {
      const { blob, filename } = await buildDebtInvoiceBlob(d, store);
      const url = URL.createObjectURL(blob);
      let file = null, canShare = false;
      try {
        file = new File([blob], filename, { type: "application/pdf" });
        canShare = typeof navigator !== "undefined" && !!navigator.canShare && navigator.canShare({ files: [file] });
      } catch (_) { canShare = false; }
      setPdf({ d, busy: false, url, file, filename, canShare, err: null });
    } catch (e) {
      console.error(e);
      setPdf({ d, busy: false, err: (e && e.message) || "Gagal membuat PDF" });
      if (flash) flash("Gagal membuat invoice PDF");
    }
  };
  const closePdf = () => {
    setPdf((p) => { if (p?.url) { try { URL.revokeObjectURL(p.url); } catch (_) {} } return null; });
  };
  const sharePdf = async () => {
    if (!pdf?.file || !navigator.share) return;
    try {
      await navigator.share({ files: [pdf.file], title: `Invoice ${pdf.d.id}`, text: `Invoice ${pdf.d.id} — ${rp(pdf.d.total)}` });
    } catch (e) {
      if (e && e.name !== "AbortError") { console.error(e); if (flash) flash("Berbagi dibatalkan atau gagal"); }
    }
  };

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

      {/* ============ Filter tanggal PELUNASAN ============ */}
      <div className="debt-filter">
        <div className="acc-period">
          <Calendar size={15} />
          <span className="muted">Pelunasan</span>
          <input type="date" value={from} max={to || undefined} onChange={(e) => applyDate(e.target.value, to)} />
          <span className="muted">–</span>
          <input type="date" value={to} min={from || undefined} onChange={(e) => applyDate(from, e.target.value)} />
        </div>
        <div className="chips">
          <button type="button" className="chip" onClick={() => preset("today")}>Hari ini</button>
          <button type="button" className="chip" onClick={() => preset("7d")}>7 hari</button>
          <button type="button" className="chip" onClick={() => preset("month")}>Bulan ini</button>
          {dateActive && <button type="button" className="chip" onClick={clearDate}><X size={13} /> Hapus filter</button>}
        </div>
      </div>
      {dateActive && (
        <div className="debt-range-sum">
          <Wallet size={14} />
          <span><b>{num(list.length)}</b> pelunasan pada rentang ini · total <b className="tab">{rp(rangeTotal)}</b></span>
          {tab === "belum" && <span className="muted xs">Filter tanggal pelunasan hanya berlaku untuk hutang yang sudah lunas.</span>}
        </div>
      )}

      <div className="order-grid">
        {list.length === 0 && <div className="empty card">{dateActive ? "Tidak ada pelunasan pada rentang tanggal ini." : "Tidak ada data pada status ini."}</div>}
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
                <button className="btn ghost sm" title="Cetak struk termal" onClick={() => onPrint(d)}><Printer size={14} /> Cetak</button>
                <button className="btn ghost sm" title="Buat invoice PDF (A4) untuk dikirim/diarsipkan" onClick={() => openPdf(d)}><FileText size={14} /> Invoice</button>
                {d.status === "belum" && d.phone && (
                  <button className="btn wa sm" title="Ingatkan tagihan lewat WhatsApp" onClick={() => openWa(d)}><MessageCircle size={14} /> WhatsApp</button>
                )}
                {d.status === "belum" ? (
                  <button className="btn sm" onClick={() => { setPayMode("cash"); setConfirm(d); }}><CheckCircle2 size={15} /> Lunas</button>
                ) : (
                  <>
                    <span className="done-tag"><Check size={14} /> {d.paidAt}</span>
                    {onUnsettle && (
                      <button className="btn ghost xs" title="Batalkan pelunasan — kembalikan ke Belum Lunas (koreksi salah tekan)" onClick={() => setUndo(d)}><RotateCcw size={14} /> Batalkan lunas</button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===================== Pengingat WhatsApp ===================== */}
      <Modal
        open={!!wa}
        onClose={() => setWa(null)}
        width={520}
        title={wa ? `Ingatkan tagihan ke ${wa.d.business || wa.d.debtor}` : ""}
        footer={wa && (
          <>
            <button className="btn ghost" onClick={() => setWa(null)}>Batal</button>
            <a className="btn wa" href={waLink(wa.d.phone, wa.text)} target="_blank" rel="noreferrer" onClick={() => setWa(null)}>
              <ExternalLink size={15} /> Buka WhatsApp
            </a>
          </>
        )}
      >
        {wa && (
          <div className="stack-sm">
            <textarea className="wa-textarea" rows={11} value={wa.text}
              onChange={(e) => setWa((w) => ({ ...w, text: e.target.value }))} />
            <div className="muted xs">
              Pesan bisa diedit dulu sebelum dikirim. Tombol di bawah membuka WhatsApp ke nomor{" "}
              <b>{wa.d.phone}</b> dengan pesan ini sudah terisi. Untuk melampirkan rincian lengkap,
              buat <b>Invoice PDF</b> lewat tombol <FileText size={12} style={{ verticalAlign: "-1px" }} /> Invoice,
              lalu lampirkan berkasnya di chat.
            </div>
          </div>
        )}
      </Modal>

      {/* ===================== Invoice PDF ===================== */}
      <Modal
        open={!!pdf}
        onClose={closePdf}
        width={460}
        title={pdf ? `Invoice ${pdf.d.id}` : ""}
        footer={pdf && !pdf.busy && !pdf.err && (
          <>
            <button className="btn ghost" onClick={closePdf}>Tutup</button>
            {pdf.canShare && (
              <button className="btn wa" onClick={sharePdf}><Share2 size={15} /> Bagikan</button>
            )}
            <a className="btn" href={pdf.url} download={pdf.filename}><Download size={15} /> Unduh PDF</a>
          </>
        )}
      >
        {pdf && (
          <div className="stack-sm">
            {pdf.busy && (
              <div className="pdf-busy"><Loader2 size={18} className="spin" /> Menyiapkan invoice…</div>
            )}
            {pdf.err && (
              <div className="pay-note warn">Gagal membuat PDF: {pdf.err}. Coba lagi, dan pastikan koneksi internet aktif saat pertama kali fitur ini dipakai.</div>
            )}
            {!pdf.busy && !pdf.err && (
              <>
                <div className="pdf-ready">
                  <FileText size={18} /> <b>{pdf.filename}</b> siap.
                </div>
                <div className="muted xs">
                  Invoice A4 berisi identitas toko, rincian barang, dan total untuk{" "}
                  <b>{pdf.d.business || pdf.d.debtor}</b> ({rp(pdf.d.total)}).{" "}
                  {pdf.canShare
                    ? "Tekan Bagikan untuk mengirim langsung (pilih WhatsApp), atau Unduh PDF untuk menyimpan berkasnya."
                    : "Tekan Unduh PDF untuk menyimpan berkasnya, lalu lampirkan di WhatsApp atau email."}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

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

      {/* ===================== Batalkan pelunasan (manajer) ===================== */}
      <Modal
        open={!!undo}
        onClose={() => setUndo(null)}
        title="Batalkan pelunasan?"
        footer={
          <>
            <button className="btn ghost" onClick={() => setUndo(null)}>Batal</button>
            <button className="btn danger" onClick={() => { onUnsettle(undo.id); setUndo(null); }}><RotateCcw size={15} /> Ya, batalkan pelunasan</button>
          </>
        }
      >
        {undo && (
          <div className="confirm-text">
            <p style={{ margin: "0 0 8px" }}>
              Hutang <b>{undo.id}</b> dari <b>{undo.debtor}{undo.business ? ` (${undo.business})` : ""}</b> sebesar{" "}
              <b>{rp(undo.total)}</b> akan dikembalikan ke status <b>Belum Lunas</b>.
              {undo.paidAt && <> Tanggal pelunasan <b>{undo.paidAt}</b> akan dihapus.</>}
            </p>
            {undo.paidMethod === "cash" ? (
              <div className="pay-note warn">
                Pelunasan ini tercatat <b>TUNAI</b>. Saat ditandai lunas, <b>{rp(undo.total)}</b> ikut dihitung sebagai
                <b> kas masuk laci</b> pada shift saat itu. Membatalkan di sini <b>tidak</b> otomatis menarik angka tersebut
                dari shift itu: bila shift masih berjalan, sesuaikan kasnya; bila sudah ditutup, catatannya terkunci dan
                selisihnya perlu dicocokkan manual. Uang tunainya memang belum benar-benar diterima.
              </div>
            ) : (
              <div className="pay-note">
                Pelunasan ini {undo.paidMethod === "noncash" ? "tercatat non-tunai (transfer/QRIS)" : "tidak menyentuh kas laci"},
                jadi pembatalan ini tidak berpengaruh ke cocokan kas shift.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export {
  Debts
};

import { useState } from "react";
import { Banknote, Building2, Check, CheckCircle2, ClipboardList, Download, ExternalLink, FileText, Loader2, MessageCircle, Phone, Printer, QrCode, Share2, Trash2, User, Wallet } from "lucide-react";
import { Modal, Stat } from "../components/ui";
import { num, rp } from "../lib/format";
import { waLink } from "../lib/customers";
import { buildWaText } from "../lib/waText";
import { buildDebtInvoiceBlob } from "../lib/invoicePdf";

function Debts({ debts, onSettle, onPrint, onDelete, store, flash }) {
  const [tab, setTab] = useState("belum");
  const [confirm, setConfirm] = useState(null);
  const [payMode, setPayMode] = useState("cash"); // tunai masuk laci shift; non-tunai tidak
  const [del, setDel] = useState(null); // catatan hutang yang akan dihapus (manajer)
  const [wa, setWa] = useState(null);   // { d, text } — pengingat WhatsApp per catatan
  const [pdf, setPdf] = useState(null); // { d, busy, url, file, filename, canShare, err }

  const counts = {
    belum: debts.filter((d) => d.status === "belum").length,
    lunas: debts.filter((d) => d.status === "lunas").length,
    semua: debts.length,
  };
  const outstanding = debts.filter((d) => d.status === "belum").reduce((a, d) => a + d.total, 0);
  const list = debts.filter((d) => (tab === "semua" ? true : d.status === tab));

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
                <button className="btn ghost sm" title="Cetak struk termal" onClick={() => onPrint(d)}><Printer size={14} /> Cetak</button>
                <button className="btn ghost sm" title="Buat invoice PDF (A4) untuk dikirim/diarsipkan" onClick={() => openPdf(d)}><FileText size={14} /> Invoice</button>
                {d.status === "belum" && d.phone && (
                  <button className="btn wa sm" title="Ingatkan tagihan lewat WhatsApp" onClick={() => openWa(d)}><MessageCircle size={14} /> WhatsApp</button>
                )}
                {d.status === "belum"
                  ? <button className="btn sm" onClick={() => { setPayMode("cash"); setConfirm(d); }}><CheckCircle2 size={15} /> Lunas</button>
                  : <span className="done-tag"><Check size={14} /> {d.paidAt}</span>}
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
    </div>
  );
}

export {
  Debts
};

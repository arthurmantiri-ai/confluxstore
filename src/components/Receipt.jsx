import { LOGO } from "../assets/logo";
import { DEFAULT_STORE } from "../lib/config";
import { PAY_LABEL } from "../lib/constants";
import { rp } from "../lib/format";

function Receipt({ store, data }) {
  if (!data) return null;
  const d = data;
  // Pilihan tampilan nota (logo, baris kasir, merek, catatan kaki) berasal dari
  // Pengaturan. Fallback ke bawaan agar pratinjau tetap aman bila `store` yang
  // dioper masih objek lama.
  const nota = store?.nota || DEFAULT_STORE.nota;
  const brand = String(nota.brand ?? DEFAULT_STORE.nota.brand).trim();
  if (d.kind === "retur") {
    const hasEx = d.exItems && d.exItems.length > 0;
    return (
      <div className={`receipt ${store.paper === 80 ? "w80" : ""}`}>
        {nota.logo && <img className="r-logo" src={LOGO} alt="" />}
        <div className="r-center r-store">{store.name}</div>
        {store.addr1 && <div className="r-center r-small">{store.addr1}</div>}
        {store.addr2 && <div className="r-center r-tag">{store.addr2}</div>}
        {store.phone && <div className="r-center r-small">{store.phone}</div>}
        <div className="r-dash" />
        <div className="r-center r-title">{hasEx ? "NOTA RETUR & TUKAR" : "NOTA RETUR"}</div>
        {d.reprint && <div className="r-center r-small">— CETAK ULANG —</div>}
        <div className="r-meta">
          <div className="r-row r-small"><span>No</span><span>{d.no}</span></div>
          <div className="r-row r-small"><span>Tanggal</span><span>{d.date}</span></div>
          {nota.showCashier && <div className="r-row r-small"><span>Kasir</span><span>{d.cashier}</span></div>}
          <div className="r-row r-small"><span>Alasan</span><span>{d.reasonLabel}</span></div>
        </div>
        <div className="r-dash" />
        <div className="r-center r-small">BARANG DIRETUR</div>
        {d.items.map((it, i) => (
          <div key={i} className="r-item">
            <div className="r-item-name">{it.name}</div>
            <div className="r-row"><span className="r-small">{it.qtyLabel}</span><span>-{rp(it.lineTotal)}</span></div>
          </div>
        ))}
        {hasEx && (
          <>
            <div className="r-dash" />
            <div className="r-center r-small">BARANG PENGGANTI</div>
            {d.exItems.map((it, i) => (
              <div key={i} className="r-item">
                <div className="r-item-name">{it.name}</div>
                <div className="r-row"><span className="r-small">{it.qtyLabel}</span><span>{rp(it.lineTotal)}</span></div>
              </div>
            ))}
          </>
        )}
        <div className="r-dash" />
        <div className="r-row r-small"><span>Nilai diretur</span><span>-{rp(d.refundTotal)}</span></div>
        {d.exchangeTotal > 0 && <div className="r-row r-small"><span>Nilai pengganti</span><span>{rp(d.exchangeTotal)}</span></div>}
        <div className="r-row r-total"><span>{d.net >= 0 ? "PELANGGAN BAYAR" : "UANG KEMBALI"}</span><span>{rp(Math.abs(d.net))}</span></div>
        {d.net !== 0 && <div className="r-row r-small"><span>Metode</span><span>{d.settlementLabel}</span></div>}
        <div className="r-dash" />
        {store.footer && <div className="r-center r-foot">{store.footer}</div>}
        {nota.note && <div className="r-center r-small r-note">{nota.note}</div>}
        {brand && <div className="r-center r-brand">{brand}</div>}
        {store.phone && <div className="r-center r-small">{store.phone}</div>}
      </div>
    );
  }
  return (
    <div className={`receipt ${store.paper === 80 ? "w80" : ""}`}>
      {nota.logo && <img className="r-logo" src={LOGO} alt="" />}
      <div className="r-center r-store">{store.name}</div>
      {store.addr1 && <div className="r-center r-small">{store.addr1}</div>}
      {store.addr2 && <div className="r-center r-tag">{store.addr2}</div>}
      {store.phone && <div className="r-center r-small">{store.phone}</div>}
      <div className="r-dash" />
      <div className="r-center r-title">{d.kind === "hutang" ? "NOTA HUTANG" : "NOTA PEMBAYARAN"}</div>
      {d.reprint && <div className="r-center r-small">— CETAK ULANG —</div>}
      <div className="r-meta">
        <div className="r-row r-small"><span>No</span><span>{d.no}</span></div>
        <div className="r-row r-small"><span>Tanggal</span><span>{d.date}</span></div>
        {nota.showCashier && <div className="r-row r-small"><span>Kasir</span><span>{d.cashier}</span></div>}
      </div>
      <div className="r-dash" />
      {d.items.map((it, i) => (
        <div key={i} className="r-item">
          <div className="r-item-name">{it.name}</div>
          <div className="r-row"><span className="r-small">{it.qtyLabel}</span><span>{rp(it.lineTotal)}</span></div>
        </div>
      ))}
      <div className="r-dash" />
      <div className="r-row r-total"><span>TOTAL</span><span>{rp(d.total)}</span></div>
      {d.kind !== "hutang" ? (
        (() => {
          const parts = d.paidParts || d.payments; // gross saat transaksi; net saat cetak ulang
          return parts && parts.length > 1 ? (
            <>
              {parts.map((p, i) => (
                <div key={i} className="r-row"><span>Bayar ({PAY_LABEL[p.method] || p.method})</span><span>{rp(p.amount)}</span></div>
              ))}
              {d.change != null && d.change > 0 && <div className="r-row"><span>Kembalian</span><span>{rp(d.change)}</span></div>}
            </>
          ) : (
            <>
              <div className="r-row"><span>Bayar ({d.methodLabel})</span><span>{rp(d.paid != null ? d.paid : d.total)}</span></div>
              {d.change != null && d.change >= 0 && <div className="r-row"><span>Kembalian</span><span>{rp(d.change)}</span></div>}
            </>
          );
        })()
      ) : (
        <>
          {d.settled != null && <div className="r-stamp">{d.settled ? "** LUNAS **" : "** BELUM LUNAS **"}</div>}
          {d.settled && d.paidAt && <div className="r-row r-small"><span>Dibayar</span><span>{d.paidAt}</span></div>}
          {d.debtor && <div className="r-row r-small"><span>Pengutang</span><span>{d.debtor}</span></div>}
          {d.business && <div className="r-row r-small"><span>Usaha</span><span>{d.business}</span></div>}
          {d.phone && <div className="r-row r-small"><span>Telp</span><span>{d.phone}</span></div>}
        </>
      )}
      {d.kind !== "hutang" && d.business && <div className="r-row r-small"><span>Pelanggan</span><span>{d.business}</span></div>}
      {d.pickedBy && <div className="r-row r-small"><span>Diambil oleh</span><span>{d.pickedBy}</span></div>}
      <div className="r-dash" />
      {store.footer && <div className="r-center r-foot">{store.footer}</div>}
      {nota.note && <div className="r-center r-small r-note">{nota.note}</div>}
      {brand && <div className="r-center r-brand">{brand}</div>}
      {store.phone && <div className="r-center r-small">{store.phone}</div>}
    </div>
  );
}

export {
  Receipt
};

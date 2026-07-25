import { useState } from "react";
import { Check, X } from "lucide-react";
import { STATUS_LABEL } from "../lib/inventory";

/* ============================ Small UI atoms ============================ */

function Pill({ status }) {
  return <span className={`pill pill-${status}`}>{STATUS_LABEL[status]}</span>;
}

function Stat({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="stat">
      <div className={`stat-ic ${accent ? "stat-ic-accent" : ""}`}><Icon size={18} strokeWidth={2} /></div>
      <div className="stat-body">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

function Modal({ open, onClose, title, children, footer, width = 460 }) {
  if (!open) return null;
  return (
    <div className="modal-scrim">{/* klik di luar tidak menutup modal — hanya tombol X */}
      <div className="modal" style={{ maxWidth: width }}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

function PickOrAdd({ value, options, onChange, placeholder, addLabel = "Tambah baru…" }) {
  const known = options.includes(value);
  const [adding, setAdding] = useState(false);
  if (adding || (value && !known)) {
    return (
      <div className="inline-fld">
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus />
        <button type="button" className="btn ghost sm" onClick={() => { setAdding(false); onChange(options[0] || ""); }}>Pilih</button>
      </div>
    );
  }
  return (
    <select className="sim-select" value={value || ""} onChange={(e) => {
      if (e.target.value === "__add__") { setAdding(true); onChange(""); }
      else onChange(e.target.value);
    }}>
      <option value="" disabled>{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
      <option value="__add__">➕ {addLabel}</option>
    </select>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return <div className="toast"><Check size={15} /> {msg}</div>;
}

export {
  Modal,
  PickOrAdd,
  Pill,
  Stat,
  Toast
};

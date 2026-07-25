import { cfgStok } from "./config";
import { daysUntil } from "./format";

const expiryStatus = (dateStr) => {
  const d = daysUntil(dateStr);
  if (d == null) return null;
  if (d < 0) return "expired";
  if (d <= cfgStok().expiryWarnDays) return "soon";
  return "ok";
};
const expiryLabel = (dateStr) => {
  const d = daysUntil(dateStr);
  if (d == null) return "";
  if (d < 0) return `Kedaluwarsa ${Math.abs(d)} hr lalu`;
  if (d === 0) return "Kedaluwarsa hari ini";
  return `Sisa ${d} hr`;
};

// Siklus order / periode review (hari) — diatur di Pengaturan → Stok & Re-stok
const reviewDays = () => cfgStok().reviewDays;

// ROP = (pemakaian harian × lead time) + stok aman
const rop = (p) => Math.round(p.dailyUsage * p.leadTime + p.safetyStock);

// Order-up-to level = pemakaian harian × (lead time + siklus order) + stok aman
const targetLevel = (p) =>
  Math.round(p.dailyUsage * (p.leadTime + reviewDays()) + p.safetyStock);

// Saran jumlah re-stok = target level − stok saat ini
const suggestQty = (p) => Math.max(0, targetLevel(p) - p.stock);

// Status kesehatan stok
const stockStatus = (p) => {
  if (p.stock <= p.safetyStock) return "crit";
  if (p.stock <= rop(p)) return "warn";
  return "ok";
};
const STATUS_LABEL = { ok: "Aman", warn: "Re-stok", crit: "Kritis" };

// Harga jual efektif setelah promo (percent atau amount/Rp)
const effPrice = (base, promo) => {
  if (!promo || !promo.active) return base;
  const v = Number(promo.value) || 0;
  if (promo.type === "percent") return Math.max(0, Math.round(base * (1 - v / 100)));
  return Math.max(0, base - v);
};
const hasPromo = (p) => p.promo && p.promo.active && Number(p.promo.value) > 0;
const hasCarton = (p) => Number(p.cartonSize) > 0 && Number(p.priceCarton) > 0;

export {
  STATUS_LABEL,
  effPrice,
  expiryLabel,
  expiryStatus,
  hasCarton,
  hasPromo,
  reviewDays,
  rop,
  stockStatus,
  suggestQty,
  targetLevel
};

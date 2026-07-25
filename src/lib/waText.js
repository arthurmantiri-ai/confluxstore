import { CFG, cfgCrm } from "./config";
import { rp } from "./format";
import { effPrice, hasCarton } from "./inventory";

// Kata kunci yang boleh dipakai di dalam templat (Pengaturan → Pelanggan).
const WA_VARS = ["{sapaan}", "{toko}", "{nama}", "{usaha}", "{stok}", "{tagihan}", "{total}"];

// Teks bawaan — dipakai bila templat di Pengaturan dikosongkan.
const WA_DEFAULT = {
  sapa: "{sapaan}, ini {toko} \u{1F44B}\n\nTerima kasih sudah berbelanja di tempat kami. Kalau butuh stok lagi atau ada yang mau ditanyakan, silakan balas chat ini ya. Terima kasih!",
  promo: "{sapaan}, ini {toko} \u{1F44B}\n\nAda promo untuk minggu ini:\n\u2022 (tulis promo di sini)\n\nKalau berminat balas chat ini ya, stok terbatas. Terima kasih!",
  stok: "{sapaan}, ini {toko} \u{1F44B}\n\nBerikut stok & harga terbaru kami:\n\n{stok}\n\nHarga sewaktu-waktu bisa berubah. Silakan balas chat ini untuk pesan ya. Terima kasih!",
  hutang: "{sapaan}, ini {toko} \u{1F64F}\n\nMohon izin mengingatkan, ada tagihan yang belum lunas:\n{tagihan}\n\nTotal: {total}\n\nMohon konfirmasinya ya kalau sudah dibayar. Terima kasih banyak!",
};

const buildWaText = (tpl, c, ctx) => {
  const toko = ctx.storeName || CFG.name || "Conflux Coffee Club";
  const sapaan = String(c.business || "").trim() ? `Halo ${c.business}` : `Halo Kak ${c.name}`;
  const daftarStok = (ctx.products || [])
    .filter((p) => Number(p.stock) > 0)
    .sort((a, b) => String(a.category || "").localeCompare(String(b.category || ""), "id") || String(a.name).localeCompare(String(b.name), "id"))
    .slice(0, cfgCrm().waStokMax)
    .map((p) => {
      const harga = rp(effPrice(p.price, p.promo));
      const ktn = hasCarton(p) ? ` | karton ${rp(effPrice(p.priceCarton, p.promo))}` : "";
      return `\u2022 ${p.name} — ${harga}/${p.unit}${ktn}`;
    })
    .join("\n");
  const d = ctx.unpaid;
  const tagihan = d && d.list && d.list.length
    ? d.list.map((x) => `\u2022 ${x.id} (${x.date}) — ${rp(x.total)}`).join("\n")
    : "";
  const vals = {
    "{sapaan}": sapaan,
    "{toko}": toko,
    "{nama}": String(c.name || "").trim(),
    "{usaha}": String(c.business || "").trim(),
    "{stok}": daftarStok,
    "{tagihan}": tagihan,
    "{total}": rp(d?.total || 0),
  };
  const key = WA_DEFAULT[tpl] ? tpl : "sapa";
  const custom = String(cfgCrm().wa?.[key] || "").trim();
  const body = custom || WA_DEFAULT[key];
  return WA_VARS.reduce((acc, k) => acc.split(k).join(vals[k] ?? ""), body);
};

export {
  WA_DEFAULT,
  WA_VARS,
  buildWaText
};

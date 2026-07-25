import { DEFAULT_STORE } from "./config";
import { PAY_LABEL } from "./constants";
import { rp } from "./format";

// Profil toko + seluruh pengaturan sistem: lihat DEFAULT_STORE di bagian atas berkas.

// ===== Cetak langsung ESC/POS via Web Serial (opsional) =====
const escposReceipt = (store, d) => {
  const W = store.paper === 80 ? 42 : 32; // jumlah karakter per baris
  const nota = store?.nota || DEFAULT_STORE.nota;
  const brand = String(nota.brand ?? "").trim();
  const line = (a, b) => {
    const space = Math.max(1, W - a.length - String(b).length);
    return a + " ".repeat(space) + b + "\n";
  };
  // Kaki nota: ucapan -> catatan tambahan -> merek -> kontak. Baris kosong dilewati
  // supaya tidak memakan kertas percuma.
  const foot = () => {
    let t = "";
    if (store.footer) t += store.footer + "\n";
    if (nota.note) t += nota.note + "\n";
    if (brand) t += brand + "\n";
    if (store.phone) t += store.phone + "\n";
    return t;
  };
  const ESC = "\x1B", GS = "\x1D";
  let s = ESC + "@"; // init
  s += ESC + "a" + "\x01"; // center
  s += ESC + "!" + "\x18" + store.name + "\n" + ESC + "!" + "\x00"; // big bold name
  if (store.addr1) s += store.addr1 + "\n";
  if (store.addr2) s += store.addr2 + "\n";
  if (store.phone) s += store.phone + "\n";
  s += "-".repeat(W) + "\n";
  s += ESC + "a" + "\x00"; // left
  if (d.kind === "retur") {
    const hasEx = d.exItems && d.exItems.length > 0;
    s += (hasEx ? "NOTA RETUR & TUKAR" : "NOTA RETUR") + "\n";
    if (d.reprint) s += "-- CETAK ULANG --\n";
    s += "No : " + d.no + "\n";
    s += "Tgl: " + d.date + "\n";
    if (nota.showCashier) s += "Kasir: " + d.cashier + "\n";
    s += "Alasan: " + d.reasonLabel + "\n";
    s += "-".repeat(W) + "\n" + "BARANG DIRETUR\n";
    d.items.forEach((it) => { s += it.name + "\n"; s += line("  " + it.qtyLabel, "-" + rp(it.lineTotal)); });
    if (hasEx) {
      s += "-".repeat(W) + "\n" + "BARANG PENGGANTI\n";
      d.exItems.forEach((it) => { s += it.name + "\n"; s += line("  " + it.qtyLabel, rp(it.lineTotal)); });
    }
    s += "-".repeat(W) + "\n";
    s += line("Nilai diretur", "-" + rp(d.refundTotal));
    if (d.exchangeTotal > 0) s += line("Nilai pengganti", rp(d.exchangeTotal));
    s += line(d.net >= 0 ? "PELANGGAN BAYAR" : "UANG KEMBALI", rp(Math.abs(d.net)));
    if (d.net !== 0) s += line("Metode", d.settlementLabel);
    s += "-".repeat(W) + "\n";
    s += ESC + "a" + "\x01"; // center
    s += foot();
    s += "\n\n\n";
    s += GS + "V" + "\x42" + "\x00"; // partial cut
    return s;
  }
  s += (d.kind === "hutang" ? "NOTA HUTANG" : "NOTA PEMBAYARAN") + "\n";
  if (d.reprint) s += "-- CETAK ULANG --\n";
  s += "No : " + d.no + "\n";
  s += "Tgl: " + d.date + "\n";
  if (nota.showCashier) s += "Kasir: " + d.cashier + "\n";
  s += "-".repeat(W) + "\n";
  d.items.forEach((it) => { s += it.name + "\n"; s += line("  " + it.qtyLabel, rp(it.lineTotal)); });
  s += "-".repeat(W) + "\n";
  s += line("TOTAL", rp(d.total));
  if (d.kind !== "hutang") {
    const parts = d.paidParts || d.payments; // gross saat transaksi; net saat cetak ulang
    if (parts && parts.length > 1) {
      parts.forEach((p) => { s += line("Bayar " + (PAY_LABEL[p.method] || p.method), rp(p.amount)); });
      if (d.change != null && d.change > 0) s += line("Kembalian", rp(d.change));
    } else {
      s += line("Bayar (" + d.methodLabel + ")", rp(d.paid != null ? d.paid : d.total));
      if (d.change != null && d.change >= 0) s += line("Kembalian", rp(d.change));
    }
  } else {
    if (d.settled != null) s += "-".repeat(W) + "\n" + (d.settled ? "** LUNAS **" : "** BELUM LUNAS **") + "\n";
    if (d.settled && d.paidAt) s += "Dibayar: " + d.paidAt + "\n";
    if (d.debtor) s += "Pengutang: " + d.debtor + "\n";
    if (d.business) s += "Usaha: " + d.business + "\n";
    if (d.phone) s += "Telp: " + d.phone + "\n";
  }
  if (d.kind !== "hutang" && d.business) s += "Pelanggan: " + d.business + "\n";
  if (d.pickedBy) s += "Diambil oleh: " + d.pickedBy + "\n";
  s += "-".repeat(W) + "\n";
  s += ESC + "a" + "\x01"; // center
  s += foot();
  s += "\n\n\n";
  s += GS + "V" + "\x42" + "\x00"; // partial cut
  return s;
};

// Ubah teks ke ASCII aman untuk printer thermal (hindari karakter rusak)
const asciiFold = (str) => str
  .replace(/[·•]/g, "-").replace(/[—–]/g, "-").replace(/×/g, "x")
  .replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/…/g, "...")
  .replace(/[✓✔]/g, "v").replace(/[^\x00-\x7E]/g, "");

// String ESC/POS -> Uint8Array (byte kontrol tetap utuh)
const escposBytes = (store, d) => {
  const s = asciiFold(escposReceipt(store, d));
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i) & 0xFF;
  return bytes;
};

const printViaSerial = async (store, d) => {
  if (!("serial" in navigator)) throw new Error("Web Serial tidak didukung browser ini");
  const port = await navigator.serial.requestPort();
  await port.open({ baudRate: 9600 });
  const writer = port.writable.getWriter();
  await writer.write(escposBytes(store, d));
  writer.releaseLock();
  await port.close();
};

/* ===== Cetak via Bluetooth (Web Bluetooth — Chrome di Android/ChromeOS) ===== */
// UUID layanan umum pada printer thermal BLE 58/80mm
const BT_SERVICES = [
  0x18f0, 0xff00, 0xffe0, 0xff80,
  "000018f0-0000-1000-8000-00805f9b34fb",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "0000ffe0-0000-1000-8000-00805f9b34fb",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455",
  "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
];
let btDevice = null, btChar = null;

const findWritable = async (server) => {
  const services = await server.getPrimaryServices();
  for (const svc of services) {
    let chars = [];
    try { chars = await svc.getCharacteristics(); } catch (_) { continue; }
    for (const ch of chars) {
      if (ch.properties.write || ch.properties.writeWithoutResponse) return ch;
    }
  }
  return null;
};

const connectBluetoothPrinter = async () => {
  if (!navigator.bluetooth) throw new Error("Browser ini tidak mendukung Web Bluetooth. Pakai Chrome di Android.");
  const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: BT_SERVICES });
  btDevice = device;
  device.addEventListener("gattserverdisconnected", () => { btChar = null; });
  const server = await device.gatt.connect();
  btChar = await findWritable(server);
  if (!btChar) throw new Error("Terhubung, tapi saluran cetak tidak ditemukan. Coba printer lain.");
  return device;
};

const ensureBtChar = async () => {
  if (btChar && btDevice?.gatt?.connected) return btChar;
  if (btDevice) {
    const server = await btDevice.gatt.connect();
    btChar = await findWritable(server);
    if (btChar) return btChar;
  }
  throw new Error("Printer Bluetooth belum terhubung. Hubungkan dulu di Pengaturan.");
};

const printViaBluetooth = async (store, d) => {
  const ch = await ensureBtChar();
  const bytes = escposBytes(store, d);
  const CHUNK = 180;
  const noResp = ch.properties.writeWithoutResponse;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const part = bytes.slice(i, i + CHUNK);
    if (noResp && ch.writeValueWithoutResponse) await ch.writeValueWithoutResponse(part);
    else await ch.writeValue(part);
    await new Promise((r) => setTimeout(r, 18));
  }
};

export {
  BT_SERVICES,
  asciiFold,
  btChar,
  btDevice,
  connectBluetoothPrinter,
  ensureBtChar,
  escposBytes,
  escposReceipt,
  findWritable,
  printViaBluetooth,
  printViaSerial
};

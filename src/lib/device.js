

// Pengaturan printer boleh dibuat KHUSUS PER PERANGKAT: tablet kasir memakai
// Bluetooth 58 mm sementara laptop manajer memakai dialog browser 80 mm, tanpa
// saling menimpa. Bawaan: mati -> perilaku persis seperti sebelumnya (ikut server).
const DEVICE_KEY = "conflux.device.v1";
const loadDevice = () => {
  try {
    const o = JSON.parse(localStorage.getItem(DEVICE_KEY) || "null");
    if (!o || typeof o !== "object") return { on: false, paper: 58, method: "browser" };
    return {
      on: o.on === true,
      paper: o.paper === 80 ? 80 : 58,
      method: ["browser", "bluetooth", "serial"].includes(o.method) ? o.method : "browser",
    };
  } catch (e) { return { on: false, paper: 58, method: "browser" }; }
};
const saveDevice = (d) => { try { localStorage.setItem(DEVICE_KEY, JSON.stringify(d)); } catch (e) {} };

export {
  DEVICE_KEY,
  loadDevice,
  saveDevice
};

import { useState, useMemo, useEffect, useRef } from "react";
import { hasSupabase } from "./supabaseClient";
import { Products, Movements, Orders as OrdersApi, Debts as DebtsApi, Capital, Expenses, Sales, Settings as SettingsApi, Auth, Profiles } from "./db";
import {
  LayoutDashboard, Package, ShoppingCart, Globe, RefreshCcw,
  Plus, Minus, Search, X, Check, TrendingUp, ArrowUpRight, ArrowDownRight,
  Boxes, Store, Wallet, AlertTriangle, Bell, Truck, ClipboardList, Trash2,
  ChevronRight, Menu, CircleDot, Pencil,
  Banknote, Landmark, QrCode, CreditCard, Clock,
  Lock, Unlock, ShieldCheck, Calculator, ArrowRight,
  Phone, Building2, User, CheckCircle2, Printer, Settings, LogOut,
  LineChart, BarChart3, Coins, Hammer, Download, Calendar,
  Coffee, CupSoda, Utensils, UtensilsCrossed, Cookie, LayoutGrid, History, Bluetooth,
  Thermometer, FlameKindling, IceCream2, Beef, Wheat, AlertCircle
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell
} from "recharts";

/* =========================================================================
   CONFLUX — Sistem Manajemen Toko (Frontend demo, data in-memory)
   ========================================================================= */

const LOGO = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/7QCEUGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAGgcAigAYkZCTUQwYTAwMGFiNjAxMDAwMGUwMDIwMDAwNDgwNDAwMDBlMDA1MDAwMDg1MDYwMDAwZjkwODAwMDAyNzBjMDAwMDgwMGMwMDAwYTEwZDAwMDAxYzBlMDAwMDE0MTEwMDAwAP/bAIQABQYGCwgLCwsLCw0LCwsNDg4NDQ4ODw0ODg4NDxAQEBEREBAQEA8TEhMPEBETFBQTERMWFhYTFhUVFhkWGRYWEgEFBQUKBwoICQkICwgKCAsKCgkJCgoMCQoJCgkMDQsKCwsKCw0MCwsICwsMDAwNDQwMDQoLCg0MDQ0MExQTExOc/8IAEQgAlgCWAwEiAAIRAQMRAf/EAIEAAQADAQEBAAAAAAAAAAAAAAACBAUDBgEQAAEDAQUCCggDBgcAAAAAAAEAAgMRBBIhMUFRcRMgIjJhgZGhscEFECMwUmKS8DNgchRAQnOColCDssLR0uERAAEDAgUDBAMBAQAAAAAAAAEAESExQVFhcYGRobHwECDB0TDh8UBg/9oADAMBAAIAAwAAAAGI+5YAAAAAAACUZEQAAAAAAAAJRkRANmHTn0zatH2G3wu5H2twZetoeVi1uXPtnIT6cB8PoEoyIgvxv+czvaQybPo7ObqeW38Xjaxfa8dHrmeYhLrX9L31fO2euPqLXlY/Ptnz3ob3nUoyQj15XI/e+J6nzWf7hV9LtypeLt+op8rmHfjTlz0ulPN+8d6tn584ejoYMetbTl5r0trASjJCNynL599n5LQy8z2tr5lbHfOz6ulowvudOnyu6+HrZvbO89av3NHydC7JGAPiUZEQbGdwlV3NJjcIX9ylg5/Tjs59zUsY3ntHS+feOfojkD4AlGREAHLhcHHsAAAAACUZEQAAAAAAAAJRkRSEUhFIRSEUhFIRSEUhFIRkH//aAAgBAQABBQL8oMs9RfhauFiKliAHvoYw0SymQgVEdna4Quxs8l4AVX7K5OiaADX3MEV8zy3zgmymWW0NkvSu4FtlCg5IaL7mNLnWewyMDYYyvYlPtDWG+L/Ed7OLEp7eHkvssoFucjYBIWxwxjk8EwEuhHtC11XMfC4RNtCnvwizxGvraKm1mr711WEcHEQrhJDHxp1mcJGxXJHRtZLOWiW1uq61zUfwrImylsjrlziQc91ldI61RcG2wNDoZYWFtnnq21SKST2z5vaRu4WWe+908bgpXRBS2plXW57gx73v9cHPMl1Wo3x6PNYjaShIa0vmzWdObA0h0NLbHJQWUoWVCBqApxQaK1hRc6EOgc8xyGOz3iYooVLM6RNBehZZCn1DIX3m+4heCJYTGmzNcnfs5RtVEYyE60xtT7VLKmQvBtlpkeLO2jfci0SRI22Eo2qFG3OQie9NswCAp74tBXAsQYB+Wf/aAAgBAwABPwH91hhdK4NaKkqP0RZ7KwOtBvE6eQ1PgrRYrPPFJJC0xmOlQda5bURTBCyyEE3DQZnjegrI2CJ1ofsJHQBn16dqkMtvkc7Qbeaxo8vFWx8/BRsuANcG80Yupzb3TrTarPYJBLG6Rl1peBiFasWWptcL0Qp8NbuA8VN6MhiEhLr7m3aCtL1aVw6FIyCNt+NlS5oF0/w1rjXCuKkpXD1NFSN6t1pY2zNiY4F1GAgaUxPeFZJmsgMd03pQcdBXDuUlsdJRtwAVBG3k4jZ19iJmlzOTmk4YAgNPV25lFmMl99LhaXVdicG5bXYYdKkMLARwl4gVAAwPRXqx3p1qhAcy4XNpRprdNc+kKQUOHqaaEHYpLEJbMZWGpLb3/bzXou2RsrHMMuaT4J1oL70dnbeLpLwNMA0U8XAnZRMsIZV9pn51CQHXGkjxO5ekrNAYzJC/FuYrXPfj5IvKJ4nor0w6zchwvMOiknsTzfMLq7BSif6YuC7CxsLejFx/qP8AxVS2tzzUuLjtJQnPUdETXjV/fP/aAAgBAgABPwH91e66KlGVzzhgmPc00JqjguFbt40z77qDchSIAUqT5qENBN45KaYOBom4XdzvNcK5xGNL1e5Mq83SckR6jkVAKu+9cPNSv9oTsPghnTetn6T4oDm/pPfVRsPJw2j77UIHYOyOqp6iozdcp4qm8MQVg3E7PvuV4nIKB5DhXHvRJ4stnvYjNCKQbU2yauP3970GtbkFmQSMv8D/AP/aAAgBAQAGPwL8oXnG61YNLt6xZTcrzTeb4e/4R+Wg2rHsV4kNZ8R1/SNVzXjDBziB/arujw4H6arHT1YkN3lGkgJArTd7roGa+UZIudzG/wBzvhHmmF2QIw0AGxEipGlEa/iPFAPhacyekolSO1AwWJ/hc7sQAzLX0+ko3y1vWvxKnYFSrm9JRa2MOAw6SnN+EmnSOKBq/PcqDMmg3lCKPmtwH+5x3oiMVI5zyuUBljoi9slGa3swdi55NNifcO/buWBpyXHs0603c/8A0pmeJ7cCgcjckI6gmvrS+3vGafdNPaXXU2XeT5q9pxANpW7BOd8DCet3JCkk1JuBDe3xRwVCKCXk9eiYwml6pT2VqCxtfqVG5cE7xCjpQcmTLcof1HwTCRUBr8M0wM1dWg0LtE4HAPFCToRzSrpINNRrs4jd6cdCVMP5XmUwHK85FoAbXVffX3qP+YE07Gnp1CvaEAbMjVf5bvEKhFHDqABzJ6Fi5t346+AzqvxL7fhAxO85BXow69pepRu7p3qpYw/Ncr/4r3boKeHEbvVOkqanwsd9JofFFuoN4LQJ3SL3Xke49yxcGhmNXHCugV8kOFKZECh6Sjm/rwCpwd2uoOPbmhSR0kZyx12FbFiVlxw8ZOCFcjVp3OTm6sPaFzhG/Ycj1pwvitKC7y9dUK8sjJvTtPT9hY9mi5ILt33Rc3vCmB0DT/Vew91wbsjkdhWPavaC9TJ2qxa5yusAYNjc1V5EY+bP6RiuS0yHa/L6R5qlTTY3AdyqDdKDXXafLrRb/dYctvwnyWMTmn5SuY873U8FRgEQ+XPtzVT2lY4+/wAQuasB+Wf/2gAIAQEBAT8h/wCQNqKNTojEzUm84Qhlzk6qrrPcs/z2Ad4nZRawKILLVnYVD6I6LaTgbJG4TL9ObQTtmRm5Fk4hEIAByaAICkUg1k8xcA5aatKAAILg0/DBnGPL9qnxCPyiWuXmIEG0TC52CnCYxE8ICwAU87imCKMFaMy/2wogWC06AjZezOjtkgq5JENXMoBTgQzIgmACsvbGn2jjURLMlsMVLI0svnh0TcRyuYloIxNEDBl2RYB74+02mJ/DjlEMUd5lqo0mdPaOqTwEyCBAckjDxlFB1kOTnPyUOEfFN8WORJlNzIgZ0X0+rhkl8FHQgmEByQx9DpTznauUoEoS/KqjpjoBY7t1SdcLB7QeYKT81AYuJDougAIMyM39mXgOSn0WEB3+UHMHvJuSsBMXAX8yTjDQiOhFQwiXNA98lMECuMZ9xugoGMShAyxQ5I8hFW52JTZDUOXeJN4GLS7BRXTFQN1oA0EiRYXaDamqlgQQDOWIa4NHPCcCG1w99mQcigUgNuACHIaj2dDQ4sCGJOEZlEIFyCDijH5kG16OkyyLZAi8GoLl75ooHgy4AdiDHajIhPSxZIs+D9kMuwz4ijiTLRJxeLjPlPrBog5JmCqIAhza7BRgmqaTdAQkAYuOZYDdFgagF0GrEYGN8kCxbhSakA74CUIOLxDnO/YgAnckUQIZgwACg9nQ0NxEBqhzejID89nFfEsjcScDGxCsxoCfhGSyDYI5gIKMhzB29MmSpibTrUgcsB6WDZoqMYggC4wMTnKOJ4GOdSX5ADVOErs6gLEOcEaHJBYfxBaV8qdUGGlmaoAMAww9rgEVBfhOGmXI/SIC19Ht0LFGbDwZl9Cns4SYc8UeUVdmISzCWQLVIdQLVkkA62yfQQFzVMYKPM0YYhlfr9laAyL/AACVJYBmwhLVnTETWh2/CflZAEmGLWFBAH0AUjCzoAbCf6E1fqgJ8B+iEutc3PTuGXT0e35i7El7M6oeaBcF56IOIEQSQM6HfDBGnuJ/ECZurtqq2UrVcMjoW7IOmXCHyQrlTDPU3Q5JN2ftY88BAgAwy/NSQ6hZRUsG3/M//9oADAMBAQIBAwEAABAAAAAAAAAAEAAAAAAAAAEAcxIA0gQAEBW6nyZSsoEPj8o7rTasEEnZ6INAAAEDcwfqYAAAEACEAAAAAAEAAAAAAAAAEAAAAAAAAAH/2gAIAQMBAT8Q/wApBxYAAmqz061OAJBchgvijZ9sAGxCe5FLF3QAtjsMAM39wQ2JIGoUhmkL7kA0SyyDR1OVEXwFplD6S5GWynSTQUuFVEgBZUg/QOU4fMIFhcaCVN7QEkGDhqAA+VIswwy9GjiA5KrkRJDO0A1hWUNRHcWgkXl7jS6jzihJLigsLhgm6OrjBEAyY5LdQi1YNxb8JiIaCJYABy6WNYcFITCAlmk1JzsGMBgM0MthcgYemYAHgosAYwUjnAQ02OLJwMw/SpoAql3sUPUzQBgJs4CHowwoDMginABm4XNicHT8h2bBFNST7ApxEFm0MtwQRCYw1wH8uBoBkEc5avyFTgGKOilUjuZKBcaiPCcfcDFCRuiX/wBf/9oACAECAQE/EP8AKE39FY1l5VfORQSeykAaScJ7e41iBZ9+WXjhu/8AF5MPOUGXz6C8UAZlOvcmM/Q2JgCqz44dnoAnjYIeLN6US/SnBCtb+guCMQRyvPwnv6SnwfmBeSohRybPRP7HtHBioqG/79RMSwANiJf3P/s//9oACAEBAQE/EP8AkG0K9kyHo+wVNZeO80LpDe7IBcLlyoPuwzt+fuUS3Fw9OTAl9cKVHLPEoZnilMWnBgpztcRtZVOOzcCvNVFBuWAgnOEdMcwDklAtFh+B9rWQouHUAlmSGmAchcfhtYDSbP4Zyo7SCGyZ2wCvsLLtZGbEquj6omryl1na17kWkr4olc6UTbR2k/Ctu7sT5VQuzE0NlRZirs70KmQ4TeKgSyQnEw0ZzN3aIeSqGfJG0lFjQqDczZLVGDDD6OVfb1qOGDhtyGBnGmYwOlTILnsKHUKGqNxuacuqqBkcAzFRn1FDwZHy94NDuCqgu4uM3fvKnUQ8YKI7QF6CqBp9y7ysrQyRxtRkNGo/QFFiV+4El5PGrjjRGqUWZvt7P5UQD0WGZmzk+3J44lvvFAN5T4+4Eou61cuZkXyFNn3Jgjr+4iLSOpy8e5ARkARwHujslMgbiSiHe+QcEw3xSJ4akdiexkAMmJjppqOxoh84ObKEz7Adbl9RiVgFj0Hg4UXU8kDRzAm/MTU+iABBtBkkEuBL6WGY8ghqkmN3KM8mUrigGbNlVVKTnQtK6FIIXpNZYEkiHdGzOClzSdd2z9ZVYmcmoHBwYLR6eR2A5QCEIpQIBBS3sJvNlH73BuVxjisojG4lkr6StvK6rwQs5KUUjpg5nOhOFknJbBDGgUVKNdwLT0IpBU1YHvunNFk3VAAaqdIL4YvFExB4dcpFRqlaGWAgOKO4XcNwhoYFAge09NINScLNzAsKnixVWyxFqvStqPMk2C5z39TrcXgZcex3hqhkSL+5FAFELWdINi+qYwedEa0t0wIoJDNy1hsoXSRaSk5hu3H4agpeU0yNxdaFM79tDKbGmiE3Gh4Q8q4EcRhDTfguxzA7Nfs1QPHuTwJnaI2HxoZWmMbSNyERQqxDmOEAGMWHIsB2/FnR/mppWC2CJEASeTMO/pyjeiqoVEO5c1NmcD4RJ3KCMhWBh0/N0Yw9arwT9rnXAPzX/mf/2Q==";

const rp = (n) => "Rp" + new Intl.NumberFormat("id-ID").format(Math.round(n || 0));
const num = (n) => new Intl.NumberFormat("id-ID").format(Math.round(n || 0));
const uid = () => Math.random().toString(36).slice(2, 9);

// Tampilkan waktu ramah: ISO/epoch -> waktu lokal; label seperti "Baru saja" dibiarkan
const fmtAt = (at) => {
  if (at == null || at === "") return "—";
  if (typeof at === "string" && !/\d{4}-\d{2}-\d{2}T/.test(at)) return at;
  const d = new Date(at);
  if (isNaN(d.getTime())) return String(at);
  return d.toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

// Nomor nota unik berbasis tanggal+waktu (tidak bentrok antar perangkat/refresh)
const invoiceNo = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `INV-${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};

// Periode bulan (YYYY-MM) -> label ramah; bulan sekarang & bulan sebelumnya
const ID_MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const periodLabel = (ym) => { if (!ym) return "-"; const [y, m] = String(ym).split("-").map(Number); return `${ID_MONTHS[(m || 1) - 1]} ${y}`; };
const thisPeriod = () => new Date().toISOString().slice(0, 7);
const prevPeriod = (ym) => { const [y, m] = String(ym).split("-").map(Number); const d = new Date(y, (m || 1) - 1, 1); d.setMonth(d.getMonth() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };

// Siklus order / periode review (hari) — dipakai untuk saran jumlah re-stok
const REVIEW_DAYS = 7;

// ROP = (pemakaian harian × lead time) + stok aman
const rop = (p) => Math.round(p.dailyUsage * p.leadTime + p.safetyStock);

// Order-up-to level = pemakaian harian × (lead time + siklus order) + stok aman
const targetLevel = (p) =>
  Math.round(p.dailyUsage * (p.leadTime + REVIEW_DAYS) + p.safetyStock);

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

const SEED_PRODUCTS = [
  // ===== MINUMAN PANAS — stock dihitung per porsi/cup =====
  { id: uid(), name: "Kopi Hitam (Americano)", sku: "MNP-AMR", category: "Minuman Panas", unit: "cup", cost: 7000, price: 18000, stock: 40, dailyUsage: 15, leadTime: 1, safetyStock: 10,
    variants: [{ key: "S", label: "Small (200ml)", price: 15000, cost: 5500 }, { key: "M", label: "Medium (300ml)", price: 18000, cost: 7000 }, { key: "L", label: "Large (500ml)", price: 22000, cost: 8500 }] },
  { id: uid(), name: "Latte", sku: "MNP-LAT", category: "Minuman Panas", unit: "cup", cost: 10000, price: 27000, stock: 35, dailyUsage: 12, leadTime: 1, safetyStock: 8,
    variants: [{ key: "S", label: "Small (200ml)", price: 22000, cost: 8000 }, { key: "M", label: "Medium (300ml)", price: 27000, cost: 10000 }, { key: "L", label: "Large (500ml)", price: 32000, cost: 12000 }] },
  { id: uid(), name: "Cappuccino", sku: "MNP-CAP", category: "Minuman Panas", unit: "cup", cost: 10000, price: 27000, stock: 30, dailyUsage: 10, leadTime: 1, safetyStock: 8,
    variants: [{ key: "S", label: "Small (200ml)", price: 22000, cost: 8000 }, { key: "M", label: "Medium (300ml)", price: 27000, cost: 10000 }, { key: "L", label: "Large (500ml)", price: 32000, cost: 12000 }] },
  { id: uid(), name: "Teh Manis Panas", sku: "MNP-TEH", category: "Minuman Panas", unit: "cup", cost: 3000, price: 10000, stock: 50, dailyUsage: 8, leadTime: 1, safetyStock: 5,
    variants: [{ key: "S", label: "Small", price: 8000, cost: 2500 }, { key: "M", label: "Medium", price: 10000, cost: 3000 }, { key: "L", label: "Large", price: 12000, cost: 3500 }] },
  { id: uid(), name: "Coklat Panas", sku: "MNP-CHC", category: "Minuman Panas", unit: "cup", cost: 9000, price: 23000, stock: 25, dailyUsage: 7, leadTime: 1, safetyStock: 5,
    variants: [{ key: "S", label: "Small", price: 18000, cost: 7000 }, { key: "M", label: "Medium", price: 23000, cost: 9000 }, { key: "L", label: "Large", price: 28000, cost: 11000 }] },

  // ===== MINUMAN DINGIN — stock dihitung per porsi/cup =====
  { id: uid(), name: "Es Kopi Susu", sku: "MND-EKS", category: "Minuman Dingin", unit: "cup", cost: 10000, price: 25000, stock: 45, dailyUsage: 20, leadTime: 1, safetyStock: 12,
    variants: [{ key: "S", label: "Small (350ml)", price: 20000, cost: 8000 }, { key: "M", label: "Medium (500ml)", price: 25000, cost: 10000 }, { key: "L", label: "Large (700ml)", price: 30000, cost: 12000 }] },
  { id: uid(), name: "Matcha Latte Dingin", sku: "MND-MTL", category: "Minuman Dingin", unit: "cup", cost: 11000, price: 27000, stock: 30, dailyUsage: 14, leadTime: 1, safetyStock: 8,
    variants: [{ key: "S", label: "Small", price: 22000, cost: 9000 }, { key: "M", label: "Medium", price: 27000, cost: 11000 }, { key: "L", label: "Large", price: 32000, cost: 13000 }] },
  { id: uid(), name: "Es Teh Manis", sku: "MND-ETH", category: "Minuman Dingin", unit: "cup", cost: 3500, price: 10000, stock: 60, dailyUsage: 18, leadTime: 1, safetyStock: 10,
    variants: [{ key: "S", label: "Small", price: 8000, cost: 3000 }, { key: "M", label: "Medium", price: 10000, cost: 3500 }, { key: "L", label: "Large", price: 12000, cost: 4000 }] },
  { id: uid(), name: "Jus Jeruk Segar", sku: "MND-JJR", category: "Minuman Dingin", unit: "cup", cost: 9000, price: 22000, stock: 20, dailyUsage: 8, leadTime: 1, safetyStock: 5,
    variants: [{ key: "S", label: "Small (250ml)", price: 18000, cost: 7000 }, { key: "M", label: "Medium (350ml)", price: 22000, cost: 9000 }, { key: "L", label: "Large (500ml)", price: 26000, cost: 11000 }] },
  { id: uid(), name: "Boba Milk Tea", sku: "MND-BMT", category: "Minuman Dingin", unit: "cup", cost: 12000, price: 28000, stock: 25, dailyUsage: 10, leadTime: 1, safetyStock: 6,
    variants: [{ key: "S", label: "Small", price: 22000, cost: 9000 }, { key: "M", label: "Medium", price: 28000, cost: 12000 }, { key: "L", label: "Large", price: 35000, cost: 15000 }] },

  // ===== MAKANAN — stock dihitung per porsi =====
  { id: uid(), name: "Nasi Goreng Spesial", sku: "MKN-NGS", category: "Makanan", unit: "porsi", cost: 10000, price: 25000, stock: 30, dailyUsage: 12, leadTime: 1, safetyStock: 5 },
  { id: uid(), name: "Mie Goreng", sku: "MKN-MGR", category: "Makanan", unit: "porsi", cost: 8000, price: 22000, stock: 25, dailyUsage: 10, leadTime: 1, safetyStock: 5 },
  { id: uid(), name: "Sandwich Club", sku: "MKN-SWC", category: "Makanan", unit: "pcs", cost: 12000, price: 30000, stock: 15, dailyUsage: 5, leadTime: 1, safetyStock: 3 },
  { id: uid(), name: "Pasta Bolognese", sku: "MKN-PST", category: "Makanan", unit: "porsi", cost: 14000, price: 35000, stock: 20, dailyUsage: 8, leadTime: 1, safetyStock: 4 },
  { id: uid(), name: "Nasi Uduk", sku: "MKN-NUD", category: "Makanan", unit: "porsi", cost: 7500, price: 18000, stock: 25, dailyUsage: 10, leadTime: 1, safetyStock: 5 },
  { id: uid(), name: "Roti Bakar Keju", sku: "MKN-RTB", category: "Makanan", unit: "pcs", cost: 6000, price: 15000, stock: 20, dailyUsage: 8, leadTime: 1, safetyStock: 4 },

  // ===== CEMILAN — stock dihitung per pcs/porsi =====
  { id: uid(), name: "Kentang Goreng", sku: "CML-KTG", category: "Cemilan", unit: "porsi", cost: 7000, price: 18000, stock: 25, dailyUsage: 10, leadTime: 1, safetyStock: 5 },
  { id: uid(), name: "Donat Coklat", sku: "CML-DNT", category: "Cemilan", unit: "pcs", cost: 4500, price: 12000, stock: 20, dailyUsage: 8, leadTime: 1, safetyStock: 4 },
  { id: uid(), name: "Pisang Goreng", sku: "CML-PSG", category: "Cemilan", unit: "porsi", cost: 5500, price: 15000, stock: 20, dailyUsage: 9, leadTime: 1, safetyStock: 4 },
  { id: uid(), name: "Croissant", sku: "CML-CRS", category: "Cemilan", unit: "pcs", cost: 8000, price: 20000, stock: 15, dailyUsage: 6, leadTime: 1, safetyStock: 3 },
].map((p, i) => ({
  code: "BRG-" + String(i + 1).padStart(3, "0"),
  cartonSize: 0, priceCarton: 0, promo: { active: false, type: "percent", value: 0 },
  variants: [],
  expiryDate: "", batchNo: "",
  ...p,
}));

// Generate ID Barang berikutnya berdasarkan kode tertinggi yang ada
const nextCode = (ps) => {
  const max = ps.reduce((m, p) => {
    const n = parseInt(String(p.code || "").replace(/\D/g, ""), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return "BRG-" + String(max + 1).padStart(3, "0");
};

// SKU otomatis: prefiks 3 huruf dari kategori + nomor urut
const skuPrefix = (cat) => (String(cat || "").replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 3) || "BRG");
const genSku = (cat, ps) => {
  const pre = skuPrefix(cat);
  const re = new RegExp("^" + pre + "-(\\d+)$");
  const max = ps.reduce((m, p) => {
    const mt = String(p.sku || "").match(re);
    return mt ? Math.max(m, parseInt(mt[1], 10)) : m;
  }, 0);
  return `${pre}-${String(max + 1).padStart(3, "0")}`;
};

const SEED_MOVEMENTS = [
  { id: uid(), productId: SEED_PRODUCTS[10].id, type: "in", qty: 30, note: "Persiapan stok pagi", at: "Hari ini, 07:00" },
  { id: uid(), productId: SEED_PRODUCTS[5].id, type: "out", qty: 4, note: "Penjualan kasir", at: "Hari ini, 09:40" },
  { id: uid(), productId: SEED_PRODUCTS[0].id, type: "out", qty: 6, note: "Penjualan kasir", at: "Hari ini, 10:05" },
  { id: uid(), productId: SEED_PRODUCTS[16].id, type: "waste", qty: 2, note: "Kentang kedaluwarsa", at: "Kemarin, 16:30" },
];

const SEED_ORDERS = [
  { id: "ORD-2041", customer: "Andi Pratama", channel: "WhatsApp", status: "baru", at: "10:24", items: [{ pid: SEED_PRODUCTS[10].id, qty: 2 }, { pid: SEED_PRODUCTS[5].id, qty: 3 }] },
  { id: "ORD-2040", customer: "Rina Wijaya", channel: "Instagram", status: "baru", at: "09:58", items: [{ pid: SEED_PRODUCTS[0].id, qty: 2 }, { pid: SEED_PRODUCTS[16].id, qty: 2 }] },
  { id: "ORD-2039", customer: "Budi Santoso", channel: "WhatsApp", status: "diproses", at: "09:10", items: [{ pid: SEED_PRODUCTS[13].id, qty: 1 }, { pid: SEED_PRODUCTS[6].id, qty: 2 }] },
  { id: "ORD-2038", customer: "Siti Rahma", channel: "Phone", status: "dikirim", at: "Kemarin", items: [{ pid: SEED_PRODUCTS[1].id, qty: 2 }, { pid: SEED_PRODUCTS[17].id, qty: 2 }] },
];

const SEED_SALES7 = [
  { d: "Sen", v: 6240000 }, { d: "Sel", v: 4820000 }, { d: "Rab", v: 9130000 },
  { d: "Kam", v: 7340000 }, { d: "Jum", v: 11420000 }, { d: "Sab", v: 13180000 },
  { d: "Min", v: 8650000 },
];

const SEED_DEBTS = [
  {
    id: "HTG-001", debtor: "Andi Pratama", business: "Kantor Notaris", phone: "0812-3456-7890",
    items: [{ name: "Es Kopi Susu (M) × 3", qtyLabel: "3 cup", lineTotal: 75000 }, { name: "Nasi Goreng Spesial × 2", qtyLabel: "2 porsi", lineTotal: 50000 }],
    total: 125000, date: "13 Jun 2026", status: "belum", paidAt: null,
  },
  {
    id: "HTG-002", debtor: "Rina Wijaya", business: "Butik Fashion", phone: "0856-1122-3344",
    items: [{ name: "Latte (M) × 2", qtyLabel: "2 cup", lineTotal: 54000 }, { name: "Croissant × 2", qtyLabel: "2 pcs", lineTotal: 40000 }],
    total: 94000, date: "12 Jun 2026", status: "lunas", paidAt: "15 Jun 2026",
  },
];
const nextDebtId = (ds) => {
  const max = ds.reduce((m, d) => {
    const n = parseInt(String(d.id || "").replace(/\D/g, ""), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return "HTG-" + String(max + 1).padStart(3, "0");
};

const nextOrderId = (os) => {
  const max = os.reduce((m, o) => {
    const n = parseInt(String(o.id || "").replace(/\D/g, ""), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 1000);
  return "ORD-" + String(max + 1);
};

// Buka chat WhatsApp dengan pesan siap-kirim (nomor Indonesia otomatis dinormalkan)
const waLink = (phone, text) => {
  let p = String(phone || "").replace(/\D/g, "");
  if (p.startsWith("0")) p = "62" + p.slice(1);
  else if (p.startsWith("8")) p = "62" + p;
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
};

// ===== Akuntansi =====
const SEED_CAPITAL = [
  { id: uid(), name: "Renovasi & interior tempat", amount: 35000000, date: "Modal awal" },
  { id: uid(), name: "Peralatan dapur & memasak", amount: 25000000, date: "Modal awal" },
  { id: uid(), name: "Mesin kopi & peralatan minuman", amount: 20000000, date: "Modal awal" },
  { id: uid(), name: "Furniture, meja & kursi", amount: 15000000, date: "Modal awal" },
  { id: uid(), name: "Branding, logo & signage", amount: 7000000, date: "Modal awal" },
  { id: uid(), name: "Sewa & deposit awal", amount: 20000000, date: "Modal awal" },
  { id: uid(), name: "Perizinan & legalitas usaha", amount: 5000000, date: "Modal awal" },
];
const EXPENSE_CATS = ["Sewa", "Gaji", "Utilitas", "Marketing", "Operasional", "Lain-lain"];
const SEED_EXPENSES = [
  { id: uid(), category: "Sewa", name: "Sewa tempat (bulanan)", amount: 8000000, date: "Bln ini" },
  { id: uid(), category: "Gaji", name: "Gaji karyawan", amount: 12000000, date: "Bln ini" },
  { id: uid(), category: "Utilitas", name: "Listrik & air", amount: 2400000, date: "Bln ini" },
  { id: uid(), category: "Utilitas", name: "Internet", amount: 500000, date: "Bln ini" },
  { id: uid(), category: "Marketing", name: "Konten & iklan IG", amount: 1500000, date: "Bln ini" },
  { id: uid(), category: "Operasional", name: "Transport & pengiriman", amount: 1200000, date: "Bln ini" },
  { id: uid(), category: "Operasional", name: "Kemasan & ATK", amount: 900000, date: "Bln ini" },
];
// Penjualan contoh per barang (± 1 bulan) untuk analisa
const SEED_SALES_LOG = SEED_PRODUCTS.map((p) => {
  const qty = Math.max(1, Math.round(p.dailyUsage * 24));
  return { id: uid(), productId: p.id, qty, revenue: p.price * qty, cost: p.cost * qty, date: "Bln ini" };
});

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["manager"] },
  { key: "stok", label: "Stok Barang", icon: Package, roles: ["manager"] },
  { key: "kasir", label: "Kasir", icon: ShoppingCart, roles: ["cashier", "manager"] },
  { key: "order", label: "Order Online", icon: Globe, roles: ["cashier", "manager"] },
  { key: "hutang", label: "Hutang", icon: ClipboardList, roles: ["cashier", "manager"] },
  { key: "restok", label: "Re-stok", icon: RefreshCcw, roles: ["manager"] },
  { key: "simulasi", label: "Simulasi Stok", icon: Calculator, roles: ["manager"] },
  { key: "akuntansi", label: "Akuntansi", icon: LineChart, roles: ["manager"] },
  { key: "riwayat", label: "Riwayat Penjualan", icon: History, roles: ["manager"] },
];

const PAY_METHODS = [
  { key: "cash", label: "Tunai", icon: Banknote },
  { key: "transfer", label: "Transfer", icon: Landmark },
  { key: "qris", label: "QRIS", icon: QrCode },
  { key: "card", label: "Kartu", icon: CreditCard },
  { key: "hutang", label: "Hutang", icon: Clock },
];
const PAY_LABEL = Object.fromEntries(PAY_METHODS.map((m) => [m.key, m.label]));

const catIcon = (category = "") => {
  const c = String(category).toLowerCase();
  if (/panas|hot|kopi.*panas|coffee.*hot/.test(c)) return Coffee;
  if (/dingin|cold|es |ice|boba|jus/.test(c)) return CupSoda;
  if (/makanan|food|nasi|mie|pasta|sandwich|roti/.test(c)) return Utensils;
  if (/cemilan|snack|kue|donat|pisang|kentang|croissant/.test(c)) return Cookie;
  return UtensilsCrossed;
};

// PIN manajer untuk membuka kunci edit & hapus barang.
// (Demo: nanti diganti otentikasi berbasis peran lewat Supabase Auth)
const MANAGER_PIN = "1234";

// Profil toko untuk header nota (bisa diubah di Pengaturan Nota)
const DEFAULT_STORE = {
  name: "Nama Toko Anda",
  addr1: "Alamat Toko · Kota",
  addr2: "Tagline toko Anda di sini",
  phone: "@handle_sosmed",
  footer: "Terima kasih sudah mampir!",
  pin: "1234", // PIN mode manajer (bisa diganti di Pengaturan)
  paper: 58, // 58 atau 80 mm
  method: "browser", // "browser" | "bluetooth" | "serial"
};

// ===== Cetak langsung ESC/POS via Web Serial (opsional) =====
const escposReceipt = (store, d) => {
  const W = store.paper === 80 ? 42 : 32; // jumlah karakter per baris
  const line = (a, b) => {
    const space = Math.max(1, W - a.length - String(b).length);
    return a + " ".repeat(space) + b + "\n";
  };
  const ESC = "\x1B", GS = "\x1D";
  let s = ESC + "@"; // init
  s += ESC + "a" + "\x01"; // center
  s += ESC + "!" + "\x18" + store.name + "\n" + ESC + "!" + "\x00"; // big bold name
  s += store.addr1 + "\n";
  if (store.addr2) s += store.addr2 + "\n";
  if (store.phone) s += store.phone + "\n";
  s += "-".repeat(W) + "\n";
  s += ESC + "a" + "\x00"; // left
  s += (d.kind === "hutang" ? "NOTA HUTANG" : "NOTA PEMBAYARAN") + "\n";
  s += "No : " + d.no + "\n";
  s += "Tgl: " + d.date + "\n";
  s += "Kasir: " + d.cashier + "\n";
  s += "-".repeat(W) + "\n";
  d.items.forEach((it) => { s += it.name + "\n"; s += line("  " + it.qtyLabel, rp(it.lineTotal)); });
  s += "-".repeat(W) + "\n";
  s += line("TOTAL", rp(d.total));
  if (d.kind !== "hutang") {
    s += line("Bayar (" + d.methodLabel + ")", rp(d.paid != null ? d.paid : d.total));
    if (d.change != null && d.change >= 0) s += line("Kembalian", rp(d.change));
  } else {
    s += "-".repeat(W) + "\n** BELUM LUNAS **\n";
    s += "Pengutang: " + (d.debtor || "-") + "\n";
    if (d.business) s += "Usaha: " + d.business + "\n";
    if (d.phone) s += "Telp: " + d.phone + "\n";
  }
  s += "-".repeat(W) + "\n";
  s += ESC + "a" + "\x01"; // center
  s += store.footer + "\n" + store.phone + "\n";
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
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
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

function Receipt({ store, data }) {
  if (!data) return null;
  const d = data;
  return (
    <div className={`receipt ${store.paper === 80 ? "w80" : ""}`}>
      <img className="r-logo" src={LOGO} alt="" />
      <div className="r-center r-store">{store.name}</div>
      <div className="r-center r-small">{store.addr1}</div>
      {store.addr2 && <div className="r-center r-tag">{store.addr2}</div>}
      {store.phone && <div className="r-center r-small">{store.phone}</div>}
      <div className="r-dash" />
      <div className="r-center r-title">{d.kind === "hutang" ? "NOTA HUTANG" : "NOTA PEMBAYARAN"}</div>
      <div className="r-meta">
        <div className="r-row r-small"><span>No</span><span>{d.no}</span></div>
        <div className="r-row r-small"><span>Tanggal</span><span>{d.date}</span></div>
        <div className="r-row r-small"><span>Kasir</span><span>{d.cashier}</span></div>
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
        <>
          <div className="r-row"><span>Bayar ({d.methodLabel})</span><span>{rp(d.paid != null ? d.paid : d.total)}</span></div>
          {d.change != null && d.change >= 0 && <div className="r-row"><span>Kembalian</span><span>{rp(d.change)}</span></div>}
        </>
      ) : (
        <>
          <div className="r-stamp">** BELUM LUNAS **</div>
          <div className="r-row r-small"><span>Pengutang</span><span>{d.debtor || "-"}</span></div>
          {d.business && <div className="r-row r-small"><span>Usaha</span><span>{d.business}</span></div>}
          {d.phone && <div className="r-row r-small"><span>Telp</span><span>{d.phone}</span></div>}
        </>
      )}
      <div className="r-dash" />
      <div className="r-center r-foot">{store.footer}</div>
      <div className="r-center r-brand">CONFLUX COFFEE CLUB</div>
      <div className="r-center r-small">{store.phone}</div>
    </div>
  );
}

function RoleGate({ onEnter, pin: managerPin }) {
  const [mode, setMode] = useState(null); // null | "cashier" | "manager"
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState(false);
  const submit = () => { if (pin === (managerPin || MANAGER_PIN)) onEnter("manager"); else setErr(true); };
  const enterCashier = () => { if (name.trim()) onEnter("cashier", name.trim()); };

  return (
    <div className="gate">
      <div className="gate-bg" aria-hidden="true">
        <div className="gate-spot" />
        <span className="gate-orb orb-a" />
        <span className="gate-orb orb-b" />
        <span className="gate-orb orb-c" />
        <span className="gate-orb orb-d" />
        <svg className="gate-steam" viewBox="0 0 60 96" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
          <path d="M18 90c0-13 7-16 7-29S18 33 18 20" />
          <path d="M30 90c0-13 7-16 7-29S30 33 30 20" />
          <path d="M42 90c0-13 7-16 7-29S42 33 42 20" />
        </svg>
        {["bean-1", "bean-2", "bean-3", "bean-4", "bean-5", "bean-6"].map((c) => (
          <svg key={c} className={`gate-bean ${c}`} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="32" cy="32" rx="26" ry="17" transform="rotate(-30 32 32)" /><path d="M16 41C26 31 38 33 48 23" />
          </svg>
        ))}
        <div className="gate-grain" />
        <div className="gate-vignette" />
      </div>

      <div className="gate-card">
        <div className="gate-logo-ring"><img className="gate-logo" src={LOGO} alt="Conflux" /></div>
        <div className="gate-title">CONFLUX</div>
        <div className="gate-sub">Coffee Club · Sistem Toko</div>

        {mode === null ? (
          <div className="gate-roles">
            <button className="gate-role" onClick={() => { setMode("cashier"); setName(""); }}>
              <div className="gate-ic cashier"><ShoppingCart size={22} /></div>
              <b>Kasir</b><span>Untuk karyawan — input penjualan</span>
            </button>
            <button className="gate-role" onClick={() => { setMode("manager"); setPin(""); setErr(false); }}>
              <div className="gate-ic manager"><ShieldCheck size={22} /></div>
              <b>Manajer</b><span>Kelola stok, laporan & pengaturan</span>
              <span className="gate-lock"><Lock size={12} /> PIN</span>
            </button>
          </div>
        ) : mode === "cashier" ? (
          <div className="gate-pin">
            <div className="gate-pin-label"><User size={15} /> Nama kasir hari ini</div>
            <input
              className="pin-input" type="text" autoFocus placeholder="cth. Rani"
              value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") enterCashier(); }}
            />
            <div className="gate-pin-actions">
              <button className="btn ghost" onClick={() => { setMode(null); setName(""); }}>Kembali</button>
              <button className="btn" disabled={!name.trim()} onClick={enterCashier}><ArrowRight size={15} /> Masuk</button>
            </div>
            <div className="pin-hint">Nama ini menempel pada setiap transaksi & struk Anda.</div>
          </div>
        ) : (
          <div className="gate-pin">
            <div className="gate-pin-label"><Lock size={15} /> Masukkan PIN manajer</div>
            <input
              className={`pin-input ${err ? "err" : ""}`} type="password" inputMode="numeric" autoFocus
              placeholder="••••" value={pin}
              onChange={(e) => { setPin(e.target.value); setErr(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            />
            {err && <div className="pin-err">PIN salah. Coba lagi.</div>}
            <div className="gate-pin-actions">
              <button className="btn ghost" onClick={() => { setMode(null); setPin(""); setErr(false); }}>Kembali</button>
              <button className="btn" onClick={submit}><Unlock size={15} /> Masuk</button>
            </div>
          </div>
        )}
        <div className="gate-foot">Brewing Connection, One Cup at a Time</div>
      </div>
    </div>
  );
}

// Latar estetik dipakai bersama oleh layar login
function GateBg() {
  return (
    <div className="gate-bg" aria-hidden="true">
      <div className="gate-spot" />
      <span className="gate-orb orb-a" />
      <span className="gate-orb orb-b" />
      <span className="gate-orb orb-c" />
      <span className="gate-orb orb-d" />
      <svg className="gate-steam" viewBox="0 0 60 96" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
        <path d="M18 90c0-13 7-16 7-29S18 33 18 20" />
        <path d="M30 90c0-13 7-16 7-29S30 33 30 20" />
        <path d="M42 90c0-13 7-16 7-29S42 33 42 20" />
      </svg>
      {["bean-1", "bean-2", "bean-3", "bean-4", "bean-5", "bean-6"].map((c) => (
        <svg key={c} className={`gate-bean ${c}`} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="32" cy="32" rx="26" ry="17" transform="rotate(-30 32 32)" /><path d="M16 41C26 31 38 33 48 23" />
        </svg>
      ))}
      <div className="gate-grain" />
      <div className="gate-vignette" />
    </div>
  );
}

function AuthSplash() {
  return (
    <div className="gate">
      <GateBg />
      <div className="gate-card">
        <div className="gate-logo-ring"><img className="gate-logo" src={LOGO} alt="Conflux" /></div>
        <div className="gate-title">CONFLUX</div>
        <div className="gate-sub">Menyiapkan…</div>
      </div>
    </div>
  );
}

function Login({ flash }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const submit = async () => {
    if (!email.trim() || !pw) return;
    setBusy(true); setErr("");
    try { await Auth.signIn(email.trim(), pw); }
    catch (e) { setErr("Email atau kata sandi salah."); setBusy(false); }
  };
  return (
    <div className="gate">
      <GateBg />
      <div className="gate-card">
        <div className="gate-logo-ring"><img className="gate-logo" src={LOGO} alt="Conflux" /></div>
        <div className="gate-title">CONFLUX</div>
        <div className="gate-sub">Coffee Club · Masuk</div>
        <div className="gate-pin">
          <label className="fld" style={{ width: "100%" }}><span>Email</span>
            <input className="pin-input" type="email" autoFocus value={email} placeholder="email@conflux"
              onChange={(e) => { setEmail(e.target.value); setErr(""); }} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} /></label>
          <label className="fld" style={{ width: "100%" }}><span>Kata sandi</span>
            <input className="pin-input" type="password" value={pw} placeholder="••••••••"
              onChange={(e) => { setPw(e.target.value); setErr(""); }} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} /></label>
          {err && <div className="pin-err">{err}</div>}
          <button className="btn full" disabled={busy || !email.trim() || !pw} onClick={submit}>
            {busy ? "Memeriksa…" : <><Unlock size={15} /> Masuk</>}
          </button>
        </div>
        <div className="gate-foot">Akses hanya untuk staf Conflux</div>
      </div>
    </div>
  );
}

function CashierNameGate({ onEnter, onBack }) {
  const [name, setName] = useState("");
  return (
    <div className="gate">
      <GateBg />
      <div className="gate-card">
        <div className="gate-logo-ring"><img className="gate-logo" src={LOGO} alt="Conflux" /></div>
        <div className="gate-title">CONFLUX</div>
        <div className="gate-sub">Coffee Club · Kasir</div>
        <div className="gate-pin">
          <div className="gate-pin-label"><User size={15} /> Nama kasir hari ini</div>
          <input className="pin-input" autoFocus value={name} placeholder="cth. Rani"
            onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onEnter(name.trim()); }} />
          <div className="gate-pin-actions">
            <button className="btn ghost" onClick={onBack}>Keluar</button>
            <button className="btn" disabled={!name.trim()} onClick={() => onEnter(name.trim())}><ArrowRight size={15} /> Mulai</button>
          </div>
          <div className="pin-hint">Nama ini menempel pada setiap transaksi & struk Anda.</div>
        </div>
      </div>
    </div>
  );
}

/* =============================== App =============================== */

export default function App() {
  const [view, setView] = useState("dashboard");
  const [products, setProducts] = useState(SEED_PRODUCTS);
  const [movements, setMovements] = useState(SEED_MOVEMENTS);
  const [orders, setOrders] = useState(SEED_ORDERS);
  const [debts, setDebts] = useState(SEED_DEBTS);
  const [capital, setCapital] = useState(SEED_CAPITAL);
  const [expenses, setExpenses] = useState(SEED_EXPENSES);
  const [salesLog, setSalesLog] = useState(SEED_SALES_LOG);
  const [toast, setToast] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [role, setRole] = useState(null); // null = belum login, "cashier" | "manager"
  const [cashierName, setCashierName] = useState("");
  const [shiftStart, setShiftStart] = useState(null);
  const [shiftReport, setShiftReport] = useState(null);
  const [shiftCash, setShiftCash] = useState("");
  const [btName, setBtName] = useState("");
  const managerMode = role === "manager";
  const [store, setStore] = useState(DEFAULT_STORE);
  const [printReceipt, setPrintReceipt] = useState(null);
  const [receiptModal, setReceiptModal] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2200); };
  const pById = (id) => products.find((p) => p.id === id);

  // ===== Sinkronisasi Supabase + Autentikasi =====
  const persist = (fn) => { if (hasSupabase) fn().catch((e) => { console.error("[sync]", e); flash("Gagal menyimpan ke server — cek koneksi"); }); };

  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!hasSupabase);
  const [profileRole, setProfileRole] = useState(null);
  const loadedRef = useRef(false);
  const authUidRef = useRef(null);

  const loadAll = async () => {
    const res = await Promise.allSettled([
      Products.list(), Movements.list(), OrdersApi.list(), DebtsApi.list(),
      Capital.list(), Expenses.list(), Sales.list({ sinceDays: 90 }), SettingsApi.get(),
    ]);
    const [p, mv, od, dz, cap, exp, sl, st] = res;
    if (p.status === "fulfilled") setProducts(p.value);
    if (mv.status === "fulfilled") setMovements(mv.value);
    if (od.status === "fulfilled") setOrders(od.value);
    if (dz.status === "fulfilled") setDebts(dz.value);
    if (cap.status === "fulfilled") setCapital(cap.value);
    if (exp.status === "fulfilled") setExpenses(exp.value);
    if (sl.status === "fulfilled") setSalesLog(sl.value);
    if (st.status === "fulfilled" && st.value) setStore((s) => ({ ...s, ...st.value }));
    const failed = res.filter((r) => r.status === "rejected");
    if (failed.length) { console.error("[load]", failed.map((f) => f.reason)); flash("Sebagian data gagal dimuat — cek koneksi/akses"); }
    else flash("Tersambung ke database");
  };

  // Pantau sesi login
  useEffect(() => {
    if (!hasSupabase) return;
    let alive = true;
    const apply = async (s) => {
      if (!alive) return;
      setSession(s);
      const uid = s?.user?.id || null;
      if (!s) { authUidRef.current = null; setRole(null); setProfileRole(null); setCashierName(""); loadedRef.current = false; setAuthReady(true); return; }
      if (authUidRef.current === uid) { setAuthReady(true); return; } // refresh token sesi yang sama — jangan setup ulang
      authUidRef.current = uid;
      try {
        const prof = await Profiles.me();
        if (!alive) return;
        const r = prof?.role === "manager" ? "manager" : "cashier";
        setProfileRole(r);
        if (r === "manager") { setRole("manager"); setCashierName(prof?.name || "Manajer"); setView("dashboard"); setShiftStart(Date.now()); }
      } catch (e) { console.error("[profile]", e); setProfileRole("cashier"); }
      setAuthReady(true);
    };
    Auth.getSession().then(apply);
    const { data: sub } = Auth.onChange(apply);
    return () => { alive = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  // Muat data hanya setelah login (RLS butuh sesi terautentikasi)
  useEffect(() => {
    if (!hasSupabase || !session || loadedRef.current) return;
    loadedRef.current = true;
    loadAll();
  }, [session]);

  const recordMovement = (productId, type, qty, note) => {
    const prev = products.find((p) => p.id === productId);
    const delta = type === "in" ? qty : -qty; // waste & out both deduct
    const newStock = prev ? Math.max(0, prev.stock + delta) : 0;
    setProducts((ps) => ps.map((p) => (p.id === productId ? { ...p, stock: newStock } : p)));
    setMovements((m) => [{ id: uid(), productId, type, qty, note, at: "Baru saja" }, ...m]);
    persist(() => Movements.create({ productId, type, qty, note }));
    persist(() => Products.adjustStock(productId, delta));
  };

  // Pemotongan/penambahan stok BANYAK baris sekaligus (aman jika produk sama muncul >1 kali)
  const applyStockDeltas = (deltas) => {
    const newStock = {};
    deltas.forEach((d) => {
      const base = newStock[d.productId] != null ? newStock[d.productId] : (products.find((p) => p.id === d.productId)?.stock ?? 0);
      const delta = d.type === "in" ? d.qty : -d.qty; // waste & out both deduct
      newStock[d.productId] = Math.max(0, base + delta);
    });
    setProducts((ps) => ps.map((p) => (newStock[p.id] != null ? { ...p, stock: newStock[p.id] } : p)));
    setMovements((m) => [...deltas.map((d) => ({ id: uid(), productId: d.productId, type: d.type, qty: d.qty, note: d.note, at: "Baru saja" })), ...m]);
    deltas.forEach((d) => {
      persist(() => Movements.create({ productId: d.productId, type: d.type, qty: d.qty, note: d.note }));
      persist(() => Products.adjustStock(d.productId, d.type === "in" ? d.qty : -d.qty));
    });
  };

  const logout = () => { if (hasSupabase) Auth.signOut(); setRole(null); setSidebarOpen(false); setShiftReport(null); setCashierName(""); loadedRef.current = false; };

  // Ringkasan shift kasir (anti-kecurangan): transaksi kasir ini sejak login
  const buildShiftReport = () => {
    const mine = salesLog.filter((s) => s.txnId && s.cashier === cashierName && (s.ts == null || s.ts >= (shiftStart || 0)));
    const txnIds = [...new Set(mine.map((s) => s.txnId))];
    const byMethod = {};
    mine.forEach((s) => { const m = s.method || "-"; byMethod[m] = (byMethod[m] || 0) + s.revenue; });
    const total = mine.reduce((a, s) => a + s.revenue, 0);
    const items = mine.reduce((a, s) => a + s.qty, 0);
    return { cashier: cashierName, start: shiftStart, count: txnIds.length, total, items, byMethod, cash: byMethod.cash || 0 };
  };
  const requestLogout = () => {
    if (role === "cashier") setShiftReport(buildShiftReport());
    else logout();
  };

  const addProduct = async (data) => {
    const code = nextCode(products);
    if (hasSupabase) {
      try {
        const row = await Products.create({ code, ...data });
        setProducts((ps) => [row, ...ps]);
        flash(`Barang ${code} ditambahkan`);
        return;
      } catch (e) { console.error("[sync]", e); flash("Gagal simpan ke server"); }
    }
    setProducts((ps) => [{ id: uid(), code, ...data }, ...ps]);
    flash(`Barang ${code} ditambahkan`);
  };

  const updateProduct = (id, data) => {
    const prev = products.find((p) => p.id === id);
    // Catat penyesuaian ke log jika jumlah stok berubah lewat edit
    if (prev && data.stock !== prev.stock) {
      const diff = data.stock - prev.stock;
      setMovements((m) => [
        { id: uid(), productId: id, type: diff > 0 ? "in" : "out", qty: Math.abs(diff), note: "Penyesuaian (edit barang)", at: "Baru saja" },
        ...m,
      ]);
      persist(() => Movements.create({ productId: id, type: diff > 0 ? "in" : "out", qty: Math.abs(diff), note: "Penyesuaian (edit barang)" }));
    }
    const merged = { ...prev, ...data };
    setProducts((ps) => ps.map((p) => (p.id === id ? merged : p)));
    persist(() => Products.update(id, merged));
    flash("Barang diperbarui");
  };

  const deleteProduct = (id) => {
    const p = products.find((x) => x.id === id);
    setProducts((ps) => ps.filter((x) => x.id !== id));
    persist(() => Products.remove(id));
    flash(`${p?.code || "Barang"} dihapus`);
  };

  const createOrder = async (data) => {
    const total = data.items.reduce((a, it) => a + (pById(it.pid)?.price || 0) * it.qty, 0);
    const id = nextOrderId(orders);
    const order = { id, customer: data.customer, phone: data.phone, channel: data.channel, status: "baru", items: data.items, total, at: "Baru saja" };
    setOrders((os) => [order, ...os]);
    if (hasSupabase) { try { await OrdersApi.create(order); } catch (e) { console.error("[sync]", e); flash("Order tersimpan lokal — gagal ke server"); } }
    flash(`Order ${id} dibuat`);
  };

  // ===== Akuntansi =====
  const recordSale = (pid, qty, revenue, ctx = {}) => {
    const p = products.find((x) => x.id === pid);
    const rec = {
      productId: pid, qty, revenue, cost: (p?.cost || 0) * qty, date: "Hari ini",
      ts: Date.now(), txnId: ctx.txnId || null, cashier: ctx.cashier || null, method: ctx.method || null,
    };
    setSalesLog((sl) => [{ id: uid(), ...rec }, ...sl]);
    persist(() => Sales.create(rec));
  };
  const addCapital = async (e) => {
    if (hasSupabase) { try { const row = await Capital.create(e); setCapital((c) => [{ id: row.id, ...e }, ...c]); return; } catch (err) { console.error("[sync]", err); } }
    setCapital((c) => [{ id: uid(), ...e }, ...c]);
  };
  const updateCapital = (id, e) => { setCapital((c) => c.map((x) => (x.id === id ? { ...x, ...e } : x))); persist(() => Capital.update(id, e)); };
  const deleteCapital = (id) => { setCapital((c) => c.filter((x) => x.id !== id)); persist(() => Capital.remove(id)); };
  const addExpense = async (e) => {
    if (hasSupabase) { try { const row = await Expenses.create(e); setExpenses((x) => [{ id: row.id, ...e }, ...x]); return; } catch (err) { console.error("[sync]", err); } }
    setExpenses((x) => [{ id: uid(), ...e }, ...x]);
  };
  const updateExpense = (id, e) => { setExpenses((x) => x.map((y) => (y.id === id ? { ...y, ...e } : y))); persist(() => Expenses.update(id, e)); };
  const deleteExpense = (id) => { setExpenses((x) => x.filter((y) => y.id !== id)); persist(() => Expenses.remove(id)); };

  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  const addDebt = (meta, total) => {
    setDebts((ds) => {
      const debt = {
        id: nextDebtId(ds),
        debtor: meta.debtor || "Pelanggan", business: meta.business || "", phone: meta.phone || "",
        items: meta.items || [], total, date: today, status: "belum", paidAt: null,
      };
      persist(() => DebtsApi.create(debt));
      return [debt, ...ds];
    });
  };
  const settleDebt = (id) => {
    setDebts((ds) => ds.map((d) => (d.id === id ? { ...d, status: "lunas", paidAt: today } : d)));
    persist(() => DebtsApi.settle(id, today));
    flash("Hutang ditandai lunas");
  };

  // ===== Cetak nota =====
  const nowStamp = () => new Date().toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const triggerPrint = (data) => {
    if (store.method === "bluetooth") {
      printViaBluetooth(store, data)
        .then(() => flash("Struk terkirim ke printer Bluetooth"))
        .catch((e) => { console.error(e); flash((e && e.message) ? e.message : "Bluetooth gagal — pakai dialog browser"); setPrintReceipt(data); setTimeout(() => window.print(), 80); });
      return;
    }
    if (store.method === "serial") {
      printViaSerial(store, data)
        .then(() => flash("Nota dikirim ke printer"))
        .catch((e) => { flash("Cetak langsung gagal — pakai dialog browser"); setPrintReceipt(data); setTimeout(() => window.print(), 80); });
      return;
    }
    setPrintReceipt(data);
    setTimeout(() => window.print(), 80);
  };
  const connectBt = async () => {
    try {
      const dev = await connectBluetoothPrinter();
      setBtName(dev.name || "Printer Bluetooth");
      flash("Printer Bluetooth terhubung");
    } catch (e) {
      console.error(e);
      flash((e && e.message) ? e.message : "Gagal menghubungkan Bluetooth");
    }
  };
  const testPrint = () => triggerPrint({
    kind: "jual", no: "TES-CETAK", date: nowStamp(), cashier: cashierName || "Manajer",
    items: [{ name: "Tes Cetak Struk", qtyLabel: "1", lineTotal: 0 }],
    total: 0, methodLabel: "Tes", paid: 0, change: 0,
  });
  const buildSaleReceipt = (total, method, meta) => {
    const no = invoiceNo();
    return {
      kind: method === "hutang" ? "hutang" : "jual",
      no, date: nowStamp(), cashier: cashierName || "Kasir",
      items: meta.items || [], total, methodLabel: PAY_LABEL[method] || method,
      paid: meta.paid, change: meta.change,
      debtor: meta.debtor, business: meta.business, phone: meta.phone,
    };
  };
  const debtToReceipt = (d) => ({
    kind: "hutang", no: d.id, date: d.date, cashier: cashierName || "Kasir",
    items: d.items, total: d.total, debtor: d.debtor, business: d.business, phone: d.phone,
  });

  const applySimulation = (rows) => {
    rows.forEach((r) => {
      if (r.pid && Number(r.qty) > 0)
        recordMovement(r.pid, r.dir, Number(r.qty), r.dir === "in" ? "Simulasi: barang masuk" : "Simulasi: barang keluar");
    });
    flash("Simulasi diterapkan ke stok");
  };

  const lowStock = useMemo(
    () => products.filter((p) => stockStatus(p) !== "ok"),
    [products]
  );
  const inventoryValue = useMemo(
    () => products.reduce((a, p) => a + p.cost * p.stock, 0),
    [products]
  );
  const newOrders = orders.filter((o) => o.status === "baru").length;
  const unpaidDebts = debts.filter((d) => d.status === "belum").length;

  // Chart 7 hari + penjualan hari ini, dari transaksi nyata (txnId terisi)
  const salesChart = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const dd = new Date(now); dd.setDate(now.getDate() - i);
      days.push({ key: dd.toDateString(), d: dd.toLocaleDateString("id-ID", { weekday: "short" }), v: 0 });
    }
    const map = Object.fromEntries(days.map((x) => [x.key, x]));
    salesLog.forEach((s) => {
      if (!s.txnId || s.ts == null) return;
      const k = new Date(s.ts).toDateString();
      if (map[k]) map[k].v += s.revenue;
    });
    return days;
  }, [salesLog]);
  const todayRev = salesChart[6]?.v || 0;
  const yRev = salesChart[5]?.v || 0;
  const deltaPct = yRev ? Math.round(((todayRev - yRev) / yRev) * 100) : 0;

  if (!role) {
    // Mode offline/demo (tanpa Supabase): tetap pakai gerbang PIN lama
    if (!hasSupabase) {
      return (
        <>
          <Style />
          <RoleGate onEnter={(r, name) => { setRole(r); setView(r === "manager" ? "dashboard" : "kasir"); setCashierName(r === "manager" ? "Manajer" : (name || "Kasir")); setShiftStart(Date.now()); }} pin={store.pin || MANAGER_PIN} />
        </>
      );
    }
    // Online: autentikasi sungguhan
    if (!authReady) return (<><Style /><AuthSplash /></>);
    if (!session) return (<><Style /><Login flash={flash} /></>);
    if (profileRole === "cashier") {
      return (
        <>
          <Style />
          <CashierNameGate
            onEnter={(name) => { setRole("cashier"); setCashierName(name || "Kasir"); setShiftStart(Date.now()); setView("kasir"); }}
            onBack={() => Auth.signOut()}
          />
        </>
      );
    }
    return (<><Style /><AuthSplash /></>);
  }

  return (
    <div className="app">
      <Style />

      {sidebarOpen && <div className="drawer-scrim" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <img className="brand-logo" src={LOGO} alt="Conflux" />
          <div className="brand-text">
            <div className="brand-name">Coffee Club</div>
            <div className="brand-sub">Manajemen Toko</div>
          </div>
        </div>

        <nav className="nav">
          {NAV.filter((n) => n.roles.includes(role)).map((n) => {
            const Icon = n.icon;
            const active = view === n.key;
            const badge = n.key === "order" ? newOrders : n.key === "restok" ? lowStock.length : n.key === "hutang" ? unpaidDebts : 0;
            return (
              <button
                key={n.key}
                className={`nav-item ${active ? "active" : ""}`}
                onClick={() => { setView(n.key); setSidebarOpen(false); }}
              >
                <Icon size={18} strokeWidth={2} />
                <span>{n.label}</span>
                {badge > 0 && <span className="nav-badge">{badge}</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          <div className={`role-badge ${role}`}>
            {role === "manager" ? <ShieldCheck size={14} /> : <ShoppingCart size={14} />}
            {role === "manager" ? "Mode Manajer" : `Kasir: ${cashierName || "—"}`}
          </div>
          <button className="logout-btn" onClick={requestLogout}><LogOut size={15} /> Keluar / ganti</button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="icon-btn only-mobile" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="topbar-title">
            <h1>{NAV.find((n) => n.key === view)?.label}</h1>
          </div>
          <div className="topbar-right">
            {managerMode && lowStock.length > 0 && (
              <button className="alert-chip" onClick={() => setView("restok")}>
                <Bell size={15} /> {lowStock.length} perlu re-stok
              </button>
            )}
            <button className="icon-btn" title="Pengaturan nota & printer" onClick={() => setSettingsOpen(true)}><Settings size={19} /></button>
          </div>
        </header>

        <div className="content">
          {view === "dashboard" && (
            <Dashboard
              products={products} chart={salesChart} todayRev={todayRev} deltaPct={deltaPct} lowStock={lowStock}
              inventoryValue={inventoryValue} newOrders={newOrders}
              movements={movements} pById={pById} setView={setView}
            />
          )}
          {view === "riwayat" && (
            <SalesHistory salesLog={salesLog} products={products} />
          )}
          {view === "stok" && (
            <Inventory products={products} movements={movements} pById={pById}
              onMove={(pid, type, qty, note) => { recordMovement(pid, type, qty, note); flash(`Stok ${type === "in" ? "masuk" : "keluar"} dicatat`); }}
              onAdd={addProduct} onUpdate={updateProduct} onDelete={deleteProduct}
            />
          )}
          {view === "kasir" && (
            <Kasir products={products}
              onCheckout={(lines, total, method, meta) => {
                const txnId = uid();
                applyStockDeltas(lines.map((l) => ({ productId: l.pid, type: "out", qty: l.qty, note: `Penjualan kasir (${PAY_LABEL[method]})` })));
                (meta.items || []).forEach((it) => recordSale(it.pid, it.qty, it.lineTotal, { txnId, cashier: cashierName || "Kasir", method }));
                if (method === "hutang") { addDebt(meta, total); flash(`Hutang ${rp(total)} dicatat — ${meta?.debtor || "Pelanggan"}`); }
                else flash(`Pembayaran ${rp(total)} via ${PAY_LABEL[method]} berhasil`);
                setPrintReceipt(buildSaleReceipt(total, method, meta));
                setReceiptModal(true);
              }}
            />
          )}
          {view === "order" && (
            <Orders orders={orders} setOrders={setOrders} pById={pById} products={products}
              onStatus={(id, status) => persist(() => OrdersApi.setStatus(id, status))}
              onCreate={createOrder}
              onAccept={(o) => {
                const txnId = uid();
                applyStockDeltas(o.items.map((it) => ({ productId: it.pid, type: "out", qty: it.qty, note: `Order ${o.id}` })));
                o.items.forEach((it) => { const p = pById(it.pid); if (p) recordSale(it.pid, it.qty, p.price * it.qty, { txnId, cashier: "Order Online", method: "order" }); });
                flash(`${o.id} diterima & stok dipotong`);
              }}
              flash={flash}
            />
          )}
          {view === "restok" && (
            <Restock products={products}
              onReceive={(p, qty) => { recordMovement(p.id, "in", qty, "Penerimaan re-stok"); flash(`${qty} ${p.name} masuk stok`); }}
            />
          )}
          {view === "hutang" && (
            <Debts debts={debts} onSettle={settleDebt} onPrint={(d) => triggerPrint(debtToReceipt(d))} />
          )}
          {view === "simulasi" && (
            <Simulation products={products} onApply={applySimulation} />
          )}
          {view === "akuntansi" && (
            <Accounting
              products={products} capital={capital} expenses={expenses} salesLog={salesLog} flash={flash}
              onAddCapital={addCapital} onUpdateCapital={updateCapital} onDeleteCapital={deleteCapital}
              onAddExpense={addExpense} onUpdateExpense={updateExpense} onDeleteExpense={deleteExpense}
            />
          )}
        </div>
      </main>

      {/* Preview nota setelah transaksi */}
      <Modal
        open={receiptModal}
        onClose={() => setReceiptModal(false)}
        width={400}
        title="Nota Pembayaran"
        footer={
          <>
            <button className="btn ghost" onClick={() => setReceiptModal(false)}>Tutup</button>
            <button className="btn" onClick={() => triggerPrint(printReceipt)}><Printer size={15} /> Cetak Nota</button>
          </>
        }
      >
        <div className="receipt-preview"><Receipt store={store} data={printReceipt} /></div>
      </Modal>

      {/* Pengaturan nota & printer */}
      <Modal
        open={settingsOpen}
        onClose={() => { setSettingsOpen(false); persist(() => SettingsApi.save(store)); }}
        width={520}
        title="Pengaturan Nota & Printer"
        footer={<button className="btn" onClick={() => { setSettingsOpen(false); persist(() => SettingsApi.save(store)); }}><Check size={15} /> Selesai</button>}
      >
        <div className="form">
          <label className="fld"><span>Nama toko</span>
            <input value={store.name} onChange={(e) => setStore((s) => ({ ...s, name: e.target.value }))} /></label>
          <label className="fld"><span>Alamat / lokasi</span>
            <input value={store.addr1} onChange={(e) => setStore((s) => ({ ...s, addr1: e.target.value }))} /></label>
          <label className="fld"><span>Baris kedua (tagline)</span>
            <input value={store.addr2} onChange={(e) => setStore((s) => ({ ...s, addr2: e.target.value }))} /></label>
          <div className="grid2">
            <label className="fld"><span>Kontak / IG</span>
              <input value={store.phone} onChange={(e) => setStore((s) => ({ ...s, phone: e.target.value }))} /></label>
            <label className="fld"><span>Ucapan footer</span>
              <input value={store.footer} onChange={(e) => setStore((s) => ({ ...s, footer: e.target.value }))} /></label>
          </div>

          {managerMode && !hasSupabase && (
            <>
              <div className="form-section">Keamanan</div>
              <label className="fld"><span>PIN Manajer</span>
                <input type="text" inputMode="numeric" maxLength={8} value={store.pin || ""} placeholder="cth. 1234"
                  onChange={(e) => setStore((s) => ({ ...s, pin: e.target.value.replace(/\D/g, "") }))} />
                <span className="hint">PIN untuk masuk mode Manajer (minimal 4 digit). Tersimpan saat Anda klik “Selesai”. Kalau dikosongkan, PIN kembali ke 1234.</span>
              </label>
            </>
          )}

          <div className="form-section">Printer</div>
          <label className="fld"><span>Lebar kertas</span>
            <div className="seg">
              <button type="button" className={store.paper === 58 ? "on" : ""} onClick={() => setStore((s) => ({ ...s, paper: 58 }))}>58 mm</button>
              <button type="button" className={store.paper === 80 ? "on" : ""} onClick={() => setStore((s) => ({ ...s, paper: 80 }))}>80 mm</button>
            </div>
          </label>
          <label className="fld"><span>Metode cetak</span>
            <div className="seg seg-3">
              <button type="button" className={store.method === "browser" ? "on" : ""} onClick={() => setStore((s) => ({ ...s, method: "browser" }))}>Dialog browser</button>
              <button type="button" className={store.method === "bluetooth" ? "on" : ""} onClick={() => setStore((s) => ({ ...s, method: "bluetooth" }))}>Bluetooth</button>
              <button type="button" className={store.method === "serial" ? "on" : ""} onClick={() => setStore((s) => ({ ...s, method: "serial" }))}>USB/Serial</button>
            </div>
            <span className="hint">
              {store.method === "browser"
                ? "Cetak lewat dialog browser — pilih printer thermal yang sudah terpasang. Paling kompatibel (semua perangkat)."
                : store.method === "bluetooth"
                ? "Untuk tablet/HP: kirim langsung ke printer thermal Bluetooth (ESC/POS). Didukung Chrome di Android & ChromeOS. iPad/iPhone belum mendukung Web Bluetooth — pakai dialog browser."
                : "Kirim ESC/POS langsung ke printer (Chrome/Edge desktop). Cocok untuk printer USB/serial; jika gagal otomatis kembali ke dialog browser."}
            </span>
          </label>

          {store.method === "bluetooth" && (
            <div className="bt-box">
              <div className="bt-status">
                <span className={`bt-dot ${btName ? "on" : ""}`} />
                {btName ? <span>Terhubung: <b>{btName}</b></span> : <span className="muted">Belum terhubung ke printer</span>}
              </div>
              <div className="bt-actions">
                <button type="button" className="btn sm" onClick={connectBt}><Bluetooth size={15} /> {btName ? "Hubungkan ulang" : "Hubungkan printer"}</button>
                <button type="button" className="btn ghost sm" disabled={!btName} onClick={testPrint}><Printer size={14} /> Tes cetak</button>
              </div>
              <span className="hint">Tekan “Hubungkan printer”, pilih printer dari daftar Bluetooth, lalu “Tes cetak”. Pairing perlu diulang setiap kali aplikasi dibuka ulang (aturan keamanan browser).</span>
            </div>
          )}

          <button className="btn ghost full" onClick={() => triggerPrint({
            kind: "jual", no: "INV-CONTOH", date: nowStamp(), cashier: "Manajer",
            items: [{ name: "Es Kopi Susu (M)", qtyLabel: "2 cup", lineTotal: 50000 }, { name: "Nasi Goreng Spesial", qtyLabel: "1 porsi", lineTotal: 25000 }],
            total: 75000, methodLabel: "Tunai", paid: 80000, change: 5000,
          })}><Printer size={15} /> Cetak nota contoh</button>
        </div>
      </Modal>

      {/* Layer tersembunyi khusus untuk dicetak */}
      <div id="receipt-print">
        <style>{`@media print{@page{size:${store.paper === 80 ? "80mm" : "58mm"} auto;margin:0}}`}</style>
        <Receipt store={store} data={printReceipt} />
      </div>

      <Modal
        open={!!shiftReport}
        onClose={() => setShiftReport(null)}
        width={460}
        title="Ringkasan Shift Kasir"
        footer={<>
          <button className="btn ghost" onClick={() => setShiftReport(null)}>Batal</button>
          <button className="btn" onClick={() => { setShiftCash(""); logout(); }}><LogOut size={15} /> Keluar</button>
        </>}
      >
        {shiftReport && (() => {
          const counted = Number(String(shiftCash).replace(/\D/g, "")) || 0;
          const selisih = counted - shiftReport.cash;
          return (
            <div className="shift">
              <div className="shift-head">
                <div className="shift-ava">{(shiftReport.cashier[0] || "?").toUpperCase()}</div>
                <div>
                  <div className="shift-name">{shiftReport.cashier}</div>
                  <div className="muted xs">Sesi sejak {shiftReport.start ? new Date(shiftReport.start).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—"}</div>
                </div>
              </div>
              <div className="shift-stats">
                <div className="shift-stat"><span>Transaksi</span><b>{shiftReport.count}</b></div>
                <div className="shift-stat"><span>Barang</span><b>{shiftReport.items}</b></div>
                <div className="shift-stat"><span>Total</span><b>{rp(shiftReport.total)}</b></div>
              </div>
              {Object.keys(shiftReport.byMethod).length > 0 && (
                <div className="shift-methods">
                  {Object.entries(shiftReport.byMethod).map(([m, v]) => (
                    <div key={m} className="shift-row"><span>{PAY_LABEL[m] || m}</span><span className="tab">{rp(v)}</span></div>
                  ))}
                </div>
              )}
              <div className="shift-recon">
                <div className="shift-row strong"><span>Tunai diharapkan di laci</span><span className="tab">{rp(shiftReport.cash)}</span></div>
                <label className="fld"><span>Tunai dihitung (opsional)</span>
                  <input inputMode="numeric" value={shiftCash} placeholder="hitung uang fisik di laci"
                    onChange={(e) => setShiftCash(e.target.value)} /></label>
                {shiftCash !== "" && (
                  <div className={`shift-diff ${selisih === 0 ? "ok" : selisih > 0 ? "over" : "short"}`}>
                    {selisih === 0 ? "Cocok ✓" : selisih > 0 ? `Lebih ${rp(selisih)}` : `Kurang ${rp(Math.abs(selisih))}`}
                  </div>
                )}
              </div>
              <div className="muted xs">Catat selisih untuk serah terima. Manajer melihat seluruh transaksi di menu Riwayat Penjualan.</div>
            </div>
          );
        })()}
      </Modal>

      <Toast msg={toast} />
    </div>
  );
}

/* ============================ Dashboard ============================ */

function Dashboard({ products, chart, todayRev, deltaPct, lowStock, inventoryValue, newOrders, movements, pById, setView }) {
  const todaySales = todayRev;
  const delta = deltaPct;
  const weekTotal = chart.reduce((a, d) => a + d.v, 0);

  return (
    <div className="stack">
      <div className="grid-4">
        <Stat icon={Wallet} accent label="Penjualan hari ini" value={rp(todaySales)}
          sub={<span className={delta >= 0 ? "up" : "down"}>{delta >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{Math.abs(delta)}% vs kemarin</span>} />
        <Stat icon={Boxes} label="Nilai inventory" value={rp(inventoryValue)} sub={`${products.length} jenis barang`} />
        <Stat icon={Globe} label="Order online baru" value={num(newOrders)} sub="menunggu diproses" />
        <Stat icon={AlertTriangle} label="Perlu re-stok" value={num(lowStock.length)} sub="di bawah titik pesan" />
      </div>

      <div className="grid-2-1">
        <section className="card">
          <div className="card-head">
            <h2>Penjualan 7 hari</h2>
            <span className="muted">Total {rp(weekTotal)}</span>
          </div>
          <div className="chart-wrap">
            {weekTotal === 0 && <div className="chart-empty">Belum ada penjualan dalam 7 hari terakhir. Grafik akan terisi otomatis dari transaksi kasir.</div>}
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chart} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E2514D" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#E2514D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2C3A33" vertical={false} />
                <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fill: "#6F8077", fontSize: 12 }} />
                <YAxis tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${Math.round(v / 1000)}rb` : v)} tickLine={false} axisLine={false} tick={{ fill: "#6F8077", fontSize: 12 }} width={44} />
                <Tooltip formatter={(v) => rp(v)} contentStyle={{ borderRadius: 12, border: "1px solid #2C3A33", background: "#1B2521", color: "#ECE7DA", fontFamily: "Inter", fontSize: 13 }} labelStyle={{ color: "#9DAEA3" }} itemStyle={{ color: "#ECE7DA" }} />
                <Area type="monotone" dataKey="v" stroke="#E2514D" strokeWidth={2.4} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Peringatan stok</h2>
            <button className="link" onClick={() => setView("restok")}>Lihat semua <ChevronRight size={14} /></button>
          </div>
          <div className="alert-list">
            {lowStock.length === 0 && <div className="empty">Semua stok aman 🎉</div>}
            {lowStock.slice(0, 5).map((p) => (
              <div key={p.id} className="alert-row">
                <div>
                  <div className="alert-name">{p.name}</div>
                  <div className="alert-meta">Sisa {num(p.stock)} · ROP {num(rop(p))}</div>
                </div>
                <Pill status={stockStatus(p)} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card-head"><h2>Aktivitas stok terbaru</h2><span className="muted">{movements.length} catatan</span></div>
        <table className="tbl">
          <thead><tr><th>Barang</th><th>Tipe</th><th className="r">Jumlah</th><th>Catatan</th><th className="r">Waktu</th></tr></thead>
          <tbody>
            {movements.slice(0, 6).map((m) => {
              const p = pById(m.productId);
              return (
                <tr key={m.id}>
                  <td className="strong">{p?.name || "—"}</td>
                  <td><span className={`mv ${m.type}`}>{m.type === "in" ? <Plus size={12} /> : m.type === "waste" ? <AlertCircle size={12} /> : <Minus size={12} />}{m.type === "in" ? "Masuk" : m.type === "waste" ? "Terbuang" : "Keluar"}</span></td>
                  <td className="r tab">{num(m.qty)}</td>
                  <td className="muted">{m.note}</td>
                  <td className="r muted">{fmtAt(m.at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}

/* ============================ Riwayat Penjualan ============================ */

function SalesHistory({ salesLog, products }) {
  const [range, setRange] = useState("today"); // today | all
  const [open, setOpen] = useState({});
  const pName = (id) => products.find((p) => p.id === id)?.name || "Barang";

  // Kelompokkan baris per transaksi (txnId)
  const txns = useMemo(() => {
    const map = {};
    salesLog.forEach((s) => {
      if (!s.txnId) return;
      if (!map[s.txnId]) map[s.txnId] = { txnId: s.txnId, ts: s.ts, cashier: s.cashier || "—", method: s.method || "-", items: [], total: 0, qty: 0 };
      const t = map[s.txnId];
      t.items.push({ name: pName(s.productId), qty: s.qty, lineTotal: s.revenue });
      t.total += s.revenue; t.qty += s.qty;
      if (s.ts && (!t.ts || s.ts < t.ts)) t.ts = s.ts;
    });
    return Object.values(map).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }, [salesLog, products]);

  const isToday = (ts) => ts && new Date(ts).toDateString() === new Date().toDateString();
  const list = range === "today" ? txns.filter((t) => isToday(t.ts)) : txns;

  const total = list.reduce((a, t) => a + t.total, 0);
  const byCashier = {};
  list.forEach((t) => { byCashier[t.cashier] = (byCashier[t.cashier] || 0) + t.total; });
  const byMethod = {};
  list.forEach((t) => { byMethod[t.method] = (byMethod[t.method] || 0) + t.total; });

  const fmtTime = (ts) => ts ? new Date(ts).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="stack">
      <div className="acc-toolbar">
        <div className="seg">
          <button className={`seg-btn ${range === "today" ? "on" : ""}`} onClick={() => setRange("today")}>Hari ini</button>
          <button className={`seg-btn ${range === "all" ? "on" : ""}`} onClick={() => setRange("all")}>90 hari</button>
        </div>
        <div className="muted" style={{ fontSize: 13 }}>{list.length} transaksi · {rp(total)}</div>
      </div>

      <div className="grid-4">
        <Stat icon={Wallet} accent label={range === "today" ? "Penjualan hari ini" : "Total penjualan"} value={rp(total)} sub={`${list.length} transaksi`} />
        <Stat icon={ShoppingCart} label="Barang terjual" value={num(list.reduce((a, t) => a + t.qty, 0))} sub="total unit" />
        <Stat icon={Banknote} label="Tunai" value={rp(byMethod.cash || 0)} sub="metode tunai" />
        <Stat icon={Landmark} label="Non-tunai" value={rp(total - (byMethod.cash || 0))} sub="transfer/qris/kartu/order" />
      </div>

      <section className="card">
        <div className="card-head"><h2>Penjualan per kasir</h2></div>
        <div className="cashier-chips">
          {Object.keys(byCashier).length === 0 && <div className="empty">Belum ada transaksi.</div>}
          {Object.entries(byCashier).sort((a, b) => b[1] - a[1]).map(([c, v]) => (
            <div key={c} className="cashier-chip">
              <div className="cc-ava">{(c[0] || "?").toUpperCase()}</div>
              <div><div className="cc-name">{c}</div><div className="cc-val">{rp(v)}</div></div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h2>Daftar transaksi</h2><span className="muted">Hanya bisa dilihat manajer</span></div>
        <div className="txn-list">
          {list.length === 0 && <div className="empty">Belum ada transaksi pada periode ini.</div>}
          {list.map((t) => (
            <div key={t.txnId} className={`txn ${open[t.txnId] ? "open" : ""}`}>
              <button className="txn-head" onClick={() => setOpen((o) => ({ ...o, [t.txnId]: !o[t.txnId] }))}>
                <div className="txn-time">{fmtTime(t.ts)}</div>
                <div className="txn-cashier"><User size={12} /> {t.cashier}</div>
                <div className={`txn-method m-${t.method}`}>{PAY_LABEL[t.method] || t.method}</div>
                <div className="txn-qty">{t.qty} brg</div>
                <div className="txn-total">{rp(t.total)}</div>
                <ChevronRight size={15} className="txn-caret" />
              </button>
              {open[t.txnId] && (
                <div className="txn-items">
                  {t.items.map((it, i) => (
                    <div key={i} className="txn-item"><span>{it.qty}× {it.name}</span><span className="tab">{rp(it.lineTotal)}</span></div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ============================ Inventory / Stok ============================ */

function Inventory({ products, movements, pById, onMove, onAdd, onUpdate, onDelete }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [moveFor, setMoveFor] = useState(null);
  const [moveType, setMoveType] = useState("in");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [formFor, setFormFor] = useState(null); // {} = tambah, product = edit
  const [delFor, setDelFor] = useState(null);

  const cats = ["all", ...Array.from(new Set(products.map((p) => p.category)))];
  const list = products.filter((p) => {
    const okQ = (p.name + p.sku + p.code).toLowerCase().includes(q.toLowerCase());
    const okF = filter === "all" || p.category === filter;
    return okQ && okF;
  });

  const openMove = (p, type) => { setMoveFor(p); setMoveType(type); setQty(1); setNote(type === "in" ? "Persiapan stok" : type === "waste" ? "Produk rusak / kedaluwarsa" : "Penyesuaian"); };
  const submitMove = () => { onMove(moveFor.id, moveType, Number(qty) || 0, note); setMoveFor(null); };

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="search">
          <Search size={16} />
          <input placeholder="Cari nama, ID, atau SKU…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="chips">
          {cats.map((c) => (
            <button key={c} className={`chip ${filter === c ? "on" : ""}`} onClick={() => setFilter(c)}>
              {c === "all" ? "Semua" : c}
            </button>
          ))}
        </div>
        <button className="btn" onClick={() => setFormFor({})}><Plus size={16} /> Tambah Barang</button>
      </div>

      <section className="card pad0">
        <table className="tbl">
          <thead>
            <tr>
              <th>ID</th><th>Barang</th><th>Kategori</th><th className="r">Harga jual</th>
              <th className="r">Stok</th><th className="r">ROP</th><th>Status</th><th className="r">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td><span className="idcode">{p.code}</span></td>
                <td>
                  <div className="strong">{p.name}</div>
                  <div className="muted xs" style={{ display: "flex", gap: 6 }}>
                    {p.sku && <span>SKU {p.sku}</span>}
                    {p.batchNo && <span>· {p.batchNo}</span>}
                    {p.variants && p.variants.length > 0 && <span className="var-badge">{p.variants.map(v => v.key).join("·")}</span>}
                  </div>
                  {p.expiryDate && (
                    <div className={`expiry-tag ${new Date(p.expiryDate) <= new Date(Date.now() + 7*86400000) ? "warn" : ""}`}>
                      <AlertCircle size={10} /> Exp {p.expiryDate}
                    </div>
                  )}
                </td>
                <td className="muted">{p.category}</td>
                <td className="r">
                  {p.variants && p.variants.length > 0 ? (
                    <div className="muted xs">{p.variants.map((v) => <div key={v.key} className="tab">{v.key}: {rp(v.price)}</div>)}</div>
                  ) : (
                    <>
                      <div className="tab">{rp(p.price)}<span className="per"> /{p.unit}</span></div>
                      {hasCarton(p) && <div className="muted xs tab">{rp(p.priceCarton)} /ktn</div>}
                      {hasPromo(p) && <div className="promo-mini">promo {p.promo.type === "percent" ? p.promo.value + "%" : "−" + rp(p.promo.value)}</div>}
                    </>
                  )}
                </td>
                <td className="r tab strong">{num(p.stock)} <span className="unit">{p.unit}</span></td>
                <td className="r tab muted">{num(rop(p))}</td>
                <td><Pill status={stockStatus(p)} /></td>
                <td className="r">
                  <div className="row-actions">
                    <button className="mini in" onClick={() => openMove(p, "in")}><Plus size={14} /> Masuk</button>
                    <button className="mini out" onClick={() => openMove(p, "out")}><Minus size={14} /> Keluar</button>
                    <button className="mini waste" onClick={() => openMove(p, "waste")} title="Catat produk terbuang/rusak"><AlertCircle size={13} /></button>
                    <span className="act-div" />
                    <button className="icon-btn xs" title="Edit barang" onClick={() => setFormFor(p)}><Pencil size={15} /></button>
                    <button className="icon-btn xs danger-h" title="Hapus barang" onClick={() => setDelFor(p)}><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={8} className="empty">Tidak ada barang cocok.</td></tr>}
          </tbody>
        </table>
      </section>

      <Modal
        open={!!moveFor}
        onClose={() => setMoveFor(null)}
        title={`Stok ${moveType === "in" ? "Masuk" : moveType === "waste" ? "Terbuang / Rusak" : "Keluar"}`}
        footer={
          <>
            <button className="btn ghost" onClick={() => setMoveFor(null)}>Batal</button>
            <button className="btn" onClick={submitMove}>Simpan</button>
          </>
        }
      >
        {moveFor && (
          <div className="form">
            <div className="form-prod">
              <span>{moveFor.name}</span>
              <span className="muted">Stok saat ini: {num(moveFor.stock)}</span>
            </div>
            <div className="seg">
              <button className={moveType === "in" ? "on" : ""} onClick={() => setMoveType("in")}>Masuk</button>
              <button className={moveType === "out" ? "on" : ""} onClick={() => setMoveType("out")}>Keluar</button>
              <button className={moveType === "waste" ? "on" : ""} onClick={() => setMoveType("waste")}>Terbuang</button>
            </div>
            <label className="fld">
              <span>Jumlah</span>
              <div className="stepper">
                <button onClick={() => setQty((v) => Math.max(1, Number(v) - 1))}><Minus size={16} /></button>
                <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
                <button onClick={() => setQty((v) => Number(v) + 1)}><Plus size={16} /></button>
              </div>
            </label>
            <label className="fld">
              <span>Catatan</span>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Keterangan…" />
            </label>
          </div>
        )}
      </Modal>

      {formFor && (
        <ProductForm
          product={formFor.id ? formFor : null}
          products={products}
          categories={Array.from(new Set(products.map((p) => p.category)))}
          onClose={() => setFormFor(null)}
          onSave={(data) => {
            if (formFor.id) onUpdate(formFor.id, data);
            else onAdd(data);
            setFormFor(null);
          }}
        />
      )}

      <Modal
        open={!!delFor}
        onClose={() => setDelFor(null)}
        title="Hapus barang?"
        footer={
          <>
            <button className="btn ghost" onClick={() => setDelFor(null)}>Batal</button>
            <button className="btn danger" onClick={() => { onDelete(delFor.id); setDelFor(null); }}><Trash2 size={15} /> Hapus</button>
          </>
        }
      >
        {delFor && (
          <p className="confirm-text">
            Barang <b>{delFor.code} — {delFor.name}</b> akan dihapus permanen dari daftar.
            Tindakan ini tidak bisa dibatalkan.
          </p>
        )}
      </Modal>
    </div>
  );
}

/* ============================ Product Form (Tambah / Edit) ============================ */

function ProductForm({ product, products, categories, onClose, onSave }) {
  const [f, setF] = useState(
    product || {
      name: "", sku: "", category: "", unit: "cup", price: 0, cost: 0, stock: 0,
      cartonSize: 0, priceCarton: 0, promo: { active: false, type: "percent", value: 0 },
      dailyUsage: 1, leadTime: 1, safetyStock: 0,
      variants: [], expiryDate: "", batchNo: "",
    }
  );
  const [skuTouched, setSkuTouched] = useState(!!product); // mode edit: jangan auto-ganti
  const [variantTab, setVariantTab] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const n = (k, v) => set(k, v === "" ? "" : Math.max(0, Number(v)));
  const setPromo = (patch) => setF((s) => ({ ...s, promo: { ...(s.promo || { active: false, type: "percent", value: 0 }), ...patch } }));

  // Variants helpers
  const variants = f.variants || [];
  const hasVariants = variants.length > 0;
  const addVariant = () => set("variants", [...variants, { key: "", label: "", price: 0, cost: 0 }]);
  const setVariant = (i, field, val) => set("variants", variants.map((v, idx) => idx === i ? { ...v, [field]: val } : v));
  const removeVariant = (i) => set("variants", variants.filter((_, idx) => idx !== i));
  const valid = String(f.name).trim().length > 0;

  const allProducts = products || [];
  const unitOptions = Array.from(new Set([...allProducts.map((p) => p.unit).filter(Boolean), "cup", "porsi", "pcs", "mangkok", "pack", "botol", "kg", "sachet", "box"]));

  // Saat kategori berganti, SKU ikut dibuat otomatis (selama belum diubah manual)
  const onCategory = (v) =>
    setF((s) => ({ ...s, category: v, sku: !product && !skuTouched ? genSku(v, allProducts) : s.sku }));
  const regenSku = () => { setSkuTouched(false); set("sku", genSku(f.category, allProducts)); };

  const csize = Number(f.cartonSize) || 0;
  const promo = f.promo || { active: false, type: "percent", value: 0 };
  const effUnit = effPrice(Number(f.price) || 0, promo);
  const effCtn = effPrice(Number(f.priceCarton) || 0, promo);

  const save = () => {
    if (!valid) return;
    const cat = String(f.category || "Lainnya").trim();
    const cleanVariants = variants.filter((v) => v.key && v.key.trim()).map((v) => ({
      key: String(v.key).trim().toUpperCase(),
      label: String(v.label || v.key).trim(),
      price: Number(v.price) || 0,
      cost: Number(v.cost) || 0,
    }));
    onSave({
      name: String(f.name).trim(),
      sku: String(f.sku || "").trim().toUpperCase() || genSku(cat, allProducts),
      category: cat, unit: String(f.unit || "cup").trim(),
      price: Number(f.price) || 0, cost: Number(f.cost) || 0, stock: Number(f.stock) || 0,
      cartonSize: hasVariants ? 0 : csize, priceCarton: (hasVariants || csize === 0) ? 0 : Number(f.priceCarton) || 0,
      promo: { active: !!promo.active, type: promo.type || "percent", value: Number(promo.value) || 0 },
      dailyUsage: Number(f.dailyUsage) || 0, leadTime: Number(f.leadTime) || 0, safetyStock: Number(f.safetyStock) || 0,
      variants: cleanVariants, expiryDate: String(f.expiryDate || ""), batchNo: String(f.batchNo || "").trim(),
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      width={580}
      title={product ? `Edit Barang · ${product.code}` : "Tambah Barang Baru"}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Batal</button>
          <button className="btn" disabled={!valid} onClick={save}><Check size={15} /> {product ? "Simpan perubahan" : "Tambah barang"}</button>
        </>
      }
    >
      <div className="form">
        {product && (
          <div className="form-prod">
            <span>ID Barang</span>
            <span className="idcode lg">{product.code}</span>
          </div>
        )}
        <label className="fld">
          <span>Nama barang *</span>
          <input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="cth. Es Kopi Susu, Nasi Goreng Spesial…" autoFocus />
        </label>
        <div className="grid2">
          <label className="fld">
            <span>Kategori</span>
            <PickOrAdd value={f.category} options={categories} onChange={onCategory} placeholder="Pilih kategori" addLabel="Kategori baru…" />
          </label>
          <label className="fld">
            <span>SKU / Kode Item <span className="auto-tag">otomatis</span></span>
            <div className="inline-fld">
              <input value={f.sku} onChange={(e) => { set("sku", e.target.value.toUpperCase()); setSkuTouched(true); }} placeholder="otomatis dari kategori" />
              <button type="button" className="btn ghost sm" onClick={regenSku} title="Buat ulang otomatis"><RefreshCcw size={14} /></button>
            </div>
          </label>
        </div>
        <div className="grid2">
          <label className="fld">
            <span>Satuan</span>
            <PickOrAdd value={f.unit} options={unitOptions} onChange={(v) => set("unit", v)} placeholder="Pilih satuan" addLabel="Satuan baru…" />
          </label>
          <label className="fld">
            <span>Harga modal / satuan (Rp)</span>
            <input type="number" value={f.cost} onChange={(e) => n("cost", e.target.value)} />
          </label>
        </div>

        <div className="form-section">Harga jual & promo</div>
        <div className="grid2">
          <label className="fld">
            <span>Harga jual / satuan (Rp)</span>
            <input type="number" value={f.price} onChange={(e) => n("price", e.target.value)} />
            <span className="hint">Margin {f.cost > 0 && f.price > 0 ? Math.round(((f.price - f.cost) / f.price) * 100) : 0}%</span>
          </label>
          <label className="fld">
            <span>Isi per karton (satuan)</span>
            <input type="number" value={f.cartonSize} onChange={(e) => n("cartonSize", e.target.value)} placeholder="0 = tidak dijual per karton" />
          </label>
        </div>
        {csize > 0 && (
          <label className="fld">
            <span>Harga jual / karton (Rp)</span>
            <div className="inline-fld">
              <input type="number" value={f.priceCarton} onChange={(e) => n("priceCarton", e.target.value)} />
              <button type="button" className="btn ghost sm" onClick={() => set("priceCarton", (Number(f.price) || 0) * csize)}>= satuan × {csize}</button>
            </div>
            <span className="hint">Tanpa diskon: {rp((Number(f.price) || 0) * csize)}</span>
          </label>
        )}

        <div className="promo-box">
          <div className="promo-row">
            <button type="button" className={`switch ${promo.active ? "on" : ""}`} onClick={() => setPromo({ active: !promo.active })}>
              <span className="knob" />
            </button>
            <span className="promo-label">Aktifkan promo / diskon</span>
          </div>
          {promo.active && (
            <>
              <div className="grid2">
                <div className="seg">
                  <button type="button" className={promo.type === "percent" ? "on" : ""} onClick={() => setPromo({ type: "percent" })}>Persen (%)</button>
                  <button type="button" className={promo.type === "amount" ? "on" : ""} onClick={() => setPromo({ type: "amount" })}>Potongan (Rp)</button>
                </div>
                <label className="fld">
                  <span>{promo.type === "percent" ? "Diskon (%)" : "Potongan (Rp)"}</span>
                  <input type="number" value={promo.value} onChange={(e) => setPromo({ value: Math.max(0, Number(e.target.value)) })} />
                </label>
              </div>
              <div className="promo-preview">
                Harga setelah promo: <b>{rp(effUnit)}</b> / {f.unit || "satuan"}
                {csize > 0 && <> · <b>{rp(effCtn)}</b> / karton</>}
              </div>
            </>
          )}
        </div>

        <div className="form-section">
          Varian Ukuran / Pilihan
          <button type="button" className="btn ghost sm" style={{ marginLeft: "auto" }} onClick={() => { setVariantTab(!variantTab); if (!variantTab && variants.length === 0) addVariant(); }}>
            {hasVariants ? `${variants.length} varian aktif` : variantTab ? "Batal" : "+ Tambah varian (S/M/L)"}
          </button>
        </div>
        {variantTab && (
          <div className="variant-editor">
            <p className="hint" style={{ marginTop: 0 }}>Jika ada varian, harga jual utama akan digantikan oleh harga per varian. Stok tetap dihitung bersama per produk.</p>
            {variants.map((v, i) => (
              <div key={i} className="variant-row">
                <input className="var-key-inp" value={v.key} onChange={(e) => setVariant(i, "key", e.target.value.toUpperCase())} placeholder="S / M / L" maxLength={4} />
                <input style={{ flex: 2 }} value={v.label} onChange={(e) => setVariant(i, "label", e.target.value)} placeholder="Label (cth. Small 200ml)" />
                <input type="number" value={v.price} onChange={(e) => setVariant(i, "price", Math.max(0, Number(e.target.value)))} placeholder="Harga jual" />
                <input type="number" value={v.cost} onChange={(e) => setVariant(i, "cost", Math.max(0, Number(e.target.value)))} placeholder="HPP" />
                <button type="button" className="icon-btn xs danger-h" onClick={() => removeVariant(i)}><X size={14} /></button>
              </div>
            ))}
            <button type="button" className="btn ghost sm" onClick={addVariant}><Plus size={14} /> Tambah ukuran</button>
          </div>
        )}

        <label className="fld">
          <span>Jumlah stok ({f.unit || "satuan"})</span>
          <input type="number" value={f.stock} onChange={(e) => n("stock", e.target.value)} />
          {product && <span className="hint">Mengubah jumlah akan tercatat sebagai penyesuaian di log stok.</span>}
        </label>

        <div className="grid2">
          <label className="fld">
            <span>Tanggal kedaluwarsa</span>
            <input type="date" value={f.expiryDate || ""} onChange={(e) => set("expiryDate", e.target.value)} />
          </label>
          <label className="fld">
            <span>No. Batch / Lot</span>
            <input value={f.batchNo || ""} onChange={(e) => set("batchNo", e.target.value)} placeholder="cth. LOT-2026-01" />
          </label>
        </div>

        <div className="form-section">Parameter perhitungan ROP</div>
        <div className="grid3">
          <label className="fld">
            <span>Pemakaian / hari</span>
            <input type="number" value={f.dailyUsage} onChange={(e) => n("dailyUsage", e.target.value)} />
          </label>
          <label className="fld">
            <span>Lead time (hari)</span>
            <input type="number" value={f.leadTime} onChange={(e) => n("leadTime", e.target.value)} />
          </label>
          <label className="fld">
            <span>Stok aman</span>
            <input type="number" value={f.safetyStock} onChange={(e) => n("safetyStock", e.target.value)} />
          </label>
        </div>
        <div className="rop-preview">
          Titik pesan ulang (ROP): <b>{num(rop({ dailyUsage: Number(f.dailyUsage) || 0, leadTime: Number(f.leadTime) || 0, safetyStock: Number(f.safetyStock) || 0 }))}</b> {f.unit || "satuan"}
        </div>
      </div>
    </Modal>
  );
}

/* ============================ Kasir / POS ============================ */

function Kasir({ products, onCheckout }) {
  const [q, setQ] = useState("");
  const [cart, setCart] = useState({}); // "pid|mode" -> qty
  const [paid, setPaid] = useState("");
  const [method, setMethod] = useState("cash");
  const [debtor, setDebtor] = useState("");
  const [business, setBusiness] = useState("");
  const [phone, setPhone] = useState("");
  const [cat, setCat] = useState("all");

  const cats = [...new Set(products.map((p) => p.category).filter(Boolean))];
  const list = products.filter((p) => {
    if (cat !== "all" && p.category !== cat) return false;
    const hay = (p.name + " " + p.sku + " " + p.code + " " + p.category).toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });
  const pVariants = (p) => p.variants && p.variants.length > 0 ? p.variants : null;
  const satuanPer = (p, mode) => {
    if (pVariants(p)) return 1; // setiap varian = 1 porsi
    return mode === "carton" ? p.cartonSize : 1;
  };
  const modePrice = (p, mode) => {
    const vs = pVariants(p);
    if (vs) {
      const v = vs.find((x) => x.key === mode);
      return v ? effPrice(v.price, p.promo) : effPrice(p.price, p.promo);
    }
    return effPrice(mode === "carton" ? p.priceCarton : p.price, p.promo);
  };

  // total satuan dari produk p yang sudah masuk keranjang (semua mode)
  const committed = (pid) =>
    Object.entries(cart).reduce((a, [k, qty]) => {
      const [id, mode] = k.split("|");
      if (id !== pid) return a;
      const p = products.find((x) => x.id === pid);
      return a + qty * satuanPer(p, mode);
    }, 0);

  const add = (p, mode) => {
    const need = satuanPer(p, mode);
    if (committed(p.id) + need > p.stock) return; // stok tak cukup
    setCart((c) => ({ ...c, [`${p.id}|${mode}`]: (c[`${p.id}|${mode}`] || 0) + 1 }));
  };
  const dec = (key) => setCart((c) => {
    const n = (c[key] || 0) - 1;
    const next = { ...c };
    if (n <= 0) delete next[key]; else next[key] = n;
    return next;
  });
  const remove = (key) => setCart((c) => { const n = { ...c }; delete n[key]; return n; });

  const lines = Object.entries(cart).map(([key, qty]) => {
    const [pid, mode] = key.split("|");
    const p = products.find((x) => x.id === pid);
    const each = modePrice(p, mode);
    const satuan = satuanPer(p, mode) * qty;
    return { key, pid, mode, qty, p, each, satuan, lineTotal: each * qty };
  });
  const total = lines.reduce((a, l) => a + l.lineTotal, 0);
  const change = (Number(paid) || 0) - total;
  const isCash = method === "cash";
  const isHutang = method === "hutang";
  const canPay = lines.length > 0 && (!isCash || change >= 0);

  const checkout = () => {
    if (!canPay) return;
    const meta = {
      debtor: debtor.trim(), business: business.trim(), phone: phone.trim(),
      paid: isCash ? Number(paid) || total : total,
      change: isCash ? Math.max(0, change) : 0,
      items: lines.map((l) => {
        const vs = pVariants(l.p);
        const vLabel = vs ? (vs.find((x) => x.key === l.mode)?.label || l.mode) : null;
        return {
          pid: l.pid,
          name: l.p.name + (vLabel ? ` (${l.mode})` : ""),
          qtyLabel: `${l.qty} ${vLabel ? vLabel : l.mode === "carton" ? "karton" : l.p.unit}`,
          qty: l.satuan,
          lineTotal: l.lineTotal,
        };
      }),
    };
    onCheckout(lines.map((l) => ({ pid: l.pid, qty: l.satuan })), total, method, meta);
    setCart({}); setPaid(""); setDebtor(""); setBusiness(""); setPhone(""); setMethod("cash");
  };

  const quickPay = [total, Math.ceil(total / 50000) * 50000, Math.ceil(total / 100000) * 100000];

  return (
    <div className="pos">
      <section className="pos-products">
        <div className="cat-tabs">
          <button className={`cat-tab ${cat === "all" ? "on" : ""}`} onClick={() => setCat("all")}>
            <LayoutGrid size={15} /> Semua
          </button>
          {cats.map((c) => {
            const I = catIcon(c);
            return (
              <button key={c} className={`cat-tab ${cat === c ? "on" : ""}`} onClick={() => setCat(c)}>
                <I size={15} /> {c}
              </button>
            );
          })}
        </div>
        <div className="search big">
          <Search size={18} />
          <input placeholder="Cari barang untuk ditambahkan…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="pos-grid">
          {list.length === 0 && <div className="empty pos-empty">Tidak ada barang cocok.</div>}
          {list.map((p) => {
            const left = p.stock - committed(p.id);
            const unitEff = effPrice(p.price, p.promo);
            const cartonEff = effPrice(p.priceCarton, p.promo);
            const carton = hasCarton(p);
            const Icon = catIcon(p.category);
            return (
              <div key={p.id} className={`pos-card ${left <= 0 ? "out" : ""}`}>
                <Icon className="pos-card-wm" size={62} strokeWidth={1.4} />
                <div className="pos-card-top">
                  <span className="pos-cat"><Icon size={12} /> {p.category}</span>
                  <span className={`pos-stock ${left <= 0 ? "zero" : ""}`}>{left <= 0 ? "Habis" : `${num(left)} ${p.unit}`}</span>
                </div>
                <div className="pos-name">{p.name}{hasPromo(p) && <span className="promo-tag">PROMO</span>}</div>
                <div className="pos-price">
                  {pVariants(p) ? (
                    <span className="per">{pVariants(p).length} ukuran tersedia</span>
                  ) : (
                    <>{hasPromo(p) && <span className="strike">{rp(p.price)}</span>}
                    {rp(unitEff)} <span className="per">/ {p.unit}</span></>
                  )}
                </div>
                <div className="pos-add">
                  {pVariants(p) ? (
                    pVariants(p).map((v) => (
                      <button key={v.key} className="add-btn variant" disabled={left < 1} onClick={() => add(p, v.key)}>
                        <span className="var-key">{v.key}</span>
                        <span className="add-sub">{rp(effPrice(v.price, p.promo))}</span>
                      </button>
                    ))
                  ) : (
                    <>
                      <button className="add-btn" disabled={left < 1} onClick={() => add(p, "unit")}><Plus size={13} /> {p.unit}</button>
                      {carton && (
                        <button className="add-btn carton" disabled={left < p.cartonSize} onClick={() => add(p, "carton")}>
                          <Plus size={13} /> Karton<span className="add-sub">{rp(cartonEff)}</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <aside className="cart">
        <div className="cart-head"><ShoppingCart size={18} /> <span>Keranjang</span><span className="cart-count" key={lines.length}>{lines.length}</span></div>
        <div className="cart-lines">
          {lines.length === 0 && (
            <div className="cart-empty">
              <svg viewBox="0 0 80 80" width="84" height="84" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path className="steam" d="M34 12c0 4-4 5-4 9s4 5 4 9" opacity=".55" />
                <path className="steam" d="M46 12c0 4-4 5-4 9s4 5 4 9" opacity=".4" />
                <path d="M18 38h40v8a18 18 0 0 1-18 18h-4A18 18 0 0 1 18 46z" />
                <path d="M58 41h6a7 7 0 0 1 0 14h-2" />
                <line x1="22" y1="70" x2="54" y2="70" />
              </svg>
              <div className="cart-empty-title">Keranjang masih kosong</div>
              <div className="cart-empty-sub">Pilih barang di kiri untuk mulai transaksi</div>
            </div>
          )}
          {lines.map((l) => (
            <div key={l.key} className="cart-line">
              <div className="cart-line-info">
                <div className="cart-line-name">{l.p.name}</div>
                <div className="muted xs">
                  {(() => {
                    const vs = pVariants(l.p);
                    if (vs) { const v = vs.find((x) => x.key === l.mode); return (v?.label || l.mode) + " · " + rp(l.each); }
                    return (l.mode === "carton" ? `karton (${l.p.cartonSize} ${l.p.unit})` : `per ${l.p.unit}`) + " · " + rp(l.each);
                  })()}
                </div>
              </div>
              <div className="stepper sm">
                <button onClick={() => dec(l.key)}><Minus size={14} /></button>
                <span>{l.qty}</span>
                <button onClick={() => add(l.p, l.mode)}><Plus size={14} /></button>
              </div>
              <div className="cart-line-total tab">{rp(l.lineTotal)}</div>
              <button className="icon-btn xs" onClick={() => remove(l.key)}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>

        <div className="cart-foot">
          <div className="cart-total"><span>Total</span><span className="tab big" key={total}>{rp(total)}</span></div>

          <div className="pay-methods">
            {PAY_METHODS.map((m) => {
              const Icon = m.icon;
              return (
                <button key={m.key} className={`pay-method ${method === m.key ? "on" : ""}`} onClick={() => setMethod(m.key)}>
                  <Icon size={17} /><span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {isCash && (
            <>
              <div className="pay-row">
                <Wallet size={15} />
                <input className="pay-input" type="number" placeholder="Uang diterima" value={paid} onChange={(e) => setPaid(e.target.value)} />
              </div>
              <div className="quick-pay">
                {[...new Set(quickPay)].filter((v) => v > 0).map((v) => (
                  <button key={v} onClick={() => setPaid(String(v))}>{rp(v)}</button>
                ))}
              </div>
              {paid !== "" && total > 0 && (
                <div className={`change ${change < 0 ? "neg" : ""}`}>
                  <span>{change < 0 ? "Kurang" : "Kembalian"}</span>
                  <span className="tab">{rp(Math.abs(change))}</span>
                </div>
              )}
            </>
          )}

          {(method === "transfer" || method === "qris" || method === "card") && total > 0 && (
            <div className="pay-note">Tagih <b>{rp(total)}</b> via {PAY_LABEL[method]}. Konfirmasi setelah dana masuk.</div>
          )}

          {isHutang && (
            <>
              <div className="pay-row">
                <User size={15} />
                <input className="pay-input" placeholder="Nama pengutang" value={debtor} onChange={(e) => setDebtor(e.target.value)} />
              </div>
              <div className="pay-row">
                <Building2 size={15} />
                <input className="pay-input" placeholder="Nama usaha (opsional)" value={business} onChange={(e) => setBusiness(e.target.value)} />
              </div>
              <div className="pay-row">
                <Phone size={15} />
                <input className="pay-input" placeholder="No. telp (opsional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="pay-note warn">Dicatat sebagai <b>hutang</b> di menu Hutang — bisa ditandai lunas saat dibayar.</div>
            </>
          )}

          <button className={`btn full pay ${isHutang ? "hutang" : ""}`} disabled={!canPay} onClick={checkout}>
            {isHutang ? <Clock size={16} /> : <Check size={16} />}
            {isHutang ? "Catat hutang" : "Bayar"} {total > 0 ? rp(total) : ""}
          </button>
        </div>
      </aside>
    </div>
  );
}

/* ============================ Order Online ============================ */

const ORDER_FLOW = ["baru", "diproses", "dikirim", "selesai"];
const ORDER_LABEL = { baru: "Baru", diproses: "Diproses", dikirim: "Dikirim", selesai: "Selesai" };
const CHANNEL_ICON = { WhatsApp: Globe, Instagram: Globe, Marketplace: Truck };

function Orders({ orders, setOrders, pById, products, onAccept, onStatus, onCreate, flash }) {
  const [tab, setTab] = useState("baru");
  const [creating, setCreating] = useState(false);

  const orderTotal = (o) => o.items.reduce((a, it) => a + (pById(it.pid)?.price || 0) * it.qty, 0);
  const counts = ORDER_FLOW.reduce((acc, s) => ({ ...acc, [s]: orders.filter((o) => o.status === s).length }), {});

  const waText = (o) => {
    const lines = o.items.map((it) => `• ${it.qty}× ${pById(it.pid)?.name || "Barang"}`).join("\n");
    const status = { baru: "sudah kami terima ✅", diproses: "sedang kami siapkan 🛠️", dikirim: "sudah dikirim 🚚", selesai: "sudah selesai 🎉" }[o.status];
    return `Halo ${o.customer || ""}, pesanan *${o.id}* Anda ${status}.\n\n${lines}\n\nTotal: ${rp(orderTotal(o))}\n\nTerima kasih sudah berbelanja di Conflux Coffee Club! ☕`;
  };

  const advance = (o) => {
    const i = ORDER_FLOW.indexOf(o.status);
    const next = ORDER_FLOW[Math.min(i + 1, ORDER_FLOW.length - 1)];
    if (o.status === "baru") onAccept(o);
    setOrders((os) => os.map((x) => (x.id === o.id ? { ...x, status: next } : x)));
    onStatus && onStatus(o.id, next);
    if (o.status !== "baru") flash(`${o.id} → ${ORDER_LABEL[next]}`);
  };

  const list = orders.filter((o) => o.status === tab);

  return (
    <div className="stack">
      <div className="acc-toolbar">
        <div className="muted" style={{ fontSize: 13 }}>Catat pesanan masuk (WhatsApp / IG / marketplace) lalu proses sampai selesai.</div>
        <button className="btn" onClick={() => setCreating(true)}><Plus size={16} /> Order Baru</button>
      </div>

      <div className="order-tabs">
        {ORDER_FLOW.map((s) => (
          <button key={s} className={`order-tab ${tab === s ? "on" : ""}`} onClick={() => setTab(s)}>
            {ORDER_LABEL[s]} {counts[s] > 0 && <span className="tab-count">{counts[s]}</span>}
          </button>
        ))}
      </div>

      <div className="order-grid">
        {list.length === 0 && <div className="empty card">Tidak ada order pada status ini.</div>}
        {list.map((o) => {
          const ChIcon = CHANNEL_ICON[o.channel] || Globe;
          const i = ORDER_FLOW.indexOf(o.status);
          const nextLabel = i < ORDER_FLOW.length - 1 ? ORDER_LABEL[ORDER_FLOW[i + 1]] : null;
          const cta = o.status === "baru" ? "Terima order" : nextLabel ? `Tandai ${nextLabel}` : null;
          return (
            <div key={o.id} className="order-card card">
              <div className="order-card-head">
                <div>
                  <div className="order-id">{o.id}</div>
                  <div className="muted xs">{o.customer} · {fmtAt(o.at)}</div>
                </div>
                <span className="channel"><ChIcon size={13} /> {o.channel}</span>
              </div>
              <div className="order-items">
                {o.items.map((it, idx) => {
                  const p = pById(it.pid);
                  const short = p && p.stock < it.qty;
                  return (
                    <div key={idx} className="order-item">
                      <span>{it.qty}× {p?.name}</span>
                      {short ? <span className="warn-text">stok {num(p.stock)}</span> : <span className="muted tab">{rp((p?.price || 0) * it.qty)}</span>}
                    </div>
                  );
                })}
              </div>
              <div className="order-card-foot">
                <span className="order-total">Total {rp(orderTotal(o))}</span>
                <div className="order-actions">
                  {o.phone && (
                    <a className="btn sm wa" href={waLink(o.phone, waText(o))} target="_blank" rel="noreferrer" title="Kirim update via WhatsApp">
                      <Phone size={14} /> WhatsApp
                    </a>
                  )}
                  {cta && <button className="btn sm" onClick={() => advance(o)}>{cta} <ChevronRight size={14} /></button>}
                  {!cta && <span className="done-tag"><Check size={14} /> Selesai</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {creating && (
        <OrderForm products={products} onClose={() => setCreating(false)} onSave={(data) => { onCreate(data); setCreating(false); }} />
      )}
    </div>
  );
}

function OrderForm({ products, onClose, onSave }) {
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState("WhatsApp");
  const [lines, setLines] = useState([]);
  const [pick, setPick] = useState(products[0]?.id || "");
  const [qty, setQty] = useState(1);

  const addLine = () => {
    if (!pick || qty < 1) return;
    setLines((ls) => {
      const ex = ls.find((l) => l.pid === pick);
      if (ex) return ls.map((l) => (l.pid === pick ? { ...l, qty: l.qty + Number(qty) } : l));
      return [...ls, { pid: pick, qty: Number(qty) }];
    });
    setQty(1);
  };
  const removeLine = (pid) => setLines((ls) => ls.filter((l) => l.pid !== pid));
  const total = lines.reduce((a, l) => a + (products.find((p) => p.id === l.pid)?.price || 0) * l.qty, 0);
  const valid = customer.trim() && lines.length > 0;

  return (
    <Modal
      open onClose={onClose} width={540} title="Order Baru"
      footer={<>
        <button className="btn ghost" onClick={onClose}>Batal</button>
        <button className="btn" disabled={!valid} onClick={() => onSave({ customer: customer.trim(), phone: phone.trim(), channel, items: lines })}><Check size={15} /> Simpan order</button>
      </>}
    >
      <div className="form">
        <div className="grid2">
          <label className="fld"><span>Nama pelanggan</span>
            <input value={customer} onChange={(e) => setCustomer(e.target.value)} autoFocus placeholder="cth. Kedai Senja" /></label>
          <label className="fld"><span>No. WhatsApp</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" placeholder="cth. 0812xxxxxxx" /></label>
        </div>
        <label className="fld"><span>Sumber order</span>
          <select className="sim-select" value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option>WhatsApp</option><option>Instagram</option><option>Marketplace</option><option>Telepon</option>
          </select></label>

        <div className="form-section">Barang dipesan</div>
        <div className="order-pick">
          <select className="sim-select" value={pick} onChange={(e) => setPick(e.target.value)}>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="number" min="1" className="qty-in" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} />
          <button className="btn sm" type="button" onClick={addLine}><Plus size={14} /> Tambah</button>
        </div>
        {lines.length > 0 ? (
          <div className="order-line-list">
            {lines.map((l) => {
              const p = products.find((x) => x.id === l.pid);
              return (
                <div key={l.pid} className="order-line">
                  <span>{l.qty}× {p?.name}</span>
                  <span className="muted tab">{rp((p?.price || 0) * l.qty)}</span>
                  <button className="icon-btn xs danger-h" type="button" onClick={() => removeLine(l.pid)}><X size={14} /></button>
                </div>
              );
            })}
            <div className="order-line grand"><span>Total</span><b>{rp(total)}</b></div>
          </div>
        ) : <div className="muted xs">Belum ada barang. Pilih barang lalu klik "Tambah".</div>}
      </div>
    </Modal>
  );
}

/* ============================ Hutang ============================ */

function Debts({ debts, onSettle, onPrint }) {
  const [tab, setTab] = useState("belum");
  const [confirm, setConfirm] = useState(null);

  const counts = {
    belum: debts.filter((d) => d.status === "belum").length,
    lunas: debts.filter((d) => d.status === "lunas").length,
    semua: debts.length,
  };
  const outstanding = debts.filter((d) => d.status === "belum").reduce((a, d) => a + d.total, 0);
  const list = debts.filter((d) => (tab === "semua" ? true : d.status === tab));

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
                <button className="btn ghost sm" onClick={() => onPrint(d)}><Printer size={14} /> Cetak</button>
                {d.status === "belum"
                  ? <button className="btn sm" onClick={() => setConfirm(d)}><CheckCircle2 size={15} /> Lunas</button>
                  : <span className="done-tag"><Check size={14} /> {d.paidAt}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Konfirmasi pelunasan"
        footer={
          <>
            <button className="btn ghost" onClick={() => setConfirm(null)}>Batal</button>
            <button className="btn" onClick={() => { onSettle(confirm.id); setConfirm(null); }}><CheckCircle2 size={15} /> Ya, sudah lunas</button>
          </>
        }
      >
        {confirm && (
          <p className="confirm-text">
            Tandai hutang <b>{confirm.id}</b> dari <b>{confirm.debtor}{confirm.business ? ` (${confirm.business})` : ""}</b>
            {" "}sebesar <b>{rp(confirm.total)}</b> sebagai sudah dibayar?
          </p>
        )}
      </Modal>
    </div>
  );
}

/* ============================ Re-stok (ROP) ============================ */

function Restock({ products, onReceive }) {
  const need = products.filter((p) => stockStatus(p) !== "ok")
    .sort((a, b) => (stockStatus(a) === "crit" ? -1 : 1) - (stockStatus(b) === "crit" ? -1 : 1));
  const [open, setOpen] = useState(null);

  return (
    <div className="stack">
      <div className="formula-card card">
        <div className="formula-ic"><RefreshCcw size={20} /></div>
        <div>
          <div className="formula-title">Cara menghitung saran re-stok</div>
          <div className="formula-line">
            <b>ROP</b> = (Pemakaian harian × Lead time) + Stok aman
          </div>
          <div className="formula-line">
            <b>Saran jumlah</b> = Pemakaian harian × (Lead time + Siklus order {REVIEW_DAYS} hari) + Stok aman − Stok saat ini
          </div>
          <div className="muted xs">Barang dipesan ketika stok menyentuh atau di bawah ROP (titik pesan ulang).</div>
        </div>
      </div>

      {need.length === 0 && <div className="empty card">Tidak ada barang yang perlu di-re-stok. Semua aman.</div>}

      <div className="restock-list">
        {need.map((p) => {
          const r = rop(p), t = targetLevel(p), s = suggestQty(p);
          const st = stockStatus(p);
          return (
            <div key={p.id} className="restock-card card">
              <div className="restock-main">
                <div className="restock-name-row">
                  <div>
                    <div className="strong">{p.name}</div>
                    <div className="muted xs">{p.code} · {p.category}</div>
                  </div>
                  <Pill status={st} />
                </div>

                <div className="rop-meta">
                  <div className="rop-cell"><span className="muted xs">Stok saat ini</span><b className={st === "crit" ? "danger" : ""}>{num(p.stock)}</b></div>
                  <div className="rop-cell"><span className="muted xs">Titik pesan (ROP)</span><b>{num(r)}</b></div>
                  <div className="rop-cell"><span className="muted xs">Target stok</span><b>{num(t)}</b></div>
                  <div className="rop-cell highlight"><span className="muted xs">Saran pesan</span><b className="accent">{num(s)}</b></div>
                </div>

                <button className="detail-toggle" onClick={() => setOpen(open === p.id ? null : p.id)}>
                  {open === p.id ? "Sembunyikan" : "Lihat"} rincian perhitungan
                  <ChevronRight size={13} style={{ transform: open === p.id ? "rotate(90deg)" : "none" }} />
                </button>
                {open === p.id && (
                  <div className="calc">
                    <div><span>Pemakaian harian</span><b>{num(p.dailyUsage)} / hari</b></div>
                    <div><span>Lead time supplier</span><b>{num(p.leadTime)} hari</b></div>
                    <div><span>Stok aman</span><b>{num(p.safetyStock)}</b></div>
                    <hr />
                    <div><span>ROP = {p.dailyUsage}×{p.leadTime} + {p.safetyStock}</span><b>{num(r)}</b></div>
                    <div><span>Target = {p.dailyUsage}×({p.leadTime}+{REVIEW_DAYS}) + {p.safetyStock}</span><b>{num(t)}</b></div>
                    <div className="calc-final"><span>Saran = {num(t)} − {num(p.stock)}</span><b>{num(s)}</b></div>
                  </div>
                )}
              </div>

              <div className="restock-action">
                <button className="btn full" onClick={() => onReceive(p, s)}>
                  <Truck size={15} /> Terima {num(s)} unit
                </button>
                <span className="muted xs center">Simulasi barang datang dari supplier</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================ Simulasi Stok (khusus manajer) ============================ */

function Simulation({ products, onApply }) {
  const [rows, setRows] = useState([]);
  const [confirm, setConfirm] = useState(false);
  const pById = (id) => products.find((p) => p.id === id);

  const addRow = () => setRows((rs) => [...rs, { id: uid(), pid: "", dir: "in", qty: 1 }]);
  const setRow = (id, patch) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const delRow = (id) => setRows((rs) => rs.filter((r) => r.id !== id));
  const reset = () => setRows([]);
  const fillFromRestock = () => {
    const need = products.filter((p) => stockStatus(p) !== "ok");
    setRows(need.map((p) => ({ id: uid(), pid: p.id, dir: "in", qty: suggestQty(p) })));
  };

  const valid = rows.filter((r) => r.pid && Number(r.qty) > 0);

  const agg = {};
  valid.forEach((r) => {
    if (!agg[r.pid]) agg[r.pid] = { in: 0, out: 0 };
    agg[r.pid][r.dir] += Number(r.qty);
  });

  let pembelian = 0, penjualan = 0, laba = 0;
  valid.forEach((r) => {
    const p = pById(r.pid); if (!p) return;
    if (r.dir === "in") pembelian += p.cost * Number(r.qty);
    else { penjualan += p.price * Number(r.qty); laba += (p.price - p.cost) * Number(r.qty); }
  });
  const arusKas = penjualan - pembelian;

  const proj = Object.keys(agg).map((pid) => {
    const p = pById(pid);
    const masuk = agg[pid].in, keluar = agg[pid].out;
    const akhir = p.stock + masuk - keluar;
    const status = akhir < 0 ? "neg" : akhir <= p.safetyStock ? "crit" : akhir <= rop(p) ? "warn" : "ok";
    const days = p.dailyUsage > 0 ? Math.floor(Math.max(0, akhir) / p.dailyUsage) : null;
    return { p, masuk, keluar, akhir, status, days };
  });
  const anyNeg = proj.some((x) => x.akhir < 0);

  return (
    <div className="stack">
      <div className="sim-intro card">
        <div className="formula-ic"><Calculator size={20} /></div>
        <div style={{ flex: 1 }}>
          <div className="formula-title">Simulasi & Kalkulasi Stok</div>
          <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.5 }}>
            Rencanakan barang masuk (pembelian) dan keluar (penjualan), lihat dampak biaya, pendapatan, laba,
            dan proyeksi stok akhir — <b>tanpa mengubah data asli</b>. Terapkan hanya bila sudah yakin.
          </div>
        </div>
        <span className="lock-chip on" title="Khusus manajer"><ShieldCheck size={15} /> Manajer</span>
      </div>

      <div className="grid-4">
        <Stat icon={ArrowDownRight} label="Total pembelian (modal)" value={rp(pembelian)} sub="dari barang masuk" />
        <Stat icon={ArrowUpRight} accent label="Total penjualan" value={rp(penjualan)} sub="dari barang keluar" />
        <Stat icon={TrendingUp} label="Estimasi laba kotor" value={rp(laba)} sub="penjualan − modal" />
        <Stat icon={Wallet} label="Arus kas bersih" value={rp(arusKas)}
          sub={<span className={arusKas >= 0 ? "up" : "down"}>{arusKas >= 0 ? "surplus" : "defisit"}</span>} />
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Rencana pergerakan barang</h2>
          <div className="sim-head-actions">
            <button className="btn ghost sm" onClick={fillFromRestock}><RefreshCcw size={14} /> Isi dari saran re-stok</button>
            {rows.length > 0 && <button className="btn ghost sm" onClick={reset}><X size={14} /> Reset</button>}
          </div>
        </div>

        {rows.length === 0 && <div className="empty">Belum ada baris. Tambahkan barang, atau isi otomatis dari saran re-stok.</div>}

        <div className="sim-rows">
          {rows.map((r) => {
            const p = pById(r.pid);
            const lineVal = p ? (r.dir === "in" ? p.cost : p.price) * Number(r.qty || 0) : 0;
            return (
              <div key={r.id} className="sim-row">
                <select className="sim-select" value={r.pid} onChange={(e) => setRow(r.id, { pid: e.target.value })}>
                  <option value="">— Pilih barang —</option>
                  {products.map((pp) => <option key={pp.id} value={pp.id}>{pp.code} · {pp.name}</option>)}
                </select>
                <div className="seg sim-seg">
                  <button className={r.dir === "in" ? "on" : ""} onClick={() => setRow(r.id, { dir: "in" })}>Masuk</button>
                  <button className={r.dir === "out" ? "on" : ""} onClick={() => setRow(r.id, { dir: "out" })}>Keluar</button>
                </div>
                <div className="stepper sm">
                  <button onClick={() => setRow(r.id, { qty: Math.max(1, Number(r.qty) - 1) })}><Minus size={14} /></button>
                  <input type="number" value={r.qty} onChange={(e) => setRow(r.id, { qty: Math.max(0, Number(e.target.value)) })} style={{ width: 52 }} />
                  <button onClick={() => setRow(r.id, { qty: Number(r.qty) + 1 })}><Plus size={14} /></button>
                </div>
                <span className="unit sim-unit">{p?.unit || ""}</span>
                <span className={`sim-line-val ${r.dir === "in" ? "neg" : "pos"}`}>
                  {r.dir === "in" ? "−" : "+"}{rp(lineVal)}
                </span>
                <button className="icon-btn xs" onClick={() => delRow(r.id)}><Trash2 size={14} /></button>
              </div>
            );
          })}
        </div>

        <button className="btn ghost sim-add" onClick={addRow}><Plus size={15} /> Tambah baris</button>
      </section>

      {proj.length > 0 && (
        <section className="card pad0">
          <div className="card-head" style={{ padding: "18px 18px 0" }}>
            <h2>Proyeksi stok setelah simulasi</h2>
            {anyNeg && <span className="warn-text">⚠ ada stok tidak mencukupi</span>}
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Barang</th><th className="r">Stok awal</th><th className="r">Masuk</th>
                <th className="r">Keluar</th><th className="r">Stok akhir</th><th>Status</th><th className="r">Tahan</th>
              </tr>
            </thead>
            <tbody>
              {proj.map(({ p, masuk, keluar, akhir, status, days }) => (
                <tr key={p.id}>
                  <td>
                    <div className="strong">{p.name}</div>
                    <div className="muted xs">{p.code}</div>
                  </td>
                  <td className="r tab muted">{num(p.stock)}</td>
                  <td className="r tab" style={{ color: masuk ? "var(--ok)" : "var(--ink-faint)" }}>{masuk ? "+" + num(masuk) : "—"}</td>
                  <td className="r tab" style={{ color: keluar ? "var(--crit)" : "var(--ink-faint)" }}>{keluar ? "−" + num(keluar) : "—"}</td>
                  <td className="r tab strong" style={status === "neg" ? { color: "var(--crit)" } : {}}>{num(akhir)} <span className="unit">{p.unit}</span></td>
                  <td>{status === "neg" ? <span className="pill pill-crit">Tak cukup</span> : <Pill status={status} />}</td>
                  <td className="r muted">{days === null ? "—" : `≈ ${num(days)} hari`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <div className="sim-apply">
        <div className="muted xs">{valid.length} baris valid · perubahan baru tersimpan setelah diterapkan.</div>
        <button className="btn" disabled={valid.length === 0} onClick={() => setConfirm(true)}>
          <ArrowRight size={16} /> Terapkan ke stok
        </button>
      </div>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Terapkan simulasi?"
        footer={
          <>
            <button className="btn ghost" onClick={() => setConfirm(false)}>Batal</button>
            <button className="btn" onClick={() => { onApply(valid); reset(); setConfirm(false); }}><Check size={15} /> Ya, terapkan</button>
          </>
        }
      >
        <p className="confirm-text">
          {valid.length} pergerakan barang akan dicatat ke stok asli dan masuk ke log aktivitas.
          {anyNeg && <span className="warn-text"> Sebagian barang akan jadi minus karena stok tidak cukup.</span>}
        </p>
      </Modal>
    </div>
  );
}

/* ============================ Akuntansi (khusus manajer) ============================ */

function Accounting({ products, capital, expenses, salesLog, flash, onAddCapital, onUpdateCapital, onDeleteCapital, onAddExpense, onUpdateExpense, onDeleteExpense }) {
  const [form, setForm] = useState(null); // { kind:'capital'|'expense', entry }
  const [del, setDel] = useState(null);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [exporting, setExporting] = useState(false);

  const totalModal = capital.reduce((a, c) => a + c.amount, 0);

  // Agregat penjualan untuk periode terpilih (dihitung di server agar akurat & ringan)
  const [tot, setTot] = useState({ revenue: 0, cost: 0, qty: 0 });
  const [byProd, setByProd] = useState([]);
  const [loadingAcc, setLoadingAcc] = useState(hasSupabase);

  useEffect(() => {
    const [yy, mm] = month.split("-").map(Number);
    const fromISO = new Date(yy, mm - 1, 1).toISOString();
    const toISO = new Date(yy, mm, 1).toISOString();
    if (!hasSupabase) {
      const a = salesLog.reduce((x, s) => ({ revenue: x.revenue + s.revenue, cost: x.cost + s.cost, qty: x.qty + s.qty }), { revenue: 0, cost: 0, qty: 0 });
      const m = {};
      salesLog.forEach((s) => { if (!m[s.productId]) m[s.productId] = { productId: s.productId, qty: 0, revenue: 0, cost: 0 }; m[s.productId].qty += s.qty; m[s.productId].revenue += s.revenue; m[s.productId].cost += s.cost; });
      setTot(a); setByProd(Object.values(m)); setLoadingAcc(false);
      return;
    }
    let alive = true; setLoadingAcc(true);
    Promise.all([Sales.agg(fromISO, toISO), Sales.byProduct(fromISO, toISO)])
      .then(([a, bp]) => { if (!alive) return; setTot(a); setByProd(bp); })
      .catch((e) => { console.error("[acc]", e); flash && flash("Gagal memuat ringkasan akuntansi"); })
      .finally(() => { if (alive) setLoadingAcc(false); });
    return () => { alive = false; };
  }, [month, salesLog]);

  const revenue = tot.revenue;
  const cogs = tot.cost;
  const gross = revenue - cogs;

  // Biaya operasional periode terpilih + bulan sebelumnya (deteksi kebocoran)
  const prev = prevPeriod(month);
  const monthExpenses = expenses.filter((e) => (e.period || "") === month);
  const prevExpenses = expenses.filter((e) => (e.period || "") === prev);
  const opex = monthExpenses.reduce((a, e) => a + e.amount, 0);
  const prevOpex = prevExpenses.reduce((a, e) => a + e.amount, 0);
  const net = gross - opex;
  const invValue = products.reduce((a, p) => a + p.cost * p.stock, 0);
  const grossMargin = revenue > 0 ? Math.round((gross / revenue) * 100) : 0;
  const paybackMonths = net > 0 ? Math.ceil(totalModal / net) : null;
  const roiBulan = totalModal > 0 ? (net / totalModal) * 100 : 0;

  // opex per kategori (bulan terpilih)
  const opexCat = {};
  monthExpenses.forEach((e) => { opexCat[e.category] = (opexCat[e.category] || 0) + e.amount; });
  const prevOpexCat = {};
  prevExpenses.forEach((e) => { prevOpexCat[e.category] = (prevOpexCat[e.category] || 0) + e.amount; });
  // perbandingan per kategori: bulan lalu vs bulan ini
  const catCompare = [...new Set([...Object.keys(opexCat), ...Object.keys(prevOpexCat)])]
    .map((cat) => { const now = opexCat[cat] || 0; const was = prevOpexCat[cat] || 0; return { cat, now, was, delta: now - was, pct: was > 0 ? Math.round(((now - was) / was) * 100) : (now > 0 ? 100 : 0) }; })
    .sort((a, b) => b.delta - a.delta);

  // rasio biaya terhadap pendapatan (efisiensi) — naik = perlu dicek
  const opexRatio = revenue > 0 ? Math.round((opex / revenue) * 100) : 0;

  const copyLastMonth = () => {
    const have = new Set(monthExpenses.map((e) => (e.name + "|" + e.category).toLowerCase()));
    const src = prevExpenses.filter((e) => !have.has((e.name + "|" + e.category).toLowerCase()));
    if (src.length === 0) { flash && flash(`Tidak ada biaya baru untuk disalin dari ${periodLabel(prev)}`); return; }
    src.forEach((e) => onAddExpense({ name: e.name, amount: e.amount, category: e.category, period: month, date: periodLabel(month), items: e.items || [] }));
    flash && flash(`${src.length} biaya disalin dari ${periodLabel(prev)} — silakan sesuaikan nilainya`);
  };

  // Tren 6 bulan (pendapatan, biaya, laba bersih)
  const [trend, setTrend] = useState([]);
  useEffect(() => {
    const base = new Date();
    const periods = [];
    for (let i = 5; i >= 0; i--) { const d = new Date(base.getFullYear(), base.getMonth() - i, 1); periods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); }
    const opexByP = {};
    expenses.forEach((e) => { if (e.period) opexByP[e.period] = (opexByP[e.period] || 0) + e.amount; });
    const build = (sm) => periods.map((p) => { const s = sm[p] || { revenue: 0, cost: 0 }; const op = opexByP[p] || 0; const rev = Number(s.revenue || 0), cost = Number(s.cost || 0); return { period: p, label: periodLabel(p), pendapatan: rev, biaya: op, laba: rev - cost - op }; });
    if (!hasSupabase) {
      const sm = {};
      salesLog.forEach((s) => { if (s.ts) { const k = new Date(s.ts).toISOString().slice(0, 7); if (!sm[k]) sm[k] = { revenue: 0, cost: 0 }; sm[k].revenue += s.revenue; sm[k].cost += s.cost; } });
      setTrend(build(sm)); return;
    }
    let alive = true;
    const fromISO = new Date(base.getFullYear(), base.getMonth() - 5, 1).toISOString();
    Sales.monthly(fromISO).then((rows) => { if (!alive) return; setTrend(build(Object.fromEntries(rows.map((r) => [r.period, r])))); }).catch((e) => console.error("[trend]", e));
    return () => { alive = false; };
  }, [salesLog, expenses]);

  // analisa per barang (dari agregat server)
  const items = byProd.map((v) => {
    const p = products.find((x) => x.id === v.productId);
    const profit = v.revenue - v.cost;
    return { pid: v.productId, name: p?.name || "—", sku: p?.sku || "", unit: p?.unit || "", qty: v.qty, revenue: v.revenue, cost: v.cost, profit, margin: v.revenue > 0 ? Math.round((profit / v.revenue) * 100) : 0 };
  }).sort((a, b) => b.profit - a.profit);
  const topChart = items.slice(0, 7).map((i) => ({ name: i.sku || i.name.slice(0, 10), profit: i.profit }));

  const MONTHS_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const monthLabel = (ym) => { const [y, m] = ym.split("-").map(Number); return `${MONTHS_ID[(m || 1) - 1]} ${y}`; };

  const exportExcel = async () => {
    setExporting(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      wb.creator = "Conflux Coffee Club";
      wb.created = new Date();
      const period = monthLabel(month);
      const money = '"Rp"#,##0';
      const C = { dark: "FF121A16", surface: "FF1B2521", cream: "FFECE7DA", coral: "FFE2514D", teal: "FF6FAE92", line: "FF2C3A33", ok: "FF3E7D5A", rowA: "FFFFFFFF", rowB: "FFFAF4EA", ink: "FF24302B", hairline: "FFE7E0D2" };
      let imgId = null;
      try { imgId = wb.addImage({ base64: LOGO.split(",")[1], extension: "jpeg" }); } catch (e) {}

      const fill = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });

      // banner di atas tiap sheet; mengembalikan baris awal konten
      const banner = (ws, subtitle) => {
        ws.views = [{ showGridLines: false }];
        ws.mergeCells("A1:F2");
        const t = ws.getCell("A1");
        t.value = { richText: [
          { text: "CONFLUX ", font: { bold: true, size: 18, color: { argb: C.coral }, name: "Arial" } },
          { text: "COFFEE CLUB", font: { bold: true, size: 18, color: { argb: C.cream }, name: "Arial" } },
        ] };
        t.alignment = { vertical: "middle", horizontal: "left", indent: imgId != null ? 6 : 1 };
        ws.mergeCells("A3:F3");
        const s = ws.getCell("A3");
        s.value = `${subtitle}  ·  Periode: ${period}`;
        s.font = { italic: true, size: 11, color: { argb: C.cream }, name: "Arial" };
        s.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
        for (let r = 1; r <= 2; r++) for (let c = 1; c <= 6; c++) ws.getCell(r, c).fill = fill(C.dark);
        for (let c = 1; c <= 6; c++) ws.getCell(3, c).fill = fill(C.surface);
        ws.getRow(1).height = 20; ws.getRow(2).height = 20; ws.getRow(3).height = 18;
        if (imgId != null) ws.addImage(imgId, { tl: { col: 0.15, row: 0.2 }, ext: { width: 46, height: 46 } });
        return 5;
      };
      const sectionTitle = (ws, row, text) => {
        ws.mergeCells(row, 1, row, 6);
        const c = ws.getCell(row, 1);
        c.value = text; c.fill = fill(C.teal);
        c.font = { bold: true, size: 12, color: { argb: C.dark }, name: "Arial" };
        c.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
        ws.getRow(row).height = 22;
      };
      const headRow = (ws, row, cols) => {
        cols.forEach((cc, i) => {
          const c = ws.getCell(row, i + 1);
          c.value = cc.h;
          c.fill = fill(C.surface);
          c.font = { bold: true, size: 11, color: { argb: C.cream }, name: "Arial" };
          c.alignment = { vertical: "middle", horizontal: cc.a || "left" };
          c.border = { bottom: { style: "thin", color: { argb: C.coral } } };
        });
        ws.getRow(row).height = 20;
      };
      const dataRow = (ws, row, cols, idx) => {
        cols.forEach((cc, i) => {
          const c = ws.getCell(row, i + 1);
          c.value = cc.v;
          c.fill = fill(idx % 2 ? C.rowB : C.rowA);
          c.font = { size: 11, color: { argb: C.ink }, name: "Arial", bold: !!cc.b };
          c.alignment = { vertical: "middle", horizontal: cc.a || "left" };
          if (cc.fmt) c.numFmt = cc.fmt;
          c.border = { bottom: { style: "hair", color: { argb: C.hairline } } };
        });
      };
      const totalRow = (ws, row, label, value, span, argb) => {
        ws.mergeCells(row, 1, row, span);
        const l = ws.getCell(row, 1);
        l.value = label; l.fill = fill(argb || C.coral);
        l.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" }, name: "Arial" };
        l.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
        const v = ws.getCell(row, span + 1);
        v.value = value; v.fill = fill(argb || C.coral); v.numFmt = money;
        v.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" }, name: "Arial" };
        v.alignment = { vertical: "middle", horizontal: "right" };
        ws.getRow(row).height = 22;
      };

      // ---------- Sheet 1: Ringkasan / Laba Rugi ----------
      const s1 = wb.addWorksheet("Ringkasan");
      s1.columns = [{ width: 36 }, { width: 16 }, { width: 16 }, { width: 14 }, { width: 14 }, { width: 14 }];
      let r = banner(s1, "Laporan Akuntansi");
      sectionTitle(s1, r, "LAPORAN LABA RUGI"); r++;
      headRow(s1, r, [{ h: "Keterangan" }, { h: "Nilai", a: "right" }]); r++;
      let i = 0;
      dataRow(s1, r++, [{ v: "Pendapatan penjualan" }, { v: revenue, a: "right", fmt: money }], i++);
      dataRow(s1, r++, [{ v: "HPP (modal barang terjual)" }, { v: -cogs, a: "right", fmt: money }], i++);
      dataRow(s1, r++, [{ v: "Laba kotor", b: true }, { v: gross, a: "right", fmt: money, b: true }], i++);
      Object.entries(opexCat).forEach(([cat, amt]) => dataRow(s1, r++, [{ v: "Biaya — " + cat }, { v: -amt, a: "right", fmt: money }], i++));
      dataRow(s1, r++, [{ v: "Total biaya operasional", b: true }, { v: -opex, a: "right", fmt: money, b: true }], i++);
      totalRow(s1, r++, net >= 0 ? "LABA BERSIH (untung)" : "LABA BERSIH (rugi)", net, 1, net >= 0 ? C.ok : C.coral);
      r++;
      sectionTitle(s1, r, "RINGKASAN MODAL & BALIK MODAL"); r++;
      headRow(s1, r, [{ h: "Keterangan" }, { h: "Nilai", a: "right" }]); r++;
      i = 0;
      dataRow(s1, r++, [{ v: "Total modal tertanam" }, { v: totalModal, a: "right", fmt: money }], i++);
      dataRow(s1, r++, [{ v: "Nilai stok saat ini" }, { v: invValue, a: "right", fmt: money }], i++);
      dataRow(s1, r++, [{ v: "ROI per bulan" }, { v: roiBulan / 100, a: "right", fmt: "0.0%" }], i++);
      dataRow(s1, r++, [{ v: "Estimasi balik modal (bulan)" }, { v: paybackMonths || "—", a: "right" }], i++);

      // ---------- Sheet 2: Modal & Investasi ----------
      const s2 = wb.addWorksheet("Modal & Investasi");
      s2.columns = [{ width: 40 }, { width: 18 }, { width: 18 }, { width: 12 }, { width: 12 }, { width: 12 }];
      r = banner(s2, "Modal & Investasi");
      sectionTitle(s2, r, "MODAL PEMBANGUNAN & INVESTASI"); r++;
      headRow(s2, r, [{ h: "Item" }, { h: "Periode" }, { h: "Nilai", a: "right" }]); r++;
      capital.forEach((c, idx) => dataRow(s2, r++, [{ v: c.name }, { v: c.date }, { v: c.amount, a: "right", fmt: money }], idx));
      totalRow(s2, r++, "TOTAL MODAL", totalModal, 2, C.coral);

      // ---------- Sheet 3: Biaya Operasional ----------
      const s3 = wb.addWorksheet("Biaya Operasional");
      s3.columns = [{ width: 36 }, { width: 18 }, { width: 16 }, { width: 18 }, { width: 12 }, { width: 12 }];
      r = banner(s3, "Biaya Operasional");
      sectionTitle(s3, r, `BIAYA OPERASIONAL — ${period}`); r++;
      headRow(s3, r, [{ h: "Biaya" }, { h: "Kategori" }, { h: "Periode" }, { h: "Nilai", a: "right" }]); r++;
      monthExpenses.forEach((e, idx) => {
        dataRow(s3, r++, [{ v: e.name }, { v: e.category }, { v: e.period ? periodLabel(e.period) : e.date }, { v: e.amount, a: "right", fmt: money }], idx);
        (e.items || []).forEach((it) => dataRow(s3, r++, [{ v: "   • " + it.label }, { v: "" }, { v: "" }, { v: it.amount, a: "right", fmt: money }], idx));
      });
      totalRow(s3, r++, "TOTAL OPERASIONAL", opex, 3, C.coral);

      // ---------- Sheet 4: Penjualan per Barang ----------
      const s4 = wb.addWorksheet("Penjualan per Barang");
      s4.columns = [{ width: 34 }, { width: 14 }, { width: 12 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 10 }];
      r = banner(s4, "Analisa Penjualan per Barang");
      sectionTitle(s4, r, `PENJUALAN PER BARANG — ${period}`); r++;
      headRow(s4, r, [{ h: "Barang" }, { h: "SKU" }, { h: "Terjual", a: "right" }, { h: "Pendapatan", a: "right" }, { h: "HPP", a: "right" }, { h: "Laba", a: "right" }, { h: "Margin", a: "right" }]); r++;
      items.forEach((it, idx) => dataRow(s4, r++, [
        { v: it.name }, { v: it.sku }, { v: it.qty, a: "right" },
        { v: it.revenue, a: "right", fmt: money }, { v: it.cost, a: "right", fmt: money },
        { v: it.profit, a: "right", fmt: money }, { v: it.margin / 100, a: "right", fmt: "0%" },
      ], idx));
      // baris total penjualan
      const tQty = items.reduce((a, x) => a + x.qty, 0);
      const trow = s4.getRow(r);
      [["Total", "left"], ["", "left"], [tQty, "right"], [revenue, "right", money], [cogs, "right", money], [gross, "right", money], ["", "right"]].forEach((cell, i) => {
        const c = s4.getCell(r, i + 1);
        c.value = cell[0]; c.fill = fill(C.dark);
        c.font = { bold: true, size: 11, color: { argb: C.cream }, name: "Arial" };
        c.alignment = { vertical: "middle", horizontal: cell[1] };
        if (cell[2]) c.numFmt = cell[2];
      });
      trow.height = 20;

      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `Akuntansi-Conflux-${month}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      flash && flash(`Laporan Excel ${period} diunduh`);
    } catch (err) {
      flash && flash("Gagal membuat Excel — coba lagi");
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="stack">
      <div className="acc-toolbar">
        <div className="acc-period">
          <Calendar size={15} />
          <span className="muted">Periode</span>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          {loadingAcc && <span className="muted xs">· memuat…</span>}
        </div>
        <button className="btn" onClick={exportExcel} disabled={exporting}>
          <Download size={16} /> {exporting ? "Menyiapkan…" : "Export ke Excel"}
        </button>
      </div>

      <div className="acc-grid">
        <Stat icon={Hammer} label="Modal tertanam" value={rp(totalModal)} sub="pembangunan & investasi" />
        <Stat icon={ArrowUpRight} accent label="Pendapatan (bln)" value={rp(revenue)} sub={`${num(items.reduce((a, i) => a + i.qty, 0))} unit terjual`} />
        <Stat icon={Package} label="HPP (modal barang)" value={rp(cogs)} sub="cost of goods sold" />
        <Stat icon={TrendingUp} label="Laba kotor" value={rp(gross)} sub={`margin ${grossMargin}%`} />
        <Stat icon={Coins} label="Biaya operasional" value={rp(opex)} sub="per bulan" />
        <Stat icon={Wallet} label="Laba bersih (bln)" value={rp(net)}
          sub={<span className={net >= 0 ? "up" : "down"}>{net >= 0 ? "untung" : "rugi"}</span>} />
      </div>

      <div className="grid-2-1">
        <section className="card">
          <div className="card-head"><h2>Laporan Laba Rugi</h2><span className="muted">per bulan (estimasi)</span></div>
          <div className="pl">
            <div className="pl-row"><span>Pendapatan penjualan</span><b>{rp(revenue)}</b></div>
            <div className="pl-row sub"><span>− HPP (modal barang terjual)</span><span>{rp(cogs)}</span></div>
            <div className="pl-row total"><span>Laba kotor</span><b>{rp(gross)}</b></div>
            <div className="pl-sec">Biaya operasional</div>
            {Object.entries(opexCat).map(([cat, amt]) => (
              <div key={cat} className="pl-row sub"><span>− {cat}</span><span>{rp(amt)}</span></div>
            ))}
            <div className="pl-row sub"><span>Total biaya operasional</span><span>{rp(opex)}</span></div>
            <div className={`pl-net ${net >= 0 ? "pos" : "neg"}`}>
              <span>Laba bersih {net >= 0 ? "(untung)" : "(rugi)"}</span><b>{rp(net)}</b>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-head"><h2>Balik modal</h2></div>
          <div className="payback">
            <div className="pay-big">{paybackMonths ? `± ${num(paybackMonths)} bln` : "—"}</div>
            <div className="muted xs">estimasi waktu balik modal dengan laba saat ini</div>
            <div className="payback-bar"><div style={{ width: `${Math.min(100, Math.max(0, roiBulan))}%` }} /></div>
            <div className="payback-meta">
              <div><span className="muted xs">Total modal</span><b>{rp(totalModal)}</b></div>
              <div><span className="muted xs">ROI / bulan</span><b>{roiBulan.toFixed(1)}%</b></div>
              <div><span className="muted xs">Nilai stok kini</span><b>{rp(invValue)}</b></div>
            </div>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card-head"><h2>Analisa penjualan per barang</h2><span className="muted">7 teratas berdasarkan laba</span></div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={Math.max(180, topChart.length * 34)}>
            <BarChart data={topChart} layout="vertical" margin={{ top: 4, right: 16, left: 6, bottom: 4 }}>
              <CartesianGrid stroke="#2C3A33" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `${Math.round(v / 1000000)}jt`} tick={{ fill: "#6F8077", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={70} tick={{ fill: "#9DAEA3", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => rp(v)} contentStyle={{ borderRadius: 12, border: "1px solid #2C3A33", background: "#1B2521", color: "#ECE7DA", fontSize: 13 }} labelStyle={{ color: "#9DAEA3" }} cursor={{ fill: "rgba(226,81,77,.08)" }} />
              <Bar dataKey="profit" radius={[0, 5, 5, 0]}>
                {topChart.map((e, i) => <Cell key={i} fill="#E2514D" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card pad0" style={{ marginTop: 8 }}>
          <table className="tbl">
            <thead><tr><th>Barang</th><th className="r">Terjual</th><th className="r">Pendapatan</th><th className="r">HPP</th><th className="r">Laba</th><th className="r">Margin</th></tr></thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.pid}>
                  <td><div className="strong">{i.name}</div><div className="muted xs">{i.sku}</div></td>
                  <td className="r tab">{num(i.qty)} {i.unit}</td>
                  <td className="r tab">{rp(i.revenue)}</td>
                  <td className="r tab muted">{rp(i.cost)}</td>
                  <td className="r tab strong" style={{ color: "var(--ok)" }}>{rp(i.profit)}</td>
                  <td className="r tab">{i.margin}%</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={6} className="empty">Belum ada penjualan tercatat.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid-2-1">
        <section className="card">
          <div className="card-head"><h2>Tren 6 bulan</h2><span className="muted">pendapatan vs biaya</span></div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={trend} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
                <CartesianGrid stroke="#2C3A33" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#6F8077", fontSize: 11 }} />
                <YAxis tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(0)}jt` : v >= 1000 ? `${Math.round(v / 1000)}rb` : v)} tickLine={false} axisLine={false} tick={{ fill: "#6F8077", fontSize: 11 }} width={42} />
                <Tooltip formatter={(v, n) => [rp(v), n]} contentStyle={{ borderRadius: 12, border: "1px solid #2C3A33", background: "#1B2521", color: "#ECE7DA", fontFamily: "Inter", fontSize: 13 }} labelStyle={{ color: "#9DAEA3" }} />
                <Bar dataKey="pendapatan" name="Pendapatan" fill="#6FAE92" radius={[4, 4, 0, 0]} />
                <Bar dataKey="biaya" name="Biaya" fill="#E2514D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="trend-legend">
            <span><i className="dot teal" /> Pendapatan</span>
            <span><i className="dot coral" /> Biaya operasional</span>
            <span className="muted xs">Laba {periodLabel(month)}: <b style={{ color: net >= 0 ? "var(--ok)" : "var(--crit)" }}>{rp(net)}</b></span>
          </div>
        </section>

        <section className="card">
          <div className="card-head"><h2>Deteksi kebocoran</h2></div>
          <div className="leak-ratio">
            <div>
              <div className="muted xs">Rasio biaya / pendapatan</div>
              <div className={`leak-big ${opexRatio > 60 ? "bad" : opexRatio > 40 ? "warn" : "ok"}`}>{opexRatio}%</div>
            </div>
            <div className="muted xs" style={{ textAlign: "right" }}>{periodLabel(month)}<br />makin tinggi makin perlu dicek</div>
          </div>
          <div className="leak-list">
            <div className="leak-head"><span>Kategori</span><span className="r">{periodLabel(prev)}</span><span className="r">{periodLabel(month)}</span><span className="r">Selisih</span></div>
            {catCompare.length === 0 && <div className="empty">Belum ada biaya pada periode ini.</div>}
            {catCompare.map((c) => (
              <div key={c.cat} className="leak-row">
                <span className="leak-cat">{c.cat}</span>
                <span className="r muted tab">{rp(c.was)}</span>
                <span className="r tab">{rp(c.now)}</span>
                <span className={`r tab leak-delta ${c.delta > 0 ? "up" : c.delta < 0 ? "down" : ""}`}>
                  {c.delta > 0 ? "+" : ""}{rp(c.delta)}{c.was > 0 ? ` (${c.pct > 0 ? "+" : ""}${c.pct}%)` : ""}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid-2">
        <section className="card pad0">
          <div className="card-head" style={{ padding: "18px 18px 0" }}>
            <h2>Modal & Investasi</h2>
            <button className="btn sm" onClick={() => setForm({ kind: "capital", entry: null })}><Plus size={14} /> Tambah</button>
          </div>
          <table className="tbl">
            <thead><tr><th>Item</th><th className="r">Nilai</th><th className="r">Aksi</th></tr></thead>
            <tbody>
              {capital.map((c) => (
                <tr key={c.id}>
                  <td><div className="strong">{c.name}</div><div className="muted xs">{c.date}</div></td>
                  <td className="r tab">{rp(c.amount)}</td>
                  <td className="r"><div className="row-actions">
                    <button className="icon-btn xs" onClick={() => setForm({ kind: "capital", entry: c })}><Pencil size={14} /></button>
                    <button className="icon-btn xs danger-h" onClick={() => setDel({ kind: "capital", entry: c })}><Trash2 size={14} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><td className="strong">Total modal</td><td className="r tab strong">{rp(totalModal)}</td><td /></tr></tfoot>
          </table>
        </section>

        <section className="card pad0">
          <div className="card-head" style={{ padding: "18px 18px 0", flexWrap: "wrap", gap: 8 }}>
            <h2>Biaya Operasional · {periodLabel(month)}</h2>
            <div className="row-actions">
              <button className="btn ghost sm" onClick={copyLastMonth}><RefreshCcw size={14} /> Salin {periodLabel(prev)}</button>
              <button className="btn sm" onClick={() => setForm({ kind: "expense", entry: null })}><Plus size={14} /> Tambah</button>
            </div>
          </div>
          <table className="tbl">
            <thead><tr><th>Biaya</th><th>Kategori</th><th className="r">Nilai</th><th className="r">Aksi</th></tr></thead>
            <tbody>
              {monthExpenses.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div className="strong">{e.name}</div>
                    {(e.items && e.items.length > 0)
                      ? <div className="exp-items">{e.items.map((it, i) => <span key={i} className="exp-item">{it.label} · {rp(it.amount)}</span>)}</div>
                      : <div className="muted xs">{e.period ? periodLabel(e.period) : e.date}</div>}
                  </td>
                  <td><span className="cat-tag">{e.category}</span></td>
                  <td className="r tab">{rp(e.amount)}</td>
                  <td className="r"><div className="row-actions">
                    <button className="icon-btn xs" onClick={() => setForm({ kind: "expense", entry: e })}><Pencil size={14} /></button>
                    <button className="icon-btn xs danger-h" onClick={() => setDel({ kind: "expense", entry: e })}><Trash2 size={14} /></button>
                  </div></td>
                </tr>
              ))}
              {monthExpenses.length === 0 && <tr><td colSpan={4} className="empty">Belum ada biaya untuk {periodLabel(month)}. Klik “Salin {periodLabel(prev)}” atau “Tambah”.</td></tr>}
            </tbody>
            <tfoot><tr><td className="strong" colSpan={2}>Total operasional</td><td className="r tab strong">{rp(opex)}</td><td /></tr></tfoot>
          </table>
        </section>
      </div>

      {form && (
        <EntryForm
          kind={form.kind} entry={form.entry} defaultPeriod={month}
          onClose={() => setForm(null)}
          onSave={(data) => {
            if (form.kind === "capital") form.entry ? onUpdateCapital(form.entry.id, data) : onAddCapital(data);
            else form.entry ? onUpdateExpense(form.entry.id, data) : onAddExpense(data);
            setForm(null);
          }}
        />
      )}

      <Modal
        open={!!del}
        onClose={() => setDel(null)}
        title="Hapus entri?"
        footer={<>
          <button className="btn ghost" onClick={() => setDel(null)}>Batal</button>
          <button className="btn danger" onClick={() => {
            if (del.kind === "capital") onDeleteCapital(del.entry.id); else onDeleteExpense(del.entry.id);
            setDel(null);
          }}><Trash2 size={15} /> Hapus</button>
        </>}
      >
        {del && <p className="confirm-text">Hapus <b>{del.entry.name}</b> ({rp(del.entry.amount)})?</p>}
      </Modal>
    </div>
  );
}

function EntryForm({ kind, entry, defaultPeriod, onClose, onSave }) {
  const [f, setF] = useState(entry || {
    name: "", amount: 0,
    date: kind === "capital" ? "Modal awal" : "Bln ini",
    category: "Operasional",
    period: defaultPeriod || thisPeriod(),
    items: [],
  });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const items = f.items || [];
  const itemsTotal = items.reduce((a, it) => a + (Number(it.amount) || 0), 0);
  const useItems = kind === "expense" && items.length > 0;
  const total = useItems ? itemsTotal : Number(f.amount) || 0;

  const addItem = () => setF((s) => ({ ...s, items: [...(s.items || []), { label: "", amount: 0 }] }));
  const setItem = (i, k, v) => setF((s) => ({ ...s, items: s.items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)) }));
  const delItem = (i) => setF((s) => ({ ...s, items: s.items.filter((_, idx) => idx !== i) }));

  const valid = String(f.name).trim().length > 0 && total > 0 && (!useItems || items.every((it) => String(it.label).trim()));
  const save = () => {
    if (!valid) return;
    if (kind === "expense") {
      const period = f.period || thisPeriod();
      const cleanItems = items.map((it) => ({ label: String(it.label).trim(), amount: Number(it.amount) || 0 })).filter((it) => it.label);
      onSave({ name: String(f.name).trim(), amount: total, category: f.category || "Lain-lain", period, date: periodLabel(period), items: cleanItems });
    } else {
      onSave({ name: String(f.name).trim(), amount: Number(f.amount) || 0, date: String(f.date || "").trim() || "-" });
    }
  };
  return (
    <Modal
      open onClose={onClose} width={480}
      title={`${entry ? "Edit" : "Tambah"} ${kind === "capital" ? "Modal / Investasi" : "Biaya Operasional"}`}
      footer={<>
        <button className="btn ghost" onClick={onClose}>Batal</button>
        <button className="btn" disabled={!valid} onClick={save}><Check size={15} /> Simpan</button>
      </>}
    >
      <div className="form">
        <label className="fld"><span>Nama / keterangan</span>
          <input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder={kind === "capital" ? "cth. Mesin sangrai" : "cth. Gaji karyawan"} autoFocus /></label>
        {kind === "expense" && (
          <label className="fld"><span>Kategori</span>
            <select className="sim-select" value={f.category} onChange={(e) => set("category", e.target.value)}>
              {EXPENSE_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select></label>
        )}

        {kind === "expense" && (
          <div className="fld">
            <div className="rincian-head">
              <span>Rincian (opsional)</span>
              <button type="button" className="btn ghost xs" onClick={addItem}><Plus size={13} /> Tambah rincian</button>
            </div>
            {items.length === 0 && <div className="muted xs">Tanpa rincian, cukup isi total di bawah. Dengan rincian (mis. Karyawan 1, Karyawan 2), total dijumlah otomatis.</div>}
            {items.map((it, i) => (
              <div key={i} className="rincian-row">
                <input className="ri-label" value={it.label} onChange={(e) => setItem(i, "label", e.target.value)} placeholder={`cth. ${f.category === "Gaji" ? "Karyawan " + (i + 1) : f.category === "Utilitas" ? "Listrik" : "Item " + (i + 1)}`} />
                <input className="ri-amt" type="number" min="0" value={it.amount} onChange={(e) => setItem(i, "amount", Math.max(0, Number(e.target.value)))} placeholder="0" />
                <button type="button" className="icon-btn xs danger-h" onClick={() => delItem(i)}><X size={14} /></button>
              </div>
            ))}
          </div>
        )}

        <div className="grid2">
          <label className="fld"><span>{useItems ? "Total (otomatis)" : "Nilai (Rp)"}</span>
            {useItems
              ? <input value={rp(total)} disabled />
              : <input type="number" value={f.amount} onChange={(e) => set("amount", Math.max(0, Number(e.target.value)))} />}
          </label>
          {kind === "expense" ? (
            <label className="fld"><span>Bulan</span>
              <input type="month" value={f.period} onChange={(e) => set("period", e.target.value)} /></label>
          ) : (
            <label className="fld"><span>Tanggal / periode</span>
              <input value={f.date} onChange={(e) => set("date", e.target.value)} placeholder="cth. Modal awal" /></label>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* =============================== Styles =============================== */

function Style() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=Anton&display=swap');

      :root{
        --bg:#121A16; --surface:#1B2521; --surface-2:#24302A; --surface-3:#202B26;
        --ink:#ECE7DA; --ink-soft:#9DAEA3; --ink-faint:#6F8077;
        --line:rgba(236,231,218,.09); --line-soft:rgba(236,231,218,.05); --hair:rgba(236,231,218,.06);
        --accent:#E2514D; --accent-d:#C8453B; --accent-soft:rgba(226,81,77,.16);
        --teal:#6FAE92; --teal-d:#5B8F80; --teal-soft:rgba(111,174,146,.16);
        --gold:#E0A53C;
        --ok:#5FB585; --ok-bg:rgba(95,181,133,.16);
        --warn:#E0A53C; --warn-bg:rgba(224,165,60,.16);
        --crit:#E2514D; --crit-bg:rgba(226,81,77,.16);
        --r-lg:20px; --r:16px; --r-sm:11px; --r-xs:8px;
        --shadow:0 2px 4px rgba(0,0,0,.18), 0 8px 24px rgba(0,0,0,.26);
        --shadow-sm:0 1px 2px rgba(0,0,0,.2), 0 4px 12px rgba(0,0,0,.18);
        --shadow-lg:0 8px 24px rgba(0,0,0,.3), 0 24px 60px rgba(0,0,0,.4);
        --shadow-accent:0 6px 22px rgba(226,81,77,.28);
        --ease:cubic-bezier(.22,.61,.36,1);
      }
      input,select,textarea{color:var(--ink);background:transparent;font-family:inherit}
      input::placeholder{color:var(--ink-faint)}
      select option{background:#1B2521;color:#ECE7DA}
      select option:disabled{color:#6F8077}
      select option:checked{background:#2C3A33;color:#ECE7DA}
      *{box-sizing:border-box;margin:0;padding:0}
      .app{font-family:'Inter',system-ui,sans-serif;color:var(--ink);background:var(--bg);
        min-height:100vh;display:flex;-webkit-font-smoothing:antialiased}
      h1,h2,h3{font-family:'Space Grotesk',sans-serif;letter-spacing:-0.01em}
      .tab,.tabular{font-variant-numeric:tabular-nums}
      .muted{color:var(--ink-soft)} .xs{font-size:12px} .strong{font-weight:600}
      .r{text-align:right} .center{text-align:center}
      .up{color:var(--ok);display:inline-flex;align-items:center;gap:2px;font-weight:600}
      .down{color:var(--crit);display:inline-flex;align-items:center;gap:2px;font-weight:600}
      .accent{color:var(--accent)} .danger{color:var(--crit)} .warn-text{color:var(--warn);font-weight:600;font-size:12px}

      /* sidebar */
      .sidebar{width:248px;flex-shrink:0;position:sticky;top:0;height:100vh;display:flex;flex-direction:column;padding:18px 14px;
        border-right:1px solid var(--line);
        background:
          radial-gradient(135% 48% at 0% 0%, rgba(226,81,77,.10), transparent 56%),
          radial-gradient(120% 40% at 100% 100%, rgba(111,174,146,.07), transparent 60%),
          linear-gradient(180deg,#111A15 0%,#0C120F 100%)}
      .sidebar::after{content:"";position:absolute;top:0;right:0;width:1px;height:100%;pointer-events:none;
        background:linear-gradient(180deg,transparent,rgba(111,174,146,.28),rgba(226,81,77,.14),transparent)}
      .brand{display:flex;align-items:center;gap:11px;padding:6px 8px 18px;position:relative;margin-bottom:6px}
      .brand::after{content:"";position:absolute;left:6px;right:6px;bottom:0;height:1px;
        background:linear-gradient(90deg,rgba(226,81,77,.55),rgba(111,174,146,.3),transparent)}
      .brand-logo{width:44px;height:44px;border-radius:var(--r-sm);object-fit:cover;
        box-shadow:0 4px 16px rgba(0,0,0,.5),0 0 22px rgba(226,81,77,.16),0 0 0 1px rgba(236,231,218,.08)}
      .brand-name{font-family:'Anton',sans-serif;font-weight:400;font-size:17px;letter-spacing:.06em;
        line-height:1;text-transform:uppercase;
        background:linear-gradient(180deg,#FBF8F0,#CFC7B6);-webkit-background-clip:text;background-clip:text;color:transparent}
      .brand-sub{font-size:10.5px;color:var(--ink-faint);font-weight:500;letter-spacing:.14em;margin-top:4px;text-transform:uppercase}
      .nav{display:flex;flex-direction:column;gap:3px;flex:1}
      .nav-item{display:flex;align-items:center;gap:11px;padding:10px 11px;border:none;background:none;
        border-radius:var(--r-sm);font:inherit;font-size:14px;font-weight:500;color:rgba(236,231,218,.72);cursor:pointer;
        width:100%;text-align:left;transition:background .15s,color .15s,transform .12s var(--ease);position:relative}
      .nav-item:hover{background:rgba(236,231,218,.06);color:var(--ink)}
      .nav-item:active{transform:scale(.985)}
      .nav-item.active{background:linear-gradient(90deg,var(--accent-soft),rgba(226,81,77,.03));color:var(--accent);
        font-weight:600;box-shadow:inset 0 0 0 1px rgba(226,81,77,.16)}
      .nav-item.active::before{content:"";position:absolute;left:0;top:8px;bottom:8px;width:3px;border-radius:0 3px 3px 0;
        background:linear-gradient(180deg,var(--accent),var(--accent-d));box-shadow:0 0 12px rgba(226,81,77,.55)}
      .nav-item.active svg{filter:drop-shadow(0 0 6px rgba(226,81,77,.4))}
      .nav-badge{margin-left:auto;background:var(--accent);color:#fff;font-size:11px;font-weight:600;
        min-width:19px;height:19px;border-radius:10px;display:grid;place-items:center;padding:0 5px;box-shadow:var(--shadow-accent)}
      .nav-item.active .nav-badge{background:var(--accent)}
      .nav-lock{margin-left:auto;color:rgba(236,231,218,.45)}
      .sidebar-foot{padding-top:14px;margin-top:8px;position:relative}
      .sidebar-foot::before{content:"";position:absolute;top:0;left:2px;right:2px;height:1px;
        background:linear-gradient(90deg,transparent,rgba(236,231,218,.14),transparent)}
      .store-status{display:flex;align-items:center;gap:6px;color:var(--teal);font-weight:600;font-size:13px}
      .store-meta{font-size:11px;color:var(--ink-faint);margin-top:3px}

      /* main */
      .main{flex:1;min-width:0;display:flex;flex-direction:column}
      .topbar{height:64px;display:flex;align-items:center;gap:14px;padding:0 26px;
        border-bottom:1px solid var(--line);background:rgba(18,26,22,.85);backdrop-filter:blur(8px);
        position:sticky;top:0;z-index:20}
      .topbar h1{font-size:19px;font-weight:600}
      .topbar-right{margin-left:auto}
      .alert-chip{display:flex;align-items:center;gap:7px;background:var(--warn-bg);color:var(--warn);
        border:1px solid rgba(224,165,60,.32);padding:7px 13px;border-radius:999px;font:inherit;font-size:13px;
        font-weight:600;cursor:pointer}
      .content{padding:26px;max-width:1240px;width:100%}
      .stack{display:flex;flex-direction:column;gap:20px}

      /* cards */
      .card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:18px;box-shadow:var(--shadow-sm)}
      .card.pad0{padding:0;overflow:hidden}
      .card.pad0{overflow-x:auto}
      .row-actions{display:inline-flex;gap:6px;align-items:center;justify-content:flex-end}
      .card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
      .card-head h2{font-size:15px;font-weight:600}
      .link{background:none;border:none;color:var(--accent);font:inherit;font-size:13px;font-weight:600;
        cursor:pointer;display:inline-flex;align-items:center;gap:2px}
      .empty{color:var(--ink-faint);text-align:center;padding:26px 14px;font-size:14px}
      .empty.tall{padding:64px 14px} .empty.card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r)}

      /* grids */
      .grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
      .grid-2-1{display:grid;grid-template-columns:1.7fr 1fr;gap:20px;align-items:start}
      .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start}
      .acc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
      .pl{display:flex;flex-direction:column;gap:2px;font-size:13.5px}
      .pl-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0}
      .pl-row b{font-family:'Space Grotesk';font-weight:600}
      .pl-row.sub{color:var(--ink-soft);font-size:12.5px;padding:4px 0 4px 10px}
      .pl-row.total{border-top:1px solid var(--line);border-bottom:1px solid var(--line);font-weight:600}
      .pl-sec{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--ink-faint);margin-top:8px;padding-bottom:2px}
      .pl-row.grand{border-top:2px solid var(--line);margin-top:4px;font-weight:700;font-size:15px}
      .pl-row.grand.pos b{color:var(--ok)} .pl-row.grand.neg b{color:var(--crit)}
      .pl-net{display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding:12px 14px;border-radius:11px;font-weight:700;font-size:15px}
      .pl-net b{font-family:'Space Grotesk';font-size:17px}
      .pl-net.pos{background:var(--ok-bg);color:var(--ok)}
      .pl-net.neg{background:var(--crit-bg);color:var(--crit)}
      .acc-toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
      .acc-period{display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:7px 12px;color:var(--ink-soft)}
      .acc-period input{border:none;background:none;color:var(--ink);font:inherit;font-size:13.5px;outline:none}
      .acc-period input::-webkit-calendar-picker-indicator{filter:invert(.8)}
      .payback{display:flex;flex-direction:column;gap:8px;align-items:flex-start}
      .pay-big{font-family:'Space Grotesk';font-size:30px;font-weight:700;color:var(--accent);letter-spacing:-.02em}
      .payback-bar{width:100%;height:8px;border-radius:6px;background:var(--surface-2);overflow:hidden;margin-top:4px}
      .payback-bar>div{height:100%;background:var(--accent);border-radius:6px}
      .payback-meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;width:100%;margin-top:8px}
      .payback-meta b{font-family:'Space Grotesk';font-size:14px;display:block;margin-top:2px}
      .trend-legend{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-top:10px;font-size:12px;color:var(--ink-soft)}
      .trend-legend .dot{display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:5px;vertical-align:middle}
      .trend-legend .dot.teal{background:var(--teal)} .trend-legend .dot.coral{background:var(--accent)}
      .leak-ratio{display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--surface-2);border:1px solid var(--line);border-radius:var(--r-sm);padding:12px 14px;margin-bottom:12px}
      .leak-big{font-family:'Space Grotesk';font-weight:700;font-size:26px;line-height:1.1}
      .leak-big.ok{color:var(--ok)} .leak-big.warn{color:var(--gold)} .leak-big.bad{color:var(--crit)}
      .leak-list{display:flex;flex-direction:column}
      .leak-head,.leak-row{display:grid;grid-template-columns:1.4fr 1fr 1fr 1.3fr;gap:8px;align-items:center;padding:8px 2px}
      .leak-head{font-size:11px;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid var(--line)}
      .leak-row{border-bottom:1px solid var(--line-soft);font-size:13px}
      .leak-cat{font-weight:600}
      .leak-delta.up{color:var(--crit)} .leak-delta.down{color:var(--ok)}
      .leak-row .r,.leak-head .r{text-align:right}
      .rincian-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
      .rincian-head>span{font-size:13px;font-weight:500;color:var(--ink-soft)}
      .btn.xs{padding:5px 9px;font-size:12px;border-radius:8px}
      .rincian-row{display:flex;gap:7px;align-items:center;margin-top:6px}
      .rincian-row .ri-label{flex:1;border:1px solid var(--line);background:var(--surface-2);border-radius:var(--r-xs);padding:9px 10px;color:var(--ink);font:inherit;font-size:13.5px}
      .rincian-row .ri-amt{width:118px;border:1px solid var(--line);background:var(--surface-2);border-radius:var(--r-xs);padding:9px 10px;color:var(--ink);font:inherit;font-size:13.5px}
      .exp-items{display:flex;flex-direction:column;gap:1px;margin-top:3px}
      .exp-item{font-size:11.5px;color:var(--ink-faint)}
      .cat-tag{font-size:11px;font-weight:600;color:var(--teal);background:var(--teal-soft);padding:2px 8px;border-radius:6px}
      .tbl tfoot td{padding:12px 16px;border-top:1px solid var(--line);font-size:13.5px;background:var(--surface-2)}
      @media(max-width:980px){ .acc-grid{grid-template-columns:repeat(2,1fr)} .grid-2{grid-template-columns:1fr} }

      /* stat */
      .stat{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:16px;
        display:flex;gap:13px;align-items:flex-start;box-shadow:var(--shadow-sm);transition:transform .18s var(--ease),box-shadow .18s var(--ease)}
      .stat:hover{transform:translateY(-2px);box-shadow:var(--shadow)}
      .stat-ic{width:38px;height:38px;border-radius:var(--r-sm);background:var(--surface-2);color:var(--ink-soft);
        display:grid;place-items:center;flex-shrink:0}
      .stat-ic-accent{background:var(--accent-soft);color:var(--accent)}
      .stat-label{font-size:12.5px;color:var(--ink-soft);font-weight:500}
      .stat-value{font-family:'Space Grotesk';font-size:22px;font-weight:600;margin-top:1px;letter-spacing:-.02em}
      .stat-sub{font-size:12px;color:var(--ink-faint);margin-top:2px;display:flex;align-items:center;gap:3px}

      .chart-wrap{margin:0 -4px}

      /* alert list */
      .alert-list{display:flex;flex-direction:column}
      .alert-row{display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-top:1px solid var(--line-soft)}
      .alert-row:first-child{border-top:none}
      .alert-name{font-weight:600;font-size:14px} .alert-meta{font-size:12px;color:var(--ink-faint);margin-top:2px}

      /* pills */
      .pill{font-size:11.5px;font-weight:600;padding:3px 10px;border-radius:999px;white-space:nowrap}
      .pill-ok{background:var(--ok-bg);color:var(--ok)}
      .pill-warn{background:var(--warn-bg);color:var(--warn)}
      .pill-crit{background:var(--crit-bg);color:var(--crit)}

      /* table */
      .tbl{width:100%;border-collapse:collapse;font-size:13.5px}
      .tbl th{text-align:left;font-weight:500;color:var(--ink-faint);font-size:12px;padding:12px 16px;
        border-bottom:1px solid var(--line);text-transform:none}
      .tbl td{padding:12px 16px;border-bottom:1px solid var(--line-soft);vertical-align:middle}
      .tbl tbody tr:last-child td{border-bottom:none}
      .tbl tbody tr:hover{background:var(--surface-2)}
      .mv{display:inline-flex;align-items:center;gap:4px;font-weight:600;font-size:12.5px}
      .mv.in{color:var(--ok)} .mv.out{color:var(--crit)} .mv.waste{color:#f59e0b}
      .row-actions{display:inline-flex;gap:6px}
      .mini{display:inline-flex;align-items:center;gap:4px;border:1px solid var(--line);background:var(--surface);
        padding:5px 10px;border-radius:8px;font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;color:var(--ink-soft)}
      .mini:hover{background:var(--surface-2)}
      .mini.in:hover{border-color:var(--ok);color:var(--ok)}
      .mini.out:hover{border-color:var(--crit);color:var(--crit)}
      .mini.waste:hover{border-color:#f59e0b;color:#f59e0b}
      .expiry-tag{display:inline-flex;align-items:center;gap:3px;font-size:10px;color:var(--ink-faint);margin-top:2px}
      .expiry-tag.warn{color:#f59e0b;font-weight:600}
      .var-badge{background:var(--accent-soft);color:var(--accent);font-size:9px;font-weight:700;padding:1px 5px;border-radius:4px;letter-spacing:.04em}

      /* toolbar */
      .toolbar{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
      .search{display:flex;align-items:center;gap:9px;background:var(--surface);border:1px solid var(--line);
        border-radius:10px;padding:9px 13px;color:var(--ink-faint);flex:1;min-width:220px}
      .search input{border:none;background:none;outline:none;font:inherit;font-size:14px;color:var(--ink);width:100%}
      .search.big{padding:12px 15px} .search.big input{font-size:15px}
      .chips{display:flex;gap:6px;flex-wrap:wrap}
      .chip{border:1px solid var(--line);background:var(--surface);padding:7px 13px;border-radius:999px;
        font:inherit;font-size:13px;font-weight:500;color:var(--ink-soft);cursor:pointer}
      .chip.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}

      /* buttons */
      .btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;background:var(--accent);color:#fff;
        border:none;border-radius:var(--r-sm);padding:10px 16px;font:inherit;font-size:14px;font-weight:600;cursor:pointer;
        transition:transform .1s var(--ease),background .15s,box-shadow .2s;box-shadow:var(--shadow-accent)}
      .btn:hover{background:var(--accent-d)}
      .btn:active:not(:disabled){transform:scale(.97)}
      .btn:disabled{opacity:.4;cursor:not-allowed;box-shadow:none}
      .btn.ghost{background:var(--surface);color:var(--ink-soft);border:1px solid var(--line);box-shadow:none}
      .btn.ghost:hover{background:var(--surface-2);color:var(--ink)}
      .btn.full{width:100%} .btn.sm{padding:7px 12px;font-size:13px} .btn.pay{padding:13px;font-size:15px;margin-top:4px}
      .icon-btn{background:none;border:none;color:var(--ink-soft);cursor:pointer;padding:7px;border-radius:8px;display:grid;place-items:center}
      .icon-btn:hover{background:var(--surface-2)} .icon-btn.xs{padding:5px}

      /* modal */
      .modal-scrim{position:fixed;inset:0;background:rgba(8,12,10,.55);backdrop-filter:blur(6px);
        display:grid;place-items:center;z-index:50;padding:20px;animation:scrim-in .2s ease}
      @keyframes scrim-in{from{opacity:0}to{opacity:1}}
      .modal{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-lg);width:100%;
        box-shadow:var(--shadow-lg);overflow:hidden;animation:modal-in .26s var(--ease)}
      @keyframes modal-in{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
      .modal-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid var(--line-soft)}
      .modal-head h3{font-size:16px;font-weight:600}
      .modal-body{padding:20px} .modal-foot{padding:16px 20px;border-top:1px solid var(--line-soft);display:flex;gap:10px;justify-content:flex-end}
      .form{display:flex;flex-direction:column;gap:16px}
      .form-prod{display:flex;flex-direction:column;gap:2px;background:var(--surface-2);padding:12px 14px;border-radius:10px}
      .form-prod span:first-child{font-weight:600}
      .seg{display:flex;background:var(--surface-2);border-radius:10px;padding:3px}
      .seg button{flex:1;border:none;background:none;padding:9px;border-radius:8px;font:inherit;font-weight:600;
        font-size:13.5px;color:var(--ink-soft);cursor:pointer}
      .seg button.on{background:var(--surface);color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.08)}
      .seg.seg-3 button{font-size:12.5px;padding:9px 4px}
      .bt-box{display:flex;flex-direction:column;gap:10px;background:var(--surface-2);border:1px solid var(--line);border-radius:var(--r-sm);padding:13px}
      .bt-status{display:flex;align-items:center;gap:9px;font-size:13.5px}
      .bt-dot{width:9px;height:9px;border-radius:50%;background:var(--ink-faint);flex-shrink:0}
      .bt-dot.on{background:var(--ok);box-shadow:0 0 8px var(--ok)}
      .bt-actions{display:flex;gap:9px;flex-wrap:wrap}
      .fld{display:flex;flex-direction:column;gap:7px}
      .fld>span{font-size:13px;font-weight:500;color:var(--ink-soft)}
      .fld input{border:1px solid var(--line);border-radius:9px;padding:10px 12px;font:inherit;font-size:14px;outline:none}
      .fld input:focus{border-color:var(--accent)}
      .fld .hint{font-size:11.5px;color:var(--ink-faint)}
      .grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
      .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
      .form-section{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.04em;
        border-top:1px solid var(--line-soft);padding-top:14px;margin-top:2px}
      .rop-preview{background:var(--accent-soft);color:var(--accent);border-radius:10px;padding:11px 13px;font-size:13px}
      .rop-preview b{font-family:'Space Grotesk';font-size:15px}
      .variant-editor{background:var(--surface-2);border:1px solid var(--line);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:8px}
      .variant-row{display:flex;gap:6px;align-items:center}
      .var-key-inp{width:52px;flex-shrink:0;text-align:center;font-weight:700;text-transform:uppercase}
      .confirm-text{font-size:14px;color:var(--ink-soft);line-height:1.55}
      .btn.danger{background:var(--crit)} .btn.danger:hover{background:#a23a30}

      /* ID badge */
      .idcode{font-family:'Space Grotesk';font-weight:600;font-size:12px;letter-spacing:.02em;color:var(--accent);
        background:var(--accent-soft);padding:3px 8px;border-radius:7px;white-space:nowrap}
      .idcode.lg{font-size:15px;padding:5px 11px;align-self:flex-start}
      .act-div{width:1px;height:18px;background:var(--line);margin:0 2px}
      .icon-btn.danger-h:hover{background:var(--crit-bg);color:var(--crit)}
      .icon-btn.locked{color:var(--ink-faint);background:var(--surface-2)}
      .icon-btn.locked:hover{color:var(--warn);background:var(--warn-bg)}

      .lock-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:var(--surface);
        padding:8px 13px;border-radius:999px;font:inherit;font-size:13px;font-weight:600;color:var(--ink-soft);cursor:pointer}
      .lock-chip:hover{border-color:var(--warn);color:var(--warn)}
      .lock-chip.on{background:var(--accent-soft);border-color:transparent;color:var(--accent)}
      .lock-chip.on:hover{color:var(--accent);opacity:.85}

      .pin-box{display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center}
      .pin-ic{width:50px;height:50px;border-radius:14px;background:var(--warn-bg);color:var(--warn);display:grid;place-items:center}
      .pin-input{width:100%;border:1px solid var(--line);border-radius:10px;padding:12px 14px;font:inherit;font-size:18px;
        text-align:center;letter-spacing:.3em;outline:none}
      .pin-input:focus{border-color:var(--accent)}
      .pin-input.err{border-color:var(--crit);background:var(--crit-bg)}
      .pin-err{color:var(--crit);font-size:13px;font-weight:600;margin-top:-4px}
      .pin-hint{font-size:12px;color:var(--ink-faint)} .pin-hint b{color:var(--ink-soft)}

      .nav-lock{margin-left:auto;color:rgba(236,231,218,.45)}
      .unit{font-size:11px;font-weight:500;color:var(--ink-faint)}

      .sim-intro{display:flex;gap:15px;align-items:center;background:linear-gradient(180deg,var(--accent-soft),var(--surface))}
      .sim-head-actions{display:flex;gap:8px;flex-wrap:wrap}
      .sim-rows{display:flex;flex-direction:column;gap:8px}
      .sim-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
      .sim-select{flex:1;min-width:180px;border:1px solid var(--line);border-radius:9px;padding:9px 11px;font:inherit;
        font-size:13.5px;background:var(--surface);color:var(--ink);outline:none;cursor:pointer}
      .sim-select:focus{border-color:var(--accent)}
      .sim-seg{width:170px;flex-shrink:0}
      .sim-seg button{padding:7px 6px;font-size:12.5px}
      .sim-unit{min-width:30px}
      .sim-line-val{font-family:'Space Grotesk';font-weight:600;font-size:13.5px;min-width:96px;text-align:right;margin-left:auto}
      .sim-line-val.neg{color:var(--crit)} .sim-line-val.pos{color:var(--ok)}
      .sim-add{margin-top:14px;width:100%}
      .sim-apply{display:flex;align-items:center;justify-content:space-between;gap:14px;
        background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:14px 18px;flex-wrap:wrap}
      @media(max-width:760px){
        .sim-line-val{margin-left:0}
      }
      .stepper{display:flex;align-items:center;border:1px solid var(--line);border-radius:9px;overflow:hidden;width:fit-content}
      .stepper button{border:none;background:var(--surface-2);width:38px;height:38px;display:grid;place-items:center;cursor:pointer;color:var(--ink-soft)}
      .stepper button:hover{background:var(--line)}
      .stepper input{border:none;width:64px;text-align:center;font:inherit;font-size:15px;font-weight:600;outline:none}
      .stepper.sm button{width:28px;height:28px} .stepper.sm span{min-width:26px;text-align:center;font-weight:600;font-size:13.5px}

      /* POS */
      .pos{display:grid;grid-template-columns:1fr 360px;gap:20px;height:calc(100vh - 64px - 52px)}
      .pos-products{display:flex;flex-direction:column;gap:14px;min-height:0}
      .pos-products .search{flex:0 0 auto}
      .pos-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(158px,1fr));gap:12px;overflow-y:auto;padding-right:4px;align-content:start;flex:1 1 auto;min-height:0}
      .pos-empty{grid-column:1/-1;align-self:start}
      .cat-tabs{display:flex;gap:8px;overflow-x:auto;padding-bottom:2px;flex:0 0 auto;scrollbar-width:none}
      .cat-tabs::-webkit-scrollbar{display:none}
      .cat-tab{display:inline-flex;align-items:center;gap:7px;white-space:nowrap;border:1px solid var(--line);
        background:var(--surface);color:var(--ink-soft);border-radius:999px;padding:8px 15px;font:inherit;font-size:13px;
        font-weight:500;cursor:pointer;transition:all .18s var(--ease)}
      .cat-tab:hover{color:var(--ink);border-color:rgba(236,231,218,.18)}
      .cat-tab.on{background:var(--ink);color:var(--bg);border-color:var(--ink);box-shadow:var(--shadow-sm);font-weight:600}
      .cat-tab svg{opacity:.85}
      .pos-card{position:relative;text-align:left;background:var(--surface);border:1px solid var(--line);
        border-radius:var(--r-sm);padding:14px;display:flex;flex-direction:column;gap:7px;transition:transform .18s var(--ease),box-shadow .18s var(--ease),border-color .18s var(--ease)}
      .pos-card:hover{transform:translateY(-2px);box-shadow:var(--shadow);border-color:rgba(236,231,218,.16)}
      .pos-card.out{opacity:.5}
      .pos-card-wm{position:absolute;right:8px;top:34px;color:var(--ink);opacity:.045;pointer-events:none;z-index:0}
      .pos-card-top{display:flex;justify-content:space-between;align-items:center;gap:6px;position:relative;z-index:1}
      .pos-cat{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;color:var(--ink-faint);font-weight:600;text-transform:uppercase;letter-spacing:.04em;min-width:0}
      .pos-cat svg{color:var(--teal);flex-shrink:0}
      .pos-cat{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .pos-stock{font-size:11px;font-weight:600;color:var(--ok);background:var(--ok-bg);padding:2px 7px;border-radius:var(--r-xs);flex-shrink:0;white-space:nowrap}
      .pos-stock.zero{color:var(--crit);background:var(--crit-bg)}
      .pos-name{font-weight:600;font-size:13.5px;line-height:1.3;flex:1;position:relative;z-index:1;
        display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:35px}
      .pos-price{font-family:'Space Grotesk';font-weight:600;color:var(--accent);font-size:15px;position:relative;z-index:1}
      .pos-price .per{font-family:'Inter';font-weight:500;font-size:11px;color:var(--ink-faint)}
      .pos-price .strike{font-family:'Inter';font-weight:500;font-size:11px;color:var(--ink-faint);text-decoration:line-through;margin-right:5px}
      .promo-tag{display:inline-block;margin-left:6px;font-size:9px;font-weight:700;letter-spacing:.04em;color:#fff;
        background:var(--crit);padding:1px 5px;border-radius:5px;vertical-align:middle}
      .promo-mini{font-size:10.5px;font-weight:600;color:var(--crit);margin-top:2px}
      .per{font-family:'Inter';font-weight:500;font-size:11px;color:var(--ink-faint)}
      .pos-add{display:flex;gap:6px;margin-top:4px;position:relative;z-index:1}
      .add-btn{flex:1;min-height:40px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;
        border:1px solid var(--line);background:var(--surface-2);border-radius:var(--r-xs);padding:7px 4px;font:inherit;
        font-size:12px;font-weight:600;color:var(--accent);cursor:pointer;transition:transform .1s var(--ease),background .15s,border-color .15s}
      .add-btn:hover:not(:disabled){background:var(--accent-soft);border-color:var(--accent)}
      .add-btn:active:not(:disabled){transform:scale(.94);background:var(--accent);color:#fff;border-color:var(--accent)}
      .add-btn:active:not(:disabled) .add-sub{color:rgba(255,255,255,.85)}
      .add-btn:disabled{opacity:.4;cursor:not-allowed}
      .add-btn.carton{color:var(--ink)}
      .add-btn.variant{flex-direction:row;gap:6px;justify-content:space-between;padding:0 10px}
      .add-btn.variant .var-key{font-weight:700;font-size:13px;min-width:18px}
      .add-btn .add-sub{font-family:'Space Grotesk';font-weight:600;font-size:10.5px;color:var(--ink-faint)}
      .add-btn.variant:hover:not(:disabled) .add-sub,.add-btn.variant:active:not(:disabled) .add-sub{color:rgba(255,255,255,.85)}

      .inline-fld{display:flex;gap:8px;align-items:center}
      .inline-fld input{flex:1}
      .promo-box{border:1px solid var(--line);border-radius:11px;padding:13px;display:flex;flex-direction:column;gap:12px;background:var(--surface-2)}
      .promo-row{display:flex;align-items:center;gap:10px}
      .promo-label{font-size:13.5px;font-weight:600}
      .promo-preview{background:var(--crit-bg);color:var(--crit);border-radius:8px;padding:9px 12px;font-size:13px}
      .promo-preview b{font-family:'Space Grotesk'}
      .switch{width:42px;height:24px;border-radius:999px;border:none;background:var(--line);position:relative;cursor:pointer;transition:.18s;flex-shrink:0}
      .switch.on{background:var(--accent)}
      .switch .knob{position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.18s;box-shadow:0 1px 3px rgba(0,0,0,.25)}
      .switch.on .knob{left:21px}

      .cart{background:linear-gradient(180deg,var(--surface-3),var(--surface));border:1px solid var(--line);
        border-radius:var(--r);display:flex;flex-direction:column;min-height:0;box-shadow:var(--shadow)}
      .cart-head{display:flex;align-items:center;gap:9px;padding:16px 18px;border-bottom:1px solid var(--line-soft);font-weight:600;font-size:15px}
      .cart-count{margin-left:auto;background:var(--accent-soft);color:var(--accent);font-size:12px;font-weight:700;padding:2px 9px;border-radius:999px;animation:pulse-badge .4s var(--ease)}
      @keyframes pulse-badge{0%{transform:scale(1)}40%{transform:scale(1.35);background:var(--accent);color:#fff}100%{transform:scale(1)}}
      .cart-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;padding:48px 18px;color:var(--teal)}
      .cart-empty svg{color:var(--teal);opacity:.5;margin-bottom:6px}
      .cart-empty .steam{animation:steam 2.6s ease-in-out infinite}
      .cart-empty svg .steam:nth-child(2){animation-delay:.5s}
      @keyframes steam{0%,100%{opacity:.15;transform:translateY(2px)}50%{opacity:.55;transform:translateY(-2px)}}
      .cart-empty-title{font-weight:600;font-size:14px;color:var(--ink-soft)}
      .cart-empty-sub{font-size:12.5px;color:var(--ink-faint);max-width:200px;line-height:1.4}
      .cart-lines{flex:1;overflow-y:auto;padding:8px 14px}
      .cart-line{display:grid;grid-template-columns:1fr auto auto auto;gap:8px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line-soft)}
      .cart-line:last-child{border-bottom:none}
      .cart-line-name{font-weight:600;font-size:13px;line-height:1.2}
      .cart-line-total{font-weight:600;font-size:13px;min-width:64px;text-align:right}
      .cart-foot{border-top:1px solid var(--line);padding:16px 18px;display:flex;flex-direction:column;gap:10px}
      .cart-total{display:flex;justify-content:space-between;align-items:baseline}
      .cart-total .big{font-family:'Space Grotesk';font-size:22px;font-weight:700;color:var(--ink);display:inline-block;animation:total-bump .28s var(--ease)}
      @keyframes total-bump{0%{transform:scale(1)}35%{transform:scale(1.12);color:var(--accent)}100%{transform:scale(1)}}
      .pay-row{display:flex;align-items:center;gap:9px;border:1px solid var(--line);border-radius:var(--r-sm);padding:10px 12px;color:var(--ink-faint);transition:border-color .15s}
      .pay-row:focus-within{border-color:var(--accent)}
      .pay-input{border:none;outline:none;font:inherit;font-size:15px;width:100%;font-weight:600;color:var(--ink)}
      .quick-pay{display:flex;gap:6px}
      .quick-pay button{flex:1;border:1px solid var(--line);background:var(--surface-2);border-radius:var(--r-xs);padding:8px;
        font:inherit;font-size:12px;font-weight:600;color:var(--ink-soft);cursor:pointer;transition:transform .09s var(--ease),background .15s,color .15s,border-color .15s}
      .quick-pay button:hover{border-color:var(--accent);color:var(--accent)}
      .quick-pay button:active{transform:scale(.93);background:var(--accent);color:#fff;border-color:var(--accent)}
      .change{display:flex;justify-content:space-between;font-weight:600;font-size:14px;color:var(--ok);padding:2px}
      .change.neg{color:var(--crit)}
      .pay-methods{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
      .pay-method{display:flex;flex-direction:column;align-items:center;gap:4px;border:1px solid var(--line);
        background:var(--surface-2);border-radius:var(--r-sm);padding:9px 4px;font:inherit;font-size:11.5px;font-weight:600;
        color:var(--ink-soft);cursor:pointer;transition:transform .1s var(--ease),background .15s,color .15s,border-color .15s}
      .pay-method:hover{border-color:var(--accent);color:var(--accent)}
      .pay-method:active{transform:scale(.95)}
      .pay-method.on{background:var(--accent-soft);border-color:var(--accent);color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)}
      .pay-note{font-size:12.5px;color:var(--ink-soft);background:var(--surface-2);border-radius:9px;padding:9px 12px;line-height:1.45}
      .pay-note b{color:var(--ink)}
      .pay-note.warn{background:var(--warn-bg);color:var(--warn)} .pay-note.warn b{color:var(--warn)}
      .btn.pay.hutang{background:var(--warn)} .btn.pay.hutang:hover{background:#946312}

      /* orders */
      .order-tabs{display:flex;gap:6px;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:5px;width:fit-content}
      .order-tab{border:none;background:none;padding:8px 16px;border-radius:8px;font:inherit;font-size:13.5px;font-weight:600;
        color:var(--ink-soft);cursor:pointer;display:flex;align-items:center;gap:7px}
      .order-tab.on{background:var(--ink);color:var(--bg)}
      .tab-count{background:rgba(255,255,255,.25);font-size:11px;padding:1px 7px;border-radius:999px}
      .order-tab:not(.on) .tab-count{background:var(--surface-2);color:var(--ink-soft)}
      .order-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:14px}
      .order-card{display:flex;flex-direction:column;gap:13px}
      .order-card-head{display:flex;justify-content:space-between;align-items:flex-start}
      .order-id{font-family:'Space Grotesk';font-weight:700;font-size:15px}
      .channel{display:inline-flex;align-items:center;gap:4px;font-size:11.5px;font-weight:600;color:var(--ink-soft);
        background:var(--surface-2);padding:4px 9px;border-radius:999px}
      .order-items{display:flex;flex-direction:column;gap:7px;padding:12px 0;border-top:1px solid var(--line-soft);border-bottom:1px solid var(--line-soft)}
      .order-item{display:flex;justify-content:space-between;font-size:13px}
      .order-card-foot{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
      .order-total{font-weight:600;font-size:13.5px}
      .order-actions{display:flex;align-items:center;gap:7px}
      .btn.wa{background:#25D366;color:#0a2a16;box-shadow:none;text-decoration:none}
      .btn.wa:hover{background:#1eb456}
      .order-pick{display:flex;gap:8px;align-items:center}
      .order-pick .sim-select{flex:1}
      .order-pick .qty-in{width:74px;border:1px solid var(--line);background:var(--surface-2);border-radius:var(--r-xs);padding:9px 10px;color:var(--ink);font:inherit}
      .order-line-list{display:flex;flex-direction:column;gap:2px;margin-top:4px}
      .order-line{display:flex;align-items:center;gap:10px;padding:7px 0;font-size:13.5px;border-bottom:1px solid var(--line-soft)}
      .order-line span:first-child{flex:1}
      .order-line.grand{border-bottom:none;border-top:2px solid var(--line);margin-top:2px;padding-top:9px;font-weight:700}
      .order-line.grand b{font-family:'Space Grotesk'}
      .done-tag{display:inline-flex;align-items:center;gap:4px;color:var(--ok);font-weight:600;font-size:13px}

      /* ===== Riwayat Penjualan ===== */
      .chart-empty{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:0 24px;
        color:var(--ink-faint);font-size:13px;z-index:1;pointer-events:none}
      .chart-wrap{position:relative}
      .cashier-chips{display:flex;flex-wrap:wrap;gap:10px}
      .cashier-chip{display:flex;align-items:center;gap:10px;background:var(--surface-2);border:1px solid var(--line);
        border-radius:var(--r-sm);padding:9px 14px 9px 9px}
      .cc-ava{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:14px;
        color:var(--bg);background:linear-gradient(145deg,var(--teal),var(--accent))}
      .cc-name{font-weight:600;font-size:13.5px}
      .cc-val{font-family:'Space Grotesk';font-weight:600;color:var(--accent);font-size:13px}
      .txn-list{display:flex;flex-direction:column;gap:7px}
      .txn{border:1px solid var(--line);border-radius:var(--r-sm);background:var(--surface-2);overflow:hidden}
      .txn.open{border-color:rgba(236,231,218,.18)}
      .txn-head{width:100%;display:grid;grid-template-columns:auto 1fr auto auto auto auto;gap:12px;align-items:center;
        background:none;border:none;font:inherit;color:var(--ink);padding:11px 14px;cursor:pointer;text-align:left}
      .txn-head:hover{background:var(--surface-3)}
      .txn-time{font-size:12.5px;color:var(--ink-soft);white-space:nowrap}
      .txn-cashier{display:inline-flex;align-items:center;gap:4px;font-size:12.5px;font-weight:600;color:var(--ink);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .txn-cashier svg{color:var(--teal);flex-shrink:0}
      .txn-method{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;color:var(--ink-soft);
        background:var(--surface);border:1px solid var(--line);padding:2px 8px;border-radius:999px;white-space:nowrap}
      .txn-method.m-cash{color:var(--ok);background:var(--ok-bg);border-color:transparent}
      .txn-method.m-order{color:var(--teal);background:var(--teal-soft);border-color:transparent}
      .txn-qty{font-size:12px;color:var(--ink-faint);white-space:nowrap}
      .txn-total{font-family:'Space Grotesk';font-weight:700;font-size:14px;white-space:nowrap}
      .txn-caret{color:var(--ink-faint);transition:transform .18s var(--ease)}
      .txn.open .txn-caret{transform:rotate(90deg)}
      .txn-items{padding:4px 14px 12px 14px;display:flex;flex-direction:column;gap:5px;border-top:1px dashed var(--line-soft)}
      .txn-item{display:flex;justify-content:space-between;gap:12px;font-size:13px;color:var(--ink-soft);padding-top:6px}
      .txn-item .tab,.shift-row .tab{font-family:'Space Grotesk';font-weight:600;color:var(--ink)}
      @media (max-width:640px){
        .txn-head{grid-template-columns:1fr auto auto;grid-auto-rows:auto;gap:6px 10px}
        .txn-time{grid-column:1/-1}
        .txn-qty{display:none}
      }

      /* ===== Ringkasan Shift ===== */
      .shift{display:flex;flex-direction:column;gap:14px}
      .shift-head{display:flex;align-items:center;gap:12px}
      .shift-ava{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:18px;
        color:var(--bg);background:linear-gradient(145deg,var(--teal),var(--accent))}
      .shift-name{font-weight:700;font-size:16px}
      .shift-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
      .shift-stat{background:var(--surface-2);border:1px solid var(--line);border-radius:var(--r-sm);padding:11px;text-align:center}
      .shift-stat span{display:block;font-size:11px;color:var(--ink-faint);margin-bottom:3px}
      .shift-stat b{font-family:'Space Grotesk';font-size:16px}
      .shift-methods{display:flex;flex-direction:column;gap:5px;background:var(--surface-2);border-radius:var(--r-sm);padding:10px 14px}
      .shift-row{display:flex;justify-content:space-between;font-size:13.5px;color:var(--ink-soft)}
      .shift-row.strong{font-weight:700;color:var(--ink)}
      .shift-recon{display:flex;flex-direction:column;gap:10px;border-top:1px solid var(--line);padding-top:12px}
      .shift-diff{text-align:center;font-weight:700;padding:9px;border-radius:var(--r-sm);font-size:14px}
      .shift-diff.ok{color:var(--ok);background:var(--ok-bg)}
      .shift-diff.over{color:var(--gold);background:var(--warn-bg)}
      .shift-diff.short{color:var(--crit);background:var(--crit-bg)}

      .auto-tag{font-size:9.5px;font-weight:700;letter-spacing:.04em;color:var(--teal);background:var(--teal-soft);
        padding:1px 6px;border-radius:5px;margin-left:5px;vertical-align:middle}
      .debt-card{display:flex;flex-direction:column;gap:12px}
      .debt-head{display:flex;justify-content:space-between;align-items:flex-start}
      .debt-id{font-family:'Space Grotesk';font-weight:700;font-size:15px}
      .debt-identity{display:flex;flex-direction:column;gap:5px;padding:11px 12px;background:var(--surface-2);border-radius:10px}
      .debt-line{display:flex;align-items:center;gap:7px;font-size:13px;color:var(--ink-soft)}
      .debt-line b{color:var(--ink);font-weight:600}
      .debt-items{display:flex;flex-direction:column;gap:7px;padding:11px 0;border-top:1px solid var(--line-soft);border-bottom:1px solid var(--line-soft)}
      .debt-item{display:flex;justify-content:space-between;gap:10px;font-size:12.5px}
      .debt-foot{display:flex;justify-content:space-between;align-items:center}
      .debt-total{display:flex;flex-direction:column}
      .debt-total .tab{font-family:'Space Grotesk';font-weight:700;font-size:16px}

      /* restock */
      .formula-card{display:flex;gap:15px;align-items:flex-start;background:linear-gradient(180deg,var(--accent-soft),var(--surface))}
      .formula-ic{width:42px;height:42px;border-radius:11px;background:var(--accent);color:#fff;display:grid;place-items:center;flex-shrink:0}
      .formula-title{font-family:'Space Grotesk';font-weight:700;font-size:15px;margin-bottom:7px}
      .formula-line{font-size:13.5px;color:var(--ink-soft);margin-bottom:4px}
      .formula-line b{color:var(--accent)}
      .restock-list{display:flex;flex-direction:column;gap:14px}
      .restock-card{display:grid;grid-template-columns:1fr 230px;gap:20px;align-items:center}
      .restock-main{display:flex;flex-direction:column;gap:13px}
      .restock-name-row{display:flex;justify-content:space-between;align-items:flex-start}
      .rop-meta{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
      .rop-cell{display:flex;flex-direction:column;gap:3px;background:var(--surface-2);padding:10px 12px;border-radius:10px}
      .rop-cell b{font-family:'Space Grotesk';font-size:18px;font-weight:600}
      .rop-cell.highlight{background:var(--accent-soft)}
      .detail-toggle{align-self:flex-start;background:none;border:none;color:var(--ink-soft);font:inherit;font-size:12.5px;
        font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;padding:0}
      .detail-toggle:hover{color:var(--accent)}
      .calc{background:var(--surface-2);border-radius:10px;padding:13px 15px;display:flex;flex-direction:column;gap:8px;font-size:13px}
      .calc>div{display:flex;justify-content:space-between} .calc span{color:var(--ink-soft)} .calc b{font-weight:600}
      .calc hr{border:none;border-top:1px solid var(--line);margin:2px 0}
      .calc-final{font-weight:700} .calc-final b{color:var(--accent)}
      .restock-action{display:flex;flex-direction:column;gap:8px}

      /* toast */
      .toast{position:fixed;top:20px;right:20px;background:rgba(27,37,33,.78);color:var(--ink);
        padding:12px 18px;border-radius:999px;font-size:13.5px;font-weight:500;display:flex;align-items:center;gap:9px;
        border:1px solid var(--line);box-shadow:var(--shadow-lg);z-index:80;
        backdrop-filter:blur(14px) saturate(1.2);-webkit-backdrop-filter:blur(14px) saturate(1.2);
        animation:toast-in .4s var(--ease)}
      .toast svg{color:var(--teal)}
      @keyframes toast-in{from{opacity:0;transform:translateY(-12px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
      @media(max-width:560px){ .toast{top:14px;right:14px;left:14px;justify-content:center} }

      /* ===== Nota / receipt ===== */
      .debt-actions{display:flex;align-items:center;gap:8px}
      .receipt-preview{display:flex;justify-content:center;background:#cfcabb;padding:14px;border-radius:10px}
      .receipt{font-family:'Courier New',ui-monospace,monospace;color:#111;background:#fff;width:256px;
        padding:14px 14px;font-size:12px;line-height:1.5;box-shadow:0 4px 14px rgba(0,0,0,.25)}
      .receipt.w80{width:320px}
      .receipt .r-center{text-align:center}
      .receipt .r-logo{display:block;width:58px;height:58px;object-fit:cover;border-radius:10px;margin:0 auto 8px;
        filter:grayscale(1) contrast(1.15)}
      .receipt .r-store{font-weight:700;font-size:15px;letter-spacing:.04em;margin-bottom:2px;text-transform:uppercase}
      .receipt .r-tag{font-size:10px;font-style:italic;color:#444;margin-bottom:1px}
      .receipt .r-small{font-size:11px}
      .receipt .r-title{font-weight:700;letter-spacing:.1em;margin-bottom:5px}
      .receipt .r-line{border-top:1px dashed #555;margin:7px 0}
      .receipt .r-dash{border-top:1px dashed #777;margin:8px 0}
      .receipt .r-meta{margin:1px 0}
      .receipt .r-row{display:flex;justify-content:space-between;gap:10px}
      .receipt .r-item{margin-bottom:4px}
      .receipt .r-item-name{font-size:12px;font-weight:600}
      .receipt .r-total{font-weight:700;font-size:14px;margin:2px 0;border-top:2px solid #111;border-bottom:2px solid #111;padding:3px 0}
      .receipt .r-stamp{border:1.5px solid #111;text-align:center;font-weight:700;padding:3px;margin:7px 0;letter-spacing:.05em}
      .receipt .r-foot{font-size:11px;margin-top:6px}
      .receipt .r-brand{font-size:11px;font-weight:700;letter-spacing:.14em;margin-top:4px}

      #receipt-print{position:fixed;left:-99999px;top:0;background:#fff}
      @media print{
        html,body{background:#fff !important;margin:0 !important;padding:0 !important}
        .app > *{display:none !important}
        #receipt-print{display:block !important;position:static !important;left:0 !important;width:100% !important}
        #receipt-print .receipt{width:100% !important;box-shadow:none !important;padding:0 3mm !important;font-size:11px;color:#000}
        #receipt-print .r-logo{width:52px !important;height:52px !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      }

      /* ===== Login peran ===== */
      .gate{position:relative;overflow:hidden;min-height:100vh;display:grid;place-items:center;padding:24px;font-family:'Inter',sans-serif;
        background:
          radial-gradient(820px 560px at 16% 6%, rgba(226,81,77,.12), transparent 55%),
          radial-gradient(860px 600px at 86% 10%, rgba(111,174,146,.12), transparent 55%),
          radial-gradient(900px 640px at 78% 104%, rgba(224,165,60,.08), transparent 55%),
          radial-gradient(760px 520px at 8% 96%, rgba(111,174,146,.07), transparent 55%),
          linear-gradient(158deg,#0E1512 0%,#101813 46%,#090E0B 100%)}
      .gate-bg{position:absolute;inset:0;overflow:hidden;pointer-events:none}
      .gate-spot{position:absolute;top:50%;left:50%;width:720px;height:720px;transform:translate(-50%,-50%);
        background:radial-gradient(circle,rgba(111,174,146,.12),rgba(226,81,77,.06) 42%,transparent 68%);animation:spot-pulse 9s ease-in-out infinite}
      @keyframes spot-pulse{0%,100%{opacity:.65;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.07)}}
      .gate-orb{position:absolute;border-radius:50%;filter:blur(70px)}
      .orb-a{width:420px;height:420px;background:radial-gradient(circle,rgba(226,81,77,.36),transparent 70%);top:-100px;left:-80px;animation:orb-a 15s ease-in-out infinite}
      .orb-b{width:360px;height:360px;background:radial-gradient(circle,rgba(111,174,146,.32),transparent 70%);bottom:-90px;right:-70px;animation:orb-b 18s ease-in-out infinite}
      .orb-c{width:300px;height:300px;background:radial-gradient(circle,rgba(224,165,60,.18),transparent 70%);top:40%;left:56%;animation:orb-c 21s ease-in-out infinite}
      .orb-d{width:340px;height:340px;background:radial-gradient(circle,rgba(111,174,146,.20),transparent 70%);top:8%;right:24%;animation:orb-c 24s ease-in-out infinite reverse}
      @keyframes orb-a{0%,100%{transform:translate(0,0)}50%{transform:translate(50px,38px)}}
      @keyframes orb-b{0%,100%{transform:translate(0,0)}50%{transform:translate(-38px,-30px)}}
      @keyframes orb-c{0%,100%{transform:translate(0,0)}50%{transform:translate(-28px,24px)}}
      .gate-steam{position:absolute;top:6%;left:50%;transform:translateX(-50%);width:80px;height:120px;color:var(--teal);opacity:.10}
      .gate-steam path{animation:steam-sway 4.5s ease-in-out infinite;transform-origin:center;transform-box:fill-box}
      .gate-steam path:nth-child(2){animation-delay:.7s}
      .gate-steam path:nth-child(3){animation-delay:1.4s}
      @keyframes steam-sway{0%,100%{opacity:.25;transform:translateY(6px)}50%{opacity:.9;transform:translateY(-6px)}}
      .gate-bean{position:absolute;color:var(--ink)}
      .bean-1{--rot:14deg;width:200px;top:12%;right:9%;opacity:.055;transform:rotate(var(--rot));animation:bean-float 22s ease-in-out infinite}
      .bean-2{--rot:-22deg;width:120px;bottom:14%;left:7%;opacity:.05;transform:rotate(var(--rot));animation:bean-float 27s ease-in-out infinite reverse}
      .bean-3{--rot:40deg;width:84px;top:62%;right:21%;opacity:.04;transform:rotate(var(--rot));animation:bean-float 19s ease-in-out infinite}
      .bean-4{--rot:-8deg;width:150px;top:16%;left:13%;opacity:.04;transform:rotate(var(--rot));animation:bean-float 30s ease-in-out infinite reverse}
      .bean-5{width:64px;bottom:22%;right:38%;transform:rotate(25deg);opacity:.045}
      .bean-6{--rot:-34deg;width:104px;bottom:8%;right:12%;opacity:.035;transform:rotate(var(--rot));animation:bean-float 24s ease-in-out infinite}
      @keyframes bean-float{0%,100%{transform:translateY(0) rotate(var(--rot,0deg))}50%{transform:translateY(-16px) rotate(var(--rot,0deg))}}
      .gate-grain{position:absolute;inset:0;opacity:.04;background-image:radial-gradient(rgba(236,231,218,.6) 1px,transparent 1px);background-size:4px 4px}
      .gate-vignette{position:absolute;inset:0;background:radial-gradient(125% 125% at 50% 48%,transparent 52%,rgba(5,9,7,.62) 100%)}
      .gate-card{position:relative;z-index:1;width:100%;max-width:430px;border-radius:24px;padding:34px 28px;text-align:center;
        background:linear-gradient(180deg,rgba(31,42,36,.92),rgba(20,28,24,.92));
        border:1px solid rgba(236,231,218,.10);box-shadow:var(--shadow-lg),inset 0 1px 0 rgba(236,231,218,.06);
        backdrop-filter:blur(18px) saturate(1.15);-webkit-backdrop-filter:blur(18px) saturate(1.15);animation:gate-in .5s var(--ease)}
      @keyframes gate-in{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
      .gate-logo-ring{width:92px;height:92px;margin:0 auto;border-radius:24px;display:grid;place-items:center;
        background:linear-gradient(145deg,rgba(226,81,77,.25),rgba(111,174,146,.18));box-shadow:0 0 30px rgba(226,81,77,.22)}
      .gate-logo{width:78px;height:78px;border-radius:18px;object-fit:cover;box-shadow:0 6px 20px rgba(0,0,0,.5)}
      .gate-title{font-family:'Anton',sans-serif;font-size:32px;letter-spacing:.1em;margin-top:16px;line-height:1;
        background:linear-gradient(180deg,#FBF8F0,#CFC7B6);-webkit-background-clip:text;background-clip:text;color:transparent}
      .gate-sub{font-size:12px;color:var(--ink-faint);letter-spacing:.18em;text-transform:uppercase;margin-top:6px;margin-bottom:26px}
      .gate-roles{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .gate-role{position:relative;display:flex;flex-direction:column;align-items:center;gap:5px;text-align:center;
        background:rgba(36,48,42,.6);border:1px solid var(--line);border-radius:var(--r-sm);padding:22px 14px;cursor:pointer;transition:.18s var(--ease);font:inherit;color:var(--ink)}
      .gate-role:hover{border-color:var(--accent);transform:translateY(-3px);box-shadow:0 10px 26px rgba(0,0,0,.34)}
      .gate-role:active{transform:translateY(-1px) scale(.99)}
      .gate-role b{font-size:15px;font-weight:600}
      .gate-role span{font-size:11.5px;color:var(--ink-soft);line-height:1.35}
      .gate-ic{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;margin-bottom:4px}
      .gate-ic.cashier{background:var(--teal-soft);color:var(--teal)}
      .gate-ic.manager{background:var(--accent-soft);color:var(--accent)}
      .gate-lock{position:absolute;top:9px;right:9px;display:inline-flex;align-items:center;gap:3px;font-size:9.5px;font-weight:700;
        color:var(--accent);background:var(--accent-soft);padding:2px 6px;border-radius:6px}
      .gate-pin{display:flex;flex-direction:column;gap:12px;align-items:center}
      .gate-pin-label{display:flex;align-items:center;gap:7px;font-weight:600;font-size:14px;color:var(--ink)}
      .gate-pin .pin-input{width:100%}
      .gate-pin-actions{display:flex;gap:10px;width:100%}
      .gate-pin-actions .btn{flex:1}
      .gate-foot{margin-top:24px;font-size:11px;color:var(--ink-faint);font-style:italic;letter-spacing:.02em}

      /* role footer */
      .role-badge{display:flex;align-items:center;gap:7px;font-weight:600;font-size:13px;padding:8px 11px;border-radius:9px;margin-bottom:8px}
      .role-badge.manager{background:var(--accent-soft);color:var(--accent)}
      .role-badge.cashier{background:var(--teal-soft);color:var(--teal)}
      .logout-btn{display:flex;align-items:center;gap:8px;width:100%;border:1px solid var(--line);background:none;
        color:rgba(236,231,218,.75);padding:9px 11px;border-radius:9px;font:inherit;font-size:13px;font-weight:500;cursor:pointer;transition:.15s}
      .logout-btn:hover{background:rgba(236,231,218,.07);color:var(--ink)}
      @media(max-width:420px){ .gate-roles{grid-template-columns:1fr} }

      /* responsive */
      .only-mobile{display:none}
      .drawer-scrim{display:none}
      @media(max-width:980px){
        .grid-4{grid-template-columns:repeat(2,1fr)}
        .grid-2-1{grid-template-columns:1fr}
        .pos{grid-template-columns:1fr;height:auto}
        .restock-card{grid-template-columns:1fr}
        .rop-meta{grid-template-columns:repeat(2,1fr)}
      }
      @media(max-width:760px){
        .sidebar{position:fixed;left:0;top:0;z-index:60;transform:translateX(-100%);transition:.25s;box-shadow:0 0 40px rgba(0,0,0,.2)}
        .sidebar.open{transform:translateX(0)}
        .drawer-scrim{display:block;position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:55}
        .only-mobile{display:grid}
        .content{padding:18px}
        .grid-4{grid-template-columns:1fr}
        .alert-chip span{display:none}
      }
    `}</style>
  );
}

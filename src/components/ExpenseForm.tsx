import React, { useState } from "react";
import { Sparkles, Bot, PenTool, CheckCircle, RefreshCw, Smartphone, DollarSign, Calendar, Tag, CreditCard, ChevronRight, Check } from "lucide-react";
import { Expense, CategorySpec } from "../types";

const formatRupiah = (value: string): string => {
  const clean = value.replace(/\D/g, "");
  if (!clean) return "";
  return Number(clean).toLocaleString("id-ID");
};

const parseRupiah = (value: string): number => {
  const clean = value.replace(/\D/g, "");
  return clean ? parseInt(clean, 10) : 0;
};

interface ExpenseFormProps {
  onAddExpense: (expense: Omit<Expense, "id">) => void;
  onSetViewTab: (tab: string) => void;
  categories: Record<string, CategorySpec>;
  onAddCategory: (name: string, color: string, icon?: string) => void;
  onUpdateCategory: (oldName: string, newName: string, newColor: string) => void;
  onDeleteCategory: (catName: string) => void;
  onResetCategoriesToDefault: () => void;
  triggerConfirm?: (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    isDangerous?: boolean,
    confirmText?: string,
    cancelText?: string
  ) => void;
}

export function ExpenseForm({ 
  onAddExpense, 
  onSetViewTab, 
  categories, 
  onAddCategory, 
  onUpdateCategory,
  onDeleteCategory, 
  onResetCategoriesToDefault,
  triggerConfirm
}: ExpenseFormProps) {
  // Manual form input states
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(() => {
    const keys = Object.keys(categories);
    return keys.includes("Detergen & Sabun") ? "Detergen & Sabun" : (keys[0] || "Lain-lain");
  });
  const [date, setDate] = useState(() => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  });
  const [paymentMethod, setPaymentMethod] = useState("Tunai");
  const [notes, setNotes] = useState("");

  // Add category inline states
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#10b981");

  // Edit category inline states
  const [editingCatName, setEditingCatName] = useState<string | null>(null);
  const [editNewName, setEditNewName] = useState("");
  const [editNewColor, setEditNewColor] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseRupiah(amount);
    if (!title.trim() || parsedAmount <= 0) {
      alert("Harap isi deskripsi pengeluaran dan jumlah rupiah dengan benar!");
      return;
    }

    onAddExpense({
      title: title.trim(),
      amount: parsedAmount,
      category,
      date,
      paymentMethod,
      notes: notes.trim() || undefined
    });

    // Reset Form fields
    setTitle("");
    setAmount("");
    setNotes("");
    
    // Redirect to Logs tab
    onSetViewTab("history");
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 bg-[#0A0A0B] text-[#F4F4F5] animate-fade-in">
      
      {/* 2. Structured Form */}
      <div className="bg-[#121214] border border-[#27272A] rounded-none p-4 shadow-xs">
        <div className="flex items-center gap-1.5 mb-4 border-b border-[#27272A] pb-2">
          <PenTool className="w-4 h-4 text-emerald-500" />
          <h3 className="text-[10px] font-black text-white uppercase tracking-widest">
            FORMULIR PENGELUARAN LAUNDRY
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Item Name / Description */}
          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">
              BARANG / DESKRIPSI PENGELUARAN *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-zinc-500 font-bold text-xs">✍</span>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="misal: Beli Detergen Liquid Sakura 10L"
                className="w-full text-xs bg-zinc-950 border border-zinc-850 rounded-none py-2.5 pl-8 pr-3 font-semibold text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Amount and Calendar in two column grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">
                JUMLAH UANG (RUPIAH) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-zinc-500 font-black text-xs">Rp</span>
                <input
                  type="text"
                  required
                  value={amount}
                  onChange={(e) => setAmount(formatRupiah(e.target.value))}
                  placeholder="50.000"
                  className="w-full text-xs bg-zinc-950 border border-zinc-855 rounded-none py-2.5 pl-9 pr-3 font-semibold text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">
                TANGGAL PENGELUARAN *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-zinc-500 pointer-events-none">
                  <Calendar className="w-3.5 h-3.5" />
                </span>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      (e.currentTarget as any).showPicker?.();
                    } catch (err) {}
                  }}
                  className="w-full text-xs bg-zinc-950 border border-zinc-855 rounded-none py-2 pl-9 pr-2.5 font-semibold text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                />
              </div>
              <div className="flex gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    setDate(`${d.getFullYear()}-${month}-${day}`);
                  }}
                  className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 border transition-all cursor-pointer ${
                    date === (() => {
                      const d = new Date();
                      const month = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      return `${d.getFullYear()}-${month}-${day}`;
                    })()
                      ? "bg-emerald-950/40 text-emerald-400 border-emerald-800"
                      : "bg-zinc-950 text-zinc-500 border-zinc-850 hover:text-zinc-300 hover:border-zinc-800"
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 1);
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    setDate(`${d.getFullYear()}-${month}-${day}`);
                  }}
                  className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 border transition-all cursor-pointer ${
                    date === (() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 1);
                      const month = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      return `${d.getFullYear()}-${month}-${day}`;
                    })()
                      ? "bg-emerald-950/40 text-emerald-400 border-emerald-800"
                      : "bg-zinc-950 text-zinc-500 border-zinc-850 hover:text-zinc-300 hover:border-zinc-800"
                  }`}
                >
                  Kemarin
                </button>
              </div>
            </div>
          </div>

          {/* Category Dropdown & Payment Method in two column grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  KATEGORI OPERASIONAL
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCat(!showAddCat)}
                  className="text-[9px] text-emerald-400 hover:text-emerald-300 font-black uppercase tracking-wider cursor-pointer select-none active:scale-95"
                >
                  {showAddCat ? "[ TUTUP ]" : "[ + KATEGORI ]"}
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-zinc-500">
                  <Tag className="w-3.5 h-3.5" />
                </span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs bg-zinc-950 border border-zinc-855 rounded-none py-2 pl-9 pr-2.5 font-semibold text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {Object.keys(categories).map((catName) => (
                    <option key={catName} value={catName}>
                      {categories[catName]?.name || catName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">
                METODE PEMBAYARAN
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-zinc-500">
                  <CreditCard className="w-3.5 h-3.5" />
                </span>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full text-xs bg-zinc-950 border border-zinc-855 rounded-none py-2 pl-9 pr-2.5 font-semibold text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Tunai">💰 Tunai</option>
                  <option value="Transfer Bank">🏦 Transfer Bank</option>
                  <option value="E-Wallet">📱 E-Wallet</option>
                </select>
              </div>
            </div>
          </div>

          {/* Add category form inline */}
          {showAddCat && (
            <div className="bg-[#18181B] border border-zinc-800 p-3 space-y-3 animate-fade-in relative text-left">
              <span className="block text-[9px] font-black text-emerald-500 uppercase tracking-widest border-b border-zinc-800 pb-1">
                ➕ TAMBAH & KELOLA JALUR KATEGORI
              </span>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Nama Kategori (misal: Sewa Ruko)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full text-xs bg-zinc-950 border border-zinc-850 rounded-none py-2 px-2.5 font-semibold text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
                
                {/* Warna Pilihan */}
                <div className="space-y-1">
                  <span className="block text-[8.5px] font-black text-zinc-500 uppercase tracking-wide">Pilih Warna Aksen:</span>
                  <div className="flex gap-2">
                    {[
                      { hex: "#10b981", label: "Hijau" },
                      { hex: "#fbbf24", label: "Kuning" },
                      { hex: "#f43f5e", label: "Merah" },
                      { hex: "#0ea5e9", label: "Biru" },
                      { hex: "#8b5cf6", label: "Ungu" },
                      { hex: "#d946ef", label: "Pink" }
                    ].map((palette) => (
                      <button
                        key={palette.hex}
                        type="button"
                        onClick={() => setNewCatColor(palette.hex)}
                        className={`w-5 h-5 rounded-none border transition-all ${
                          newCatColor === palette.hex ? "border-white scale-110" : "border-transparent opacity-60"
                        }`}
                        style={{ backgroundColor: palette.hex }}
                        title={palette.label}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const clean = newCatName.trim();
                    if (!clean) {
                      alert("Tuliskan nama kategori terlebih dahulu!");
                      return;
                    }
                    onAddCategory(clean, newCatColor);
                    setCategory(clean); // otomatis pilih kategori yang baru dibuat
                    setNewCatName("");
                    setShowAddCat(false);
                  }}
                  className="w-full py-1.5 bg-zinc-950 border border-emerald-800 hover:border-emerald-500 text-emerald-400 hover:text-white transition-all rounded-none text-[9.5px] font-black uppercase tracking-wider"
                >
                  Simpan Kategori Baru
                </button>
              </div>

              {/* List of current categories to delete */}
              <div className="border-t border-zinc-800 pt-2.5 mt-2.5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="block text-[8.5px] font-black text-zinc-500 uppercase tracking-wide">
                    Daftar Kategori Aktif ({Object.keys(categories).length}):
                  </span>
                  <button
                    type="button"
                    onClick={onResetCategoriesToDefault}
                    className="text-[8px] text-zinc-400 hover:text-white underline cursor-pointer"
                  >
                    Atur Ulang ke Default
                  </button>
                </div>
                
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {Object.keys(categories).length === 0 ? (
                    <p className="text-[9px] text-zinc-650 italic">Tidak ada kategori. Tambahkan di atas!</p>
                  ) : (
                    Object.entries(categories).map(([catName, spec]) => {
                      if (editingCatName === catName) {
                        return (
                          <div 
                            key={catName}
                            className="bg-zinc-900 border border-emerald-800 p-2 space-y-2.5 animate-fade-in"
                          >
                            <div>
                              <span className="block text-[8px] text-emerald-400 font-black uppercase mb-1">Nama Kategori:</span>
                              <input
                                type="text"
                                value={editNewName}
                                onChange={(e) => setEditNewName(e.target.value)}
                                className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-none py-1.5 px-2 font-semibold text-white focus:outline-none focus:border-emerald-500 font-sans"
                              />
                            </div>
                            
                            <div className="flex flex-col gap-2 xs:flex-row xs:justify-between xs:items-center">
                              {/* Color swatch */}
                              <div>
                                <span className="block text-[8px] text-zinc-500 font-black uppercase mb-1">Aksen:</span>
                                <div className="flex gap-1.5">
                                  {[
                                    "#10b981",
                                    "#fbbf24",
                                    "#f43f5e",
                                    "#0ea5e9",
                                    "#8b5cf6",
                                    "#d946ef",
                                    "#a1a1aa"
                                  ].map((c) => (
                                    <button
                                      key={c}
                                      type="button"
                                      onClick={() => setEditNewColor(c)}
                                      className={`w-3.5 h-3.5 rounded-none border transition-all ${
                                        editNewColor === c ? "border-white scale-110" : "border-transparent opacity-65"
                                      }`}
                                      style={{ backgroundColor: c }}
                                    />
                                  ))}
                                </div>
                              </div>

                              <div className="flex gap-1 justify-end mt-1 xs:mt-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const cleanNew = editNewName.trim();
                                    if (!cleanNew) return;
                                    onUpdateCategory(editingCatName, cleanNew, editNewColor);
                                    setCategory((curr) => curr === editingCatName ? cleanNew : curr);
                                    setEditingCatName(null);
                                  }}
                                  className="px-2 py-1.5 bg-emerald-500 text-black text-[9px] font-black uppercase tracking-wider rounded-none cursor-pointer duration-100 active:scale-95 border border-emerald-600"
                                >
                                  Simpan
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCatName(null)}
                                  className="px-2 py-1.5 bg-zinc-950 text-zinc-400 text-[9px] font-black uppercase tracking-wider rounded-none cursor-pointer duration-100 hover:text-white border border-zinc-805"
                                >
                                  Batal
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={catName} 
                          className="flex items-center justify-between text-xs bg-zinc-950 border border-zinc-900 p-1.5 pl-2 rounded-none"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span 
                              className="w-2.5 h-2.5 inline-block shrink-0 rounded-none" 
                              style={{ backgroundColor: spec.color }} 
                            />
                            <span className="font-semibold text-zinc-300 text-[11px] truncate">{catName}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            {/* Edit button */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCatName(catName);
                                setEditNewName(catName);
                                setEditNewColor(spec.color);
                              }}
                              className="px-1.5 py-0.5 text-emerald-400 hover:text-emerald-200 text-[9px] font-black uppercase tracking-wider bg-emerald-950/20 hover:bg-emerald-950/50 border border-zinc-900 cursor-pointer"
                              title="Ubah Kategori"
                            >
                              Ubah
                            </button>

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => {
                                const performDelete = () => {
                                  onDeleteCategory(catName);
                                  // If current chosen category is deleted, fallback to remaining or first
                                  setCategory((current) => {
                                    if (current === catName) {
                                      const remainingKeys = Object.keys(categories).filter(k => k !== catName);
                                      return remainingKeys[0] || "";
                                    }
                                    return current;
                                  });
                                };

                                if (triggerConfirm) {
                                  triggerConfirm(
                                    "HAPUS KATEGORI",
                                    `Apakah Anda yakin ingin menghapus kategori "${catName}"?`,
                                    performDelete,
                                    true,
                                    "HAPUS",
                                    "BATAL"
                                  );
                                } else {
                                  performDelete();
                                }
                              }}
                              className="px-1.5 py-0.5 text-rose-500 hover:text-rose-300 text-[9px] font-black uppercase tracking-wider bg-rose-950/10 hover:bg-rose-950/40 border border-zinc-900 cursor-pointer"
                              title="Hapus kategori ini"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Optional notes */}
          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">
              CATATAN EKSTRA (OPSIONAL)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="misal: merk SoKlin liquid, beli di agen kelontong jaya"
              className="w-full text-xs bg-zinc-950 border border-zinc-855 rounded-none py-2.5 px-3 font-semibold text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Action Trigger Submit */}
          <button
            type="submit"
            className="w-full mt-4 py-3.5 bg-emerald-500 text-black text-xs font-black tracking-widest uppercase rounded-none hover:bg-emerald-450 transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 active:scale-98"
          >
            <Check className="w-4 h-4" /> SIMPAN DATA TRANSAKSI
          </button>
        </form>
      </div>

      {/* Helpful Quick Category Guides */}
      <div className="bg-[#121214] border border-[#27272A] p-4 rounded-none">
        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 border-b border-[#27272A] pb-1.5">
          ℹ️ REFERENSI KATALOG BIAYA
        </h4>
        <div className="grid grid-cols-1 gap-2.5 text-[10px] text-zinc-400">
          <div className="flex flex-col">
            <span className="font-black text-zinc-300 uppercase tracking-wider">Detergen & Sabun:</span>
            <span>Pembelian sabun cair, softener, pewangi parfum laundry, plastik packing, pemutih.</span>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-zinc-300 uppercase tracking-wider">Listrik & Air:</span>
            <span>Token PLN, gas LPG 3kg/casing untuk dryer, tagihan PDAM.</span>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-zinc-300 uppercase tracking-wider">Pemeliharaan Mesin:</span>
            <span>Servis washer/dryer IPSO, reparasi setrika uap, ganti seal air.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

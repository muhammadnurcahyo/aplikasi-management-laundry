import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Printer, 
  Share2, 
  Trash2, 
  Check, 
  FileText, 
  DollarSign, 
  User, 
  Phone, 
  Weight, 
  Calendar, 
  Clock, 
  Eye, 
  ChevronRight,
  Sparkles,
  Smartphone,
  CheckCircle,
  X,
  CreditCard,
  UserPlus
} from "lucide-react";
import { LaundryTransaction, Customer, Service } from "../types";

interface LaundryTransactionsProps {
  transactions: LaundryTransaction[];
  customers: Customer[];
  services: Service[];
  activeOwnerId: string | null;
  onAddTransaction: (trx: LaundryTransaction) => Promise<void>;
  onUpdateTransaction: (id: string, updates: Partial<LaundryTransaction>) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  onAddCustomer: (cust: Customer) => Promise<void>;
  onAddService: (item: Service) => Promise<void>;
  showCreateModalDirectly?: boolean;
  onCloseCreateModalDirectly?: () => void;
  showCustomerModalDirectly?: boolean;
  onCloseCustomerModalDirectly?: () => void;
  showServiceModalDirectly?: boolean;
  onCloseServiceModalDirectly?: () => void;
  triggerConfirm: (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    isDangerous?: boolean
  ) => void;
}

export function LaundryTransactions({
  transactions,
  customers,
  services,
  activeOwnerId,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onAddCustomer,
  onAddService,
  showCreateModalDirectly = false,
  onCloseCreateModalDirectly,
  showCustomerModalDirectly = false,
  onCloseCustomerModalDirectly,
  showServiceModalDirectly = false,
  onCloseServiceModalDirectly,
  triggerConfirm
}: LaundryTransactionsProps) {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("Semua");

  // Flow dialogues:
  const [isCreatingTrx, setIsCreatingTrx] = useState<boolean>(showCreateModalDirectly);
  const [isCreatingCust, setIsCreatingCust] = useState<boolean>(showCustomerModalDirectly);
  const [isCreatingServ, setIsCreatingServ] = useState<boolean>(showServiceModalDirectly);

  // active invoice printing simulation:
  const [printingTrx, setPrintingTrx] = useState<LaundryTransaction | null>(null);
  const [printingProgress, setPrintingProgress] = useState<number>(0);
  const [isPrintFinished, setIsPrintFinished] = useState<boolean>(false);

  // New Transaction Form state
  const [selectedCustId, setSelectedCustId] = useState<string>("");
  const [customCustName, setCustomCustName] = useState<string>("");
  const [customCustPhone, setCustomCustPhone] = useState<string>("");
  const [createCustInline, setCreateCustInline] = useState<boolean>(false);
  const [isSelectingCustBottomSheet, setIsSelectingCustBottomSheet] = useState<boolean>(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>("");

  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [trxWeight, setTrxWeight] = useState<number>(1);
  const [selectedParfum, setSelectedParfum] = useState<string>("Lavender");
  const [trxNotes, setTrxNotes] = useState<string>("");
  const [statusBayar, setStatusBayar] = useState<"Lunas" | "Belum Lunas">("Belum Lunas");
  const [paymentMethod, setPaymentMethod] = useState<"Tunai" | "QRIS" | "Transfer">("Tunai");

  // Rich states for Screenshot 1: Tambah Transaksi layout matching
  const [pilihWaktuCustom, setPilihWaktuCustom] = useState<boolean>(false);
  const [customWaktuValue, setCustomWaktuValue] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
  const [isTransaksiPaket, setIsTransaksiPaket] = useState<boolean>(false);
  const [isRekananLaundry, setIsRekananLaundry] = useState<boolean>(false);
  
  const [isAddingServiceInline, setIsAddingServiceInline] = useState<boolean>(false);
  const [tempServiceId, setTempServiceId] = useState<string>("");
  const [tempServiceWeight, setTempServiceWeight] = useState<string>("1");
  const [selectedLayananList, setSelectedLayananList] = useState<Array<{
    id: string;
    serviceId: string;
    nama: string;
    berat: number | string;
    harga: number;
    tipe: string;
  }>>([]);

  const [isAddingBiayaInline, setIsAddingBiayaInline] = useState<boolean>(false);
  const [tempBiayaNama, setTempBiayaNama] = useState<string>("");
  const [tempBiayaJumlah, setTempBiayaJumlah] = useState<number>(0);
  const [biayaTambahanList, setBiayaTambahanList] = useState<Array<{
    id: string;
    nama: string;
    jumlah: number;
  }>>([]);

  const [customEstimasiValue, setCustomEstimasiValue] = useState<string>("");
  const [showDiskonInput, setShowDiskonInput] = useState<boolean>(false);
  const [diskonNominal, setDiskonNominal] = useState<number>(0);
  const [isPembulatanActive, setIsPembulatanActive] = useState<boolean>(true);
  const [pembulatanTipe, setPembulatanTipe] = useState<"500" | "1000">("1000");
  const [serviceSearchQuery, setServiceSearchQuery] = useState<string>("");

  // New Customer Form state
  const [newCustName, setNewCustName] = useState<string>("");
  const [newCustPhone, setNewCustPhone] = useState<string>("");
  const [newCustAddress, setNewCustAddress] = useState<string>("");
  const [newCustPanggilan, setNewCustPanggilan] = useState<string>("");
  const [newCustParfum, setNewCustParfum] = useState<string>("");
  const [newCustLokasi, setNewCustLokasi] = useState<string>("");

  // New Service Form state
  const [newServName, setNewServName] = useState<string>("");
  const [newServType, setNewServType] = useState<string>("kg");
  const [newServPrice, setNewServPrice] = useState<number>(0);
  const [newServDuration, setNewServDuration] = useState<number>(48);

  // New Service Extra Form States (High fidelity matching screenshots)
  const [newServProses, setNewServProses] = useState<string[]>(["Cuci", "Pengeringan", "Setrika", "Lipat"]);
  const [newServDurationValue, setNewServDurationValue] = useState<number>(1);
  const [newServDurationTipe, setNewServDurationTipe] = useState<"Jam" | "Hari">("Hari");
  const [newServMinQty, setNewServMinQty] = useState<number>(1);
  const [newServCategory, setNewServCategory] = useState<string>("Reguler");
  const [newServSematkan, setNewServSematkan] = useState<boolean>(false);
  const [newServBahanBahan, setNewServBahanBahan] = useState<string[]>([]);
  const [isAddingBahanInline, setIsAddingBahanInline] = useState<boolean>(false);
  const [tempBahanNama, setTempBahanNama] = useState<string>("");
  const [categoryList, setCategoryList] = useState<string[]>(["Express", "Reguler", "Kilat"]);
  const [isAddingCategoryInline, setIsAddingCategoryInline] = useState<boolean>(false);
  const [tempCategoryNama, setTempCategoryNama] = useState<string>("");

  // Sheet modals (to match high fidelity bottom options screen designs)
  const [showSatuanSheet, setShowSatuanSheet] = useState<boolean>(false);
  const [showKategoriSheet, setShowKategoriSheet] = useState<boolean>(false);
  const [showDurasiTipeSheet, setShowDurasiTipeSheet] = useState<boolean>(false);

  React.useEffect(() => {
    if (showCreateModalDirectly) setIsCreatingTrx(true);
  }, [showCreateModalDirectly]);

  React.useEffect(() => {
    if (showCustomerModalDirectly) setIsCreatingCust(true);
  }, [showCustomerModalDirectly]);

  React.useEffect(() => {
    if (showServiceModalDirectly) setIsCreatingServ(true);
  }, [showServiceModalDirectly]);

  // Automatically calculate customEstimasiValue when selected items, custom transaction date or services change
  React.useEffect(() => {
    let baseDate = new Date();
    if (pilihWaktuCustom && customWaktuValue) {
      baseDate = new Date(customWaktuValue);
    }

    let maxDurationJam = 48; // Default to 48 hours is fallback

    if (selectedLayananList.length > 0) {
      maxDurationJam = 0;
      selectedLayananList.forEach((item) => {
        const matchingS = services.find((serv) => serv.id === item.serviceId);
        if (matchingS) {
          const itemDuration = matchingS.durasiJam || 48;
          if (itemDuration > maxDurationJam) {
            maxDurationJam = itemDuration;
          }
        }
      });
    } else if (selectedServiceId) {
      const matchingS = services.find((serv) => serv.id === selectedServiceId);
      if (matchingS) {
        maxDurationJam = matchingS.durasiJam || 48;
      }
    }

    if (maxDurationJam > 0) {
      const targetDate = new Date(baseDate.getTime() + maxDurationJam * 60 * 60 * 1000);
      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
      const dd = String(targetDate.getDate()).padStart(2, "0");
      const hh = String(targetDate.getHours()).padStart(2, "0");
      const min = String(targetDate.getMinutes()).padStart(2, "0");
      setCustomEstimasiValue(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
    }
  }, [selectedLayananList, selectedServiceId, pilihWaktuCustom, customWaktuValue, services]);

  // Rich reactive calculations for subtotal, diskon, extra fields, roundings, and grand total:
  const servicesSubtotal = selectedLayananList.reduce((acc, curr) => {
    const beratNum = typeof curr.berat === "string" ? parseFloat(curr.berat.replace(",", ".")) || 0 : curr.berat;
    return acc + (curr.harga * beratNum);
  }, 0);
  const extraFeesTotal = biayaTambahanList.reduce((acc, curr) => acc + curr.jumlah, 0);
  const subtotalBeforeDiskon = servicesSubtotal + extraFeesTotal;
  const diskonValue = showDiskonInput ? diskonNominal : 0;
  const beforeRoundingTotal = Math.max(0, subtotalBeforeDiskon - diskonValue);
  
  // Calculate rounding so that total is rounded up to the nearest 1000 or 500
  const getRoundingValue = (amount: number) => {
    if (!isPembulatanActive) return 0;
    const step = pembulatanTipe === "1000" ? 1000 : 500;
    const remainder = amount % step;
    if (remainder === 0) return 0;
    return step - remainder; // Round up positive adjustment
  };
  const nominalPembulatan = getRoundingValue(beforeRoundingTotal);
  const grandTotalResult = beforeRoundingTotal + nominalPembulatan;

  // Handler: Calculate values block
  const currentService = services.find(s => s.id === selectedServiceId);
  const calculatedTotal = selectedLayananList.length > 0 ? grandTotalResult : (currentService ? (currentService.harga * trxWeight) + getRoundingValue(currentService.harga * trxWeight) : 0);

  // Filter list
  const filteredTrx = transactions.filter((t) => {
    const matchesSearch = 
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.layananNama.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === "Semua") return matchesSearch;
    return matchesSearch && t.status === statusFilter;
  });

  // Actions trigger list:
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOwnerId) {
      alert("Database error: Silakan login terlebih dahulu.");
      return;
    }

    let resolvedCustName = "";
    let resolvedCustPhone = "";

    if (createCustInline) {
      if (!customCustName || !customCustPhone) {
        alert("Nama Pelanggan dan No HP wajib diisi.");
        return;
      }
      
      const newCustId = "CUST-" + Date.now().toString().slice(-6);
      const newCust: Customer = {
        id: newCustId,
        nama: customCustName,
        telepon: customCustPhone,
        userId: activeOwnerId,
        createdAt: new Date().toISOString()
      };
      
      await onAddCustomer(newCust);
      resolvedCustName = customCustName;
      resolvedCustPhone = customCustPhone;
    } else {
      const selected = customers.find(c => c.id === selectedCustId);
      if (!selected) {
        alert("Pilih pelanggan terlebih dahulu.");
        return;
      }
      resolvedCustName = selected.nama;
      resolvedCustPhone = selected.telepon;
    }

    const choosenService = services.find(s => s.id === selectedServiceId);

    // Parse the actual transaction time
    let baseTime = new Date();
    if (pilihWaktuCustom && customWaktuValue) {
      baseTime = new Date(customWaktuValue);
    }
    const yy = baseTime.getFullYear().toString().slice(-2);
    const mm = String(baseTime.getMonth() + 1).padStart(2, "0");
    const dd = String(baseTime.getDate()).padStart(2, "0");
    const numSuffix = Math.floor(10000 + Math.random() * 90000).toString(); // Secure serial
    const trxId = `TRX-${yy}${mm}${dd}-${numSuffix}`;

    const tanggalMasuk = `${baseTime.getFullYear()}-${String(baseTime.getMonth()+1).padStart(2,"0")}-${String(baseTime.getDate()).padStart(2,"0")} ` +
                          `${String(baseTime.getHours()).padStart(2,"0")}:${String(baseTime.getMinutes()).padStart(2,"0")}`;

    // Estimated completion time
    let compTime = new Date(baseTime.getTime() + 48 * 60 * 60 * 1000); // 48 hours default estimate
    if (customEstimasiValue) {
      compTime = new Date(customEstimasiValue);
    } else if (selectedLayananList.length > 0) {
      let maxDuration = 48;
      selectedLayananList.forEach(item => {
        const matchingS = services.find(serv => serv.id === item.serviceId);
        if (matchingS && matchingS.durasiJam > maxDuration) {
          maxDuration = matchingS.durasiJam;
        }
      });
      compTime = new Date(baseTime.getTime() + maxDuration * 60 * 60 * 1000);
    } else if (choosenService) {
      compTime = new Date(baseTime.getTime() + choosenService.durasiJam * 60 * 60 * 1000);
    }
    const estimasiSelesai = `${compTime.getFullYear()}-${String(compTime.getMonth()+1).padStart(2,"0")}-${String(compTime.getDate()).padStart(2,"0")} ` +
                            `${String(compTime.getHours()).padStart(2,"0")}:${String(compTime.getMinutes()).padStart(2,"0")}`;

    // Compute details for storing in the core database
    let finalLayananId = "";
    let finalLayananNama = "";
    let finalBerat = 1;

    if (selectedLayananList.length > 0) {
      finalLayananId = selectedLayananList[0].serviceId;
      finalLayananNama = selectedLayananList.map(item => {
        const bVal = typeof item.berat === "string" ? parseFloat(item.berat.replace(",", ".")) || 0 : item.berat;
        return `${item.nama} (${bVal} ${item.tipe === "Satuan" ? "Pcs" : "Kg"})`;
      }).join(", ");
      finalBerat = selectedLayananList.reduce((acc, curr) => {
        const bVal = typeof curr.berat === "string" ? parseFloat(curr.berat.replace(",", ".")) || 0 : curr.berat;
        return acc + bVal;
      }, 0);
    } else if (choosenService) {
      finalLayananId = choosenService.id;
      finalLayananNama = choosenService.nama;
      finalBerat = trxWeight;
    } else {
      alert("Silakan tambahkan layanan laundry terlebih dahulu.");
      return;
    }

    // Embed extra metadata into notes securely to not lose transparency
    let finalNotes = trxNotes;
    if (isTransaksiPaket) {
      finalNotes = "[TRANSAKSI PAKET] " + finalNotes;
    }
    if (isRekananLaundry) {
      finalNotes = "[REKANAN LAUNDRY] " + finalNotes;
    }
    if (biayaTambahanList.length > 0) {
      const extraFeesString = biayaTambahanList.map(item => `${item.nama}: Rp ${item.jumlah.toLocaleString()}`).join(", ");
      finalNotes = finalNotes + ` (Biaya Tambahan: ${extraFeesString})`;
    }
    if (diskonNominal > 0) {
      finalNotes = finalNotes + ` (Diskon: Rp ${diskonNominal.toLocaleString()})`;
    }
    if (nominalPembulatan !== 0) {
      finalNotes = finalNotes + ` (Pembulatan: Rp ${nominalPembulatan.toLocaleString()})`;
    }

    const newTrx: LaundryTransaction = {
      id: trxId,
      customerName: resolvedCustName,
      customerPhone: resolvedCustPhone,
      layananId: finalLayananId,
      layananNama: finalLayananNama,
      parfum: selectedParfum,
      berat: finalBerat,
      totalHarga: calculatedTotal,
      status: "Antrian",
      statusBayar: statusBayar,
      pembayaranMetode: paymentMethod,
      tanggalMasuk,
      estimasiSelesai,
      notes: finalNotes || undefined,
      userId: activeOwnerId
    };

    await onAddTransaction(newTrx);
    
    // Reset fields
    setSelectedCustId("");
    setCustomCustName("");
    setCustomCustPhone("");
    setCreateCustInline(false);
    setSelectedServiceId("");
    setTrxWeight(1);
    setTrxNotes("");
    setStatusBayar("Belum Lunas");
    
    // Reset additional high fidelity states
    setPilihWaktuCustom(false);
    setIsTransaksiPaket(false);
    setIsRekananLaundry(false);
    setSelectedLayananList([]);
    setBiayaTambahanList([]);
    setCustomEstimasiValue("");
    setShowDiskonInput(false);
    setDiskonNominal(0);
    setIsPembulatanActive(true);

    setIsCreatingTrx(false);
    if (onCloseCreateModalDirectly) onCloseCreateModalDirectly();
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOwnerId) return;
    if (!newCustName) {
      alert("Nama wajib diisi!");
      return;
    }

    const newId = "CUST-" + Date.now().toString().slice(-6);
    const newCust: Customer = {
      id: newId,
      nama: newCustName,
      telepon: newCustPhone || "-",
      alamat: newCustAddress || "",
      userId: activeOwnerId,
      createdAt: new Date().toISOString()
    };

    if (newCustPanggilan) {
      newCust.panggilan = newCustPanggilan;
    }
    if (newCustParfum) {
      newCust.parfumFavorit = newCustParfum;
    }
    if (newCustLokasi) {
      newCust.lokasiAntarJemput = newCustLokasi;
    }

    await onAddCustomer(newCust);
    setSelectedCustId(newId);
    setCreateCustInline(false);

    setNewCustName("");
    setNewCustPhone("");
    setNewCustAddress("");
    setNewCustPanggilan("");
    setNewCustParfum("");
    setNewCustLokasi("");
    setIsCreatingCust(false);
    
    if (onCloseCustomerModalDirectly) onCloseCustomerModalDirectly();
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOwnerId) return;
    if (!newServName || newServPrice <= 0) return;

    const calculatedDurasiJam = newServDurationTipe === "Hari" ? (newServDurationValue * 24) : newServDurationValue;
    const newId = "SERV-" + Date.now().toString().slice(-6);
    const newService: Service = {
      id: newId,
      nama: newServName,
      tipe: newServType || "kg",
      harga: newServPrice,
      durasiJam: calculatedDurasiJam,
      userId: activeOwnerId,
      proses: newServProses,
      durasiValue: newServDurationValue,
      durasiTipe: newServDurationTipe,
      minimalKuantitas: newServMinQty,
      kategori: newServCategory,
      sematkan: newServSematkan,
      bahanBahan: newServBahanBahan
    };

    await onAddService(newService);
    setTempServiceId(newId);
    setServiceSearchQuery("");
    setNewServName("");
    setNewServType("kg");
    setNewServPrice(0);
    setNewServDurationValue(1);
    setNewServDurationTipe("Hari");
    setNewServMinQty(1);
    setNewServCategory("Reguler");
    setNewServSematkan(false);
    setNewServBahanBahan([]);
    setIsCreatingServ(false);

    if (onCloseServiceModalDirectly) onCloseServiceModalDirectly();
  };

  // Printing Trigger simulator
  const startPrintSimulation = (trx: LaundryTransaction) => {
    setPrintingTrx(trx);
    setPrintingProgress(0);
    setIsPrintFinished(false);

    const interval = setInterval(() => {
      setPrintingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsPrintFinished(true);
          return 100;
        }
        return prev + 20;
      });
    }, 250);
  };

  // WhatsApp formatted receipt launcher
  const sendWhatsAppReceipt = (trx: LaundryTransaction) => {
    const formattedPhone = trx.customerPhone.replace(/[^0-9]/g, "");
    const waPhone = formattedPhone.startsWith("0") ? "62" + formattedPhone.substring(1) : formattedPhone;

    const text = `*DAMDAM LAUNDRY NOTA OPERASIONAL*\n` +
                 `===============================\n` +
                 `No Nota  : ${trx.id}\n` +
                 `Pelanggan: ${trx.customerName}\n` +
                 `Masuk    : ${trx.tanggalMasuk}\n` +
                 `Layanan  : ${trx.layananNama}\n` +
                 `Takaran  : ${trx.berat} ${trx.layananNama.toLowerCase().includes("kiloan") ? "Kg" : "Pcs"}\n` +
                 `Parfum   : ${trx.parfum}\n` +
                 `Catatan  : ${trx.notes || "-"}\n` +
                 `-------------------------------\n` +
                 `*TOTAL BILL: Rp ${trx.totalHarga.toLocaleString("id-ID")}*\n` +
                 `Status   : ${trx.status.toUpperCase()}\n` +
                 `Bayar    : *${trx.statusBayar.toUpperCase()}* (${trx.pembayaranMetode})\n` +
                 `Estimasi Selesai : *${trx.estimasiSelesai}*\n` +
                 `===============================\n` +
                 `Pakaian Anda adalah amanah kami. Terima kasih atas kepercayaan Anda!\n` +
                 `_Damdam Laundry & Care_`;

    const encoded = encodeURIComponent(text);
    const targetUrl = `https://api.whatsapp.com/send?phone=${waPhone}&text=${encoded}`;
    window.open(targetUrl, "_blank");
  };

  const updateStatusFlow = async (id: string, currentStatus: string) => {
    let nextStatus: "Antrian" | "Proses" | "Selesai" | "Diambil" | "Batal" = "Antrian";
    let updates: Partial<LaundryTransaction> = {};

    if (currentStatus === "Antrian") {
      nextStatus = "Proses";
    } else if (currentStatus === "Proses") {
      nextStatus = "Selesai";
      updates.tanggalSelesai = new Date().toISOString();
    } else if (currentStatus === "Selesai") {
      nextStatus = "Diambil";
      updates.tanggalDiambil = new Date().toISOString();
      updates.statusBayar = "Lunas"; // auto reconcile
    }

    updates.status = nextStatus;
    
    await onUpdateTransaction(id, updates);
  };

  // Format amount to local IDR
  const formatIDR = (val: number) => {
    return "Rp " + val.toLocaleString("id-ID");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0A0A0B] font-sans">
      
      {/* Search Header */}
      <div className="p-4 bg-[#121214] border-b border-zinc-900 space-y-3 shrink-0 text-left">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
            <FileText className="w-4 h-4 text-emerald-500" /> OPERASIONAL NOTA LAUNDRY
          </h2>
          <button
            onClick={() => setIsCreatingTrx(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 hover:bg-emerald-450 text-black text-[9.5px] font-black uppercase tracking-wider rounded-none transition shadow-md active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3px]" /> Buat Nota
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Cari transaksi berdasarkan nama/nota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-850 px-3.5 py-2 pl-9 text-xs text-zinc-100 rounded-none focus:outline-none focus:border-emerald-500 font-semibold"
          />
          <Search className="w-4 h-4 text-zinc-550 absolute left-3 top-2.5" />
        </div>

        {/* Status Filter Tab Buttons */}
        <div className="flex overflow-x-auto gap-1.5 no-scrollbar pb-1 text-[8.5px] font-black uppercase tracking-wider select-none">
          {["Semua", "Antrian", "Proses", "Selesai", "Diambil", "Batal"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 cursor-pointer shrink-0 border rounded-none shadow-xs ${
                statusFilter === st
                  ? "bg-emerald-500 text-black border-emerald-500"
                  : "bg-zinc-950 text-zinc-400 border-zinc-850 hover:text-white hover:border-zinc-700"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredTrx.length === 0 ? (
          <div className="py-12 border border-dashed border-zinc-850 bg-zinc-950/20 text-center rounded-none select-none">
            <span className="text-xs font-black text-zinc-500 uppercase tracking-widest block mb-1">
              Tidak Ada Nota laundry Ditemukan
            </span>
            <p className="text-[10.5px] text-zinc-650 font-bold max-w-[240px] mx-auto text-balance">
              Cobalah sesuaikan kata kunci pemfilteran atau rekam transaksi laundry baru.
            </p>
          </div>
        ) : (
          filteredTrx.map((trx) => {
            const isCompleted = trx.status === "Selesai" || trx.status === "Diambil";
            
            const badgeColorStr = 
              trx.status === "Antrian" ? "bg-zinc-950 text-zinc-400 border-zinc-800" :
              trx.status === "Proses" ? "bg-indigo-950/40 text-indigo-400 border-indigo-900/45" :
              trx.status === "Selesai" ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/50" :
              trx.status === "Diambil" ? "bg-zinc-900 text-zinc-550 border-zinc-850" : "bg-red-950/30 text-rose-500 border-red-900/40";

            return (
              <div 
                key={trx.id}
                className="bg-[#121214] border border-[#27272A] p-4 rounded-none space-y-3 text-left relative shadow-sm"
              >
                {/* 1. Header Row */}
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] text-[#10B981] font-black border border-emerald-950 bg-emerald-950/30 px-2 py-0.5">
                      {trx.id}
                    </span>
                    <span className={`text-[8.5px] font-black px-1.5 py-0.5 border uppercase tracking-wider font-mono ${badgeColorStr}`}>
                      {trx.status}
                    </span>
                  </div>

                  {/* Date entered */}
                  <span className="text-[9px] font-mono text-zinc-500">{trx.tanggalMasuk}</span>
                </div>

                {/* 2. Content Parameters */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className="text-zinc-400">Pelanggan:</span>
                    <span className="text-white font-extrabold">{trx.customerName} ({trx.customerPhone})</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-zinc-400">Paket:</span>
                    <span className="text-zinc-200 font-semibold">{trx.layananNama}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-zinc-400">Takaran:</span>
                    <span className="text-emerald-400 font-bold">{trx.berat} {trx.layananNama.toLowerCase().includes("kiloan") ? "Kg" : "Pcs"}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-zinc-400">Pewangi / Parfum:</span>
                    <span className="text-purple-400 font-bold">✨ {trx.parfum}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-zinc-400">Estimasi Selesai:</span>
                    <span className="text-amber-400 font-bold">{trx.estimasiSelesai}</span>
                  </div>
                  {trx.notes && (
                    <div className="bg-zinc-950 border border-zinc-900 p-2 text-[10.5px] text-zinc-450 italic font-medium leading-relaxed mt-1.5">
                      Catatan: {trx.notes}
                    </div>
                  )}
                </div>

                {/* 3. Pricing Row */}
                <div className="flex items-center justify-between border-t border-b border-zinc-900 py-2.5 font-mono text-xs">
                  <div>
                    <span className="block text-[8.5px] text-zinc-500 font-black uppercase">Metode Pembayaran</span>
                    <span className="font-extrabold text-zinc-300 flex items-center gap-1 mt-0.5">
                      <CreditCard className="w-3 h-3 text-emerald-500" />
                      {trx.pembayaranMetode.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="block text-[8.5px] text-zinc-500 font-black uppercase">Total Tagihan</span>
                    <span className="text-sm font-black text-white">{formatIDR(trx.totalHarga)}</span>
                  </div>

                  <div>
                    <span className="block text-[8.5px] text-zinc-500 font-black uppercase">Status Bayar</span>
                    <span className={`inline-block text-[8px] font-black px-1.5 py-0.5 rounded-none mt-0.5 uppercase tracking-wider ${trx.statusBayar === "Lunas" ? "bg-emerald-950/20 text-emerald-400 border border-emerald-900/60" : "bg-red-955/15 text-rose-500 border border-red-950/50"}`}>
                      {trx.statusBayar}
                    </span>
                  </div>
                </div>

                {/* 4. Action buttons */}
                <div className="flex gap-2 justify-end text-[9px] font-black uppercase tracking-widest pt-1.5">
                  <button
                    onClick={() => startPrintSimulation(trx)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition duration-150 rounded-none cursor-pointer"
                    title="Cetak struk nota ke Portable Bluetooth thermal printer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Cetak
                  </button>

                  <button
                    onClick={() => sendWhatsAppReceipt(trx)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-emerald-400 hover:text-emerald-350 transition duration-150 rounded-none cursor-pointer"
                    title="Kirim file/text nota ke WhatsApp pelanggan"
                  >
                    <Share2 className="w-3.5 h-3.5" /> WA
                  </button>

                  <button
                    onClick={() => {
                      triggerConfirm(
                        "Hapus Transaksi",
                        `Apakah Anda yakin ingin menghapus nota laundry ${trx.id} milik ${trx.customerName}? Tindakan ini permanen.`,
                        () => onDeleteTransaction(trx.id),
                        true
                      );
                    }}
                    className="flex items-center gap-1.5 px-2 bg-zinc-950 border border-zinc-900 hover:bg-rose-950/20 text-zinc-650 hover:text-rose-500 transition duration-150 rounded-none cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Flow progress action button */}
                  {trx.status !== "Diambil" && trx.status !== "Batal" && (
                    <button
                      onClick={() => updateStatusFlow(trx.id, trx.status)}
                      className={`flex items-center gap-1 px-3 py-1.5 text-black font-black font-mono transition shadow-md active:scale-95 cursor-pointer rounded-none ${
                        trx.status === "Antrian" ? "bg-indigo-300 hover:bg-indigo-400" :
                        trx.status === "Proses" ? "bg-amber-400 hover:bg-amber-500" : "bg-emerald-500 hover:bg-emerald-450"
                      }`}
                    >
                      {trx.status === "Antrian" ? "Mulai Proses &rsaquo;" :
                       trx.status === "Proses" ? "Diselesaikan &rsaquo;" : "Diambil/Serahkan &rsaquo;"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>      {/* DIALOG A: CREATE TRANSACTION MODULE - HIGH FIDELITY LAYOUT MATCHING SCREENSHOT */}
      {isCreatingTrx && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-3 overflow-y-auto font-sans">
          <div className="w-full max-w-[430px] bg-[#121214] border border-[#27272A] rounded-2xl shadow-2xl relative text-left flex flex-col overflow-hidden max-h-[96vh]">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-zinc-900 flex items-center justify-between sticky top-0 bg-[#121214] z-10">
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => { 
                    setIsCreatingTrx(false); 
                    if (onCloseCreateModalDirectly) onCloseCreateModalDirectly(); 
                  }}
                  className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition"
                  title="Kembali"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Tambah Transaksi
                </h3>
              </div>
              <div className="w-5 h-5" />
            </div>

            {/* Form Fields Scroller */}
            <form onSubmit={handleCreateTransaction} className="p-5 space-y-5 overflow-y-auto flex-1 no-scrollbar">
              
              {/* Toggle: Pilih Waktu Transaksi */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 max-w-[80%]">
                  <span className="text-xs font-semibold text-white">Pilih Waktu Transaksi</span>
                  <p className="text-[10px] text-zinc-500 leading-normal">
                    Aktifkan jika ingin membuat transaksi yang waktunya sebelum saat ini
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPilihWaktuCustom(!pilihWaktuCustom)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${pilihWaktuCustom ? 'bg-[#0084C7]' : 'bg-zinc-700'}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${pilihWaktuCustom ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {pilihWaktuCustom && (
                <div className="space-y-1">
                  <input
                    type="datetime-local"
                    value={customWaktuValue}
                    onChange={(e) => setCustomWaktuValue(e.target.value)}
                    className="w-full text-xs font-semibold bg-[#1C1C1E] border border-zinc-850 rounded-xl p-3 text-white focus:outline-none focus:border-[#0284c7] focus:ring-1 focus:ring-[#0284c7] transition font-mono"
                  />
                </div>
              )}

              {/* Toggle: Transaksi Paket */}
              <div className="flex items-center justify-between pt-1">
                <div className="space-y-0.5 max-w-[80%]">
                  <span className="text-xs font-semibold text-white">Transaksi Paket</span>
                  <p className="text-[10px] text-zinc-500 leading-normal">
                    Aktifkan jika ingin melakukan transaksi paket
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTransaksiPaket(!isTransaksiPaket)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isTransaksiPaket ? 'bg-[#0084C7]' : 'bg-zinc-700'}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isTransaksiPaket ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Toggle: Rekanan Laundry */}
              <div className="flex items-center justify-between pt-1">
                <div className="space-y-0.5 max-w-[80%]">
                  <span className="text-xs font-semibold text-white">Rekanan Laundry</span>
                  <p className="text-[10px] text-zinc-500 leading-normal">
                    Aktifkan jika merupakan transaksi dari rekanan laundry
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRekananLaundry(!isRekananLaundry)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isRekananLaundry ? 'bg-[#0084C7]' : 'bg-zinc-700'}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isRekananLaundry ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Pelanggan Box Link selector */}
              <div className="space-y-1.5 pt-1 border-t border-zinc-900/40">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-zinc-350 block">Pelanggan</label>
                  <button
                    type="button"
                    onClick={() => {
                      setCreateCustInline(!createCustInline);
                      setSelectedCustId("");
                    }}
                    className="text-[10px] text-sky-400 hover:text-sky-300 font-bold transition"
                  >
                    {createCustInline ? "Kembali ke Database" : "+ Buat Baru"}
                  </button>
                </div>

                {createCustInline ? (
                  <div className="bg-[#1C1C1E] p-4 border border-zinc-850 rounded-xl space-y-3">
                    <div>
                      <label className="text-[9px] text-zinc-400 font-bold uppercase block mb-1">Nama Customer:</label>
                      <input
                        type="text"
                        placeholder="e.g., Ibu Fatimah"
                        value={customCustName}
                        onChange={(e) => setCustomCustName(e.target.value)}
                        className="w-full text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white p-2.5 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-400 font-bold uppercase block mb-1">Nomor WhatsApp:</label>
                      <input
                        type="tel"
                        placeholder="e.g., 0812345678"
                        value={customCustPhone}
                        onChange={(e) => setCustomCustPhone(e.target.value)}
                        className="w-full text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white p-2.5 focus:outline-none font-mono"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerSearchQuery("");
                      setIsSelectingCustBottomSheet(true);
                    }}
                    className="w-full text-left text-xs bg-[#1C1C1E] border border-zinc-850 p-3.5 px-4 rounded-xl text-zinc-100 font-medium focus:outline-none flex justify-between items-center cursor-pointer hover:border-zinc-700 transition"
                  >
                    <span className="font-semibold text-zinc-200">
                      {selectedCustId ? (
                        (() => {
                          const found = customers.find(c => c.id === selectedCustId);
                          return found ? `${found.panggilan ? found.panggilan + " " : ""}${found.nama} (${found.telepon})` : "Pilih Pelanggan";
                        })()
                      ) : (
                        <span className="text-zinc-500">Pilih Pelanggan</span>
                      )}
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </button>
                )}
              </div>

              {/* Layanan Laundry Section */}
              <div className="space-y-2 pt-1 border-t border-zinc-900/40">
                <label className="text-xs font-bold text-white block">Layanan Laundry</label>
                
                {/* List of already added services */}
                {selectedLayananList.length > 0 ? (
                  <div className="space-y-2">
                    {selectedLayananList.map((item) => (
                      <div key={item.id} className="bg-[#1C1C1E] border border-zinc-850 rounded-xl p-3 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-white block">{item.nama}</span>
                          <span className="text-[10px] text-zinc-500 font-mono block">
                            {formatIDR(item.harga)} / {item.tipe === "Satuan" ? "Pcs" : "Kg"}
                          </span>
                        </div>
                        
                        {/* Weight multiplier buttons */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center border border-zinc-805 rounded-lg bg-zinc-950/60 overflow-hidden h-7">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLayananList(prev => prev.map(l => {
                                  if (l.id === item.id) {
                                    const parsedNum = parseFloat(String(l.berat).replace(",", ".")) || 0;
                                    const nextBerat = Math.max(0.001, parseFloat((parsedNum - 0.1).toFixed(3)));
                                    return { ...l, berat: nextBerat };
                                  }
                                  return l;
                                }));
                              }}
                              className="w-6 h-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 border-r border-zinc-800 text-xs font-bold"
                            >
                              -
                            </button>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={item.berat === 0 ? "" : item.berat}
                              onChange={(e) => {
                                const valStr = e.target.value.replace(",", ".");
                                if (valStr === "" || /^[0-9]*[.]?[0-9]*$/.test(valStr)) {
                                  setSelectedLayananList(prev => prev.map(l => {
                                    if (l.id === item.id) {
                                      return { ...l, berat: e.target.value };
                                    }
                                    return l;
                                  }));
                                }
                              }}
                              onBlur={() => {
                                setSelectedLayananList(prev => prev.map(l => {
                                  if (l.id === item.id) {
                                    const parsed = parseFloat(String(l.berat).replace(",", ".")) || 1;
                                    return { ...l, berat: parsed };
                                  }
                                  return l;
                                }));
                              }}
                              className="w-14 h-full text-center bg-transparent text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-sky-500 rounded px-1"
                              placeholder="0"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLayananList(prev => prev.map(l => {
                                  if (l.id === item.id) {
                                    const parsedNum = parseFloat(String(l.berat).replace(",", ".")) || 0;
                                    const nextBerat = parseFloat((parsedNum + 0.1).toFixed(3));
                                    return { ...l, berat: nextBerat };
                                  }
                                  return l;
                                }));
                              }}
                              className="w-6 h-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-900 border-l border-zinc-800 text-xs font-bold"
                            >
                              +
                            </button>
                          </div>
                          
                          <span className="text-[10px] text-zinc-400 font-bold uppercase w-8 text-center font-mono">
                            {item.tipe === "Satuan" ? "Pcs" : "Kg"}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLayananList(prev => prev.filter(l => l.id !== item.id));
                            }}
                            className="p-1 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-rose-500 transition"
                            title="Hapus Layanan"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-zinc-800 rounded-xl p-4 text-center text-[10.5px] text-zinc-500">
                    Belum ada layanan laundry terpilih
                  </div>
                )}                 {/* Sky blue addition button */}
                {!isAddingServiceInline ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingServiceInline(true);
                      if (services.length > 0) {
                        setTempServiceId(services[0].id);
                        setTempServiceWeight("1");
                      }
                    }}
                    className="w-full py-3 bg-[#0284c7] hover:bg-sky-500 text-white font-bold text-xs rounded-xl cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5 uppercase tracking-wide"
                  >
                    <Plus className="w-4 h-4" /> Tambah Layanan Laundry
                  </button>
                ) : (
                  <div className="bg-[#1C1C1E] border border-zinc-805 rounded-xl p-4 space-y-3 font-sans">
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Pilih Jenis Layanan</label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingServ(true);
                          }}
                          className="text-[10px] text-sky-400 hover:text-sky-300 font-bold flex items-center gap-0.5 select-none"
                        >
                          <Plus className="w-3.5 h-3.5" /> Buat Baru
                        </button>
                      </div>

                      {/* Search box with Search icon */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          placeholder="Cari nama layanan laundry..."
                          value={serviceSearchQuery}
                          onChange={(e) => {
                            setServiceSearchQuery(e.target.value);
                            // Auto select first match if found
                            const matches = services.filter(s => s.nama.toLowerCase().includes(e.target.value.toLowerCase()));
                            if (matches.length > 0) {
                              setTempServiceId(matches[0].id);
                            }
                          }}
                          className="w-full text-xs font-semibold bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      {/* Filtered select dropdown */}
                      <select
                        value={tempServiceId}
                        onChange={(e) => setTempServiceId(e.target.value)}
                        className="w-full text-xs font-semibold bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                      >
                        {(() => {
                          const matches = services.filter(s => s.nama.toLowerCase().includes(serviceSearchQuery.toLowerCase()));
                          if (matches.length === 0) {
                            return <option value="">--- Tidak ada layanan cocok ---</option>;
                          }
                          return matches.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.nama} ({formatIDR(s.harga)} / {s.tipe})
                            </option>
                          ));
                        })()}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 font-semibold block">Jumlah / Berat</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="Berat / Qty"
                          value={tempServiceWeight}
                          onChange={(e) => {
                            const valStr = e.target.value.replace(",", ".");
                            if (valStr === "" || /^[0-9]*[.]?[0-9]*$/.test(valStr)) {
                              setTempServiceWeight(e.target.value);
                            }
                          }}
                          className="w-full text-xs font-semibold font-mono bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <div className="flex items-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const match = services.find(s => s.id === tempServiceId);
                            if (match) {
                              const parsedWeight = parseFloat(tempServiceWeight.replace(",", ".")) || 1;
                              const newlyAdded = {
                                id: "L-ADD-" + Math.random().toString().slice(-4),
                                serviceId: match.id,
                                nama: match.nama,
                                berat: parsedWeight,
                                harga: match.harga,
                                tipe: match.tipe
                              };
                              setSelectedLayananList(prev => [...prev, newlyAdded]);
                              setIsAddingServiceInline(false);
                            }
                          }}
                          className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-450 text-black font-bold text-xs rounded-lg cursor-pointer transition select-none"
                        >
                          Tambah
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingServiceInline(false)}
                          className="px-3 py-2 bg-zinc-805 hover:bg-zinc-750 text-zinc-300 font-bold text-xs rounded-lg cursor-pointer transition"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Biaya Tambahan Section */}
              <div className="space-y-2 pt-1 border-t border-zinc-900/40">
                <label className="text-xs font-bold text-white block">Biaya Tambahan</label>

                {biayaTambahanList.length > 0 ? (
                  <div className="space-y-1.5">
                    {biayaTambahanList.map((item) => (
                      <div key={item.id} className="bg-[#1C1C1E] border border-zinc-850 rounded-xl p-3 flex justify-between items-center text-xs">
                        <span className="font-semibold text-zinc-300">{item.nama}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-400">{formatIDR(item.jumlah)}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setBiayaTambahanList(prev => prev.filter(f => f.id !== item.id));
                            }}
                            className="p-1 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-rose-550 transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {!isAddingBiayaInline ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingBiayaInline(true);
                      setTempBiayaNama("");
                      setTempBiayaJumlah(0);
                    }}
                    className="w-full py-3 bg-[#0284c7] hover:bg-sky-500 text-white font-bold text-xs rounded-xl cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5 uppercase tracking-wide"
                  >
                    <Plus className="w-4 h-4" /> Tambah Biaya Tambahan
                  </button>
                ) : (
                  <div className="bg-[#1C1C1E] border border-zinc-800 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 font-semibold block">Nama Biaya</label>
                        <input
                          type="text"
                          placeholder="Cth: Kilat / Setrika Saja"
                          value={tempBiayaNama}
                          onChange={(e) => setTempBiayaNama(e.target.value)}
                          className="w-full text-xs font-semibold bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 font-semibold block">Jumlah (Rp)</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={tempBiayaJumlah || ""}
                          onChange={(e) => setTempBiayaJumlah(Number(e.target.value))}
                          className="w-full text-xs font-semibold bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white focus:outline-none focus:border-sky-500 font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (!tempBiayaNama) {
                            alert("Nama biaya tambahan wajib diisi.");
                            return;
                          }
                          const newItem = {
                            id: "B-ADD-" + Math.random().toString().slice(-4),
                            nama: tempBiayaNama,
                            jumlah: tempBiayaJumlah || 0
                          };
                          setBiayaTambahanList(prev => [...prev, newItem]);
                          setIsAddingBiayaInline(false);
                        }}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-450 text-black font-bold text-xs rounded-lg cursor-pointer transition select-none"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingBiayaInline(false);
                        }}
                        className="px-3 py-2 bg-zinc-805 hover:bg-zinc-750 text-zinc-300 font-bold text-xs rounded-lg cursor-pointer transition"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Estimasi Selesai */}
              <div className="space-y-1.5 pt-1 border-t border-zinc-900/40">
                <label className="text-[11px] font-bold text-zinc-350 block">Estimasi Selesai</label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={customEstimasiValue}
                    onChange={(e) => setCustomEstimasiValue(e.target.value)}
                    className="w-full text-xs font-semibold bg-[#1C1C1E] border border-zinc-850 rounded-xl p-3 pr-10 text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition font-mono"
                    placeholder="Pilih Estimasi Selesai"
                  />
                  <div className="absolute right-4 top-3.5 pointer-events-none text-zinc-500">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Parfum */}
              <div className="space-y-1.5 pt-1 border-t border-zinc-900/40">
                <label className="text-[11px] font-bold text-zinc-350 block">Parfum (Opsional)</label>
                <div className="relative flex items-center">
                  <select
                    value={selectedParfum}
                    onChange={(e) => setSelectedParfum(e.target.value)}
                    className="w-full text-xs font-semibold bg-[#1C1C1E] border border-zinc-850 rounded-xl p-3 pr-10 text-zinc-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Pilih Parfum</option>
                    <option value="Lavender">Lavender Sensation</option>
                    <option value="Sakura">Sakura Blossom</option>
                    <option value="Lily">Lily Fresh</option>
                    <option value="Lemon">Lemon Citrus</option>
                    <option value="Polos">Tanpa Parfum (Netral)</option>
                  </select>
                  {selectedParfum ? (
                    <button
                      type="button"
                      onClick={() => setSelectedParfum("")}
                      className="absolute right-3.5 text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="absolute right-4 pointer-events-none text-zinc-500">
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </div>
                  )}
                </div>
              </div>

              {/* Catatan (Opsional) */}
              <div className="space-y-1.5 pt-1 border-t border-zinc-900/40">
                <label className="text-[11px] font-bold text-zinc-350 block">Catatan (Opsional)</label>
                <textarea
                  placeholder=""
                  rows={2}
                  value={trxNotes}
                  onChange={(e) => setTrxNotes(e.target.value)}
                  className="w-full text-xs font-semibold bg-[#1C1C1E] border border-zinc-850 rounded-xl p-3 text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all resize-none"
                />
              </div>

              {/* Diskon */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-900/40">
                <span className="text-xs font-semibold text-white">Diskon</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowDiskonInput(!showDiskonInput);
                    if (!showDiskonInput) setDiskonNominal(0);
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${showDiskonInput ? 'bg-[#0084C7]' : 'bg-zinc-700'}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${showDiskonInput ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {showDiskonInput && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-350 block">Nominal Diskon (Rp)</label>
                  <input
                    type="number"
                    placeholder="e.g., 5000"
                    value={diskonNominal || ""}
                    onChange={(e) => setDiskonNominal(Number(e.target.value))}
                    className="w-full text-xs font-semibold bg-[#1C1C1E] border border-zinc-850 rounded-xl p-3 text-white focus:outline-none focus:border-[#0284c7] transition font-mono"
                  />
                </div>
              )}

              {/* Status & Metode Bayar */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-900/40">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-zinc-350 block">Status Pembayaran</span>
                  <div className="flex bg-[#1C1C1E] border border-zinc-850 rounded-xl p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => setStatusBayar("Belum Lunas")}
                      className={`flex-1 py-2 text-center text-[10px] font-bold uppercase rounded-lg transition ${statusBayar === "Belum Lunas" ? "bg-red-500/20 text-rose-500" : "text-zinc-550 hover:text-zinc-350"}`}
                    >
                      BELUM LUNAS
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusBayar("Lunas")}
                      className={`flex-1 py-2 text-center text-[10px] font-bold uppercase rounded-lg transition ${statusBayar === "Lunas" ? "bg-emerald-500/20 text-emerald-400" : "text-zinc-550 hover:text-zinc-355"}`}
                    >
                      LUNAS
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-zinc-350 block">Metode Bayar</span>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full text-xs font-semibold bg-[#1C1C1E] border border-zinc-850 rounded-xl p-3 text-zinc-100 focus:outline-none cursor-pointer"
                  >
                    <option value="Tunai">Tunai / Cash</option>
                    <option value="QRIS font-mono">QRIS / E-Wallet</option>
                    <option value="Transfer font-mono">Transfer Bank</option>
                  </select>
                </div>
              </div>

              {/* Rincian Ringkasan Tagihan */}
              <div className="space-y-2.5 pt-3 border-t border-zinc-900/40 text-[11px]">
                <div className="flex justify-between items-center text-zinc-450">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold">{formatIDR(subtotalBeforeDiskon)}</span>
                </div>
                
                {diskonValue > 0 && (
                  <div className="flex justify-between items-center text-rose-500">
                    <span>Diskon</span>
                    <span className="font-mono font-bold">-{formatIDR(diskonValue)}</span>
                  </div>
                )}

                {nominalPembulatan !== 0 && (
                  <div className="flex justify-between items-center text-zinc-400">
                    <span>Pembulatan</span>
                    <span className="font-mono font-bold">
                      {nominalPembulatan > 0 ? "+" : ""}{formatIDR(nominalPembulatan)}
                    </span>
                  </div>
                )}

                {/* Boundary box for custom rounding switch */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsPembulatanActive(!isPembulatanActive)}
                    className={`w-full py-2.5 border border-dashed rounded-xl text-center text-[11px] font-bold tracking-wide transition flex items-center justify-center gap-1.5 ${isPembulatanActive ? "border-[#0084C7] bg-[#0084C7]/10 text-sky-400" : "border-zinc-800 hover:border-zinc-700 text-zinc-550"}`}
                  >
                    {isPembulatanActive ? `✓ Pembulatan Selesai (Ke Atas Rp${pembulatanTipe === "1000" ? "1.000" : "500"})` : "+ Tambah Pembulatan"}
                  </button>

                  {isPembulatanActive && (
                    <div className="flex gap-2 p-1 bg-zinc-950/60 border border-zinc-900 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setPembulatanTipe("500")}
                        className={`flex-1 py-1.5 text-center text-[10px] font-black rounded-lg transition-all ${
                          pembulatanTipe === "500" 
                            ? "bg-[#0084C7] text-white shadow" 
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        Ke Atas Rp500
                      </button>
                      <button
                        type="button"
                        onClick={() => setPembulatanTipe("1000")}
                        className={`flex-1 py-1.5 text-center text-[10px] font-black rounded-lg transition-all ${
                          pembulatanTipe === "1000" 
                            ? "bg-[#0084C7] text-white shadow" 
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        Ke Atas Rp1.000
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </form>

            {/* Blue and black rounded bottom sticky bar */}
            <div className="px-5 py-4 border-t border-zinc-900 bg-[#121214] flex items-center justify-between sticky bottom-0 z-10">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">Total</span>
                <span className="text-lg font-black text-white block font-mono leading-none">
                  {formatIDR(calculatedTotal)}
                </span>
              </div>
              <button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  handleCreateTransaction(e);
                }}
                className="py-3 px-10 bg-[#0284c7] hover:bg-sky-500 text-white font-bold text-[13px] rounded-xl cursor-pointer active:scale-95 transition-all text-center uppercase tracking-wide"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG B: CREATE CUSTOMER - HIGH FIDELITY TAMBAH PELANGGAN MATCHING SCREENSHOT */}
      {isCreatingCust && (
        <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md z-50 flex items-center justify-center p-3 overflow-y-auto font-sans">
          <div className="w-full max-w-[420px] bg-[#121214] border border-[#27272A] rounded-2xl shadow-2xl relative text-left flex flex-col overflow-hidden max-h-[95vh]">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-zinc-900 flex items-center justify-between sticky top-0 bg-[#121214] z-10">
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => { 
                    setIsCreatingCust(false); 
                    if (onCloseCustomerModalDirectly) onCloseCustomerModalDirectly(); 
                  }}
                  className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition"
                  title="Kembali"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Tambah Pelanggan
                </h3>
              </div>
              <div className="w-5 h-5" />
            </div>

            {/* Form Fields */}
            <form onSubmit={handleCreateCustomer} className="p-5 space-y-5 overflow-y-auto flex-1 no-scrollbar">
              
              {/* Panggilan (Opsional) */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-350 block">
                  Panggilan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder=""
                  value={newCustPanggilan}
                  onChange={(e) => setNewCustPanggilan(e.target.value)}
                  className="w-full text-xs font-medium bg-[#1C1C1E] border border-zinc-850 rounded-xl p-3 text-zinc-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                />
                <p className="text-[9.5px] text-zinc-500 font-medium">
                  Misal: Ibu, Bapak, Tuan, Nyonya
                </p>
              </div>

              {/* Nama */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-350 block">
                  Nama
                </label>
                <input
                  type="text"
                  placeholder=""
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full text-xs font-medium bg-[#1C1C1E] border border-zinc-850 rounded-xl p-3 text-zinc-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  required
                />
              </div>

              {/* No. Handphone (Opsional) */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-350 block">
                  No. Handphone (Opsional)
                </label>
                <input
                  type="tel"
                  placeholder=""
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full text-xs font-medium bg-[#1C1C1E] border border-zinc-850 rounded-xl p-3 text-zinc-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-mono"
                />
                <p className="text-[9.5px] text-zinc-500 font-medium">
                  Cth: 628987654321
                </p>
              </div>

              {/* Alamat (Opsional) */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-350 block">
                  Alamat (Opsional)
                </label>
                <textarea
                  placeholder=""
                  rows={2}
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full text-xs font-medium bg-[#1C1C1E] border border-zinc-850 rounded-xl p-3 text-zinc-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all resize-none"
                />
              </div>

              {/* Parfum (Opsional) */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-350 block">
                  Parfum (Opsional)
                </label>
                <div className="relative flex items-center">
                  <select
                    value={newCustParfum}
                    onChange={(e) => setNewCustParfum(e.target.value)}
                    className="w-full text-xs font-medium bg-[#1C1C1E] border border-zinc-850 rounded-xl p-3 pr-10 text-zinc-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Pilih Parfum</option>
                    <option value="Lavender">Lavender Sensation</option>
                    <option value="Sakura">Sakura Blossom</option>
                    <option value="Lily">Lily Fresh</option>
                    <option value="Lemon">Lemon Fresh</option>
                    <option value="Vanilla">Vanilla Sweet</option>
                  </select>
                  {newCustParfum ? (
                    <button
                      type="button"
                      onClick={() => setNewCustParfum("")}
                      className="absolute right-3.5 text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800"
                      title="Hapus pilihan"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="absolute right-4.5 pointer-events-none text-zinc-550">
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </div>
                  )}
                </div>
              </div>

              {/* Titik Lokasi Antar/Jemput */}
              <div className="pt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-semibold text-zinc-350 block">
                    Titik Lokasi Antar/Jemput
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const coordinates = [
                        "Sleman, Condongcatur (-7.7589, 110.4021)",
                        "Yogyakarta City Center (-7.7972, 110.3688)",
                        "Sleman, Depok Raya (-7.7712, 110.3861)",
                        "Bantul, Kasihan (-7.8285, 110.3344)"
                      ];
                      const randomSpot = coordinates[Math.floor(Math.random() * coordinates.length)];
                      setNewCustLokasi(randomSpot);
                      alert(`Koordinat Pinpoint Terpilih: "${randomSpot}"`);
                    }}
                    className="text-xs font-bold text-sky-400 hover:text-sky-300 transition tracking-wider"
                  >
                    Atur
                  </button>
                </div>
                <div className="bg-[#1C1C1E] border border-zinc-850 rounded-xl p-3.5 text-xs font-medium text-zinc-450 flex items-center justify-between">
                  <span>
                    {newCustLokasi ? (
                      <span className="text-emerald-400 font-mono text-[11px] font-bold">📍 {newCustLokasi}</span>
                    ) : (
                      "Belum menentukan lokasi antar/jemput"
                    )}
                  </span>
                  {newCustLokasi && (
                    <button
                      type="button"
                      onClick={() => setNewCustLokasi("")}
                      className="text-[10px] font-semibold text-zinc-500 hover:text-rose-500 ml-2"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 sticky bottom-0 bg-[#121214] pb-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#0284c7] hover:bg-sky-500 text-white font-bold text-[13px] rounded-xl cursor-pointer shadow-lg shadow-sky-500/10 active:scale-95 transition-all text-center uppercase tracking-wide"
                >
                  Simpan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DIALOG C: CREATE SERVICE - HIGH FIDELITY TAMBAH LAYANAN MATCHING SCREENSHOTS */}
      {isCreatingServ && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-55 flex items-center justify-center p-3 overflow-y-auto font-sans">
          <div className="w-full max-w-[430px] bg-[#121214] border border-[#27272A] rounded-2xl shadow-2xl relative text-left flex flex-col overflow-hidden max-h-[96vh]">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-zinc-900 flex items-center justify-between sticky top-0 bg-[#121214] z-10">
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => { 
                    setIsCreatingServ(false); 
                    if (onCloseServiceModalDirectly) onCloseServiceModalDirectly(); 
                  }}
                  className="p-1 hover:bg-zinc-805 rounded-lg text-zinc-400 hover:text-white transition"
                  title="Kembali"
                >
                  <X className="w-5 h-5" />
                </button>
                <span className="text-sm font-bold text-white tracking-wide">
                  Tambah Layanan
                </span>
              </div>
              <div className="w-5 h-5" />
            </div>

            {/* Form Fields Scroller */}
            <form onSubmit={handleCreateService} className="p-5 space-y-5 overflow-y-auto flex-1 no-scrollbar pb-24">
              
              {/* Nama Layanan Field */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-zinc-350 block">Nama</span>
                <input
                  type="text"
                  placeholder="Nama layanan"
                  value={newServName}
                  onChange={(e) => setNewServName(e.target.value)}
                  className="w-full text-xs font-semibold bg-[#1C1C1E] border border-zinc-850 rounded-xl p-3.5 text-white placeholder-zinc-650 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                  required
                />
              </div>

              {/* Proses Laundry Field (Cuci, Pengeringan, Setrika, Lipat) */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-350 block">Proses Laundry</span>
                <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:gap-3">
                  {["Cuci", "Pengeringan", "Setrika", "Lipat"].map((p) => {
                    const isChecked = newServProses.includes(p);
                    return (
                      <button
                        type="button"
                        key={p}
                        onClick={() => {
                          if (isChecked) {
                            setNewServProses(prev => prev.filter(x => x !== p));
                          } else {
                            setNewServProses(prev => [...prev, p]);
                          }
                        }}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition text-left select-none ${
                          isChecked 
                            ? "bg-sky-500/10 border-sky-500 text-sky-400" 
                            : "bg-[#1C1C1E] border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                          isChecked ? "bg-sky-500 border-sky-500 text-white" : "border-[#27272A]"
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Harga Field */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-zinc-350 block">Harga</span>
                <div className="relative">
                  <span className="absolute left-4 top-[15px] text-xs text-zinc-500 font-bold font-mono">Rp</span>
                  <input
                    type="number"
                    min="100"
                    placeholder="Harga"
                    value={newServPrice || ""}
                    onChange={(e) => setNewServPrice(Number(e.target.value))}
                    className="w-full text-xs font-bold font-mono bg-[#1C1C1E] border border-zinc-850 rounded-xl p-3.5 pl-10 text-white placeholder-zinc-650 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                    required
                  />
                </div>
              </div>

              {/* Durasi Row */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-zinc-350 block">Durasi</span>
                <div className="flex gap-2.5">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="1"
                      value={newServDurationValue}
                      onChange={(e) => setNewServDurationValue(Number(e.target.value))}
                      className="w-full text-xs font-bold font-mono bg-[#1C1C1E] border border-zinc-850 rounded-xl p-3.5 text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDurasiTipeSheet(true)}
                    className="w-28 text-left text-xs bg-[#1C1C1E] border border-zinc-850 p-3.5 px-4 rounded-xl text-zinc-100 font-semibold focus:outline-none flex justify-between items-center cursor-pointer hover:border-zinc-700"
                  >
                    <span>{newServDurationTipe}</span>
                    <ChevronRight className="w-4 h-4 rotate-90 text-zinc-500" />
                  </button>
                </div>
              </div>

              {/* Satuan Select Dropdown with Bottom Sheet Trigger */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-zinc-350 block">Satuan</span>
                <button
                  type="button"
                  onClick={() => setShowSatuanSheet(true)}
                  className="w-full text-left text-xs bg-[#1C1C1E] border border-zinc-850 p-3.5 px-4 rounded-xl text-zinc-200 font-semibold focus:outline-none flex justify-between items-center cursor-pointer hover:border-zinc-700 transition"
                >
                  <span>{newServType || <span className="text-zinc-550">Pilih Satuan</span>}</span>
                  <ChevronRight className="w-4 h-4 rotate-90 text-zinc-500" />
                </button>
              </div>

              {/* Minimal Kuantitas Field */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-zinc-350 block">Minimal Kuantitas</span>
                <input
                  type="number"
                  min="1"
                  value={newServMinQty}
                  onChange={(e) => setNewServMinQty(Number(e.target.value))}
                  className="w-full text-xs font-bold font-mono bg-[#1C1C1E] border border-zinc-850 rounded-xl p-3.5 text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                  required
                />
              </div>

              {/* Kategori Select with Bottom Sheet style trigger */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-zinc-350 block">Kategori</span>
                <button
                  type="button"
                  onClick={() => setShowKategoriSheet(true)}
                  className="w-full text-left text-xs bg-[#1C1C1E] border border-zinc-850 p-3.5 px-4 rounded-xl text-zinc-200 font-semibold focus:outline-none flex justify-between items-center cursor-pointer hover:border-zinc-700 transition"
                >
                  <span>{newServCategory || "Pilih Kategori"}</span>
                  <ChevronRight className="w-4 h-4 rotate-90 text-zinc-500" />
                </button>
              </div>

              {/* Toggle Sematkan */}
              <div className="flex items-center justify-between py-2 border-t border-zinc-900/40">
                <div className="space-y-0.5 max-w-[80%]">
                  <span className="text-xs font-semibold text-white">Sematkan</span>
                  <p className="text-[10px] text-zinc-500 leading-normal">
                    Jika disematkan, maka layanan akan ada di posisi atas
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewServSematkan(!newServSematkan)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${newServSematkan ? 'bg-[#0084C7]' : 'bg-zinc-700'}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${newServSematkan ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Bahan-Bahan Section */}
              <div className="space-y-2.5 pt-1 border-t border-zinc-900/40 pb-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-350 block">Bahan-Bahan (Opsional)</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingBahanInline(true);
                      setTempBahanNama("");
                    }}
                    className="px-4 py-1.5 bg-[#0284c7] hover:bg-sky-500 text-white font-bold text-xs rounded-xl cursor-pointer select-none transition"
                  >
                    Tambah
                  </button>
                </div>

                {isAddingBahanInline && (
                  <div className="bg-[#1C1C1E] border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
                    <input
                      type="text"
                      placeholder="Nama bahan / detergen (cth: Parfum Sakura)"
                      value={tempBahanNama}
                      onChange={(e) => setTempBahanNama(e.target.value)}
                      className="w-full text-xs font-semibold bg-[#1C1C1E] border border-zinc-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-sky-500"
                    />
                    <div className="flex justify-end gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          if (tempBahanNama.trim()) {
                            setNewServBahanBahan(prev => [...prev, tempBahanNama.trim()]);
                            setIsAddingBahanInline(false);
                            setTempBahanNama("");
                          }
                        }}
                        className="px-3.5 py-1.5 bg-emerald-500 text-black font-bold rounded-lg cursor-pointer"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingBahanInline(false)}
                        className="px-3.5 py-1.5 bg-zinc-800 text-zinc-300 font-bold rounded-lg cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}

                {newServBahanBahan.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {newServBahanBahan.map((b, i) => (
                      <div key={i} className="bg-zinc-805/80 border border-zinc-800 pl-3 pr-1.5 py-1 rounded-full flex items-center gap-1.5 text-[11px] text-zinc-300 font-semibold select-none">
                        <span>{b}</span>
                        <button
                          type="button"
                          onClick={() => setNewServBahanBahan(prev => prev.filter((_, idx) => idx !== i))}
                          className="p-0.5 rounded-full hover:bg-zinc-700 text-zinc-500 hover:text-rose-400 transition animate-fade-in"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-5 border border-dashed border-zinc-850 rounded-xl bg-zinc-950/20 text-center select-none">
                    <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-650 mb-1">
                      <FileText className="w-5 h-5 text-zinc-650" />
                    </div>
                    <span className="text-[11px] text-zinc-550 font-bold">Bahan Kosong</span>
                  </div>
                )}
              </div>

            </form>

            {/* Blue sticky bottom bar */}
            <div className="px-5 py-4 border-t border-zinc-900 bg-[#121214] sticky bottom-0 z-10 w-full">
              <button
                type="submit"
                onClick={handleCreateService}
                className="w-full py-3.5 bg-[#0284c7] hover:bg-sky-500 text-white font-bold text-sm rounded-xl cursor-pointer active:scale-95 transition-all text-center uppercase tracking-wide shadow-lg shadow-sky-500/10"
              >
                Simpan
              </button>
            </div>

          </div>

          {/* Bottom Sheet Modal for Units (Satuan) */}
          {showSatuanSheet && (
            <div className="fixed inset-0 bg-black/80 z-60 flex items-end justify-center animate-fade-in font-sans">
              <div className="w-full max-w-[430px] bg-[#121214] border-t border-zinc-800 rounded-t-3xl overflow-hidden animate-slide-up">
                <div className="px-5 py-4 border-b border-zinc-900 flex items-center justify-between bg-[#121214]">
                  <span className="text-sm font-bold text-white">Pilih Satuan</span>
                  <button 
                    type="button" 
                    onClick={() => setShowSatuanSheet(false)} 
                    className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-3 max-h-[40vh] overflow-y-auto no-scrollbar">
                  {["kg", "meter", "pc", "set", "m²", "cm²", "km"].map((unit) => {
                    const isSelected = newServType === unit;
                    return (
                      <button
                        type="button"
                        key={unit}
                        onClick={() => {
                          setNewServType(unit);
                          setShowSatuanSheet(false);
                        }}
                        className={`w-full text-left py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                          isSelected ? "bg-sky-500/10 text-sky-400 font-bold" : "text-zinc-300 hover:bg-zinc-800/45"
                        }`}
                      >
                        <span>{unit}</span>
                        {isSelected && <Check className="w-4 h-4 text-sky-400 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Sheet Modal for Categories */}
          {showKategoriSheet && (
            <div className="fixed inset-0 bg-black/80 z-60 flex items-end justify-center animate-fade-in font-sans">
              <div className="w-full max-w-[430px] bg-[#121214] border-t border-zinc-800 rounded-t-3xl overflow-hidden animate-slide-up">
                <div className="px-5 py-4 border-b border-zinc-900 flex items-center justify-between bg-[#121214]">
                  <span className="text-sm font-bold text-white">Pilih Kategori</span>
                  <button 
                    type="button" 
                    onClick={() => setShowKategoriSheet(false)} 
                    className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-3 max-h-[40vh] overflow-y-auto no-scrollbar space-y-2">
                  {categoryList.map((cat) => {
                    const isSelected = newServCategory === cat;
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => {
                          setNewServCategory(cat);
                          setShowKategoriSheet(false);
                        }}
                        className={`w-full text-left py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                          isSelected ? "bg-sky-500/10 text-sky-400 font-bold" : "text-zinc-300 hover:bg-zinc-800/45"
                        }`}
                      >
                        <span>{cat}</span>
                        {isSelected && <Check className="w-4 h-4 text-sky-400 stroke-[3]" />}
                      </button>
                    );
                  })}

                  {isAddingCategoryInline ? (
                    <div className="border border-zinc-800 bg-zinc-950/40 rounded-xl p-3.5 space-y-2.5 mt-2">
                      <input
                        type="text"
                        placeholder="Nama kategori baru"
                        value={tempCategoryNama}
                        onChange={(e) => setTempCategoryNama(e.target.value)}
                        className="w-full text-xs font-semibold bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white focus:outline-none focus:border-sky-500"
                        id="customCategoryInput"
                      />
                      <div className="flex justify-end gap-1.5 text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = tempCategoryNama.trim();
                            if (trimmed) {
                              if (!categoryList.includes(trimmed)) {
                                setCategoryList(prev => [...prev, trimmed]);
                              }
                              setNewServCategory(trimmed);
                              setTempCategoryNama("");
                              setIsAddingCategoryInline(false);
                              setShowKategoriSheet(false);
                            }
                          }}
                          className="px-3.5 py-1.5 bg-emerald-500 text-black rounded-lg cursor-pointer"
                        >
                          Tambah
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingCategoryInline(false)}
                          className="px-3.5 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCategoryInline(true);
                        setTempCategoryNama("");
                      }}
                      className="w-full py-3 bg-[#0284c7] hover:bg-sky-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 uppercase tracking-wide mt-2"
                    >
                      Tambah Kategori
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Sheet Modal for Duration units (Jam, Hari) */}
          {showDurasiTipeSheet && (
            <div className="fixed inset-0 bg-black/80 z-60 flex items-end justify-center animate-fade-in font-sans">
              <div className="w-full max-w-[430px] bg-[#121214] border-t border-zinc-800 rounded-t-3xl overflow-hidden animate-slide-up">
                <div className="px-5 py-4 border-b border-zinc-900 flex items-center justify-between bg-[#121214]">
                  <span className="text-sm font-bold text-white">Pilih Durasi Satuan</span>
                  <button 
                    type="button" 
                    onClick={() => setShowDurasiTipeSheet(false)} 
                    className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-3">
                  {["Jam", "Hari"].map((t) => {
                    const isSelected = newServDurationTipe === t;
                    return (
                      <button
                        type="button"
                        key={t}
                        onClick={() => {
                          setNewServDurationTipe(t as any);
                          setShowDurasiTipeSheet(false);
                        }}
                        className={`w-full text-left py-3.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                          isSelected ? "bg-sky-500/10 text-sky-400 font-bold" : "text-zinc-300 hover:bg-zinc-800/45"
                        }`}
                      >
                        <span>{t}</span>
                        {isSelected && <Check className="w-4 h-4 text-sky-400 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* MODAL MOCK PRINTER BLUEBLUETOOTH BLUETOOTH */}
      {printingTrx && (
        <div className="absolute inset-0 bg-black/95 z-55 flex flex-col justify-between p-6 overflow-y-auto animate-fade-in font-sans">
          <div className="border-b border-zinc-900 pb-3 flex items-center gap-2 text-left">
            <Smartphone className="w-4 h-4 text-emerald-500 animate-bounce" />
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">KONEKSI PRINTER PORTABLE BLUETOOTH</h4>
              <p className="text-[8.5px] text-zinc-500 font-bold uppercase mt-0.5">Mencetak nota thermal via Bluetooth RPP02N (58mm)</p>
            </div>
          </div>

          {/* Active printing progress */}
          {!isPrintFinished ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-3">
              <span className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              <p className="text-[10px] text-zinc-400 font-mono font-black uppercase tracking-widest animate-pulse">
                Mengirim paket cetak data {printingProgress}%...
              </p>
              <div className="w-40 h-2 bg-zinc-950 border border-zinc-900 rounded-none overflow-hidden">
                <div style={{ width: `${printingProgress}%` }} className="h-full bg-emerald-500 transition-all duration-300" />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-4 space-y-4">
              {/* POS Thermal simulation layout */}
              <div className="w-[240px] bg-white text-black p-4 font-mono text-[9px] border-b-4 border-dashed border-zinc-400 text-left leading-normal shadow-2xl relative select-text selection:bg-emerald-250">
                <div className="text-center font-black space-y-0.5 mb-2 border-b border-dashed border-black pb-2">
                  <span className="block text-xs uppercase tracking-tight">DAMDAM LAUNDRY</span>
                  <span className="block text-[7.5px] font-bold">Jl. Damai Raya No. 42, Sleman</span>
                  <span className="block text-[7.5px] font-bold">Telp: 0812-3456-789</span>
                </div>

                <div className="space-y-0.5 border-b border-dashed border-black pb-2 mb-2">
                  <p>Nota: <span className="font-bold">{printingTrx.id}</span></p>
                  <p>Syaf: Admin Utama</p>
                  <p>Cust: <span className="font-bold">{printingTrx.customerName}</span></p>
                  <p>Telp: {printingTrx.customerPhone}</p>
                  <p>Masuk: {printingTrx.tanggalMasuk}</p>
                </div>

                <div className="space-y-1 mb-2">
                  <div className="flex justify-between items-start font-bold">
                    <span>{printingTrx.layananNama}</span>
                  </div>
                  <div className="flex justify-between pl-2">
                    <span>{printingTrx.berat} x {formatIDR(printingTrx.totalHarga / printingTrx.berat)}</span>
                    <span>{formatIDR(printingTrx.totalHarga)}</span>
                  </div>
                  {printingTrx.parfum && (
                    <p className="pl-2 italic">&bull; Parfum: {printingTrx.parfum}</p>
                  )}
                  {printingTrx.notes && (
                    <p className="pl-2 italic text-[8px]">&bull; Catatan: {printingTrx.notes}</p>
                  )}
                </div>

                <div className="border-t border-dashed border-black pt-2 space-y-0.5 border-b mb-2 pb-2">
                  <div className="flex justify-between font-black text-[10px]">
                    <span>TOTAL TAGIHAN:</span>
                    <span>{formatIDR(printingTrx.totalHarga)}</span>
                  </div>
                  <div className="flex justify-between text-[8px]">
                    <span>Status Bayar:</span>
                    <span className="font-bold uppercase">{printingTrx.statusBayar}</span>
                  </div>
                  <div className="flex justify-between text-[8px]">
                    <span>Metode:</span>
                    <span>{printingTrx.pembayaranMetode}</span>
                  </div>
                  <div className="flex justify-between text-[8.5px] font-bold">
                    <span>Estimasi Selesai:</span>
                    <span>{printingTrx.estimasiSelesai}</span>
                  </div>
                </div>

                <div className="text-center font-bold text-[8px] pt-1">
                  <p>TERIMA KASIH ATAS KUNJUNGANNYA</p>
                  <p>Pekat Bersih, Hidup Berkah!</p>
                </div>
              </div>

              <div className="text-center space-y-1">
                <span className="inline-flex bg-emerald-950 text-emerald-400 border border-emerald-900 font-bold px-2.5 py-1 text-[9px] uppercase tracking-wider items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Cetak ke Bluetooth Berhasil!
                </span>
                <p className="text-[8.5px] text-zinc-500 font-bold uppercase tracking-wide">Handshake Bluetooth selesai RPP02N (58mm)</p>
              </div>
            </div>
          )}

          <button
            onClick={() => setPrintingTrx(null)}
            className="w-full mt-3 py-3 bg-emerald-500 hover:bg-emerald-450 text-black text-xs font-black tracking-widest uppercase rounded-none transition shadow-md"
          >
            KEMBALI KE NOTA
          </button>
        </div>
      )}

      {/* DIALOG D: CHOOSE CUSTOMER BOTTOM SHEET - MATCHES SCREENSHOT 2 */}
      {isSelectingCustBottomSheet && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xs z-55 flex flex-col justify-end p-0 font-sans">
          <div 
            className="absolute inset-0" 
            onClick={() => setIsSelectingCustBottomSheet(false)}
          />

          <div className="w-full max-w-[420px] mx-auto bg-[#121214] border-t border-[#27272A] rounded-t-2xl shadow-2xl relative z-10 flex flex-col max-h-[85vh] overflow-hidden text-left pb-6">
            
            <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto my-3 shrink-0" />

            <div className="px-5 pb-3 flex items-center justify-between border-b border-zinc-900/60 shrink-0">
              <h4 className="text-base font-bold text-white text-center w-full relative">
                Pilih Pelanggan
                <button 
                  type="button"
                  onClick={() => setIsSelectingCustBottomSheet(false)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </h4>
            </div>

            {/* Search Input Container */}
            <div className="p-4 shrink-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari nama pelanggan"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  className="w-full bg-[#1C1C1E] border border-zinc-850 rounded-xl px-4 py-3 pl-11 text-xs text-zinc-100 placeholder:text-zinc-650 focus:outline-none focus:border-sky-500 font-medium"
                />
                <Search className="w-4 h-4 text-zinc-650 absolute left-4 top-3.5" />
                {customerSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCustomerSearchQuery("")}
                    className="absolute right-4 top-3.5 text-zinc-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Customer List Area */}
            <div className="flex-1 overflow-y-auto px-5 divide-y divide-zinc-900/60 no-scrollbar">
              {(() => {
                const results = customers.filter(c => 
                  c.nama.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                  c.telepon.includes(customerSearchQuery)
                );

                if (results.length === 0) {
                  return (
                    <div className="py-12 text-center text-zinc-500 font-semibold text-xs uppercase tracking-wider">
                      Tidak ada pelanggan ditemukan
                    </div>
                  );
                }

                return results.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCustId(c.id);
                      setIsSelectingCustBottomSheet(false);
                    }}
                    className="w-full text-left py-4 px-2 hover:bg-zinc-900/40 text-xs font-semibold text-zinc-300 hover:text-white flex justify-between items-center transition"
                  >
                    <span>
                      {c.panggilan ? `${c.panggilan} ` : ""}{c.nama}{" "}
                      <span className="text-zinc-500 font-medium ml-1">({c.telepon})</span>
                    </span>
                    {selectedCustId === c.id && (
                      <Check className="w-4 h-4 text-sky-450 stroke-[3px]" />
                    )}
                  </button>
                ));
              })()}
            </div>

            {/* Blue Add Customer Action Button exactly as screenshot 2 */}
            <div className="px-5 pt-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsSelectingCustBottomSheet(false);
                  setIsCreatingCust(true);
                }}
                className="w-full py-4 bg-[#0284c7] hover:bg-sky-500 text-white font-bold text-[13px] rounded-xl cursor-pointer active:scale-95 transition-all text-center uppercase tracking-wide"
              >
                Tambah Pelanggan
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

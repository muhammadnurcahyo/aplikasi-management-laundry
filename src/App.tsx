import React, { useState, useEffect } from "react";
import { MobileFrame } from "./components/MobileFrame";
import { DashboardHome } from "./components/DashboardHome";
import { ExpenseForm } from "./components/ExpenseForm";
import { ExpenseHistory } from "./components/ExpenseHistory";
import { AiAssistant } from "./components/AiAssistant";
import { LaundryDashboard } from "./components/LaundryDashboard";
import { LaundryTransactions } from "./components/LaundryTransactions";
import { Expense, CategorySpec, Karyawan, Customer, Service, LaundryTransaction } from "./types";
import { INITIAL_BUDGET_LIMIT, PREDEFINED_CATEGORIES, SAMPLE_EXPENSES } from "./data";
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Bot, 
  Smartphone, 
  Copy, 
  Check, 
  Database, 
  LogOut,
  Users,
  FileText,
  Receipt,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  Save,
  AlertTriangle,
  ArrowLeft,
  Pin,
  MoreVertical,
  ArrowUpDown,
  Download
} from "lucide-react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User 
} from "firebase/auth";
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs, 
  writeBatch,
  collectionGroup,
  query,
  where,
  deleteField
} from "firebase/firestore";
import { 
  auth, 
  db, 
  googleProvider, 
  handleFirestoreError, 
  OperationType 
} from "./firebase";
import { KaryawanDashboard } from "./components/KaryawanDashboard";
import { OwnerKaryawanPanel } from "./components/OwnerKaryawanPanel";

export default function App() {
  // Authentication & Sync State Indicators
  const [user, setUser] = useState<User | null>(null);
  const [loggedInAdmin, setLoggedInAdmin] = useState<{ id: string; nama: string; username: string; ownerId: string } | null>(() => {
    const saved = localStorage.getItem("damdam_logged_admin");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error(err);
      }
    }
    return null;
  });
  const currentOwnerId = user ? user.uid : (loggedInAdmin ? loggedInAdmin.ownerId : null);
  
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Global States (Defaulting to basic or empty lists, populated by sync/localStorage)
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Laundry POS States
  const [transactions, setTransactions] = useState<LaundryTransaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [dashboardSubTab, setDashboardSubTab] = useState<string>("home");
  const [expensePanelTab, setExpensePanelTab] = useState<string>("ringkasan");
  
  // Direct triggers for fast operations
  const [directOpenCreateTrx, setDirectOpenCreateTrx] = useState<boolean>(false);
  const [directOpenCreateCust, setDirectOpenCreateCust] = useState<boolean>(false);
  const [directOpenCreateServ, setDirectOpenCreateServ] = useState<boolean>(false);

  // Service Subtab CRUD state
  const [searchServiceQuery, setSearchServiceQuery] = useState<string>("");
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isCreatingServiceInSubtab, setIsCreatingServiceInSubtab] = useState<boolean>(false);

  // Service form states (shared/controlled for both Add and Edit inside the subtab)
  const [subtrackServName, setSubtrackServName] = useState<string>("");
  const [subtrackServType, setSubtrackServType] = useState<string>("Kiloan");
  const [subtrackServPrice, setSubtrackServPrice] = useState<number>(0);
  const [subtrackServDurationValue, setSubtrackServDurationValue] = useState<number>(24);
  const [subtrackServDurationTipe, setSubtrackServDurationTipe] = useState<"Jam" | "Hari">("Hari");
  const [subtrackServProses, setSubtrackServProses] = useState<string[]>(["Cuci", "Pengeringan"]);
  const [subtrackServMinQty, setSubtrackServMinQty] = useState<number>(1);
  const [subtrackServCategory, setSubtrackServCategory] = useState<string>("Kiloan");
  const [subtrackServSematkan, setSubtrackServSematkan] = useState<boolean>(false);

  // New states for the revamped design
  const [serviceSubSubTab, setServiceSubSubTab] = useState<"layanan" | "kategori">("layanan");
  const [selectedCategoryChip, setSelectedCategoryChip] = useState<string>("Semua");
  const [serviceSort, setServiceSort] = useState<'nama-asc' | 'harga-asc' | 'harga-desc'>('nama-asc');
  const [selectedServiceForAction, setSelectedServiceForAction] = useState<Service | null>(null);
  const [showServiceActionBottomSheet, setShowServiceActionBottomSheet] = useState<boolean>(false);
  const [customServiceCategories, setCustomServiceCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem("damdam_service_categories");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return ["Express", "Reguler", "Kilat", "Tanpa Kategori"];
  });

  useEffect(() => {
    localStorage.setItem("damdam_service_categories", JSON.stringify(customServiceCategories));
  }, [customServiceCategories]);
  const [newServiceCategoryInput, setNewServiceCategoryInput] = useState<string>("");
  const [editingServiceCategoryIndex, setEditingServiceCategoryIndex] = useState<number | null>(null);
  const [editingServiceCategoryValue, setEditingServiceCategoryValue] = useState<string>("");
  const [showGeneralServiceBottomSheet, setShowGeneralServiceBottomSheet] = useState<boolean>(false);

  // Load offline local storage laundry states for guests
  useEffect(() => {
    if (!user && !loggedInAdmin) {
      const savedTrx = localStorage.getItem("damdam_transactions");
      if (savedTrx) {
        try { setTransactions(JSON.parse(savedTrx)); } catch(e) { console.error(e); }
      } else {
        const defaultTrx: LaundryTransaction[] = [
          {
            id: "TRX-101",
            customerName: "Mas Bagus",
            customerPhone: "08123456789",
            layananId: "serv-reg",
            layananNama: "Cuci Setrika Reguler",
            parfum: "Lavender",
            berat: 5,
            totalHarga: 35000,
            status: "Proses",
            statusBayar: "Belum Lunas",
            pembayaranMetode: "Tunai",
            tanggalMasuk: new Date(Date.now() - 3600000 * 4).toISOString().replace("T", " ").substring(0, 16),
            estimasiSelesai: new Date(Date.now() + 3600000 * 44).toISOString().replace("T", " ").substring(0, 16),
            userId: "guest"
          },
          {
            id: "TRX-102",
            customerName: "Ibu Laili",
            customerPhone: "08567891234",
            layananId: "serv-exp",
            layananNama: "Cuci Setrika Express",
            parfum: "Sakura",
            berat: 2,
            totalHarga: 22000,
            status: "Antrian",
            statusBayar: "Belum Lunas",
            pembayaranMetode: "QRIS",
            tanggalMasuk: new Date(Date.now() - 3600000 * 2).toISOString().replace("T", " ").substring(0, 16),
            estimasiSelesai: new Date(Date.now() + 3600000 * 22).toISOString().replace("T", " ").substring(0, 16),
            userId: "guest"
          },
          {
            id: "TRX-103",
            customerName: "Mbak Fitri",
            customerPhone: "08987654321",
            layananId: "serv-bed",
            layananNama: "Cuci Bedcover Besar",
            parfum: "Lily",
            berat: 1,
            totalHarga: 25000,
            status: "Selesai",
            statusBayar: "Lunas",
            pembayaranMetode: "Transfer",
            tanggalMasuk: new Date(Date.now() - 3600000 * 24).toISOString().replace("T", " ").substring(0, 16),
            estimasiSelesai: new Date(Date.now() - 3600000 * 2).toISOString().replace("T", " ").substring(0, 16),
            tanggalSelesai: new Date(Date.now() - 3600000 * 3).toISOString().replace("T", " ").substring(0, 16),
            userId: "guest"
          }
        ];
        setTransactions(defaultTrx);
        localStorage.setItem("damdam_transactions", JSON.stringify(defaultTrx));
      }
    }
  }, [user, loggedInAdmin]);

  useEffect(() => {
    if (!user && !loggedInAdmin) {
      const savedCust = localStorage.getItem("damdam_customers");
      if (savedCust) {
        try { setCustomers(JSON.parse(savedCust)); } catch(e) { console.error(e); }
      } else {
        const defaultCust: Customer[] = [
          { id: "CUST-001", nama: "Mas Bagus", telepon: "08123456789", alamat: "Sleman, Yogyakarta", userId: "guest", createdAt: new Date().toISOString() },
          { id: "CUST-002", nama: "Ibu Laili", telepon: "08567891234", alamat: "Depok, Sleman", userId: "guest", createdAt: new Date().toISOString() },
          { id: "CUST-003", nama: "Mbak Fitri", telepon: "08987654321", alamat: "Gejayan, Sleman", userId: "guest", createdAt: new Date().toISOString() }
        ];
        setCustomers(defaultCust);
        localStorage.setItem("damdam_customers", JSON.stringify(defaultCust));
      }
    }
  }, [user, loggedInAdmin]);

  useEffect(() => {
    if (!user && !loggedInAdmin) {
      const savedServ = localStorage.getItem("damdam_services");
      if (savedServ) {
        try { setServices(JSON.parse(savedServ)); } catch(e) { console.error(e); }
      } else {
        const defaultServ: Service[] = [
          { id: "serv-bed-jumbo", nama: "1 Set Bed Cover Tebal Jumbo", tipe: "Satuan", harga: 70000, durasiJam: 72, proses: ["Cuci", "Pengeringan"], minimalKuantitas: 1, kategori: "Reguler", sematkan: true, userId: "guest" },
          { id: "serv-kaos-ab", nama: "1 Set Kaos Atas Bawah", tipe: "Satuan", harga: 25000, durasiJam: 4, proses: ["Cuci", "Pengeringan", "Setrika"], minimalKuantitas: 1, kategori: "Express", sematkan: true, userId: "guest" },
          { id: "serv-mukena", nama: "1 Set Mukena", tipe: "Satuan", harga: 10000, durasiJam: 48, proses: ["Cuci", "Pengeringan", "Setrika"], minimalKuantitas: 1, kategori: "Reguler", sematkan: true, userId: "guest" },
          { id: "serv-seprei-besar", nama: "1 Set Seprei Besar", tipe: "Satuan", harga: 25500, durasiJam: 72, proses: ["Cuci", "Pengeringan", "Setrika"], minimalKuantitas: 1, kategori: "Reguler", sematkan: true, userId: "guest" },
          { id: "serv-bed-seprei", nama: "1 Set Seprei Besar Dan Bed Cover Besar", tipe: "Satuan", harga: 50000, durasiJam: 72, proses: ["Cuci", "Pengeringan"], minimalKuantitas: 1, kategori: "Reguler", sematkan: true, userId: "guest" },
          { id: "serv-reg", nama: "Cuci Setrika Reguler", tipe: "Kiloan", harga: 7000, durasiJam: 48, proses: ["Cuci", "Setrika"], minimalKuantitas: 1, kategori: "Reguler", sematkan: false, userId: "guest" },
          { id: "serv-exp", nama: "Cuci Setrika Express", tipe: "Kiloan", harga: 11000, durasiJam: 24, proses: ["Cuci", "Setrika"], minimalKuantitas: 1, kategori: "Express", sematkan: false, userId: "guest" }
        ];
        setServices(defaultServ);
        localStorage.setItem("damdam_services", JSON.stringify(defaultServ));
      }
    }
  }, [user, loggedInAdmin]);

  // Sync back to local offline storage when in guest mode
  useEffect(() => {
    if (!user && !loggedInAdmin && transactions.length > 0) {
      localStorage.setItem("damdam_transactions", JSON.stringify(transactions));
    }
  }, [transactions, user, loggedInAdmin]);

  useEffect(() => {
    if (!user && !loggedInAdmin && customers.length > 0) {
      localStorage.setItem("damdam_customers", JSON.stringify(customers));
    }
  }, [customers, user, loggedInAdmin]);

  useEffect(() => {
    if (!user && !loggedInAdmin && services.length > 0) {
      localStorage.setItem("damdam_services", JSON.stringify(services));
    }
  }, [services, user, loggedInAdmin]);

  const [categories, setCategories] = useState<Record<string, CategorySpec>>(() => {
    const saved = localStorage.getItem("laundrosave_categories_clean_v2");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error(err);
      }
    }
    return {
      "Lain-lain": {
        name: "Lain-lain",
        color: "#a1a1aa",
        bgColor: "bg-[#18181b] text-[#e4e4e7] border-[#27272a]",
        icon: "Coins"
      }
    };
  });

  const [budgetLimit, setBudgetLimit] = useState<number>(() => {
    const saved = localStorage.getItem("laundrosave_budget_limit");
    if (saved) {
      const parsed = Number(saved);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return INITIAL_BUDGET_LIMIT;
  });

  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [loggedInKaryawan, setLoggedInKaryawan] = useState<Karyawan | null>(() => {
    const saved = localStorage.getItem("damdam_logged_karyawan");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error(err);
      }
    }
    return null;
  });

  const [portalTab, setPortalTab] = useState<"owner" | "admin" | "karyawan">("owner");
  const [loginId, setLoginId] = useState<string>("");
  const [loginUser, setLoginUser] = useState<string>("");
  const [loginPass, setLoginPass] = useState<string>("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [isGuestSession, setIsGuestSession] = useState<boolean>(() => {
    return localStorage.getItem("damdam_is_guest") === "true";
  });

  const [showMobileModal, setShowMobileModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const sharedUrl = "https://ais-pre-wotufd5mmddfkfc5g2nq3e-698394579071.asia-southeast1.run.app";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sharedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Custom dialog confirmation state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void | Promise<void>;
    isDangerous?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const triggerConfirm = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    isDangerous: boolean = false,
    confirmText: string = "YA, PROSES",
    cancelText: string = "BATAL"
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        await onConfirm();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
      isDangerous,
      confirmText,
      cancelText
    });
  };

  // Auth observer and initial data sync
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        setIsSyncing(true);
        setSyncError(null);
        try {
          // Save user record to users/{userId} so that the document physically exists in Firestore
          const userPath = `users/${currentUser.uid}`;
          try {
            await setDoc(doc(db, "users", currentUser.uid), {
              uid: currentUser.uid,
              email: currentUser.email || "",
              displayName: currentUser.displayName || "",
              photoURL: currentUser.photoURL || "",
              lastActive: new Date().toISOString()
            }, { merge: true });
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, userPath);
          }

          // Check if remote data exists
          const expenseCol = collection(db, "users", currentUser.uid, "expenses");
          const catCol = collection(db, "users", currentUser.uid, "categories");

          const expenseSnap = await getDocs(expenseCol);
          const catSnap = await getDocs(catCol);

          // Highly resilient granular cloud migration:
          // Sync each collection separately if they don't have records in Firestore yet.
          const batch = writeBatch(db);
          let writeCount = 0;

          if (catSnap.empty) {
            // Fetch local categories (from state/localStorage) or defaults
            const localCats = Object.keys(categories).length > 0 ? categories : PREDEFINED_CATEGORIES;
            for (const [key, val] of Object.entries(localCats)) {
              const catRef = doc(db, "users", currentUser.uid, "categories", key);
              const valSpec = val as CategorySpec;
              batch.set(catRef, {
                name: valSpec.name || key,
                color: valSpec.color || "#10b981",
                bgColor: valSpec.bgColor || "bg-[#062419] text-[#10b981] border-[#10b981]/30",
                icon: valSpec.icon || "Tag",
                userId: currentUser.uid
              });
              writeCount++;
            }
          }

          if (expenseSnap.empty) {
            // Fetch local expenses in memory
            const localSavedExp = localStorage.getItem("laundrosave_expenses_clean_v2");
            const localExpensesArray: Expense[] = localSavedExp ? JSON.parse(localSavedExp) : [];
            const uploadList = localExpensesArray.length > 0 ? localExpensesArray : expenses;

            for (const exp of uploadList) {
              const expRef = doc(db, "users", currentUser.uid, "expenses", exp.id);
              batch.set(expRef, {
                id: exp.id,
                title: exp.title,
                amount: typeof exp.amount === "number" ? exp.amount : 0,
                category: exp.category,
                date: exp.date,
                paymentMethod: exp.paymentMethod,
                notes: exp.notes || "",
                userId: currentUser.uid
              });
              writeCount++;
            }
          }

          // Verify if settings document is present
          try {
            const settingsCol = collection(db, "users", currentUser.uid, "settings");
            const settingsSnap = await getDocs(settingsCol);
            if (settingsSnap.empty) {
              const budgetRef = doc(db, "users", currentUser.uid, "settings", "budget");
              batch.set(budgetRef, { limit: budgetLimit });
              writeCount++;
            }
          } catch (e) {
            console.warn("Ignored budget check error", e);
          }

          if (writeCount > 0) {
            await batch.commit();
          }

          // Initial check for remote laundry services, customers, and transactions
          try {
            const trCol = collection(db, "users", currentUser.uid, "transactions");
            const cuCol = collection(db, "users", currentUser.uid, "customers");
            const seCol = collection(db, "users", currentUser.uid, "services");

            const trSnap = await getDocs(trCol);
            const cuSnap = await getDocs(cuCol);
            const seSnap = await getDocs(seCol);

            const lBatch = writeBatch(db);
            let laundryWrites = 0;

            if (seSnap.empty) {
              const defaultServ = [
                { id: "serv-bed-jumbo", nama: "1 Set Bed Cover Tebal Jumbo", tipe: "Satuan", harga: 70000, durasiJam: 72, proses: ["Cuci", "Pengeringan"], minimalKuantitas: 1, kategori: "Reguler", sematkan: true, userId: currentUser.uid },
                { id: "serv-kaos-ab", nama: "1 Set Kaos Atas Bawah", tipe: "Satuan", harga: 25000, durasiJam: 4, proses: ["Cuci", "Pengeringan", "Setrika"], minimalKuantitas: 1, kategori: "Express", sematkan: true, userId: currentUser.uid },
                { id: "serv-mukena", nama: "1 Set Mukena", tipe: "Satuan", harga: 10000, durasiJam: 48, proses: ["Cuci", "Pengeringan", "Setrika"], minimalKuantitas: 1, kategori: "Reguler", sematkan: true, userId: currentUser.uid },
                { id: "serv-seprei-besar", nama: "1 Set Seprei Besar", tipe: "Satuan", harga: 25500, durasiJam: 72, proses: ["Cuci", "Pengeringan", "Setrika"], minimalKuantitas: 1, kategori: "Reguler", sematkan: true, userId: currentUser.uid },
                { id: "serv-bed-seprei", nama: "1 Set Seprei Besar Dan Bed Cover Besar", tipe: "Satuan", harga: 50000, durasiJam: 72, proses: ["Cuci", "Pengeringan"], minimalKuantitas: 1, kategori: "Reguler", sematkan: true, userId: currentUser.uid },
                { id: "serv-reg", nama: "Cuci Setrika Reguler", tipe: "Kiloan", harga: 7000, durasiJam: 48, proses: ["Cuci", "Setrika"], minimalKuantitas: 1, kategori: "Reguler", sematkan: false, userId: currentUser.uid },
                { id: "serv-exp", nama: "Cuci Setrika Express", tipe: "Kiloan", harga: 11000, durasiJam: 24, proses: ["Cuci", "Setrika"], minimalKuantitas: 1, kategori: "Express", sematkan: false, userId: currentUser.uid }
              ];
              for (const s of defaultServ) {
                lBatch.set(doc(db, "users", currentUser.uid, "services", s.id), s);
                laundryWrites++;
              }
            }

            if (cuSnap.empty) {
              const defaultCust = [
                { id: "CUST-001", nama: "Mas Bagus", telepon: "08123456789", alamat: "Sleman, Yogyakarta", userId: currentUser.uid, createdAt: new Date().toISOString() },
                { id: "CUST-002", nama: "Ibu Laili", telepon: "08567891234", alamat: "Depok, Sleman", userId: currentUser.uid, createdAt: new Date().toISOString() }
              ];
              for (const c of defaultCust) {
                lBatch.set(doc(db, "users", currentUser.uid, "customers", c.id), c);
                laundryWrites++;
              }
            }

            if (trSnap.empty) {
              const defaultTrx = [
                {
                  id: "TRX-101",
                  customerName: "Mas Bagus",
                  customerPhone: "08123456789",
                  layananId: "serv-reg",
                  layananNama: "Cuci Setrika Reguler",
                  parfum: "Lavender",
                  berat: 5,
                  totalHarga: 35000,
                  status: "Proses",
                  statusBayar: "Belum Lunas",
                  pembayaranMetode: "Tunai",
                  tanggalMasuk: new Date(Date.now() - 3600000 * 4).toISOString().replace("T", " ").substring(0, 16),
                  estimasiSelesai: new Date(Date.now() + 3600000 * 44).toISOString().replace("T", " ").substring(0, 16),
                  userId: currentUser.uid
                }
              ];
              for (const t of defaultTrx) {
                lBatch.set(doc(db, "users", currentUser.uid, "transactions", t.id), t);
                laundryWrites++;
              }
            }

            if (laundryWrites > 0) {
              await lBatch.commit();
            }
          } catch (e) {
            console.warn("Ignored default laundry data initialization error", e);
          }
        } catch (error) {
          console.error("Cloud data initialization sync failure:", error);
          setSyncError(error instanceof Error ? error.message : String(error));
        } finally {
          setIsSyncing(false);
        }
      } else {
        // If logged out / guest Mode: load from local storage
        const savedAdmin = localStorage.getItem("damdam_logged_admin");
        if (!savedAdmin) {
          const savedExpenses = localStorage.getItem("laundrosave_expenses_clean_v2");
          if (savedExpenses) {
            try {
              setExpenses(JSON.parse(savedExpenses));
            } catch (e) {
              console.error(e);
            }
          } else {
            setExpenses([]);
          }
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Real-time listen: Expenses (Active when logged in as Owner or Admin)
  useEffect(() => {
    if (!currentOwnerId) return;

    const path = `users/${currentOwnerId}/expenses`;
    const unsubscribeExpenses = onSnapshot(
      collection(db, "users", currentOwnerId, "expenses"),
      (snapshot) => {
        const list: Expense[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Expense);
        });
        // Sort descending by date
        list.sort((a, b) => b.date.localeCompare(a.date));
        setExpenses(list);
      },
      (error) => {
        console.error("Firestore listen expenses error:", error);
        setSyncError(`Gagal membaca daftar pengeluaran disk: ${error.message}`);
      }
    );

    return () => unsubscribeExpenses();
  }, [currentOwnerId]);

  // Real-time listen: Categories (Active when logged in as Owner or Admin)
  useEffect(() => {
    if (!currentOwnerId) return;

    const path = `users/${currentOwnerId}/categories`;
    const unsubscribeCategories = onSnapshot(
      collection(db, "users", currentOwnerId, "categories"),
      (snapshot) => {
        const items: Record<string, CategorySpec> = {};
        snapshot.forEach((d) => {
          const cat = d.data() as CategorySpec;
          items[cat.name] = cat;
        });
        if (Object.keys(items).length > 0) {
          setCategories(items);
        }
      },
      (error) => {
        console.error("Firestore listen categories error:", error);
        setSyncError(`Gagal membaca daftar kategori disk: ${error.message}`);
      }
    );

    return () => unsubscribeCategories();
  }, [currentOwnerId]);

  // Real-time listen: Budget settings doc (Active when logged in as Owner or Admin)
  useEffect(() => {
    if (!currentOwnerId) return;

    const path = `users/${currentOwnerId}/settings/budget`;
    const unsubscribeBudget = onSnapshot(
      doc(db, "users", currentOwnerId, "settings", "budget"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && typeof data.limit === "number") {
            setBudgetLimit(data.limit);
          }
        }
      },
      (error) => {
        console.error("Firestore listen budget error:", error);
        setSyncError(`Gagal membaca budget limit disk: ${error.message}`);
      }
    );

    return () => unsubscribeBudget();
  }, [currentOwnerId]);

  // Real-time listen: Laundry Transactions (Active when logged in as Owner or Admin)
  useEffect(() => {
    if (!currentOwnerId) return;

    const unsubscribeTransactions = onSnapshot(
      collection(db, "users", currentOwnerId, "transactions"),
      (snapshot) => {
        const list: LaundryTransaction[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as LaundryTransaction);
        });
        // Sort descending by tanggalMasuk
        list.sort((a, b) => b.tanggalMasuk.localeCompare(a.tanggalMasuk));
        setTransactions(list);
      },
      (error) => {
        console.error("Firestore listen transactions error:", error);
        setSyncError(`Gagal membaca daftar transaksi laundry disk: ${error.message}`);
      }
    );

    return () => unsubscribeTransactions();
  }, [currentOwnerId]);

  // Real-time listen: Laundry Customers (Active when logged in as Owner or Admin)
  useEffect(() => {
    if (!currentOwnerId) return;

    const unsubscribeCustomers = onSnapshot(
      collection(db, "users", currentOwnerId, "customers"),
      (snapshot) => {
        const list: Customer[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Customer);
        });
        // Sort descending by createdAt
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setCustomers(list);
      },
      (error) => {
        console.error("Firestore listen customers error:", error);
        setSyncError(`Gagal membaca daftar pelanggan disk: ${error.message}`);
      }
    );

    return () => unsubscribeCustomers();
  }, [currentOwnerId]);

  // Real-time listen: Laundry Services (Active when logged in as Owner or Admin)
  useEffect(() => {
    if (!currentOwnerId) return;

    const unsubscribeServices = onSnapshot(
      collection(db, "users", currentOwnerId, "services"),
      (snapshot) => {
        const list: Service[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Service);
        });
        setServices(list);
      },
      (error) => {
        console.error("Firestore listen services error:", error);
        setSyncError(`Gagal membaca daftar layanan laundry disk: ${error.message}`);
      }
    );

    return () => unsubscribeServices();
  }, [currentOwnerId]);

  // Auto-migration to clean up separate category entries (like "Plastik 30", "Plastik 35") and group them under the main "Plastik" category.
  useEffect(() => {
    if (Object.keys(categories).length === 0) return;

    let hasChanges = false;
    const updatedCategories = { ...categories };
    const deletedCategoryKeys: string[] = [];

    // Ensure the main "Plastik" category exists in categories with correct metadata
    if (!updatedCategories["Plastik"]) {
      updatedCategories["Plastik"] = {
        name: "Plastik",
        color: "#d946ef", // fuchsia
        bgColor: "bg-[#2d0a33] text-[#d946ef] border-[#d946ef]/30",
        icon: "Package",
        subCategories: ["Plastik 30", "Plastik 35", "Plastik 40", "Plastik 45", "Plastik 50", "Plastik 60", "Plastik 100", "Plastik 150"]
      };
      hasChanges = true;
    }

    const sizes = ["30", "35", "40", "45", "50", "60", "100", "150"];
    const patternList = sizes.map(s => `plastik ${s}`);

    // If there are separate categories like "Plastik 30", "Plastik 35", remove them from categories list
    Object.keys(updatedCategories).forEach((key) => {
      if (key === "Plastik") return;
      const lowerKey = key.toLowerCase().trim();
      const isRedundantPlastic = patternList.some(p => lowerKey === p) || 
                                 lowerKey.startsWith("plastik ") || 
                                 /plastik\s*\d+/.test(lowerKey);
      if (isRedundantPlastic) {
        delete updatedCategories[key];
        deletedCategoryKeys.push(key);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setCategories(updatedCategories);
      localStorage.setItem("laundrosave_categories_clean_v2", JSON.stringify(updatedCategories));

      if (currentOwnerId) {
        const updateDb = async () => {
          try {
            const batch = writeBatch(db);
            // write/merge "Plastik" main category
            const pRef = doc(db, "users", currentOwnerId, "categories", "Plastik");
            batch.set(pRef, updatedCategories["Plastik"], { merge: true });

            // delete obsolete categories from Firestore
            deletedCategoryKeys.forEach((key) => {
              const obsoleteRef = doc(db, "users", currentOwnerId, "categories", key);
              batch.delete(obsoleteRef);
            });

            await batch.commit();
            console.log("Successfully migrated categories, merged into Plastik.");
          } catch (err) {
            console.error("Failed to migrate categories in Firestore:", err);
          }
        };
        updateDb();
      }
    }
  }, [categories, currentOwnerId]);

  // Auto-migration for expenses to map old categories (like "Plastik 30") to main category "Plastik" with respective subCategory
  useEffect(() => {
    if (expenses.length === 0) return;

    let hasChanges = false;
    const updatedExpenses = expenses.map((exp) => {
      const catTrim = exp.category.trim();
      const catLower = catTrim.toLowerCase();
      
      // If category is some "Plastik XX", change to main category "Plastik" and subCategory "Plastik XX"
      const match = catTrim.match(/^Plastik\s*(\d+)$/i);
      if (match) {
        hasChanges = true;
        const sizeNum = match[1];
        return {
          ...exp,
          category: "Plastik",
          subCategory: `Plastik ${sizeNum}`
        };
      } else if (catLower === "plastik" && !exp.subCategory) {
        return exp;
      }
      return exp;
    });

    if (hasChanges) {
      setExpenses(updatedExpenses);
      if (!user && !loggedInAdmin) {
        localStorage.setItem("laundrosave_expenses_clean_v2", JSON.stringify(updatedExpenses));
      }

      if (currentOwnerId) {
        const updateDb = async () => {
          try {
            const batch = writeBatch(db);
            updatedExpenses.forEach((exp) => {
              const originalExp = expenses.find((e) => e.id === exp.id);
              if (originalExp && (originalExp.category !== exp.category || originalExp.subCategory !== exp.subCategory)) {
                const docRef = doc(db, "users", currentOwnerId, "expenses", exp.id);
                batch.set(docRef, exp, { merge: true });
              }
            });
            await batch.commit();
            console.log("Successfully updated existing plastic expenses to main 'Plastik' category.");
          } catch (err) {
            console.error("Failed to migrate plastic expenses in Firestore:", err);
          }
        };
        updateDb();
      }
    }
  }, [expenses, currentOwnerId, user, loggedInAdmin]);

  // Sync back to local offline storage ONLY when user is offline (Guest mode)
  useEffect(() => {
    if (!user && !loggedInAdmin) {
      localStorage.setItem("laundrosave_expenses_clean_v2", JSON.stringify(expenses));
    }
  }, [expenses, user, loggedInAdmin]);

  useEffect(() => {
    if (!user && !loggedInAdmin) {
      localStorage.setItem("laundrosave_categories_clean_v2", JSON.stringify(categories));
    }
  }, [categories, user, loggedInAdmin]);

  useEffect(() => {
    if (!user && !loggedInAdmin) {
      localStorage.setItem("laundrosave_budget_limit", String(budgetLimit));
    }
  }, [budgetLimit, user, loggedInAdmin]);

  // Login handler
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      localStorage.removeItem("damdam_is_guest");
      setIsGuestSession(false);
    } catch (err) {
      console.error("Popup authentication failed:", err);
      alert("Sign-in gagal: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleKaryawanLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const q = query(
        collectionGroup(db, "karyawan"),
        where("username", "==", loginUser.trim().toLowerCase())
      );
      const snap = await getDocs(q);
      let found: Karyawan & { ownerId?: string } | null = null;

      snap.forEach((d) => {
        const item = d.data() as Karyawan;
        if (item.password === loginPass.trim()) {
          const parentDocRef = d.ref.parent.parent;
          const ownerId = parentDocRef ? parentDocRef.id : "";
          found = { ...item, ownerId };
        }
      });

      if (found) {
        setLoggedInKaryawan(found as Karyawan);
        localStorage.setItem("damdam_logged_karyawan", JSON.stringify(found));
        localStorage.removeItem("damdam_is_guest");
        setIsGuestSession(false);
        setLoginId("");
        setLoginUser("");
        setLoginPass("");
      } else {
        setLoginError("Username atau Password salah!");
      }
    } catch (err) {
      console.error(err);
      setLoginError("Gagal otentikasi. Pastikan koneksi internet aktif.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleKaryawanSignOut = () => {
    setLoggedInKaryawan(null);
    localStorage.removeItem("damdam_logged_karyawan");
    localStorage.removeItem("damdam_is_guest");
    setIsGuestSession(false);
    setActiveTab("dashboard");
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const q = query(
        collectionGroup(db, "admins"),
        where("username", "==", loginUser.trim().toLowerCase())
      );
      const snap = await getDocs(q);
      let found: { id: string; nama: string; username: string; ownerId: string } | null = null;

      snap.forEach((d) => {
        const item = d.data();
        if (item.password === loginPass.trim()) {
          const parentDocRef = d.ref.parent.parent;
          const ownerId = parentDocRef ? parentDocRef.id : "";
          found = {
            id: item.id,
            nama: item.nama,
            username: item.username,
            ownerId
          };
        }
      });

      if (found) {
        setLoggedInAdmin(found);
        localStorage.setItem("damdam_logged_admin", JSON.stringify(found));
        localStorage.removeItem("damdam_is_guest");
        setIsGuestSession(false);
        setLoginId("");
        setLoginUser("");
        setLoginPass("");
      } else {
        setLoginError("Username atau Password Admin salah!");
      }
    } catch (err) {
      console.error(err);
      setLoginError("Gagal otentikasi Admin. Pastikan koneksi internet aktif.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminSignOut = () => {
    setLoggedInAdmin(null);
    localStorage.removeItem("damdam_logged_admin");
    localStorage.removeItem("damdam_is_guest");
    setIsGuestSession(false);
    setActiveTab("dashboard");
  };

  // Sign out helper
  const handleSignOut = () => {
    triggerConfirm(
      "KELUAR SINKRONISASI CLOUD",
      "Apakah Anda yakin ingin keluar dari sinkronisasi database cloud? Anda akan dapat memilih atau berganti Akun Google lain saat masuk kembali.",
      async () => {
        try {
          await signOut(auth);
          setExpenses([]);
          setTransactions([]);
          setCustomers([]);
          setServices([]);
          setDashboardSubTab("home");
          setCategories({
            "Lain-lain": {
              name: "Lain-lain",
              color: "#a1a1aa",
              bgColor: "bg-[#18181b] text-[#e4e4e7] border-[#27272a]",
              icon: "Coins"
            }
          });
          setBudgetLimit(INITIAL_BUDGET_LIMIT);
          localStorage.removeItem("damdam_is_guest");
          setIsGuestSession(false);
        } catch (err) {
          console.error("Sign-out failed:", err);
        }
      },
      true,
      "KELUAR & GANTI AKUN",
      "BATAL"
    );
  };


  // Laundry POS CRUD Handlers
  const handleAddTransaction = async (newTrx: LaundryTransaction) => {
    if (currentOwnerId) {
      const path = `users/${currentOwnerId}/transactions/${newTrx.id}`;
      try {
        await setDoc(doc(db, "users", currentOwnerId, "transactions", newTrx.id), {
          ...newTrx,
          userId: currentOwnerId
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    } else {
      setTransactions((prev) => [newTrx, ...prev]);
    }
  };

  const handleUpdateTransaction = async (id: string, updates: Partial<LaundryTransaction>) => {
    if (currentOwnerId) {
      const path = `users/${currentOwnerId}/transactions/${id}`;
      try {
        await setDoc(doc(db, "users", currentOwnerId, "transactions", id), updates, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    } else {
      setTransactions((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (currentOwnerId) {
      const path = `users/${currentOwnerId}/transactions/${id}`;
      try {
        await deleteDoc(doc(db, "users", currentOwnerId, "transactions", id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    } else {
      setTransactions((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleAddCustomer = async (newCust: Customer) => {
    // Optimistic UI update: Instantly update local state so the user sees the new customer immediately
    setCustomers((prev) => [newCust, ...prev.filter(c => c.id !== newCust.id)]);

    if (currentOwnerId) {
      const path = `users/${currentOwnerId}/customers/${newCust.id}`;
      try {
        await setDoc(doc(db, "users", currentOwnerId, "customers", newCust.id), {
          ...newCust,
          userId: currentOwnerId
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    }
  };

  const handleAddService = async (newService: Service) => {
    if (currentOwnerId) {
      const path = `users/${currentOwnerId}/services/${newService.id}`;
      try {
        await setDoc(doc(db, "users", currentOwnerId, "services", newService.id), {
          ...newService,
          userId: currentOwnerId
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    } else {
      setServices((prev) => [newService, ...prev]);
    }
  };

  const handleUpdateService = async (updatedService: Service) => {
    if (currentOwnerId) {
      const path = `users/${currentOwnerId}/services/${updatedService.id}`;
      try {
        await setDoc(doc(db, "users", currentOwnerId, "services", updatedService.id), {
          ...updatedService,
          userId: currentOwnerId
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    } else {
      setServices((prev) => prev.map(s => s.id === updatedService.id ? updatedService : s));
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (currentOwnerId) {
      const path = `users/${currentOwnerId}/services/${serviceId}`;
      try {
        await deleteDoc(doc(db, "users", currentOwnerId, "services", serviceId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    } else {
      setServices((prev) => prev.filter(s => s.id !== serviceId));
    }
  };

  const handleExportServices = () => {
    if (services.length === 0) {
      alert("Tidak ada layanan untuk diekspor!");
      return;
    }
    const headers = ["ID", "Nama Layanan", "Kategori", "Satuan", "Harga", "Estimasi Selesai", "Minimal Kuantitas", "Proses"];
    const rows = services.map(s => [
      s.id,
      s.nama,
      s.kategori || "-",
      s.tipe || "Kiloan",
      s.harga,
      s.durasiJam >= 24 ? `${Math.round(s.durasiJam / 24)} Hari` : `${s.durasiJam} Jam`,
      s.minimalKuantitas || 1,
      s.proses ? s.proses.join(", ") : "Cuci"
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `damdam_layanan_laundry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddServiceCategory = () => {
    const trimmed = newServiceCategoryInput.trim();
    if (!trimmed) return;
    if (customServiceCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      alert("Kategori dengan nama ini sudah ada!");
      return;
    }
    setCustomServiceCategories([...customServiceCategories, trimmed]);
    setNewServiceCategoryInput("");
  };

  const handleUpdateServiceCategory = (index: number) => {
    const trimmedValue = editingServiceCategoryValue.trim();
    if (!trimmedValue) return;
    const oldName = customServiceCategories[index];
    
    // Update categories array
    const updatedCategories = [...customServiceCategories];
    updatedCategories[index] = trimmedValue;
    setCustomServiceCategories(updatedCategories);
    
    // Cascade update to services
    const updatedServices = services.map(s => {
      if (s.kategori?.toLowerCase() === oldName.toLowerCase()) {
        return { ...s, kategori: trimmedValue };
      }
      return s;
    });
    setServices(updatedServices);
    localStorage.setItem("damdam_services", JSON.stringify(updatedServices));
    
    setEditingServiceCategoryIndex(null);
  };

  const handleDeleteServiceCategory = (index: number) => {
    const catName = customServiceCategories[index];
    if (catName === "Tanpa Kategori" || catName === "Semua") return;
    
    if (window.confirm(`Hapus kategori "${catName}"? Layanan dengan kategori ini akan dipindahkan ke "Tanpa Kategori"`)) {
      // Delete from categories array
      const updatedCategories = customServiceCategories.filter((_, i) => i !== index);
      setCustomServiceCategories(updatedCategories);
      
      // Cascade update to services
      const updatedServices = services.map(s => {
        if (s.kategori === catName) {
          return { ...s, kategori: "Tanpa Kategori" };
        }
        return s;
      });
      setServices(updatedServices);
      localStorage.setItem("damdam_services", JSON.stringify(updatedServices));
    }
  };

  const openCreateServiceSubtab = () => {
    setEditingService(null);
    setSubtrackServName("");
    setSubtrackServType("Kiloan");
    setSubtrackServPrice(0);
    setSubtrackServDurationValue(24);
    setSubtrackServDurationTipe("Jam");
    setSubtrackServProses(["Cuci", "Pengeringan"]);
    setSubtrackServMinQty(1);
    setSubtrackServCategory("Kiloan");
    setSubtrackServSematkan(false);
    setIsCreatingServiceInSubtab(true);
  };

  const openEditServiceSubtab = (s: Service) => {
    setEditingService(s);
    setSubtrackServName(s.nama);
    setSubtrackServType(s.tipe || "Kiloan");
    setSubtrackServPrice(s.harga);
    // Parse duration values
    const durTipe = s.durasiTipe || (s.durasiJam % 24 === 0 ? "Hari" : "Jam");
    const durValue = s.durasiValue || (durTipe === "Hari" ? s.durasiJam / 24 : s.durasiJam);
    setSubtrackServDurationValue(durValue);
    setSubtrackServDurationTipe(durTipe);
    setSubtrackServProses(s.proses || ["Cuci", "Pengeringan"]);
    setSubtrackServMinQty(s.minimalKuantitas || 1);
    setSubtrackServCategory(s.kategori || "Kiloan");
    setSubtrackServSematkan(!!s.sematkan);
    setIsCreatingServiceInSubtab(true);
  };

  const handleSaveServiceSubtab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtrackServName || subtrackServPrice < 0) return;

    const calculatedDurasiJam = subtrackServDurationTipe === "Hari" ? (subtrackServDurationValue * 24) : subtrackServDurationValue;
    
    if (editingService) {
      // Update
      const updated: Service = {
        ...editingService,
        nama: subtrackServName,
        tipe: subtrackServType,
        harga: subtrackServPrice,
        durasiJam: calculatedDurasiJam,
        proses: subtrackServProses,
        durasiValue: subtrackServDurationValue,
        durasiTipe: subtrackServDurationTipe,
        minimalKuantitas: subtrackServMinQty,
        kategori: subtrackServCategory,
        sematkan: subtrackServSematkan
      };
      await handleUpdateService(updated);
    } else {
      // Create
      const newId = "SERV-" + Date.now().toString().slice(-6);
      const newService: Service = {
        id: newId,
        nama: subtrackServName,
        tipe: subtrackServType,
        harga: subtrackServPrice,
        durasiJam: calculatedDurasiJam,
        userId: currentOwnerId || "guest",
        proses: subtrackServProses,
        durasiValue: subtrackServDurationValue,
        durasiTipe: subtrackServDurationTipe,
        minimalKuantitas: subtrackServMinQty,
        kategori: subtrackServCategory,
        sematkan: subtrackServSematkan
      };
      await handleAddService(newService);
    }

    // Reset and close
    setIsCreatingServiceInSubtab(false);
    setEditingService(null);
  };


  // Database Handlers (Create, update, delete)
  const handleAddExpense = async (newExp: Omit<Expense, "id">) => {
    const fresh: Expense = {
      ...newExp,
      id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };

    if (currentOwnerId) {
      const path = `users/${currentOwnerId}/expenses/${fresh.id}`;
      try {
        const cleaned: Record<string, any> = {};
        for (const [key, val] of Object.entries(fresh)) {
          if (val !== undefined && val !== null) {
            cleaned[key] = val;
          }
        }
        await setDoc(doc(db, "users", currentOwnerId, "expenses", fresh.id), {
          ...cleaned,
          userId: currentOwnerId
        });
      } catch (err) {
        console.error("Firestore create error:", err);
        alert("Gagal menambahkan transaksi ke cloud: " + (err instanceof Error ? err.message : String(err)));
      }
    } else {
      setExpenses((prev) => [fresh, ...prev]);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (currentOwnerId) {
      const path = `users/${currentOwnerId}/expenses/${id}`;
      try {
        await deleteDoc(doc(db, "users", currentOwnerId, "expenses", id));
      } catch (err) {
        console.error("Firestore delete error:", err);
        alert("Gagal menghapus transaksi dari cloud: " + (err instanceof Error ? err.message : String(err)));
      }
    } else {
      setExpenses((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleUpdateExpense = async (updated: Expense) => {
    if (currentOwnerId) {
      const path = `users/${currentOwnerId}/expenses/${updated.id}`;
      try {
        const cleaned: Record<string, any> = {};
        for (const [key, val] of Object.entries(updated)) {
          if (val !== undefined && val !== null) {
            cleaned[key] = val;
          }
        }
        await setDoc(doc(db, "users", currentOwnerId, "expenses", updated.id), {
          ...cleaned,
          userId: currentOwnerId
        });
      } catch (err) {
        console.error("Firestore update error:", err);
        alert("Gagal memperbarui transaksi di cloud: " + (err instanceof Error ? err.message : String(err)));
      }
    } else {
      setExpenses((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    }
  };

  const handleAddCategory = async (name: string, color: string, icon: string = "Tag") => {
    const cleanName = name.trim();
    if (!cleanName || categories[cleanName]) return;

    const colorMap: Record<string, string> = {
      "#10b981": "bg-[#062419] text-[#10b981] border-[#10b981]/30",
      "#fbbf24": "bg-[#2d220a] text-[#fbbf24] border-[#fbbf24]/30",
      "#f43f5e": "bg-[#2e0b11] text-[#f43f5e] border-[#f43f5e]/30",
      "#0ea5e9": "bg-[#081e2b] text-[#0ea5e9] border-[#0ea5e9]/30",
      "#8b5cf6": "bg-[#1f0f3d] text-[#8b5cf6] border-[#8b5cf6]/30",
      "#d946ef": "bg-[#2d0a33] text-[#d946ef] border-[#d946ef]/30",
      "#38bdf8": "bg-[#0c1e30] text-[#38bdf8] border-[#38bdf8]/30",
      "#a1a1aa": "bg-[#18181b] text-[#e4e4e7] border-[#27272a]"
    };

    const bgColor = colorMap[color] || "bg-[#18181b] text-white border-[#27272a]";

    const fresh: CategorySpec = {
      name: cleanName,
      color,
      bgColor,
      icon
    };

    if (currentOwnerId) {
      const path = `users/${currentOwnerId}/categories/${cleanName}`;
      try {
        await setDoc(doc(db, "users", currentOwnerId, "categories", cleanName), {
          ...fresh,
          userId: currentOwnerId
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    } else {
      setCategories((prev) => ({
        ...prev,
        [cleanName]: fresh
      }));
    }
  };

  const handleUpdateCategory = async (oldName: string, newName: string, newColor: string) => {
    const cleanNewName = newName.trim();
    if (!cleanNewName) return;

    const colorMap: Record<string, string> = {
      "#10b981": "bg-[#062419] text-[#10b981] border-[#10b981]/30",
      "#fbbf24": "bg-[#2d220a] text-[#fbbf24] border-[#fbbf24]/30",
      "#f43f5e": "bg-[#2e0b11] text-[#f43f5e] border-[#f43f5e]/30",
      "#0ea5e9": "bg-[#081e2b] text-[#0ea5e9] border-[#0ea5e9]/30",
      "#8b5cf6": "bg-[#1f0f3d] text-[#8b5cf6] border-[#8b5cf6]/30",
      "#d946ef": "bg-[#2d0a33] text-[#d946ef] border-[#d946ef]/30",
      "#38bdf8": "bg-[#0c1e30] text-[#38bdf8] border-[#38bdf8]/30",
      "#a1a1aa": "bg-[#18181b] text-[#e4e4e7] border-[#27272a]"
    };

    const newBgColor = colorMap[newColor] || "bg-[#18181b] text-white border-[#27272a]";

    if (currentOwnerId) {
      const newPath = `users/${currentOwnerId}/categories/${cleanNewName}`;
      try {
        const batch = writeBatch(db);
        if (oldName !== cleanNewName) {
          batch.delete(doc(db, "users", currentOwnerId, "categories", oldName));
        }

        const oldIcon = categories[oldName]?.icon || "Tag";
        const oldSubs = categories[oldName]?.subCategories || [];
        batch.set(doc(db, "users", currentOwnerId, "categories", cleanNewName), {
          name: cleanNewName,
          color: newColor,
          bgColor: newBgColor,
          icon: oldIcon,
          subCategories: oldSubs,
          userId: currentOwnerId
        });

        // Cascade category updates to matching expenses
        expenses.forEach((exp) => {
          if (exp.category === oldName) {
            batch.set(doc(db, "users", currentOwnerId, "expenses", exp.id), {
              ...exp,
              category: cleanNewName,
              userId: currentOwnerId
            });
          }
        });

        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, newPath);
      }
    } else {
      setCategories((prev) => {
        const updated = { ...prev };
        const oldIcon = updated[oldName]?.icon || "Tag";
        const oldSubs = updated[oldName]?.subCategories || [];

        if (oldName !== cleanNewName) {
          delete updated[oldName];
        }

        updated[cleanNewName] = {
          name: cleanNewName,
          color: newColor,
          bgColor: newBgColor,
          icon: oldIcon,
          subCategories: oldSubs
        };

        return updated;
      });

      // Cascade in state
      setExpenses((prev) => 
        prev.map((exp) => 
          exp.category === oldName 
            ? { ...exp, category: cleanNewName } 
            : exp
        )
      );
    }
  };

  const handleDeleteCategory = async (catName: string) => {
    if (currentOwnerId) {
      const path = `users/${currentOwnerId}/categories/${catName}`;
      try {
        await deleteDoc(doc(db, "users", currentOwnerId, "categories", catName));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    } else {
      setCategories((prev) => {
        const updated = { ...prev };
        delete updated[catName];
        return updated;
      });
    }
  };

  const handleUpdateSubCategories = async (
    catName: string, 
    subCats: string[], 
    renameMapping?: { oldName: string; newName: string }
  ) => {
    if (currentOwnerId) {
      try {
        const batch = writeBatch(db);
        const catRef = doc(db, "users", currentOwnerId, "categories", catName);
        batch.set(catRef, { subCategories: subCats }, { merge: true });

        const oldSubs = categories[catName]?.subCategories || [];

        if (renameMapping) {
          const { oldName, newName } = renameMapping;
          expenses.forEach((exp) => {
            if (exp.category === catName && exp.subCategory === oldName) {
              batch.update(doc(db, "users", currentOwnerId, "expenses", exp.id), {
                subCategory: newName
              });
            }
          });
        } else {
          const deletedSub = oldSubs.find((s) => !subCats.includes(s));
          if (deletedSub) {
            expenses.forEach((exp) => {
              if (exp.category === catName && exp.subCategory === deletedSub) {
                batch.update(doc(db, "users", currentOwnerId, "expenses", exp.id), {
                  subCategory: deleteField()
                });
              }
            });
          }
        }

        await batch.commit();
      } catch (err) {
        console.error("Gagal mengupdate sub kategori", err);
      }
    } else {
      setCategories((prev) => {
        if (!prev[catName]) return prev;
        const updated = {
          ...prev,
          [catName]: {
            ...prev[catName],
            subCategories: subCats
          }
        };
        localStorage.setItem("laundrosave_categories_clean_v2", JSON.stringify(updated));
        return updated;
      });

      if (renameMapping) {
        const { oldName, newName } = renameMapping;
        setExpenses((prev) =>
          prev.map((exp) =>
            exp.category === catName && exp.subCategory === oldName
              ? { ...exp, subCategory: newName }
              : exp
          )
        );
      } else {
        const oldSubs = categories[catName]?.subCategories || [];
        const deletedSub = oldSubs.find((s) => !subCats.includes(s));
        if (deletedSub) {
          setExpenses((prev) =>
            prev.map((exp) => {
              if (exp.category === catName && exp.subCategory === deletedSub) {
                const updatedExp = { ...exp };
                delete updatedExp.subCategory;
                return updatedExp;
              }
              return exp;
            })
          );
        }
      }
    }
  };

  const handleResetCategoriesToDefault = () => {
    triggerConfirm(
      "RESET KATEGORI",
      "Apakah Anda yakin ingin menyetel kembali semua kategori ke bawaan Damdam Laundry?",
      async () => {
        if (currentOwnerId) {
          const path = `users/${currentOwnerId}/categories`;
          try {
            const batch = writeBatch(db);
            for (const key of Object.keys(categories)) {
              batch.delete(doc(db, "users", currentOwnerId, "categories", key));
            }
            for (const [key, val] of Object.entries(PREDEFINED_CATEGORIES)) {
              batch.set(doc(db, "users", currentOwnerId, "categories", key), {
                ...val,
                userId: currentOwnerId
              });
            }
            await batch.commit();
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, path);
          }
        } else {
          setCategories(PREDEFINED_CATEGORIES);
        }
      },
      true
    );
  };

  const handleResetToEmpty = () => {
    triggerConfirm(
      "RESET TOTAL DATA",
      "Apakah Anda yakin ingin menghapus seluruh data transaksi (pengeluaran) & jenis kategori Anda untuk mulai menginput data secara mandiri dari nol?",
      async () => {
        if (currentOwnerId) {
          try {
            const batch = writeBatch(db);
            for (const exp of expenses) {
              batch.delete(doc(db, "users", currentOwnerId, "expenses", exp.id));
            }
            for (const key of Object.keys(categories)) {
              batch.delete(doc(db, "users", currentOwnerId, "categories", key));
            }
            batch.set(doc(db, "users", currentOwnerId, "categories", "Lain-lain"), {
              name: "Lain-lain",
              color: "#a1a1aa",
              bgColor: "bg-[#18181b] text-[#e4e4e7] border-[#27272a]",
              icon: "Coins",
              userId: currentOwnerId
            });

            await batch.commit();
          } catch (err) {
            handleFirestoreError(err, OperationType.DELETE, `users/${currentOwnerId}`);
          }
        } else {
          setExpenses([]);
          const cleanCategories: Record<string, CategorySpec> = {
            "Lain-lain": {
              name: "Lain-lain",
              color: "#a1a1aa",
              bgColor: "bg-[#18181b] text-[#e4e4e7] border-[#27272a]",
              icon: "Coins"
            }
          };
          setCategories(cleanCategories);
          localStorage.removeItem("laundrosave_expenses_clean_v2");
          localStorage.removeItem("laundrosave_categories_clean_v2");
        }
      },
      true
    );
  };

  const handleLoadSampleData = () => {
    triggerConfirm(
      "MUAT DATA SAMPEL",
      "Atur ulang transaksi Anda dan muat data sampel laundry untuk uji coba?",
      async () => {
        if (currentOwnerId) {
          try {
            const batch = writeBatch(db);
            for (const exp of expenses) {
              batch.delete(doc(db, "users", currentOwnerId, "expenses", exp.id));
            }
            for (const key of Object.keys(categories)) {
              batch.delete(doc(db, "users", currentOwnerId, "categories", key));
            }
            for (const [key, val] of Object.entries(PREDEFINED_CATEGORIES)) {
              batch.set(doc(db, "users", currentOwnerId, "categories", key), {
                ...val,
                userId: currentOwnerId
              });
            }
            for (const exp of SAMPLE_EXPENSES) {
              batch.set(doc(db, "users", currentOwnerId, "expenses", exp.id), {
                ...exp,
                userId: currentOwnerId
              });
            }
            await batch.commit();
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${currentOwnerId}`);
          }
        } else {
          setExpenses(SAMPLE_EXPENSES);
          setCategories(PREDEFINED_CATEGORIES);
        }
      }
    );
  };

  const handleSetBudgetLimit = async (limit: number) => {
    if (currentOwnerId) {
      const path = `users/${currentOwnerId}/settings/budget`;
      try {
        await setDoc(doc(db, "users", currentOwnerId, "settings", "budget"), { limit });
        setBudgetLimit(limit);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      setBudgetLimit(limit);
    }
  };

  if (authLoading) {
    return (
      <MobileFrame>
        <div className="flex-1 flex flex-col items-center justify-center bg-[#0A0A0B] text-zinc-500 font-sans min-h-[400px]">
          <span className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-3"></span>
          <p className="text-[10px] uppercase font-mono tracking-widest font-black text-zinc-500 animate-pulse">Menyiapkan Mesin Laundry...</p>
        </div>
      </MobileFrame>
    );
  }

  // Dual Portal Switcher when no session is active and not guest sandbox mode
  if (!user && !loggedInAdmin && !loggedInKaryawan && !isGuestSession) {
    return (
      <MobileFrame>
        <div className="flex-1 flex flex-col bg-[#0A0A0B] text-white p-5 justify-between font-sans min-h-0 overflow-y-auto">
          {/* Brand Logo Header */}
          <div className="text-center py-4 select-none shrink-0 border-b border-[#1E1E21] pb-5">
            <div className="w-12 h-12 rounded-sm bg-emerald-500 mx-auto flex items-center justify-center mb-3">
              <span className="text-black text-lg font-black font-mono">D</span>
            </div>
            <h1 className="text-xl font-black tracking-tighter text-emerald-500">
              DAMDAM <span className="text-white italic text-base">LAUNDRY</span>
            </h1>
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mt-1.5">
              Financial & Staff Engine
            </p>
          </div>

          {/* Switcher Tab Buttons */}
          <div className="flex-1 flex flex-col justify-center py-6 space-y-4">
            <div className="grid grid-cols-3 gap-1 bg-[#121214] p-1 border border-[#27272A] shrink-0 font-extrabold uppercase text-[9px] text-center">
              <button
                type="button"
                onClick={() => {
                  setPortalTab("owner");
                  setLoginError(null);
                }}
                className={`py-2 px-0.5 transition-all text-center cursor-pointer ${
                  portalTab === "owner" ? "bg-emerald-500 text-black font-black" : "text-zinc-400 hover:text-white"
                }`}
              >
                Owner
              </button>
              <button
                type="button"
                onClick={() => {
                  setPortalTab("admin");
                  setLoginError(null);
                }}
                className={`py-2 px-0.5 transition-all text-center cursor-pointer ${
                  portalTab === "admin" ? "bg-emerald-500 text-black font-black" : "text-zinc-400 hover:text-white"
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setPortalTab("karyawan");
                  setLoginError(null);
                }}
                className={`py-2 px-0.5 transition-all text-center cursor-pointer ${
                  portalTab === "karyawan" ? "bg-emerald-500 text-black font-black" : "text-zinc-400 hover:text-white"
                }`}
              >
                Karyawan
              </button>
            </div>

            {portalTab === "owner" ? (
              <div className="bg-[#121214] border border-[#27272A] p-4 text-center space-y-4 leading-relaxed text-xs">
                <span className="text-[8.5px] font-mono leading-none bg-emerald-950 text-emerald-400 border border-emerald-900 px-1.5 py-0.5 w-max font-black tracking-wider uppercase mx-auto block">
                  OWNER SIGN-IN
                </span>
                <p className="text-zinc-400 font-semibold leading-relaxed max-w-[280px] mx-auto">
                  Kelola pencatatan pengeluaran, kategori, limit bulanan, serta pantau presensi & gaji kerja karyawan.
                </p>
                <button
                  onClick={handleSignIn}
                  className="w-full py-3 bg-[#10b981] hover:bg-[#059669] text-black font-black text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Database className="w-4 h-4" />
                  Masuk dengan Akun Google
                </button>
              </div>
            ) : portalTab === "admin" ? (
              <form onSubmit={handleAdminLogin} className="bg-[#121214] border border-[#27272A] p-4 text-left space-y-3 text-xs leading-normal">
                <span className="text-[8.5px] font-mono leading-none bg-emerald-950 text-emerald-400 border border-emerald-900 px-1.5 py-0.5 w-max font-black tracking-wider uppercase block mx-auto text-center mb-1">
                  PORTAL MASUK ADMIN
                </span>
                
                {loginError && (
                  <div className="p-2.5 bg-[#1F1111] border border-red-900/30 text-red-500 font-black border-l-2 border-l-red-500 font-sans text-[10px] uppercase text-center leading-tight">
                    {loginError}
                  </div>
                )}
 
                <div className="space-y-3 font-semibold text-zinc-300">
                  <div>
                    <label className="text-[8.5px] font-black uppercase text-zinc-550 block mb-1">Username Admin</label>
                    <input
                      type="text"
                      required
                      placeholder="username"
                      value={loginUser}
                      onChange={(e) => setLoginUser(e.target.value)}
                      className="w-full bg-[#0A0A0B] border border-[#27272A] text-white px-3 py-2 outline-none focus:border-emerald-500 font-mono text-xs rounded-none"
                    />
                  </div>
                  <div>
                    <label className="text-[8.5px] font-black uppercase text-zinc-550 block mb-1">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      className="w-full bg-[#0A0A0B] border border-[#27272A] text-white px-3 py-2 outline-none focus:border-emerald-500 font-mono text-xs rounded-none"
                    />
                  </div>
                </div>
 
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-widest transition-all cursor-pointer rounded-none disabled:opacity-50 mt-1"
                >
                  {loginLoading ? "OTENTIKASI MASUK..." : "LOG-IN ADMIN"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleKaryawanLogin} className="bg-[#121214] border border-[#27272A] p-4 text-left space-y-3 text-xs leading-normal">
                <span className="text-[8.5px] font-mono leading-none bg-emerald-950 text-emerald-400 border border-emerald-900 px-1.5 py-0.5 w-max font-black tracking-wider uppercase block mx-auto text-center mb-1">
                  PRESENSI KARYAWAN
                </span>
                
                {loginError && (
                  <div className="p-2.5 bg-[#1F1111] border border-red-900/30 text-red-500 font-black border-l-2 border-l-red-500 font-sans text-[10px] uppercase text-center leading-tight">
                    {loginError}
                  </div>
                )}
 
                <div className="space-y-3 font-semibold text-zinc-300">
                  <div>
                    <label className="text-[8.5px] font-black uppercase text-zinc-550 block mb-1">Username Login</label>
                    <input
                      type="text"
                      required
                      placeholder="username"
                      value={loginUser}
                      onChange={(e) => setLoginUser(e.target.value)}
                      className="w-full bg-[#0A0A0B] border border-[#27272A] text-white px-3 py-2 outline-none focus:border-emerald-500 font-mono text-xs rounded-none"
                    />
                  </div>
                  <div>
                    <label className="text-[8.5px] font-black uppercase text-zinc-550 block mb-1">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      className="w-full bg-[#0A0A0B] border border-[#27272A] text-white px-3 py-2 outline-none focus:border-emerald-500 font-mono text-xs rounded-none"
                    />
                  </div>
                </div>
 
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-widest transition-all cursor-pointer rounded-none disabled:opacity-50 mt-1"
                >
                  {loginLoading ? "OTENTIKASI MASUK..." : "LOG-IN KARYAWAN"}
                </button>
              </form>
            )}
          </div>

          {/* Sandbox Switcher Footer */}
          <div className="text-center py-3 select-none shrink-0 border-t border-[#1E1E21] pt-4">
            <button
              onClick={() => {
                localStorage.setItem("damdam_is_guest", "true");
                setIsGuestSession(true);
              }}
              className="text-[10px] font-black text-amber-500 hover:text-amber-400 underline uppercase tracking-widest cursor-pointer"
            >
              Lanjutkan sebagai Tamu (Mode Sandbox Offline)
            </button>
          </div>
        </div>
      </MobileFrame>
    );
  }

  // If logged in as Karyawan, completely isolate them in KaryawanDashboard
  if (loggedInKaryawan) {
    const backupLocation = {
      latitude: -6.2088,
      longitude: 106.8456,
      radius: 100,
      namaLokasi: "Outlet Damdam Laundry"
    };
    return (
      <MobileFrame>
        <KaryawanDashboard
          karyawan={loggedInKaryawan}
          ownerId={(loggedInKaryawan as any).ownerId || ""}
          defaultLocation={backupLocation}
          onLogout={handleKaryawanSignOut}
        />
      </MobileFrame>
    );
  }

  return (

    <MobileFrame>
      {/* 1. App Navigation Top Header bar */}
      <header className="w-full bg-[#0A0A0B] text-white border-b border-[#27272A] px-5 py-4 select-none shrink-0 relative flex items-center justify-between z-40">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-sm bg-emerald-500 flex items-center justify-center font-bold">
            <span className="text-black text-xs font-black">D</span>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter text-emerald-500">
              DAMDAM <span className="text-white italic text-sm">LAUNDRY</span>
            </h1>
            <p className="text-[8.5px] font-bold text-zinc-500 uppercase tracking-widest leading-none mt-0.5">
              Financial Engine
            </p>
          </div>
        </div>

        {/* User context info & Cloud auth indicator */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowMobileModal(true)}
            className="flex items-center gap-1 px-2 py-1 bg-[#121214] border border-[#27272A] hover:border-emerald-500 text-emerald-450 text-[9.5px] font-black uppercase tracking-wider rounded-none cursor-pointer duration-150 transition-all active:scale-95"
            title="Scan QR Code untuk dicoba di HP"
          >
            <Smartphone className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className="hidden md:inline leading-none">Coba di HP</span>
            <span className="md:hidden">HP</span>
          </button>

          {authLoading ? (
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest font-mono">Loading...</span>
          ) : loggedInAdmin ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-[8.5px] font-black text-[#10B981] bg-emerald-950/40 px-2 py-0.5 rounded-none border border-emerald-900/60 uppercase tracking-tight font-mono">
                👤 ADMIN: {loggedInAdmin.nama.toUpperCase()}
              </span>
              <button
                onClick={handleAdminSignOut}
                title={`Keluar dari Akun Admin (${loggedInAdmin.username})`}
                className="flex items-center gap-1 px-2 py-1 bg-zinc-950 border border-[#27272A] hover:border-red-850 hover:text-red-400 text-zinc-400 text-[9.5px] font-black uppercase tracking-wider duration-150 transition-all cursor-pointer rounded-none"
              >
                <LogOut className="w-3 h-3 text-red-500" />
                <span className="hidden md:inline leading-none">Keluar Admin</span>
                <span className="md:hidden">Keluar</span>
              </button>
              <div className="w-7 h-7 bg-blue-600 rounded-sm flex items-center justify-center font-black text-[10px] text-white shadow-sm uppercase">
                {loggedInAdmin.nama.slice(0, 2).toUpperCase()}
              </div>
            </div>
          ) : user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-[8.5px] font-black text-[#10B981] bg-emerald-950/40 px-2 py-0.5 rounded-none border border-emerald-900/60 uppercase tracking-tight font-mono">
                👤 CLOUD OK
              </span>
              <button
                onClick={handleSignOut}
                title={`Keluar dan Ganti Akun Google (${user.displayName || user.email})`}
                className="flex items-center gap-1 px-2 py-1 bg-zinc-950 border border-[#27272A] hover:border-red-850 hover:text-red-400 text-zinc-400 text-[9.5px] font-black uppercase tracking-wider duration-150 transition-all cursor-pointer rounded-none"
              >
                <LogOut className="w-3 h-3 text-red-500" />
                <span className="hidden md:inline leading-none">Ganti Akun / Keluar</span>
                <span className="md:hidden">Keluar</span>
              </button>
              {user.photoURL ? (
                <img 
                   src={user.photoURL} 
                  alt="Avatar" 
                  className="w-7 h-7 rounded-sm border border-emerald-500/50 shadow-sm" 
                  referrerPolicy="no-referrer" 
                />
              ) : (
                <div className="w-7 h-7 bg-emerald-500 rounded-sm flex items-center justify-center font-black text-[10px] text-black shadow-sm uppercase">
                  {(user.displayName || user.email || "U").slice(0, 2)}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#10b981] hover:bg-[#059669] text-black text-[9.5px] font-black uppercase tracking-wider duration-150 transition-all cursor-pointer rounded-none active:scale-95 shadow-sm"
              title="Masuk Akun Google untuk Sinkronisasi Cloud Database"
            >
              <Database className="w-3.5 h-3.5 text-black" />
              <span>Masuk Google</span>
            </button>
          )}
        </div>
      </header>

      {/* Cloud Status Alert banner */}
      {!authLoading && !user && !loggedInAdmin && (
        <div className="w-full bg-[#1A1108] border-b border-[#C2410C]/20 px-5 py-2 flex items-center justify-between text-left select-none shrink-0 z-30 font-sans">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-tight">
              Aplikasi Berjalan Offline (Guest Sandbox)
            </p>
            <span className="hidden leading-none pt-0.5 md:inline text-[9px] text-zinc-400 font-bold transition-all">
              - Hubungkan database cloud untuk mencegah kehilangan data laundry Anda.
            </span>
          </div>
          <button 
            onClick={handleSignIn}
            className="text-[9.5px] font-black text-emerald-400 hover:text-emerald-300 underline uppercase tracking-wider cursor-pointer"
          >
            Hubungkan Sekarang
          </button>
        </div>
      )}

      {/* Syncing ongoing indicator */}
      {isSyncing && (
        <div className="w-full bg-[#0d2a1f] border-b border-emerald-800/25 px-5 py-2 flex items-center gap-2 select-none shrink-0 z-35 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <p className="text-[9.5px] font-black text-emerald-400 uppercase tracking-wider">
            Menyinkronkan data laundry dengan database cloud...
          </p>
        </div>
      )}

      {/* Synchronization Mismatch / Permission Error Banner */}
      {syncError && (
        <div className="w-full bg-[#1C0F0F] border-b border-red-900/40 px-5 py-2 flex items-center justify-between text-left select-none shrink-0 z-30 font-sans">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <div>
              <p className="text-[10px] font-black text-red-500 uppercase tracking-tight">
                Masalah Sinkronisasi: {syncError}
              </p>
              <p className="text-[8.5px] font-bold text-zinc-400 mt-0.5">
                Coba sign-out lalu masuk kembali menggunakan akun Google yang sama untuk memicu migrasi ulang data laundry Anda.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setSyncError(null)}
            className="text-[9px] font-black text-zinc-450 hover:text-white border border-[#27272A] px-2 py-0.5 rounded-none uppercase cursor-pointer"
          >
            OK
          </button>
        </div>
      )}

      {/* 2. Primary Scrollable View Screen body */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0A0A0B] relative">
        {activeTab === "dashboard" && (
          <>
            {dashboardSubTab === "home" && (
              <LaundryDashboard
                transactions={transactions}
                customers={customers}
                services={services}
                expenses={expenses}
                onSetViewTab={(tab) => {
                  if (tab === "transaksi") {
                    setActiveTab("transaksi");
                  } else if (tab === "karyawan") {
                    setDashboardSubTab("karyawan");
                  } else if (tab === "laporan") {
                    setActiveTab("laporan");
                  } else {
                    setDashboardSubTab(tab);
                  }
                }}
                onSetSubTab={(sub) => {
                  if (sub === "pengeluaran") {
                    setDashboardSubTab("pengeluaran");
                    setExpensePanelTab("ringkasan");
                  }
                }}
                onTriggerNewTransaction={() => {
                  setActiveTab("transaksi");
                  setDirectOpenCreateTrx(true);
                }}
                onTriggerNewCustomer={() => {
                  setDashboardSubTab("pelanggan");
                }}
                onTriggerNewService={() => {
                  setDashboardSubTab("layanan");
                }}
              />
            )}

            {dashboardSubTab === "pengeluaran" && (
              <div className="flex-1 flex flex-col overflow-hidden bg-[#0A0A0B] font-sans">
                {/* Embedded Sub-navigation Header */}
                <div className="p-3 bg-[#121214] border-b border-zinc-900 flex items-center justify-between shrink-0 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setDashboardSubTab("home")}
                      className="p-1 px-2.5 bg-zinc-950 border border-zinc-850 hover:border-emerald-500 duration-150 text-zinc-400 hover:text-white text-[10px] font-black uppercase rounded-none"
                    >
                      &larr; POS HOME
                    </button>
                    <span className="text-[10.5px] font-black text-emerald-400 uppercase tracking-widest">SUB: PENGELUARAN & BUDGET</span>
                  </div>
                  <div className="flex bg-zinc-950 p-0.5 border border-zinc-855 text-[8.5px] font-black uppercase">
                    {[
                      { key: "ringkasan", label: "Ringkasan" },
                      { key: "catat", label: "Catat Baru" },
                      { key: "riwayat", label: "Riwayat Pengeluaran" }
                    ].map((st) => (
                      <button
                        key={st.key}
                        onClick={() => setExpensePanelTab(st.key)}
                        className={`px-3 py-1 cursor-pointer rounded-none transition-all duration-150 ${expensePanelTab === st.key ? "bg-emerald-500 text-black font-black" : "text-zinc-400 hover:text-zinc-200"}`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                  {expensePanelTab === "ringkasan" && (
                    <DashboardHome
                      expenses={expenses}
                      budgetLimit={budgetLimit}
                      categories={categories}
                      onSetViewTab={(t) => {
                        if (t === "catat") setExpensePanelTab("catat");
                        else setExpensePanelTab("riwayat");
                      }}
                      onSetBudgetLimit={handleSetBudgetLimit}
                      onResetToEmpty={handleResetToEmpty}
                      onLoadSampleData={handleLoadSampleData}
                    />
                  )}
                  {expensePanelTab === "catat" && (
                    <ExpenseForm
                      onAddExpense={handleAddExpense}
                      onSetViewTab={(t) => setExpensePanelTab("riwayat")}
                      categories={categories}
                      onAddCategory={handleAddCategory}
                      onUpdateCategory={handleUpdateCategory}
                      onDeleteCategory={handleDeleteCategory}
                      onResetCategoriesToDefault={handleResetCategoriesToDefault}
                      onUpdateSubCategories={handleUpdateSubCategories}
                      triggerConfirm={triggerConfirm}
                    />
                  )}
                  {expensePanelTab === "riwayat" && (
                    <ExpenseHistory
                      expenses={expenses}
                      categories={categories}
                      onDeleteExpense={handleDeleteExpense}
                      onUpdateExpense={handleUpdateExpense}
                      triggerConfirm={triggerConfirm}
                    />
                  )}
                </div>
              </div>
            )}

            {dashboardSubTab === "karyawan" && (
              <div className="flex-1 flex flex-col overflow-hidden bg-[#0A0A0B] font-sans">
                <div className="p-4 bg-[#121214] border-b border-zinc-900 flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => setDashboardSubTab("home")}
                    className="p-1 px-2.5 bg-zinc-950 border border-zinc-850 hover:border-emerald-500 text-zinc-400 hover:text-white text-[10px] font-black uppercase rounded-none duration-150"
                  >
                    &larr; POS HOME
                  </button>
                  <span className="text-[10.5px] font-black text-emerald-400 uppercase tracking-widest">SUB: STAF & MONITORING ABSENSI</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {user ? (
                    <OwnerKaryawanPanel
                      ownerId={user.uid}
                      onAddExpense={handleAddExpense}
                      triggerConfirm={triggerConfirm}
                    />
                  ) : (
                    <div className="p-10 text-center border border-dashed border-zinc-800 m-4 bg-zinc-950/20 font-sans">
                      <p className="text-xs font-black text-amber-500 uppercase tracking-wide">AKSES STAF TERBATAS (SANDBOX)</p>
                      <p className="text-[10px] text-zinc-400 mt-2 leading-relaxed">
                        Manajemen pendaftaran karyawan, log absensi, geofencing lokasi kerja, dan monitoring kasbon membutuhkan database cloud aktif.
                      </p>
                      <button
                        onClick={handleSignIn}
                        className="mt-4 px-3 py-1.5 bg-emerald-500 font-black text-[9.5px] text-black uppercase tracking-wider hover:bg-emerald-400 duration-150"
                      >
                        AKTIFKAN CLOUD
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {dashboardSubTab === "pelanggan" && (
              <div className="flex-1 flex flex-col overflow-hidden bg-[#0A0A0B] font-sans">
                <div className="p-4 bg-[#121214] border-b border-zinc-900 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setDashboardSubTab("home")}
                      className="p-1 px-2.5 bg-zinc-950 border border-zinc-850 hover:border-emerald-500 text-zinc-400 hover:text-white text-[10px] font-black uppercase rounded-none duration-150"
                    >
                      &larr; POS HOME
                    </button>
                    <span className="text-[10.5px] font-black text-emerald-400 uppercase tracking-widest">SUB: DATABASE PELANGGAN ({customers.length})</span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab("transaksi");
                      setDirectOpenCreateCust(true);
                    }}
                    className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] uppercase font-black tracking-wider transition-all rounded-none"
                  >
                    + Pelanggan
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {customers.length === 0 ? (
                    <p className="p-6 text-center border border-dashed border-zinc-800 text-[10.5px] text-zinc-500">Belum ada pelanggan terdaftar.</p>
                  ) : (
                    customers.map(c => (
                      <div key={c.id} className="bg-[#121214] border border-[#27272A] p-3 flex justify-between items-center text-xs">
                        <div>
                          <p className="text-white font-black text-[13px]">{c.nama}</p>
                          <p className="text-zinc-400 font-mono mt-0.5">{c.telepon}</p>
                          {c.alamat && <p className="text-zinc-500 mt-1">{c.alamat}</p>}
                        </div>
                        <span className="text-[9px] font-mono font-black text-emerald-400 bg-emerald-950/30 px-2 py-1 border border-emerald-900/40">
                          {c.id}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {dashboardSubTab === "layanan" && (
              <div className="flex-1 flex flex-col overflow-hidden bg-[#0A0A0B] font-sans relative">
                {/* Header with back arrow */}
                <div className="p-4 bg-[#121214] border-b border-zinc-900 flex items-center shrink-0">
                  <button 
                    onClick={() => {
                      setDashboardSubTab("home");
                      setServiceSubSubTab("layanan"); // Reset subtab
                    }}
                    className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white mr-3 transition"
                    title="Kembali ke POS Home"
                  >
                    <ArrowLeft className="w-5 h-5 text-sky-450" />
                  </button>
                  <h2 className="text-white font-extrabold text-base uppercase tracking-tight">Layanan</h2>
                </div>

                {/* Sub Tab selection (Layanan vs Kategori) */}
                <div className="flex border-b border-zinc-900 bg-[#121214] select-none">
                  <button
                    type="button"
                    onClick={() => setServiceSubSubTab("layanan")}
                    className={`flex-1 py-3 text-center text-[11.5px] font-black uppercase tracking-wider transition-all relative ${
                      serviceSubSubTab === "layanan" ? "text-sky-400 font-black" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Layanan
                    {serviceSubSubTab === "layanan" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceSubSubTab("kategori")}
                    className={`flex-1 py-3 text-center text-[11.5px] font-black uppercase tracking-wider transition-all relative ${
                      serviceSubSubTab === "kategori" ? "text-sky-400 font-black" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Kategori
                    {serviceSubSubTab === "kategori" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500" />
                    )}
                  </button>
                </div>

                {/* Content Area */}
                {serviceSubSubTab === "layanan" ? (
                  <>
                    {/* Search & Export bar */}
                    <div className="p-3 bg-[#121214]/60 border-b border-zinc-900 flex items-center gap-2 shrink-0 select-none">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          placeholder="Cari nama layanan"
                          value={searchServiceQuery}
                          onChange={(e) => setSearchServiceQuery(e.target.value)}
                          className="w-full text-xs font-semibold bg-[#121214] border border-[#27272A] rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 font-sans"
                        />
                      </div>
                      
                      {/* Sort button */}
                      <button
                        type="button"
                        onClick={() => {
                          setServiceSort((current) => {
                            if (current === 'nama-asc') return 'harga-asc';
                            if (current === 'harga-asc') return 'harga-desc';
                            return 'nama-asc';
                          });
                        }}
                        className="p-2.5 bg-[#121214] border border-[#27272A] rounded-xl flex items-center justify-center text-zinc-300 hover:text-white hover:border-sky-500 transition max-h-[38px]"
                        title={
                          serviceSort === 'nama-asc' ? "Urut: Nama (A-Z)" :
                          serviceSort === 'harga-asc' ? "Urut: Harga Termurah" : "Urut: Harga Termahal"
                        }
                      >
                        <ArrowUpDown className="w-4 h-4" />
                      </button>

                      {/* Export button */}
                      <button
                        type="button"
                        onClick={handleExportServices}
                        className="bg-[#056f2b] hover:bg-emerald-700 text-white text-xs font-black py-2.5 px-3 rounded-xl flex items-center justify-center gap-1 transition max-h-[38px] active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Ekspor</span>
                      </button>
                    </div>

                    {/* Category Filter Chips Scrolling Group */}
                    <div className="px-3 py-2 bg-[#0A0A0B] flex gap-2 overflow-x-auto no-scrollbar border-b border-zinc-900 shrink-0 select-none">
                      {["Semua", ...customServiceCategories.filter(c => c !== "Tanpa Kategori"), "Tanpa Kategori"].map(cat => {
                        const isActive = selectedCategoryChip === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategoryChip(cat)}
                            className={`px-3 py-1.5 rounded-full text-[10.5px] font-black uppercase tracking-wider transition-all duration-150 ${
                              isActive
                                ? "bg-sky-500/15 text-sky-400 border border-sky-400"
                                : "bg-[#121214] border border-[#27272A] text-zinc-400 hover:text-white hover:border-zinc-700"
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>

                    {/* Services list with specific screenshot styling */}
                    <div className="flex-1 overflow-y-auto divide-y divide-[#27272A]/40 bg-[#0A0A0B]">
                      {(() => {
                        // 1. Filter by search query
                        let filtered = services.filter(s => 
                          s.nama.toLowerCase().includes(searchServiceQuery.toLowerCase())
                        );
                        
                        // 2. Filter by Category Chip
                        if (selectedCategoryChip !== "Semua") {
                          if (selectedCategoryChip === "Tanpa Kategori") {
                            filtered = filtered.filter(s => !s.kategori || s.kategori === "Tanpa Kategori" || s.kategori === "Kiloan" || s.kategori.trim() === "");
                          } else {
                            filtered = filtered.filter(s => s.kategori && s.kategori.toLowerCase() === selectedCategoryChip.toLowerCase());
                          }
                        }
                        
                        // Helper for duration formatting
                        const getDurationText = (svc: Service) => {
                          if (svc.durasiTipe && svc.durasiValue) {
                            return `${svc.durasiValue} ${svc.durasiTipe}`;
                          }
                          if (svc.durasiJam >= 24) {
                            return `${Math.round(svc.durasiJam / 24)} Hari`;
                          }
                          return `${svc.durasiJam || 24} Jam`;
                        };

                        // 3. Sort: PINNED item first, then normal sort criterion
                        const sorted = filtered.sort((a, b) => {
                          const aPin = a.sematkan ? 1 : 0;
                          const bPin = b.sematkan ? 1 : 0;
                          if (aPin !== bPin) {
                            return bPin - aPin; // Pinned remains at the top
                          }
                          
                          if (serviceSort === 'nama-asc') {
                            return a.nama.localeCompare(b.nama);
                          } else if (serviceSort === 'harga-asc') {
                            return a.harga - b.harga;
                          } else {
                            return b.harga - a.harga;
                          }
                        });

                        if (sorted.length === 0) {
                          return (
                            <div className="p-10 text-center text-zinc-500">
                              <p className="text-xs">Tidak ada layanan cocok dengan kriteria.</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setSearchServiceQuery("");
                                  setSelectedCategoryChip("Semua");
                                }}
                                className="mt-3 text-xs text-sky-400 hover:underline font-bold font-sans"
                              >
                                Bersihkan filter
                              </button>
                            </div>
                          );
                        }

                        return sorted.map(s => {
                          const processesStr = s.proses && s.proses.length > 0 
                            ? s.proses.join(" - ") 
                            : "Cuci";
                          
                          const unitSuffix = s.tipe === "Kiloan" ? "kg" : (s.tipe === "Satuan" ? "pc" : s.tipe.toLowerCase());
                          const durasiString = getDurationText(s);

                          return (
                            <div 
                              key={s.id} 
                              onClick={() => {
                                setSelectedServiceForAction(s);
                                setShowServiceActionBottomSheet(true);
                              }}
                              className="px-4 py-4 hover:bg-zinc-950/20 active:bg-zinc-950 transition-all flex justify-between items-center cursor-pointer border-b border-zinc-900/60"
                            >
                              {/* Left details */}
                              <div className="space-y-1 pr-4 flex-1">
                                <h3 className="text-white font-semibold text-[13.5px] uppercase tracking-wide group-hover:text-sky-400 duration-150">
                                  {s.nama}
                                </h3>
                                <p className="text-zinc-500 font-semibold text-[10.5px]">
                                  {processesStr}
                                </p>
                              </div>

                              {/* Right details */}
                              <div className="flex items-center gap-2.5 shrink-0 text-right">
                                <div className="space-y-0.5">
                                  <span className="block text-white font-bold text-[13.5px] font-sans">
                                    Rp{s.harga.toLocaleString("id-ID")}<span className="text-[10.5px] font-normal text-zinc-500">/{unitSuffix}</span>
                                  </span>
                                  <div className="flex items-center justify-end gap-1 text-[10.5px] text-zinc-400 font-bold uppercase">
                                    <span>Min. {s.minimalKuantitas || 1} {unitSuffix}</span>
                                    {s.sematkan && (
                                      <Pin className="w-3.5 h-3.5 text-sky-400 fill-sky-400 ml-1" />
                                    )}
                                  </div>
                                  <span className="block text-zinc-500 text-[10.5px] font-medium uppercase font-sans">
                                    {durasiString}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* Bottom options & Tambah Layanan bar */}
                    <div className="p-4 bg-[#121214] border-t border-zinc-900 flex gap-2.5 shrink-0">
                      {/* Three dots menu with global helper operations */}
                      <button
                        type="button"
                        onClick={() => setShowGeneralServiceBottomSheet(true)}
                        className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-[#27272A] hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition flex items-center justify-center min-w-[50px] active:scale-95"
                        title="Opsi Layanan"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {/* Tambah Layanan Blue main button */}
                      <button
                        type="button"
                        onClick={openCreateServiceSubtab}
                        className="flex-1 py-3 bg-[#0284c7] hover:bg-sky-500 text-white text-[12px] uppercase font-black rounded-xl active:scale-95 transition flex items-center justify-center gap-2 tracking-wider"
                      >
                        <Plus className="w-4 h-4 text-white" /> Tambah Layanan
                      </button>
                    </div>
                  </>
                ) : (
                  /* Kategori Management sub-tab */
                  <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0b]">
                    {/* Add Category Form */}
                    <div className="p-4 bg-[#121214]/60 border-b border-zinc-900 shrink-0">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Nama Kategori Baru"
                          value={newServiceCategoryInput}
                          onChange={(e) => setNewServiceCategoryInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddServiceCategory()}
                          className="flex-1 text-xs font-semibold bg-[#121214] border border-[#27272A] rounded-xl px-3 py-2.5 text-white placeholder-[#4b5563] focus:outline-none focus:border-sky-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddServiceCategory}
                          className="px-4 py-2 bg-[#0284c7] hover:bg-sky-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-95"
                        >
                          + Kategori
                        </button>
                      </div>
                    </div>

                    {/* Categories Row list */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">DAFTAR KATEGORI ({customServiceCategories.length})</p>
                      
                      {customServiceCategories.map((cat, idx) => {
                        const count = services.filter(s => s.kategori === cat).length;
                        const isEditing = editingServiceCategoryIndex === idx;

                        return (
                          <div 
                            key={cat} 
                            className="bg-[#121214] border border-[#27272A] rounded-xl p-3 flex justify-between items-center text-xs"
                          >
                            {isEditing ? (
                              <div className="flex items-center gap-2 flex-1 mr-2">
                                <input
                                  type="text"
                                  value={editingServiceCategoryValue}
                                  onChange={(e) => setEditingServiceCategoryValue(e.target.value)}
                                  className="flex-1 text-xs font-semibold bg-[#0A0A0B] border border-[#27272A] rounded-lg px-2 py-1 text-white focus:outline-none focus:border-sky-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateServiceCategory(idx)}
                                  className="px-2 py-1 bg-emerald-600 text-white text-[10px] uppercase font-bold rounded hover:bg-emerald-500"
                                >
                                  OK
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingServiceCategoryIndex(null)}
                                  className="px-2 py-1 bg-zinc-850 text-zinc-400 text-[10px] uppercase font-bold rounded hover:bg-zinc-800"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <>
                                <div>
                                  <p className="text-white font-bold text-xs uppercase">{cat}</p>
                                  <p className="text-[10px] text-zinc-500 uppercase font-mono mt-0.5">{count} Layanan Terdaftar</p>
                                </div>

                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingServiceCategoryIndex(idx);
                                      setEditingServiceCategoryValue(cat);
                                    }}
                                    className="p-1.5 bg-zinc-950 hover:bg-zinc-900 border border-[#27272A] hover:border-sky-500 text-zinc-400 hover:text-sky-400 rounded-lg transition"
                                    title="Edit Kategori"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={cat === "Tanpa Kategori"}
                                    onClick={() => handleDeleteServiceCategory(idx)}
                                    className="p-1.5 bg-zinc-950 hover:bg-red-950/40 border border-[#27272A] hover:border-red-500/50 text-zinc-400 hover:text-red-400 rounded-lg transition disabled:opacity-30 disabled:pointer-events-none"
                                    title="Hapus Kategori"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Inline Drawer/Overlay Modal for Subtab Services CRUD */}
                {isCreatingServiceInSubtab && (
                  <div className="absolute inset-0 bg-black/85 z-40 flex flex-col font-sans animate-fade-in">
                    <div className="p-4 bg-[#121214] border-b border-zinc-900 flex items-center justify-between shrink-0">
                      <span className="text-xs font-black uppercase tracking-wider text-[#38bdf8]">
                        {editingService ? "✎ Edit Layanan" : "★ Buat Layanan Baru"}
                      </span>
                      <button 
                        onClick={() => {
                          setIsCreatingServiceInSubtab(false);
                          setEditingService(null);
                        }} 
                        className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveServiceSubtab} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-16">
                      {/* Name input */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Nama Layanan</label>
                        <input
                          type="text"
                          required
                          value={subtrackServName}
                          onChange={(e) => setSubtrackServName(e.target.value)}
                          placeholder="Contoh: 1 Set Bed Cover Tebal Jumbo"
                          className="w-full text-xs font-semibold bg-[#121214] border border-[#27272A] rounded-xl p-3 text-white placeholder-zinc-650 focus:outline-none focus:border-sky-500 font-sans"
                        />
                      </div>

                      {/* Tipe / Satuan input */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block font-sans">Satuan Unit</label>
                        <select
                          value={subtrackServType}
                          onChange={(e) => setSubtrackServType(e.target.value)}
                          className="w-full text-xs font-bold bg-[#121214] border border-[#27272A] rounded-xl p-3 text-white focus:outline-none focus:border-sky-500 font-sans"
                        >
                          <option value="Kiloan">Kiloan (kg)</option>
                          <option value="Satuan">Satuan (pc)</option>
                          <option value="Meter">Meter (m2)</option>
                          <option value="Pasang">Pasang (pasang)</option>
                          <option value="Lusin">Lusin (lusin)</option>
                        </select>
                      </div>

                      {/* Harga input */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Harga Layanan (Rp)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={subtrackServPrice === 0 ? "" : subtrackServPrice}
                          onChange={(e) => setSubtrackServPrice(Number(e.target.value))}
                          placeholder="Contoh: 70000"
                          className="w-full text-xs font-semibold bg-[#121214] border border-[#27272A] rounded-xl p-3 text-white placeholder-zinc-650 focus:outline-none focus:border-sky-500 font-sans"
                        />
                      </div>

                      {/* Durasi & Tipe Durasi (Jam/Hari) */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Estimasi Durasi Selesai</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            required
                            min="1"
                            value={subtrackServDurationValue}
                            onChange={(e) => setSubtrackServDurationValue(Number(e.target.value))}
                            className="w-full text-xs font-semibold bg-[#121214] border border-[#27272A] rounded-xl p-3 text-white focus:outline-none focus:border-sky-500 text-center font-sans"
                          />
                          <select
                            value={subtrackServDurationTipe}
                            onChange={(e) => setSubtrackServDurationTipe(e.target.value as "Jam" | "Hari")}
                            className="w-full text-xs font-bold bg-[#121214] border border-[#27272A] rounded-xl p-3 text-white focus:outline-none focus:border-sky-500 font-sans"
                          >
                            <option value="Jam">Jam</option>
                            <option value="Hari">Hari</option>
                          </select>
                        </div>
                      </div>

                      {/* Proses Laundry Field (Cuci, Pengeringan, Setrika, Lipat) */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block font-sans">Proses Laundry Included</label>
                        <div className="grid grid-cols-2 gap-2">
                          {["Cuci", "Pengeringan", "Setrika", "Lipat"].map((p) => {
                            const isChecked = subtrackServProses.includes(p);
                            return (
                              <button
                                type="button"
                                key={p}
                                onClick={() => {
                                  if (isChecked) {
                                    setSubtrackServProses(subtrackServProses.filter(item => item !== p));
                                  } else {
                                    setSubtrackServProses([...subtrackServProses, p]);
                                  }
                                }}
                                className={`p-2.5 rounded-xl text-xs font-bold border transition text-center font-sans ${
                                  isChecked 
                                    ? "bg-sky-500/15 border-sky-500 text-sky-450" 
                                    : "bg-[#0A0A0B] border-[#27272A] text-zinc-400 hover:bg-zinc-900"
                                }`}
                              >
                                {isChecked ? "✓ " : "+ "} {p}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Minimal kuantitas */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block font-sans">Minimal Kuantitas</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={subtrackServMinQty}
                          onChange={(e) => setSubtrackServMinQty(Number(e.target.value))}
                          className="w-full text-xs font-semibold bg-[#121214] border border-[#27272A] rounded-xl p-3 text-white focus:outline-none focus:border-sky-500 text-center font-sans"
                        />
                      </div>

                      {/* Kategori Select */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block font-sans">Kategori</label>
                        <select
                          value={subtrackServCategory}
                          onChange={(e) => setSubtrackServCategory(e.target.value)}
                          className="w-full text-xs font-bold bg-[#121214] border border-[#27272A] rounded-xl p-3 text-white focus:outline-none focus:border-sky-500 font-sans"
                        >
                          {customServiceCategories.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      {/* Pin/Sematkan toggle */}
                      <button
                        type="button"
                        onClick={() => setSubtrackServSematkan(!subtrackServSematkan)}
                        className={`w-full py-2.5 border border-dashed rounded-xl text-center text-[10.5px] font-bold tracking-wide transition flex items-center justify-center gap-1.5 font-sans ${
                          subtrackServSematkan 
                            ? "border-sky-500 bg-sky-500/10 text-sky-400" 
                            : "border-[#27272A] hover:bg-zinc-900/40 text-zinc-400"
                        }`}
                      >
                        {subtrackServSematkan ? "★ Disematkan Teratas" : "☆ Sematkan Layanan Teratas"}
                      </button>
                    </form>

                    {/* Action buttons */}
                    <div className="p-4 bg-[#121214] border-t border-zinc-900 flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingServiceInSubtab(false);
                          setEditingService(null);
                        }}
                        className="flex-1 py-3 border border-[#27272A] text-zinc-400 hover:text-white hover:bg-zinc-900 text-xs font-bold rounded-xl active:scale-95 transition"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveServiceSubtab}
                        className="flex-1 py-3 bg-[#0284c7] hover:bg-sky-500 text-white text-xs font-black rounded-xl active:scale-95 transition flex items-center justify-center gap-1 uppercase tracking-wider"
                      >
                        <Save className="w-4 h-4" /> Simpan
                      </button>
                    </div>
                  </div>
                )}

                {/* Service Options Action Bottom Sheet drawer (Screenshot 2 Match) */}
                {showServiceActionBottomSheet && selectedServiceForAction && (
                  <div className="fixed inset-0 bg-black/80 z-60 flex items-end justify-center animate-fade-in font-sans">
                    {/* Click outside to close */}
                    <div 
                      className="absolute inset-0" 
                      onClick={() => {
                        setShowServiceActionBottomSheet(false);
                        setSelectedServiceForAction(null);
                      }}
                    />

                    <div className="w-full max-w-[430px] bg-[#121214] border-t border-zinc-800 rounded-t-3xl overflow-hidden animate-slide-up relative pb-8 p-5 z-70">
                      {/* Drag handle */}
                      <div className="w-12 h-1 bg-zinc-700/65 rounded-full mx-auto mb-6" />
                      
                      {/* Service details */}
                      <div className="mb-6 text-center">
                        <span className="text-[10px] font-black uppercase text-sky-400 tracking-widest block mb-1">Pilihan Layanan</span>
                        <h4 className="text-white font-extrabold text-base uppercase tracking-normal line-clamp-2 px-4">{selectedServiceForAction.nama}</h4>
                        <span className="text-zinc-500 text-[10.5px] font-mono mt-1 block uppercase">Kategori: {selectedServiceForAction.kategori || "Tanpa Kategori"}</span>
                      </div>

                      {/* Choices block */}
                      <div className="space-y-3">
                        {/* Ubah (Edit) */}
                        <button
                          type="button"
                          onClick={() => {
                            const currentSvc = selectedServiceForAction;
                            setShowServiceActionBottomSheet(false);
                            setSelectedServiceForAction(null);
                            openEditServiceSubtab(currentSvc);
                          }}
                          className="w-full p-4 bg-zinc-950/40 hover:bg-zinc-900 border border-[#27272A] hover:border-sky-500 rounded-2xl flex items-center gap-4 text-white transition duration-150 active:scale-98"
                        >
                          <div className="p-2.5 bg-sky-950/80 text-sky-400 rounded-xl">
                            <Edit3 className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <span className="block font-black text-[12.5px] uppercase text-zinc-150 tracking-wide">Ubah / Edit</span>
                            <span className="block text-[10px] text-zinc-500 font-medium">Ubah nama, harga, kategori, minimal kuantitas, estimasi selesai, dll</span>
                          </div>
                        </button>

                        {/* Hapus (Delete) */}
                        <button
                          type="button"
                          onClick={async () => {
                            const currentSvc = selectedServiceForAction;
                            if (window.confirm(`Hapus layanan "${currentSvc.nama}" secara permanen?`)) {
                              await handleDeleteService(currentSvc.id);
                              setShowServiceActionBottomSheet(false);
                              setSelectedServiceForAction(null);
                            }
                          }}
                          className="w-full p-4 bg-red-950/10 hover:bg-red-950/20 border border-red-900/40 rounded-2xl flex items-center gap-4 text-red-400 transition duration-150 active:scale-98"
                        >
                          <div className="p-2.5 bg-red-950/40 text-red-400 rounded-xl">
                            <Trash2 className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <span className="block font-black text-[12.5px] uppercase text-red-400 tracking-wide">Hapus Layanan</span>
                            <span className="block text-[10px] text-red-500/80 font-medium">Hapus layanan ini dari daftar laundry POS secara permanen</span>
                          </div>
                        </button>
                      </div>

                      {/* Cancel Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowServiceActionBottomSheet(false);
                          setSelectedServiceForAction(null);
                        }}
                        className="w-full mt-4 py-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded-xl text-xs font-bold uppercase transition active:scale-95"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}

                {/* General Service Options Bottom Sheet */}
                {showGeneralServiceBottomSheet && (
                  <div className="fixed inset-0 bg-black/80 z-60 flex items-end justify-center animate-fade-in font-sans">
                    <div 
                      className="absolute inset-0" 
                      onClick={() => setShowGeneralServiceBottomSheet(false)}
                    />

                    <div className="w-full max-w-[430px] bg-[#121214] border-t border-zinc-850 rounded-t-3xl overflow-hidden animate-slide-up relative pb-8 p-5 z-70">
                      <div className="w-12 h-1 bg-zinc-700/60 rounded-full mx-auto mb-6" />
                      
                      <div className="mb-5 text-center">
                        <span className="text-[10px] font-black uppercase text-sky-400 tracking-widest block mb-1">Opsi Global</span>
                        <h4 className="text-white font-extrabold text-base uppercase">Pengaturan Layanan</h4>
                      </div>

                      <div className="space-y-3">
                        {/* Option 1: Reload Default seeds if guest or user wanted */}
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Apakah Anda yakin ingin memuat ulang 7 layanan laundry bawaan? Tindakan ini tidak akan menghapus layanan yang sudah Anda buat.")) {
                              const defaultList: Service[] = [
                                { id: "serv-bed-jumbo-" + Date.now(), nama: "1 Set Bed Cover Tebal Jumbo", tipe: "Satuan", harga: 70000, durasiJam: 72, proses: ["Cuci", "Pengeringan"], minimalKuantitas: 1, kategori: "Reguler", sematkan: true, userId: currentOwnerId || "guest" },
                                { id: "serv-kaos-ab-" + Date.now(), nama: "1 Set Kaos Atas Bawah", tipe: "Satuan", harga: 25000, durasiJam: 4, proses: ["Cuci", "Pengeringan", "Setrika"], minimalKuantitas: 1, kategori: "Express", sematkan: true, userId: currentOwnerId || "guest" },
                                { id: "serv-mukena-" + Date.now(), nama: "1 Set Mukena", tipe: "Satuan", harga: 10000, durasiJam: 48, proses: ["Cuci", "Pengeringan", "Setrika"], minimalKuantitas: 1, kategori: "Reguler", sematkan: true, userId: currentOwnerId || "guest" },
                                { id: "serv-seprei-besar-" + Date.now(), nama: "1 Set Seprei Besar", tipe: "Satuan", harga: 25500, durasiJam: 72, proses: ["Cuci", "Pengeringan", "Setrika"], minimalKuantitas: 1, kategori: "Reguler", sematkan: true, userId: currentOwnerId || "guest" },
                                { id: "serv-bed-seprei-" + Date.now(), nama: "1 Set Seprei Besar Dan Bed Cover Besar", tipe: "Satuan", harga: 50000, durasiJam: 72, proses: ["Cuci", "Pengeringan"], minimalKuantitas: 1, kategori: "Reguler", sematkan: true, userId: currentOwnerId || "guest" }
                              ];
                              // Add batch
                              setServices(prev => {
                                const base = [...prev];
                                defaultList.forEach(d => {
                                  if (!base.some(b => b.nama.toLowerCase() === d.nama.toLowerCase())) {
                                    base.unshift(d);
                                  }
                                });
                                return base;
                              });
                              setShowGeneralServiceBottomSheet(false);
                            }
                          }}
                          className="w-full p-4 bg-zinc-950/40 hover:bg-zinc-900 border border-[#27272A] rounded-2xl flex items-center gap-4 text-white transition duration-150 active:scale-98"
                        >
                          <div className="p-2.5 bg-sky-950/80 text-sky-400 rounded-xl">
                            <Save className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <span className="block font-black text-[12.5px] uppercase text-zinc-200 tracking-wide">Muat Ulang Layanan Bawaan</span>
                            <span className="block text-[10px] text-zinc-500 font-medium font-sans">Tambahkan kembali template Bed Cover, Seprei, & Kaos ke database</span>
                          </div>
                        </button>

                        {/* Option 2: Hapus semua */}
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Peringatan Keras! Apakah Anda benar-benar mau menghapus SEMUA layanan terdaftar? Tindakan ini tidak dapat dibatalkan!")) {
                              setServices([]);
                              setShowGeneralServiceBottomSheet(false);
                            }
                          }}
                          className="w-full p-4 bg-red-950/10 hover:bg-red-950/20 border border-red-900/40 rounded-2xl flex items-center gap-4 text-red-500 transition duration-150 active:scale-98"
                        >
                          <div className="p-2.5 bg-red-950/40 text-red-400 rounded-xl">
                            <Trash2 className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <span className="block font-black text-[12.5px] uppercase text-red-400 tracking-wide">Hapus Semua Layanan</span>
                            <span className="block text-[10px] text-red-500/80 font-medium font-sans">Hapus total seluruh produk layanan laundry Anda bersih polos</span>
                          </div>
                        </button>
                      </div>

                      {/* Cancel Button */}
                      <button
                        type="button"
                        onClick={() => setShowGeneralServiceBottomSheet(false)}
                        className="w-full mt-4 py-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded-xl text-xs font-bold uppercase transition active:scale-95"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        
        {activeTab === "transaksi" && (
          <LaundryTransactions
            transactions={transactions}
            customers={customers}
            services={services}
            activeOwnerId={currentOwnerId || "guest"}
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onAddCustomer={handleAddCustomer}
            onAddService={handleAddService}
            showCreateModalDirectly={directOpenCreateTrx}
            onCloseCreateModalDirectly={() => setDirectOpenCreateTrx(false)}
            showCustomerModalDirectly={directOpenCreateCust}
            onCloseCustomerModalDirectly={() => setDirectOpenCreateCust(false)}
            showServiceModalDirectly={directOpenCreateServ}
            onCloseServiceModalDirectly={() => setDirectOpenCreateServ(false)}
            triggerConfirm={triggerConfirm}
          />
        )}

        {activeTab === "laporan" && (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#0A0A0B] font-sans p-5">
            {/* Header */}
            <div className="border-b border-[#27272A] pb-3 text-left shrink-0">
              <h2 className="text-sm font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4" /> LAPORAN REAL-TIME PENJUALAN
              </h2>
              <p className="text-[9.5px] text-zinc-400 uppercase font-black tracking-wider mt-0.5">
                Evaluasi otomatis omset, tagihan outstanding, dan margin bersih usaha laundry Anda.
              </p>
            </div>

            {/* Financial Grid Summary Metrics */}
            <div className="grid grid-cols-2 gap-3 mt-4 shrink-0">
              <div className="bg-[#121214] border border-[#27272A] p-3">
                <p className="text-[8.5px] font-black text-zinc-500 uppercase tracking-wider leading-none">OMSET TERKUMPUL (PAID)</p>
                <p className="text-base font-black text-emerald-400 font-mono mt-1.5 leading-none">
                  Rp {transactions.filter(t => t.statusBayar === "Lunas").reduce((sum, t) => sum + t.totalHarga, 0).toLocaleString("id-ID")}
                </p>
                <span className="text-[7.5px] font-mono text-zinc-500 mt-1 block">Dari transaksi lunas</span>
              </div>

              <div className="bg-[#121214] border border-[#27272A] p-3">
                <p className="text-[8.5px] font-black text-zinc-500 uppercase tracking-wider leading-none">BUSET OPERASIONAL (OUT)</p>
                <p className="text-base font-black text-rose-500 font-mono mt-1.5 leading-none">
                  Rp {expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString("id-ID")}
                </p>
                <span className="text-[7.5px] font-mono text-zinc-500 mt-1 block">Catatan pengeluaran usaha</span>
              </div>

              <div className="bg-[#121214] border border-[#27272A] p-3">
                <p className="text-[8.5px] font-black text-zinc-500 uppercase tracking-wider leading-none">PIUTANG NOTA (UNPAID)</p>
                <p className="text-base font-black text-amber-500 font-mono mt-1.5 leading-none">
                  Rp {transactions.filter(t => t.statusBayar !== "Lunas").reduce((sum, t) => sum + t.totalHarga, 0).toLocaleString("id-ID")}
                </p>
                <span className="text-[7.5px] font-mono text-zinc-500 mt-1 block">Belum dibayar oleh pelanggan</span>
              </div>

              <div className="bg-[#121214] border border-[#27272A] p-3">
                <p className="text-[8.5px] font-black text-zinc-500 uppercase tracking-wider leading-none">LABA BERSIH ESTIMASI</p>
                <p className={`text-base font-black font-mono mt-1.5 leading-none ${
                  (transactions.filter(t => t.statusBayar === "Lunas").reduce((sum, t) => sum + t.totalHarga, 0) - expenses.reduce((sum, e) => sum + e.amount, 0)) >= 0
                    ? "text-blue-400"
                    : "text-red-400"
                }`}>
                  Rp {(
                    transactions.filter(t => t.statusBayar === "Lunas").reduce((sum, t) => sum + t.totalHarga, 0) - 
                    expenses.reduce((sum, e) => sum + e.amount, 0)
                  ).toLocaleString("id-ID")}
                </p>
                <span className="text-[7.5px] font-mono text-zinc-500 mt-1 block">Laba tunai saat ini</span>
              </div>
            </div>

            {/* List of reports */}
            <div className="flex-1 overflow-y-auto mt-4 space-y-2">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">PILIH LAPORAN USAHA (REPORT MENU)</h3>

              {/* Shortcut card to real-time Admin Pengeluaran */}
              <div 
                onClick={() => {
                  setActiveTab("dashboard");
                  setDashboardSubTab("pengeluaran");
                  setExpensePanelTab("ringkasan");
                }}
                className="bg-emerald-950/25 border border-emerald-500/40 hover:border-emerald-500 transition-all p-3 text-left cursor-pointer duration-150 relative overflow-hidden"
              >
                <div className="absolute right-2 top-2 text-[8px] bg-emerald-500 text-black font-black px-1.5 uppercase">AKTIF</div>
                <p className="text-emerald-400 font-extrabold text-xs uppercase flex items-center gap-1.5 font-sans">
                  📁 KELOLA PENGELUARAN & BUDGETING
                </p>
                <p className="text-[9.5px] text-zinc-300 uppercase font-bold mt-1 font-sans">
                  BUKA PANEL ADMIN: OVERVIEW GRAFIK, INPUT CATATAN BARU, DAN CASCADE KATEGORI
                </p>
              </div>
              
              <div 
                onClick={() => {
                  const headers = "ID Transaksi,Nama Pelanggan,Layanan,Jumlah (Kg/Satuan),Metode Pembayaran,Status,Total Harga,Tanggal Masuk\n";
                  const csvRows = transactions.map(t => 
                    `"${t.id}","${t.customerName}","${t.layananNama}","${t.berat}","${t.pembayaranMetode}","${t.status}","${t.totalHarga}","${t.tanggalMasuk}"`
                  ).join("\n");
                  const blob = new Blob([headers + csvRows], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", `laporan_penjualan_damdam_${new Date().toISOString().substring(0,10)}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="bg-[#121214] border border-[#27272A] hover:border-emerald-500 transition-all p-3 flex.col text-left cursor-pointer duration-150"
              >
                <p className="text-white font-black text-xs uppercase">1. Laporan POS Omset Penjualan (.CSV)</p>
                <p className="text-[9.5px] text-zinc-500 uppercase font-black mt-1">EKSPOR DAFTAR SELURUH NOTA PEMASUKAN UNTUK EXCEL</p>
              </div>

              <div 
                onClick={() => {
                  const headers = "ID,Deskripsi,Kategori,Sub-kategori,Metode,Metode Bayar,Jumlah,Tanggal\n";
                  const csvRows = expenses.map(e => 
                    `"${e.id}","${e.title}","${e.category}","${e.subCategory || ""}","${e.paymentMethod}","${e.amount}","${e.date}"`
                  ).join("\n");
                  const blob = new Blob([headers + csvRows], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", `laporan_pengeluaran_kas_${new Date().toISOString().substring(0,10)}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="bg-[#121214] border border-[#27272A] hover:border-emerald-500 transition-all p-3 flex.col text-left cursor-pointer duration-150"
              >
                <p className="text-white font-black text-xs uppercase">2. Laporan Pengeluaran Usaha (.CSV)</p>
                <p className="text-[9.5px] text-zinc-500 uppercase font-black mt-1">EKSPOR LOG PENGELUARAN DAN OPERASIONAL KAS LAUNDRY</p>
              </div>

              <div 
                onClick={() => {
                  alert("Laporan performa staf hanya tersedia di cloud database!");
                }}
                className="bg-[#121214] border border-[#27272A] hover:border-[#27272A]/70 transition-all p-3 flex.col text-left cursor-none opacity-60"
              >
                <p className="text-zinc-400 font-bold text-xs uppercase">3. Laporan Kasbon & Staff Gaji (PRO)</p>
                <p className="text-[9.5px] text-zinc-650 uppercase font-black mt-1">REKAPITULASI PEMBAYARAN GAJI KARYAWAN & ABSENSI BULANAN</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "advisor" && (
          <AiAssistant
            expenses={expenses}
            budgetLimit={budgetLimit}
          />
        )}
      </main>


      {/* 3. SIMULATED OS APP BOTTOM NAVIGATION TAB BAR */}
      <nav className="w-full h-16 bg-[#121214] border-t border-[#27272A] flex items-center justify-around select-none shrink-0 z-40 px-2 pb-1">
        {/* Tab 1: Home / POS dashboard */}
        <button
          onClick={() => {
            setActiveTab("dashboard");
            setDashboardSubTab("home");
          }}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-lg transition-all cursor-pointer relative ${
            activeTab === "dashboard" && dashboardSubTab === "home"
              ? "text-emerald-400 font-black bg-zinc-900/50"
              : "text-zinc-500 hover:text-zinc-300 font-bold"
          }`}
        >
          {activeTab === "dashboard" && dashboardSubTab === "home" && (
            <div className="absolute top-0 w-6 h-0.5 bg-emerald-500 rounded-full" />
          )}
          <LayoutDashboard className={`w-5 h-5 ${activeTab === "dashboard" && dashboardSubTab === "home" ? "stroke-[2.5px] text-emerald-400" : "stroke-2"}`} />
          <span className="text-[9px] mt-0.5 tracking-wider uppercase font-black">Dashboard</span>
        </button>

        {/* Tab 2: Nota Transaksi list */}
        <button
          onClick={() => setActiveTab("transaksi")}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-lg transition-all cursor-pointer relative ${
            activeTab === "transaksi" && !directOpenCreateTrx
              ? "text-emerald-400 font-black bg-zinc-900/50"
              : "text-zinc-500 hover:text-zinc-300 font-bold"
          }`}
        >
          {activeTab === "transaksi" && !directOpenCreateTrx && (
            <div className="absolute top-0 w-6 h-0.5 bg-emerald-500 rounded-full" />
          )}
          <Receipt className={`w-5 h-5 ${activeTab === "transaksi" && !directOpenCreateTrx ? "stroke-[2.5px] text-emerald-400" : "stroke-2"}`} />
          <span className="text-[9px] mt-0.5 tracking-wider uppercase font-black">Transaksi</span>
        </button>

        {/* Dynamic Big Middle Circular Plus Button for Quick Invoice Creation */}
        <div className="flex items-center justify-center -mt-6 relative z-50">
          <button
            onClick={() => {
              setActiveTab("transaksi");
              setDirectOpenCreateTrx(true);
            }}
            id="btn_quick_create_trx"
            title="Sakti: Buat Nota Baru"
            className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black active:scale-90 transition-all duration-150 flex items-center justify-center shadow-lg shadow-emerald-500/20 border-4 border-zinc-950 relative group cursor-pointer"
          >
            {/* Soft pulsing border glow */}
            <span className="absolute -inset-1 rounded-full bg-emerald-500/30 blur opacity-40 group-hover:opacity-80 duration-150 animate-pulse" />
            <Plus className="w-8 h-8 stroke-[3.5px] text-zinc-950 relative z-10" />
          </button>
        </div>

        {/* Tab 3: Monthly Reports dashboard */}
        <button
          onClick={() => setActiveTab("laporan")}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-lg transition-all cursor-pointer relative ${
            activeTab === "laporan"
              ? "text-emerald-400 font-black bg-zinc-900/50"
              : "text-zinc-500 hover:text-zinc-300 font-bold"
          }`}
        >
          {activeTab === "laporan" && (
            <div className="absolute top-0 w-6 h-0.5 bg-emerald-500 rounded-full" />
          )}
          <FileText className={`w-5 h-5 ${activeTab === "laporan" ? "stroke-[2.5px] text-emerald-400" : "stroke-2"}`} />
          <span className="text-[9px] mt-0.5 tracking-wider uppercase font-black">Laporan</span>
        </button>

        {/* Tab 4: AI chatbot Advisor */}
        <button
          onClick={() => setActiveTab("advisor")}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-lg transition-all cursor-pointer relative ${
            activeTab === "advisor"
              ? "text-emerald-400 font-black bg-zinc-900/50"
              : "text-zinc-500 hover:text-zinc-300 font-bold"
          }`}
        >
          {activeTab === "advisor" && (
            <div className="absolute top-0 w-6 h-0.5 bg-emerald-500 rounded-full" />
          )}
          <div className="relative">
            <Bot className={`w-5 h-5 ${activeTab === "advisor" ? "stroke-[2.5px] text-emerald-400" : "stroke-2"}`} />
            {activeTab !== "advisor" && (
              <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse border border-zinc-900" />
            )}
          </div>
          <span className="text-[9px] mt-0.5 tracking-wider uppercase font-black">Sari AI</span>
        </button>
      </nav>

      {/* 4. Beautiful scanner overlay modal for direct Testing on Mobile */}
      {showMobileModal && (
        <div className="absolute inset-0 bg-[#0A0A0B]/98 z-50 flex flex-col justify-between p-6 animate-fade-in font-sans">
          
          {/* Header */}
          <div className="border-b border-[#27272A] pb-3 text-left">
            <h2 className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" /> BUKA INSTAN DI HANDPHONE
            </h2>
            <p className="text-[10px] text-zinc-400 uppercase font-black tracking-wider mt-1">
              Rasakan demo aplikasi langsung di perangkat Android / iOS Anda!
            </p>
          </div>

          {/* Core Content - QR Code */}
          <div className="flex-1 flex flex-col items-center justify-center py-4 space-y-4">
            <div className="p-3 bg-[#121214] border border-[#27272A] shadow-lg relative flex items-center justify-center">
              {/* Scan target lines decoration */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-500" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-500" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-500" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-500" />
              
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&color=10b981&bgcolor=121214&data=${encodeURIComponent(sharedUrl)}`}
                alt="QR Code"
                className="w-40 h-40 filter brightness-110"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Instruction Lists */}
            <div className="space-y-2 max-w-[280px] text-left">
              <div className="flex items-start gap-2.5 text-[10px] text-zinc-400 font-semibold leading-relaxed">
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-900 font-mono text-[9px] w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span>Buka aplikasi <strong className="text-white">Kamera</strong> bawaan di HP Android atau iPhone Anda.</span>
              </div>
              <div className="flex items-start gap-2.5 text-[10px] text-zinc-400 font-semibold leading-relaxed">
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-900 font-mono text-[9px] w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span>Arahkan kamera ke <strong className="text-emerald-400 uppercase">KODE QR EMERALD</strong> di atas.</span>
              </div>
              <div className="flex items-start gap-2.5 text-[10px] text-zinc-400 font-semibold leading-relaxed">
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-900 font-mono text-[9px] w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span>Ketuk spanduk/tautan pop-up yang muncul di layar HP Anda untuk langsung membukanya!</span>
              </div>
            </div>
          </div>

          {/* Copy input text box fallback */}
          <div className="bg-[#121214] border border-[#27272A] p-3 text-left space-y-2 shrink-0">
            <span className="block text-[8.5px] font-black text-zinc-500 uppercase tracking-widest">
              Atau Salin & Buka URL Browser HP:
            </span>
            <div className="flex gap-1.5">
              <input
                type="text"
                readOnly
                value={sharedUrl}
                className="flex-1 bg-zinc-950 border border-[#27272A] px-2.5 py-1.5 text-[9px] text-zinc-300 font-mono rounded-none focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-zinc-950 border border-[#27272A] hover:border-emerald-500 text-zinc-400 hover:text-white transition-all rounded-none text-[9.5px] font-black uppercase flex items-center gap-1 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Bottom Close Button */}
          <button
            onClick={() => setShowMobileModal(false)}
            className="w-full mt-3 py-3 bg-emerald-500 hover:bg-emerald-450 text-black text-xs font-black tracking-widest uppercase rounded-none transition-all cursor-pointer shadow-md text-center active:scale-98 shrink-0"
          >
            KEMBALI KE APLIKASI
          </button>
        </div>
      )}

      {/* Custom Reusable Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="absolute inset-0 bg-[#0A0A0B]/90 backdrop-blur-xs z-55 flex items-center justify-center p-6 animate-fade-in font-sans">
          <div className="w-full max-w-[320px] bg-[#121214] border border-[#27272A] p-5 shadow-2xl relative flex flex-col text-left">
            {/* Outline accent lines */}
            <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 ${confirmModal.isDangerous ? "border-red-500" : "border-emerald-500"}`} />
            <div className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 ${confirmModal.isDangerous ? "border-red-500" : "border-emerald-500"}`} />
            <div className={`absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 ${confirmModal.isDangerous ? "border-red-500" : "border-emerald-500"}`} />
            <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 ${confirmModal.isDangerous ? "border-red-500" : "border-emerald-500"}`} />
            
            <h3 className={`text-xs font-black uppercase tracking-widest ${confirmModal.isDangerous ? "text-red-500" : "text-emerald-500"} mb-2`}>
              ⚠️ {confirmModal.title}
            </h3>
            
            <p className="text-[11px] text-zinc-350 font-semibold leading-relaxed mb-6">
              {confirmModal.message}
            </p>
            
            <div className="flex gap-2 mt-auto">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white border border-[#27272A] text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer rounded-none active:scale-95 text-center"
              >
                {confirmModal.cancelText || "BATAL"}
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`flex-1 py-2 text-black ${confirmModal.isDangerous ? "bg-red-500 hover:bg-red-400" : "bg-emerald-500 hover:bg-emerald-400"} text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer rounded-none active:scale-95 text-center`}
              >
                {confirmModal.confirmText || "YA, PROSES"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileFrame>
  );
}

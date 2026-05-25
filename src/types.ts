/**
 * TypeScript Interfaces for Laundry Expense Tracker
 */

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: string;
  notes?: string;
}

export type ExpenseCategory = 
  | "Detergen & Sabun" 
  | "Listrik & Air" 
  | "Sewa & Utilitas" 
  | "Gaji Karyawan" 
  | "Pemeliharaan Mesin" 
  | "Pemasaran & Iklan" 
  | "Lain-lain";

export interface CategorySpec {
  name: string;
  color: string;
  bgColor: string;
  icon: string; // lucide icon name string representation
}

export interface Budget {
  limit: number;
}

export interface LocationConfig {
  latitude: number;
  longitude: number;
  radius: number;
  namaLokasi: string;
}

export interface Karyawan {
  id: string;
  nama: string;
  username: string;
  password: string;
  gajiPokok: number;
  uangMakan: number;
  createdAt: string;
  kasbon?: number;
  bonus?: number;
  catatanGaji?: string;
}

export interface Absensi {
  id: string;
  karyawanId: string;
  nama: string;
  tanggal: string; // YYYY-MM-DD
  checkInTime: string; // ISO String
  checkOutTime?: string; // ISO String
  latitudeIn: number;
  longitudeIn: number;
  latitudeOut?: number;
  longitudeOut?: number;
  distanceIn?: number;
  distanceOut?: number;
  status: "Hadir" | "Terlambat";
}

export interface Izin {
  id: string;
  karyawanId: string;
  nama: string;
  tanggal: string; // YYYY-MM-DD
  alasan: string;
  status: "Pending" | "Disetujui" | "Ditolak";
  createdAt: string;
}

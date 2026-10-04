export type Gender = 'L' | 'P';

export type InfractionCategory = 'Ringan' | 'Sedang' | 'Berat';

export type AchievementLevel = 'Sekolah' | 'Kecamatan' | 'Kota/Kab' | 'Provinsi' | 'Nasional' | 'Internasional';

export interface GradeItem {
  id: string;
  subject: string;
  kkm: number;
  uh1: number | null;
  uh2: number | null;
  tugas: number | null;
  uts: number | null;
  uas: number | null;
  average: number | null;
  letterGrade: 'A' | 'B' | 'C' | 'D' | '-';
}

export interface InfractionItem {
  id: string;
  date: string;
  title: string;
  category: InfractionCategory;
  points: number;
  penalty: string;
  resolved: boolean;
  notes?: string;
}

export interface AchievementItem {
  id: string;
  date: string;
  title: string;
  level: AchievementLevel;
  ranking: string;
  description: string;
}

export interface AttendanceEntry {
  id: string;
  date: string; // YYYY-MM-DD
  status: 'sakit' | 'izin' | 'alpha';
  note?: string;
}

export interface AttendanceRecord {
  sakit: number;
  izin: number;
  alpha: number;
  totalEffectiveDays: number;
  entries: AttendanceEntry[];
}

export interface Student {
  id: string;
  nis: string;
  nisn: string;
  name: string;
  gender: Gender;
  parentName: string;
  parentPhone: string;
  studentPhone?: string;
  address?: string;
  avatarUrl?: string;
  teacherNote?: string;
  attendance: AttendanceRecord;
  grades: GradeItem[];
  infractions: InfractionItem[];
  achievements: AchievementItem[];
  updatedAt: string;
}

export interface ClassInfo {
  schoolName: string;
  className: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  teacherName: string;
  teacherNip: string;
  teacherPhone: string;
  teacherEmail: string;
  announcement?: string;
  headmasterName?: string;
  headmasterNip?: string;
  schoolCity?: string;
  schoolAddress?: string;
}

export type UserRole = 'parent' | 'teacher';

import { Student, ClassInfo } from '../types';
import { initialStudents, initialClassInfo } from '../data/initialData';

const STUDENTS_STORAGE_KEY = 'eduwali_students_v1';
const CLASS_INFO_STORAGE_KEY = 'eduwali_class_info_v1';
const TEACHER_PIN_KEY = 'eduwali_teacher_pin_v1';

export const storageService = {
  getStudents(): Student[] {
    try {
      const data = localStorage.getItem(STUDENTS_STORAGE_KEY);
      if (data) {
        const parsed: Student[] = JSON.parse(data);
        // Ensure all students have attendance entries array
        const normalized = parsed.map((s) => ({
          ...s,
          attendance: {
            ...s.attendance,
            entries: Array.isArray(s.attendance?.entries) ? s.attendance.entries : [],
          },
        }));
        return normalized;
      }
    } catch (e) {
      console.error('Failed to parse students from localStorage', e);
    }
    // Default fallback
    this.saveStudents(initialStudents);
    return initialStudents;
  },

  saveStudents(students: Student[]): void {
    try {
      localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
    } catch (e) {
      console.error('Failed to save students to localStorage', e);
    }
  },

  getClassInfo(): ClassInfo {
    try {
      const data = localStorage.getItem(CLASS_INFO_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to parse class info from localStorage', e);
    }
    this.saveClassInfo(initialClassInfo);
    return initialClassInfo;
  },

  saveClassInfo(classInfo: ClassInfo): void {
    try {
      localStorage.setItem(CLASS_INFO_STORAGE_KEY, JSON.stringify(classInfo));
    } catch (e) {
      console.error('Failed to save class info to localStorage', e);
    }
  },

  getTeacherPin(): string {
    return localStorage.getItem(TEACHER_PIN_KEY) || 'guru123';
  },

  setTeacherPin(newPin: string): void {
    localStorage.setItem(TEACHER_PIN_KEY, newPin);
  },

  resetToDefault(): { students: Student[]; classInfo: ClassInfo } {
    localStorage.removeItem(STUDENTS_STORAGE_KEY);
    localStorage.removeItem(CLASS_INFO_STORAGE_KEY);
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(initialStudents));
    localStorage.setItem(CLASS_INFO_STORAGE_KEY, JSON.stringify(initialClassInfo));
    return { students: initialStudents, classInfo: initialClassInfo };
  },

  exportDatabaseJSON(): string {
    const backup = {
      app: 'Portal EduWali',
      exportedAt: new Date().toISOString(),
      classInfo: this.getClassInfo(),
      students: this.getStudents(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importDatabaseJSON(jsonString: string): { success: boolean; message: string; data?: { students: Student[]; classInfo: ClassInfo } } {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.students)) {
        this.saveStudents(parsed.students);
        if (parsed.classInfo) {
          this.saveClassInfo(parsed.classInfo);
        }
        return {
          success: true,
          message: `Berhasil memulihkan ${parsed.students.length} data siswa.`,
          data: {
            students: parsed.students,
            classInfo: parsed.classInfo || this.getClassInfo(),
          },
        };
      }
      return { success: false, message: 'Format file JSON tidak sesuai struktur data siswa EduWali.' };
    } catch (e) {
      return { success: false, message: 'File tidak valid atau rusak (bukan JSON).' };
    }
  },
};

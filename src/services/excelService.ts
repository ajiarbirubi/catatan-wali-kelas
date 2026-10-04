import * as XLSX from 'xlsx';
import { Student, GradeItem, Gender } from '../types';
import { defaultSubjects, createGradeItem, calculateGrade } from '../data/initialData';

export interface ParsedStudentRow {
  nis: string;
  nisn: string;
  name: string;
  gender: Gender;
  parentName: string;
  parentPhone: string;
  studentPhone?: string;
  address?: string;
  teacherNote?: string;
  grades?: {
    subject: string;
    uh1?: number | null;
    uh2?: number | null;
    tugas?: number | null;
    uts?: number | null;
    uas?: number | null;
  }[];
}

export const excelService = {
  /**
   * Generates and downloads a clean, ready-to-fill Excel template (.xlsx)
   */
  downloadTemplate(existingSubjects = defaultSubjects) {
    // 1. Sheet Data Siswa
    const sampleHeaders = [
      'NIS *',
      'NISN *',
      'Nama Siswa *',
      'Jenis Kelamin (L/P) *',
      'Nama Orang Tua / Wali *',
      'No WhatsApp Orang Tua *',
      'Alamat Siswa',
      'Catatan Wali Kelas',
    ];

    // Add subject score columns to template: e.g. Matematika_UH1, Matematika_UTS, dst.
    const gradeHeaders: string[] = [];
    existingSubjects.slice(0, 5).forEach((sub) => {
      gradeHeaders.push(`${sub} (UH1)`);
      gradeHeaders.push(`${sub} (UTS)`);
      gradeHeaders.push(`${sub} (UAS)`);
    });

    const fullHeaders = [...sampleHeaders, ...gradeHeaders];

    const sampleRow1 = [
      '23240811',
      '0098471240',
      'Muhammad Rizky Ananda',
      'L',
      'Surya Darmawan',
      '081234567800',
      'Jl. Cendrawasih No. 10',
      'Siswa aktif dan rajin',
      85, 88, 90,
      90, 92, 95,
      80, 85, 88,
      88, 85, 90,
      82, 84, 86,
    ];

    const sampleRow2 = [
      '23240812',
      '0098471241',
      'Nabila Putri Zahra',
      'P',
      'Rahmat Hidayat',
      '081398765400',
      'Jl. Melati Blok B No. 3',
      'Sangat teliti dalam belajar',
      92, 90, 94,
      95, 96, 98,
      88, 90, 92,
      85, 88, 90,
      90, 92, 94,
    ];

    const worksheetData = [fullHeaders, sampleRow1, sampleRow2];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // NIS
      { wch: 14 }, // NISN
      { wch: 25 }, // Nama
      { wch: 20 }, // L/P
      { wch: 22 }, // Orang Tua
      { wch: 22 }, // WA
      { wch: 25 }, // Alamat
      { wch: 25 }, // Catatan
      ...gradeHeaders.map(() => ({ wch: 18 })),
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data_Siswa');

    // Trigger browser download
    XLSX.writeFile(wb, `Template_Data_Siswa_EduWali_${new Date().toISOString().slice(0, 10)}.xlsx`);
  },

  /**
   * Parses an uploaded Excel (.xlsx, .xls) or .csv file and maps rows to Student objects
   */
  async parseExcel(file: File, existingSubjects = defaultSubjects): Promise<{
    success: boolean;
    students: Student[];
    message: string;
    errors: string[];
  }> {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        return { success: false, students: [], message: 'File Excel kosong atau tidak memiliki sheet.', errors: [] };
      }

      const sheet = workbook.Sheets[firstSheetName];
      const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (rawRows.length === 0) {
        return { success: false, students: [], message: 'Tidak ada baris data yang ditemukan di sheet pertama.', errors: [] };
      }

      const parsedStudents: Student[] = [];
      const errors: string[] = [];

      rawRows.forEach((row, index) => {
        const rowNum = index + 2; // header is row 1

        // Helper to find column by flexible key names
        const findVal = (possibleKeys: string[]): string => {
          for (const key of Object.keys(row)) {
            const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
            for (const pk of possibleKeys) {
              if (cleanKey.includes(pk.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
                return String(row[key]).trim();
              }
            }
          }
          return '';
        };

        const name = findVal(['nama', 'namasiswa', 'studentname']);
        const nis = findVal(['nis', 'nomorinduk', 'noinduk']);
        const nisn = findVal(['nisn', 'nomorinduknasional']);
        const genderRaw = findVal(['jeniskelamin', 'jk', 'gender', 'lp']).toUpperCase();
        const parentName = findVal(['orangtua', 'namaorangtua', 'wali', 'ayah', 'ibu']);
        const parentPhone = findVal(['nohp', 'nowa', 'telepon', 'whatsapp', 'kontak']);
        const address = findVal(['alamat', 'address', 'tempattinggal']);
        const teacherNote = findVal(['catatan', 'note', 'keterangan']);

        if (!name && !nis) {
          // Empty row, skip
          return;
        }

        if (!name) {
          errors.push(`Baris ${rowNum}: Nama siswa kosong.`);
          return;
        }

        if (!nis) {
          errors.push(`Baris ${rowNum} (${name}): NIS siswa kosong.`);
          return;
        }

        const gender: Gender = genderRaw.startsWith('P') ? 'P' : 'L';
        const finalNisn = nisn || `009${Math.floor(1000000 + Math.random() * 9000000)}`;

        // Map grades if present in the columns
        const studentGrades: GradeItem[] = existingSubjects.map((sub) => {
          // Look for sub (UH1), sub (UTS), etc.
          let uh1: number | null = null;
          let uh2: number | null = null;
          let tugas: number | null = null;
          let uts: number | null = null;
          let uas: number | null = null;

          Object.keys(row).forEach((colName) => {
            const lowerCol = colName.toLowerCase();
            const lowerSub = sub.toLowerCase().slice(0, 6);
            if (lowerCol.includes(lowerSub)) {
              const val = Number(row[colName]);
              if (!isNaN(val) && row[colName] !== '' && val >= 0) {
                if (lowerCol.includes('uh1') || lowerCol.includes('uh 1')) uh1 = val;
                else if (lowerCol.includes('uh2') || lowerCol.includes('uh 2')) uh2 = val;
                else if (lowerCol.includes('tugas') || lowerCol.includes('pr')) tugas = val;
                else if (lowerCol.includes('uts') || lowerCol.includes('mid')) uts = val;
                else if (lowerCol.includes('uas') || lowerCol.includes('pas') || lowerCol.includes('akhir')) uas = val;
                else if (uh1 === null) uh1 = val; // fallback if just subject name
              }
            }
          });

          return createGradeItem(sub, uh1, uh2, tugas, uts, uas, 75);
        });

        parsedStudents.push({
          id: `std-imp-${Date.now()}-${index}`,
          nis,
          nisn: finalNisn,
          name,
          gender,
          parentName: parentName || 'Orang Tua Siswa',
          parentPhone: parentPhone || '081234567890',
          address: address || '-',
          teacherNote: teacherNote || 'Data diimpor dari file Excel.',
          attendance: {
            sakit: 0,
            izin: 0,
            alpha: 0,
            totalEffectiveDays: 90,
            entries: [],
          },
          grades: studentGrades,
          infractions: [],
          achievements: [],
          updatedAt: new Date().toISOString(),
        });
      });

      if (parsedStudents.length === 0) {
        return {
          success: false,
          students: [],
          message: 'Gagal membaca data siswa. Pastikan kolom memuat minimal "NIS" dan "Nama Siswa".',
          errors,
        };
      }

      return {
        success: true,
        students: parsedStudents,
        message: `Berhasil memproses ${parsedStudents.length} siswa dari file Excel.`,
        errors,
      };
    } catch (e: any) {
      return {
        success: false,
        students: [],
        message: `Terjadi kesalahan membaca file: ${e.message || 'Format file tidak didukung'}`,
        errors: [e.message],
      };
    }
  },
};

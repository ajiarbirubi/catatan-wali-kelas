import React, { useState, useMemo } from 'react';
import { Student, ClassInfo, GradeItem, InfractionItem, AchievementItem, Gender, InfractionCategory, AchievementLevel, AttendanceEntry } from '../types';
import { StudentReportPrintModal } from './StudentReportPrintModal';
import { ExcelImportModal } from './ExcelImportModal';
import { calculateGrade, createGradeItem, defaultSubjects } from '../data/initialData';
import { storageService } from '../services/storageService';
import { 
  Users, 
  Calendar, 
  BookOpen, 
  AlertTriangle, 
  Award, 
  Settings, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  Search, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  X, 
  Eye, 
  TrendingUp, 
  Phone, 
  School,
  Lock,
  MessageCircle,
  FileSpreadsheet,
  Clock,
  Filter,
  Printer
} from 'lucide-react';

interface TeacherDashboardProps {
  students: Student[];
  classInfo: ClassInfo;
  onUpdateStudents: (newStudents: Student[]) => void;
  onUpdateClassInfo: (newClassInfo: ClassInfo) => void;
  onViewStudentAsParent: (studentId: string) => void;
}

type TeacherTab = 'students' | 'attendance' | 'grades' | 'infractions' | 'achievements' | 'settings';

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  students,
  classInfo,
  onUpdateStudents,
  onUpdateClassInfo,
  onViewStudentAsParent,
}) => {
  const [activeTab, setActiveTab] = useState<TeacherTab>('students');
  const [searchStudentText, setSearchStudentText] = useState('');

  // Selected student for grade editing or detail
  const [selectedStudentForGrades, setSelectedStudentForGrades] = useState<string>(
    students[0]?.id || ''
  );

  // Modals state
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  const [showAddInfractionModal, setShowAddInfractionModal] = useState(false);
  const [showAddAchievementModal, setShowAddAchievementModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showAddAttendanceModal, setShowAddAttendanceModal] = useState(false);
  const [showReportPrintModal, setShowReportPrintModal] = useState(false);
  const [printModalStudentId, setPrintModalStudentId] = useState<string>('');
  const [attendanceSubView, setAttendanceSubView] = useState<'daily' | 'summary' | 'journal'>('daily');
  const [dailyAttendanceDate, setDailyAttendanceDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [attendanceFilterDate, setAttendanceFilterDate] = useState<string>('');
  const [attendanceFilterStudent, setAttendanceFilterStudent] = useState<string>('');
  const [attendanceFilterStatus, setAttendanceFilterStatus] = useState<string>('');

  const handleOpenPrintModal = (studentId?: string) => {
    if (studentId) {
      setPrintModalStudentId(studentId);
    } else if (students.length > 0) {
      setPrintModalStudentId(students[0].id);
    }
    setShowReportPrintModal(true);
  };

  // Class settings edit state
  const [classForm, setClassForm] = useState<ClassInfo>(classInfo);
  const [pinForm, setPinForm] = useState({ oldPin: '', newPin: '', confirmPin: '' });
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Handle Excel Batch Import Success
  const handleImportSuccess = (importedStudents: Student[], mode: 'append' | 'replace') => {
    let finalStudents: Student[];
    if (mode === 'replace') {
      finalStudents = importedStudents;
    } else {
      const existingNis = new Set(students.map((s) => s.nis));
      const newOnly = importedStudents.filter((s) => !existingNis.has(s.nis));
      finalStudents = [...students, ...newOnly];
    }
    onUpdateStudents(finalStudents);
    showNotification(`Berhasil memproses ${importedStudents.length} data siswa dari Excel!`);
  };

  // Class Statistics - Nilai yang belum diisi jangan dihitung dalam rata-rata!
  const classStats = useMemo(() => {
    const totalStudents = students.length;
    if (totalStudents === 0) {
      return { totalStudents: 0, classAverage: 0, classAttendanceRate: 0, totalAchievements: 0, totalActiveInfractions: 0 };
    }

    let sumGradeAverages = 0;
    let gradedStudentsCount = 0;
    let sumAttendanceRate = 0;
    let totalAchievements = 0;
    let totalActiveInfractions = 0;

    students.forEach((s) => {
      // Grades: HANYA nilai yang valid yang dihitung
      const validGrades = (s.grades || []).filter(
        (g) => g.average !== null && typeof g.average === 'number' && !isNaN(g.average)
      );
      if (validGrades.length > 0) {
        const studentAvg = validGrades.reduce((a, b) => a + (b.average as number), 0) / validGrades.length;
        sumGradeAverages += studentAvg;
        gradedStudentsCount += 1;
      }

      // Attendance
      const totalAbsent = s.attendance.sakit + s.attendance.izin + s.attendance.alpha;
      const attended = Math.max(0, s.attendance.totalEffectiveDays - totalAbsent);
      const rate = s.attendance.totalEffectiveDays > 0 ? (attended / s.attendance.totalEffectiveDays) * 100 : 100;
      sumAttendanceRate += rate;

      // Achievements
      totalAchievements += (s.achievements || []).length;

      // Active Infractions
      totalActiveInfractions += (s.infractions || []).filter((i) => !i.resolved).length;
    });

    return {
      totalStudents,
      classAverage: gradedStudentsCount > 0 ? Math.round(sumGradeAverages / gradedStudentsCount) : 0,
      classAttendanceRate: Math.round(sumAttendanceRate / totalStudents),
      totalAchievements,
      totalActiveInfractions,
    };
  }, [students]);

  // Filtered Students list
  const filteredStudents = useMemo(() => {
    if (!searchStudentText.trim()) return students;
    const q = searchStudentText.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.nis.includes(q) ||
        s.nisn.includes(q) ||
        s.parentName.toLowerCase().includes(q)
    );
  }, [searchStudentText, students]);

  // Handle Quick Attendance Counter
  const handleUpdateAttendanceCount = (
    studentId: string,
    field: 'sakit' | 'izin' | 'alpha',
    delta: number
  ) => {
    const updated = students.map((s) => {
      if (s.id === studentId) {
        const currentVal = s.attendance[field];
        const nextVal = Math.max(0, currentVal + delta);
        return {
          ...s,
          attendance: {
            ...s.attendance,
            [field]: nextVal,
          },
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });
    onUpdateStudents(updated);
  };

  // Handle Add Attendance Record Per Date
  const handleSaveAttendanceEntry = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const studentId = form.get('studentId') as string;
    const date = (form.get('date') as string) || new Date().toISOString().split('T')[0];
    const status = form.get('status') as 'sakit' | 'izin' | 'alpha';
    const note = form.get('note') as string;

    if (!studentId || !date || !status) {
      showNotification('Harap pilih siswa, tanggal, dan status presensi.', 'error');
      return;
    }

    const newEntry: AttendanceEntry = {
      id: `att-${Date.now()}`,
      date,
      status,
      note: note || '',
    };

    const updatedStudents = students.map((s) => {
      if (s.id === studentId) {
        const existingEntries = s.attendance.entries || [];
        const nextEntries = [newEntry, ...existingEntries];
        const sakitCount = nextEntries.filter((en) => en.status === 'sakit').length;
        const izinCount = nextEntries.filter((en) => en.status === 'izin').length;
        const alphaCount = nextEntries.filter((en) => en.status === 'alpha').length;

        return {
          ...s,
          attendance: {
            ...s.attendance,
            sakit: sakitCount,
            izin: izinCount,
            alpha: alphaCount,
            entries: nextEntries,
          },
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });

    onUpdateStudents(updatedStudents);
    setShowAddAttendanceModal(false);
    const targetStudent = students.find((s) => s.id === studentId);
    showNotification(`Catatan ${status.toUpperCase()} untuk ${targetStudent?.name || 'siswa'} pada tanggal ${date} berhasil disimpan.`);
  };

  const handleDeleteAttendanceEntry = (studentId: string, entryId: string) => {
    if (confirm('Hapus catatan presensi tanggal ini?')) {
      const updatedStudents = students.map((s) => {
        if (s.id === studentId) {
          const nextEntries = (s.attendance.entries || []).filter((en) => en.id !== entryId);
          const sakitCount = nextEntries.filter((en) => en.status === 'sakit').length;
          const izinCount = nextEntries.filter((en) => en.status === 'izin').length;
          const alphaCount = nextEntries.filter((en) => en.status === 'alpha').length;

          return {
            ...s,
            attendance: {
              ...s.attendance,
              sakit: sakitCount,
              izin: izinCount,
              alpha: alphaCount,
              entries: nextEntries,
            },
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      });

      onUpdateStudents(updatedStudents);
      showNotification('Catatan tanggal presensi berhasil dihapus.');
    }
  };

  // Quick Daily Attendance Handler for a given date
  const handleSetStudentDailyAttendance = (
    studentId: string,
    date: string,
    status: 'hadir' | 'sakit' | 'izin' | 'alpha',
    note?: string
  ) => {
    const updated = students.map((s) => {
      if (s.id === studentId) {
        let entries = [...(s.attendance.entries || [])];
        // Remove existing entry for this date
        entries = entries.filter((e) => e.date !== date);

        if (status !== 'hadir') {
          entries.push({
            id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            date,
            status,
            note: note || '',
          });
        }

        const sakitCount = entries.filter((en) => en.status === 'sakit').length;
        const izinCount = entries.filter((en) => en.status === 'izin').length;
        const alphaCount = entries.filter((en) => en.status === 'alpha').length;

        return {
          ...s,
          attendance: {
            ...s.attendance,
            sakit: sakitCount,
            izin: izinCount,
            alpha: alphaCount,
            entries,
          },
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });

    onUpdateStudents(updated);
  };

  // Mark all students present for selected date
  const handleMarkAllPresentForDate = (date: string) => {
    const updated = students.map((s) => {
      const entries = (s.attendance.entries || []).filter((e) => e.date !== date);
      const sakitCount = entries.filter((en) => en.status === 'sakit').length;
      const izinCount = entries.filter((en) => en.status === 'izin').length;
      const alphaCount = entries.filter((en) => en.status === 'alpha').length;
      return {
        ...s,
        attendance: {
          ...s.attendance,
          sakit: sakitCount,
          izin: izinCount,
          alpha: alphaCount,
          entries,
        },
        updatedAt: new Date().toISOString(),
      };
    });
    onUpdateStudents(updated);
    showNotification(`Seluruh siswa berhasil ditandai HADIR pada tanggal ${date}.`);
  };

  // Handle Add/Edit Student
  const handleSaveStudent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const nis = formData.get('nis') as string;
    const nisn = formData.get('nisn') as string;
    const gender = formData.get('gender') as Gender;
    const parentName = formData.get('parentName') as string;
    const parentPhone = formData.get('parentPhone') as string;
    const studentPhone = formData.get('studentPhone') as string;
    const address = formData.get('address') as string;
    const teacherNote = formData.get('teacherNote') as string;

    if (!name || !nis) {
      showNotification('Nama siswa dan NIS wajib diisi!', 'error');
      return;
    }

    if (editingStudent) {
      // Update existing
      const updated = students.map((s) => {
        if (s.id === editingStudent.id) {
          return {
            ...s,
            name,
            nis,
            nisn: nisn || s.nisn,
            gender,
            parentName,
            parentPhone,
            studentPhone,
            address,
            teacherNote,
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      });
      onUpdateStudents(updated);
      setEditingStudent(null);
      showNotification(`Data siswa ${name} berhasil diperbarui.`);
    } else {
      // Add new student
      const newGrades: GradeItem[] = defaultSubjects.map((sub) =>
        createGradeItem(sub, 80, 80, 80, 80, 80, 75)
      );

      const newStudent: Student = {
        id: `std-${Date.now()}`,
        name,
        nis,
        nisn: nisn || `009${Math.floor(1000000 + Math.random() * 9000000)}`,
        gender,
        parentName,
        parentPhone,
        studentPhone,
        address,
        teacherNote: teacherNote || 'Siswa baru terdaftar.',
        attendance: {
          sakit: 0,
          izin: 0,
          alpha: 0,
          totalEffectiveDays: 90,
          entries: [],
        },
        grades: newGrades,
        infractions: [],
        achievements: [],
        updatedAt: new Date().toISOString(),
      };

      onUpdateStudents([...students, newStudent]);
      setShowAddStudentModal(false);
      showNotification(`Siswa baru ${name} berhasil ditambahkan!`);
    }
  };

  // Delete Student
  const handleDeleteStudent = (studentId: string, studentName: string) => {
    if (confirm(`Yakin ingin menghapus data siswa "${studentName}"? Tindakan ini tidak dapat dibatalkan.`)) {
      const updated = students.filter((s) => s.id !== studentId);
      onUpdateStudents(updated);
      if (selectedStudentForGrades === studentId) {
        setSelectedStudentForGrades(updated[0]?.id || '');
      }
      showNotification(`Data siswa ${studentName} berhasil dihapus.`);
    }
  };

  // Grades Management
  const currentGradeStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentForGrades) || students[0] || null;
  }, [selectedStudentForGrades, students]);

  const handleGradeInputChange = (
    subjectId: string,
    field: 'uh1' | 'uh2' | 'tugas' | 'uts' | 'uas' | 'kkm',
    valueStr: string
  ) => {
    if (!currentGradeStudent) return;
    
    // Jika input dikosongkan, simpan sebagai null agar TIDAK dihitung dalam rata-rata!
    let value: number | null = null;
    if (valueStr.trim() !== '') {
      const num = Number(valueStr);
      if (!isNaN(num)) {
        value = Math.max(0, Math.min(100, num));
      }
    }

    const updatedGrades = currentGradeStudent.grades.map((g) => {
      if (g.id === subjectId) {
        const nextUh1 = field === 'uh1' ? value : g.uh1;
        const nextUh2 = field === 'uh2' ? value : g.uh2;
        const nextTugas = field === 'tugas' ? value : g.tugas;
        const nextUts = field === 'uts' ? value : g.uts;
        const nextUas = field === 'uas' ? value : g.uas;
        const nextKkm = field === 'kkm' ? (value !== null ? value : 75) : g.kkm;

        const { average, letterGrade } = calculateGrade(nextUh1, nextUh2, nextTugas, nextUts, nextUas);

        return {
          ...g,
          [field]: field === 'kkm' ? nextKkm : value,
          kkm: nextKkm,
          average,
          letterGrade,
        };
      }
      return g;
    });

    const updatedStudents = students.map((s) => {
      if (s.id === currentGradeStudent.id) {
        return {
          ...s,
          grades: updatedGrades,
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });

    onUpdateStudents(updatedStudents);
  };

  // Add Subject to all students
  const handleAddNewSubject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const subjectName = formData.get('subjectName') as string;
    const kkm = Number(formData.get('kkm')) || 75;

    if (!subjectName.trim()) {
      showNotification('Nama mata pelajaran wajib diisi!', 'error');
      return;
    }

    const updatedStudents = students.map((s) => ({
      ...s,
      grades: [
        ...s.grades,
        createGradeItem(subjectName.trim(), 80, 80, 80, 80, 80, kkm),
      ],
      updatedAt: new Date().toISOString(),
    }));

    onUpdateStudents(updatedStudents);
    setShowAddSubjectModal(false);
    showNotification(`Mata pelajaran "${subjectName}" berhasil ditambahkan ke seluruh siswa!`);
  };

  // Infraction Management
  const handleSaveInfraction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const targetStudentId = form.get('studentId') as string;
    const title = form.get('title') as string;
    const category = form.get('category') as InfractionCategory;
    const points = Number(form.get('points')) || 5;
    const penalty = form.get('penalty') as string;
    const notes = form.get('notes') as string;
    const date = form.get('date') as string || new Date().toISOString().split('T')[0];

    if (!targetStudentId || !title) {
      showNotification('Harap pilih siswa dan judul pelanggaran.', 'error');
      return;
    }

    const newInfraction: InfractionItem = {
      id: `inf-${Date.now()}`,
      date,
      title,
      category,
      points,
      penalty: penalty || 'Teguran lisan & pembinaan',
      resolved: false,
      notes,
    };

    const updatedStudents = students.map((s) => {
      if (s.id === targetStudentId) {
        return {
          ...s,
          infractions: [newInfraction, ...(s.infractions || [])],
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });

    onUpdateStudents(updatedStudents);
    setShowAddInfractionModal(false);
    showNotification('Catatan pelanggaran berhasil disimpan.');
  };

  const handleToggleInfractionResolved = (studentId: string, infractionId: string) => {
    const updatedStudents = students.map((s) => {
      if (s.id === studentId) {
        return {
          ...s,
          infractions: s.infractions.map((inf) =>
            inf.id === infractionId ? { ...inf, resolved: !inf.resolved } : inf
          ),
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });
    onUpdateStudents(updatedStudents);
    showNotification('Status pembinaan berhasil diubah.');
  };

  const handleDeleteInfraction = (studentId: string, infractionId: string) => {
    if (confirm('Hapus catatan pelanggaran ini?')) {
      const updatedStudents = students.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            infractions: s.infractions.filter((inf) => inf.id !== infractionId),
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      });
      onUpdateStudents(updatedStudents);
      showNotification('Catatan pelanggaran berhasil dihapus.');
    }
  };

  // Achievement Management
  const handleSaveAchievement = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const targetStudentId = form.get('studentId') as string;
    const title = form.get('title') as string;
    const level = form.get('level') as AchievementLevel;
    const ranking = form.get('ranking') as string;
    const description = form.get('description') as string;
    const date = form.get('date') as string || new Date().toISOString().split('T')[0];

    if (!targetStudentId || !title || !ranking) {
      showNotification('Harap lengkapi judul prestasi dan juara/peringkat.', 'error');
      return;
    }

    const newAchievement: AchievementItem = {
      id: `ach-${Date.now()}`,
      date,
      title,
      level,
      ranking,
      description: description || 'Mendapatkan penghargaan tingkat ' + level,
    };

    const updatedStudents = students.map((s) => {
      if (s.id === targetStudentId) {
        return {
          ...s,
          achievements: [newAchievement, ...(s.achievements || [])],
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });

    onUpdateStudents(updatedStudents);
    setShowAddAchievementModal(false);
    showNotification('Catatan prestasi berhasil ditambahkan!');
  };

  const handleDeleteAchievement = (studentId: string, achievementId: string) => {
    if (confirm('Hapus catatan prestasi ini?')) {
      const updatedStudents = students.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            achievements: s.achievements.filter((ach) => ach.id !== achievementId),
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      });
      onUpdateStudents(updatedStudents);
      showNotification('Catatan prestasi berhasil dihapus.');
    }
  };

  // Export & Backup
  const handleExportJSON = () => {
    const jsonStr = storageService.exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_eduwali_${classInfo.className.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Database berhasil diexport ke file JSON.');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = storageService.importDatabaseJSON(content);
      if (res.success && res.data) {
        onUpdateStudents(res.data.students);
        onUpdateClassInfo(res.data.classInfo);
        showNotification(res.message);
      } else {
        showNotification(res.message, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetData = () => {
    if (confirm('PERINGATAN: Seluruh data perubahan akan dikembalikan ke data awal demo. Lanjutkan?')) {
      const res = storageService.resetToDefault();
      onUpdateStudents(res.students);
      onUpdateClassInfo(res.classInfo);
      showNotification('Data telah direset ke data sampel awal.');
    }
  };

  // Save Class Info
  const handleSaveClassInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateClassInfo(classForm);
    showNotification('Informasi kelas dan profil wali kelas berhasil disimpan.');
  };

  // Change PIN
  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    const currentStoredPin = storageService.getTeacherPin();
    if (pinForm.oldPin !== currentStoredPin) {
      showNotification('PIN lama salah!', 'error');
      return;
    }
    if (pinForm.newPin.length < 4) {
      showNotification('PIN baru minimal 4 karakter!', 'error');
      return;
    }
    if (pinForm.newPin !== pinForm.confirmPin) {
      showNotification('Konfirmasi PIN baru tidak cocok!', 'error');
      return;
    }
    storageService.setTeacherPin(pinForm.newPin);
    setPinForm({ oldPin: '', newPin: '', confirmPin: '' });
    showNotification('PIN login Guru berhasil diubah!');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Toast Notification */}
      {statusMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-semibold transition animate-fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <X className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Dashboard Guru & Wali Kelas
            </span>
            <span className="text-xs text-slate-400">
              {classInfo.academicYear} ({classInfo.semester})
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Manajemen {classInfo.className}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Wali Kelas: <strong className="text-white">{classInfo.teacherName}</strong> (NIP: {classInfo.teacherNip})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowExcelImportModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            title="Import data siswa dan nilai secara massal dari Excel (.xlsx / .csv)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Import Excel
          </button>
          <button
            onClick={() => handleOpenPrintModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            title="Cetak dan ekspor laporan rapor ke PDF"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            Cetak Rapor (PDF)
          </button>
          <button
            onClick={() => setShowAddStudentModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Siswa Baru
          </button>
          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
            title="Download cadangan data JSON"
          >
            <Download className="w-4 h-4" />
            Backup JSON
          </button>
        </div>
      </div>

      {/* Quick Summary Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-xs">
          <div className="flex justify-center mb-1 text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-500 font-medium">Total Siswa</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">{classStats.totalStudents}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-xs">
          <div className="flex justify-center mb-1 text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-500 font-medium">Rata-Rata Kelas</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">{classStats.classAverage}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-xs">
          <div className="flex justify-center mb-1 text-blue-600">
            <Calendar className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-500 font-medium">Kehadiran Kelas</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">{classStats.classAttendanceRate}%</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-xs">
          <div className="flex justify-center mb-1 text-amber-500">
            <Award className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-500 font-medium">Total Prestasi</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">{classStats.totalAchievements}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-xs col-span-2 sm:col-span-1">
          <div className="flex justify-center mb-1 text-rose-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-500 font-medium">Pelanggaran Aktif</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">{classStats.totalActiveInfractions}</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-xs overflow-x-auto flex gap-1">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition shrink-0 ${
            activeTab === 'students'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Data & Profil Siswa ({students.length})
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition shrink-0 ${
            activeTab === 'attendance'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Rekap Kehadiran
        </button>

        <button
          onClick={() => setActiveTab('grades')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition shrink-0 ${
            activeTab === 'grades'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Nilai Ulangan Mapel
        </button>

        <button
          onClick={() => setActiveTab('infractions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition shrink-0 ${
            activeTab === 'infractions'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Catatan Pelanggaran
        </button>

        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition shrink-0 ${
            activeTab === 'achievements'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          Catatan Prestasi
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition shrink-0 ${
            activeTab === 'settings'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          Pengaturan & Backup
        </button>
      </div>

      {/* ================= TAB 1: DATA SISWA & PROFIL ================= */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Daftar Lengkap Siswa {classInfo.className}
              </h2>
              <p className="text-xs text-slate-500">
                Kelola informasi data pribadi siswa, kontak wali, dan catatan bimbingan karakter.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowExcelImportModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Import dari Excel
              </button>
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Siswa
              </button>
              {/* Search Filter */}
              <div className="relative w-full sm:w-56">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchStudentText}
                  onChange={(e) => setSearchStudentText(e.target.value)}
                  placeholder="Cari siswa/wali..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">No</th>
                  <th className="py-3 px-3">Nama Siswa</th>
                  <th className="py-3 px-2">NIS / NISN</th>
                  <th className="py-3 px-2 text-center">L/P</th>
                  <th className="py-3 px-3">Orang Tua / Wali</th>
                  <th className="py-3 px-3">No. HP Orang Tua</th>
                  <th className="py-3 px-2 text-center">Rata-Rata</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, idx) => {
                    // Nilai yang belum diisi jangan dihitung dalam rata-rata!
                    const validGrades = (student.grades || []).filter(
                      (g) => g.average !== null && typeof g.average === 'number' && !isNaN(g.average)
                    );
                    const avg = validGrades.length > 0
                      ? Math.round(validGrades.reduce((a, b) => a + (b.average as number), 0) / validGrades.length)
                      : null;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 text-slate-500 font-medium">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-800">{student.name}</p>
                          <p className="text-[11px] text-slate-500 truncate max-w-xs">{student.address || '-'}</p>
                        </td>
                        <td className="py-3 px-2 text-slate-600 font-mono text-xs">
                          <div>{student.nis}</div>
                          <div className="text-[11px] text-slate-400">{student.nisn}</div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              student.gender === 'L'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-pink-100 text-pink-800'
                            }`}
                          >
                            {student.gender}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-700">{student.parentName}</td>
                        <td className="py-3 px-3">
                          <a
                            href={`https://wa.me/${student.parentPhone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-medium"
                          >
                            <Phone className="w-3 h-3" />
                            {student.parentPhone}
                          </a>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`font-extrabold px-2 py-0.5 rounded ${avg !== null ? 'text-indigo-700 bg-indigo-50' : 'text-slate-400 bg-slate-100'}`}>
                            {avg !== null ? avg : '-'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenPrintModal(student.id)}
                              title="Cetak & Unduh Rapor Siswa Ini (PDF)"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onViewStudentAsParent(student.id)}
                              title="Lihat Tampilan Rapor Orang Tua"
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingStudent(student)}
                              title="Edit Profil Siswa"
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.id, student.name)}
                              title="Hapus Siswa"
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      Tidak ada data siswa yang cocok dengan pencarian &quot;{searchStudentText}&quot;.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 2: REKAP & JURNAL KEHADIRAN ================= */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">
                  Presensi & Catatan Kehadiran Siswa
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                  Pencatatan per Tanggal
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Catat ketidakhadiran siswa (Sakit, Izin, Alpha) berdasarkan tanggal spesifik beserta surat keterangan resmi.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Sub-view toggle */}
              <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
                <button
                  onClick={() => setAttendanceSubView('daily')}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                    attendanceSubView === 'daily'
                      ? 'bg-indigo-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Presensi Hari Ini
                </button>
                <button
                  onClick={() => setAttendanceSubView('summary')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    attendanceSubView === 'summary'
                      ? 'bg-white text-indigo-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Rekapitulasi Semester
                </button>
                <button
                  onClick={() => setAttendanceSubView('journal')}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                    attendanceSubView === 'journal'
                      ? 'bg-indigo-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Jurnal Riwayat Tanggal
                </button>
              </div>

              {/* Add Date Attendance Button */}
              <button
                onClick={() => setShowAddAttendanceModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Catat Tanggal Lain
              </button>
            </div>
          </div>

          {/* VIEW: PRESENSI HARIAN / HARI INI */}
          {attendanceSubView === 'daily' && (
            <div className="space-y-4">
              <div className="bg-indigo-50/70 border border-indigo-200/80 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-indigo-950">
                      Pilih Tanggal Presensi:
                    </label>
                    <input
                      type="date"
                      value={dailyAttendanceDate}
                      onChange={(e) => setDailyAttendanceDate(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    onClick={() => setDailyAttendanceDate(new Date().toISOString().split('T')[0])}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 cursor-pointer"
                  >
                    Hari Ini ({new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})
                  </button>
                </div>

                <button
                  onClick={() => handleMarkAllPresentForDate(dailyAttendanceDate)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-auto"
                >
                  <Check className="w-4 h-4" />
                  Tandai Semua Siswa Hadir
                </button>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Informasi Otomatis:</strong> Siswa yang ditandai <strong>Sakit, Izin, atau Alpha</strong> pada tanggal ini akan langsung ditampilkan sebagai pemberitahuan khusus di portal wali murid saat orang tua memeriksa rapor melalui NISN ananda.
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3 w-12">No</th>
                      <th className="py-3 px-3">Nama Siswa</th>
                      <th className="py-3 px-3 text-center">Status Kehadiran ({dailyAttendanceDate})</th>
                      <th className="py-3 px-3">Keterangan / Alasan Surat</th>
                      <th className="py-3 px-3 text-center">Rekap Semester</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student, idx) => {
                      const entryForDate = (student.attendance.entries || []).find((e) => e.date === dailyAttendanceDate);
                      const currentStatus: 'hadir' | 'sakit' | 'izin' | 'alpha' = entryForDate ? entryForDate.status : 'hadir';

                      return (
                        <tr key={student.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-3 text-slate-500 font-medium">{idx + 1}</td>
                          <td className="py-3 px-3">
                            <p className="font-bold text-slate-800">{student.name}</p>
                            <p className="text-[11px] text-slate-500 font-mono">NIS: {student.nis} • NISN: {student.nisn}</p>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                              <button
                                type="button"
                                onClick={() => handleSetStudentDailyAttendance(student.id, dailyAttendanceDate, 'hadir')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  currentStatus === 'hadir'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Hadir
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetStudentDailyAttendance(student.id, dailyAttendanceDate, 'sakit', entryForDate?.note || 'Sakit')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  currentStatus === 'sakit'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Sakit (S)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetStudentDailyAttendance(student.id, dailyAttendanceDate, 'izin', entryForDate?.note || 'Izin')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  currentStatus === 'izin'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Izin (I)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetStudentDailyAttendance(student.id, dailyAttendanceDate, 'alpha', entryForDate?.note || 'Tanpa keterangan')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  currentStatus === 'alpha'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Alpha (A)
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            {currentStatus !== 'hadir' ? (
                              <input
                                type="text"
                                defaultValue={entryForDate?.note || ''}
                                onBlur={(e) => {
                                  const val = e.target.value.trim();
                                  if (val !== (entryForDate?.note || '')) {
                                    handleSetStudentDailyAttendance(student.id, dailyAttendanceDate, currentStatus, val);
                                  }
                                }}
                                placeholder="Tuliskan alasan/surat izin..."
                                className="w-full px-2.5 py-1 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                              />
                            ) : (
                              <span className="text-slate-400 text-xs italic">Mengikuti pembelajaran</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              S:{student.attendance.sakit} I:{student.attendance.izin} A:{student.attendance.alpha}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 1: REKAPITULASI KELAS */}
          {attendanceSubView === 'summary' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Klik <strong>&quot;Lihat Tanggal&quot;</strong> pada siswa untuk memeriksa daftar tanggal ketidakhadirannya.</span>
                <span className="bg-slate-100 px-3 py-1 rounded-lg text-slate-700 font-semibold">
                  Hari Efektif Belajar: <strong>90 Hari</strong>
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3">Nama Siswa</th>
                      <th className="py-3 px-3 text-center">Sakit (S)</th>
                      <th className="py-3 px-3 text-center">Izin (I)</th>
                      <th className="py-3 px-3 text-center">Alpha (A)</th>
                      <th className="py-3 px-3 text-center">Total Absen</th>
                      <th className="py-3 px-3 text-center">% Hadir</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-center">Catatan Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student) => {
                      const totalAbs = student.attendance.sakit + student.attendance.izin + student.attendance.alpha;
                      const rate = student.attendance.totalEffectiveDays > 0
                        ? Math.round(((student.attendance.totalEffectiveDays - totalAbs) / student.attendance.totalEffectiveDays) * 100)
                        : 100;
                      const dateEntriesCount = (student.attendance.entries || []).length;

                      return (
                        <tr key={student.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-3 font-semibold text-slate-800">
                            {student.name}
                            <span className="block text-[11px] text-slate-400 font-normal">NIS: {student.nis}</span>
                          </td>

                          {/* SAKIT */}
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                              <button
                                onClick={() => handleUpdateAttendanceCount(student.id, 'sakit', -1)}
                                className="w-5 h-5 rounded bg-white text-blue-700 hover:bg-blue-100 font-bold flex items-center justify-center text-xs"
                                title="Kurangi 1"
                              >
                                -
                              </button>
                              <span className="font-bold text-blue-900 min-w-4 text-center">
                                {student.attendance.sakit}
                              </span>
                              <button
                                onClick={() => handleUpdateAttendanceCount(student.id, 'sakit', 1)}
                                className="w-5 h-5 rounded bg-white text-blue-700 hover:bg-blue-100 font-bold flex items-center justify-center text-xs"
                                title="Tambah 1"
                              >
                                +
                              </button>
                            </div>
                          </td>

                          {/* IZIN */}
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                              <button
                                onClick={() => handleUpdateAttendanceCount(student.id, 'izin', -1)}
                                className="w-5 h-5 rounded bg-white text-amber-700 hover:bg-amber-100 font-bold flex items-center justify-center text-xs"
                                title="Kurangi 1"
                              >
                                -
                              </button>
                              <span className="font-bold text-amber-900 min-w-4 text-center">
                                {student.attendance.izin}
                              </span>
                              <button
                                onClick={() => handleUpdateAttendanceCount(student.id, 'izin', 1)}
                                className="w-5 h-5 rounded bg-white text-amber-700 hover:bg-amber-100 font-bold flex items-center justify-center text-xs"
                                title="Tambah 1"
                              >
                                +
                              </button>
                            </div>
                          </td>

                          {/* ALPHA */}
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center gap-1.5 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">
                              <button
                                onClick={() => handleUpdateAttendanceCount(student.id, 'alpha', -1)}
                                className="w-5 h-5 rounded bg-white text-rose-700 hover:bg-rose-100 font-bold flex items-center justify-center text-xs"
                                title="Kurangi 1"
                              >
                                -
                              </button>
                              <span className="font-bold text-rose-900 min-w-4 text-center">
                                {student.attendance.alpha}
                              </span>
                              <button
                                onClick={() => handleUpdateAttendanceCount(student.id, 'alpha', 1)}
                                className="w-5 h-5 rounded bg-white text-rose-700 hover:bg-rose-100 font-bold flex items-center justify-center text-xs"
                                title="Tambah 1"
                              >
                                +
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center font-bold text-slate-700">
                            {totalAbs} Hari
                          </td>

                          <td className="py-3 px-3 text-center font-extrabold text-slate-900">
                            {rate}%
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                                rate >= 95
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : rate >= 85
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {rate >= 95 ? 'Sangat Rajin' : rate >= 85 ? 'Cukup Baik' : 'Butuh Perhatian'}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => {
                                setAttendanceFilterStudent(student.id);
                                setAttendanceSubView('journal');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-xs font-semibold transition"
                            >
                              <Clock className="w-3 h-3 text-indigo-600" />
                              <span>{dateEntriesCount} Tanggal</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 2: JURNAL RIWAYAT PER TANGGAL */}
          {attendanceSubView === 'journal' && (
            <div className="space-y-4">
              {/* Filter Bar */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 text-slate-500 font-semibold">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filter:</span>
                  </div>

                  {/* Filter by student */}
                  <select
                    value={attendanceFilterStudent}
                    onChange={(e) => setAttendanceFilterStudent(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">-- Semua Siswa --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>

                  {/* Filter by date */}
                  <input
                    type="date"
                    value={attendanceFilterDate}
                    onChange={(e) => setAttendanceFilterDate(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />

                  {/* Filter by status */}
                  <select
                    value={attendanceFilterStatus}
                    onChange={(e) => setAttendanceFilterStatus(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">-- Semua Status --</option>
                    <option value="sakit">Sakit (S)</option>
                    <option value="izin">Izin (I)</option>
                    <option value="alpha">Alpha (A)</option>
                  </select>

                  {(attendanceFilterDate || attendanceFilterStudent || attendanceFilterStatus) && (
                    <button
                      onClick={() => {
                        setAttendanceFilterDate('');
                        setAttendanceFilterStudent('');
                        setAttendanceFilterStatus('');
                      }}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline ml-1"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>

                <span className="text-slate-500 font-semibold">
                  Menampilkan catatan ketidakhadiran per tanggal
                </span>
              </div>

              {/* Journal Table */}
              {(() => {
                const allEntries = students.flatMap((s) =>
                  (s.attendance.entries || []).map((en) => ({
                    ...en,
                    studentId: s.id,
                    studentName: s.name,
                    studentNis: s.nis,
                  }))
                );

                const filteredEntries = allEntries.filter((en) => {
                  if (attendanceFilterStudent && en.studentId !== attendanceFilterStudent) return false;
                  if (attendanceFilterDate && en.date !== attendanceFilterDate) return false;
                  if (attendanceFilterStatus && en.status !== attendanceFilterStatus) return false;
                  return true;
                }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                return filteredEntries.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-3">Tanggal</th>
                          <th className="py-3 px-3">Nama Siswa</th>
                          <th className="py-3 px-3 text-center">Status</th>
                          <th className="py-3 px-3">Alasan / Surat Izin Resmi</th>
                          <th className="py-3 px-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredEntries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                              {new Date(entry.date).toLocaleDateString('id-ID', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </td>
                            <td className="py-3 px-3">
                              <p className="font-bold text-slate-800">{entry.studentName}</p>
                              <p className="text-[11px] text-slate-400">NIS: {entry.studentNis}</p>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                  entry.status === 'sakit'
                                    ? 'bg-blue-100 text-blue-800'
                                    : entry.status === 'izin'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {entry.status === 'sakit'
                                  ? 'Sakit (S)'
                                  : entry.status === 'izin'
                                  ? 'Izin (I)'
                                  : 'Alpha (A)'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-600">
                              {entry.note || '-'}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => handleDeleteAttendanceEntry(entry.studentId, entry.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Hapus catatan presensi tanggal ini"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
                    <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">Tidak Ada Catatan Presensi pada Filter Ini</p>
                    <p className="text-xs text-slate-500">
                      Klik tombol <strong>&quot;Catat Kehadiran per Tanggal&quot;</strong> untuk menambahkan data baru.
                    </p>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: INPUT NILAI ULANGAN ================= */}
      {activeTab === 'grades' && currentGradeStudent && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Input & Rekap Nilai Ulangan per Mata Pelajaran
              </h2>
              <p className="text-xs text-slate-500">
                Pilih siswa untuk mengedit nilai UH1, UH2, Tugas, UTS, dan UAS. Nilai akhir dihitung otomatis.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddSubjectModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Mapel Baru
              </button>
            </div>
          </div>

          {/* Student Selector Dropdown / Chips */}
          <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="student-picker" className="text-xs font-bold text-indigo-950 shrink-0">
                Pilih Siswa yang Diedit:
              </label>
              <select
                id="student-picker"
                value={selectedStudentForGrades}
                onChange={(e) => setSelectedStudentForGrades(e.target.value)}
                className="bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (NIS: {s.nis})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onViewStudentAsParent(currentGradeStudent.id)}
                className="inline-flex items-center gap-1.5 text-xs text-indigo-700 hover:text-indigo-900 font-bold"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview Rapor Orang Tua
              </button>
              <button
                onClick={() => handleOpenPrintModal(currentGradeStudent.id)}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg font-bold border border-emerald-200 transition"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-600" />
                Cetak Rapor Siswa Ini (PDF)
              </button>
            </div>
          </div>

          {/* Grades Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Mata Pelajaran</th>
                  <th className="py-3 px-2 text-center">KKM</th>
                  <th className="py-3 px-2 text-center">UH 1</th>
                  <th className="py-3 px-2 text-center">UH 2</th>
                  <th className="py-3 px-2 text-center">Tugas</th>
                  <th className="py-3 px-2 text-center">UTS</th>
                  <th className="py-3 px-2 text-center">UAS</th>
                  <th className="py-3 px-3 text-center bg-indigo-50/50">Nilai Akhir</th>
                  <th className="py-3 px-2 text-center">Predikat</th>
                  <th className="py-3 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentGradeStudent.grades.map((grade) => {
                  const hasGrade = grade.average !== null && typeof grade.average === 'number';
                  const isBelow = hasGrade && (grade.average as number) < grade.kkm;
                  return (
                    <tr key={grade.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {grade.subject}
                      </td>

                      {/* KKM */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          value={grade.kkm !== null ? grade.kkm : ''}
                          onChange={(e) => handleGradeInputChange(grade.id, 'kkm', e.target.value)}
                          className="w-14 text-center py-1 bg-slate-50 border border-slate-200 rounded font-semibold text-xs focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>

                      {/* UH1 */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          placeholder="-"
                          value={grade.uh1 !== null ? grade.uh1 : ''}
                          onChange={(e) => handleGradeInputChange(grade.id, 'uh1', e.target.value)}
                          className="w-14 text-center py-1 bg-white border border-slate-300 rounded font-semibold text-xs focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>

                      {/* UH2 */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          placeholder="-"
                          value={grade.uh2 !== null ? grade.uh2 : ''}
                          onChange={(e) => handleGradeInputChange(grade.id, 'uh2', e.target.value)}
                          className="w-14 text-center py-1 bg-white border border-slate-300 rounded font-semibold text-xs focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Tugas */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          placeholder="-"
                          value={grade.tugas !== null ? grade.tugas : ''}
                          onChange={(e) => handleGradeInputChange(grade.id, 'tugas', e.target.value)}
                          className="w-14 text-center py-1 bg-white border border-slate-300 rounded font-semibold text-xs focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>

                      {/* UTS */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          placeholder="-"
                          value={grade.uts !== null ? grade.uts : ''}
                          onChange={(e) => handleGradeInputChange(grade.id, 'uts', e.target.value)}
                          className="w-14 text-center py-1 bg-white border border-slate-300 rounded font-semibold text-xs focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>

                      {/* UAS */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          placeholder="-"
                          value={grade.uas !== null ? grade.uas : ''}
                          onChange={(e) => handleGradeInputChange(grade.id, 'uas', e.target.value)}
                          className="w-14 text-center py-1 bg-white border border-slate-300 rounded font-semibold text-xs focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Nilai Akhir */}
                      <td className="py-2.5 px-3 text-center bg-indigo-50/40 font-extrabold text-indigo-900">
                        {hasGrade ? grade.average : '-'}
                      </td>

                      {/* Predikat */}
                      <td className="py-2.5 px-2 text-center">
                        {hasGrade ? (
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-xs ${
                              grade.letterGrade === 'A'
                                ? 'bg-emerald-100 text-emerald-800'
                                : grade.letterGrade === 'B'
                                ? 'bg-blue-100 text-blue-800'
                                : grade.letterGrade === 'C'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {grade.letterGrade}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">-</span>
                        )}
                      </td>

                      {/* Status KKM */}
                      <td className="py-2.5 px-2 text-center">
                        {!hasGrade ? (
                          <span className="text-[11px] text-slate-400 font-medium">Belum Diisi</span>
                        ) : isBelow ? (
                          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                            Remedial
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            Tuntas
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                {(() => {
                  const valid = (currentGradeStudent.grades || []).filter(
                    (g) => g.average !== null && typeof g.average === 'number' && !isNaN(g.average)
                  );
                  const avg = valid.length > 0
                    ? Math.round(valid.reduce((a, b) => a + (b.average as number), 0) / valid.length)
                    : null;
                  return (
                    <tr>
                      <td colSpan={7} className="py-3 px-3 text-right text-slate-700">
                        Rata-Rata Nilai Akhir ({valid.length} dari {currentGradeStudent.grades.length} Mapel Dinilai):
                      </td>
                      <td className="py-3 px-3 text-center text-indigo-700 text-sm font-extrabold bg-indigo-50/50">
                        {avg !== null ? avg : '-'}
                      </td>
                      <td colSpan={2} className="py-3 px-3 text-xs text-slate-500">
                        {avg !== null ? `Predikat: ${avg >= 88 ? 'A' : avg >= 78 ? 'B' : avg >= 68 ? 'C' : 'D'}` : 'Belum ada nilai'}
                      </td>
                    </tr>
                  );
                })()}
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 4: CATATAN PELANGGARAN ================= */}
      {activeTab === 'infractions' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Catatan Kedisiplinan & Pelanggaran Tata Tertib
              </h2>
              <p className="text-xs text-slate-500">
                Rekap catatan pembinaan siswa, bobot poin, dan pemantauan penyelesaian sanksi edukatif.
              </p>
            </div>

            <button
              onClick={() => setShowAddInfractionModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Catat Pelanggaran Baru
            </button>
          </div>

          <div className="space-y-3">
            {students.flatMap((s) => s.infractions.map((inf) => ({ ...inf, student: s }))).length > 0 ? (
              students
                .flatMap((s) => s.infractions.map((inf) => ({ ...inf, student: s })))
                .map((inf) => (
                  <div
                    key={inf.id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      inf.resolved
                        ? 'bg-slate-50 border-slate-200 text-slate-600'
                        : 'bg-rose-50/60 border-rose-200 text-slate-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {inf.student.name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-medium">
                          NIS: {inf.student.nis}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            inf.category === 'Berat'
                              ? 'bg-rose-200 text-rose-900'
                              : inf.category === 'Sedang'
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {inf.category} ({inf.points} Poin)
                        </span>
                      </div>
                      <p className="text-sm font-semibold">{inf.title}</p>
                      <p className="text-xs text-slate-600">
                        <strong>Tindak Lanjut / Sanksi:</strong> {inf.penalty}
                      </p>
                      {inf.notes && (
                        <p className="text-xs text-slate-500 italic">
                          Catatan Wali: &quot;{inf.notes}&quot;
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400">
                        Tanggal: {inf.date}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleToggleInfractionResolved(inf.student.id, inf.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                          inf.resolved
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                      >
                        {inf.resolved ? '✓ Sudah Selesai' : 'Tandai Selesai Dibina'}
                      </button>

                      <button
                        onClick={() => handleDeleteInfraction(inf.student.id, inf.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <div className="py-10 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
                <Check className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-sm font-bold text-slate-700">Tidak Ada Catatan Pelanggaran</p>
                <p className="text-xs text-slate-500">Semua siswa tertib mengikuti tata tertib sekolah.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 5: CATATAN PRESTASI ================= */}
      {activeTab === 'achievements' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Panggung Prestasi & Penghargaan Siswa
              </h2>
              <p className="text-xs text-slate-500">
                Catat capaian kejuaraan akademik, olahraga, seni, dan kepemimpinan siswa {classInfo.className}.
              </p>
            </div>

            <button
              onClick={() => setShowAddAchievementModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Tambah Prestasi Siswa
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.flatMap((s) => s.achievements.map((ach) => ({ ...ach, student: s }))).length > 0 ? (
              students
                .flatMap((s) => s.achievements.map((ach) => ({ ...ach, student: s })))
                .map((ach) => (
                  <div
                    key={ach.id}
                    className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                            {ach.student.name}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 mt-1">
                            {ach.title}
                          </h4>
                        </div>
                        <span className="text-[10px] font-bold uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded shrink-0">
                          {ach.ranking}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{ach.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-amber-200/50 text-xs text-slate-500">
                      <span>Tingkat: <strong className="text-amber-900">{ach.level}</strong></span>
                      <div className="flex items-center gap-2">
                        <span>{ach.date}</span>
                        <button
                          onClick={() => handleDeleteAchievement(ach.student.id, ach.id)}
                          className="p-1 text-rose-500 hover:bg-rose-100 rounded"
                          title="Hapus Prestasi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="col-span-2 py-10 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
                <Award className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700">Belum Ada Catatan Prestasi</p>
                <p className="text-xs text-slate-500">Klik tombol Tambah Prestasi Siswa untuk memasukkan penghargaan.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 6: PENGATURAN KELAS & BACKUP ================= */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Class Information Form */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <School className="w-5 h-5 text-indigo-600" />
              Identitas Sekolah & Wali Kelas
            </h2>
            <form onSubmit={handleSaveClassInfo} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Sekolah</label>
                <input
                  type="text"
                  value={classForm.schoolName}
                  onChange={(e) => setClassForm({ ...classForm, schoolName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Kelas</label>
                <input
                  type="text"
                  value={classForm.className}
                  onChange={(e) => setClassForm({ ...classForm, className: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tahun Ajaran</label>
                <input
                  type="text"
                  value={classForm.academicYear}
                  onChange={(e) => setClassForm({ ...classForm, academicYear: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Semester</label>
                <select
                  value={classForm.semester}
                  onChange={(e) => setClassForm({ ...classForm, semester: e.target.value as 'Ganjil' | 'Genap' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Wali Kelas</label>
                <input
                  type="text"
                  value={classForm.teacherName}
                  onChange={(e) => setClassForm({ ...classForm, teacherName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">NIP Wali Kelas</label>
                <input
                  type="text"
                  value={classForm.teacherNip}
                  onChange={(e) => setClassForm({ ...classForm, teacherNip: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp Wali Kelas</label>
                <input
                  type="text"
                  value={classForm.teacherPhone}
                  onChange={(e) => setClassForm({ ...classForm, teacherPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  placeholder="081234567890"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">Digunakan untuk tombol chat WhatsApp orang tua murid.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Wali Kelas</label>
                <input
                  type="email"
                  value={classForm.teacherEmail}
                  onChange={(e) => setClassForm({ ...classForm, teacherEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Pengumuman Terkini untuk Orang Tua</label>
                <textarea
                  rows={2}
                  value={classForm.announcement || ''}
                  onChange={(e) => setClassForm({ ...classForm, announcement: e.target.value })}
                  placeholder="Tuliskan jadwal rapat, libur, atau agenda penting..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition flex items-center gap-2 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  Simpan Perubahan Informasi
                </button>
              </div>
            </form>
          </div>

          {/* Change PIN Card */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600" />
              Ubah PIN Login Guru
            </h2>
            <form onSubmit={handleChangePin} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm max-w-2xl">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">PIN Saat Ini</label>
                <input
                  type="password"
                  value={pinForm.oldPin}
                  onChange={(e) => setPinForm({ ...pinForm, oldPin: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  placeholder="Default: guru123"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">PIN Baru</label>
                <input
                  type="password"
                  value={pinForm.newPin}
                  onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Konfirmasi PIN Baru</label>
                <input
                  type="password"
                  value={pinForm.confirmPin}
                  onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div className="sm:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold transition"
                >
                  Ganti PIN Guru
                </button>
              </div>
            </form>
          </div>

          {/* Data Backup, Restore & Reset */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-800">
              Pencadangan Data & Reset (Database Tools)
            </h2>
            <p className="text-xs text-slate-500">
              Semua data disimpan di penyimpanan lokal browser. Anda dapat mengunduh salinan cadangan JSON atau memulihkannya kapan saja.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleExportJSON}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                <Download className="w-4 h-4" />
                Unduh Cadangan Database (.json)
              </button>

              <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer">
                <Upload className="w-4 h-4" />
                Pulihkan dari File (.json)
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleResetData}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition"
              >
                <RotateCcw className="w-4 h-4" />
                Reset ke Data Contoh Asli
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: TAMBAH / EDIT SISWA ================= */}
      {(showAddStudentModal || editingStudent) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-800">
                {editingStudent ? `Edit Data: ${editingStudent.name}` : 'Tambah Siswa Baru'}
              </h3>
              <button
                onClick={() => {
                  setShowAddStudentModal(false);
                  setEditingStudent(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Siswa *</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingStudent?.name || ''}
                    placeholder="Contoh: Muhammad Rizki"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIS (Nomor Induk Siswa) *</label>
                  <input
                    type="text"
                    name="nis"
                    defaultValue={editingStudent?.nis || ''}
                    placeholder="Contoh: 23240810"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NISN (10 Digit)</label>
                  <input
                    type="text"
                    name="nisn"
                    defaultValue={editingStudent?.nisn || ''}
                    placeholder="Contoh: 0098471239"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    name="gender"
                    defaultValue={editingStudent?.gender || 'L'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Orang Tua / Wali *</label>
                  <input
                    type="text"
                    name="parentName"
                    defaultValue={editingStudent?.parentName || ''}
                    placeholder="Nama Ayah/Ibu/Wali"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp Orang Tua *</label>
                  <input
                    type="text"
                    name="parentPhone"
                    defaultValue={editingStudent?.parentPhone || ''}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. HP Siswa (Opsional)</label>
                  <input
                    type="text"
                    name="studentPhone"
                    defaultValue={editingStudent?.studentPhone || ''}
                    placeholder="08..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Alamat Tempat Tinggal</label>
                  <input
                    type="text"
                    name="address"
                    defaultValue={editingStudent?.address || ''}
                    placeholder="Jl. / Komp..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Catatan Perkembangan dari Wali Kelas</label>
                  <textarea
                    rows={2}
                    name="teacherNote"
                    defaultValue={editingStudent?.teacherNote || ''}
                    placeholder="Catatan sikap, motivasi belajar, pesan pembinaan..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddStudentModal(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-xs"
                >
                  {editingStudent ? 'Simpan Perubahan' : 'Tambah Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: TAMBAH PELANGGARAN ================= */}
      {showAddInfractionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-800">Catat Pelanggaran Siswa</h3>
              <button
                onClick={() => setShowAddInfractionModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInfraction} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Siswa *</label>
                <select
                  name="studentId"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  required
                >
                  <option value="">-- Pilih Nama Siswa --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.nis})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Kejadian</label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tingkat / Kategori</label>
                  <select
                    name="category"
                    defaultValue="Ringan"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="Ringan">Ringan (5 Poin)</option>
                    <option value="Sedang">Sedang (10-20 Poin)</option>
                    <option value="Berat">Berat (≥ 25 Poin)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis / Judul Pelanggaran *</label>
                <input
                  type="text"
                  name="title"
                  placeholder="Contoh: Terlambat upacara bendera / Tidak memakai atribut lengkap"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Poin Pelanggaran</label>
                <input
                  type="number"
                  name="points"
                  defaultValue={5}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sanksi Edukatif / Tindak Lanjut</label>
                <input
                  type="text"
                  name="penalty"
                  placeholder="Contoh: Pembinaan piket kebersihan / Surat teguran"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan Guru (Opsional)</label>
                <textarea
                  rows={2}
                  name="notes"
                  placeholder="Alasan siswa atau hasil wawancara..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddInfractionModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition shadow-xs"
                >
                  Simpan Pelanggaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: TAMBAH PRESTASI ================= */}
      {showAddAchievementModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-800">Catat Prestasi Siswa</h3>
              <button
                onClick={() => setShowAddAchievementModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAchievement} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Siswa *</label>
                <select
                  name="studentId"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  required
                >
                  <option value="">-- Pilih Nama Siswa --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.nis})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Kejuaraan / Prestasi *</label>
                <input
                  type="text"
                  name="title"
                  placeholder="Contoh: Lomba Cerdas Cermat Bahasa Inggris"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Peringkat / Capaian *</label>
                  <input
                    type="text"
                    name="ranking"
                    placeholder="Juara 1 / Medali Emas"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tingkat Penyelenggaraan</label>
                  <select
                    name="level"
                    defaultValue="Kota/Kab"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="Sekolah">Sekolah</option>
                    <option value="Kecamatan">Kecamatan</option>
                    <option value="Kota/Kab">Kota / Kabupaten</option>
                    <option value="Provinsi">Provinsi</option>
                    <option value="Nasional">Nasional</option>
                    <option value="Internasional">Internasional</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal</label>
                <input
                  type="date"
                  name="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi / Penyelenggara</label>
                <textarea
                  rows={2}
                  name="description"
                  placeholder="Keterangan piagam, cabang lomba, atau penyelenggara..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddAchievementModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition shadow-xs"
                >
                  Simpan Prestasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: TAMBAH MAPEL BARU ================= */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-800">Tambah Mata Pelajaran Baru</h3>
              <button
                onClick={() => setShowAddSubjectModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewSubject} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Mata Pelajaran *</label>
                <input
                  type="text"
                  name="subjectName"
                  placeholder="Contoh: Bahasa Sunda / Robotika / Prakarya"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Standar KKM Minimal</label>
                <input
                  type="number"
                  name="kkm"
                  defaultValue={75}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <p className="text-[11px] text-slate-500">
                Mata pelajaran ini akan ditambahkan ke seluruh siswa di kelas {classInfo.className}.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-xs"
                >
                  Tambahkan ke Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CATAT PRESENSI PER TANGGAL ================= */}
      {showAddAttendanceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Catat Presensi per Tanggal</h3>
                  <p className="text-[11px] text-slate-500">Input ketidakhadiran spesifik dengan tanggal & alasan</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddAttendanceModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAttendanceEntry} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Siswa *</label>
                <select
                  name="studentId"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">-- Pilih Siswa --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.nis})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Absen *</label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Kehadiran *</label>
                  <select
                    name="status"
                    defaultValue="sakit"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                    required
                  >
                    <option value="sakit">Sakit (S)</option>
                    <option value="izin">Izin (I)</option>
                    <option value="alpha">Alpha (A)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan / Alasan Resmi</label>
                <textarea
                  rows={2}
                  name="note"
                  placeholder="Contoh: Sakit demam tinggi (ada surat dokter dari Puskesmas) / Izin acara keluarga di luar kota"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Catatan ini akan langsung dapat dilihat oleh orang tua ananda di portal siswa.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddAttendanceModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-xs"
                >
                  Simpan Presensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Report Card Modal (PDF) */}
      <StudentReportPrintModal
        isOpen={showReportPrintModal}
        onClose={() => setShowReportPrintModal(false)}
        initialStudentId={printModalStudentId || undefined}
        students={students}
        classInfo={classInfo}
      />

      {/* Excel Spreadsheet Import Modal */}
      <ExcelImportModal
        isOpen={showExcelImportModal}
        onClose={() => setShowExcelImportModal(false)}
        onImportSuccess={handleImportSuccess}
        currentStudentCount={students.length}
      />
    </div>
  );
};

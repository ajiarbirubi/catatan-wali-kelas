import React, { useState, useMemo } from 'react';
import { Student, ClassInfo } from '../types';
import { StudentReportPrintModal } from './StudentReportPrintModal';
import { 
  Search, 
  UserCheck, 
  Award, 
  AlertTriangle, 
  Calendar, 
  BookOpen, 
  Phone, 
  Printer, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  MessageCircle,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  User,
  HeartHandshake,
  Clock
} from 'lucide-react';

interface ParentPortalProps {
  students: Student[];
  classInfo: ClassInfo;
  onOpenTeacherLogin: () => void;
  initialStudentId?: string;
}

export const ParentPortal: React.FC<ParentPortalProps> = ({
  students,
  classInfo,
  onOpenTeacherLogin,
  initialStudentId,
}) => {
  const [nisnQuery, setNisnQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(initialStudentId || null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Sync initialStudentId if prop changes
  React.useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId);
      setSearchError(null);
    }
  }, [initialStudentId]);

  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || null;
  }, [selectedStudentId, students]);

  // Handle NISN Search Submit
  const handleSearchNISN = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = nisnQuery.trim();
    if (!clean) {
      setSearchError('Silakan masukkan nomor NISN ananda.');
      return;
    }
    const found = students.find(
      (s) => s.nisn === clean || s.nisn.toLowerCase() === clean.toLowerCase()
    );
    if (found) {
      setSelectedStudentId(found.id);
      setSearchError(null);
    } else {
      setSelectedStudentId(null);
      setSearchError(
        `Data siswa dengan NISN "${clean}" tidak ditemukan. Pastikan 10 digit NISN yang Anda masukkan sudah benar.`
      );
    }
  };

  const handleQuickDemoNISN = (nisn: string) => {
    setNisnQuery(nisn);
    const found = students.find((s) => s.nisn === nisn);
    if (found) {
      setSelectedStudentId(found.id);
      setSearchError(null);
    }
  };

  const handleResetSearch = () => {
    setSelectedStudentId(null);
    setNisnQuery('');
    setSearchError(null);
  };

  // Check today's date and whether student is recorded absent today
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  const todayAbsence = useMemo(() => {
    if (!selectedStudent?.attendance?.entries) return null;
    return selectedStudent.attendance.entries.find((e) => e.date === todayStr) || null;
  }, [selectedStudent, todayStr]);

  // Calculate statistics for selected student - ignoring unentered grades!
  const studentStats = useMemo(() => {
    if (!selectedStudent) return null;
    const { sakit, izin, alpha, totalEffectiveDays } = selectedStudent.attendance;
    const totalAbsent = sakit + izin + alpha;
    const attendedDays = Math.max(0, totalEffectiveDays - totalAbsent);
    const attendancePercentage = totalEffectiveDays > 0 
      ? Math.round((attendedDays / totalEffectiveDays) * 100) 
      : 100;

    const grades = selectedStudent.grades || [];
    // HANYA nilai yang sudah diisi yang dihitung rata-ratanya!
    const validGrades = grades.filter(
      (g) => g.average !== null && typeof g.average === 'number' && !isNaN(g.average)
    );
    const averageGrade = validGrades.length > 0
      ? Math.round(validGrades.reduce((acc, g) => acc + (g.average as number), 0) / validGrades.length)
      : null;

    const belowKkmCount = validGrades.filter((g) => (g.average as number) < g.kkm).length;
    const unresolvedInfractions = (selectedStudent.infractions || []).filter((i) => !i.resolved).length;
    const totalAchievements = (selectedStudent.achievements || []).length;

    return {
      attendancePercentage,
      attendedDays,
      totalAbsent,
      averageGrade,
      totalGradesCount: grades.length,
      gradedCount: validGrades.length,
      belowKkmCount,
      unresolvedInfractions,
      totalAchievements,
    };
  }, [selectedStudent]);

  const handlePrint = () => {
    setShowPrintModal(true);
  };

  const handleWhatsApp = (studentName: string) => {
    const rawPhone = classInfo.teacherPhone.replace(/[^0-9]/g, '');
    const cleanPhone = rawPhone.startsWith('0') ? '62' + rawPhone.slice(1) : rawPhone;
    const message = encodeURIComponent(
      `Halo Ibu/Bapak ${classInfo.teacherName}, saya orang tua dari ananda *${studentName}* (${classInfo.className}). Ingin menanyakan perihal perkembangan belajar ananda.`
    );
    const waUrl = `https://wa.me/${cleanPhone}?text=${message}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Welcome Banner */}
      <div className="no-print bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Portal Informasi Orang Tua Siswa
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {classInfo.schoolName}
          </h1>
          <p className="text-indigo-100 text-sm sm:text-base">
            Ruang komunikasi & transparansi perkembangan belajar ananda di{' '}
            <span className="font-semibold text-white">{classInfo.className}</span>, 
            Tahun Ajaran {classInfo.academicYear} ({classInfo.semester}).
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-indigo-100">
            <span className="bg-black/20 px-3 py-1 rounded-lg">
              Wali Kelas: <strong className="text-white">{classInfo.teacherName}</strong>
            </span>
            <span className="bg-black/20 px-3 py-1 rounded-lg">
              Kontak: <strong className="text-white">{classInfo.teacherPhone}</strong>
            </span>
          </div>
        </div>

        {/* Announcement callout */}
        {classInfo.announcement && (
          <div className="mt-4 pt-4 border-t border-white/20 text-xs sm:text-sm text-indigo-50 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <span>{classInfo.announcement}</span>
          </div>
        )}
      </div>

      {/* Student Selection / NISN Search Card */}
      <div className="no-print bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-slate-200">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Pencarian Rapor Berdasarkan NISN
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              Pencarian Data Siswa Menggunakan NISN
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Demi menjaga kerahasiaan dan privasi data rapor ananda, silakan masukkan 10 digit <strong>Nomor Induk Siswa Nasional (NISN)</strong> milik ananda.
            </p>
          </div>

          {/* Search Input Bar for NISN Only */}
          <form onSubmit={handleSearchNISN} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-500">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={nisnQuery}
                  onChange={(e) => {
                    setNisnQuery(e.target.value.replace(/[^0-9]/g, ''));
                    if (searchError) setSearchError(null);
                  }}
                  placeholder="Ketik 10 digit NISN siswa (contoh: 0098471231)..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm sm:text-base font-mono font-semibold transition"
                />
                {nisnQuery && (
                  <button
                    type="button"
                    onClick={() => setNisnQuery('')}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-slate-400 hover:text-slate-600 font-sans"
                  >
                    Hapus
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Cari Data Siswa</span>
              </button>
            </div>
          </form>

          {/* Search Error Alert */}
          {searchError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs sm:text-sm text-rose-700 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{searchError}</p>
                <p className="text-xs text-rose-600 mt-0.5">
                  Nomor NISN dapat dilihat pada kartu pelajar, buku rapor lama, atau hubungi Wali Kelas jika Anda belum mengetahui NISN ananda.
                </p>
              </div>
            </div>
          )}

          {/* Quick Demo NISN Chips for Testing */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Uji Coba Cepat (Klik NISN contoh untuk simulasi):
            </p>
            <div className="flex flex-wrap gap-1.5">
              {students.slice(0, 5).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleQuickDemoNISN(s.nisn)}
                  className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition ${
                    selectedStudentId === s.id
                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                      : 'bg-slate-50 hover:bg-indigo-50 border-slate-200 text-slate-600 hover:border-indigo-300'
                  }`}
                >
                  {s.nisn} ({s.name.split(' ')[0]})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Student Details View */}
      {selectedStudent && studentStats ? (
        <div className="space-y-6">
          {/* Privacy Guarantee & Quick Controls */}
          <div className="no-print bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-emerald-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>Jaminan Privasi:</strong> Anda sedang melihat laporan khusus ananda{' '}
                <strong>{selectedStudent.name}</strong> (NISN: <span className="font-mono font-bold">{selectedStudent.nisn}</span>). Data siswa lain tidak dapat diakses.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                onClick={handleResetSearch}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Ganti NISN / Cari Ulang
              </button>
              <button
                onClick={() => setShowPrintModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Laporan Rapor (PDF)
              </button>
              <button
                onClick={() => handleWhatsApp(selectedStudent.name)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Hubungi Wali Kelas
              </button>
            </div>
          </div>

          {/* ALERT NOTIFIKASI KEHADIRAN HARI INI */}
          {todayAbsence ? (
            <div className="no-print bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-amber-700" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Pemberitahuan Presensi Hari Ini
                    </span>
                    <span className="text-xs text-amber-900 font-medium">
                      {todayFormatted}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-amber-950">
                    Ananda Tercatat <span className="underline uppercase tracking-wide">{todayAbsence.status === 'sakit' ? 'SAKIT (S)' : todayAbsence.status === 'izin' ? 'IZIN (I)' : 'ALPHA (A)'}</span> Hari Ini
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-900">
                    Keterangan dari Wali Kelas:{' '}
                    <span className="font-semibold italic bg-amber-100/70 px-2 py-0.5 rounded text-amber-950">
                      {todayAbsence.note || 'Tidak ada catatan tambahan'}
                    </span>
                  </p>
                  <p className="text-[11px] text-amber-800 mt-1">
                    Jika ada kesalahan pencatatan atau hendak mengirimkan surat izin/dokter, silakan hubungi Wali Kelas.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleWhatsApp(selectedStudent.name)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0 self-stretch sm:self-auto justify-center cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                Konfirmasi ke Wali Kelas via WA
              </button>
            </div>
          ) : (
            <div className="no-print bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between gap-2 text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Status Hari Ini (<strong>{todayFormatted}</strong>): Ananda tercatat{' '}
                  <strong className="text-emerald-950">HADIR / Mengikuti Kegiatan Belajar di Sekolah</strong>.
                </span>
              </div>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold">
                KBM Berjalan Normal
              </span>
            </div>
          )}

          {/* Student Profile Card (Included in Print) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 print-break-inside-avoid">
            {/* School Header for Print */}
            <div className="print-only text-center border-b-2 border-slate-900 pb-4 mb-6">
              <h1 className="text-xl font-bold uppercase tracking-wider">{classInfo.schoolName}</h1>
              <p className="text-xs">LAPORAN PERKEMBANGAN & EVALUASI BELAJAR SISWA</p>
              <p className="text-xs text-slate-600">Tahun Ajaran: {classInfo.academicYear} | Semester: {classInfo.semester}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-2xl font-bold shadow-inner">
                  {selectedStudent.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                      {selectedStudent.name}
                    </h2>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {selectedStudent.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Kelas: <strong className="text-slate-700">{classInfo.className}</strong> • 
                    NIS: <strong className="text-slate-700">{selectedStudent.nis}</strong> • 
                    NISN: <strong className="text-slate-700">{selectedStudent.nisn}</strong>
                  </p>
                  <p className="text-xs text-slate-500">
                    Nama Orang Tua/Wali: <strong className="text-slate-700">{selectedStudent.parentName}</strong>
                    {selectedStudent.address && ` • Alamat: ${selectedStudent.address}`}
                  </p>
                </div>
              </div>

              {/* Status Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 w-full sm:w-auto">
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-center">
                  <p className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
                    Rata-Rata Nilai
                  </p>
                  <p className="text-xl font-extrabold text-indigo-900">
                    {studentStats.averageGrade}
                  </p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                  <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
                    Kehadiran
                  </p>
                  <p className="text-xl font-extrabold text-emerald-900">
                    {studentStats.attendancePercentage}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Ringkasan Kehadiran */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4 print-break-inside-avoid">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Rekapitulasi Kehadiran Siswa
              </h3>
              <span className="text-xs text-slate-500">
                Total Hari Efektif: {selectedStudent.attendance.totalEffectiveDays} Hari
              </span>
            </div>

            {/* Attendance Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-center">
                <p className="text-xs font-semibold text-emerald-700">Hadir Masuk</p>
                <p className="text-2xl font-bold text-emerald-800 mt-1">
                  {studentStats.attendedDays}
                </p>
                <p className="text-[11px] text-emerald-600 mt-0.5">
                  {studentStats.attendancePercentage}% Hari
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-center">
                <p className="text-xs font-semibold text-blue-700">Sakit (S)</p>
                <p className="text-2xl font-bold text-blue-800 mt-1">
                  {selectedStudent.attendance.sakit}
                </p>
                <p className="text-[11px] text-blue-600 mt-0.5">Dengan surat dokter</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-center">
                <p className="text-xs font-semibold text-amber-700">Izin (I)</p>
                <p className="text-2xl font-bold text-amber-800 mt-1">
                  {selectedStudent.attendance.izin}
                </p>
                <p className="text-[11px] text-amber-600 mt-0.5">Pemberitahuan resmi</p>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-center">
                <p className="text-xs font-semibold text-rose-700">Tanpa Keterangan (A)</p>
                <p className="text-2xl font-bold text-rose-800 mt-1">
                  {selectedStudent.attendance.alpha}
                </p>
                <p className="text-[11px] text-rose-600 mt-0.5">Alpha / Bolos</p>
              </div>
            </div>

            {/* Attendance Health Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Indikator Tingkat Kehadiran:</span>
                <span className="font-semibold text-slate-700">
                  {studentStats.attendancePercentage >= 95
                    ? 'Sangat Disiplin (≥ 95%)'
                    : studentStats.attendancePercentage >= 85
                    ? 'Baik (≥ 85%)'
                    : 'Perlu Perhatian Khusus (< 85%)'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-500 ${
                    studentStats.attendancePercentage >= 90
                      ? 'bg-emerald-500'
                      : studentStats.attendancePercentage >= 80
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, studentStats.attendancePercentage)}%` }}
                />
              </div>
            </div>

            {/* Riwayat Catatan Kehadiran Per Tanggal */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Catatan Riwayat Ketidakhadiran per Tanggal
                </h4>
                <span className="text-[11px] font-semibold text-slate-500">
                  Total {(selectedStudent.attendance.entries || []).length} Hari Tercatat
                </span>
              </div>

              {(selectedStudent.attendance.entries && selectedStudent.attendance.entries.length > 0) ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Tanggal Ketidakhadiran</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3">Keterangan / Alasan Resmi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...selectedStudent.attendance.entries]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((entry) => (
                          <tr key={entry.id} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                              {new Date(entry.date).toLocaleDateString('id-ID', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
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
                            <td className="py-2.5 px-3 text-slate-600">
                              {entry.note || 'Tidak ada catatan keterangan'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-center flex items-center justify-center gap-2 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Kehadiran 100% Sempurna! Ananda belum pernah memiliki catatan sakit, izin, atau alpha.</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Nilai Ulangan & Evaluasi Akademik */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4 print-break-inside-avoid">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Rapor Nilai Ulangan per Mata Pelajaran
                </h3>
                <p className="text-xs text-slate-500">
                  Kriteria Ketuntasan Minimal (KKM): Rata-rata 75
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {studentStats.gradedCount - studentStats.belowKkmCount} Tuntas
                </span>
                {studentStats.belowKkmCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md font-semibold">
                    <XCircle className="w-3.5 h-3.5" />
                    {studentStats.belowKkmCount} Remedial
                  </span>
                )}
                {studentStats.totalGradesCount - studentStats.gradedCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {studentStats.totalGradesCount - studentStats.gradedCount} Belum Dinilai
                  </span>
                )}
              </div>
            </div>

            {/* Grades Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3.5">Mata Pelajaran</th>
                    <th className="py-3 px-2 text-center">KKM</th>
                    <th className="py-3 px-2 text-center">UH 1</th>
                    <th className="py-3 px-2 text-center">UH 2</th>
                    <th className="py-3 px-2 text-center">Tugas</th>
                    <th className="py-3 px-2 text-center">UTS</th>
                    <th className="py-3 px-2 text-center">UAS</th>
                    <th className="py-3 px-3 text-center bg-indigo-50/50">Nilai Akhir</th>
                    <th className="py-3 px-3 text-center">Predikat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedStudent.grades.map((grade) => {
                    const hasGrade = grade.average !== null && typeof grade.average === 'number';
                    const isBelowKkm = hasGrade && (grade.average as number) < grade.kkm;
                    return (
                      <tr
                        key={grade.id}
                        className={`hover:bg-slate-50/80 transition ${
                          isBelowKkm ? 'bg-rose-50/30' : ''
                        }`}
                      >
                        <td className="py-3 px-3.5 font-medium text-slate-800">
                          {grade.subject}
                          {isBelowKkm && (
                            <span className="ml-2 text-[10px] text-rose-600 font-bold px-1.5 py-0.5 rounded bg-rose-100">
                              Remedial
                            </span>
                          )}
                          {!hasGrade && (
                            <span className="ml-2 text-[10px] text-slate-400 italic">
                              (Belum dinilai)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center text-slate-500">{grade.kkm}</td>
                        <td className="py-3 px-2 text-center text-slate-700">{grade.uh1 !== null ? grade.uh1 : '-'}</td>
                        <td className="py-3 px-2 text-center text-slate-700">{grade.uh2 !== null ? grade.uh2 : '-'}</td>
                        <td className="py-3 px-2 text-center text-slate-700">{grade.tugas !== null ? grade.tugas : '-'}</td>
                        <td className="py-3 px-2 text-center text-slate-700">{grade.uts !== null ? grade.uts : '-'}</td>
                        <td className="py-3 px-2 text-center text-slate-700">{grade.uas !== null ? grade.uas : '-'}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-900 bg-indigo-50/40">
                          <span
                            className={`px-2 py-0.5 rounded font-extrabold ${
                              !hasGrade
                                ? 'text-slate-400'
                                : isBelowKkm
                                ? 'text-rose-600 bg-rose-100'
                                : 'text-indigo-900'
                            }`}
                          >
                            {hasGrade ? grade.average : '-'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
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
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                  <tr>
                    <td colSpan={7} className="py-3 px-3.5 text-right text-slate-700">
                      Rata-Rata Nilai Akhir ({studentStats.gradedCount} dari {studentStats.totalGradesCount} Mapel):
                    </td>
                    <td className="py-3 px-3 text-center text-indigo-700 text-base bg-indigo-50/50">
                      {studentStats.averageGrade !== null ? studentStats.averageGrade : '-'}
                    </td>
                    <td className="py-3 px-3 text-center text-xs text-slate-700">
                      {studentStats.averageGrade !== null ? (
                        studentStats.averageGrade >= 88
                          ? 'A (Sangat Baik)'
                          : studentStats.averageGrade >= 78
                          ? 'B (Baik)'
                          : studentStats.averageGrade >= 68
                          ? 'C (Cukup)'
                          : 'D (Kurang)'
                      ) : (
                        <span className="text-slate-400 font-normal">Belum Ada Nilai</span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Section 3 & 4: Prestasi & Pelanggaran Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Prestasi */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4 print-break-inside-avoid">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Catatan Prestasi & Kejuaraan
                </h3>
                <span className="text-xs bg-amber-50 text-amber-800 font-bold px-2.5 py-0.5 rounded-full">
                  {selectedStudent.achievements.length} Prestasi
                </span>
              </div>

              {selectedStudent.achievements.length > 0 ? (
                <div className="space-y-3">
                  {selectedStudent.achievements.map((ach) => (
                    <div
                      key={ach.id}
                      className="p-3.5 bg-amber-50/50 border border-amber-200/70 rounded-xl space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                          {ach.title}
                        </h4>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 shrink-0">
                          {ach.ranking}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{ach.description}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-amber-200/40">
                        <span>Tingkat: <strong className="text-amber-800">{ach.level}</strong></span>
                        <span>{ach.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">
                    Belum ada catatan kejuaraan pada semester ini. Wali kelas terus mendorong potensi ananda di bidang akademik maupun ekstrakurikuler.
                  </p>
                </div>
              )}
            </div>

            {/* Pelanggaran / Kedisiplinan */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4 print-break-inside-avoid">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  Catatan Kedisiplinan & Tata Tertib
                </h3>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    selectedStudent.infractions.length === 0
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'bg-rose-50 text-rose-800'
                  }`}
                >
                  {selectedStudent.infractions.length} Catatan
                </span>
              </div>

              {selectedStudent.infractions.length > 0 ? (
                <div className="space-y-3">
                  {selectedStudent.infractions.map((inf) => (
                    <div
                      key={inf.id}
                      className={`p-3.5 rounded-xl border space-y-2 ${
                        inf.resolved
                          ? 'bg-slate-50 border-slate-200'
                          : 'bg-rose-50/60 border-rose-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                          {inf.title}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                            inf.resolved
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-200 text-rose-900'
                          }`}
                        >
                          {inf.resolved ? '✓ Selesai Dibina' : 'Perlu Pendampingan'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        <strong>Tindakan Pembinaan:</strong> {inf.penalty}
                      </p>
                      {inf.notes && (
                        <p className="text-xs text-slate-500 italic">
                          Catatan: &quot;{inf.notes}&quot;
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                        <span>Bobot: {inf.points} Poin ({inf.category})</span>
                        <span>{inf.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
                  <p className="text-sm font-bold text-emerald-900">Sangat Disiplin!</p>
                  <p className="text-xs text-emerald-700">
                    Ananda tidak memiliki catatan pelanggaran tata tertib sekolah. Terima kasih kepada orang tua atas didikan disiplin di rumah.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Catatan Wali Kelas */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-3 print-break-inside-avoid">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-indigo-600" />
              Pesan & Catatan Khusus Wali Kelas
            </h3>
            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 text-sm text-slate-700 leading-relaxed italic">
              &quot;{selectedStudent.teacherNote || 'Ananda menunjukkan perkembangan belajar dan karakter yang baik. Diharapkan bimbingan dan doa orang tua selalu menyertai perjalanan belajarnya di sekolah.'}&quot;
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
              <span>Wali Kelas: <strong className="text-slate-800">{classInfo.teacherName}</strong></span>
              <span>Terakhir diperbarui: {new Date(selectedStudent.updatedAt).toLocaleDateString('id-ID')}</span>
            </div>
          </div>

          {/* Bottom Action Footer for Parent */}
          <div className="no-print bg-slate-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-base">Butuh Konsultasi Tambahan?</h4>
              <p className="text-xs text-slate-300">
                Wali kelas siap berdiskusi mengenai capaian belajar dan masa depan ananda.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setSelectedStudentId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition"
              >
                Cari Siswa Lain
              </button>
              <button
                onClick={() => handleWhatsApp(selectedStudent.name)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-sm transition"
              >
                <MessageCircle className="w-4 h-4" />
                Hubungi Ibu/Bapak Wali Kelas via WA
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State when no student is chosen */
        <div className="no-print bg-white rounded-2xl p-8 sm:p-10 text-center border border-slate-200 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <Search className="w-8 h-8 text-indigo-500" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg font-bold text-slate-800">
              Masukkan NISN untuk Melihat Rapor Ananda
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Ketikkan 10 digit Nomor Induk Siswa Nasional (NISN) ananda pada formulir pencarian di atas untuk mengakses informasi presensi, nilai ulangan, dan prestasi secara aman dan privat.
            </p>
          </div>
          {students.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleQuickDemoNISN(students[0].nisn)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition border border-indigo-200 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                Coba Buka Contoh Rapor: {students[0].name} (NISN: {students[0].nisn})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Official Printable Report Card Modal (PDF) */}
      <StudentReportPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        initialStudentId={selectedStudentId || undefined}
        students={students}
        classInfo={classInfo}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Student, ClassInfo } from '../types';
import { Printer, Download, X, GraduationCap, ShieldCheck, CheckCircle2, AlertTriangle, Calendar, Award } from 'lucide-react';

interface StudentReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStudentId?: string;
  students: Student[];
  classInfo: ClassInfo;
}

export const StudentReportPrintModal: React.FC<StudentReportPrintModalProps> = ({
  isOpen,
  onClose,
  initialStudentId,
  students,
  classInfo,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || students[0]?.id || ''
  );

  useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId);
    } else if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [initialStudentId, students]);

  if (!isOpen) return null;

  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  if (!currentStudent) return null;

  // Calculations
  const { sakit, izin, alpha, totalEffectiveDays } = currentStudent.attendance;
  const totalAbsent = sakit + izin + alpha;
  const attendedDays = Math.max(0, totalEffectiveDays - totalAbsent);
  const attendancePercentage = totalEffectiveDays > 0 
    ? Math.round((attendedDays / totalEffectiveDays) * 100) 
    : 100;

  const grades = currentStudent.grades || [];
  // Nilai yang belum diisi tidak ikut dihitung dalam rata-rata!
  const validGrades = grades.filter(
    (g) => g.average !== null && typeof g.average === 'number' && !isNaN(g.average)
  );
  const averageGrade = validGrades.length > 0
    ? Math.round(validGrades.reduce((acc, g) => acc + (g.average as number), 0) / validGrades.length)
    : null;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAbsence = (currentStudent.attendance.entries || []).find((e) => e.date === todayStr);

  const handlePrint = () => {
    window.print();
  };

  const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      {/* Modal Container */}
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Control Bar (Hidden when printed) */}
        <div className="no-print bg-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Cetak & Ekspor Laporan Rapor Siswa</h3>
              <p className="text-xs text-slate-300">Format Resmi Rapor Siswa Siap Cetak atau Simpan ke PDF</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Student Picker */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              <label htmlFor="modal-student-picker" className="text-xs text-slate-300 shrink-0">
                Pilih Siswa:
              </label>
              <select
                id="modal-student-picker"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id} className="text-slate-900">
                    {s.name} ({s.nis})
                  </option>
                ))}
              </select>
            </div>

            {/* Print / Save PDF Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info Tip for PDF Download (Hidden on print) */}
        <div className="no-print bg-indigo-50 border-b border-indigo-100 px-4 py-2.5 flex items-center justify-between text-xs text-indigo-900 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold">💡 Petunjuk:</span>
            <span>
              Pada jendela dialog cetak browser, pilih <strong>Destination: &quot;Save as PDF&quot;</strong> (Simpan sebagai PDF) untuk mengunduh dokumen secara digital.
            </span>
          </div>
          <span className="text-[11px] text-indigo-600 font-medium hidden sm:inline">
            Standar Kertas: A4
          </span>
        </div>

        {/* Scrollable Printable Document Preview Area */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-100 flex-1">
          {/* A4 Paper Mockup (The actual printed document) */}
          <div className="printable-document bg-white text-slate-900 shadow-md mx-auto max-w-[210mm] p-6 sm:p-10 rounded-xl sm:rounded-none border border-slate-200 sm:border-none space-y-5 print:shadow-none print:border-none print:p-0 print:m-0">
            
            {/* 1. KOP SURAT RESMI SEKOLAH */}
            <div className="border-b-2 border-slate-900 pb-2 mb-2">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-slate-900 flex items-center justify-center p-2 shrink-0">
                  <GraduationCap className="w-10 h-10 text-slate-900" />
                </div>
                <div className="text-center flex-1 space-y-0.5">
                  <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-slate-700">
                    PEMERINTAH DAERAH PROVINSI / KOTA
                  </p>
                  <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-700">
                    DINAS PENDIDIKAN DAN KEBUDAYAAN
                  </p>
                  <h1 className="text-base sm:text-xl font-extrabold uppercase tracking-wide text-slate-950 font-heading">
                    {classInfo.schoolName}
                  </h1>
                  <p className="text-[10px] sm:text-xs text-slate-600 leading-tight">
                    {classInfo.schoolAddress || 'Jl. Pendidikan Harapan No. 45, Telp. (022) 7654321'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Email: {classInfo.teacherEmail} • Website: smpn1bintang.sch.id
                  </p>
                </div>
              </div>
              {/* Double Line Border */}
              <div className="mt-3 border-b-4 border-slate-950" />
              <div className="mt-0.5 border-b border-slate-950" />
            </div>

            {/* 2. JUDUL DOKUMEN RAPOR */}
            <div className="text-center space-y-0.5 py-1">
              <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider underline">
                LAPORAN CAPAIAN HASIL BELAJAR SISWA
              </h2>
              <p className="text-xs text-slate-600">
                Tahun Ajaran {classInfo.academicYear} — Semester {classInfo.semester}
              </p>
            </div>

            {/* 3. IDENTITAS PESERTA DIDIK (2 Kolom Rapi) */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs border border-slate-300 p-3 rounded-lg bg-slate-50/50">
              <div className="flex">
                <span className="w-32 font-semibold text-slate-600">Nama Siswa</span>
                <span className="font-bold text-slate-950">: {currentStudent.name}</span>
              </div>
              <div className="flex">
                <span className="w-32 font-semibold text-slate-600">Kelas / Rombel</span>
                <span className="font-bold text-slate-950">: {classInfo.className}</span>
              </div>
              <div className="flex">
                <span className="w-32 font-semibold text-slate-600">Nomor Induk (NIS)</span>
                <span className="text-slate-800">: {currentStudent.nis}</span>
              </div>
              <div className="flex">
                <span className="w-32 font-semibold text-slate-600">Wali Kelas</span>
                <span className="text-slate-800">: {classInfo.teacherName}</span>
              </div>
              <div className="flex">
                <span className="w-32 font-semibold text-slate-600">NISN</span>
                <span className="text-slate-800">: {currentStudent.nisn}</span>
              </div>
              <div className="flex">
                <span className="w-32 font-semibold text-slate-600">Nama Orang Tua/Wali</span>
                <span className="text-slate-800">: {currentStudent.parentName}</span>
              </div>
              <div className="flex">
                <span className="w-32 font-semibold text-slate-600">Jenis Kelamin</span>
                <span className="text-slate-800">: {currentStudent.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
              </div>
              <div className="flex">
                <span className="w-32 font-semibold text-slate-600">No. Kontak Orang Tua</span>
                <span className="text-slate-800">: {currentStudent.parentPhone}</span>
              </div>
            </div>

            {/* Pemberitahuan Jika Tidak Hadir Hari Ini */}
            {todayAbsence && (
              <div className="p-2.5 border border-amber-400 bg-amber-50/80 rounded-lg text-xs text-amber-950 flex items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-amber-900">Pemberitahuan Hari Ini ({currentDateFormatted}):</span>{' '}
                  <span>
                    Ananda tercatat <strong>{todayAbsence.status === 'sakit' ? 'SAKIT (S)' : todayAbsence.status === 'izin' ? 'IZIN (I)' : 'ALPHA (A)'}</strong>
                    {todayAbsence.note ? ` — Catatan: "${todayAbsence.note}"` : ''}
                  </span>
                </div>
                <span className="shrink-0 font-bold text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded uppercase tracking-wide">
                  Tidak Hadir Hari Ini
                </span>
              </div>
            )}

            {/* 4. BAGIAN A: REKAPITULASI & RIWAYAT KEHADIRAN */}
            <div className="space-y-2 print-break-inside-avoid">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 flex items-center justify-between">
                <span>A. Rekapitulasi Presensi & Kehadiran Siswa</span>
                <span className="text-[11px] font-normal normal-case text-slate-600">
                  Hari Efektif: {totalEffectiveDays} Hari
                </span>
              </h3>

              {/* Grid 4 Status Presensi */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="border border-slate-300 p-2 rounded bg-slate-50/50">
                  <p className="text-[11px] text-slate-600 font-medium">Hadir Masuk</p>
                  <p className="text-sm sm:text-base font-bold text-slate-900">{attendedDays} Hari</p>
                  <p className="text-[10px] text-emerald-700 font-semibold">{attendancePercentage}% Kehadiran</p>
                </div>
                <div className="border border-slate-300 p-2 rounded bg-slate-50/50">
                  <p className="text-[11px] text-slate-600 font-medium">Sakit (S)</p>
                  <p className="text-sm sm:text-base font-bold text-blue-900">{sakit} Hari</p>
                  <p className="text-[10px] text-slate-500">Surat dokter</p>
                </div>
                <div className="border border-slate-300 p-2 rounded bg-slate-50/50">
                  <p className="text-[11px] text-slate-600 font-medium">Izin (I)</p>
                  <p className="text-sm sm:text-base font-bold text-amber-900">{izin} Hari</p>
                  <p className="text-[10px] text-slate-500">Pemberitahuan</p>
                </div>
                <div className="border border-slate-300 p-2 rounded bg-slate-50/50">
                  <p className="text-[11px] text-slate-600 font-medium">Alpha (A)</p>
                  <p className="text-sm sm:text-base font-bold text-rose-900">{alpha} Hari</p>
                  <p className="text-[10px] text-slate-500">Tanpa kabar</p>
                </div>
              </div>

              {/* Catatan Ketidakhadiran per Tanggal (Jika ada) */}
              {currentStudent.attendance.entries && currentStudent.attendance.entries.length > 0 && (
                <div className="mt-2">
                  <p className="text-[11px] font-bold text-slate-700 mb-1">Rincian Tanggal Ketidakhadiran:</p>
                  <table className="w-full text-left text-[11px] border border-slate-300 print-table">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <th className="py-1 px-2 border border-slate-300 w-36">Tanggal</th>
                        <th className="py-1 px-2 border border-slate-300 text-center w-24">Status</th>
                        <th className="py-1 px-2 border border-slate-300">Keterangan / Alasan Resmi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...currentStudent.attendance.entries]
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map((entry) => (
                          <tr key={entry.id}>
                            <td className="py-1 px-2 border border-slate-300 whitespace-nowrap">
                              {new Date(entry.date).toLocaleDateString('id-ID', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="py-1 px-2 border border-slate-300 text-center font-bold uppercase">
                              {entry.status === 'sakit' ? 'Sakit (S)' : entry.status === 'izin' ? 'Izin (I)' : 'Alpha (A)'}
                            </td>
                            <td className="py-1 px-2 border border-slate-300 text-slate-700">
                              {entry.note || '-'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 5. BAGIAN B: NILAI CAPAIAN MATA PELAJARAN */}
            <div className="space-y-2 print-break-inside-avoid">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 flex items-center justify-between">
                <span>B. Capaian Nilai Ulangan & Evaluasi Akademik</span>
                <span className="text-[11px] font-normal normal-case text-slate-600">
                  Kriteria Ketuntasan Minimal (KKM): 75
                </span>
              </h3>

              <table className="w-full text-left text-xs border border-slate-300 print-table">
                <thead className="bg-slate-100 text-slate-800 uppercase font-semibold text-[10px] tracking-wider text-center">
                  <tr>
                    <th className="py-1.5 px-2 border border-slate-300 w-8">No</th>
                    <th className="py-1.5 px-3 border border-slate-300 text-left">Mata Pelajaran</th>
                    <th className="py-1.5 px-2 border border-slate-300 w-12">KKM</th>
                    <th className="py-1.5 px-2 border border-slate-300 w-12">UH 1</th>
                    <th className="py-1.5 px-2 border border-slate-300 w-12">UH 2</th>
                    <th className="py-1.5 px-2 border border-slate-300 w-12">Tugas</th>
                    <th className="py-1.5 px-2 border border-slate-300 w-12">UTS</th>
                    <th className="py-1.5 px-2 border border-slate-300 w-12">UAS</th>
                    <th className="py-1.5 px-2 border border-slate-300 w-16 bg-slate-200">Nilai Akhir</th>
                    <th className="py-1.5 px-2 border border-slate-300 w-12">Predikat</th>
                    <th className="py-1.5 px-2 border border-slate-300 w-20">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((grade, idx) => {
                    const hasGrade = grade.average !== null && typeof grade.average === 'number';
                    const isPassed = hasGrade && (grade.average as number) >= grade.kkm;
                    return (
                      <tr key={grade.id} className="text-center">
                        <td className="py-1 px-2 border border-slate-300 text-slate-600">{idx + 1}</td>
                        <td className="py-1 px-3 border border-slate-300 text-left font-medium text-slate-900">
                          {grade.subject}
                        </td>
                        <td className="py-1 px-2 border border-slate-300 text-slate-600">{grade.kkm}</td>
                        <td className="py-1 px-2 border border-slate-300">{grade.uh1 !== null ? grade.uh1 : '-'}</td>
                        <td className="py-1 px-2 border border-slate-300">{grade.uh2 !== null ? grade.uh2 : '-'}</td>
                        <td className="py-1 px-2 border border-slate-300">{grade.tugas !== null ? grade.tugas : '-'}</td>
                        <td className="py-1 px-2 border border-slate-300">{grade.uts !== null ? grade.uts : '-'}</td>
                        <td className="py-1 px-2 border border-slate-300">{grade.uas !== null ? grade.uas : '-'}</td>
                        <td className="py-1 px-2 border border-slate-300 font-extrabold bg-slate-50">
                          {hasGrade ? grade.average : '-'}
                        </td>
                        <td className="py-1 px-2 border border-slate-300 font-bold">
                          {grade.letterGrade && grade.letterGrade !== '-' ? grade.letterGrade : '-'}
                        </td>
                        <td className="py-1 px-2 border border-slate-300 text-[11px] font-semibold">
                          {!hasGrade ? (
                            <span className="text-slate-500 font-normal">Belum Dinilai</span>
                          ) : isPassed ? (
                            <span className="text-emerald-800">Tuntas</span>
                          ) : (
                            <span className="text-rose-800">Remedial</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100 font-bold text-center border-t-2 border-slate-400">
                  <tr>
                    <td colSpan={8} className="py-1.5 px-3 text-right border border-slate-300">
                      Rata-Rata Nilai Akhir ({validGrades.length} Mapel Dinilai):
                    </td>
                    <td className="py-1.5 px-2 border border-slate-300 text-sm font-extrabold bg-slate-200">
                      {averageGrade !== null ? averageGrade : '-'}
                    </td>
                    <td colSpan={2} className="py-1.5 px-2 border border-slate-300 text-left pl-3 text-xs">
                      {averageGrade !== null ? (
                        <span>
                          Predikat: {averageGrade >= 88 ? 'A (Sangat Baik)' : averageGrade >= 78 ? 'B (Baik)' : averageGrade >= 68 ? 'C (Cukup)' : 'D (Perlu Bimbingan)'}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-normal">Belum Ada Nilai</span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 6. BAGIAN C: CATATAN PRESTASI & PENGHARGAAN */}
            <div className="space-y-1.5 print-break-inside-avoid">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                C. Catatan Prestasi & Kejuaraan
              </h3>
              {currentStudent.achievements && currentStudent.achievements.length > 0 ? (
                <table className="w-full text-left text-xs border border-slate-300 print-table">
                  <thead className="bg-slate-100 text-slate-800 text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="py-1 px-2 border border-slate-300 w-8 text-center">No</th>
                      <th className="py-1 px-2 border border-slate-300 w-28">Tanggal</th>
                      <th className="py-1 px-3 border border-slate-300">Nama Kejuaraan / Prestasi</th>
                      <th className="py-1 px-2 border border-slate-300 w-24 text-center">Tingkat</th>
                      <th className="py-1 px-2 border border-slate-300 w-28 text-center">Capaian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentStudent.achievements.map((ach, i) => (
                      <tr key={ach.id}>
                        <td className="py-1 px-2 border border-slate-300 text-center">{i + 1}</td>
                        <td className="py-1 px-2 border border-slate-300 whitespace-nowrap">{ach.date}</td>
                        <td className="py-1 px-3 border border-slate-300 font-medium">
                          {ach.title}
                          {ach.description && <span className="block text-[10px] text-slate-600">{ach.description}</span>}
                        </td>
                        <td className="py-1 px-2 border border-slate-300 text-center">{ach.level}</td>
                        <td className="py-1 px-2 border border-slate-300 text-center font-bold">{ach.ranking}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-xs text-slate-600 italic border border-dashed border-slate-300 p-2 rounded">
                  Belum ada catatan kejuaraan pada semester ini. Wali kelas terus mendorong partisipasi aktif siswa dalam kegiatan akademik maupun non-akademik.
                </p>
              )}
            </div>

            {/* 7. BAGIAN D: CATATAN KEDISIPLINAN */}
            <div className="space-y-1.5 print-break-inside-avoid">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                D. Catatan Kedisiplinan & Tata Tertib
              </h3>
              {currentStudent.infractions && currentStudent.infractions.length > 0 ? (
                <table className="w-full text-left text-xs border border-slate-300 print-table">
                  <thead className="bg-slate-100 text-slate-800 text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="py-1 px-2 border border-slate-300 w-8 text-center">No</th>
                      <th className="py-1 px-2 border border-slate-300 w-24">Tanggal</th>
                      <th className="py-1 px-3 border border-slate-300">Jenis Pelanggaran</th>
                      <th className="py-1 px-2 border border-slate-300 w-20 text-center">Bobot</th>
                      <th className="py-1 px-3 border border-slate-300">Tindak Lanjut / Sanksi</th>
                      <th className="py-1 px-2 border border-slate-300 w-24 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentStudent.infractions.map((inf, i) => (
                      <tr key={inf.id}>
                        <td className="py-1 px-2 border border-slate-300 text-center">{i + 1}</td>
                        <td className="py-1 px-2 border border-slate-300 whitespace-nowrap">{inf.date}</td>
                        <td className="py-1 px-3 border border-slate-300 font-medium">{inf.title}</td>
                        <td className="py-1 px-2 border border-slate-300 text-center">{inf.points} Poin</td>
                        <td className="py-1 px-3 border border-slate-300">{inf.penalty}</td>
                        <td className="py-1 px-2 border border-slate-300 text-center font-bold">
                          {inf.resolved ? 'Selesai' : 'Dibina'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 p-2 rounded">
                  ✓ <strong>Sangat Disiplin:</strong> Siswa mematuhi seluruh tata tertib dan tata krama kehidupan sekolah tanpa catatan pelanggaran.
                </p>
              )}
            </div>

            {/* 8. BAGIAN E: CATATAN & PESAN WALI KELAS */}
            <div className="space-y-1.5 print-break-inside-avoid">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                E. Catatan & Rekomendasi Wali Kelas
              </h3>
              <div className="border border-slate-300 p-3 rounded-lg bg-slate-50/40 text-xs text-slate-800 leading-relaxed italic">
                &quot;{currentStudent.teacherNote || 'Ananda menunjukkan komitmen belajar dan perilaku yang baik di kelas. Pertahankan semangat belajar dan terus kembangkan bakat serta potensi yang dimiliki.'}&quot;
              </div>
            </div>

            {/* 9. LEMBAR PENGESAHAN & TANDA TANGAN (3 KOLOM) */}
            <div className="pt-4 print-break-inside-avoid space-y-4">
              <div className="text-right text-xs text-slate-800 pr-4">
                {classInfo.schoolCity || 'Bandung'}, {currentDateFormatted}
              </div>

              <div className="grid grid-cols-3 gap-4 text-center text-xs">
                {/* Orang Tua / Wali */}
                <div className="space-y-14">
                  <p className="font-semibold text-slate-700">Orang Tua / Wali Murid,</p>
                  <div>
                    <div className="w-36 border-b border-slate-900 mx-auto" />
                    <p className="font-bold text-slate-900 mt-1 uppercase">({currentStudent.parentName})</p>
                  </div>
                </div>

                {/* Wali Kelas */}
                <div className="space-y-14">
                  <p className="font-semibold text-slate-700">Wali Kelas {classInfo.className},</p>
                  <div>
                    <div className="w-44 border-b border-slate-900 mx-auto" />
                    <p className="font-bold text-slate-900 mt-1">({classInfo.teacherName})</p>
                    <p className="text-[10px] text-slate-600">NIP. {classInfo.teacherNip || '-'}</p>
                  </div>
                </div>

                {/* Kepala Sekolah */}
                <div className="space-y-14">
                  <p className="font-semibold text-slate-700">Mengetahui,<br />Kepala Sekolah,</p>
                  <div>
                    <div className="w-44 border-b border-slate-900 mx-auto" />
                    <p className="font-bold text-slate-900 mt-1">({classInfo.headmasterName || 'Drs. H. Mulyadi, M.Pd.'})</p>
                    <p className="text-[10px] text-slate-600">NIP. {classInfo.headmasterNip || '19680812 199303 1 005'}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="no-print bg-white border-t border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            Pastikan opsi latar belakang cetak <em>(Background Graphics)</em> tercentang di browser untuk hasil warna optimal.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold"
            >
              Tutup Preview
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang (PDF)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

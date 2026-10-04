import React, { useState } from 'react';
import { Student } from '../types';
import { excelService } from '../services/excelService';
import { FileSpreadsheet, Download, Upload, Check, AlertCircle, X, Users, ArrowRight } from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedStudents: Student[], mode: 'append' | 'replace') => void;
  currentStudentCount: number;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  currentStudentCount,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsedStudents, setParsedStudents] = useState<Student[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);
    setErrorMessage(null);
    setWarnings([]);

    const result = await excelService.parseExcel(selectedFile);
    setLoading(false);

    if (result.success && result.students.length > 0) {
      setParsedStudents(result.students);
      setWarnings(result.errors);
    } else {
      setParsedStudents([]);
      setErrorMessage(result.message);
      setWarnings(result.errors);
    }
  };

  const handleCommitImport = () => {
    if (parsedStudents.length === 0) return;
    onImportSuccess(parsedStudents, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Import Data Siswa & Nilai dari Excel
              </h3>
              <p className="text-xs text-slate-500">
                Unggah spreadsheet (.xlsx / .csv) untuk memasukkan data siswa dan nilai secara massal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
          {/* Step 1: Download Template */}
          <div className="p-3.5 bg-indigo-50/60 border border-indigo-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="font-bold text-indigo-950">Belum punya format Excel yang sesuai?</p>
              <p className="text-xs text-indigo-700">
                Unduh template resmi siap isi lengkap dengan kolom NIS, NISN, Nama, dan Mata Pelajaran.
              </p>
            </div>
            <button
              onClick={() => excelService.downloadTemplate()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs shrink-0 self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh Template (.xlsx)
            </button>
          </div>

          {/* Step 2: Upload Input */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800">
              Pilih File Excel / CSV Hasil Pengisian:
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-5 text-center transition bg-slate-50/60 cursor-pointer relative">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-1 pointer-events-none">
                <Upload className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-bold text-slate-800">
                  {file ? file.name : 'Klik untuk memilih file atau tarik file ke sini'}
                </p>
                <p className="text-xs text-slate-400">
                  Format didukung: Microsoft Excel (.xlsx, .xls) atau CSV
                </p>
              </div>
            </div>
          </div>

          {/* Error display */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Preview of Parsed Data */}
          {parsedStudents.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-xs">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Ditemukan {parsedStudents.length} Data Siswa Siap Diimpor:</span>
                </div>
              </div>

              {/* Mode choice */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <p className="font-bold text-slate-700 text-xs">Pilih Metode Impor:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className={`p-2.5 rounded-lg border flex items-start gap-2 cursor-pointer transition ${importMode === 'append' ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold' : 'bg-white border-slate-200'}`}>
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-0.5"
                    />
                    <div>
                      <span>Tambahkan ke Siswa Saat Ini</span>
                      <p className="text-[11px] font-normal text-slate-500">
                        {currentStudentCount} siswa lama tetap dipertahankan (+ {parsedStudents.length} baru).
                      </p>
                    </div>
                  </label>

                  <label className={`p-2.5 rounded-lg border flex items-start gap-2 cursor-pointer transition ${importMode === 'replace' ? 'bg-rose-50 border-rose-300 text-rose-900 font-semibold' : 'bg-white border-slate-200'}`}>
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5"
                    />
                    <div>
                      <span>Ganti Seluruh Data Siswa</span>
                      <p className="text-[11px] font-normal text-slate-500">
                        Hapus siswa lama dan gunakan {parsedStudents.length} siswa dari file ini.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="overflow-x-auto max-h-48 border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b">
                    <tr>
                      <th className="py-2 px-2.5">No</th>
                      <th className="py-2 px-3">Nama Siswa</th>
                      <th className="py-2 px-2">NIS</th>
                      <th className="py-2 px-2">NISN</th>
                      <th className="py-2 px-2 text-center">L/P</th>
                      <th className="py-2 px-3">Wali Murid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedStudents.slice(0, 10).map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2.5 text-slate-500">{idx + 1}</td>
                        <td className="py-1.5 px-3 font-semibold text-slate-800">{s.name}</td>
                        <td className="py-1.5 px-2 font-mono text-slate-600">{s.nis}</td>
                        <td className="py-1.5 px-2 font-mono text-slate-600">{s.nisn}</td>
                        <td className="py-1.5 px-2 text-center font-bold text-slate-700">{s.gender}</td>
                        <td className="py-1.5 px-3 text-slate-600">{s.parentName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedStudents.length > 10 && (
                <p className="text-[11px] text-slate-500 text-center">
                  ... dan {parsedStudents.length - 10} siswa lainnya.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold"
          >
            Batal
          </button>
          <button
            onClick={handleCommitImport}
            disabled={parsedStudents.length === 0}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
              parsedStudents.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>Terapkan & Simpan ke Kelas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Database, Cloud, FileCode, Check, Copy, X, Server, Layers, Globe, Smartphone } from 'lucide-react';

interface DatabaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseGuideModal: React.FC<DatabaseGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'sql' | 'gas' | 'deploy'>('sql');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyCode = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const sqlSchemaCode = `-- ========================================================
-- STRUKTUR DATABASE RELASIONAL (PostgreSQL / Supabase / MySQL)
-- PORTAL WALI KELAS & ORANG TUA SISWA
-- ========================================================

-- 1. TABEL IDENTITAS KELAS & WALI KELAS
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name VARCHAR(150) NOT NULL,
    class_name VARCHAR(50) NOT NULL,          -- Contoh: "Kelas VIII-B"
    academic_year VARCHAR(30) NOT NULL,       -- Contoh: "2024/2025"
    semester VARCHAR(10) NOT NULL,            -- "Ganjil" / "Genap"
    teacher_name VARCHAR(150) NOT NULL,
    teacher_nip VARCHAR(50),
    teacher_phone VARCHAR(30) NOT NULL,       -- WhatsApp wali kelas
    teacher_email VARCHAR(100),
    announcement TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABEL DATA SISWA
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    nis VARCHAR(20) UNIQUE NOT NULL,          -- Nomor Induk Siswa
    nisn VARCHAR(20) UNIQUE,                  -- Nomor Induk Siswa Nasional
    name VARCHAR(150) NOT NULL,               -- Nama lengkap siswa
    gender VARCHAR(1) CHECK (gender IN ('L', 'P')),
    parent_name VARCHAR(150) NOT NULL,        -- Nama Ayah/Ibu/Wali
    parent_phone VARCHAR(30) NOT NULL,        -- Nomor WhatsApp orang tua
    student_phone VARCHAR(30),
    address TEXT,
    teacher_note TEXT,                        -- Catatan perkembangan karakter
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABEL CATATAN PRESENSI PER TANGGAL (ATTENDANCE LOGS)
CREATE TABLE attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,   -- Tanggal spesifik ketidakhadiran
    status VARCHAR(10) NOT NULL CHECK (status IN ('sakit', 'izin', 'alpha')),
    note TEXT,                                -- Keterangan alasan/surat dokter
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- REKAPITULASI BISA DIHITUNG OTOMATIS (VIEW / QUERY):
-- SELECT student_id,
--   COUNT(*) FILTER (WHERE status = 'sakit') AS total_sakit,
--   COUNT(*) FILTER (WHERE status = 'izin') AS total_izin,
--   COUNT(*) FILTER (WHERE status = 'alpha') AS total_alpha
-- FROM attendance_logs GROUP BY student_id;

-- 4. TABEL NILAI ULANGAN & RAPOR MAPEL (GRADES)
CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject_name VARCHAR(100) NOT NULL,      -- Contoh: "Matematika"
    kkm INT DEFAULT 75,
    uh1 DECIMAL(5,2) DEFAULT 0,              -- Ulangan Harian 1
    uh2 DECIMAL(5,2) DEFAULT 0,              -- Ulangan Harian 2
    tugas DECIMAL(5,2) DEFAULT 0,            -- Tugas / PR
    uts DECIMAL(5,2) DEFAULT 0,              -- Ujian Tengah Semester
    uas DECIMAL(5,2) DEFAULT 0,              -- Ujian Akhir Semester
    average DECIMAL(5,2) GENERATED ALWAYS AS (
        ROUND((uh1 + uh2 + tugas + 2*uts + 2*uas) / 7.0, 2)
    ) STORED,
    letter_grade VARCHAR(2),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABEL CATATAN PELANGGARAN / KEDISIPLINAN (INFRACTIONS)
CREATE TABLE infractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    title VARCHAR(200) NOT NULL,             -- Contoh: "Terlambat > 15 Menit"
    category VARCHAR(20) CHECK (category IN ('Ringan', 'Sedang', 'Berat')),
    points INT DEFAULT 5,
    penalty TEXT,                            -- Tindak lanjut / sanksi edukatif
    resolved BOOLEAN DEFAULT FALSE,          -- Apakah sudah tuntas dibina
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABEL CATATAN PRESTASI & PENGHARGAAN (ACHIEVEMENTS)
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    title VARCHAR(250) NOT NULL,             -- Contoh: "Juara 1 OSN IPA"
    level VARCHAR(50) NOT NULL,              -- Sekolah/Kota/Provinsi/Nasional
    ranking VARCHAR(50) NOT NULL,            -- "Juara 1", "Medali Emas"
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEX UNTUK KECEPATAN PENCARIAN ORANG TUA:
CREATE INDEX idx_students_name ON students(name);
CREATE INDEX idx_students_nis ON students(nis);`;

  const gasCode = `/**
 * BACK-END GRATIS & MUDAH: GOOGLE APPS SCRIPT + GOOGLE SHEETS
 * Tempel kode ini di Extensions > Apps Script pada Google Spreadsheet Anda.
 * Deploy sebagai "Web App" (Who has access: "Anyone").
 */

function doGet(e) {
  var action = e.parameter.action;
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Ambil data semua siswa (untuk Guru atau pencarian nama)
  if (action === "getStudents") {
    var sheet = ss.getSheetByName("Siswa");
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var students = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      students.push({
        id: row[0],
        nis: row[1],
        nisn: row[2],
        name: row[3],
        gender: row[4],
        parentName: row[5],
        parentPhone: row[6],
        address: row[7],
        teacherNote: row[8]
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", data: students }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 2. Ambil detail rapor spesifik untuk 1 anak (Akses Orang Tua)
  if (action === "getStudentReport") {
    var studentId = e.parameter.studentId;
    // Cari detail Nilai, Kehadiran, Prestasi & Pelanggaran dari masing-masing sheet
    var result = fetchReportForStudent(ss, studentId);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: "ready", message: "EduWali GAS API Active" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (data.action === "updateAttendance") {
    // Update data kehadiran siswa di sheet "Kehadiran"
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Struktur Database & Panduan Deploy Online Gratis
              </h3>
              <p className="text-xs text-slate-500">
                Dokumentasi arsitektur database, script Google Apps Script, dan cara hosting gratis.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 border-b border-slate-200 pb-2 shrink-0">
          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'sql'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            1. Struktur Tabel SQL (Supabase / Postgres)
          </button>

          <button
            onClick={() => setActiveTab('gas')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'gas'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            2. Google Sheets API (Apps Script Gratis)
          </button>

          <button
            onClick={() => setActiveTab('deploy')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'deploy'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4" />
            3. Panduan Deploy Online Gratis (Vercel/Netlify)
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1 text-xs sm:text-sm">
          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  Berikut skema DDL (Data Definition Language) lengkap dengan relasi Foreign Key, indeks pencarian, dan aturan perhitungan nilai otomatis:
                </p>
                <button
                  onClick={() => copyCode(sqlSchemaCode, 'sql')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-200 hover:bg-slate-900 rounded-lg text-xs font-semibold"
                >
                  {copiedKey === 'sql' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'sql' ? 'Tersalin!' : 'Salin SQL'}
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 max-h-96">
                {sqlSchemaCode}
              </pre>
            </div>
          )}

          {activeTab === 'gas' && (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-900 text-xs">
                <strong>Opsi Termudah bagi Guru di Indonesia:</strong> Menggunakan Google Sheets sebagai database gratis. Wali kelas cukup mengedit di Spreadsheet (Excel online), dan aplikasi ini akan membaca data tersebut secara otomatis via Google Apps Script (REST API).
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  Kode Google Apps Script (Code.gs) siap pakai:
                </p>
                <button
                  onClick={() => copyCode(gasCode, 'gas')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-200 hover:bg-slate-900 rounded-lg text-xs font-semibold"
                >
                  {copiedKey === 'gas' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'gas' ? 'Tersalin!' : 'Salin Script'}
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 max-h-96">
                {gasCode}
              </pre>
            </div>
          )}

          {activeTab === 'deploy' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  Cara Mendeploy Aplikasi Ini Secara Online & 100% Gratis
                </h4>
                <p className="text-xs text-indigo-800 leading-relaxed">
                  Aplikasi ini dirancang menggunakan arsitektur modern (React + Vite + Tailwind CSS) yang sangat ringan dan siap di-hosting gratis dengan sertifikat SSL (HTTPS) resmi.
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                  <h5 className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                    Metode Tercepat: Vercel (Gratis Selamanya)
                  </h5>
                  <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 pl-2 leading-relaxed">
                    <li>Upload folder proyek ini ke akun <strong>GitHub</strong> Anda (buat repository baru).</li>
                    <li>Buka <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline">vercel.com</a> dan daftar/login dengan akun GitHub Anda.</li>
                    <li>Klik tombol <strong>&quot;Add New Project&quot;</strong> lalu pilih repository aplikasi ini.</li>
                    <li>Vercel akan otomatis mendeteksi Framework Preset sebagai <strong>Vite</strong>.</li>
                    <li>Klik <strong>&quot;Deploy&quot;</strong>. Dalam 1 menit, Anda akan mendapatkan link resmi (contoh: <code>https://portal-wali-kelas.vercel.app</code>).</li>
                  </ol>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                  <h5 className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                    Metode Drag & Drop: Netlify Drop
                  </h5>
                  <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 pl-2 leading-relaxed">
                    <li>Jalankan perintah <code>npm run build</code> di terminal komputer Anda.</li>
                    <li>Buka folder proyek dan temukan folder hasil bernama <code>dist</code>.</li>
                    <li>Buka <a href="https://app.netlify.com/drop" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold underline">app.netlify.com/drop</a> lalu tarik (drag & drop) folder <code>dist</code> ke browser.</li>
                    <li>Website langsung online dan link publik bisa dibagikan langsung ke WhatsApp grup orang tua siswa!</li>
                  </ol>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                  <h5 className="font-bold text-slate-800 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-indigo-600" />
                    Kemudahan untuk Orang Tua Murid
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Orang tua tidak perlu install aplikasi dari PlayStore. Cukup klik tautan link yang dibagikan wali kelas di WhatsApp grup kelas, ketik nama ananda, dan rapor langsung tampil dengan rapi di smartphone mereka!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};

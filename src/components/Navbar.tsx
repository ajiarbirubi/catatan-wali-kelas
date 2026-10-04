import React from 'react';
import { UserRole, ClassInfo } from '../types';
import { 
  GraduationCap, 
  User, 
  ShieldCheck, 
  Lock, 
  LogOut, 
  Database, 
  Menu, 
  X,
  ExternalLink
} from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  isTeacherAuthenticated: boolean;
  classInfo: ClassInfo;
  onSelectRole: (role: UserRole) => void;
  onOpenTeacherLogin: () => void;
  onTeacherLogout: () => void;
  onOpenDbGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  isTeacherAuthenticated,
  classInfo,
  onSelectRole,
  onOpenTeacherLogin,
  onTeacherLogout,
  onOpenDbGuide,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleSwitchToTeacher = () => {
    if (isTeacherAuthenticated) {
      onSelectRole('teacher');
    } else {
      onOpenTeacherLogin();
    }
  };

  return (
    <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Class Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-xs">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 font-heading">
                EduWali
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700">
                {classInfo.className}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block truncate max-w-xs">
              {classInfo.schoolName}
            </p>
          </div>
        </div>

        {/* Desktop Role Switcher & Action Buttons */}
        <div className="hidden md:flex items-center gap-2">
          {/* Mode Tabs */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => onSelectRole('parent')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                currentRole === 'parent'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Orang Tua Siswa (Publik)
            </button>

            <button
              onClick={handleSwitchToTeacher}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                currentRole === 'teacher'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isTeacherAuthenticated ? (
                <ShieldCheck className="w-3.5 h-3.5" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              Wali Kelas {isTeacherAuthenticated ? '(Login)' : ''}
            </button>
          </div>

          {/* Database & Deploy Guide Button */}
          <button
            onClick={onOpenDbGuide}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 rounded-xl text-xs font-semibold transition"
          >
            <Database className="w-3.5 h-3.5 text-indigo-600" />
            <span>Skema Database & Panduan</span>
          </button>

          {/* Teacher Logout if authenticated */}
          {isTeacherAuthenticated && (
            <button
              onClick={onTeacherLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
              title="Keluar Sesi Guru"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={onOpenDbGuide}
            className="p-2 text-indigo-600 bg-indigo-50 rounded-xl text-xs font-bold"
            title="Database & Panduan"
          >
            <Database className="w-4 h-4" />
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-3">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pilih Peran Akses:
            </p>
            <button
              onClick={() => {
                onSelectRole('parent');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-bold ${
                currentRole === 'parent'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                Halaman Orang Tua Siswa (Pencarian Nama)
              </span>
              {currentRole === 'parent' && <span className="text-indigo-600">✓ Aktif</span>}
            </button>

            <button
              onClick={() => {
                handleSwitchToTeacher();
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-bold ${
                currentRole === 'teacher'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Panel Guru & Wali Kelas (Edit & Input Data)
              </span>
              {isTeacherAuthenticated && <span className="text-xs bg-white/20 px-2 py-0.5 rounded">Tersambung</span>}
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => {
                onOpenDbGuide();
                setMobileMenuOpen(false);
              }}
              className="text-xs font-semibold text-indigo-600 flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              Lihat Skema Database & Panduan Deploy
            </button>

            {isTeacherAuthenticated && (
              <button
                onClick={() => {
                  onTeacherLogout();
                  setMobileMenuOpen(false);
                }}
                className="text-xs font-semibold text-rose-600 flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                Keluar Guru
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

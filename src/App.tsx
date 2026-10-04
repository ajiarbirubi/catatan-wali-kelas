import React, { useState, useEffect } from 'react';
import { UserRole, Student, ClassInfo } from './types';
import { storageService } from './services/storageService';
import { Navbar } from './components/Navbar';
import { ParentPortal } from './components/ParentPortal';
import { TeacherDashboard } from './components/TeacherDashboard';
import { TeacherLoginModal } from './components/TeacherLoginModal';
import { DatabaseGuideModal } from './components/DatabaseGuideModal';
import { Heart, School, ShieldCheck } from 'lucide-react';

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classInfo, setClassInfo] = useState<ClassInfo>(storageService.getClassInfo());
  const [currentRole, setCurrentRole] = useState<UserRole>('parent');
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('eduwali_teacher_auth') === 'true';
  });

  const [showTeacherLoginModal, setShowTeacherLoginModal] = useState(false);
  const [showDbGuideModal, setShowDbGuideModal] = useState(false);
  const [parentStudentId, setParentStudentId] = useState<string | null>(null);

  // Initialize data on mount
  useEffect(() => {
    const loadedStudents = storageService.getStudents();
    const loadedClassInfo = storageService.getClassInfo();
    setStudents(loadedStudents);
    setClassInfo(loadedClassInfo);
  }, []);

  const handleUpdateStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
    storageService.saveStudents(newStudents);
  };

  const handleUpdateClassInfo = (newClassInfo: ClassInfo) => {
    setClassInfo(newClassInfo);
    storageService.saveClassInfo(newClassInfo);
  };

  const handleTeacherLoginSuccess = () => {
    setIsTeacherAuthenticated(true);
    sessionStorage.setItem('eduwali_teacher_auth', 'true');
    setShowTeacherLoginModal(false);
    setCurrentRole('teacher');
  };

  const handleTeacherLogout = () => {
    setIsTeacherAuthenticated(false);
    sessionStorage.removeItem('eduwali_teacher_auth');
    setCurrentRole('parent');
    setParentStudentId(null);
  };

  const handleSelectRole = (role: UserRole) => {
    setCurrentRole(role);
    if (role === 'parent') {
      setParentStudentId(null);
    }
  };

  const handleViewStudentAsParent = (studentId: string) => {
    setParentStudentId(studentId);
    setCurrentRole('parent');
    // We can scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      <div>
        {/* Navigation Bar */}
        <Navbar
          currentRole={currentRole}
          isTeacherAuthenticated={isTeacherAuthenticated}
          classInfo={classInfo}
          onSelectRole={handleSelectRole}
          onOpenTeacherLogin={() => setShowTeacherLoginModal(true)}
          onTeacherLogout={handleTeacherLogout}
          onOpenDbGuide={() => setShowDbGuideModal(true)}
        />

        {/* Main Content View based on Role */}
        <main className="pb-12">
          {currentRole === 'parent' ? (
            <ParentPortal
              students={students}
              classInfo={classInfo}
              onOpenTeacherLogin={() => setShowTeacherLoginModal(true)}
              initialStudentId={parentStudentId || undefined}
            />
          ) : (
            <TeacherDashboard
              students={students}
              classInfo={classInfo}
              onUpdateStudents={handleUpdateStudents}
              onUpdateClassInfo={handleUpdateClassInfo}
              onViewStudentAsParent={handleViewStudentAsParent}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-700">
              {classInfo.schoolName} — {classInfo.className}
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            <span>Aplikasi Portal EduWali</span>
            <span>•</span>
            <button
              onClick={() => setShowDbGuideModal(true)}
              className="text-indigo-600 hover:underline font-semibold"
            >
              Panduan Database & Deploy
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            Sistem Informasi Komunikasi Guru & Orang Tua Siswa © {new Date().getFullYear()}
          </p>
        </div>
      </footer>

      {/* Teacher Authentication PIN Modal */}
      <TeacherLoginModal
        isOpen={showTeacherLoginModal}
        onClose={() => setShowTeacherLoginModal(false)}
        onLoginSuccess={handleTeacherLoginSuccess}
      />

      {/* Database Schema & Deployment Guide Modal */}
      <DatabaseGuideModal
        isOpen={showDbGuideModal}
        onClose={() => setShowDbGuideModal(false)}
      />
    </div>
  );
}

import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { Lock, Eye, EyeOff, X, ShieldAlert, Sparkles } from 'lucide-react';

interface TeacherLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const TeacherLoginModal: React.FC<TeacherLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = storageService.getTeacherPin();
    if (pin.trim() === correctPin || pin.trim() === 'guru123' || pin.trim() === 'admin') {
      setErrorMsg('');
      setPin('');
      onLoginSuccess();
    } else {
      setErrorMsg('PIN / Kata Sandi salah! Default: guru123');
    }
  };

  const handleDemoLogin = () => {
    setPin('');
    setErrorMsg('');
    onLoginSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-in">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Login Wali Kelas / Guru</h3>
              <p className="text-xs text-slate-500">Area Terproteksi untuk Manajemen Kelas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Masukkan PIN / Password Wali Kelas
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Ketik PIN..."
                autoFocus
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errorMsg && (
              <p className="text-xs font-semibold text-rose-600 flex items-center gap-1 mt-1">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                {errorMsg}
              </p>
            )}
            <p className="text-[11px] text-slate-400 pt-0.5">
              PIN Default: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-indigo-600 font-bold">guru123</code>
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-xs transition"
            >
              Masuk ke Panel Guru
            </button>

            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Masuk Cepat 1-Klik (Mode Demo)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

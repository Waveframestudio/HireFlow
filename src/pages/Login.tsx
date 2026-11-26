import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Eye, EyeOff, Lock, Mail, Shield, Sparkles, UserCheck } from 'lucide-react';
import { DEMO_PROFILES, useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Logo } from '../components/Logo';
import { ScrollReveal } from '../components/ScrollReveal';

export const Login: React.FC = () => {
  const { login, loginAsDemo, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Si ya tiene sesión, botón para ir directo al panel
  const handleGoToDashboard = () => {
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      toast.success('¡Bienvenido/a a HireFlow!', `Sesión iniciada con éxito.`);
      navigate('/');
    } else {
      toast.error('Error al iniciar sesión', res.error || 'Credenciales no válidas.');
    }
  };

  const handleSelectDemo = (key: 'recruiter' | 'hiring_manager' | 'admin') => {
    loginAsDemo(key);
    const profile = DEMO_PROFILES[key];
    toast.success('Acceso Demo Activado', `Iniciaste como ${profile.name} (${profile.role}).`);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#11314E] flex flex-col justify-between text-slate-100 relative overflow-hidden">
      {/* Background soft ambient glow */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#EC623E]/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#1A446C]/40 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#163B5D]/20 blur-3xl pointer-events-none" />

      {/* Main container */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <ScrollReveal direction="down" duration={0.6} className="w-full max-w-md">
          <div className="bg-[#FAF4EC] rounded-3xl border border-[#EFE3D3] shadow-2xl p-8 sm:p-10 space-y-6 text-[#11314E]">
            {/* Header Brand */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-white border border-[#EFE3D3] shadow-xs mb-1">
                <Logo size={46} />
              </div>
              <h1 className="text-2xl font-extrabold text-[#11314E] tracking-tight">HireFlow</h1>
              <p className="text-xs text-slate-600 font-medium">
                Portal de Acceso · Selección y Gestión ATS de Talento
              </p>
            </div>

            {user && (
              <div className="p-3 bg-white rounded-xl border border-[#EFE3D3] flex items-center justify-between text-xs shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#11314E] text-white font-bold flex items-center justify-center text-[11px]">
                    {user.avatarInitials}
                  </div>
                  <div>
                    <p className="font-bold text-[#11314E]">{user.name}</p>
                    <p className="text-[10px] text-slate-500">{user.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGoToDashboard}
                  className="px-2.5 py-1 text-xs font-semibold text-[#EC623E] hover:underline cursor-pointer"
                >
                  Ir al Panel →
                </button>
              </div>
            )}

            {/* Standard Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#11314E] mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ej. sofia.seal@hireflow.app"
                    className="w-full bg-white border border-[#EFE3D3] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#11314E] outline-none focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#11314E] mb-1.5">Contraseña</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-[#EFE3D3] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#11314E] outline-none focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#EC623E] hover:bg-[#D95330] text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all cursor-pointer shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Verificando...</span>
                ) : (
                  <>
                    <span>Iniciar Sesión</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Access Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#EFE3D3]"></div>
              <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                O acceso rápido demo
              </span>
              <div className="flex-grow border-t border-[#EFE3D3]"></div>
            </div>

            {/* Demo Fast Login Cards */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSelectDemo('recruiter')}
                className="w-full p-2.5 rounded-xl border border-[#EFE3D3] hover:border-[#11314E] bg-white hover:bg-[#FAF4EC] flex items-center justify-between text-left transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#11314E] text-white flex items-center justify-center text-xs font-bold">
                    SS
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#11314E] group-hover:text-[#EC623E] transition-colors">
                      Sofía Lilén Seal
                    </p>
                    <p className="text-[10px] text-slate-500">Recruiter Senior · Recursos Humanos</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF4EC] border border-[#EFE3D3] text-[#11314E]">
                  Entrar
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDemo('hiring_manager')}
                className="w-full p-2.5 rounded-xl border border-[#EFE3D3] hover:border-[#11314E] bg-white hover:bg-[#FAF4EC] flex items-center justify-between text-left transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#1A446C] text-white flex items-center justify-center text-xs font-bold">
                    LP
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#11314E] group-hover:text-[#EC623E] transition-colors">
                      Lucas Pereyra
                    </p>
                    <p className="text-[10px] text-slate-500">Hiring Manager · Comercial y Producto</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF4EC] border border-[#EFE3D3] text-[#11314E]">
                  Entrar
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDemo('admin')}
                className="w-full p-2.5 rounded-xl border border-[#EFE3D3] hover:border-[#11314E] bg-white hover:bg-[#FAF4EC] flex items-center justify-between text-left transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EC623E] text-white flex items-center justify-center text-xs font-bold">
                    HF
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#11314E] group-hover:text-[#EC623E] transition-colors">
                      Equipo HireFlow (Admin)
                    </p>
                    <p className="text-[10px] text-slate-500">Administrador · Head of Talent</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF4EC] border border-[#EFE3D3] text-[#11314E]">
                  Entrar
                </span>
              </button>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* Brand subtle footer */}
      <footer className="py-4 px-6 text-center text-xs text-[#A6C3DA] border-t border-[#1C456B] bg-[#0E283F]/80">
        © 2026 HireFlow todos los derechos reservados. | Desarrollado por{' '}
        <a
          href="https://waveframe.com.ar/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold underline text-white hover:text-[#EC623E] transition-colors"
        >
          WaveFrame Studio
        </a>
      </footer>
    </div>
  );
};

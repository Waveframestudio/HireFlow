import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  User,
} from 'lucide-react';
import { DEMO_PROFILES, UserRole, useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Logo } from '../components/Logo';
import { ScrollReveal } from '../components/ScrollReveal';

export const Login: React.FC = () => {
  const { login, signUp, loginWithGoogle, resetPassword, loginAsDemo } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('recruiter');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Estado para la recuperación de contraseña
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);

    if (mode === 'signup') {
      const res = await signUp(email, password, fullName, selectedRole);
      setIsLoading(false);
      if (res.success) {
        toast.success(
          '¡Cuenta creada con éxito!',
          `Bienvenido/a ${fullName || email} a HireFlow.`
        );
        navigate('/');
      } else {
        toast.error('Error al registrar usuario', res.error || 'No se pudo crear la cuenta.');
      }
      return;
    }

    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      toast.success('¡Bienvenido/a a HireFlow!', `Sesión iniciada correctamente.`);
      navigate('/');
    } else {
      toast.error('Error al iniciar sesión', res.error || 'Credenciales no válidas.');
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const res = await loginWithGoogle();
    setIsLoading(false);
    if (res.success) {
      toast.success('¡Sesión iniciada con Google!', 'Bienvenido/a a HireFlow ATS.');
      navigate('/');
    } else {
      toast.error('Error al conectar con Google', res.error || 'No se pudo completar el acceso.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    setIsResetting(true);
    const res = await resetPassword(resetEmail);
    setIsResetting(false);

    if (res.success) {
      toast.success(
        'Enlace de recuperación enviado',
        `Revisá tu casilla ${resetEmail} para restablecer tu contraseña.`
      );
      setIsForgotPassword(false);
    } else {
      toast.error('Error al recuperar contraseña', res.error || 'No se pudo enviar el correo.');
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

            {/* Vista condicional: Recuperar contraseña vs Formulario estándar */}
            {isForgotPassword ? (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <div className="w-10 h-10 rounded-xl bg-[#FDEEE9] text-[#EC623E] flex items-center justify-center mx-auto mb-2">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-[#11314E]">Recuperar Contraseña</h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Ingresá el correo asociado a tu cuenta y te enviaremos un enlace seguro para restablecerla.
                  </p>
                </div>

                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#11314E] mb-1.5">
                      Correo Electrónico <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        required
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="ingresar correo electronico"
                        className="w-full bg-white border border-[#EFE3D3] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#11314E] outline-none focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isResetting}
                    className="w-full bg-[#EC623E] hover:bg-[#D95330] text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all cursor-pointer shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                  >
                    {isResetting ? (
                      <span>Enviando enlace...</span>
                    ) : (
                      <>
                        <span>Enviar Enlace de Recuperación</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(false)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#11314E] hover:text-[#EC623E] cursor-pointer transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Volver al inicio de sesión
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                {/* Botón de Acceso Rápido con Google */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full bg-white hover:bg-[#FAF4EC] text-[#11314E] border border-[#EFE3D3] font-semibold py-2.5 px-4 rounded-xl text-sm transition-all cursor-pointer shadow-2xs hover:shadow-xs flex items-center justify-center gap-2.5"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continuar con Google</span>
                </button>

                {/* Separador entre Google y correo */}
                <div className="relative flex py-0.5 items-center">
                  <div className="flex-grow border-t border-[#EFE3D3]"></div>
                  <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    o con tu correo
                  </span>
                  <div className="flex-grow border-t border-[#EFE3D3]"></div>
                </div>

                {/* Formulario Estándar */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'signup' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-[#11314E] mb-1.5">
                          Nombre Completo <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            required
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="ej. Sofía Seal"
                            className="w-full bg-white border border-[#EFE3D3] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#11314E] outline-none focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] transition-all shadow-2xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#11314E] mb-1.5">
                          Rol en el Equipo <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                          className="w-full bg-white border border-[#EFE3D3] rounded-xl px-3 py-2.5 text-sm text-[#11314E] outline-none focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] transition-all shadow-2xs font-medium"
                        >
                          <option value="recruiter">Recruiter (Recursos Humanos)</option>
                          <option value="hiring_manager">Hiring Manager (Líder Técnico / Área)</option>
                          <option value="admin">Administrador (Head of Talent)</option>
                        </select>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#11314E] mb-1.5">
                      Correo Electrónico <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ingresar correo electronico"
                        className="w-full bg-white border border-[#EFE3D3] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#11314E] outline-none focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#11314E] mb-1.5">
                      Contraseña <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        required
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
                    {mode === 'signin' && (
                      <div className="flex justify-end mt-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setResetEmail(email);
                            setIsForgotPassword(true);
                          }}
                          className="text-[11px] font-semibold text-slate-500 hover:text-[#EC623E] hover:underline transition-colors cursor-pointer"
                        >
                          ¿Olvidaste tu contraseña?
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#EC623E] hover:bg-[#D95330] text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all cursor-pointer shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <span>Procesando...</span>
                    ) : (
                      <>
                        <span>{mode === 'signup' ? 'Crear Cuenta y Acceder' : 'Iniciar Sesión'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Toggle entre Iniciar Sesión y Crear Cuenta */}
                  <div className="text-center pt-1 text-xs text-slate-600">
                    {mode === 'signin' ? (
                      <p>
                        ¿Aún no tienes una cuenta?{' '}
                        <button
                          type="button"
                          onClick={() => setMode('signup')}
                          className="font-bold text-[#11314E] hover:text-[#EC623E] underline cursor-pointer transition-colors"
                        >
                          Crear cuenta
                        </button>
                      </p>
                    ) : (
                      <p>
                        ¿Ya tienes una cuenta?{' '}
                        <button
                          type="button"
                          onClick={() => setMode('signin')}
                          className="font-bold text-[#11314E] hover:text-[#EC623E] underline cursor-pointer transition-colors"
                        >
                          Iniciar sesión
                        </button>
                      </p>
                    )}
                  </div>
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
                          Sofía Seal
                        </p>
                        <p className="text-[10px] text-slate-500">Recruiter · Recursos Humanos</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF4EC] border border-[#EFE3D3] text-[#11314E]">
                      Entrar como RRHH
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectDemo('hiring_manager')}
                    className="w-full p-2.5 rounded-xl border border-[#EFE3D3] hover:border-[#11314E] bg-white hover:bg-[#FAF4EC] flex items-center justify-between text-left transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#1A446C] text-white flex items-center justify-center text-xs font-bold">
                        LG
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#11314E] group-hover:text-[#EC623E] transition-colors">
                          Lucas Gómez
                        </p>
                        <p className="text-[10px] text-slate-500">Hiring Manager · Tecnología & Comercial</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF4EC] border border-[#EFE3D3] text-[#11314E]">
                      Entrar como Manager
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectDemo('admin')}
                    className="w-full p-2.5 rounded-xl border border-[#EFE3D3] hover:border-[#11314E] bg-white hover:bg-[#FAF4EC] flex items-center justify-between text-left transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#EC623E] text-white flex items-center justify-center text-xs font-bold">
                        AD
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#11314E] group-hover:text-[#EC623E] transition-colors">
                          Administrador
                        </p>
                        <p className="text-[10px] text-slate-500">Admin · Head of Talent & Dirección</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF4EC] border border-[#EFE3D3] text-[#11314E]">
                      Entrar como Admin
                    </span>
                  </button>
                </div>
              </>
            )}
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

import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Briefcase,
  CalendarClock,
  Kanban,
  LayoutDashboard,
  LogOut,
  Search,
  Users,
} from 'lucide-react';
import { Logo } from './Logo';
import { CommandPalette } from './CommandPalette';
import { ROLE_LABELS, useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const navItems = [
  { to: '/', label: 'Resumen', icon: LayoutDashboard },
  { to: '/vacantes', label: 'Vacantes', icon: Briefcase },
  { to: '/pipeline', label: 'Pipeline ATS', icon: Kanban },
  { to: '/candidatos', label: 'Base de Candidatos', icon: Users },
  { to: '/entrevistas', label: 'Entrevistas', icon: CalendarClock },
  { to: '/reportes', label: 'Reportes e Indicadores', icon: BarChart3 },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, logout, loginAsDemo } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info('Sesión cerrada', 'Hasta pronto.');
    navigate('/login');
  };

  // Escuchar atajo global Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen flex bg-[#FAF4EC] text-[#11314E]">
      {/* Sidebar (Panel izquierdo) */}
      <aside className="w-64 bg-[#11314E] text-slate-100 flex flex-col shrink-0 border-r border-[#0D263D] shadow-md">
        <div className="p-5 border-b border-[#1C456B]">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <div>
              <h1 className="font-bold text-base leading-tight text-white tracking-tight">HireFlow</h1>
              <p className="text-xs text-[#A6C3DA]">ATS Interno · RRHH</p>
            </div>
          </div>
        </div>

        {/* Buscador Global Rápido (⌘K / Ctrl+K) */}
        <div className="px-3 pt-3">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#163B5D] hover:bg-[#1C456B] text-slate-300 text-xs transition-colors cursor-pointer border border-[#1F4C75]"
            title="Buscador global rápido (Ctrl + K / Cmd + K)"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#A6C3DA]" />
              <span>Buscar...</span>
            </span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[#11314E] text-slate-300 rounded border border-[#235380]">
              ⌘K
            </kbd>
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1A446C] text-white border-l-4 border-[#EC623E] shadow-sm'
                    : 'text-slate-300 hover:bg-[#163B5D] hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bloque de Perfil Activo en el Pie del Sidebar */}
        {user && (
          <div className="p-3.5 border-t border-[#1C456B] bg-[#0E283F]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#EC623E] to-[#D95330] text-white flex items-center justify-center text-xs font-extrabold shadow-sm">
                    {user.avatarInitials}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0E283F]" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate leading-snug">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-[#A6C3DA] truncate">
                    {ROLE_LABELS[user.role] || user.role}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Cerrar sesión"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-[#1A446C] transition-all cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Selector rápido de rol para testing / demo */}
            <div className="mt-2.5 pt-2 border-t border-[#1F4C75] flex items-center justify-between text-[10px]">
              <span className="text-[#A6C3DA] font-medium">Cambiar rol:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    loginAsDemo('recruiter');
                    toast.info('Perfil cambiado', 'Activo como Sofía Seal (RRHH)');
                  }}
                  title="Cambiar a Sofía Seal (RRHH)"
                  className={`px-2 py-0.5 rounded cursor-pointer font-medium transition-colors ${
                    user.role === 'recruiter'
                      ? 'bg-[#EC623E] text-white font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-[#1A446C]'
                  }`}
                >
                  RRHH
                </button>
                <button
                  type="button"
                  onClick={() => {
                    loginAsDemo('hiring_manager');
                    toast.info('Perfil cambiado', 'Activo como Lucas Gómez (Manager)');
                  }}
                  title="Cambiar a Lucas Gómez (Hiring Manager)"
                  className={`px-2 py-0.5 rounded cursor-pointer font-medium transition-colors ${
                    user.role === 'hiring_manager'
                      ? 'bg-[#EC623E] text-white font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-[#1A446C]'
                  }`}
                >
                  Manager
                </button>
                <button
                  type="button"
                  onClick={() => {
                    loginAsDemo('admin');
                    toast.info('Perfil cambiado', 'Activo como Administrador');
                  }}
                  title="Cambiar a Administrador"
                  className={`px-2 py-0.5 rounded cursor-pointer font-medium transition-colors ${
                    user.role === 'admin'
                      ? 'bg-[#EC623E] text-white font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-[#1A446C]'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content (Panel derecho) */}
      <main id="main-content-scroll" className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        <div className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-8">{children}</div>

        <footer className="py-4 px-6 lg:px-8 border-t border-[#EFE3D3] text-center text-xs text-slate-500 bg-[#FAF4EC]/80">
          © 2026 HireFlow todos los derechos reservados. | Desarrollado por{' '}
          <a
            href="https://waveframe.com.ar/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline text-[#11314E] hover:text-[#EC623E] transition-colors"
          >
            WaveFrame Studio
          </a>
        </footer>
      </main>

      {/* Buscador Global CommandPalette */}
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};

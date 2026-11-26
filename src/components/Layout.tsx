import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Briefcase,
  CalendarClock,
  Kanban,
  LayoutDashboard,
  Search,
  Users,
} from 'lucide-react';
import { Logo } from './Logo';
import { CommandPalette } from './CommandPalette';

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

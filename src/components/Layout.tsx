import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Briefcase,
  CalendarClock,
  Kanban,
  LayoutDashboard,
  Users,
} from 'lucide-react';
import { Logo } from './Logo';

const navItems = [
  { to: '/', label: 'Resumen', icon: LayoutDashboard },
  { to: '/vacantes', label: 'Vacantes', icon: Briefcase },
  { to: '/pipeline', label: 'Pipeline ATS', icon: Kanban },
  { to: '/candidatos', label: 'Base de Candidatos', icon: Users },
  { to: '/entrevistas', label: 'Entrevistas', icon: CalendarClock },
  { to: '/reportes', label: 'Reportes e Indicadores', icon: BarChart3 },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
        {/* Barra superior del panel derecho con el logo oficial */}
        <header className="bg-[#FAF4EC]/85 backdrop-blur-md border-b border-[#EFE3D3] px-6 lg:px-8 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white text-[#11314E] border border-[#EFE3D3] flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              ATS Activo · Modo Selección
            </span>
          </div>

          {/* Logo en el panel derecho */}
          <div className="flex items-center gap-2.5 bg-white border border-[#EFE3D3] px-3.5 py-1.5 rounded-xl shadow-xs hover:border-[#E2D1BD] transition-all">
            <Logo size={28} />
            <div className="text-left">
              <p className="text-xs font-bold text-[#11314E] leading-none">HireFlow</p>
              <p className="text-[10px] text-[#EC623E] font-semibold leading-tight">Talent ATS</p>
            </div>
          </div>
        </header>

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
    </div>
  );
};

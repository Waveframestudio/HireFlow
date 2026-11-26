import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Briefcase,
  CalendarClock,
  Database,
  Kanban,
  LayoutDashboard,
  Users,
} from 'lucide-react';
import { useHireFlow } from '../context/HireFlowContext';

const navItems = [
  { to: '/', label: 'Resumen', icon: LayoutDashboard },
  { to: '/vacantes', label: 'Vacantes', icon: Briefcase },
  { to: '/pipeline', label: 'Pipeline ATS', icon: Kanban },
  { to: '/candidatos', label: 'Base de Candidatos', icon: Users },
  { to: '/entrevistas', label: 'Entrevistas', icon: CalendarClock },
  { to: '/reportes', label: 'Reportes e Indicadores', icon: BarChart3 },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSupabaseMode } = useHireFlow();

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-white text-lg">
              HF
            </div>
            <div>
              <h1 className="font-semibold text-base leading-tight">HireFlow</h1>
              <p className="text-xs text-slate-400">ATS Interno · RRHH</p>
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
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs">
            <Database className="w-4 h-4 text-slate-400" />
            {isSupabaseMode ? (
              <span className="text-emerald-400 font-medium">Supabase Conectado</span>
            ) : (
              <span className="text-amber-400 font-medium">Modo Demo Local</span>
            )}
          </div>
          {!isSupabaseMode && (
            <p className="text-[11px] text-slate-400 mt-1">
              Configurá <code className="text-slate-300">.env</code> para conectar con Supabase.
            </p>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

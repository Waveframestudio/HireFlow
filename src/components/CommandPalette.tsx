import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  CalendarClock,
  Command,
  FileText,
  GitPullRequest,
  LayoutDashboard,
  Search,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import { useHireFlow } from '../context/HireFlowContext';
import { STAGE_COLORS, STAGE_LABELS } from '../types';
import { useModalAnimation } from '../hooks/useModalAnimation';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PaletteItem {
  id: string;
  category: 'Navegación' | 'Candidatos' | 'Vacantes' | 'Entrevistas';
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { candidates, jobs, interviews, applications } = useHireFlow();
  const { shouldRender, backdropClass, contentClass } = useModalAnimation(isOpen, 180);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Foco automático en el input al abrir
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Generar todos los elementos buscables
  const allItems: PaletteItem[] = useMemo(() => {
    const items: PaletteItem[] = [];

    // 1. Navegación por páginas
    const pages = [
      {
        path: '/',
        title: 'Panel Resumen (Dashboard)',
        subtitle: 'Métricas generales, KPIs y últimos postulantes',
        icon: <LayoutDashboard className="w-4 h-4 text-[#1A446C]" />,
      },
      {
        path: '/vacantes',
        title: 'Búsquedas y Vacantes',
        subtitle: 'Gestión de puestos abiertos, requisitos y departamentos',
        icon: <Briefcase className="w-4 h-4 text-[#1A446C]" />,
      },
      {
        path: '/pipeline',
        title: 'Pipeline de Selección (ATS)',
        subtitle: 'Tablero Kanban de candidatos por etapa y afinidad',
        icon: <GitPullRequest className="w-4 h-4 text-[#1A446C]" />,
      },
      {
        path: '/candidatos',
        title: 'Base de Candidatos',
        subtitle: 'Lector de CVs en PDF, asignación de vacantes y perfiles',
        icon: <Users className="w-4 h-4 text-[#1A446C]" />,
      },
      {
        path: '/entrevistas',
        title: 'Screening y Entrevistas',
        subtitle: 'Sincronización con calendario, citaciones y feedback',
        icon: <CalendarClock className="w-4 h-4 text-[#1A446C]" />,
      },
      {
        path: '/reportes',
        title: 'Reportes e Indicadores',
        subtitle: 'Estadísticas de contratación, funnel y fuentes',
        icon: <BarChart3 className="w-4 h-4 text-[#1A446C]" />,
      },
    ];

    pages.forEach((p) => {
      items.push({
        id: `nav-${p.path}`,
        category: 'Navegación',
        title: p.title,
        subtitle: p.subtitle,
        icon: p.icon,
        onSelect: () => {
          navigate(p.path);
          onClose();
        },
      });
    });

    // 2. Candidatos
    candidates.forEach((c) => {
      const candidateApp = applications.find((a) => a.candidate_id === c.id);
      const job = candidateApp ? jobs.find((j) => j.id === candidateApp.job_id) : null;

      items.push({
        id: `cand-${c.id}`,
        category: 'Candidatos',
        title: c.full_name,
        subtitle: `${c.email} • ${c.years_experience} años exp. • ${job ? `Postulado a ${job.title}` : 'Sin vacante'}`,
        badge: candidateApp ? `${candidateApp.ats_score}% ATS` : undefined,
        badgeColor:
          candidateApp && candidateApp.ats_score >= 80
            ? 'bg-[#FDEEE9] text-[#EC623E] border-[#FCD5CA]'
            : 'bg-[#FAF4EC] text-[#11314E] border-[#EFE3D3]',
        icon: <User className="w-4 h-4 text-[#EC623E]" />,
        onSelect: () => {
          navigate('/candidatos');
          onClose();
        },
      });
    });

    // 3. Vacantes
    jobs.forEach((j) => {
      items.push({
        id: `job-${j.id}`,
        category: 'Vacantes',
        title: j.title,
        subtitle: `${j.department} • ${j.location} • Mín. ${j.min_experience_years} años`,
        badge: j.status === 'open' ? 'Abierta' : 'Cerrada',
        badgeColor:
          j.status === 'open'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-slate-100 text-slate-600 border-slate-200',
        icon: <Briefcase className="w-4 h-4 text-[#1A446C]" />,
        onSelect: () => {
          navigate('/vacantes');
          onClose();
        },
      });
    });

    // 4. Entrevistas
    interviews.forEach((int) => {
      const app = applications.find((a) => a.id === int.application_id);
      const c = app ? candidates.find((cand) => cand.id === app.candidate_id) : null;
      const j = app ? jobs.find((job) => job.id === app.job_id) : null;

      items.push({
        id: `int-${int.id}`,
        category: 'Entrevistas',
        title: `${c?.full_name || 'Candidato'} — ${int.type.toUpperCase()}`,
        subtitle: `${new Date(int.scheduled_at).toLocaleDateString('es-AR')} • ${j?.title || 'Vacante'} • ${int.interviewer}`,
        badge: int.status === 'completed' ? 'Completada' : 'Agendada',
        badgeColor:
          int.status === 'completed'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-[#FDEEE9] text-[#EC623E] border-[#FCD5CA]',
        icon: <CalendarClock className="w-4 h-4 text-emerald-600" />,
        onSelect: () => {
          navigate('/entrevistas');
          onClose();
        },
      });
    });

    return items;
  }, [candidates, jobs, interviews, applications, navigate, onClose]);

  // Filtrar según query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems;
    const clean = query.toLowerCase().trim();
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(clean) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(clean)) ||
        item.category.toLowerCase().includes(clean)
    );
  }, [allItems, query]);

  // Manejo de teclado (flechas, Enter, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].onSelect();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  // Asegurar que el elemento seleccionado esté visible en scroll
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!shouldRender) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={`fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-[#11314E]/60 backdrop-blur-xs ${backdropClass}`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-2xl max-w-xl w-full border border-[#EFE3D3] shadow-2xl overflow-hidden flex flex-col max-h-[75vh] ${contentClass}`}
      >
        {/* Search Header */}
        <div className="p-4 bg-[#FAF4EC]/70 border-b border-[#EFE3D3] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#1A446C] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Buscar candidatos, vacantes, entrevistas o páginas... (↑↓ para navegar)"
            className="w-full bg-transparent text-sm font-medium text-[#11314E] placeholder:text-slate-400 outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-[#EFE3D3] rounded shadow-2xs">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 divide-y divide-slate-100 max-h-[50vh]">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#11314E]">No se encontraron resultados</p>
              <p className="text-xs text-slate-500 mt-1">
                Intentá buscar con otro término, nombre, tecnología o sección.
              </p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  data-index={index}
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#FCF2E4] text-[#11314E] shadow-2xs'
                      : 'hover:bg-[#FAF4EC]/60 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected ? 'bg-white shadow-2xs' : 'bg-[#FAF4EC]'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#11314E] truncate">
                          {item.title}
                        </p>
                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{item.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          item.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isSelected && <ArrowRight className="w-4 h-4 text-[#EC623E]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-[#FAF4EC]/80 border-t border-[#EFE3D3] flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white border border-[#EFE3D3] rounded text-[10px] font-mono shadow-2xs">
                ↑
              </kbd>
              <kbd className="px-1 py-0.5 bg-white border border-[#EFE3D3] rounded text-[10px] font-mono shadow-2xs">
                ↓
              </kbd>{' '}
              navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white border border-[#EFE3D3] rounded text-[10px] font-mono shadow-2xs">
                ↵
              </kbd>{' '}
              seleccionar
            </span>
          </div>
          <span className="text-slate-400">HireFlow ATS • Búsqueda Global</span>
        </div>
      </div>
    </div>
  );
};

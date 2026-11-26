import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Filter,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useHireFlow } from '../context/HireFlowContext';
import { Application, Job, JobStatus, STAGE_COLORS, STAGE_LABELS } from '../types';
import { useToast } from '../context/ToastContext';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { ScrollReveal } from '../components/ScrollReveal';
import { CandidateDrawer } from '../components/CandidateDrawer';

export const Jobs: React.FC = () => {
  const {
    jobs,
    applications,
    candidates,
    interviews,
    addJob,
    updateJobStatus,
    moveApplicationStage,
  } = useHireFlow();
  const toast = useToast();

  // Estados de modales
  const [showModal, setShowModal] = useState(false);
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState<Job | null>(null);
  const [selectedDrawerApp, setSelectedDrawerApp] = useState<Application | null>(null);

  // Estados de filtros y búsqueda
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedModality, setSelectedModality] = useState('all');

  // Estados para formulario de nueva vacante
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Sistemas');
  const [location, setLocation] = useState('Híbrido');
  const [modality, setModality] = useState('Full-time');
  const [minExp, setMinExp] = useState(2);
  const [salaryRange, setSalaryRange] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [niceSkills, setNiceSkills] = useState('');
  const [description, setDescription] = useState('');

  // Listas únicas para desplegables de filtro
  const departments = useMemo(() => {
    return ['all', ...Array.from(new Set(jobs.map((j) => j.department))).filter(Boolean)];
  }, [jobs]);

  const modalities = useMemo(() => {
    return ['all', ...Array.from(new Set(jobs.map((j) => j.location))).filter(Boolean)];
  }, [jobs]);

  // Vacantes filtradas
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        job.title.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
        job.required_skills.some((s) => s.toLowerCase().includes(query));

      const matchesDept = selectedDept === 'all' || job.department === selectedDept;
      const matchesStatus = selectedStatus === 'all' || job.status === selectedStatus;
      const matchesModality = selectedModality === 'all' || job.location === selectedModality;

      return matchesSearch && matchesDept && matchesStatus && matchesModality;
    });
  }, [jobs, search, selectedDept, selectedStatus, selectedModality]);

  const isFiltering =
    search.trim() !== '' ||
    selectedDept !== 'all' ||
    selectedStatus !== 'all' ||
    selectedModality !== 'all';

  const handleResetFilters = () => {
    setSearch('');
    setSelectedDept('all');
    setSelectedStatus('all');
    setSelectedModality('all');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await addJob({
      title: title.trim(),
      department: department.trim(),
      location: location.trim(),
      modality: modality.trim(),
      status: 'open',
      description: description.trim(),
      required_skills: requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      nice_to_have_skills: niceSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      min_experience_years: Number(minExp) || 0,
      salary_range: salaryRange.trim() || undefined,
    });

    toast.success('Vacante creada con éxito', `Se publicó la búsqueda: ${title.trim()}`);

    setTitle('');
    setRequiredSkills('');
    setNiceSkills('');
    setDescription('');
    setSalaryRange('');
    setShowModal(false);
  };

  // KPIs
  const openJobsCount = jobs.filter((j) => j.status === 'open').length;
  const pausedJobsCount = jobs.filter((j) => j.status === 'paused').length;
  const closedJobsCount = jobs.filter((j) => j.status === 'closed').length;

  // Postulantes de la vacante seleccionada en el modal
  const selectedJobApps = useMemo(() => {
    if (!selectedJobForApplicants) return [];
    return applications
      .filter((a) => a.job_id === selectedJobForApplicants.id)
      .sort((a, b) => b.ats_score - a.ats_score);
  }, [applications, selectedJobForApplicants]);

  const selectedJobAvgAts = useMemo(() => {
    if (selectedJobApps.length === 0) return 0;
    return Math.round(
      selectedJobApps.reduce((acc, a) => acc + a.ats_score, 0) / selectedJobApps.length
    );
  }, [selectedJobApps]);

  // Manejo de apertura de Drawer para candidato seleccionado
  const drawerCandidate = selectedDrawerApp
    ? candidates.find((c) => c.id === selectedDrawerApp.candidate_id) || null
    : null;
  const drawerJob = selectedDrawerApp
    ? jobs.find((j) => j.id === selectedDrawerApp.job_id) || null
    : null;

  return (
    <div className="space-y-6">
      {/* Encabezado y botón Crear */}
      <ScrollReveal direction="down" duration={0.6}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#11314E]">Vacantes y Búsquedas</h2>
            <p className="text-sm text-slate-600 mt-1">
              Definí perfiles, requisitos y competencias para el motor ATS. Haz clic en una vacante
              para auditar sus postulantes.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-[#EC623E] hover:bg-[#D95330] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            Nueva Vacante
          </button>
        </div>
      </ScrollReveal>

      {/* Mini KPIs de Vacantes */}
      <ScrollReveal staggerChildren className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#EFE3D3] p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Vacantes</span>
          <p className="text-2xl font-bold mt-1 text-[#11314E]">
            <AnimatedNumber value={jobs.length} />
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{departments.length - 1} áreas activas</p>
        </div>

        <div className="bg-white rounded-xl border border-[#EFE3D3] p-4 shadow-xs">
          <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Abiertas
          </span>
          <p className="text-2xl font-bold mt-1 text-emerald-800">
            <AnimatedNumber value={openJobsCount} />
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Recibiendo postulaciones</p>
        </div>

        <div className="bg-white rounded-xl border border-[#EFE3D3] p-4 shadow-xs">
          <span className="text-xs text-amber-700 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Pausadas
          </span>
          <p className="text-2xl font-bold mt-1 text-amber-800">
            <AnimatedNumber value={pausedJobsCount} />
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">En revisión interna</p>
        </div>

        <div className="bg-white rounded-xl border border-[#EFE3D3] p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Postulaciones Activas</span>
          <p className="text-2xl font-bold mt-1 text-[#EC623E]">
            <AnimatedNumber value={applications.length} />
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Candidatos en pipeline</p>
        </div>
      </ScrollReveal>

      {/* Barra de Filtros Rápidos */}
      <div className="bg-white rounded-xl border border-[#EFE3D3] p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Input de Búsqueda */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por puesto, descripción o skill requerida (ej. React, SQL, HR)..."
              className="w-full bg-[#FAF4EC]/50 border border-[#EFE3D3] rounded-lg pl-9.5 pr-8 py-2 text-sm text-[#11314E] placeholder:text-slate-400 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] outline-none transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#11314E] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Desplegables de Filtro */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtro por Departamento */}
            <div className="flex items-center gap-1.5 bg-[#FAF4EC]/70 border border-[#EFE3D3] rounded-lg px-2.5 py-1.5 text-xs">
              <span className="text-slate-500 font-medium">Área:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-transparent text-[#11314E] font-semibold outline-none cursor-pointer"
              >
                <option value="all">Todas ({jobs.length})</option>
                {departments
                  .filter((d) => d !== 'all')
                  .map((dept) => (
                    <option key={dept} value={dept}>
                      {dept} ({jobs.filter((j) => j.department === dept).length})
                    </option>
                  ))}
              </select>
            </div>

            {/* Filtro por Estado */}
            <div className="flex items-center gap-1.5 bg-[#FAF4EC]/70 border border-[#EFE3D3] rounded-lg px-2.5 py-1.5 text-xs">
              <span className="text-slate-500 font-medium">Estado:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-[#11314E] font-semibold outline-none cursor-pointer"
              >
                <option value="all">Todos ({jobs.length})</option>
                <option value="open">Abiertas ({openJobsCount})</option>
                <option value="paused">Pausadas ({pausedJobsCount})</option>
                <option value="closed">Cerradas ({closedJobsCount})</option>
              </select>
            </div>

            {/* Filtro por Modalidad */}
            <div className="flex items-center gap-1.5 bg-[#FAF4EC]/70 border border-[#EFE3D3] rounded-lg px-2.5 py-1.5 text-xs">
              <span className="text-slate-500 font-medium">Modalidad:</span>
              <select
                value={selectedModality}
                onChange={(e) => setSelectedModality(e.target.value)}
                className="bg-transparent text-[#11314E] font-semibold outline-none cursor-pointer"
              >
                <option value="all">Todas</option>
                {modalities
                  .filter((m) => m !== 'all')
                  .map((mod) => (
                    <option key={mod} value={mod}>
                      {mod}
                    </option>
                  ))}
              </select>
            </div>

            {/* Limpiar Filtros */}
            {isFiltering && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#EC623E] hover:text-[#D95330] bg-[#FDEEE9] hover:bg-[#FCD5CA] border border-[#FCD5CA] px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors shadow-2xs"
              >
                <RotateCcw className="w-3 h-3" />
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Resumen de resultados */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-[#EFE3D3]/50">
          <span>
            Mostrando <strong>{filteredJobs.length}</strong> de <strong>{jobs.length}</strong> vacantes
          </span>
          {isFiltering && (
            <span className="text-[#EC623E] font-medium">Filtros aplicados</span>
          )}
        </div>
      </div>

      {/* Grid de Vacantes */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-[#EFE3D3] p-12 text-center">
          <Briefcase className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#11314E]">No se encontraron vacantes</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No hay vacantes que coincidan con los criterios de búsqueda o filtros seleccionados.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#EC623E] bg-[#FDEEE9] hover:bg-[#FCD5CA] border border-[#FCD5CA] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restablecer Filtros
          </button>
        </div>
      ) : (
        <ScrollReveal staggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredJobs.map((job) => {
            const count = applications.filter((a) => a.job_id === job.id).length;
            const jobApps = applications.filter((a) => a.job_id === job.id);
            const avgAts =
              count > 0
                ? Math.round(jobApps.reduce((acc, a) => acc + a.ats_score, 0) / count)
                : 0;

            const statusColors: Record<JobStatus, string> = {
              open: 'bg-emerald-50 text-emerald-800 border-emerald-200',
              paused: 'bg-amber-50 text-amber-800 border-amber-200',
              closed: 'bg-slate-100 text-slate-700 border-slate-200',
            };

            return (
              <div
                key={job.id}
                className="bg-white rounded-xl border border-[#EFE3D3] p-5 flex flex-col justify-between gap-4 shadow-xs hover:shadow-md hover:border-[#1A446C]/30 transition-all duration-200 group"
              >
                <div>
                  {/* Fila superior: Departamento & Estado */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-[#11314E] bg-[#FAF4EC] border border-[#EFE3D3] px-2.5 py-0.5 rounded-md">
                      {job.department}
                    </span>

                    <select
                      value={job.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as JobStatus;
                        updateJobStatus(job.id, newStatus);
                        toast.info(
                          'Estado de vacante actualizado',
                          `La búsqueda "${job.title}" ahora está ${
                            newStatus === 'open'
                              ? 'abierta'
                              : newStatus === 'paused'
                              ? 'pausada'
                              : 'cerrada'
                          }.`
                        );
                      }}
                      className={`text-xs border rounded-md px-2 py-0.5 font-semibold cursor-pointer outline-none transition-colors ${statusColors[job.status]}`}
                    >
                      <option value="open">Abierta</option>
                      <option value="paused">Pausada</option>
                      <option value="closed">Cerrada</option>
                    </select>
                  </div>

                  {/* Título de la vacante */}
                  <h3
                    onClick={() => setSelectedJobForApplicants(job)}
                    className="font-bold text-base text-[#11314E] mt-2.5 group-hover:text-[#EC623E] cursor-pointer transition-colors"
                  >
                    {job.title}
                  </h3>

                  {/* Metadatos: Ubicación, Exp, Salario */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#1A446C]" /> {job.location}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-[#1A446C]" /> {job.min_experience_years}+ años exp.
                    </span>
                    {job.salary_range && (
                      <span className="text-slate-400">· {job.salary_range}</span>
                    )}
                  </div>

                  {/* Descripción corta */}
                  <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Skills ATS requeridas */}
                  <div className="mt-4">
                    <p className="text-[11px] font-semibold text-[#11314E]/70 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                      <span>Requisitos ATS</span>
                      {count > 0 && (
                        <span className="text-[10px] text-[#EC623E] font-bold">
                          Avg ATS: {avgAts}%
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {job.required_skills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="text-xs bg-[#FAF4EC] text-[#11314E] border border-[#EFE3D3]/80 px-2 py-0.5 rounded-md font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.required_skills.length > 4 && (
                        <span className="text-xs bg-slate-50 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded-md font-medium">
                          +{job.required_skills.length - 4} más
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pie de la tarjeta: Acción de Ver Postulantes */}
                <div className="pt-3 border-t border-[#EFE3D3]/60 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedJobForApplicants(job)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#11314E] hover:text-[#EC623E] cursor-pointer transition-colors"
                  >
                    <Users className="w-3.5 h-3.5 text-[#1A446C]" />
                    <span className="bg-[#FAF4EC] px-2 py-0.5 rounded-full border border-[#EFE3D3] font-bold">
                      <AnimatedNumber value={count} />
                    </span>
                    <span>postulantes</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <Link
                    to="/pipeline"
                    className="text-[11px] font-semibold text-slate-400 hover:text-[#11314E] flex items-center gap-1 transition-colors"
                    title="Ver en tablero Kanban"
                  >
                    <span>Pipeline</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </ScrollReveal>
      )}

      {/* Modal: Detalle de Postulantes de una Vacante */}
      {selectedJobForApplicants && (
        <div className="fixed inset-0 bg-[#11314E]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#EFE3D3] max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header del Modal */}
            <div className="p-6 bg-[#FAF4EC] border-b border-[#EFE3D3] flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-[#11314E] bg-white border border-[#EFE3D3] px-2.5 py-0.5 rounded-md">
                    {selectedJobForApplicants.department}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {selectedJobForApplicants.location} · {selectedJobForApplicants.modality}
                  </span>
                </div>
                <h3 className="font-bold text-xl text-[#11314E] mt-1.5">
                  {selectedJobForApplicants.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-xl">
                  {selectedJobForApplicants.description}
                </p>

                {/* Métricas rápidas de la vacante */}
                <div className="flex items-center gap-4 mt-3 text-xs pt-2 border-t border-[#EFE3D3]/60">
                  <span className="font-semibold text-[#11314E]">
                    <strong>{selectedJobApps.length}</strong> candidatos postulados
                  </span>
                  <span className="text-[#EC623E] font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    ATS Promedio: <strong>{selectedJobAvgAts}%</strong>
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedJobForApplicants(null)}
                className="text-slate-400 hover:text-[#11314E] p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de Postulantes con Score ATS */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {selectedJobApps.length === 0 ? (
                <div className="text-center py-12 bg-[#FAF4EC]/40 rounded-xl border border-dashed border-[#EFE3D3]">
                  <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#11314E]">Aún no hay postulantes para este puesto</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Puedes asociar candidatos desde la sección de Candidatos o Pipeline.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-semibold">
                    <span>Candidato & Perfil</span>
                    <span>Compatibilidad ATS & Etapa</span>
                  </div>

                  {selectedJobApps.map((app) => {
                    const cand = candidates.find((c) => c.id === app.candidate_id);
                    if (!cand) return null;

                    return (
                      <div
                        key={app.id}
                        className="bg-white rounded-xl border border-[#EFE3D3] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#1A446C]/40 hover:shadow-xs transition-all"
                      >
                        {/* Info Candidato */}
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-[#11314E] text-white flex items-center justify-center font-bold text-sm shrink-0">
                            {cand.full_name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm text-[#11314E] truncate">
                              {cand.full_name}
                            </h4>
                            <p className="text-xs text-slate-500 truncate">{cand.email}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {cand.years_experience} años exp. · {cand.source}
                            </p>
                          </div>
                        </div>

                        {/* Afinidad ATS, Etapa y Acciones */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <div className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <span
                                className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${STAGE_COLORS[app.stage]}`}
                              >
                                {STAGE_LABELS[app.stage]}
                              </span>
                              <span
                                className={`text-sm font-bold ${
                                  app.ats_score >= 80
                                    ? 'text-[#EC623E]'
                                    : app.ats_score >= 60
                                    ? 'text-[#1A446C]'
                                    : 'text-slate-500'
                                }`}
                              >
                                {app.ats_score}%
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {app.matched_skills.length} skills validadas
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedDrawerApp(app)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-[#11314E] hover:bg-[#1A446C] px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
                          >
                            <span>Ver Ficha</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="p-4 bg-[#FAF4EC]/70 border-t border-[#EFE3D3] flex items-center justify-between gap-3">
              <Link
                to="/pipeline"
                className="text-xs font-semibold text-[#11314E] hover:text-[#EC623E] flex items-center gap-1 transition-colors"
              >
                <span>Abrir en Tablero Kanban Completo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setSelectedJobForApplicants(null)}
                className="px-4 py-2 text-xs font-semibold text-[#11314E] bg-white hover:bg-[#FAF4EC] border border-[#EFE3D3] rounded-lg transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Vacante */}
      {showModal && (
        <div className="fixed inset-0 bg-[#11314E]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-[#EFE3D3] max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-[#11314E]">Crear Nueva Vacante</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-[#11314E] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#11314E] mb-1">
                  Título del puesto *
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Analista Funcional Jr."
                  className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/40 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-3 py-2 text-sm outline-none text-[#11314E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#11314E] mb-1">Área</label>
                  <input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/40 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-3 py-2 text-sm outline-none text-[#11314E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#11314E] mb-1">Ubicación</label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/40 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-3 py-2 text-sm outline-none text-[#11314E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#11314E] mb-1">
                    Experiencia mínima (años)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minExp}
                    onChange={(e) => setMinExp(Number(e.target.value))}
                    className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/40 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-3 py-2 text-sm outline-none text-[#11314E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#11314E] mb-1">
                    Rango salarial
                  </label>
                  <input
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    placeholder="Opcional"
                    className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/40 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-3 py-2 text-sm outline-none text-[#11314E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#11314E] mb-1">
                  Skills obligatorias (separadas por coma) *
                </label>
                <input
                  required
                  value={requiredSkills}
                  onChange={(e) => setRequiredSkills(e.target.value)}
                  placeholder="React, TypeScript, SQL, Inglés"
                  className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/40 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-3 py-2 text-sm outline-none text-[#11314E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#11314E] mb-1">
                  Skills deseables (separadas por coma)
                </label>
                <input
                  value={niceSkills}
                  onChange={(e) => setNiceSkills(e.target.value)}
                  placeholder="Power BI, Scrum"
                  className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/40 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-3 py-2 text-sm outline-none text-[#11314E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#11314E] mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/40 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-3 py-2 text-sm outline-none text-[#11314E]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-[#FAF4EC] rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-[#EC623E] hover:bg-[#D95330] text-white rounded-lg cursor-pointer shadow-sm"
                >
                  Guardar Vacante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-over Candidate Drawer si se hace click en Ver Ficha */}
      {selectedDrawerApp && drawerCandidate && drawerJob && (
        <CandidateDrawer
          isOpen={true}
          onClose={() => setSelectedDrawerApp(null)}
          application={selectedDrawerApp}
          candidate={drawerCandidate}
          job={drawerJob}
          interviews={interviews}
          onMoveStage={(stage) => moveApplicationStage(selectedDrawerApp.id, stage)}
        />
      )}
    </div>
  );
};

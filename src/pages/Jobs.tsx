import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Filter,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useHireFlow } from '../context/HireFlowContext';
import { Application, Job, JobStatus, STAGE_COLORS, STAGE_LABELS } from '../types';
import { useToast } from '../context/ToastContext';
import { usePermissions } from '../lib/permissions';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { ScrollReveal } from '../components/ScrollReveal';
import { CandidateDrawer } from '../components/CandidateDrawer';
import { useModalAnimation } from '../hooks/useModalAnimation';

const MODALITY_OPTIONS = [
  { value: 'Híbrido', label: 'Híbrido', desc: 'Presencial y remoto flexible' },
  { value: 'Remoto', label: 'Remoto', desc: '100% trabajo a distancia' },
  { value: 'Presencial', label: 'Presencial', desc: 'En sede u oficina física' },
];

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
  const permissions = usePermissions();

  // Estados de modales
  const [showModal, setShowModal] = useState(false);
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState<Job | null>(null);
  const [activeApplicantsJob, setActiveApplicantsJob] = useState<Job | null>(null);
  const [selectedDrawerApp, setSelectedDrawerApp] = useState<Application | null>(null);

  React.useEffect(() => {
    if (selectedJobForApplicants) {
      setActiveApplicantsJob(selectedJobForApplicants);
    }
  }, [selectedJobForApplicants]);

  const {
    shouldRender: shouldRenderApplicantsModal,
    backdropClass: applicantsBackdrop,
    contentClass: applicantsContent,
  } = useModalAnimation(Boolean(selectedJobForApplicants));

  const {
    shouldRender: shouldRenderJobModal,
    backdropClass: jobModalBackdrop,
    contentClass: jobModalContent,
  } = useModalAnimation(showModal);

  // Estados de filtros y búsqueda
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedModality, setSelectedModality] = useState('all');

  // Estados para formulario de nueva vacante (inicializados totalmente vacíos)
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [modality, setModality] = useState('');
  const [minExp, setMinExp] = useState<number | ''>('');
  const [salaryRange, setSalaryRange] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [niceSkills, setNiceSkills] = useState('');
  const [description, setDescription] = useState('');

  // Dropdown personalizado y estilizado para modalidad
  const [isModalityOpen, setIsModalityOpen] = useState(false);
  const modalityDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalityDropdownRef.current &&
        !modalityDropdownRef.current.contains(event.target as Node)
      ) {
        setIsModalityOpen(false);
      }
    };
    if (isModalityOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModalityOpen]);

  const resetJobForm = () => {
    setTitle('');
    setDepartment('');
    setLocation('');
    setModality('');
    setMinExp('');
    setSalaryRange('');
    setRequiredSkills('');
    setNiceSkills('');
    setDescription('');
    setIsModalityOpen(false);
  };

  const handleOpenNewJobModal = () => {
    resetJobForm();
    setShowModal(true);
  };

  const handleCloseJobModal = () => {
    setShowModal(false);
    resetJobForm();
  };

  // Listas únicas para desplegables de filtro
  const departments = useMemo(() => {
    return ['all', ...Array.from(new Set(jobs.map((j) => j.department))).filter(Boolean)];
  }, [jobs]);

  const modalities = useMemo(() => {
    const list = Array.from(
      new Set(jobs.map((j) => j.modality || 'Híbrido'))
    ).filter(Boolean);
    return ['all', ...list];
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
      const matchesModality =
        selectedModality === 'all' ||
        job.modality === selectedModality ||
        job.location?.toLowerCase().includes(selectedModality.toLowerCase());

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
    if (
      !title.trim() ||
      !department.trim() ||
      !location.trim() ||
      !modality.trim() ||
      !requiredSkills.trim() ||
      !description.trim()
    ) {
      toast.error(
        'Campos obligatorios incompletos',
        'Por favor, completá los campos marcados con asterisco rojo (*).'
      );
      return;
    }

    await addJob({
      title: title.trim(),
      department: department.trim(),
      location: location.trim(),
      modality: modality.trim() || 'Híbrido',
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
      min_experience_years: minExp === '' ? 0 : Number(minExp),
      salary_range: salaryRange.trim() || undefined,
    });

    toast.success('Vacante creada con éxito', `Se publicó la búsqueda: ${title.trim()}`);

    resetJobForm();
    setShowModal(false);
  };

  // KPIs
  const openJobsCount = jobs.filter((j) => j.status === 'open').length;
  const pausedJobsCount = jobs.filter((j) => j.status === 'paused').length;
  const closedJobsCount = jobs.filter((j) => j.status === 'closed').length;

  // Postulantes de la vacante seleccionada en el modal
  const targetJob = selectedJobForApplicants || activeApplicantsJob;
  const selectedJobApps = useMemo(() => {
    if (!targetJob) return [];
    return applications
      .filter((a) => a.job_id === targetJob.id)
      .sort((a, b) => b.ats_score - a.ats_score);
  }, [applications, targetJob]);

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
          {permissions.canCreateJob ? (
            <button
              onClick={handleOpenNewJobModal}
              className="inline-flex items-center gap-2 bg-[#EC623E] hover:bg-[#D95330] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              Nueva Vacante
            </button>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 text-xs bg-[#FAF4EC] text-[#11314E] border border-[#EFE3D3] px-3 py-2 rounded-lg font-semibold shadow-2xs"
              title={permissions.roleBadgeDescription}
            >
              <Shield className="w-3.5 h-3.5 text-[#1A446C]" />
              Modo Evaluador · Solo Lectura
            </span>
          )}
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

                    {permissions.canChangeJobStatus ? (
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
                    ) : (
                      <span
                        className={`text-xs border rounded-md px-2.5 py-0.5 font-semibold ${statusColors[job.status]}`}
                      >
                        {job.status === 'open'
                          ? 'Abierta'
                          : job.status === 'paused'
                          ? 'Pausada'
                          : 'Cerrada'}
                      </span>
                    )}
                  </div>

                  {/* Título de la vacante */}
                  <h3
                    onClick={() => setSelectedJobForApplicants(job)}
                    className="font-bold text-base text-[#11314E] mt-2.5 group-hover:text-[#EC623E] cursor-pointer transition-colors"
                  >
                    {job.title}
                  </h3>

                  {/* Metadatos: Ubicación, Modalidad, Exp, Salario */}
                  <div className="flex items-center gap-2.5 text-xs text-slate-500 mt-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-[#1A446C]" /> {job.location}
                    </span>
                    {job.modality && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FAF4EC] text-[#11314E] border border-[#EFE3D3]">
                        {job.modality}
                      </span>
                    )}
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
      {shouldRenderApplicantsModal && targetJob && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedJobForApplicants(null);
          }}
          className={`fixed inset-0 bg-[#11314E]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 ${applicantsBackdrop}`}
        >
          <div className={`bg-white rounded-2xl border border-[#EFE3D3] max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden ${applicantsContent}`}>
            {/* Header del Modal */}
            <div className="p-6 bg-[#FAF4EC] border-b border-[#EFE3D3] flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-[#11314E] bg-white border border-[#EFE3D3] px-2.5 py-0.5 rounded-md">
                    {targetJob.department}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {targetJob.location} · {targetJob.modality}
                  </span>
                </div>
                <h3 className="font-bold text-xl text-[#11314E] mt-1.5">
                  {targetJob.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-xl">
                  {targetJob.description}
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
      {shouldRenderJobModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseJobModal();
          }}
          className={`fixed inset-0 bg-[#11314E]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 ${jobModalBackdrop}`}
        >
          <div className={`bg-white rounded-xl border border-[#EFE3D3] max-w-lg w-full p-6 shadow-2xl ${jobModalContent}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-[#11314E]">Crear Nueva Vacante</h3>
              <button
                type="button"
                onClick={handleCloseJobModal}
                className="text-slate-400 hover:text-[#11314E] cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#11314E] mb-1">
                  Título del puesto <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ingresá el título del puesto (ej. Analista Funcional Jr., Desarrollador Frontend)"
                  className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/40 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-3 py-2 text-sm outline-none text-[#11314E] placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#11314E] mb-1">
                    Área / Departamento <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Ingresá el área o departamento (ej. Sistemas, Comercial, RRHH)"
                    className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/40 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-3 py-2 text-sm outline-none text-[#11314E] placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#11314E] mb-1">
                    Ubicación (País / Localidad) <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ingresá la ubicación (ej. Buenos Aires, Argentina)"
                    className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/40 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-3 py-2 text-sm outline-none text-[#11314E] placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Desplegable Personalizado y Estilizado para Modalidad */}
                <div className="relative" ref={modalityDropdownRef}>
                  <label className="block text-xs font-semibold text-[#11314E] mb-1">
                    Modalidad <span className="text-red-500 font-bold">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsModalityOpen((prev) => !prev)}
                    className={`w-full flex items-center justify-between border rounded-lg px-2.5 py-2 text-xs font-medium outline-none transition-all cursor-pointer h-[38px] ${
                      isModalityOpen
                        ? 'border-[#EC623E] ring-1 ring-[#EC623E] bg-white'
                        : 'border-[#EFE3D3] bg-[#FAF4EC]/40 hover:bg-white focus:border-[#EC623E]'
                    }`}
                  >
                    <span className={modality ? 'text-[#11314E] font-semibold truncate' : 'text-slate-400 truncate'}>
                      {modality || 'Ingresá modalidad'}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isModalityOpen ? 'rotate-180 text-[#EC623E]' : ''
                      }`}
                    />
                  </button>

                  {isModalityOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#EFE3D3] rounded-xl shadow-xl py-1 z-30 overflow-hidden">
                      {MODALITY_OPTIONS.map((opt) => {
                        const isSelected = modality === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setModality(opt.value);
                              setIsModalityOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#FAF4EC] text-[#EC623E] font-bold'
                                : 'text-[#11314E] hover:bg-[#FAF4EC]/70 hover:text-[#EC623E]'
                            }`}
                          >
                            <div>
                              <p className="font-semibold text-xs leading-tight">{opt.label}</p>
                              <p className="text-[10px] text-slate-400 font-normal mt-0.5">{opt.desc}</p>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#EC623E] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#11314E] mb-1">
                    Experiencia mín.
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minExp}
                    onChange={(e) => setMinExp(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ingresá años"
                    className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/40 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-2.5 py-2 text-xs outline-none text-[#11314E] placeholder:text-slate-400 h-[38px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#11314E] mb-1">
                    Rango salarial
                  </label>
                  <input
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    placeholder="Ingresá rango"
                    className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/40 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-2.5 py-2 text-xs outline-none text-[#11314E] placeholder:text-slate-400 h-[38px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#11314E] mb-1">
                  Skills obligatorias (separadas por coma) <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  required
                  value={requiredSkills}
                  onChange={(e) => setRequiredSkills(e.target.value)}
                  placeholder="Ingresá las skills obligatorias (ej. React, TypeScript, SQL, Inglés)"
                  className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/40 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-3 py-2 text-sm outline-none text-[#11314E] placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#11314E] mb-1">
                  Skills deseables (separadas por coma)
                </label>
                <input
                  value={niceSkills}
                  onChange={(e) => setNiceSkills(e.target.value)}
                  placeholder="Ingresá las skills deseables (ej. Power BI, Scrum, AWS, Docker)"
                  className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/40 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-3 py-2 text-sm outline-none text-[#11314E] placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#11314E] mb-1">
                  Descripción del puesto <span className="text-red-500 font-bold">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  placeholder="Ingresá la descripción detallada del puesto, responsabilidades, objetivos principales y beneficios..."
                  onChange={(e) => {
                    setDescription(e.target.value);
                    // Auto-expandir al hacer saltos de línea o cambiar contenido
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/40 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-3 py-2 text-sm outline-none text-[#11314E] placeholder:text-slate-400 min-h-[88px] max-h-[260px] overflow-y-auto resize-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EFE3D3]/70">
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-[#EC623E] hover:bg-[#D95330] text-white rounded-xl transition-all cursor-pointer shadow-sm hover:shadow"
                >
                  Guardar Vacante
                </button>
                <button
                  type="button"
                  onClick={handleCloseJobModal}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-[#11314E] hover:bg-[#FAF4EC] border border-[#EFE3D3] rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
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

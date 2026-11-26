import React, { useState } from 'react';
import { Briefcase, MapPin, Plus, X } from 'lucide-react';
import { useHireFlow } from '../context/HireFlowContext';
import { JobStatus } from '../types';

export const Jobs: React.FC = () => {
  const { jobs, applications, addJob, updateJobStatus } = useHireFlow();
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Sistemas');
  const [location, setLocation] = useState('Híbrido');
  const [modality, setModality] = useState('Full-time');
  const [minExp, setMinExp] = useState(2);
  const [salaryRange, setSalaryRange] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [niceSkills, setNiceSkills] = useState('');
  const [description, setDescription] = useState('');

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

    setTitle('');
    setRequiredSkills('');
    setNiceSkills('');
    setDescription('');
    setSalaryRange('');
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Vacantes y Búsquedas</h2>
          <p className="text-sm text-slate-500 mt-1">
            Definí los requisitos y competencias clave que utilizará el motor ATS.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nueva Vacante
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map((job) => {
          const count = applications.filter((a) => a.job_id === job.id).length;
          return (
            <div
              key={job.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {job.department}
                    </span>
                    <h3 className="font-semibold text-base text-slate-900 mt-2">{job.title}</h3>
                  </div>
                  <select
                    value={job.status}
                    onChange={(e) => updateJobStatus(job.id, e.target.value as JobStatus)}
                    className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-slate-50 text-slate-700"
                  >
                    <option value="open">Abierta</option>
                    <option value="paused">Pausada</option>
                    <option value="closed">Cerrada</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {job.location}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" /> {job.min_experience_years}+ años
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-3 line-clamp-2">{job.description}</p>

                <div className="mt-4">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Requisitos ATS
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.required_skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{job.salary_range || 'Salario a convenir'}</span>
                <span className="font-semibold text-slate-800">{count} postulados</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Nueva Vacante */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Crear Nueva Vacante</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Título del puesto *
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Analista Funcional Jr."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Área</label>
                  <input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Ubicación</label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Experiencia mínima (años)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minExp}
                    onChange={(e) => setMinExp(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Rango salarial
                  </label>
                  <input
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    placeholder="Opcional"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Skills obligatorias (separadas por coma) *
                </label>
                <input
                  required
                  value={requiredSkills}
                  onChange={(e) => setRequiredSkills(e.target.value)}
                  placeholder="React, TypeScript, SQL, Inglés"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Skills deseables (separadas por coma)
                </label>
                <input
                  value={niceSkills}
                  onChange={(e) => setNiceSkills(e.target.value)}
                  placeholder="Power BI, Scrum"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer"
                >
                  Guardar Vacante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

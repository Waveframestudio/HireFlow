import React, { useState } from 'react';
import { FileText, Search, Upload, UserPlus, X } from 'lucide-react';
import { useHireFlow } from '../context/HireFlowContext';
import { extractSkillsFromText } from '../lib/ats';

export const Candidates: React.FC = () => {
  const { candidates, jobs, applications, addCandidate, applyCandidateToJob } = useHireFlow();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [source, setSource] = useState('Portal Propio');
  const [yearsExp, setYearsExp] = useState(2);
  const [cvText, setCvText] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [applyJobId, setApplyJobId] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);

  const handleCvTextChange = (text: string) => {
    setCvText(text);
    const detected = extractSkillsFromText(text);
    if (detected.length > 0 && !skillsInput.trim()) {
      setSkillsInput(detected.join(', '));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCvFile(file);

    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const text = await file.text();
      handleCvTextChange(text);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    await addCandidate(
      {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        location: location.trim() || undefined,
        source,
        years_experience: Number(yearsExp) || 0,
        skills: skills.length > 0 ? skills : extractSkillsFromText(cvText),
        cv_text: cvText.trim(),
        cv_filename: cvFile?.name,
      },
      applyJobId || undefined,
      cvFile
    );

    setFullName('');
    setEmail('');
    setPhone('');
    setLocation('');
    setCvText('');
    setSkillsInput('');
    setApplyJobId('');
    setCvFile(null);
    setShowModal(false);
  };

  const filtered = candidates.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.skills.some((s) => s.toLowerCase().includes(q)) ||
      c.cv_text.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Base Histórica de Candidatos</h2>
          <p className="text-sm text-slate-500 mt-1">
            Recepción de CVs, extracción automática de skills y búsqueda sobre el talento histórico.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Cargar CV / Candidato
        </button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, skill (ej. React, Excel, Liquidación) o texto del CV..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500"
        />
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 bg-slate-50">
              <th className="py-3 px-4">Candidato</th>
              <th className="py-3 px-4">Skills Detectadas</th>
              <th className="py-3 px-4">Exp.</th>
              <th className="py-3 px-4">Fuente</th>
              <th className="py-3 px-4">CV</th>
              <th className="py-3 px-4">Asignar a Vacante</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filtered.map((c) => {
              const appliedJobIds = applications
                .filter((a) => a.candidate_id === c.id)
                .map((a) => a.job_id);
              const availableJobs = jobs.filter(
                (j) => j.status === 'open' && !appliedJobIds.includes(j.id)
              );

              return (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-900">{c.full_name}</p>
                    <p className="text-xs text-slate-500">{c.email}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {c.skills.map((s) => (
                        <span
                          key={s}
                          className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{c.years_experience} años</td>
                  <td className="py-3.5 px-4 text-slate-600">{c.source}</td>
                  <td className="py-3.5 px-4">
                    {c.cv_filename ? (
                      <span className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium">
                        <FileText className="w-3.5 h-3.5" />
                        {c.cv_filename}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Sin archivo</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {availableJobs.length > 0 ? (
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            applyCandidateToJob(c.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700"
                      >
                        <option value="" disabled>
                          + Postular a...
                        </option>
                        {availableJobs.map((j) => (
                          <option key={j.id} value={j.id}>
                            {j.title}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-slate-400">Sin vacantes disponibles</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Carga de CV */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Cargar CV y Procesar Perfil ATS</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email *</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Teléfono</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Años de exp.
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={yearsExp}
                    onChange={(e) => setYearsExp(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Fuente</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white"
                  >
                    <option value="Portal Propio">Portal Propio</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Base Histórica">Base Histórica</option>
                    <option value="Referido">Referido</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Archivo de CV (PDF / DOCX / TXT)
                </label>
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-lg p-3 text-xs text-slate-600 hover:border-indigo-400 cursor-pointer">
                  <Upload className="w-4 h-4 text-indigo-500" />
                  <span>{cvFile ? cvFile.name : 'Seleccionar archivo de CV'}</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Resumen / Texto del CV (para cálculo automático ATS)
                </label>
                <textarea
                  rows={3}
                  value={cvText}
                  onChange={(e) => handleCvTextChange(e.target.value)}
                  placeholder="Pegá aquí el contenido del CV o experiencia relevante..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Skills (auto-detectadas o separadas por coma)
                </label>
                <input
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="React, SQL, Excel, Selección..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Postular directamente a una vacante (opcional)
                </label>
                <select
                  value={applyJobId}
                  onChange={(e) => setApplyJobId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">Solo guardar en Base Histórica</option>
                  {jobs
                    .filter((j) => j.status === 'open')
                    .map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title} ({j.department})
                      </option>
                    ))}
                </select>
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
                  Guardar y Evaluar ATS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

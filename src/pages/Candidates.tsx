import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Search,
  Sparkles,
  Upload,
  UserPlus,
  X,
} from 'lucide-react';
import { useHireFlow } from '../context/HireFlowContext';
import {
  calculateATSScore,
  detectEmailFromText,
  detectPhoneFromText,
  detectYearsExpFromText,
  extractSkillsFromText,
} from '../lib/ats';
import { extractTextFromPdf } from '../lib/pdfParser';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { ScrollReveal } from '../components/ScrollReveal';

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

  // Estados del extractor inteligente de PDF
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [parseStatus, setParseStatus] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleCvTextChange = (text: string) => {
    setCvText(text);
    const detected = extractSkillsFromText(text);
    if (detected.length > 0 && !skillsInput.trim()) {
      setSkillsInput(detected.join(', '));
    }
  };

  const processFile = async (file: File) => {
    setCvFile(file);
    setIsParsingPdf(true);
    setParseStatus('Extrayendo texto del documento y analizando perfil...');

    try {
      let extracted = '';
      const isPdf =
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

      if (isPdf) {
        extracted = await extractTextFromPdf(file);
      } else {
        extracted = await file.text();
      }

      if (extracted.trim().length > 0) {
        setCvText(extracted);

        // 1. Extraer skills detectadas
        const detectedSkills = extractSkillsFromText(extracted);
        if (detectedSkills.length > 0) {
          setSkillsInput(detectedSkills.join(', '));
        }

        // 2. Autodetectar email si no está cargado
        const detectedEmail = detectEmailFromText(extracted);
        if (detectedEmail && !email.trim()) {
          setEmail(detectedEmail);
        }

        // 3. Autodetectar teléfono si no está cargado
        const detectedPhone = detectPhoneFromText(extracted);
        if (detectedPhone && !phone.trim()) {
          setPhone(detectedPhone);
        }

        // 4. Autodetectar años de experiencia
        const detectedYears = detectYearsExpFromText(extracted);
        if (detectedYears !== null) {
          setYearsExp(detectedYears);
        }

        // 5. Autodetectar nombre si está vacío a partir del nombre del archivo o primera línea
        if (!fullName.trim()) {
          const cleanFileName = file.name
            .replace(/\.[^/.]+$/, '')
            .replace(/^(cv|curriculum|resume|hoja\s*de\s*vida)[-_ ]*/i, '')
            .replace(/[-_]/g, ' ')
            .trim();
          if (cleanFileName.length >= 3) {
            setFullName(
              cleanFileName
                .split(' ')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(' ')
            );
          }
        }

        setParseStatus(
          `✓ Documento procesado: ${detectedSkills.length} skills detectadas automáticamente`
        );
      } else {
        setParseStatus('⚠️ El archivo no contiene capas de texto legibles.');
      }
    } catch (err) {
      console.error('Error procesando archivo:', err);
      setParseStatus('⚠️ Error al leer el PDF. Podés pegar el texto manualmente.');
    } finally {
      setIsParsingPdf(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
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
    setParseStatus(null);
    setShowModal(false);
  };

  // Cálculo preliminar de ATS si hay una vacante seleccionada
  const selectedJob = jobs.find((j) => j.id === applyJobId);
  const previewAts = selectedJob
    ? calculateATSScore(
        {
          id: 'preview',
          full_name: fullName,
          email,
          years_experience: Number(yearsExp) || 0,
          skills: skillsInput.split(',').map((s) => s.trim()).filter(Boolean),
          cv_text: cvText,
          source,
          created_at: new Date().toISOString(),
        },
        selectedJob
      )
    : null;

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
      <ScrollReveal direction="down" duration={0.6}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#11314E]">Base Histórica de Candidatos</h2>
            <p className="text-sm text-slate-600 mt-1">
              Recepción de CVs con extracción automática de texto en PDF, detección de skills y búsqueda sobre el talento histórico.
            </p>
          </div>

          <button
            onClick={() => {
              setParseStatus(null);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 bg-[#EC623E] hover:bg-[#D95330] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer shadow-sm hover:shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            Cargar CV / Candidato
          </button>
        </div>
      </ScrollReveal>

      {/* Search bar */}
      <ScrollReveal delay={0.1}>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, skill (ej. React, Excel, Liquidación) o texto del CV..."
            className="w-full bg-white border border-[#EFE3D3] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none text-[#11314E] focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] shadow-xs"
          />
        </div>
      </ScrollReveal>

      {/* Candidates Table */}
      <ScrollReveal delay={0.15}>
        <div className="bg-white rounded-xl border border-[#EFE3D3] overflow-x-auto shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EFE3D3] text-xs uppercase text-[#11314E] bg-[#FCF2E4]/50 font-semibold">
                <th className="py-3 px-4">Candidato</th>
                <th className="py-3 px-4">Skills Detectadas</th>
                <th className="py-3 px-4">Exp.</th>
                <th className="py-3 px-4">Fuente</th>
                <th className="py-3 px-4">CV</th>
                <th className="py-3 px-4">Asignar a Vacante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE3D3]/60 text-sm">
              {filtered.map((c) => {
                const appliedJobIds = applications
                  .filter((a) => a.candidate_id === c.id)
                  .map((a) => a.job_id);
                const availableJobs = jobs.filter(
                  (j) => j.status === 'open' && !appliedJobIds.includes(j.id)
                );

                return (
                  <tr key={c.id} className="hover:bg-[#FCF2E4]/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-[#11314E]">{c.full_name}</p>
                      <p className="text-xs text-slate-500">{c.email}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {c.skills.map((s) => (
                          <span
                            key={s}
                            className="text-xs bg-[#FAF4EC] text-[#11314E] border border-[#EFE3D3]/80 px-2 py-0.5 rounded font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#11314E] font-medium">
                      <AnimatedNumber value={c.years_experience} /> años
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{c.source}</td>
                    <td className="py-3.5 px-4">
                      {c.cv_filename ? (
                        <span className="inline-flex items-center gap-1 text-xs text-[#EC623E] font-semibold">
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
                          className="text-xs border border-[#EFE3D3] rounded-md px-2 py-1.5 bg-[#FAF4EC] text-[#11314E] font-medium"
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
      </ScrollReveal>

      {/* Modal Carga de CV con Lector Automático de PDF */}
      {showModal && (
        <div className="fixed inset-0 bg-[#11314E]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-[#EFE3D3] max-w-xl w-full p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 border-b border-[#EFE3D3]/70 pb-3">
              <div>
                <h3 className="font-bold text-lg text-[#11314E]">Cargar CV y Analizar ATS</h3>
                <p className="text-xs text-slate-500">Arrastrá un PDF para extraer datos y skills de forma automática</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-[#11314E] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dropzone de subida de PDF */}
              <div>
                <label className="block text-xs font-semibold text-[#11314E] mb-1">
                  Archivo de CV (PDF o TXT)
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) await processFile(file);
                  }}
                  className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                    isDragging
                      ? 'border-[#EC623E] bg-[#FDEEE9]/60 scale-[1.01]'
                      : 'border-[#EFE3D3] hover:border-[#EC623E] bg-[#FAF4EC]/40'
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {isParsingPdf ? (
                    <div className="flex flex-col items-center gap-2 text-[#EC623E]">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <p className="text-xs font-semibold">Extrayendo texto del PDF...</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-[#FAF4EC] flex items-center justify-center border border-[#EFE3D3]">
                        <Upload className="w-5 h-5 text-[#EC623E]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#11314E]">
                          {cvFile ? cvFile.name : 'Hacé clic o arrastrá el PDF aquí'}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Extracción inteligente de skills, email, teléfono y experiencia
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {parseStatus && (
                  <div
                    className={`mt-2 p-2.5 rounded-lg text-xs flex items-center gap-2 font-medium ${
                      parseStatus.startsWith('✓')
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {parseStatus.startsWith('✓') ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <span>{parseStatus}</span>
                  </div>
                )}
              </div>

              {/* Datos personales autocompletables */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#11314E] mb-1">
                    Nombre completo *
                  </label>
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. Martina Benítez"
                    className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/30 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-3 py-2 text-sm outline-none text-[#11314E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#11314E] mb-1">Email *</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@ejemplo.com"
                    className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/30 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-3 py-2 text-sm outline-none text-[#11314E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#11314E] mb-1">Teléfono</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+54 9 11 ..."
                    className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/30 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-3 py-2 text-sm outline-none text-[#11314E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#11314E] mb-1">
                    Años de exp.
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={yearsExp}
                    onChange={(e) => setYearsExp(Number(e.target.value))}
                    className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/30 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-3 py-2 text-sm outline-none text-[#11314E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#11314E] mb-1">Fuente</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/30 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-2 py-2 text-sm text-[#11314E]"
                  >
                    <option value="Portal Propio">Portal Propio</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Base Histórica">Base Histórica</option>
                    <option value="Referido">Referido</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#11314E] mb-1">
                  Skills detectadas (separadas por coma)
                </label>
                <input
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="React, TypeScript, SQL, Excel..."
                  className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/30 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-3 py-2 text-sm outline-none text-[#11314E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#11314E] mb-1">
                  Texto del CV extraído (motor de análisis ATS)
                </label>
                <textarea
                  rows={3}
                  value={cvText}
                  onChange={(e) => handleCvTextChange(e.target.value)}
                  placeholder="El texto de tu PDF aparecerá aquí automáticamente para indexación..."
                  className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/30 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-3 py-2 text-xs outline-none text-[#11314E] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#11314E] mb-1">
                  Postular directamente a una vacante (opcional)
                </label>
                <select
                  value={applyJobId}
                  onChange={(e) => setApplyJobId(e.target.value)}
                  className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/30 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-3 py-2 text-sm text-[#11314E]"
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

              {/* Vista previa del Match ATS en vivo */}
              {previewAts && selectedJob && (
                <div className="p-3 bg-[#FAF4EC] rounded-xl border border-[#EFE3D3] text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#11314E] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#EC623E]" />
                      Match ATS Preliminar con {selectedJob.title}:
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        previewAts.score >= 80
                          ? 'text-[#EC623E]'
                          : previewAts.score >= 60
                          ? 'text-[#1A446C]'
                          : 'text-rose-600'
                      }`}
                    >
                      {previewAts.score}%
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    <span className="text-slate-500">Skills cumplidas:</span>
                    {previewAts.matchedSkills.length > 0 ? (
                      previewAts.matchedSkills.map((s) => (
                        <span
                          key={s}
                          className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded font-medium"
                        >
                          ✓ {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">Ninguna coincidencia</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EFE3D3]/70">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-[#FAF4EC] rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isParsingPdf}
                  className="px-4 py-2 text-sm font-semibold bg-[#EC623E] hover:bg-[#D95330] disabled:opacity-50 text-white rounded-lg cursor-pointer shadow-sm transition-colors"
                >
                  Guardar y Procesar ATS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

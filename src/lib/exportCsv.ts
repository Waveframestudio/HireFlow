import { Application, Candidate, Interview, Job, STAGE_LABELS } from '../types';

/**
 * Escapa un valor individual para formato CSV según RFC 4180
 */
function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Convierte filas y columnas en texto CSV con UTF-8 BOM para compatibilidad total con Microsoft Excel
 */
function toCsvString(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const headerLine = headers.map(escapeCsvValue).join(',');
  const rowLines = rows.map((row) => row.map(escapeCsvValue).join(','));
  // \uFEFF asegura que Excel en Windows y Mac reconozca tildes y caracteres especiales en UTF-8
  return '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
}

/**
 * Dispara la descarga de un archivo CSV en el navegador
 */
export function downloadCsvFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta el listado completo de candidatos registrados
 */
export function exportCandidatesToCsv(
  candidates: Candidate[],
  applications: Application[],
  jobs: Job[]
): void {
  const headers = [
    'ID Candidato',
    'Nombre Completo',
    'Email',
    'Teléfono',
    'Ubicación',
    'Años de Experiencia',
    'Fuente de Reclutamiento',
    'Skills Principales',
    'Postulaciones Activas',
    'Puestos Postulados',
    'Nombre de Archivo CV',
  ];

  const rows = candidates.map((c) => {
    const candidateApps = applications.filter((a) => a.candidate_id === c.id);
    const jobTitles = candidateApps
      .map((a) => jobs.find((j) => j.id === a.job_id)?.title || 'Vacante eliminada')
      .join('; ');

    return [
      c.id,
      c.full_name,
      c.email,
      c.phone || 'No especificado',
      c.location || 'No especificada',
      c.years_experience,
      c.source,
      c.skills.join(', '),
      candidateApps.length,
      jobTitles || 'Ninguna postulación',
      c.cv_filename || 'Sin archivo adjunto',
    ];
  });

  const csv = toCsvString(headers, rows);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCsvFile(csv, `HireFlow_Candidatos_${dateStr}.csv`);
}

/**
 * Exporta el pipeline de selección completo con scores ATS y estados
 */
export function exportPipelineToCsv(
  applications: Application[],
  candidates: Candidate[],
  jobs: Job[]
): void {
  const headers = [
    'ID Postulación',
    'Candidato',
    'Email Candidato',
    'Teléfono',
    'Vacante Postulada',
    'Departamento',
    'Etapa Actual',
    'Score ATS (%)',
    'Habilidades Coincidentes',
    'Habilidades Faltantes',
    'Motivo de Descarte',
    'Fecha de Postulación',
  ];

  const rows = applications.map((app) => {
    const c = candidates.find((cand) => cand.id === app.candidate_id);
    const j = jobs.find((job) => job.id === app.job_id);

    return [
      app.id,
      c?.full_name || 'Desconocido',
      c?.email || '-',
      c?.phone || '-',
      j?.title || 'Vacante no disponible',
      j?.department || '-',
      STAGE_LABELS[app.stage],
      `${app.ats_score}%`,
      app.matched_skills.join(', '),
      app.missing_skills.join(', '),
      app.rejection_reason || 'N/A',
      new Date(app.applied_at).toLocaleDateString('es-AR'),
    ];
  });

  const csv = toCsvString(headers, rows);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCsvFile(csv, `HireFlow_Pipeline_ATS_${dateStr}.csv`);
}

/**
 * Exporta el historial de entrevistas y citaciones
 */
export function exportInterviewsToCsv(
  interviews: Interview[],
  applications: Application[],
  candidates: Candidate[],
  jobs: Job[]
): void {
  const headers = [
    'ID Entrevista',
    'Candidato',
    'Email Candidato',
    'Puesto / Vacante',
    'Tipo de Instancia',
    'Fecha y Hora Programada',
    'Estado',
    'Entrevistador Responsable',
    'Modalidad / Lugar / Enlace',
    'Calificación (Estrellas 1-5)',
    'Devolución / Feedback',
  ];

  const rows = interviews.map((int) => {
    const app = applications.find((a) => a.id === int.application_id);
    const c = app ? candidates.find((cand) => cand.id === app.candidate_id) : null;
    const j = app ? jobs.find((job) => job.id === app.job_id) : null;

    return [
      int.id,
      c?.full_name || 'Desconocido',
      c?.email || '-',
      j?.title || '-',
      int.type.toUpperCase(),
      new Date(int.scheduled_at).toLocaleString('es-AR'),
      int.status === 'completed' ? 'Completada' : int.status === 'cancelled' ? 'Cancelada' : 'Agendada',
      int.interviewer,
      int.location_or_link,
      int.rating ? `${int.rating} / 5` : 'Pendiente',
      int.feedback || 'Sin notas registradas',
    ];
  });

  const csv = toCsvString(headers, rows);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCsvFile(csv, `HireFlow_Reporte_Entrevistas_${dateStr}.csv`);
}

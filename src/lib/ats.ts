import { Candidate, Job } from '../types';

export interface ATSResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  experienceMatch: boolean;
}

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/**
 * Calcula el puntaje ATS (0-100) comparando el perfil y texto del CV del candidato
 * contra los requisitos obligatorios, deseables y años de experiencia de una vacante.
 */
export function calculateATSScore(candidate: Candidate, job: Job): ATSResult {
  const haystack = normalize(
    [candidate.cv_text, ...candidate.skills, candidate.notes || ''].join(' ')
  );

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of job.required_skills) {
    if (haystack.includes(normalize(skill))) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  let niceMatched = 0;
  for (const skill of job.nice_to_have_skills) {
    if (haystack.includes(normalize(skill))) {
      niceMatched++;
      if (!matchedSkills.includes(skill)) {
        matchedSkills.push(skill);
      }
    }
  }

  // Ponderación: 65% skills obligatorias, 15% deseables, 20% experiencia
  const reqRatio =
    job.required_skills.length > 0
      ? (job.required_skills.length - missingSkills.length) / job.required_skills.length
      : 1;

  const niceRatio =
    job.nice_to_have_skills.length > 0
      ? niceMatched / job.nice_to_have_skills.length
      : 1;

  const experienceMatch = candidate.years_experience >= job.min_experience_years;
  const expRatio =
    job.min_experience_years > 0
      ? Math.min(1, candidate.years_experience / job.min_experience_years)
      : 1;

  const score = Math.round(reqRatio * 65 + niceRatio * 15 + expRatio * 20);

  return {
    score: Math.max(0, Math.min(100, score)),
    matchedSkills,
    missingSkills,
    experienceMatch,
  };
}

/**
 * Extrae skills detectadas automáticamente desde el texto de un CV usando un diccionario base.
 */
const KNOWN_SKILLS = [
  'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'SQL', 'PostgreSQL',
  'Supabase', 'Excel', 'Power BI', 'SAP', 'Inglés', 'Scrum', 'Jira', 'Git',
  'Ventas', 'CRM', 'Contabilidad', 'Liquidación de Sueldos', 'RRHH', 'Selección',
  'Liderazgo', 'Atención al Cliente', 'Marketing Digital', 'Docker', 'AWS', 'Tailwind',
];

export function extractSkillsFromText(cvText: string): string[] {
  const normText = normalize(cvText);
  return KNOWN_SKILLS.filter((skill) => normText.includes(normalize(skill)));
}

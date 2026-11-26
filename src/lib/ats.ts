import { Candidate, Job } from '../types';

export interface ATSResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  experienceMatch: boolean;
}

export const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

interface SkillDefinition {
  canonical: string;
  synonyms: string[];
}

export const SKILL_DICTIONARY: SkillDefinition[] = [
  { canonical: 'React', synonyms: ['react', 'react.js', 'reactjs', 'react native'] },
  { canonical: 'TypeScript', synonyms: ['typescript', 'ts'] },
  { canonical: 'JavaScript', synonyms: ['javascript', 'js', 'es6'] },
  { canonical: 'Node.js', synonyms: ['node.js', 'nodejs', 'node', 'express', 'nestjs'] },
  { canonical: 'Python', synonyms: ['python', 'django', 'fastapi', 'flask'] },
  { canonical: 'SQL', synonyms: ['sql', 'mysql', 'sqlite'] },
  { canonical: 'PostgreSQL', synonyms: ['postgresql', 'postgres'] },
  { canonical: 'Supabase', synonyms: ['supabase', 'firebase'] },
  { canonical: 'Excel', synonyms: ['excel', 'excel avanzado', 'hojas de calculo', 'spreadsheets'] },
  { canonical: 'Power BI', synonyms: ['power bi', 'powerbi', 'dax', 'tableau'] },
  { canonical: 'SAP', synonyms: ['sap', 'sap fi', 'sap hr'] },
  { canonical: 'Inglés', synonyms: ['ingles', 'english', 'bilingue', 'b2', 'c1', 'c2'] },
  { canonical: 'Scrum', synonyms: ['scrum', 'agile', 'kanban'] },
  { canonical: 'Jira', synonyms: ['jira', 'trello', 'asana'] },
  { canonical: 'Git', synonyms: ['git', 'github', 'gitlab'] },
  { canonical: 'Ventas', synonyms: ['ventas', 'comercial', 'sales', 'business development'] },
  { canonical: 'CRM', synonyms: ['crm', 'hubspot', 'salesforce', 'zoho'] },
  { canonical: 'Contabilidad', synonyms: ['contabilidad', 'balance', 'impuestos', 'finanzas'] },
  { canonical: 'Liquidación de Sueldos', synonyms: ['liquidacion de sueldos', 'payroll', 'sueldos y jornales'] },
  { canonical: 'RRHH', synonyms: ['rrhh', 'recursos humanos', 'human resources', 'gestion de talento'] },
  { canonical: 'Selección', synonyms: ['seleccion', 'reclutamiento', 'recruitment', 'headhunting', 'talent acquisition'] },
  { canonical: 'Liderazgo', synonyms: ['liderazgo', 'gestion de equipos', 'team lead', 'coordinacion'] },
  { canonical: 'Atención al Cliente', synonyms: ['atencion al cliente', 'soporte', 'customer service', 'helpdesk'] },
  { canonical: 'Marketing Digital', synonyms: ['marketing digital', 'seo', 'sem', 'google ads', 'meta ads', 'redes sociales'] },
  { canonical: 'Docker', synonyms: ['docker', 'kubernetes', 'k8s', 'containers'] },
  { canonical: 'AWS', synonyms: ['aws', 'amazon web services', 'cloud', 'gcp', 'azure'] },
  { canonical: 'Tailwind', synonyms: ['tailwind', 'tailwindcss', 'css3', 'css'] },
];

/**
 * Verifica si una skill requerida está presente en el texto analizado
 * contemplando el nombre de la skill y posibles sinónimos técnicos.
 */
function skillMatches(skill: string, haystack: string): boolean {
  const normSkill = normalize(skill);
  if (haystack.includes(normSkill)) return true;

  const foundDef = SKILL_DICTIONARY.find(
    (def) =>
      normalize(def.canonical) === normSkill ||
      def.synonyms.some((s) => normalize(s) === normSkill)
  );

  if (foundDef) {
    return foundDef.synonyms.some((syn) => haystack.includes(normalize(syn)));
  }

  return false;
}

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
    if (skillMatches(skill, haystack)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  let niceMatched = 0;
  for (const skill of job.nice_to_have_skills) {
    if (skillMatches(skill, haystack)) {
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
 * Extrae skills detectadas automáticamente desde el texto de un CV usando el diccionario y sinónimos.
 */
export function extractSkillsFromText(cvText: string): string[] {
  const normText = normalize(cvText);
  const detected: string[] = [];

  for (const def of SKILL_DICTIONARY) {
    const hasMatch =
      normText.includes(normalize(def.canonical)) ||
      def.synonyms.some((syn) => normText.includes(normalize(syn)));

    if (hasMatch && !detected.includes(def.canonical)) {
      detected.push(def.canonical);
    }
  }

  return detected;
}

/**
 * Detecta dirección de email en el texto de un CV.
 */
export function detectEmailFromText(text: string): string | null {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
}

/**
 * Detecta teléfono en el texto de un CV.
 */
export function detectPhoneFromText(text: string): string | null {
  const match = text.match(/(?:\+?54\s?9?)?\s?(?:11|\d{2,4})[\s.-]?\d{3,4}[\s.-]?\d{4}/);
  return match ? match[0].trim() : null;
}

/**
 * Detecta años de experiencia mencionados en el CV.
 */
export function detectYearsExpFromText(text: string): number | null {
  const norm = normalize(text);
  const match = norm.match(/(\d{1,2})\s*(?:\+)?\s*(?:anos|ano|anios|years)\s*(?:de)?\s*(?:experiencia|exp)/);
  if (match) {
    const val = parseInt(match[1], 10);
    if (!isNaN(val) && val >= 0 && val <= 40) return val;
  }
  return null;
}

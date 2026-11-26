export type EmailTemplateKey = 'interview_invitation' | 'job_offer' | 'rejection' | 'document_request';

export interface EmailTemplateContext {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName?: string;
  interviewType?: string;
  scheduledDate?: string;
  locationOrLink?: string;
  interviewer?: string;
  rejectionReason?: string;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
}

export const EMAIL_TEMPLATES: Record<
  EmailTemplateKey,
  {
    title: string;
    description: string;
    generate: (ctx: EmailTemplateContext) => GeneratedEmail;
  }
> = {
  interview_invitation: {
    title: 'Invitación a Entrevista',
    description: 'Convocar al postulante a una instancia de screening o entrevista técnica/RRHH.',
    generate: (ctx) => ({
      subject: `Invitación a entrevista para ${ctx.jobTitle} - HireFlow`,
      body: `Hola ${ctx.candidateName},

¡Esperamos que te encuentres muy bien!

Nos contactamos desde el equipo de selección de talento de HireFlow en relación a tu postulación para la vacante de ${ctx.jobTitle}. Revisamos tu perfil y antecedentes, y nos gustaría invitarte a una instancia de ${ctx.interviewType || 'entrevista'}.

Detalles de la cita:
• Fecha y hora: ${ctx.scheduledDate || '[A coordinar / consultar agenda]'}
• Modalidad / Enlace: ${ctx.locationOrLink || 'Google Meet / Enlace por confirmar'}
• Entrevistador/a: ${ctx.interviewer || 'Equipo de Selección'}

Por favor, confirmanos respondiendo a este correo si el horario te resulta conveniente o si preferís coordinar en otra franja horaria.

¡Quedamos a tu disposición ante cualquier consulta!

Saludos cordiales,
Equipo de Talento & Selección
HireFlow ATS`,
    }),
  },

  job_offer: {
    title: 'Propuesta / Oferta Laboral',
    description: 'Comunicar formalmente la propuesta económica y oferta de contratación.',
    generate: (ctx) => ({
      subject: `¡Propuesta de incorporación para ${ctx.jobTitle}! - HireFlow`,
      body: `Estimado/a ${ctx.candidateName},

¡Tenemos excelentes noticias!

Luego de transitar exitosamente las distintas etapas del proceso de selección para la posición de ${ctx.jobTitle}, queremos hacerte llegar formalmente nuestra propuesta de incorporación al equipo.

Destacamos tu sólida experiencia, solvencia técnica y gran afinidad con nuestros valores y cultura de trabajo.

Nos encantaría coordinar una breve llamada para repasar juntos los detalles de la oferta (condiciones, esquema de trabajo, beneficios y fecha estimada de ingreso).

Agradecemos enormemente tu dedicación durante todo el proceso y esperamos darte la bienvenida muy pronto.

Un cordial saludo,
Equipo de Recursos Humanos & Selección
HireFlow ATS`,
    }),
  },

  rejection: {
    title: 'Agradecimiento y Devolución',
    description: 'Cierre respetuoso del proceso con agradecimiento y devolución constructiva.',
    generate: (ctx) => ({
      subject: `Actualización de tu postulación para ${ctx.jobTitle} - HireFlow`,
      body: `Hola ${ctx.candidateName},

Queremos agradecerte sinceramente el tiempo, interés y compromiso que demostraste al participar en el proceso de búsqueda para el puesto de ${ctx.jobTitle}.

En esta oportunidad hemos decidido avanzar con otro perfil cuyas competencias específicas se alinean de manera más directa con las necesidades puntuales inmediatas del proyecto${
        ctx.rejectionReason ? ` (${ctx.rejectionReason})` : ''
      }.

Valoramos mucho tu perfil y trayectoria profesional, por lo que conservaremos tus datos en nuestra base activa para futuras búsquedas que coincidan con tu experiencia.

Te deseamos el mayor de los éxitos en tus próximos desafíos profesionales y te enviamos un cordial saludo.

Atentamente,
Equipo de Selección
HireFlow ATS`,
    }),
  },

  document_request: {
    title: 'Solicitud de Documentación / Referencias',
    description: 'Pedir al candidato constancias, referencias laborales o portfolio complementario.',
    generate: (ctx) => ({
      subject: `Documentación complementaria para ${ctx.jobTitle} - HireFlow`,
      body: `Hola ${ctx.candidateName},

Esperamos que estés teniendo un excelente día.

Para poder avanzar en las etapas finales del proceso de selección correspondiente a la vacante de ${ctx.jobTitle}, te solicitamos por favor enviarnos por esta vía la siguiente información complementaria:

1. Referencias laborales recientes (nombre, cargo, empresa y teléfono/email de contacto).
2. Constancias académicas o certificaciones relevantes mencionadas en tu CV.
3. Enlaces a repositorios o portfolio actualizado (en caso de aplicar).

Agradecemos nos puedas compartir esta información dentro de los próximos 3 días hábiles. Si surge alguna duda, no dudes en escribirnos.

Muchas gracias por tu predisposición.

Saludos cordiales,
Equipo de Selección
HireFlow ATS`,
    }),
  },
};

/**
 * Genera el enlace mailto: listo para abrir en el cliente de correo predeterminado
 */
export function buildMailtoUrl(email: string, subject: string, body: string): string {
  const params = new URLSearchParams({
    subject: subject,
    body: body,
  });
  return `mailto:${email}?${params.toString().replace(/\+/g, '%20')}`;
}

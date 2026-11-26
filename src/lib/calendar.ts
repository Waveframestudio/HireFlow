/**
 * Utilidades para exportación y sincronización de entrevistas con calendarios
 * (Google Calendar y archivos universales iCalendar .ics para Outlook/Apple Calendar).
 */

export interface CalendarEventOptions {
  title: string;
  description?: string;
  location?: string;
  startDate: string | Date;
  durationMinutes?: number;
}

/** Formatea una fecha a formato ISO básico UTC para Google Calendar y .ics (YYYYMMDDTHHmmssZ) */
function formatDateToIcs(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Genera el enlace directo para agregar el evento a Google Calendar en el navegador
 */
export function generateGoogleCalendarUrl(options: CalendarEventOptions): string {
  const start = new Date(options.startDate);
  const duration = options.durationMinutes ?? 45;
  const end = new Date(start.getTime() + duration * 60 * 1000);

  const startFormatted = formatDateToIcs(start);
  const endFormatted = formatDateToIcs(end);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: options.title,
    dates: `${startFormatted}/${endFormatted}`,
    details: options.description || '',
    location: options.location || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Genera el contenido del archivo .ics estándar RFC 5545
 */
export function generateIcsContent(options: CalendarEventOptions): string {
  const start = new Date(options.startDate);
  const duration = options.durationMinutes ?? 45;
  const end = new Date(start.getTime() + duration * 60 * 1000);
  const now = new Date();

  const uid = `hireflow-${start.getTime()}-${Math.random().toString(36).substring(2, 9)}@hireflow.app`;

  // Sanitizar retornos de carro para formato ICS
  const cleanDescription = (options.description || '').replace(/\r?\n/g, '\\n');
  const cleanTitle = (options.title || '').replace(/\r?\n/g, ' ');
  const cleanLocation = (options.location || '').replace(/\r?\n/g, ' ');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HireFlow ATS//WaveFrame Studio//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatDateToIcs(now)}`,
    `DTSTART:${formatDateToIcs(start)}`,
    `DTEND:${formatDateToIcs(end)}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanDescription}`,
    `LOCATION:${cleanLocation}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Descarga directamente un archivo .ics en el navegador del usuario
 */
export function downloadIcsFile(options: CalendarEventOptions, filename?: string): void {
  const icsData = generateIcsContent(options);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  const safeFilename = filename || `${options.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.ics`;
  link.download = safeFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

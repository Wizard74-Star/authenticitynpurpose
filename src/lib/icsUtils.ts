// Utility functions for iCalendar (.ics) format export/import

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  location?: string;
  color?: string;
}

// Format date to iCalendar format (YYYYMMDDTHHMMSSZ)
const formatICSDate = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

// Generate unique UID for events
const generateUID = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@goaltracker.app`;
};

// Export events to .ics format (accepts events with at least title, startTime, endTime)
export const exportToICS = (
  events: Array<Pick<CalendarEvent, 'title' | 'startTime' | 'endTime'> & Partial<CalendarEvent>>,
  startDate?: string,
  endDate?: string
): string => {
  let filteredEvents = events;
  
  // Filter by date range if provided
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    filteredEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= start && eventDate <= end;
    });
  }

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Goal Tracker//Calendar Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  filteredEvents.forEach(event => {
    const uid = event.id || generateUID();
    const dtstart = formatICSDate(event.startTime);
    const dtend = formatICSDate(event.endTime);

    icsLines.push('BEGIN:VEVENT');
    icsLines.push(`UID:${uid}`);
    icsLines.push(`DTSTAMP:${formatICSDate(new Date())}`);
    icsLines.push(`DTSTART:${dtstart}`);
    icsLines.push(`DTEND:${dtend}`);
    icsLines.push(`SUMMARY:${event.title}`);
    if (event.description) {
      icsLines.push(`DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`);
    }
    if (event.location) {
      icsLines.push(`LOCATION:${event.location}`);
    }
    if (event.color) {
      icsLines.push(`COLOR:${event.color}`);
    }
    icsLines.push('END:VEVENT');
  });

  icsLines.push('END:VCALENDAR');
  return icsLines.join('\r\n');
};

// Parse .ics file content to events
export const parseICS = (icsContent: string): CalendarEvent[] => {
  const events: CalendarEvent[] = [];
  const lines = icsContent.split(/\r?\n/);
  let currentEvent: Partial<CalendarEvent> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === 'BEGIN:VEVENT') {
      currentEvent = { id: generateUID(), color: '#3b82f6' };
    } else if (line === 'END:VEVENT' && currentEvent) {
      if (currentEvent.title && currentEvent.startTime && currentEvent.endTime) {
        events.push(currentEvent as CalendarEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      if (line.startsWith('SUMMARY:')) {
        currentEvent.title = line.substring(8);
      } else if (line.startsWith('DTSTART:')) {
        currentEvent.startTime = parseDateFromICS(line.substring(8));
      } else if (line.startsWith('DTEND:')) {
        currentEvent.endTime = parseDateFromICS(line.substring(6));
      } else if (line.startsWith('DESCRIPTION:')) {
        currentEvent.description = line.substring(12).replace(/\\n/g, '\n');
      } else if (line.startsWith('LOCATION:')) {
        currentEvent.location = line.substring(9);
      } else if (line.startsWith('COLOR:')) {
        currentEvent.color = line.substring(6);
      }
    }
  }

  return events;
};

// Parse date from ICS format to Date object.
// If the value ends with Z it's UTC; otherwise treat as local (floating) time so the calendar day is correct.
const parseDateFromICS = (icsDate: string): Date => {
  const year = parseInt(icsDate.substring(0, 4));
  const month = parseInt(icsDate.substring(4, 6)) - 1;
  const day = parseInt(icsDate.substring(6, 8));
  const hours = parseInt(icsDate.substring(9, 11));
  const minutes = parseInt(icsDate.substring(11, 13));
  const seconds = parseInt(icsDate.substring(13, 15));
  if (icsDate.endsWith('Z')) {
    return new Date(Date.UTC(year, month, day, hours, minutes, seconds));
  }
  return new Date(year, month, day, hours, minutes, seconds);
};

// Download .ics file
export const downloadICS = (icsContent: string, filename: string = 'calendar-export.ics'): void => {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

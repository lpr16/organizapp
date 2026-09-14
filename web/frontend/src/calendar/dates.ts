export function addDays(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta);
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function addYears(date: Date, delta: number): Date {
  return new Date(date.getFullYear() + delta, date.getMonth(), date.getDate());
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function startOfWeek(date: Date): Date {
  return addDays(date, -((date.getDay() + 6) % 7));
}

export function dateIso(year: number, monthIndex: number, day: number): string {
  const month = String(monthIndex + 1).padStart(2, '0');
  const dayPart = String(day).padStart(2, '0');
  return `${year}-${month}-${dayPart}`;
}

export function isoFromDate(date: Date): string {
  return dateIso(date.getFullYear(), date.getMonth(), date.getDate());
}

export function parseIso(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function monthKey(date: Date): string {
  return isoFromDate(startOfMonth(date)).slice(0, 7);
}

export function clampToMonth(year: number, monthIndex: number, day: number): string {
  const last = new Date(year, monthIndex + 1, 0).getDate();
  return dateIso(year, monthIndex, Math.min(day, last));
}

export function selectedForMonth(monthStart: Date, today: string): string {
  const key = monthKey(monthStart);
  return today.startsWith(key) ? today : `${key}-01`;
}

export function monthLabels(): string[] {
  return Array.from({ length: 12 }, (_, index) =>
    new Date(2026, index, 1).toLocaleDateString(undefined, { month: 'long' })
  );
}

export function weekdayLabels(): string[] {
  // 14 Sep 2026 is a Monday — build Mon–Sun in the user's locale.
  return Array.from({ length: 7 }, (_, index) =>
    new Date(2026, 8, 14 + index).toLocaleDateString(undefined, { weekday: 'short' })
  );
}

export function weekdayLetters(): string[] {
  return weekdayLabels().map((label) => label.slice(0, 1));
}

export function yearMonthStarts(year: number): Date[] {
  return Array.from({ length: 12 }, (_, index) => new Date(year, index, 1));
}

export function addDaysIso(iso: string, delta: number): string {
  return isoFromDate(addDays(parseIso(iso), delta));
}

export function isoRange(startIso: string, days: number): string[] {
  return Array.from({ length: days }, (_, index) => addDaysIso(startIso, index));
}

export function monthTitle(date: Date): string {
  return startOfMonth(date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function weekTitle(date: Date): string {
  const start = startOfWeek(date);
  const end = addDays(start, 6);
  const startLabel = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const endLabel = end.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startLabel} – ${endLabel}`;
}

export function formatDayHeading(iso: string): string {
  return parseIso(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export type CalendarCell = {
  iso: string;
  day: number;
  inMonth: boolean;
};

export function weekCells(date: Date): CalendarCell[] {
  const start = startOfWeek(date);
  const monthIndex = date.getMonth();
  return Array.from({ length: 7 }, (_, index) => {
    const day = addDays(start, index);
    return {
      iso: isoFromDate(day),
      day: day.getDate(),
      inMonth: day.getMonth() === monthIndex,
    };
  });
}

export function monthCells(cursor: Date): CalendarCell[] {
  const year = cursor.getFullYear();
  const monthIndex = cursor.getMonth();
  const first = startOfMonth(cursor);
  const mondayOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const prevMonthDays = new Date(year, monthIndex, 0).getDate();

  const cells: CalendarCell[] = [];

  for (let i = mondayOffset - 1; i >= 0; i -= 1) {
    const day = prevMonthDays - i;
    const prev = addMonths(first, -1);
    cells.push({
      iso: dateIso(prev.getFullYear(), prev.getMonth(), day),
      day,
      inMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      iso: dateIso(year, monthIndex, day),
      day,
      inMonth: true,
    });
  }

  const next = addMonths(first, 1);
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({
      iso: dateIso(next.getFullYear(), next.getMonth(), nextDay),
      day: nextDay,
      inMonth: false,
    });
    nextDay += 1;
  }

  return cells;
}

export function yearOptions(selectedYear: number, eventYears: number[], todayYear: number): number[] {
  const values = [selectedYear, todayYear, ...eventYears];
  const min = Math.min(todayYear - 20, ...values);
  const max = Math.max(todayYear + 20, ...values);
  return Array.from({ length: max - min + 1 }, (_, index) => min + index);
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function dateIso(year: number, monthIndex: number, day: number): string {
  const month = String(monthIndex + 1).padStart(2, '0');
  const dayPart = String(day).padStart(2, '0');
  return `${year}-${month}-${dayPart}`;
}

export function weekdayLabels(): string[] {
  // 14 Sep 2026 is a Monday — build Mon–Sun in the user's locale.
  return Array.from({ length: 7 }, (_, index) =>
    new Date(2026, 8, 14 + index).toLocaleDateString(undefined, { weekday: 'short' })
  );
}

export function monthTitle(date: Date): string {
  return startOfMonth(date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function formatDayHeading(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
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

import type { Season } from '../types/kanban';

export function isCurrentSeason(season: Season, today: string): boolean {
  if (season.startsOn > today) return false;
  return !season.endsOn || season.endsOn >= today;
}

export function formatSeasonRange(season: Season): string {
  const start = formatDay(season.startsOn);
  if (!season.endsOn) return `From ${start}`;
  return `${start} – ${formatDay(season.endsOn)}`;
}

function formatDay(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

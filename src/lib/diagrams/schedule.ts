/**
 * The better-dtek schedule: a clock runs through a simulated day while a pointer walks the
 * day's outage ranges for one GPV group. Ported from the design handoff, keeping its glyphs,
 * geometry and the one-second-per-simulated-hour pace.
 *
 * Pure: the same `t` always yields the same grid.
 */
import { Grid, type Diagram, type Frame, type Role } from '../diagram';

export type Status = 'yes' | 'no' | 'maybe';
/** [start hour, end hour, status], half-hour resolution — what the app compresses to */
export type Range = [number, number, Status];

const C: Record<string, Role> = { fg: 'fg', dim: 'faint', mute: 'dim', amber: 'accent', red: 'peach', grn: 'green' };

const ST: Record<Status, { ch: string; color: Role; label: string }> = {
  yes: { ch: '█', color: C.grn, label: 'power' },
  no: { ch: '░', color: C.red, label: 'outage' },
  maybe: { ch: '▒', color: C.amber, label: 'maybe' },
};

/** Three rows per digit. A seven-segment display is the one place box-drawing beats a font. */
const DIGITS: Record<string, string[]> = {
  '0': ['┌─┐', '│ │', '└─┘'],
  '1': [' ┐ ', ' │ ', ' ┴ '],
  '2': ['┌─┐', '┌─┘', '└─┘'],
  '3': ['┌─┐', ' ─┤', '└─┘'],
  '4': ['│ │', '└─┤', '  │'],
  '5': ['┌─ ', '└─┐', '└─┘'],
  '6': ['┌─ ', '├─┐', '└─┘'],
  '7': ['┌─┐', '  │', '  │'],
  '8': ['┌─┐', '├─┤', '└─┘'],
  '9': ['┌─┐', '└─┤', '└─┘'],
  ':': [' ', '▪', '▪'],
};

const DOW = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_NAME = ['today', 'tomorrow', 'day after'];

export const SAMPLE: { today: Range[]; tomorrow: Range[] } = {
  today: [[0, 4, 'yes'], [4, 7.5, 'no'], [7.5, 8, 'maybe'], [8, 13, 'yes'], [13, 16.5, 'no'], [16.5, 17, 'maybe'], [17, 21, 'yes'], [21, 23.5, 'no'], [23.5, 24, 'yes']],
  tomorrow: [[0, 2, 'yes'], [2, 5.5, 'no'], [5.5, 6, 'maybe'], [6, 11, 'yes'], [11, 14.5, 'no'], [14.5, 15, 'maybe'], [15, 19, 'yes'], [19, 22.5, 'no'], [22.5, 23, 'maybe'], [23, 24, 'yes']],
};

export const COLS = 66;
export const ROWS = 11;
/** three simulated days at one second per hour */
export const LOOP_S = 72;

export interface ScheduleFrame extends Frame {
  clock: string;
  status: Status;
  day: number;
}

interface Options {
  speed?: number;
  startHour?: number;
  group?: string;
  todayDow?: number;
  today?: Range[];
  tomorrow?: Range[];
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * A simulated hour passes every second, so a true minute count changes faster than the
 * screen redraws and the two right digits read as flicker. The clock steps in ten-minute
 * marks instead — and the countdown is derived from the same stepped time, so the two
 * always agree.
 */
const STEPS_PER_HOUR = 6;
const step = (hour: number) => Math.floor(hour * STEPS_PER_HOUR) / STEPS_PER_HOUR;
/** the schedule lands on half hours, so a time is only ever :00 or :30 */
const clockAt = (hour: number) => `${pad(Math.floor(hour) % 24)}:${Math.round((hour % 1) * 60) === 30 ? '30' : '00'}`;

function humanise(hours: number): string {
  const minutes = Math.round(hours * 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h${pad(minutes % 60)}m` : `${minutes}m`;
}

export function renderFrame(tSeconds: number, opts: Options = {}): ScheduleFrame {
  const { speed = 1, startHour = 6, group = 'GPV1.2', todayDow = 2 } = opts;
  const today = opts.today ?? SAMPLE.today;
  const tomorrow = opts.tomorrow ?? SAMPLE.tomorrow;

  const T = tSeconds * speed + startHour;
  const h = T % 24;
  const shown = step(h);
  const day = Math.floor(T / 24) % 3;
  const ranges = day === 0 ? today : tomorrow;
  const nextRanges = day === 0 ? tomorrow : today;

  const current = ranges.find(([from, to]) => h >= from && h < to) ?? ranges[ranges.length - 1];
  const status = ST[current[2]];
  const changeAt = current[1];
  const upcoming = ranges.find(([from]) => from === changeAt);
  const nextLabel = changeAt >= 24
    ? `tomorrow ${clockAt(0)} ${ST[nextRanges[0][2]].label}`
    : `${clockAt(changeAt)} ${ST[(upcoming ?? nextRanges[0])[2]].label}`;

  const g = new Grid(COLS, ROWS);

  // ---- clock ----
  const hh = pad(Math.floor(shown));
  const mm = pad(Math.round((shown % 1) * 60));
  let col = 1;
  for (const ch of `${hh}:${mm}`) {
    const glyph = DIGITS[ch];
    // the colon blinks at 2Hz, the way a digital clock's does
    const color = ch === ':' ? (Math.floor(T * 2) % 2 ? C.amber : C.dim) : C.amber;
    g.putLines(1, col, glyph, color);
    col += glyph[0].length + 1;
  }

  g.put(5, 1, `${DOW[(todayDow + Math.floor(T / 24)) % 7]} · ${DAY_NAME[day]}`, C.mute);
  g.put(6, 1, group, C.mute);
  g.put(8, 1, current[2] === 'yes' ? '◉' : current[2] === 'maybe' ? '◎' : '○', status.color);
  g.put(8, 3, status.label, status.color);
  g.put(9, 1, `next ${nextLabel}`, C.mute);
  g.put(10, 1, `in ${humanise(changeAt - shown)}`, C.mute);

  // ---- agenda ----
  ranges.forEach(([from, to, kind], i) => {
    const row = 1 + i;
    const range = ST[kind];
    const isNow = h >= from && h < to;
    const past = h >= to;
    const color = past ? C.dim : range.color;
    const op = past ? 0.6 : 1;

    if (isNow) g.put(row, 22, '▶', C.amber);
    g.put(row, 24, `${clockAt(from)} – ${clockAt(to)}`, isNow ? C.fg : color, op);
    g.put(row, 39, range.ch.repeat(2), color, op);
    g.put(row, 42, range.label, color, op);

    if (isNow) {
      const width = 10;
      const done = Math.round(((h - from) / (to - from)) * width);
      g.put(row, 50, '[', C.dim);
      g.put(row, 51, '█'.repeat(done) + '░'.repeat(width - done), C.amber);
      g.put(row, 61, ']', C.dim);
    }
  });

  return { grid: g.cells, clock: `${hh}:${mm}`, status: current[2], day };
}

export const diagram: Diagram = { cols: COLS, rows: ROWS, render: (t) => renderFrame(t) };

/**
 * The little train from `sl -l`, the program you get when you typo `ls`.
 *
 *   Copyright 1993,1998,2014 Toyoda Masashi (mtoyoda@acm.org)
 *
 *   Everyone is permitted to do anything on this program including copying,
 *   modifying, and improving, unless you try to pretend that you wrote it.
 *   i.e., the above copyright notice has to appear in all copies.
 *   THE AUTHOR DISCLAIMS ANY RESPONSIBILITY WITH REGARD TO THIS SOFTWARE.
 *
 * Extracted verbatim from sl.h v5.02 (github.com/mtoyoda/sl) by script, never
 * retyped: the four-row engine plus its tender and one carriage, with the two
 * wheel rows cycling through six patterns. sl draws this consist as LOGO at x,
 * LCOAL at x+21 and LCAR at x+42. Do not hand-edit.
 */

/** Six wheel patterns, each 6 rows of 63 columns. */
export const TRAIN_FRAMES: readonly (readonly string[])[] = [
  [
    "     ++      +------ ____                 ____________________ ",
    "     ||      |+-+ |  |   \\@@@@@@@@@@@     |  ___ ___ ___ ___ | ",
    "   /---------|| | |  |    \\@@@@@@@@@@@@@_ |  |_| |_| |_| |_| | ",
    "  + ========  +-+ |  |                  | |__________________| ",
    " _|--O========O~\\-+  |__________________| |__________________| ",
    "//// \\_/      \\_/       (O)       (O)        (O)        (O)    "
  ],
  [
    "     ++      +------ ____                 ____________________ ",
    "     ||      |+-+ |  |   \\@@@@@@@@@@@     |  ___ ___ ___ ___ | ",
    "   /---------|| | |  |    \\@@@@@@@@@@@@@_ |  |_| |_| |_| |_| | ",
    "  + ========  +-+ |  |                  | |__________________| ",
    " _|--/O========O\\-+  |__________________| |__________________| ",
    "//// \\_/      \\_/       (O)       (O)        (O)        (O)    "
  ],
  [
    "     ++      +------ ____                 ____________________ ",
    "     ||      |+-+ |  |   \\@@@@@@@@@@@     |  ___ ___ ___ ___ | ",
    "   /---------|| | |  |    \\@@@@@@@@@@@@@_ |  |_| |_| |_| |_| | ",
    "  + ========  +-+ |  |                  | |__________________| ",
    " _|--/~O========O-+  |__________________| |__________________| ",
    "//// \\_/      \\_/       (O)       (O)        (O)        (O)    "
  ],
  [
    "     ++      +------ ____                 ____________________ ",
    "     ||      |+-+ |  |   \\@@@@@@@@@@@     |  ___ ___ ___ ___ | ",
    "   /---------|| | |  |    \\@@@@@@@@@@@@@_ |  |_| |_| |_| |_| | ",
    "  + ========  +-+ |  |                  | |__________________| ",
    " _|--/~\\------/~\\-+  |__________________| |__________________| ",
    "//// \\_O========O       (O)       (O)        (O)        (O)    "
  ],
  [
    "     ++      +------ ____                 ____________________ ",
    "     ||      |+-+ |  |   \\@@@@@@@@@@@     |  ___ ___ ___ ___ | ",
    "   /---------|| | |  |    \\@@@@@@@@@@@@@_ |  |_| |_| |_| |_| | ",
    "  + ========  +-+ |  |                  | |__________________| ",
    " _|--/~\\------/~\\-+  |__________________| |__________________| ",
    "//// \\O========O/       (O)       (O)        (O)        (O)    "
  ],
  [
    "     ++      +------ ____                 ____________________ ",
    "     ||      |+-+ |  |   \\@@@@@@@@@@@     |  ___ ___ ___ ___ | ",
    "   /---------|| | |  |    \\@@@@@@@@@@@@@_ |  |_| |_| |_| |_| | ",
    "  + ========  +-+ |  |                  | |__________________| ",
    " _|--/~\\------/~\\-+  |__________________| |__________________| ",
    "//// O========O_/       (O)       (O)        (O)        (O)    "
  ]
];

export const TRAIN_ROWS = 6;
export const TRAIN_COLS = 63;

/** Characters that have a mirror image; everything else (| _ - = + @ O ~) is its own. */
const MIRRORED: Record<string, string> = {
  '/': '\\',
  '\\': '/',
  '(': ')',
  ')': '(',
  '[': ']',
  ']': '[',
  '{': '}',
  '}': '{',
  '<': '>',
  '>': '<',
};

/** Flip a row of art so the train faces the other way: reverse it, then mirror each glyph. */
export function mirrorRow(row: string): string {
  let out = '';
  for (let i = row.length - 1; i >= 0; i--) out += MIRRORED[row[i]] ?? row[i];
  return out;
}

/** The same consist facing right, for the left-to-right run. */
export const TRAIN_FRAMES_FLIPPED: readonly (readonly string[])[] = TRAIN_FRAMES.map((frame) =>
  frame.map(mirrorRow),
);

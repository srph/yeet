/**
 * Byte counts, rendered the way a person reads them.
 *
 * Decimal units, not binary: "48.2 MB" is what Finder and the browser's own
 * download shelf report, and these numbers sit in front of people yeeting
 * videos, not people auditing block sizes.
 *
 * One decimal place from MB up, none below — "1.4 MB" is useful precision,
 * "812.3 KB" is noise on a number nobody acts on.
 */
export const formatFileSize = (bytes: number) => {
  if (bytes < 1000) return `${bytes} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1000;
  let unit = 0;

  const render = (v: number, u: number) =>
    u === 0 ? String(Math.round(v)) : v.toFixed(1);

  // Step up while the mantissa would still read as four digits — tested on
  // the *rendered* number, not the raw one. 999_999_999 divides down to
  // 999.999… MB, which survives a plain `value >= 1000` check and then rounds
  // to "1000.0 MB". Rounding first is what makes it read "1.0 GB".
  while (unit < units.length - 1 && Number(render(value, unit)) >= 1000) {
    value /= 1000;
    unit++;
  }

  // The trailing .0 on round numbers is deliberate: it keeps the tabular-nums
  // column from jittering in width as the value changes.
  return `${render(value, unit)} ${units[unit]}`;
};

import { fieldSortFunc } from './sort-funcs';

describe('fieldSortFunc', () => {
  it('correctly sorts the object by the specified subfield (ascending, with a value and record null)', () => {
    const f = fieldSortFunc('p99', true);
    const rows = [
      { p50: -20, p90: -26, p99: -23 },
      { p50: 10, p90: 60 },
      { p50: -30, p90: -36, p99: -33 },
      { p50: 20, p90: 260, p99: 261 },
      null,
      { p50: 30, p90: 360, p99: 370 },
    ];
    expect(rows.sort(f)).toStrictEqual([
      { p50: -30, p90: -36, p99: -33 },
      { p50: -20, p90: -26, p99: -23 },
      { p50: 20, p90: 260, p99: 261 },
      { p50: 30, p90: 360, p99: 370 },
      { p50: 10, p90: 60 },
      null,
    ]);
  });

  it('correctly sorts the object by the specified subfield (descending, with a record null)', () => {
    const f = fieldSortFunc('p99', false);
    const rows = [
      { p50: -20, p90: -26, p99: -23 },
      { p50: 10, p90: 60, p99: 89 },
      { p50: -30, p90: -36, p99: -33 },
      null,
      { p50: -10, p90: -6, p99: -3 },
      { p50: 30, p90: 360, p99: 370 },
    ];
    expect(rows.sort(f)).toStrictEqual([
      { p50: 30, p90: 360, p99: 370 },
      { p50: 10, p90: 60, p99: 89 },
      { p50: -10, p90: -6, p99: -3 },
      { p50: -20, p90: -26, p99: -23 },
      { p50: -30, p90: -36, p99: -33 },
      null,
    ]);
  });
});
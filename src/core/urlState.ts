export interface ParsedUrlState {
  simId: string | null;
  values: Record<string, number>;
}

const parseNumber = (value: string | null): number | undefined => {
  if (value == null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const readUrlState = (): ParsedUrlState => {
  const search = new URLSearchParams(window.location.search);
  const values: Record<string, number> = {};

  for (const [key, raw] of search.entries()) {
    if (key === 'sim') continue;
    const num = parseNumber(raw);
    if (num !== undefined) values[key] = num;
  }

  return {
    simId: search.get('sim'),
    values,
  };
};

const format = (value: number): string => (Number.isFinite(value) ? value.toFixed(4) : '0.0000');

export const replaceUrlState = (simId: string, values: Record<string, number>): void => {
  const search = new URLSearchParams();
  search.set('sim', simId);

  for (const [key, value] of Object.entries(values)) {
    search.set(key, format(value));
  }

  const next = `${window.location.pathname}?${search.toString()}`;
  window.history.replaceState(null, '', next);
};

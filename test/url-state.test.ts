import { beforeEach, describe, expect, it } from 'vitest';
import { readUrlState, replaceUrlState } from '../src/core/urlState';

describe('URL state sync', () => {
  beforeEach(() => {
    const fakeWindow = {
      location: {
        search: '',
        pathname: '/index.html'
      },
      history: {
        replaceState: (_state: unknown, _title: string, next: string) => {
          const idx = next.indexOf('?');
          fakeWindow.location.search = idx >= 0 ? next.slice(idx) : '';
        }
      }
    };
    (globalThis as unknown as { window: typeof fakeWindow }).window = fakeWindow;
  });

  it('writes and reads sim id + numeric params', () => {
    replaceUrlState('damped-pendulum', {
      damping: 0.123456,
      gravity: 9.81
    });

    const parsed = readUrlState();
    expect(parsed.simId).toBe('damped-pendulum');
    expect(parsed.values.damping).toBeCloseTo(0.1235, 4);
    expect(parsed.values.gravity).toBeCloseTo(9.81, 4);
  });

  it('ignores non-numeric values while parsing', () => {
    const fakeWindow = (globalThis as unknown as {
      window: { location: { search: string } };
    }).window;
    fakeWindow.location.search = '?sim=orbit&damping=0.02&bad=abc';

    const parsed = readUrlState();
    expect(parsed.simId).toBe('orbit');
    expect(parsed.values.damping).toBeCloseTo(0.02, 8);
    expect(parsed.values.bad).toBeUndefined();
  });
});

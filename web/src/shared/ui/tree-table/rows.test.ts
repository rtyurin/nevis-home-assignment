import { describe, expect, it } from 'vitest';
import { closest, diffRows } from './rows';

// root ─┬─ a ─┬─ a1
//       │     └─ a2
//       └─ b
const parents: Record<string, string> = { a: 'root', b: 'root', a1: 'a', a2: 'a' };
const parentOf = (id: string) => parents[id];
const rows = (...ids: string[]) => ids.map((id) => ({ id }));

describe('closest', () => {
  it('returns the row itself when it is accepted', () => {
    expect(closest('a1', parentOf, () => true)).toBe('a1');
  });

  it('walks up to the nearest accepted ancestor', () => {
    expect(closest('a1', parentOf, (id) => id === 'root')).toBe('root');
  });

  it('returns null when nothing is accepted, or there is no row', () => {
    expect(closest('a1', parentOf, () => false)).toBeNull();
    expect(closest(null, parentOf, () => true)).toBeNull();
  });
});

describe('diffRows', () => {
  it('reveals children from under the row that expanded', () => {
    const change = diffRows(rows('root', 'a', 'b'), rows('root', 'a', 'a1', 'a2', 'b'), parentOf);
    expect(change.revealed).toEqual(
      new Map([
        ['a1', 'a'],
        ['a2', 'a'],
      ]),
    );
    expect(change.isGrowing).toBe(true);
  });

  it('reveals nested rows from under the visible ancestor, not their own hidden parent', () => {
    // `a` stayed expanded while `root` was collapsed; expanding `root` reveals both levels.
    const change = diffRows(rows('root'), rows('root', 'a', 'a1', 'a2', 'b'), parentOf);
    expect(change.revealed.get('a')).toBe('root');
    expect(change.revealed.get('a1')).toBe('root');
  });

  it('maps new rows with no visible ancestor to null', () => {
    expect(diffRows([], rows('root'), parentOf).revealed).toEqual(new Map([['root', null]]));
  });

  it('reveals nothing when only the order or identity of the rows changed', () => {
    const change = diffRows(rows('root', 'a', 'b'), rows('root', 'b', 'a'), parentOf);
    expect(change.revealed.size).toBe(0);
    expect(change.isGrowing).toBe(false);
  });
});

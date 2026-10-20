import { describe, expect, it } from 'vitest';
import { columnLayoutStyle } from './columnLayout';

const column = (meta?: { minWidth?: number; grow?: number }) => ({ columnDef: { meta } });

describe('columnLayoutStyle', () => {
  it('gives every row the same tracks, from each column’s min width and grow', () => {
    const style = columnLayoutStyle([column({ minWidth: 240, grow: 3 }), column({ minWidth: 100 }), column()], 56);

    expect(style).toEqual({
      // The tree column may shrink on small screens; the others keep their minimum.
      '--tree-table-columns': 'minmax(min(240px, 50vw), 3fr) minmax(100px, 1fr) minmax(84px, 1fr)',
      '--tree-table-min-width': 'calc(min(240px, 50vw) + 100px + 84px)',
      '--tree-table-row-height': '56px',
    });
  });
});

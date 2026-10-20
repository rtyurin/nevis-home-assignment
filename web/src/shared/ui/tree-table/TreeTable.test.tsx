import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createTreeTableColumnHelper, type TreeExpandedState } from './features';
import { TreeTable } from './TreeTable';

interface Item {
  id: string;
  name: string;
  value: number;
  children?: Item[];
}

const tree: Item[] = [
  {
    id: 'root',
    name: 'Root',
    value: 10,
    children: [
      {
        id: 'alpha',
        name: 'Alpha',
        value: 7,
        children: [
          { id: 'alpha-one', name: 'Alpha one', value: 4 },
          { id: 'alpha-two', name: 'Alpha two', value: 3 },
        ],
      },
      // Uneven nesting: a sibling with no children at all.
      { id: 'beta', name: 'Beta', value: 3 },
    ],
  },
];

const column = createTreeTableColumnHelper<Item>();
const columns = [
  column.accessor('name', { header: 'Name', meta: { minWidth: 200, grow: 2 } }),
  column.accessor('value', { header: 'Value', meta: { align: 'end' } }),
];

function Harness({ onActiveRowChange }: { onActiveRowChange?: (id: string) => void }) {
  const [expanded, setExpanded] = useState<TreeExpandedState>({ root: true });
  const [active, setActive] = useState<string | null>(null);
  return (
    <TreeTable
      aria-label="Tree"
      data={tree}
      columns={columns}
      getRowId={(item) => item.id}
      getSubRows={(item) => item.children}
      expanded={expanded}
      onExpandedChange={setExpanded}
      activeRowId={active}
      onActiveRowChange={(id) => {
        setActive(id);
        onActiveRowChange?.(id);
      }}
    />
  );
}

const row = (name: string) => screen.getByRole('rowheader', { name }).closest<HTMLElement>('[role="row"]')!;
const queryRow = (name: string) => screen.queryByRole('rowheader', { name });
const bodyRowNames = () =>
  within(screen.getByRole('treegrid'))
    .getAllByRole('rowheader')
    .map((cell) => cell.textContent);

describe('TreeTable', () => {
  it('exposes the hierarchy to assistive technology', () => {
    render(<Harness />);

    const grid = screen.getByRole('treegrid', { name: 'Tree' });
    expect(grid).toHaveAttribute('aria-rowcount', '4'); // header + 3 visible rows
    expect(
      within(grid)
        .getAllByRole('columnheader')
        .map((h) => h.textContent),
    ).toEqual(['Name', 'Value']);

    expect(row('Root')).toHaveAttribute('aria-level', '1');
    expect(row('Root')).toHaveAttribute('aria-rowindex', '2');
    expect(row('Root')).toHaveAttribute('aria-expanded', 'true');

    expect(row('Alpha')).toHaveAttribute('aria-level', '2');
    expect(row('Alpha')).toHaveAttribute('aria-posinset', '1');
    expect(row('Alpha')).toHaveAttribute('aria-setsize', '2');
    expect(row('Alpha')).toHaveAttribute('aria-expanded', 'false');

    // Leaves are not expandable, so they carry no aria-expanded at all.
    expect(row('Beta')).toHaveAttribute('aria-posinset', '2');
    expect(row('Beta')).not.toHaveAttribute('aria-expanded');
    expect(within(row('Beta')).getByRole('gridcell')).toHaveTextContent('3');
  });

  it('only renders the children of expanded rows', () => {
    render(<Harness />);
    expect(bodyRowNames()).toEqual(['Root', 'Alpha', 'Beta']);
  });

  it('expands and collapses on click', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(row('Alpha'));
    expect(row('Alpha')).toHaveAttribute('aria-expanded', 'true');
    expect(bodyRowNames()).toEqual(['Root', 'Alpha', 'Alpha one', 'Alpha two', 'Beta']);
    expect(row('Alpha one')).toHaveAttribute('aria-level', '3');
    expect(screen.getByRole('treegrid')).toHaveAttribute('aria-rowcount', '6');

    await user.click(row('Alpha'));
    expect(row('Alpha')).toHaveAttribute('aria-expanded', 'false');
    expect(queryRow('Alpha one')).toBeNull();
  });

  it('collapsing an ancestor hides every descendant, and re-expanding restores them', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(row('Alpha'));
    await user.click(row('Root'));
    expect(bodyRowNames()).toEqual(['Root']);

    await user.click(row('Root'));
    expect(bodyRowNames()).toEqual(['Root', 'Alpha', 'Alpha one', 'Alpha two', 'Beta']);
  });

  it('keeps exactly one row in the tab order', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const tabbable = () => screen.getAllByRole('row').filter((r) => r.tabIndex === 0);
    expect(tabbable()).toEqual([row('Root')]);

    await user.tab();
    expect(row('Root')).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(tabbable()).toEqual([row('Alpha')]);
  });

  describe('keyboard', () => {
    it('moves between rows with the arrow keys, Home and End', async () => {
      const user = userEvent.setup();
      render(<Harness />);

      await user.tab();
      await user.keyboard('{ArrowDown}');
      expect(row('Alpha')).toHaveFocus();
      await user.keyboard('{ArrowDown}');
      expect(row('Beta')).toHaveFocus();
      await user.keyboard('{ArrowDown}');
      expect(row('Beta')).toHaveFocus();
      await user.keyboard('{Home}');
      expect(row('Root')).toHaveFocus();
      await user.keyboard('{End}');
      expect(row('Beta')).toHaveFocus();
      await user.keyboard('{ArrowUp}');
      expect(row('Alpha')).toHaveFocus();
    });

    it('expands with ArrowRight, then moves into the first child', async () => {
      const user = userEvent.setup();
      render(<Harness />);

      await user.tab();
      await user.keyboard('{ArrowDown}{ArrowRight}');
      expect(row('Alpha')).toHaveAttribute('aria-expanded', 'true');
      expect(row('Alpha')).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(row('Alpha one')).toHaveFocus();

      // On a leaf, ArrowRight does nothing.
      await user.keyboard('{ArrowRight}');
      expect(row('Alpha one')).toHaveFocus();
    });

    it('moves to the parent with ArrowLeft, then collapses it', async () => {
      const user = userEvent.setup();
      render(<Harness />);

      await user.tab();
      await user.keyboard('{ArrowDown}{ArrowRight}{ArrowRight}');
      expect(row('Alpha one')).toHaveFocus();

      await user.keyboard('{ArrowLeft}');
      expect(row('Alpha')).toHaveFocus();
      expect(row('Alpha')).toHaveAttribute('aria-expanded', 'true');

      await user.keyboard('{ArrowLeft}');
      expect(row('Alpha')).toHaveAttribute('aria-expanded', 'false');
      expect(queryRow('Alpha one')).toBeNull();
    });

    it('toggles with Enter and Space', async () => {
      const user = userEvent.setup();
      render(<Harness />);

      await user.tab();
      await user.keyboard('{ArrowDown}{Enter}');
      expect(row('Alpha')).toHaveAttribute('aria-expanded', 'true');
      await user.keyboard(' ');
      expect(row('Alpha')).toHaveAttribute('aria-expanded', 'false');

      await user.keyboard('{Home}{Enter}');
      expect(bodyRowNames()).toEqual(['Root']);
    });
  });

  it('selection follows focus', async () => {
    const user = userEvent.setup();
    const onActiveRowChange = vi.fn();
    render(<Harness onActiveRowChange={onActiveRowChange} />);

    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(onActiveRowChange).toHaveBeenLastCalledWith('alpha');
    expect(row('Alpha')).toHaveAttribute('aria-selected', 'true');
    expect(row('Root')).toHaveAttribute('aria-selected', 'false');

    await user.click(row('Beta'));
    expect(onActiveRowChange).toHaveBeenLastCalledWith('beta');
  });

  it('virtualizes long lists but keeps the focused row mounted', async () => {
    const many: Item[] = [
      {
        id: 'root',
        name: 'Root',
        value: 0,
        children: Array.from({ length: 200 }, (_, i) => ({ id: `n${i}`, name: `Node ${i}`, value: i })),
      },
    ];
    // jsdom has no layout and doesn't scroll; emulate the browser so the virtualizer can bring the row into range.
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(202 * 56);
    vi.spyOn(window, 'scrollTo').mockImplementation(((options: ScrollToOptions) => {
      Object.defineProperty(window, 'scrollY', { value: options.top ?? 0, configurable: true });
      window.dispatchEvent(new Event('scroll'));
    }) as typeof window.scrollTo);
    const user = userEvent.setup();
    render(
      <TreeTable
        aria-label="Many"
        data={many}
        columns={columns}
        getRowId={(item) => item.id}
        getSubRows={(item) => item.children}
        expanded={{ root: true }}
        onExpandedChange={() => {}}
      />,
    );

    expect(screen.getByRole('treegrid')).toHaveAttribute('aria-rowcount', '202');
    const rendered = within(screen.getByRole('treegrid')).getAllByRole('rowheader').length;
    expect(rendered).toBeLessThan(40);

    await user.tab();
    await user.keyboard('{End}');
    expect(row('Node 199')).toHaveFocus();
    expect(row('Node 199')).toHaveAttribute('aria-rowindex', '202');
  });
});

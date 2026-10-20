import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
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

function Harness({ onActiveChange }: { onActiveChange?: (id: string) => void }) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set(['root']));
  const [active, setActive] = useState<string | null>(null);
  return (
    <TreeTable
      aria-label="Tree"
      items={tree}
      nameColumn={{ header: 'Name', cell: (item) => item.name }}
      columns={[{ id: 'value', header: 'Value', align: 'end', cell: (item) => item.value }]}
      expandedIds={expanded}
      onExpandedChange={(id, isExpanded) =>
        setExpanded((prev) => {
          const next = new Set(prev);
          if (isExpanded) next.add(id);
          else next.delete(id);
          return next;
        })
      }
      activeId={active}
      onActiveChange={(id) => {
        setActive(id);
        onActiveChange?.(id);
      }}
    />
  );
}

const row = (name: string) => screen.getByRole('rowheader', { name }).closest('tr')!;
const queryRow = (name: string) => screen.queryByRole('rowheader', { name })?.closest('tr') ?? null;
const bodyRowNames = () =>
  within(screen.getByRole('treegrid'))
    .getAllByRole('rowheader')
    .map((cell) => cell.textContent);

describe('TreeTable', () => {
  it('exposes the hierarchy to assistive technology', () => {
    render(<Harness />);

    expect(screen.getByRole('treegrid', { name: 'Tree' })).toBeInTheDocument();
    expect(row('Root')).toHaveAttribute('aria-level', '1');
    expect(row('Root')).toHaveAttribute('aria-expanded', 'true');

    expect(row('Alpha')).toHaveAttribute('aria-level', '2');
    expect(row('Alpha')).toHaveAttribute('aria-posinset', '1');
    expect(row('Alpha')).toHaveAttribute('aria-setsize', '2');
    expect(row('Alpha')).toHaveAttribute('aria-expanded', 'false');

    // Leaves are not expandable, so they carry no aria-expanded at all.
    expect(row('Beta')).toHaveAttribute('aria-posinset', '2');
    expect(row('Beta')).not.toHaveAttribute('aria-expanded');
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

    await user.click(row('Alpha'));
    expect(row('Alpha')).toHaveAttribute('aria-expanded', 'false');
    expect(queryRow('Alpha one')).toBeNull();
  });

  it('collapsing an ancestor hides every descendant', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(row('Alpha'));
    await user.click(row('Root'));
    expect(bodyRowNames()).toEqual(['Root']);

    // Re-expanding the root restores Alpha's own expanded state.
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

      // Root collapses from the keyboard too.
      await user.keyboard('{Home}{Enter}');
      expect(bodyRowNames()).toEqual(['Root']);
    });
  });

  it('selection follows focus', async () => {
    const user = userEvent.setup();
    const onActiveChange = vi.fn();
    render(<Harness onActiveChange={onActiveChange} />);

    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(onActiveChange).toHaveBeenLastCalledWith('alpha');
    expect(row('Alpha')).toHaveAttribute('aria-selected', 'true');
    expect(row('Root')).toHaveAttribute('aria-selected', 'false');

    await user.click(row('Beta'));
    expect(onActiveChange).toHaveBeenLastCalledWith('beta');
  });
});

import { Panel } from '@/shared/ui/panel';
import { TreeTableSkeleton } from '@/shared/ui/tree-table';
import { MONTH_COLUMN_META, NAME_COLUMN_META } from '../model/columns';

/** A name column and a year of months. */
const COLUMNS = [NAME_COLUMN_META, ...Array.from({ length: 12 }, () => MONTH_COLUMN_META)];
/** The company, expanded to its branches. */
const ROW_DEPTHS = [0, 1, 1, 1];

/** Decorative: the caller announces the loading state. */
export function ClientsTableSkeleton() {
  return (
    <Panel flush aria-hidden="true">
      <TreeTableSkeleton columns={COLUMNS} rows={ROW_DEPTHS} />
    </Panel>
  );
}

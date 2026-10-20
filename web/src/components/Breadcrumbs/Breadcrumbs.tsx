import styles from './Breadcrumbs.module.css';

export interface BreadcrumbItem {
  id: string;
  label: string;
}

export interface BreadcrumbsProps {
  /** Root first; the last item is the current location. */
  items: readonly BreadcrumbItem[];
  onSelect: (id: string) => void;
  'aria-label': string;
}

export function Breadcrumbs({ items, onSelect, 'aria-label': ariaLabel }: BreadcrumbsProps) {
  return (
    <nav aria-label={ariaLabel}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;
          return (
            <li key={item.id} className={styles.item}>
              {isCurrent ? (
                <span aria-current="location" className={styles.current}>
                  {item.label}
                </span>
              ) : (
                <button type="button" className={styles.link} onClick={() => onSelect(item.id)}>
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

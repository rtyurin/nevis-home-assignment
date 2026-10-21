import type { ComponentProps } from 'react';
import styles from './Breadcrumbs.module.css';

interface BreadcrumbsProps extends Omit<ComponentProps<'nav'>, 'onSelect'> {
  items: readonly { id: string; name: string }[];
  onSelect: (id: string) => void;
}

export function Breadcrumbs({ items, onSelect, ...props }: BreadcrumbsProps) {
  return (
    <nav {...props}>
      <ol className={styles.list}>
        {items.map((item, index) => (
          <li key={item.id} className={styles.item}>
            {index === items.length - 1 ? (
              <span aria-current="location" className={styles.current}>
                {item.name}
              </span>
            ) : (
              <button type="button" className={styles.link} onClick={() => onSelect(item.id)}>
                {item.name}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

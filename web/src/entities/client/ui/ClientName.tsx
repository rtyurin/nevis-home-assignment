import { Avatar } from '@/shared/ui/avatar';
import type { ClientNode } from '../model/types';
import styles from './ClientName.module.css';

export function ClientName({ node }: { node: ClientNode }) {
  return (
    <span className={styles.name}>
      {node.kind === 'employee' && <Avatar name={node.name} src={node.avatarUrl} />}
      <span className={styles.label}>{node.name}</span>
    </span>
  );
}

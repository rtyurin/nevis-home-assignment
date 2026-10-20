import { Avatar } from '../../../components/Avatar';
import type { ClientNode } from '../model';
import styles from './ClientName.module.css';

export function ClientName({ node }: { node: ClientNode }) {
  return (
    <span className={styles.name}>
      {node.kind === 'employee' && <Avatar name={node.name} />}
      <span className={styles.label}>{node.name}</span>
    </span>
  );
}

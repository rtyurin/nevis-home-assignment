import styles from './Avatar.module.css';

const TONES = 4;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase();
}

function toneFor(name: string): number {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % TONES;
}

export interface AvatarProps {
  name: string;
  src?: string;
  size?: number;
}

export function Avatar({ name, src, size = 24 }: AvatarProps) {
  return (
    <span
      className={styles.avatar}
      data-tone={toneFor(name)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      aria-hidden="true"
    >
      {src ? <img src={src} alt="" className={styles.image} /> : initials(name)}
    </span>
  );
}

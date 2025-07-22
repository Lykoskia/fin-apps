import React from 'react';
import styles from './LoadingSpinner.module.css';

export default function LoadingSpinner() {
  return (
    <div className={styles.overlay}>
      <div className={styles.loader}>
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i} style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>
    </div>
  );
}
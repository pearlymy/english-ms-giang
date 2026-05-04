import React from 'react';
import styles from './Table.module.css';

export const Table = ({ headers, data, variant = 'default', className = '' }) => {
  const tableClasses = [styles.table, variant === 'compact' ? styles.compact : ''].filter(Boolean).join(' ');
  return (
    <div className={`${styles.tableContainer} ${className}`}>
      <table className={tableClasses}>
        <thead>
          <tr className={styles.tr}>
            {headers.map((h, i) => (
              <th key={i} className={styles.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className={styles.tr}>
              {headers.map((h, j) => (
                <td key={j} className={styles.td}>
                  {row[h.toLowerCase()] || row[h] || ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

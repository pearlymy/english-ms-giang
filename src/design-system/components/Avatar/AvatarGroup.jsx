import React from 'react';
import { Avatar } from './Avatar';
import styles from './AvatarGroup.module.css';

export const AvatarGroup = ({ avatars = [], max = 4, size = 'md' }) => {
  const visibleAvatars = avatars.slice(0, max);
  const excess = avatars.length - max;

  return (
    <div className={styles.group}>
      {visibleAvatars.map((avatar, index) => (
        <div key={index} className={styles.item} style={{ zIndex: max - index }}>
          <Avatar {...avatar} size={size} />
        </div>
      ))}
      {excess > 0 && (
        <div className={styles.excess} style={{ zIndex: 0 }}>
          +{excess}
        </div>
      )}
    </div>
  );
};

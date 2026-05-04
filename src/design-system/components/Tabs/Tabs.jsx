import React from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';
import styles from './Tabs.module.css';

export const Tabs = ({ defaultValue, tabs, className = '' }) => {
  return (
    <RadixTabs.Root className={`${styles.root} ${className}`} defaultValue={defaultValue}>
      <RadixTabs.List className={styles.list} aria-label="Tabs">
        {tabs.map((tab) => (
          <RadixTabs.Trigger key={tab.value} className={styles.trigger} value={tab.value}>
            <div className={styles.triggerContent}>
              {tab.icon && <span className={styles.icon}>{tab.icon}</span>}
              {tab.label}
            </div>
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      
      {tabs.map((tab) => (
        <RadixTabs.Content key={tab.value} className={styles.content} value={tab.value}>
          {tab.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
};

import React from 'react';
import { Box } from '../../primitives/Box';
import { Text } from '../../primitives/Text';
import { Stack } from '../../primitives/Stack';
import styles from './ColorPalette.module.css';

const colorGroups = [
  {
    title: 'Brand Colors',
    colors: [
      { name: 'Primary', var: '--color-primary' },
      { name: 'Primary Hover', var: '--color-primary-hover' },
      { name: 'Primary Active', var: '--color-primary-active' },
      { name: 'Primary Subtle', var: '--color-primary-subtle' },
    ]
  },
  {
    title: 'Text Colors',
    colors: [
      { name: 'Text Primary', var: '--color-text-primary' },
      { name: 'Text Secondary', var: '--color-text-secondary' },
      { name: 'Text Tertiary', var: '--color-text-tertiary' },
    ]
  },
  {
    title: 'Semantic Colors',
    colors: [
      { name: 'Error', var: '--color-error' },
      { name: 'Success', var: '--color-success' },
      { name: 'Warning', var: '--color-warning' },
      { name: 'Info', var: '--color-info' },
    ]
  },
  {
    title: 'Surface & Border',
    colors: [
      { name: 'Background', var: '--color-background' },
      { name: 'Surface', var: '--color-surface' },
      { name: 'Surface Alt', var: '--color-surface-alt' },
      { name: 'Border', var: '--color-border' },
      { name: 'Border Strong', var: '--color-border-strong' },
    ]
  }
];

export const ColorPalette = () => {
  return (
    <Stack gap="2xl">
      {colorGroups.map((group) => (
        <Box key={group.title}>
          <Text size="xl" weight="bold" style={{ marginBottom: 'var(--spacing-md)' }}>
            {group.title}
          </Text>
          <div className={styles.container}>
            {group.colors.map((color) => (
              <div key={color.name} className={styles.swatchCard}>
                <div 
                  className={styles.swatchColor} 
                  style={{ backgroundColor: `var(${color.var})` }} 
                />
                <div className={styles.swatchInfo}>
                  <span className={styles.swatchName}>{color.name}</span>
                  <span className={styles.swatchVar}>{color.var}</span>
                </div>
              </div>
            ))}
          </div>
        </Box>
      ))}
    </Stack>
  );
};

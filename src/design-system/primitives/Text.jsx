import React from 'react';
import { Box } from './Box';

export const Text = ({ 
  as = 'span', 
  size = 'md', 
  weight = 'regular', 
  color = 'textPrimary',
  className = '', 
  style = {}, 
  children, 
  ...props 
}) => {
  // Convert camelCase color to kebab-case for CSS variables
  const cssColor = color.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
  
  const textStyle = {
    fontFamily: 'var(--font-family-base)',
    fontSize: `var(--font-size-${size})`,
    fontWeight: `var(--font-weight-${weight})`,
    color: `var(--color-${cssColor})`,
    letterSpacing: 'normal',
    lineHeight: 'inherit',
    ...style
  };

  return (
    <Box as={as} className={`Text ${className}`} style={textStyle} {...props}>
      {children}
    </Box>
  );
};

import React from 'react';
import { Box } from './Box';

export const Stack = ({ 
  direction = 'column', 
  gap = 'md', 
  align = 'stretch', 
  justify = 'flex-start',
  className = '', 
  style = {}, 
  children, 
  ...props 
}) => {
  const stackStyle = {
    display: 'flex',
    flexDirection: direction,
    gap: `var(--spacing-${gap})`,
    alignItems: align,
    justifyContent: justify,
    ...style
  };

  return (
    <Box className={`Stack ${className}`} style={stackStyle} {...props}>
      {children}
    </Box>
  );
};

import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronRight } from 'lucide-react';
import styles from './Dropdown.module.css';

const renderItem = (item, index) => {
  if (item.type === 'separator') {
    return <DropdownMenu.Separator key={index} className={styles.separator} />;
  }

  if (item.items && item.items.length > 0) {
    return (
      <DropdownMenu.Sub key={index}>
        <DropdownMenu.SubTrigger className={`${styles.item} ${styles.subTrigger}`}>
          {item.label}
          <div className={styles.rightSlot}>
            <ChevronRight size={16} />
          </div>
        </DropdownMenu.SubTrigger>
        <DropdownMenu.Portal>
          <DropdownMenu.SubContent className={styles.content} sideOffset={2} alignOffset={-5}>
            {item.items.map((subItem, subIndex) => renderItem(subItem, subIndex))}
          </DropdownMenu.SubContent>
        </DropdownMenu.Portal>
      </DropdownMenu.Sub>
    );
  }

  return (
    <DropdownMenu.Item 
      key={index} 
      className={styles.item}
      onClick={item.onClick}
    >
      {item.label}
    </DropdownMenu.Item>
  );
};

export const Dropdown = ({ trigger, items }) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {trigger}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className={styles.content} sideOffset={5}>
          {items.map((item, index) => renderItem(item, index))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

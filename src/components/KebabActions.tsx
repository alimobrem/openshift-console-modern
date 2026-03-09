/**
 * KebabActions - Dropdown kebab menu (three dots) for row-level actions in tables.
 *
 * Uses PatternFly Dropdown with a MenuToggle trigger rendered as a vertical ellipsis icon.
 * Supports regular items, danger-styled items, and dividers between groups.
 */

import React, { useState, useCallback } from 'react';
import {
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  Divider,
} from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons';

interface KebabAction {
  label: string;
  onClick: () => void;
  isDanger?: boolean;
  isDivider?: boolean;
}

interface KebabActionsProps {
  actions: KebabAction[];
}

const KebabActions: React.FC<KebabActionsProps> = ({ actions }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleSelect = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = (toggleRef: React.Ref<HTMLButtonElement>) => (
    <MenuToggle
      ref={toggleRef}
      variant="plain"
      onClick={handleToggle}
      isExpanded={isOpen}
      aria-label="Actions"
    >
      <EllipsisVIcon />
    </MenuToggle>
  );

  return (
    <Dropdown
      isOpen={isOpen}
      onSelect={handleSelect}
      onOpenChange={setIsOpen}
      toggle={toggle}
      popperProps={{ position: 'right' }}
    >
      <DropdownList>
        {actions.map((action, index) => {
          if (action.isDivider) {
            return <Divider key={`divider-${index}`} component="li" />;
          }

          return (
            <DropdownItem
              key={action.label}
              onClick={action.onClick}
              {...(action.isDanger ? { isDanger: true } : {})}
            >
              {action.label}
            </DropdownItem>
          );
        })}
      </DropdownList>
    </Dropdown>
  );
};

export default KebabActions;

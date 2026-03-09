/**
 * ScaleControl - Inline replica scaling control for table cells.
 *
 * Required CSS classes:
 *   .compass-scale-root      - root container (display: inline-flex, align-items: center, gap)
 *   .compass-scale-btn       - +/- button (width, height, border-radius, background, border, color, cursor)
 *   .compass-scale-btn--disabled - disabled state (opacity, cursor: not-allowed)
 *   .compass-scale-count     - replica count display (font-size, font-weight, min-width, text-align: center)
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@patternfly/react-core';
import { MinusIcon, PlusIcon } from '@patternfly/react-icons';
import { useUIStore } from '@/store/useUIStore';

interface ScaleControlProps {
  name: string;
  current: number;
  onScale?: (newCount: number) => void;
}

const ScaleControl: React.FC<ScaleControlProps> = ({ name, current, onScale }) => {
  const addToast = useUIStore((s) => s.addToast);
  const [count, setCount] = useState(current);

  const handleScale = useCallback(
    (newCount: number) => {
      setCount(newCount);
      onScale?.(newCount);
      addToast({
        type: 'info',
        title: `Scaled ${name} to ${newCount} replica${newCount === 1 ? '' : 's'}`,
      });
    },
    [name, onScale, addToast],
  );

  const handleDecrement = useCallback(() => {
    if (count > 0) {
      handleScale(count - 1);
    }
  }, [count, handleScale]);

  const handleIncrement = useCallback(() => {
    handleScale(count + 1);
  }, [count, handleScale]);

  return (
    <span
      className="compass-scale-root os-scale__root"
    >
      <Button
        className={`compass-scale-btn os-scale__btn${count <= 0 ? ' compass-scale-btn--disabled' : ''}`}
        variant="plain"
        isDisabled={count <= 0}
        onClick={handleDecrement}
        aria-label={`Decrease ${name} replicas`}
      >
        <MinusIcon />
      </Button>
      <span
        className="compass-scale-count os-scale__count"
      >
        {count}
      </span>
      <Button
        className="compass-scale-btn os-scale__btn"
        variant="plain"
        onClick={handleIncrement}
        aria-label={`Increase ${name} replicas`}
      >
        <PlusIcon />
      </Button>
    </span>
  );
};

export default ScaleControl;

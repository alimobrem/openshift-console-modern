/**
 * ConfirmDialog - Confirmation dialog built on Radix AlertDialog.
 *
 * Required CSS classes:
 *   .compass-confirm-overlay   - backdrop overlay (position: fixed, inset: 0, backdrop-filter: blur(6px), background: rgba(0,0,0,0.5))
 *   .compass-confirm-content   - dialog panel (background, border-radius, padding, box-shadow, max-width, animation)
 *   .compass-confirm-title     - dialog title (font-size, font-weight, color)
 *   .compass-confirm-desc      - description text (color, opacity, margin)
 *   .compass-confirm-actions   - button row container (display: flex, gap, justify-content: flex-end)
 *   .compass-confirm-btn       - base button style (padding, border-radius, font-weight, cursor)
 *   .compass-confirm-btn--cancel  - cancel button (background: transparent, border)
 *   .compass-confirm-btn--danger  - danger confirm button (background: red tones)
 *   .compass-confirm-btn--warning - warning confirm button (background: orange tones)
 *
 * Animation keyframes:
 *   @keyframes compass-confirm-scale-in {
 *     from { opacity: 0; transform: scale(0.95); }
 *     to   { opacity: 1; transform: scale(1); }
 *   }
 */

import React from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Delete',
  variant = 'danger',
}) => {
  const confirmBtnClass =
    variant === 'warning'
      ? 'compass-confirm-btn compass-confirm-btn--warning os-confirm__btn--warning'
      : 'compass-confirm-btn compass-confirm-btn--danger os-confirm__btn--danger';

  return (
    <AlertDialog.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          className="compass-confirm-overlay os-confirm__overlay"
        />
        <AlertDialog.Content
          className="compass-confirm-content os-confirm__content"
        >
          <AlertDialog.Title
            className="compass-confirm-title os-confirm__title"
          >
            {title}
          </AlertDialog.Title>

          <AlertDialog.Description
            className="compass-confirm-desc os-confirm__desc"
          >
            {description}
          </AlertDialog.Description>

          <div
            className="compass-confirm-actions os-confirm__actions"
          >
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                className="compass-confirm-btn compass-confirm-btn--cancel os-confirm__btn--cancel"
                onClick={onClose}
              >
                Cancel
              </button>
            </AlertDialog.Cancel>

            <AlertDialog.Action asChild>
              <button
                type="button"
                className={confirmBtnClass}
                onClick={onConfirm}
              >
                {confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};

export default ConfirmDialog;

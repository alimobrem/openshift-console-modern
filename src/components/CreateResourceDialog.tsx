/**
 * CreateResourceDialog - Resource creation dialog built on Radix Dialog.
 *
 * Required CSS classes:
 *   .compass-create-overlay    - backdrop overlay (position: fixed, inset: 0, backdrop-filter: blur(8px), background: rgba(0,0,0,0.5))
 *   .compass-create-content    - dialog panel (glass style: background with transparency, border, border-radius, box-shadow)
 *   .compass-create-title      - dialog title (font-size, font-weight, color)
 *   .compass-create-desc       - subtitle / description line
 *   .compass-create-form       - form element (display: flex, flex-direction: column, gap)
 *   .compass-create-field      - field wrapper (display: flex, flex-direction: column, gap)
 *   .compass-create-label      - label element (font-size, font-weight, color)
 *   .compass-create-input      - text input (background, border, border-radius, padding, color, outline styles)
 *   .compass-create-actions    - button row (display: flex, gap, justify-content: flex-end)
 *   .compass-create-btn        - base button style
 *   .compass-create-btn--cancel  - cancel / secondary button
 *   .compass-create-btn--submit  - submit / primary button
 *   .compass-create-close      - close icon button (position: absolute, top-right)
 *
 * Animation keyframes:
 *   @keyframes compass-create-slide-in {
 *     from { opacity: 0; transform: translate(-50%, -48%); }
 *     to   { opacity: 1; transform: translate(-50%, -50%); }
 *   }
 */

import React, { useState, useCallback, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

interface FieldConfig {
  name: string;
  label: string;
  placeholder: string;
  required?: boolean;
}

interface CreateResourceDialogProps {
  open: boolean;
  onClose: () => void;
  resourceKind: string;
  onSubmit: (data: Record<string, string>) => void;
  fields: FieldConfig[];
}

const CreateResourceDialog: React.FC<CreateResourceDialogProps> = ({
  open,
  onClose,
  resourceKind,
  onSubmit,
  fields,
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      const initial: Record<string, string> = {};
      for (const field of fields) {
        initial[field.name] = '';
      }
      setFormData(initial);
    }
  }, [open, fields]);

  const handleChange = useCallback((fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      onSubmit(formData);
    },
    [formData, onSubmit],
  );

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="compass-create-overlay os-create__overlay"
        />
        <Dialog.Content
          className="compass-create-content os-create__content"
        >
          <Dialog.Title
            className="compass-create-title os-create__title"
          >
            Create {resourceKind}
          </Dialog.Title>

          <Dialog.Description
            className="compass-create-desc os-create__desc"
          >
            Fill in the details below to create a new {resourceKind} resource.
          </Dialog.Description>

          <form
            className="compass-create-form os-create__form"
            onSubmit={handleSubmit}
          >
            {fields.map((field) => (
              <div
                key={field.name}
                className="compass-create-field os-create__field"
              >
                <label
                  className="compass-create-label os-create__label"
                  htmlFor={`compass-create-${field.name}`}
                >
                  {field.label}
                  {field.required && (
                    <span className="os-create__required">*</span>
                  )}
                </label>
                <input
                  className="compass-create-input os-create__input"
                  id={`compass-create-${field.name}`}
                  type="text"
                  name={field.name}
                  placeholder={field.placeholder}
                  required={field.required}
                  value={formData[field.name] ?? ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  autoComplete="off"
                />
              </div>
            ))}

            <div
              className="compass-create-actions os-create__actions"
            >
              <button
                type="button"
                className="compass-create-btn compass-create-btn--cancel os-create__btn--cancel"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="compass-create-btn compass-create-btn--submit os-create__btn--submit"
              >
                Create {resourceKind}
              </button>
            </div>
          </form>

          <Dialog.Close asChild>
            <button
              type="button"
              className="compass-create-close os-create__close"
              aria-label="Close"
              onClick={onClose}
            >
              &#x2715;
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default CreateResourceDialog;

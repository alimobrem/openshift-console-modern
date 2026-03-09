import { useUIStore } from '@/store/useUIStore';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InfoCircleIcon,
  TimesIcon,
} from '@patternfly/react-icons';

const icons = {
  success: CheckCircleIcon,
  error: ExclamationCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InfoCircleIcon,
};

export default function ToastProvider() {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <div className="compass-toast-container">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div key={toast.id} className={`compass-toast compass-toast--${toast.type}`}>
            <Icon className="compass-toast__icon" />
            <div className="compass-toast__content">
              <div className="compass-toast__title">{toast.title}</div>
              {toast.description && (
                <div className="compass-toast__description">{toast.description}</div>
              )}
            </div>
            <button
              className="compass-toast__close"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
            >
              <TimesIcon />
            </button>
          </div>
        );
      })}
    </div>
  );
}

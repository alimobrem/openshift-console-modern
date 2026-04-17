import { Navigate } from 'react-router-dom';

/**
 * WelcomeView now redirects to /pulse which serves as the unified landing page.
 * Kept for backward compatibility (bookmarks, browser history).
 */
export default function WelcomeView() {
  return <Navigate to="/pulse" replace />;
}

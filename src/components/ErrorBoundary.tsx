import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="os-error-boundary">
          <div className="os-error-boundary__icon">!</div>
          <h2 className="os-error-boundary__title">Something went wrong</h2>
          <p className="os-error-boundary__message">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            className="os-error-boundary__button" aria-label="Try again"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { telemetry } from '@/services/telemetry';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
}

interface ErrorBoundaryState {
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[MapleHub] Uncaught error:', error, errorInfo);
    telemetry.trackErrorBoundary('react-root', error.name || 'Error');
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    const { fallback } = this.props;
    if (typeof fallback === 'function') {
      return fallback(error, this.handleReset);
    }
    if (fallback) return fallback;

    // Default fallback UI
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          <i className="ri-error-warning-line text-2xl" />
        </div>
        <h2 className="font-heading text-lg font-semibold text-foreground-950">
          Something went wrong
        </h2>
        <p className="max-w-md text-sm text-foreground-600">
          {error.message || 'An unexpected error occurred. Please try refreshing the page.'}
        </p>
        <button
          type="button"
          onClick={this.handleReset}
          className="mt-2 h-10 rounded-full bg-primary-500 px-5 text-sm font-semibold text-background-50 hover:bg-primary-600 cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }
}

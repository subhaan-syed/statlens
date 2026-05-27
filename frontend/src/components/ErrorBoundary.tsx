import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function ErrorFallback({ error }: { error: Error | null }) {
  return (
    <div className="card error-fallback" role="alert">
      <div className="error-fallback__icon">⚠️</div>
      <div className="error-fallback__title">Something went wrong in this section</div>
      {error && (
        <div className="error-fallback__message">{error.message}</div>
      )}
      <button
        className="btn btn-secondary"
        onClick={() => window.location.reload()}
      >
        Try reloading
      </button>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

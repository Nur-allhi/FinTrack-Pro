import React, { Component } from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      const isOffline = this.state.error?.message?.includes('fetch') || this.state.error?.message?.includes('dynamically imported');
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-center p-8">
          <div className="w-16 h-16 rounded-full bg-muted/10 flex items-center justify-center">
            {isOffline ? <WifiOff className="w-8 h-8 text-muted" /> : <RefreshCw className="w-8 h-8 text-muted" />}
          </div>
          <p className="text-sm text-muted max-w-xs">
            {isOffline
              ? 'You appear to be offline. Some features may be unavailable.'
              : 'Something went wrong while loading this section.'}
          </p>
          <button onClick={this.handleRetry} className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-pill transition-colors">
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

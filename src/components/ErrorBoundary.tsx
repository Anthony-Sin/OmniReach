import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/50">
            <span className="text-red-500 text-2xl font-bold">!</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 uppercase tracking-tighter">System Failure</h1>
          <p className="text-white/60 max-w-md mb-8 font-mono text-sm">
            The Aegis interface has encountered a critical error. 
            {this.state.error?.message && (
              <span className="block mt-4 p-4 bg-white/5 rounded border border-white/10 text-red-400">
                {this.state.error.message}
              </span>
            )}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-cyan-500 text-black font-bold uppercase tracking-widest text-xs hover:bg-cyan-400 transition-colors"
          >
            Reboot Interface
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

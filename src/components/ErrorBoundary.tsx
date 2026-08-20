import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '../lib/logger';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    logger.error('React ErrorBoundary Caught Error', error, {
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-bold text-white">Algo deu errado na interface</h2>
            <p className="text-sm text-slate-400">
              Ocorreu um erro inesperado. Nosso sistema de monitoramento registrou este evento para análise.
            </p>

            {this.state.error && (
              <div className="p-3 bg-slate-950 rounded-lg text-left text-xs font-mono text-rose-300 overflow-x-auto max-h-32 border border-slate-800">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-500/20"
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar Aplicação
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

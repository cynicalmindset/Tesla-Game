import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Tesla Roadster Flight System Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    // Soft reload if recovery fails
    try {
      window.dispatchEvent(new Event('resize'));
    } catch {
      // Ignore
    }
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 bg-[#050608]/90 backdrop-blur-2xl flex items-center justify-center p-4 select-none font-inter text-white">
          <div className="apple-glass max-w-md w-full p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl border border-white/20">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-amber-400" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
              AUTOPILOT SAFETY HOLD
            </h2>

            <p className="text-sm text-gray-300 leading-relaxed mb-4">
              A temporary WebGL rendering or telemetry hiccup occurred. Thruster cold-gas valves have held altitude.
            </p>

            {this.state.error && (
              <div className="w-full bg-black/40 border border-white/10 rounded-xl p-3 mb-6 text-left">
                <span className="text-[10px] text-gray-400 font-mono block uppercase">Diagnostics</span>
                <span className="text-xs text-red-300 font-mono break-all line-clamp-2">
                  {this.state.error.message || 'Unknown runtime exception'}
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={this.handleReset}
                className="apple-pill flex-1 py-3 px-4 flex items-center justify-center gap-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 cursor-pointer active:scale-95 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Resume Flight</span>
              </button>

              <button
                onClick={this.handleReload}
                className="apple-pill flex-1 py-3 px-4 flex items-center justify-center gap-2 text-xs font-semibold text-black bg-white hover:bg-gray-100 cursor-pointer active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.4)]"
              >
                <span>Reboot System</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

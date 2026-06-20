import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
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
    console.error("Uncaught rendering error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] p-6 text-slate-100 font-sans">
          <div className="max-w-md w-full bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <span className="p-2 bg-red-500/10 rounded-xl border border-red-500/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </span>
              <h2 className="text-sm font-extrabold uppercase tracking-wider">Application Interface Crash</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              An unexpected client-side runtime exception has occurred. You can attempt to reload the session or contact the support administrator.
            </p>
            <div className="bg-[#1F2937] border border-slate-800 p-3.5 rounded-xl font-mono text-[10px] text-red-400 overflow-auto max-h-[150px] leading-normal font-semibold">
              {this.state.error?.toString() || "Unknown rendering exception"}
            </div>
            <button 
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/";
              }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow active:scale-95 cursor-pointer border border-blue-500/20"
            >
              Reset Session
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

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
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 bg-red-50 text-red-900 min-h-screen flex flex-col items-center justify-center">
                    <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-xl border border-red-100">
                        <h1 className="text-3xl font-bold mb-4 text-red-600 flex items-center gap-3">
                            ⚠️ Application Error
                        </h1>
                        <p className="text-gray-600 mb-6 font-medium">
                            The application encountered a critical runtime failure.
                        </p>
                        <div className="font-mono bg-gray-50 p-6 rounded-xl border border-gray-200 text-sm overflow-x-auto whitespace-pre-wrap mb-6">
                            {this.state.error?.toString()}
                        </div>
                        <button
                            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg"
                            onClick={() => window.location.assign('/')}
                        >
                            Back to Safety (Landing Page)
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

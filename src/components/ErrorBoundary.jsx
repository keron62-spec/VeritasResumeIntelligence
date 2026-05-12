import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '20px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '8px',
                    margin: '20px',
                    textAlign: 'center'
                }}>
                    <h3>Something went wrong</h3>
                    <p>An error occurred while displaying this section. Please try refreshing the page.</p>
                    <button onClick={() => window.location.reload()}>
                        Refresh Page
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
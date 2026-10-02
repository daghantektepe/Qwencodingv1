import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[OpenScriv ErrorBoundary] Yakalanan Hata:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.clear();
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            padding: '24px',
            backgroundColor: '#f5f2ea',
            color: '#3c382e',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textAlign: 'center',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              backgroundColor: '#ffffff',
              border: '1px solid #d9d4c8',
              borderRadius: '12px',
              padding: '32px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
            <h1 style={{ fontSize: '20px', margin: '0 0 12px 0', color: '#9c3a3a' }}>
              OpenScriv Başlatılırken Bir Sorun Oluştu
            </h1>
            <p style={{ fontSize: '14px', color: '#6b6455', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Arayüz yüklenirken beklenmedik bir hata meydana geldi. Verileriniz yerel diskte güvendedir.
            </p>

            {this.state.error && (
              <pre
                style={{
                  background: '#fbfaf7',
                  border: '1px solid #ece7dd',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: '12px',
                  textAlign: 'left',
                  overflow: 'auto',
                  maxHeight: '140px',
                  color: '#9c3a3a',
                  marginBottom: '20px',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {this.state.error.toString()}
              </pre>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#7a6c4f',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Yeniden Başlat
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  padding: '10px 18px',
                  backgroundColor: '#fffaf2',
                  color: '#6b6455',
                  border: '1px solid #d9d4c8',
                  borderRadius: '6px',
                  fontWeight: 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Önbelleği Sıfırla
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

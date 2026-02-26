import { GoogleLogin } from '@react-oauth/google';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/ui/Spinner';

const isDev = import.meta.env.VITE_APP_ENV === 'development';

export function Login() {
  const { user, isLoading, login, devLogin } = useAuth();

  if (isLoading) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F7FA' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #0D47A1 0%, #1565C0 50%, #1E88E5 100%)' }}>
      {/* Logo area */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '64px', paddingBottom: '32px', paddingLeft: '32px', paddingRight: '32px', flexShrink: 0 }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '18px',
          background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px'
        }}>
          <svg viewBox="0 0 48 48" fill="none" style={{ width: '36px', height: '36px' }}>
            <path d="M24 4C18 4 14 8 12 12C10 16 10 22 12 26C14 30 18 36 24 44C30 36 34 30 36 26C38 22 38 16 36 12C34 8 30 4 24 4Z" fill="rgba(255,255,255,.3)" />
            <circle cx="24" cy="20" r="6" fill="rgba(255,255,255,.6)" />
            <path d="M20 20h8M24 16v8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', margin: 0 }}>BabyBio</h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>Biomarker Screening</p>
      </div>

      {/* Form area */}
      <div style={{
        flex: 1, background: '#fff', borderRadius: '26px 26px 0 0',
        padding: '28px 24px 20px', display: 'flex', flexDirection: 'column',
        overflowY: 'auto'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A202C', margin: '0 0 2px' }}>Welcome back</h2>
        <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 24px' }}>Sign in to view your baby's health insights</p>

        {/* Google login */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <GoogleLogin
            onSuccess={(response) => {
              if (response.credential) {
                login(response.credential);
              }
            }}
            onError={() => {
              console.error('Google login failed');
            }}
          />
        </div>

        {isDev && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
              <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>or continue with</span>
              <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
            </div>

            <button
              onClick={devLogin}
              style={{
                width: '100%', height: '46px', borderRadius: '12px',
                fontWeight: 700, fontSize: '14px', letterSpacing: '0.3px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: 'pointer', color: '#fff',
                background: 'linear-gradient(135deg, #1565C0, #0D47A1)',
                boxShadow: '0 4px 14px rgba(21,101,192,.35)'
              }}
            >
              Dev Login
            </button>
          </>
        )}

        <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: '13px', color: '#64748B', paddingTop: '24px' }}>
          New to BabyBio? <strong style={{ color: '#1565C0', fontWeight: 700, cursor: 'pointer' }}>Create Account</strong>
        </div>
      </div>
    </div>
  );
}

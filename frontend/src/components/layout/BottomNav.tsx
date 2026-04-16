import { useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  {
    path: '/',
    label: 'Home',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#1565C0' : '#94A3B8'} strokeWidth="2" style={{ width: '22px', height: '22px' }}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>
    ),
  },
  {
    path: '/trends',
    label: 'Trends',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#1565C0' : '#94A3B8'} strokeWidth="2" style={{ width: '22px', height: '22px' }}>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    path: '/capture',
    label: '',
    isCenter: true,
    icon: (_active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '26px', height: '26px', color: '#fff' }}>
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
  },
  {
    path: '/chat',
    label: 'AI Chat',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#1565C0' : '#94A3B8'} strokeWidth="2" style={{ width: '22px', height: '22px' }}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    path: '/profile',
    label: 'Profile',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#1565C0' : '#94A3B8'} strokeWidth="2" style={{ width: '22px', height: '22px' }}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav style={{
      flexShrink: 0,
      height: '82px',
      background: '#fff', borderTop: '1px solid #E2E8F0',
      display: 'flex', alignItems: 'flex-start', paddingTop: '10px',
      justifyContent: 'space-around',
      position: 'relative', zIndex: 10, overflow: 'visible',
      WebkitTapHighlightColor: 'transparent'
    }}>
      {navItems.map((item) => {
        const isActive = item.path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(item.path);

        if (item.isCenter) {
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                cursor: 'pointer', background: 'transparent', border: 'none',
                padding: 0
              }}
            >
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #1565C0, #0D47A1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(21,101,192,.4)',
                border: '4px solid #fff', marginTop: '-20px'
              }}>
                {item.icon(false)}
              </div>
            </button>
          );
        }

        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '3px', padding: '0',
              cursor: 'pointer', background: 'transparent', border: 'none',
              color: isActive ? '#1565C0' : '#94A3B8'
            }}
          >
            {item.icon(isActive)}
            <span style={{ fontSize: '10px', fontWeight: 600, lineHeight: 1, color: 'inherit' }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

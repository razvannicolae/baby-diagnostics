import { useAuth } from '../../hooks/useAuth';

export function Header() {
  const { user } = useAuth();
  const initials = user?.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'U';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning,' : hour < 18 ? 'Good afternoon,' : 'Good evening,';

  return (
    <div style={{ padding: '12px 20px 14px', background: '#fff', borderBottom: '1px solid #E2E8F0' }}>
      <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 500, lineHeight: 1.2, margin: 0 }}>{greeting}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1A202C', lineHeight: 1.2, margin: 0 }}>{user?.display_name ?? 'User'}</h1>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #1565C0, #00897B)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '14px', fontWeight: 700, flexShrink: 0
        }}>
          {initials}
        </div>
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import Dashboard    from './Dashboard';
import Users        from './Users';
import Prompts      from './Prompts';
import Images       from './Images';
import Subscriptions from './Subscriptions';
import Usage        from './Usage';
import LLMKeys      from './LLMKeys';
import AdminUsers   from './AdminUsers';
import s from './Admin.module.css';

const NAV = [
  { key: 'dashboard',     label: 'Dashboard',       icon: '📊', component: Dashboard,     roles: ['admin','manager'] },
  { key: 'prompts',       label: 'Prompts',          icon: '🖼️',  component: Prompts,       roles: ['admin','manager'] },
  { key: 'images',        label: 'Images',           icon: '🎨', component: Images,        roles: ['admin','manager'] },
  { key: 'users',         label: 'Users',            icon: '👥', component: Users,         roles: ['admin','manager'] },
  { key: 'subscriptions', label: 'Subscriptions',    icon: '⭐', component: Subscriptions, roles: ['admin','manager'] },
  { key: 'usage',         label: 'Usage',            icon: '⚡', component: Usage,         roles: ['admin','manager'] },
  { key: 'llm-keys',      label: 'LLM Keys',         icon: '🔑', component: LLMKeys,       roles: ['admin','manager'] },
  // Admin-only section
  { key: 'admin-users',   label: 'Admin Users',      icon: '🛡', component: AdminUsers,    roles: ['admin'], dividerBefore: true },
];

export default function AdminShell({ activeTab }) {
  const { adminUser, logoutAdmin } = useAdminAuth();
  const navigate = useNavigate();

  // Determine active component
  const active = activeTab || 'dashboard';
  const navItem = NAV.find((n) => n.key === active) || NAV[0];
  const ActiveComponent = navItem.component;

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin', { replace: true });
  };

  const roleBadge = adminUser?.role === 'admin'
    ? { label: 'Admin',   bg: 'rgba(255,217,61,0.12)',  color: 'var(--pf-gold)'  }
    : { label: 'Manager', bg: 'rgba(138,116,249,0.12)', color: 'var(--pf-accent)' };

  // Filter nav by role
  const visibleNav = NAV.filter((n) => n.roles.includes(adminUser?.role || 'manager'));

  return (
    <div className={s.shell}>
      <Navbar />

      <div className={s.body}>
        {/* ── Sidebar ── */}
        <aside className={s.sidebar}>
          <div className={s.sidebarHead}>Admin Console</div>

          {visibleNav.map((item) => (
            <div key={item.key}>
              {item.dividerBefore && <div className={s.sidebarDivider} />}
              <button
                className={`${s.navItem} ${active === item.key ? s.navItemActive : ''}`}
                onClick={() => navigate(`/admin/${item.key}`)}
              >
                <span className={s.navIcon}>{item.icon}</span>
                {item.label}
              </button>
            </div>
          ))}

          <div className={s.sidebarDivider} />
          <button className={s.navItem} onClick={() => navigate('/')}>
            <span className={s.navIcon}>←</span>Back to App
          </button>

          {/* Logged-in user info */}
          <div className={s.sidebarUser}>
            <div className={s.sidebarUserAvatar}>
              {adminUser?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className={s.sidebarUserInfo}>
              <div className={s.sidebarUserName}>{adminUser?.name || 'Unknown'}</div>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 6px',
                borderRadius: 4, background: roleBadge.bg, color: roleBadge.color,
                letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>
                {roleBadge.label}
              </span>
            </div>
            <button className={s.logoutBtn} onClick={handleLogout} title="Sign out">⏏</button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className={s.main}>
          <ActiveComponent />
        </main>
      </div>
    </div>
  );
}

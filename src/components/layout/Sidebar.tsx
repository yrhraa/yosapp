import { NavLink } from 'react-router-dom';
import { Grid3x3, Music2, Hash, CheckSquare, Settings } from 'lucide-react';

const NAV = [
  { to: '/',          icon: <Grid3x3 size={16}/>,    label: 'Formation' },
  { to: '/count',     icon: <Hash size={16}/>,        label: 'Count' },
  { to: '/music',     icon: <Music2 size={16}/>,      label: 'Music' },
  { to: '/checklist', icon: <CheckSquare size={16}/>, label: 'Checklist' },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-14 lg:w-48 h-full shrink-0 border-r"
      style={{ background: '#0F0F12', borderColor: 'var(--border)' }}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 py-4 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-7 h-7 flex items-center justify-center shrink-0"
          style={{ background: 'var(--accent)', borderRadius: '4px' }}>
          <span className="text-white font-semibold text-sm leading-none tracking-tight">Y</span>
        </div>
        <div className="hidden lg:block">
          <p className="text-sm font-semibold leading-none" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Yosapp
          </p>
          <p className="text-2xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Practice App
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5 p-2">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium transition-colors rounded-sm ${
                isActive ? 'active-nav' : 'inactive-nav'
              }`
            }
            style={({ isActive }) => isActive
              ? { background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-brd)', borderRadius: '4px' }
              : { color: 'var(--text-secondary)', borderRadius: '4px', border: '1px solid transparent' }
            }
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="hidden lg:block">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Settings */}
      <div className="p-2 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <NavLink
          to="/settings"
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 10px', borderRadius: '4px',
            color: isActive ? 'var(--accent)' : 'var(--text-muted)',
            fontSize: '12px', textDecoration: 'none',
            transition: 'color .15s',
          })}
        >
          <Settings size={15}/>
          <span className="hidden lg:block">Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}

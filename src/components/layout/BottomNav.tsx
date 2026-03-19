import { NavLink } from 'react-router-dom';
import { Grid3x3, Music2, Hash, CheckSquare } from 'lucide-react';

const NAV = [
  { to: '/',          icon: <Grid3x3 size={18}/>,    label: 'Formation' },
  { to: '/count',     icon: <Hash size={18}/>,        label: 'Count' },
  { to: '/music',     icon: <Music2 size={18}/>,      label: 'Music' },
  { to: '/checklist', icon: <CheckSquare size={18}/>, label: 'Check' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-pb"
      style={{ background: '#0F0F12', borderTop: '1px solid var(--border)' }}>
      <div className="flex">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors"
            style={({ isActive }) => ({
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: '10px',
              fontWeight: 500,
            })}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

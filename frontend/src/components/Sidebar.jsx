import { Calendar, CheckSquare, LayoutDashboard, StickyNote, Target, User, Wallet } from 'lucide-react';

export const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'tasks', label: 'Tasks', icon: CheckSquare },
  { key: 'goals', label: 'Goals', icon: Target },
  { key: 'notes', label: 'Notes', icon: StickyNote },
  { key: 'finance', label: 'Finance', icon: Wallet },
  { key: 'events', label: 'Events', icon: Calendar },
  { key: 'profile', label: 'Profile', icon: User },
];

function Sidebar({ activeSection, onSelect }) {
  return (
    <nav className="sidebar" aria-label="Dashboard sections">
      {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          className={activeSection === key ? 'active' : ''}
          type="button"
          onClick={() => onSelect(key)}
        >
          <Icon size={17} />
          {label}
        </button>
      ))}
    </nav>
  );
}

export default Sidebar;

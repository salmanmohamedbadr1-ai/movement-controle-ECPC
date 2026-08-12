import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/enums';
import { NotificationsBell } from './NotificationsBell';
import { cn } from '../../utils/cn';
import logo from '../../assets/ECPC_Logo.jpg';

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100',
  );

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <NavLink to="/" className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900">
          <img src={logo} alt="ECPC" className="h-8 w-8 rounded-md object-contain" />
          <span>
            Movement <span className="text-indigo-600">Controller</span>
          </span>
        </NavLink>

        <nav className="flex items-center gap-1">
          {user?.role === UserRole.LEADER && (
            <>
              <NavLink to="/leader" end className={linkClasses}>
                Overview
              </NavLink>
              <NavLink to="/leader/users" className={linkClasses}>
                Users
              </NavLink>
              <NavLink to="/leader/requests" className={linkClasses}>
                Requests
              </NavLink>
            </>
          )}
          {user?.role === UserRole.VOLUNTEER && (
            <NavLink to="/volunteer" className={linkClasses}>
              My Requests
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <NotificationsBell />
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-800">{user.code}</p>
                <p className="text-xs text-slate-400">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                Log out
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Volunteer / Leader Login
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}

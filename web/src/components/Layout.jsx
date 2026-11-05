import { useState } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const MAIN_NAV_LIMIT = 6;

export default function Layout() {
  const { logout, user, nivel, allowedTabs } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const canAccess = (tab) => allowedTabs.includes(tab);
  const canManageUsers = nivel === 'SUPERADMIN' || nivel === 'ADMIN';
  const canManageCongregations = nivel === 'SUPERADMIN';

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { key: 'members', label: 'Miembros', path: '/members' },
    { key: 'family', label: 'Familia', path: '/family' },
    { key: 'spiritual', label: 'Espiritual', path: '/spiritual' },
    { key: 'pastoral', label: 'Pastoral', path: '/pastoral' },
    { key: 'institutions', label: 'Instituciones', path: '/institutions' },
    { key: 'congregations', label: 'Congregaciones', path: '/congregations', condition: canManageCongregations },
    { key: 'finances', label: 'Finanzas', path: '/finances' },
    { key: 'offerings', label: 'Ofrendas', path: '/offerings' },
    { key: 'events', label: 'Eventos', path: '/events' },
    { key: 'inventory', label: 'Inventario', path: '/inventory' },
    { key: 'documents', label: 'Documentos', path: '/documents' },
    { key: 'communications', label: 'Comunicaciones', path: '/communications' },
    { key: 'users', label: 'Usuarios', path: '/users', condition: canManageUsers },
    { key: 'audit', label: 'Auditoría', path: '/audit', condition: canManageCongregations },
  ];

  const visibleNavItems = navItems.filter(item => canAccess(item.key) && (item.condition !== false));
  const mainItems = visibleNavItems.slice(0, MAIN_NAV_LIMIT);
  const moreItems = visibleNavItems.slice(MAIN_NAV_LIMIT);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            {/* Logo & Desktop Menu */}
            <div className="flex items-center">
              <Link to="/dashboard" className="font-bold text-xl">
                Iglesia
              </Link>
              {/* Desktop Menu - hidden on mobile */}
              <div className="hidden md:ml-6 md:flex md:items-center md:space-x-1">
                {mainItems.map((item) => (
                  <Link
                    key={item.key}
                    to={item.path}
                    className="hover:bg-indigo-700 px-2 py-2 rounded text-sm whitespace-nowrap"
                  >
                    {item.label}
                  </Link>
                ))}
                {moreItems.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setIsMoreOpen(!isMoreOpen)}
                      className="hover:bg-indigo-700 px-2 py-2 rounded text-sm whitespace-nowrap flex items-center gap-1"
                    >
                      Más <span className="text-xs">{isMoreOpen ? '▲' : '▼'}</span>
                    </button>
                    {isMoreOpen && (
                      <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded shadow-lg z-50 py-1">
                        {moreItems.map((item) => (
                          <Link
                            key={item.key}
                            to={item.path}
                            onClick={() => setIsMoreOpen(false)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* User Info & Logout - Desktop */}
            <div className="hidden md:flex items-center">
              <span className="mr-2 lg:mr-4 text-sm">
                {user?.username}
                <span className="ml-2 text-xs bg-indigo-800 px-2 py-0.5 rounded">
                  {nivel}
                </span>
                {user?.congregacion?.nombre && (
                  <span className="ml-2 text-xs bg-gray-600 px-2 py-0.5 rounded hidden lg:inline">
                    {user.congregacion.nombre}
                  </span>
                )}
              </span>
              <button
                onClick={handleLogout}
                className="bg-indigo-700 hover:bg-indigo-800 px-3 py-2 rounded text-sm"
              >
                Cerrar
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded hover:bg-indigo-700 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-indigo-500">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.key}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded hover:bg-indigo-700 text-base"
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-indigo-500 pt-3 mt-2">
                <div className="px-3 py-2 text-sm text-indigo-200">
                  <div>{user?.username}</div>
                  <div className="text-xs">
                    {nivel}
                    {user?.congregacion?.nombre && ` - ${user.congregacion.nombre}`}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="block w-full text-left px-3 py-2 rounded hover:bg-indigo-700 text-base"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        <Outlet />
      </main>
    </div>
  );
}
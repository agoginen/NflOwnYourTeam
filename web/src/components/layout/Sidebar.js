import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  HomeIcon,
  TrophyIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { selectSidebarOpen, selectMobileMenuOpen, setMobileMenuOpen } from '../../store/slices/uiSlice';
import { selectUser } from '../../store/slices/authSlice';

const Sidebar = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const sidebarOpen = useSelector(selectSidebarOpen);
  const mobileMenuOpen = useSelector(selectMobileMenuOpen);
  const user = useSelector(selectUser);

  const navigation = [
    { name: 'Dashboard', href: '/app/dashboard', icon: HomeIcon },
    { name: 'My Leagues', href: '/app/leagues', icon: UserGroupIcon },
    { name: 'NFL Teams', href: '/teams', icon: TrophyIcon },
    { name: 'Standings', href: '/app/standings', icon: ChartBarIcon },
    { name: 'Profile', href: '/app/profile', icon: Cog6ToothIcon },
  ];

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const closeMobileMenu = () => {
    dispatch(setMobileMenuOpen(false));
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={closeMobileMenu} />
          
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={closeMobileMenu}
              >
                <span className="sr-only">Close sidebar</span>
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            
            <div className="h-0 flex-1 overflow-y-auto pt-5 pb-4">
              <nav className="mt-5 space-y-1 px-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={closeMobileMenu}
                    className={isActive(item.href) ? 'nav-link-active' : 'nav-link-inactive'}
                  >
                    <item.icon className="mr-3 h-6 w-6 flex-shrink-0" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${
        sidebarOpen ? 'lg:w-64' : 'lg:w-16'
      }`}>
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white pt-16">
          <div className="flex flex-1 flex-col overflow-y-auto">
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${isActive(item.href) ? 'nav-link-active' : 'nav-link-inactive'} group`}
                  title={!sidebarOpen ? item.name : undefined}
                >
                  <item.icon className={`flex-shrink-0 h-6 w-6 ${sidebarOpen ? 'mr-3' : 'mx-auto'}`} />
                  {sidebarOpen && item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          {sidebarOpen && user && (
            <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
              <div className="group block w-full flex-shrink-0">
                <div className="flex items-center">
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">{user.fullName}</p>
                    <p className="text-xs font-medium text-gray-500">@{user.username}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;

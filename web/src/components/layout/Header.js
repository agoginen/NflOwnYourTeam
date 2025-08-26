import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Bars3Icon, 
  XMarkIcon,
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { logout, selectIsAuthenticated, selectUser } from '../../store/slices/authSlice';
import { 
  toggleSidebar, 
  toggleMobileMenu,
  selectMobileMenuOpen,
  selectNotifications,
  selectUnreadNotifications
} from '../../store/slices/uiSlice';
import Button from '../common/Button';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const mobileMenuOpen = useSelector(selectMobileMenuOpen);
  const notifications = useSelector(selectNotifications);
  const unreadNotifications = useSelector(selectUnreadNotifications);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/');
  };

  const handleSidebarToggle = () => {
    dispatch(toggleSidebar());
  };

  const handleMobileMenuToggle = () => {
    dispatch(toggleMobileMenu());
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left side */}
          <div className="flex items-center">
            {/* Sidebar toggle (authenticated users) */}
            {isAuthenticated && (
              <button
                type="button"
                className="mr-4 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 lg:hidden"
                onClick={handleMobileMenuToggle}
              >
                <span className="sr-only">Open sidebar</span>
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            )}

            {/* Desktop sidebar toggle */}
            {isAuthenticated && (
              <button
                type="button"
                className="mr-4 hidden rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 lg:block"
                onClick={handleSidebarToggle}
              >
                <span className="sr-only">Toggle sidebar</span>
                <Bars3Icon className="h-5 w-5" />
              </button>
            )}

            {/* Logo */}
            <Link to={isAuthenticated ? "/app/dashboard" : "/"} className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
                <span className="text-sm font-bold text-white">NFL</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900 hidden sm:block">
                Own Your Team
              </span>
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <Menu as="div" className="relative">
                  <Menu.Button className="relative rounded-full p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                    <span className="sr-only">View notifications</span>
                    <BellIcon className="h-6 w-6" />
                    {unreadNotifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                        {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
                      </span>
                    )}
                  </Menu.Button>

                  <Transition
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.slice(0, 5).map((notification) => (
                            <Menu.Item key={notification.id}>
                              <div className={`block px-4 py-3 text-sm ${
                                !notification.read ? 'bg-blue-50' : 'hover:bg-gray-50'
                              }`}>
                                <p className="font-medium text-gray-900">{notification.title}</p>
                                <p className="text-gray-500">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(notification.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            </Menu.Item>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500">
                            No notifications
                          </div>
                        )}
                      </div>
                      
                      {notifications.length > 5 && (
                        <div className="border-t border-gray-200 px-4 py-2">
                          <Link
                            to="/app/notifications"
                            className="text-sm text-primary-600 hover:text-primary-700"
                          >
                            View all notifications
                          </Link>
                        </div>
                      )}
                    </Menu.Items>
                  </Transition>
                </Menu>

                {/* User menu */}
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                    <span className="sr-only">Open user menu</span>
                    {user?.avatar ? (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={user.avatar}
                        alt={user.username}
                      />
                    ) : (
                      <UserCircleIcon className="h-8 w-8 text-gray-400" />
                    )}
                    <span className="ml-2 hidden text-sm font-medium text-gray-700 lg:block">
                      {user?.firstName || user?.username}
                    </span>
                  </Menu.Button>

                  <Transition
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/app/profile"
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } flex px-4 py-2 text-sm text-gray-700`}
                          >
                            <UserCircleIcon className="mr-3 h-5 w-5" />
                            Your Profile
                          </Link>
                        )}
                      </Menu.Item>
                      
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/app/settings"
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } flex px-4 py-2 text-sm text-gray-700`}
                          >
                            <Cog6ToothIcon className="mr-3 h-5 w-5" />
                            Settings
                          </Link>
                        )}
                      </Menu.Item>

                      {user?.isSuperUser && (
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/admin"
                              className={`${
                                active ? 'bg-gray-100' : ''
                              } flex px-4 py-2 text-sm text-gray-700`}
                            >
                              <Cog6ToothIcon className="mr-3 h-5 w-5" />
                              Admin Panel
                            </Link>
                          )}
                        </Menu.Item>
                      )}
                      
                      <hr className="my-1" />
                      
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } flex w-full px-4 py-2 text-sm text-gray-700`}
                          >
                            <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
                            Sign out
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </>
            ) : (
              /* Not authenticated */
              <div className="flex items-center space-x-4">
                <Link
                  to="/auth/login"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Sign in
                </Link>
                <Button
                  as={Link}
                  to="/auth/register"
                  size="sm"
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

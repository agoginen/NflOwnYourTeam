import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from './Header';
import Sidebar from './Sidebar';
import { selectSidebarOpen } from '../../store/slices/uiSlice';
import { selectIsAuthenticated } from '../../store/slices/authSlice';

const Layout = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const sidebarOpen = useSelector(selectSidebarOpen);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        {/* Sidebar - only show when authenticated */}
        {isAuthenticated && (
          <>
            {/* Desktop sidebar */}
            <div className={`hidden lg:flex lg:flex-shrink-0 transition-all duration-300 ${
              sidebarOpen ? 'lg:w-64' : 'lg:w-16'
            }`}>
              <Sidebar />
            </div>
            
            {/* Mobile sidebar overlay */}
            <div className="lg:hidden">
              <Sidebar />
            </div>
          </>
        )}
        
        {/* Main content */}
        <div className="flex flex-1 flex-col">
          <main className="flex-1">
            <div className="h-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;

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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 relative overflow-hidden">
      {/* Animated background elements - subtle for main layout */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow" style={{animationDelay: '4s'}}></div>
      </div>

      {/* NFL field pattern overlay */}
      <div className="absolute inset-0 opacity-3">
        <div className="w-full h-full" style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 35px,
            rgba(255,255,255,0.05) 35px,
            rgba(255,255,255,0.05) 40px
          )`
        }}></div>
      </div>
      
      <div className="relative z-10">
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
    </div>
  );
};

export default Layout;

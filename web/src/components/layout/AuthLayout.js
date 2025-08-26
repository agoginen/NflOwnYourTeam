import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-400 rounded-full mix-blend-multiply filter blur-xl animate-bounce-gentle"></div>
        <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-red-400 rounded-full mix-blend-multiply filter blur-xl animate-bounce-gentle" style={{animationDelay: '1s'}}></div>
      </div>
      
      {/* NFL field pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full" style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 35px,
            rgba(255,255,255,0.1) 35px,
            rgba(255,255,255,0.1) 40px
          )`
        }}></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="relative group">
            {/* Glowing effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            
            {/* Main logo container */}
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-2xl transform transition-all duration-300 group-hover:scale-110">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-fade-in">
                🏈
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 animate-slide-up">
            <span className="bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 bg-clip-text text-transparent">
              NFL
            </span>
            <span className="ml-2 text-white">Own Your Team</span>
          </h1>
          <p className="text-blue-200 text-lg font-medium animate-fade-in" style={{animationDelay: '0.2s'}}>
            Fantasy Football Revolution
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="backdrop-blur-md bg-white/10 py-8 px-6 shadow-2xl rounded-3xl border border-white/20 animate-slide-up" style={{animationDelay: '0.4s'}}>
          <Outlet />
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-8 text-center relative z-10 animate-fade-in" style={{animationDelay: '0.6s'}}>
        <p className="text-blue-200 text-sm">
          🏆 Where Fantasy Meets Reality 🏆
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;

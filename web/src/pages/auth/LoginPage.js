import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { login, selectIsAuthenticated, selectAuthLoading } from '../../store/slices/authSlice';


const LoginPage = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);
  const [showPassword, setShowPassword] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  // Check backend status on component mount
  React.useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      } catch (error) {
        setBackendStatus('offline');
      }
    };
    
    checkBackendStatus();
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const onSubmit = (data) => {
    dispatch(login(data));
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <div className="flex justify-center items-center mb-3">
          <div className="flex space-x-2">
            <span className="text-2xl animate-bounce-gentle" style={{animationDelay: '0.1s'}}>🏈</span>
            <span className="text-2xl animate-bounce-gentle" style={{animationDelay: '0.2s'}}>🏆</span>
            <span className="text-2xl animate-bounce-gentle" style={{animationDelay: '0.3s'}}>💰</span>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          <span className="bg-gradient-to-r from-green-400 to-yellow-400 bg-clip-text text-transparent">
            Draft Day Champion! 
          </span>
          <span className="ml-2">🏈</span>
        </h2>
        <div className="space-y-1">
          <p className="text-blue-200 text-sm">
            Your fantasy empire awaits. Ready to{' '}
            <span className="text-yellow-400 font-bold">own entire NFL teams</span>?
          </p>
          <p className="text-blue-300 text-xs">
            New to the league?{' '}
            <Link 
              to="/auth/register" 
              className="font-semibold text-yellow-400 hover:text-yellow-300 transition-colors duration-200 underline decoration-2 underline-offset-2"
            >
              Join the Championship Hunt
            </Link>
          </p>
        </div>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="relative group">
          <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
            ✉️ Email Address
          </label>
          <div className="relative">
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Please enter a valid email address'
                }
              })}
              type="email"
              autoComplete="email"
              className={`w-full px-4 py-3 rounded-xl border-2 bg-white/20 backdrop-blur-sm text-white placeholder-blue-200 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/50 focus:border-blue-400 group-hover:bg-white/25 ${
                errors.email ? 'border-red-400 focus:ring-red-500/50' : 'border-white/30'
              }`}
              placeholder="Enter your email"
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>
          {errors.email && (
            <p className="mt-2 text-sm text-red-300 animate-slide-up">⚠️ {errors.email.message}</p>
          )}
        </div>

        <div className="relative group">
          <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">
            🔒 Password
          </label>
          <div className="relative">
            <input
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className={`w-full px-4 py-3 pr-12 rounded-xl border-2 bg-white/20 backdrop-blur-sm text-white placeholder-blue-200 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/50 focus:border-blue-400 group-hover:bg-white/25 ${
                errors.password ? 'border-red-400 focus:ring-red-500/50' : 'border-white/30'
              }`}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white focus:outline-none focus:text-white transition-colors duration-200"
            >
              {showPassword ? (
                <span className="text-xl">🙈</span>
              ) : (
                <span className="text-xl">👁️</span>
              )}
            </button>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>
          {errors.password && (
            <p className="mt-2 text-sm text-red-300 animate-slide-up">⚠️ {errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-2 border-white/30 bg-white/20 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
            <label htmlFor="remember-me" className="ml-2 text-blue-200 hover:text-white transition-colors">
              Remember me
            </label>
          </div>

          <Link 
            to="/auth/forgot-password" 
            className="text-yellow-400 hover:text-yellow-300 transition-colors duration-200 font-medium underline decoration-2 underline-offset-2"
          >
            Forgot password?
          </Link>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full py-3 px-4 text-white font-bold text-lg rounded-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            style={{
              background: loading 
                ? 'linear-gradient(45deg, #6b7280, #9ca3af)' 
                : 'linear-gradient(45deg, #3b82f6, #8b5cf6, #06b6d4)'
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Signing in...
              </div>
            ) : (
              <span className="flex items-center justify-center space-x-2">
                <span>🏆</span>
                <span>Enter Your Dynasty</span>
                <span>🏈</span>
              </span>
            )}
            {!loading && (
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/30 to-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            )}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/30" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="backdrop-blur-sm bg-white/10 px-4 py-1 rounded-full text-blue-200 border border-white/20">
              🏈 Practice Squad Access 🏈
            </span>
          </div>
        </div>
        
        <div className="mt-4 space-y-3">
          <div className="backdrop-blur-sm bg-white/10 rounded-xl p-4 border border-white/20">
            <p className="text-xs text-blue-200 mb-2 font-semibold">🏟️ Locker Room Access (Click to auto-fill):</p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer" onClick={() => {
                const emailInput = document.querySelector('input[name="email"]');
                const passwordInput = document.querySelector('input[name="password"]');
                if (emailInput && passwordInput) {
                  emailInput.value = 'admin@nflownyourteam.com';
                  passwordInput.value = 'Admin123!';
                  emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                  passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
              }}>
                <span className="text-yellow-400 font-medium">👑 League Commissioner</span>
                <span className="text-blue-200 font-mono text-xs">admin@nflownyourteam.com</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer" onClick={() => {
                const emailInput = document.querySelector('input[name="email"]');
                const passwordInput = document.querySelector('input[name="password"]');
                if (emailInput && passwordInput) {
                  emailInput.value = 'john@example.com';
                  passwordInput.value = 'Password123!';
                  emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                  passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
              }}>
                <span className="text-green-400 font-medium">🏈 Team Owner</span>
                <span className="text-blue-200 font-mono text-xs">john@example.com</span>
              </div>
              <div className="text-center mt-3 p-3 rounded-lg bg-gradient-to-r from-green-500/20 to-yellow-500/20 border border-green-400/30">
                <p className="text-blue-300 text-xs mb-1">
                  🔑 Universal Access Code:
                </p>
                <p className="font-mono text-yellow-300 font-bold text-sm">Password123!</p>
                <p className="text-blue-300 text-xs mt-1 opacity-75">
                  (Click 👁️ to show password when typing)
                </p>
              </div>
              
              {/* Backend Status Indicator */}
              <div className="text-center mt-3 p-2 rounded-lg bg-white/10 border border-white/20">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xs text-blue-200">API Status:</span>
                  {backendStatus === 'checking' && (
                    <span className="text-xs text-yellow-300">🔍 Checking...</span>
                  )}
                  {backendStatus === 'online' && (
                    <span className="text-xs text-green-300">🟢 Online</span>
                  )}
                  {backendStatus === 'offline' && (
                    <span className="text-xs text-red-300">🔴 Offline - Start backend with: npm run dev</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

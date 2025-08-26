import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { login, selectIsAuthenticated, selectAuthLoading } from '../../store/slices/authSlice';
import Button from '../../components/common/Button';

const LoginPage = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const onSubmit = (data) => {
    dispatch(login(data));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          Welcome Back! 🚀
        </h2>
        <p className="text-blue-200 text-sm">
          Ready to dominate the fantasy league?{' '}
          <Link 
            to="/auth/register" 
            className="font-semibold text-yellow-400 hover:text-yellow-300 transition-colors duration-200 underline decoration-2 underline-offset-2"
          >
            Join the action
          </Link>
        </p>
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
              type="password"
              autoComplete="current-password"
              className={`w-full px-4 py-3 rounded-xl border-2 bg-white/20 backdrop-blur-sm text-white placeholder-blue-200 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/50 focus:border-blue-400 group-hover:bg-white/25 ${
                errors.password ? 'border-red-400 focus:ring-red-500/50' : 'border-white/30'
              }`}
              placeholder="Enter your password"
            />
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
              <span className="flex items-center justify-center">
                🏈 Sign In & Dominate 🏈
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
              🎮 Demo Accounts
            </span>
          </div>
        </div>
        
        <div className="mt-4 space-y-3">
          <div className="backdrop-blur-sm bg-white/10 rounded-xl p-4 border border-white/20">
            <p className="text-xs text-blue-200 mb-2 font-semibold">Quick Login Options:</p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <span className="text-yellow-400 font-medium">👑 Admin</span>
                <span className="text-blue-200 font-mono">admin@nflownyourteam.com</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <span className="text-green-400 font-medium">🏈 User</span>
                <span className="text-blue-200 font-mono">john@example.com</span>
              </div>
              <p className="text-center text-blue-300 text-xs mt-2">
                Password for both: <span className="font-mono text-yellow-300">Password123!</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

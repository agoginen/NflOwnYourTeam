import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import {
  updateProfile,
  updatePassword,
  selectUser,
  selectAuthLoading,
  selectAuthError,
  clearError
} from '../store/slices/authSlice';

import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const [activeTab, setActiveTab] = useState('profile');
  const [previewUrl, setPreviewUrl] = useState(null);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      username: user?.username || '',
      bio: user?.bio || '',
      location: user?.location || '',
      favoriteTeam: user?.favoriteTeam || ''
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch: watchPassword
  } = useForm();

  useEffect(() => {
    if (user) {
      resetProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        username: user.username || '',
        bio: user.bio || '',
        location: user.location || '',
        favoriteTeam: user.favoriteTeam || ''
      });
    }
  }, [user, resetProfile]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const onSubmitProfile = async (data) => {
    try {
      await dispatch(updateProfile(data)).unwrap();
      toast.success('Profile updated successfully!');
    } catch (error) {
      // Error is handled by the slice
    }
  };

  const onSubmitPassword = async (data) => {
    try {
      await dispatch(updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      })).unwrap();
      resetPassword();
      toast.success('Password updated successfully!');
    } catch (error) {
      // Error is handled by the slice
    }
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Avatar file size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile Information', icon: '👤' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'preferences', name: 'Preferences', icon: '⚙️' },
    { id: 'stats', name: 'Statistics', icon: '📊' }
  ];

  if (!user) {
    return <LoadingSpinner text="Loading profile..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Profile Settings</h1>
          <p className="text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700 border-primary-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-3">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>

            {/* User Card */}
            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <div className="relative inline-block">
                  <img
                    src={previewUrl || user.avatar || '/default-avatar.png'}
                    alt={user.username}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                  <label className="absolute bottom-0 right-0 bg-primary-600 rounded-full p-1 cursor-pointer hover:bg-primary-700 transition-colors">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
                
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-sm text-gray-500">@{user.username}</p>
                
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-center space-x-2">
                    <span>📧</span>
                    <span>{user.email}</span>
                  </div>
                  {user.location && (
                    <div className="flex items-center justify-center space-x-2">
                      <span>📍</span>
                      <span>{user.location}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-center space-x-2">
                    <span>📅</span>
                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              
              {/* Profile Information Tab */}
              {activeTab === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6"
                >
                  <div className="border-b border-gray-200 pb-4 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Update your personal information and profile details
                    </p>
                  </div>

                  <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          {...registerProfile('firstName', { 
                            required: 'First name is required',
                            minLength: { value: 2, message: 'First name must be at least 2 characters' }
                          })}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        {profileErrors.firstName && (
                          <p className="mt-1 text-sm text-red-600">{profileErrors.firstName.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          {...registerProfile('lastName', { 
                            required: 'Last name is required',
                            minLength: { value: 2, message: 'Last name must be at least 2 characters' }
                          })}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        {profileErrors.lastName && (
                          <p className="mt-1 text-sm text-red-600">{profileErrors.lastName.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Username
                        </label>
                        <input
                          {...registerProfile('username', { 
                            required: 'Username is required',
                            minLength: { value: 3, message: 'Username must be at least 3 characters' },
                            pattern: { 
                              value: /^[a-zA-Z0-9_]+$/, 
                              message: 'Username can only contain letters, numbers, and underscores' 
                            }
                          })}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        {profileErrors.username && (
                          <p className="mt-1 text-sm text-red-600">{profileErrors.username.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          {...registerProfile('email', { 
                            required: 'Email is required',
                            pattern: { 
                              value: /^\S+@\S+$/i, 
                              message: 'Please enter a valid email address' 
                            }
                          })}
                          type="email"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        {profileErrors.email && (
                          <p className="mt-1 text-sm text-red-600">{profileErrors.email.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bio
                      </label>
                      <textarea
                        {...registerProfile('bio', { 
                          maxLength: { value: 500, message: 'Bio must be less than 500 characters' }
                        })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Tell us about yourself..."
                      />
                      {profileErrors.bio && (
                        <p className="mt-1 text-sm text-red-600">{profileErrors.bio.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location
                        </label>
                        <input
                          {...registerProfile('location')}
                          type="text"
                          placeholder="City, State"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Favorite NFL Team
                        </label>
                        <select
                          {...registerProfile('favoriteTeam')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Select a team</option>
                          <option value="cardinals">Arizona Cardinals</option>
                          <option value="falcons">Atlanta Falcons</option>
                          <option value="ravens">Baltimore Ravens</option>
                          <option value="bills">Buffalo Bills</option>
                          <option value="panthers">Carolina Panthers</option>
                          <option value="bears">Chicago Bears</option>
                          <option value="bengals">Cincinnati Bengals</option>
                          <option value="browns">Cleveland Browns</option>
                          <option value="cowboys">Dallas Cowboys</option>
                          <option value="broncos">Denver Broncos</option>
                          <option value="lions">Detroit Lions</option>
                          <option value="packers">Green Bay Packers</option>
                          <option value="texans">Houston Texans</option>
                          <option value="colts">Indianapolis Colts</option>
                          <option value="jaguars">Jacksonville Jaguars</option>
                          <option value="chiefs">Kansas City Chiefs</option>
                          <option value="raiders">Las Vegas Raiders</option>
                          <option value="chargers">Los Angeles Chargers</option>
                          <option value="rams">Los Angeles Rams</option>
                          <option value="dolphins">Miami Dolphins</option>
                          <option value="vikings">Minnesota Vikings</option>
                          <option value="patriots">New England Patriots</option>
                          <option value="saints">New Orleans Saints</option>
                          <option value="giants">New York Giants</option>
                          <option value="jets">New York Jets</option>
                          <option value="eagles">Philadelphia Eagles</option>
                          <option value="steelers">Pittsburgh Steelers</option>
                          <option value="49ers">San Francisco 49ers</option>
                          <option value="seahawks">Seattle Seahawks</option>
                          <option value="buccaneers">Tampa Bay Buccaneers</option>
                          <option value="titans">Tennessee Titans</option>
                          <option value="commanders">Washington Commanders</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={loading}
                        className="min-w-[120px]"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6"
                >
                  <div className="border-b border-gray-200 pb-4 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Change your password and manage security preferences
                    </p>
                  </div>

                  <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <input
                        {...registerPassword('currentPassword', { 
                          required: 'Current password is required'
                        })}
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      {passwordErrors.currentPassword && (
                        <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        {...registerPassword('newPassword', { 
                          required: 'New password is required',
                          minLength: { value: 8, message: 'Password must be at least 8 characters' },
                          pattern: {
                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                            message: 'Password must contain uppercase, lowercase, number, and special character'
                          }
                        })}
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      {passwordErrors.newPassword && (
                        <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        {...registerPassword('confirmPassword', { 
                          required: 'Please confirm your password',
                          validate: value => value === watchPassword('newPassword') || 'Passwords do not match'
                        })}
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      {passwordErrors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={loading}
                        className="min-w-[120px]"
                      >
                        {loading ? 'Updating...' : 'Update Password'}
                      </Button>
                    </div>
                  </form>

                  {/* Account Security Info */}
                  <div className="mt-8 border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Account Security</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="text-green-600">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-green-900">Account Verified</p>
                            <p className="text-sm text-green-700">Your email has been verified</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="text-gray-600">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                            <p className="text-sm text-gray-600">Not enabled</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Enable
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Statistics Tab */}
              {activeTab === 'stats' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6"
                >
                  <div className="border-b border-gray-200 pb-4 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Your Statistics</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      View your fantasy football performance and achievements
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-blue-50 rounded-lg p-6 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {user.stats?.totalLeagues || 0}
                      </div>
                      <div className="text-sm text-blue-800 mt-1">Leagues Joined</div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-6 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        ${user.stats?.totalWinnings?.toLocaleString() || 0}
                      </div>
                      <div className="text-sm text-green-800 mt-1">Total Winnings</div>
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-6 text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {user.stats?.championships || 0}
                      </div>
                      <div className="text-sm text-yellow-800 mt-1">Championships</div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-6 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {user.stats?.teamsOwned || 0}
                      </div>
                      <div className="text-sm text-purple-800 mt-1">Teams Owned</div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                    
                    <div className="space-y-3">
                      {user.recentActivity?.length > 0 ? (
                        user.recentActivity.map((activity, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="text-gray-400">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">{activity.description}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(activity.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>No recent activity to display</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

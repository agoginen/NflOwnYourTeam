import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createLeague, selectCreateLoading, selectLeagueError } from '../../store/slices/leagueSlice';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CreateLeaguePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectCreateLoading);
  const error = useSelector(selectLeagueError);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxMembers: 10,
    isPrivate: true,
    auctionSettings: {
      minimumBid: 1,
      bidIncrement: 1,
      auctionTimer: 60
    },
    payoutStructure: {
      regularSeasonWins: 70.0,
      wildCardWin: 2.5,
      divisionalWin: 2.5,
      conferenceChampionshipWin: 2.5,
      superBowlAppearance: 10.0,
      superBowlWin: 12.5
    }
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'League name is required';
    } else if (formData.name.length < 3 || formData.name.length > 50) {
      newErrors.name = 'League name must be between 3 and 50 characters';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters';
    }



    if (formData.maxMembers < 2 || formData.maxMembers > 32) {
      newErrors.maxMembers = 'Max members must be between 2 and 32';
    }



    // Validate payout structure totals to 100%
    const totalPayout = Object.values(formData.payoutStructure).reduce((sum, val) => sum + val, 0);
    if (Math.abs(totalPayout - 100) > 0.1) {
      newErrors.payoutStructure = 'Payout percentages must total 100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await dispatch(createLeague(formData)).unwrap();
      navigate(`/leagues/${result._id}`);
    } catch (error) {
      console.error('Failed to create league:', error);
    }
  };



  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New League</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic League Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                League Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter league name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="maxMembers" className="block text-sm font-medium text-gray-700 mb-2">
                Max Members
              </label>
              <input
                type="number"
                id="maxMembers"
                name="maxMembers"
                value={formData.maxMembers}
                onChange={handleChange}
                min="2"
                max="32"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  errors.maxMembers ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.maxMembers && <p className="mt-1 text-sm text-red-600">{errors.maxMembers}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe your league (optional)"
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Private League (invite only)</span>
            </label>
          </div>

          {/* Season Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Season Information</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-blue-800">2025 NFL Season</h4>
                  <p className="text-sm text-blue-700">All leagues created now are automatically set for the 2025 NFL season.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Auction Settings */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Auction Settings</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Unlimited Budget</h4>
                  <p className="text-sm text-blue-700">Players can spend unlimited money. The total prize pool will be calculated from actual spending after the auction.</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="auctionSettings.minimumBid" className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Bid
                </label>
                <input
                  type="number"
                  id="auctionSettings.minimumBid"
                  name="auctionSettings.minimumBid"
                  value={formData.auctionSettings.minimumBid}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="auctionSettings.bidIncrement" className="block text-sm font-medium text-gray-700 mb-2">
                  Bid Increment
                </label>
                <input
                  type="number"
                  id="auctionSettings.bidIncrement"
                  name="auctionSettings.bidIncrement"
                  value={formData.auctionSettings.bidIncrement}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="auctionSettings.auctionTimer" className="block text-sm font-medium text-gray-700 mb-2">
                  Timer (seconds)
                </label>
                <input
                  type="number"
                  id="auctionSettings.auctionTimer"
                  name="auctionSettings.auctionTimer"
                  value={formData.auctionSettings.auctionTimer}
                  onChange={handleChange}
                  min="30"
                  max="300"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/leagues')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center"
            >
              {loading && <LoadingSpinner size="sm" className="mr-2" />}
              Create League
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLeaguePage;
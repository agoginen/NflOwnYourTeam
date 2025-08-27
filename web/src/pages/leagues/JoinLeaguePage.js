import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { joinLeague, selectJoinLoading, selectLeagueError } from '../../store/slices/leagueSlice';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const JoinLeaguePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectJoinLoading);
  const error = useSelector(selectLeagueError);

  const [inviteCode, setInviteCode] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate invite code
    if (!inviteCode.trim()) {
      setValidationError('Invite code is required');
      return;
    }

    if (inviteCode.length !== 8) {
      setValidationError('Invite code must be 8 characters long');
      return;
    }

    if (!/^[A-Z0-9]+$/.test(inviteCode.toUpperCase())) {
      setValidationError('Invite code can only contain letters and numbers');
      return;
    }

    setValidationError('');

    try {
      const result = await dispatch(joinLeague(inviteCode.toUpperCase())).unwrap();
      navigate(`/leagues/${result._id}`);
    } catch (error) {
      console.error('Failed to join league:', error);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase();
    setInviteCode(value);
    if (validationError) {
      setValidationError('');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join League</h1>
          <p className="text-gray-600">Enter the invite code to join an existing league</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-2">
              Invite Code
            </label>
            <input
              type="text"
              id="inviteCode"
              value={inviteCode}
              onChange={handleCodeChange}
              maxLength="8"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-center text-lg font-mono tracking-wider ${
                validationError || error ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="XXXXXXXX"
              autoComplete="off"
            />
            {validationError && (
              <p className="mt-1 text-sm text-red-600">{validationError}</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <svg className="flex-shrink-0 w-5 h-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">About Invite Codes</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Invite codes are 8 characters long</li>
                    <li>They contain only letters and numbers</li>
                    <li>Ask the league creator for the invite code</li>
                    <li>Each league has a unique invite code</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <svg className="flex-shrink-0 w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/leagues')}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !inviteCode.trim()}
              className="flex-1 flex items-center justify-center"
            >
              {loading && <LoadingSpinner size="sm" className="mr-2" />}
              Join League
            </Button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">Don't have an invite code?</p>
            <Button
              variant="outline"
              onClick={() => navigate('/leagues/create')}
              className="w-full"
            >
              Create Your Own League
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinLeaguePage;
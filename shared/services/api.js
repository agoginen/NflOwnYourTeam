import { API_CONFIG, API_ENDPOINTS, HTTP_STATUS, HEADERS } from '../constants/api.js';
import { ERROR_MESSAGES } from '../constants/app.js';

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.retryAttempts = API_CONFIG.RETRY_ATTEMPTS;
    this.retryDelay = API_CONFIG.RETRY_DELAY;
    this.token = null;
    this.refreshPromise = null;
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
  }

  // Get default headers
  getHeaders(customHeaders = {}) {
    const headers = {
      [HEADERS.CONTENT_TYPE_JSON]: HEADERS.CONTENT_TYPE_JSON,
      ...customHeaders,
    };

    if (this.token) {
      headers[HEADERS.AUTHORIZATION] = `${HEADERS.BEARER} ${this.token}`;
    }

    return headers;
  }

  // Build full URL
  buildUrl(endpoint) {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    return `${this.baseURL}${endpoint}`;
  }

  // Create AbortController for timeout
  createTimeoutController() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    return {
      controller,
      cleanup: () => clearTimeout(timeoutId),
    };
  }

  // Handle response
  async handleResponse(response) {
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.statusText = response.statusText;

      // Try to parse error response
      try {
        const errorData = await response.json();
        error.data = errorData;
        error.message = errorData.message || error.message;
      } catch (e) {
        // If can't parse JSON, use status text
      }

      throw error;
    }

    // Handle different content types
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  }

  // Retry logic
  async withRetry(requestFn, attempts = this.retryAttempts) {
    try {
      return await requestFn();
    } catch (error) {
      if (attempts > 1 && this.isRetryableError(error)) {
        await this.delay(this.retryDelay);
        return this.withRetry(requestFn, attempts - 1);
      }
      throw error;
    }
  }

  // Check if error is retryable
  isRetryableError(error) {
    if (!error.status) return true; // Network errors
    return error.status >= 500 || error.status === 408; // Server errors or timeout
  }

  // Delay utility
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Token refresh logic
  async refreshToken() {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.request(API_ENDPOINTS.AUTH.REFRESH, {
      method: 'POST',
    }).then(response => {
      this.setToken(response.token);
      return response;
    }).finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  // Main request method
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      headers = {},
      body,
      skipAuth = false,
      skipRetry = false,
      ...otherOptions
    } = options;

    const { controller, cleanup } = this.createTimeoutController();

    const requestOptions = {
      method,
      headers: this.getHeaders(headers),
      signal: controller.signal,
      ...otherOptions,
    };

    if (body) {
      if (typeof body === 'object' && !(body instanceof FormData)) {
        requestOptions.body = JSON.stringify(body);
      } else {
        requestOptions.body = body;
        // Don't set content-type for FormData, let browser set it
        if (body instanceof FormData) {
          delete requestOptions.headers['Content-Type'];
        }
      }
    }

    const makeRequest = async () => {
      try {
        const response = await fetch(this.buildUrl(endpoint), requestOptions);
        return await this.handleResponse(response);
      } catch (error) {
        // Handle auth errors
        if (error.status === HTTP_STATUS.UNAUTHORIZED && !skipAuth && this.token) {
          try {
            await this.refreshToken();
            // Retry with new token
            requestOptions.headers = this.getHeaders(headers);
            const retryResponse = await fetch(this.buildUrl(endpoint), requestOptions);
            return await this.handleResponse(retryResponse);
          } catch (refreshError) {
            // Clear token and re-throw original error
            this.clearToken();
            throw error;
          }
        }

        // Transform fetch errors
        if (error.name === 'AbortError') {
          const timeoutError = new Error(ERROR_MESSAGES.TIMEOUT_ERROR);
          timeoutError.type = 'timeout';
          throw timeoutError;
        }

        if (!error.status) {
          const networkError = new Error(ERROR_MESSAGES.NETWORK_ERROR);
          networkError.type = 'network';
          throw networkError;
        }

        throw error;
      } finally {
        cleanup();
      }
    };

    if (skipRetry) {
      return makeRequest();
    }

    return this.withRetry(makeRequest);
  }

  // Convenience methods
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  async put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  async patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // Upload file
  async upload(endpoint, file, additionalData = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    return this.post(endpoint, formData);
  }

  // Download file
  async download(endpoint, filename) {
    const response = await fetch(this.buildUrl(endpoint), {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    
    // Create download link (web only)
    if (typeof document !== 'undefined') {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }

    return blob;
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.get('/health', { skipAuth: true, skipRetry: true });
      return { healthy: true, ...response };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  // Batch requests
  async batch(requests) {
    const promises = requests.map(({ endpoint, options }) => 
      this.request(endpoint, options).catch(error => ({ error }))
    );

    return Promise.all(promises);
  }
}

// Create singleton instance
export const apiService = new ApiService();

// Auth API methods
export const authAPI = {
  login: (credentials) => apiService.post(API_ENDPOINTS.AUTH.LOGIN, credentials),
  register: (userData) => apiService.post(API_ENDPOINTS.AUTH.REGISTER, userData),
  logout: () => apiService.post(API_ENDPOINTS.AUTH.LOGOUT),
  getCurrentUser: () => apiService.get(API_ENDPOINTS.AUTH.PROFILE),
  updateProfile: (data) => apiService.put(API_ENDPOINTS.AUTH.UPDATE_PROFILE, data),
  updatePassword: (data) => apiService.put(API_ENDPOINTS.AUTH.UPDATE_PASSWORD, data),
  forgotPassword: (email) => apiService.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email }),
  resetPassword: (data) => apiService.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data),
};

// League API methods
export const leagueAPI = {
  getLeagues: () => apiService.get(API_ENDPOINTS.LEAGUES.LIST),
  createLeague: (data) => apiService.post(API_ENDPOINTS.LEAGUES.CREATE, data),
  getLeague: (id) => apiService.get(API_ENDPOINTS.LEAGUES.DETAIL(id)),
  updateLeague: (id, data) => apiService.put(API_ENDPOINTS.LEAGUES.UPDATE(id), data),
  deleteLeague: (id) => apiService.delete(API_ENDPOINTS.LEAGUES.DELETE(id)),
  joinLeague: (data) => apiService.post(API_ENDPOINTS.LEAGUES.JOIN, data),
  leaveLeague: (id) => apiService.post(API_ENDPOINTS.LEAGUES.LEAVE(id)),
  getMembers: (id) => apiService.get(API_ENDPOINTS.LEAGUES.MEMBERS(id)),
  getStandings: (id) => apiService.get(API_ENDPOINTS.LEAGUES.STANDINGS(id)),
  inviteMembers: (id, data) => apiService.post(API_ENDPOINTS.LEAGUES.INVITE(id), data),
};

// Auction API methods
export const auctionAPI = {
  getAuctions: () => apiService.get(API_ENDPOINTS.AUCTIONS.LIST),
  createAuction: (data) => apiService.post(API_ENDPOINTS.AUCTIONS.CREATE, data),
  getAuction: (id) => apiService.get(API_ENDPOINTS.AUCTIONS.DETAIL(id)),
  startAuction: (id) => apiService.post(API_ENDPOINTS.AUCTIONS.START(id)),
  pauseAuction: (id, reason) => apiService.post(API_ENDPOINTS.AUCTIONS.PAUSE(id), { reason }),
  resumeAuction: (id) => apiService.post(API_ENDPOINTS.AUCTIONS.RESUME(id)),
  nominateTeam: (id, teamId, startingBid) => apiService.post(API_ENDPOINTS.AUCTIONS.NOMINATE(id), { teamId, startingBid }),
  placeBid: (id, teamId, bidAmount) => apiService.post(API_ENDPOINTS.AUCTIONS.BID(id), { teamId, bidAmount }),
  getBids: (id) => apiService.get(API_ENDPOINTS.AUCTIONS.BIDS(id)),
  getBudget: (id) => apiService.get(API_ENDPOINTS.AUCTIONS.BUDGET(id)),
  getAvailableTeams: (id) => apiService.get(API_ENDPOINTS.AUCTIONS.AVAILABLE_TEAMS(id)),
  getTimeline: (id) => apiService.get(API_ENDPOINTS.AUCTIONS.TIMELINE(id)),
};

// NFL API methods
export const nflAPI = {
  getTeams: (params) => apiService.get(API_ENDPOINTS.NFL.TEAMS, { params }),
  getStandings: (params) => apiService.get(API_ENDPOINTS.NFL.STANDINGS, { params }),
  getPlayoffTeams: () => apiService.get(API_ENDPOINTS.NFL.PLAYOFFS),
  getCurrentWeek: () => apiService.get(API_ENDPOINTS.NFL.CURRENT_WEEK),
  getTeamStats: (id) => apiService.get(API_ENDPOINTS.NFL.TEAM_STATS(id)),
  getTeamSchedule: (id, params) => apiService.get(API_ENDPOINTS.NFL.TEAM_SCHEDULE(id), { params }),
  searchTeams: (query) => apiService.get(`${API_ENDPOINTS.NFL.SEARCH}?q=${encodeURIComponent(query)}`),
};

export default apiService;

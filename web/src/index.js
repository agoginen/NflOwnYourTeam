import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
// import { ReactQueryDevtools } from 'react-query/devtools';
import { Toaster } from 'react-hot-toast';

import './styles/index.css';
import App from './App';
import { store, persistor } from './store';
import LoadingSpinner from './components/common/LoadingSpinner';
import reportWebVitals from './reportWebVitals';

// Create React Query client with balanced settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: process.env.NODE_ENV === 'development' ? 30 * 1000 : 5 * 60 * 1000, // 30 seconds in dev, 5 minutes in prod
      cacheTime: process.env.NODE_ENV === 'development' ? 2 * 60 * 1000 : 10 * 60 * 1000, // 2 minutes in dev, 10 minutes in prod
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={<LoadingSpinner />} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
            {/* {process.env.NODE_ENV === 'development' && (
              <ReactQueryDevtools initialIsOpen={false} />
            )} */}
          </BrowserRouter>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);

// Register service worker for PWA functionality (only in production)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, show update notification
              console.log('New content is available; please refresh.');
              
              // You could show a toast or banner here
              if (window.confirm('New version available! Click OK to update.')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
  
  // Listen for service worker messages
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SW_UPDATE') {
      console.log('Service worker updated');
    }
  });
} else if ('serviceWorker' in navigator && process.env.NODE_ENV === 'development') {
  // In development, unregister any existing service workers to prevent cache issues
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
      console.log('Unregistered service worker for development');
    }
  });
  
  // Also clear all caches
  if ('caches' in window) {
    caches.keys().then(function(names) {
      for (let name of names) {
        caches.delete(name);
      }
    });
  }
}

// Request notification permission
if ('Notification' in window && 'serviceWorker' in navigator) {
  if (Notification.permission === 'default') {
    // Don't request immediately, wait for user interaction
    console.log('Notification permission not requested yet');
  }
}

// PWA install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('PWA install prompt triggered');
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  
  // Show your custom install UI here
  // You could dispatch an action to show an install banner in your app
  console.log('PWA can be installed');
});

window.addEventListener('appinstalled', (evt) => {
  console.log('PWA was installed');
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

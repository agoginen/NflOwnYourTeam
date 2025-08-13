import React from 'react';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  text = '', 
  centered = true,
  overlay = false 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const colorClasses = {
    primary: 'text-primary-600',
    white: 'text-white',
    gray: 'text-gray-600'
  };

  const spinner = (
    <div className={`inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent ${sizeClasses[size]} ${colorClasses[color]}`}>
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="flex flex-col items-center space-y-4 rounded-lg bg-white p-6 shadow-xl">
          {spinner}
          {text && <p className="text-sm text-gray-600">{text}</p>}
        </div>
      </div>
    );
  }

  if (centered) {
    return (
      <div className="flex flex-col items-center justify-center space-y-2 py-8">
        {spinner}
        {text && <p className="text-sm text-gray-600">{text}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {spinner}
      {text && <span className="text-sm">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;

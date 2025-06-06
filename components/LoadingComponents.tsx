import React from 'react';

export const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-white text-lg">Loading server data...</p>
    </div>
  );
};

export function RepoSkeletonLoader() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-3/4 bg-gray-700 rounded"></div>
      <div className="h-4 w-full bg-gray-700 rounded"></div>
      <div className="flex gap-4">
        <div className="h-4 w-16 bg-gray-700 rounded"></div>
        <div className="h-4 w-16 bg-gray-700 rounded"></div>
      </div>
      <div className="h-10 w-full bg-gray-700 rounded mt-4"></div>
    </div>
  );
}

export const ServerSkeletonLoader = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-6 w-32 bg-gray-700 rounded mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/5 p-3 rounded-lg">
              <div className="h-4 w-24 bg-gray-700 rounded mb-2"></div>
              <div className="h-3 w-32 bg-gray-700 rounded mb-1"></div>
              <div className="h-3 w-40 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="h-6 w-32 bg-gray-700 rounded mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/5 p-3 rounded-lg">
              <div className="h-4 w-24 bg-gray-700 rounded mb-2"></div>
              <div className="h-3 w-32 bg-gray-700 rounded mb-1"></div>
              <div className="h-3 w-40 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
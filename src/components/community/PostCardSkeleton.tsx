import React from 'react';

export const PostCardSkeleton: React.FC = () => (
  <div className="bg-white p-4 border-b border-gray-100 animate-pulse">
    <div className="h-4 w-16 bg-gray-100 rounded-full mb-2" />
    <div className="h-4 w-3/4 bg-gray-100 rounded mb-2" />
    <div className="h-3.5 w-full bg-gray-100 rounded mb-1.5" />
    <div className="h-3.5 w-2/3 bg-gray-100 rounded mb-3" />
    <div className="flex items-center justify-between">
      <div className="h-3 w-24 bg-gray-100 rounded" />
      <div className="h-3 w-10 bg-gray-100 rounded" />
    </div>
    <div className="flex items-center gap-4 mt-2">
      <div className="h-3 w-8 bg-gray-100 rounded" />
      <div className="h-3 w-8 bg-gray-100 rounded" />
      <div className="h-3 w-8 bg-gray-100 rounded" />
    </div>
  </div>
);

export const BestPostRowSkeleton: React.FC = () => (
  <div className="px-4 py-3 border-t border-gray-50 animate-pulse">
    <div className="h-4 w-2/3 bg-gray-100 rounded mb-2" />
    <div className="flex items-center justify-between">
      <div className="h-3 w-14 bg-gray-100 rounded" />
      <div className="h-3 w-20 bg-gray-100 rounded" />
    </div>
  </div>
);

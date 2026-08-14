import React from 'react';

export const PostCardSkeleton: React.FC = () => (
  <div className="bg-surface p-4 border-b border-line animate-pulse">
    <div className="h-4 w-16 bg-primary-soft rounded-full mb-2" />
    <div className="h-4 w-3/4 bg-primary-soft rounded mb-2" />
    <div className="h-3.5 w-full bg-primary-soft rounded mb-1.5" />
    <div className="h-3.5 w-2/3 bg-primary-soft rounded mb-3" />
    <div className="flex items-center justify-between">
      <div className="h-3 w-24 bg-primary-soft rounded" />
      <div className="h-3 w-10 bg-primary-soft rounded" />
    </div>
    <div className="flex items-center gap-4 mt-2">
      <div className="h-3 w-8 bg-primary-soft rounded" />
      <div className="h-3 w-8 bg-primary-soft rounded" />
      <div className="h-3 w-8 bg-primary-soft rounded" />
    </div>
  </div>
);

export const BestPostRowSkeleton: React.FC = () => (
  <div className="px-4 py-3 border-t border-line animate-pulse">
    <div className="h-4 w-2/3 bg-primary-soft rounded mb-2" />
    <div className="flex items-center justify-between">
      <div className="h-3 w-14 bg-primary-soft rounded" />
      <div className="h-3 w-20 bg-primary-soft rounded" />
    </div>
  </div>
);

import React from 'react';
import { Building2 } from 'lucide-react';
import type { Job } from '../../types/app';

export const JobCard: React.FC<{ job: Job }> = ({ job }) => (
  <div className="bg-white p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
    <div className="flex gap-4">
      <div className="w-12 h-12 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden">
        <Building2 className="w-6 h-6 text-gray-300" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-gray-900">{job.title}</h3>
          <div className="flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded">
            <span className="text-[10px] font-bold text-green-700">{job.cultureScore}</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-1">{job.company}</p>
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
          <span>{job.location}</span>
          <span>•</span>
          <span className="text-blue-600 font-medium">{job.salary}</span>
        </div>
        <div className="flex gap-1 flex-wrap">
          {job.tags.map(tag => (
            <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  </div>
);

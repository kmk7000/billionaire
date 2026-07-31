import React from 'react';
import { Building2 } from 'lucide-react';
import { motion } from 'motion/react';
import { MOCK_JOBS } from '../constants/mockData';
import { JobCard } from '../components/jobs/JobCard';

export const JobsScreen: React.FC = () => (
  <motion.div
    key="jobs"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
  >
    <div className="p-4 bg-white border-b border-gray-100">
      <h2 className="text-sm font-bold text-gray-900 mb-4">注目の求人</h2>
      <div className="flex gap-3 overflow-x-auto no-scrollbar">
        {MOCK_JOBS.map(j => (
          <div key={j.id} className="min-w-[200px] border border-gray-100 rounded-xl p-3 bg-white shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-gray-50 rounded border border-gray-100 flex items-center justify-center">
                <Building2 className="w-3 h-3 text-gray-300" />
              </div>
              <span className="text-xs font-bold text-gray-600">{j.company}</span>
            </div>
            <h3 className="text-sm font-bold text-gray-900 line-clamp-1 mb-1">{j.title}</h3>
            <p className="text-[10px] text-blue-600 font-bold">{j.salary}</p>
          </div>
        ))}
      </div>
    </div>
    <div className="mt-2">
      {MOCK_JOBS.map(j => (
        <JobCard key={j.id} job={j} />
      ))}
    </div>
  </motion.div>
);

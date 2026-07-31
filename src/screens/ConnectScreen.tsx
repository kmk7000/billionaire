import React from 'react';
import { FileText } from 'lucide-react';
import { motion } from 'motion/react';

export const ConnectScreen: React.FC = () => (
  <motion.div
    key="connect"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="p-4"
  >
    <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-gray-900 mb-2">コネクト</h2>
      <p className="text-gray-500 text-sm">
        新しいつながりを見つけましょう。
      </p>
    </div>
  </motion.div>
);

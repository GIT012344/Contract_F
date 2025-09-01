import React from 'react';
import { motion } from 'framer-motion';

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue',
  trend,
  trendValue,
  subtitle,
  onClick,
  loading = false
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600',
    pink: 'from-pink-500 to-pink-600',
    teal: 'from-teal-500 to-teal-600'
  };

  const iconColorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    red: 'text-red-600 bg-red-100',
    purple: 'text-purple-600 bg-purple-100',
    indigo: 'text-indigo-600 bg-indigo-100',
    pink: 'text-pink-600 bg-pink-100',
    teal: 'text-teal-600 bg-teal-100'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className={`relative bg-white rounded-xl shadow-lg overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Gradient Border Top */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colorClasses[color]}`} />
      
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
              </div>
            ) : (
              <motion.p 
                className="text-3xl font-bold text-gray-900"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                {typeof value === 'number' ? value.toLocaleString() : value}
              </motion.p>
            )}

            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}

            {trend && (
              <div className="flex items-center mt-2">
                {trend === 'up' ? (
                  <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {trendValue}%
                </span>
                <span className="text-xs text-gray-500 ml-1">จากเดือนที่แล้ว</span>
              </div>
            )}
          </div>

          {Icon && (
            <div className={`p-3 rounded-full ${iconColorClasses[color]}`}>
              <Icon className="w-6 h-6" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

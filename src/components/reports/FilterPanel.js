import React from 'react';
import { motion } from 'framer-motion';

export default function FilterPanel({ 
  filters, 
  onFilterChange,
  departments = [],
  statuses = []
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-lg p-6 relative z-10"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">ตัวกรอง</h3>
      
      <div className="space-y-4">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ช่วงเวลา
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => onFilterChange({ ...filters, dateRange: e.target.value })}
            className="relative z-20 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">ทั้งหมด</option>
            <option value="today">วันนี้</option>
            <option value="week">สัปดาห์นี้</option>
            <option value="month">เดือนนี้</option>
            <option value="quarter">ไตรมาสนี้</option>
            <option value="year">ปีนี้</option>
            <option value="custom">กำหนดเอง</option>
          </select>
        </div>

        {/* Custom Date Range */}
        {filters.dateRange === 'custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2"
          >
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </motion.div>
        )}

        {/* Department Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            หน่วยงาน
          </label>
          <select
            value={filters.department}
            onChange={(e) => onFilterChange({ ...filters, department: e.target.value })}
            className="relative z-20 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">ทั้งหมด</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            สถานะ
          </label>
          <div className="space-y-2">
            {statuses.map(status => (
              <label key={status.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.statuses?.includes(status.value)}
                  onChange={(e) => {
                    const newStatuses = e.target.checked
                      ? [...(filters.statuses || []), status.value]
                      : (filters.statuses || []).filter(s => s !== status.value);
                    onFilterChange({ ...filters, statuses: newStatuses });
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{status.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Report Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ประเภทรายงาน
          </label>
          <select
            value={filters.reportType}
            onChange={(e) => onFilterChange({ ...filters, reportType: e.target.value })}
            className="relative z-20 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="summary">สรุปภาพรวม</option>
            <option value="contract">รายงานสัญญา</option>
            <option value="financial">รายงานการเงิน</option>
            <option value="period">รายงานงวดงาน</option>
            <option value="department">รายงานตามหน่วยงาน</option>
          </select>
        </div>

        {/* Apply Button */}
        <button
          onClick={() => onFilterChange({ ...filters, apply: true })}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          ใช้ตัวกรอง
        </button>

        {/* Reset Button */}
        <button
          onClick={() => onFilterChange({
            dateRange: 'month',
            department: 'all',
            statuses: [],
            reportType: 'summary'
          })}
          className="w-full bg-gray-100 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-200 transition-all duration-200"
        >
          รีเซ็ตตัวกรอง
        </button>
      </div>
    </motion.div>
  );
}

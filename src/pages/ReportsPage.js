import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import StatsCard from '../components/reports/StatsCard';
import ChartCard from '../components/reports/ChartCard';
import FilterPanel from '../components/reports/FilterPanel';
import ExportMenu from '../components/reports/ExportMenu';
import DataTable from '../components/reports/DataTable';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ReportsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [contracts, setContracts] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [stats, setStats] = useState({
    totalContracts: 0,
    activeContracts: 0,
    totalValue: 0,
    completedPeriods: 0,
    pendingPeriods: 0,
    departments: []
  });
  const [filters, setFilters] = useState({
    dateRange: 'all',
    department: 'all',
    statuses: []
  });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch data with error handling for each API
      const fetchWithFallback = async (url, fallback = null) => {
        try {
          const response = await axios.get(url, { headers });
          return response;
        } catch (error) {
          console.error(`Error fetching ${url}:`, error);
          return fallback;
        }
      };

      // Fetch all data with error handling
      const [dashboardRes, contractsRes, periodsRes, performanceRes, departmentsRes] = await Promise.all([
        fetchWithFallback(`${process.env.REACT_APP_API_URL}/api/reports/dashboard`, { data: { data: {} } }),
        fetchWithFallback(`${process.env.REACT_APP_API_URL}/api/contracts`, { data: [] }),
        fetchWithFallback(`${process.env.REACT_APP_API_URL}/api/periods`, { data: [] }),
        fetchWithFallback(`${process.env.REACT_APP_API_URL}/api/reports/performance`, { data: { data: {} } }),
        fetchWithFallback(`${process.env.REACT_APP_API_URL}/api/departments`, { data: [] })
      ]);

      const dashboardData = dashboardRes?.data?.data || {};
      const contractsData = contractsRes?.data || [];
      const periodsData = periodsRes?.data || [];
      const performanceData = performanceRes?.data?.data || {};
      const departmentsData = departmentsRes?.data || [];

      // Apply filters
      let filteredContracts = contractsData;
      if (filters.department !== 'all') {
        filteredContracts = filteredContracts.filter(c => c.department === filters.department);
      }
      if (filters.statuses?.length > 0) {
        filteredContracts = filteredContracts.filter(c => filters.statuses.includes(c.status));
      }

      // Use API data for stats - handle departments array properly
      const departments = Array.isArray(departmentsData) 
        ? departmentsData.map(d => d.name || d.department_name || d.department)
        : [];
      
      setContracts(filteredContracts || []);
      setPeriods(periodsData || []);
      setStats({
        totalContracts: dashboardData?.contracts?.total_contracts || 0,
        activeContracts: dashboardData?.contracts?.active_contracts || 0,
        totalValue: parseFloat(dashboardData?.contracts?.total_value) || 0,
        completedPeriods: dashboardData?.periods?.completed_periods || 0,
        pendingPeriods: dashboardData?.periods?.pending_periods || 0,
        departments,
        performanceMetrics: performanceData || {}
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      setLoading(false);
    }
  };

  // Chart data preparation
  const prepareChartData = () => {
    // Prepare chart data - only when data is loaded
    const monthlyData = contracts.length > 0 ? contracts.reduce((acc, contract) => {
      if (!contract.startDate) return acc;
      const month = new Date(contract.startDate).toLocaleDateString('th-TH', { month: 'short' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {}) : { 'ม.ค.': 0, 'ก.พ.': 0, 'มี.ค.': 0 };

    const contractTrendData = {
      labels: Object.keys(monthlyData).length > 0 ? Object.keys(monthlyData) : ['ม.ค.', 'ก.พ.', 'มี.ค.'],
      datasets: [{
        label: 'จำนวนสัญญา',
        data: Object.values(monthlyData).length > 0 ? Object.values(monthlyData) : [0, 0, 0],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };

    // Department distribution
    const deptData = contracts.length > 0 ? contracts.reduce((acc, contract) => {
      const dept = contract.department || 'ไม่ระบุ';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {}) : { 'ไม่มีข้อมูล': 1 };

    const departmentChartData = {
      labels: Object.keys(deptData),
      datasets: [{
        data: Object.values(deptData),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(147, 51, 234, 0.8)'
        ]
      }]
    };

    // Status distribution
    const statusData = contracts.length > 0 ? contracts.reduce((acc, contract) => {
      const status = contract.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {}) : { 'active': 0, 'completed': 0 };

    const statusChartData = {
      labels: Object.keys(statusData).map(s => s === 'active' ? 'ดำเนินการ' : s === 'completed' ? 'เสร็จสิ้น' : s === 'cancelled' ? 'ยกเลิก' : 'อื่นๆ'),
      datasets: [{
        data: Object.values(statusData),
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ]
      }]
    };

    // Period trend (count, not financial)
    const periodData = periods.length > 0 ? periods.reduce((acc, period) => {
      if (!period.dueDate) return acc;
      const month = new Date(period.dueDate).toLocaleDateString('th-TH', { month: 'short' });
      acc[month] = (acc[month] || 0) + 1; // นับจำนวนงวด ไม่ใช่มูลค่าเงิน
      return acc;
    }, {}) : { 'ม.ค.': 0, 'ก.พ.': 0, 'มี.ค.': 0 };

    const periodTrendData = {
      labels: Object.keys(periodData).length > 0 ? Object.keys(periodData) : ['ม.ค.', 'ก.พ.', 'มี.ค.'],
      datasets: [{
        label: 'จำนวนงวด',
        data: Object.values(periodData).length > 0 ? Object.values(periodData) : [0, 0, 0],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2
      }]
    };

    return { contractTrendData, departmentChartData, statusChartData, periodTrendData };
  };

  const { contractTrendData, departmentChartData, statusChartData, periodTrendData } = prepareChartData();

  // Export handlers
  const handleExport = async (format, data) => {
    switch (format) {
      case 'excel':
        exportToExcel(data);
        break;
      case 'pdf':
        exportToPDF(data);
        break;
      case 'csv':
        exportToCSV(data);
        break;
      case 'print':
        window.print();
        break;
      default:
        break;
    }
  };

  const exportToExcel = (data) => {
    const ws = XLSX.utils.json_to_sheet(contracts);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contracts');
    XLSX.writeFile(wb, `report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = (data) => {
    const doc = new jsPDF();
    doc.text('รายงานสัญญา', 14, 15);
    doc.text(`วันที่: ${new Date().toLocaleDateString('th-TH')}`, 14, 25);
    
    const tableColumns = ['เลขที่สัญญา', 'ชื่อสัญญา', 'หน่วยงาน', 'มูลค่า', 'สถานะ'];
    const tableRows = contracts.map(c => [
      c.contractNumber,
      c.contractName,
      c.department,
      `${parseFloat(c.totalAmount || 0).toLocaleString()} บาท`,
      c.status
    ]);
    
    doc.autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: 35,
      styles: { font: 'helvetica' }
    });
    
    doc.save(`report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = (data) => {
    const csvContent = [
      ['เลขที่สัญญา', 'ชื่อสัญญา', 'หน่วยงาน', 'มูลค่า', 'สถานะ'],
      ...contracts.map(c => [
        c.contractNumber,
        c.contractName,
        c.department,
        c.totalAmount,
        c.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Table columns configuration
  const contractColumns = [
    { key: 'contractNumber', label: 'เลขที่สัญญา' },
    { key: 'contractName', label: 'ชื่อสัญญา' },
    { key: 'department', label: 'หน่วยงาน' },
    { key: 'contractor', label: 'คู่สัญญา' },
    { 
      key: 'totalAmount', 
      label: 'มูลค่า',
      render: (value) => `${parseFloat(value || 0).toLocaleString()} บาท`
    },
    { 
      key: 'startDate', 
      label: 'วันเริ่มต้น',
      render: (value) => new Date(value).toLocaleDateString('th-TH')
    },
    { 
      key: 'status', 
      label: 'สถานะ',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'ACTIVE' ? 'bg-green-100 text-green-800' :
          value === 'EXPIRED' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value === 'active' ? 'ดำเนินการ' : value === 'completed' ? 'เสร็จสิ้น' : 'ยกเลิก'}
        </span>
      )
    }
  ];

  // Period columns configuration
  const periodColumns = [
    { key: 'period_number', label: 'งวดที่' },
    { key: 'description', label: 'รายละเอียด' },
    { key: 'amount', label: 'จำนวนงวด' },
    { 
      key: 'due_date', 
      label: 'วันครบกำหนด',
      render: (value) => value ? new Date(value).toLocaleDateString('th-TH') : '-'
    },
    { 
      key: 'paid_date', 
      label: 'วันที่จ่าย',
      render: (value) => value ? new Date(value).toLocaleDateString('th-TH') : '-'
    },
    { 
      key: 'status', 
      label: 'สถานะ',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'completed' ? 'bg-green-100 text-green-800' :
          value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value === 'completed' ? 'เสร็จสิ้น' : value === 'pending' ? 'รอดำเนินการ' : 'ยกเลิก'}
        </span>
      )
    }
  ];

  const tabs = [
    { id: 'dashboard', label: 'ภาพรวม', icon: '📊' },
    { id: 'contracts', label: 'สัญญา', icon: '📄' },
    { id: 'periods', label: 'งวดสัญญา', icon: '📅' },
    { id: 'analytics', label: 'วิเคราะห์', icon: '📈' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">ระบบรายงานและวิเคราะห์</h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              ย้อนกลับ
            </button>
          </div>
          <p className="text-gray-600">ดูภาพรวมและวิเคราะห์ข้อมูลสัญญาทั้งหมด</p>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter Panel */}
          <div className="lg:col-span-1">
            <FilterPanel
              filters={filters}
              onFilterChange={setFilters}
              departments={stats.departments}
              statuses={[
                { value: 'active', label: 'ดำเนินการ' },
                { value: 'completed', label: 'เสร็จสิ้น' },
                { value: 'cancelled', label: 'ยกเลิก' }
              ]}
            />
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatsCard
                      title="สัญญาทั้งหมด"
                      value={stats.totalContracts}
                      color="blue"
                      icon={() => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>}
                      trend="up"
                      trendValue={12}
                      loading={loading}
                    />
                    <StatsCard
                      title="สัญญาที่ดำเนินการ"
                      value={stats.activeContracts}
                      color="green"
                      icon={() => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>}
                      trend="up"
                      trendValue={8}
                      loading={loading}
                    />
                    <StatsCard
                      title="งวดทั้งหมด"
                      value={periods.length}
                      color="yellow"
                      icon={() => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>}
                      trend="up"
                      trendValue={15}
                      loading={loading}
                    />
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard
                      title="แนวโน้มสัญญารายเดือน"
                      subtitle="จำนวนสัญญาในแต่ละเดือน"
                      type="line"
                      data={contractTrendData}
                      loading={loading}
                    />
                    <ChartCard
                      title="สัญญาตามหน่วยงาน"
                      subtitle="การกระจายตามหน่วยงาน"
                      type="doughnut"
                      data={departmentChartData}
                      height={250}
                      loading={loading}
                    />
                  </div>

                  {/* Recent Contracts Table */}
                  <DataTable
                    title="สัญญาล่าสุด"
                    subtitle="แสดงสัญญาที่มีการอัพเดทล่าสุด"
                    columns={contractColumns}
                    data={contracts.slice(0, 5)}
                    searchable={false}
                    pagination={false}
                  />
                </motion.div>
              )}

              {activeTab === 'contracts' && (
                <motion.div
                  key="contracts"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <DataTable
                    title="รายการสัญญาทั้งหมด"
                    subtitle={`พบ ${contracts.length} รายการ`}
                    columns={contractColumns}
                    data={contracts}
                  />
                </motion.div>
              )}

              {activeTab === 'periods' && (
                <motion.div
                  key="periods"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatsCard
                      title="งวดที่เสร็จสิ้น"
                      value={stats.completedPeriods}
                      color="green"
                      subtitle="งวดที่ได้รับเงินแล้ว"
                      loading={loading}
                    />
                    <StatsCard
                      title="งวดรอดำเนินการ"
                      value={stats.pendingPeriods}
                      color="yellow"
                      subtitle="งวดที่รอการชำระ"
                      loading={loading}
                    />
                    <StatsCard
                      title="งวดทั้งหมด"
                      value={periods.length}
                      color="blue"
                      subtitle="จำนวนงวดทั้งหมด"
                      loading={loading}
                    />
                  </div>

                  <ChartCard
                    title="สถานะงวดสัญญา"
                    subtitle="การกระจายตามสถานะ"
                    type="doughnut"
                    data={{
                      labels: ['เสร็จสิ้น', 'รอดำเนินการ'],
                      datasets: [{
                        data: [stats.completedPeriods, stats.pendingPeriods],
                        backgroundColor: ['#10b981', '#f59e0b']
                      }]
                    }}
                    loading={loading}
                  />

                  <DataTable
                    title="รายการงวดสัญญา"
                    subtitle={`พบ ${periods.length} รายการ`}
                    columns={periodColumns}
                    data={periods}
                  />
                </motion.div>
              )}

              {activeTab === 'analytics' && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">ตัวชี้วัดประสิทธิภาพ</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-600">อัตราความสำเร็จสัญญา</p>
                          <p className="text-2xl font-bold text-green-600">
                            {Math.round(stats.performanceMetrics?.completionRate || 0)}%
                          </p>
                        </div>
                        <div className="w-16 h-16">
                          <svg className="transform -rotate-90" viewBox="0 0 36 36">
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3"/>
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray={`${Math.round(stats.performanceMetrics?.completionRate || 0)}, 100`}/>
                          </svg>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-600">อัตราความสำเร็จงวด</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {Math.round(stats.performanceMetrics?.periodCompletionRate || 0)}%
                          </p>
                        </div>
                        <div className="w-16 h-16">
                          <svg className="transform -rotate-90" viewBox="0 0 36 36">
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3"/>
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray={`${Math.round(stats.performanceMetrics?.periodCompletionRate || 0)}, 100`}/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <DataTable
                    title="ประสิทธิภาพตามหน่วยงาน"
                    columns={[
                      { key: 'department', label: 'หน่วยงาน' },
                      { key: 'total_contracts', label: 'จำนวนสัญญา' },
                      { 
                        key: 'progress_rate', 
                        label: 'อัตราความคืบหน้า',
                        render: (value) => (
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${value}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{Math.round(value)}%</span>
                          </div>
                        )
                      }
                    ]}
                    data={stats.performanceMetrics?.departmentPerformance || []}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

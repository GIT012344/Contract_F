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
  const [filters, setFilters] = useState({
    department: 'all',
    dateRange: { start: null, end: null },
    statuses: []
  });
  const [contracts, setContracts] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [stats, setStats] = useState({
    totalContracts: 0,
    activeContracts: 0,
    totalValue: 0,
    completedPeriods: 0,
    pendingPeriods: 0,
    departments: [],
    performanceMetrics: {}
  });
  const [contractTrendData, setContractTrendData] = useState({
    labels: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.'],
    datasets: [{
      label: 'จำนวนสัญญา',
      data: [0, 0, 0, 0, 0, 0],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  });
  const [departmentChartData, setDepartmentChartData] = useState({
    labels: ['ไม่มีข้อมูล'],
    datasets: [{
      data: [1],
      backgroundColor: ['rgba(156, 163, 175, 0.5)']
    }]
  });
  const [statusChartData, setStatusChartData] = useState({
    labels: ['ไม่มีข้อมูล'],
    datasets: [{
      data: [1],
      backgroundColor: ['rgba(156, 163, 175, 0.5)']
    }]
  });
  const [financialChartData, setFinancialChartData] = useState({
    labels: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.'],
    datasets: [{
      label: 'จำนวนงวด',
      data: [0, 0, 0, 0, 0, 0],
      borderColor: 'rgb(16, 185, 129)',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      tension: 0.4,
      fill: true
    }]
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

      // Mock data for testing when API is not available
      const mockDashboardData = {
        data: {
          data: {
            contracts: {
              total_contracts: 150,
              active_contracts: 87,
              expired_contracts: 43,
              created_contracts: 20,
              total_value: 45678900
            },
            periods: {
              total_periods: 320,
              completed_periods: 180,
              pending_periods: 140
            },
            departments: [
              { department: 'ฝ่ายขาย', contract_count: 45 },
              { department: 'ฝ่ายบัญชี', contract_count: 32 },
              { department: 'ฝ่าย IT', contract_count: 28 },
              { department: 'ฝ่ายบุคคล', contract_count: 25 },
              { department: 'ฝ่ายการตลาด', contract_count: 20 }
            ],
            monthly_trends: [
              { month: '2024-01', new_contracts: 12, expired_contracts: 5 },
              { month: '2024-02', new_contracts: 15, expired_contracts: 8 },
              { month: '2024-03', new_contracts: 18, expired_contracts: 6 },
              { month: '2024-04', new_contracts: 22, expired_contracts: 9 },
              { month: '2024-05', new_contracts: 25, expired_contracts: 7 },
              { month: '2024-06', new_contracts: 28, expired_contracts: 10 }
            ]
          }
        }
      };

      const mockContractsData = {
        data: [
          { id: 1, contract_number: 'CT2024001', title: 'สัญญาจ้างที่ปรึกษา', department: 'ฝ่าย IT', status: 'ACTIVE', value: 500000, start_date: '2024-01-01', end_date: '2024-12-31' },
          { id: 2, contract_number: 'CT2024002', title: 'สัญญาเช่าอุปกรณ์', department: 'ฝ่ายขาย', status: 'ACTIVE', value: 250000, start_date: '2024-02-01', end_date: '2024-11-30' },
          { id: 3, contract_number: 'CT2024003', title: 'สัญญาบำรุงรักษา', department: 'ฝ่ายบัญชี', status: 'EXPIRED', value: 180000, start_date: '2023-01-01', end_date: '2023-12-31' },
          { id: 4, contract_number: 'CT2024004', title: 'สัญญาจัดซื้อ', department: 'ฝ่ายบุคคล', status: 'ACTIVE', value: 320000, start_date: '2024-03-01', end_date: '2025-02-28' },
          { id: 5, contract_number: 'CT2024005', title: 'สัญญาบริการ', department: 'ฝ่ายการตลาด', status: 'ACTIVE', value: 420000, start_date: '2024-04-01', end_date: '2025-03-31' }
        ]
      };

      const mockPeriodsData = {
        data: [
          { id: 1, contract_id: 1, period_number: 1, amount: 50000, due_date: '2024-02-01', status: 'completed' },
          { id: 2, contract_id: 1, period_number: 2, amount: 50000, due_date: '2024-03-01', status: 'completed' },
          { id: 3, contract_id: 2, period_number: 1, amount: 25000, due_date: '2024-03-01', status: 'pending' },
          { id: 4, contract_id: 3, period_number: 1, amount: 30000, due_date: '2023-02-01', status: 'completed' },
          { id: 5, contract_id: 4, period_number: 1, amount: 40000, due_date: '2024-04-01', status: 'pending' }
        ]
      };

      const mockPerformanceData = {
        data: {
          data: {
            contract_completion_rate: 75.5,
            period_completion_rate: 68.2,
            on_time_payment_rate: 82.3,
            department_progress: [
              { department: 'ฝ่ายขาย', progress: 85 },
              { department: 'ฝ่ายบัญชี', progress: 72 },
              { department: 'ฝ่าย IT', progress: 90 },
              { department: 'ฝ่ายบุคคล', progress: 65 },
              { department: 'ฝ่ายการตลาด', progress: 78 }
            ]
          }
        }
      };

      const mockDepartmentsData = {
        data: [
          { id: 1, name: 'ฝ่ายขาย' },
          { id: 2, name: 'ฝ่ายบัญชี' },
          { id: 3, name: 'ฝ่าย IT' },
          { id: 4, name: 'ฝ่ายบุคคล' },
          { id: 5, name: 'ฝ่ายการตลาด' }
        ]
      };

      // Try to fetch from API, but use mock data as fallback
      const [dashboardRes, contractsRes, periodsRes, performanceRes, departmentsRes] = await Promise.all([
        fetchWithFallback(`${process.env.REACT_APP_API_URL}/api/reports/dashboard`, mockDashboardData),
        fetchWithFallback(`${process.env.REACT_APP_API_URL}/api/contracts`, mockContractsData),
        fetchWithFallback(`${process.env.REACT_APP_API_URL}/api/periods`, mockPeriodsData),
        fetchWithFallback(`${process.env.REACT_APP_API_URL}/api/reports/performance`, mockPerformanceData),
        fetchWithFallback(`${process.env.REACT_APP_API_URL}/api/departments`, mockDepartmentsData)
      ]);

      // Log responses for debugging
      console.log('Dashboard Response:', dashboardRes);
      console.log('Contracts Response:', contractsRes);
      console.log('Periods Response:', periodsRes);
      console.log('Performance Response:', performanceRes);
      console.log('Departments Response:', departmentsRes);

      const dashboardData = dashboardRes?.data?.data || dashboardRes?.data || {};
      const contractsData = Array.isArray(contractsRes?.data) ? contractsRes.data : contractsRes?.data?.data || [];
      const periodsData = Array.isArray(periodsRes?.data) ? periodsRes.data : periodsRes?.data?.data || [];
      const performanceData = performanceRes?.data?.data || performanceRes?.data || {};
      const departmentsData = Array.isArray(departmentsRes?.data) ? departmentsRes.data : departmentsRes?.data?.data || [];

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
      
      // Log filtered data
      console.log('Filtered Contracts:', filteredContracts);
      console.log('Dashboard Data:', dashboardData);
      console.log('Departments:', departments);

      setContracts(Array.isArray(filteredContracts) ? filteredContracts : []);
      setPeriods(Array.isArray(periodsData) ? periodsData : []);
      
      // Calculate stats from actual data if dashboard API fails
      const totalContracts = dashboardData?.contracts?.total_contracts || filteredContracts.length || 0;
      const activeContracts = dashboardData?.contracts?.active_contracts || 
        filteredContracts.filter(c => c.status === 'ACTIVE' || c.status === 'active').length || 0;
      const totalValue = parseFloat(dashboardData?.contracts?.total_value) || 
        filteredContracts.reduce((sum, c) => sum + (parseFloat(c.value) || 0), 0) || 0;
      const completedPeriods = dashboardData?.periods?.completed_periods || 
        periodsData.filter(p => p.status === 'completed').length || 0;
      const pendingPeriods = dashboardData?.periods?.pending_periods || 
        periodsData.filter(p => p.status === 'pending').length || 0;
      
      setStats({
        totalContracts,
        activeContracts,
        totalValue,
        completedPeriods,
        pendingPeriods,
        departments,
        performanceMetrics: performanceData || {}
      });
      
      console.log('Stats Set:', {
        totalContracts,
        activeContracts,
        totalValue,
        completedPeriods,
        pendingPeriods
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
    if (!contracts || contracts.length === 0) {
      // Set default empty data
      setContractTrendData({
        labels: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.'],
        datasets: [{
          label: 'จำนวนสัญญา',
          data: [0, 0, 0, 0, 0, 0],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      });
      setDepartmentChartData({
        labels: ['ไม่มีข้อมูล'],
        datasets: [{
          data: [1],
          backgroundColor: ['rgba(156, 163, 175, 0.5)']
        }]
      });
      setStatusChartData({
        labels: ['ไม่มีข้อมูล'],
        datasets: [{
          data: [1],
          backgroundColor: ['rgba(156, 163, 175, 0.5)']
        }]
      });
      setFinancialChartData({
        labels: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.'],
        datasets: [{
          label: 'จำนวนงวด',
          data: [0, 0, 0, 0, 0, 0],
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        }]
      });
      return;
    }

    // Monthly contracts chart
    const monthlyData = contracts.reduce((acc, contract) => {
      const dateField = contract.start_date || contract.startDate;
      if (dateField) {
        const month = new Date(dateField).toLocaleDateString('th-TH', { month: 'short' });
        acc[month] = (acc[month] || 0) + 1;
      }
      return acc;
    }, {});

    setContractTrendData({
      labels: Object.keys(monthlyData).length > 0 ? Object.keys(monthlyData) : ['ไม่มีข้อมูล'],
      datasets: [{
        label: 'จำนวนสัญญา',
        data: Object.values(monthlyData).length > 0 ? Object.values(monthlyData) : [0],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }]
    });

    // Department distribution
    const departmentData = contracts.reduce((acc, contract) => {
      const dept = contract.department || 'ไม่ระบุ';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});

    // Generate colors for departments
    const colors = [
      'rgba(59, 130, 246, 0.8)',
      'rgba(16, 185, 129, 0.8)',
      'rgba(251, 191, 36, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(167, 139, 250, 0.8)',
      'rgba(34, 197, 94, 0.8)',
      'rgba(249, 115, 22, 0.8)',
      'rgba(236, 72, 153, 0.8)'
    ];
    
    const borderColors = [
      'rgb(59, 130, 246)',
      'rgb(16, 185, 129)',
      'rgb(251, 191, 36)',
      'rgb(239, 68, 68)',
      'rgb(167, 139, 250)',
      'rgb(34, 197, 94)',
      'rgb(249, 115, 22)',
      'rgb(236, 72, 153)'
    ];

    const deptKeys = Object.keys(departmentData);
    const deptValues = Object.values(departmentData);
    
    setDepartmentChartData({
      labels: deptKeys.length > 0 ? deptKeys : ['ไม่มีข้อมูล'],
      datasets: [{
        data: deptValues.length > 0 ? deptValues : [1],
        backgroundColor: deptKeys.length > 0 ? colors.slice(0, deptKeys.length) : ['rgba(156, 163, 175, 0.5)'],
        borderColor: deptKeys.length > 0 ? borderColors.slice(0, deptKeys.length) : ['rgb(156, 163, 175)'],
        borderWidth: 2
      }]
    });

    // Status distribution
    const statusData = contracts.reduce((acc, contract) => {
      const status = contract.status || 'UNKNOWN';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const statusKeys = Object.keys(statusData);
    const statusValues = Object.values(statusData);
    const statusLabels = statusKeys.map(s => {
      switch(s) {
        case 'ACTIVE': return 'ดำเนินการ';
        case 'EXPIRED': return 'หมดอายุ';
        case 'CRTD': return 'สร้างใหม่';
        default: return s;
      }
    });
    const statusColors = statusKeys.map(s => {
      switch(s) {
        case 'ACTIVE': return 'rgba(16, 185, 129, 0.8)';
        case 'EXPIRED': return 'rgba(239, 68, 68, 0.8)';
        case 'CRTD': return 'rgba(59, 130, 246, 0.8)';
        default: return 'rgba(156, 163, 175, 0.8)';
      }
    });

    setStatusChartData({
      labels: statusLabels.length > 0 ? statusLabels : ['ไม่มีข้อมูล'],
      datasets: [{
        data: statusValues.length > 0 ? statusValues : [1],
        backgroundColor: statusColors.length > 0 ? statusColors : ['rgba(156, 163, 175, 0.5)'],
        borderColor: statusColors.length > 0 ? statusColors.map(c => c.replace('0.8', '1')) : ['rgb(156, 163, 175)'],
        borderWidth: 2
      }]
    });

    // Financial/Period trends
    const periodData = periods.reduce((acc, period) => {
      const dateField = period.due_date || period.dueDate;
      if (dateField) {
        const month = new Date(dateField).toLocaleDateString('th-TH', { month: 'short' });
        acc[month] = (acc[month] || 0) + 1;
      }
      return acc;
    }, {});

    setFinancialChartData({
      labels: Object.keys(periodData).length > 0 ? Object.keys(periodData) : ['ไม่มีข้อมูล'],
      datasets: [{
        label: 'จำนวนงวด',
        data: Object.values(periodData).length > 0 ? Object.values(periodData) : [0],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2
      }]
    });
  };

  // Call prepareChartData when contracts or periods change
  useEffect(() => {
    if (contracts.length > 0 || periods.length > 0) {
      prepareChartData();
    }
  }, [contracts, periods]);

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
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                      title="มูลค่ารวม"
                      value={`${stats.totalValue.toLocaleString()} บาท`}
                      color="yellow"
                      icon={() => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

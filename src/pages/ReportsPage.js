import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth, authFetch } from '../AuthContext';
import { exportSummaryToCSV, generateSummaryReport } from '../utils/exportUtils';
import { printSummaryReport } from '../utils/printUtils';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (contracts.length > 0 && periods.length > 0) {
      generateReport();
    }
  }, [contracts, periods, dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [contractsRes, periodsRes] = await Promise.all([
        authFetch('/api/contracts', {}, token),
        authFetch('/api/periods', {}, token)
      ]);

      if (contractsRes.ok) {
        const contractsData = await contractsRes.json();
        setContracts(contractsData);
      }

      if (periodsRes.ok) {
        const periodsData = await periodsRes.json();
        setPeriods(periodsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = () => {
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    
    // Use all contracts and periods (don't filter by date for now to see all data)
    const filteredContracts = contracts;
    const filteredPeriods = periods;
    
    console.log('📊 Reports Debug - Contracts:', filteredContracts.slice(0, 2));
    console.log('📊 Reports Debug - Periods:', filteredPeriods.slice(0, 2));
    
    // Generate statistics with correct status values
    const stats = {
      totalContracts: filteredContracts.length,
      activeContracts: filteredContracts.filter(c => c.status === 'ACTIVE').length,
      pendingContracts: filteredContracts.filter(c => c.status === 'PENDING' || c.status === 'CRTD').length,
      completedContracts: filteredContracts.filter(c => c.status === 'COMPLETED').length,
      cancelledContracts: filteredContracts.filter(c => c.status === 'CANCELLED' || c.status === 'DELETED').length,
      
      totalPeriods: filteredPeriods.length,
      pendingPeriods: filteredPeriods.filter(p => ['รอดำเนินการ', 'รอส่งมอบ', 'กำลังดำเนินการ'].includes(p.status)).length,
      completedPeriods: filteredPeriods.filter(p => p.status === 'เสร็จสิ้น').length,
      overduePeriods: filteredPeriods.filter(p => {
        const isNotCompleted = !['เสร็จสิ้น'].includes(p.status);
        const isPastDue = new Date(p.due_date) < new Date();
        return isNotCompleted && isPastDue;
      }).length,
      
      // Department breakdown
      departmentStats: {},
      
      // Monthly breakdown
      monthlyStats: {}
    };
    
    console.log('📊 Reports Stats:', stats);

    // Calculate department statistics
    filteredContracts.forEach(contract => {
      const dept = contract.department || 'ไม่ระบุ';
      if (!stats.departmentStats[dept]) {
        stats.departmentStats[dept] = {
          total: 0,
          active: 0,
          pending: 0,
          completed: 0,
          cancelled: 0
        };
      }
      stats.departmentStats[dept].total++;
      
      // Map contract status to department stats
      if (contract.status === 'ACTIVE') {
        stats.departmentStats[dept].active++;
      } else if (contract.status === 'PENDING' || contract.status === 'CRTD') {
        stats.departmentStats[dept].pending++;
      } else if (contract.status === 'COMPLETED') {
        stats.departmentStats[dept].completed++;
      } else if (contract.status === 'CANCELLED' || contract.status === 'DELETED') {
        stats.departmentStats[dept].cancelled++;
      }
    });

    // Calculate monthly statistics
    filteredContracts.forEach(contract => {
      const month = new Date(contract.created_at).toLocaleDateString('th-TH', { 
        year: 'numeric', 
        month: 'long' 
      });
      if (!stats.monthlyStats[month]) {
        stats.monthlyStats[month] = 0;
      }
      stats.monthlyStats[month]++;
    });

    setReportData({
      ...stats,
      dateRange,
      contracts: filteredContracts,
      periods: filteredPeriods
    });
  };

  const handleExportReport = () => {
    if (!reportData) return;
    
    const summaryData = generateSummaryReport(reportData.contracts, reportData.periods);
    exportSummaryToCSV(summaryData, `รายงานสรุป_${dateRange.startDate}_${dateRange.endDate}`);
    toast.success('ส่งออกรายงานสำเร็จ');
  };

  const handlePrintReport = () => {
    if (!reportData) return;
    
    const summaryData = generateSummaryReport(reportData.contracts, reportData.periods);
    printSummaryReport(summaryData);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-100';
      case 'PENDING':
      case 'CRTD': return 'text-blue-600 bg-blue-100';
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      case 'CANCELLED':
      case 'DELETED': return 'text-red-600 bg-red-100';
      case 'รอดำเนินการ': return 'text-yellow-600 bg-yellow-100';
      case 'กำลังดำเนินการ': return 'text-blue-600 bg-blue-100';
      case 'เสร็จสิ้น': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ACTIVE': return 'ใช้งานอยู่';
      case 'PENDING': return 'รอดำเนินการ';
      case 'CRTD': return 'สร้างใหม่';
      case 'COMPLETED': return 'เสร็จสิ้น';
      case 'CANCELLED': return 'ยกเลิก';
      case 'DELETED': return 'ลบแล้ว';
      case 'รอดำเนินการ': return 'รอดำเนินการ';
      case 'กำลังดำเนินการ': return 'กำลังดำเนินการ';
      case 'เสร็จสิ้น': return 'เสร็จสิ้น';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="large" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">รายงานและสถิติ</h1>
              <p className="mt-2 text-gray-600">ดูรายงานสรุปและสถิติการใช้งานระบบ</p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleExportReport}
                disabled={!reportData}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                ส่งออก CSV
              </button>
              
              <button
                onClick={handlePrintReport}
                disabled={!reportData}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                พิมพ์รายงาน
              </button>
            </div>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">ช่วงเวลาที่ต้องการดูรายงาน</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">วันที่เริ่มต้น</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">วันที่สิ้นสุด</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="sm:col-span-2 flex items-end">
              <button
                onClick={generateReport}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                สร้างรายงาน
              </button>
            </div>
          </div>
        </div>

        {reportData && (
          <>
            {/* Overview Statistics */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">สัญญาทั้งหมด</dt>
                        <dd className="text-lg font-medium text-gray-900">{reportData.totalContracts}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">สัญญาที่ใช้งานอยู่</dt>
                        <dd className="text-lg font-medium text-gray-900">{reportData.activeContracts}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">งวดที่รอดำเนินการ</dt>
                        <dd className="text-lg font-medium text-gray-900">{reportData.pendingPeriods}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">งวดเกินกำหนด</dt>
                        <dd className="text-lg font-medium text-gray-900">{reportData.overduePeriods}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">งวดเกินกำหนด</dt>
                        <dd className="text-lg font-medium text-gray-900">{reportData.overduePeriods}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contract Status Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">สถานะสัญญา</h3>
                <div className="space-y-3">
                  {[
                    { key: 'activeContracts', label: 'ใช้งานอยู่', color: 'green' },
                    { key: 'pendingContracts', label: 'รอดำเนินการ', color: 'yellow' },
                    { key: 'completedContracts', label: 'เสร็จสิ้น', color: 'blue' },
                    { key: 'cancelledContracts', label: 'ยกเลิก', color: 'red' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full bg-${item.color}-500 mr-3`}></div>
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 mr-2">
                          {reportData[item.key]}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({reportData.totalContracts > 0 ? Math.round((reportData[item.key] / reportData.totalContracts) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">สถานะงวดงาน</h3>
                <div className="space-y-3">
                  {[
                    { key: 'pendingPeriods', label: 'รอดำเนินการ', color: 'yellow' },
                    { key: 'completedPeriods', label: 'เสร็จสิ้น', color: 'green' },
                    { key: 'overduePeriods', label: 'เกินกำหนด', color: 'red' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full bg-${item.color}-500 mr-3`}></div>
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 mr-2">
                          {reportData[item.key]}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({reportData.totalPeriods > 0 ? Math.round((reportData[item.key] / reportData.totalPeriods) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Department Statistics */}
            {Object.keys(reportData.departmentStats).length > 0 && (
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">สถิติตามหน่วยงาน</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">หน่วยงาน</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ทั้งหมด</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ใช้งานอยู่</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รอดำเนินการ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เสร็จสิ้น</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(reportData.departmentStats).map(([dept, stats]) => (
                        <tr key={dept}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stats.total}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stats.active || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stats.pending || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stats.completed || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Monthly Statistics */}
            {Object.keys(reportData.monthlyStats).length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">สถิติรายเดือน</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(reportData.monthlyStats).map(([month, count]) => (
                    <div key={month} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{month}</span>
                        <span className="text-lg font-bold text-blue-600">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

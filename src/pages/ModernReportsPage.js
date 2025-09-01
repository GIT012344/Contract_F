import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import {
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiFileText,
  FiCalendar, FiAlertCircle, FiDownload, FiFilter,
  FiPieChart, FiBarChart2, FiActivity, FiUsers
} from 'react-icons/fi';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import toast from 'react-hot-toast';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const ModernReportsPage = () => {
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(subMonths(new Date(), 11)), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  // Dashboard Data
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [contractTrends, setContractTrends] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [financialTrends, setFinancialTrends] = useState([]);
  const [periodPerformance, setPeriodPerformance] = useState([]);
  const [expiringContracts, setExpiringContracts] = useState([]);

  // Fetch all report data
  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      // Fetch all data in parallel
      const [
        metricsRes,
        trendsRes,
        statusRes,
        deptRes,
        financialRes,
        periodRes,
        expiringRes
      ] = await Promise.all([
        authFetch(`/api/reports/dashboard?${params}`),
        authFetch('/api/reports/contracts/trends?period=monthly'),
        authFetch('/api/reports/contracts/by-status'),
        authFetch('/api/reports/contracts/by-department'),
        authFetch('/api/reports/financial/trends'),
        authFetch('/api/reports/periods/performance'),
        authFetch('/api/reports/contracts/expiring?days=30')
      ]);

      const [
        metricsData,
        trendsData,
        statusData,
        deptData,
        financialData,
        periodData,
        expiringData
      ] = await Promise.all([
        metricsRes.json(),
        trendsRes.json(),
        statusRes.json(),
        deptRes.json(),
        financialRes.json(),
        periodRes.json(),
        expiringRes.json()
      ]);

      setDashboardMetrics(metricsData);
      setContractTrends(trendsData);
      setStatusDistribution(statusData);
      setDepartmentStats(deptData);
      setFinancialTrends(financialData);
      setPeriodPerformance(periodData);
      setExpiringContracts(expiringData);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลรายงานได้');
    } finally {
      setLoading(false);
    }
  };

  // Export functions
  const handleExportExcel = async () => {
    try {
      const response = await authFetch('/api/reports/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeTab, filters: dateRange })
      });
      const data = await response.json();
      toast.success('ส่งออก Excel เรียบร้อยแล้ว');
    } catch (error) {
      toast.error('ไม่สามารถส่งออก Excel ได้');
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await authFetch('/api/reports/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeTab, filters: dateRange })
      });
      const data = await response.json();
      toast.success('ส่งออก PDF เรียบร้อยแล้ว');
    } catch (error) {
      toast.error('ไม่สามารถส่งออก PDF ได้');
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('มูลค่า') ? formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                📊 รายงานและสถิติ
              </h1>
              <p className="text-gray-600">
                วิเคราะห์ข้อมูลสัญญาและประสิทธิภาพการทำงาน
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
              >
                <FiDownload /> Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
              >
                <FiDownload /> PDF
              </button>
            </div>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <div className="flex items-center gap-4">
            <FiFilter className="text-gray-500" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">ถึง</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={fetchReportData}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              ค้นหา
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="flex border-b">
            {['dashboard', 'contracts', 'financial', 'departments'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab === 'dashboard' && '🏠 ภาพรวม'}
                {tab === 'contracts' && '📄 สัญญา'}
                {tab === 'financial' && '💰 การเงิน'}
                {tab === 'departments' && '🏢 แผนก'}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && dashboardMetrics && (
          <div className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">สัญญาทั้งหมด</p>
                    <p className="text-3xl font-bold mt-2">
                      {dashboardMetrics.contracts?.total_contracts || 0}
                    </p>
                    <p className="text-blue-100 text-sm mt-2">
                      Active: {dashboardMetrics.contracts?.active_contracts || 0}
                    </p>
                  </div>
                  <FiFileText className="text-4xl text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">มูลค่ารวม</p>
                    <p className="text-2xl font-bold mt-2">
                      {formatCurrency(dashboardMetrics.financial?.total_value)}
                    </p>
                    <p className="text-green-100 text-sm mt-2">
                      เฉลี่ย: {formatCurrency(dashboardMetrics.financial?.average_value)}
                    </p>
                  </div>
                  <FiDollarSign className="text-4xl text-green-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">งวดงานทั้งหมด</p>
                    <p className="text-3xl font-bold mt-2">
                      {dashboardMetrics.periods?.total_periods || 0}
                    </p>
                    <p className="text-purple-100 text-sm mt-2">
                      เสร็จสิ้น: {dashboardMetrics.periods?.completed_periods || 0}
                    </p>
                  </div>
                  <FiCalendar className="text-4xl text-purple-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">การแจ้งเตือน</p>
                    <p className="text-3xl font-bold mt-2">
                      {dashboardMetrics.alerts?.active_alerts || 0}
                    </p>
                    <p className="text-orange-100 text-sm mt-2">
                      สัญญาใกล้หมด: {dashboardMetrics.alerts?.contracts_with_alerts || 0}
                    </p>
                  </div>
                  <FiAlertCircle className="text-4xl text-orange-200" />
                </div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contract Trends */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FiTrendingUp className="text-blue-500" />
                  แนวโน้มสัญญารายเดือน
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={contractTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="new_contracts" 
                      stroke="#3B82F6" 
                      fill="#93C5FD"
                      name="สัญญาใหม่"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Status Distribution */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FiPieChart className="text-green-500" />
                  สถานะสัญญา
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percentage }) => `${status}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Department Performance */}
              <div className="bg-white p-6 rounded-xl shadow-sm lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FiBarChart2 className="text-purple-500" />
                  ประสิทธิภาพแผนก
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="active" fill="#3B82F6" name="Active" />
                    <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
                    <Bar dataKey="completed" fill="#10B981" name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Expiring Contracts List */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FiAlertCircle className="text-red-500" />
                  สัญญาใกล้หมดอายุ
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {expiringContracts.slice(0, 5).map((contract) => (
                    <div 
                      key={contract.id}
                      className="p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100"
                      onClick={() => navigate(`/contracts/${contract.id}`)}
                    >
                      <p className="font-medium text-sm">{contract.contract_no}</p>
                      <p className="text-xs text-gray-600">{contract.contract_name}</p>
                      <p className="text-xs text-red-600 mt-1">
                        หมดอายุใน {contract.days_until_expiry} วัน
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs - simplified for now */}
        {activeTab === 'contracts' && (
          <ContractsTab 
            contractTrends={contractTrends}
            departmentStats={departmentStats}
            formatCurrency={formatCurrency}
            CustomTooltip={CustomTooltip}
          />
        )}

        {activeTab === 'financial' && (
          <FinancialTab 
            financialTrends={financialTrends}
            departmentStats={departmentStats}
            dashboardMetrics={dashboardMetrics}
            formatCurrency={formatCurrency}
            CustomTooltip={CustomTooltip}
          />
        )}

        {activeTab === 'departments' && (
          <DepartmentsTab 
            departmentStats={departmentStats}
            formatCurrency={formatCurrency}
            CustomTooltip={CustomTooltip}
          />
        )}
      </div>
    </Layout>
  );
};

// Contracts Tab Component
const ContractsTab = ({ contractTrends, departmentStats, formatCurrency, CustomTooltip }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4">มูลค่าสัญญารายเดือน</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={contractTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="total_value" 
              stroke="#10B981" 
              strokeWidth={2}
              name="มูลค่ารวม"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4">การกระจายตามแผนก</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={departmentStats.slice(0, 6)}>
            <PolarGrid />
            <PolarAngleAxis dataKey="department" />
            <PolarRadiusAxis />
            <Radar 
              name="จำนวนสัญญา" 
              dataKey="total_contracts" 
              stroke="#3B82F6" 
              fill="#3B82F6" 
              fillOpacity={0.6} 
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

// Financial Tab Component
const FinancialTab = ({ financialTrends, departmentStats, dashboardMetrics, formatCurrency, CustomTooltip }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4">แนวโน้มการเงิน</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={financialTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="total_value" 
              stroke="#3B82F6" 
              strokeWidth={2}
              name="มูลค่ารวม"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="growth_rate" 
              stroke="#10B981" 
              strokeWidth={2}
              name="อัตราการเติบโต (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4">การจัดสรรงบประมาณ</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={departmentStats}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="total_value"
              label={({ department, percent }) => `${department}: ${(percent * 100).toFixed(0)}%`}
            >
              {departmentStats.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(value)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-xl text-white">
        <p className="text-green-100 text-sm">มูลค่ารวมทั้งหมด</p>
        <p className="text-2xl font-bold mt-2">
          {formatCurrency(dashboardMetrics?.financial?.total_value || 0)}
        </p>
      </div>
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-xl text-white">
        <p className="text-blue-100 text-sm">มูลค่าเฉลี่ย</p>
        <p className="text-2xl font-bold mt-2">
          {formatCurrency(dashboardMetrics?.financial?.average_value || 0)}
        </p>
      </div>
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-xl text-white">
        <p className="text-purple-100 text-sm">มูลค่าสูงสุด</p>
        <p className="text-2xl font-bold mt-2">
          {formatCurrency(dashboardMetrics?.financial?.max_value || 0)}
        </p>
      </div>
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-xl text-white">
        <p className="text-orange-100 text-sm">มูลค่าต่ำสุด</p>
        <p className="text-2xl font-bold mt-2">
          {formatCurrency(dashboardMetrics?.financial?.min_value || 0)}
        </p>
      </div>
    </div>
  </div>
);

// Departments Tab Component  
const DepartmentsTab = ({ departmentStats, formatCurrency, CustomTooltip }) => (
  <div className="space-y-6">
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold mb-4">เปรียบเทียบประสิทธิภาพแผนก</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={departmentStats}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="active" stackId="a" fill="#3B82F6" name="Active" />
          <Bar dataKey="pending" stackId="a" fill="#F59E0B" name="Pending" />
          <Bar dataKey="completed" stackId="a" fill="#10B981" name="Completed" />
        </BarChart>
      </ResponsiveContainer>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {departmentStats.map((dept, index) => (
        <div key={dept.department} className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <h4 className="font-semibold text-lg mb-2">{dept.department}</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">สัญญาทั้งหมด:</span>
              <span className="font-medium">{dept.total_contracts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active:</span>
              <span className="font-medium text-blue-600">{dept.active}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pending:</span>
              <span className="font-medium text-yellow-600">{dept.pending}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed:</span>
              <span className="font-medium text-green-600">{dept.completed}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between">
                <span className="text-gray-600">มูลค่ารวม:</span>
                <span className="font-bold">{formatCurrency(dept.total_value)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default ModernReportsPage;

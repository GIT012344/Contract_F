import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch, useAuth } from '../AuthContext';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalContracts: 0,
    activeContracts: 0,
    completedContracts: 0,
    cancelledContracts: 0,
    pendingContracts: 0,
    totalPeriods: 0,
    pendingPeriods: 0,
    inProgressPeriods: 0,
    completedPeriods: 0,
    overduePeriods: 0,
    upcomingDeadlines: []
  });
  const [loading, setLoading] = useState(true);
  const { token, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch contracts
      const contractsRes = await authFetch('/api/contracts', {}, token);
      if (contractsRes.ok) {
        const contracts = await contractsRes.json();
        
        // Calculate contract stats
        const totalContracts = contracts.length;
        const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length;
        const completedContracts = contracts.filter(c => c.status === 'COMPLETED').length;
        const cancelledContracts = contracts.filter(c => c.status === 'CANCELLED').length;
        const pendingContracts = contracts.filter(c => c.status === 'PENDING' || c.status === 'CRTD').length;
        
        // Fetch periods from each contract individually
        console.log('📊 Dashboard: Fetching periods for', contracts.length, 'contracts');
        const periodPromises = contracts.map(async (contract) => {
          try {
            console.log(`📊 Fetching periods for contract ${contract.id}:`, contract.title);
            const res = await authFetch(`/api/contracts/${contract.id}/periods`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }, token);
            if (res.ok) {
              const periods = await res.json();
              console.log(`📊 Contract ${contract.id} has ${periods.length} periods:`, periods.map(p => ({ id: p.id, status: p.status, due_date: p.due_date })));
              return periods;
            } else {
              console.log(`📊 Failed to fetch periods for contract ${contract.id}:`, res.status, res.statusText);
              return [];
            }
          } catch (error) {
            console.error(`📊 Error fetching periods for contract ${contract.id}:`, error);
            return [];
          }
        });
        const periodsArrays = await Promise.all(periodPromises);
        let allPeriods = periodsArrays.flat();
        
        console.log('📊 Total periods found:', allPeriods.length);
        
        // Fallback: Try to fetch all periods at once if individual fetching failed
        if (allPeriods.length === 0 && contracts.length > 0) {
          console.log('📊 Trying fallback: fetching all periods from /api/periods');
          try {
            const fallbackRes = await authFetch('/api/periods', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }, token);
            if (fallbackRes.ok) {
              const fallbackPeriods = await fallbackRes.json();
              console.log('📊 Fallback found', fallbackPeriods.length, 'periods');
              allPeriods = fallbackPeriods;
            } else {
              console.log('📊 Fallback API returned:', fallbackRes.status, fallbackRes.statusText);
            }
          } catch (fallbackError) {
            console.log('📊 Fallback also failed:', fallbackError);
          }
        }
        
        // Debug: Log contracts structure
        console.log('🔍 Debug contracts structure:', contracts.slice(0, 2));
        console.log('🔍 Debug contracts keys and values:', contracts.slice(0, 1).map(c => ({
          id: c.id,
          title: c.title,
          name: c.name,
          contract_no: c.contract_no,
          contact_name: c.contact_name,
          keys: Object.keys(c),
          fullObject: c
        })));
        
        // Debug: Log periods structure
        console.log('🔍 Debug periods structure:', allPeriods.slice(0, 2).map(p => ({
          id: p.id,
          contract_id: p.contract_id,
          period_no: p.period_no,
          keys: Object.keys(p)
        })));
        
        // Create contract lookup map for easy access
        const contractsMap = contracts.reduce((map, contract) => {
          map[contract.id] = contract;
          return map;
        }, {});
        
        console.log('🔍 Debug contractsMap keys:', Object.keys(contractsMap));
        
        // Helper function to get contract title from various possible field names
        const getContractTitle = (contract) => {
          if (!contract) return 'ไม่ระบุสัญญา';
          
          // Try different possible field names
          return contract.title || 
                 contract.name || 
                 contract.contract_name || 
                 contract.contact_name || 
                 contract.project_name ||
                 `สัญญา #${contract.id}` || 
                 'ไม่ระบุสัญญา';
        };
        
        // Enhance periods with contract information
        const enhancedPeriods = allPeriods.map(period => {
          const matchedContract = contractsMap[period.contract_id];
          const contractTitle = getContractTitle(matchedContract);
          
          console.log(`🔍 Period ${period.id} (contract_id: ${period.contract_id}) -> Contract found:`, !!matchedContract, 'Title:', contractTitle);
          
          return {
            ...period,
            contract_title: contractTitle,
            contract_no: matchedContract?.contract_no || matchedContract?.number || 'N/A',
            contract_department: matchedContract?.department || matchedContract?.dept || 'N/A'
          };
        });
        
        // Log final periods count for debugging
        console.log('📊 Final periods count:', enhancedPeriods.length);
        if (enhancedPeriods.length > 0) {
          console.log('📊 Sample periods with contract info:', enhancedPeriods.slice(0, 3).map(p => ({ 
            id: p.id, 
            status: p.status, 
            due_date: p.due_date, 
            contract_id: p.contract_id,
            contract_title: p.contract_title,
            amount: p.amount,
            description: p.description 
          })));
        }
        
        // Calculate period stats using enhanced periods
        const totalPeriods = enhancedPeriods.length;
        const pendingPeriods = enhancedPeriods.filter(p => p.status === 'รอดำเนินการ' || p.status === 'รอส่งมอบ').length;
        const inProgressPeriods = enhancedPeriods.filter(p => p.status === 'กำลังดำเนินการ').length;
        const completedPeriods = enhancedPeriods.filter(p => p.status === 'เสร็จสิ้น').length;
        
        // Calculate overdue periods
        const today = new Date();
        const overduePeriods = enhancedPeriods.filter(p => {
          const dueDate = new Date(p.due_date);
          return dueDate < today && (p.status === 'รอดำเนินการ' || p.status === 'รอส่งมอบ' || p.status === 'กำลังดำเนินการ');
        }).length;
        
        // Calculate upcoming deadlines (next 7 days) with contract names
        const upcomingDeadlines = enhancedPeriods.filter(p => {
          const dueDate = new Date(p.due_date);
          const diffTime = dueDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 7 && (p.status === 'รอดำเนินการ' || p.status === 'รอส่งมอบ' || p.status === 'กำลังดำเนินการ');
        }).sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
          .slice(0, 5)
          .map(p => ({
            ...p,
            contract: contracts.find(c => c.id === p.contract_id)
          }));
        
        setStats({
          totalContracts,
          activeContracts,
          completedContracts,
          cancelledContracts,
          pendingContracts,
          totalPeriods,
          pendingPeriods,
          inProgressPeriods,
          completedPeriods,
          overduePeriods,
          upcomingDeadlines
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลแดชบอร์ดได้');
    } finally {
      setLoading(false);
    }
  };

  const formatDateThai = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntilDeadline = (dateStr) => {
    const today = new Date();
    const deadline = new Date(dateStr);
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="flex items-center gap-3">
            <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-lg text-gray-600">กำลังโหลดข้อมูล...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg text-white p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Contract Manager</h1>
              <p className="text-blue-100 text-lg">ระบบจัดการสัญญาและงวดงาน</p>
            </div>
            <div className="hidden md:block">
              <svg className="w-24 h-24 text-blue-200" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Contract Stats */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">สถานะสัญญา</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">ทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalContracts}</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">ใช้งานอยู่</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeContracts}</p>
                  <p className="text-xs text-gray-400">({stats.totalContracts > 0 ? Math.round((stats.activeContracts / stats.totalContracts) * 100) : 0}%)</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">รอดำเนินการ</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingContracts}</p>
                  <p className="text-xs text-gray-400">({stats.totalContracts > 0 ? Math.round((stats.pendingContracts / stats.totalContracts) * 100) : 0}%)</p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">เสร็จสิ้น</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.completedContracts}</p>
                  <p className="text-xs text-gray-400">({stats.totalContracts > 0 ? Math.round((stats.completedContracts / stats.totalContracts) * 100) : 0}%)</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">ยกเลิก</p>
                  <p className="text-2xl font-bold text-red-600">{stats.cancelledContracts}</p>
                  <p className="text-xs text-gray-400">({stats.totalContracts > 0 ? Math.round((stats.cancelledContracts / stats.totalContracts) * 100) : 0}%)</p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Period Stats */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">สถานะงวดงาน</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">รอดำเนินการ</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pendingPeriods}</p>
                  <p className="text-xs text-gray-400">({stats.totalPeriods > 0 ? Math.round((stats.pendingPeriods / stats.totalPeriods) * 100) : 0}%)</p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">กำลังดำเนินการ</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.inProgressPeriods}</p>
                  <p className="text-xs text-gray-400">({stats.totalPeriods > 0 ? Math.round((stats.inProgressPeriods / stats.totalPeriods) * 100) : 0}%)</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">เสร็จสิ้น</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completedPeriods}</p>
                  <p className="text-xs text-gray-400">({stats.totalPeriods > 0 ? Math.round((stats.completedPeriods / stats.totalPeriods) * 100) : 0}%)</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">เกินกำหนด</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overduePeriods}</p>
                  <p className="text-xs text-gray-400">({stats.totalPeriods > 0 ? Math.round((stats.overduePeriods / stats.totalPeriods) * 100) : 0}%)</p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">การดำเนินการด่วน</h2>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/contracts')}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
              >
                <div className="p-2 bg-blue-100 rounded">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">จัดการสัญญา</p>
                  <p className="text-sm text-gray-500">ดูรายการสัญญาทั้งหมด</p>
                </div>
              </button>
              
              {role === 'admin' && (
                <button
                  onClick={() => navigate('/contracts?action=add')}
                  className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                >
                  <div className="p-2 bg-green-100 rounded">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">เพิ่มสัญญาใหม่</p>
                    <p className="text-sm text-gray-500">สร้างสัญญาใหม่ในระบบ</p>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">กำหนดส่งที่ใกล้มาถึง</h2>
            </div>
            <div className="space-y-3">
              {stats.upcomingDeadlines.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500">ไม่มีกำหนดส่งที่ใกล้มาถึง</p>
                </div>
              ) : (
                stats.upcomingDeadlines.map((period, index) => {
                  const daysLeft = getDaysUntilDeadline(period.due_date);
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900">งวดที่ {period.period_no}</p>
                          <span className="text-gray-400">•</span>
                          <p className="text-sm font-medium text-blue-600">{period.contract_title}</p>
                        </div>
                        <p className="text-sm text-gray-500">{formatDateThai(period.due_date)}</p>
                        {period.description && (
                          <p className="text-xs text-gray-400 mt-1">{period.description}</p>
                        )}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        daysLeft <= 1 ? 'bg-red-100 text-red-800' :
                        daysLeft <= 3 ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {daysLeft === 0 ? 'วันนี้' : 
                         daysLeft === 1 ? 'พรุ่งนี้' : 
                         `อีก ${daysLeft} วัน`}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

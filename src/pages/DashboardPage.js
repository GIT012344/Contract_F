import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [stats, setStats] = useState({
    totalContracts: 0,
    activeContracts: 0,
    completedContracts: 0,
    cancelledContracts: 0,
    pendingContracts: 0,
    expiredContracts: 0,
    totalPeriods: 0,
    pendingPeriods: 0,
    inProgressPeriods: 0,
    completedPeriods: 0,
    upcomingDeadlines: [],
    recentContracts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch contracts
        const contractsRes = await authFetch('/api/contracts');
        if (contractsRes.ok) {
          const contracts = await contractsRes.json();
          const today = new Date();
          // คำนวณสถิติสัญญา
          const totalContracts = contracts.length;
          const crtdContracts = contracts.filter(c => c.status === 'CRTD').length;
          const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length;
          const deletedContracts = contracts.filter(c => c.status === 'DELETED').length;
          // Removed pending status
          const expiredContracts = contracts.filter(c => 
            c.status === 'EXPIRED' || (c.end_date && new Date(c.end_date) < today)
          ).length;
          
          // Fetch periods from each contract individually
          const periodPromises = contracts.map(async (contract) => {
            try {
              const res = await authFetch(`/api/contracts/${contract.id}/periods`);
              if (res.ok) {
                const periods = await res.json();
                return periods;
              } else {
                return [];
              }
            } catch (error) {
              return [];
            }
          });
          const periodsArrays = await Promise.all(periodPromises);
          let allPeriods = periodsArrays.flat();
          
          
          // Fallback: Try to fetch all periods at once if individual fetching failed
          if (allPeriods.length === 0 && contracts.length > 0) {
            try {
              const fallbackRes = await authFetch('/api/periods');
              if (fallbackRes.ok) {
                const fallbackPeriods = await fallbackRes.json();
                allPeriods = fallbackPeriods;
              } else {
              }
            } catch (fallbackError) {
            }
          }
          
          
          
          // Create contract lookup map for easy access
          const contractsMap = contracts.reduce((map, contract) => {
            map[contract.id] = contract;
            return map;
          }, {});
          
          // Get upcoming deadlines (next 30 days)
          const upcomingDeadlines = allPeriods
            .filter(period => {
              const dueDate = new Date(period.due_date);
              const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
              return daysDiff >= 0 && daysDiff <= 30 && period.status !== 'completed';
            })
            .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
            .slice(0, 5)
            .map(period => ({
              ...period,
              contract_title: contractsMap[period.contract_id]?.contact_name || contractsMap[period.contract_id]?.contract_no || 'ไม่ระบุชื่อสัญญา'
            }));
          
          // Get recent contracts (last 5)
          const recentContracts = contracts
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
            .slice(0, 5);
          
          
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
            
            
            return {
              ...period,
              contract_title: contractTitle,
              contract_no: matchedContract?.contract_no || matchedContract?.number || 'N/A',
              contract_department: matchedContract?.department || matchedContract?.dept || 'N/A'
            };
          });
          
          
          // Calculate period stats using enhanced periods
          const totalPeriods = enhancedPeriods.length;
          const completedPeriods = enhancedPeriods.filter(p => 
            p.status === 'เสร็จสิ้น' || 
            p.status === 'completed' || 
            p.status === 'COMPLETED'
          ).length;
          const overduePeriods = enhancedPeriods.filter(p => {
            const dueDate = new Date(p.due_date);
            const isCompleted = p.status === 'เสร็จสิ้น' || 
                               p.status === 'completed' || 
                               p.status === 'COMPLETED';
            return !isCompleted && dueDate < new Date();
          }).length;
          const pendingPeriods = enhancedPeriods.filter(p => p.status === 'รอส่งมอบ').length;
          const inProgressPeriods = enhancedPeriods.filter(p => p.status === 'กำลังดำเนินการ').length;
          
          // คำนวณงวดงานใกล้ครบกำหนด (ภายใน 7 วัน)
          const upcomingPeriods = allPeriods.filter(p => {
            if (p.status === 'เสร็จสิ้น' || !p.due_date) return false;
            const dueDate = new Date(p.due_date);
            const today = new Date();
            const diffTime = dueDate - today;
            const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return daysUntilDue >= 0 && daysUntilDue <= 7;
          });
          
          setStats({
            totalContracts,
            crtdContracts,
            activeContracts,
            expiredContracts,
            deletedContracts,
            totalPeriods: allPeriods.length,
            pendingPeriods: allPeriods.filter(p => p.status === 'pending' || p.status === 'PENDING').length,
            inProgressPeriods: allPeriods.filter(p => p.status === 'in_progress' || p.status === 'IN_PROGRESS').length,
            completedPeriods: allPeriods.filter(p => p.status === 'completed' || p.status === 'COMPLETED').length,
            upcomingDeadlines: upcomingPeriods,
            recentContracts
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('ไม่สามารถโหลดข้อมูลแดชบอร์ดได้');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [authFetch]);

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">ทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalContracts}</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">สร้างใหม่</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.crtdContracts}</p>
                  <p className="text-xs text-gray-400">({stats.totalContracts > 0 ? Math.round((stats.crtdContracts / stats.totalContracts) * 100) : 0}%)</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
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
                  <p className="text-sm font-medium text-gray-500">ลบแล้ว</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.deletedContracts}</p>
                  <p className="text-xs text-gray-400">({stats.totalContracts > 0 ? Math.round((stats.deletedContracts / stats.totalContracts) * 100) : 0}%)</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">หมดอายุ</p>
                  <p className="text-2xl font-bold text-red-600">{stats.expiredContracts}</p>
                  <p className="text-xs text-gray-400">({stats.totalContracts > 0 ? Math.round((stats.expiredContracts / stats.totalContracts) * 100) : 0}%)</p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

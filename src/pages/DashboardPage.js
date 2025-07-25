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
    pendingPeriods: 0,
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
        
        // Calculate stats
        const totalContracts = contracts.length;
        const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length;
        const crtdContracts = contracts.filter(c => c.status === 'CRTD').length;
        const expiredContracts = contracts.filter(c => c.status === 'EXPIRED').length;
        
        // Fetch periods from each contract individually
        const periodPromises = contracts.map(contract =>
          authFetch(`/api/contracts/${contract.id}/periods`, {}, token)
            .then(res => (res.ok ? res.json() : []))
            .catch(() => [])
        );
        const periodsArrays = await Promise.all(periodPromises);
        const allPeriods = periodsArrays.flat();
        
        let pendingPeriods = 0;
        let upcomingDeadlines = [];
        
        if (allPeriods.length > 0) {
          pendingPeriods = allPeriods.filter(p => p.status === 'รอส่งมอบ').length;
          
          // Get upcoming deadlines (next 7 days)
          const today = new Date();
          const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          
          upcomingDeadlines = allPeriods
            .filter(p => {
              const dueDate = new Date(p.due_date);
              return dueDate >= today && dueDate <= nextWeek && p.status === 'รอส่งมอบ';
            })
            .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
            .slice(0, 5);
        }
        
        setStats({
          totalContracts,
          activeContracts,
          crtdContracts,
          expiredContracts,
          pendingPeriods,
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">สัญญาทั้งหมด</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalContracts}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">สัญญาที่ใช้งานอยู่</p>
                <p className="text-3xl font-bold text-green-600">{stats.activeContracts}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">สัญญาสร้างใหม่</p>
                <p className="text-3xl font-bold text-blue-600">{stats.crtdContracts}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">งวดที่รอส่ง</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pendingPeriods}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
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
                      <div>
                        <p className="font-medium text-gray-900">งวดที่ {period.period_no}</p>
                        <p className="text-sm text-gray-500">{formatDateThai(period.due_date)}</p>
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

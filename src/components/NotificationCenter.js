import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import toast from 'react-hot-toast';

export default function NotificationCenter() {
  const { authFetch } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch contracts first, then periods from each contract
      const contractsRes = await authFetch('/api/contracts');
      if (contractsRes.ok) {
        const contracts = await contractsRes.json();
        
        // Fetch periods from each contract individually
        const periodPromises = contracts.map(contract =>
          authFetch(`/api/contracts/${contract.id}/periods`)
            .then(res => (res.ok ? res.json() : []))
            .catch(() => [])
        );
        const periodsArrays = await Promise.all(periodPromises);
        let periods = periodsArrays.flat();
        
        // Fallback to /api/periods if no periods found
        if (periods.length === 0 && contracts.length > 0) {
          try {
            const fallbackRes = await authFetch('/api/periods');
            if (fallbackRes.ok) {
              const fallbackPeriods = await fallbackRes.json();
              periods = fallbackPeriods;
            }
          } catch (fallbackError) {
            console.error('NotificationCenter: Fallback periods fetch failed:', fallbackError);
          }
        }
        
        // Debug: Log contracts and periods structure
        console.log('🔔 NotificationCenter - Debug contracts:', contracts.slice(0, 2).map(c => ({
          id: c.id,
          title: c.title,
          keys: Object.keys(c)
        })));
        
        console.log('🔔 NotificationCenter - Debug periods:', periods.slice(0, 2).map(p => ({
          id: p.id,
          contract_id: p.contract_id,
          keys: Object.keys(p)
        })));
        
        // Create contract lookup map for easy access
        const contractsMap = contracts.reduce((map, contract) => {
          map[contract.id] = contract;
          return map;
        }, {});
        
        console.log('🔔 NotificationCenter - contractsMap keys:', Object.keys(contractsMap));
        
        // Helper function to get contract title from various possible field names
        const getContractTitle = (contract) => {
          if (!contract) return 'ไม่ระบุสัญญา';
          
          // Use contact_name as the primary field (from database schema)
          return contract.contact_name || 
                 contract.title || 
                 contract.name || 
                 contract.contract_name || 
                 contract.project_name ||
                 contract.contract_no ||
                 `สัญญา #${contract.id}` || 
                 'ไม่ระบุสัญญา';
        };
        
        // Enhance periods with contract information
        const enhancedPeriods = periods.map(period => {
          const matchedContract = contractsMap[period.contract_id];
          const contractTitle = getContractTitle(matchedContract);
          
          console.log(`🔔 Period ${period.id} (contract_id: ${period.contract_id}) -> Contract found:`, !!matchedContract, 'Title:', contractTitle);
          
          return {
            ...period,
            contract_title: contractTitle,
            contract_no: matchedContract?.contract_no || matchedContract?.number || 'N/A',
            contract_department: matchedContract?.department || matchedContract?.dept || 'N/A'
          };
        });
        
        const now = new Date();
        
        const upcomingDeadlines = enhancedPeriods
          .filter(period => {
            // Check for pending or in-progress periods
            if (!['รอดำเนินการ', 'รอส่งมอบ', 'กำลังดำเนินการ'].includes(period.status)) return false;
            
            const dueDate = new Date(period.due_date);
            const alertDate = new Date(dueDate);
            alertDate.setDate(alertDate.getDate() - (period.alert_days || 7)); // Default 7 days alert
            
            return now >= alertDate && dueDate >= now;
          })
          .map(period => ({
            id: `deadline_${period.id}`,
            type: 'deadline',
            title: `กำหนดส่งงวดที่ ${period.period_no} - ${period.contract_title}`,
            message: `ครบกำหนดส่งในวันที่ ${new Date(period.due_date).toLocaleDateString('th-TH')}`,
            priority: getDaysUntilDeadline(period.due_date) <= 1 ? 'high' : 'medium',
            createdAt: new Date(),
            read: false,
            data: period
          }));
        
        // Fetch overdue periods
        const overduePeriods = enhancedPeriods
          .filter(period => {
            // Check for overdue periods that are not completed
            if (!['รอดำเนินการ', 'รอส่งมอบ', 'กำลังดำเนินการ'].includes(period.status)) return false;
            const dueDate = new Date(period.due_date);
            return now > dueDate;
          })
          .map(period => ({
            id: `overdue_${period.id}`,
            type: 'overdue',
            title: `งวดที่ ${period.period_no} เกินกำหนด - ${period.contract_title}`,
            message: `เกินกำหนดส่งแล้ว ${Math.ceil((now - new Date(period.due_date)) / (1000 * 60 * 60 * 24))} วัน`,
            priority: 'high',
            createdAt: new Date(),
            read: false,
            data: period
          }));
        
        const allNotifications = [...upcomingDeadlines, ...overduePeriods]
          .sort((a, b) => {
            // Sort by priority first, then by date
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
              return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
        
        setNotifications(allNotifications);
        setUnreadCount(allNotifications.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const getDaysUntilDeadline = (dateStr) => {
    const today = new Date();
    const deadline = new Date(dateStr);
    const diffTime = deadline - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const deleteAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    toast.success('ลบการแจ้งเตือนทั้งหมดแล้ว');
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (type) => {
    switch (type) {
      case 'deadline':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'overdue':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">การแจ้งเตือน</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  อ่านทั้งหมด
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={deleteAllNotifications}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  ลบทั้งหมด
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <svg className="animate-spin w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p>ไม่มีการแจ้งเตือน</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 p-1 rounded-full ${getPriorityColor(notification.priority)}`}>
                      {getPriorityIcon(notification.type)}
                    </div>
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.createdAt.toLocaleString('th-TH')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!notification.read && (
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="ลบการแจ้งเตือน"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to notifications page if exists
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                ดูการแจ้งเตือนทั้งหมด
              </button>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
}

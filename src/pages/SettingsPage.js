import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../AuthContext';
import toast from 'react-hot-toast';
import { getAuthMethodBadge, getAuthMethodDisplay } from '../utils/jwtUtils';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, token, authFetch, role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile settings
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    deadlineAlerts: true,
    overdueAlerts: true,
    weeklyReports: false,
    alertDaysBefore: 7
  });
  
  // System settings (admin only)
  const [systemSettings, setSystemSettings] = useState({
    defaultAlertDays: 7,
    maxFileSize: 10,
    allowedFileTypes: 'pdf,doc,docx,jpg,png',
    autoBackup: true,
    backupFrequency: 'daily'
  });

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const profileRes = await authFetch('/api/users/profile', {}, token);
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setProfileData(prev => ({
          ...prev,
          username: profile.username || '',
          email: profile.email || ''
        }));
      }
      
      // Fetch notification settings
      const notifRes = await authFetch('/api/settings/notifications', {}, token);
      if (notifRes.ok) {
        const settings = await notifRes.json();
        setNotificationSettings(prev => ({ ...prev, ...settings }));
      }
      
      // Fetch system settings (admin only)
      if (role === 'admin') {
        const systemRes = await authFetch('/api/settings/system', {}, token);
        if (systemRes.ok) {
          const settings = await systemRes.json();
          setSystemSettings(prev => ({ ...prev, ...settings }));
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('ไม่สามารถโหลดการตั้งค่าได้');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      toast.error('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }
    
    try {
      setLoading(true);
      
      const updateData = {
        email: profileData.email
      };
      
      if (profileData.newPassword) {
        updateData.currentPassword = profileData.currentPassword;
        updateData.password = profileData.newPassword; // Backend expects 'password', not 'newPassword'
      }
      
      const res = await authFetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      }, token);
      
      if (res.ok) {
        toast.success('อัปเดตข้อมูลส่วนตัวสำเร็จ');
        setProfileData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        const error = await res.json();
        toast.error(error.message || 'ไม่สามารถอัปเดตข้อมูลได้');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const res = await authFetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationSettings)
      }, token);
      
      if (res.ok) {
        toast.success('อัปเดตการตั้งค่าการแจ้งเตือนสำเร็จ');
      } else {
        toast.error('ไม่สามารถอัปเดตการตั้งค่าได้');
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปเดตการตั้งค่า');
    } finally {
      setLoading(false);
    }
  };

  const handleSystemUpdate = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const res = await authFetch('/api/settings/system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemSettings)
      }, token);
      
      if (res.ok) {
        toast.success('อัปเดตการตั้งค่าระบบสำเร็จ');
      } else {
        toast.error('ไม่สามารถอัปเดตการตั้งค่าได้');
      }
    } catch (error) {
      console.error('Error updating system settings:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปเดตการตั้งค่า');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'ข้อมูลส่วนตัว', icon: '👤' },
    { id: 'notifications', name: 'การแจ้งเตือน', icon: '🔔' },
    ...(role === 'admin' ? [{ id: 'system', name: 'ระบบ', icon: '⚙️' }] : [])
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">การตั้งค่า</h1>
          <p className="mt-2 text-gray-600">จัดการการตั้งค่าบัญชีและระบบของคุณ</p>
        </div>

        <div className="bg-white shadow rounded-lg">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">ข้อมูลส่วนตัว</h3>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ชื่อผู้ใช้</label>
                      <input
                        type="text"
                        value={profileData.username || user?.username || ''}
                        disabled
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">ไม่สามารถเปลี่ยนชื่อผู้ใช้ได้</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">อีเมล</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  {/* Authentication Method Info */}
                  {user?.authMethod && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">วิธีการเข้าสู่ระบบ</h4>
                      <div className="flex items-center space-x-3">
                        {(() => {
                          const badge = getAuthMethodBadge(user.authMethod);
                          return (
                            <>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${badge.className}`}>
                                <span className="mr-2">{badge.icon}</span>
                                {badge.text}
                              </span>
                              <span className="text-sm text-gray-600">
                                {getAuthMethodDisplay(user.authMethod)}
                              </span>
                            </>
                          );
                        })()} 
                      </div>
                      {user.authMethod === 'ldap' && (
                        <p className="mt-2 text-xs text-gray-500">
                          บัญชีนี้เชื่อมต่อกับระบบ LDAP - การเปลี่ยนรหัสผ่านต้องทำผ่านระบบ LDAP
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Password Change Section - Only for Local Users */}
                {user?.authMethod !== 'ldap' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">เปลี่ยนรหัสผ่าน</h3>
                    
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">รหัสผ่านปัจจุบัน</label>
                        <input
                          type="password"
                          value={profileData.currentPassword}
                          onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">รหัสผ่านใหม่</label>
                        <input
                          type="password"
                          value={profileData.newPassword}
                          onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ยืนยันรหัสผ่านใหม่</label>
                        <input
                          type="password"
                          value={profileData.confirmPassword}
                          onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                  </button>
                </div>
              </form>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <form onSubmit={handleNotificationUpdate} className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">การแจ้งเตือน</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">การแจ้งเตือนทางอีเมล</label>
                        <p className="text-sm text-gray-500">รับการแจ้งเตือนผ่านอีเมล</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">แจ้งเตือนกำหนดส่ง</label>
                        <p className="text-sm text-gray-500">แจ้งเตือนเมื่อใกล้ถึงกำหนดส่ง</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.deadlineAlerts}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, deadlineAlerts: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">แจ้งเตือนเกินกำหนด</label>
                        <p className="text-sm text-gray-500">แจ้งเตือนเมื่องานเกินกำหนดส่ง</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.overdueAlerts}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, overdueAlerts: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">รายงานสัปดาห์</label>
                        <p className="text-sm text-gray-500">รับรายงานสรุปทุกสัปดาห์</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.weeklyReports}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, weeklyReports: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        แจ้งเตือนล่วงหน้า (วัน)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={notificationSettings.alertDaysBefore}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, alertDaysBefore: parseInt(e.target.value) }))}
                        className="w-20 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                  </button>
                </div>
              </form>
            )}

            {/* System Tab (Admin only) */}
            {activeTab === 'system' && role === 'admin' && (
              <form onSubmit={handleSystemUpdate} className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">การตั้งค่าระบบ</h3>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">แจ้งเตือนล่วงหน้าเริ่มต้น (วัน)</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={systemSettings.defaultAlertDays}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, defaultAlertDays: parseInt(e.target.value) }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ขนาดไฟล์สูงสุด (MB)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={systemSettings.maxFileSize}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, maxFileSize: parseInt(e.target.value) }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ประเภทไฟล์ที่อนุญาต</label>
                      <input
                        type="text"
                        value={systemSettings.allowedFileTypes}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, allowedFileTypes: e.target.value }))}
                        placeholder="pdf,doc,docx,jpg,png"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ความถี่การสำรองข้อมูล</label>
                      <select
                        value={systemSettings.backupFrequency}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, backupFrequency: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="daily">รายวัน</option>
                        <option value="weekly">รายสัปดาห์</option>
                        <option value="monthly">รายเดือน</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={systemSettings.autoBackup}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, autoBackup: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm font-medium text-gray-700">
                        เปิดใช้งานการสำรองข้อมูลอัตโนมัติ
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

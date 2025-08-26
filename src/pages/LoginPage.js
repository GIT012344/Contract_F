import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import toast, { Toaster } from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    department: '',
    role: 'user', // Default to user role
    adminPin: '' // PIN for admin registration
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleRegisterChange = e => setRegistrationData({ ...registrationData, [e.target.name]: e.target.value });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5005';
        const response = await fetch(`${apiUrl}/api/departments/public`);
        if (response.ok) {
          const data = await response.json();
          setDepartments(data);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };
    fetchDepartments();
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setLoadingMessage('กำลังตรวจสอบข้อมูลการเข้าสู่ระบบ...');
    setError('');
    
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, password: form.password }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Success - login with new user data structure
        login(data.token, data.user);
        toast.success(data.message || 'เข้าสู่ระบบสำเร็จ');
        setTimeout(() => navigate('/dashboard'), 500);
      } else {
        // Handle different error types
        setError(data.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
        toast.error(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const openRegisterModal = () => {
    setShowRegisterModal(true);
    setRegistrationData({ username: '', password: '', confirmPassword: '', department: '', role: 'user', adminPin: '' });
  };

  const closeRegisterModal = () => {
    setShowRegisterModal(false);
    setRegistrationData({ username: '', password: '', confirmPassword: '', department: '', role: 'user', adminPin: '' });
  };

  const validateRegisterForm = () => {
    const { username, password, confirmPassword } = registrationData;
    
    if (!username.trim()) {
      toast.error('กรุณากรอกชื่อผู้ใช้');
      return false;
    }
    
    if (username.trim().length < 3) {
      toast.error('ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร');
      return false;
    }
    
    if (!password) {
      toast.error('กรุณากรอกรหัสผ่าน');
      return false;
    }
    
    if (password.length < 6) {
      toast.error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return false;
    }
    
    if (password !== confirmPassword) {
      toast.error('รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
      return false;
    }
    
    if (!registrationData.department) {
      toast.error('กรุณาเลือกหน่วยงานที่ประจำ');
      return false;
    }
    
    if (registrationData.role === 'admin' && registrationData.adminPin.length !== 6) {
      toast.error('PIN สำหรับผู้ดูแลระบบต้องมี 6 หลัก');
      return false;
    }
    
    return true;
  };

  const handleRegisterSubmit = async e => {
    e.preventDefault();
    
    if (!validateRegisterForm()) return;
    
    setRegisterLoading(true);
    try {
      const registerData = {
        username: registrationData.username,
        password: registrationData.password,
        department_id: parseInt(registrationData.department),
        role: registrationData.role,
        adminPin: registrationData.role === 'admin' ? registrationData.adminPin : undefined
      };

      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      // Registration successful
      login(data.token, data.user.role);
      toast.success(data.message || 'สมัครสมาชิกสำเร็จ!');
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(data.user));
      
      closeRegisterModal();
      setTimeout(() => navigate('/contracts'), 1000);
      
    } catch (err) {
      toast.error(err.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
    }
    setRegisterLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Toaster position="top-center" />
      
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contract Manager</h1>
          <p className="text-gray-600">ระบบจัดการสัญญา</p>
        </div>
        
        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 text-center">เข้าสู่ระบบ</h2>
            <p className="text-gray-600 text-center mt-2">กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <div className="relative">
                  <input 
                    name="username" 
                    onChange={handleChange} 
                    placeholder="กรอกชื่อผู้ใช้" 
                    required 
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white"
                    autoComplete="username"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input 
                    name="password" 
                    type="password" 
                    onChange={handleChange} 
                    placeholder="กรอกรหัสผ่าน" 
                    required 
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white"
                    autoComplete="current-password"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
              </div>
              
            </div>
            
            <div className="mt-6">
              <button 
                type="submit" 
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {loadingMessage || 'กำลังเข้าสู่ระบบ...'}
                  </>
                ) : (
                  'เข้าสู่ระบบ'
                )}
              </button>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ยังไม่มีบัญชี? {' '}
                <button 
                  type="button"
                  onClick={openRegisterModal}
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
                >
                  สมัครสมาชิก
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-green-700 flex items-center gap-2">
                <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
                สมัครสมาชิก
              </h2>
              <button 
                onClick={closeRegisterModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
              >
                ×
              </button>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={handleRegisterSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อผู้ใช้ (Username)</label>
                  <input 
                    name="username" 
                    value={registrationData.username}
                    onChange={handleRegisterChange} 
                    placeholder="กรอกชื่อผู้ใช้" 
                    required 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
                    autoComplete="username"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">รหัสผ่าน (Password)</label>
                  <input 
                    name="password" 
                    type="password" 
                    value={registrationData.password}
                    onChange={handleRegisterChange} 
                    placeholder="กรอกรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)" 
                    required 
                    minLength="6"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
                    autoComplete="new-password"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ยืนยันรหัสผ่าน</label>
                  <input 
                    name="confirmPassword" 
                    type="password" 
                    value={registrationData.confirmPassword}
                    onChange={handleRegisterChange} 
                    placeholder="กรอกรหัสผ่านอีกครั้ง" 
                    required 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
                    autoComplete="new-password"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">หน่วยงานที่ประจำ</label>
                  <select 
                    name="department" 
                    value={registrationData.department}
                    onChange={handleRegisterChange} 
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
                  >
                    <option value="">-- เลือกหน่วยงาน --</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.department_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    สิทธิ์การใช้งาน
                  </label>
                  <select
                    name="role"
                    value={registrationData.role}
                    onChange={(e) => setRegistrationData({...registrationData, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
                  >
                    <option value="user">ผู้ใช้ทั่วไป</option>
                    <option value="admin">ผู้ดูแลระบบ</option>
                  </select>
                </div>

                {registrationData.role === 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PIN สำหรับผู้ดูแลระบบ (6 หลัก)
                    </label>
                    <input
                      type="password"
                      name="adminPin"
                      value={registrationData.adminPin}
                      onChange={(e) => setRegistrationData({...registrationData, adminPin: e.target.value})}
                      maxLength="6"
                      placeholder="กรอก PIN 6 หลัก"
                      required={registrationData.role === 'admin'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button 
                  type="submit" 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold shadow transition disabled:opacity-60" 
                  disabled={registerLoading}
                >
                  {registerLoading ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin inline-block mr-2 w-4 h-4 border-2 border-white border-t-green-400 rounded-full"></span>
                      กำลังสมัครสมาชิก...
                    </span>
                  ) : (
                    'สมัครสมาชิก'
                  )}
                </button>
                
                <button 
                  type="button" 
                  onClick={closeRegisterModal}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg font-semibold shadow transition"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
            
            <div className="px-6 pb-6 text-center border-t border-gray-200 pt-4">
              <p className="text-gray-600">
                มีบัญชีอยู่แล้ว? {' '}
                <button 
                  onClick={closeRegisterModal}
                  className="text-green-600 hover:text-green-700 font-semibold hover:underline transition bg-transparent border-none cursor-pointer"
                >
                  เข้าสู่ระบบ
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

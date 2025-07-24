import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import toast, { Toaster } from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '', role: 'user' });
  const [loading, setLoading] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerForm, setRegisterForm] = useState({ 
    username: '', 
    password: '', 
    confirmPassword: '', 
    role: 'user' 
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleRegisterChange = e => setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      login(data.token, data.user.role);
      toast.success('เข้าสู่ระบบสำเร็จ');
      setTimeout(() => navigate('/contracts'), 500);
    } catch (err) {
      toast.error('Login ไม่สำเร็จ');
    }
    setLoading(false);
  };

  const openRegisterModal = () => {
    setShowRegisterModal(true);
    setRegisterForm({ username: '', password: '', confirmPassword: '', role: 'user' });
  };

  const closeRegisterModal = () => {
    setShowRegisterModal(false);
    setRegisterForm({ username: '', password: '', confirmPassword: '', role: 'user' });
  };

  const validateRegisterForm = () => {
    const { username, password, confirmPassword } = registerForm;
    
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
    
    return true;
  };

  const handleRegisterSubmit = async e => {
    e.preventDefault();
    
    if (!validateRegisterForm()) return;
    
    setRegisterLoading(true);
    try {
      const registerData = {
        username: registerForm.username.trim(),
        password: registerForm.password,
        role: registerForm.role
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <Toaster position="top-center" />
      
      {/* Login Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-blue-700 flex items-center gap-2 justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-blue-500"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118A7.5 7.5 0 0112 15.75a7.5 7.5 0 017.5 4.368" /></svg>
          เข้าสู่ระบบ
        </h2>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Username</label>
          <input name="username" onChange={handleChange} placeholder="Username" required className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" />
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Password</label>
          <input name="password" type="password" onChange={handleChange} placeholder="Password" required className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" />
        </div>
        <div className="mb-6">
          <label className="block font-semibold mb-1">Role</label>
          <select name="role" onChange={handleChange} value={form.role} className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold shadow transition disabled:opacity-60 mb-4" disabled={loading}>
          {loading ? <span className="animate-spin inline-block mr-2 w-4 h-4 border-2 border-white border-t-blue-400 rounded-full align-middle"></span> : null}
          Login
        </button>
        
        <div className="text-center">
          <p className="text-gray-600">
            ยังไม่มีบัญชี? {' '}
            <button 
              type="button"
              onClick={openRegisterModal}
              className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition bg-transparent border-none cursor-pointer"
            >
              สมัครสมาชิก
            </button>
          </p>
        </div>
      </form>

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-green-700 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-green-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
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
              <div className="mb-4">
                <label className="block font-semibold mb-1 text-gray-700">ชื่อผู้ใช้ (Username)</label>
                <input 
                  name="username" 
                  value={registerForm.username}
                  onChange={handleRegisterChange} 
                  placeholder="กรอกชื่อผู้ใช้" 
                  required 
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
                  autoComplete="username"
                />
              </div>
              
              <div className="mb-4">
                <label className="block font-semibold mb-1 text-gray-700">รหัสผ่าน (Password)</label>
                <input 
                  name="password" 
                  type="password" 
                  value={registerForm.password}
                  onChange={handleRegisterChange} 
                  placeholder="กรอกรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)" 
                  required 
                  minLength="6"
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
                  autoComplete="new-password"
                />
              </div>
              
              <div className="mb-4">
                <label className="block font-semibold mb-1 text-gray-700">ยืนยันรหัสผ่าน</label>
                <input 
                  name="confirmPassword" 
                  type="password" 
                  value={registerForm.confirmPassword}
                  onChange={handleRegisterChange} 
                  placeholder="กรอกรหัสผ่านอีกครั้ง" 
                  required 
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
                  autoComplete="new-password"
                />
              </div>
              
              <div className="mb-6">
                <label className="block font-semibold mb-1 text-gray-700">สิทธิ์การใช้งาน</label>
                <select 
                  name="role" 
                  value={registerForm.role}
                  onChange={handleRegisterChange} 
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
                >
                  <option value="user">ผู้ใช้ทั่วไป</option>
                  <option value="admin">ผู้ดูแลระบบ</option>
                </select>
              </div>
              
              <div className="flex gap-3">
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
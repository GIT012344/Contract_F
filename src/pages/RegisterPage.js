import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import toast, { Toaster } from 'react-hot-toast';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    department: '',
    role: 'user', // Default to user role
    adminPin: '' // PIN for admin registration
  });
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch('http://localhost:5005/api/departments/public');
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

  const validateForm = () => {
    if (!formData.username.trim()) {
      toast.error('กรุณากรอกชื่อผู้ใช้');
      return false;
    }
    
    if (formData.username.trim().length < 3) {
      toast.error('ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร');
      return false;
    }
    
    if (!formData.password) {
      toast.error('กรุณากรอกรหัสผ่าน');
      return false;
    }
    
    if (formData.password.length < 6) {
      toast.error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
      return false;
    }
    
    if (!formData.department) {
      toast.error('กรุณาเลือกหน่วยงานที่ประจำ');
      return false;
    }
    
    if (formData.role === 'admin' && formData.adminPin.length !== 6) {
      toast.error('PIN สำหรับผู้ดูแลระบบต้องมี 6 หลัก');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const registerData = {
        username: formData.username,
        password: formData.password,
        department_id: parseInt(formData.department),
        role: formData.role,
        adminPin: formData.role === 'admin' ? formData.adminPin : undefined
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
      
      setTimeout(() => navigate('/contracts'), 1000);
      
    } catch (err) {
      toast.error(err.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
      <Toaster position="top-center" />
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-green-700 flex items-center gap-2 justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-green-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
          </svg>
          สมัครสมาชิก
        </h2>
        
        <div className="mb-4">
          <label className="block font-semibold mb-1 text-gray-700">ชื่อผู้ใช้ (Username)</label>
          <input 
            name="username" 
            value={formData.username}
            onChange={handleChange} 
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
            value={formData.password}
            onChange={handleChange} 
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
            value={formData.confirmPassword}
            onChange={handleChange} 
            placeholder="กรอกรหัสผ่านอีกครั้ง" 
            required 
            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
            autoComplete="new-password"
          />
        </div>
        
        <div className="mb-4">
          <label className="block font-semibold mb-1 text-gray-700">หน่วยงานที่ประจำ</label>
          <select 
            name="department" 
            value={formData.department}
            onChange={handleChange} 
            required
            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
          >
            <option value="">-- เลือกหน่วยงาน --</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>
                {dept.department_name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            สิทธิ์การใช้งาน
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
          >
            <option value="user">ผู้ใช้ทั่วไป</option>
            <option value="admin">ผู้ดูแลระบบ</option>
          </select>
        </div>

        {formData.role === 'admin' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PIN สำหรับผู้ดูแลระบบ (6 หลัก)
            </label>
            <input
              type="password"
              name="adminPin"
              value={formData.adminPin}
              onChange={handleChange}
              maxLength="6"
              placeholder="กรอก PIN 6 หลัก"
              required={formData.role === 'admin'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
            />
          </div>
        )}
        
        <button 
          type="submit" 
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold shadow transition disabled:opacity-60 mb-4" 
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <span className="animate-spin inline-block mr-2 w-4 h-4 border-2 border-white border-t-green-400 rounded-full"></span>
              กำลังสมัครสมาชิก...
            </span>
          ) : (
            'สมัครสมาชิก'
          )}
        </button>
        
        <div className="text-center">
          <p className="text-gray-600">
            มีบัญชีอยู่แล้ว? {' '}
            <Link 
              to="/login" 
              className="text-green-600 hover:text-green-700 font-semibold hover:underline transition"
            >
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

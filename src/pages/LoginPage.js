import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import toast, { Toaster } from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '', role: 'user' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

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
      login(data.token, form.role);
      toast.success('เข้าสู่ระบบสำเร็จ');
      setTimeout(() => navigate('/contracts'), 500);
    } catch (err) {
      toast.error('Login ไม่สำเร็จ');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <Toaster position="top-center" />
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
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold shadow transition disabled:opacity-60" disabled={loading}>
          {loading ? <span className="animate-spin inline-block mr-2 w-4 h-4 border-2 border-white border-t-blue-400 rounded-full align-middle"></span> : null}
          Login
        </button>
      </form>
    </div>
  );
} 
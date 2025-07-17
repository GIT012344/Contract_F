import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', form.role);
      navigate('/contracts');
    } catch (err) {
      setError('Login ไม่สำเร็จ');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto mt-20 p-6 bg-white rounded shadow">
      <h2 className="text-xl mb-4 font-bold">เข้าสู่ระบบ</h2>
      <input name="username" onChange={handleChange} placeholder="Username" required className="block w-full mb-2 p-2 border rounded" />
      <input name="password" type="password" onChange={handleChange} placeholder="Password" required className="block w-full mb-2 p-2 border rounded" />
      <select name="role" onChange={handleChange} value={form.role} className="block w-full mb-4 p-2 border rounded">
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Login</button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </form>
  );
} 
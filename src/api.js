const API_URL = '/api';

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(API_URL + path, { ...options, headers });
  if (res.status === 401) {
    window.location = '/login';
    return;
  }
  if (res.status === 403) {
    alert('ไม่มีสิทธิ์');
    throw new Error('Forbidden');
  }
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'เกิดข้อผิดพลาด');
  }
  return res.json();
} 
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch, useAuth } from '../AuthContext';
import LogoutButton from '../components/LogoutButton';
import AddContract from '../components/AddContract';

function daysLeft(endDate) {
  if (!endDate) return '-';
  const d = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
  return d >= 0 ? d + ' วัน' : 'หมดอายุ';
}

export default function ContractListPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState({ number: '', name: '', department: '', start: '', end: '' });
  const [showAdd, setShowAdd] = useState(false);
  const navigate = useNavigate();
  const { token, role } = useAuth();

  useEffect(() => {
    setLoading(true);
    authFetch('/api/contracts', {}, token)
      .then(async res => {
        if (res.status === 401) throw new Error('Session หมดอายุ');
        if (!res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ');
        return res.json();
      })
      .then(setContracts)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleRowClick = id => navigate(`/contracts/${id}`);

  const filtered = contracts.filter(c =>
    (!search.number || c.number?.includes(search.number)) &&
    (!search.name || c.name?.includes(search.name)) &&
    (!search.department || c.department?.includes(search.department)) &&
    (!search.start || (c.startDate && c.startDate >= search.start)) &&
    (!search.end || (c.endDate && c.endDate <= search.end))
  );

  const handleAddSuccess = () => {
    setShowAdd(false);
    setLoading(true);
    authFetch('/api/contracts', {}, token)
      .then(async res => res.ok ? res.json() : [])
      .then(setContracts)
      .finally(() => setLoading(false));
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 px-2 md:px-0">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-blue-700 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-500"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75A2.25 2.25 0 0014.25 4.5h-7.5A2.25 2.25 0 004.5 6.75v10.5A2.25 2.25 0 006.75 19.5h7.5a2.25 2.25 0 002.25-2.25v-3.75m-6-2.25h11.25m0 0l-3-3m3 3l-3 3" /></svg>
          รายการสัญญา
        </h1>
        <div className="flex items-center gap-2">
          {role === 'admin' && (
            <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold shadow transition text-lg" onClick={() => setShowAdd(true)}>
              + เพิ่มสัญญา
            </button>
          )}
          <LogoutButton />
        </div>
      </div>
      <div className="bg-gray-50 rounded-xl p-4 mb-6 shadow flex flex-col md:flex-row md:items-end gap-3 md:gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">เลขที่สัญญา</label>
          <input className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" placeholder="ค้นหาเลขที่สัญญา" value={search.number} onChange={e => setSearch(s => ({ ...s, number: e.target.value }))} />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">ชื่อ</label>
          <input className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" placeholder="ค้นหาชื่อ" value={search.name} onChange={e => setSearch(s => ({ ...s, name: e.target.value }))} />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">หน่วยงาน</label>
          <input className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" placeholder="ค้นหาหน่วยงาน" value={search.department} onChange={e => setSearch(s => ({ ...s, department: e.target.value }))} />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">วันที่เริ่ม</label>
          <input className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" type="date" value={search.start} onChange={e => setSearch(s => ({ ...s, start: e.target.value }))} />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">วันที่สิ้นสุด</label>
          <input className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" type="date" value={search.end} onChange={e => setSearch(s => ({ ...s, end: e.target.value }))} />
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <span className="animate-spin inline-block w-8 h-8 border-4 border-blue-400 border-t-white rounded-full"></span>
        </div>
      ) : error ? (
        <div className="text-red-600 font-semibold text-center py-6">{error}</div>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow">
          <table className="w-full text-sm md:text-base">
            <thead>
              <tr className="bg-blue-100 text-blue-800">
                <th className="p-3 font-bold">เลขที่สัญญา</th>
                <th className="p-3 font-bold">ชื่อ</th>
                <th className="p-3 font-bold">หน่วยงาน</th>
                <th className="p-3 font-bold">สถานะ</th>
                <th className="p-3 font-bold">วันที่เหลือ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-gray-400 py-8">ไม่พบข้อมูล</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="hover:bg-blue-50 cursor-pointer transition" onClick={() => handleRowClick(c.id)}>
                  <td className="p-3 border-b">{c.contract_no}</td>
                  <td className="p-3 border-b">{c.contact_name}</td>
                  <td className="p-3 border-b">{c.department}</td>
                  <td className="p-3 border-b">{c.status}</td>
                  <td className="p-3 border-b">{['EXPIRED','DELETED'].includes(c.status) ? '-' : daysLeft(c.end_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-xl relative">
            <button className="absolute right-2 top-2 text-gray-400 text-2xl" onClick={() => setShowAdd(false)}>×</button>
            <AddContract onSuccess={handleAddSuccess} onClose={() => setShowAdd(false)} />
          </div>
        </div>
      )}
    </div>
  );
} 
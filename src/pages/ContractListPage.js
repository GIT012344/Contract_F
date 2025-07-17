import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';

export default function ContractListPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    apiFetch('/contracts')
      .then(setContracts)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleRowClick = id => navigate(`/contracts/${id}`);

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">รายการสัญญา</h1>
      <input
        className="mb-4 p-2 border rounded w-full"
        placeholder="ค้นหา... (เลขที่สัญญา, ชื่อ, หน่วยงาน ฯลฯ)"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {loading ? <div>Loading...</div> : error ? <div className="text-red-600">{error}</div> : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">เลขที่สัญญา</th>
              <th className="border p-2">ชื่อ</th>
              <th className="border p-2">หน่วยงาน</th>
              <th className="border p-2">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {contracts.filter(c =>
              !search ||
              c.number?.includes(search) ||
              c.name?.includes(search) ||
              c.department?.includes(search)
            ).map(c => (
              <tr key={c.id} className="hover:bg-blue-50 cursor-pointer" onClick={() => handleRowClick(c.id)}>
                <td className="border p-2">{c.number}</td>
                <td className="border p-2">{c.name}</td>
                <td className="border p-2">{c.department}</td>
                <td className="border p-2">{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 
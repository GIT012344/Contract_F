import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';

export default function ContractDetailPage() {
  const { id } = useParams();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    apiFetch(`/contracts/${id}`)
      .then(setContract)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!contract) return <div>ไม่พบข้อมูล</div>;

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <button className="mb-4 text-blue-600" onClick={() => navigate(-1)}>&larr; กลับ</button>
      <h2 className="text-xl font-bold mb-2">รายละเอียดสัญญา</h2>
      <div className="bg-white p-4 rounded shadow">
        <div><b>เลขที่สัญญา:</b> {contract.number}</div>
        <div><b>ชื่อ:</b> {contract.name}</div>
        <div><b>หน่วยงาน:</b> {contract.department}</div>
        <div><b>สถานะ:</b> {contract.status}</div>
        {/* เพิ่ม field อื่น ๆ ตามต้องการ */}
      </div>
    </div>
  );
} 
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Layout from '../components/Layout';
import AddContract from '../components/AddContract';
import { printContract } from '../utils/printUtils';
import toast from 'react-hot-toast';

function PeriodModal({ open, onClose, onSave, initial }) {
  // Helper function to format date from ISO to yyyy-MM-dd
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    // If already in yyyy-MM-dd format, return as is
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
    // Convert ISO date to yyyy-MM-dd
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [number, setNumber] = useState(initial?.periodNo || initial?.period_no || '');
  const [dueDate, setDueDate] = useState(formatDateForInput(initial?.dueDate || initial?.due_date));
  const [alertDays, setAlertDays] = useState(initial?.alert_days ?? 0);
  const [status, setStatus] = useState(initial?.status || 'รอดำเนินการ');
  const [error, setError] = useState('');
  const inputRef = useRef();

  useEffect(() => {
    setNumber(initial?.periodNo || initial?.period_no || '');
    setDueDate(formatDateForInput(initial?.dueDate || initial?.due_date));
    setAlertDays(initial?.alert_days ?? 0);
    setStatus(initial?.status || 'รอดำเนินการ');
    setError('');
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    // ปิด modal ด้วย ESC
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, initial, onClose]);
  if (!open) return null;
  // ปิด modal ด้วยคลิกนอกกล่อง
  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fadein" onClick={handleOverlayClick}>
      <div className="bg-white p-6 rounded-2xl shadow-xl w-80 relative animate-popin">
        <button aria-label="ปิด" className="absolute right-2 top-2 text-gray-400 text-2xl hover:text-gray-600" onClick={onClose}>×</button>
        <h3 className="font-bold mb-4 text-lg text-blue-700 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>
          {initial ? 'แก้ไข' : 'เพิ่ม'} งวดงาน
        </h3>
        <div className="mb-3">
          <label className="block text-sm font-semibold mb-1">รหัสงวด</label>
          <input ref={inputRef} className="border rounded w-full p-2 focus:ring-2 focus:ring-blue-400" value={number} onChange={e => setNumber(e.target.value)} placeholder="เช่น P001" aria-label="รหัสงวด" />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-semibold mb-1">วันที่กำหนดส่ง</label>
          <input type="date" className="border rounded w-full p-2 focus:ring-2 focus:ring-blue-400" value={dueDate || ''} onChange={e => setDueDate(e.target.value)} placeholder="เลือกวันที่" aria-label="วันที่กำหนดส่ง" />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-semibold mb-1">แจ้งเตือนล่วงหน้า (วัน)</label>
          <input type="number" min="0" className="border rounded w-full p-2 focus:ring-2 focus:ring-blue-400" value={alertDays} onChange={e => setAlertDays(Number(e.target.value))} placeholder="0 = ไม่แจ้งเตือน" aria-label="แจ้งเตือนล่วงหน้า (วัน)" />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-semibold mb-1">สถานะ</label>
          <select 
            className="border rounded w-full p-2 focus:ring-2 focus:ring-blue-400" 
            value={status} 
            onChange={e => setStatus(e.target.value)}
            aria-label="สถานะงวดงาน"
          >
            <option value="รอดำเนินการ">รอดำเนินการ</option>
            <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
            <option value="เสร็จสิ้น">เสร็จสิ้น</option>
          </select>
        </div>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <div className="flex gap-2 mt-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition flex-1 flex items-center justify-center gap-1" onClick={() => {
            if (!number || !dueDate) { setError('กรุณากรอกข้อมูลให้ครบ'); return; }
            // ส่ง id กลับไปด้วยถ้าเป็นการแก้ไข
            const saveData = { 
              period_no: number, // Allow string values
              due_date: dueDate, 
              alert_days: alertDays, 
              status 
            };
            if (initial?.id) saveData.id = initial.id;
            onSave(saveData);
          }} aria-label="บันทึก">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            บันทึก
          </button>
          <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold shadow transition flex-1" onClick={onClose} aria-label="ยกเลิก">ยกเลิก</button>
        </div>
      </div>
    </div>
  );
}


// ฟังก์ชันแปลงวันที่แบบไทยพร้อมไอคอน
function formatDateThaiWithIcon(dateStr) {
  if (!dateStr) return <span className="text-gray-400">-</span>;
  const d = new Date(dateStr);
  return (
    <span className="inline-flex items-center gap-1">
      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      {d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: '2-digit' })}
    </span>
  );
}
// ฟังก์ชันแสดง badge สถานะ
function StatusBadge({ status }) {
  const color = status === 'CRTD' ? 'bg-blue-100 text-blue-700' :
    status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
    status === 'EXPIRED' ? 'bg-gray-200 text-gray-600' :
    status === 'DELETED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400';
  return <span className={`px-2 py-1 rounded-full text-xs font-bold ${color}`}>{status || '-'}</span>;
}
// ฟังก์ชันแสดงแจ้งเตือนล่วงหน้า
function AlertDaysCell({ days }) {
  if (!days || days <= 0) return <span className="text-gray-300">-</span>;
  return (
    <span className="inline-flex items-center gap-1 text-yellow-700 font-semibold">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
      {days} วัน
    </span>
  );
}

export default function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user, authFetch } = useAuth();
  const [contract, setContract] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [error, setError] = useState(null);
  const [periodModal, setPeriodModal] = useState({ open: false, initial: null });
  const [showEditModal, setShowEditModal] = useState(false);

  const handleDeleteContract = async () => {
    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบสัญญานี้?')) {
      return;
    }
    try {
      const response = await authFetch(`/api/contracts/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        alert('ลบสัญญาเรียบร้อยแล้ว');
        navigate('/contracts');
      } else {
        const error = await response.text();
        alert('ไม่สามารถลบสัญญาได้: ' + error);
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบสัญญา');
    }
  };

  useEffect(() => {
    const loadContract = async () => {
      try {
        const res = await authFetch(`/api/contracts/${id}`);
        if (res.ok) {
          const data = await res.json();
          // Extract periods from the contract data
          if (data.periods) {
            setPeriods(data.periods);
            delete data.periods; // Remove periods from contract object
          }
          setContract(data);
        } else {
          setError('ไม่สามารถโหลดข้อมูลสัญญาได้');
        }
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    };

    if (id) {
      loadContract();
    }
  }, [id, authFetch]);

  const handlePrint = () => {
    printContract(contract, periods);
  };

  const isLocked = contract && (contract.status === 'EXPIRED' || contract.status === 'DELETED');

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/contracts')} 
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              กลับไปรายการสัญญา
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              รายละเอียดสัญญา
            </h1>
          </div>
        </div>
        {/* Contract Information Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">ข้อมูลสัญญา</h2>
            <div className="ml-auto flex gap-2">
              <button 
                onClick={handlePrint} 
                className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                พิมพ์
              </button>
              {(user.role === 'admin') && (
                <>
                  <button 
                    onClick={() => setShowEditModal(true)} 
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h6v-6l9-9a2.121 2.121 0 10-3-3l-9 9z" />
                    </svg>
                    แก้ไข
                  </button>
                  <button 
                    onClick={handleDeleteContract} 
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    ลบ
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-blue-100 rounded">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">เลขที่สัญญา</p>
                  <p className="text-lg font-semibold text-gray-900">{contract?.contract_no || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1 bg-indigo-100 rounded">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">วันที่เริ่มต้น</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {contract?.start_date ? new Date(contract.start_date).toLocaleDateString('th-TH') : '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1 bg-red-100 rounded">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">วันที่สิ้นสุด</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {contract?.end_date ? new Date(contract.end_date).toLocaleDateString('th-TH') : '-'}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-orange-100 rounded">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">หน่วยงาน</p>
                  <p className="text-lg font-semibold text-gray-900">{contract?.department || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1 bg-purple-100 rounded">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">จำนวนงวด</p>
                  <p className="text-lg font-semibold text-gray-900">{periods.length || 0} งวด</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1 bg-green-100 rounded">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">สถานะ</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    contract?.status === 'active' ? 'bg-green-100 text-green-800' :
                    contract?.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    contract?.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {contract?.status || '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* งวดงาน */}
        <div className="mb-8">
          <h3 className="font-bold mb-2 text-blue-700">งวดงาน</h3>
          {(user.role === 'admin') && <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded-lg font-semibold shadow mb-2 transition" onClick={() => setPeriodModal({ open: true, initial: null })}>+ เพิ่มงวดงาน</button>}
          {periods.length === 0 ? (
            <div className="text-gray-400 text-center py-8">ไม่มีงวดงาน</div>
          ) : (
            <div className="overflow-x-auto rounded-xl shadow">
              <table className="w-full text-sm md:text-base">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-200 via-blue-100 to-blue-200 text-blue-900 text-base">
                    <th className="p-4 font-bold text-center"><span className="inline-flex items-center gap-1"><svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 6h18M3 14h18M3 18h18" /></svg>เลขงวด</span></th>
                    <th className="p-4 font-bold text-center"><span className="inline-flex items-center gap-1"><svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>วันที่กำหนดส่ง</span></th>
                    <th className="p-4 font-bold text-center"><span className="inline-flex items-center gap-1"><svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>แจ้งเตือนล่วงหน้า</span></th>
                    <th className="p-4 font-bold text-center">สถานะ</th>
                    {(user.role === 'admin') && <th className="p-4 font-bold text-center">จัดการ</th>}
                  </tr>
                </thead>
                <tbody>
                  {periods.length === 0 ? (
                    <tr><td colSpan={(user.role === 'admin') ? 5 : 4} className="text-center text-gray-400 py-10 text-lg">ไม่มีงวดงาน</td></tr>
                  ) : periods.map(p => (
                    <tr key={p.id} className="transition hover:bg-blue-50 even:bg-blue-50/50 text-base">
                      <td className="p-4 border-b text-right font-mono text-lg">{p.period_no || '-'}</td>
                      <td className="p-4 border-b text-center">{formatDateThaiWithIcon(p.due_date)}</td>
                      <td className="p-4 border-b text-center"><AlertDaysCell days={p.alert_days} /></td>
                      <td className="p-4 border-b text-center"><StatusBadge status={p.status} /></td>
                      {(user.role === 'admin') && <td className="p-4 border-b text-center">
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2 justify-center">
                            <button className="text-green-600 hover:text-green-800 underline flex items-center gap-1 group" aria-label="เสร็จสิ้น" title="เสร็จสิ้น" onClick={async () => {
                              if (!window.confirm('ยืนยันการทำเครื่องหมายงวดงานนี้เป็นเสร็จสิ้น?')) return;
                              const res = await authFetch(`/api/contracts/${id}/periods/${p.id}/complete`, { 
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'COMPLETED' })
                              });
                              if (res.ok) {
                                toast.success('อัพเดทสถานะงวดงานสำเร็จ');
                                const newPeriods = [...periods];
                                const index = newPeriods.findIndex(period => period.id === p.id);
                                if (index !== -1) {
                                  newPeriods[index].status = 'COMPLETED';
                                  setPeriods(newPeriods);
                                }
                              } else {
                                const error = await res.text();
                                toast.error(error || 'ไม่สามารถอัพเดทสถานะงวดงานได้');
                              }
                            }}><svg className="w-4 h-4 group-hover:scale-110 transition" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>เสร็จสิ้น</button>
                            <button className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1 group" aria-label="แก้ไข" title="แก้ไข" onClick={() => setPeriodModal({ open: true, initial: p })}><svg className="w-4 h-4 group-hover:scale-110 transition" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h6v-6l9-9a2.121 2.121 0 10-3-3l-9 9z" /></svg>แก้ไข</button>
                            <button className="text-red-600 hover:text-red-800 underline flex items-center gap-1 group" aria-label="ลบ" title="ลบ" onClick={async () => {
                              if (!window.confirm('ยืนยันการลบงวดงานนี้?')) return;
                              const res = await authFetch(`/api/contracts/${id}/periods/${p.id}`, { method: 'DELETE' });
                              if (res.ok) {
                                toast.success('ลบงวดงานสำเร็จ');
                                setPeriods(periods.filter(period => period.id !== p.id));
                              } else {
                                const error = await res.text();
                                toast.error(error || 'ไม่สามารถลบงวดงานได้');
                              }
                            }}><svg className="w-4 h-4 group-hover:scale-110 transition" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>ลบ</button>
                          </div>
                          {p.status !== 'เสร็จสิ้น' && (
                            <button 
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 justify-center"
                              onClick={async () => {
                                if (!window.confirm('ยืนยันการเปลี่ยนสถานะเป็น เสร็จสิ้น?')) return;
                                const res = await authFetch(`/api/contracts/${id}/periods/${p.id}`, { 
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ 
                                    period_no: p.period_no,
                                    due_date: p.due_date,
                                    alert_days: p.alert_days || 0,
                                    status: 'เสร็จสิ้น' 
                                  })
                                });
                                if (res.ok) {
                                  toast.success('อัพเดทสถานะเป็น เสร็จสิ้น สำเร็จ');
                                  const newPeriods = [...periods];
                                  const index = newPeriods.findIndex(period => period.id === p.id);
                                  if (index !== -1) {
                                    newPeriods[index].status = 'เสร็จสิ้น';
                                    setPeriods(newPeriods);
                                  }
                                } else {
                                  const error = await res.text();
                                  toast.error(error || 'ไม่สามารถอัพเดทสถานะได้');
                                }
                              }}
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              เสร็จสิ้น
                            </button>
                          )}
                          {p.status === 'เสร็จสิ้น' && (
                            <button 
                              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 justify-center"
                              onClick={async () => {
                                if (!window.confirm('ยืนยันการเปลี่ยนสถานะเป็น รอดำเนินการ?')) return;
                                const res = await authFetch(`/api/contracts/${id}/periods/${p.id}`, { 
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ 
                                    period_no: p.period_no,
                                    due_date: p.due_date,
                                    alert_days: p.alert_days || 0,
                                    status: 'รอดำเนินการ' 
                                  })
                                });
                                if (res.ok) {
                                  toast.success('อัพเดทสถานะเป็น รอดำเนินการ สำเร็จ');
                                  const newPeriods = [...periods];
                                  const index = newPeriods.findIndex(period => period.id === p.id);
                                  if (index !== -1) {
                                    newPeriods[index].status = 'รอดำเนินการ';
                                    setPeriods(newPeriods);
                                  }
                                } else {
                                  const error = await res.text();
                                  toast.error(error || 'ไม่สามารถอัพเดทสถานะได้');
                                }
                              }}
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              รอดำเนินการ
                            </button>
                          )}
                        </div>
                      </td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <PeriodModal open={periodModal.open} onClose={() => setPeriodModal({ open: false, initial: null })} onSave={async (data) => {
          const periodId = data.id || periodModal.initial?.id || periodModal.initial?.period_id;
          const isEdit = !!periodId;
          const method = isEdit ? 'PUT' : 'POST';
          const url = isEdit ? `/api/contracts/${id}/periods/${periodId}` : `/api/contracts/${id}/periods`;
          if (data.alert_days === undefined || data.alert_days === null) {
            toast.error('กรุณากรอกจำนวนวันแจ้งเตือนล่วงหน้า');
            return;
          }
          // ลบ id ออกจาก data ก่อนส่งไป backend
          const { id: _, ...periodData } = data;
          const res = await authFetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(periodData)
          });
          if (res.ok) {
            toast.success(isEdit ? 'แก้ไขงวดงานสำเร็จ' : 'เพิ่มงวดงานสำเร็จ');
            setPeriodModal({ open: false, initial: null });
            const newPeriods = [...periods];
            if (isEdit) {
              const index = newPeriods.findIndex(period => period.id === periodId);
              if (index !== -1) {
                newPeriods[index] = { ...newPeriods[index], ...periodData };
              }
            } else {
              newPeriods.push({ id: Math.floor(Math.random() * 1000000), ...periodData });
            }
            setPeriods(newPeriods);
          } else {
            const error = await res.text();
            toast.error(error || 'บันทึกงวดงานไม่สำเร็จ');
          }
        }} initial={periodModal.initial} />
      </div>
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-xl relative">
            <button className="absolute right-2 top-2 text-gray-400 text-2xl" onClick={() => setShowEditModal(false)}>×</button>
            <AddContract initial={contract} onSuccess={async () => { setShowEditModal(false); }} onClose={() => setShowEditModal(false)} />
          </div>
        </div>
      )}
    </Layout>
  );
}
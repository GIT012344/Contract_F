import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authFetch, useAuth } from '../AuthContext';
import Layout from '../components/Layout';
import AddContract from '../components/AddContract';
import { printContract } from '../utils/printUtils';
import toast, { Toaster } from 'react-hot-toast';

function PeriodModal({ open, onClose, onSave, initial }) {
  const [number, setNumber] = useState(initial?.periodNo || initial?.period_no || '');
  const [dueDate, setDueDate] = useState(initial?.dueDate || initial?.due_date || '');
  const [alertDays, setAlertDays] = useState(initial?.alert_days ?? 0);
  const [error, setError] = useState('');
  const inputRef = useRef();

  useEffect(() => {
    setNumber(initial?.periodNo || initial?.period_no || '');
    setDueDate(initial?.dueDate || initial?.due_date || '');
    setAlertDays(initial?.alert_days ?? 0);
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
          <label className="block text-sm font-semibold mb-1">เลขงวด</label>
          <input ref={inputRef} className="border rounded w-full p-2 focus:ring-2 focus:ring-blue-400" value={number} onChange={e => setNumber(e.target.value.replace(/[^0-9]/g, ''))} placeholder="เช่น 1" aria-label="เลขงวด" />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-semibold mb-1">วันที่กำหนดส่ง</label>
          <input type="date" className="border rounded w-full p-2 focus:ring-2 focus:ring-blue-400" value={dueDate} onChange={e => setDueDate(e.target.value)} placeholder="เลือกวันที่" aria-label="วันที่กำหนดส่ง" />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-semibold mb-1">แจ้งเตือนล่วงหน้า (วัน)</label>
          <input type="number" min="0" className="border rounded w-full p-2 focus:ring-2 focus:ring-blue-400" value={alertDays} onChange={e => setAlertDays(Number(e.target.value))} placeholder="0 = ไม่แจ้งเตือน" aria-label="แจ้งเตือนล่วงหน้า (วัน)" />
        </div>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <div className="flex gap-2 mt-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition flex-1 flex items-center justify-center gap-1" onClick={() => {
            if (!number || !dueDate) { setError('กรุณากรอกข้อมูลให้ครบ'); return; }
            onSave({ periodNo: Number(number), dueDate, alert_days: alertDays });
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

// เพิ่มฟังก์ชันแปลงวันที่ให้อ่านง่าย
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });
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
  const [contract, setContract] = useState(null);
  const [files, setFiles] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [periodModal, setPeriodModal] = useState({ open: false, initial: null });
  const [periodMsg, setPeriodMsg] = useState('');
  const [periodError, setPeriodError] = useState('');
  const fileInputRef = useRef();
  const navigate = useNavigate();
  const { token, role } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      authFetch(`/api/contracts/${id}`, {}, token).then(async res => {
        if (res.status === 401) throw new Error('Session หมดอายุ');
        if (!res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ');
        return res.json();
      }),
      authFetch(`/api/contracts/${id}/files`, {}, token).then(async res => {
        if (!res.ok) return [];
        return res.json();
      }),
      authFetch(`/api/contracts/${id}/periods`, {}, token).then(async res => {
        if (!res.ok) return [];
        return res.json();
      })
    ])
      .then(([contract, files, periods]) => {
        setContract(contract);
        setFiles(files);
        setPeriods(periods);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, token]);

  const refreshFiles = async () => {
    setFileLoading(true);
    const res = await authFetch(`/api/contracts/${id}/files`, {}, token);
    if (res.ok) setFiles(await res.json());
    setFileLoading(false);
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('ยืนยันการลบไฟล์นี้?')) return;
    setFileLoading(true);
    const res = await authFetch(`/api/contracts/${id}/files/${fileId}`, { method: 'DELETE' }, token);
    if (res.ok) {
      toast.success('ลบไฟล์สำเร็จ');
      await refreshFiles();
    } else {
      toast.error('ลบไฟล์ไม่สำเร็จ');
      setFileLoading(false);
    }
  };

  const handleUpload = async e => {
    e.preventDefault();
    setUploadError('');
    setUploadSuccess('');
    const filesToUpload = fileInputRef.current.files;
    if (!filesToUpload.length) {
      toast.error('กรุณาเลือกไฟล์');
      return;
    }
    if (files.length + filesToUpload.length > 5) {
      toast.error('แนบไฟล์ได้สูงสุด 5 ไฟล์/สัญญา');
      return;
    }
    const formData = new FormData();
    for (let i = 0; i < filesToUpload.length; i++) {
      formData.append('files', filesToUpload[i]);
    }
    setUploading(true);
    const res = await fetch(`/api/contracts/${id}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    setUploading(false);
    if (res.ok) {
      toast.success('อัปโหลดไฟล์สำเร็จ');
      fileInputRef.current.value = '';
      await refreshFiles();
    } else {
      toast.error('อัปโหลดไฟล์ไม่สำเร็จ');
    }
  };

  const refreshPeriods = async () => {
    const res = await authFetch(`/api/contracts/${id}/periods`, {}, token);
    if (res.ok) setPeriods(await res.json());
  };

  const handleAddPeriod = () => setPeriodModal({ open: true, initial: null });
  const handleEditPeriod = (period) => setPeriodModal({ open: true, initial: period });
  const handleDeletePeriod = async (periodId) => {
    if (!window.confirm('ยืนยันการลบงวดงานนี้?')) return;
    setPeriodMsg(''); setPeriodError('');
    // ใช้ endpoint DELETE /api/contracts/periods/:id
    const res = await authFetch(`/api/contracts/periods/${periodId}`, { method: 'DELETE' }, token);
    if (res.ok) {
      toast.success('ลบงวดงานสำเร็จ');
      await refreshPeriods();
    } else {
      toast.error('ลบงวดงานไม่สำเร็จ');
    }
  };
  const handleSavePeriod = async (data) => {
    setPeriodMsg(''); setPeriodError('');
    const isEdit = !!periodModal.initial;
    const url = isEdit ? `/api/contracts/${id}/periods/${periodModal.initial.id}` : `/api/contracts/${id}/periods`;
    const method = isEdit ? 'PUT' : 'POST';
    // ตรวจสอบว่ามี alert_days
    if (typeof data.alert_days === 'undefined') {
      toast.error('กรุณากรอกจำนวนวันแจ้งเตือนล่วงหน้า');
      return;
    }
    const res = await authFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }, token);
    if (res.ok) {
      toast.success(isEdit ? 'แก้ไขงวดงานสำเร็จ' : 'เพิ่มงวดงานสำเร็จ');
      setPeriodModal({ open: false, initial: null });
      await refreshPeriods();
    } else {
      toast.error('บันทึกงวดงานไม่สำเร็จ');
    }
  };

  const refreshContract = async () => {
    const res = await authFetch(`/api/contracts/${id}`, {}, token);
    if (res.ok) setContract(await res.json());
  };

  if (loading) return <div className="flex justify-center items-center py-10"><span className="animate-spin inline-block w-8 h-8 border-4 border-blue-400 border-t-white rounded-full"></span></div>;
  if (error) return <div className="text-red-600 font-semibold text-center py-6">{error}</div>;
  if (!contract) return <div className="text-gray-400 text-center py-10">ไม่พบข้อมูล</div>;

  const handleEdit = () => setShowEdit(true);
  const handleDelete = async () => {
    if (!window.confirm('ยืนยันการลบสัญญานี้?')) return;
    setDeleteMsg(""); setDeleteError("");
    const res = await authFetch(`/api/contracts/${id}`, { method: 'DELETE' }, token);
    if (res.ok) {
      toast.success('ลบสัญญาสำเร็จ');
      setTimeout(() => { navigate('/contracts'); }, 1000);
    } else {
      toast.error('ลบสัญญาไม่สำเร็จ');
    }
  };

  const handlePrint = () => {
    printContract(contract, periods);
  };

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
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
              {role === 'admin' && (
                <>
                  <button 
                    onClick={handleEdit} 
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h6v-6l9-9a2.121 2.121 0 10-3-3l-9 9z" />
                    </svg>
                    แก้ไข
                  </button>
                  <button 
                    onClick={handleDelete} 
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
                  <p className="text-lg font-semibold text-gray-900">{contract.contract_no || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1 bg-purple-100 rounded">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">ชื่อผู้ติดต่อ</p>
                  <p className="text-lg font-semibold text-gray-900">{contract.contact_name || '-'}</p>
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
                  <p className="text-lg font-semibold text-gray-900">{contract.department || '-'}</p>
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
                    contract.status === 'active' ? 'bg-green-100 text-green-800' :
                    contract.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    contract.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {contract.status || '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* File Upload Section */}
        {role === 'admin' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">อัปโหลดไฟล์</h2>
            </div>
            <form onSubmit={handleUpload} className="flex items-center gap-4">
              <div className="flex-1">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  multiple 
                  accept="*" 
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded-lg p-2"
                />
              </div>
              <button 
                type="submit" 
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังอัปโหลด...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    อัปโหลดไฟล์
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      {/* แจ้งเตือนอัปโหลด/ลบ/แก้ไข */}
      {uploadError && <div className="text-red-600 mb-2 font-semibold">{uploadError}</div>}
      {uploadSuccess && <div className="text-green-600 mb-2 font-semibold">{uploadSuccess}</div>}
      {deleteMsg && <div className="text-green-600 mb-2 font-semibold">{deleteMsg}</div>}
      {deleteError && <div className="text-red-600 mb-2 font-semibold">{deleteError}</div>}
      {/* ไฟล์แนบ */}
      <div className="mb-8">
        <h3 className="font-bold mb-2 text-blue-700">ไฟล์แนบ</h3>
        {fileLoading ? <div className="flex justify-center py-4"><span className="animate-spin inline-block w-6 h-6 border-4 border-blue-400 border-t-white rounded-full"></span></div> : files.length === 0 ? <div className="text-gray-400">ไม่มีไฟล์แนบ</div> : (
          <div className="overflow-x-auto rounded-xl shadow">
            <table className="w-full text-sm md:text-base">
              <thead>
                <tr className="bg-blue-100 text-blue-800">
                  <th className="p-3 font-bold">ชื่อไฟล์</th>
                  <th className="p-3 font-bold">ดาวน์โหลด</th>
                  {role === 'admin' && <th className="p-3 font-bold">ลบ</th>}
                </tr>
              </thead>
              <tbody>
                {files.map(f => (
                  <tr key={f.id} className="hover:bg-blue-50 transition">
                    <td className="p-3 border-b">{f.filename}</td>
                    <td className="p-3 border-b"><a href={`/${f.path}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Download</a></td>
                    {role === 'admin' && <td className="p-3 border-b"><button className="text-red-600 underline" onClick={() => handleDeleteFile(f.id)}>ลบ</button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* งวดงาน */}
      <div className="mb-8">
        <h3 className="font-bold mb-2 text-blue-700">งวดงาน</h3>
        {role === 'admin' && <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded-lg font-semibold shadow mb-2 transition" onClick={handleAddPeriod}>+ เพิ่มงวดงาน</button>}
        {periodMsg && <div className="text-green-600 text-sm mb-1 font-semibold">{periodMsg}</div>}
        {periodError && <div className="text-red-600 text-sm mb-1 font-semibold">{periodError}</div>}
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
                  {role === 'admin' && <th className="p-4 font-bold text-center">จัดการ</th>}
                </tr>
              </thead>
              <tbody>
                {periods.length === 0 ? (
                  <tr><td colSpan={role === 'admin' ? 5 : 4} className="text-center text-gray-400 py-10 text-lg">ไม่มีงวดงาน</td></tr>
                ) : periods.map(p => (
                  <tr key={p.id} className="transition hover:bg-blue-50 even:bg-blue-50/50 text-base">
                    <td className="p-4 border-b text-right font-mono text-lg">{p.period_no || '-'}</td>
                    <td className="p-4 border-b text-center">{formatDateThaiWithIcon(p.due_date)}</td>
                    <td className="p-4 border-b text-center"><AlertDaysCell days={p.alert_days} /></td>
                    <td className="p-4 border-b text-center"><StatusBadge status={p.status} /></td>
                    {role === 'admin' && <td className="p-4 border-b text-center">
                      <button className="text-blue-600 hover:text-blue-800 underline mr-2 flex items-center gap-1 group" aria-label="แก้ไข" title="แก้ไข" onClick={() => handleEditPeriod(p)}>
                        <svg className="w-5 h-5 group-hover:scale-110 transition" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h6v-6l9-9a2.121 2.121 0 10-3-3l-9 9z" /></svg>
                        แก้ไข
                      </button>
                      <button className="text-red-600 hover:text-red-800 underline flex items-center gap-1 group" aria-label="ลบ" title="ลบ" onClick={() => handleDeletePeriod(p.id)}>
                        <svg className="w-5 h-5 group-hover:scale-110 transition" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        ลบ
                      </button>
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PeriodModal open={periodModal.open} onClose={() => setPeriodModal({ open: false, initial: null })} onSave={handleSavePeriod} initial={periodModal.initial} />
      </div>
      {showEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-xl relative">
            <button className="absolute right-2 top-2 text-gray-400 text-2xl" onClick={() => setShowEdit(false)}>×</button>
            <AddContract initial={contract} onSuccess={async () => { setShowEdit(false); await refreshContract(); }} onClose={() => setShowEdit(false)} />
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
} 
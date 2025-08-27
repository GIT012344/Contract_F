import React, { useState, useEffect, useRef } from "react";
import toast, { Toaster } from 'react-hot-toast';
import { HiOutlineMail, HiOutlineExclamationCircle, HiOutlineInformationCircle } from 'react-icons/hi';
import { useAuth } from '../AuthContext';

function validateEmails(emailString) {
  if (!emailString) return true;
  // trim, remove empty, check format, no duplicate, no double comma
  const arr = emailString.split(',').map(e => e.trim()).filter(e => e !== '');
  const set = new Set();
  for (let email of arr) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return false;
    if (set.has(email)) return false;
    set.add(email);
  }
  // ห้ามมี comma ติดกันหรือขึ้นต้น/ลงท้ายด้วย comma
  if (/,,|^,|,$/.test(emailString)) return false;
  return true;
}

// Period Modal Component
function PeriodModal({ open, onClose, onSave, initial }) {
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
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
  }, [open, initial]);

  if (!open) return null;

  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60] animate-fadein" onClick={handleOverlayClick}>
      <div className="bg-white p-6 rounded-2xl shadow-xl w-80 relative animate-popin">
        <button className="absolute right-2 top-2 text-gray-400 text-2xl hover:text-gray-600" onClick={onClose}>×</button>
        <h3 className="font-bold mb-4 text-lg text-blue-700 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>
          {initial ? 'แก้ไข' : 'เพิ่ม'} งวดงาน
        </h3>
        <div className="mb-3">
          <label className="block text-sm font-semibold mb-1">เลขงวด</label>
          <input ref={inputRef} className="border rounded w-full p-2 focus:ring-2 focus:ring-blue-400" value={number} onChange={e => setNumber(e.target.value.replace(/[^0-9]/g, ''))} placeholder="เช่น 1" />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-semibold mb-1">วันที่กำหนดส่ง</label>
          <input type="date" className="border rounded w-full p-2 focus:ring-2 focus:ring-blue-400" value={dueDate || ''} onChange={e => setDueDate(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-semibold mb-1">แจ้งเตือนล่วงหน้า (วัน)</label>
          <input type="number" min="0" className="border rounded w-full p-2 focus:ring-2 focus:ring-blue-400" value={alertDays} onChange={e => setAlertDays(Number(e.target.value))} placeholder="0 = ไม่แจ้งเตือน" />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-semibold mb-1">สถานะ</label>
          <select className="border rounded w-full p-2 focus:ring-2 focus:ring-blue-400" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="รอดำเนินการ">รอดำเนินการ</option>
            <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
            <option value="เสร็จสิ้น">เสร็จสิ้น</option>
          </select>
        </div>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <div className="flex gap-2 mt-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition flex-1" onClick={() => {
            if (!number || !dueDate) { setError('กรุณากรอกข้อมูลให้ครบ'); return; }
            const saveData = { 
              period_no: number, // Allow string values
              due_date: dueDate, 
              alert_days: alertDays, 
              status,
              id: initial?.id || `temp_${Date.now()}`
            };
            onSave(saveData);
          }}>
            บันทึก
          </button>
          <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold shadow transition flex-1" onClick={onClose}>ยกเลิก</button>
        </div>
      </div>
    </div>
  );
}

export default function AddContract({ onSuccess, onClose, initial }) {
  const { authFetch, user, token } = useAuth();  
  const role = user?.role;
  const userDepartment = user?.department || user?.department_id; // Try both fields
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState({ contactName: '', department: '' });
  const [showCustomDept, setShowCustomDept] = useState(false);
  const [customDepartment, setCustomDepartment] = useState("");
  const [periods, setPeriods] = useState([]);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  
  // Get contract ID from initial data when editing
  const contractId = initial?.id || initial?.contract_id;

  // ฟังก์ชันสำหรับตั้งค่า initial form data
  const getInitialFormData = () => {
    // ถ้าไม่มี initial data ให้ return ค่าว่าง
    if (!initial) {
      return {
        contractNo: "",
        contractDate: "",
        contactName: "",
        department: role !== 'admin' && userDepartment ? userDepartment : "", // ถ้าเป็น user ใช้แผนกของตัวเอง
        startDate: "",
        endDate: "",
        remark1: "",
        remark2: "",
        remark3: "",
        remark4: "",
        alertEmails: "",
        status: "CRTD"
      };
    }
    
    // แปลงวันที่จาก backend format เป็น input date format
    const formatDateForInput = (dateStr) => {
      if (!dateStr) return "";
      return dateStr.split('T')[0];
    };
    
    return {
      contractNo: initial.contract_no || initial.contractNo || "",
      contractDate: formatDateForInput(initial.contract_date || initial.contractDate) || "",
      contactName: initial.contact_name || initial.contactName || "",
      department: initial.department || "",
      startDate: formatDateForInput(initial.start_date || initial.startDate) || "",
      endDate: formatDateForInput(initial.end_date || initial.endDate) || "",
      remark1: initial.remark1 || "",
      remark2: initial.remark2 || "",
      remark3: initial.remark3 || "",
      remark4: initial.remark4 || "",
      alertEmails: initial.alert_emails || initial.alertEmails || "",
      status: initial.status || "CRTD"
    };
  };
  
  const [form, setForm] = useState(() => getInitialFormData());
  
  // Load departments on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await authFetch('/api/departments');
        if (response.ok) {
          const data = await response.json();
          console.log('Departments loaded:', data);
          // Check if data is an array or has a data property
          const deptList = Array.isArray(data) ? data : (data.data || data.departments || []);
          setDepartments(deptList);
        } else {
          console.error('Failed to fetch departments:', response.status);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setLoadingDepts(false);
      }
    };
    fetchDepartments();
  }, []);
  
  // Load existing periods when editing
  useEffect(() => {
    const loadPeriods = async () => {
      if (contractId && initial) {
        try {
          const response = await authFetch(`/api/contracts/${contractId}/periods`);
          if (response.ok) {
            const data = await response.json();
            // Convert periods to format expected by our component
            const formattedPeriods = data.map(p => ({
              id: `period-${p.id}`,
              period_no: p.period_no,
              due_date: p.due_date ? p.due_date.split('T')[0] : '',
              alert_days: p.alert_days || 0,
              status: p.status || 'รอดำเนินการ'
            }));
            setPeriods(formattedPeriods);
          }
        } catch (error) {
          console.error('Error loading periods:', error);
        }
      }
    };
    
    loadPeriods();
  }, [contractId, initial]);
  
  // Check if department is custom after departments are loaded
  useEffect(() => {
    if (initial && initial.department && departments.length > 0) {
      const deptExists = departments.some(d => d.code === initial.department);
      if (!deptExists && initial.department !== '') {
        // This is a custom department
        setShowCustomDept(true);
        setCustomDepartment(initial.department);
        setForm(prev => ({ ...prev, department: 'OTHER' }));
      } else if (deptExists) {
        // This is a standard department from the list
        setForm(prev => ({ ...prev, department: initial.department }));
      }
    }
  }, [initial, departments]);

  // ฟังก์ชันแปลงวันที่
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === 'alertEmails') {
      if (!validateEmails(value)) {
        setEmailError('รูปแบบอีเมลไม่ถูกต้อง: ห้ามเว้นวรรค, ห้าม comma ติดกัน, ห้ามซ้ำ, ห้ามว่าง, คั่นด้วย comma (,)');
      } else {
        setEmailError("");
      }
    }
    if (name === 'contactName' && value.trim() !== '') {
      setFormError(err => ({ ...err, contactName: '' }));
    }
    if (name === 'department') {
      if (value === 'OTHER') {
        setShowCustomDept(true);
        setForm({ ...form, department: 'OTHER' }); // Keep OTHER as value for validation
      } else {
        setShowCustomDept(false);
        setCustomDepartment(''); // Clear custom department when switching back
        setForm({ ...form, department: value });
        const deptStr = String(value).trim();
        if (deptStr !== '') {
          setFormError(err => ({ ...err, department: '' }));
        }
      }
    } else {
      setForm({ ...form, [name]: value });
    }
    if (name === 'alertEmails') {
      if (!validateEmails(value)) {
        setEmailError('รูปแบบอีเมลไม่ถูกต้อง: ห้ามเว้นวรรค, ห้าม comma ติดกัน, ห้ามซ้ำ, ห้ามว่าง, คั่นด้วย comma (,)');
      } else {
        setEmailError("");
      }
    }
  };

  const handleCustomDeptChange = (e) => {
    const value = e.target.value;
    setCustomDepartment(value);
    // Keep form.department as 'OTHER' for validation
    if (value.trim() !== '') {
      setFormError(err => ({ ...err, department: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let hasError = false;
    let newError = { contactName: '', department: '' };
    if (!form.contactName || form.contactName.trim() === '') {
      newError.contactName = 'กรุณากรอกชื่อสัญญา';
      hasError = true;
    }
    // ตรวจสอบหน่วยงาน
    const deptValue = form.department ? String(form.department).trim() : '';
    if (!showCustomDept && (!deptValue || deptValue === '' || deptValue === 'OTHER')) {
      newError.department = 'กรุณาเลือกหน่วยงาน';
      hasError = true;
    }
    if (showCustomDept && !customDepartment.trim()) {
      newError.department = 'กรุณากรอกหน่วยงาน';
      hasError = true;
    }
    setFormError(newError);
    if (hasError) return;
    if (!validateEmails(form.alertEmails)) {
      toast.error("รูปแบบอีเมลแจ้งเตือนไม่ถูกต้อง");
      setEmailError('รูปแบบอีเมลไม่ถูกต้อง: ห้ามเว้นวรรค, ห้าม comma ติดกัน, ห้ามซ้ำ, ห้ามว่าง, คั่นด้วย comma (,)');
      return;
    }
    const isEdit = !!initial;
    
    // แปลงข้อมูลจาก camelCase เป็น snake_case สำหรับ backend
    const payload = {
      contract_no: form.contractNo,
      contract_date: form.contractDate,
      contact_name: form.contactName,
      department: role === 'admin' && showCustomDept ? customDepartment : (role !== 'admin' ? userDepartment : form.department), // user ใช้แผนกตัวเอง, admin ใช้ที่เลือก
      start_date: form.startDate,
      end_date: form.endDate,
      remark1: form.remark1,
      remark2: form.remark2,
      remark3: form.remark3,
      remark4: form.remark4,
      alert_emails: form.alertEmails ? form.alertEmails.split(',').map(e => e.trim()).filter(e => e !== '').join(', ') : '',
      status: form.status,
      periods: periods // Include periods in payload
    };
    
    let res;
    try {
      res = await authFetch(isEdit ? `/api/contracts/${initial.id}` : '/api/contracts', {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(isEdit ? 'แก้ไขสัญญาสำเร็จ' : 'เพิ่มสัญญาสำเร็จ');
        if (onSuccess) onSuccess();
      } else {
        let errMsg = 'บันทึกข้อมูลไม่สำเร็จ';
        try {
          const data = await res.json();
          errMsg = data?.message || errMsg;
        } catch (e) {
          errMsg = await res.text() || errMsg;
        }
        toast.error(errMsg);
        console.error('Backend error:', errMsg);
      }
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดจากระบบ หรือไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      console.error('Network error:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <Toaster position="top-center" />
        <form id="add-contract-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <h2 className="text-2xl font-bold mb-6 text-blue-700 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-blue-500"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            {initial ? 'แก้ไขสัญญา' : 'เพิ่มสัญญาใหม่'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">เลขที่สัญญา <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="contractNo"
                value={form.contractNo}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                placeholder="เช่น C-001"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">วันที่ออกสัญญา</label>
              <input
                type="date"
                name="contractDate"
                value={form.contractDate}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-1">ชื่อสัญญา <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="contactName"
              value={form.contactName}
              onChange={handleChange}
              className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition ${formError.contactName ? 'border-red-500' : ''}`}
              placeholder="ชื่อสัญญา"
              required
            />
            {formError.contactName && <div className="text-red-500 text-sm mt-1">{formError.contactName}</div>}
          </div>
          <div>
            <label className="block font-semibold mb-1">หน่วยงาน <span className="text-red-500">*</span></label>
            {role === 'admin' ? (
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
                className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition ${formError.department ? 'border-red-500' : ''}`}
                disabled={loadingDepts}
              >
                <option value="">-- เลือกหน่วยงาน --</option>
                {departments.map(dept => (
                  <option key={dept.code || dept.id} value={dept.code}>
                    {dept.name || dept.department_name || `${dept.code}`}
                  </option>
                ))}
                <option value="OTHER">อื่นๆ (กรอกเอง)</option>
              </select>
            ) : (
              <input
                type="text"
                value={userDepartment || form.department || ''}
                className="w-full border px-3 py-2 rounded-lg bg-gray-100 cursor-not-allowed"
                disabled
                readOnly
              />
            )}
            {role === 'admin' && showCustomDept && (
              <input
                type="text"
                value={customDepartment}
                onChange={handleCustomDeptChange}
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition mt-2"
                placeholder="กรอกหน่วยงานที่เกี่ยวข้อง"
              />
            )}
            {formError.department && <div className="text-red-500 text-sm mt-1">{formError.department}</div>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">วันที่เริ่มต้น</label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">วันหมดอายุ</label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-1">งวดงาน ({periods.length} งวด)</label>
            <div className="border rounded-lg p-3">
              {periods.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {periods.map((period, idx) => (
                    <div key={period.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm">งวดที่ {period.period_no} - {period.due_date}</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPeriod(period);
                            setShowPeriodModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          onClick={() => setPeriods(periods.filter(p => p.id !== period.id))}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm mb-3">ยังไม่มีงวดงาน</p>
              )}
              <button
                type="button"
                onClick={() => {
                  setEditingPeriod(null);
                  setShowPeriodModal(true);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm font-semibold"
              >
                + เพิ่มงวดงาน
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">หมายเหตุ 1</label>
              <input
                type="text"
                name="remark1"
                value={form.remark1}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                placeholder="หมายเหตุเพิ่มเติม"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">หมายเหตุ 2</label>
              <input
                type="text"
                name="remark2"
                value={form.remark2}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                placeholder="หมายเหตุเพิ่มเติม"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">หมายเหตุ 3</label>
              <input
                type="text"
                name="remark3"
                value={form.remark3}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                placeholder="หมายเหตุเพิ่มเติม"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">หมายเหตุ 4</label>
              <input
                type="text"
                name="remark4"
                value={form.remark4}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                placeholder="หมายเหตุเพิ่มเติม"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-1">อีเมลแจ้งเตือน <span className="text-xs text-gray-400">(คั่นด้วย ,)</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none">
                <HiOutlineMail className="w-5 h-5" />
              </span>
              <input
                type="text"
                name="alertEmails"
                value={form.alertEmails}
                onChange={handleChange}
                className={`w-full pl-10 border-none bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-2 rounded-xl shadow focus:ring-2 focus:ring-blue-400 focus:outline-none text-base transition ${emailError ? 'ring-2 ring-red-400' : ''}`}
                placeholder="a@email.com, b@email.com"
                aria-describedby="alertEmailsHelp"
                autoComplete="off"
                maxLength={200}
              />
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-500 mt-1" id="alertEmailsHelp">
              <HiOutlineInformationCircle className="w-4 h-4" />
              กรอกอีเมลที่ต้องการให้แจ้งเตือน (คั่นแต่ละอีเมลด้วย comma , ห้ามเว้นวรรค/ซ้ำ/ว่าง)
            </div>
            {emailError && (
              <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                <HiOutlineExclamationCircle className="w-4 h-4" />
                {emailError}
              </div>
            )}
          </div>
          <div>
            <label className="block font-semibold mb-1">สถานะ</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
            >
              <option value="CRTD">สร้างใหม่</option>
              <option value="PENDING">รอดำเนินการ</option>
              <option value="ACTIVE">ใช้งาน</option>
              <option value="COMPLETED">เสร็จสิ้น</option>
              <option value="CANCELLED">ยกเลิก</option>
              <option value="EXPIRED">หมดอายุ</option>
              <option value="DELETED">ลบแล้ว</option>
            </select>
          </div>
        </form>
        <div className="flex gap-2 p-4 border-t bg-white sticky bottom-0 z-10">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition flex-1" type="submit" form="add-contract-form" disabled={!!emailError}>{initial ? 'บันทึกการแก้ไข' : 'บันทึกสัญญา'}</button>
          <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold shadow transition flex-1" type="button" onClick={onClose}>ยกเลิก</button>
        </div>
      </div>
      {/* Period Modal */}
      <PeriodModal
        open={showPeriodModal}
        onClose={() => {
          setShowPeriodModal(false);
          setEditingPeriod(null);
        }}
        onSave={(periodData) => {
          if (editingPeriod) {
            setPeriods(periods.map(p => p.id === editingPeriod.id ? periodData : p));
          } else {
            setPeriods([...periods, periodData]);
          }
          setShowPeriodModal(false);
          setEditingPeriod(null);
        }}
        initial={editingPeriod}
      />
    </div>
  );
}

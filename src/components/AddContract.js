import React, { useState } from "react";
import toast, { Toaster } from 'react-hot-toast';
import { HiOutlineMail, HiOutlineExclamationCircle, HiOutlineInformationCircle } from 'react-icons/hi';

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

export default function AddContract({ initial, onSuccess, onClose }) {
  // แปลงข้อมูลจาก backend format เป็น form format
  const getInitialFormData = () => {
    if (!initial) {
      return {
        contractNo: "",
        contractDate: "",
        contactName: "",
        department: "",
        startDate: "",
        endDate: "",
        periodCount: "",
        remark1: "",
        remark2: "",
        remark3: "",
        remark4: "",
        alertEmails: "",
        status: "CRTD"
      };
    }
    
    // แปลงวันที่จาก backend format เป็น input date format
    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      return dateStr.split('T')[0];
    };
    
    return {
      contractNo: initial.contract_no || initial.contractNo || "",
      contractDate: formatDate(initial.contract_date || initial.contractDate) || "",
      contactName: initial.contact_name || initial.contactName || "",
      department: initial.department || "",
      startDate: formatDate(initial.start_date || initial.startDate) || "",
      endDate: formatDate(initial.end_date || initial.endDate) || "",
      periodCount: String(initial.period_count || initial.periodCount || ""),
      remark1: initial.remark1 || "",
      remark2: initial.remark2 || "",
      remark3: initial.remark3 || "",
      remark4: initial.remark4 || "",
      alertEmails: initial.alert_emails || initial.alertEmails || "",
      status: initial.status || "CRTD"
    };
  };
  
  const [form, setForm] = useState(getInitialFormData());
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState({ contactName: '', department: '' });

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
    if (name === 'department' && value.trim() !== '') {
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
    if (!form.department || form.department.trim() === '') {
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
    const token = localStorage.getItem('token');
    const isEdit = !!initial;
    
    // แปลงข้อมูลจาก camelCase เป็น snake_case สำหรับ backend
    const payload = {
      contract_no: form.contractNo,
      contract_date: form.contractDate,
      contact_name: form.contactName,
      department: form.department,
      start_date: form.startDate,
      end_date: form.endDate,
      period_count: form.periodCount ? parseInt(form.periodCount) : null,
      remark1: form.remark1,
      remark2: form.remark2,
      remark3: form.remark3,
      remark4: form.remark4,
      alert_emails: form.alertEmails ? form.alertEmails.split(',').map(e => e.trim()).filter(e => e !== '').join(', ') : '',
      status: form.status
    };
    
    let res;
    try {
      res = await fetch(isEdit ? `/api/contracts/${initial.id}` : '/api/contracts', {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
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
            <input
              type="text"
              name="department"
              value={form.department}
              onChange={handleChange}
              className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition ${formError.department ? 'border-red-500' : ''}`}
              placeholder="เช่น HR, IT, ..."
              required
            />
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
            <label className="block font-semibold mb-1">จำนวนงวด</label>
            <input
              type="number"
              name="periodCount"
              value={form.periodCount}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              min={1}
              placeholder="จำนวนงวดงาน"
            />
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
    </div>
  );
}

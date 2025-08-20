import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch, useAuth } from '../AuthContext';
import Layout from '../components/Layout';
import AddContract from '../components/AddContract';
import { exportContractsToCSV, downloadCSV, generateSummaryReport, exportSummaryToCSV, parseCSV, validateImportData } from '../utils/exportUtils';
import { downloadContractTemplate } from '../utils/csvTemplate';
import { printContractsList, printSummaryReport } from '../utils/printUtils';
import toast from 'react-hot-toast';

function daysLeft(endDate) {
  if (!endDate) return '-';
  const d = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
  return d >= 0 ? d + ' วัน' : 'หมดอายุ';
}

export default function ContractListPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState({ number: '', name: '', department: '', start: '', end: '', status: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [refreshKey] = useState(0); // เพิ่ม state สำหรับ trigger refresh
  const navigate = useNavigate();
  const { token, role } = useAuth();

  // ฟังก์ชันสำหรับโหลดข้อมูลสัญญา
  const loadContracts = useCallback(() => {
    if (!token) return;
    
    setLoading(true);
    authFetch('/api/contracts', {}, token)
      .then(async res => {
        if (res.status === 401) throw new Error('Session หมดอายุ');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setContracts(data);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    loadContracts();
  }, [loadContracts, refreshKey]);

  // Auto refresh ทุก 30 วินาทีเมื่ออยู่ในหน้านี้
  useEffect(() => {
    let interval;
    if (token) {
      // Auto refresh every 30 seconds
      interval = setInterval(() => {
        loadContracts();
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [token, loadContracts]);

  // Refresh เมื่อ focus กลับมาที่หน้านี้
  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        loadContracts();
      }
    };
    document.addEventListener('visibilitychange', handleFocus);
    return () => document.removeEventListener('visibilitychange', handleFocus);
  }, [loadContracts]);

  // Refresh เมื่อ window focus
  useEffect(() => {
    const handleFocus = () => {
      loadContracts();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadContracts]);

  const handleRowClick = id => navigate(`/contracts/${id}`);

  const filtered = contracts.filter(c => {
    // Case-insensitive search
    const matchNumber = !search.number || c.contract_no?.toLowerCase().includes(search.number.toLowerCase());
    const matchName = !search.name || c.contact_name?.toLowerCase().includes(search.name.toLowerCase());
    const matchDepartment = !search.department || c.department?.toLowerCase().includes(search.department.toLowerCase());
    
    // Status matching - handle EXPIRED specially to check actual dates
    let matchStatus = !search.status;
    if (search.status) {
      if (search.status === 'EXPIRED') {
        // Check if contract is expired based on end_date OR has EXPIRED/EXPIRE status
        const isExpired = c.end_date && new Date(c.end_date) < new Date();
        matchStatus = c.status === 'EXPIRED' || c.status === 'EXPIRE' || isExpired;
      } else if (search.status === 'COMPLETED') {
        // รองรับทั้งภาษาอังกฤษและภาษาไทย
        matchStatus = c.status === 'COMPLETED' || c.status === 'เสร็จสิ้น';
      } else if (search.status === 'CANCELLED') {
        matchStatus = c.status === 'CANCELLED' || c.status === 'ยกเลิก';
      } else if (search.status === 'DELETED') {
        matchStatus = c.status === 'DELETED' || c.status === 'ลบแล้ว';
      } else if (search.status === 'CRTD') {
        matchStatus = c.status === 'CRTD' || c.status === 'สร้างใหม่';
      } else {
        matchStatus = c.status === search.status;
      }
    }
    
    // Date filtering - check both start_date and end_date fields
    const matchStartDate = !search.start || 
      (c.start_date && new Date(c.start_date) >= new Date(search.start)) ||
      (c.end_date && new Date(c.end_date) >= new Date(search.start));
    
    const matchEndDate = !search.end || 
      (c.start_date && new Date(c.start_date) <= new Date(search.end)) ||
      (c.end_date && new Date(c.end_date) <= new Date(search.end));
    
    return matchNumber && matchName && matchDepartment && matchStatus && matchStartDate && matchEndDate;
  });

  // Export functions
  const handleExportCSV = () => {
    try {
      const csvContent = exportContractsToCSV(filtered);
      const filename = `contracts_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csvContent, filename);
      toast.success('ส่งออกข้อมูลสำเร็จ');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการส่งออกข้อมูล');
    }
  };

  const handleExportSummary = () => {
    try {
      const summary = generateSummaryReport(contracts);
      const csvContent = exportSummaryToCSV(summary);
      const filename = `summary_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csvContent, filename);
      toast.success('ส่งออกรายงานสรุปสำเร็จ');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการส่งออกรายงาน');
    }
  };

  // Print functions
  const handlePrintList = () => {
    printContractsList(filtered, search);
  };

  const handlePrintSummary = () => {
    const summary = generateSummaryReport(contracts);
    printSummaryReport(summary, contracts);
  };

  // Import functions
  const handleImportCSV = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('กรุณาเลือกไฟล์ CSV');
      return;
    }

    setImporting(true);
    try {
      const text = await file.text();
      const { data } = parseCSV(text);
      const errors = validateImportData(data);
      
      if (errors.length > 0) {
        toast.error(`พบข้อผิดพลาด: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`);
        return;
      }

      // Import data to backend
      for (const row of data) {
        const contractData = {
          contract_no: row['เลขที่สัญญา'],
          contact_name: row['ชื่อผู้ติดต่อ'],
          department: row['หน่วยงาน'],
          status: row['สถานะ'] || 'pending',
          period_count: parseInt(row['จำนวนงวด']) || 0,
          remark1: row['หมายเหตุ 1'],
          remark2: row['หมายเหตุ 2'],
          remark3: row['หมายเหตุ 3'],
          remark4: row['หมายเหตุ 4'],
          alert_emails: row['อีเมลแจ้งเตือน']
        };

        await authFetch('/api/contracts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contractData)
        }, token);
      }

      toast.success(`นำเข้าข้อมูลสำเร็จ ${data.length} รายการ`);
      setShowImport(false);
      // Refresh contracts list
      window.location.reload();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
    } finally {
      setImporting(false);
      event.target.value = ''; // Reset file input
    }
  };

  const handleAddSuccess = () => {
    setShowAdd(false);
    setLoading(true);
    authFetch('/api/contracts', {}, token)
      .then(async res => res.ok ? res.json() : [])
      .then(setContracts)
      .finally(() => setLoading(false));
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">รายการสัญญา</h1>
              <p className="mt-2 text-sm text-gray-700">
                จัดการและติดตามสัญญาทั้งหมดในระบบ
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
              {/* Export/Import/Print Buttons */}
              <div className="flex items-center gap-2">
                {/* Export Dropdown */}
                <div className="relative group">
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    ส่งออก
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <div className="py-1">
                      <button onClick={handleExportCSV} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        ส่งออกรายการสัญญา (CSV)
                      </button>
                      <button onClick={handleExportSummary} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        ส่งออกรายงานสรุป (CSV)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Print Dropdown */}
                <div className="relative group">
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    พิมพ์
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <div className="py-1">
                      <button onClick={handlePrintList} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        พิมพ์รายการสัญญา
                      </button>
                      <button onClick={handlePrintSummary} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        พิมพ์รายงานสรุป
                      </button>
                    </div>
                  </div>
                </div>

                {/* Import Button (Admin only) */}
                {role === 'admin' && (
                  <button 
                    onClick={() => setShowImport(true)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    นำเข้า
                  </button>
                )}
              </div>

              {/* Add Contract Button (Admin only) */}
              {role === 'admin' && (
                <button 
                  onClick={() => setShowAdd(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  เพิ่มสัญญาใหม่
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Search Filters */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">กรองค้นหา</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">เลขที่สัญญา</label>
              <input 
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
                placeholder="ค้นหาเลขที่สัญญา" 
                value={search.number} 
                onChange={e => setSearch(s => ({ ...s, number: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อ</label>
              <input 
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
                placeholder="ค้นหาชื่อ" 
                value={search.name} 
                onChange={e => setSearch(s => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">หน่วยงาน</label>
              <input 
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
                placeholder="ค้นหาหน่วยงาน" 
                value={search.department} 
                onChange={e => setSearch(s => ({ ...s, department: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">วันเริ่ม</label>
              <input 
                type="date" 
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
                value={search.start} 
                onChange={e => setSearch(s => ({ ...s, start: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">วันสิ้นสุด</label>
              <input 
                type="date" 
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
                value={search.end} 
                onChange={e => setSearch(s => ({ ...s, end: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
              <select 
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
                value={search.status} 
                onChange={e => setSearch(s => ({ ...s, status: e.target.value }))}
              >
                <option value="">ทั้งหมด</option>
                <option value="ACTIVE">ใช้งาน (Active)</option>
                <option value="PENDING">รอดำเนินการ (Pending)</option>
                <option value="COMPLETED">เสร็จสิ้น (Completed)</option>
                <option value="CANCELLED">ยกเลิก (Cancelled)</option>
                <option value="CRTD">สร้างใหม่ (Created)</option>
                <option value="EXPIRED">หมดอายุ (Expired)</option>
                <option value="DELETED">ลบแล้ว (Deleted)</option>
              </select>
            </div>
            <div className="lg:col-span-3"></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">&nbsp;</label>
              <button 
                onClick={() => setSearch({ number: '', name: '', department: '', start: '', end: '', status: '' })}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                ล้างการค้นหา
              </button>
            </div>
          </div>
        </div>
        {/* Content Section */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-medium text-red-800 mb-2">เกิดข้อผิดพลาด</h3>
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เลขที่สัญญา</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">หน่วยงาน</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่เหลือ</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">ไม่พบข้อมูล</h3>
                        <p className="text-sm text-gray-500">ลองปรับเงื่อนไขการค้นหาหรือเพิ่มสัญญาใหม่</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c, index) => (
                      <tr 
                        key={c.id} 
                        className={`hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                        onClick={() => handleRowClick(c.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {c.contract_no}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {c.contact_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {c.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            c.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            c.status === 'EXPIRED' || c.status === 'EXPIRE' || (c.end_date && new Date(c.end_date) < new Date()) ? 'bg-red-100 text-red-800' :
                            c.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            c.status === 'COMPLETED' || c.status === 'เสร็จสิ้น' ? 'bg-blue-100 text-blue-800' :
                            c.status === 'CANCELLED' || c.status === 'ยกเลิก' ? 'bg-gray-100 text-gray-800' :
                            c.status === 'CRTD' || c.status === 'สร้างใหม่' ? 'bg-purple-100 text-purple-800' :
                            c.status === 'DELETED' || c.status === 'ลบแล้ว' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {c.status === 'ACTIVE' ? 'ใช้งาน' :
                             c.status === 'EXPIRED' || c.status === 'EXPIRE' || (c.end_date && new Date(c.end_date) < new Date()) ? 'หมดอายุ' :
                             c.status === 'PENDING' ? 'รอดำเนินการ' :
                             c.status === 'COMPLETED' || c.status === 'เสร็จสิ้น' ? 'เสร็จสิ้น' :
                             c.status === 'CANCELLED' || c.status === 'ยกเลิก' ? 'ยกเลิก' :
                             c.status === 'CRTD' || c.status === 'สร้างใหม่' ? 'สร้างใหม่' :
                             c.status === 'DELETED' || c.status === 'ลบแล้ว' ? 'ลบแล้ว' :
                             c.status || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {['EXPIRED','EXPIRE','DELETED','COMPLETED','CANCELLED','เสร็จสิ้น','ยกเลิก','ลบแล้ว'].includes(c.status) ? '-' : daysLeft(c.end_date)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Add Contract Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center pb-3">
                <h3 className="text-lg font-bold text-gray-900">เพิ่มสัญญาใหม่</h3>
                <button 
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  onClick={() => setShowAdd(false)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <AddContract onSuccess={handleAddSuccess} onClose={() => setShowAdd(false)} />
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImport && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-lg shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center pb-3">
                <h3 className="text-lg font-bold text-gray-900">นำเข้าข้อมูลสัญญา</h3>
                <button 
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  onClick={() => setShowImport(false)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">คำแนะนำการนำเข้าข้อมูล</h4>
                      <div className="mt-2 text-sm text-blue-700">
                        <ul className="list-disc list-inside space-y-1">
                          <li>ไฟล์ต้องเป็นรูปแบบ CSV</li>
                          <li>คอลัมน์แรก: เลขที่สัญญา, ชื่อผู้ติดต่อ, หน่วยงาน, สถานะ</li>
                          <li>ข้อมูลที่ซ้ำกันจะไม่ถูกนำเข้า</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      เลือกไฟล์ CSV
                    </label>
                    <button 
                      onClick={() => {
                        downloadContractTemplate();
                        toast.success('ดาวน์โหลดไฟล์ตัวอย่างสำเร็จ');
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      ดาวน์โหลดไฟล์ตัวอย่าง
                    </button>
                  </div>
                  <input 
                    type="file" 
                    accept=".csv"
                    onChange={handleImportCSV}
                    disabled={importing}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded-lg p-2 disabled:opacity-50"
                  />
                </div>
                
                {importing && (
                  <div className="flex items-center justify-center py-4">
                    <svg className="animate-spin w-5 h-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm text-gray-600">กำลังนำเข้าข้อมูล...</span>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button 
                    onClick={() => setShowImport(false)}
                    disabled={importing}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 disabled:opacity-50"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 
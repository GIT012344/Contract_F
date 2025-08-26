import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiPlus, FiUsers, FiFileText, FiArrowLeft } from 'react-icons/fi';

const DepartmentManagement = () => {
  const { authFetch, user } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [departmentMembers, setDepartmentMembers] = useState([]);
  const [departmentContracts, setDepartmentContracts] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // ตรวจสอบสิทธิ์ admin
  useEffect(() => {
    if (user?.role !== 'admin') {
      window.location.href = '/dashboard';
    }
  }, [user]);

  // โหลดรายการแผนก
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await authFetch('/api/departments/all');
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // เปิด modal สำหรับเพิ่ม/แก้ไข
  const openModal = (department = null) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({
        name: department.name,
        code: department.code,
        description: department.description || ''
      });
    } else {
      setEditingDepartment(null);
      setFormData({
        name: '',
        code: '',
        description: ''
      });
    }
    setErrors({});
    setShowModal(true);
  };

  // ปิด modal
  const closeModal = () => {
    setShowModal(false);
    setEditingDepartment(null);
    setFormData({
      name: '',
      code: '',
      description: ''
    });
    setErrors({});
  };

  // จัดการการเปลี่ยนแปลงในฟอร์ม
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // ลบ error สำหรับ field นี้
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // ตรวจสอบข้อมูลฟอร์ม
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'กรุณากรอกชื่อแผนก';
    }
    if (!formData.code.trim()) {
      newErrors.code = 'กรุณากรอกรหัสแผนก';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // บันทึกแผนก
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const url = editingDepartment 
        ? `/api/departments/${editingDepartment.id}`
        : '/api/departments';
      
      const method = editingDepartment ? 'PUT' : 'POST';
      
      const response = await authFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchDepartments();
        closeModal();
        alert(editingDepartment ? 'แก้ไขแผนกสำเร็จ' : 'เพิ่มแผนกสำเร็จ');
      } else {
        const error = await response.json();
        alert(error.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error saving department:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  // ลบแผนก
  const handleDelete = async (id) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบแผนกนี้?')) {
      return;
    }

    try {
      const response = await authFetch(`/api/departments/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchDepartments();
        alert('ลบแผนกสำเร็จ');
      } else {
        const error = await response.json();
        alert(error.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('เกิดข้อผิดพลาดในการลบแผนก');
    }
  };

  // เปลี่ยนสถานะแผนก
  const toggleStatus = async (department) => {
    try {
      const response = await authFetch(`/api/departments/${department.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: !department.is_active
        })
      });

      if (response.ok) {
        fetchDepartments();
      } else {
        const error = await response.json();
        alert(error.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
  };

  // ดูรายละเอียดแผนก
  const viewDepartmentDetails = async (department) => {
    setSelectedDepartment(department);
    setShowDetailsModal(true);
    
    try {
      // ดึงข้อมูลสมาชิก
      const membersResponse = await authFetch(`/api/departments/${department.id}/members`);
      if (membersResponse.ok) {
        const members = await membersResponse.json();
        setDepartmentMembers(members);
      }

      // ดึงข้อมูลสัญญา
      const contractsResponse = await authFetch(`/api/departments/${department.id}/contracts`);
      if (contractsResponse.ok) {
        const contracts = await contractsResponse.json();
        setDepartmentContracts(contracts);
      }
    } catch (error) {
      console.error('Error fetching department details:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <FiArrowLeft /> ย้อนกลับ
              </button>
              <h1 className="text-2xl font-bold text-gray-800">จัดการแผนก</h1>
            </div>
            <button
              onClick={() => openModal()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <FiPlus /> เพิ่มแผนก
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รหัส
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ชื่อแผนก
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    คำอธิบาย
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {dept.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dept.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {dept.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => toggleStatus(dept)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          dept.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {dept.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewDepartmentDetails(dept)}
                          className="text-blue-600 hover:text-blue-900"
                          title="ดูรายละเอียด"
                        >
                          <FiUsers className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openModal(dept)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="แก้ไข"
                        >
                          <FiEdit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(dept.id)}
                          className="text-red-600 hover:text-red-900"
                          title="ลบ"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal เพิ่ม/แก้ไขแผนก */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingDepartment ? 'แก้ไขแผนก' : 'เพิ่มแผนกใหม่'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  รหัสแผนก <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.code ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="เช่น IT, HR, FIN"
                />
                {errors.code && (
                  <p className="text-red-500 text-xs mt-1">{errors.code}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  ชื่อแผนก <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="เช่น เทคโนโลยีสารสนเทศ"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  คำอธิบาย
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="คำอธิบายเพิ่มเติม (ถ้ามี)"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingDepartment ? 'บันทึก' : 'เพิ่ม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal แสดงรายละเอียดแผนก */}
      {showDetailsModal && selectedDepartment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                รายละเอียดแผนก: {selectedDepartment.name}
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FiUsers /> สมาชิกในแผนก ({departmentMembers.length} คน)
              </h4>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
                {departmentMembers.length > 0 ? (
                  <ul className="space-y-1">
                    {departmentMembers.map((member) => (
                      <li key={member.id} className="text-sm text-gray-600 px-2 py-1 hover:bg-gray-50">
                        {member.username} - {member.full_name || 'ไม่ระบุชื่อ'}
                        {member.role === 'admin' && (
                          <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">Admin</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 p-2">ไม่มีสมาชิกในแผนกนี้</p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FiFileText /> สัญญาในแผนก ({departmentContracts.length} สัญญา)
              </h4>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
                {departmentContracts.length > 0 ? (
                  <ul className="space-y-1">
                    {departmentContracts.map((contract) => (
                      <li key={contract.id} className="text-sm text-gray-600 px-2 py-1 hover:bg-gray-50">
                        {contract.contract_no} - {contract.contact_name}
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                          contract.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          contract.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {contract.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 p-2">ไม่มีสัญญาในแผนกนี้</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement;

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const FileUpload = ({ contractId, onFileUploaded }) => {
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const acceptedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png'
  ];

  // โหลดไฟล์ที่อัปโหลดแล้ว
  useEffect(() => {
    fetchUploadedFiles();
  }, [contractId]);

  const fetchUploadedFiles = async () => {
    if (!contractId) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/contracts/${contractId}/files`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setUploadedFiles(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (fileList) => {
    const formData = new FormData();
    const newFiles = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!acceptedTypes.includes(file.type)) {
        toast.error('ไม่รองรับไฟล์ประเภทนี้');
        return;
      }
      formData.append('files', file);
      newFiles.push({
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading'
      });
    }
    
    setFiles(prev => [...prev, ...newFiles]);
    formData.append('contractId', contractId);
    
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/contracts/${contractId}/files`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Update file status to uploaded
      setFiles(prev => prev.map(f => 
        newFiles.some(nf => nf.name === f.name) 
          ? { ...f, status: 'uploaded' }
          : f
      ));
      
      if (response.data.success) {
        toast.success('อัปโหลดไฟล์สำเร็จ');
        setFiles([]);
        fetchUploadedFiles(); // รีโหลดรายการไฟล์
        if (onFileUploaded) {
          onFileUploaded(response.data.data);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      // Update file status to error
      setFiles(prev => prev.map(f => 
        newFiles.some(nf => nf.name === f.name) 
          ? { ...f, status: 'error' }
          : f
      ));
      toast.error('เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleDownload = (fileId, fileName) => {
    const token = localStorage.getItem('token');
    window.open(
      `${process.env.REACT_APP_API_URL}/api/files/${fileId}/download?token=${token}`,
      '_blank'
    );
  };

  const handleView = (fileId, fileType) => {
    const token = localStorage.getItem('token');
    if (fileType.includes('pdf') || fileType.includes('image')) {
      window.open(
        `${process.env.REACT_APP_API_URL}/api/files/${fileId}/view?token=${token}`,
        '_blank'
      );
    } else {
      handleDownload(fileId, '');
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('คุณต้องการลบไฟล์นี้หรือไม่?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/files/${fileId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        toast.success('ลบไฟล์สำเร็จ');
        fetchUploadedFiles();
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('เกิดข้อผิดพลาดในการลบไฟล์');
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="font-bold mb-4 text-blue-700 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        เอกสารแนบ
      </h3>

      {/* Drag and Drop Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleChange}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
        />
        
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        
        <p className="mt-2 text-sm text-gray-600">
          ลากไฟล์มาวางที่นี่ หรือ{' '}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="font-medium text-blue-600 hover:text-blue-500"
            disabled={uploading}
          >
            เลือกไฟล์
          </button>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          รองรับไฟล์: PDF, Word, Excel, รูปภาพ (ขนาดไม่เกิน 10MB)
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">ไฟล์ที่เลือก:</h4>
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {/* File Icon */}
                <div className="p-2 bg-white rounded">
                  {file.type?.includes('pdf') ? (
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" />
                    </svg>
                  ) : file.type?.includes('image') ? (
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {file.status === 'uploading' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                )}
                {file.status === 'uploaded' && (
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                  </svg>
                )}
                {file.status === 'error' && (
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
                  </svg>
                )}
                {!file.status && (
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;

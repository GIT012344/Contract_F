// Export utilities for Contract Manager

// Export contracts to CSV
export const exportContractsToCSV = (contracts) => {
  if (!contracts || contracts.length === 0) {
    throw new Error('ไม่มีข้อมูลสัญญาสำหรับ export');
  }

  const headers = [
    'เลขที่สัญญา',
    'ชื่อผู้ติดต่อ',
    'หน่วยงาน',
    'สถานะ',
    'วันที่สร้าง',
    'จำนวนงวด',
    'หมายเหตุ 1',
    'หมายเหตุ 2',
    'หมายเหตุ 3',
    'หมายเหตุ 4',
    'อีเมลแจ้งเตือน'
  ];

  const csvContent = [
    headers.join(','),
    ...contracts.map(contract => [
      `"${contract.contract_no || ''}"`,
      `"${contract.contact_name || ''}"`,
      `"${contract.department || ''}"`,
      `"${contract.status || ''}"`,
      `"${contract.created_at ? new Date(contract.created_at).toLocaleDateString('th-TH') : ''}"`,
      `"${contract.period_count || 0}"`,
      `"${contract.remark1 || ''}"`,
      `"${contract.remark2 || ''}"`,
      `"${contract.remark3 || ''}"`,
      `"${contract.remark4 || ''}"`,
      `"${contract.alert_emails || ''}"`
    ].join(','))
  ].join('\n');

  return csvContent;
};

// Export periods to CSV
export const exportPeriodsToCSV = (periods) => {
  if (!periods || periods.length === 0) {
    throw new Error('ไม่มีข้อมูลงวดงานสำหรับ export');
  }

  const headers = [
    'เลขที่สัญญา',
    'งวดที่',
    'วันที่กำหนดส่ง',
    'แจ้งเตือนล่วงหน้า (วัน)',
    'สถานะ',
    'วันที่สร้าง'
  ];

  const csvContent = [
    headers.join(','),
    ...periods.map(period => [
      `"${period.contract_no || ''}"`,
      `"${period.period_no || ''}"`,
      `"${period.due_date ? new Date(period.due_date).toLocaleDateString('th-TH') : ''}"`,
      `"${period.alert_days || 0}"`,
      `"${period.status || ''}"`,
      `"${period.created_at ? new Date(period.created_at).toLocaleDateString('th-TH') : ''}"`
    ].join(','))
  ].join('\n');

  return csvContent;
};

// Download CSV file
export const downloadCSV = (csvContent, filename) => {
  // Add BOM for UTF-8 to support Thai characters in Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

// Export contracts with their periods
export const exportContractsWithPeriods = async (contracts, authFetch, token) => {
  const enrichedContracts = [];
  
  for (const contract of contracts) {
    try {
      const periodsRes = await authFetch(`/api/contracts/${contract.id}/periods`, {}, token);
      let periods = [];
      
      if (periodsRes.ok) {
        periods = await periodsRes.json();
      }
      
      enrichedContracts.push({
        ...contract,
        periods: periods
      });
    } catch (error) {
      console.error(`Error fetching periods for contract ${contract.id}:`, error);
      enrichedContracts.push({
        ...contract,
        periods: []
      });
    }
  }
  
  return enrichedContracts;
};

// Generate summary report
export const generateSummaryReport = (contracts) => {
  const total = contracts.length;
  const active = contracts.filter(c => c.status === 'active').length;
  const completed = contracts.filter(c => c.status === 'completed').length;
  const cancelled = contracts.filter(c => c.status === 'cancelled').length;
  const pending = contracts.filter(c => c.status === 'pending').length;
  
  const departments = {};
  contracts.forEach(contract => {
    const dept = contract.department || 'ไม่ระบุ';
    departments[dept] = (departments[dept] || 0) + 1;
  });
  
  return {
    total,
    active,
    completed,
    cancelled,
    pending,
    departments,
    generatedAt: new Date().toLocaleString('th-TH')
  };
};

// Export summary to CSV
export const exportSummaryToCSV = (summary) => {
  const lines = [
    'รายงานสรุปสัญญา',
    `วันที่สร้างรายงาน,${summary.generatedAt}`,
    '',
    'สถิติสัญญา',
    `สัญญาทั้งหมด,${summary.total}`,
    `สัญญาที่ใช้งานอยู่,${summary.active}`,
    `สัญญาที่เสร็จสิ้น,${summary.completed}`,
    `สัญญาที่ยกเลิก,${summary.cancelled}`,
    `สัญญาที่รอดำเนินการ,${summary.pending}`,
    '',
    'สถิติตามหน่วยงาน'
  ];
  
  Object.entries(summary.departments).forEach(([dept, count]) => {
    lines.push(`${dept},${count}`);
  });
  
  return lines.join('\n');
};

// Parse CSV for import
export const parseCSV = (csvText) => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('ไฟล์ CSV ต้องมีอย่างน้อย 2 บรรทัด (header และข้อมูล)');
  }
  
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
    const row = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    data.push(row);
  }
  
  return { headers, data };
};

// Validate import data
export const validateImportData = (data) => {
  const errors = [];
  const requiredFields = ['เลขที่สัญญา', 'ชื่อผู้ติดต่อ'];
  
  data.forEach((row, index) => {
    requiredFields.forEach(field => {
      if (!row[field] || row[field].trim() === '') {
        errors.push(`แถวที่ ${index + 2}: ไม่มีข้อมูล ${field}`);
      }
    });
    
    // Validate contract number uniqueness
    const duplicates = data.filter(r => r['เลขที่สัญญา'] === row['เลขที่สัญญา']);
    if (duplicates.length > 1) {
      errors.push(`แถวที่ ${index + 2}: เลขที่สัญญา ${row['เลขที่สัญญา']} ซ้ำกัน`);
    }
  });
  
  return errors;
};

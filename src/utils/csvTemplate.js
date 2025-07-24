// CSV Template utilities for Contract Manager

// Generate CSV template for contract import
export const generateContractTemplate = () => {
  const headers = [
    'เลขที่สัญญา',
    'ชื่อผู้ติดต่อ', 
    'หน่วยงาน',
    'สถานะ',
    'จำนวนงวด',
    'หมายเหตุ 1',
    'หมายเหตุ 2', 
    'หมายเหตุ 3',
    'หมายเหตุ 4',
    'อีเมลแจ้งเตือน'
  ];

  const sampleData = [
    [
      'CON-2024-001',
      'นายสมชาย ใจดี',
      'กรมการขนส่งทางบก',
      'ACTIVE',
      '3',
      'สัญญาก่อสร้างถนน',
      'งบประมาณ 5 ล้านบาท',
      'ระยะเวลา 6 เดือน',
      'ติดต่อ: 02-123-4567',
      'somchai@transport.go.th'
    ],
    [
      'CON-2024-002',
      'นางสาวสุดา รักงาน',
      'กรมอุตุนิยมวิทยา',
      'CRTD',
      '2',
      'ระบบตรวจสอบอากาศ',
      'เทคโนโลยี IoT',
      'การบำรุงรักษา 2 ปี',
      'ผู้ประสานงาน: นายวิชัย',
      'suda@tmd.go.th'
    ]
  ];

  const csvContent = [
    headers.join(','),
    ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
};

// Download CSV template
export const downloadContractTemplate = () => {
  const csvContent = generateContractTemplate();
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'contract_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

// Generate periods template
export const generatePeriodsTemplate = () => {
  const headers = [
    'เลขที่สัญญา',
    'งวดที่',
    'วันที่กำหนดส่ง (YYYY-MM-DD)',
    'แจ้งเตือนล่วงหน้า (วัน)',
    'สถานะ'
  ];

  const sampleData = [
    [
      'CON-2024-001',
      '1',
      '2024-03-15',
      '7',
      'รอส่ง'
    ],
    [
      'CON-2024-001', 
      '2',
      '2024-06-15',
      '14',
      'รอส่ง'
    ],
    [
      'CON-2024-001',
      '3', 
      '2024-09-15',
      '7',
      'รอส่ง'
    ]
  ];

  const csvContent = [
    headers.join(','),
    ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
};

// Download periods template
export const downloadPeriodsTemplate = () => {
  const csvContent = generatePeriodsTemplate();
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'periods_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

// Validation rules for import
export const getValidationRules = () => {
  return {
    contracts: {
      required: ['เลขที่สัญญา', 'ชื่อผู้ติดต่อ'],
      optional: ['หน่วยงาน', 'สถานะ', 'จำนวนงวด', 'หมายเหตุ 1', 'หมายเหตุ 2', 'หมายเหตุ 3', 'หมายเหตุ 4', 'อีเมลแจ้งเตือน'],
      statusOptions: ['CRTD', 'ACTIVE', 'EXPIRED', 'DELETED'],
      maxLength: {
        'เลขที่สัญญา': 50,
        'ชื่อผู้ติดต่อ': 100,
        'หน่วยงาน': 100,
        'หมายเหตุ 1': 255,
        'หมายเหตุ 2': 255,
        'หมายเหตุ 3': 255,
        'หมายเหตุ 4': 255,
        'อีเมลแจ้งเตือน': 255
      }
    },
    periods: {
      required: ['เลขที่สัญญา', 'งวดที่', 'วันที่กำหนดส่ง (YYYY-MM-DD)'],
      optional: ['แจ้งเตือนล่วงหน้า (วัน)', 'สถานะ'],
      statusOptions: ['รอส่ง', 'ส่งแล้ว'],
      dateFormat: 'YYYY-MM-DD'
    }
  };
};

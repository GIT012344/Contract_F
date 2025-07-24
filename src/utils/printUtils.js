// Print utilities for Contract Manager

// Print contract details
export const printContract = (contract, periods = []) => {
  const printWindow = window.open('', '_blank');
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const html = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>รายละเอียดสัญญา - ${contract.contract_no}</title>
      <style>
        @media print {
          @page {
            margin: 2cm;
            size: A4;
          }
        }
        
        body {
          font-family: 'Sarabun', 'Tahoma', sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .header h1 {
          color: #2563eb;
          font-size: 24px;
          margin: 0;
        }
        
        .header p {
          color: #666;
          margin: 5px 0 0 0;
        }
        
        .contract-info {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
        }
        
        .info-label {
          font-weight: bold;
          color: #374151;
          margin-bottom: 5px;
        }
        
        .info-value {
          color: #1f2937;
          padding: 8px 12px;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 4px;
        }
        
        .periods-section {
          margin-top: 30px;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .periods-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        
        .periods-table th,
        .periods-table td {
          border: 1px solid #d1d5db;
          padding: 12px;
          text-align: left;
        }
        
        .periods-table th {
          background: #f1f5f9;
          font-weight: bold;
          color: #374151;
        }
        
        .periods-table tr:nth-child(even) {
          background: #f8fafc;
        }
        
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .status-active { background: #dcfce7; color: #166534; }
        .status-completed { background: #dbeafe; color: #1e40af; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-cancelled { background: #fee2e2; color: #dc2626; }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }
        
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>รายละเอียดสัญญา</h1>
        <p>Contract Manager System</p>
      </div>
      
      <div class="contract-info">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">เลขที่สัญญา</div>
            <div class="info-value">${contract.contract_no || '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">ชื่อผู้ติดต่อ</div>
            <div class="info-value">${contract.contact_name || '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">หน่วยงาน</div>
            <div class="info-value">${contract.department || '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">สถานะ</div>
            <div class="info-value">
              <span class="status-badge status-${contract.status || 'pending'}">
                ${contract.status || '-'}
              </span>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">วันที่สร้าง</div>
            <div class="info-value">${formatDate(contract.created_at)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">จำนวนงวด</div>
            <div class="info-value">${contract.period_count || 0} งวด</div>
          </div>
        </div>
        
        ${contract.remark1 || contract.remark2 || contract.remark3 || contract.remark4 ? `
          <div style="margin-top: 20px;">
            <div class="info-label">หมายเหตุ</div>
            ${contract.remark1 ? `<div class="info-value" style="margin-bottom: 8px;">1. ${contract.remark1}</div>` : ''}
            ${contract.remark2 ? `<div class="info-value" style="margin-bottom: 8px;">2. ${contract.remark2}</div>` : ''}
            ${contract.remark3 ? `<div class="info-value" style="margin-bottom: 8px;">3. ${contract.remark3}</div>` : ''}
            ${contract.remark4 ? `<div class="info-value" style="margin-bottom: 8px;">4. ${contract.remark4}</div>` : ''}
          </div>
        ` : ''}
      </div>
      
      ${periods.length > 0 ? `
        <div class="periods-section">
          <div class="section-title">รายการงวดงาน</div>
          <table class="periods-table">
            <thead>
              <tr>
                <th>งวดที่</th>
                <th>วันที่กำหนดส่ง</th>
                <th>แจ้งเตือนล่วงหน้า</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              ${periods.map(period => `
                <tr>
                  <td>${period.period_no || '-'}</td>
                  <td>${formatDate(period.due_date)}</td>
                  <td>${period.alert_days || 0} วัน</td>
                  <td>
                    <span class="status-badge status-${period.status || 'pending'}">
                      ${period.status || 'pending'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
      
      <div class="footer">
        <p>พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}</p>
        <p>Contract Manager System</p>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
};

// Print contracts list
export const printContractsList = (contracts, filters = {}) => {
  const printWindow = window.open('', '_blank');
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('th-TH');
  };

  const html = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>รายการสัญญา</title>
      <style>
        @media print {
          @page {
            margin: 1.5cm;
            size: A4 landscape;
          }
        }
        
        body {
          font-family: 'Sarabun', 'Tahoma', sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #333;
          margin: 0;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        
        .header h1 {
          color: #2563eb;
          font-size: 20px;
          margin: 0;
        }
        
        .filters {
          background: #f8fafc;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 20px;
          font-size: 11px;
        }
        
        .contracts-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        
        .contracts-table th,
        .contracts-table td {
          border: 1px solid #d1d5db;
          padding: 8px;
          text-align: left;
        }
        
        .contracts-table th {
          background: #f1f5f9;
          font-weight: bold;
          color: #374151;
        }
        
        .contracts-table tr:nth-child(even) {
          background: #f8fafc;
        }
        
        .status-badge {
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: bold;
        }
        
        .status-active { background: #dcfce7; color: #166534; }
        .status-completed { background: #dbeafe; color: #1e40af; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-cancelled { background: #fee2e2; color: #dc2626; }
        
        .footer {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          color: #6b7280;
          font-size: 10px;
        }
        
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>รายการสัญญา</h1>
        <p>Contract Manager System</p>
      </div>
      
      ${Object.keys(filters).length > 0 ? `
        <div class="filters">
          <strong>ตัวกรอง:</strong>
          ${filters.search ? `ค้นหา: "${filters.search}" ` : ''}
          ${filters.status ? `สถานะ: ${filters.status} ` : ''}
          ${filters.department ? `หน่วยงาน: ${filters.department}` : ''}
        </div>
      ` : ''}
      
      <table class="contracts-table">
        <thead>
          <tr>
            <th style="width: 15%">เลขที่สัญญา</th>
            <th style="width: 20%">ชื่อผู้ติดต่อ</th>
            <th style="width: 20%">หน่วยงาน</th>
            <th style="width: 10%">สถานะ</th>
            <th style="width: 10%">จำนวนงวด</th>
            <th style="width: 15%">วันที่สร้าง</th>
            <th style="width: 10%">อีเมลแจ้งเตือน</th>
          </tr>
        </thead>
        <tbody>
          ${contracts.map(contract => `
            <tr>
              <td>${contract.contract_no || '-'}</td>
              <td>${contract.contact_name || '-'}</td>
              <td>${contract.department || '-'}</td>
              <td>
                <span class="status-badge status-${contract.status || 'pending'}">
                  ${contract.status || '-'}
                </span>
              </td>
              <td>${contract.period_count || 0}</td>
              <td>${formatDate(contract.created_at)}</td>
              <td>${contract.alert_emails ? 'มี' : 'ไม่มี'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <p>จำนวนสัญญาทั้งหมด: ${contracts.length} รายการ</p>
        <p>พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}</p>
        <p>Contract Manager System</p>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
};

// Print summary report
export const printSummaryReport = (summary, contracts) => {
  const printWindow = window.open('', '_blank');
  
  const html = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>รายงานสรุปสัญญา</title>
      <style>
        body {
          font-family: 'Sarabun', 'Tahoma', sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .header h1 {
          color: #2563eb;
          font-size: 24px;
          margin: 0;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .stat-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        
        .stat-number {
          font-size: 32px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 5px;
        }
        
        .stat-label {
          color: #6b7280;
          font-size: 14px;
        }
        
        .departments-section {
          margin-top: 30px;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .dept-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .dept-table th,
        .dept-table td {
          border: 1px solid #d1d5db;
          padding: 12px;
          text-align: left;
        }
        
        .dept-table th {
          background: #f1f5f9;
          font-weight: bold;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>รายงานสรุปสัญญา</h1>
        <p>Contract Manager System</p>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">${summary.total}</div>
          <div class="stat-label">สัญญาทั้งหมด</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${summary.active}</div>
          <div class="stat-label">สัญญาที่ใช้งานอยู่</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${summary.completed}</div>
          <div class="stat-label">สัญญาที่เสร็จสิ้น</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${summary.pending}</div>
          <div class="stat-label">สัญญาที่รอดำเนินการ</div>
        </div>
      </div>
      
      <div class="departments-section">
        <div class="section-title">สถิติตามหน่วยงาน</div>
        <table class="dept-table">
          <thead>
            <tr>
              <th>หน่วยงาน</th>
              <th>จำนวนสัญญา</th>
              <th>เปอร์เซ็นต์</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(summary.departments).map(([dept, count]) => `
              <tr>
                <td>${dept}</td>
                <td>${count}</td>
                <td>${((count / summary.total) * 100).toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="footer">
        <p>สร้างรายงานเมื่อ: ${summary.generatedAt}</p>
        <p>Contract Manager System</p>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
};

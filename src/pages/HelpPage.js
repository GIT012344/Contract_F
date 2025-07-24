import React, { useState } from 'react';
import Layout from '../components/Layout';

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    {
      id: 'getting-started',
      title: 'เริ่มต้นใช้งาน',
      icon: '🚀',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">ยินดีต้อนรับสู่ระบบจัดการสัญญา</h3>
            <p className="text-gray-600 mb-4">
              ระบบจัดการสัญญาช่วยให้คุณสามารถจัดการสัญญาและติดตามงวดงานได้อย่างมีประสิทธิภาพ
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-900 mb-2">ขั้นตอนการเริ่มต้น:</h4>
              <ol className="list-decimal list-inside space-y-2 text-blue-800">
                <li>เข้าสู่ระบบด้วยบัญชีผู้ใช้ของคุณ</li>
                <li>ดูภาพรวมในหน้าแดชบอร์ด</li>
                <li>เพิ่มสัญญาใหม่หรือนำเข้าข้อมูลจากไฟล์ CSV</li>
                <li>จัดการงวดงานและติดตามกำหนดส่ง</li>
                <li>ดูรายงานและสถิติการใช้งาน</li>
              </ol>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'contracts',
      title: 'การจัดการสัญญา',
      icon: '📄',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">การเพิ่มสัญญาใหม่</h3>
            <div className="space-y-3">
              <p className="text-gray-600">1. คลิกปุ่ม "เพิ่มสัญญา" ในหน้ารายการสัญญา</p>
              <p className="text-gray-600">2. กรอกข้อมูลสัญญาที่จำเป็น:</p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-gray-600">
                <li>เลขที่สัญญา (บังคับ)</li>
                <li>ชื่อผู้ติดต่อ (บังคับ)</li>
                <li>หน่วยงาน</li>
                <li>สถานะสัญญา</li>
                <li>จำนวนงวด</li>
                <li>หมายเหตุต่างๆ</li>
                <li>อีเมลสำหรับแจ้งเตือน</li>
              </ul>
              <p className="text-gray-600">3. คลิก "บันทึก" เพื่อเพิ่มสัญญา</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">การแก้ไขสัญญา</h3>
            <div className="space-y-3">
              <p className="text-gray-600">1. คลิกที่สัญญาที่ต้องการแก้ไขในรายการ</p>
              <p className="text-gray-600">2. คลิกปุ่ม "แก้ไข" (เฉพาะผู้ดูแลระบบ)</p>
              <p className="text-gray-600">3. แก้ไขข้อมูลที่ต้องการ</p>
              <p className="text-gray-600">4. คลิก "บันทึกการเปลี่ยนแปลง"</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">การลบสัญญา</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">
                <strong>คำเตือน:</strong> การลบสัญญาจะลบข้อมูลทั้งหมดรวมถึงงวดงานและไฟล์แนบ 
                และไม่สามารถกู้คืนได้ (เฉพาะผู้ดูแลระบบ)
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'periods',
      title: 'การจัดการงวดงาน',
      icon: '📅',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">การเพิ่มงวดงาน</h3>
            <div className="space-y-3">
              <p className="text-gray-600">1. เข้าไปในหน้ารายละเอียดสัญญา</p>
              <p className="text-gray-600">2. คลิกปุ่ม "เพิ่มงวด"</p>
              <p className="text-gray-600">3. กรอกข้อมูลงวดงาน:</p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-gray-600">
                <li>หมายเลขงวด</li>
                <li>วันที่กำหนดส่ง</li>
                <li>จำนวนวันแจ้งเตือนล่วงหน้า</li>
                <li>สถานะงวด</li>
              </ul>
              <p className="text-gray-600">4. คลิก "บันทึก"</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">สถานะงวดงาน</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></span>
                <span className="text-gray-700"><strong>รอส่ง:</strong> งวดที่ยังไม่ได้ส่งงาน</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                <span className="text-gray-700"><strong>ส่งแล้ว:</strong> งวดที่ส่งงานเรียบร้อยแล้ว</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'import-export',
      title: 'นำเข้า/ส่งออกข้อมูล',
      icon: '📊',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">การนำเข้าข้อมูลจาก CSV</h3>
            <div className="space-y-3">
              <p className="text-gray-600">1. คลิกปุ่ม "นำเข้าข้อมูล" ในหน้ารายการสัญญา</p>
              <p className="text-gray-600">2. ดาวน์โหลดไฟล์ตัวอย่างเพื่อดูรูปแบบที่ถูกต้อง</p>
              <p className="text-gray-600">3. เตรียมไฟล์ CSV ตามรูปแบบที่กำหนด</p>
              <p className="text-gray-600">4. เลือกไฟล์และคลิก "นำเข้า"</p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">ข้อมูลที่จำเป็นในไฟล์ CSV:</h4>
              <ul className="list-disc list-inside space-y-1 text-yellow-800">
                <li>เลขที่สัญญา (บังคับ)</li>
                <li>ชื่อผู้ติดต่อ (บังคับ)</li>
                <li>หน่วยงาน</li>
                <li>สถานะ (CRTD, ACTIVE, EXPIRED, DELETED)</li>
                <li>จำนวนงวด</li>
                <li>หมายเหตุ 1-4</li>
                <li>อีเมลแจ้งเตือน</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">การส่งออกข้อมูล</h3>
            <div className="space-y-3">
              <p className="text-gray-600">คุณสามารถส่งออกข้อมูลได้ 3 รูปแบบ:</p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-gray-600">
                <li><strong>รายการสัญญา:</strong> ส่งออกข้อมูลสัญญาทั้งหมด</li>
                <li><strong>รายงานสรุป:</strong> ส่งออกสถิติและข้อมูลสรุป</li>
                <li><strong>รายงานแบบกำหนดเอง:</strong> เลือกช่วงเวลาและข้อมูลที่ต้องการ</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'notifications',
      title: 'การแจ้งเตือน',
      icon: '🔔',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">ประเภทการแจ้งเตือน</h3>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">🕐 แจ้งเตือนกำหนดส่ง</h4>
                <p className="text-gray-600">
                  ระบบจะแจ้งเตือนเมื่อใกล้ถึงกำหนดส่งงวดงาน ตามจำนวนวันที่กำหนดไว้
                </p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">⚠️ แจ้งเตือนเกินกำหนด</h4>
                <p className="text-gray-600">
                  ระบบจะแจ้งเตือนเมื่องวดงานเกินกำหนดส่งแล้ว
                </p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">📧 การแจ้งเตือนทางอีเมล</h4>
                <p className="text-gray-600">
                  หากระบุอีเมลในข้อมูลสัญญา ระบบจะส่งการแจ้งเตือนทางอีเมลด้วย
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">การตั้งค่าการแจ้งเตือน</h3>
            <div className="space-y-3">
              <p className="text-gray-600">1. ไปที่หน้า "การตั้งค่า"</p>
              <p className="text-gray-600">2. เลือกแท็บ "การแจ้งเตือน"</p>
              <p className="text-gray-600">3. ปรับตั้งค่าตามต้องการ:</p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-gray-600">
                <li>เปิด/ปิดการแจ้งเตือนทางอีเมล</li>
                <li>เปิด/ปิดการแจ้งเตือนกำหนดส่ง</li>
                <li>เปิด/ปิดการแจ้งเตือนเกินกำหนด</li>
                <li>กำหนดจำนวนวันแจ้งเตือนล่วงหน้า</li>
              </ul>
              <p className="text-gray-600">4. คลิก "บันทึกการเปลี่ยนแปลง"</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'reports',
      title: 'รายงานและสถิติ',
      icon: '📈',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">ประเภทรายงาน</h3>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">📊 รายงานภาพรวม</h4>
                <p className="text-gray-600">
                  แสดงสถิติรวมของสัญญาและงวดงาน เช่น จำนวนสัญญาทั้งหมด สัญญาที่ใช้งานอยู่ งวดที่เกินกำหนด
                </p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">🏢 รายงานตามหน่วยงาน</h4>
                <p className="text-gray-600">
                  แสดงสถิติการใช้งานแยกตามหน่วยงานต่างๆ
                </p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">📅 รายงานรายเดือน</h4>
                <p className="text-gray-600">
                  แสดงสถิติการสร้างสัญญาใหม่ในแต่ละเดือน
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">การใช้งานหน้ารายงาน</h3>
            <div className="space-y-3">
              <p className="text-gray-600">1. ไปที่หน้า "รายงาน"</p>
              <p className="text-gray-600">2. เลือกช่วงเวลาที่ต้องการดูรายงาน</p>
              <p className="text-gray-600">3. คลิก "สร้างรายงาน"</p>
              <p className="text-gray-600">4. ดูข้อมูลสถิติต่างๆ</p>
              <p className="text-gray-600">5. ส่งออกหรือพิมพ์รายงานได้ตามต้องการ</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'troubleshooting',
      title: 'แก้ไขปัญหา',
      icon: '🔧',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">ปัญหาที่พบบ่อย</h3>
            
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">❌ ไม่สามารถเข้าสู่ระบบได้</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>ตรวจสอบชื่อผู้ใช้และรหัสผ่าน</li>
                  <li>ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</li>
                  <li>ลองรีเฟรชหน้าเว็บ</li>
                  <li>ติดต่อผู้ดูแลระบบหากยังไม่สามารถเข้าได้</li>
                </ul>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">📁 ไม่สามารถอัปโหลดไฟล์ได้</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>ตรวจสอบขนาดไฟล์ (ไม่เกิน 10 MB)</li>
                  <li>ตรวจสอบประเภทไฟล์ที่อนุญาต (PDF, DOC, DOCX, JPG, PNG)</li>
                  <li>ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</li>
                  <li>ลองอัปโหลดไฟล์อื่น</li>
                </ul>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">📊 ไม่สามารถนำเข้าข้อมูล CSV ได้</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>ตรวจสอบรูปแบบไฟล์ CSV</li>
                  <li>ตรวจสอบการเข้ารหัสไฟล์ (UTF-8)</li>
                  <li>ตรวจสอบข้อมูลที่จำเป็น (เลขที่สัญญา, ชื่อผู้ติดต่อ)</li>
                  <li>ดาวน์โหลดไฟล์ตัวอย่างและปรับแต่งข้อมูล</li>
                </ul>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">🔔 ไม่ได้รับการแจ้งเตือน</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>ตรวจสอบการตั้งค่าการแจ้งเตือน</li>
                  <li>ตรวจสอบที่อยู่อีเมลในข้อมูลสัญญา</li>
                  <li>ตรวจสอบโฟลเดอร์ Spam ในอีเมล</li>
                  <li>ตรวจสอบวันที่กำหนดส่งและจำนวนวันแจ้งเตือน</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">การติดต่อขอความช่วยเหลือ</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 mb-2">
                หากยังไม่สามารถแก้ไขปัญหาได้ กรุณาติดต่อผู้ดูแลระบบพร้อมข้อมูลดังนี้:
              </p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>รายละเอียดปัญหาที่เกิดขึ้น</li>
                <li>ขั้นตอนที่ทำก่อนเกิดปัญหา</li>
                <li>ข้อความแสดงข้อผิดพลาด (ถ้ามี)</li>
                <li>เบราว์เซอร์และเวอร์ชันที่ใช้</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ความช่วยเหลือ</h1>
          <p className="mt-2 text-gray-600">คู่มือการใช้งานระบบจัดการสัญญา</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white shadow rounded-lg p-4 sticky top-4">
              <h3 className="font-medium text-gray-900 mb-4">หัวข้อ</h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-2">{section.icon}</span>
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:w-3/4">
            <div className="bg-white shadow rounded-lg p-6">
              {sections.find(s => s.id === activeSection)?.content}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

import React, { useState } from "react";

const AddContract = () => {
  const [form, setForm] = useState({
    title: "",
    contractNumber: "",
    partyA: "",
    partyB: "",
    startDate: "",
    endDate: "",
    status: "ร่าง",
    file: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "file") {
      setForm({ ...form, file: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(form);

    // TODO: ส่งไป backend (ใช้ FormData)
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md mt-8">
      <h2 className="text-xl font-bold mb-4">เพิ่มสัญญาใหม่</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">ชื่อสัญญา</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block font-medium">เลขที่สัญญา</label>
          <input
            type="text"
            name="contractNumber"
            value={form.contractNumber}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium">ฝ่าย A</label>
            <input
              type="text"
              name="partyA"
              value={form.partyA}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block font-medium">ฝ่าย B</label>
            <input
              type="text"
              name="partyB"
              value={form.partyB}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium">วันที่เริ่มต้น</label>
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block font-medium">วันหมดอายุ</label>
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
        </div>
        <div>
          <label className="block font-medium">สถานะ</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="ร่าง">ร่าง</option>
            <option value="ระหว่างตรวจสอบ">ระหว่างตรวจสอบ</option>
            <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
            <option value="หมดอายุ">หมดอายุ</option>
          </select>
        </div>
        <div>
          <label className="block font-medium">แนบไฟล์สัญญา (PDF)</label>
          <input
            type="file"
            name="file"
            accept="application/pdf"
            onChange={handleChange}
            className="w-full"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          บันทึกสัญญา
        </button>
      </form>
    </div>
  );
};

export default AddContract;

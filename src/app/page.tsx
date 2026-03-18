"use client";

import Link from "next/link";
import { useAuth } from "./contexts/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <main className="min-h-screen bg-[var(--background)] overflow-hidden">

      {/* 1. Hero Section */}
      <section className="relative bg-[var(--primary-blue)] pt-24 pb-40 px-4">
        {/* 🟢 Wix Style: เพิ่ม animate-float ให้กราฟิกด้านหลังลอยขึ้นลงช้าๆ แบบมีมิติ */}
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none flex justify-end animate-float">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-[800px] h-[800px] -mr-40 -mt-20 transform rotate-12">
            <path fill="#FFFFFF" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.8,-18,97.3,-2.3C97.8,13.4,92.8,29.4,83.1,42.8C73.4,56.2,59.1,67,43.5,75.1C27.9,83.2,11,88.5,-4.8,87.6C-20.6,86.6,-35.4,79.5,-49.6,70C-63.8,60.5,-77.4,48.6,-84.9,33.5C-92.4,18.4,-93.8,0,-89,-16.1C-84.2,-32.2,-73.2,-46.1,-59.6,-55.8C-46,-65.5,-29.8,-71,-14.2,-74.6C1.4,-78.2,17.1,-79.9,30.6,-83.6L44.7,-76.4Z" transform="translate(100 100)" />
          </svg>
        </div>

        {/* 🟢 Wix Style: ใส่ animate-fade-in-up ให้เนื้อหาทั้งหมดค่อยๆ ลอยขึ้นมาตอนเปิดเว็บ */}
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-12 animate-fade-in-up">
          <div className="flex-1 space-y-8 text-center md:text-left">
            <span className="inline-block bg-[var(--accent-red)] text-white px-4 py-1.5 rounded-full text-sm font-bold tracking-wide shadow-lg">
              โครงการประกวดผลงานระดับชาติ
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight flex flex-col">
              <span className="overflow-hidden pb-2">
                <span className="block opacity-0 animate-slide-up-reveal">
                  รวมพลังเพื่อสร้าง
                </span>
              </span>
              <span className="overflow-hidden pb-2 -mt-2">
                <span                   className="block opacity-0 animate-slide-up-reveal text-blue-300"                   style={{ animationDelay: '0.2s' }}                >
                  อนาคตการศึกษาไทย
                </span>
              </span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto md:mx-0 font-light leading-relaxed">
              แพลตฟอร์มรวบรวมและจัดแสดงนวัตกรรม สำหรับนักเรียน คุณครู และศึกษานิเทศก์ ครอบคลุมเขตพื้นที่การศึกษาทั่วประเทศ เพื่อยกระดับคุณภาพการศึกษาอย่างยั่งยืน
            </p>

            {/* ปุ่ม Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start">
              {!loading && (
                !user ? (
                  <Link
                    href="/auth"
                    // 🟢 Wix Style: เพิ่มปุ่มเด้งดึ๋ง (hover:-translate-y-1)
                    className="bg-[var(--accent-red)] text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-red-700 transition-all duration-300 shadow-xl hover:shadow-red-900/50 hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2"
                  >
                    เข้าสู่ระบบ / ลงทะเบียน
                  </Link>
                ) : (
                  <Link 
                    href="/profile" 
                    className="bg-[var(--accent-green)] text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-green-600 transition-all duration-300 shadow-xl hover:shadow-green-900/50 hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2"
                  > 
                    จัดการโปรไฟล์ของคุณ 
                  </Link>
                )
              )}

              <Link
                href="/showcase"
                // 🟢 Wix Style: เปลี่ยนปุ่มรองเป็นแบบ Glass Effect (กระจกใส)
                className="glass-effect text-white border-white/40 px-8 py-4 rounded-full text-lg font-bold hover:bg-white hover:text-[var(--primary-blue)] transition-all duration-300 hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2"
              >
                ดูผลงานทั้งหมด
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Stats Section */}
      {/* 🟢 Wix Style: หน่วงเวลา 0.2 วิ ให้โผล่ขึ้นมาทีหลัง Hero section (เทคนิคน้ำตก) */}
      <section 
        className="max-w-6xl mx-auto px-4 relative z-20 -mt-20 mb-20 animate-fade-in-up" 
        style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
      >
        {/* เปลี่ยนกล่องสถิติเป็นกระจก หรือใส่ Hover ลอยขึ้น */}
        <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-8 md:p-12 border border-gray-100 flex flex-col md:flex-row gap-8 justify-around text-center divide-y md:divide-y-0 md:divide-x divide-gray-100 transition-transform duration-500 hover:-translate-y-2">
          <div className="flex-1 pt-4 md:pt-0">
            <div className="text-5xl font-extrabold text-[var(--accent-red)] mb-2">30,000+</div>
            <div className="text-gray-500 font-medium">โรงเรียนทั่วประเทศ</div>
          </div>
          <div className="flex-1 pt-8 md:pt-0">
            <div className="text-5xl font-extrabold text-[var(--primary-blue)] mb-2">4</div>
            <div className="text-gray-500 font-medium">ระดับการแข่งขัน</div>
          </div>
          <div className="flex-1 pt-8 md:pt-0">
            <div className="text-5xl font-extrabold text-[var(--secondary-blue)] mb-2">100%</div>
            <div className="text-gray-500 font-medium">ระบบการตัดสินออนไลน์</div>
          </div>
        </div>
      </section>

      {/* 3. Information Section */}
      {/* 🟢 Wix Style: หน่วงเวลา 0.4 วิ ให้โผล่ขึ้นมาเป็นอันดับสุดท้าย */}
      <section 
        className="max-w-7xl mx-auto px-4 py-16 text-center animate-fade-in-up"
        style={{ animationDelay: '0.4s', animationFillMode: 'both' }}
      >
        <h2 className="text-3xl font-bold text-[var(--primary-blue)] mb-4">ขั้นตอนการส่งผลงาน</h2>
        <p className="text-gray-500 mb-12">ระบบถูกออกแบบมาให้ใช้งานง่าย ครอบคลุมทุกบทบาท</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '1', title: 'สมัครสมาชิกและเลือกบทบาท', desc: 'ลงทะเบียนง่ายๆ ด้วย Google และยืนยันตัวตนในฐานะนักเรียน ครู หรือผู้บริหาร' },
            { step: '2', title: 'ผ่านการอบรมกติกา', desc: 'รับชมวิดีโอปฐมนิเทศ เพื่อทำความเข้าใจกติกาการส่งผลงาน' },
            { step: '3', title: 'ส่งผลงานและรอรับรางวัล', desc: 'อัปโหลดเอกสาร PDF และวิดีโอ เข้าสู่ระบบการคัดเลือกระดับเขต' }
          ].map((item, idx) => (
            // 🟢 Wix Style: ใส่ class 'group' และ hover:-translate-y-3 ให้การ์ดเด้งลอยขึ้นมาตอนเอาเมาส์ชี้
            <div key={idx} className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-3 cursor-pointer">
              {/* 🟢 Wix Style: ไอคอนสั่น/เด้งเบาๆ ตอนชี้ที่การ์ด */}
              <div className="w-16 h-16 bg-blue-50 text-[var(--secondary-blue)] rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 group-hover:scale-110 group-hover:bg-[var(--primary-blue)] group-hover:text-white transition-all duration-300">
                {item.step}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-[var(--primary-blue)] transition-colors">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
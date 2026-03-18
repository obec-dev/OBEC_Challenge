"use client";

import Link from 'next/link';
import { UserProfile } from './UserProfile';
import { useAuth } from '../contexts/AuthContext';
import Image from 'next/image'

export function Nav() {
  const { currentRole, user } = useAuth();

  const getNavigationLinks = () => {
    const baseLinks = [
      { href: "/", label: "หน้าแรก" },
      { href: "/showcase", label: "ผลงานนักเรียน" },
    ];

    if (currentRole === 'personal') {
      return [...baseLinks, { href: "/training", label: "หลักสูตรอบรม" }];
    } else if (currentRole === 'school_admin') {
      return [
        ...baseLinks,
        { href: "/team", label: "จัดการทีม" },
        { href: "/submission", label: "ส่งผลงาน" },
        { href: "/review", label: "ตรวจสอบผลงาน" },
      ];
    }
    return baseLinks;
  };

  const navigationLinks = getNavigationLinks();

  return (
    /*<nav className="sticky top-0 z-50 w-full bg-white shadow-sm border-b-[3px] border-[var(--accent-red)] transition-all">*/
      <nav className="sticky top-0 z-50 w-full glass-effect transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          {/* 🟢 กลุ่มด้านซ้าย: จับโลโก้ และ ลิงก์เมนู มัดรวมกันไว้ใน div นี้ */}
          <div className="flex items-center gap-8">

            {/* 1. โลโก้ */}
            <Link href="/" className="flex items-center group">
              <Image
                src="/OBEC_Challenge_small.png"
                alt="OBEC Challenge Logo"
                width={160}
                height={40}
                className="object-contain" // ใช้ object-contain เพื่อให้ภาพไม่บิดเบี้ยว
              />
            </Link>

            {/* 2. ลิงก์เมนู (ย้ายมาต่อท้ายโลโก้) */}
            {/* ผมแอบเติม border-l-2 pl-8 เพื่อทำเส้นคั่นบางๆ ระหว่างโลโก้กับเมนูให้ด้วยครับ ถ้าไม่ชอบลบออกได้เลย */}
            <div className="hidden md:flex space-x-8 border-l-2 border-gray-100 pl-8">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[var(--primary-blue)] font-medium hover:text-[var(--accent-red)] transition-colors py-2"
                >
                  {link.label}
                </Link>
              ))}
            </div>

          </div>

          {/* 🔵 กลุ่มด้านขวา: โปรไฟล์ / ปุ่มล็อกอิน (อยู่ขวาสุดเหมือนเดิม) */}
          <div className="flex items-center">
            {user ? (
              <UserProfile />
            ) : (
              <Link
                href="/auth"
                /*className="bg-[var(--primary-blue)] text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-[var(--secondary-blue)] hover:shadow-md transition-all"*/
                className="bg-[var(--primary-blue)] text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 hover:bg-[var(--accent-red)] hover:shadow-lg hover:-translate-y-1 active:translate-y-0"
              >
                เข้าสู่ระบบ
              </Link>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
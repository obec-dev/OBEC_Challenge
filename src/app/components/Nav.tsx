"use client";

import Link from 'next/link';
import { UserProfile } from './UserProfile';
import { useAuth } from '../contexts/AuthContext';

export function Nav() {
  const { currentRole, user } = useAuth();

  const getNavigationLinks = () => {
    const baseLinks = [
      { href: "/", label: "หน้าแรก" },
      { href: "/showcase", label: "นิทรรศการ (Showcase)" },
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
    // เปลี่ยนเป็นพื้นขาว มีเงาบางๆ และขอบเส้นสีแดงด้านล่าง
    <nav className="sticky top-0 z-50 w-full bg-white shadow-sm border-b-[3px] border-[var(--accent-red)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* โลโก้ด้านซ้าย */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-[var(--primary-blue)] text-white rounded-lg flex items-center justify-center font-bold text-xl group-hover:bg-[var(--accent-red)] transition-colors">
                O
              </div>
              <div>
                <h1 className="font-extrabold text-[var(--primary-blue)] text-lg leading-none tracking-wide">
                  OBEC
                </h1>
                <p className="text-xs text-gray-500 font-medium">School Challenge</p>
              </div>
            </Link>
          </div>

          {/* ลิงก์ตรงกลาง */}
          <div className="hidden md:flex space-x-8">
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

          {/* โปรไฟล์ด้านขวา */}
          <div className="flex items-center">
            {user ? (
              <UserProfile />
            ) : (
              <Link 
                href="/auth" 
                className="bg-[var(--primary-blue)] text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-[var(--secondary-blue)] hover:shadow-md transition-all"
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
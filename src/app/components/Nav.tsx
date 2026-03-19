"use client";

import Link from 'next/link';
import { UserProfile } from './UserProfile';
import { useAuth } from '../contexts/AuthContext';
import Image from 'next/image';

export function Nav() {
  const { user } = useAuth();

  return (
    <nav className="sticky top-0 z-50 w-full glass-effect transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          <div className="flex items-center gap-8">

            <Link href="/" className="flex items-center group">
              <Image
                src="/OBEC_Challenge_small.png"
                alt="OBEC Challenge Logo"
                width={160}
                height={40}
                className="object-contain"
              />
            </Link>

            <div className="hidden md:flex space-x-8 border-l-2 border-gray-100 pl-8">
              <Link
                href="/showcase"
                className="text-[var(--primary-blue)] font-medium hover:text-[var(--accent-red)] transition-colors py-2"
              >
                หน้าหลัก / ผลงานแนะนำ
              </Link>

              {user && (
                <>
                  <div className="relative group">
                    <button
                      className="text-[var(--primary-blue)] font-medium hover:text-[var(--accent-red)] transition-colors py-2"
                    >
                      พื้นที่ผู้สมัคร
                    </button>
                    <div className="absolute left-0 pt-2 w-48 hidden group-hover:block">
                      <div className="bg-white rounded-md shadow-lg py-1">
                        <Link href="/training" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">คู่มือและกติกา</Link>
                        <Link href="/team" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">จัดการทีมประกวด</Link>
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <button
                      className="text-[var(--primary-blue)] font-medium hover:text-[var(--accent-red)] transition-colors py-2"
                    >
                      จัดการในนามโรงเรียน
                    </button>
                    <div className="absolute left-0 pt-2 w-48 hidden group-hover:block">
                      <div className="bg-white rounded-md shadow-lg py-1">
                        <Link href="/submission" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">ส่งผลงานใหม่</Link>
                        <Link href="/review" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">เช็กสถานะผลงาน</Link>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center">
            {user ? (
              <UserProfile />
            ) : (
              <Link
                href="/auth"
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
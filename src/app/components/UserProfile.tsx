"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";

type School = {
  school_name: string;
  district_name: string;
};

export function UserProfile() {
  const { user, profile, currentRole, userRoles, setCurrentRole } = useAuth();
  const [school, setSchool] = useState<School | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    async function loadSchool() {
      if (profile?.school_id) {
        const { data: schoolData } = await supabase
          .from("schools")
          .select("school_name, district_name")
          .eq("id", profile.school_id)
          .single();
        setSchool(schoolData as School);
      }
    }
    loadSchool();
  }, [profile]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getRoleDisplay = () => {
    if (!currentRole) return "เลือกบทบาท";

    switch (currentRole) {
      case 'personal':
        return 'ส่วนตัว';
      case 'school_admin':
        return 'ผู้ดูแลโรงเรียน';
      default:
        return currentRole;
    }
  };

  const getSubRoleDisplay = () => {
    if (!profile?.sub_role) return "";

    const roleMap: { [key: string]: string } = {
      'student': 'นักเรียน',
      'teacher': 'ครู',
      'director': 'ผู้อำนวยการ',
      'vice_director': 'รองผู้อำนวยการ'
    };

    return roleMap[profile.sub_role] || profile.sub_role;
  };

  const availableRoles = [];
  if (userRoles) {
    availableRoles.push({ type: 'personal', title: 'ส่วนตัว', icon: '👤' });
    if (userRoles.has_school_admin) {
      availableRoles.push({ type: 'school_admin', title: 'ผู้ดูแลโรงเรียน', icon: '🏫' });
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      alert('เกิดข้อผิดพลาดในการออกจากระบบ');
    }
  };

  if (!user) {
    return (
      <Link href="/auth" className="text-blue-700 hover:text-blue-900 font-medium">
        เข้าสู่ระบบ
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center space-x-2 focus:outline-none"
      >
        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
          {getInitials(profile?.full_name)}
        </div>
        <span className="text-blue-700 font-medium hidden md:block">
          {profile?.full_name ?? user.email}
        </span>
        <span className="text-blue-500 text-sm hidden lg:block">
          ({getRoleDisplay()})
        </span>
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-blue-200 z-50">
          <div className="px-4 py-3 border-b border-blue-200">
            <p className="text-sm font-medium text-blue-900">{profile?.full_name ?? user.email}</p>
            <p className="text-xs text-blue-600">{getSubRoleDisplay()}</p>
            {school && (
              <p className="text-xs text-blue-500 mt-1">
                {school.school_name} ({school.district_name})
              </p>
            )}
            <p className="text-xs text-blue-400 mt-1">
              บทบาทปัจจุบัน: {getRoleDisplay()}
            </p>
          </div>

          {availableRoles.length > 1 && (
            <div className="py-2 border-b border-blue-100">
              <p className="px-4 py-1 text-xs font-medium text-blue-700 uppercase tracking-wide">
                สลับบทบาท
              </p>
              {availableRoles.map((role) => (
                <button
                  key={role.type}
                  onClick={() => {
                    setCurrentRole(role.type);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 flex items-center space-x-2 ${
                    currentRole === role.type ? 'bg-blue-50 border-l-2 border-blue-600' : ''
                  }`}
                >
                  <span>{role.icon}</span>
                  <span>{role.title}</span>
                </button>
              ))}
            </div>
          )}

          <div className="py-1">
            <Link
              href="/profile"
              className="block px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
              onClick={() => setDropdownOpen(false)}
            >
              จัดการโปรไฟล์
            </Link>
            <button
              onClick={signOut}
              className="block w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
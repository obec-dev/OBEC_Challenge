"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";

type School = {
  school_name: string;
  district_name: string;
};

export function UserProfile() {
  const supabase = createClient();

  const { user, profile } = useAuth();
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

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out (ignoring):', error);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    }
  };

  if (!user) {
    return (
      <Link href="/auth" className="text-[var(--primary-blue)] hover:text-[var(--secondary-blue)] font-bold transition-colors">
        เข้าสู่ระบบ
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center space-x-2 focus:outline-none hover:opacity-80 transition-opacity"
      >
        <div className="w-8 h-8 bg-[var(--primary-blue)] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
          {getInitials(profile?.full_name)}
        </div>
        <span className="text-[var(--primary-blue)] font-bold hidden md:block">
          {profile?.full_name ?? user.email}
        </span>
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-gray-100 z-50 animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
            <p className="text-sm font-bold text-[var(--secondary-blue)]">{profile?.full_name ?? user.email}</p>
            <p className="text-xs font-medium text-[var(--primary-blue)] mt-0.5">{getSubRoleDisplay()}</p>
            {school && (
              <p className="text-xs text-gray-500 mt-1.5">
                {school.school_name} ({school.district_name})
              </p>
            )}
          </div>

          <div className="py-1">
            <Link
              href="/profile"
              className="block px-4 py-2.5 text-sm font-medium text-[var(--secondary-blue)] hover:bg-gray-50 hover:text-[var(--primary-blue)] transition-colors"
              onClick={() => setDropdownOpen(false)}
            >
              จัดการโปรไฟล์
            </Link>
            <button
              onClick={signOut}
              className="block w-full text-left px-4 py-2.5 text-sm font-medium text-[var(--accent-red)] hover:bg-red-50 transition-colors rounded-b-xl"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
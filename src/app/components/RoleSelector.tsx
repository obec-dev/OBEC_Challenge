"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

type UserRoles = {
  personal_role: string;
  has_school_admin: boolean;
  sub_role: string;
  school_id: string | null;
  district_id: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  sub_role: string | null;
  training_flag: boolean;
  school_id: string | null;
  district_id: string | null;
  personal_role: string;
};

export default function RoleSelector({ onRoleSelected }: { onRoleSelected: (role: string) => void }) {
  const [userRoles, setUserRoles] = useState<UserRoles | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserRoles();
  }, []);

  // 🟢 ฟังก์ชันไม้ตาย ล้างไส้ติ่งและเตะกลับหน้าแรก
  const forceLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Logout error (ignoring):", e);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    }
  };

  const loadUserRoles = async () => {
    try {
      // 🟢 เช็คว่า Token ยังมีชีวิตอยู่ไหมก่อนทำอย่างอื่น
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Auth Token is dead");

      // Get user roles
      const { data: rolesData, error: rolesError } = await supabase.rpc('get_user_roles');
      if (rolesError) throw rolesError;
      setUserRoles(rolesData);

      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading user roles (Ghost Session):', error);
      // 🧹 ถ้า Token พัง ให้เตะออกอัตโนมัติ ไม่ต้องรอให้ผู้ใช้กด!
      forceLogout();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-blue-600">กำลังโหลด...</div>
      </div>
    );
  }

  // ถ้าถูกเตะออกไปแล้ว (profile เป็น null) จะไม่โชว์ UI Error หลอกตาผู้ใช้อีก
  if (!userRoles || !profile) return null;

  const availableRoles = [];

  // Always have personal role
  availableRoles.push({
    type: 'personal',
    title: 'ส่วนตัว',
    description: 'ดูวิดีโอศึกษากติกา และเข้าร่วมทีม',
    icon: '👤'
  });

  // Add school admin role if available
  if (userRoles.has_school_admin) {
    availableRoles.push({
      type: 'school_admin',
      title: 'ผู้ดูแลโรงเรียน',
      description: 'จัดการทีมและส่งผลงานของโรงเรียน',
      icon: '🏫'
    });
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-50">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-900 mb-2">
            ยินดีต้อนรับ, {profile.full_name}
          </h1>
          <p className="text-blue-600">
            เลือกบทบาทที่ต้องการใช้งาน
          </p>
        </div>

        <div className="space-y-4">
          {availableRoles.map((role) => (
            <button
              key={role.type}
              onClick={() => onRoleSelected(role.type)}
              className="w-full bg-white rounded-xl border border-blue-200 p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 text-left group"
            >
              <div className="flex items-start space-x-4">
                <div className="text-3xl">{role.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900 mb-1">
                    {role.title}
                  </h3>
                  <p className="text-blue-600 text-sm">
                    {role.description}
                  </p>
                </div>
                <div className="text-blue-400 group-hover:text-blue-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 text-center">
          {/* 🟢 เปลี่ยนมาใช้ฟังก์ชัน forceLogout แทนคำสั่งเดิม */}
          <button
            onClick={forceLogout}
            className="text-blue-500 hover:text-blue-700 text-sm underline"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  );
}
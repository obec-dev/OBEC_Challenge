"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

type School = {
  id: string;
  school_code: string;
  school_name: string;
  district_name: string;
  province: string;
};

type Profile = {
  id: string;
  school_id: string | null;
  district_id: string | null;
};

export default function SchoolProfileCreator({ onComplete }: { onComplete: () => void }) {
  const [schools, setSchools] = useState<School[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get user profile
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, school_id, district_id')
        .eq('id', user.user.id)
        .single();

      setProfile(profileData);

      // Get schools that don't have admin yet
      const { data: schoolsData } = await supabase
        .from('schools')
        .select('*')
        .order('school_name');

      // Filter schools that don't have school profile and are in same district
      const availableSchools = schoolsData?.filter(school =>
        school.district_name === profileData?.district_id &&
        !school.school_code.includes('HAS_ADMIN') // This is a placeholder - in real implementation we'd check school_profiles table
      ) || [];

      setSchools(availableSchools);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSchoolProfile = async () => {
    if (!selectedSchoolId) return;

    setCreating(true);
    try {
      const { data, error } = await supabase.rpc('create_school_profile', {
        target_school_id: selectedSchoolId
      });

      if (error) throw error;

      alert('สร้างโปรไฟล์โรงเรียนสำเร็จ!');
      onComplete();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert('เกิดข้อผิดพลาด: ' + errorMessage);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-blue-600">กำลังโหลด...</div>
      </div>
    );
  }

  if (schools.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-xl border border-blue-200 p-6 shadow-sm text-center">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              ไม่มีโรงเรียนที่สามารถสร้างโปรไฟล์ได้
            </h2>
            <p className="text-blue-600 text-sm mb-6">
              โรงเรียนในเขตของคุณไม่มีข้อมูล หรือ มีผู้ดูแลแล้ว
            </p>
            <button
              onClick={onComplete}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              ข้ามไปก่อน
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl border border-blue-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-blue-900 mb-4 text-center">
            สร้างโปรไฟล์โรงเรียน
          </h2>

          <p className="text-blue-600 text-sm mb-6 text-center">
            เลือกโรงเรียนที่คุณต้องการเป็นผู้ดูแล
          </p>

          <div className="space-y-4">
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="w-full rounded-md border border-blue-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="">เลือกโรงเรียน</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.school_name} ({school.district_name})
                </option>
              ))}
            </select>

            <button
              onClick={createSchoolProfile}
              disabled={creating || !selectedSchoolId}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {creating ? "กำลังสร้าง..." : "สร้างโปรไฟล์โรงเรียน"}
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={onComplete}
              className="text-blue-500 hover:text-blue-700 text-sm underline"
            >
              ข้ามไปก่อน
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
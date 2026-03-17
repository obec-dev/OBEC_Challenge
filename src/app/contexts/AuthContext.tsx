"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

type UserRole = {
  personal_role: string;
  has_school_admin: boolean;
  sub_role: string;
  school_id: string | null;
  district_id: string | null;
};

type UserProfile = {
  full_name: string | null;
  sub_role: string | null;
  school_id: string | null;
  district_id: string | null;
  personal_role: string;
};

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  currentRole: string | null;
  userRoles: UserRole | null;
  setCurrentRole: (role: string) => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentRole, _setCurrentRole] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true; 

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentRole' && mounted) {
        _setCurrentRole(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 🛡️ 1. ระบบดึง Profile แบบ "ถึกทน" (Retry Mechanism) แก้บักเน็ตกระตุกตอนรีเฟรช
    const fetchProfileData = async (userId: string, retries = 3) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (profileError) throw profileError;

          if (mounted) setProfile(profileData);

          const { data: rolesData, error: rolesError } = await supabase.rpc('get_user_roles');
          if (!rolesError && mounted) setUserRoles(rolesData);

          return; // 🟢 ถ้าสำเร็จแล้ว ให้กระโดดออกจาก Loop จบการทำงานทันที
        } catch (error) {
          console.warn(`[Auth] โหลด Profile ไม่สำเร็จ (รอบที่ ${attempt}/${retries}) กำลังลองใหม่...`, error);
          if (attempt < retries) {
            // ⏳ รอ 1 วินาที ให้เบราว์เซอร์ต่อเน็ตให้เสร็จ แล้วค่อยวิ่งไปถาม DB ใหม่
            await new Promise(resolve => setTimeout(resolve, 1000)); 
          }
        }
      }
    };

    const initAuth = async () => {
      // ตัวจับเวลาเผื่อฉุกเฉิน
      const safetyTimer = setTimeout(() => {
        if (mounted) setLoading(false);
      }, 8000);

      try {
        const storedRole = localStorage.getItem('currentRole');
        if (storedRole) {
          _setCurrentRole(storedRole);
        } else {
          _setCurrentRole('personal');
          localStorage.setItem('currentRole', 'personal');
        }

        // อ่านกุญแจในเครื่อง (ไวสุด)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (session?.user) {
          if (mounted) setUser(session.user);
          
          // 🚀 เรียกใช้ระบบดึงข้อมูลแบบใหม่ที่มีความพยายาม 3 รอบ!
          await fetchProfileData(session.user.id);

          // เช็ค Token กับ Server เบื้องหลังแบบเงียบๆ
          supabase.auth.getUser().then(({ error }) => {
            if (error && (error.status === 401 || error.status === 403 || error.name === 'AuthApiError')) {
              console.error("Token หมดอายุของจริง ล้างเครื่อง!");
              if (mounted) {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = "/";
              }
            }
          });
        } else {
          if (mounted) setLoading(false);
        }
      } catch (error) {
        console.error("Auth Exception:", error);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setUserRoles(null);
        }
      } finally {
        clearTimeout(safetyTimer);
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // ดักจับการเปลี่ยนแปลงสถานะ Login
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'INITIAL_SESSION') return; // ข้าม เพราะเราใช้ initAuth จัดการไปแล้วเพื่อความชัวร์

      setUser(session?.user ?? null);

      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setUserRoles(null);
        _setCurrentRole(null);
        localStorage.clear();
        sessionStorage.clear();
        setLoading(false);
        return;
      }

      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        const existingRole = localStorage.getItem('currentRole');
        if (!existingRole) {
          _setCurrentRole('personal');
          localStorage.setItem('currentRole', 'personal');
        }
        await fetchProfileData(session.user.id);
        if (mounted) setLoading(false);
      } else if (!session?.user) {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const setCurrentRole = (role: string | null) => {
    if (role) {
      const isRoleChanged = currentRole !== null && currentRole !== role;
      localStorage.setItem('currentRole', role);
      _setCurrentRole(role);
      
      if (isRoleChanged) {
        router.push('/');
      }
    } else {
      localStorage.removeItem('currentRole');
      _setCurrentRole(null);
    }
  };

  const value = { user, profile, currentRole, userRoles, setCurrentRole, loading };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
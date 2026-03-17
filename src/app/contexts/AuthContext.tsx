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

    // 🛡️ 1. จัดการ Sync ข้อมูลเมื่อมีการเปลี่ยน Role จาก Tab อื่น
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentRole' && mounted) {
        _setCurrentRole(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 🛡️ 2. ย้าย fetchProfileData เข้ามาใน useEffect ป้องกัน Stale Closure
    const fetchProfileData = async (userId: string) => {
      const safetyTimer = setTimeout(() => {
        if (mounted) setLoading(false); // บังคับหยุดหมุนถ้าเกิน 8 วินาที
      }, 8000);

      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileData && mounted) {
          setProfile(profileData);
          const { data: rolesData } = await supabase.rpc('get_user_roles');
          if (rolesData && mounted) setUserRoles(rolesData);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        clearTimeout(safetyTimer); // ยกเลิกตัวจับเวลาถ้าทำเสร็จก่อน
        if (mounted) setLoading(false); 
      }
    };

    const initAuth = async () => {
      const storedRole = localStorage.getItem('currentRole');
      if (storedRole) {
        _setCurrentRole(storedRole);
      } else {
        _setCurrentRole('personal');
        localStorage.setItem('currentRole', 'personal');
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      
      // ป้องกัน Error กรณีเน็ตหลุดตอนเปิด Tab
      if (error) {
        console.error("Auth Session Error:", error);
        if (mounted) setLoading(false);
        return;
      }

      if (session?.user) {
        if (mounted) setUser(session.user);
        await fetchProfileData(session.user.id);
      } else {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      setUser(session?.user ?? null);

      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setUserRoles(null);
        _setCurrentRole(null);
        localStorage.removeItem('currentRole');
        setLoading(false);
        return;
      }

      if (session?.user) {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          const existingRole = localStorage.getItem('currentRole');
          if (!existingRole) {
            _setCurrentRole('personal');
            localStorage.setItem('currentRole', 'personal');
          }
          await fetchProfileData(session.user.id);
        }
      } else {
        setLoading(false);
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
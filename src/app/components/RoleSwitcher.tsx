"use client";

import { useAuth } from '../contexts/AuthContext';

type RoleSwitcherProps = {
  onRoleSelected?: (role: string) => void;
};

export default function RoleSwitcher({ onRoleSelected }: RoleSwitcherProps) {
  const { currentRole, setCurrentRole, userRoles } = useAuth();

  if (!userRoles) return null;

  const availableRoles = [];

  // Always have personal role
  availableRoles.push({
    type: 'personal',
    title: 'ส่วนตัว',
    icon: '👤'
  });

  // Add school admin role if available
  if (userRoles.has_school_admin) {
    availableRoles.push({
      type: 'school_admin',
      title: 'ผู้ดูแลโรงเรียน',
      icon: '🏫'
    });
  }

  if (availableRoles.length <= 1) return null; // Don't show if only one role

  const handleRoleClick = (roleType: string) => {
    setCurrentRole(roleType);
    if (onRoleSelected) {
      onRoleSelected(roleType);
    }
  };

  return (
    <div className="bg-white border border-blue-200 rounded-lg p-3 mb-4">
      <div className="text-sm text-blue-600 mb-2">สลับบทบาท:</div>
      <div className="flex space-x-2">
        {availableRoles.map((role) => (
          <button
            key={role.type}
            onClick={() => handleRoleClick(role.type)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
              currentRole === role.type
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            <span>{role.icon}</span>
            <span>{role.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
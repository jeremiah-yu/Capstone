import React from 'react';
import { SuperAdminDashboard } from './dashboards/SuperAdminDashboard';
import { DeptHeadDashboard } from './dashboards/DeptHeadDashboard';
import { FacultyDashboard } from './dashboards/FacultyDashboard';
import { StudentDashboard } from './dashboards/StudentDashboard';

interface DashboardProps {
  user: any;
}

export function Dashboard({ user }: DashboardProps) {
  if (!user) return null;

  switch (user.role) {
    case 'super_admin':
      return <SuperAdminDashboard />;
    case 'dept_head':
      return <DeptHeadDashboard user={user} />;
    case 'instructor':
      return <FacultyDashboard user={user} />;
    case 'student':
      return <StudentDashboard />;
    default:
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
            <span className="text-2xl font-bold">!</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard Not Available</h2>
            <p className="text-gray-500 max-w-md">Your account role does not have a dashboard assigned yet. Please contact the system administrator.</p>
          </div>
        </div>
      );
  }
}

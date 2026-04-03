import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

export function FacultyDashboard({ user }: { user: any }) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const [subjectsRes, studentsRes] = await Promise.all([
        fetch('/api/instructor/subjects', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/instructor/students', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      setSubjects(await subjectsRes.json());
      setStudents(await studentsRes.json());
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="animate-pulse p-8">Loading Faculty Dashboard...</div>;

  const highRiskStudents = students.filter(s => s.risk_level === 'High');

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Faculty Dashboard</h2>
        <p className="text-gray-500">Welcome back, {user.name}. Here is your current subject load.</p>
      </div>

      {/* Faculty Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-blue-500 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">Assigned Subjects</p>
              <h3 className="text-2xl font-black">{subjects.length}</h3>
            </div>
          </div>
        </div>
        <div className="card bg-grass-green text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">Total Students</p>
              <h3 className="text-2xl font-black">{students.length}</h3>
            </div>
          </div>
        </div>
        <div className="card bg-soft-yellow text-gray-900">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black/10 rounded-xl flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-60">At-Risk Students</p>
              <h3 className="text-2xl font-black">{highRiskStudents.length}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Subject Load */}
        <div className="card">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Clock size={20} className="text-gray-400" />
            Current Subject Load
          </h3>
          <div className="space-y-4">
            {subjects.map((sub) => (
              <div key={sub.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-gray-900">{sub.subject_name}</h4>
                    <p className="text-xs text-gray-500">{sub.subject_code} • {sub.program_name}</p>
                  </div>
                  <span className="px-2 py-1 bg-white text-[10px] font-bold rounded border border-gray-200">
                    Year {sub.year_level} - Sem {sub.semester}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                    <Users size={14} />
                    Section {sub.section}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* At-Risk Students List */}
        <div className="card">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-red-600">
            <AlertTriangle size={20} />
            Students Requiring Attention
          </h3>
          <div className="space-y-4">
            {highRiskStudents.length > 0 ? (
              highRiskStudents.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-bold">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.program_name} • GPA: {s.gpa.toFixed(2)}</p>
                    </div>
                  </div>
                  <button className="text-xs font-bold text-grass-green hover:underline">View Details</button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 italic text-sm">
                No high-risk students found in your classes.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { Users, Building2, BookOpen, TrendingUp, AlertTriangle, Shield } from 'lucide-react';

export function SuperAdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/analytics/global', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const stats = await res.json();
        setData(stats);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchGlobalStats();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  if (error) return (
    <div className="p-8 text-center">
      <div className="bg-red-50 text-red-600 p-4 rounded-lg inline-block">
        <p className="font-bold">Error loading dashboard</p>
        <p className="text-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );

  const COLORS = ['#4CAF50', '#FFD54F', '#3B82F6', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">College Global Control</h2>
        <p className="text-gray-500">Multi-Department Enterprise Overview</p>
      </div>

      {/* Global Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Students', value: data.stats.total_students, icon: Users, color: 'bg-blue-500' },
          { label: 'Departments', value: data.stats.total_depts, icon: Building2, color: 'bg-grass-green' },
          { label: 'Programs', value: data.stats.total_programs, icon: BookOpen, color: 'bg-purple-500' },
          { label: 'Avg GPA', value: data.stats.avg_gpa?.toFixed(2) || '0.00', icon: TrendingUp, color: 'bg-soft-yellow', textColor: 'text-gray-900' },
        ].map((stat, i) => (
          <div key={i} className="card group hover:scale-[1.02] transition-transform cursor-default">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.color} ${stat.textColor || 'text-white'} shadow-lg`}>
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-3xl font-black text-gray-900">{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Department Performance Chart */}
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-bold mb-8">Departmental Performance & Enrollment</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.deptBreakdown}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="code" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="student_count" name="Students" fill="#4CAF50" radius={[6, 6, 0, 0]} barSize={40} />
                <Bar dataKey="avg_gpa" name="Avg GPA" fill="#FFD54F" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Enrollment Distribution */}
        <div className="card">
          <h3 className="text-lg font-bold mb-8">Enrollment Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.deptBreakdown}
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="student_count"
                  nameKey="name"
                >
                  {data.deptBreakdown.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4 mt-4">
            {data.deptBreakdown.map((dept: any, index: number) => (
              <div key={dept.code} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-gray-500">{dept.code}</span>
                </div>
                <span className="font-bold">{dept.student_count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Directory */}
      <div className="card overflow-hidden p-0">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold">Department Directory</h3>
          <button className="text-sm font-bold text-grass-green hover:underline">Manage Departments</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Department</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Code</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Students</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Avg GPA</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.deptBreakdown.map((dept: any) => (
                <tr key={dept.code} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-grass-green/10 text-grass-green rounded-xl flex items-center justify-center font-bold">
                        {dept.code.charAt(0)}
                      </div>
                      <p className="text-sm font-bold text-gray-900">{dept.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-600">{dept.code}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-gray-900">{dept.student_count}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-gray-900">{dept.avg_gpa?.toFixed(2) || '0.00'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-green-100 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

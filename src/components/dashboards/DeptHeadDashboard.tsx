import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { Users, BookOpen, TrendingUp, AlertTriangle, Shield, GraduationCap } from 'lucide-react';

export function DeptHeadDashboard({ user }: { user: any }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeptStats = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/analytics/department/${user.dept_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const stats = await res.json();
      setData(stats);
      setLoading(false);
    };
    fetchDeptStats();
  }, [user.dept_id]);

  if (loading) return <div className="animate-pulse p-8">Loading Department Analytics...</div>;

  const COLORS = ['#4CAF50', '#FFD54F', '#3B82F6', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Department Dashboard</h2>
        <p className="text-gray-500">Academic Monitoring for {user.dept_name || 'Your Department'}</p>
      </div>

      {/* Dept Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Students', value: data.stats.total_students, icon: Users, color: 'bg-blue-500' },
          { label: 'High Risk', value: data.stats.high_risk_count, icon: AlertTriangle, color: 'bg-soft-yellow', textColor: 'text-gray-900' },
          { label: 'Avg GPA', value: data.stats.avg_gpa?.toFixed(2) || '0.00', icon: TrendingUp, color: 'bg-grass-green' },
          { label: 'Programs', value: data.programBreakdown.length, icon: BookOpen, color: 'bg-purple-500' },
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
        {/* Program Performance Chart */}
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-bold mb-8">Program Performance & Enrollment</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.programBreakdown}>
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

        {/* Program Distribution */}
        <div className="card">
          <h3 className="text-lg font-bold mb-8">Program Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.programBreakdown}
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="student_count"
                  nameKey="name"
                >
                  {data.programBreakdown.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4 mt-4">
            {data.programBreakdown.map((prog: any, index: number) => (
              <div key={prog.code} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-gray-500">{prog.code}</span>
                </div>
                <span className="font-bold">{prog.student_count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Program Directory */}
      <div className="card overflow-hidden p-0">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold">Program Directory</h3>
          <button className="text-sm font-bold text-grass-green hover:underline">Manage Programs</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Program</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Code</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Students</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Avg GPA</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.programBreakdown.map((prog: any) => (
                <tr key={prog.code} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center font-bold">
                        <GraduationCap size={18} />
                      </div>
                      <p className="text-sm font-bold text-gray-900">{prog.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-600">{prog.code}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-gray-900">{prog.student_count}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-gray-900">{prog.avg_gpa?.toFixed(2) || '0.00'}</span>
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

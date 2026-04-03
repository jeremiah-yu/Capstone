import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { BookOpen, Clock, AlertTriangle, TrendingUp, GraduationCap, Award } from 'lucide-react';

export function StudentDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/student/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const student = await res.json();
      setData(student);
      setLoading(false);
    };
    fetchStudentData();
  }, []);

  if (loading) return <div className="animate-pulse p-8">Loading Your Academic Profile...</div>;

  const chartData = data.records?.map((r: any) => ({
    name: r.subject_code,
    score: r.score
  })).reverse();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Student Academic Hub</h2>
          <p className="text-gray-500">Welcome back, {data.name}. Here is your academic progress.</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-grass-green text-white rounded-xl text-sm font-bold shadow-lg shadow-grass-green/20">
            Year {data.year_level} - {data.program_name}
          </div>
        </div>
      </div>

      {/* Student Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Current GPA', value: data.gpa.toFixed(2), icon: Award, color: 'bg-purple-500' },
          { label: 'Attendance', value: `${Math.round(data.attendance_rate)}%`, icon: TrendingUp, color: 'bg-grass-green' },
          { label: 'Subjects Passed', value: data.records?.filter((r: any) => r.score >= 75).length || 0, icon: BookOpen, color: 'bg-blue-500' },
          { label: 'Risk Status', value: data.risk_level, icon: AlertTriangle, color: data.risk_level === 'High' ? 'bg-red-500' : 'bg-green-500' },
        ].map((stat, i) => (
          <div key={i} className="card group hover:scale-[1.02] transition-transform cursor-default">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.color} text-white shadow-lg`}>
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-black text-gray-900">{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Academic Performance Chart */}
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-bold mb-8">Academic Performance Trend</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="score" name="Score" fill="#4CAF50" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Grades */}
        <div className="card">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Clock size={20} className="text-gray-400" />
            Recent Grades
          </h3>
          <div className="space-y-4">
            {data.records?.length > 0 ? (
              data.records.map((record: any) => (
                <div key={record.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{record.subject_name}</p>
                    <p className="text-xs text-gray-500">{record.subject_code} • {new Date(record.recorded_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`font-black ${record.score < 75 ? 'text-red-500' : 'text-grass-green'}`}>{record.score}%</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 italic text-sm">
                No recent academic records found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Risk Analysis (Personalized) */}
      <div className="card bg-gradient-to-br from-grass-green to-grass-green-dark text-white border-none">
        <div className="flex items-center gap-3 mb-6">
          <GraduationCap size={24} />
          <h3 className="text-xl font-bold">AI Academic Insight</h3>
        </div>
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="text-center">
            <div className="relative inline-block">
              <svg className="w-32 h-32">
                <circle 
                  cx="64" cy="64" r="58" 
                  fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" 
                />
                <circle 
                  cx="64" cy="64" r="58" 
                  fill="none" stroke="white" strokeWidth="8" 
                  strokeDasharray={364}
                  strokeDashoffset={364 - (364 * (data.risk_score || 0))}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{Math.round((data.risk_score || 0) * 100)}%</span>
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-70">Risk</span>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">AI Assessment</p>
              <p className="text-sm leading-relaxed">
                {data.risk_level === 'High' 
                  ? "Our AI models detect a high risk of academic struggle. We recommend reaching out to your department head for guidance."
                  : "You are performing well! Maintain your current attendance and study habits to stay on track."}
              </p>
            </div>
            <div className="flex gap-4">
              <button className="px-4 py-2 bg-white text-grass-green rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors">
                View Detailed Report
              </button>
              <button className="px-4 py-2 bg-white/20 text-white rounded-lg text-sm font-bold hover:bg-white/30 transition-colors">
                Schedule Consultation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

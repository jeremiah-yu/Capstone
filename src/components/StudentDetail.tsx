import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Brain, 
  Calendar, 
  BookOpen, 
  Clock, 
  Activity,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';

export function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const fetchStudent = () => {
    setLoading(true);
    fetch(`/api/students/${id}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        // Map enterprise fields to UI
        setStudent({
          ...data,
          attendance: data.attendance_rate,
          grade_avg: (data.gpa / 4) * 100, // Normalize GPA to percentage for UI
          participation: 85 // Mock for now
        });
        setLoading(false);
      });
  };

  const runPrediction = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/predict/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setStudent({ ...student, risk_score: data.score, risk_level: data.level, last_analysis: data.reasoning });
    } catch (error) {
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <div>Loading student details...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <button 
        onClick={() => navigate('/students')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium"
      >
        <ArrowLeft size={20} />
        Back to Students
      </button>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Column: Profile & Stats */}
        <div className="flex-1 space-y-6">
          <div className="card flex items-center gap-6">
            <div className="w-20 h-20 bg-grass-green text-white rounded-2xl flex items-center justify-center text-3xl font-bold">
              {student.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
              <p className="text-gray-500">{student.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  student.risk_level === 'High' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                }`}>
                  {student.risk_level} Risk
                </span>
                <span className="text-xs text-gray-400">• ID: STU-{student.id.toString().padStart(4, '0')}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Calendar size={18} />
              </div>
              <p className="text-xs text-gray-500 mb-1">Attendance</p>
              <p className="text-lg font-bold">{student.attendance}%</p>
            </div>
            <div className="card p-4 text-center">
              <div className="w-8 h-8 bg-purple-50 text-purple-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <BookOpen size={18} />
              </div>
              <p className="text-xs text-gray-500 mb-1">Grade Avg</p>
              <p className="text-lg font-bold">{student.grade_avg}%</p>
            </div>
            <div className="card p-4 text-center">
              <div className="w-8 h-8 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Activity size={18} />
              </div>
              <p className="text-xs text-gray-500 mb-1">Participation</p>
              <p className="text-lg font-bold">{student.participation}%</p>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Clock size={18} className="text-gray-400" />
              Academic History
            </h3>
            <div className="space-y-4">
              {student.records?.length > 0 ? (
                student.records.map((record: any) => (
                  <div key={record.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-bold">{record.subject_name}</p>
                      <p className="text-xs text-gray-400">{new Date(record.recorded_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`font-bold ${record.score < 65 ? 'text-red-500' : 'text-gray-900'}`}>{record.score}%</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic">No recent records found.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Analysis */}
        <div className="w-full md:w-80 lg:w-96 space-y-6">
          <div className="card bg-gradient-to-br from-grass-green to-grass-green-dark text-white border-none">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold flex items-center gap-2">
                <Brain size={20} />
                AI Risk Analysis
              </h3>
              <button 
                onClick={runPrediction}
                disabled={analyzing}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw size={18} className={analyzing ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="text-center mb-8">
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
                    strokeDashoffset={364 - (364 * (student.risk_score || 0))}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{Math.round((student.risk_score || 0) * 100)}%</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-70">Risk</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">AI Reasoning</p>
                <p className="text-sm leading-relaxed">
                  {student.last_analysis || "No analysis generated yet. Click the refresh icon to run AI prediction."}
                </p>
              </div>
              
              {student.risk_level === 'High' && (
                <div className="bg-soft-yellow text-gray-900 rounded-xl p-4 flex gap-3">
                  <AlertCircle size={20} className="shrink-0" />
                  <div>
                    <p className="text-xs font-bold uppercase">Early Warning</p>
                    <p className="text-sm">Immediate intervention recommended. Schedule a parent-teacher meeting.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold mb-4">Recommended Actions</h3>
            <ul className="space-y-3">
              {[
                'Schedule 1-on-1 tutoring',
                'Review attendance policy',
                'Assign peer mentor',
                'Send progress report'
              ].map((action, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 bg-grass-green rounded-full"></div>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

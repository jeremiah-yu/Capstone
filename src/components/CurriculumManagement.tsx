import React, { useState, useEffect } from 'react';
import { Settings, Book, Save, Info } from 'lucide-react';

export function CurriculumManagement() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [settings, setSettings] = useState({ pass_threshold: 60, attendance_threshold: 75, risk_sensitivity: 0.5 });
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const [settingsRes, deptsRes, progsRes, subjectsRes] = await Promise.all([
        fetch('/api/curriculum/settings', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/departments', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/programs', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/subjects', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      setSettings(await settingsRes.json());
      setDepartments(await deptsRes.json());
      setPrograms(await progsRes.json());
      setSubjects(await subjectsRes.json());
    };
    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    await fetch('/api/curriculum/settings', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(settings)
    });
    setSaving(false);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AI Thresholds */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Settings className="text-grass-green" size={20} />
                AI Risk Thresholds
              </h3>
              <button 
                onClick={handleSaveSettings}
                disabled={saving}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-bold text-gray-700">Passing Grade Threshold</label>
                  <span className="text-sm font-bold text-grass-green">{settings.pass_threshold}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-grass-green"
                  value={settings.pass_threshold}
                  onChange={e => setSettings({...settings, pass_threshold: parseInt(e.target.value)})}
                />
                <p className="text-xs text-gray-400 mt-1">Students below this average will be flagged as academic risk.</p>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-bold text-gray-700">Attendance Warning Level</label>
                  <span className="text-sm font-bold text-soft-yellow-dark">{settings.attendance_threshold}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-soft-yellow"
                  value={settings.attendance_threshold}
                  onChange={e => setSettings({...settings, attendance_threshold: parseInt(e.target.value)})}
                />
                <p className="text-xs text-gray-400 mt-1">Minimum required attendance before triggering early warnings.</p>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-bold text-gray-700">AI Risk Sensitivity</label>
                  <span className="text-sm font-bold text-blue-500">{settings.risk_sensitivity}</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.1" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  value={settings.risk_sensitivity}
                  onChange={e => setSettings({...settings, risk_sensitivity: parseFloat(e.target.value)})}
                />
                <p className="text-xs text-gray-400 mt-1">Higher values make the AI more aggressive in flagging potential failures.</p>
              </div>
            </div>
          </div>

          <div className="card bg-blue-50 border-blue-100 flex gap-4">
            <Info className="text-blue-500 shrink-0" size={24} />
            <div className="text-sm text-blue-800">
              <p className="font-bold mb-1">How AI Predictions Work</p>
              <p>The system uses these thresholds to calibrate the Gemini AI model. When you run an analysis, the AI compares current student performance against these benchmarks while also considering historical trends and participation levels.</p>
            </div>
          </div>
        </div>

        {/* Subject List */}
        <div className="card h-fit space-y-8">
          <div>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Book className="text-purple-500" size={20} />
              Colleges & Departments
            </h3>
            <div className="space-y-3">
              {departments.map(dept => (
                <div key={dept.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{dept.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{dept.code}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Book className="text-blue-500" size={20} />
              Academic Programs
            </h3>
            <div className="space-y-3">
              {programs.map(prog => (
                <div key={prog.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{prog.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{prog.code}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Book className="text-grass-green" size={20} />
              Active Subjects
            </h3>
            <div className="space-y-3">
              {subjects.map(subject => (
                <div key={subject.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{subject.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{subject.code}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

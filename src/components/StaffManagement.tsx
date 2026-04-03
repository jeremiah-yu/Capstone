import React, { useState, useEffect } from 'react';
import { Users, Shield, Plus, Trash2, Mail } from 'lucide-react';

export function StaffManagement() {
  const [staff, setStaff] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newStaff, setNewStaff] = useState({ 
    name: '', 
    email: '', 
    password: 'staff123', 
    role: 'instructor',
    dept_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    const [staffRes, deptsRes] = await Promise.all([
      fetch('/api/staff', { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch('/api/departments', { headers: { 'Authorization': `Bearer ${token}` } })
    ]);
    setStaff(await staffRes.json());
    setDepartments(await deptsRes.json());
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(newStaff)
    });
    if (res.ok) {
      setShowAdd(false);
      fetchData();
      setNewStaff({ name: '', email: '', password: 'staff123', role: 'instructor', dept_id: '' });
    }
  };

  if (loading) return <div>Loading staff...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Staff Member
        </button>
      </div>

      {showAdd && (
        <div className="card bg-gray-50 border-dashed border-2 border-gray-200">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
              <input 
                type="text" required className="w-full p-2 border rounded-lg" 
                value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
              <input 
                type="email" required className="w-full p-2 border rounded-lg" 
                value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
              <select 
                className="w-full p-2 border rounded-lg"
                value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})}
              >
                <option value="instructor">Instructor</option>
                <option value="dept_head">Dept Head</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Department</label>
              <select 
                className="w-full p-2 border rounded-lg"
                value={newStaff.dept_id} onChange={e => setNewStaff({...newStaff, dept_id: e.target.value})}
              >
                <option value="">No Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1">Save</button>
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((member) => (
          <div key={member.id} className="card flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${member.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                {member.role === 'admin' ? <Shield size={24} /> : <Users size={24} />}
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{member.name}</h4>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Mail size={12} /> {member.email}
                </p>
                <div className="flex gap-2 mt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{member.role}</span>
                  {member.dept_name && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-grass-green">• {member.dept_name}</span>
                  )}
                </div>
              </div>
            </div>
            <button className="text-gray-300 hover:text-red-500 transition-colors">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ChevronRight, ChevronLeft, Download, Upload, Trash2 } from 'lucide-react';

export function StudentList() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [students, setStudents] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ 
    risk: '', 
    yearLevel: '', 
    deptId: user.role === 'dept_head' ? user.dept_id : '',
    programId: ''
  });
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetadata = async () => {
      const token = localStorage.getItem('token');
      const [deptsRes, progsRes] = await Promise.all([
        fetch('/api/departments', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/programs', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      setDepartments(await deptsRes.json());
      setPrograms(await progsRes.json());
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchStudents(1);
  }, [filters, searchTerm]);

  const fetchStudents = (page: number) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: '15',
      risk: filters.risk,
      yearLevel: filters.yearLevel,
      deptId: filters.deptId,
      programId: filters.programId,
      search: searchTerm
    });

    fetch(`/api/students?${queryParams.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setStudents(data.data);
        setPagination(data.pagination);
        setLoading(false);
      });
  };

  return (
    <div className="space-y-6">
      {/* Enterprise Search & Bulk Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, email, or student ID..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-grass-green/10 focus:border-grass-green transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select 
            className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 focus:ring-4 focus:ring-grass-green/10"
            value={filters.risk}
            onChange={e => setFilters({...filters, risk: e.target.value})}
          >
            <option value="">All Risk Levels</option>
            <option value="High">High Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="Low">Low Risk</option>
          </select>

          {user.role === 'super_admin' && (
            <select 
              className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 focus:ring-4 focus:ring-grass-green/10"
              value={filters.deptId}
              onChange={e => setFilters({...filters, deptId: e.target.value, programId: ''})}
            >
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
            </select>
          )}

          <select 
            className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 focus:ring-4 focus:ring-grass-green/10"
            value={filters.programId}
            onChange={e => setFilters({...filters, programId: e.target.value})}
          >
            <option value="">All Programs</option>
            {programs
              .filter(p => !filters.deptId || p.dept_id === parseInt(filters.deptId))
              .map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
          </select>

          <select 
            className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 focus:ring-4 focus:ring-grass-green/10"
            value={filters.yearLevel}
            onChange={e => setFilters({...filters, yearLevel: e.target.value})}
          >
            <option value="">All Years</option>
            {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>Year {y}</option>)}
          </select>

          <div className="h-8 w-px bg-gray-200 mx-2 hidden lg:block"></div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all">
            <Upload size={18} /> Import
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      {/* Enterprise Table */}
      <div className="card overflow-hidden p-0 shadow-xl border-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Student Profile</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Academic Status</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Risk Level</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-8 py-6 bg-gray-50/20"></td>
                  </tr>
                ))
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-grass-green/10 text-grass-green rounded-2xl flex items-center justify-center font-black text-lg">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-400 font-medium">{student.student_code} • Grade {student.grade_level}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest w-20">Attendance</span>
                          <div className="flex-1 h-1.5 w-32 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-grass-green rounded-full" style={{ width: `${student.attendance_rate}%` }}></div>
                          </div>
                          <span className="text-xs font-black text-gray-900">{student.attendance_rate}%</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest w-20">GPA</span>
                          <div className="flex-1 h-1.5 w-32 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(student.gpa / 4) * 100}%` }}></div>
                          </div>
                          <span className="text-xs font-black text-gray-900">{student.gpa.toFixed(2)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                        student.risk_level === 'High' 
                          ? 'bg-red-100 text-red-600 shadow-sm shadow-red-100' 
                          : student.risk_level === 'Medium'
                          ? 'bg-yellow-100 text-yellow-600 shadow-sm shadow-yellow-100'
                          : 'bg-green-100 text-green-600 shadow-sm shadow-green-100'
                      }`}>
                        {student.risk_level}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                        </button>
                        <Link 
                          to={`/students/${student.id}`}
                          className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-grass-green hover:text-white transition-all"
                        >
                          <ChevronRight size={20} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Enterprise Pagination */}
        <div className="px-8 py-6 bg-gray-50/50 flex items-center justify-between border-t border-gray-100">
          <p className="text-sm text-gray-500 font-medium">
            Showing <span className="font-black text-gray-900">{students.length}</span> of <span className="font-black text-gray-900">{pagination.total}</span> students
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={pagination.currentPage === 1}
              onClick={() => fetchStudents(pagination.currentPage - 1)}
              className="p-2 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-gray-900 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => fetchStudents(i + 1)}
                className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${
                  pagination.currentPage === i + 1 
                    ? 'bg-grass-green text-white shadow-lg shadow-grass-green/20' 
                    : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button 
              disabled={pagination.currentPage === pagination.pages}
              onClick={() => fetchStudents(pagination.currentPage + 1)}
              className="p-2 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-gray-900 disabled:opacity-30 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

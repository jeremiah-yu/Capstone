import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { StudentList } from './components/StudentList';
import { StudentDetail } from './components/StudentDetail';

import { StaffManagement } from './components/StaffManagement';
import { CurriculumManagement } from './components/CurriculumManagement';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login onLogin={setUser} /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <Layout user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard user={user} />} />
          <Route path="students" element={<StudentList />} />
          <Route path="students/:id" element={<StudentDetail />} />
          <Route path="staff" element={<StaffManagement />} />
          <Route path="curriculum" element={<CurriculumManagement />} />
        </Route>
      </Routes>
    </Router>
  );
}

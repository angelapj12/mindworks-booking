import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Input, Button, Badge } from '../components/ui';

export default function StudentDashboardPage() {
  const { user, profile } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
  });
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [scheduledClasses, setScheduledClasses] = useState<any[]>([]);
  const [skillProgress, setSkillProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadStudentData();
  }, [user]);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      // Fetch enrolled classes
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*, class_schedules(*, class_types(*), instructors(*)), attendance(*), materials(*)')
        .eq('user_id', user.id)
        .order('booking_time', { ascending: false });
      setEnrolledClasses(bookings || []);

      // Fetch available classes
      const { data: classes } = await supabase
        .from('class_schedules')
        .select('*, class_types(*), instructors(*)')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });
      setAvailableClasses(classes || []);

      // Scheduled classes (next 7 days)
      setScheduledClasses((classes || []).filter(cls => {
        const start = new Date(cls.start_time);
        const now = new Date();
        return start > now && (start.getTime() - now.getTime()) < 7 * 24 * 60 * 60 * 1000;
      }));

      // Skill progress (mocked for now)
      setSkillProgress([
        { skill: 'Yoga', percent: 80 },
        { skill: 'Pilates', percent: 60 },
        { skill: 'HIIT', percent: 40 },
      ]);
    } catch (err) {
      setError('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    setError('');
    setSuccess('');
    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileForm)
        .eq('id', profile.id);
      if (error) throw error;
      setSuccess('Profile updated successfully');
      setEditMode(false);
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between px-8 pt-8 pb-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Welcome, {profileForm.full_name || 'Student'}</h1>
          <p className="text-gray-500">Your personal dashboard overview</p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <input className="bg-white rounded-full px-4 py-2 shadow focus:outline-none" placeholder="Search" />
          <div className="bg-white rounded-full p-2 shadow">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></svg>
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-8 max-w-7xl mx-auto pb-8">
        {/* Main Panel */}
        <div className="flex-1 space-y-8">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-6">
            <img src={profile?.avatar_url || '/default-avatar.png'} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow" />
            <div>
              <h2 className="text-2xl font-bold mb-1">{profileForm.full_name}</h2>
              <p className="text-gray-600 font-medium mb-2">Student</p>
              <div className="flex gap-4 mb-2">
                <span className="font-semibold flex items-center gap-1"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg> {enrolledClasses.length}</span>
                <span className="font-semibold flex items-center gap-1"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/></svg> {enrolledClasses.filter(cls => cls.booking_status === 'completed').length}</span>
              </div>
              <Button onClick={() => setEditMode(true)} className="mt-2">Edit Profile</Button>
            </div>
          </div>
          {/* Edit Profile Modal */}
          {editMode && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <h2 className="text-lg font-bold mb-4">Edit Profile</h2>
                <Input type="text" value={profileForm.full_name} onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })} placeholder="Full Name" />
                <Input type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} placeholder="Email" />
                <Input type="text" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="Phone" />
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleProfileUpdate}>Save</Button>
                  <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
                </div>
              </div>
            </div>
          )}
          {/* Gradient Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl p-6 shadow-lg bg-gradient-to-tr from-pink-200 via-orange-100 to-purple-200">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-lg">Completion Rate</span>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
              </div>
              <p className="text-3xl font-bold">{Math.round((enrolledClasses.filter(cls => cls.booking_status === 'completed').length / (enrolledClasses.length || 1)) * 100)}%</p>
              <p className="text-gray-500">Avg. Completed</p>
            </div>
            <div className="rounded-2xl p-6 shadow-lg bg-gradient-to-tr from-blue-200 via-cyan-100 to-purple-200">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-lg">Total Classes</span>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/></svg>
              </div>
              <p className="text-3xl font-bold">{enrolledClasses.length}</p>
              <p className="text-gray-500">Classes Enrolled</p>
            </div>
          </div>
          {/* Chart Area (Placeholder) */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-lg mb-2">Focusing</h3>
            <p className="text-gray-500 mb-2">Productivity analytics</p>
            <div className="h-32 flex items-center justify-center text-gray-400">[Chart Placeholder]</div>
            <div className="flex justify-between mt-4">
              <span className="font-semibold">41%</span>
              <span className="text-gray-500">Avg. Concentration</span>
            </div>
          </div>
        </div>
        {/* Sidebar */}
        <div className="w-full md:w-80 flex-shrink-0 space-y-8">
          {/* Scheduled Classes */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-lg mb-2">My meetings</h3>
            {scheduledClasses.length === 0 ? (
              <p className="text-gray-500">No upcoming classes.</p>
            ) : (
              <ul className="space-y-4">
                {scheduledClasses.map(cls => (
                  <li key={cls.id} className="flex flex-col gap-1">
                    <span className="font-semibold">{cls.class_types?.name}</span>
                    <span className="text-gray-500">{new Date(cls.start_time).toLocaleString()}</span>
                    <span className="text-gray-500">Duration: {cls.duration || 'N/A'} mins</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Skill Progress Bars */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-lg mb-2">Developed areas</h3>
            <p className="text-gray-500 mb-2">Most common areas of interests</p>
            <div className="space-y-4">
              {skillProgress.map(skill => (
                <div key={skill.skill}>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold">{skill.skill}</span>
                    <span className="text-gray-500">{skill.percent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-blue-400 to-purple-400 h-3 rounded-full" style={{ width: `${skill.percent}%` }}></div>
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

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Input, Button, Badge } from '../components/ui';

export function StudentDashboardPage() {
  const { user, profile } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
  });
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'upcoming' | 'history' | 'credits'>('profile');

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

      // Fetch attendance log
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id);
      setAttendance(attendanceData || []);

      // Fetch learning materials
      const { data: materialsData } = await supabase
        .from('materials')
        .select('*');
      setMaterials(materialsData || []);
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

  const handleSignInToClass = async (classId: string) => {
    setError('');
    setSuccess('');
    try {
      const { error } = await supabase
        .from('attendance')
        .insert({ user_id: user.id, class_schedule_id: classId, attended_at: new Date().toISOString() });
      if (error) throw error;
      setSuccess('Attendance logged');
      loadStudentData();
    } catch (err) {
      setError('Failed to log attendance');
    }
  };

  const handleRegisterForClass = async (classId: string) => {
    setError('');
    setSuccess('');
    try {
      const { error } = await supabase
        .from('bookings')
        .insert({ user_id: user.id, class_schedule_id: classId, booking_time: new Date().toISOString(), booking_status: 'confirmed' });
      if (error) throw error;
      setSuccess('Registered for class');
      loadStudentData();
    } catch (err) {
      setError('Failed to register for class');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Student Dashboard</h1>
      <div className="flex space-x-4 mb-8">
        <Button variant={activeTab === 'upcoming' ? 'default' : 'outline'} onClick={() => setActiveTab('upcoming')}>Upcoming Classes</Button>
        <Button variant={activeTab === 'history' ? 'default' : 'outline'} onClick={() => setActiveTab('history')}>Class History</Button>
        <Button variant={activeTab === 'credits' ? 'default' : 'outline'} onClick={() => setActiveTab('credits')}>Credit History</Button>
        <Button variant={activeTab === 'profile' ? 'default' : 'outline'} onClick={() => setActiveTab('profile')}>Profile</Button>
      </div>
      {activeTab === 'profile' && (
        <div className="mb-8 p-4 bg-white rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Profile</h2>
          <p><strong>Name:</strong> {profileForm.full_name}</p>
          <p><strong>Email:</strong> {profileForm.email}</p>
          <p><strong>Phone:</strong> {profileForm.phone}</p>
          <Button onClick={() => setEditMode(true)} className="mt-4">Update Personal Info</Button>
          {editMode && (
            <div className="space-y-2 mt-4">
              <Input
                type="text"
                value={profileForm.full_name}
                onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}
                placeholder="Full Name"
              />
              <Input
                type="email"
                value={profileForm.email}
                onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                placeholder="Email"
              />
              <Input
                type="text"
                value={profileForm.phone}
                onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="Phone"
              />
              <Button onClick={handleProfileUpdate}>Save</Button>
              <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
            </div>
          )}
        </div>
      )}
      {activeTab === 'upcoming' && (
        <div className="mb-8 p-4 bg-white rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Upcoming Classes</h2>
          {availableClasses.length === 0 ? (
            <p>No available classes.</p>
          ) : (
            <div className="space-y-4">
              {availableClasses.map(cls => (
                <div key={cls.id} className="border p-3 rounded">
                  <h3 className="font-bold">{cls.class_types?.name}</h3>
                  <p><strong>Instructor:</strong> {cls.instructors?.name}</p>
                  <p><strong>Time:</strong> {cls.start_time}</p>
                  <p><strong>Venue:</strong> {cls.venue || 'TBA'}</p>
                  <p><strong>Logistics:</strong> {cls.logistics || 'N/A'}</p>
                  <p><strong>Syllabus:</strong> {cls.class_types?.syllabus || 'N/A'}</p>
                  <Button onClick={() => handleRegisterForClass(cls.id)}>Register</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {activeTab === 'history' && (
        <div className="mb-8 p-4 bg-white rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Class History</h2>
          {enrolledClasses.length === 0 ? (
            <p>No class history found.</p>
          ) : (
            <div className="space-y-4">
              {enrolledClasses.map(cls => (
                <div key={cls.id} className="border p-3 rounded">
                  <h3 className="font-bold">{cls.class_schedules?.class_types?.name}</h3>
                  <p><strong>Instructor:</strong> {cls.class_schedules?.instructors?.name}</p>
                  <p><strong>Time:</strong> {cls.class_schedules?.start_time}</p>
                  <p><strong>Venue:</strong> {cls.class_schedules?.venue || 'TBA'}</p>
                  <p><strong>Logistics:</strong> {cls.class_schedules?.logistics || 'N/A'}</p>
                  <p><strong>Syllabus:</strong> {cls.class_schedules?.class_types?.syllabus || 'N/A'}</p>
                  <Button onClick={() => handleSignInToClass(cls.class_schedule_id)}>Sign In</Button>
                  <div className="mt-2">
                    <h4 className="font-semibold">Materials</h4>
                    {materials.filter(m => m.class_schedule_id === cls.class_schedule_id).length === 0 ? (
                      <p>No materials yet.</p>
                    ) : (
                      <ul>
                        {materials.filter(m => m.class_schedule_id === cls.class_schedule_id).map(m => (
                          <li key={m.id}>
                            <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{m.title}</a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {activeTab === 'credits' && (
        <div className="mb-8 p-4 bg-white rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Credit History</h2>
          {/* Credit history content goes here */}
        </div>
      )}
    </div>
  );
}

export default StudentDashboardPage;

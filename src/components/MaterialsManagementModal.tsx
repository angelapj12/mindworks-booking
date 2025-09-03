import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Input } from './ui/input';
import { Button } from './ui/button';

export default function MaterialsManagementModal({ isOpen, onClose, classSchedule, onSuccess }) {
  const [materials, setMaterials] = useState<any[]>([]);
  const [newMaterial, setNewMaterial] = useState({ title: '', url: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && classSchedule) {
      loadMaterials();
    }
  }, [isOpen, classSchedule]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('materials')
        .select('*')
        .eq('class_schedule_id', classSchedule.id);
      setMaterials(data || []);
    } catch (err) {
      setError('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = async () => {
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase
        .from('materials')
        .insert({
          class_schedule_id: classSchedule.id,
          title: newMaterial.title,
          url: newMaterial.url
        });
      if (error) throw error;
      setNewMaterial({ title: '', url: '' });
      loadMaterials();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Failed to add material');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);
      if (error) throw error;
      loadMaterials();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Failed to delete material');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Manage Materials for {classSchedule?.class_types?.name}</h2>
        {error && <div className="mb-2 text-red-600">{error}</div>}
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Title"
            value={newMaterial.title}
            onChange={e => setNewMaterial({ ...newMaterial, title: e.target.value })}
          />
          <Input
            type="text"
            placeholder="URL"
            value={newMaterial.url}
            onChange={e => setNewMaterial({ ...newMaterial, url: e.target.value })}
          />
          <Button onClick={handleAddMaterial} disabled={loading || !newMaterial.title || !newMaterial.url} className="mt-2">Add Material</Button>
        </div>
        <ul className="mb-4">
          {materials.map(m => (
            <li key={m.id} className="flex items-center justify-between mb-2">
              <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{m.title}</a>
              <Button variant="outline" size="sm" onClick={() => handleDeleteMaterial(m.id)} disabled={loading}>Delete</Button>
            </li>
          ))}
        </ul>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

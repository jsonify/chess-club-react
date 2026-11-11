// src/components/teachers/TeacherManager.jsx
import { useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Plus, Check, X, AlertCircle } from 'lucide-react';
import { useTeachers } from '@/hooks/useTeachers';

export default function TeacherManager() {
  const {
    teachers,
    loading,
    error,
    tableMissing,
    addTeacher,
    renameTeacher,
    setTeacherActive
  } = useTeachers();

  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [busyId, setBusyId] = useState(null);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      const teacher = await addTeacher(newName);
      setNewName('');
      toast.success(`Added ${teacher.name}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (teacher) => {
    setEditingId(teacher.id);
    setEditName(teacher.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleRename = async (teacher) => {
    setBusyId(teacher.id);
    try {
      const updated = await renameTeacher(teacher, editName);
      if (updated.name !== teacher.name) {
        toast.success(`Renamed ${teacher.name} to ${updated.name}; their students were updated too`);
      }
      cancelEdit();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleActive = async (teacher) => {
    setBusyId(teacher.id);
    try {
      await setTeacherActive(teacher, !teacher.active);
      toast.success(
        teacher.active
          ? `${teacher.name} hidden from registration`
          : `${teacher.name} available for registration again`
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading teachers…</div>;
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-md bg-red-50 text-red-800 border border-red-200">
        <AlertCircle className="h-5 w-5" />
        Couldn&apos;t load teachers: {error}
      </div>
    );
  }

  if (tableMissing) {
    return (
      <div className="p-4 rounded-md bg-yellow-50 text-yellow-800 border border-yellow-200">
        <p className="font-medium">
          The teacher list isn&apos;t available from Supabase yet: the <code>teachers</code> table
          is missing, or the app isn&apos;t allowed to read it.
        </p>
        <p className="mt-1 text-sm">
          It&apos;s created by <code>supabase/migrations/20261111000000_create_teachers.sql</code> in
          the chess-club-2 repo (applied by that repo&apos;s deploy, or run it in the Supabase SQL
          editor). Until then, registration uses the built-in teacher list.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <form onSubmit={handleAdd} className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New teacher's name"
          className="flex-1 border rounded-lg px-3 py-2"
        />
        <button
          type="submit"
          disabled={adding || !newName.trim()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          Add teacher
        </button>
      </form>

      <ul className="divide-y divide-gray-200">
        {teachers.map(teacher => (
          <li key={teacher.id} className="px-4 py-3 flex items-center gap-3">
            {editingId === teacher.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(teacher);
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  autoFocus
                  className="flex-1 border rounded-lg px-3 py-1.5"
                />
                <button
                  type="button"
                  onClick={() => handleRename(teacher)}
                  disabled={busyId === teacher.id}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                  aria-label="Save name"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="p-2 text-gray-500 hover:bg-gray-50 rounded-md"
                  aria-label="Cancel"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <span className={`flex-1 text-sm font-medium ${teacher.active ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                  {teacher.name}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  teacher.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {teacher.active ? 'Active' : 'Inactive'}
                </span>
                <button
                  type="button"
                  onClick={() => startEdit(teacher)}
                  className="p-2 text-gray-500 hover:bg-gray-50 rounded-md"
                  aria-label={`Rename ${teacher.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleActive(teacher)}
                  disabled={busyId === teacher.id}
                  className="px-3 py-1.5 text-sm text-gray-600 border rounded-md hover:bg-gray-50"
                >
                  {teacher.active ? 'Deactivate' : 'Reactivate'}
                </button>
              </>
            )}
          </li>
        ))}
        {teachers.length === 0 && (
          <li className="px-4 py-6 text-center text-gray-500">No teachers yet. Add one above.</li>
        )}
      </ul>

      <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
        Deactivated teachers stay on their current students but can&apos;t be picked when registering.
        Renaming a teacher also updates every student assigned to them.
      </div>
    </div>
  );
}

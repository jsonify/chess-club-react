// src/hooks/useTeachers.js
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Used only if the `teachers` table has not been created yet
// (its migration lives in the chess-club-2 repo:
// supabase/migrations/20261111000000_create_teachers.sql).
export const FALLBACK_TEACHERS = [
  'Alderson', 'Bonnell', 'Chapin', 'Chase', 'DeLoma',
  'Gregerson', 'Hanson', 'Holt', 'Larson', 'Mindt',
  'Otterlee', 'Parsons', 'Pawling', 'Unruh', 'Wildenhaus'
];

function isMissingTable(error) {
  // 42P01: Postgres "undefined_table"; PGRST205: PostgREST "table not in schema cache"
  return error?.code === '42P01' || error?.code === 'PGRST205';
}

const byName = (a, b) => a.name.localeCompare(b.name);

export function useTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tableMissing, setTableMissing] = useState(false);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('teachers')
      .select('*')
      .order('name');

    if (fetchError) {
      if (isMissingTable(fetchError)) {
        setTableMissing(true);
        setTeachers(FALLBACK_TEACHERS.map(name => ({ id: name, name, active: true })));
      } else {
        console.error('Error fetching teachers:', fetchError);
        setError(fetchError.message);
      }
    } else if (!data?.length) {
      // No rows usually means row-level security is hiding the table from this
      // (signed-out) app, not that the club has no teachers. Don't leave the
      // registration dropdown empty.
      setTableMissing(true);
      setTeachers(FALLBACK_TEACHERS.map(name => ({ id: name, name, active: true })));
    } else {
      setTableMissing(false);
      setTeachers(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const addTeacher = async (rawName) => {
    const name = rawName.trim();
    if (!name) throw new Error('Teacher name is required');
    if (teachers.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      throw new Error(`"${name}" is already in the list`);
    }
    const { data, error: insertError } = await supabase
      .from('teachers')
      .insert({ name })
      .select()
      .single();
    if (insertError) throw insertError;
    setTeachers(prev => [...prev, data].sort(byName));
    return data;
  };

  // Renames the teacher and moves every student assigned to the old name.
  const renameTeacher = async (teacher, rawName) => {
    const name = rawName.trim();
    if (!name) throw new Error('Teacher name is required');
    if (name === teacher.name) return teacher;
    if (teachers.some(t => t.id !== teacher.id && t.name.toLowerCase() === name.toLowerCase())) {
      throw new Error(`"${name}" is already in the list`);
    }

    const { data, error: updateError } = await supabase
      .from('teachers')
      .update({ name })
      .eq('id', teacher.id)
      .select()
      .single();
    if (updateError) throw updateError;

    const { error: studentsError } = await supabase
      .from('students')
      .update({ teacher: name })
      .eq('teacher', teacher.name);
    if (studentsError) {
      // Put the teacher name back so students and teachers don't drift apart.
      await supabase.from('teachers').update({ name: teacher.name }).eq('id', teacher.id);
      throw studentsError;
    }

    setTeachers(prev => prev.map(t => (t.id === teacher.id ? data : t)).sort(byName));
    return data;
  };

  // Inactive teachers stay on existing students but are hidden from registration.
  const setTeacherActive = async (teacher, active) => {
    const { data, error: updateError } = await supabase
      .from('teachers')
      .update({ active })
      .eq('id', teacher.id)
      .select()
      .single();
    if (updateError) throw updateError;
    setTeachers(prev => prev.map(t => (t.id === teacher.id ? data : t)));
    return data;
  };

  return {
    teachers,
    activeTeachers: teachers.filter(t => t.active),
    loading,
    error,
    tableMissing,
    refresh: fetchTeachers,
    addTeacher,
    renameTeacher,
    setTeacherActive
  };
}

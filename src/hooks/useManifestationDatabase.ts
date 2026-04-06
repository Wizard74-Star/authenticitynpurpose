import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useStorageMode } from '@/contexts/StorageModeContext';

const DEMO_KEY_MANIFESTATION = 'goals_app_demo_manifestation';

export interface GoalStep {
  id: string;
  title: string;
  completed: boolean;
  predictDate?: string;
  predictPrice?: number;
  completedAt?: string;
}

export type GoalStatus = 'active' | 'paused' | 'completed';

export interface ManifestationGoal {
  id: string;
  title: string;
  description: string;
  timeline: '30' | '60' | '90' | '1year' | '5year';
  progress: number;
  imageUrl?: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  recommendations: string[];
  targetDate?: string | null;
  steps?: GoalStep[];
  budget?: number;
  spent?: number;
  /** active = working on it; paused = shelved for now; completed = done */
  status?: GoalStatus;
}

export interface ManifestationTodo {
  id: string;
  title: string;
  completed: boolean;
  points: number;
  createdAt: string;
  scheduledDate?: string | null;
  completedAt?: string | null;
  /** Optional time e.g. "09:00" for by-day layout */
  timeSlot?: string | null;
  /** Optional group name e.g. "Grocery Store", "Hardware Store" */
  groupName?: string | null;
}

export interface ManifestationGratitude {
  id: string;
  content: string;
  date: string;
  createdAt?: string;
  /** Default section key (e.g. 'good-health') or 'custom-{uuid}' for custom sections */
  sectionKey?: string | null;
  /** Display label for custom sections */
  sectionLabel?: string | null;
}

export interface ManifestationJournalEntry {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  mood: 'great' | 'good' | 'okay' | 'tough';
  date: string;
  createdAt?: string;
}

const JOURNAL_PHOTOS_BUCKET = 'progress-photos';

const IMAGE_EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};
function journalImageContentType(file: File): string {
  if (file.type && file.type.startsWith('image/')) return file.type;
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  return IMAGE_EXT_TO_MIME[ext] ?? 'image/jpeg';
}

function persistDemo(state: { goals: ManifestationGoal[]; todos: ManifestationTodo[]; gratitudeEntries: ManifestationGratitude[]; journalEntries: ManifestationJournalEntry[]; totalPoints: number; streak: number }) {
  try {
    localStorage.setItem(DEMO_KEY_MANIFESTATION, JSON.stringify(state));
  } catch {}
}

export function useManifestationDatabase() {
  const { user } = useAuth();
  const { isDemoMode } = useStorageMode();
  const [goals, setGoals] = useState<ManifestationGoal[]>([]);
  const [todos, setTodos] = useState<ManifestationTodo[]>([]);
  const [gratitudeEntries, setGratitudeEntries] = useState<ManifestationGratitude[]>([]);
  const [journalEntries, setJournalEntries] = useState<ManifestationJournalEntry[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);

  const useLocalStorageOnly = !user && isDemoMode;

  /** Upload a journal image; demo/local mode uses a data URL, signed-in uses Storage. */
  const uploadJournalImage = async (file: File): Promise<string> => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please choose an image file (e.g. JPG, PNG).');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image must be under 5MB.');
    }
    if (useLocalStorageOnly || !user) {
      return new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = () => rej(new Error('Could not read file.'));
        r.readAsDataURL(file);
      });
    }
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/gi, '') || 'jpg';
    const safeId = String(user.id).replace(/[^a-zA-Z0-9_-]/g, '') || user.id;
    const filePath = `${safeId}/journal/${crypto.randomUUID()}.${ext}`;
    const body = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(JOURNAL_PHOTOS_BUCKET)
      .upload(filePath, body, { upsert: false, contentType: journalImageContentType(file) });
    if (uploadError) {
      throw new Error(
        (uploadError.message || 'Upload failed') +
          (uploadError.message?.includes('Bucket') || uploadError.message?.includes('not found')
            ? ` Create the bucket "${JOURNAL_PHOTOS_BUCKET}" in Supabase Dashboard → Storage (public).`
            : '')
      );
    }
    const { data: urlData } = supabase.storage.from(JOURNAL_PHOTOS_BUCKET).getPublicUrl(filePath);
    return urlData.publicUrl;
  };

  const loadAll = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [goalsRes, todosRes, gratitudeRes, journalRes, statsRes] = await Promise.all([
        supabase.from('manifestation_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('manifestation_todos').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('manifestation_gratitude_entries').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('manifestation_journal_entries').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('manifestation_stats').select('*').eq('user_id', user.id).maybeSingle()
      ]);
      if (goalsRes.data) setGoals(goalsRes.data.map((r: any) => ({ id: r.id, title: r.title, description: r.description ?? '', timeline: r.timeline, progress: r.progress, imageUrl: r.image_url, priority: r.priority, createdAt: r.created_at, recommendations: (r.recommendations ?? []) as string[], targetDate: r.target_date ?? null, steps: (r.steps ?? []) as GoalStep[], budget: r.budget ?? 0, spent: r.spent ?? 0, status: (r.status ?? 'active') as GoalStatus })));
      if (todosRes.data) setTodos(todosRes.data.map((r: any) => ({ id: r.id, title: r.title, completed: r.completed, points: r.points, createdAt: r.created_at, scheduledDate: r.scheduled_date ?? null, completedAt: r.completed_at ?? null, timeSlot: r.time_slot ?? null, groupName: r.group_name ?? null })));
      if (gratitudeRes.data) setGratitudeEntries(gratitudeRes.data.map((r: any) => ({ id: r.id, content: r.content ?? '', date: r.date, createdAt: r.created_at, sectionKey: r.section_key ?? undefined, sectionLabel: r.section_label ?? undefined })));
      if (journalRes.data) setJournalEntries(journalRes.data.map((r: any) => ({ id: r.id, title: r.title ?? '', content: r.content, imageUrl: r.image_url, mood: r.mood, date: r.date, createdAt: r.created_at })));
      if (statsRes.data) {
        setTotalPoints(statsRes.data.total_points ?? 0);
        setStreak(statsRes.data.streak ?? 0);
      }
    } catch (e) {
      console.error('Error loading manifestation data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAll();
      return;
    }
    if (useLocalStorageOnly) {
      setLoading(true);
      try {
        const raw = localStorage.getItem(DEMO_KEY_MANIFESTATION);
        if (raw) {
          const data = JSON.parse(raw);
          setGoals(data.goals ?? []);
          setTodos(data.todos ?? []);
          setGratitudeEntries(data.gratitudeEntries ?? []);
          setJournalEntries(data.journalEntries ?? []);
          setTotalPoints(data.totalPoints ?? 0);
          setStreak(data.streak ?? 0);
        } else {
          setGoals([]);
          setTodos([]);
          setGratitudeEntries([]);
          setJournalEntries([]);
          setTotalPoints(0);
          setStreak(0);
        }
      } catch {
        setGoals([]);
        setTodos([]);
        setGratitudeEntries([]);
        setJournalEntries([]);
        setTotalPoints(0);
        setStreak(0);
      }
      setLoading(false);
      return;
    }
    setGoals([]);
    setTodos([]);
    setGratitudeEntries([]);
    setJournalEntries([]);
    setTotalPoints(0);
    setStreak(0);
    setLoading(false);
  }, [user, useLocalStorageOnly]);

  const updateStats = async (pointsDelta: number, streakDelta: number) => {
    if (useLocalStorageOnly) return; // Demo handlers update state and persist directly
    if (!user) return;
    const newPoints = totalPoints + pointsDelta;
    const newStreak = Math.max(0, streak + streakDelta);
    await supabase.from('manifestation_stats').upsert({ user_id: user.id, total_points: newPoints, streak: newStreak, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    setTotalPoints(newPoints);
    setStreak(newStreak);
  };

  const addGoal = async (goal: Omit<ManifestationGoal, 'id' | 'createdAt'>) => {
    setIsMutating(true);
    try {
      if (useLocalStorageOnly) {
        const now = new Date().toISOString();
        const data: ManifestationGoal = { ...goal, id: crypto.randomUUID(), createdAt: now };
        setGoals(prev => {
          const next = [data, ...prev];
          persistDemo({ goals: next, todos, gratitudeEntries, journalEntries, totalPoints: totalPoints + 10, streak });
          return next;
        });
        setTotalPoints(p => p + 10);
        return;
      }
      if (!user) return;
      const payload: Record<string, unknown> = {
        user_id: user.id,
        title: goal.title ?? '',
        description: goal.description ?? '',
        timeline: goal.timeline,
        progress: Math.round(Number(goal.progress)) || 0,
        image_url: goal.imageUrl ?? null,
        priority: goal.priority,
        recommendations: Array.isArray(goal.recommendations) ? goal.recommendations : [],
        budget: Math.round(Number(goal.budget)) || 0,
        spent: Math.round(Number(goal.spent)) || 0,
      };
      if (goal.targetDate) payload.target_date = goal.targetDate;
      if (goal.steps && goal.steps.length > 0) payload.steps = goal.steps;
      payload.status = goal.status ?? 'active';
      const { data, error } = await supabase.from('manifestation_goals').insert(payload).select('id,created_at').single();
      if (error) throw error;
      setGoals(prev => [{ ...goal, id: data.id, createdAt: data.created_at }, ...prev]);
      await updateStats(10, 0);
    } finally {
      setIsMutating(false);
    }
  };

  const updateGoalProgress = async (goalId: string, progress: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    setIsMutating(true);
    try {
      const wasComplete = goal.progress === 10;
      const isNowComplete = progress === 10;
      if (useLocalStorageOnly) {
        setGoals(prev => {
          const next = prev.map(g => g.id === goalId ? { ...g, progress } : g);
          const newPoints = totalPoints + (isNowComplete && !wasComplete ? 100 : 0);
          persistDemo({ goals: next, todos, gratitudeEntries, journalEntries, totalPoints: newPoints, streak });
          return next;
        });
        if (isNowComplete && !wasComplete) setTotalPoints(p => p + 100);
        return;
      }
      await supabase.from('manifestation_goals').update({ progress }).eq('id', goalId);
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, progress } : g));
      if (!wasComplete && isNowComplete) await updateStats(100, 0);
    } finally {
      setIsMutating(false);
    }
  };

  /** Update goal fields (steps, targetDate, progress, imageUrl, status, budget, spent, etc.). */
  const updateGoal = async (
    goalId: string,
    updates: Partial<Pick<ManifestationGoal, 'steps' | 'targetDate' | 'progress' | 'title' | 'description' | 'timeline' | 'priority' | 'budget' | 'spent' | 'status' | 'imageUrl'>>
  ) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    setIsMutating(true);
    try {
      if (useLocalStorageOnly) {
        setGoals(prev =>
          prev.map(g => (g.id === goalId ? { ...g, ...updates } : g))
        );
        persistDemo({ goals: goals.map(g => g.id === goalId ? { ...goal, ...updates } : g), todos, gratitudeEntries, journalEntries, totalPoints, streak });
        return;
      }
      if (!user) return;
      const payload: Record<string, unknown> = {};
      if (updates.steps !== undefined) payload.steps = updates.steps;
      if (updates.targetDate !== undefined) payload.target_date = updates.targetDate;
      if (updates.progress !== undefined) payload.progress = updates.progress;
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.timeline !== undefined) payload.timeline = updates.timeline;
      if (updates.priority !== undefined) payload.priority = updates.priority;
      if (updates.budget !== undefined) payload.budget = updates.budget;
      if (updates.spent !== undefined) payload.spent = updates.spent;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
      if (Object.keys(payload).length === 0) return;
      await supabase.from('manifestation_goals').update(payload).eq('id', goalId);
      setGoals(prev => prev.map(g => (g.id === goalId ? { ...g, ...updates } : g)));
    } finally {
      setIsMutating(false);
    }
  };

  const deleteGoal = async (goalId: string) => {
    setIsMutating(true);
    try {
      if (useLocalStorageOnly) {
        setGoals(prev => {
          const next = prev.filter(g => g.id !== goalId);
          persistDemo({ goals: next, todos, gratitudeEntries, journalEntries, totalPoints, streak });
          return next;
        });
        return;
      }
      await supabase.from('manifestation_goals').delete().eq('id', goalId);
      setGoals(prev => prev.filter(g => g.id !== goalId));
    } finally {
      setIsMutating(false);
    }
  };

  const addTodo = async (todo: Omit<ManifestationTodo, 'id' | 'createdAt' | 'completedAt'>) => {
    setIsMutating(true);
    try {
      if (useLocalStorageOnly) {
        const now = new Date().toISOString();
        const data: ManifestationTodo = { ...todo, id: crypto.randomUUID(), createdAt: now, completedAt: null };
        setTodos(prev => {
          const next = [data, ...prev];
          persistDemo({ goals, todos: next, gratitudeEntries, journalEntries, totalPoints, streak });
          return next;
        });
        return;
      }
      if (!user) return;
      const payload: Record<string, unknown> = {
        user_id: user.id,
        title: todo.title,
        completed: todo.completed,
        points: todo.points,
      };
      if (todo.scheduledDate) payload.scheduled_date = todo.scheduledDate;
      if (todo.timeSlot) payload.time_slot = todo.timeSlot;
      if (todo.groupName) payload.group_name = todo.groupName;
      const { data, error } = await supabase.from('manifestation_todos').insert(payload).select('id,created_at,scheduled_date,completed_at,time_slot,group_name').single();
      if (error) throw error;
      setTodos(prev => [{ ...todo, id: data.id, createdAt: data.created_at, scheduledDate: data.scheduled_date ?? null, completedAt: data.completed_at ?? null, timeSlot: data.time_slot ?? null, groupName: data.group_name ?? null }, ...prev]);
    } finally {
      setIsMutating(false);
    }
  };

  const toggleTodo = async (todoId: string) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;
    setIsMutating(true);
    try {
      const newCompleted = !todo.completed;
      const completedAt = newCompleted ? new Date().toISOString() : null;
      if (useLocalStorageOnly) {
        setTodos(prev => {
          const next = prev.map(t => t.id === todoId ? { ...t, completed: newCompleted, completedAt } : t);
          const newPoints = totalPoints + (newCompleted ? todo.points : 0);
          persistDemo({ goals, todos: next, gratitudeEntries, journalEntries, totalPoints: newPoints, streak });
          return next;
        });
        if (newCompleted) setTotalPoints(p => p + todo.points);
        return;
      }
      await supabase.from('manifestation_todos').update({ completed: newCompleted, completed_at: completedAt }).eq('id', todoId);
      setTodos(prev => prev.map(t => t.id === todoId ? { ...t, completed: newCompleted, completedAt } : t));
      if (newCompleted) await updateStats(todo.points, 0);
    } finally {
      setIsMutating(false);
    }
  };

  const deleteTodo = async (todoId: string) => {
    setIsMutating(true);
    try {
      if (useLocalStorageOnly) {
        setTodos(prev => {
          const next = prev.filter(t => t.id !== todoId);
          persistDemo({ goals, todos: next, gratitudeEntries, journalEntries, totalPoints, streak });
          return next;
        });
        return;
      }
      await supabase.from('manifestation_todos').delete().eq('id', todoId);
      setTodos(prev => prev.filter(t => t.id !== todoId));
    } finally {
      setIsMutating(false);
    }
  };

  const updateTodo = async (
    todoId: string,
    updates: Partial<Pick<ManifestationTodo, 'title' | 'scheduledDate' | 'timeSlot' | 'groupName'>>
  ) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;
    setIsMutating(true);
    try {
      if (useLocalStorageOnly) {
        const nextTodos = todos.map(t => (t.id === todoId ? { ...t, ...updates } : t));
        setTodos(nextTodos);
        persistDemo({ goals, todos: nextTodos, gratitudeEntries, journalEntries, totalPoints, streak });
        return;
      }
      const payload: Record<string, unknown> = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.scheduledDate !== undefined) payload.scheduled_date = updates.scheduledDate;
      if (updates.timeSlot !== undefined) payload.time_slot = updates.timeSlot;
      if (updates.groupName !== undefined) payload.group_name = updates.groupName;
      if (Object.keys(payload).length === 0) return;
      await supabase.from('manifestation_todos').update(payload).eq('id', todoId);
      setTodos(prev => prev.map(t => (t.id === todoId ? { ...t, ...updates } : t)));
    } finally {
      setIsMutating(false);
    }
  };

  const addGratitude = async (content: string) => {
    const date = new Date().toISOString().split('T')[0];
    return addGratitudeForDate(date, content);
  };

  const addGratitudeForDate = async (date: string, content: string) => {
    return upsertGratitudeSection(date, 'general', null, content);
  };

  const upsertGratitudeSection = async (date: string, sectionKey: string, sectionLabel: string | null, content: string) => {
    const existing = gratitudeEntries.find((e) => e.date === date && (e.sectionKey ?? 'general') === sectionKey);
    if (existing) return updateGratitude(existing.id, content);
    if (useLocalStorageOnly) {
      const data: ManifestationGratitude = { id: crypto.randomUUID(), content, date, sectionKey, sectionLabel: sectionLabel ?? undefined };
      setGratitudeEntries(prev => {
        const next = [data, ...prev];
        persistDemo({ goals, todos, gratitudeEntries: next, journalEntries, totalPoints: totalPoints + 5, streak: streak + 1 });
        return next;
      });
      setTotalPoints(p => p + 5);
      setStreak(s => s + 1);
      return;
    }
    if (!user) return;
    const { data, error } = await supabase.from('manifestation_gratitude_entries').insert({
      user_id: user.id,
      content,
      date,
      section_key: sectionKey,
      section_label: sectionLabel,
    }).select('id,date,section_key,section_label').single();
    if (error) throw error;
    setGratitudeEntries(prev => [{ id: data.id, content, date: data.date, sectionKey: data.section_key ?? undefined, sectionLabel: data.section_label ?? undefined }, ...prev]);
    await updateStats(5, 1);
  };

  const updateGratitudeSectionByKey = async (date: string, sectionKey: string, sectionLabel: string | null, content: string) => {
    const existing = gratitudeEntries.find((e) => e.date === date && (e.sectionKey ?? '') === sectionKey);
    if (existing) return updateGratitude(existing.id, content);
    return upsertGratitudeSection(date, sectionKey, sectionLabel, content);
  };

  const updateGratitude = async (id: string, content: string) => {
    if (useLocalStorageOnly) {
      setGratitudeEntries(prev => {
        const next = prev.map((e) => (e.id === id ? { ...e, content } : e));
        persistDemo({ goals, todos, gratitudeEntries: next, journalEntries, totalPoints, streak });
        return next;
      });
      return;
    }
    if (!user) return;
    await supabase.from('manifestation_gratitude_entries').update({ content }).eq('id', id);
    setGratitudeEntries(prev => prev.map((e) => (e.id === id ? { ...e, content } : e)));
  };

  const deleteGratitude = async (id: string) => {
    if (useLocalStorageOnly) {
      setGratitudeEntries(prev => {
        const next = prev.filter((e) => e.id !== id);
        persistDemo({ goals, todos, gratitudeEntries: next, journalEntries, totalPoints, streak });
        return next;
      });
      return;
    }
    if (!user) return;
    await supabase.from('manifestation_gratitude_entries').delete().eq('id', id);
    setGratitudeEntries(prev => prev.filter((e) => e.id !== id));
  };

  const deleteGratitudeBySection = async (date: string, sectionKey: string) => {
    const existing = gratitudeEntries.find((e) => e.date === date && (e.sectionKey ?? '') === sectionKey);
    if (!existing) return;
    return deleteGratitude(existing.id);
  };

  const addJournalEntry = async (entry: Omit<ManifestationJournalEntry, 'id'>) => {
    const date = entry.date.split('T')[0];
    const existing = journalEntries.find((e) => e.date === date);
    if (existing) return updateJournalEntry(existing.id, { title: entry.title, content: entry.content, imageUrl: entry.imageUrl, mood: entry.mood });
    if (useLocalStorageOnly) {
      const data: ManifestationJournalEntry = { ...entry, id: crypto.randomUUID(), date };
      setJournalEntries(prev => {
        const next = [data, ...prev];
        persistDemo({ goals, todos, gratitudeEntries, journalEntries: next, totalPoints: totalPoints + 15, streak });
        return next;
      });
      setTotalPoints(p => p + 15);
      return;
    }
    if (!user) return;
    const { data, error } = await supabase.from('manifestation_journal_entries').insert({
      user_id: user.id,
      title: entry.title,
      content: entry.content,
      image_url: entry.imageUrl ?? null,
      mood: entry.mood,
      date
    }).select('id,date').single();
    if (error) throw error;
    setJournalEntries(prev => [{ ...entry, id: data.id, date: data.date }, ...prev]);
    await updateStats(15, 0);
  };

  const updateJournalEntry = async (id: string, updates: Partial<Pick<ManifestationJournalEntry, 'title' | 'content' | 'imageUrl' | 'mood' | 'date'>>) => {
    if (useLocalStorageOnly) {
      setJournalEntries(prev => {
        const next = prev.map((e) => (e.id === id ? { ...e, ...updates } : e));
        persistDemo({ goals, todos, gratitudeEntries, journalEntries: next, totalPoints, streak });
        return next;
      });
      return;
    }
    if (!user) return;
    const db: Record<string, unknown> = {};
    if (updates.title !== undefined) db.title = updates.title;
    if (updates.content !== undefined) db.content = updates.content;
    if (updates.imageUrl !== undefined) db.image_url = updates.imageUrl ?? null;
    if (updates.mood !== undefined) db.mood = updates.mood;
    if (updates.date !== undefined) db.date = updates.date.split('T')[0];
    if (Object.keys(db).length === 0) return;
    await supabase.from('manifestation_journal_entries').update(db).eq('id', id);
    setJournalEntries(prev => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const deleteJournalEntry = async (id: string) => {
    if (useLocalStorageOnly) {
      setJournalEntries(prev => {
        const next = prev.filter((e) => e.id !== id);
        persistDemo({ goals, todos, gratitudeEntries, journalEntries: next, totalPoints, streak });
        return next;
      });
      return;
    }
    if (!user) return;
    await supabase.from('manifestation_journal_entries').delete().eq('id', id);
    setJournalEntries(prev => prev.filter((e) => e.id !== id));
  };

  return {
    goals,
    todos,
    gratitudeEntries,
    journalEntries,
    totalPoints,
    streak,
    loading,
    isMutating,
    addGoal,
    updateGoalProgress,
    updateGoal,
    deleteGoal,
    addTodo,
    toggleTodo,
    deleteTodo,
    updateTodo,
    addGratitude,
    addGratitudeForDate,
    updateGratitudeSectionByKey,
    upsertGratitudeSection,
    updateGratitude,
    deleteGratitude,
    deleteGratitudeBySection,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    uploadJournalImage,
    refresh: loadAll
  };
}

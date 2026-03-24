import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Plus, Calendar as CalendarIcon, List, PenLine, Heart, Sparkles, Lightbulb } from 'lucide-react';
import { useManifestationDatabase } from '@/hooks/useManifestationDatabase';
import type { ManifestationJournalEntry } from '@/hooks/useManifestationDatabase';
import JournalEntry from '@/components/JournalEntry';
import JournalList from '@/components/JournalList';
import JournalCalendar from '@/components/JournalCalendar';
import { AuthenticatedLayout } from '@/components/AuthenticatedLayout';
import { HeroFloatingCircles } from '@/components/HeroFloatingCircles';
import { useNavigate } from 'react-router-dom';
import journalHeroImg from '@/assets/images/Journal-bg.jpg';

/** Map manifestation mood (DB) to JournalEntry/JournalList mood (UI) */
const MOOD_TO_UI: Record<string, string> = {
  great: 'amazing',
  good: 'happy',
  okay: 'neutral',
  tough: 'sad',
};
const UI_TO_MOOD: Record<string, 'great' | 'good' | 'okay' | 'tough'> = {
  amazing: 'great',
  happy: 'good',
  neutral: 'okay',
  sad: 'tough',
};

function toListEntry(e: ManifestationJournalEntry): {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
} {
  return {
    id: e.id,
    date: e.date,
    title: e.title ?? '',
    content: e.content,
    mood: MOOD_TO_UI[e.mood] ?? 'neutral',
    tags: [],
    createdAt: e.createdAt ?? '',
    updatedAt: e.createdAt ?? '',
  };
}

export default function JournalPage() {
  const navigate = useNavigate();
  const { journalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useManifestationDatabase();
  const entries = useMemo(() => journalEntries.map(toListEntry), [journalEntries]);

  const [activeTab, setActiveTab] = useState('entries');
  const [editingEntry, setEditingEntry] = useState<ReturnType<typeof toListEntry> | null>(null);
  const [showNewEntry, setShowNewEntry] = useState(false);

  const handleSaveEntry = async (payload: { id?: string; date: string; title: string; content: string; mood: string }) => {
    const mood = (UI_TO_MOOD[payload.mood] ?? 'good') as 'great' | 'good' | 'okay' | 'tough';
    const date = payload.date.split('T')[0];
    if (editingEntry) {
      await updateJournalEntry(editingEntry.id, { title: payload.title, content: payload.content, mood });
      setEditingEntry(null);
    } else {
      await addJournalEntry({ date, title: payload.title, content: payload.content, mood });
      setShowNewEntry(false);
    }
  };

  const handleEditEntry = (entry: ReturnType<typeof toListEntry>) => {
    setEditingEntry(entry);
    setActiveTab('write');
  };

  const handleDeleteEntry = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      await deleteJournalEntry(id);
    }
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setShowNewEntry(false);
    if (entries.length > 0) setActiveTab('entries');
  };

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen landing" style={{ backgroundColor: 'var(--landing-bg)', color: 'var(--landing-text)' }}>
        <section
          className="relative w-full overflow-hidden"
          style={{ minHeight: '320px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
        >
          <div className="absolute inset-0">
            <img src={journalHeroImg} alt="" className="w-full h-full object-cover" />
          </div>
          <HeroFloatingCircles />
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="mb-4 sm:mb-0 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="rounded-xl bg-black/30 hover:bg-black/40 text-white border border-white/40"
                  >
                    Back
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/')}
                    className="rounded-xl bg-white/85 hover:bg-white text-[var(--landing-primary)] border-none"
                  >
                    Home
                  </Button>
                </div>
                <div>
                  <h1
                    className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]"
                  >
                    Journal
                  </h1>
                  <p className="mt-3 text-sm sm:text-base max-w-2xl leading-relaxed text-gray-900 font-semibold drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]">
                    Capture your days, reflect on your thoughts, and track your mood. Browse entries by list or calendar—write about what went well, what you&apos;re grateful for, or what you want to accomplish next.
                  </p>
                </div>
              </div>
              {!showNewEntry && !editingEntry && (
                <Button
                  onClick={() => { setShowNewEntry(true); setActiveTab('write'); }}
                  className="hero-cta-primary font-semibold rounded-xl shrink-0 bg-white text-[var(--landing-primary)] hover:bg-slate-100 shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Write your Journal Entry
                </Button>
              )}
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

          {entries.length === 0 && !showNewEntry && !editingEntry ? (
            <div className="space-y-6">
              <Card className="border" style={{ borderColor: 'var(--landing-border)' }}>
                <CardContent className="pt-8 pb-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-60" style={{ color: 'var(--landing-primary)' }} />
                  <h2 className="text-xl font-semibold mb-2">Start your journal</h2>
                  <p className="text-sm opacity-80 max-w-md mx-auto mb-6">
                    There’s no “right” way to journal. Write about your day, how you feel, or what you’re working toward.
                  </p>
                  <Button
                    onClick={() => { setShowNewEntry(true); setActiveTab('write'); }}
                    style={{ backgroundColor: 'var(--landing-primary)', color: 'white' }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Write your first entry
                  </Button>
                </CardContent>
              </Card>

              <div className="grid sm:grid-cols-2 gap-4">
                <Card className="border" style={{ borderColor: 'var(--landing-border)', backgroundColor: '#f4f4f5' }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--landing-text)' }}>
                      <Lightbulb className="h-4 w-4" style={{ color: 'var(--landing-primary)' }} />
                      Ideas to get started
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="text-sm space-y-2" style={{ color: 'var(--landing-text)', opacity: 0.9 }}>
                      <li className="flex items-start gap-2">
                        <PenLine className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--landing-primary)' }} />
                        What went well today?
                      </li>
                      <li className="flex items-start gap-2">
                        <Heart className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--landing-primary)' }} />
                        Something I’m grateful for
                      </li>
                      <li className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--landing-primary)' }} />
                        One thing I want to accomplish tomorrow
                      </li>
                      <li className="flex items-start gap-2">
                        <BookOpen className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--landing-primary)' }} />
                        How I’m feeling right now
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                <Card className="border" style={{ borderColor: 'var(--landing-border)', backgroundColor: '#f4f4f5' }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--landing-text)' }}>
                      <CalendarIcon className="h-4 w-4" style={{ color: 'var(--landing-primary)' }} />
                      What you’ll see next
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm mb-3" style={{ color: 'var(--landing-text)', opacity: 0.9 }}>
                      After your first entry, you’ll see:
                    </p>
                    <ul className="text-sm space-y-1.5" style={{ color: 'var(--landing-text)', opacity: 0.85 }}>
                      <li>• A list of all entries with search and filters</li>
                      <li>• A calendar view of days you’ve written</li>
                      <li>• Mood and date on each entry</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <>
              {(showNewEntry || editingEntry) && (
                <div className="mb-8">
                  <JournalEntry
                    entry={editingEntry ? {
                      id: editingEntry.id,
                      date: editingEntry.date,
                      title: editingEntry.title,
                      content: editingEntry.content,
                      mood: editingEntry.mood,
                      tags: editingEntry.tags,
                    } : undefined}
                    onSave={handleSaveEntry}
                    onCancel={handleCancelEdit}
                  />
                </div>
              )}

              {!showNewEntry && !editingEntry && (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-6 w-full sm:w-auto bg-zinc-200/80">
                    <TabsTrigger value="entries" className="gap-2">
                      <List className="h-4 w-4" />
                      Entries
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Calendar
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="entries" className="mt-0">
                    <JournalList
                      entries={entries}
                      onEdit={handleEditEntry}
                      onDelete={handleDeleteEntry}
                    />
                  </TabsContent>
                  <TabsContent value="calendar" className="mt-0">
                    <JournalCalendar
                      entries={entries.map(e => ({ id: e.id, date: e.date, mood: e.mood }))}
                    />
                  </TabsContent>
                </Tabs>
              )}
            </>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

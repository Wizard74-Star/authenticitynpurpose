import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Calendar, Heart, Smile, Meh, Frown, Save } from 'lucide-react';

/** UI mood labels; map to DB values great | good | okay | tough. Icon colors match Journal page. */
export const JOURNAL_MOODS = [
  { value: 'amazing' as const, label: 'Amazing', icon: Heart, iconColor: '#ec4899' },
  { value: 'happy' as const, label: 'Happy', icon: Smile, iconColor: '#16a34a' },
  { value: 'neutral' as const, label: 'Neutral', icon: Meh, iconColor: '#6b7280' },
  { value: 'sad' as const, label: 'Sad', icon: Frown, iconColor: '#2563eb' },
];

export const UI_MOOD_TO_DB: Record<string, 'great' | 'good' | 'okay' | 'tough'> = {
  amazing: 'great',
  happy: 'good',
  neutral: 'okay',
  sad: 'tough',
};
export const DB_MOOD_TO_UI: Record<string, string> = {
  great: 'amazing',
  good: 'happy',
  okay: 'neutral',
  tough: 'sad',
};

export interface JournalEntryFormValues {
  date: string;
  title: string;
  content: string;
  mood: 'great' | 'good' | 'okay' | 'tough';
  tags?: string[];
}

interface JournalEntryFormProps {
  initialValues: JournalEntryFormValues;
  onSave: (values: JournalEntryFormValues) => void;
  onCancel: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
  isEdit?: boolean;
  variant?: 'card' | 'dialog';
  /** When true, hide date picker and always use today (e.g. Dashboard journal dialog) */
  lockDateToToday?: boolean;
}

export function JournalEntryForm({
  initialValues,
  onSave,
  onCancel,
  onDelete,
  showDelete = false,
  isEdit = false,
  variant = 'card',
  lockDateToToday = false,
}: JournalEntryFormProps) {
  const [date, setDate] = useState(initialValues.date.split('T')[0]);
  const [title, setTitle] = useState(initialValues.title);
  const [content, setContent] = useState(initialValues.content);
  const [mood, setMood] = useState(DB_MOOD_TO_UI[initialValues.mood] ?? 'happy');
  const [tagsStr, setTagsStr] = useState((initialValues.tags ?? []).join(', '));

  useEffect(() => {
    setDate(initialValues.date.split('T')[0]);
    setTitle(initialValues.title);
    setContent(initialValues.content);
    setMood(DB_MOOD_TO_UI[initialValues.mood] ?? 'happy');
    setTagsStr((initialValues.tags ?? []).join(', '));
  }, [initialValues.date, initialValues.title, initialValues.content, initialValues.mood, (initialValues.tags ?? []).join(', ')]);

  const effectiveDate = lockDateToToday ? initialValues.date.split('T')[0] : date;

  const handleSave = () => {
    const dbMood = (UI_MOOD_TO_DB[mood] ?? 'good') as 'great' | 'good' | 'okay' | 'tough';
    const tags = tagsStr.split(',').map((t) => t.trim()).filter(Boolean);
    onSave({
      date: effectiveDate.split('T')[0],
      title: title.trim(),
      content: content.trim(),
      mood: dbMood,
      tags,
    });
  };

  const isValid = content.trim().length > 0;
  const isCompact = variant === 'dialog';

  const todayLabel = lockDateToToday && effectiveDate
    ? new Date(effectiveDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div className={isCompact ? 'space-y-4' : 'space-y-6'}>
      {lockDateToToday && todayLabel && (
        <div
          className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium"
          style={{ borderColor: 'var(--landing-border)', backgroundColor: 'rgba(255,255,255,0.6)', color: '#1f2937' }}
        >
          <Calendar className="h-4 w-4 shrink-0 opacity-70" style={{ color: '#1f2937' }} />
          <span>Today: {todayLabel}</span>
        </div>
      )}
      <div className={`grid grid-cols-1 ${lockDateToToday ? 'gap-3' : isCompact ? 'gap-3 md:grid-cols-2' : 'md:grid-cols-2 gap-4'}`}>
        {!lockDateToToday && (
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--landing-text)' }}>Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-10 rounded-xl border-[var(--landing-border)]"
                style={{ color: 'var(--landing-text)' }}
              />
            </div>
          </div>
        )}
        <div>
          <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--landing-text)' }}>Title (Optional)</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your entry a title..."
            className="rounded-xl border-[var(--landing-border)]"
            style={{ color: 'var(--landing-text)' }}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--landing-text)' }}>How are you feeling?</label>
        <div className="flex gap-2 flex-wrap">
          {JOURNAL_MOODS.map((moodOption) => {
            const IconComponent = moodOption.icon;
            const isSelected = mood === moodOption.value;
            const selectedBg = moodOption.iconColor;
            return (
              <Button
                key={moodOption.value}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMood(moodOption.value)}
                className="flex items-center gap-2 rounded-xl border-2 border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 data-[state=active]:border-transparent"
                style={
                  isSelected
                    ? { backgroundColor: selectedBg, color: '#fff', borderColor: selectedBg }
                    : {
                        borderColor: '#d1d5db',
                        backgroundColor: '#ffffff',
                        color: '#1f2937',
                      }
                }
              >
                <IconComponent
                  className="h-4 w-4 shrink-0"
                  style={isSelected ? { color: '#fff' } : { color: moodOption.iconColor }}
                />
                <span style={isSelected ? { color: '#fff' } : { color: '#1f2937' }}>{moodOption.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--landing-text)' }}>Your Thoughts</label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind today? Write about your experiences, thoughts, feelings, or anything that matters to you..."
          className={`resize-none rounded-xl border-[var(--landing-border)] ${isCompact ? 'min-h-[140px]' : 'min-h-[200px]'}`}
          style={{ color: 'var(--landing-text)' }}
          rows={isCompact ? 5 : 8}
        />
        <p className="text-sm mt-1" style={{ color: 'var(--landing-text)', opacity: 0.7 }}>
          {content.length} characters
        </p>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--landing-text)' }}>Tags (Optional)</label>
        <Input
          value={tagsStr}
          onChange={(e) => setTagsStr(e.target.value)}
          placeholder="work, family, travel, gratitude (comma separated)"
          className="rounded-xl border-[var(--landing-border)]"
          style={{ color: 'var(--landing-text)' }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
        {showDelete && onDelete && (
          <Button variant="outline" onClick={onDelete} className="rounded-xl text-red-600 border-red-200 hover:bg-red-50">
            Remove
          </Button>
        )}
        <Button variant="outline" onClick={onCancel} className="rounded-xl border-[var(--landing-border)]">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!isValid}
          className="rounded-xl"
          style={{ backgroundColor: 'var(--landing-primary)', color: 'white' }}
        >
          <Save className="h-4 w-4 mr-2" />
          {isEdit ? 'Update Entry' : 'Save Entry'}
        </Button>
      </div>
    </div>
  );
}

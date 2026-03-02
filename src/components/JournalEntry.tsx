import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit3 } from 'lucide-react';
import { JournalEntryForm, DB_MOOD_TO_UI, UI_MOOD_TO_DB } from './JournalEntryForm';

interface JournalEntryProps {
  entry?: {
    id: string;
    date: string;
    title: string;
    content: string;
    mood: string;
    tags: string[];
  };
  onSave: (entry: any) => void;
  onCancel: () => void;
}

const JournalEntry: React.FC<JournalEntryProps> = ({ entry, onSave, onCancel }) => {
  const initialMood = (entry?.mood ? (UI_MOOD_TO_DB[entry.mood] ?? 'good') : 'good') as 'great' | 'good' | 'okay' | 'tough';

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit3 className="h-5 w-5" />
          {entry ? 'Edit Entry' : 'New Journal Entry'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <JournalEntryForm
          initialValues={{
            date: entry?.date || new Date().toISOString().split('T')[0],
            title: entry?.title || '',
            content: entry?.content || '',
            mood: initialMood,
            tags: entry?.tags ?? [],
          }}
          onSave={(values) => {
            const uiMood = DB_MOOD_TO_UI[values.mood] ?? 'happy';
            onSave({
              id: entry?.id || Date.now().toString(),
              date: values.date,
              title: values.title || `Journal Entry - ${new Date(values.date).toLocaleDateString()}`,
              content: values.content,
              mood: uiMood,
              tags: values.tags ?? [],
              createdAt: entry?.id ? (entry as any).createdAt : new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }}
          onCancel={onCancel}
          isEdit={!!entry}
          variant="card"
        />
      </CardContent>
    </Card>
  );
};

export default JournalEntry;

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Heart, Smile, Meh, Frown, Search, Edit, Trash2, Calendar } from 'lucide-react';

interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: string;
  tags: string[];
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface JournalListProps {
  entries: JournalEntry[];
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
}

const moods = [
  { value: 'amazing', label: 'Amazing', icon: Heart, color: 'text-pink-500' },
  { value: 'happy', label: 'Happy', icon: Smile, color: 'text-green-500' },
  { value: 'neutral', label: 'Neutral', icon: Meh, color: 'text-gray-500' },
  { value: 'sad', label: 'Sad', icon: Frown, color: 'text-blue-500' },
];

const JournalList: React.FC<JournalListProps> = ({ entries, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesMood = !selectedMood || entry.mood === selectedMood;
    
    return matchesSearch && matchesMood;
  });

  const sortedEntries = filteredEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getMoodIcon = (moodValue: string) => {
    const mood = moods.find(m => m.value === moodValue);
    return mood ? { icon: mood.icon, color: mood.color } : { icon: Meh, color: 'text-gray-500' };
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search entries, tags, or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedMood === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedMood(null)}
          >
            All Moods
          </Button>
          {moods.map((mood) => {
            const IconComponent = mood.icon;
            return (
              <Button
                key={mood.value}
                variant={selectedMood === mood.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMood(mood.value)}
                className="flex items-center gap-1"
              >
                <IconComponent className={`h-3 w-3 ${mood.color}`} />
                {mood.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Entries List */}
      <div className="space-y-4">
        {sortedEntries.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">
                {searchTerm || selectedMood ? 'No entries match your filters.' : 'No journal entries yet. Start writing your first entry!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedEntries.map((entry) => {
            const { icon: MoodIcon, color } = getMoodIcon(entry.mood);
            return (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <MoodIcon className={`h-5 w-5 ${color}`} />
                      <div>
                        <h3 className="font-semibold text-lg">{entry.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {new Date(entry.date).toLocaleDateString('en', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onEdit(entry)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(entry.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {entry.imageUrl && (
                    <div className="mb-3 rounded-lg overflow-hidden border max-h-48">
                      <img src={entry.imageUrl} alt="" className="w-full max-h-48 object-contain bg-muted/30" />
                    </div>
                  )}
                  
                  <p className="text-gray-700 mb-3 leading-relaxed">
                    {truncateContent(entry.content)}
                  </p>
                  
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Results Count */}
      {(searchTerm || selectedMood) && (
        <p className="text-sm text-gray-500 text-center">
          Showing {sortedEntries.length} of {entries.length} entries
        </p>
      )}
    </div>
  );
};

export default JournalList;
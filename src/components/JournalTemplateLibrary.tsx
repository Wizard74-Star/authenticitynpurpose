import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JournalTemplate } from '@/types/journalTemplate';
import { prebuiltTemplates } from '@/data/journalTemplates';
import { Plus } from 'lucide-react';

interface JournalTemplateLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: JournalTemplate) => void;
  onCreateCustom: () => void;
  customTemplates: JournalTemplate[];
}

export default function JournalTemplateLibrary({
  open,
  onOpenChange,
  onSelectTemplate,
  onCreateCustom,
  customTemplates
}: JournalTemplateLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'gratitude', label: '🙏 Appreciate' },
    { value: 'goal-reflection', label: '🎯 Goal Reflection' },
    { value: 'daily-planning', label: '📅 Daily Planning' },
    { value: 'mood-tracking', label: '😊 Mood Tracking' },
    { value: 'creative-writing', label: '✍️ Creative Writing' },
    { value: 'custom', label: '⭐ My Templates' }
  ];

  const allTemplates = [...prebuiltTemplates, ...customTemplates];
  const filteredTemplates = selectedCategory === 'all' 
    ? allTemplates 
    : allTemplates.filter(t => t.category === selectedCategory);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Journal Template Library</DialogTitle>
        </DialogHeader>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid grid-cols-7 w-full">
            {categories.map(cat => (
              <TabsTrigger key={cat.value} value={cat.value} className="text-xs">
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Create Custom Template Card */}
              <Card className="border-dashed border-2 hover:border-primary cursor-pointer transition-colors" onClick={onCreateCustom}>
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Create Custom Template</CardTitle>
                  <CardDescription>Design your own journal template with custom prompts</CardDescription>
                </CardHeader>
              </Card>

              {/* Template Cards */}
              {filteredTemplates.map(template => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelectTemplate(template)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl">{template.icon}</span>
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription className="text-sm mt-1">{template.description}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{template.prompts.length} prompts</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

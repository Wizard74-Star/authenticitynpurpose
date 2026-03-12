import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Target, CheckCircle2, Lightbulb, Plus, X } from 'lucide-react';
import { GoalTemplateData } from '@/data/goalTemplatesData';

interface GoalTemplateCustomizerProps {
  template: GoalTemplateData | null;
  open: boolean;
  onClose: () => void;
  onSave: (customizedGoal: any) => void;
}

const GoalTemplateCustomizer: React.FC<GoalTemplateCustomizerProps> = ({
  template,
  open,
  onClose,
  onSave
}) => {
  const [title, setTitle] = useState(template?.title || '');
  const [description, setDescription] = useState(template?.description || '');
  const [duration, setDuration] = useState(template?.duration || '');
  const [tasks, setTasks] = useState<string[]>(template?.tasks || []);
  const [milestones, setMilestones] = useState<string[]>(template?.milestones || []);
  const [newTask, setNewTask] = useState('');
  const [newMilestone, setNewMilestone] = useState('');

  React.useEffect(() => {
    if (template) {
      setTitle(template.title);
      setDescription(template.description);
      setDuration(template.duration);
      setTasks(template.tasks);
      setMilestones(template.milestones);
    }
  }, [template]);

  const handleAddTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, newTask.trim()]);
      setNewTask('');
    }
  };

  const handleRemoveTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleAddMilestone = () => {
    if (newMilestone.trim()) {
      setMilestones([...milestones, newMilestone.trim()]);
      setNewMilestone('');
    }
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave({
      ...template,
      title,
      description,
      duration,
      tasks,
      milestones
    });
    onClose();
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Your Goal</DialogTitle>
          <DialogDescription>
            Personalize this template to fit your specific needs and timeline
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Goal Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter goal title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your goal"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 8 weeks"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Badge className="mt-2">{template.category}</Badge>
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4" />
              Tasks
            </Label>
            <div className="space-y-2">
              {tasks.map((task, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="flex-1 text-sm">{task}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveTask(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Add a new task"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                />
                <Button onClick={handleAddTask} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Milestones */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4" />
              Milestones
            </Label>
            <div className="space-y-2">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                  <span className="flex-1 text-sm">{milestone}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveMilestone(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newMilestone}
                  onChange={(e) => setNewMilestone(e.target.value)}
                  placeholder="Add a milestone"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddMilestone()}
                />
                <Button onClick={handleAddMilestone} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Best Practices */}
          <div className="bg-amber-50 p-4 rounded-lg">
            <Label className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              Best Practices
            </Label>
            <ul className="space-y-1 text-sm text-gray-700">
              {template.bestPractices.map((practice, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-amber-600 mt-1">•</span>
                  <span>{practice}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Add to My Goals–Vision Board</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GoalTemplateCustomizer;

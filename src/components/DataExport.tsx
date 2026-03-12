import { Download, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useDatabase } from '@/hooks/useDatabase';

export function DataExport() {
  const { toast } = useToast();
  const { goals, habits, journalEntries } = useDatabase();

  const exportToJSON = () => {
    const data = {
      goals,
      habits,
      journalEntries,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `depo-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast({ title: 'Data exported successfully!' });
  };

  const exportToCSV = () => {
    const csv = goals.map(g => `${g.title},${g.category},${g.progress},${g.targetDate}`).join('\n');
    const blob = new Blob([`Title,Category,Progress,Target Date\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goals-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast({ title: 'Goals–Vision Board exported to CSV!' });
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Export Your Data</h3>
      <div className="space-y-3">
        <Button onClick={exportToJSON} className="w-full justify-start">
          <Download className="mr-2 h-4 w-4" />
          Export All Data (JSON)
        </Button>
        <Button onClick={exportToCSV} variant="outline" className="w-full justify-start">
          <FileText className="mr-2 h-4 w-4" />
          Export Goals–Vision Board (CSV)
        </Button>
      </div>
    </Card>
  );
}

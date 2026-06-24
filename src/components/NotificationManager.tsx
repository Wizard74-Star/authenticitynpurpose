import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/hooks/useNotifications';

export function NotificationManager() {
  const { permission, unreadCount, requestPermission } = useNotifications();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Push Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Get real-time reminders for your goals and habits
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {permission === 'default' && (
          <Button onClick={requestPermission} className="w-full">
            <Bell className="mr-2 h-4 w-4" />
            Enable Notifications
          </Button>
        )}
        {permission === 'granted' && (
          <div className="text-center text-sm text-green-600">
            ✓ Notifications enabled
          </div>
        )}
        {permission === 'denied' && (
          <div className="text-center text-sm text-red-600">
            <BellOff className="mx-auto h-8 w-8 mb-2" />
            Notifications blocked. Enable in browser settings.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

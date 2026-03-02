import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, RefreshCw, Users, ShieldAlert, Search, UserPlus, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

export type AccessType = 'paid' | 'trial' | 'invite_premium' | 'free';

interface AdminUser {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  access_type?: AccessType;
}

export function AdminUserManagement() {
  const { session } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const lastFetchedTokenRef = useRef<string | null>(null);

  const token = session?.access_token ?? null;

  const fetchUsers = async () => {
    setAccessError(null);
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/admin-users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        setAccessError((data?.error as string) ?? 'You don’t have permission to view users.');
        setUsers([]);
        return;
      }
      if (!res.ok) throw new Error((data?.error as string) || 'Failed to load users');
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch {
      setUsers([]);
      toast({ title: 'Failed to load users', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    if (lastFetchedTokenRef.current === token) return;
    lastFetchedTokenRef.current = token;
    fetchUsers();
  }, [token]);

  const filtered = users.filter(
    (u) => !search.trim() || (u.email ?? '').toLowerCase().includes(search.trim().toLowerCase())
  );
  const selected = selectedId ? (users.find((u) => u.id === selectedId) ?? null) : null;

  const formatDate = (s: string | null) => {
    if (!s) return '—';
    try {
      return new Date(s).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return s;
    }
  };

  const accessLabel = (t: AccessType | undefined) => {
    switch (t) {
      case 'paid': return 'Paid';
      case 'trial': return 'Trial';
      case 'invite_premium': return 'Invite premium';
      case 'free': return 'Free';
      default: return '—';
    }
  };

  const accessVariant = (t: AccessType | undefined): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (t) {
      case 'paid': return 'default';
      case 'trial': return 'secondary';
      case 'invite_premium': return 'outline';
      default: return 'secondary';
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = createEmail.trim().toLowerCase();
    if (!email) {
      toast({ title: 'Enter an email', variant: 'destructive' });
      return;
    }
    if (!token) return;
    setCreateSubmitting(true);
    try {
      const res = await fetch('/api/admin-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          email,
          password: createPassword.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: (data?.error as string) || 'Failed to create user', variant: 'destructive' });
        return;
      }
      toast({ title: 'User created' });
      setCreateOpen(false);
      setCreateEmail('');
      setCreatePassword('');
      fetchUsers();
    } finally {
      setCreateSubmitting(false);
    }
  };

  const openEdit = () => {
    if (selected) {
      setEditEmail(selected.email ?? '');
      setEditOpen(true);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !token) return;
    const email = editEmail.trim().toLowerCase();
    if (!email) {
      toast({ title: 'Enter an email', variant: 'destructive' });
      return;
    }
    setEditSubmitting(true);
    try {
      const res = await fetch('/api/admin-user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: selectedId, email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: (data?.error as string) || 'Failed to update user', variant: 'destructive' });
        return;
      }
      toast({ title: 'User updated' });
      setEditOpen(false);
      fetchUsers();
      setSelectedId(null);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId || !token) return;
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/admin-user?id=${encodeURIComponent(selectedId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: (data?.error as string) || 'Failed to delete user', variant: 'destructive' });
        return;
      }
      toast({ title: 'User deleted' });
      setDeleteOpen(false);
      setSelectedId(null);
      fetchUsers();
    } finally {
      setDeleteSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (accessError) {
    return (
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Access denied</AlertTitle>
            <AlertDescription>{accessError}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      <Card className="w-full">
        <CardHeader className="pb-4 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                <Users className="h-5 w-5 shrink-0" />
                User management
              </CardTitle>
              <CardDescription className="mt-1">
                View, create, update, or remove users. Select a user to see details and actions.
              </CardDescription>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={fetchUsers} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite user
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List */}
            <div className="lg:col-span-2 min-w-0">
              <div className="hidden lg:block rounded-lg border overflow-x-auto">
                <table className="w-full text-sm min-w-[400px]">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Email</th>
                      <th className="text-left p-3 font-medium">Access</th>
                      <th className="text-left p-3 font-medium hidden xl:table-cell">Signed up</th>
                      <th className="text-left p-3 font-medium hidden xl:table-cell">Last sign in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-muted-foreground">
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((u) => (
                        <tr
                          key={u.id}
                          onClick={() => setSelectedId(u.id)}
                          className={`border-t cursor-pointer transition-colors ${
                            selectedId === u.id
                              ? 'bg-primary/10 border-l-2 border-l-primary'
                              : 'hover:bg-muted/30'
                          }`}
                        >
                          <td className="p-3 font-medium">{u.email ?? '(no email)'}</td>
                          <td className="p-3">
                            <Badge variant={accessVariant(u.access_type)} className="text-xs">
                              {accessLabel(u.access_type)}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground hidden xl:table-cell">
                            {formatDate(u.created_at)}
                          </td>
                          <td className="p-3 text-muted-foreground hidden xl:table-cell">
                            {formatDate(u.last_sign_in_at)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* Mobile/tablet: cards */}
              <div className="lg:hidden space-y-2">
                {filtered.length === 0 ? null : (
                  filtered.map((u) => (
                    <div
                      key={u.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedId(u.id)}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedId(u.id)}
                      className={`p-4 rounded-lg border text-left ${
                        selectedId === u.id ? 'ring-2 ring-primary bg-primary/5' : 'bg-card'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium break-all">{u.email ?? '(no email)'}</p>
                        <Badge variant={accessVariant(u.access_type)} className="text-xs shrink-0">
                          {accessLabel(u.access_type)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Signed up: {formatDate(u.created_at)}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Showing {filtered.length} of {users.length} user{users.length !== 1 ? 's' : ''}
                {search.trim() ? ' (filtered)' : ''}.
              </p>
            </div>

            {/* Detail panel */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selected ? (
                    <>
                      <dl className="space-y-2 text-sm">
                        <div>
                          <dt className="text-muted-foreground">Email</dt>
                          <dd className="font-medium break-all">{selected.email ?? '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Access</dt>
                          <dd>
                            <Badge variant={accessVariant(selected.access_type)} className="text-xs">
                              {accessLabel(selected.access_type)}
                            </Badge>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Signed up</dt>
                          <dd>{formatDate(selected.created_at)}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Last sign in</dt>
                          <dd>{formatDate(selected.last_sign_in_at)}</dd>
                        </div>
                      </dl>
                      <div className="flex flex-col gap-2 pt-2">
                        <Button variant="outline" size="sm" className="w-full gap-2" onClick={openEdit}>
                          <Pencil className="h-4 w-4" />
                          Edit user
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteOpen(true)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete user
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Select a user from the list to view details and actions, or invite a new user.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create user dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite user</DialogTitle>
            <DialogDescription>
              Create a new user account. They can sign in with this email. Optionally set a password (min 6 characters); otherwise they can use password reset.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                placeholder="user@example.com"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Password (optional)</Label>
              <Input
                id="create-password"
                type="password"
                placeholder="Min 6 characters"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                minLength={6}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createSubmitting}>
                {createSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit user dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>Update the user&apos;s email address.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="user@example.com"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={editSubmitting}>
                {editSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the user account and their data. This action cannot be undone.
              {selected?.email && (
                <span className="block mt-2 font-medium text-foreground">
                  User: {selected.email}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleteSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

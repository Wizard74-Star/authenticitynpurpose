import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Copy, Gift, Plus, ShieldAlert, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface InviteCodeRow {
  id: string;
  code: string;
  label: string | null;
  assigned_to: string | null;
  is_lifetime: boolean;
  uses_remaining: number | null;
  used_count: number;
  created_at: string;
}

export function InviteCodesManager() {
  const { session } = useAuth();
  const [codes, setCodes] = useState<InviteCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newUsesRemaining, setNewUsesRemaining] = useState<string>('');
  const [generateCount, setGenerateCount] = useState<string>('5');
  const [generateLoading, setGenerateLoading] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [accessHint, setAccessHint] = useState<string | null>(null);
  const lastFetchedTokenRef = useRef<string | null>(null);

  const fetchCodes = async () => {
    const token = session?.access_token;
    setAccessError(null);
    setAccessHint(null);
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/invite-codes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        setAccessError(data?.error ?? 'You don’t have permission to manage invite codes.');
        setAccessHint(data?.hint ?? null);
        setCodes([]);
        return;
      }
      if (!res.ok) throw new Error('Failed to load invite codes');
      setCodes(data.codes ?? []);
    } catch {
      setCodes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = session?.access_token ?? null;
    if (!token) {
      setLoading(false);
      return;
    }
    // Only fetch when token actually changed (e.g. new login), not on every session reference update
    if (lastFetchedTokenRef.current === token) return;
    lastFetchedTokenRef.current = token;
    fetchCodes();
  }, [session?.access_token]);

  const handleGenerate = async () => {
    const n = parseInt(generateCount, 10);
    if (!n || n < 1 || n > 100) {
      toast({ title: 'Enter a number between 1 and 100', variant: 'destructive' });
      return;
    }
    const token = session?.access_token;
    if (!token) return;
    setGenerateLoading(true);
    setAccessError(null);
    try {
      const res = await fetch('/api/invite-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ count: n }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        setAccessError((data?.error as string) ?? 'Admin access required.');
        setAccessHint((data?.hint as string) ?? null);
        toast({ title: 'Access denied', variant: 'destructive' });
        return;
      }
      if (!res.ok) {
        toast({ title: (data?.error as string) || 'Failed to generate codes', variant: 'destructive' });
        return;
      }
      const created = data?.created ?? data?.codes?.length ?? 0;
      toast({ title: `Generated ${created} invite code(s)` });
      setGenerateCount('5');
      fetchCodes();
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = newCode.trim().toUpperCase();
    if (!code || code.length < 4) {
      toast({ title: 'Code must be at least 4 characters', variant: 'destructive' });
      return;
    }
    const token = session?.access_token;
    if (!token) return;
    setCreateLoading(true);
    setAccessError(null);
    try {
      const res = await fetch('/api/invite-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          code,
          label: newLabel.trim() || undefined,
          uses_remaining: newUsesRemaining.trim() ? parseInt(newUsesRemaining, 10) : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        setAccessError((data?.error as string) ?? 'Admin access required.');
        setAccessHint((data?.hint as string) ?? null);
        toast({ title: 'Access denied', variant: 'destructive' });
        return;
      }
      if (!res.ok) {
        toast({ title: (data?.error as string) || 'Failed to create code', variant: 'destructive' });
        return;
      }
      toast({ title: 'Invite code created' });
      setNewCode('');
      setNewLabel('');
      setNewUsesRemaining('');
      fetchCodes();
    } finally {
      setCreateLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copied to clipboard' });
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
        <CardContent className="pt-6 space-y-4">
          <Alert variant="warning" className="border-amber-300 dark:border-amber-700">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Access denied</AlertTitle>
            <AlertDescription>
              <span className="block mb-2">{accessError}</span>
              {accessHint && (
                <code className="mt-2 block p-2 rounded bg-amber-100 dark:bg-amber-900/40 text-xs break-all">
                  {accessHint}
                </code>
              )}
            </AlertDescription>
          </Alert>
          <p className="text-sm text-muted-foreground">
            Run the SQL in Supabase (SQL Editor) to add your email:{" "}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
              INSERT INTO public.admins (email) VALUES (&apos;your@email.com&apos;) ON CONFLICT (email) DO NOTHING;
            </code>
          </p>
          <Button variant="outline" onClick={fetchCodes}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formatCreated = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, { dateStyle: 'medium' });
  const formatCreatedFull = (dateStr: string) =>
    new Date(dateStr).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  const limitLabel = (row: InviteCodeRow) =>
    row.uses_remaining != null ? `${row.used_count} / ${row.uses_remaining}` : `${row.used_count} used`;
  const isExhausted = (row: InviteCodeRow) =>
    row.uses_remaining != null && row.used_count >= row.uses_remaining;

  return (
    <div className="w-full space-y-6 md:space-y-8">
      <Card className="overflow-hidden shadow-sm border bg-card w-full">
        <CardHeader className="space-y-1.5 pb-4 px-4 sm:px-6 md:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Gift className="h-5 w-5 text-primary" />
                </span>
                Invite codes
              </CardTitle>
              <CardDescription className="mt-1.5 text-sm text-muted-foreground max-w-xl">
                Codes grant lifetime premium access. Generate random 10-digit codes or create a custom code (min 4 characters). Each use redeems one slot.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCodes}
              className="shrink-0 gap-2 h-9"
              aria-label="Refresh list"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 md:space-y-8 px-4 sm:px-6 pb-6">
          {/* Generate codes */}
          <section className="rounded-xl border bg-muted/30 p-4 sm:p-5 space-y-3" aria-labelledby="generate-heading">
            <h2 id="generate-heading" className="text-sm font-semibold text-foreground">Generate codes</h2>
            <p className="text-xs text-muted-foreground">Random 10-digit numeric codes; no duplicates.</p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-sm">
              <div className="space-y-1.5 flex-1 min-w-0">
                <label htmlFor="generate-count" className="text-sm font-medium">Number</label>
                <Input
                  id="generate-count"
                  type="number"
                  min={1}
                  max={100}
                  value={generateCount}
                  onChange={(e) => setGenerateCount(e.target.value)}
                  className="h-10"
                  aria-describedby="generate-desc"
                />
                <span id="generate-desc" className="sr-only">Between 1 and 100</span>
              </div>
              <Button
                type="button"
                variant="default"
                onClick={handleGenerate}
                disabled={generateLoading}
                className="h-10 shrink-0 min-h-[2.5rem]"
              >
                {generateLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Generate
              </Button>
            </div>
          </section>

          {/* Custom code */}
          <section className="space-y-3" aria-labelledby="custom-heading">
            <h2 id="custom-heading" className="text-sm font-semibold text-foreground">Custom code (optional)</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="space-y-1.5 flex-1 min-w-0 w-full sm:max-w-[200px]">
                <label htmlFor="custom-code" className="text-sm font-medium">Code</label>
                <Input
                  id="custom-code"
                  placeholder="e.g. INFLUENCER1"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="uppercase h-10 min-h-[2.5rem]"
                  minLength={4}
                />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0 w-full sm:max-w-[180px]">
                <label htmlFor="custom-label" className="text-sm font-medium">Label (optional)</label>
                <Input
                  id="custom-label"
                  placeholder="e.g. Jane Doe"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="h-10 min-h-[2.5rem]"
                />
              </div>
              <div className="space-y-1.5 w-full sm:w-28">
                <label htmlFor="custom-uses" className="text-sm font-medium">Max uses</label>
                <Input
                  id="custom-uses"
                  type="number"
                  min={1}
                  placeholder="∞"
                  value={newUsesRemaining}
                  onChange={(e) => setNewUsesRemaining(e.target.value)}
                  className="h-10 min-h-[2.5rem]"
                />
                <p className="text-xs text-muted-foreground">Leave empty for single use</p>
              </div>
              <Button
                type="submit"
                disabled={createLoading || newCode.trim().length < 4}
                className="h-10 min-h-[2.5rem] shrink-0 w-full sm:w-auto"
              >
                {createLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Create
              </Button>
            </form>
          </section>

          {/* Existing codes */}
          <section className="space-y-3" aria-labelledby="existing-heading">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 id="existing-heading" className="text-sm font-semibold text-foreground">Existing codes</h2>
              {codes.length > 0 && (
                <Badge variant="secondary" className="text-xs w-fit">
                  {codes.length} total
                </Badge>
              )}
            </div>
            {codes.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-lg border border-dashed bg-muted/20">
                <p className="text-sm text-muted-foreground">No invite codes yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Generate a batch above or create a custom code.</p>
              </div>
            ) : (
              <>
                {/* Desktop: scrollable table */}
                <div className="hidden md:block rounded-lg border overflow-x-auto">
                  <table className="w-full text-sm min-w-[520px]">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left p-3 font-medium">Code</th>
                        <th className="text-left p-3 font-medium">Label</th>
                        <th className="text-left p-3 font-medium">Used / Limit</th>
                        <th className="text-left p-3 font-medium">Created</th>
                        <th className="w-14 p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {codes.map((row) => (
                        <tr
                          key={row.id}
                          className={`border-b last:border-0 hover:bg-muted/20 transition-colors ${isExhausted(row) ? 'opacity-70' : ''}`}
                        >
                          <td className="p-3 font-mono font-medium align-middle">{row.code}</td>
                          <td className="p-3 text-muted-foreground align-middle">{row.label || '—'}</td>
                          <td className="p-3 align-middle">
                            <span className={isExhausted(row) ? 'text-muted-foreground' : ''}>
                              {limitLabel(row)}
                            </span>
                            {row.uses_remaining != null && row.used_count >= row.uses_remaining && (
                              <Badge variant="outline" className="ml-1.5 text-xs">Used up</Badge>
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground align-middle" title={formatCreatedFull(row.created_at)}>
                            {formatCreated(row.created_at)}
                          </td>
                          <td className="p-3 text-right align-middle">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 shrink-0"
                              onClick={() => copyCode(row.code)}
                              title="Copy code"
                              aria-label={`Copy ${row.code}`}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile: cards */}
                <div className="md:hidden space-y-3">
                  {codes.map((row) => (
                    <div
                      key={row.id}
                      className={`rounded-lg border bg-card p-4 shadow-sm ${isExhausted(row) ? 'opacity-75' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono font-semibold text-base break-all">{row.code}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 min-h-[2.25rem] shrink-0 gap-1.5"
                          onClick={() => copyCode(row.code)}
                          aria-label={`Copy ${row.code}`}
                        >
                          <Copy className="h-4 w-4" />
                          Copy
                        </Button>
                      </div>
                      <dl className="mt-3 grid grid-cols-1 gap-1.5 text-sm">
                        {row.label && (
                          <div>
                            <dt className="text-muted-foreground">Label</dt>
                            <dd className="font-medium">{row.label}</dd>
                          </div>
                        )}
                        <div>
                          <dt className="text-muted-foreground">Used / Limit</dt>
                          <dd className="font-medium">
                            {limitLabel(row)}
                            {isExhausted(row) && (
                              <Badge variant="outline" className="ml-2 text-xs">Used up</Badge>
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Created</dt>
                          <dd className="font-medium">{formatCreated(row.created_at)}</dd>
                        </div>
                      </dl>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

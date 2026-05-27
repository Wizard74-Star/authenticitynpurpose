import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Heart, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { GRATITUDE_DEFAULT_SECTIONS } from '@/data/gratitudeSections';
import type { ManifestationGratitude } from '@/hooks/useManifestationDatabase';

export type GratitudeSectionEntry = {
  sectionKey: string;
  sectionLabel: string | null;
  content: string;
  id?: string;
};

interface GratitudeJournalSectionsProps {
  /** Selected date (ISO) */
  date: string;
  /** All gratitude entries (will be filtered by date) */
  entries: ManifestationGratitude[];
  /** Save or update content for a section */
  onSaveSection: (
    date: string,
    sectionKey: string,
    sectionLabel: string | null,
    content: string
  ) => void | Promise<void>;
  /** Add a custom section (sectionKey will be custom-{id}) */
  onAddCustomSection?: (date: string, sectionLabel: string) => void | Promise<void>;
  /** Optional: delete a custom section */
  onRemoveCustomSection?: (date: string, sectionKey: string) => void;
  /** Use landing page styles */
  useLandingStyles?: boolean;
  /** Compact mode for small screens */
  compact?: boolean;
}

function sectionKeyForEntry(sectionKey?: string | null): string {
  const trimmed = (sectionKey ?? '').trim();
  return trimmed || 'general';
}

function getEntriesBySection(
  date: string,
  entries: ManifestationGratitude[]
): Map<string, { content: string; id?: string }> {
  const map = new Map<string, { content: string; id?: string }>();
  entries
    .filter((e) => e.date === date)
    .forEach((e) => {
      const key = sectionKeyForEntry(e.sectionKey);
      map.set(key, { content: e.content ?? '', id: e.id });
    });
  return map;
}

export function GratitudeJournalSections({
  date,
  entries,
  onSaveSection,
  onAddCustomSection,
  onRemoveCustomSection,
  useLandingStyles = true,
  compact = false,
}: GratitudeJournalSectionsProps) {
  const [localContent, setLocalContent] = useState<Record<string, string>>({});
  const [addedCustomKeys, setAddedCustomKeys] = useState<{ key: string; label: string }[]>([]);
  const [newSectionName, setNewSectionName] = useState('');
  const [showAddSection, setShowAddSection] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  useEffect(() => {
    setLocalContent({});
    setAddedCustomKeys([]);
  }, [date]);

  const bySection = useMemo(
    () => getEntriesBySection(date, entries),
    [date, entries]
  );

  const customFromEntries = useMemo(() => {
    const list: { key: string; label: string }[] = [];
    entries
      .filter((e) => e.date === date && e.sectionKey?.startsWith('custom-'))
      .forEach((e) => {
        if (e.sectionKey && e.sectionLabel && !list.some((c) => c.key === e.sectionKey)) {
          list.push({ key: e.sectionKey, label: e.sectionLabel });
        }
      });
    return list;
  }, [date, entries]);

  const allSections = useMemo(() => {
    const seen = new Set<string>();
    const list: { key: string; label: string }[] = [];
    GRATITUDE_DEFAULT_SECTIONS.forEach((s) => {
      seen.add(s.key);
      list.push(s);
    });
    customFromEntries.forEach((c) => {
      if (!seen.has(c.key)) {
        seen.add(c.key);
        list.push(c);
      }
    });
    addedCustomKeys.forEach((c) => {
      if (!seen.has(c.key)) {
        seen.add(c.key);
        list.push(c);
      }
    });
    return list;
  }, [customFromEntries, addedCustomKeys]);

  const getContent = (sectionKey: string): string => {
    if (localContent[sectionKey] !== undefined) return localContent[sectionKey];
    const saved = bySection.get(sectionKey);
    return saved?.content ?? '';
  };

  const persistSection = useCallback(
    async (sectionKey: string, sectionLabel: string | null, content: string) => {
      setSavingSection(sectionKey);
      try {
        await onSaveSection(date, sectionKey, sectionLabel, content);
      } finally {
        setSavingSection((current) => (current === sectionKey ? null : current));
      }
    },
    [date, onSaveSection],
  );

  const handleBlur = (sectionKey: string, sectionLabel: string | null, content: string) => {
    const trimmed = content.trim();
    const saved = (bySection.get(sectionKey)?.content ?? '').trim();
    if (trimmed === saved) {
      setLocalContent((prev) => {
        if (prev[sectionKey] === undefined) return prev;
        const next = { ...prev };
        delete next[sectionKey];
        return next;
      });
      return;
    }
    void persistSection(sectionKey, sectionLabel, trimmed);
  };

  const handleChange = (sectionKey: string, value: string) => {
    setLocalContent((prev) => ({ ...prev, [sectionKey]: value }));
  };

  const handleAddCustom = () => {
    const label = newSectionName.trim();
    if (!label) return;
    const key = `custom-${crypto.randomUUID()}`;
    setAddedCustomKeys((prev) => [...prev, { key, label }]);
    setNewSectionName('');
    setShowAddSection(false);
    onAddCustomSection?.(date, label);
  };

  const borderClass = useLandingStyles
    ? 'border-[var(--landing-border)]'
    : 'border-gray-200';
  const bgClass = useLandingStyles
    ? 'bg-gray-100'
    : 'bg-gray-50';
  const textClass = useLandingStyles
    ? 'text-[var(--landing-text)]'
    : 'text-gray-900';
  const primaryClass = useLandingStyles
    ? 'text-[var(--landing-primary)]'
    : 'text-green-600';

  return (
    <Card
      className={`shadow-lg feature-card-shadow overflow-hidden min-w-0 ${borderClass}`}
      style={useLandingStyles ? { borderColor: 'var(--landing-border)', backgroundColor: 'white' } : undefined}
    >
      <CardContent className={`p-4 sm:p-6 min-w-0 ${compact ? 'space-y-4' : 'space-y-6'}`}>
        <div className="flex items-center gap-3 mb-4">
          <Heart
            className={`${compact ? 'h-6 w-6' : 'h-7 w-7'} shrink-0`}
            style={useLandingStyles ? { color: 'var(--landing-primary)' } : undefined}
          />
          <h3
            className={`font-semibold ${compact ? 'text-xl' : 'text-2xl'} ${textClass}`}
          >
            Appreciate
          </h3>
        </div>
        <p className={`text-sm opacity-90 mb-1 ${textClass}`}>
          Write in each of the 7 categories. Add custom sections if you want. Click outside a field to save.
        </p>
        <p className={`text-xs opacity-75 mb-4 ${textClass}`}>
          Showing: {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          {savingSection ? ' · Saving…' : ''}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0">
          {allSections.map(({ key, label }) => (
            <div
              key={key}
              className={`rounded-xl border p-3 sm:p-4 min-w-0 ${borderClass} ${bgClass}`}
              style={useLandingStyles ? { backgroundColor: '#f3f4f6', borderColor: 'var(--landing-border)' } : undefined}
            >
              <label
                className={`block text-sm font-semibold mb-2 ${primaryClass}`}
              >
                {label}
              </label>
              <Textarea
                placeholder="Write here..."
                value={getContent(key)}
                onChange={(e) => handleChange(key, e.target.value)}
                onBlur={(e) =>
                  handleBlur(
                    key,
                    key.startsWith('custom-') ? label : null,
                    e.target.value
                  )
                }
                rows={compact ? 2 : 3}
                className={`resize-none min-w-0 w-full text-sm rounded-lg ${borderClass}`}
                style={useLandingStyles ? { borderColor: 'var(--landing-border)', backgroundColor: '#f9fafb' } : undefined}
              />
              {key.startsWith('custom-') && onRemoveCustomSection && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-red-600 hover:text-red-700"
                  onClick={() => {
                    onRemoveCustomSection(date, key);
                    setAddedCustomKeys((prev) => prev.filter((c) => c.key !== key));
                  }}
                >
                  Remove section
                </Button>
              )}
            </div>
          ))}
        </div>

        {onAddCustomSection && (
          <div className="pt-2">
            {!showAddSection ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                style={useLandingStyles ? { borderColor: 'var(--landing-primary)', color: 'var(--landing-primary)' } : undefined}
                onClick={() => setShowAddSection(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add another section
              </Button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  placeholder="Section name"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  className="max-w-[200px] rounded-xl"
                  style={useLandingStyles ? { borderColor: 'var(--landing-border)' } : undefined}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                />
                <Button
                  type="button"
                  size="sm"
                  className="rounded-xl hero-cta-primary"
                  onClick={handleAddCustom}
                  disabled={!newSectionName.trim()}
                >
                  Add
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddSection(false);
                    setNewSectionName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

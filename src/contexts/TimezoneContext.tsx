import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getBrowserTimezone,
  getTodayISO,
  fetchTimezoneFromIP,
  parseDateOnlyInTimezone,
  toISODateInTimezone,
} from '@/lib/timezoneUtils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

type TimezoneContextType = {
  /** IANA timezone (e.g. "America/New_York") from IP or browser */
  timezone: string;
  /** Today's date as YYYY-MM-DD in user's timezone */
  todayISO: string;
  /** Tomorrow's date as YYYY-MM-DD in user's timezone */
  tomorrowISO: string;
  /** Parse YYYY-MM-DD as Date in user timezone (noon that day) */
  parseDateOnly: (iso: string) => Date;
  /** Format Date to YYYY-MM-DD in user timezone */
  toISODate: (d: Date) => string;
};

const defaultTimezone = getBrowserTimezone();

const TimezoneContext = createContext<TimezoneContextType>({
  timezone: defaultTimezone,
  todayISO: getTodayISO(defaultTimezone),
  tomorrowISO: (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return getTodayISO(defaultTimezone);
  })(),
  parseDateOnly: (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y!, (m ?? 1) - 1, d ?? 1);
  },
  toISODate: (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },
});

export const useTimezone = () => useContext(TimezoneContext);

export const TimezoneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tzFromIP, setTzFromIP] = useState<string | null>(null);
  const [tzFromProfile, setTzFromProfile] = useState<string | null>(null);

  const timezone = tzFromProfile ?? tzFromIP ?? getBrowserTimezone();

  useEffect(() => {
    fetchTimezoneFromIP().then(setTzFromIP);
  }, []);

  useEffect(() => {
    if (!user) {
      setTzFromProfile(null);
      return;
    }
    let cancelled = false;
    supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error && error.code !== 'PGRST116') {
          // ignore errors here; fall back to IP/browser
          setTzFromProfile(null);
          return;
        }
        if (data?.timezone) {
          setTzFromProfile(data.timezone);
        } else {
          setTzFromProfile(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const todayISO = getTodayISO(timezone);
  const tomorrowISO = (() => {
    const [y, m, d] = todayISO.split('-').map(Number);
    const next = new Date(y!, (m ?? 1) - 1, (d ?? 1) + 1);
    return toISODateInTimezone(next, timezone);
  })();

  const value: TimezoneContextType = {
    timezone,
    todayISO,
    tomorrowISO,
    parseDateOnly: (iso: string) => parseDateOnlyInTimezone(iso, timezone),
    toISODate: (d: Date) => toISODateInTimezone(d, timezone),
  };

  return (
    <TimezoneContext.Provider value={value}>
      {children}
    </TimezoneContext.Provider>
  );
};

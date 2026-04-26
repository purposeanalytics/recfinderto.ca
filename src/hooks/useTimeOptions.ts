import { useMemo, useEffect } from 'react';
import { formatTimeToAMPM } from '../utils/dateTimeUtils';

export const useTimeOptions = (
  filters: any,
  onFiltersChange: (filters: any) => void,
  allDropIns: Array<{ "Start Hour": number; "Start Minute": number; "End Hour": number; "End Min": number; "Date Range": string }> = []
) => {
  // Compute the time range from the activities available on the selected date.
  // Falls back to the full dataset range for "This week" or when no activities match.
  // Floor each boundary to the nearest 30-minute slot.
  const dataTimeRange = useMemo(() => {
    if (!allDropIns.length) {
      return { minSlotMinutes: 6 * 60, maxSlotMinutes: 22 * 60 }; // fallback
    }

    let relevantDropIns = allDropIns;

    if (filters.date && filters.date !== 'this-week') {
      let targetDate: string;
      if (filters.date === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        targetDate = `${tomorrow.getFullYear()}-${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}-${tomorrow.getDate().toString().padStart(2, '0')}`;
      } else {
        targetDate = filters.date;
      }

      const filtered = allDropIns.filter(d => {
        const parts = (d["Date Range"] || '').split(' to ');
        return parts.length === 2 && targetDate >= parts[0] && targetDate <= parts[1];
      });

      if (filtered.length) relevantDropIns = filtered;
    }

    let minStart = Infinity;
    let maxEnd = -Infinity;

    relevantDropIns.forEach(d => {
      minStart = Math.min(minStart, d["Start Hour"] * 60 + d["Start Minute"]);
      maxEnd   = Math.max(maxEnd,   d["End Hour"]   * 60 + d["End Min"]);
    });

    return {
      minSlotMinutes: Math.floor(minStart / 30) * 30,
      // Subtract 1 before flooring so the max slot is strictly less than maxEnd,
      // matching the search filter condition (startTime <= target < endTime).
      maxSlotMinutes: Math.floor((maxEnd - 1) / 30) * 30,
    };
  }, [allDropIns, filters.date]);

  const generateTimeOptions = () => {
    const times = [];
    const now = new Date();
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    // Only filter out past times when the selected date is today.
    const today = new Date();
    const todayString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    const isToday = filters.date === todayString;

    for (let slot = dataTimeRange.minSlotMinutes; slot <= dataTimeRange.maxSlotMinutes; slot += 30) {
      if (isToday && slot <= currentTotalMinutes) continue;

      const hour   = Math.floor(slot / 60);
      const minute = slot % 60;
      times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }

    return ['Any time', ...times];
  };

  const timeOptions = useMemo(
    () => generateTimeOptions(),
    [filters.date, dataTimeRange]
  );

  // Auto-update time if it becomes invalid (e.g. a past time when date changes to today).
  useEffect(() => {
    if (timeOptions.length > 0 && !timeOptions.includes(filters.time) && filters.time !== 'Any time') {
      onFiltersChange({ ...filters, time: timeOptions[0] });
    }
  }, [timeOptions, filters.time, filters, onFiltersChange]);

  // Generate day options for the next 7 days (to match "This Week" logic).
  const generateDayOptions = () => {
    const days = [];
    const today = new Date();

    days.push({ label: 'This week', value: 'this-week' });

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const month   = date.toLocaleDateString('en-US', { month: 'short' });
      const day     = date.getDate();

      let label: string;
      let value: string;

      if (i === 0) {
        label = 'Today';
        value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      } else if (i === 1) {
        label = 'Tomorrow';
        value = 'tomorrow';
      } else {
        label = `${dayName}, ${month} ${day}`;
        value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      }

      days.push({ label, value });
    }

    return days;
  };

  const dayOptions = generateDayOptions();

  return {
    timeOptions,
    dayOptions,
    formatTimeToAMPM
  };
};

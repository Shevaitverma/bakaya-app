"use client";

import { useState, useCallback, useEffect } from "react";
import styles from "./DateRangePicker.module.css";

type Preset =
  | "this_month"
  | "last_month"
  | "last_3_months"
  | "this_year"
  | "all_time"
  | "custom";

interface DateRange {
  startDate: string | undefined;
  endDate: string | undefined;
}

interface DateRangePickerProps {
  onChange: (startDate: string | undefined, endDate: string | undefined) => void;
  /** Which preset to select initially. Defaults to "this_month". */
  defaultPreset?: Preset;
}

/** Format a Date as YYYY-MM-DD for <input type="date"> and API params. */
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function computeRange(preset: Preset): DateRange {
  const today = new Date();

  switch (preset) {
    case "this_month": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: toISODate(start), endDate: toISODate(today) };
    }
    case "last_month": {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0); // last day of prev month
      return { startDate: toISODate(start), endDate: toISODate(end) };
    }
    case "last_3_months": {
      const start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      return { startDate: toISODate(start), endDate: toISODate(today) };
    }
    case "this_year": {
      const start = new Date(today.getFullYear(), 0, 1);
      return { startDate: toISODate(start), endDate: toISODate(today) };
    }
    case "all_time":
      return { startDate: undefined, endDate: undefined };
    case "custom":
      // Don't compute anything for custom; keep current inputs
      return { startDate: undefined, endDate: undefined };
    default:
      return { startDate: undefined, endDate: undefined };
  }
}

const PRESETS: { key: Preset; label: string }[] = [
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "last_3_months", label: "Last 3 Months" },
  { key: "this_year", label: "This Year" },
  { key: "all_time", label: "All Time" },
  { key: "custom", label: "Custom" },
];

export default function DateRangePicker({
  onChange,
  defaultPreset = "this_month",
}: DateRangePickerProps) {
  const [activePreset, setActivePreset] = useState<Preset>(defaultPreset);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Fire the initial onChange on mount with the default preset range
  const initialFired = useCallback(() => {
    const range = computeRange(defaultPreset);
    onChange(range.startDate, range.endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — only fire once

  useEffect(() => {
    initialFired();
  }, [initialFired]);

  const handlePresetClick = (preset: Preset) => {
    setActivePreset(preset);

    if (preset === "custom") {
      // When switching to custom, emit whatever custom dates are set (may be empty)
      onChange(customStart || undefined, customEnd || undefined);
      return;
    }

    const range = computeRange(preset);
    onChange(range.startDate, range.endDate);
  };

  const handleCustomStartChange = (value: string) => {
    setCustomStart(value);
    onChange(value || undefined, customEnd || undefined);
  };

  const handleCustomEndChange = (value: string) => {
    setCustomEnd(value);
    onChange(customStart || undefined, value || undefined);
  };

  return (
    <div className={styles.wrapper}>
      {/* Preset buttons */}
      <div className={styles.presetsRow}>
        {PRESETS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`${styles.presetBtn} ${
              activePreset === key ? styles.presetBtnActive : ""
            }`}
            onClick={() => handlePresetClick(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Custom date inputs (only visible when "Custom" is selected) */}
      {activePreset === "custom" && (
        <div className={styles.customRow}>
          <label className={styles.dateLabel} htmlFor="drp-start">
            From
          </label>
          <input
            id="drp-start"
            type="date"
            className={styles.dateInput}
            value={customStart}
            max={customEnd || undefined}
            onChange={(e) => handleCustomStartChange(e.target.value)}
          />
          <span className={styles.dateSeparator}>-</span>
          <label className={styles.dateLabel} htmlFor="drp-end">
            To
          </label>
          <input
            id="drp-end"
            type="date"
            className={styles.dateInput}
            value={customEnd}
            min={customStart || undefined}
            onChange={(e) => handleCustomEndChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

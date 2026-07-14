import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Platform,
  type ViewStyle,
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Theme } from '../constants/theme';
import { istToday, istTodayParts, istMonthStart, istMonthEnd } from '../utils/istDate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Preset =
  | 'this_month'
  | 'last_month'
  | 'last_3_months'
  | 'this_year'
  | 'all_time'
  | 'custom';

interface DateRange {
  startDate: string | undefined;
  endDate: string | undefined;
}

export interface DateRangePickerProps {
  onChange: (startDate?: string, endDate?: string) => void;
  /** Which preset to select initially. Defaults to "this_month". */
  defaultPreset?: Preset;
  /** Extra styles applied to the trigger button wrapper. */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeRange(preset: Preset): DateRange {
  switch (preset) {
    case 'this_month':
      return { startDate: istMonthStart(), endDate: istToday() };
    case 'last_month':
      return { startDate: istMonthStart(1), endDate: istMonthEnd(1) };
    case 'last_3_months':
      return { startDate: istMonthStart(2), endDate: istToday() };
    case 'this_year':
      return { startDate: `${istTodayParts().y}-01-01`, endDate: istToday() };
    case 'all_time':
      return { startDate: undefined, endDate: undefined };
    case 'custom':
      // Don't compute anything for custom; keep current inputs
      return { startDate: undefined, endDate: undefined };
    default:
      return { startDate: undefined, endDate: undefined };
  }
}

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'last_3_months', label: 'Last 3 Months' },
  { key: 'this_year', label: 'This Year' },
  { key: 'all_time', label: 'All Time' },
  { key: 'custom', label: 'Custom' },
];

/** Human-readable label for the currently active preset. */
function presetLabel(preset: Preset): string {
  return PRESETS.find((p) => p.key === preset)?.label ?? 'Custom';
}

/** True for a complete, real YYYY-MM-DD date (rejects e.g. 2026-13-99). */
function isValidDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DateRangePicker({
  onChange,
  defaultPreset = 'this_month',
  style,
}: DateRangePickerProps) {
  const [visible, setVisible] = useState(false);
  const [activePreset, setActivePreset] = useState<Preset>(defaultPreset);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);

  // NOTE: No useEffect that fires onChange on mount. The parent screen is
  // responsible for its own initial data fetch. This component only fires
  // onChange when the user actively selects a preset or applies custom dates.

  // --------------------------------------------------
  // Handlers
  // --------------------------------------------------

  const handlePresetPress = (preset: Preset) => {
    setActivePreset(preset);
    setCustomError(null);

    if (preset === 'custom') {
      return;
    }

    const range = computeRange(preset);
    onChange(range.startDate, range.endDate);
  };

  const handleCustomStartChange = (value: string) => {
    setCustomStart(value);
    setCustomError(null);
  };

  const handleCustomEndChange = (value: string) => {
    setCustomEnd(value);
    setCustomError(null);
  };

  const handleApply = () => {
    if (activePreset === 'custom') {
      if (!isValidDate(customStart) || !isValidDate(customEnd)) {
        setCustomError('Enter valid dates as YYYY-MM-DD');
        return;
      }
      if (customStart > customEnd) {
        setCustomError('Start date must be on or before end date');
        return;
      }
      onChange(customStart, customEnd);
    } else {
      const range = computeRange(activePreset);
      onChange(range.startDate, range.endDate);
    }
    setVisible(false);
  };

  const handleClose = () => {
    setVisible(false);
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <>
      {/* Trigger button */}
      <TouchableOpacity
        style={[styles.trigger, style]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <FontAwesome6
          name="calendar"
          size={14}
          color={Theme.colors.primary}
          solid
        />
        <Text style={styles.triggerText} numberOfLines={1}>
          {presetLabel(activePreset)}
        </Text>
        <FontAwesome6
          name="chevron-down"
          size={10}
          color={Theme.colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={styles.backdrop}>
          <View style={styles.card}>
            {/* Title */}
            <Text style={styles.cardTitle}>Select Date Range</Text>

            {/* Preset chips */}
            <View style={styles.presetsRow}>
              {PRESETS.map(({ key, label }) => {
                const isActive = activePreset === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.presetChip,
                      isActive && styles.presetChipActive,
                    ]}
                    onPress={() => handlePresetPress(key)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        isActive && styles.presetChipTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom date inputs */}
            {activePreset === 'custom' && (
              <View style={styles.customRow}>
                <View style={styles.customField}>
                  <Text style={styles.customLabel}>From</Text>
                  <TextInput
                    style={styles.customInput}
                    value={customStart}
                    onChangeText={handleCustomStartChange}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Theme.colors.textTertiary}
                    keyboardType={Platform.select({
                      ios: 'numbers-and-punctuation',
                      default: 'default',
                    })}
                    maxLength={10}
                  />
                </View>
                <Text style={styles.customSeparator}>-</Text>
                <View style={styles.customField}>
                  <Text style={styles.customLabel}>To</Text>
                  <TextInput
                    style={styles.customInput}
                    value={customEnd}
                    onChangeText={handleCustomEndChange}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Theme.colors.textTertiary}
                    keyboardType={Platform.select({
                      ios: 'numbers-and-punctuation',
                      default: 'default',
                    })}
                    maxLength={10}
                  />
                </View>
              </View>
            )}

            {activePreset === 'custom' && customError && (
              <Text style={styles.errorText}>{customError}</Text>
            )}

            {/* Action buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApply}
                activeOpacity={0.85}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // --- Trigger button ---
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.cardBackground,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.round,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    gap: Theme.spacing.xs,
    ...Theme.shadows.small,
  },
  triggerText: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
    maxWidth: 120,
  },

  // --- Modal backdrop ---
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },

  // --- Card ---
  card: {
    width: '100%',
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.lg,
    ...Theme.shadows.large,
  },
  cardTitle: {
    fontSize: Theme.typography.fontSize.xlarge,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    marginBottom: Theme.spacing.md,
    letterSpacing: -0.3,
  },

  // --- Preset chips ---
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  presetChip: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: Theme.colors.lightGrey,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  presetChipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  presetChipText: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
  },
  presetChipTextActive: {
    color: Theme.colors.white,
    fontWeight: Theme.typography.fontWeight.semibold,
  },

  // --- Custom date inputs ---
  customRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  customField: {
    flex: 1,
  },
  customLabel: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
    marginBottom: Theme.spacing.xs,
  },
  customInput: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    backgroundColor: Theme.colors.surface,
  },
  errorText: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.error,
    fontFamily: Theme.typography.fontFamily,
    marginBottom: Theme.spacing.md,
  },
  customSeparator: {
    fontSize: Theme.typography.fontSize.large,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily,
    paddingBottom: Theme.spacing.sm,
  },

  // --- Action buttons ---
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.sm,
  },
  closeButton: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm + 2,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    backgroundColor: Theme.colors.white,
  },
  closeButtonText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
  },
  applyButton: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm + 2,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.primary,
  },
  applyButtonText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.white,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
  },
});

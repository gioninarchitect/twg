/**
 * Notification Settings Component
 *
 * Allows users to enable/disable daily reminders and set reminder time.
 * Anti-Shame: All messaging is gentle and invitational.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme/colors';
import { useNotifications } from '../context/NotificationContext';

interface Props {
  compact?: boolean;
}

export default function NotificationSettings({ compact = false }: Props) {
  const {
    enabled,
    reminderTime,
    permissionGranted,
    setNotificationsEnabled,
    setReminderTime,
    requestPermissions,
    isLoading,
  } = useNotifications();

  const [showTimePicker, setShowTimePicker] = useState(false);

  async function handleToggle(value: boolean) {
    if (value && !permissionGranted) {
      const granted = await requestPermissions();
      if (!granted) {
        return;
      }
    }
    await setNotificationsEnabled(value);
  }

  function formatTime(hour: number, minute: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  }

  // Time options for picker (every 30 minutes from 5 AM to 10 PM)
  const timeOptions: Array<{ hour: number; minute: number }> = [];
  for (let hour = 5; hour <= 22; hour++) {
    timeOptions.push({ hour, minute: 0 });
    timeOptions.push({ hour, minute: 30 });
  }

  if (isLoading) {
    return null;
  }

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactRow}>
          <View style={styles.iconContainer}>
            <Feather name="bell" size={18} color={COLORS.dustyBlue} />
          </View>
          <Text style={styles.compactLabel}>Daily Reminders</Text>
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            trackColor={{ false: COLORS.warmBeige, true: COLORS.sageMuted }}
            thumbColor={enabled ? COLORS.sage : COLORS.mutedBrown}
          />
        </View>
        {enabled && (
          <TouchableOpacity
            style={styles.compactTimeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Feather name="clock" size={14} color={COLORS.mutedBrown} />
            <Text style={styles.compactTimeText}>
              {formatTime(reminderTime.hour, reminderTime.minute)}
            </Text>
          </TouchableOpacity>
        )}

        {/* Time Picker Modal */}
        <TimePickerModal
          visible={showTimePicker}
          onClose={() => setShowTimePicker(false)}
          currentTime={reminderTime}
          onSelectTime={async (hour, minute) => {
            await setReminderTime(hour, minute);
            setShowTimePicker(false);
          }}
          timeOptions={timeOptions}
          formatTime={formatTime}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Feather name="bell" size={20} color={COLORS.dustyBlue} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Gentle Reminders</Text>
          <Text style={styles.subtitle}>A warm invitation each morning</Text>
        </View>
      </View>

      <View style={styles.settingRow}>
        <View>
          <Text style={styles.settingLabel}>Enable Daily Reminders</Text>
          <Text style={styles.settingHint}>
            {enabled ? 'You\'ll receive a gentle nudge' : 'Notifications are off'}
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={handleToggle}
          trackColor={{ false: COLORS.warmBeige, true: COLORS.sageMuted }}
          thumbColor={enabled ? COLORS.sage : COLORS.mutedBrown}
        />
      </View>

      {enabled && (
        <TouchableOpacity
          style={styles.timeRow}
          onPress={() => setShowTimePicker(true)}
        >
          <View>
            <Text style={styles.settingLabel}>Reminder Time</Text>
            <Text style={styles.settingHint}>When would you like your invitation?</Text>
          </View>
          <View style={styles.timeButton}>
            <Text style={styles.timeText}>
              {formatTime(reminderTime.hour, reminderTime.minute)}
            </Text>
            <Feather name="chevron-right" size={16} color={COLORS.mutedBrown} />
          </View>
        </TouchableOpacity>
      )}

      <Text style={styles.note}>
        These reminders are gentle invitations, never guilt-inducing.
        You can always turn them off.
      </Text>

      {/* Time Picker Modal */}
      <TimePickerModal
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        currentTime={reminderTime}
        onSelectTime={async (hour, minute) => {
          await setReminderTime(hour, minute);
          setShowTimePicker(false);
        }}
        timeOptions={timeOptions}
        formatTime={formatTime}
      />
    </View>
  );
}

// Simple time picker modal
function TimePickerModal({
  visible,
  onClose,
  currentTime,
  onSelectTime,
  timeOptions,
  formatTime,
}: {
  visible: boolean;
  onClose: () => void;
  currentTime: { hour: number; minute: number };
  onSelectTime: (hour: number, minute: number) => void;
  timeOptions: Array<{ hour: number; minute: number }>;
  formatTime: (hour: number, minute: number) => string;
}) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Time</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={COLORS.earth} />
            </TouchableOpacity>
          </View>
          <View style={styles.timeList}>
            {timeOptions.map((time, index) => {
              const isSelected =
                time.hour === currentTime.hour && time.minute === currentTime.minute;
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.timeOption, isSelected && styles.timeOptionSelected]}
                  onPress={() => onSelectTime(time.hour, time.minute)}
                >
                  <Text
                    style={[
                      styles.timeOptionText,
                      isSelected && styles.timeOptionTextSelected,
                    ]}
                  >
                    {formatTime(time.hour, time.minute)}
                  </Text>
                  {isSelected && (
                    <Feather name="check" size={16} color={COLORS.sage} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.soft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.dustyBlueMuted + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.warmBeige,
  },
  settingLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '500',
  },
  settingHint: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.warmBeige,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warmBeige,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  timeText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '500',
    marginRight: SPACING.xs,
  },
  note: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    marginTop: SPACING.lg,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Compact styles
  compactContainer: {
    backgroundColor: COLORS.warmBeige,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: SPACING.sm,
  },
  compactLabel: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '500',
  },
  compactTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.cream,
  },
  compactTimeText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: SPACING.xs,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(93, 78, 55, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.xl,
    width: '100%',
    maxWidth: 320,
    maxHeight: '70%',
    ...SHADOWS.strong,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.warmBeige,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  timeList: {
    padding: SPACING.md,
  },
  timeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  timeOptionSelected: {
    backgroundColor: COLORS.sageMuted + '30',
  },
  timeOptionText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
  timeOptionTextSelected: {
    color: COLORS.sage,
    fontWeight: '600',
  },
});

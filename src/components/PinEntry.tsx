/**
 * PIN Entry Component
 *
 * Reusable 4-digit PIN entry with numpad.
 * Used for setup, unlock, and verification.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme/colors';
import { safeHaptics, ImpactFeedbackStyle, NotificationFeedbackType } from '../utils/haptics';

interface PinEntryProps {
  title: string;
  subtitle?: string;
  onComplete: (pin: string) => void;
  onCancel?: () => void;
  showCancel?: boolean;
  error?: string;
  confirmMode?: boolean; // For setup - requires entering PIN twice
}

export default function PinEntry({
  title,
  subtitle,
  onComplete,
  onCancel,
  showCancel = false,
  error,
  confirmMode = false,
}: PinEntryProps) {
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const displayError = error || localError;

  // Reset on error change
  useEffect(() => {
    if (error) {
      triggerError();
    }
  }, [error]);

  function triggerError() {
    setShake(true);
    if (Platform.OS !== 'web') {
      Vibration.vibrate(100);
    }
    safeHaptics.notificationAsync(NotificationFeedbackType.Error);
    setTimeout(() => {
      setShake(false);
      setPin('');
    }, 300);
  }

  function handleNumberPress(num: string) {
    if (pin.length >= 4) return;

    safeHaptics.impactAsync(ImpactFeedbackStyle.Light);
    const newPin = pin + num;
    setPin(newPin);
    setLocalError(null);

    if (newPin.length === 4) {
      if (confirmMode) {
        if (firstPin === null) {
          // First entry - store and ask for confirmation
          setFirstPin(newPin);
          setPin('');
        } else {
          // Second entry - verify match
          if (newPin === firstPin) {
            safeHaptics.notificationAsync(NotificationFeedbackType.Success);
            onComplete(newPin);
          } else {
            setLocalError('PINs do not match. Try again.');
            setFirstPin(null);
            triggerError();
          }
        }
      } else {
        // Simple mode - just return the PIN
        onComplete(newPin);
      }
    }
  }

  function handleBackspace() {
    if (pin.length > 0) {
      safeHaptics.impactAsync(ImpactFeedbackStyle.Light);
      setPin(pin.slice(0, -1));
    }
  }

  function handleCancel() {
    if (onCancel) {
      onCancel();
    }
  }

  const currentTitle = confirmMode && firstPin !== null ? 'Confirm your PIN' : title;
  const currentSubtitle = confirmMode && firstPin !== null ? 'Enter the same PIN again' : subtitle;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{currentTitle}</Text>
        {currentSubtitle && <Text style={styles.subtitle}>{currentSubtitle}</Text>}
      </View>

      {/* PIN Dots */}
      <View style={[styles.dotsContainer, shake && styles.shake]}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              pin.length > i && styles.dotFilled,
              displayError && styles.dotError,
            ]}
          />
        ))}
      </View>

      {/* Error Message */}
      {displayError && (
        <Text style={styles.error}>{displayError}</Text>
      )}

      {/* Numpad */}
      <View style={styles.numpad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'].map((key, index) => {
          if (key === '') {
            return <View key={index} style={styles.numpadButton} />;
          }

          if (key === 'back') {
            return (
              <TouchableOpacity
                key={index}
                style={styles.numpadButton}
                onPress={handleBackspace}
                disabled={pin.length === 0}
              >
                <Feather
                  name="delete"
                  size={24}
                  color={pin.length === 0 ? COLORS.mutedBrown : COLORS.earth}
                />
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={index}
              style={styles.numpadButton}
              onPress={() => handleNumberPress(key)}
              activeOpacity={0.7}
            >
              <Text style={styles.numpadText}>{key}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Cancel Button */}
      {showCancel && onCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.cream,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.heading,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  shake: {
    // Simple shake effect
    transform: [{ translateX: 5 }],
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.warmBeige,
    borderWidth: 2,
    borderColor: COLORS.mutedBrown,
  },
  dotFilled: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  dotError: {
    backgroundColor: COLORS.mutedTerracotta,
    borderColor: COLORS.mutedTerracotta,
  },
  error: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedTerracotta,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 280,
    marginTop: SPACING.lg,
  },
  numpadButton: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    margin: SPACING.xs,
  },
  numpadText: {
    fontSize: 32,
    fontWeight: '300',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  cancelButton: {
    marginTop: SPACING.xl,
    padding: SPACING.md,
  },
  cancelText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
});

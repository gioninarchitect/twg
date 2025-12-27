/**
 * Journal Input Component
 *
 * PRD: Local-only journaling with optional encryption and voice input
 *
 * Features:
 * - Rich text input with auto-expanding
 * - Voice note recording (audio attached to entry)
 * - Optional encryption toggle
 * - Gentle, non-judgmental prompts
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme/colors';
import { useJournal } from '../context/JournalContext';
import AudioPlayer from './AudioPlayer';

interface Props {
  dayNumber: number;
  prompt?: string;
  onSave?: () => void;
  placeholder?: string;
}

export default function JournalInput({
  dayNumber,
  prompt,
  onSave,
  placeholder = 'Write your thoughts here...',
}: Props) {
  const {
    getEntryForDay,
    saveEntry,
    decryptContent,
    isEncryptionEnabled,
    setEncryptionEnabled,
  } = useJournal();

  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showEncryptionToggle, setShowEncryptionToggle] = useState(false);
  const [localEncrypt, setLocalEncrypt] = useState(isEncryptionEnabled);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voiceNoteUri, setVoiceNoteUri] = useState<string | undefined>();
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  // Animations
  const saveAnim = useRef(new Animated.Value(0)).current;
  const recordingAnim = useRef(new Animated.Value(1)).current;

  // Load existing entry
  useEffect(() => {
    async function loadEntry() {
      const entry = getEntryForDay(dayNumber);
      if (entry) {
        const decrypted = await decryptContent(entry);
        setContent(decrypted || '');
        setVoiceNoteUri(entry.voiceNoteUri);
      }
      setIsLoading(false);
    }
    loadEntry();
  }, [dayNumber]);

  // Sync encryption setting
  useEffect(() => {
    setLocalEncrypt(isEncryptionEnabled);
  }, [isEncryptionEnabled]);

  // Recording animation
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(recordingAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      recordingAnim.setValue(1);
    }
  }, [isRecording]);

  async function handleSave() {
    if (!content.trim() && !voiceNoteUri) return;

    setIsSaving(true);

    try {
      await saveEntry(dayNumber, content, {
        encrypt: localEncrypt,
        voiceNoteUri,
        prompt,
      });

      // Show save animation
      Animated.sequence([
        Animated.timing(saveAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
        Animated.timing(saveAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      onSave?.();
    } catch (error) {
      console.error('Error saving journal entry:', error);
    } finally {
      setIsSaving(false);
    }
  }

  async function startRecording() {
    try {
      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      // Update duration every second
      durationInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }

  async function stopRecording() {
    if (!recordingRef.current) return;

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const tempUri = recordingRef.current.getURI();

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      // Move recording to permanent storage
      if (tempUri) {
        const voiceNotesDir = `${FileSystem.documentDirectory}voice_notes/`;
        const dirInfo = await FileSystem.getInfoAsync(voiceNotesDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(voiceNotesDir, { intermediates: true });
        }

        const fileName = `voice_day${dayNumber}_${Date.now()}.m4a`;
        const permanentUri = `${voiceNotesDir}${fileName}`;

        await FileSystem.moveAsync({
          from: tempUri,
          to: permanentUri,
        });

        setVoiceNoteUri(permanentUri);
        console.log('Voice note saved to:', permanentUri);
      }
    } catch (error) {
      console.error('Error stopping/saving recording:', error);
    } finally {
      recordingRef.current = null;
      setIsRecording(false);
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    }
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  async function deleteVoiceNote() {
    if (voiceNoteUri) {
      try {
        await FileSystem.deleteAsync(voiceNoteUri, { idempotent: true });
      } catch (error) {
        console.log('Error deleting voice note file:', error);
      }
    }
    setVoiceNoteUri(undefined);
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.gold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Prompt */}
      {prompt && (
        <View style={styles.promptContainer}>
          <Feather name="edit-3" size={16} color={COLORS.dustyBlue} />
          <Text style={styles.promptText}>{prompt}</Text>
        </View>
      )}

      {/* Text Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={content}
          onChangeText={setContent}
          placeholder={placeholder}
          placeholderTextColor={COLORS.mutedBrown}
          multiline
          textAlignVertical="top"
          scrollEnabled={false}
        />
      </View>

      {/* Voice Note Section */}
      <View style={styles.voiceSection}>
        {voiceNoteUri && !isRecording ? (
          <View style={styles.voiceNotePlayer}>
            <AudioPlayer
              uri={voiceNoteUri}
              title="Your Voice Note"
              variant="compact"
            />
            <TouchableOpacity style={styles.deleteVoiceButton} onPress={deleteVoiceNote}>
              <Feather name="trash-2" size={16} color={COLORS.mutedTerracotta} />
            </TouchableOpacity>
          </View>
        ) : isRecording ? (
          <View style={styles.recordingContainer}>
            <Animated.View
              style={[
                styles.recordingIndicator,
                { transform: [{ scale: recordingAnim }] },
              ]}
            >
              <View style={styles.recordingDot} />
            </Animated.View>
            <Text style={styles.recordingText}>
              Recording... {formatDuration(recordingDuration)}
            </Text>
            <TouchableOpacity
              style={styles.stopButton}
              onPress={stopRecording}
            >
              <Feather name="square" size={16} color={COLORS.cream} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.recordButton}
            onPress={startRecording}
          >
            <Feather name="mic" size={18} color={COLORS.dustyBlue} />
            <Text style={styles.recordButtonText}>Add voice note</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Footer with encryption toggle and save */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.encryptToggle}
          onPress={() => setShowEncryptionToggle(!showEncryptionToggle)}
        >
          <Feather
            name={localEncrypt ? 'lock' : 'unlock'}
            size={16}
            color={localEncrypt ? COLORS.sage : COLORS.mutedBrown}
          />
          <Text style={[
            styles.encryptToggleText,
            localEncrypt && styles.encryptToggleTextActive
          ]}>
            {localEncrypt ? 'Encrypted' : 'Private'}
          </Text>
        </TouchableOpacity>

        {showEncryptionToggle && (
          <View style={styles.encryptionOptions}>
            <TouchableOpacity
              style={[styles.encryptOption, !localEncrypt && styles.encryptOptionSelected]}
              onPress={() => {
                setLocalEncrypt(false);
                setEncryptionEnabled(false);
                setShowEncryptionToggle(false);
              }}
            >
              <Feather name="unlock" size={14} color={!localEncrypt ? COLORS.cream : COLORS.mutedBrown} />
              <Text style={[styles.encryptOptionText, !localEncrypt && styles.encryptOptionTextSelected]}>
                Private
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.encryptOption, localEncrypt && styles.encryptOptionSelected]}
              onPress={() => {
                setLocalEncrypt(true);
                setEncryptionEnabled(true);
                setShowEncryptionToggle(false);
              }}
            >
              <Feather name="lock" size={14} color={localEncrypt ? COLORS.cream : COLORS.mutedBrown} />
              <Text style={[styles.encryptOptionText, localEncrypt && styles.encryptOptionTextSelected]}>
                Encrypted
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, (!content.trim() && !voiceNoteUri) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!content.trim() && !voiceNoteUri || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={COLORS.cream} />
          ) : (
            <>
              <Feather name="save" size={16} color={COLORS.cream} />
              <Text style={styles.saveButtonText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Save confirmation */}
      <Animated.View
        style={[
          styles.savedIndicator,
          {
            opacity: saveAnim,
            transform: [{
              translateY: saveAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            }],
          },
        ]}
      >
        <Feather name="check-circle" size={16} color={COLORS.sage} />
        <Text style={styles.savedText}>Entry saved</Text>
      </Animated.View>

      {/* Encryption info */}
      <Text style={styles.encryptionNote}>
        {localEncrypt
          ? 'Your entry will be encrypted on this device only.'
          : 'Your entry is private and stored only on this device.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.soft,
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  promptContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.dustyBlueMuted + '20',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  promptText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.dustyBlue,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    marginLeft: SPACING.sm,
    lineHeight: 22,
  },
  inputContainer: {
    backgroundColor: COLORS.warmBeige,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  input: {
    minHeight: 150,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    lineHeight: 24,
  },
  voiceSection: {
    marginBottom: SPACING.md,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  recordButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.dustyBlue,
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: SPACING.xs,
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.mutedTerracotta + '20',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  recordingIndicator: {
    marginRight: SPACING.sm,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.mutedTerracotta,
  },
  recordingText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.mutedTerracotta,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '500',
  },
  stopButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.mutedTerracotta,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceNoteIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.sageMuted + '30',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  voiceNoteText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.sage,
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: SPACING.sm,
  },
  voiceNotePlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  deleteVoiceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.mutedTerracotta + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  encryptToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  encryptToggleText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: SPACING.xs,
  },
  encryptToggleTextActive: {
    color: COLORS.sage,
  },
  encryptionOptions: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    flexDirection: 'row',
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.md,
    ...SHADOWS.medium,
    padding: SPACING.xs,
  },
  encryptOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginHorizontal: SPACING.xs,
  },
  encryptOptionSelected: {
    backgroundColor: COLORS.sage,
  },
  encryptOptionText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: SPACING.xs,
  },
  encryptOptionTextSelected: {
    color: COLORS.cream,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.sage,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.mutedBrown,
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.cream,
    fontFamily: TYPOGRAPHY.ui,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  savedIndicator: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.sageMuted + '40',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  savedText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.sage,
    fontFamily: TYPOGRAPHY.ui,
    marginLeft: SPACING.xs,
  },
  encryptionNote: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
    marginTop: SPACING.md,
    fontStyle: 'italic',
  },
});

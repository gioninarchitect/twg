/**
 * Audio Player - Sanctuary Sound Experience
 * Premium audio player for daily healing music
 * Web-compatible with HTML5 Audio fallback
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS, GRADIENTS } from '../theme/colors';

const isWeb = Platform.OS === 'web';

interface AudioPlayerProps {
  uri: string;
  title: string;
  subtitle?: string;
  dayNumber?: number;
  onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
  autoPlay?: boolean;
  variant?: 'full' | 'compact' | 'minimal';
}

export default function AudioPlayer({
  uri,
  title,
  subtitle,
  dayNumber,
  onPlaybackStatusUpdate,
  autoPlay = false,
  variant = 'full',
}: AudioPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Web audio ref
  const webAudioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isWeb && webAudioRef.current) {
        webAudioRef.current.pause();
        webAudioRef.current = null;
      } else if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Pulse animation when playing
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isPlaying]);

  async function loadAudio() {
    if (isLoaded) return;

    setIsLoading(true);
    try {
      if (isWeb) {
        // Use HTML5 Audio for web
        const audio = new window.Audio(uri);
        webAudioRef.current = audio;

        audio.addEventListener('loadedmetadata', () => {
          setDuration(audio.duration * 1000);
          setIsLoaded(true);
          setIsLoading(false);
        });

        audio.addEventListener('timeupdate', () => {
          setPosition(audio.currentTime * 1000);
          const progress = audio.duration ? audio.currentTime / audio.duration : 0;
          Animated.timing(progressAnim, {
            toValue: progress,
            duration: 100,
            useNativeDriver: false,
          }).start();
        });

        audio.addEventListener('ended', () => {
          setIsPlaying(false);
          setPosition(0);
        });

        audio.addEventListener('error', (e) => {
          console.error('Web audio error:', e);
          setIsLoading(false);
        });

        audio.load();
        if (autoPlay) {
          audio.play();
          setIsPlaying(true);
        }
      } else {
        // Use expo-av for native
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: autoPlay },
          onStatusUpdate
        );

        setSound(newSound);
        setIsLoaded(true);
        if (autoPlay) setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error loading audio:', error);
    } finally {
      if (!isWeb) setIsLoading(false);
    }
  }

  function onStatusUpdate(status: AVPlaybackStatus) {
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
      setIsPlaying(status.isPlaying);

      // Animate progress bar
      const progress = status.durationMillis
        ? status.positionMillis / status.durationMillis
        : 0;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 100,
        useNativeDriver: false,
      }).start();

      // Handle playback finished
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
    }

    if (onPlaybackStatusUpdate) {
      onPlaybackStatusUpdate(status);
    }
  }

  async function togglePlayPause() {
    if (!isLoaded) {
      await loadAudio();
      // For web, start playing after load
      if (isWeb && webAudioRef.current) {
        webAudioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    if (isWeb && webAudioRef.current) {
      if (isPlaying) {
        webAudioRef.current.pause();
        setIsPlaying(false);
      } else {
        webAudioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    if (!sound) return;

    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  }

  async function seekTo(percentage: number) {
    if (!duration) return;
    const newPosition = percentage * duration;

    if (isWeb && webAudioRef.current) {
      webAudioRef.current.currentTime = newPosition / 1000;
      return;
    }

    if (!sound) return;
    await sound.setPositionAsync(newPosition);
  }

  function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (variant === 'minimal') {
    return (
      <TouchableOpacity
        style={styles.minimalContainer}
        onPress={togglePlayPause}
        activeOpacity={0.8}
      >
        <View style={styles.minimalPlayButton}>
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.gold} />
          ) : (
            <Feather
              name={isPlaying ? 'pause' : 'play'}
              size={16}
              color={COLORS.gold}
            />
          )}
        </View>
        <Text style={styles.minimalTitle} numberOfLines={1}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'compact') {
    return (
      <View style={styles.compactContainer}>
        <TouchableOpacity
          style={styles.compactPlayButton}
          onPress={togglePlayPause}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.cream} />
          ) : (
            <Feather
              name={isPlaying ? 'pause' : 'play'}
              size={20}
              color={COLORS.cream}
            />
          )}
        </TouchableOpacity>

        <View style={styles.compactInfo}>
          <Text style={styles.compactTitle} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={styles.compactSubtitle} numberOfLines={1}>{subtitle}</Text>}
          <View style={styles.compactProgress}>
            <View style={styles.compactProgressTrack}>
              <Animated.View
                style={[styles.compactProgressFill, { width: progressWidth }]}
              />
            </View>
            <Text style={styles.compactTime}>
              {formatTime(position)} / {formatTime(duration)}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Full variant (default)
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#EDE5D8', '#FAF8F5']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          {dayNumber && (
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>Day {dayNumber}</Text>
            </View>
          )}
          <View style={styles.soundWaveIcon}>
            <Feather name="music" size={16} color={COLORS.gold} />
          </View>
        </View>

        {/* Album Art / Visualization */}
        <View style={styles.visualizationContainer}>
          <Animated.View
            style={[
              styles.visualizationCircle,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <LinearGradient
              colors={GRADIENTS.gold.colors as [string, string, ...string[]]}
              style={styles.visualizationGradient}
            >
              <TouchableOpacity
                style={styles.playButtonLarge}
                onPress={togglePlayPause}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator size="large" color={COLORS.earth} />
                ) : (
                  <Feather
                    name={isPlaying ? 'pause' : 'play'}
                    size={32}
                    color={COLORS.earth}
                  />
                )}
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Track Info */}
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle}>{title}</Text>
          {subtitle && <Text style={styles.trackSubtitle}>{subtitle}</Text>}
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <TouchableOpacity
            style={styles.progressTrack}
            activeOpacity={0.9}
            onPress={(e) => {
              const { locationX } = e.nativeEvent;
              const width = 300; // Approximate width
              seekTo(locationX / width);
            }}
          >
            <View style={styles.progressBackground} />
            <Animated.View style={[styles.progressFill, { width: progressWidth }]}>
              <LinearGradient
                colors={[COLORS.gold, COLORS.goldDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressGradient}
              />
            </Animated.View>
            <View style={[styles.progressKnob, { left: `${(position / duration) * 100 || 0}%` }]} />
          </TouchableOpacity>

          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => seekTo(Math.max(0, (position - 15000) / duration))}
          >
            <Feather name="rotate-ccw" size={20} color={COLORS.richBrown} />
            <Text style={styles.controlLabel}>15s</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mainControlButton}
            onPress={togglePlayPause}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={GRADIENTS.gold.colors as [string, string, ...string[]]}
              style={styles.mainControlGradient}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.earth} />
              ) : (
                <Feather
                  name={isPlaying ? 'pause' : 'play'}
                  size={24}
                  color={COLORS.earth}
                />
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => seekTo(Math.min(1, (position + 15000) / duration))}
          >
            <Feather name="rotate-cw" size={20} color={COLORS.richBrown} />
            <Text style={styles.controlLabel}>15s</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  // Full variant styles
  container: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  gradient: {
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  dayBadge: {
    backgroundColor: COLORS.earth + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  dayBadgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  soundWaveIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.goldLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visualizationContainer: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  visualizationCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    ...SHADOWS.glow,
  },
  visualizationGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.cream,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  trackTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
    textAlign: 'center',
  },
  trackSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.devotional,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
  progressContainer: {
    marginBottom: SPACING.md,
  },
  progressTrack: {
    height: 8,
    position: 'relative',
  },
  progressBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.warmBeige,
    borderRadius: 4,
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
  },
  progressKnob: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.gold,
    marginLeft: -8,
    ...SHADOWS.soft,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  timeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    alignItems: 'center',
    padding: SPACING.md,
  },
  controlLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginTop: 2,
  },
  mainControlButton: {
    marginHorizontal: SPACING.xl,
    borderRadius: RADIUS.full,
    ...SHADOWS.glow,
  },
  mainControlGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Compact variant styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warmBeige,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.soft,
  },
  compactPlayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  compactInfo: {
    flex: 1,
  },
  compactTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.earth,
    fontFamily: TYPOGRAPHY.ui,
  },
  compactSubtitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    marginBottom: SPACING.xs,
  },
  compactProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactProgressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.cream,
    borderRadius: 2,
    marginRight: SPACING.sm,
    overflow: 'hidden',
  },
  compactProgressFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: 2,
  },
  compactTime: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.mutedBrown,
    fontFamily: TYPOGRAPHY.ui,
    minWidth: 70,
  },

  // Minimal variant styles
  minimalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  minimalPlayButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.goldLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  minimalTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.richBrown,
    fontFamily: TYPOGRAPHY.ui,
    flex: 1,
  },
});

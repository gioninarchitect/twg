/**
 * Audio Service - Global Audio State Management
 * Handles audio playback across the app
 */

import { Audio, AVPlaybackStatus } from 'expo-av';

// Audio track configuration for each day
// User supplies their own audio files - just update the paths below
export interface AudioTrack {
  uri: string;
  title: string;
  subtitle?: string;
  dayNumber: number;
}

// ============================================
// AUDIO TRACKS CONFIGURATION
// ============================================
// To add your own songs:
// 1. Place MP3/M4A files in assets/audio/ folder
// 2. Add entries below with require() or use remote URLs
// 3. Each day can have its own unique track

export const DAILY_AUDIO_TRACKS: { [dayNumber: number]: AudioTrack } = {
  // === VALLEY PHASE (Days 1-14) ===
  // Example with local file:
  // 1: { uri: require('../../assets/audio/day-01-sanctuary.mp3'), title: 'Sanctuary', subtitle: 'Piano & Strings', dayNumber: 1 },

  // Example with remote URL:
  // 1: { uri: 'https://your-cdn.com/audio/day-01.mp3', title: 'Day 1 - Sanctuary', subtitle: 'Peaceful Piano', dayNumber: 1 },

  // === WAITING PHASE (Days 15-21) ===

  // === RISING PHASE (Days 22-33) ===

  // === BECOMING PHASE (Days 34-40) ===
};

// ============================================
// AUDIO SERVICE CLASS
// ============================================

class AudioService {
  private sound: Audio.Sound | null = null;
  private currentTrack: AudioTrack | null = null;
  private isPlaying: boolean = false;
  private listeners: Set<(status: AudioStatus) => void> = new Set();

  async initialize() {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
  }

  async loadTrack(track: AudioTrack): Promise<boolean> {
    try {
      // Unload current track if exists
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      // Load new track
      const { sound } = await Audio.Sound.createAsync(
        typeof track.uri === 'string' ? { uri: track.uri } : track.uri,
        { shouldPlay: false },
        this.onPlaybackStatusUpdate.bind(this)
      );

      this.sound = sound;
      this.currentTrack = track;
      return true;
    } catch (error) {
      console.error('Error loading audio track:', error);
      return false;
    }
  }

  async play(): Promise<void> {
    if (this.sound) {
      await this.sound.playAsync();
      this.isPlaying = true;
    }
  }

  async pause(): Promise<void> {
    if (this.sound) {
      await this.sound.pauseAsync();
      this.isPlaying = false;
    }
  }

  async toggle(): Promise<void> {
    if (this.isPlaying) {
      await this.pause();
    } else {
      await this.play();
    }
  }

  async seekTo(positionMs: number): Promise<void> {
    if (this.sound) {
      await this.sound.setPositionAsync(positionMs);
    }
  }

  async seekToPercentage(percentage: number): Promise<void> {
    if (this.sound) {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded && status.durationMillis) {
        const position = percentage * status.durationMillis;
        await this.sound.setPositionAsync(position);
      }
    }
  }

  async stop(): Promise<void> {
    if (this.sound) {
      await this.sound.stopAsync();
      this.isPlaying = false;
    }
  }

  async unload(): Promise<void> {
    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
      this.currentTrack = null;
      this.isPlaying = false;
    }
  }

  getCurrentTrack(): AudioTrack | null {
    return this.currentTrack;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // Get track for a specific day
  getTrackForDay(dayNumber: number): AudioTrack | null {
    return DAILY_AUDIO_TRACKS[dayNumber] || null;
  }

  // Check if a day has an audio track
  hasTrackForDay(dayNumber: number): boolean {
    return dayNumber in DAILY_AUDIO_TRACKS;
  }

  // Subscribe to playback status updates
  subscribe(listener: (status: AudioStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private onPlaybackStatusUpdate(status: AVPlaybackStatus) {
    if (status.isLoaded) {
      const audioStatus: AudioStatus = {
        isLoaded: true,
        isPlaying: status.isPlaying,
        isBuffering: status.isBuffering,
        positionMs: status.positionMillis,
        durationMs: status.durationMillis || 0,
        didJustFinish: status.didJustFinish,
        track: this.currentTrack,
      };

      this.isPlaying = status.isPlaying;

      // Notify all listeners
      this.listeners.forEach(listener => listener(audioStatus));
    }
  }
}

export interface AudioStatus {
  isLoaded: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  positionMs: number;
  durationMs: number;
  didJustFinish: boolean;
  track: AudioTrack | null;
}

// Export singleton instance
export const audioService = new AudioService();

// Format time helper
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

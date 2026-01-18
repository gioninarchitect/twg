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

// Base URL for protected audio API endpoint
// Detect environment from hostname
const getApiBaseUrl = () => {
  if (typeof window === 'undefined') return 'https://teawithgod.com/api/v1';
  const hostname = window.location.hostname;
  if (hostname === 'localhost') return 'http://localhost:3000/api/v1';
  if (hostname.includes('twg.cleva-ai.co.za')) return 'https://twg.cleva-ai.co.za/api/v1';
  return 'https://teawithgod.com/api/v1'; // Production
};
const API_BASE_URL = getApiBaseUrl();

// Track metadata - dynamically generated for intro + days 1-40
// All 40 day titles matching devotional content
const CUSTOM_TITLES: { [key: string]: string } = {
  'intro': 'Restore My Soul',
  'day-01': 'When Life Brings You to Your Knees',
  'day-02': 'The Quiet Where God Waits',
  'day-03': 'When You Walk Through the Valley',
  'day-04': 'The Wounds You Don\'t Speak About',
  'day-05': 'The Day You Realize You\'re Still Here',
  'day-06': 'When Life Has Taken Too Much',
  'day-07': 'When You\'re Tired of Being Strong',
  'day-08': 'When Your Dreams Didn\'t Unfold',
  'day-09': 'When the World Feels Too Loud',
  'day-10': 'When the Future Feels Fragile',
  'day-11': 'When Your Heart Feels Too Tired to Hope',
  'day-12': 'When You Don\'t Recognise Yourself Anymore',
  'day-13': 'When Life Has Broken Pieces You Didn\'t Know Existed',
  'day-14': 'When You Feel You\'ve Failed Yourself',
  'day-15': 'When You Can\'t Feel God at All',
  'day-16': 'When You Feel Emptied Beyond Words',
  'day-17': 'When Strength Has Cost You Too Much',
  'day-18': 'When the Life You Imagined Never Arrived',
  'day-19': 'When You Feel Invisible in the Noise',
  'day-20': 'When Tomorrow Feels Unsafe',
  'day-21': 'When You\'re Afraid to Hope Again',
  'day-22': 'When You Feel Like You\'ve Lost Yourself',
  'day-23': 'When Rest Feels Impossible',
  'day-24': 'When You Feel Like You\'re Starting Over Too Many Times',
  'day-25': 'When You\'re Learning to Breathe Again',
  'day-26': 'When You\'re Afraid to Trust Again',
  'day-27': 'When You\'re Learning to Feel Again',
  'day-28': 'When You\'re Afraid of Losing More',
  'day-29': 'When You Are Tired of Waiting',
  'day-30': 'When You Begin to Sense a Shift',
  'day-31': 'When You Reach the End of Yourself',
  'day-32': 'When Loneliness Feels Like a Second Skin',
  'day-33': 'When Anxiety Shakes the Foundations',
  'day-34': 'When Grief Becomes Your Shadow',
  'day-35': 'When You Fear You Will Never Rise Again',
  'day-36': 'When a New Breath Finds You',
  'day-37': 'When Strength Begins to Return',
  'day-38': 'When You Believe You Are Worth Rising',
  'day-39': 'When You Feel God Rising Within You',
  'day-40': 'When You Stand Again',
};

const AUDIO_TRACK_METADATA: { [key: string]: { title: string; subtitle: string } } = {
  'intro': { title: CUSTOM_TITLES['intro'], subtitle: 'Prophetizer & SonicGrace Music' },
};

// Generate metadata for days 1-40
for (let i = 1; i <= 40; i++) {
  const key = `day-${i.toString().padStart(2, '0')}`;
  const customTitle = CUSTOM_TITLES[key];
  AUDIO_TRACK_METADATA[key] = {
    title: customTitle || `Day ${i} Devotional`,
    subtitle: `Day ${i} • Prophetizer & SonicGrace Music`,
  };
}

// Map day numbers to track keys - dynamically generated for days 0-40
const DAY_TO_TRACK: { [dayNumber: number]: string } = { 0: 'intro' };
for (let i = 1; i <= 40; i++) {
  DAY_TO_TRACK[i] = `day-${i.toString().padStart(2, '0')}`;
}

// Build audio track with access code
function buildAudioTrack(dayNumber: number, accessCode: string): AudioTrack | null {
  const trackKey = DAY_TO_TRACK[dayNumber];
  if (!trackKey) return null;

  const metadata = AUDIO_TRACK_METADATA[trackKey];
  if (!metadata) return null;

  return {
    uri: `${API_BASE_URL}/audio/${trackKey}?code=${encodeURIComponent(accessCode)}`,
    title: metadata.title,
    subtitle: metadata.subtitle,
    dayNumber: dayNumber
  };
}

// Intro track (requires access code to be set later)
export const INTRO_TRACK: AudioTrack = {
  uri: '', // Will be set when access code is available
  title: 'Restore My Soul',
  subtitle: 'Tea With God Intro',
  dayNumber: 0
};

// Legacy export for compatibility (tracks need access code)
export const DAILY_AUDIO_TRACKS: { [dayNumber: number]: AudioTrack } = {};

// Initialize tracks with placeholder URIs
Object.keys(DAY_TO_TRACK).forEach(day => {
  const dayNum = parseInt(day);
  const trackKey = DAY_TO_TRACK[dayNum];
  const metadata = AUDIO_TRACK_METADATA[trackKey];
  if (metadata) {
    DAILY_AUDIO_TRACKS[dayNum] = {
      uri: '', // Requires access code
      title: metadata.title,
      subtitle: metadata.subtitle,
      dayNumber: dayNum
    };
  }
});

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

  // Get track for a specific day (with access code for protected streaming)
  getTrackForDay(dayNumber: number, accessCode?: string): AudioTrack | null {
    if (!accessCode) {
      // Return metadata only (no playable URI)
      return DAILY_AUDIO_TRACKS[dayNumber] || null;
    }
    // Build track with authenticated URI
    return buildAudioTrack(dayNumber, accessCode);
  }

  // Check if a day has an audio track
  hasTrackForDay(dayNumber: number): boolean {
    return dayNumber in DAY_TO_TRACK;
  }

  // Load track with access code authentication
  async loadTrackForDay(dayNumber: number, accessCode: string): Promise<boolean> {
    const track = buildAudioTrack(dayNumber, accessCode);
    if (!track) {
      console.error('No track available for day:', dayNumber);
      return false;
    }
    return this.loadTrack(track);
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

// Export build function for components that need to construct track URLs
export { buildAudioTrack };

# Music Module Architecture - Tea With God

## Executive Summary

This document defines a **plug-and-play, white-label ready** music streaming architecture for Tea With God (TWG). The design prioritizes:

1. **Provider Agnostic** - Swap between any music API without code changes
2. **Offline-First** - Downloaded tracks work without internet
3. **White-Label Ready** - Entire system portable to other healing/devotional apps
4. **Future-Proof** - Ready for Spotify, Apple Music, YouTube Music, or custom CDN

---

## Current State

### What We Have

| Component | File | Status |
|-----------|------|--------|
| Audio Service | `src/services/audioService.ts` | Basic singleton, local/remote playback |
| Audio Player | `src/components/AudioPlayer.tsx` | 3 variants (full, compact, minimal) |
| Track Config | `DAILY_AUDIO_TRACKS` object | Empty - awaiting tracks |

### Current Capabilities
- Expo AV for playback
- Background audio support
- Seek, pause, play controls
- Progress tracking
- Day-to-track mapping

### Missing
- No streaming provider integration
- No offline download management
- No playlist/queue system
- No crossfade or gapless playback
- No licensing/DRM handling
- No analytics (play counts, completion rates)

---

## Prophetizer Music Catalog

### Original Tracks (To Be Confirmed)
- **Estimated Count**: 15-40 original songs
- **Artist**: The Prophetizer
- **Created With**: **Suno.ai** (AI-assisted music generation)
- **Usage Rights**: Full ownership, unlimited streaming
- **Format**: MP3/M4A, high quality (256kbps+)

### Suno.ai Integration Opportunity

Since the album was created on Suno.ai, we have potential for:
1. **On-demand generation** - Create personalized healing tracks per user
2. **Mood-matched music** - Generate tracks based on journal sentiment
3. **Cultural adaptation** - Generate tracks in regional musical styles
4. **Expansion content** - New tracks for future phases/modules

### Track Organization by Journey Phase

| Phase | Days | Theme | Suggested Mood |
|-------|------|-------|----------------|
| Valley | 1-14 | Acknowledgment of pain | Gentle, ambient, minor keys |
| Waiting | 15-21 | Patience and hope | Building, contemplative |
| Rising | 22-33 | Strength emerging | Uplifting, crescendo |
| Becoming | 34-40 | Transformation complete | Triumphant, joyful |

---

## Proposed Architecture: Plugin System

### Core Abstraction Layer

```typescript
// src/services/music/MusicProvider.ts

export interface Track {
  id: string;
  title: string;
  artist: string;
  albumArt?: string;
  duration: number; // seconds
  uri: string; // Could be local, CDN, or streaming URL
  source: 'local' | 'cdn' | 'spotify' | 'apple' | 'youtube' | 'custom';
  metadata?: {
    dayNumber?: number;
    phase?: 'valley' | 'waiting' | 'rising' | 'becoming';
    mood?: string;
    bpm?: number;
    key?: string;
  };
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  tracks: Track[];
  coverImage?: string;
}

export interface MusicProvider {
  // Provider identification
  readonly name: string;
  readonly supportsOffline: boolean;
  readonly requiresAuth: boolean;

  // Authentication
  authenticate(): Promise<boolean>;
  isAuthenticated(): boolean;
  logout(): Promise<void>;

  // Playback
  play(track: Track): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  seek(position: number): Promise<void>;

  // Queue management
  setQueue(tracks: Track[]): Promise<void>;
  addToQueue(track: Track): Promise<void>;
  skipNext(): Promise<void>;
  skipPrevious(): Promise<void>;
  shuffle(enabled: boolean): Promise<void>;
  repeat(mode: 'none' | 'one' | 'all'): Promise<void>;

  // State
  getCurrentTrack(): Track | null;
  getPlaybackState(): PlaybackState;
  getQueue(): Track[];

  // Offline (if supported)
  downloadTrack?(track: Track): Promise<void>;
  removeDownload?(track: Track): Promise<void>;
  getDownloadedTracks?(): Promise<Track[]>;
  isTrackDownloaded?(track: Track): boolean;

  // Search (for streaming providers)
  search?(query: string): Promise<Track[]>;
  getPlaylists?(): Promise<Playlist[]>;

  // Events
  onStateChange(callback: (state: PlaybackState) => void): () => void;
  onTrackChange(callback: (track: Track | null) => void): () => void;
  onError(callback: (error: Error) => void): () => void;
}

export interface PlaybackState {
  isPlaying: boolean;
  isBuffering: boolean;
  position: number; // ms
  duration: number; // ms
  volume: number; // 0-1
}
```

### Provider Implementations

```
src/services/music/
├── MusicProvider.ts          # Interface definition
├── MusicManager.ts           # Singleton manager, switches providers
├── providers/
│   ├── LocalProvider.ts      # Bundled/downloaded files (Expo AV)
│   ├── CDNProvider.ts        # Remote streaming from our CDN
│   ├── SpotifyProvider.ts    # Spotify Web API + SDK
│   ├── AppleMusicProvider.ts # Apple MusicKit
│   ├── YouTubeMusicProvider.ts # YouTube Music API
│   └── CustomProvider.ts     # Template for white-label clients
├── hooks/
│   ├── useMusic.ts           # React hook for playback state
│   ├── useQueue.ts           # Queue management hook
│   └── useDownloads.ts       # Offline management hook
└── utils/
    ├── trackMapper.ts        # Map external tracks to our format
    ├── cacheManager.ts       # Handle offline caching
    └── analytics.ts          # Track listening stats
```

### Music Manager (Central Controller)

```typescript
// src/services/music/MusicManager.ts

class MusicManager {
  private provider: MusicProvider;
  private fallbackProvider: MusicProvider; // Local for offline

  constructor() {
    // Default to local/CDN provider
    this.provider = new CDNProvider();
    this.fallbackProvider = new LocalProvider();
  }

  setProvider(provider: MusicProvider): void {
    this.provider = provider;
  }

  // Delegate all calls to current provider
  // Fallback to local if streaming fails
  async play(track: Track): Promise<void> {
    try {
      await this.provider.play(track);
    } catch (error) {
      if (this.fallbackProvider.isTrackDownloaded?.(track)) {
        await this.fallbackProvider.play(track);
      } else {
        throw error;
      }
    }
  }

  // ... other delegated methods
}

export const musicManager = new MusicManager();
```

---

## Integration Points

### 1. Streaming Providers

| Provider | Auth Required | Offline | SDK/API |
|----------|---------------|---------|---------|
| **CDN (Self-hosted)** | No | Yes (download) | Direct HTTP |
| **Suno.ai** | API Key | Yes (download generated) | REST API (unofficial) |
| **Spotify** | Yes (OAuth) | Premium only | Web API + SDK |
| **Apple Music** | Yes (Apple ID) | Subscription | MusicKit |
| **YouTube Music** | Yes (Google) | Premium only | YouTube API |
| **SoundCloud** | Optional | Go+ only | HTTP API |
| **Deezer** | Yes | Premium | HTTP API |

### 1a. Suno.ai API Options

Since The Prophetizer's album was made on Suno.ai, we can integrate:

| Provider | Type | Features | Pricing |
|----------|------|----------|---------|
| **[PiAPI](https://huggingface.co/PiAPI/Suno-API)** | Hugging Face hosted | Full song generation, extend clips, fetch tasks | Pay-per-use |
| [sunoapi.org](https://sunoapi.org) | Unofficial API | Streaming output, fast delivery | Pay-per-use |
| [gcui-art/suno-api](https://github.com/gcui-art/suno-api) | Open source | Self-hosted, full control | Free (self-host) |
| [Kie.ai](https://kie.ai/suno-api) | Wrapper API | 20-sec streaming, timestamped lyrics | Subscription |
| [AI/ML API](https://aimlapi.com/suno-ai-api) | Aggregator | Text-to-music generation | Pay-per-use |

#### PiAPI Suno Integration (Recommended)

```python
# Generate full song via PiAPI
import http.client

conn = http.client.HTTPSConnection("api.piapi.ai")

payload = {
  "prompt": "Gentle healing worship song about finding peace after heartbreak",
  "style": "ambient worship, piano, soft vocals",
  "duration": 180
}

headers = {
    'X-API-Key': "YOUR_API_KEY",
    'Content-Type': "application/json"
}

conn.request("POST", "/api/suno/v1/music/generate", json.dumps(payload), headers)
res = conn.getresponse()
task_id = json.loads(res.read())["data"]["task_id"]

# Fetch completed track
conn.request("GET", f"/api/suno/v1/music/{task_id}", headers=headers)
track_url = json.loads(conn.getresponse().read())["data"]["audio_url"]
```

**Use Cases:**
```typescript
// Generate personalized healing track based on user's journal
const generateHealingTrack = async (journalEntry: string, mood: string) => {
  const prompt = `
    Gentle healing instrumental music for a woman going through ${mood}.
    Style: Ambient, piano-based, 70 BPM, minor key resolving to major.
    Theme: Hope after struggle, Kintsugi (beauty in brokenness).
  `;

  const track = await sunoApi.generate({
    prompt,
    duration: 180, // 3 minutes
    instrumental: true,
  });

  return track;
};
```

### 2. CDN Strategy (Primary for TWG)

For The Prophetizer's original music:

```typescript
// CDN Configuration
const CDN_CONFIG = {
  baseUrl: 'https://cdn.teawithgod.app/audio',
  fallbackUrl: 'https://twg.cleva-ai.co.za/audio',

  // Track URL pattern
  getTrackUrl: (trackId: string, quality: 'low' | 'medium' | 'high') => {
    const bitrates = { low: 128, medium: 192, high: 320 };
    return `${CDN_CONFIG.baseUrl}/${trackId}_${bitrates[quality]}kbps.mp3`;
  },

  // Adaptive streaming based on connection
  getOptimalQuality: async () => {
    const connection = await NetInfo.fetch();
    if (connection.type === 'wifi') return 'high';
    if (connection.type === 'cellular') return 'medium';
    return 'low';
  }
};
```

### 3. Offline Download System

```typescript
// src/services/music/utils/cacheManager.ts

interface DownloadTask {
  trackId: string;
  progress: number;
  status: 'queued' | 'downloading' | 'complete' | 'failed';
}

class CacheManager {
  private downloadQueue: DownloadTask[] = [];

  async downloadTrack(track: Track): Promise<string> {
    const localPath = `${FileSystem.documentDirectory}audio/${track.id}.mp3`;

    // Check if already downloaded
    const info = await FileSystem.getInfoAsync(localPath);
    if (info.exists) return localPath;

    // Download with progress
    const download = FileSystem.createDownloadResumable(
      track.uri,
      localPath,
      {},
      (progress) => {
        this.updateProgress(track.id, progress.totalBytesWritten / progress.totalBytesExpectedToWrite);
      }
    );

    await download.downloadAsync();
    return localPath;
  }

  async getStorageUsed(): Promise<number> {
    // Calculate total MB used by downloaded tracks
  }

  async clearCache(): Promise<void> {
    // Remove all downloaded tracks
  }
}
```

---

## White-Label Configuration

For other apps (books, courses, devotionals):

```typescript
// config/musicConfig.ts

export interface MusicModuleConfig {
  // Branding
  appName: string;
  primaryColor: string;
  accentColor: string;

  // Content source
  provider: 'cdn' | 'spotify' | 'apple' | 'youtube' | 'custom';
  cdnBaseUrl?: string;

  // Features
  enableOffline: boolean;
  enableQueue: boolean;
  enableShuffle: boolean;
  enableSocialSharing: boolean;

  // Track mapping
  contentMapping: {
    type: 'day' | 'chapter' | 'lesson' | 'module';
    tracks: { [contentId: string]: string }; // contentId -> trackId
  };

  // Analytics
  analyticsEnabled: boolean;
  analyticsEndpoint?: string;
}

// Tea With God config
export const TWG_MUSIC_CONFIG: MusicModuleConfig = {
  appName: 'Tea With God',
  primaryColor: '#D4AF37',
  accentColor: '#8B7355',
  provider: 'cdn',
  cdnBaseUrl: 'https://cdn.teawithgod.app/audio',
  enableOffline: true,
  enableQueue: true,
  enableShuffle: false, // Devotional journey is sequential
  enableSocialSharing: true,
  contentMapping: {
    type: 'day',
    tracks: {
      '1': 'prophetizer-day-01-sanctuary',
      '2': 'prophetizer-day-02-stillness',
      // ... 40 days
    }
  },
  analyticsEnabled: true,
  analyticsEndpoint: '/api/v1/analytics/music',
};
```

---

## Analytics & Insights

Track listening behavior for World Model integration:

```typescript
interface MusicAnalytics {
  // Listening patterns
  totalListeningTime: number; // minutes
  averageSessionLength: number;
  completionRate: number; // % of tracks finished
  mostPlayedTrack: string;
  preferredListeningTime: string; // morning, afternoon, evening, night

  // Healing correlation
  moodBeforeListening?: number; // 1-10 scale if captured
  moodAfterListening?: number;
  journalEntryAfterListening: boolean;

  // Engagement
  skipsCount: number;
  replaysCount: number;
  sharesCount: number;
  favoritesCount: number;
}
```

---

## Implementation Phases

### Phase 1: Foundation (Current Sprint)
- [ ] Refactor audioService.ts to use MusicProvider interface
- [ ] Create CDNProvider for Prophetizer tracks
- [ ] Upload tracks to server CDN folder
- [ ] Map tracks to 40 days

### Phase 2: Offline Support
- [ ] Implement CacheManager
- [ ] Add download UI in settings
- [ ] Show download progress
- [ ] Handle storage limits

### Phase 3: Enhanced Player
- [ ] Queue management
- [ ] Background playback controls (lock screen)
- [ ] Crossfade between tracks
- [ ] Sleep timer

### Phase 4: Streaming Integration (Future)
- [ ] Spotify OAuth flow
- [ ] Apple MusicKit setup
- [ ] Provider switching UI
- [ ] Playlist import

### Phase 5: White-Label Extraction
- [ ] Extract to separate npm package
- [ ] Configuration-driven theming
- [ ] Documentation for integration
- [ ] Example implementations

---

## File Structure for White-Label

```
packages/
└── twg-music-module/
    ├── package.json
    ├── src/
    │   ├── index.ts              # Main exports
    │   ├── MusicProvider.ts      # Core interface
    │   ├── MusicManager.ts       # Singleton controller
    │   ├── providers/            # All provider implementations
    │   ├── components/
    │   │   ├── AudioPlayer.tsx   # Themeable player
    │   │   ├── MiniPlayer.tsx    # Sticky bottom player
    │   │   ├── Queue.tsx         # Queue management UI
    │   │   └── DownloadManager.tsx
    │   ├── hooks/
    │   └── utils/
    ├── themes/
    │   ├── default.ts
    │   └── index.ts
    └── README.md
```

---

## Research: Music & Brain Healing

### Evidence Base

| Study | Finding | Relevance to TWG |
|-------|---------|------------------|
| PMC10765015 | Music induces neuroplasticity, reshapes neural networks | Supports daily music as brain training |
| Sciencedirect 2025 | Music therapy significantly reduces PTSD symptoms | Validates healing music for trauma |
| Tandfonline 2021 | Music therapy enhances prefrontal neuroplasticity after TBI | Supports cognitive benefits |
| PMC8910287 | Music stimulates neurogenesis, normalizes stress response | Aligns with polyvagal regulation |

### Therapeutic Music Guidelines

1. **Tempo**: 60-80 BPM for relaxation (matches resting heart rate)
2. **Key**: Minor keys for acknowledgment, major for hope/resolution
3. **Lyrics**: Scripture-aligned, non-triggering, hope-centered
4. **Volume**: Consistent levels, no sudden peaks
5. **Duration**: 3-5 minutes per track (matches attention spans in trauma)

---

## Next Steps

1. **Confirm track count** with The Prophetizer (15 or 40?)
2. **Upload tracks** to CDN at twg.cleva-ai.co.za/audio/
3. **Create track manifest** JSON mapping days to tracks
4. **Refactor audioService.ts** to use new provider pattern
5. **Test offline playback** with downloaded tracks

---

## Contact / Ownership

- **Architecture**: TWG Development Team
- **Music Content**: The Prophetizer (original compositions)
- **White-Label Rights**: Retained by TWG for licensing to third parties

---

*This document is designed for handoff to AI assistants or developers for implementation.*

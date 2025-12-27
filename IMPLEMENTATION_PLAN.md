# Tea With God: Full-Stack Implementation Plan

## Executive Summary

**Project:** Tea With God - A 40-Day Healing Companion Ecosystem
**Author:** Lani Butler
**Classification:** Psycho-Spiritual Digital Therapeutics (DTx)
**Stack:** React Native (Expo) | Firebase | PostgreSQL | Node.js | HLS Audio

This document provides a comprehensive implementation plan using the **agents-main** framework to build a production-ready, trauma-informed healing application with zero hardcoded data.

---

## Phase Map: Agent Orchestration

### Agent Deployment Matrix

| Phase | Agents Required | Model Tier | Responsibility |
|-------|-----------------|------------|----------------|
| 1. Data Architecture | `database-architect`, `backend-architect` | Opus 4.5 | Schema design, 3NF normalization |
| 2. API Layer | `backend-architect`, `graphql-architect` | Opus 4.5 | REST/GraphQL endpoints |
| 3. Authentication | `backend-security-coder` | Opus 4.5 | Book code redemption, JWT |
| 4. Content Pipeline | `python-pro`, `data-engineering` | Sonnet 4.5 | DOCX parsing, content ingestion |
| 5. Mobile Frontend | `frontend-developer`, `mobile-developer` | Opus 4.5 | React Native screens |
| 6. Audio System | `frontend-developer` | Sonnet 4.5 | HLS streaming, background audio |
| 7. Crisis Safety | `frontend-mobile-security`, `backend-security-coder` | Opus 4.5 | Zero-latency safety layer |
| 8. Analytics | `data-scientist`, `observability-engineer` | Sonnet 4.5 | Sentiment tracking, anonymous metrics |
| 9. DevOps | `deployment-engineer`, `kubernetes-architect` | Sonnet 4.5 | CI/CD, containerization |
| 10. Testing | `test-automator`, `tdd-orchestrator` | Sonnet 4.5 | E2E, unit, integration tests |

---

## Content Analysis: Book Structure

### Extracted from `/Users/florisolivier/Downloads/Tea_With_God_NO_BLANKS (2).docx`

**Book Metadata:**
- Title: "Tea With God: A 40-Day Devotional for Women"
- Author: Lani Butler
- Copyright: 2025-2026
- Publisher: Lani Butler, South Africa

**Content Structure (Each Day):**
```
1. Day Number + Title
2. Reflection (Narrative prose)
3. Scripture (Bible verse with reference)
4. Thought of the Day (Single sentence takeaway)
5. Prayer (Formatted prayer text)
6. Journal Prompt (Question for reflection)
```

**Phase Boundaries (Derived from Content Mood):**

| Phase | Days | Theme | Audio Mood |
|-------|------|-------|------------|
| Valley | 1-14 | Acknowledging pain, brokenness, grief | Minor key, ambient, surrender |
| Waiting | 15-21 | Transition, silence, learning to trust | Transitional, subtle builds |
| Rising | 22-33 | Emergence, identity reformation | Mixed modes, warming |
| Becoming | 34-40 | Integration, hope, strength | Major key, resolution |

---

## Data Architecture (3NF PostgreSQL)

### Agent: `database-architect` (Opus 4.5)

```sql
-- ============================================================================
-- SCHEMA: tea_with_god
-- Normalized to 3NF with referential integrity
-- ============================================================================

-- Content Phases (Static)
CREATE TABLE content_phases (
    phase_id SERIAL PRIMARY KEY,
    phase_name VARCHAR(50) NOT NULL UNIQUE,
    phase_order INTEGER NOT NULL,
    day_start INTEGER NOT NULL,
    day_end INTEGER NOT NULL,
    audio_mood VARCHAR(50) NOT NULL,
    theme_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journey Days (Static Content - 40 Records)
CREATE TABLE journey_days (
    day_id SERIAL PRIMARY KEY,
    day_number INTEGER NOT NULL UNIQUE CHECK (day_number BETWEEN 1 AND 40),
    phase_id INTEGER NOT NULL REFERENCES content_phases(phase_id),
    title VARCHAR(255) NOT NULL,
    reflection_content TEXT NOT NULL,
    scripture_text TEXT NOT NULL,
    scripture_reference VARCHAR(100) NOT NULL,
    thought_of_day TEXT NOT NULL,
    prayer_text TEXT NOT NULL,
    journal_prompt TEXT NOT NULL,
    estimated_read_minutes INTEGER DEFAULT 5,
    themes TEXT[], -- e.g., ['grief', 'hope', 'surrender']
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audio Tracks (Static - linked to days)
CREATE TABLE audio_tracks (
    track_id SERIAL PRIMARY KEY,
    day_id INTEGER NOT NULL REFERENCES journey_days(day_id),
    title VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL, -- HLS manifest URL
    mood VARCHAR(50) NOT NULL, -- 'Minor', 'Major', 'Transitional'
    mood_description TEXT,
    duration_seconds INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Psychology Modules (Static - Optional per day)
CREATE TABLE psychology_modules (
    module_id SERIAL PRIMARY KEY,
    day_id INTEGER NOT NULL REFERENCES journey_days(day_id),
    title VARCHAR(255) NOT NULL,
    key_insight TEXT NOT NULL,
    content_short TEXT NOT NULL,
    content_full TEXT NOT NULL,
    academic_citation VARCHAR(255),
    theme_color VARCHAR(7) DEFAULT '#A8B5A0', -- Sage
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- USER DATA (Dynamic)
-- ============================================================================

-- Users
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid VARCHAR(128) UNIQUE, -- Firebase Auth UID
    email VARCHAR(255),
    display_name VARCHAR(255),
    access_level VARCHAR(20) DEFAULT 'GUEST' CHECK (access_level IN ('GUEST', 'PILGRIM')),
    access_code VARCHAR(19), -- TWG-XXXX-XXXX-XXXX format
    code_redeemed_at TIMESTAMPTZ,
    fasting_protocol VARCHAR(50) DEFAULT 'Spiritual',
    journey_started_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    total_days_completed INTEGER DEFAULT 0,
    total_journal_entries INTEGER DEFAULT 0,
    total_minutes_engaged INTEGER DEFAULT 0,
    current_day_index INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Access Codes (Book Redemption)
CREATE TABLE access_codes (
    code_id SERIAL PRIMARY KEY,
    code VARCHAR(19) NOT NULL UNIQUE, -- TWG-XXXX-XXXX-XXXX
    batch_id VARCHAR(50), -- For tracking book print runs
    is_redeemed BOOLEAN DEFAULT FALSE,
    redeemed_by UUID REFERENCES users(user_id),
    redeemed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Daily Completions (Progress Tracking)
CREATE TABLE user_daily_completions (
    completion_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 40),
    status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (status IN ('LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETE')),
    devotional_scroll_depth INTEGER DEFAULT 0 CHECK (devotional_scroll_depth BETWEEN 0 AND 100),
    psychology_viewed BOOLEAN DEFAULT FALSE,
    audio_played BOOLEAN DEFAULT FALSE,
    audio_completed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    time_spent_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, day_number) -- Prevent double-crediting
);

-- Journal Entries (Encrypted)
CREATE TABLE journal_entries (
    entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 40),
    content_encrypted TEXT NOT NULL, -- AES-256 encrypted
    content_iv VARCHAR(32) NOT NULL, -- Initialization vector
    content_hash VARCHAR(64) NOT NULL, -- SHA-256 for integrity
    word_count INTEGER DEFAULT 0,
    sentiment_score FLOAT, -- Client-side analysis, anonymous
    sync_status VARCHAR(20) DEFAULT 'SYNCED' CHECK (sync_status IN ('PENDING', 'SYNCED', 'CONFLICT')),
    local_version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id, day_number) REFERENCES user_daily_completions(user_id, day_number)
);

-- Crisis Access Logs (ANONYMOUS - No user_id)
CREATE TABLE crisis_access_logs (
    log_id SERIAL PRIMARY KEY,
    session_hash VARCHAR(64) NOT NULL, -- Anonymous session identifier
    access_type VARCHAR(50) NOT NULL, -- 'MANUAL_SOS', 'SENTIMENT_DETECTED'
    detected_phrases TEXT[], -- For improving detection
    resource_accessed VARCHAR(100),
    accessed_at TIMESTAMPTZ DEFAULT NOW()
    -- NOTE: No user_id - privacy protection during distress
);

-- Sentiment Analytics (Aggregated, Anonymous)
CREATE TABLE sentiment_analytics (
    analytics_id SERIAL PRIMARY KEY,
    phase_id INTEGER REFERENCES content_phases(phase_id),
    day_number INTEGER,
    avg_sentiment_score FLOAT,
    sample_count INTEGER,
    recorded_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_access_code ON users(access_code);
CREATE INDEX idx_completions_user_day ON user_daily_completions(user_id, day_number);
CREATE INDEX idx_journal_user_day ON journal_entries(user_id, day_number);
CREATE INDEX idx_crisis_logs_date ON crisis_access_logs(accessed_at);

-- ============================================================================
-- SEED DATA: Phases
-- ============================================================================

INSERT INTO content_phases (phase_name, phase_order, day_start, day_end, audio_mood, theme_description) VALUES
('Valley', 1, 1, 14, 'Minor', 'Acknowledging pain, brokenness, grief. The descent before rising.'),
('Waiting', 2, 15, 21, 'Transitional', 'Transition, silence, learning to trust in the unseen.'),
('Rising', 3, 22, 33, 'Mixed', 'Emergence, identity reformation, learning to feel again.'),
('Becoming', 4, 34, 40, 'Major', 'Integration, hope, strength, the new self.');
```

---

## API Layer

### Agent: `backend-architect`, `graphql-architect` (Opus 4.5)

### REST Endpoints (Express/Node.js)

```
Base URL: /api/v1

# Authentication
POST   /auth/register              # Firebase Auth + DB user creation
POST   /auth/login                 # Firebase Auth token validation
POST   /auth/redeem-code           # Book code redemption (TWG-XXXX-XXXX-XXXX)
GET    /auth/me                    # Current user profile

# Content (Static - Cached)
GET    /content/phases             # All phases with metadata
GET    /content/days               # All 40 days (admin/sync)
GET    /content/days/:dayNumber    # Single day with all content
GET    /content/days/:dayNumber/audio    # Audio track for day

# User Journey (Dynamic)
GET    /journey/progress           # User's full journey state
POST   /journey/start              # Begin 40-day journey
PATCH  /journey/days/:dayNumber    # Update completion status
POST   /journey/days/:dayNumber/complete  # Mark day complete

# Journal (Encrypted)
GET    /journal/entries            # All user's journal entries (encrypted)
GET    /journal/entries/:dayNumber # Entry for specific day
POST   /journal/entries            # Create new entry
PUT    /journal/entries/:entryId   # Update entry
POST   /journal/sync               # Offline sync queue

# Crisis (Anonymous)
POST   /crisis/log                 # Anonymous crisis access log
GET    /crisis/resources           # Fallback remote resources

# Analytics (Admin)
GET    /analytics/sentiment        # Aggregated sentiment by phase
GET    /analytics/engagement       # Completion rates, time spent
```

### GraphQL Schema (Optional Enhancement)

```graphql
type Query {
  me: User!
  journeyProgress: JourneyProgress!
  dayContent(dayNumber: Int!): DayContent!
  journalEntries: [JournalEntry!]!
}

type Mutation {
  redeemAccessCode(code: String!): RedemptionResult!
  updateDayProgress(dayNumber: Int!, progress: DayProgressInput!): DayCompletion!
  saveJournalEntry(input: JournalEntryInput!): JournalEntry!
  logCrisisAccess(input: CrisisLogInput!): Boolean!
}

type Subscription {
  journeyUpdated: JourneyProgress!
}
```

---

## Content Ingestion Pipeline

### Agent: `python-pro`, `data-engineering` (Sonnet 4.5)

**Purpose:** Parse the DOCX file and populate the database with all 40 days of content.

```python
# content_ingestion/ingest_book.py

import re
import json
from docx import Document
from typing import List, Dict, Optional
import psycopg2
from psycopg2.extras import execute_values

class TeaWithGodIngester:
    """
    Parses Tea With God DOCX and populates PostgreSQL.
    Zero hardcoded content - all from source document.
    """

    DAY_PATTERN = r'^Day\s+(\d+)\s*[—–-]\s*(.+)$'
    SCRIPTURE_PATTERN = r'[*"](.+?)[*"]\s*[—–-]\s*(.+)'

    def __init__(self, docx_path: str, db_connection_string: str):
        self.docx_path = docx_path
        self.conn = psycopg2.connect(db_connection_string)
        self.days_data: List[Dict] = []

    def parse_document(self) -> List[Dict]:
        """Parse DOCX into structured day objects."""
        doc = Document(self.docx_path)
        full_text = '\n'.join([p.text for p in doc.paragraphs])

        # Split by day markers
        day_sections = re.split(r'(?=Day\s+\d+\s*[—–-])', full_text)

        for section in day_sections:
            if not section.strip():
                continue

            day_data = self._parse_day_section(section)
            if day_data:
                self.days_data.append(day_data)

        return self.days_data

    def _parse_day_section(self, section: str) -> Optional[Dict]:
        """Extract structured content from a single day section."""
        lines = section.strip().split('\n')

        # Extract day number and title
        header_match = re.match(self.DAY_PATTERN, lines[0])
        if not header_match:
            return None

        day_number = int(header_match.group(1))
        title = header_match.group(2).strip()

        # Determine phase
        phase_id = self._get_phase_id(day_number)

        # Parse sections
        content = '\n'.join(lines[1:])

        return {
            'day_number': day_number,
            'phase_id': phase_id,
            'title': title,
            'reflection_content': self._extract_section(content, 'reflection'),
            'scripture_text': self._extract_scripture_text(content),
            'scripture_reference': self._extract_scripture_ref(content),
            'thought_of_day': self._extract_section(content, 'thought'),
            'prayer_text': self._extract_section(content, 'prayer'),
            'journal_prompt': self._extract_section(content, 'journal'),
            'themes': self._extract_themes(content, day_number),
        }

    def _get_phase_id(self, day_number: int) -> int:
        """Map day number to phase."""
        if day_number <= 14:
            return 1  # Valley
        elif day_number <= 21:
            return 2  # Waiting
        elif day_number <= 33:
            return 3  # Rising
        else:
            return 4  # Becoming

    def _extract_section(self, content: str, section_type: str) -> str:
        """Extract content between section markers."""
        markers = {
            'reflection': (r'^Day\s+\d+', r'(?:SCRIPTURE|Scripture)'),
            'thought': (r'(?:THOUGHT OF THE DAY|Thought of the Day)', r'(?:PRAYER|Prayer)'),
            'prayer': (r'(?:PRAYER|Prayer)', r'(?:JOURNAL PROMPT|Journal Prompt)'),
            'journal': (r'(?:JOURNAL PROMPT|Journal Prompt)', r'(?:Day\s+\d+|$)'),
        }

        start_pattern, end_pattern = markers.get(section_type, (None, None))
        if not start_pattern:
            return ''

        match = re.search(
            f'{start_pattern}(.+?){end_pattern}',
            content,
            re.DOTALL | re.IGNORECASE
        )

        return match.group(1).strip() if match else ''

    def _extract_scripture_text(self, content: str) -> str:
        """Extract scripture verse text."""
        match = re.search(self.SCRIPTURE_PATTERN, content)
        return match.group(1).strip() if match else ''

    def _extract_scripture_ref(self, content: str) -> str:
        """Extract scripture reference."""
        match = re.search(self.SCRIPTURE_PATTERN, content)
        return match.group(2).strip() if match else ''

    def _extract_themes(self, content: str, day_number: int) -> List[str]:
        """Extract thematic tags based on content analysis."""
        theme_keywords = {
            'grief': ['grief', 'loss', 'mourn', 'weep'],
            'hope': ['hope', 'future', 'tomorrow', 'promise'],
            'trust': ['trust', 'faith', 'believe', 'lean'],
            'rest': ['rest', 'tired', 'weary', 'exhausted'],
            'identity': ['identity', 'becoming', 'who you are', 'recognize'],
            'fear': ['fear', 'afraid', 'anxiety', 'worry'],
            'healing': ['heal', 'restore', 'mend', 'rebuild'],
            'surrender': ['surrender', 'let go', 'release', 'give up'],
            'loneliness': ['lonely', 'alone', 'unseen', 'invisible'],
            'strength': ['strength', 'strong', 'courage', 'brave'],
        }

        content_lower = content.lower()
        themes = []

        for theme, keywords in theme_keywords.items():
            if any(kw in content_lower for kw in keywords):
                themes.append(theme)

        return themes[:5]  # Limit to 5 themes per day

    def populate_database(self):
        """Insert parsed content into PostgreSQL."""
        cursor = self.conn.cursor()

        insert_query = """
            INSERT INTO journey_days (
                day_number, phase_id, title, reflection_content,
                scripture_text, scripture_reference, thought_of_day,
                prayer_text, journal_prompt, themes
            ) VALUES %s
            ON CONFLICT (day_number) DO UPDATE SET
                title = EXCLUDED.title,
                reflection_content = EXCLUDED.reflection_content,
                scripture_text = EXCLUDED.scripture_text,
                scripture_reference = EXCLUDED.scripture_reference,
                thought_of_day = EXCLUDED.thought_of_day,
                prayer_text = EXCLUDED.prayer_text,
                journal_prompt = EXCLUDED.journal_prompt,
                themes = EXCLUDED.themes,
                updated_at = NOW()
        """

        values = [
            (
                d['day_number'], d['phase_id'], d['title'],
                d['reflection_content'], d['scripture_text'],
                d['scripture_reference'], d['thought_of_day'],
                d['prayer_text'], d['journal_prompt'], d['themes']
            )
            for d in self.days_data
        ]

        execute_values(cursor, insert_query, values)
        self.conn.commit()

        print(f"Ingested {len(values)} days into database")
        cursor.close()


# Usage
if __name__ == '__main__':
    ingester = TeaWithGodIngester(
        docx_path='/Users/florisolivier/Downloads/Tea_With_God_NO_BLANKS (2).docx',
        db_connection_string='postgresql://user:pass@localhost:5432/tea_with_god'
    )
    ingester.parse_document()
    ingester.populate_database()
```

---

## Mobile Frontend Architecture

### Agent: `frontend-developer`, `mobile-developer` (Opus 4.5)

### Screen Map

```
src/
├── screens/
│   ├── auth/
│   │   ├── WelcomeScreen.tsx        # Onboarding, book info
│   │   ├── CodeRedemptionScreen.tsx # TWG-XXXX entry
│   │   └── LoginScreen.tsx          # Firebase Auth
│   ├── journey/
│   │   ├── DashboardScreen.tsx      # Journey overview, current day
│   │   ├── DayModuleScreen.tsx      # Day composite view
│   │   ├── DevotionalScreen.tsx     # Reading experience
│   │   ├── PsychologyScreen.tsx     # "Why This Works" module
│   │   └── JournalScreen.tsx        # Encrypted journaling
│   ├── progress/
│   │   ├── JourneyProgressScreen.tsx # Total Volume view
│   │   └── PhaseTransitionScreen.tsx # Valley -> Waiting etc.
│   ├── crisis/
│   │   └── CrisisModalScreen.tsx    # Zero-latency safety
│   └── settings/
│       ├── SettingsScreen.tsx
│       └── NotificationSettings.tsx
├── components/
│   ├── devotional/
│   │   ├── ReflectionText.tsx       # Georgia font, cream bg
│   │   ├── ScriptureCard.tsx        # Kintsugi gold accent
│   │   └── ThoughtOfDay.tsx
│   ├── psychology/
│   │   ├── PsychCard.tsx            # Conditional disclosure
│   │   └── InsightBadge.tsx
│   ├── audio/
│   │   ├── AudioPlayer.tsx          # Persistent player
│   │   ├── MiniPlayer.tsx           # Collapsed view
│   │   └── PhaseVisualizer.tsx      # Audio waveform
│   ├── journal/
│   │   ├── JournalEditor.tsx        # Rich text input
│   │   ├── PromptCard.tsx
│   │   └── EncryptionIndicator.tsx
│   ├── crisis/
│   │   ├── SOSButton.tsx            # Global FAB
│   │   ├── HotlineCard.tsx
│   │   └── GroundingExercise.tsx
│   └── common/
│       ├── GoldShimmer.tsx          # Loading animation
│       ├── SanctuaryCard.tsx        # Base card component
│       └── ProgressIndicator.tsx    # Non-streak based
├── hooks/
│   ├── useJourney.ts                # Journey state management
│   ├── useDayContent.ts             # Fetch day from API
│   ├── useAudio.ts                  # Audio player state
│   ├── useJournal.ts                # Encrypted journal CRUD
│   ├── useCrisis.ts                 # Crisis state + scanner
│   ├── useGraceProtocol.ts          # Notification logic
│   └── useOfflineSync.ts            # WatermelonDB sync
├── services/
│   ├── api/
│   │   ├── client.ts                # Axios/fetch wrapper
│   │   ├── authApi.ts
│   │   ├── contentApi.ts
│   │   ├── journeyApi.ts
│   │   └── journalApi.ts
│   ├── encryption/
│   │   ├── journalEncryption.ts     # AES-256
│   │   └── keyManager.ts            # Secure key storage
│   ├── audio/
│   │   └── trackPlayerService.ts    # react-native-track-player
│   ├── notifications/
│   │   └── graceProtocolService.ts
│   └── offline/
│       ├── watermelonDb.ts          # Local-first database
│       └── syncQueue.ts
├── context/
│   ├── AuthContext.tsx
│   ├── JourneyContext.tsx
│   ├── AudioContext.tsx
│   └── CrisisContext.tsx
└── theme/
    ├── colors.ts                    # Sanctuary Palette
    ├── typography.ts                # Georgia/Montserrat
    └── spacing.ts
```

### API-to-UI Binding Pattern

```typescript
// hooks/useDayContent.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '../services/api/contentApi';
import { journeyApi } from '../services/api/journeyApi';
import { DayModule, DayCompletionStatus } from '../types';

export function useDayContent(dayNumber: number) {
  const queryClient = useQueryClient();

  // Fetch day content from API (cached)
  const {
    data: dayContent,
    isLoading: contentLoading,
    error: contentError,
  } = useQuery<DayModule>({
    queryKey: ['dayContent', dayNumber],
    queryFn: () => contentApi.getDayContent(dayNumber),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - content is static
    cacheTime: Infinity,
  });

  // Fetch user's progress for this day
  const {
    data: completion,
    isLoading: progressLoading,
  } = useQuery<DayCompletionStatus>({
    queryKey: ['dayProgress', dayNumber],
    queryFn: () => journeyApi.getDayProgress(dayNumber),
    staleTime: 1000 * 30, // 30 seconds - progress changes often
  });

  // Update scroll depth (triggers psychology unlock)
  const updateScrollDepth = useMutation({
    mutationFn: (scrollDepth: number) =>
      journeyApi.updateDayProgress(dayNumber, { devotionalScrollDepth: scrollDepth }),
    onSuccess: (data) => {
      queryClient.setQueryData(['dayProgress', dayNumber], data);
    },
  });

  // Mark day complete
  const completeDay = useMutation({
    mutationFn: () => journeyApi.completeDay(dayNumber),
    onSuccess: () => {
      queryClient.invalidateQueries(['journeyProgress']);
      queryClient.invalidateQueries(['dayProgress', dayNumber + 1]);
    },
  });

  return {
    dayContent,
    completion,
    isLoading: contentLoading || progressLoading,
    error: contentError,
    updateScrollDepth: updateScrollDepth.mutate,
    completeDay: completeDay.mutate,
    isPsychologyUnlocked: (completion?.devotionalScrollDepth ?? 0) > 90,
  };
}
```

---

## Audio Pipeline

### Agent: `frontend-developer` (Sonnet 4.5)

```typescript
// services/audio/trackPlayerService.ts
import TrackPlayer, {
  Capability,
  Event,
  State,
  usePlaybackState,
  useProgress,
} from 'react-native-track-player';
import { MusicTrack, JourneyPhase } from '../../types';
import { contentApi } from '../api/contentApi';

class AudioService {
  private isInitialized = false;
  private currentPhase: JourneyPhase = 'Valley';

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await TrackPlayer.setupPlayer({
      maxCacheSize: 1024 * 50, // 50MB cache for HLS segments
    });

    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SeekTo,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      compactCapabilities: [Capability.Play, Capability.Pause],
      notificationCapabilities: [Capability.Play, Capability.Pause],
    });

    this.isInitialized = true;
  }

  async loadTrackForDay(dayNumber: number): Promise<void> {
    const track = await contentApi.getAudioTrack(dayNumber);

    await TrackPlayer.reset();
    await TrackPlayer.add({
      id: track.trackId,
      url: track.fileUrl, // HLS .m3u8 URL
      title: track.title,
      artist: 'Tea With God',
      artwork: require('../../assets/album-art.png'),
      duration: track.durationSeconds,
    });
  }

  async play(): Promise<void> {
    await TrackPlayer.play();
  }

  async pause(): Promise<void> {
    await TrackPlayer.pause();
  }

  async setVolume(volume: number): Promise<void> {
    // Used for Journal screen (80% volume)
    await TrackPlayer.setVolume(Math.max(0, Math.min(1, volume)));
  }

  async fadeToVolume(targetVolume: number, durationMs: number = 500): Promise<void> {
    const currentVolume = await TrackPlayer.getVolume();
    const steps = 20;
    const stepDuration = durationMs / steps;
    const volumeStep = (targetVolume - currentVolume) / steps;

    for (let i = 0; i < steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, stepDuration));
      await TrackPlayer.setVolume(currentVolume + volumeStep * (i + 1));
    }
  }
}

export const audioService = new AudioService();

// Hook for components
export function useAudioPlayer(dayNumber: number) {
  const playbackState = usePlaybackState();
  const progress = useProgress();

  const isPlaying = playbackState === State.Playing;
  const isLoading = playbackState === State.Buffering || playbackState === State.Connecting;

  return {
    isPlaying,
    isLoading,
    progress: progress.position,
    duration: progress.duration,
    play: () => audioService.play(),
    pause: () => audioService.pause(),
    loadTrack: () => audioService.loadTrackForDay(dayNumber),
    fadeToBackground: () => audioService.fadeToVolume(0.8), // Journal screen
    fadeToForeground: () => audioService.fadeToVolume(1.0),
  };
}
```

---

## Authentication & Code Redemption

### Agent: `backend-security-coder` (Opus 4.5)

```typescript
// backend/controllers/authController.ts
import { Request, Response } from 'express';
import { db } from '../database';
import { firebaseAdmin } from '../firebase';
import { generateAccessCode, validateAccessCodeFormat } from '../utils/accessCodes';

export const authController = {
  /**
   * Redeem a book access code
   * POST /api/v1/auth/redeem-code
   */
  async redeemCode(req: Request, res: Response) {
    const { code } = req.body;
    const userId = req.user.uid; // From Firebase Auth middleware

    // Validate format: TWG-XXXX-XXXX-XXXX
    if (!validateAccessCodeFormat(code)) {
      return res.status(400).json({
        error: 'INVALID_FORMAT',
        message: 'Code must be in format TWG-XXXX-XXXX-XXXX',
      });
    }

    // Check if code exists and is unredeemed
    const codeResult = await db.query(
      `SELECT * FROM access_codes WHERE code = $1`,
      [code.toUpperCase()]
    );

    if (codeResult.rows.length === 0) {
      return res.status(404).json({
        error: 'CODE_NOT_FOUND',
        message: 'This code is not valid.',
      });
    }

    const accessCode = codeResult.rows[0];

    if (accessCode.is_redeemed) {
      return res.status(409).json({
        error: 'CODE_ALREADY_REDEEMED',
        message: 'This code has already been used.',
      });
    }

    // Transaction: Mark code as redeemed + upgrade user
    await db.query('BEGIN');

    try {
      // Mark code as redeemed
      await db.query(
        `UPDATE access_codes
         SET is_redeemed = TRUE, redeemed_by = $1, redeemed_at = NOW()
         WHERE code_id = $2`,
        [userId, accessCode.code_id]
      );

      // Upgrade user to PILGRIM
      await db.query(
        `UPDATE users
         SET access_level = 'PILGRIM',
             access_code = $1,
             code_redeemed_at = NOW(),
             journey_started_at = COALESCE(journey_started_at, NOW()),
             updated_at = NOW()
         WHERE user_id = $2`,
        [code.toUpperCase(), userId]
      );

      // Initialize day completions for days 4-40
      await db.query(
        `INSERT INTO user_daily_completions (user_id, day_number, status)
         SELECT $1, generate_series(4, 40), 'LOCKED'
         ON CONFLICT (user_id, day_number) DO NOTHING`,
        [userId]
      );

      await db.query('COMMIT');

      return res.json({
        success: true,
        accessLevel: 'PILGRIM',
        message: 'Welcome, Pilgrim. Your full journey awaits.',
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  },

  /**
   * Generate batch of access codes (Admin)
   * POST /api/v1/admin/generate-codes
   */
  async generateCodes(req: Request, res: Response) {
    const { count = 100, batchId } = req.body;

    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(generateAccessCode());
    }

    const values = codes.map((code) => [code, batchId || 'default']);

    await db.query(
      `INSERT INTO access_codes (code, batch_id)
       VALUES ${values.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ')}`,
      values.flat()
    );

    return res.json({
      generated: codes.length,
      batchId: batchId || 'default',
      codes: codes, // Only for admin, would be removed in production
    });
  },
};

// utils/accessCodes.ts
export function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding ambiguous: 0, O, I, 1
  const segment = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

  return `TWG-${segment()}-${segment()}-${segment()}`;
}

export function validateAccessCodeFormat(code: string): boolean {
  return /^TWG-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(code);
}
```

---

## Deployment Architecture

### Agent: `deployment-engineer`, `kubernetes-architect` (Sonnet 4.5)

### Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: tea_with_god
      POSTGRES_USER: twg_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/01-init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U twg_user -d tea_with_god"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://twg_user:${POSTGRES_PASSWORD}@postgres:5432/tea_with_god
      REDIS_URL: redis://redis:6379
      FIREBASE_PROJECT_ID: ${FIREBASE_PROJECT_ID}
      FIREBASE_PRIVATE_KEY: ${FIREBASE_PRIVATE_KEY}
      FIREBASE_CLIENT_EMAIL: ${FIREBASE_CLIENT_EMAIL}
      JWT_SECRET: ${JWT_SECRET}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - ./backend:/app
      - /app/node_modules

  content-cdn:
    image: nginx:alpine
    volumes:
      - ./content/audio:/usr/share/nginx/html/audio:ro
      - ./nginx/hls.conf:/etc/nginx/conf.d/default.conf:ro
    ports:
      - "8080:80"

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes (Production)

```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: twg-api
  namespace: tea-with-god
spec:
  replicas: 3
  selector:
    matchLabels:
      app: twg-api
  template:
    metadata:
      labels:
        app: twg-api
    spec:
      containers:
        - name: api
          image: gcr.io/tea-with-god/api:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: production
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: twg-secrets
                  key: database-url
            - name: ENCRYPTION_KEY
              valueFrom:
                secretKeyRef:
                  name: twg-secrets
                  key: encryption-key
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: twg-api
  namespace: tea-with-god
spec:
  selector:
    app: twg-api
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
```

---

## Testing Strategy

### Agent: `test-automator`, `tdd-orchestrator` (Sonnet 4.5)

### Test Matrix

| Layer | Framework | Coverage Target |
|-------|-----------|-----------------|
| Unit (Backend) | Jest | 80% |
| Unit (Frontend) | Jest + React Testing Library | 75% |
| Integration | Supertest | API endpoints |
| E2E | Detox (Mobile) | Critical paths |
| Accessibility | axe-core | WCAG 2.1 AA |
| Security | OWASP ZAP | Vulnerability scan |

### Critical Path E2E Tests

```typescript
// e2e/journeyFlow.test.ts
describe('40-Day Journey Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
    await loginAsTestUser();
  });

  it('should complete Day 1 and unlock Day 2', async () => {
    // Navigate to Day 1
    await element(by.id('day-1-card')).tap();

    // Read devotional (scroll to 90%)
    await element(by.id('devotional-scroll')).scroll(500, 'down');

    // Verify psychology unlocked
    await expect(element(by.id('psych-card'))).toBeVisible();

    // Play audio
    await element(by.id('audio-play')).tap();
    await waitFor(element(by.id('audio-playing'))).toBeVisible().withTimeout(3000);

    // Write journal entry
    await element(by.id('journal-input')).typeText('My reflection for today...');
    await element(by.id('journal-save')).tap();

    // Complete day
    await element(by.id('complete-day')).tap();

    // Verify Day 2 is now accessible
    await element(by.id('back-button')).tap();
    await expect(element(by.id('day-2-card'))).not.toHaveLabel('Locked');
  });

  it('should show crisis resources within 200ms', async () => {
    const startTime = Date.now();

    await element(by.id('sos-button')).tap();

    await waitFor(element(by.id('crisis-modal'))).toBeVisible().withTimeout(200);

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(200);

    // Verify offline content is present
    await expect(element(by.text('National Suicide Prevention Lifeline'))).toBeVisible();
  });

  it('should enforce chronological sovereignty (no skipping)', async () => {
    // Attempt to access Day 5 when only on Day 1
    await element(by.id('day-5-card')).tap();

    // Should show locked message
    await expect(element(by.text('Complete Day 4 first'))).toBeVisible();
  });
});
```

---

## Verification Gates

| Gate | Verification Method | Pass Criteria |
|------|---------------------|---------------|
| VG_01 | SQL FK Constraints | No orphan journal entries |
| VG_02 | Contrast Checker | Gold #D4A574 on Cream #FAF8F5 = 3.8:1 (use with large text only) |
| VG_03 | Network Simulation | Crisis modal loads at 0kbps from local cache |
| VG_04 | Proxy Inspection | Journal content encrypted in transit |
| VG_05 | State Machine Test | PsychCard hidden until scrollDepth > 90% |
| VG_06 | Latency Audit | Crisis overlay < 200ms, Audio init < 1.5s |
| VG_07 | Shame-Free Audit | No "missed", "streak", "failed" in UI strings |

---

## Sprint Breakdown

### Sprint 1: Foundation (Week 1-2)
- [ ] PostgreSQL schema deployment
- [ ] Firebase project setup
- [ ] Content ingestion pipeline (parse DOCX)
- [ ] Basic Express API scaffolding
- [ ] React Native project initialization

### Sprint 2: Core Journey (Week 3-4)
- [ ] Authentication flow (Firebase + code redemption)
- [ ] Day content API endpoints
- [ ] Dashboard + Day Module screens
- [ ] Devotional reading experience

### Sprint 3: Engagement (Week 5-6)
- [ ] Psychology module (conditional unlock)
- [ ] Audio player integration (HLS)
- [ ] Journal with encryption
- [ ] WatermelonDB offline sync

### Sprint 4: Safety & Polish (Week 7-8)
- [ ] Crisis Interceptor (zero-latency)
- [ ] Grace Protocol notifications
- [ ] Accessibility audit
- [ ] E2E testing

### Sprint 5: Launch Prep (Week 9-10)
- [ ] Performance optimization
- [ ] Security audit
- [ ] App Store submission
- [ ] Production deployment

---

## Agent Orchestration Commands

```bash
# Full-Stack Feature Development
/full-stack-orchestration:full-stack-feature "Day Module with Psychology Unlock"

# Database Schema Review
/code-review-ai:ai-review --focus database-architecture

# Security Hardening
/security-scanning:security-hardening --level comprehensive

# Deployment Validation
/deployment-strategies:deployment-validate --environment production

# Test Generation
/unit-testing:test-generate --coverage 80
```

---

## Resource References

- Van der Kolk, B. (2014). *The Body Keeps the Score*
- Clear, J. (2018). *Atomic Habits*
- PostgreSQL 16 Documentation
- React Native Track Player
- WatermelonDB Sync Protocol
- WCAG 2.1 Guidelines

---

**Document Status:** APPROVED FOR IMPLEMENTATION
**Last Updated:** 2025-12-25
**Author:** Claude Code Architecture Team

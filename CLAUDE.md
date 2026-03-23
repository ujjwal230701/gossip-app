# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start Expo dev server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web
npm run lint       # Lint with ESLint
```

No test framework is configured yet.

## Architecture

This is a location-based anonymous gossip app for India targeting users aged 18-35, launching first on college campuses.

### Product Goals

- Real-time local campus/community gossip with low-friction posting.
- Anonymous participation while still enforcing strong safety constraints.
- Hyperlocal relevance: show content from within a 5 km radius.
- Ephemeral conversations: posts expire after 24 hours.

### Tech Stack

- **Frontend:** Expo (React Native) + Expo Router.
- **Backend/Data/Auth:** Supabase.
- **Routing:** File-based routing via Expo Router (`app/`).

### Core Screens

- `Feed` - Primary local feed (within 5 km) sorted by recency/relevance.
- `Post` - Create a new gossip post (anonymous identity).
- `Profile` - Anonymous profile/history and activity summary.
- `Notifications` - Reactions, replies, moderation updates, and mentions.
- `Gossip Detail` - Full thread view with comments and reactions.

### Data Model (Supabase)

Core tables expected in the schema:

- `users` - Anonymous user record keyed to device identity.
- `posts` - Gossip posts with location metadata and expiry timestamp.
- `comments` - Replies on posts.
- `reactions` - Lightweight engagement (likes/emojis/upvotes as defined).
- `flags` - User/system moderation reports and review state.

### Identity and Privacy

- User identity is anonymous and tied to a device UUID.
- Do not expose personally identifying details in UI or API responses.
- Treat device UUID as sensitive data; never log raw identifiers in plaintext.

### Location and Feed Rules

- Feed queries must only return posts within a 5 km radius of the user GPS point.
- Post creation should capture location data needed for radius queries.
- If location permission is unavailable, fail gracefully and guide users to enable it.

### Expiry Rules

- Every post expires 24 hours after creation.
- Expired posts should be excluded from default feed/detail queries.
- Background cleanup or query-level filtering must enforce expiry consistently.

### Content Moderation (India-Specific)

Block or remove content that includes:

- Defamation.
- Religious targeting or hate directed at religions.
- Caste-based targeting/abuse.
- Threats or incitement of violence.
- Personal/sensitive information (doxxing, phone/address/ID leaks).

Moderation should combine automated checks plus user flagging through `flags`.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

GASP is a React Native mobile app (Expo 54) — an ephemeral media platform (Snapchat-style) with real-time chat, disappearing photos ("gasps"), and video reactions. This is the frontend; the backend lives in `../gasp-backend/`.

## Commands

```bash
npm install                  # Install dependencies
npx expo start               # Dev server (Expo Go or dev client)
expo run:android             # Build & run on Android
expo run:ios                 # Build & run on iOS
npm run lint                 # ESLint (expo lint)
```

Set `EXPO_PUBLIC_API_URL` to point at the backend (defaults to `http://localhost:3000`).

No test runner is configured in this project.

## Stack

Expo 54 + React Native 0.81 + TypeScript (strict) + NativeWind v4 (Tailwind) + Zustand 5 + Socket.IO client + Axios + React Native Reanimated + Lucide icons

## Architecture

### Routing (Expo Router, file-based)

- `app/index.tsx` — Auth gate: redirects to `/(auth)/welcome` or `/(tabs)/camera`
- `app/_layout.tsx` — Root layout: GestureHandlerRootView, auth initialization, splash screen, socket listeners
- `app/(auth)/` — Auth flow: welcome, phone-login, verify-code, create-profile
- `app/(tabs)/` — Main tabs: discover, **camera** (initial), inbox, chat, profile. Custom tab bar via `CustomTabBar`
- `app/(modals)/` — Modal screens: view-gasp, send-gasp, camera-preview, reaction-result, edit-profile, friend-profile, settings
- `app/chat/[id].tsx` — Individual chat conversation (not inside tabs)

### State Management (Zustand stores in `stores/`)

Each store is a standalone `create<T>()` call. Access outside React via `useXStore.getState()`.

Stores contain **UI/client state only**. Server state (friends, gasps, profile stats, etc.) is managed by React Query hooks in `hooks/queries/`.

| Store | Responsibility |
|-------|---------------|
| `authStore` | User, token, login/register/logout, session restore (`initializeAuth`) |
| `chatStore` | Conversations, messages (keyed by conversationId), typing indicators, socket emit wrappers |
| `gaspStore` | Pending/sent gasps, reactions, hold-to-view state, batch send |
| `inboxStore` | Friend list with online status, friend requests, search filtering |
| `cameraStore` | Camera facing, flash mode, captured URI |
| `appStore` | Onboarding state, device permissions |
| `mediaCacheStore` | Local media cache (downloaded gasp/reaction URIs) |

> `profileStore` was removed — profile stats are now fetched via the `useProfileStats` hook in `hooks/queries/useProfile.ts`.

### API Layer

- `services/api.ts` — Axios instance at `{API_URL}/api/v1`. Request interceptor injects JWT from authStore. Response interceptor auto-refreshes on 401.
- `services/api/*.ts` — Domain-specific API calls: auth, users, friends, conversations, messages, gasps, reactions.
- `services/api/schemas/` — Zod validation schemas: `user.schema.ts`, `chat.schema.ts`, `gasp.schema.ts`, `common.schema.ts`. Types are derived from these schemas (see Types section).
- `services/queryKeys.ts` — React Query key factory. All query keys centralized here.
- `services/navigation.ts` — Typed navigation helper functions wrapping `router` from Expo Router.
- `services/socket.ts` — Socket.IO singleton. Typed event emitters (`chatSendMessage`, `chatStartTyping`, etc.) and listener registrars (`onChatNewMessage`, `onGaspReceived`, etc.) that return cleanup functions.
- `services/storage.ts` — Firebase Storage upload (gasps, reactions, avatars) with progress callbacks.
- `hooks/queries/` — React Query hooks for server state:
  - `useFriends.ts` — friend list, friend requests
  - `useGasps.ts` — received/sent gasps
  - `useChat.ts` — conversation list, messages
  - `useProfile.ts` — user stats (`useProfileStats`), sent gasps grid

### Real-Time (Socket.IO)

`hooks/useSocketListeners.ts` is called once in the root layout. It registers all socket listeners and dispatches to Zustand stores. Events:
- **Chat**: `chat:new_message`, `chat:typing`, `chat:message_read`, `chat:conversation_updated`
- **Gasp**: `gasp:received`, `gasp:viewed`, `gasp:reaction_received`, `gasp:expired`
- **Presence**: `presence:user_online`, `presence:user_offline`, `presence:bulk_status`

### Auth Flow

1. Firebase Auth (phone SMS) via `@react-native-firebase/auth` (native module)
2. Firebase token sent to backend → backend returns its own JWT
3. JWT stored in `expo-secure-store` (via `utils/storage.ts`)
4. On app launch, `authStore.initializeAuth()` restores session from SecureStore, validates with `/users/me`, connects socket
5. Guest mode available (bypasses backend auth)

### Firebase

Two Firebase integrations:
- **`@react-native-firebase/app` + `/auth`** — Native modules for phone SMS authentication
- **`firebase` JS SDK** (`lib/firebase.ts`) — Firebase Storage for media uploads only

Project ID: `gasp-cab37`

## Styling

- **NativeWind v4** with Tailwind classes. Global CSS in `global.css`. This is the **default** for layout and styling.
- **Dark theme only** (background `#0A0A0F`, `userInterfaceStyle: "dark"` in app.json).
- Custom color tokens in `tailwind.config.js`: `bg`, `surface`, `primary`, `accent-pink/magenta/cyan`, `border`.
- Full color palette (including text, semantic, gradient definitions) in `constants/colors.ts`.
- Icons: `lucide-react-native`.
- **Use `StyleSheet.create` only when required**: animations (Reanimated), complex absolute positioning, or `BlurView` (which requires numeric styles). Otherwise prefer Tailwind classes.

## Key Patterns

- **Path alias**: `@/*` maps to project root. Always use `@/stores/authStore`, `@/services/api`, etc.
- **Typed routes**: `experiments.typedRoutes: true` in app.json. Expo Router generates route types.
- **React Compiler**: Enabled experimentally (`experiments.reactCompiler: true`).
- **New Architecture**: Enabled (`newArchEnabled: true`).
- **Cursor-based pagination**: Backend returns `{ data, nextCursor, hasMore }`. See `PaginatedResponse<T>` in `services/api.ts`.
- **Messages are stored newest-first** in chatStore (index 0 = newest) since FlatList is inverted.
- **Socket listener pattern**: Each `on*` function in `services/socket.ts` returns a cleanup function. `useSocketListeners` collects them all and calls them on unmount.
- **Component organization**: By domain — `components/ui/` (shared primitives), `components/auth/`, `components/camera/`, `components/chat/`, `components/gasp/`, `components/inbox/`, `components/profile/`, `components/discover/`, `components/navigation/`.
  - `components/chat/` contains: `MessageBubble` (dispatcher by type), `BubbleWrapper`, `TextBubble`, `GaspBubble`, `ReactionBubble`, `MediaBadge`, `DateSeparator`, `ChatInput`
  - `components/ui/InlineVideo.tsx` — standalone video player (used in gasp view and reactions)

## Types

Domain types are now **derived from Zod schemas** in `services/api/schemas/`:
- `services/api/schemas/user.schema.ts` — `User`, `Friend`, `OnlineStatus` and related Zod schemas
- `services/api/schemas/chat.schema.ts` — `Message`, `MessageType`, `Conversation` and related Zod schemas
- `services/api/schemas/gasp.schema.ts` — `Gasp`, `GaspStatus`, `Reaction`, `ApiGasp`, `ApiPendingGasp`, `ApiReaction` and related Zod schemas
- `services/api/schemas/common.schema.ts` — Shared primitive schemas (pagination, IDs, etc.)

`types/user.ts`, `types/chat.ts`, and `types/gasp.ts` have been deleted. The only remaining file in `types/` is:
- `types/navigation.ts` — Expo Router typed route params

Backend API types (`Api*` prefixed) are validated at the API boundary by Zod schemas and transformed into frontend types in services/hooks before reaching components.

## Known Gotchas

1. **Two Firebase packages**: `@react-native-firebase/*` for native auth, `firebase` JS SDK for Storage. Don't mix them — auth uses the native module, storage uses the JS SDK.
2. **No test setup**: There's no test runner configured. `package.json` has no test script.
3. **Expo prebuild required**: Native modules (`@react-native-firebase`, `expo-camera`, etc.) require a dev client — Expo Go won't work for full functionality.
4. **Socket listeners are global**: Registered once in root layout, not per-screen. Individual screens should NOT register their own socket listeners for events already handled globally.
5. **Token refresh race**: The Axios interceptor reads token from `authStore.getState()` synchronously. If multiple 401s fire simultaneously, only the first triggers refresh.
6. **`constants/colors.ts` vs `tailwind.config.js`**: Both define the color palette. Tailwind classes use `tailwind.config.js` tokens; JS/StyleSheet code should use `constants/colors.ts`. Keep them in sync.

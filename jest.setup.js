// ── Pre-evaluate expo/src/winter lazy globals ─────────────────────────
// jest 30 introduced isInsideTestCode tracking. After the last test in a suite,
// jest calls leaveTestCode() setting isInsideTestCode=false. If any lazy global
// installed by expo/src/winter fires for the first time AFTER that (e.g. during
// GC or module teardown), the require() inside the getter throws. We force-
// evaluate all those globals right here, while isInsideTestCode is still
// undefined (permissive), so the getters have already resolved before tests run.
try { void global.structuredClone; } catch (_) {}
try { void global.__ExpoImportMetaRegistry; } catch (_) {}
try { void global.TextDecoder; } catch (_) {}
try { void global.TextDecoderStream; } catch (_) {}
try { void global.TextEncoderStream; } catch (_) {}
try { void global.URL; } catch (_) {}
try { void global.URLSearchParams; } catch (_) {}

// ── Mock expo-secure-store ───────────────────────────────────────────
const secureStoreData = {};
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn((key) => Promise.resolve(secureStoreData[key] ?? null)),
  setItemAsync: jest.fn((key, value) => {
    secureStoreData[key] = value;
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key) => {
    delete secureStoreData[key];
    return Promise.resolve();
  }),
}));

// ── Mock @react-native-firebase/auth ─────────────────────────────────
jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: { uid: 'firebase-uid-123' } })),
  signOut: jest.fn(() => Promise.resolve()),
}));

// ── Mock @react-native-firebase/storage ──────────────────────────────
jest.mock('@react-native-firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  putFile: jest.fn(),
  getDownloadURL: jest.fn(),
}));

// ── Mock socket.io-client ────────────────────────────────────────────
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    connected: false,
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    removeAllListeners: jest.fn(),
    connect: jest.fn(),
  })),
}));

// ── Mock @sentry/react-native ────────────────────────────────────────
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
  withScope: jest.fn((callback) => callback({ setExtra: jest.fn() })),
}));

// ── Mock expo-haptics ────────────────────────────────────────────────
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Heavy: 'heavy', Medium: 'medium', Light: 'light' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// ── Mock react-native-reanimated ─────────────────────────────────────
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// ── Mock react-native-gesture-handler ────────────────────────────────
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    GestureHandlerRootView: View,
    GestureDetector: View,
    Gesture: {
      LongPress: () => ({
        minDuration: () => ({
          onStart: () => ({
            onEnd: () => ({}),
          }),
        }),
      }),
    },
  };
});

// ── Suppress noisy warnings in tests ─────────────────────────────────
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Reanimated')) return;
  originalWarn(...args);
};

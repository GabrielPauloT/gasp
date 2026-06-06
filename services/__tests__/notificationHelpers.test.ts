import {
  resolveIndicatorColor,
  computeElapsedFraction,
  resolveRingColor,
  deriveInboxPulseState,
} from '@/services/notificationHelpers';

describe('resolveIndicatorColor', () => {
  it('returns purple for chat', () => {
    expect(resolveIndicatorColor('chat')).toBe('#7C3AED');
  });

  it('returns red for gasp', () => {
    expect(resolveIndicatorColor('gasp')).toBe('#EF4444');
  });

  it('returns cyan for reaction', () => {
    expect(resolveIndicatorColor('reaction')).toBe('#06B6D4');
  });
});

describe('computeElapsedFraction', () => {
  it('returns 0 when no time has elapsed', () => {
    const now = Date.now();
    const createdAt = new Date(now).toISOString();
    expect(computeElapsedFraction(createdAt, now)).toBe(0);
  });

  it('returns 0.5 at 12 hours elapsed', () => {
    const now = Date.now();
    const createdAt = new Date(now - 12 * 60 * 60 * 1000).toISOString();
    expect(computeElapsedFraction(createdAt, now)).toBeCloseTo(0.5);
  });

  it('returns 1.0 at 24 hours elapsed', () => {
    const now = Date.now();
    const createdAt = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    expect(computeElapsedFraction(createdAt, now)).toBe(1.0);
  });

  it('clamps to 1.0 beyond 24 hours', () => {
    const now = Date.now();
    const createdAt = new Date(now - 48 * 60 * 60 * 1000).toISOString();
    expect(computeElapsedFraction(createdAt, now)).toBe(1.0);
  });

  it('clamps to 0 for future createdAt', () => {
    const now = Date.now();
    const createdAt = new Date(now + 1000).toISOString();
    expect(computeElapsedFraction(createdAt, now)).toBe(0);
  });
});

describe('resolveRingColor', () => {
  it('returns purple when more than 1 hour remains', () => {
    expect(resolveRingColor(0.5)).toBe('#7C3AED');
  });

  it('returns purple just below the 23/24 threshold', () => {
    expect(resolveRingColor(22 / 24)).toBe('#7C3AED');
  });

  it('returns red at exactly the 23/24 threshold', () => {
    expect(resolveRingColor(23 / 24)).toBe('#EF4444');
  });

  it('returns red when nearly expired', () => {
    expect(resolveRingColor(0.99)).toBe('#EF4444');
  });

  it('returns red at 1.0 (expired)', () => {
    expect(resolveRingColor(1.0)).toBe('#EF4444');
  });
});

describe('deriveInboxPulseState', () => {
  it('returns false for empty array', () => {
    expect(deriveInboxPulseState([])).toBe(false);
  });

  it('returns true for non-empty array', () => {
    expect(deriveInboxPulseState([{ id: '1' }])).toBe(true);
  });
});

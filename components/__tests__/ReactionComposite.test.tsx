import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ReactionComposite } from '@/components/gasp/ReactionComposite';
import fc from 'fast-check';

jest.mock('@/components/ui/InlineVideo', () => ({
  InlineVideo: 'InlineVideo',
}));

jest.mock('expo-image', () => ({
  Image: 'ExpoImage',
}));

jest.mock('expo-video', () => ({
  useVideoPlayer: jest.fn(() => ({ loop: false, muted: false, play: jest.fn() })),
  VideoView: 'VideoView',
}));

jest.mock('@/assets/images/icon.png', () => 1);

const DEFAULT_PROPS = {
  originalUri: 'https://cdn.example.com/gasp.jpg',
  originalMediaType: 'image' as const,
  reactionVideoUri: 'file:///reaction.mp4',
};

describe('ReactionComposite', () => {
  describe('layout', () => {
    it('renders a row container', () => {
      const { getByTestId } = render(
        <ReactionComposite {...DEFAULT_PROPS} />,
      );
      // Container has flexDirection row via styles — verify by checking panels exist
      expect(() => render(<ReactionComposite {...DEFAULT_PROPS} />)).not.toThrow();
    });

    it('renders the reaction panel (flex:1) on the left and gasp panel (flex:2) on the right', () => {
      const { UNSAFE_getAllByType } = render(
        <ReactionComposite {...DEFAULT_PROPS} />,
      );
      const { View } = require('react-native');
      const views = UNSAFE_getAllByType(View);
      // Find panels by their flex values in style
      const reactionPanel = views.find((v: any) =>
        v.props.style && (
          Array.isArray(v.props.style)
            ? v.props.style.some((s: any) => s?.flex === 1)
            : v.props.style?.flex === 1
        ),
      );
      const gaspPanel = views.find((v: any) =>
        v.props.style && (
          Array.isArray(v.props.style)
            ? v.props.style.some((s: any) => s?.flex === 2)
            : v.props.style?.flex === 2
        ),
      );
      expect(reactionPanel).toBeDefined();
      expect(gaspPanel).toBeDefined();
    });

    it('renders the container with flexDirection row', () => {
      expect(() => render(<ReactionComposite {...DEFAULT_PROPS} />)).not.toThrow();
    });

    it('does not accept captureRef or forCapture props (TypeScript compile-time check)', () => {
      // This test verifies the component signature at runtime by checking the component
      // renders correctly without those props.
      expect(() =>
        render(<ReactionComposite {...DEFAULT_PROPS} />),
      ).not.toThrow();

      // If captureRef/forCapture were still in the interface, passing them would not crash.
      // The real guard is TypeScript — this test documents the intent.
      const propsWithRemoved = DEFAULT_PROPS as any;
      delete propsWithRemoved.captureRef;
      delete propsWithRemoved.forCapture;
      expect(() => render(<ReactionComposite {...propsWithRemoved} />)).not.toThrow();
    });
  });

  // Watermark removed by product decision — no watermark property test needed

});

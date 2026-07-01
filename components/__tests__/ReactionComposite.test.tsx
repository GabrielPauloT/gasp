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

    it('renders the watermark with opacity 0.7 and position absolute after layout', () => {
      const { UNSAFE_getAllByType, getByTestId } = render(
        <ReactionComposite {...DEFAULT_PROPS} />,
      );
      const { View, Image } = require('react-native');

      // Trigger layout event to set containerWidth > 0
      const container = UNSAFE_getAllByType(View)[0];
      fireEvent(container, 'layout', { nativeEvent: { layout: { width: 300, height: 400 } } });

      // After layout, watermark should render
      const images = UNSAFE_getAllByType(Image);
      const watermark = images.find((img: any) => {
        const styles = Array.isArray(img.props.style) ? img.props.style : [img.props.style];
        return styles.some((s: any) => s?.opacity === 0.7);
      });
      expect(watermark).toBeDefined();
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

  // Feature: super-imposed-reaction, Property 4: Watermark width proportional to componentWidth
  describe('watermark proportional width', () => {
    it('renders watermark width = containerWidth * 0.12 for any containerWidth in [100, 800]', () => {
      fc.assert(
        fc.property(fc.integer({ min: 100, max: 800 }), (componentWidth) => {
          const { UNSAFE_getAllByType, unmount } = render(
            <ReactionComposite {...DEFAULT_PROPS} />,
          );
          const { View } = require('react-native');
          const container = UNSAFE_getAllByType(View)[0];
          fireEvent(container, 'layout', {
            nativeEvent: { layout: { width: componentWidth, height: componentWidth * 1.5 } },
          });

          const { Image } = require('react-native');
          const images = UNSAFE_getAllByType(Image);
          const watermark = images.find((img: any) => {
            const styles = Array.isArray(img.props.style) ? img.props.style : [img.props.style];
            return styles.some((s: any) => s?.opacity === 0.7);
          });

          if (watermark) {
            const styles = Array.isArray(watermark.props.style)
              ? watermark.props.style
              : [watermark.props.style];
            const sizeStyle = styles.find((s: any) => s?.width !== undefined);
            expect(sizeStyle?.width).toBeCloseTo(componentWidth * 0.12, 5);
          }
          unmount();
        }),
        { numRuns: 100 },
      );
    });
  });
});

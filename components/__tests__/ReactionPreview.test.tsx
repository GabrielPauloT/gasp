import React from 'react';
import { render } from '@testing-library/react-native';
import { ReactionPreview } from '@/components/gasp/ReactionPreview';

jest.mock('@/components/gasp/ReactionComposite', () => ({
  ReactionComposite: 'ReactionComposite',
}));

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

const DEFAULT_PROPS = {
  originalImageUri: 'https://cdn.example.com/gasp.jpg',
  originalMediaType: 'image' as const,
  reactionVideoUri: 'file:///reaction.mp4',
  senderName: 'Alice',
  onSend: jest.fn(),
  onDiscard: jest.fn(),
};

describe('ReactionPreview', () => {
  describe('Send button states', () => {
    it('shows Send icon and enables button when isSending is false (default)', () => {
      const { getByRole, queryByTestId, UNSAFE_queryByType } = render(
        <ReactionPreview {...DEFAULT_PROPS} isSending={false} />,
      );

      const sendButton = getByRole('button', { name: 'Send reaction' });
      expect(sendButton.props.accessibilityState?.disabled).toBeFalsy();

      // ActivityIndicator should NOT be present
      const { ActivityIndicator } = require('react-native');
      const indicator = UNSAFE_queryByType(ActivityIndicator);
      expect(indicator).toBeNull();
    });

    it('shows Send icon and enables button when isSending prop is omitted', () => {
      const { getByRole, UNSAFE_queryByType } = render(
        <ReactionPreview {...DEFAULT_PROPS} />,
      );

      const sendButton = getByRole('button', { name: 'Send reaction' });
      expect(sendButton.props.accessibilityState?.disabled).toBeFalsy();

      const { ActivityIndicator } = require('react-native');
      expect(UNSAFE_queryByType(ActivityIndicator)).toBeNull();
    });

    it('shows ActivityIndicator and disables button when isSending is true', () => {
      const { getByRole, UNSAFE_getByType } = render(
        <ReactionPreview {...DEFAULT_PROPS} isSending={true} />,
      );

      const sendButton = getByRole('button', { name: 'Send reaction' });
      expect(sendButton.props.accessibilityState?.disabled).toBe(true);

      // ActivityIndicator should be present
      const { ActivityIndicator } = require('react-native');
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it('send button does not call onSend when isSending is true', () => {
      const onSend = jest.fn();
      const { getByRole } = render(
        <ReactionPreview {...DEFAULT_PROPS} onSend={onSend} isSending={true} />,
      );

      const sendButton = getByRole('button', { name: 'Send reaction' });
      // Button is disabled, so pressing it should not fire onSend
      expect(sendButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('send button applies reduced opacity style when isSending is true', () => {
      const { getByRole } = render(
        <ReactionPreview {...DEFAULT_PROPS} isSending={true} />,
      );

      const sendButton = getByRole('button', { name: 'Send reaction' });
      const flatStyle = Array.isArray(sendButton.props.style)
        ? Object.assign({}, ...sendButton.props.style.filter(Boolean))
        : sendButton.props.style;

      expect(flatStyle?.opacity).toBe(0.6);
    });
  });
});

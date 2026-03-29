import { View } from 'react-native';
import { Play } from 'lucide-react-native';
import { SectionHeader } from './SectionHeader';
import { ReactionItem } from './ReactionItem';
import { openReactionResult } from '@/services/navigation';
import type { Reaction } from '@/services/api/schemas/gasp.schema';

interface ReactionSectionProps {
  reactions: Reaction[];
}

export function ReactionSection({ reactions }: ReactionSectionProps) {
  const handlePress = (reaction: Reaction) => {
    openReactionResult({
      reactionVideoUri: reaction.reactionVideoUri,
      originalImageUri: reaction.originalImageUri,
      senderName: reaction.reactorName,
      gaspId: reaction.gaspId,
    });
  };

  return (
    <View>
      <SectionHeader
        icon={<Play size={16} color="#A855F7" />}
        title="REACTIONS"
        count={reactions.length}
        badgeColor="#A855F7"
      />
      {reactions.map((reaction) => (
        <ReactionItem
          key={reaction.id}
          reaction={reaction}
          onPress={handlePress}
        />
      ))}
    </View>
  );
}

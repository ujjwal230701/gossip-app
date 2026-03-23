import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type GossipCardProps = {
  content: string;
  distanceLabel: string;
  timeAgo: string;
  reactions: {
    fire: number;
    laugh: number;
    surprised: number;
  };
  onFlagPress?: () => void;
};

function ReactionPill({ emoji, count }: { emoji: string; count: number }) {
  return (
    <View style={styles.reactionPill}>
      <ThemedText style={styles.reactionText}>
        {emoji} {count}
      </ThemedText>
    </View>
  );
}

export function GossipCard({
  content,
  distanceLabel,
  timeAgo,
  reactions,
  onFlagPress,
}: GossipCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const cardBackground = colorScheme === 'dark' ? '#1D1712' : '#FFF7EE';
  const borderColor = colorScheme === 'dark' ? '#3E2A17' : '#FFD6AD';

  return (
    <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
      <View style={styles.headerRow}>
        <ThemedText style={styles.metaText}>{distanceLabel}</ThemedText>
        <ThemedText style={styles.metaDot}>•</ThemedText>
        <ThemedText style={styles.metaText}>{timeAgo}</ThemedText>

        <Pressable onPress={onFlagPress} style={styles.flagButton} accessibilityRole="button">
          <ThemedText style={[styles.flagText, { color: Colors[colorScheme].tint }]}>Flag</ThemedText>
        </Pressable>
      </View>

      <ThemedText style={styles.contentText}>{content}</ThemedText>

      <View style={styles.reactionRow}>
        <ReactionPill emoji="🔥" count={reactions.fire} />
        <ReactionPill emoji="😂" count={reactions.laugh} />
        <ReactionPill emoji="😮" count={reactions.surprised} />
      </View>
    </View>
  );
}

export function GossipCardSkeleton() {
  const colorScheme = useColorScheme() ?? 'light';
  const skeletonBg = colorScheme === 'dark' ? '#2B2118' : '#F7E3CF';
  const cardBackground = colorScheme === 'dark' ? '#1D1712' : '#FFF7EE';
  const borderColor = colorScheme === 'dark' ? '#3E2A17' : '#FFD6AD';

  return (
    <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
      <View style={styles.headerRow}>
        <View style={[styles.skeletonLine, { width: 92, backgroundColor: skeletonBg }]} />
        <View style={[styles.skeletonLine, { width: 68, backgroundColor: skeletonBg }]} />
      </View>
      <View style={[styles.skeletonLine, styles.contentSkeletonLine, { backgroundColor: skeletonBg }]} />
      <View style={[styles.skeletonLine, styles.contentSkeletonLine, { width: '75%', backgroundColor: skeletonBg }]} />
      <View style={styles.reactionRow}>
        <View style={[styles.skeletonPill, { backgroundColor: skeletonBg }]} />
        <View style={[styles.skeletonPill, { backgroundColor: skeletonBg }]} />
        <View style={[styles.skeletonPill, { backgroundColor: skeletonBg }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    opacity: 0.78,
    fontSize: 13,
  },
  metaDot: {
    opacity: 0.6,
    fontSize: 12,
    lineHeight: 14,
  },
  flagButton: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  flagText: {
    fontWeight: '600',
    fontSize: 13,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 22,
  },
  reactionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  reactionPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#C98F5A',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  reactionText: {
    fontSize: 13,
    lineHeight: 16,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 8,
  },
  contentSkeletonLine: {
    height: 14,
    width: '100%',
  },
  skeletonPill: {
    width: 58,
    height: 28,
    borderRadius: 999,
  },
});

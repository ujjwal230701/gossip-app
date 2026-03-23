import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { GossipCard, GossipCardSkeleton } from '@/components/gossip-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { supabase } from '@/constants/supabase';
import { useColorScheme } from '@/hooks/use-color-scheme';

type FeedRow = {
  id: string;
  content: string;
  created_at: string;
  distance_meters: number | null;
  fire_count?: number | null;
  laugh_count?: number | null;
  surprised_count?: number | null;
  reaction_fire_count?: number | null;
  reaction_laugh_count?: number | null;
  reaction_surprised_count?: number | null;
};

function formatDistance(distanceMeters: number | null): string {
  if (distanceMeters === null || Number.isNaN(distanceMeters)) {
    return 'Nearby';
  }

  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)}m away`;
  }

  return `${(distanceMeters / 1000).toFixed(1)}km away`;
}

function formatTimeAgo(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const deltaSeconds = Math.max(1, Math.floor((now - then) / 1000));

  if (deltaSeconds < 60) return `${deltaSeconds}s ago`;

  const minutes = Math.floor(deltaSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function FeedScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const [posts, setPosts] = useState<FeedRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchFeedPosts = useCallback(async (isPullRefresh = false) => {
    if (isPullRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setFetchError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setPermissionError('Location permission is needed to show nearby gossip. You can enable it in app settings.');
        setPosts([]);
        return;
      }

      setPermissionError(null);

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { data, error } = await supabase.rpc('get_local_feed_posts', {
        p_latitude: location.coords.latitude,
        p_longitude: location.coords.longitude,
        p_limit: 50,
        p_offset: 0,
      });

      if (error) {
        throw error;
      }

      setPosts((data ?? []) as FeedRow[]);
    } catch (error) {
      setFetchError('Unable to load nearby gossip right now. Pull to refresh and try again.');
      setPosts([]);
      console.error('Feed fetch failed', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedPosts().catch((error) => {
      console.error('Initial feed fetch failed', error);
    });
  }, [fetchFeedPosts]);

  const skeletonItems = useMemo(() => ['s1', 's2', 's3'], []);

  const contentContainerStyle = useMemo(
    () => ({
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 28,
      gap: 12,
      backgroundColor: Colors[colorScheme].background,
      flexGrow: 1,
    }),
    [colorScheme]
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Feed</ThemedText>
        <ThemedText style={styles.subtitle}>Nearby gossip from within 5km</ThemedText>
      </View>

      {permissionError ? (
        <View style={styles.centerState}>
          <ThemedText type="subtitle">Location Permission Needed</ThemedText>
          <ThemedText style={styles.stateText}>{permissionError}</ThemedText>
        </View>
      ) : isLoading ? (
        <FlatList
          data={skeletonItems}
          keyExtractor={(item) => item}
          renderItem={() => <GossipCardSkeleton />}
          contentContainerStyle={contentContainerStyle}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <GossipCard
              content={item.content}
              distanceLabel={formatDistance(item.distance_meters)}
              timeAgo={formatTimeAgo(item.created_at)}
              reactions={{
                fire: item.fire_count ?? item.reaction_fire_count ?? 0,
                laugh: item.laugh_count ?? item.reaction_laugh_count ?? 0,
                surprised: item.surprised_count ?? item.reaction_surprised_count ?? 0,
              }}
              onFlagPress={() => {
                // Placeholder until flag mutation flow is wired.
                console.log(`Flag pressed for post ${item.id}`);
              }}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchFeedPosts(true)}
              tintColor={Colors[colorScheme].tint}
              colors={[Colors[colorScheme].tint]}
            />
          }
          ListEmptyComponent={
            <View style={styles.centerState}>
              <ThemedText type="subtitle">{fetchError ? 'Could not load feed' : 'No gossip nearby yet'}</ThemedText>
              <ThemedText style={styles.stateText}>
                {fetchError ?? 'There are no active posts within 5km right now. Be the first to post.'}
              </ThemedText>
            </View>
          }
          contentContainerStyle={contentContainerStyle}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
    gap: 6,
  },
  subtitle: {
    opacity: 0.8,
  },
  centerState: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  stateText: {
    textAlign: 'center',
    opacity: 0.85,
  },
});

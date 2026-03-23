import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function PostScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Post</ThemedText>
      <ThemedText>Create anonymous gossip for nearby users.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 10,
  },
});

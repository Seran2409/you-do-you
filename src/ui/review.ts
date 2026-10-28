import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';

/**
 * Asks for a store rating at a happy moment (level-up from level 3 on). Apple and Google decide
 * themselves whether the dialog appears and limit how often, so calling it here is safe.
 */
export async function maybeAskForReview(level: number): Promise<void> {
  if (Platform.OS === 'web' || level < 3) return;
  try {
    if (await StoreReview.hasAction()) await StoreReview.requestReview();
  } catch {
    // Rating prompts are a bonus; never block the game for them.
  }
}

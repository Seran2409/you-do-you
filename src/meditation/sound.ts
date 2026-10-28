import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

let player: AudioPlayer | null = null;

/** Soft singing-bowl gong at the start and end of a session. */
export async function playGong(): Promise<void> {
  try {
    await setAudioModeAsync({ playsInSilentMode: true });
    player ??= createAudioPlayer(require('../../assets/sounds/gong.wav'));
    await player.seekTo(0);
    player.play();
  } catch {
    // Sound is a nice extra; a session never fails because of it.
  }
}

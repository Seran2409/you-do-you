/* Native: KeyboardAvoidingView and automaticallyAdjustKeyboardInsets keep fields visible, so nothing to do here. */
import type { VisibleArea } from './keyboard';

export type { VisibleArea };

export function useVisibleArea(): VisibleArea | null {
  return null;
}

export function useKeepFocusedFieldVisible(): void {}

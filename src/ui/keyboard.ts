/*
 * Web: keep text fields visible above the on-screen keyboard.
 * iOS Safari slides the keyboard over the page instead of shrinking it, so bottom-anchored overlays
 * end up behind it. The visual viewport tells us which part of the page is still visible.
 * Native platforms resolve keyboard.native.ts instead (KeyboardAvoidingView handles it there).
 */
import { useEffect, useState } from 'react';

export interface VisibleArea {
  top: number;
  height: number;
  /** Height covered by the keyboard at the bottom of the window. */
  keyboard: number;
}

/** The visible part of the page while the keyboard (or pinch zoom) shrinks it; null when everything is visible. */
export function useVisibleArea(): VisibleArea | null {
  const [area, setArea] = useState<VisibleArea | null>(null);
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (!vv) return;
    const update = () => {
      const keyboard = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      setArea(keyboard > 40 || vv.offsetTop > 1 ? { top: vv.offsetTop, height: vv.height, keyboard } : null);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);
  return area;
}

/** Once the keyboard is up, scroll the focused field into the middle of what is still visible. */
export function useKeepFocusedFieldVisible(): void {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el || !(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
      clearTimeout(timer);
      // The keyboard animates in for about 300 ms; scroll after it has settled.
      timer = setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 320);
    };
    document.addEventListener('focusin', onFocus);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('focusin', onFocus);
    };
  }, []);
}

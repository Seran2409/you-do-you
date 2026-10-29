import { makeMutable } from 'react-native-reanimated';

/** Scroll offset of the visible page. The top bar shows its frosted glass only once content scrolls under it. */
export const pageScroll = makeMutable(0);

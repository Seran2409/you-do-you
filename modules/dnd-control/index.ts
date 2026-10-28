import { requireOptionalNativeModule } from 'expo';

/** Native side only exists in Android builds; null on iOS, web and in Expo Go. */
export interface DndControl {
  hasAccess(): boolean;
  openAccessSettings(): void;
  getFilter(): number;
  setFilter(filter: number): boolean;
}

export default requireOptionalNativeModule<DndControl>('DndControl');

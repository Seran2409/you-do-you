import { Slot } from 'expo-router';
import { View } from 'react-native';
import { ReminderSync } from '../../features/shell/ReminderSync';
import { TabBar, TopBar } from '../../features/shell/Shell';
import { WelcomeGate } from '../../features/shell/Welcome';
import { lastTouch } from '../../ui/overlays';

export default function TabsLayout() {
  return (
    <View
      style={{ flex: 1 }}
      onTouchStart={(e) => {
        lastTouch.x = e.nativeEvent.pageX;
        lastTouch.y = e.nativeEvent.pageY;
      }}
    >
      <Slot />
      <TopBar />
      <TabBar />
      <WelcomeGate />
      <ReminderSync />
    </View>
  );
}

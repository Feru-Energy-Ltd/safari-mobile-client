import { Text, View } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';

export default function TabOneScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-[20px] font-bold dark:text-white">Tab One</Text>
      <View
        className="my-[30px] h-[1px] w-[80%] bg-[#eee] dark:bg-white/10"
      />
      <EditScreenInfo path="app/(tabs)/index.tsx" />
    </View>
  );
}

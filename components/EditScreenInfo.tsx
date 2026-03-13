import React from 'react';
import { Text, View } from 'react-native';

import { MonoText } from './StyledText';

export default function EditScreenInfo({ path }: { path: string }) {
  return (
    <View>
      <View className="items-center mx-[50px]">
        <Text className="text-[17px] leading-[24px] text-center text-black/80 dark:text-white/80">
          Open up the code for this screen:
        </Text>

        <View className="rounded-[3px] px-1 my-[7px] bg-black/5 dark:bg-white/5">
          <MonoText>{path}</MonoText>
        </View>

        <Text className="text-[17px] leading-[24px] text-center text-black/80 dark:text-white/80">
          Change any of the text, save the file, and your app will automatically update.
        </Text>
      </View>
    </View>
  );
}

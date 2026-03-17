import { Stack } from "expo-router";
import { StatusBar } from "react-native";

export default function OnboardingLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="screen-1" />
        <Stack.Screen name="screen-2" />
      </Stack>
      <StatusBar barStyle={"default"} />
    </>
  );
}

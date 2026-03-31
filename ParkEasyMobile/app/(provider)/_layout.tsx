import { Stack } from 'expo-router';

export default function ProviderRootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen 
        name="add-facility" 
        options={{ 
          presentation: 'modal'
        }} 
      />
      <Stack.Screen name="earnings" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="facility/[id]/index" />
      <Stack.Screen name="facility/[id]/edit" />
    </Stack>
  );
}

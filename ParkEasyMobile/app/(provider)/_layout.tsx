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
      <Stack.Screen 
        name="manual-entry" 
        options={{ 
          presentation: 'modal',
          headerShown: true,
          headerTitle: 'Offline Check-in',
          headerBlurEffect: 'prominent'
        }} 
      />
      <Stack.Screen name="facility/[id]/index" />
      <Stack.Screen name="facility/[id]/edit" />
    </Stack>
  );
}

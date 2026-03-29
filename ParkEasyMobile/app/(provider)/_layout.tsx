import { Stack } from 'expo-router';

export default function ProviderRootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="add-facility" 
        options={{ 
          title: 'Register Facility',
          presentation: 'modal',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="earnings" 
        options={{ 
          headerShown: true,
          headerTitle: 'Earnings Report',
          headerBackTitle: 'Back'
        }} 
      />
    </Stack>
  );
}

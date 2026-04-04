import React from 'react';
import { View, Text } from 'react-native';

export const MapView = ({ style, ...props }: any) => (
  <View 
    {...props} 
    style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' }]}
    accessibilityRole="summary"
    aria-label="Map preview"
  >
    <Text style={{ color: '#64748b', fontWeight: '600' }}>Map preview not available on web</Text>
  </View>
);

export const Marker = () => (
  <View 
    style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#3b82f6' }} 
    accessibilityLabel="Location pointer"
  />
);
export const PROVIDER_GOOGLE = null;
export default MapView;

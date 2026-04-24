import * as React from 'react';
import { ViewProps } from 'react-native';

export const PROVIDER_GOOGLE: string | null;

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapViewProps extends ViewProps {
  region?: Region;
  initialRegion?: Region;
  onRegionChange?: (region: Region) => void;
  onRegionChangeComplete?: (region: Region) => void;
  onPress?: (event: any) => void;
  provider?: string | null;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  customMapStyle?: any[];
  children?: React.ReactNode;
}

export interface MarkerProps extends ViewProps {
  coordinate: { latitude: number; longitude: number };
  title?: string;
  description?: string;
  draggable?: boolean;
  onDragEnd?: (event: any) => void;
  onPress?: (event: any) => void;
  children?: React.ReactNode;
}

export const MapView: React.ForwardRefExoticComponent<MapViewProps & React.RefAttributes<any>>;
export const Marker: React.ComponentType<MarkerProps>;
export default MapView;

import { createNavigationContainerRef } from '@react-navigation/native';

/**
 * Global navigation ref — allows navigation from outside React components
 * (e.g. notification tap handlers, useFlicks subscription callbacks).
 *
 * Usage:
 *   import { navigationRef } from '../lib/navigationRef';
 *   if (navigationRef.isReady()) navigationRef.navigate('Screen', { params });
 *
 * Assigned to <NavigationContainer ref={navigationRef}> in App.js.
 */
export const navigationRef = createNavigationContainerRef();

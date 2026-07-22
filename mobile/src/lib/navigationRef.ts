/**
 * Global navigation ref so non-React code (e.g. a push-notification tap
 * handler) can navigate without a component-scoped navigation prop.
 */

import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

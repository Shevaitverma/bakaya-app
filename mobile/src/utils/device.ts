/**
 * Device information utilities
 */

import { Platform } from 'react-native';

export const getDeviceInfo = () => {
  const osVersion =
    typeof Platform.Version === 'string'
      ? Platform.Version
      : Platform.Version.toString();

  return {
    os: Platform.OS === 'ios' ? 'ios' : 'android',
    osVersion,
    deviceId: `device-${Platform.OS}-${Date.now()}`,
  };
};

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.prismaticveil.game',
  appName: 'The Prismatic Veil',
  webDir: 'dist-capacitor',
  bundledWebRuntime: false,
  ios: {
    contentInset: 'automatic'
  },
  android: {
    allowMixedContent: false
  }
};

export default config;

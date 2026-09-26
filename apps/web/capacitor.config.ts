import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.perfectwisdomschool.app',
  appName: 'Perfect Wisdom School',
  webDir: 'dist',
  server: {
    url: 'https://perfectwisdomschool.onrender.com',
    cleartext: false,
    allowNavigation: ['perfectwisdomschool.onrender.com'],
  },
};

export default config;

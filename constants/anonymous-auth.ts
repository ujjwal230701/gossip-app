import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/constants/supabase';

const DEVICE_UUID_STORAGE_KEY = 'anon_device_uuid';

async function resolveStableDeviceId(): Promise<string | null> {
  if (Platform.OS === 'android' && Application.androidId) {
    return Application.androidId;
  }

  if (Platform.OS === 'ios') {
    return Application.getIosIdForVendorAsync();
  }

  return null;
}

export async function getOrCreateDeviceUuid(): Promise<string> {
  const storedDeviceUuid = await SecureStore.getItemAsync(DEVICE_UUID_STORAGE_KEY);
  if (storedDeviceUuid) {
    return storedDeviceUuid;
  }

  const stableDeviceId = await resolveStableDeviceId();
  const deviceUuid = stableDeviceId ?? Crypto.randomUUID();

  await SecureStore.setItemAsync(DEVICE_UUID_STORAGE_KEY, deviceUuid);
  return deviceUuid;
}

export async function signInAnonymouslyWithDevice(): Promise<{
  deviceUuid: string;
  session: Session | null;
}> {
  const deviceUuid = await getOrCreateDeviceUuid();

  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session) {
    return { deviceUuid, session: sessionData.session };
  }

  const { data, error } = await supabase.auth.signInAnonymously({
    options: {
      data: {
        device_uuid: deviceUuid,
      },
    },
  });

  if (error) {
    throw error;
  }

  return { deviceUuid, session: data.session };
}

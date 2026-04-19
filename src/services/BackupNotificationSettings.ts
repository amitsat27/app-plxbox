import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'backup_notification_settings';

export type BackupNotificationType = 'vault' | 'data';

export type BackupNotificationSettings = {
  vaultBackupEnabled: boolean;
  dataBackupEnabled: boolean;
};

const DEFAULT_SETTINGS: BackupNotificationSettings = {
  vaultBackupEnabled: true,
  dataBackupEnabled: true,
};

export async function loadBackupNotificationSettings(): Promise<BackupNotificationSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(raw);
    return {
      vaultBackupEnabled: parsed?.vaultBackupEnabled ?? true,
      dataBackupEnabled: parsed?.dataBackupEnabled ?? true,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveBackupNotificationSettings(next: BackupNotificationSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export async function setBackupNotificationEnabled(type: BackupNotificationType, enabled: boolean): Promise<BackupNotificationSettings> {
  const current = await loadBackupNotificationSettings();
  const next: BackupNotificationSettings = {
    ...current,
    vaultBackupEnabled: type === 'vault' ? enabled : current.vaultBackupEnabled,
    dataBackupEnabled: type === 'data' ? enabled : current.dataBackupEnabled,
  };
  await saveBackupNotificationSettings(next);
  return next;
}

export async function canSendBackupNotification(type: BackupNotificationType): Promise<boolean> {
  const settings = await loadBackupNotificationSettings();
  return type === 'vault' ? settings.vaultBackupEnabled : settings.dataBackupEnabled;
}

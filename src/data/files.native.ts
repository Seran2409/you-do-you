/* Export/import of the JSON backup on Android/iOS: write to cache and open the share sheet, read via the document picker. */
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export function exportFileName(today: string) {
  return `you-do-you-${today}.json`;
}

export async function saveJson(name: string, json: string): Promise<void> {
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: name, UTI: 'public.json' });
}

export async function pickJson(): Promise<string | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.length) return null;
  return new File(res.assets[0].uri).text();
}

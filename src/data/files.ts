/* Export/import of the JSON backup on the web: download link and file input via the document picker. */
import * as DocumentPicker from 'expo-document-picker';

export function exportFileName(today: string) {
  return `you-do-you-${today}.json`;
}

export async function saveJson(name: string, json: string): Promise<void> {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Returns the file's text, or null if the user cancelled. */
export async function pickJson(): Promise<string | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'] });
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  if (a.file) return a.file.text();
  return (await fetch(a.uri)).text();
}

export async function fetchAPIKey(keyType: string) {
  const response = await fetch('/api/fetchAPIKeys');
  if (!response.ok) {
    return;
  }
  const data = await response.json();
  return data[keyType];
}

export async function fetchWithRetry(
  url: string,
  options: Record<string, string | Record<string, string>>,
  retries = 3,
  backoff = 300
): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        // check if response was successful, if not throw an error
        throw new Error(`HTTP status ${response.status}`);
      }

      const data = JSON.parse(await response.json());
      return data; // if response is successful, return the data
    } catch (error) {
      // check status codes, only retry on these specific errors
      if (
        i < retries - 1 &&
        ((error as Error).message.includes('500') ||
          (error as Error).message.includes('502') ||
          (error as Error).message.includes('503') ||
          (error as Error).message.includes('504'))
      ) {
        await new Promise((resolve) => setTimeout(resolve, backoff));
        // increase the backoff time for the next iteration (exponential backoff)
        backoff *= 2;
      } else {
        throw error; // if it's the last retry and still failing, throw the error
      }
    }
  }
}

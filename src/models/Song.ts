export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  durationSeconds: number;
  objectUrl: string;
  file: File | null;
}

export function createSong(
  title: string,
  artist: string,
  file: File | null,
  objectUrl: string = '',
  durationSeconds: number = 0
): Song {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = Math.floor(durationSeconds % 60);

  return {
    id: crypto.randomUUID(),
    title,
    artist,
    duration: `${minutes}:${seconds.toString().padStart(2, '0')}`,
    durationSeconds,
    objectUrl,
    file,
  };
}

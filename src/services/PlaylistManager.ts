import { TrackList } from '../core/TrackList';
import type { Song } from '../models/Song';
import { createSong } from '../models/Song';
import { AudioEngine } from './AudioEngine';

export type InsertPosition = 'head' | 'tail' | number;

/**
 * PlaylistManager — Fachada sobre TrackList para lógica de reproducción.
 * Aplica SRP: TrackList maneja la estructura, PlaylistManager la lógica musical.
 */
export class PlaylistManager {
  private playlist: TrackList<Song>;
  private audioEngine: AudioEngine;
  private currentIndex: number = -1;

  public onPlaylistChanged: (() => void) | null = null;
  public onSongChanged: ((song: Song | null, index: number) => void) | null = null;

  constructor(audioEngine: AudioEngine) {
    this.playlist = new TrackList<Song>();
    this.audioEngine = audioEngine;
    this.audioEngine.onEnded = () => this.next();
  }

  async addSong(file: File, title: string, artist: string, position: InsertPosition = 'tail'): Promise<void> {
    const objectUrl = URL.createObjectURL(file);
    const durationSeconds = await AudioEngine.getFileDuration(file);
    const song = createSong(title, artist, file, objectUrl, durationSeconds);

    if (position === 'head') {
      this.playlist.insertAtHead(song);
      if (this.currentIndex >= 0) this.currentIndex++;
    } else if (position === 'tail') {
      this.playlist.insertAtTail(song);
    } else {
      const idx = Math.max(0, Math.min(position, this.playlist.size));
      this.playlist.insertAt(idx, song);
      if (this.currentIndex >= idx) this.currentIndex++;
    }

    this.saveToLocalStorage();
    this.onPlaylistChanged?.();
  }

  removeSong(songId: string): void {
    const songs = this.playlist.toArray();
    const index = songs.findIndex((s) => s.id === songId);
    if (index === -1) return;

    const song = songs[index];
    if (song.objectUrl) URL.revokeObjectURL(song.objectUrl);
    this.playlist.removeAt(index);

    if (index === this.currentIndex) {
      this.currentIndex = -1;
      this.audioEngine.pause();
      this.onSongChanged?.(null, -1);
    } else if (index < this.currentIndex) {
      this.currentIndex--;
    }

    this.saveToLocalStorage();
    this.onPlaylistChanged?.();
  }

  moveForward(index: number): void { this.moveSongTo(index, index + 1); }
  moveBackward(index: number): void { this.moveSongTo(index, index - 1); }

  /** Mover canción de una posición a otra (Drag & Drop). */
  moveSongTo(fromIndex: number, toIndex: number): void {
    if (
      fromIndex < 0 || fromIndex >= this.playlist.size ||
      toIndex < 0 || toIndex >= this.playlist.size ||
      fromIndex === toIndex
    ) return;

    const song = this.playlist.removeAt(fromIndex);

    let playingId: string | undefined;
    if (this.currentIndex !== -1) {
      playingId = this.currentIndex === fromIndex
        ? song.id
        : this.playlist.getAt(this.currentIndex)?.id;
    }

    this.playlist.insertAt(toIndex, song);

    if (playingId) {
      this.currentIndex = this.playlist.toArray().findIndex(s => s.id === playingId);
    }

    this.saveToLocalStorage();
    this.onPlaylistChanged?.();
  }

  async playSong(index: number): Promise<void> {
    const song = this.playlist.getAt(index);
    if (!song) return;
    this.currentIndex = index;
    await this.audioEngine.play(song.objectUrl);
    this.onSongChanged?.(song, index);
    this.onPlaylistChanged?.();
  }

  async togglePlay(): Promise<void> {
    if (this.audioEngine.isPlaying) {
      this.audioEngine.pause();
    } else if (this.currentIndex >= 0) {
      await this.audioEngine.resume();
    } else if (this.playlist.size > 0) {
      await this.playSong(0);
    }
    this.onPlaylistChanged?.();
  }

  async next(): Promise<void> {
    if (this.playlist.size === 0) return;
    await this.playSong((this.currentIndex + 1) % this.playlist.size);
  }

  async previous(): Promise<void> {
    if (this.playlist.size === 0) return;
    await this.playSong(this.currentIndex <= 0 ? this.playlist.size - 1 : this.currentIndex - 1);
  }

  shuffle(): void {
    this.playlist.shuffle();
    this.currentIndex = -1;
    this.audioEngine.pause();
    this.onSongChanged?.(null, -1);
    this.saveToLocalStorage();
    this.onPlaylistChanged?.();
  }

  seek(time: number): void { this.audioEngine.seek(time); }

  get songs(): Song[] { return this.playlist.toArray(); }
  get currentSong(): Song | null { return this.playlist.getAt(this.currentIndex); }
  get currentSongIndex(): number { return this.currentIndex; }
  get isPlaying(): boolean { return this.audioEngine.isPlaying; }
  get size(): number { return this.playlist.size; }

  private saveToLocalStorage(): void {
    const metadata = this.songs.map((s) => ({ title: s.title, artist: s.artist, duration: s.duration }));
    localStorage.setItem('playlist-metadata', JSON.stringify(metadata));
  }
}


export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private audioElement: HTMLAudioElement;
  private frequencyData: Uint8Array = new Uint8Array(0);
  private isInitialized: boolean = false;
  private connectedElements: Set<HTMLAudioElement> = new Set();

  public onEnded: (() => void) | null = null;
  public onTimeUpdate: ((currentTime: number, duration: number) => void) | null = null;

  constructor() {
    this.audioElement = new Audio();
    this.audioElement.addEventListener('ended', () => this.onEnded?.());
    this.audioElement.addEventListener('timeupdate', () => {
      this.onTimeUpdate?.(this.audioElement.currentTime, this.audioElement.duration);
    });
  }

  private initContext(): void {
    if (this.isInitialized) return;
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.connect(this.audioContext.destination);
    this.isInitialized = true;
  }

  async play(objectUrl: string): Promise<void> {
    this.initContext();
    this.audioElement.src = objectUrl;

    if (!this.connectedElements.has(this.audioElement)) {
      this.sourceNode = this.audioContext!.createMediaElementSource(this.audioElement);
      this.sourceNode.connect(this.analyser!);
      this.connectedElements.add(this.audioElement);
    }

    if (this.audioContext!.state === 'suspended') await this.audioContext!.resume();
    await this.audioElement.play();
  }

  pause(): void { this.audioElement.pause(); }

  async resume(): Promise<void> {
    if (this.audioContext?.state === 'suspended') await this.audioContext.resume();
    await this.audioElement.play();
  }

  get isPlaying(): boolean { return !this.audioElement.paused; }
  get currentTime(): number { return this.audioElement.currentTime; }
  get duration(): number { return this.audioElement.duration || 0; }

  seek(time: number): void { this.audioElement.currentTime = time; }

  /** Datos de frecuencia completos para el visualizador */
  getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    this.analyser.getByteFrequencyData(this.frequencyData as any);
    return this.frequencyData;
  }

  /** Nivel de graves — promedio de bins 0-5 . */
  getBassLevel(): number {
    if (!this.analyser) return 0;
    this.analyser.getByteFrequencyData(this.frequencyData as any);
    let sum = 0;
    const range = Math.min(6, this.frequencyData.length);
    for (let i = 0; i < range; i++) sum += this.frequencyData[i];
    return sum / (range * 255);
  }

  /** Obtener duración de un archivo sin reproducirlo. */
  static getFileDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.addEventListener('loadedmetadata', () => { resolve(audio.duration); URL.revokeObjectURL(audio.src); });
      audio.addEventListener('error', () => resolve(0));
      audio.src = URL.createObjectURL(file);
    });
  }
}

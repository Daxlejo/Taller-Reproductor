export class TrackNode<T> {
  public data: T;
  public prev: TrackNode<T> | null;
  public next: TrackNode<T> | null;

  constructor(data: T) {
    this.data = data;
    this.prev = null;
    this.next = null;
  }
}

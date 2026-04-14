import { TrackNode } from './TrackNode';

/**
 * TrackList<T> — Lista doblemente enlazada genérica.
 *
 * Provee inserción/eliminación O(1) en cabeza/cola y recorrido
 * bidireccional, ideal para navegación prev/next de canciones.
 * Acceso por índice es O(n) pero optimizado con recorrido desde
 * el extremo más cercano.
 */
export class TrackList<T> {
  private head: TrackNode<T> | null = null;
  private tail: TrackNode<T> | null = null;
  private length: number = 0;

  get size(): number { return this.length; }
  get isEmpty(): boolean { return this.length === 0; }

  /** Insertar al inicio — O(1). */
  insertAtHead(data: T): void {
    const node = new TrackNode(data);
    if (this.isEmpty) {
      this.head = node;
      this.tail = node;
    } else {
      node.next = this.head;
      this.head!.prev = node;
      this.head = node;
    }
    this.length++;
  }

  /** Insertar al final — O(1). */
  insertAtTail(data: T): void {
    const node = new TrackNode(data);
    if (this.isEmpty) {
      this.head = node;
      this.tail = node;
    } else {
      node.prev = this.tail;
      this.tail!.next = node;
      this.tail = node;
    }
    this.length++;
  }

  /** Insertar en una posición específica — O(n). */
  insertAt(index: number, data: T): void {
    if (index < 0 || index > this.length)
      throw new RangeError(`Index ${index} out of bounds (0..${this.length})`);
    if (index === 0) return this.insertAtHead(data);
    if (index === this.length) return this.insertAtTail(data);

    const node = new TrackNode(data);
    const current = this.getNodeAt(index)!;
    node.prev = current.prev;
    node.next = current;
    current.prev!.next = node;
    current.prev = node;
    this.length++;
  }

  /** Eliminar en una posición específica — O(n). */
  removeAt(index: number): T {
    if (index < 0 || index >= this.length)
      throw new RangeError(`Index ${index} out of bounds (0..${this.length - 1})`);

    let removed: TrackNode<T>;

    if (this.length === 1) {
      removed = this.head!;
      this.head = null;
      this.tail = null;
    } else if (index === 0) {
      removed = this.head!;
      this.head = this.head!.next;
      this.head!.prev = null;
    } else if (index === this.length - 1) {
      removed = this.tail!;
      this.tail = this.tail!.prev;
      this.tail!.next = null;
    } else {
      removed = this.getNodeAt(index)!;
      removed.prev!.next = removed.next;
      removed.next!.prev = removed.prev;
    }

    this.length--;
    return removed.data;
  }

  /** Eliminar el primer nodo que cumpla un predicado. */
  removeByPredicate(predicate: (data: T) => boolean): T | null {
    let current = this.head;
    let index = 0;
    while (current) {
      if (predicate(current.data)) return this.removeAt(index);
      current = current.next;
      index++;
    }
    return null;
  }

  /** Mover un elemento una posición adelante (swap de datos). */
  moveForward(index: number): boolean {
    if (index < 0 || index >= this.length - 1) return false;
    const node = this.getNodeAt(index)!;
    const next = node.next!;
    [node.data, next.data] = [next.data, node.data];
    return true;
  }

  /** Mover un elemento una posición atrás (swap de datos). */
  moveBackward(index: number): boolean {
    if (index <= 0 || index >= this.length) return false;
    const node = this.getNodeAt(index)!;
    const prev = node.prev!;
    [node.data, prev.data] = [prev.data, node.data];
    return true;
  }

  /** Obtener dato en posición — O(n). */
  getAt(index: number): T | null {
    const node = this.getNodeAt(index);
    return node ? node.data : null;
  }

  /** Convertir la lista a array para renderizado. */
  toArray(): T[] {
    const result: T[] = [];
    let current = this.head;
    while (current) {
      result.push(current.data);
      current = current.next;
    }
    return result;
  }

  /** Vaciar la lista — O(1). */
  clear(): void {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  /** Mezclar usando Fisher-Yates (reconstruye la lista). */
  shuffle(): void {
    const arr = this.toArray();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    this.clear();
    for (const item of arr) this.insertAtTail(item);
  }

  /**
   * Búsqueda optimizada: recorre desde head o tail
   * según cuál extremo esté más cerca del índice.
   */
  private getNodeAt(index: number): TrackNode<T> | null {
    if (index < 0 || index >= this.length) return null;
    let current: TrackNode<T>;
    if (index < this.length / 2) {
      current = this.head!;
      for (let i = 0; i < index; i++) current = current.next!;
    } else {
      current = this.tail!;
      for (let i = this.length - 1; i > index; i--) current = current.prev!;
    }
    return current;
  }
}

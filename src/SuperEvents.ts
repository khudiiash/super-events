/**
 * SuperEvents: A flexible event/observer system with return values, async, and once support.
 *
 * Usage:
 *   const events = new SuperEvents();
 *   events.on('event', (data) => ...);
 *   events.emit('event', ...args);
 *   events.call('event', ...args); // gets return values (sync)
 *   await events.callAsync('event', ...args); // gets return values (async)
 */

export type Listener<T = any, R = any> = (payload: T) => R | Promise<R>;

interface ListenerEntry<T = any, R = any> {
  callback: Listener<T, R>;
  once: boolean;
}

export class SuperEvents {
  private events: Map<string, ListenerEntry[]> = new Map();

  /**
   * Register a listener for an event.
   * @param event Event name
   * @param callback Listener function
   * @returns Unsubscribe function
   */
  on<T = any, R = any>(event: string, callback: Listener<T, R>): () => void {
    return this._addListener(event, callback, false);
  }

  /**
   * Register a one-time listener for an event.
   * @param event Event name
   * @param callback Listener function
   * @returns Unsubscribe function
   */
  once<T = any, R = any>(event: string, callback: Listener<T, R>): () => void {
    return this._addListener(event, callback, true);
  }

  /**
   * Remove a listener for an event.
   * @param event Event name
   * @param callback Listener function
   */
  off<T = any, R = any>(event: string, callback: Listener<T, R>): void {
    if (!this.events.has(event)) return;
    const listeners = this.events.get(event)!;
    const idx = listeners.findIndex(entry => entry.callback === callback);
    if (idx !== -1) listeners.splice(idx, 1);
    if (listeners.length === 0) this.events.delete(event);
  }

  /**
   * Emit an event to all listeners. Supports async listeners.
   * @param event Event name
   * @param args Arguments to pass to listeners
   * @returns Promise of all listener results
   */
  async emit<T = any, R = any>(event: string, ...args: [T]): Promise<R[]> {
    if (!this.events.has(event)) return [];
    const listeners = this.events.get(event)!;
    const results: Promise<R>[] = [];
    for (let i = 0; i < listeners.length; i++) {
      const { callback, once } = listeners[i];
      results.push(Promise.resolve(callback(...args)));
      if (once) {
        listeners.splice(i, 1);
        i--;
      }
    }
    if (listeners.length === 0) this.events.delete(event);
    return Promise.all(results);
  }

  /**
   * Call all listeners for an event and get their return values synchronously.
   * Throws if any listener returns a Promise (i.e., is async).
   * @param event Event name
   * @param args Arguments to pass to listeners
   * @returns Array of listener return values
   */
  call<T = any, R = any>(event: string, ...args: [T]): R | R[] {
    if (!this.events.has(event)) return [];
    const listeners = this.events.get(event)!;
    const results: R[] = [];
    for (let i = 0; i < listeners.length; i++) {
      const { callback, once } = listeners[i];
      const result = callback(...args);
      if (result instanceof Promise) {
        throw new Error('SuperEvents: call() cannot be used with async listeners. Use callAsync() instead.');
      }
      results.push(result);
      if (once) {
        listeners.splice(i, 1);
        i--;
      }
    }
    if (listeners.length === 0) this.events.delete(event);
    return results;
  }

  /**
   * Call all listeners for an event and get their return values (sync or async).
   * @param event Event name
   * @param args Arguments to pass to listeners
   * @returns Promise of all listener return values
   */
  async callAsync<T = any, R = any>(event: string, ...args: [T]): Promise<R | R[]> {
    const results = await this.emit<T, R>(event, ...args);
    return results;
  }

  private _addListener<T, R>(event: string, callback: Listener<T, R>, once: boolean): () => void {
    if (!this.events.has(event)) this.events.set(event, []);
    const entry: ListenerEntry = { callback, once };
    this.events.get(event)!.push(entry);
    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Call all listeners for an event and get the first non-null return value.
   * @param event Event name
   * @param args Arguments to pass to listeners
   * @returns First non-null and non-undefined return value
   */
  first<T = any, R = any>(event: string, ...args: [T]): R | undefined {
    const results = this.call<T, R>(event, ...args);
    if (Array.isArray(results)) {
      return results.find(r => r != null && r != undefined);
    }
    return results;
  }

  /**
   * Call all listeners for an event and get the first non-null return value.
   * @param event Event name
   * @param args Arguments to pass to listeners
   * @returns First non-null and non-undefined return value
   */
  async firstAsync<T = any, R = any>(event: string, ...args: [T]): Promise<R | undefined> {
    return this.emit<T, R>(event, ...args).then(results => {
      if (results.length === 1) return results[0];
      return results.find(r => r != null && r != undefined);
    });
  }
} 
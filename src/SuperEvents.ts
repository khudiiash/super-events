/**
 * SuperEvents: A flexible event/observer system with return values, async, and once support.
 *
 * Usage:
 *   const events = SuperEvents.getInstance();
 *   events.on('event', (data) => ...);
 *   events.emit('event', data);
 *   events.callAll('event', data); // gets return values (sync)
 *   await events.callAllAsync('event', data); // gets return values (async)
 *   events.callFirst('event', data); // gets the first non-null return value
 *   await events.callFirstAsync('event', data); // gets the first non-null return value
 */

export type Listener<T = any, R = any> = (payload: T) => R | Promise<R>;

interface ListenerEntry<T = any, R = any> {
  callback: Listener<T, R>;
  once: boolean;
}

export class SuperEvents {
  private static instance: SuperEvents | null = null;
  private events: Map<string, ListenerEntry[]> = new Map();

  private constructor() {}

  /**
   * Get the singleton instance of SuperEvents.
   */
  static getInstance(): SuperEvents {
    if (!SuperEvents.instance) {
      SuperEvents.instance = new SuperEvents();
    }
    return SuperEvents.instance;
  }

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
   * Emit an event to all listeners synchronously. Does not support async listeners.
   * @param event Event name
   * @param data Arguments to pass to listeners
   * @returns void
   */
  emit<T = any, R = any>(event: string, data: T): void {
    if (!this.events.has(event)) return;
    const listeners = this.events.get(event)!;
    for (let i = 0; i < listeners.length; i++) {
      const { callback, once } = listeners[i];
      const result = callback(data);
      if (result instanceof Promise) {
        throw new Error('SuperEvents: emit() cannot be used with async listeners. Use emitAsync() instead.');
      }
      if (once) {
        listeners.splice(i, 1);
        i--;
      }
    }
    if (listeners.length === 0) this.events.delete(event);
  }

  /**
   * Emit an event to all listeners asynchronously. Supports async listeners.
   * @param event Event name
   * @param data Arguments to pass to listeners
   * @returns Promise<void>
   */
  async emitAsync<T = any, R = any>(event: string, data: T): Promise<void> {
    if (!this.events.has(event)) return;
    const listeners = this.events.get(event)!;
    const promises: Promise<any>[] = [];
    for (let i = 0; i < listeners.length; i++) {
      const { callback, once } = listeners[i];
      promises.push(Promise.resolve(callback(data)));
      if (once) {
        listeners.splice(i, 1);
        i--;
      }
    }
    if (listeners.length === 0) this.events.delete(event);
    await Promise.all(promises);
  }

  /**
   * Call all listeners for an event and get their return values synchronously.
   * Returns an array of all listeners return values.
   * @param event Event name
   * @param args Arguments to pass to listeners
   * @returns Array of listener return values
   */
  callAll<T = any, R = any>(event: string, data: T): R | R[] {
    if (!this.events.has(event)) return [];
    const listeners = this.events.get(event)!;
    const results: R[] = [];
    for (let i = 0; i < listeners.length; i++) {
      const { callback, once } = listeners[i];
      const result = callback(data);
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
  async callAllAsync<T = any, R = any>(event: string, data: T): Promise<R | R[]> {
    if (!this.events.has(event)) return [];
    const listeners = this.events.get(event)!;
    const promises: Promise<R>[] = [];
    for (let i = 0; i < listeners.length; i++) {
      const { callback, once } = listeners[i];
      promises.push(Promise.resolve(callback(data)));
      if (once) {
        listeners.splice(i, 1);
        i--;
      }
    }
    if (listeners.length === 0) this.events.delete(event);
    return Promise.all(promises);
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
  callFirst<T = any, R = any>(event: string, data: T): R | undefined {
    const results = this.callAll<T, R>(event, data);
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
  async callFirstAsync<T = any, R = any>(event: string, data: T): Promise<R | undefined> {
    if (!this.events.has(event)) return undefined;
    const listeners = this.events.get(event)!;
    const promises: Promise<R>[] = [];
    for (let i = 0; i < listeners.length; i++) {
      const { callback, once } = listeners[i];
      promises.push(Promise.resolve(callback(data)));
      if (once) {
        listeners.splice(i, 1);
        i--;
      }
    }
    if (listeners.length === 0) this.events.delete(event);
    const results = await Promise.all(promises);
    if (results.length === 1) return results[0];
    return results.find(r => r != null && r != undefined);
  }

  /**
   * Remove all listeners for all events.
   */
  clear(): void {
    this.events.clear();
  }
} 
/**
 * SuperEvents: A flexible event/observer system with return values, async, and once support.
 *
 * Usage (TypeScript):
 *   interface MyEvents {
 *     event1: { userID: string; age: number };
 *     orderCreated: { orderId: number; amount: number };
 *     userLogout: undefined;
 *   }
 *   const events = new SuperEvents<MyEvents>();
 *   events.on('event1', (data) => { ... });
 *   events.emit('orderCreated', { orderId: 1, amount: 100 });
 *
 * Usage (JavaScript):
 *   @typedef {{
 *     event1: { userID: string; age: number },
 *     event2: { orderId: number; amount: number },
 *   }} MyEvents
 *
 *   @type {SuperEvents<MyEvents>}
 *   const events = new SuperEvents();
 *   events.on('event1', (data) => { ... });
 *   events.emit('orderCreated', { orderId: 1, amount: 100 });
 */
/**
 * @template {Record<string, any>} Events
 */
export class SuperEvents<Events extends Record<string, any> = any> {
  private static instance: SuperEvents<any> | null = null;
  private events: Map<string, ListenerEntry[]> = new Map();

  public constructor() {}

  /**
   * Get the singleton instance of SuperEvents.
   * @returns {SuperEvents<Events>}
   */
  static getInstance<Events extends Record<string, any> = any>(): SuperEvents<Events> {
    if (!SuperEvents.instance) {
      SuperEvents.instance = new SuperEvents();
    }
    return SuperEvents.instance;
  }

  /**
   * Register a listener for an event.
   * @param {keyof Events} event Event name
   * @param {(payload: Events[typeof event]) => any} callback Listener function
   * @returns {() => void} Unsubscribe function
   */
  on<K extends keyof Events>(event: K, callback: Listener<Events[K], any>): () => void {
    return this._addListener(event as string, callback, false);
  }

  /**
   * Register a one-time listener for an event.
   * @param {keyof Events} event Event name
   * @param {(payload: Events[typeof event]) => any} callback Listener function
   * @returns {() => void} Unsubscribe function
   */
  once<K extends keyof Events>(event: K, callback: Listener<Events[K], any>): () => void {
    return this._addListener(event as string, callback, true);
  }

  /**
   * Remove a listener for an event.
   * @param {keyof Events} event Event name
   * @param {(payload: Events[typeof event]) => any} callback Listener function
   */
  off<K extends keyof Events>(event: K, callback: Listener<Events[K], any>): void {
    if (!this.events.has(event as string)) return;
    const listeners = this.events.get(event as string)!;
    const idx = listeners.findIndex(entry => entry.callback === callback);
    if (idx !== -1) listeners.splice(idx, 1);
    if (listeners.length === 0) this.events.delete(event as string);
  }

  /**
   * Emit an event to all listeners synchronously. Does not support async listeners.
   * @param {keyof Events} event Event name
   * @param {Events[typeof event]} [data] Arguments to pass to listeners (optional)
   * @returns void
   */
  emit<K extends keyof Events>(event: K, data?: Events[K]): void {
    if (!this.events.has(event as string)) return;
    const listeners = this.events.get(event as string)!;
    for (let i = 0; i < listeners.length; i++) {
      const { callback, once } = listeners[i];
      const result = callback(data as Events[K]);
      if (result instanceof Promise) {
        throw new Error('SuperEvents: emit() cannot be used with async listeners. Use emitAsync() instead.');
      }
      if (once) {
        listeners.splice(i, 1);
        i--;
      }
    }
    if (listeners.length === 0) this.events.delete(event as string);
  }

  /**
   * Emit an event to all listeners asynchronously. Supports async listeners.
   * @param {keyof Events} event Event name
   * @param {Events[typeof event]} [data] Arguments to pass to listeners (optional)
   * @returns Promise<void>
   */
  async emitAsync<K extends keyof Events>(event: K, data?: Events[K]): Promise<void> {
    if (!this.events.has(event as string)) return;
    const listeners = this.events.get(event as string)!;
    const promises: Promise<any>[] = [];
    for (let i = 0; i < listeners.length; i++) {
      const { callback, once } = listeners[i];
      promises.push(Promise.resolve(callback(data as Events[K])));
      if (once) {
        listeners.splice(i, 1);
        i--;
      }
    }
    if (listeners.length === 0) this.events.delete(event as string);
    await Promise.all(promises);
  }

  /**
   * Call all listeners for an event and get their return values synchronously.
   * Returns an array of all listeners return values.
   * @param {keyof Events} event Event name
   * @param {Events[typeof event]} [data] Arguments to pass to listeners (optional)
   * @returns Array of listener return values
   */
  callAll<K extends keyof Events, R = any>(event: K, data?: Events[K]): R | R[] {
    if (!this.events.has(event as string)) return [];
    const listeners = this.events.get(event as string)!;
    const results: R[] = [];
    for (let i = 0; i < listeners.length; i++) {
      const { callback, once } = listeners[i];
      const result = callback(data as Events[K]);
      if (result instanceof Promise) {
        throw new Error('SuperEvents: call() cannot be used with async listeners. Use callAsync() instead.');
      }
      results.push(result);
      if (once) {
        listeners.splice(i, 1);
        i--;
      }
    }
    if (listeners.length === 0) this.events.delete(event as string);
    return results;
  }

  /**
   * Call all listeners for an event and get their return values (sync or async).
   * @param {keyof Events} event Event name
   * @param {Events[typeof event]} [data] Arguments to pass to listeners (optional)
   * @returns Promise of all listener return values
   */
  async callAllAsync<K extends keyof Events, R = any>(event: K, data?: Events[K]): Promise<R | R[]> {
    if (!this.events.has(event as string)) return [];
    const listeners = this.events.get(event as string)!;
    const promises: Promise<R>[] = [];
    for (let i = 0; i < listeners.length; i++) {
      const { callback, once } = listeners[i];
      promises.push(Promise.resolve(callback(data as Events[K])));
      if (once) {
        listeners.splice(i, 1);
        i--;
      }
    }
    if (listeners.length === 0) this.events.delete(event as string);
    return Promise.all(promises);
  }

  private _addListener<T, R>(event: string, callback: Listener<T, R>, once: boolean): () => void {
    if (!this.events.has(event)) this.events.set(event, []);
    const entry: ListenerEntry = { callback, once };
    this.events.get(event)!.push(entry);
    // Return unsubscribe function
    return () => this.off(event as any, callback);
  }

  /**
   * Call all listeners for an event and get the first non-null return value.
   * @param {keyof Events} event Event name
   * @param {Events[typeof event]} [data] Arguments to pass to listeners (optional)
   * @returns First non-null and non-undefined return value
   */
  callFirst<K extends keyof Events, R = any>(event: K, data?: Events[K]): R | undefined {
    const results = this.callAll<K, R>(event, data);
    if (Array.isArray(results)) {
      return results.find(r => r != null && r != undefined);
    }
    return results;
  }

  /**
   * Call all listeners for an event and get the first non-null return value.
   * @param {keyof Events} event Event name
   * @param {Events[typeof event]} [data] Arguments to pass to listeners (optional)
   * @returns First non-null and non-undefined return value
   */
  async callFirstAsync<K extends keyof Events, R = any>(event: K, data?: Events[K]): Promise<R | undefined> {
    if (!this.events.has(event as string)) return undefined;
    const listeners = this.events.get(event as string)!;
    const promises: Promise<R>[] = [];
    for (let i = 0; i < listeners.length; i++) {
      const { callback, once } = listeners[i];
      promises.push(Promise.resolve(callback(data as Events[K])));
      if (once) {
        listeners.splice(i, 1);
        i--;
      }
    }
    if (listeners.length === 0) this.events.delete(event as string);
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

export type Listener<T = any, R = any> = (payload: T) => R | Promise<R>;

interface ListenerEntry<T = any, R = any> {
  callback: Listener<T, R>;
  once: boolean;
} 
"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperEvents = void 0;
class SuperEvents {
    constructor() {
        this.events = new Map();
    }
    /**
     * Register a listener for an event.
     * @param event Event name
     * @param callback Listener function
     * @returns Unsubscribe function
     */
    on(event, callback) {
        return this._addListener(event, callback, false);
    }
    /**
     * Register a one-time listener for an event.
     * @param event Event name
     * @param callback Listener function
     * @returns Unsubscribe function
     */
    once(event, callback) {
        return this._addListener(event, callback, true);
    }
    /**
     * Remove a listener for an event.
     * @param event Event name
     * @param callback Listener function
     */
    off(event, callback) {
        if (!this.events.has(event))
            return;
        const listeners = this.events.get(event);
        const idx = listeners.findIndex(entry => entry.callback === callback);
        if (idx !== -1)
            listeners.splice(idx, 1);
        if (listeners.length === 0)
            this.events.delete(event);
    }
    /**
     * Emit an event to all listeners. Supports async listeners.
     * @param event Event name
     * @param args Arguments to pass to listeners
     * @returns Promise of all listener results
     */
    emit(event, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.events.has(event))
                return [];
            const listeners = this.events.get(event);
            const results = [];
            for (let i = 0; i < listeners.length; i++) {
                const { callback, once } = listeners[i];
                results.push(Promise.resolve(callback(...args)));
                if (once) {
                    listeners.splice(i, 1);
                    i--;
                }
            }
            if (listeners.length === 0)
                this.events.delete(event);
            return Promise.all(results);
        });
    }
    /**
     * Call all listeners for an event and get their return values synchronously.
     * Throws if any listener returns a Promise (i.e., is async).
     * @param event Event name
     * @param args Arguments to pass to listeners
     * @returns Array of listener return values
     */
    call(event, ...args) {
        if (!this.events.has(event))
            return [];
        const listeners = this.events.get(event);
        const results = [];
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
        if (listeners.length === 0)
            this.events.delete(event);
        return results;
    }
    /**
     * Call all listeners for an event and get their return values (sync or async).
     * @param event Event name
     * @param args Arguments to pass to listeners
     * @returns Promise of all listener return values
     */
    callAsync(event, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = yield this.emit(event, ...args);
            return results;
        });
    }
    _addListener(event, callback, once) {
        if (!this.events.has(event))
            this.events.set(event, []);
        const entry = { callback, once };
        this.events.get(event).push(entry);
        // Return unsubscribe function
        return () => this.off(event, callback);
    }
    /**
     * Call all listeners for an event and get the first non-null return value.
     * @param event Event name
     * @param args Arguments to pass to listeners
     * @returns First non-null and non-undefined return value
     */
    first(event, ...args) {
        const results = this.call(event, ...args);
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
    firstAsync(event, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.emit(event, ...args).then(results => {
                if (results.length === 1)
                    return results[0];
                return results.find(r => r != null && r != undefined);
            });
        });
    }
}
exports.SuperEvents = SuperEvents;

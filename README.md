# SuperEvents

A flexible, decoupled event/observer system for TypeScript and JavaScript with:
- Return values from listeners
- Async/await support
- Once listeners
- Unsubscribe support
- **Global and local event systems**

## Installation

```
npm install @khudiiash/super-events
```

## Usage

```typescript
import { SuperEvents } from '@khudiiash/super-events';

// Get the singleton instance (global event system)
const events = SuperEvents.getInstance();

// Or create a local event system for a specific object/module
const localEvents = new SuperEvents();

// Register a listener
const unsub = events.on('my:event', (payload) => {
  console.log('Received:', payload);
  return payload + 1;
});

// Register a once-listener
events.once('my:event', (payload) => {
  console.log('Once:', payload);
  return payload * 2;
});

// Emit an event (sync, void)
events.emit('my:event', 5);

// Emit an event (async, void)
(async () => {
  await events.emitAsync('my:event', 5);
})();

// Call and get return values (sync)
const results = events.callAll('my:event', 10);
console.log(results); // [11, 20]

// Call and get return values (async)
(async () => {
  const results = await events.callAllAsync('my:event', 10);
  console.log(results); // [11, 20]
})();

// Get the first non-null return value (sync)
const first = events.callFirst('my:event', 10);
console.log(first); // 11

// Get the first non-null return value (async)
(async () => {
  const first = await events.callFirstAsync('my:event', 10);
  console.log(first); // 11
})();

// Unsubscribe
unsub();

// Remove all listeners
events.clear();
```

## API

### `on(event, callback): () => void`
Register a listener for an event. Returns an unsubscribe function.

### `once(event, callback): () => void`
Register a one-time listener for an event. Returns an unsubscribe function.

### `off(event, callback): void`
Remove a specific listener for an event.

### `emit(event, data): void`
Emit an event to all listeners synchronously. Does not support async listeners. Does not return any value.

### `emitAsync(event, data): Promise<void>`
Emit an event to all listeners asynchronously. Supports async listeners. Does not return any value.

### `callAll(event, data): any[]`
Call all listeners for an event synchronously and get their return values. Throws if any listener is async.

### `callAllAsync(event, data): Promise<any[]>`
Call all listeners for an event and get their return values (supports async listeners). Returns a promise of all listener return values.

### `callFirst(event, data): any`
Call all listeners for an event synchronously and get the first non-null return value. Throws if any listener is async.

### `callFirstAsync(event, data): Promise<any>`
Call all listeners for an event and get the first non-null return value (supports async listeners). Returns a promise of the first non-null return value.

### `clear(): void`
Remove all listeners for all events.

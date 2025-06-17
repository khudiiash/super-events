# SuperEvents

A flexible, decoupled event/observer system for TypeScript and JavaScript with:
- Return values from listeners
- Async/await support
- Once listeners
- Unsubscribe support

## Installation

```
npm install @khudiiash/super-events
```

## Usage

```typescript
import { SuperEvents } from '@khudiiash/super-events';

// Get the singleton instance
const events = SuperEvents.getInstance();

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

// Emit an event (async, supports await)
(async () => {
  const results = await events.emit('my:event', 5);
  console.log(results); // [6, 10]
})();

// Call and get return values
(async () => {
  const results = await events.call('my:event', 10);
  console.log(results); // [11, 20]
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

### `off(event, callback)`
Remove a listener for an event.

### `emit(event, ...args): Promise<any[]>`
Emit an event to all listeners. Supports async listeners. Returns a promise of all listener results.

### `call(event, ...args): Promise<any[]>`
Call all listeners for an event and get their return values (sync or async).

### `clear()`
Remove all listeners for all events.

## Features
- **Loose coupling**: Emitters and listeners are decoupled
- **Return values**: Get results from listeners
- **Async support**: Listeners can be async
- **Once listeners**: Auto-remove after first call
- **Unsubscribe**: Remove listeners at any time

## License
MIT 
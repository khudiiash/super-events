# SuperEvents

A flexible, decoupled event/observer system for TypeScript and JavaScript with:
- Return values from listeners
- Async/await support
- Once listeners
- Unsubscribe support
- **Global and local event systems**

## Installation

```sh
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

## Advanced Type-Safe Usage (TypeScript)

SuperEvents supports **type-safe event names and payloads** using generics. This gives you full autocomplete and compile-time safety for both event names and payloads.

```typescript
import { SuperEvents } from '@khudiiash/super-events';

type MyEvents = {
  event1: { userID: string; age: number };
  event2: { orderId: number; amount: number };
  userLogout: undefined;
};

const events = new SuperEvents<MyEvents>();

events.on('event1', (data) => {
  // data: { userID: string; age: number }
});

events.emit('event2', { orderId: 123, amount: 99.99 }); // type-checked!
events.emit('userLogout', undefined); // type-checked!

// TypeScript will catch errors if you use a wrong event name or payload
// events.emit('notAnEvent', {}); // Error: notAnEvent does not exist
// events.emit('event1', { foo: 1 }); // Error: missing userID, age
```

## Editor Integration for JavaScript (JSDoc)

You can get **editor hints and autocomplete** in plain JavaScript by using JSDoc typedefs and a `jsconfig.json` file.

### 1. Create a `jsconfig.json` in your project root:

```json
{
  "compilerOptions": {
    "checkJs": true,
    "module": "commonjs",
    "target": "es2020"
  },
  "include": ["src", "dist", "example.js"]
}
```

### 2. Use JSDoc typedefs for your event map:

```js
/**
 * @typedef {{
 *   event1: { userID: string, age: number },
 *   event2: { orderId: number, amount: number },
 *   userLogout: undefined
 * }} MyEvents
 */

/** @type {import('@khudiiash/super-events').SuperEvents<MyEvents>} */
const events = new SuperEvents();

events.on('event1', (data) => {
  // data.userID and data.age are autocompleted and type-hinted
});

events.emit('event2', { orderId: 123, amount: 99.99 });
```

**Tips:**
- Use `@type {SuperEvents<MyEvents>}` to annotate your instance.
- Use `@typedef` to describe your event map.
- Make sure your editor is using your `jsconfig.json` for best results.
- Add `// @ts-check` to the top of your JS files for even stricter type checking.

## Troubleshooting

- **No autocomplete or type hints in JS?**
  - Make sure you have a `jsconfig.json` in your project root.
  - Restart your editor after adding or changing `jsconfig.json`.
  - Use JSDoc typedefs and `@type` annotations as shown above.
- **Getting type errors in generated JS files?**
  - Exclude your `dist/` folder from type checking in your `jsconfig.json` or `tsconfig.json`.
- **TypeScript errors about event names or payloads?**
  - Double-check your event map and usage. TypeScript will catch any mismatches!

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

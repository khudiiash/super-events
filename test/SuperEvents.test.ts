import { SuperEvents } from '../src/SuperEvents';

describe('SuperEvents', () => {
  let events: SuperEvents;

  beforeEach(() => {
    events = new SuperEvents();
  });

  it('should call listeners and return their values', async () => {
    events.on('test', (x: number) => x + 1);
    events.on('test', (x: number) => x * 2);
    const results = await events.call('test', 5);
    expect(results).toEqual([6, 10]);
  });

  it('should return array even if only one listener (call)', async () => {
    events.on('single', (x: number) => x + 42);
    const result = await events.call('single', 8);
    expect(result).toEqual([50]);
  });

  it('should return array even if only one listener (callAsync)', async () => {
    events.on('asyncSingle', async (x: number) => x * 3);
    const result = await events.callAsync('asyncSingle', 7);
    expect(result).toEqual([21]);
  });

  it('should return array if multiple listeners (callAsync)', async () => {
    events.on('asyncMulti', async (x: number) => x + 1);
    events.on('asyncMulti', async (x: number) => x + 2);
    const result = await events.callAsync('asyncMulti', 5);
    expect(result).toEqual([6, 7]);
  });

  it('should support findResult to get first non-null result', async () => {
    events.on('find', (x: number) => null);
    events.on('find', (x: number) => undefined);
    events.on('find', (x: number) => x * 2);
    const result = events.first('find', 4);
    expect(result).toBe(8);
  });

  it('should support findResultAsync to get first non-null result', async () => {
    events.on('findAsync', async (x: number) => null);
    events.on('findAsync', async (x: number) => undefined);
    events.on('findAsync', async (x: number) => x * 2);
    const result = await events.firstAsync('findAsync', 4);
    expect(result).toBe(8);
  });

  it('should support async listeners', async () => {
    events.on('async', async (x: number) => x + 10);
    events.on('async', (x: number) => Promise.resolve(x * 3));
    const results = await events.emit('async', 2);
    expect(results).toEqual([12, 6]);
  });

  it('should remove listeners with off', async () => {
    const cb = (x: number) => x + 1;
    events.on('off', cb);
    events.off('off', cb);
    const results = await events.call('off', 1);
    expect(results).toEqual([]);
  });

  it('should support once listeners', async () => {
    const fn = jest.fn((x: number) => x * 2);
    events.once('once', fn);
    const r1 = await events.call('once', 3);
    const r2 = await events.call('once', 3);
    expect(r1).toEqual([6]);
    expect(r2).toEqual([]);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should return unsubscribe function from on/once', async () => {
    const fn = jest.fn();
    const unsub = events.on('unsub', fn);
    unsub();
    await events.emit('unsub', 1);
    expect(fn).not.toHaveBeenCalled();
  });
}); 
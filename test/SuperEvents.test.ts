import { SuperEvents } from '../src/SuperEvents';

describe('SuperEvents', () => {
  let events: SuperEvents;

  beforeEach(() => {
    events = SuperEvents.getInstance();
    events.clear();
  });

  it('should call listeners and return their values', async () => {
    events.on('test', (x: number) => x + 1);
    events.on('test', (x: number) => x * 2);
    const results = await events.callAll('test', 5);
    expect(results).toEqual([6, 10]);
  });

  it('should return array even if only one listener (call)', async () => {
    events.on('single', (x: number) => x + 42);
    const result = await events.callAll('single', 8);
    expect(result).toEqual([50]);
  });

  it('should return array even if only one listener (callAsync)', async () => {
    events.on('asyncSingle', async (x: number) => x * 3);
    const result = await events.callAllAsync('asyncSingle', 7);
    expect(result).toEqual([21]);
  });

  it('should return array if multiple listeners (callAsync)', async () => {
    events.on('asyncMulti', async (x: number) => x + 1);
    events.on('asyncMulti', async (x: number) => x + 2);
    const result = await events.callAllAsync('asyncMulti', 5);
    expect(result).toEqual([6, 7]);
  });

  it('should support first to get first non-null result', async () => {
    events.on('find', (x: number) => null);
    events.on('find', (x: number) => undefined);
    events.on('find', (x: number) => x * 2);
    const result = events.callFirst('find', 4);
    expect(result).toBe(8);
  });

  it('should support firstAsync to get first non-null result', async () => {
    events.on('findAsync', async (x: number) => null);
    events.on('findAsync', async (x: number) => undefined);
    events.on('findAsync', async (x: number) => x * 2);
    const result = await events.callFirstAsync('findAsync', 4);
    expect(result).toBe(8);
  });

  it('should support async listeners', async () => {
    events.on('async', async (x: number) => x + 10);
    events.on('async', (x: number) => Promise.resolve(x * 3));
    const fn1 = jest.fn();
    const fn2 = jest.fn();
    events.on('async', async (x: number) => { fn1(x); return x + 10; });
    events.on('async', (x: number) => { fn2(x); return Promise.resolve(x * 3); });
    await events.emitAsync('async', 2);
    expect(fn1).toHaveBeenCalledWith(2);
    expect(fn2).toHaveBeenCalledWith(2);
  });

  it('should remove listeners with off', async () => {
    const cb = (x: number) => x + 1;
    events.on('off', cb);
    events.off('off', cb);
    const results = await events.callAll('off', 1);
    expect(results).toEqual([]);
  });

  it('should support once listeners', async () => {
    const fn = jest.fn((x: number) => x * 2);
    events.once('once', fn);
    const r1 = await events.callAll('once', 3);
    const r2 = await events.callAll('once', 3);
    expect(r1).toEqual([6]);
    expect(r2).toEqual([]);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should return unsubscribe function from on/once', async () => {
    const fn = jest.fn();
    const unsub = events.on('unsub', fn);
    unsub();
    events.emit('unsub', 1);
    expect(fn).not.toHaveBeenCalled();
  });

  it('should always return the same instance', () => {
    const instance1 = SuperEvents.getInstance();
    const instance2 = SuperEvents.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('clear() should remove all listeners', () => {
    const instance = SuperEvents.getInstance();
    const fn = jest.fn();
    instance.on('clearTest', fn);
    expect(instance['events'].size).toBeGreaterThan(0);
    instance.clear();
    expect(instance['events'].size).toBe(0);
  });
});

describe('SuperEvents (local instances)', () => {
  it('should allow creating independent local event systems', () => {
    const local1 = new SuperEvents();
    const local2 = new SuperEvents();
    const global = SuperEvents.getInstance();
    const fn1 = jest.fn();
    const fn2 = jest.fn();
    const fnGlobal = jest.fn();
    local1.on('evt', fn1);
    local2.on('evt', fn2);
    global.on('evt', fnGlobal);
    local1.emit('evt', 1);
    local2.emit('evt', 2);
    global.emit('evt', 3);
    expect(fn1).toHaveBeenCalledWith(1);
    expect(fn2).toHaveBeenCalledWith(2);
    expect(fnGlobal).toHaveBeenCalledWith(3);
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
    expect(fnGlobal).toHaveBeenCalledTimes(1);
  });

  it('local event systems should not share listeners', () => {
    const local1 = new SuperEvents();
    const local2 = new SuperEvents();
    const fn1 = jest.fn();
    local1.on('evt', fn1);
    local2.emit('evt', 42);
    expect(fn1).not.toHaveBeenCalled();
  });
}); 
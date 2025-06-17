"use strict";
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
const SuperEvents_1 = require("../src/SuperEvents");
describe('SuperEvents', () => {
    let events;
    beforeEach(() => {
        events = new SuperEvents_1.SuperEvents();
    });
    it('should call listeners and return their values', () => __awaiter(void 0, void 0, void 0, function* () {
        events.on('test', (x) => x + 1);
        events.on('test', (x) => x * 2);
        const results = yield events.call('test', 5);
        expect(results).toEqual([6, 10]);
    }));
    it('should return array even if only one listener (call)', () => __awaiter(void 0, void 0, void 0, function* () {
        events.on('single', (x) => x + 42);
        const result = yield events.call('single', 8);
        expect(result).toEqual([50]);
    }));
    it('should return array even if only one listener (callAsync)', () => __awaiter(void 0, void 0, void 0, function* () {
        events.on('asyncSingle', (x) => __awaiter(void 0, void 0, void 0, function* () { return x * 3; }));
        const result = yield events.callAsync('asyncSingle', 7);
        expect(result).toEqual([21]);
    }));
    it('should return array if multiple listeners (callAsync)', () => __awaiter(void 0, void 0, void 0, function* () {
        events.on('asyncMulti', (x) => __awaiter(void 0, void 0, void 0, function* () { return x + 1; }));
        events.on('asyncMulti', (x) => __awaiter(void 0, void 0, void 0, function* () { return x + 2; }));
        const result = yield events.callAsync('asyncMulti', 5);
        expect(result).toEqual([6, 7]);
    }));
    it('should support findResult to get first non-null result', () => __awaiter(void 0, void 0, void 0, function* () {
        events.on('find', (x) => null);
        events.on('find', (x) => undefined);
        events.on('find', (x) => x * 2);
        const result = events.first('find', 4);
        expect(result).toBe(8);
    }));
    it('should support findResultAsync to get first non-null result', () => __awaiter(void 0, void 0, void 0, function* () {
        events.on('findAsync', (x) => __awaiter(void 0, void 0, void 0, function* () { return null; }));
        events.on('findAsync', (x) => __awaiter(void 0, void 0, void 0, function* () { return undefined; }));
        events.on('findAsync', (x) => __awaiter(void 0, void 0, void 0, function* () { return x * 2; }));
        const result = yield events.firstAsync('findAsync', 4);
        expect(result).toBe(8);
    }));
    it('should support async listeners', () => __awaiter(void 0, void 0, void 0, function* () {
        events.on('async', (x) => __awaiter(void 0, void 0, void 0, function* () { return x + 10; }));
        events.on('async', (x) => Promise.resolve(x * 3));
        const results = yield events.emit('async', 2);
        expect(results).toEqual([12, 6]);
    }));
    it('should remove listeners with off', () => __awaiter(void 0, void 0, void 0, function* () {
        const cb = (x) => x + 1;
        events.on('off', cb);
        events.off('off', cb);
        const results = yield events.call('off', 1);
        expect(results).toEqual([]);
    }));
    it('should support once listeners', () => __awaiter(void 0, void 0, void 0, function* () {
        const fn = jest.fn((x) => x * 2);
        events.once('once', fn);
        const r1 = yield events.call('once', 3);
        const r2 = yield events.call('once', 3);
        expect(r1).toEqual([6]);
        expect(r2).toEqual([]);
        expect(fn).toHaveBeenCalledTimes(1);
    }));
    it('should return unsubscribe function from on/once', () => __awaiter(void 0, void 0, void 0, function* () {
        const fn = jest.fn();
        const unsub = events.on('unsub', fn);
        unsub();
        yield events.emit('unsub', 1);
        expect(fn).not.toHaveBeenCalled();
    }));
});

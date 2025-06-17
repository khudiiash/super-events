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
const EventManager_1 = require("../src/EventManager");
describe('EventManager', () => {
    let events;
    beforeEach(() => {
        events = new EventManager_1.EventManager();
    });
    it('should call listeners and return their values', () => __awaiter(void 0, void 0, void 0, function* () {
        events.on('test', (x) => x + 1);
        events.on('test', (x) => x * 2);
        const results = yield events.call('test', 5);
        expect(results).toEqual([6, 10]);
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

/**
 * Plugin Context Tests
 *
 * Requirements:
 * - PLUG-INTF-005: Standard utilities (logging, cache, storage)
 * - PLUG-INTF-004: Pub/Sub mechanism
 */

import { describe, it, expect, vi } from 'vitest';
import type {
  PluginContext,
  PluginServices,
  PluginLogger,
  PluginCache,
  PluginEventEmitter,
} from '../../src/plugin/types.js';

describe('PluginContext', () => {
  describe('PluginServices (PLUG-INTF-005)', () => {
    it('should register and retrieve services', () => {
      const services: PluginServices = {
        get: vi.fn().mockReturnValue({ testValue: 'test' }),
        register: vi.fn(),
      };

      const testService = { testValue: 'test' };
      services.register('testService', testService);

      expect(services.register).toHaveBeenCalledWith('testService', testService);
      expect(services.get('testService')).toEqual(testService);
    });

    it('should return undefined for unregistered services', () => {
      const services: PluginServices = {
        get: vi.fn().mockReturnValue(undefined),
        register: vi.fn(),
      };

      expect(services.get('nonExistent')).toBeUndefined();
    });
  });

  describe('PluginLogger (PLUG-INTF-005)', () => {
    it('should provide all log levels', () => {
      const logger: PluginLogger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

      logger.debug('Debug message', { key: 'value' });
      logger.info('Info message', { key: 'value' });
      logger.warn('Warning message', { key: 'value' });
      logger.error('Error message', new Error('Test error'), { key: 'value' });

      expect(logger.debug).toHaveBeenCalledWith('Debug message', { key: 'value' });
      expect(logger.info).toHaveBeenCalledWith('Info message', { key: 'value' });
      expect(logger.warn).toHaveBeenCalledWith('Warning message', { key: 'value' });
      expect(logger.error).toHaveBeenCalledWith(
        'Error message',
        expect.any(Error),
        { key: 'value' }
      );
    });
  });

  describe('PluginCache (PLUG-INTF-005)', () => {
    it('should get cached values', async () => {
      const cache: PluginCache = {
        get: vi.fn().mockResolvedValue({ data: 'cached' }),
        set: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
      };

      const result = await cache.get('testKey');

      expect(cache.get).toHaveBeenCalledWith('testKey');
      expect(result).toEqual({ data: 'cached' });
    });

    it('should set cached values with TTL', async () => {
      const cache: PluginCache = {
        get: vi.fn(),
        set: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn(),
      };

      await cache.set('testKey', { data: 'value' }, 3600);

      expect(cache.set).toHaveBeenCalledWith('testKey', { data: 'value' }, 3600);
    });

    it('should delete cached values', async () => {
      const cache: PluginCache = {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn().mockResolvedValue(undefined),
      };

      await cache.delete('testKey');

      expect(cache.delete).toHaveBeenCalledWith('testKey');
    });

    it('should return null for missing cache entries', async () => {
      const cache: PluginCache = {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn(),
        delete: vi.fn(),
      };

      const result = await cache.get('nonExistent');

      expect(result).toBeNull();
    });
  });

  describe('PluginEventEmitter (PLUG-INTF-004)', () => {
    it('should emit events', () => {
      const events: PluginEventEmitter = {
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      };

      events.emit('testEvent', { data: 'value' });

      expect(events.emit).toHaveBeenCalledWith('testEvent', { data: 'value' });
    });

    it('should subscribe to events', () => {
      const events: PluginEventEmitter = {
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      };

      const handler = vi.fn();
      events.on('testEvent', handler);

      expect(events.on).toHaveBeenCalledWith('testEvent', handler);
    });

    it('should unsubscribe from events', () => {
      const events: PluginEventEmitter = {
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      };

      const handler = vi.fn();
      events.off('testEvent', handler);

      expect(events.off).toHaveBeenCalledWith('testEvent', handler);
    });
  });

  describe('PluginContext integration', () => {
    it('should provide complete context for plugin initialization', () => {
      const context: PluginContext = {
        config: {
          apiKey: 'test-api-key',
          baseUrl: 'https://api.example.com',
        },
        services: {
          get: vi.fn(),
          register: vi.fn(),
        },
        logger: {
          debug: vi.fn(),
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
        cache: {
          get: vi.fn(),
          set: vi.fn(),
          delete: vi.fn(),
        },
        events: {
          emit: vi.fn(),
          on: vi.fn(),
          off: vi.fn(),
        },
      };

      expect(context.config).toBeDefined();
      expect(context.services).toBeDefined();
      expect(context.logger).toBeDefined();
      expect(context.cache).toBeDefined();
      expect(context.events).toBeDefined();
    });
  });
});

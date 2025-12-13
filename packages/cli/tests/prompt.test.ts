/**
 * Prompt Utilities Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { styles, box, progressBar, clearLine } from '../src/utils/prompt.js';

describe('Prompt Utilities', () => {
  describe('styles', () => {
    it('should have bold style', () => {
      const text = styles.bold('Bold text');
      expect(text).toBeDefined();
      expect(typeof text).toBe('string');
      expect(text).toContain('Bold text');
    });

    it('should have dim style', () => {
      const text = styles.dim('Dim text');
      expect(text).toBeDefined();
      expect(typeof text).toBe('string');
    });

    it('should have green style', () => {
      const text = styles.green('Green text');
      expect(text).toBeDefined();
      expect(typeof text).toBe('string');
    });

    it('should have red style', () => {
      const text = styles.red('Red text');
      expect(text).toBeDefined();
      expect(typeof text).toBe('string');
    });

    it('should have yellow style', () => {
      const text = styles.yellow('Yellow text');
      expect(text).toBeDefined();
      expect(typeof text).toBe('string');
    });

    it('should have blue style', () => {
      const text = styles.blue('Blue text');
      expect(text).toBeDefined();
      expect(typeof text).toBe('string');
    });

    it('should have cyan style', () => {
      const text = styles.cyan('Cyan text');
      expect(text).toBeDefined();
      expect(typeof text).toBe('string');
    });
  });

  describe('box', () => {
    it('should create a box with content', () => {
      const result = box('Test content');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should create a box with custom padding', () => {
      const result = box('Test content', 2);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should include content in box', () => {
      const content = 'My test content';
      const result = box(content);
      expect(result).toContain(content);
    });

    it('should handle multi-line content', () => {
      const content = 'Line 1\nLine 2\nLine 3';
      const result = box(content);
      expect(result).toContain('Line 1');
      expect(result).toContain('Line 2');
      expect(result).toContain('Line 3');
    });
  });

  describe('progressBar', () => {
    it('should create a progress bar', () => {
      const result = progressBar(50, 100);
      expect(result).toBeDefined();
      expect(result).toContain('50%');
      expect(result).toContain('50/100');
    });

    it('should handle 0%', () => {
      const result = progressBar(0, 100);
      expect(result).toContain('0%');
      expect(result).toContain('░');
    });

    it('should handle 100%', () => {
      const result = progressBar(100, 100);
      expect(result).toContain('100%');
      expect(result).toContain('█');
    });

    it('should accept custom width', () => {
      const result = progressBar(50, 100, 20);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });
});

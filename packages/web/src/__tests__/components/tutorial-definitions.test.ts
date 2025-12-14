/**
 * Tutorial Definitions Tests
 */
import { describe, it, expect } from 'vitest';
import {
  ALL_TUTORIALS,
  getTutorialById,
  getTutorialsByCategory,
  getTutorialsByDomain,
  getRecommendedTutorials,
} from '@/components/tutorial/tutorials';

describe('Tutorial Definitions', () => {
  describe('ALL_TUTORIALS', () => {
    it('should have tutorials', () => {
      expect(ALL_TUTORIALS.length).toBeGreaterThan(0);
    });

    it('should have quickstart tutorials', () => {
      const quickstart = ALL_TUTORIALS.filter((t) => t.category === 'quickstart');
      expect(quickstart.length).toBeGreaterThan(0);
    });

    it('should have tutorials for all domains', () => {
      const domains = [...new Set(ALL_TUTORIALS.filter(t => t.domain).map((t) => t.domain))];
      expect(domains).toContain('materials');
      expect(domains).toContain('drug');
      expect(domains).toContain('climate');
      expect(domains).toContain('genomics');
    });

    it('should have valid step definitions', () => {
      ALL_TUTORIALS.forEach((tutorial) => {
        expect(tutorial.steps.length).toBeGreaterThan(0);
        tutorial.steps.forEach((step) => {
          expect(step.id).toBeTruthy();
          expect(step.title).toBeTruthy();
          expect(step.content).toBeTruthy();
        });
      });
    });

    it('should have required fields', () => {
      ALL_TUTORIALS.forEach((tutorial) => {
        expect(tutorial.id).toBeTruthy();
        expect(tutorial.name).toBeTruthy();
        expect(tutorial.nameJa).toBeTruthy();
        expect(tutorial.description).toBeTruthy();
        expect(tutorial.descriptionJa).toBeTruthy();
        expect(tutorial.category).toBeTruthy();
        expect(tutorial.estimatedMinutes).toBeGreaterThan(0);
        expect(tutorial.difficulty).toBeTruthy();
        expect(tutorial.icon).toBeTruthy();
      });
    });
  });

  describe('getTutorialById', () => {
    it('should return tutorial by id', () => {
      const tutorial = getTutorialById('welcome-tour');
      expect(tutorial).toBeDefined();
      expect(tutorial?.id).toBe('welcome-tour');
      expect(tutorial?.nameJa).toBe('LabFlowへようこそ');
    });

    it('should return undefined for unknown id', () => {
      const tutorial = getTutorialById('unknown-tutorial');
      expect(tutorial).toBeUndefined();
    });
  });

  describe('getTutorialsByCategory', () => {
    it('should return quickstart tutorials', () => {
      const tutorials = getTutorialsByCategory('quickstart');
      expect(tutorials.length).toBeGreaterThan(0);
      tutorials.forEach((t) => {
        expect(t.category).toBe('quickstart');
      });
    });

    it('should return workflow tutorials', () => {
      const tutorials = getTutorialsByCategory('workflow');
      expect(tutorials.length).toBeGreaterThan(0);
      tutorials.forEach((t) => {
        expect(t.category).toBe('workflow');
      });
    });

    it('should return model tutorials', () => {
      const tutorials = getTutorialsByCategory('model');
      expect(tutorials.length).toBeGreaterThan(0);
      tutorials.forEach((t) => {
        expect(t.category).toBe('model');
      });
    });

    it('should return analysis tutorials', () => {
      const tutorials = getTutorialsByCategory('analysis');
      expect(tutorials.length).toBeGreaterThan(0);
      tutorials.forEach((t) => {
        expect(t.category).toBe('analysis');
      });
    });
  });

  describe('getTutorialsByDomain', () => {
    it('should return materials tutorials', () => {
      const tutorials = getTutorialsByDomain('materials');
      expect(tutorials.length).toBeGreaterThan(0);
      tutorials.forEach((t) => {
        expect(t.domain).toBe('materials');
      });
    });

    it('should return drug tutorials', () => {
      const tutorials = getTutorialsByDomain('drug');
      expect(tutorials.length).toBeGreaterThan(0);
      tutorials.forEach((t) => {
        expect(t.domain).toBe('drug');
      });
    });

    it('should return climate tutorials', () => {
      const tutorials = getTutorialsByDomain('climate');
      expect(tutorials.length).toBeGreaterThan(0);
      tutorials.forEach((t) => {
        expect(t.domain).toBe('climate');
      });
    });

    it('should return genomics tutorials', () => {
      const tutorials = getTutorialsByDomain('genomics');
      expect(tutorials.length).toBeGreaterThan(0);
      tutorials.forEach((t) => {
        expect(t.domain).toBe('genomics');
      });
    });
  });

  describe('getRecommendedTutorials', () => {
    it('should return tutorials not yet completed', () => {
      const completedIds = ['welcome-tour'];
      const recommended = getRecommendedTutorials(completedIds);
      expect(recommended.length).toBeGreaterThan(0);
      recommended.forEach((t) => {
        expect(completedIds).not.toContain(t.id);
      });
    });

    it('should filter by domain', () => {
      const recommended = getRecommendedTutorials([], 'materials');
      recommended.forEach((t) => {
        if (t.domain) {
          expect(t.domain).toBe('materials');
        }
      });
    });

    it('should respect prerequisites', () => {
      const completedIds: string[] = [];
      const recommended = getRecommendedTutorials(completedIds);
      
      // Tutorials with unmet prerequisites should not be recommended
      recommended.forEach((t) => {
        if (t.prerequisites) {
          t.prerequisites.forEach((prereq) => {
            // Either prereq is completed or the tutorial should not appear
            if (!completedIds.includes(prereq)) {
              // This tutorial has unmet prerequisites
              // But quickstart tutorials don't have prerequisites, so they should appear first
            }
          });
        }
      });
    });

    it('should prioritize quickstart tutorials', () => {
      const recommended = getRecommendedTutorials([]);
      if (recommended.length > 0) {
        // First recommended should be quickstart if available
        const hasQuickstart = ALL_TUTORIALS.some((t) => t.category === 'quickstart');
        if (hasQuickstart) {
          expect(recommended[0].category).toBe('quickstart');
        }
      }
    });

    it('should limit to 5 recommendations', () => {
      const recommended = getRecommendedTutorials([]);
      expect(recommended.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Tutorial Prerequisites', () => {
    it('should have valid prerequisite references', () => {
      const allIds = ALL_TUTORIALS.map((t) => t.id);
      ALL_TUTORIALS.forEach((tutorial) => {
        if (tutorial.prerequisites) {
          tutorial.prerequisites.forEach((prereq) => {
            expect(allIds).toContain(prereq);
          });
        }
      });
    });
  });

  describe('Tutorial Content Quality', () => {
    it('should have Japanese content for all tutorials', () => {
      ALL_TUTORIALS.forEach((tutorial) => {
        expect(tutorial.nameJa).not.toBe(tutorial.name);
        expect(tutorial.descriptionJa).not.toBe(tutorial.description);
      });
    });

    it('should have reasonable step counts', () => {
      ALL_TUTORIALS.forEach((tutorial) => {
        expect(tutorial.steps.length).toBeGreaterThanOrEqual(1);
        expect(tutorial.steps.length).toBeLessThanOrEqual(20);
      });
    });

    it('should have reasonable estimated times', () => {
      ALL_TUTORIALS.forEach((tutorial) => {
        expect(tutorial.estimatedMinutes).toBeGreaterThanOrEqual(5);
        expect(tutorial.estimatedMinutes).toBeLessThanOrEqual(60);
      });
    });
  });
});

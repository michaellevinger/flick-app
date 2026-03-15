/**
 * @jest-environment node
 */

// Prevent supabase.js (and its AsyncStorage dep) from being loaded —
// validateEventData is a pure function that doesn't use Supabase at all.
jest.mock('../supabase', () => ({ supabase: {} }));

import { validateEventData } from '../events';

// Helper to build a valid base event one day in the future
function futureDate(daysFromNow = 1) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysFromNow);
  return d;
}

const validInput = () => ({
  name: 'Alice & Bob Wedding',
  venue: 'Central Park, NYC',
  startDate: futureDate(1),
  endDate: futureDate(2),
});

describe('validateEventData', () => {
  describe('happy path', () => {
    it('returns isValid=true and no errors for a fully valid event', () => {
      const { isValid, errors } = validateEventData(validInput());
      expect(isValid).toBe(true);
      expect(errors).toEqual({});
    });
  });

  describe('name validation', () => {
    it('rejects a missing name', () => {
      const { isValid, errors } = validateEventData({ ...validInput(), name: '' });
      expect(isValid).toBe(false);
      expect(errors.name).toBeDefined();
    });

    it('rejects a name shorter than 3 characters', () => {
      const { isValid, errors } = validateEventData({ ...validInput(), name: 'AB' });
      expect(isValid).toBe(false);
      expect(errors.name).toMatch(/3 characters/);
    });

    it('accepts a name of exactly 3 characters', () => {
      const { isValid, errors } = validateEventData({ ...validInput(), name: 'ABC' });
      expect(isValid).toBe(true);
      expect(errors.name).toBeUndefined();
    });

    it('rejects a name longer than 100 characters', () => {
      const { isValid, errors } = validateEventData({ ...validInput(), name: 'A'.repeat(101) });
      expect(isValid).toBe(false);
      expect(errors.name).toMatch(/100 characters/);
    });

    it('accepts a name of exactly 100 characters', () => {
      const { isValid, errors } = validateEventData({ ...validInput(), name: 'A'.repeat(100) });
      expect(isValid).toBe(true);
      expect(errors.name).toBeUndefined();
    });
  });

  describe('venue validation', () => {
    it('rejects a missing venue', () => {
      const { isValid, errors } = validateEventData({ ...validInput(), venue: '' });
      expect(isValid).toBe(false);
      expect(errors.venue).toBeDefined();
    });

    it('rejects a venue shorter than 3 characters', () => {
      const { isValid, errors } = validateEventData({ ...validInput(), venue: 'NY' });
      expect(isValid).toBe(false);
      expect(errors.venue).toMatch(/3 characters/);
    });

    it('rejects a venue longer than 200 characters', () => {
      const { isValid, errors } = validateEventData({ ...validInput(), venue: 'V'.repeat(201) });
      expect(isValid).toBe(false);
      expect(errors.venue).toMatch(/200 characters/);
    });
  });

  describe('date validation', () => {
    it('rejects a missing startDate', () => {
      const { isValid, errors } = validateEventData({ ...validInput(), startDate: null });
      expect(isValid).toBe(false);
      expect(errors.startDate).toBeDefined();
    });

    it('rejects a startDate in the past', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const { isValid, errors } = validateEventData({ ...validInput(), startDate: yesterday });
      expect(isValid).toBe(false);
      expect(errors.startDate).toMatch(/today or later/);
    });

    it('accepts a startDate set to today', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 1);
      const { isValid, errors } = validateEventData({ ...validInput(), startDate: today, endDate });
      expect(isValid).toBe(true);
      expect(errors.startDate).toBeUndefined();
    });

    it('rejects a missing endDate', () => {
      const { isValid, errors } = validateEventData({ ...validInput(), endDate: null });
      expect(isValid).toBe(false);
      expect(errors.endDate).toBeDefined();
    });

    it('rejects an endDate equal to startDate', () => {
      const start = futureDate(1);
      const { isValid, errors } = validateEventData({ ...validInput(), startDate: start, endDate: start });
      expect(isValid).toBe(false);
      expect(errors.endDate).toMatch(/after start date/);
    });

    it('rejects an endDate before startDate', () => {
      const { isValid, errors } = validateEventData({
        ...validInput(),
        startDate: futureDate(2),
        endDate: futureDate(1),
      });
      expect(isValid).toBe(false);
      expect(errors.endDate).toMatch(/after start date/);
    });
  });

  describe('multiple errors', () => {
    it('returns multiple errors when multiple fields are invalid', () => {
      const { isValid, errors } = validateEventData({ name: '', venue: '', startDate: null, endDate: null });
      expect(isValid).toBe(false);
      expect(Object.keys(errors).length).toBeGreaterThanOrEqual(3);
    });
  });
});

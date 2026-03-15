/**
 * @jest-environment node
 */
import { getMatchId, normalizeUserData } from '../matchUtils';

describe('getMatchId', () => {
  it('sorts IDs alphabetically so the smaller one comes first', () => {
    expect(getMatchId('user_b', 'user_a')).toBe('user_a|user_b');
  });

  it('is commutative — argument order does not change the result', () => {
    const id1 = getMatchId('user_alice', 'user_bob');
    const id2 = getMatchId('user_bob', 'user_alice');
    expect(id1).toBe(id2);
  });

  it('uses | as the separator', () => {
    const id = getMatchId('aaa', 'bbb');
    expect(id).toContain('|');
    expect(id).toBe('aaa|bbb');
  });

  it('handles identical IDs (same user, edge case)', () => {
    expect(getMatchId('user_x', 'user_x')).toBe('user_x|user_x');
  });
});

describe('normalizeUserData', () => {
  it('returns null when given null or undefined', () => {
    expect(normalizeUserData(null)).toBeNull();
    expect(normalizeUserData(undefined)).toBeNull();
  });

  it('coerces status string "true" to boolean true', () => {
    const result = normalizeUserData({ status: 'true', age: 25 });
    expect(result.status).toBe(true);
    expect(typeof result.status).toBe('boolean');
  });

  it('coerces status string "false" to boolean true (JS Boolean() semantics — non-empty strings are truthy)', () => {
    // Note: Boolean('false') === true in JavaScript. The function uses Boolean()
    // directly and does not parse the string as a false-y value.
    const result = normalizeUserData({ status: 'false', age: 25 });
    expect(result.status).toBe(true);
    expect(typeof result.status).toBe('boolean');
  });

  it('coerces age string to number', () => {
    const result = normalizeUserData({ status: true, age: '28' });
    expect(result.age).toBe(28);
    expect(typeof result.age).toBe('number');
  });

  it('passes through existing boolean status unchanged', () => {
    const result = normalizeUserData({ status: true, age: 30 });
    expect(result.status).toBe(true);
  });

  it('passes through existing numeric age unchanged', () => {
    const result = normalizeUserData({ status: false, age: 22 });
    expect(result.age).toBe(22);
  });

  it('spreads all other fields onto the result', () => {
    const input = { id: 'user_1', name: 'Alice', status: true, age: 24 };
    const result = normalizeUserData(input);
    expect(result.id).toBe('user_1');
    expect(result.name).toBe('Alice');
  });

  it('leaves status undefined when not present in input', () => {
    const result = normalizeUserData({ age: 20 });
    expect(result.status).toBeUndefined();
  });

  it('leaves age undefined when not present in input', () => {
    const result = normalizeUserData({ status: true });
    expect(result.age).toBeUndefined();
  });
});

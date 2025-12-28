import { describe, it, expect } from 'test-anywhere';
import {
  FilterOperators,
  parseFilterValue,
  applyFilter,
  filterLinks,
  describeFilters,
} from '../src/api/filters.mjs';

// ============================================================================
// Filter Parsing Tests
// ============================================================================

describe('parseFilterValue', () => {
  it('parses simple equality', () => {
    const result = parseFilterValue('100');
    expect(result.operator).toBe(FilterOperators.EQUALS);
    expect(result.value).toBe('100');
  });

  it('parses negation with !', () => {
    const result = parseFilterValue('!100');
    expect(result.negated).toBe(true);
    expect(result.value).toBe('100');
  });

  it('parses reference with @', () => {
    const result = parseFilterValue('@123');
    expect(result.operator).toBe(FilterOperators.EQUALS);
    expect(result.value).toBe(123);
    expect(result.isReference).toBe(true);
  });

  it('parses range with ..', () => {
    const result = parseFilterValue('10..20');
    expect(result.operator).toBe(FilterOperators.BETWEEN);
    expect(result.from).toBe(10);
    expect(result.to).toBe(20);
  });

  it('parses open-ended range from', () => {
    const result = parseFilterValue('10..');
    expect(result.operator).toBe(FilterOperators.BETWEEN);
    expect(result.from).toBe(10);
    expect(result.to).toBe(null);
  });

  it('parses open-ended range to', () => {
    const result = parseFilterValue('..20');
    expect(result.operator).toBe(FilterOperators.BETWEEN);
    expect(result.from).toBe(null);
    expect(result.to).toBe(20);
  });

  it('parses comma-separated list', () => {
    const result = parseFilterValue('1,2,3');
    expect(result.operator).toBe(FilterOperators.IN);
    expect(result.values).toEqual(['1', '2', '3']);
  });

  it('parses greater than', () => {
    const result = parseFilterValue('>100');
    expect(result.operator).toBe(FilterOperators.GREATER_THAN);
    expect(result.value).toBe(100);
  });

  it('parses greater than or equals', () => {
    const result = parseFilterValue('>=100');
    expect(result.operator).toBe(FilterOperators.GREATER_THAN_OR_EQUALS);
    expect(result.value).toBe(100);
  });

  it('parses less than', () => {
    const result = parseFilterValue('<100');
    expect(result.operator).toBe(FilterOperators.LESS_THAN);
    expect(result.value).toBe(100);
  });

  it('parses less than or equals', () => {
    const result = parseFilterValue('<=100');
    expect(result.operator).toBe(FilterOperators.LESS_THAN_OR_EQUALS);
    expect(result.value).toBe(100);
  });

  it('parses contains with *value*', () => {
    const result = parseFilterValue('*test*');
    expect(result.operator).toBe(FilterOperators.CONTAINS);
    expect(result.value).toBe('test');
  });

  it('parses starts with value*', () => {
    const result = parseFilterValue('test*');
    expect(result.operator).toBe(FilterOperators.STARTS_WITH);
    expect(result.value).toBe('test');
  });

  it('parses ends with *value', () => {
    const result = parseFilterValue('*test');
    expect(result.operator).toBe(FilterOperators.ENDS_WITH);
    expect(result.value).toBe('test');
  });

  it('parses null value as IS_NULL', () => {
    const result = parseFilterValue(null);
    expect(result.operator).toBe(FilterOperators.IS_NULL);
  });
});

// ============================================================================
// Filter Application Tests
// ============================================================================

describe('applyFilter', () => {
  it('applies equality filter', () => {
    const filter = { operator: FilterOperators.EQUALS, value: '100' };
    expect(applyFilter(100, filter)).toBe(true);
    expect(applyFilter('100', filter)).toBe(true);
    expect(applyFilter(200, filter)).toBe(false);
  });

  it('applies greater than filter', () => {
    const filter = { operator: FilterOperators.GREATER_THAN, value: 100 };
    expect(applyFilter(150, filter)).toBe(true);
    expect(applyFilter(100, filter)).toBe(false);
    expect(applyFilter(50, filter)).toBe(false);
  });

  it('applies less than filter', () => {
    const filter = { operator: FilterOperators.LESS_THAN, value: 100 };
    expect(applyFilter(50, filter)).toBe(true);
    expect(applyFilter(100, filter)).toBe(false);
    expect(applyFilter(150, filter)).toBe(false);
  });

  it('applies between filter', () => {
    const filter = { operator: FilterOperators.BETWEEN, from: 10, to: 20 };
    expect(applyFilter(15, filter)).toBe(true);
    expect(applyFilter(10, filter)).toBe(true);
    expect(applyFilter(20, filter)).toBe(true);
    expect(applyFilter(5, filter)).toBe(false);
    expect(applyFilter(25, filter)).toBe(false);
  });

  it('applies contains filter (case insensitive)', () => {
    const filter = { operator: FilterOperators.CONTAINS, value: 'test' };
    expect(applyFilter('this is a test', filter)).toBe(true);
    expect(applyFilter('TEST value', filter)).toBe(true);
    expect(applyFilter('no match', filter)).toBe(false);
  });

  it('applies starts with filter', () => {
    const filter = { operator: FilterOperators.STARTS_WITH, value: 'hello' };
    expect(applyFilter('hello world', filter)).toBe(true);
    expect(applyFilter('HELLO', filter)).toBe(true);
    expect(applyFilter('world hello', filter)).toBe(false);
  });

  it('applies ends with filter', () => {
    const filter = { operator: FilterOperators.ENDS_WITH, value: 'world' };
    expect(applyFilter('hello world', filter)).toBe(true);
    expect(applyFilter('WORLD', filter)).toBe(true);
    expect(applyFilter('world hello', filter)).toBe(false);
  });

  it('applies IN filter', () => {
    const filter = { operator: FilterOperators.IN, values: ['1', '2', '3'] };
    expect(applyFilter(1, filter)).toBe(true);
    expect(applyFilter('2', filter)).toBe(true);
    expect(applyFilter(4, filter)).toBe(false);
  });

  it('applies negation', () => {
    const filter = {
      operator: FilterOperators.EQUALS,
      value: '100',
      negated: true,
    };
    expect(applyFilter(100, filter)).toBe(false);
    expect(applyFilter(200, filter)).toBe(true);
  });
});

// ============================================================================
// Filter Links Tests
// ============================================================================

describe('filterLinks', () => {
  const testLinks = [
    { id: 1, source: 100, target: 200 },
    { id: 2, source: 100, target: 300 },
    { id: 3, source: 200, target: 300 },
    { id: 4, source: 300, target: 400 },
  ];

  it('filters by id', () => {
    const result = filterLinks(testLinks, { id: '1' });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(1);
  });

  it('filters by source', () => {
    const result = filterLinks(testLinks, { source: '100' });
    expect(result.length).toBe(2);
    expect(result[0].source).toBe(100);
    expect(result[1].source).toBe(100);
  });

  it('filters by target', () => {
    const result = filterLinks(testLinks, { target: '300' });
    expect(result.length).toBe(2);
  });

  it('filters by multiple criteria (AND)', () => {
    const result = filterLinks(testLinks, { source: '100', target: '200' });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(1);
  });

  it('returns all links with no filters', () => {
    const result = filterLinks(testLinks, {});
    expect(result.length).toBe(4);
  });

  it('filters with range', () => {
    const result = filterLinks(testLinks, { id: '1..2' });
    expect(result.length).toBe(2);
  });

  it('filters with negation', () => {
    const result = filterLinks(testLinks, { source: '!100' });
    expect(result.length).toBe(2);
    expect(result.every((l) => l.source !== 100)).toBe(true);
  });
});

// ============================================================================
// Describe Filters Tests
// ============================================================================

describe('describeFilters', () => {
  it('returns "no filters" for empty object', () => {
    expect(describeFilters({})).toBe('no filters');
  });

  it('returns "no filters" for null', () => {
    expect(describeFilters(null)).toBe('no filters');
  });

  it('describes equality filter', () => {
    const desc = describeFilters({ source: '100' });
    expect(desc).toContain('source');
    expect(desc).toContain('100');
  });

  it('describes range filter', () => {
    const desc = describeFilters({ id: '1..10' });
    expect(desc).toContain('BETWEEN');
  });

  it('describes IN filter', () => {
    const desc = describeFilters({ source: '1,2,3' });
    expect(desc).toContain('IN');
  });

  it('describes contains filter', () => {
    const desc = describeFilters({ value: '*test*' });
    expect(desc).toContain('CONTAINS');
  });
});

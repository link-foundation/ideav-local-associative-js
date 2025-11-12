import { describe, it, expect } from 'bun:test';
import { Parser, formatLinks } from 'links-notation';

describe('links-notation basic', () => {
  it('parses a simple link and formats back', () => {
    const parser = new Parser();
    const input = "(status: ok)";
    const links = parser.parse(input);
    const out = formatLinks(links);
    expect(out).toBe('(status: ok)');
  });
});


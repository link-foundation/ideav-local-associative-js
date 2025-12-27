import { describe, it, expect } from 'test-anywhere';
import { Parser, formatLinks } from 'links-notation';

describe('links-notation basic', () => {
  it('parses a simple link and formats back', () => {
    const parser = new Parser();
    const input = '(status: ok)';
    const links = parser.parse(input);
    const out = formatLinks(links);
    expect(out).toBe('(status: ok)');
  });

  it('parses nested links', () => {
    const parser = new Parser();
    const input = '(user: (name: John))';
    const links = parser.parse(input);
    const out = formatLinks(links);
    expect(out).toContain('user');
    expect(out).toContain('name');
    expect(out).toContain('John');
  });
});

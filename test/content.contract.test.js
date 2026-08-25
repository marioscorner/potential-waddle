import assert from 'node:assert/strict';
import test from 'node:test';
import { getValidationError, mergeDefaults } from '../server/routes/content.js';

test('mergeDefaults preserves defaults while accepting stored nested content', () => {
  const defaults = {
    title: { en: 'Default title', es: 'Titulo por defecto' },
    links: ['default'],
    nested: { visible: true, label: 'Default label' },
  };
  const stored = {
    title: { en: 'Stored title' },
    links: ['stored'],
    nested: { label: 'Stored label' },
  };

  assert.deepEqual(mergeDefaults(defaults, stored), {
    title: { en: 'Stored title', es: 'Titulo por defecto' },
    links: ['stored'],
    nested: { visible: true, label: 'Stored label' },
  });
});

test('content URL validation only accepts HTTP(S) destinations', () => {
  assert.equal(getValidationError('featured', { url: 'https://example.com/project' }), null);
  assert.equal(getValidationError('projects', { url: 'javascript:alert(1)' }), 'Target URL must use http:// or https://');
  assert.equal(getValidationError('social', [{ url: 'https://example.com' }, { url: 'ftp://example.com' }]), 'Every social link must use http:// or https://');
  assert.equal(getValidationError('about', { url: 'javascript:alert(1)' }), null);
});

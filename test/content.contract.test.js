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
  assert.equal(getValidationError('featured', {
    url: 'https://example.com/project',
    es: { title: 'Proyecto' },
    en: { title: 'Project' },
  }), null);
  assert.equal(getValidationError('projects', { url: 'javascript:alert(1)' }), 'Target URL must use http:// or https://');
  assert.equal(getValidationError('social', [{ url: 'https://example.com' }, { url: 'ftp://example.com' }]), 'Every social link must use http:// or https://');
  assert.equal(getValidationError('hero', {
    es: { greeting: 'Hola' },
    en: { greeting: 'Hi' },
    url: 'javascript:alert(1)',
  }), null);
});

test('content validation only accepts known sections with valid shapes', () => {
  assert.equal(getValidationError('unknown', { value: 'test' }), 'Unknown content section');
  assert.equal(getValidationError('footer', { es: { madeWith: 'Hecho con' }, en: 'invalid' }), 'This section requires Spanish and English text');
  assert.equal(getValidationError('sectionTitles', {
    es: { technologies: 'Tecnologías' },
    en: { technologies: 'Technologies' },
  }), null);
  assert.equal(getValidationError('experience', [{
    company: 'Example',
    startDate: '2026-01',
    endDate: '',
    isCurrent: true,
    position: { es: 'Puesto', en: 'Role' },
    responsibilities: { es: ['Tarea'], en: ['Task'] },
  }]), null);
  assert.equal(getValidationError('experience', [{
    company: 'Example',
    startDate: 'invalid',
    endDate: '',
    isCurrent: true,
    position: { es: 'Puesto', en: 'Role' },
    responsibilities: { es: ['Tarea'], en: ['Task'] },
  }]), 'Experience entries require valid dates and Spanish and English text');
});

test('search metadata requires concise, non-empty content in both languages', () => {
  const validMeta = {
    es: { title: 'Desarrollador full stack', description: 'Portfolio de desarrollo web y software.' },
    en: { title: 'Full stack developer', description: 'Web and software development portfolio.' },
  };

  assert.equal(getValidationError('meta', validMeta), null);
  assert.equal(getValidationError('meta', {
    ...validMeta,
    es: { ...validMeta.es, title: '   ' },
  }), 'Search titles must be 1-60 characters and descriptions must be 1-160 characters');
  assert.equal(getValidationError('meta', {
    ...validMeta,
    en: { ...validMeta.en, description: 'a'.repeat(161) },
  }), 'Search titles must be 1-60 characters and descriptions must be 1-160 characters');
});

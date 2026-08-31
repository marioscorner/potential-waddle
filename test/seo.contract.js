import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import app, { setAstroHandler } from '../server/index.js';
import { handler } from '../dist/server/entry.mjs';

// This integration contract is invoked by `pnpm test:seo` after building Astro.
setAstroHandler(handler);

const getAttribute = (tag, attribute) => {
  const match = tag.match(new RegExp(`\\b${attribute}="([^"]*)"`, 'i'));
  return match?.[1] || null;
};

const getMeta = (html, attribute, value) => {
  const tag = [...html.matchAll(/<meta\b[^>]*>/gi)]
    .map((match) => match[0])
    .find((entry) => getAttribute(entry, attribute) === value);
  return tag ? getAttribute(tag, 'content') : null;
};

const getLinks = (html, rel) => [...html.matchAll(/<link\b[^>]*>/gi)]
  .map((match) => match[0])
  .filter((tag) => getAttribute(tag, 'rel') === rel);

const request = async (server, path) => {
  const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
    redirect: 'manual',
  });

  return {
    body: await response.text(),
    headers: response.headers,
    status: response.status,
  };
};

const assertPublicMetadata = (html, language, title, description) => {
  const canonical = `https://marioscorner.com/${language}/`;
  const expectedAlternates = new Map([
    ['es', 'https://marioscorner.com/es/'],
    ['en', 'https://marioscorner.com/en/'],
    ['x-default', 'https://marioscorner.com/es/'],
  ]);

  assert.match(html, new RegExp(`<html lang="${language}"`));
  assert.match(html, new RegExp(`<title>${title}</title>`));
  assert.equal(getMeta(html, 'name', 'description'), description);
  assert.equal(getAttribute(getLinks(html, 'canonical')[0], 'href'), canonical);

  const alternates = new Map(getLinks(html, 'alternate').map((tag) => [
    getAttribute(tag, 'hreflang'),
    getAttribute(tag, 'href'),
  ]));
  assert.deepEqual(alternates, expectedAlternates);

  assert.equal(getMeta(html, 'property', 'og:type'), 'profile');
  assert.equal(getMeta(html, 'property', 'og:title'), title);
  assert.equal(getMeta(html, 'property', 'og:description'), description);
  assert.equal(getMeta(html, 'property', 'og:url'), canonical);
  assert.match(getMeta(html, 'property', 'og:image'), /^https:\/\/marioscorner\.com\//);
  assert.equal(getMeta(html, 'name', 'twitter:card'), 'summary_large_image');
  assert.equal(getMeta(html, 'name', 'twitter:title'), title);
  assert.equal(getMeta(html, 'name', 'twitter:description'), description);

  const schemaScript = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];
  assert.ok(schemaScript, 'public pages must include JSON-LD');
  const schema = JSON.parse(schemaScript);
  const profile = schema['@graph'].find((entry) => entry['@type'] === 'ProfilePage');
  assert.equal(profile.url, canonical);
  assert.equal(profile.inLanguage, language);
  assert.equal(profile.mainEntity['@type'], 'Person');
  assert.equal(profile.mainEntity.name, 'Mario Gutiérrez');
  assert.equal(profile.mainEntity.alternateName, 'marioscorner');
  assert.equal(profile.mainEntity.url, 'https://marioscorner.com/');
  assert.match(profile.mainEntity.image, /^https:\/\/marioscorner\.com\//);
};

const assertPrivateMetadata = (html, headers) => {
  assert.equal(getMeta(html, 'name', 'robots'), 'noindex, nofollow, noarchive');
  assert.equal(headers.get('x-robots-tag'), 'noindex, nofollow, noarchive');
  assert.equal(getLinks(html, 'canonical').length, 0);
  assert.equal(getLinks(html, 'alternate').length, 0);
  assert.equal(getMeta(html, 'property', 'og:title'), null);
  assert.equal(html.includes('application/ld+json'), false);
};

test('server-rendered pages preserve SEO delivery contracts', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));

  await t.test('Spanish and English pages expose complete public metadata', async () => {
    const spanish = await request(server, '/es/');
    assert.equal(spanish.status, 200);
    assert.match(spanish.headers.get('content-type'), /^text\/html/);
    assertPublicMetadata(
      spanish.body,
      'es',
      'Mario Gutiérrez | Desarrollador Full Stack en Madrid',
      'Portfolio de Mario Gutiérrez, desarrollador full stack en Madrid. Proyectos con TypeScript, React, Node.js, Python y PostgreSQL.'
    );

    const english = await request(server, '/en/');
    assert.equal(english.status, 200);
    assert.match(english.headers.get('content-type'), /^text\/html/);
    assertPublicMetadata(
      english.body,
      'en',
      'Mario Gutiérrez | Full Stack Developer in Madrid',
      'Portfolio of Mario Gutiérrez, a full stack developer in Madrid. Projects built with TypeScript, React, Node.js, Python and PostgreSQL.'
    );
  });

  await t.test('admin and not-found pages are not indexable', async () => {
    for (const path of ['/admin/', '/admin/dashboard/']) {
      const response = await request(server, path);
      assert.equal(response.status, 200);
      assertPrivateMetadata(response.body, response.headers);
    }

    const notFound = await request(server, '/does-not-exist');
    assert.equal(notFound.status, 404);
    assert.match(notFound.body, /The requested page does not exist\./);
    assert.equal(getMeta(notFound.body, 'name', 'robots'), 'noindex, nofollow, noarchive');
    assert.equal(getLinks(notFound.body, 'canonical').length, 0);
    assert.equal(getLinks(notFound.body, 'alternate').length, 0);
    assert.equal(getMeta(notFound.body, 'property', 'og:title'), null);
    assert.equal(notFound.body.includes('application/ld+json'), false);
  });

  await t.test('robots and sitemap declare only the canonical language pages', async () => {
    const robots = await request(server, '/robots.txt');
    assert.equal(robots.status, 200);
    assert.match(robots.body, /^User-agent: \*$/m);
    assert.match(robots.body, /^Allow: \/$/m);
    assert.doesNotMatch(robots.body, /^Disallow: \/admin/m);
    assert.match(robots.body, /Sitemap: https:\/\/marioscorner\.com\/sitemap\.xml/);

    const sitemap = await request(server, '/sitemap.xml');
    assert.equal(sitemap.status, 200);
    assert.match(sitemap.headers.get('content-type'), /xml/);
    assert.deepEqual([...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]), [
      'https://marioscorner.com/es/',
      'https://marioscorner.com/en/',
    ]);

    for (const language of ['es', 'en']) {
      assert.match(sitemap.body, new RegExp(`<xhtml:link rel="alternate" hreflang="${language}" href="https://marioscorner.com/${language}/"`));
    }
    assert.equal((sitemap.body.match(/hreflang="x-default"/g) || []).length, 2);
  });
});

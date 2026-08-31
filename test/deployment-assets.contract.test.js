import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import defaultContent from '../server/routes/defaultContent.js';

test('the initial Spanish CV and employment status are ready for a fresh deployment', async () => {
  const [publicCv, uploadedCv] = await Promise.all([
    readFile(new URL('../public/cv-es.pdf', import.meta.url)),
    readFile(new URL('../uploads/cv-es.pdf', import.meta.url)),
  ]);

  assert.deepEqual(uploadedCv, publicCv);
  assert.equal(publicCv.subarray(0, 5).toString('ascii'), '%PDF-');
  assert.equal(defaultContent.status.es.available, 'Trabajando');
  assert.equal(defaultContent.status.es.statusDetail, 'Actualmente formo parte del equipo de Eco Combustión.');
  assert.equal(defaultContent.status.en.available, 'Working');
  assert.equal(defaultContent.status.en.statusDetail, "I'm currently part of the Eco Combustión team.");
});

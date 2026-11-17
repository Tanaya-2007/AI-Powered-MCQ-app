import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { extractTextFromFile } from '../utils/parser.js';

// Minimal hand-built one-page PDF so CI needs no fixtures or extra deps.
function tinyPdf(text) {
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    null,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  const stream = `BT /F1 12 Tf 72 720 Td (${text}) Tj ET`;
  objs[3] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  let out = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((o, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return out;
}

test('extracts text from a PDF (pdf-parse v2 API) without page markers', async () => {
  const f = path.join(os.tmpdir(), `t-${Date.now()}.pdf`);
  fs.writeFileSync(f, tinyPdf('Mitochondria produce ATP'));
  try {
    const text = await extractTextFromFile(f, 'application/pdf');
    assert.match(text, /Mitochondria produce ATP/);
    assert.doesNotMatch(text, /-- \d+ of \d+ --/);
  } finally { fs.unlinkSync(f); }
});

test('image-only PDF with no Gemini key returns empty text instead of crashing', async () => {
  for (const k of ['GEMINI_API_KEY', 'GEMINI_API_KEYS']) delete process.env[k];
  const f = path.join(os.tmpdir(), `scan-${Date.now()}.pdf`);
  fs.writeFileSync(f, tinyPdf(''));
  try {
    const text = await extractTextFromFile(f, 'application/pdf');
    assert.equal(text, '');
  } finally { fs.unlinkSync(f); }
});

test('image OCR without a Gemini key throws a clear error', async () => {
  for (const k of ['GEMINI_API_KEY', 'GEMINI_API_KEYS']) delete process.env[k];
  const f = path.join(os.tmpdir(), `i-${Date.now()}.png`);
  fs.writeFileSync(f, 'x');
  try {
    await assert.rejects(() => extractTextFromFile(f, 'image/png'), /key is missing/i);
  } finally { fs.unlinkSync(f); }
});

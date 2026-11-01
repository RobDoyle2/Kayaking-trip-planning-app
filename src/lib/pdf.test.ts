import assert from 'node:assert/strict';
import test from 'node:test';
import { makePdf, pdfBytes, toWinAnsi, wrapWords } from './pdf';

const para = (text: string) => ({ kind: 'para' as const, runs: [{ text }] });

function parsePdf(pdf: string) {
  const startxref = Number(/startxref\n(\d+)\n%%EOF\n$/.exec(pdf)![1]);
  assert.equal(pdf.slice(startxref, startxref + 4), 'xref', 'startxref points at the xref table');
  const count = Number(/xref\n0 (\d+)\n/.exec(pdf.slice(startxref))![1]);
  const entries = pdf.slice(startxref).split('\n').slice(2, 2 + count);
  // Entry n must point at "n 0 obj".
  for (let n = 1; n < count; n++) {
    const offset = Number(entries[n]!.slice(0, 10));
    assert.equal(pdf.slice(offset, offset + `${n} 0 obj`.length), `${n} 0 obj`, `object ${n} is where the table says`);
  }
  return { count, pages: Number(/\/Count (\d+)/.exec(pdf)![1]) };
}

test('a small document is a well-formed PDF with a correct cross-reference table', () => {
  const pdf = makePdf([{ kind: 'title', text: 'Howth loop' }, para('Hello world')], { title: 'Howth loop' });
  assert.ok(pdf.startsWith('%PDF-1.4'));
  const info = parsePdf(pdf);
  assert.equal(info.pages, 1);
  assert.match(pdf, /\(Howth\) Tj\n\( loop\) Tj/);
});

test('every stream length is exact', () => {
  const pdf = makePdf([{ kind: 'title', text: 'T' }, ...Array.from({ length: 200 }, (_, i) => para(`Line number ${i} with some words to fill the page.`))], { title: 'T' });
  const re = /<< \/Length (\d+) >>\nstream\n([\s\S]*?)\nendstream/g;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(pdf))) {
    assert.equal(Number(m[1]), m[2]!.length);
    n++;
  }
  assert.ok(n >= 3, 'long text runs onto several pages');
  assert.equal(parsePdf(pdf).pages, n);
});

test('the file is plain ASCII, so its length is its size in bytes', () => {
  const pdf = makePdf([para('Ireland’s Eye – Dún Laoghaire “quoted” café ünï ☃ 日本')], { title: 'Ireland’s Eye ☃' });
  assert.ok(/^[\x00-\x7f]*$/.test(pdf));
  assert.equal(pdfBytes(pdf).length, pdf.length);
  assert.match(pdf, /\\222/, 'a curly apostrophe is written as byte 0x92 (octal 222)');
  assert.match(pdf, /D\\372n/, 'ú is written as byte 0xFA');
});

test('brackets and backslashes are escaped', () => {
  const pdf = makePdf([para('a (b) c \\ d')], { title: 't' });
  assert.match(pdf, /\(a\) Tj\n\( \\\(b\\\)\) Tj\n\( c\) Tj\n\( \\\\\) Tj\n\( d\) Tj/);
});

test('characters Windows-1252 has no place for become a question mark', () => {
  assert.equal(toWinAnsi('☃'), 63);
  assert.equal(toWinAnsi('é'), 0xe9);
  assert.equal(toWinAnsi('’'), 0x92);
  assert.equal(toWinAnsi('\n'), 32);
});

test('wrapping keeps lines inside the width and splits a very long word', () => {
  const words = 'The quick brown fox jumps over the lazy dog '.repeat(10).split(' ').filter(Boolean).map((text) => ({ text, bold: false }));
  const lines = wrapWords(words, 200, 10);
  assert.ok(lines.length > 5);
  const long = wrapWords([{ text: 'x'.repeat(300), bold: false }], 100, 10);
  assert.ok(long.length > 3);
  assert.equal(long.map((l) => l.map((w) => w.text).join('')).join(''), 'x'.repeat(300), 'nothing is lost when a long word is split');
});

test('an empty document still produces a valid one-page PDF', () => {
  const pdf = makePdf([], { title: 'Empty' });
  assert.equal(parsePdf(pdf).pages, 1);
});

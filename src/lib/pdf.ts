/**
 * A small PDF writer for plain documents: a title, headings, and paragraphs of text with bold labels.
 * It uses the two standard PDF fonts (Helvetica and Helvetica-Bold), so nothing is embedded and nothing is fetched.
 * Text is encoded as Windows-1252, which covers English, Irish and most Western European letters; any other character
 * is written as "?". Everything is built in the browser, so no plan is sent anywhere.
 */
import { helveticaBoldWidths, helveticaWidths } from './pdfMetrics';

export interface Run {
  text: string;
  bold?: boolean;
}

export type PdfBlock =
  | { kind: 'title'; text: string }
  | { kind: 'subtitle'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'para'; runs: Run[]; indent?: number }
  | { kind: 'gap' };

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 50;
const BODY_SIZE = 10;
const LINE = 13;

const CP1252_SPECIAL: Record<number, number> = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89,
  0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95,
  0x2013: 0x96, 0x2014: 0x97, 0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f,
};

/** Maps one character to its Windows-1252 byte, or 63 ("?") if it has none. */
export function toWinAnsi(char: string): number {
  const code = char.codePointAt(0) ?? 63;
  if (code === 9 || code === 10 || code === 13) return 32;
  if (code >= 32 && code <= 126) return code;
  if (code >= 0xa0 && code <= 0xff) return code;
  return CP1252_SPECIAL[code] ?? 63;
}

function charWidth(byte: number, bold: boolean, size: number): number {
  const table = bold ? helveticaBoldWidths : helveticaWidths;
  const w = byte >= 32 ? table[byte - 32] : 0;
  return ((w ?? 0) / 1000) * size;
}

function textWidth(text: string, bold: boolean, size: number): number {
  let w = 0;
  for (const ch of text) w += charWidth(toWinAnsi(ch), bold, size);
  return w;
}

/** Escapes a string for a PDF literal string, writing every byte outside plain ASCII as an octal escape. */
function pdfString(text: string): string {
  let out = '';
  for (const ch of text) {
    const b = toWinAnsi(ch);
    if (b === 40 || b === 41 || b === 92) out += `\\${String.fromCharCode(b)}`;
    else if (b < 32 || b > 126) out += `\\${b.toString(8).padStart(3, '0')}`;
    else out += String.fromCharCode(b);
  }
  return out;
}

function hexUtf16(text: string): string {
  let out = 'FEFF';
  for (let i = 0; i < text.length; i++) out += text.charCodeAt(i).toString(16).padStart(4, '0').toUpperCase();
  return `<${out}>`;
}

interface Word {
  text: string;
  bold: boolean;
}

function wordsOf(runs: Run[]): Word[] {
  const words: Word[] = [];
  for (const run of runs) {
    for (const piece of run.text.split(/\s+/)) if (piece !== '') words.push({ text: piece, bold: run.bold === true });
  }
  return words;
}

/** Breaks words into lines no wider than maxWidth. A single word wider than a line is split across lines. */
export function wrapWords(words: Word[], maxWidth: number, size: number, firstLineWidth = maxWidth): Word[][] {
  const lines: Word[][] = [];
  let line: Word[] = [];
  let used = 0;
  let limit = firstLineWidth;
  const space = (bold: boolean) => charWidth(32, bold, size);
  const flush = () => {
    lines.push(line);
    line = [];
    used = 0;
    limit = maxWidth;
  };
  for (const original of words) {
    let word = original;
    while (textWidth(word.text, word.bold, size) > maxWidth) {
      // Split a very long word (a web address, say) at the last place that fits.
      let cut = 1;
      while (cut < word.text.length && textWidth(word.text.slice(0, cut + 1), word.bold, size) <= maxWidth) cut++;
      if (line.length > 0) flush();
      line.push({ text: word.text.slice(0, cut), bold: word.bold });
      flush();
      word = { text: word.text.slice(cut), bold: word.bold };
    }
    const w = textWidth(word.text, word.bold, size);
    const needed = line.length === 0 ? w : used + space(word.bold) + w;
    if (line.length > 0 && needed > limit) flush();
    used = line.length === 0 ? w : used + space(word.bold) + w;
    line.push(word);
  }
  if (line.length > 0 || lines.length === 0) lines.push(line);
  return lines;
}

interface PlacedLine {
  words: Word[];
  x: number;
  y: number;
  size: number;
  /** Used for heading lines, drawn entirely bold. */
  allBold: boolean;
}

export interface PdfOptions {
  title: string;
  footer?: string;
}

/** Builds the PDF. The result is a string in which every character is one byte (all ASCII), so its length is its size in bytes. */
export function makePdf(blocks: PdfBlock[], options: PdfOptions): string {
  const pages: PlacedLine[][] = [[]];
  let y = PAGE_H - MARGIN;
  const bottom = MARGIN + 20;
  const usable = PAGE_W - 2 * MARGIN;

  const newPage = () => {
    pages.push([]);
    y = PAGE_H - MARGIN;
  };
  const ensure = (needed: number) => {
    if (y - needed < bottom) newPage();
  };

  for (const block of blocks) {
    if (block.kind === 'gap') {
      y -= LINE * 0.6;
      continue;
    }
    if (block.kind === 'title' || block.kind === 'subtitle' || block.kind === 'heading') {
      const size = block.kind === 'title' ? 18 : block.kind === 'heading' ? 12 : 10;
      const bold = block.kind !== 'subtitle';
      const lead = size + 5;
      if (block.kind === 'heading') {
        ensure(lead * 2 + LINE);
        y -= 8;
      }
      const lines = wrapWords(wordsOf([{ text: block.text, bold }]), usable, size);
      for (const words of lines) {
        ensure(lead);
        y -= lead;
        pages[pages.length - 1]!.push({ words, x: MARGIN, y, size, allBold: bold });
      }
      y -= block.kind === 'heading' ? 2 : 3;
      continue;
    }
    const indent = block.indent ?? 0;
    const lines = wrapWords(wordsOf(block.runs), usable - indent, BODY_SIZE);
    for (const words of lines) {
      ensure(LINE);
      y -= LINE;
      pages[pages.length - 1]!.push({ words, x: MARGIN + indent, y, size: BODY_SIZE, allBold: false });
    }
    y -= 2;
  }

  const total = pages.length;
  const footer = options.footer ?? '';
  const streams = pages.map((lines, index) => {
    const ops: string[] = ['BT'];
    let font = '';
    let pos = { x: 0, y: 0 };
    const setFont = (bold: boolean, size: number) => {
      const f = `${bold ? 'F2' : 'F1'} ${size}`;
      if (f !== font) {
        ops.push(`/${bold ? 'F2' : 'F1'} ${size} Tf`);
        font = f;
      }
    };
    const moveTo = (x: number, yy: number) => {
      ops.push(`${(x - pos.x).toFixed(2)} ${(yy - pos.y).toFixed(2)} Td`);
      pos = { x, y: yy };
    };
    for (const line of lines) {
      moveTo(line.x, line.y);
      line.words.forEach((word, i) => {
        const bold = line.allBold || word.bold;
        setFont(bold, line.size);
        const prefix = i === 0 ? '' : ' ';
        ops.push(`(${pdfString(prefix + word.text)}) Tj`);
      });
    }
    const label = `${footer ? footer + '   ' : ''}Page ${index + 1} of ${total}`;
    setFont(false, 8);
    moveTo(MARGIN, MARGIN - 10);
    ops.push(`(${pdfString(label)}) Tj`);
    ops.push('ET');
    return ops.join('\n');
  });

  // Objects: 1 catalog, 2 page tree, 3 and 4 fonts, 5 info, then a page and a content stream for each page.
  const objects: string[] = [];
  const pageObjNumbers = pages.map((_, i) => 6 + i * 2);
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pageObjNumbers.map((n) => `${n} 0 R`).join(' ')}] /Count ${total} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
  objects[5] = `<< /Title ${hexUtf16(options.title)} /Producer (Sea Kayaking Hub) >>`;
  streams.forEach((stream, i) => {
    const pageNo = 6 + i * 2;
    objects[pageNo] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pageNo + 1} 0 R >>`;
    objects[pageNo + 1] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (let n = 1; n < objects.length; n++) {
    offsets[n] = out.length;
    out += `${n} 0 obj\n${objects[n]}\nendobj\n`;
  }
  const xrefAt = out.length;
  out += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let n = 1; n < objects.length; n++) out += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`;
  out += `trailer\n<< /Size ${objects.length} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
  return out;
}

/** Turns the all-ASCII PDF string into bytes. */
export function pdfBytes(pdf: string): Uint8Array {
  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
  return bytes;
}

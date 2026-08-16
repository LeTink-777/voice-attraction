import { PDFDocument, rgb, type PDFFont, type PDFPage, type RGB } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {
  serifRegular,
  serifBold,
  sansRegular,
  sansBold,
  decodeFont,
} from './fonts';

/*
 * Генерация PDF на pdf-lib.
 *
 * Почему не @react-pdf/renderer: он компилирует свой движок раскладки (yoga)
 * из WebAssembly во время выполнения, а Cloudflare Workers запрещают
 * runtime-компиляцию WASM. pdf-lib — чистый JavaScript и работает везде.
 *
 * Раскладка (перенос строк и разбиение на страницы) реализована здесь вручную
 * в два прохода: сначала измеряем строки, затем рисуем подложку и текст
 * поверх неё — pdf-lib рисует в порядке вызовов и не имеет z-index.
 */

export interface PdfSection {
  title: string;
  content: string;
}

export interface PdfData {
  title: string;
  userName: string;
  sections: PdfSection[];
  siteName: string;
  accentColor?: string;
  theme?: 'dark' | 'light';
  fontFamily?: 'PTSerif' | 'PTSans';
  subtitle?: string;
}

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 46;
const CONTENT_WIDTH = A4.width - MARGIN * 2;
const FOOTER_SPACE = 46;
const PAD = 14;
const INNER_WIDTH = CONTENT_WIDTH - PAD * 2;

const BODY_SIZE = 10.5;
const BODY_LEAD = 15.5;
const TITLE_SIZE = 12.5;
const TITLE_LEAD = 17;

function hexToRgb(hex: string): RGB {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean.split('').map((c) => c + c).join('')
      : clean;
  const n = parseInt(full, 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] {
  const lines: string[] = [];

  for (const paragraph of text.split('\n')) {
    if (paragraph.trim() === '') {
      lines.push('');
      continue;
    }

    let current = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current) lines.push(current);

      if (font.widthOfTextAtSize(word, size) > maxWidth) {
        let chunk = '';
        for (const ch of word) {
          if (font.widthOfTextAtSize(chunk + ch, size) > maxWidth) {
            lines.push(chunk);
            chunk = ch;
          } else {
            chunk += ch;
          }
        }
        current = chunk;
      } else {
        current = word;
      }
    }
    if (current) lines.push(current);
  }

  return lines;
}

/**
 * Убирает символы, отсутствующие в подмножестве встроенного шрифта:
 * pdf-lib выбрасывает исключение при попытке нарисовать неизвестный глиф.
 */
const ALLOWED = new RegExp(
  '[^' +
    '\\u0020-\\u007E' +
    '\\u00A0\\u00A9\\u00AB\\u00BB\\u00B0\\u00B7\\u00D7' +
    '\\u0400-\\u045F\\u0490\\u0491' +
    '\\u2010-\\u2015' +
    '\\u2018-\\u201F' +
    '\\u2022\\u2026\\u2116\\u20BD\\u2192' +
    '\\n' +
    ']',
  'g'
);

function sanitize(text: string): string {
  return text
    .replace(/\u00A0/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u2028\u2029]/g, '\n')
    .replace(/\t/g, '    ')
    .replace(ALLOWED, '');
}

interface Line {
  text: string;
  bold: boolean;
  height: number;
  size: number;
}

export async function generatePDF(data: PdfData): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const serif = data.fontFamily !== 'PTSans';
  const regular = await doc.embedFont(
    decodeFont(serif ? serifRegular : sansRegular),
    { subset: true }
  );
  const bold = await doc.embedFont(decodeFont(serif ? serifBold : sansBold), {
    subset: true,
  });

  doc.setTitle(sanitize(data.title));
  doc.setAuthor('Евдокимов Даниил Владимирович');
  doc.setCreator(sanitize(data.siteName));

  const light = data.theme === 'light';
  const accent = hexToRgb(data.accentColor || '#C8A96E');
  const bg = light ? rgb(1, 1, 1) : hexToRgb('#0A0A0A');
  const cardBg = light ? hexToRgb('#EEF1F5') : hexToRgb('#161616');
  const bodyColor = light ? hexToRgb('#1A2332') : hexToRgb('#F0EDE8');
  const mutedColor = light ? hexToRgb('#5A6472') : hexToRgb('#A9A398');
  const ruleColor = light ? hexToRgb('#DDE1E6') : hexToRgb('#333333');

  const pages: PDFPage[] = [];

  const newPage = (): PDFPage => {
    const page = doc.addPage([A4.width, A4.height]);
    page.drawRectangle({
      x: 0,
      y: 0,
      width: A4.width,
      height: A4.height,
      color: bg,
    });
    pages.push(page);
    return page;
  };

  let page = newPage();
  let y = A4.height - MARGIN;

  const drawCentered = (
    text: string,
    font: PDFFont,
    size: number,
    color: RGB,
    lead: number
  ) => {
    for (const line of wrapText(text, font, size, CONTENT_WIDTH)) {
      const w = font.widthOfTextAtSize(line, size);
      page.drawText(line, {
        x: (A4.width - w) / 2,
        y: y - size,
        size,
        font,
        color,
      });
      y -= lead;
    }
  };

  // --- Шапка документа ---
  drawCentered(sanitize(data.title), bold, 21, accent, 27);
  y -= 4;

  if (data.subtitle) {
    drawCentered(sanitize(data.subtitle), regular, 10, mutedColor, 14);
  }

  const userName = sanitize(data.userName);
  if (userName) {
    y -= 6;
    drawCentered(userName, regular, 12, mutedColor, 18);
  }

  y -= 8;
  page.drawRectangle({
    x: MARGIN,
    y,
    width: CONTENT_WIDTH,
    height: 0.8,
    color: ruleColor,
  });
  y -= 24;

  // --- Секции ---
  for (const section of data.sections) {
    const lines: Line[] = [
      ...wrapText(sanitize(section.title), bold, TITLE_SIZE, INNER_WIDTH).map(
        (text): Line => ({ text, bold: true, height: TITLE_LEAD, size: TITLE_SIZE })
      ),
      ...wrapText(sanitize(section.content), regular, BODY_SIZE, INNER_WIDTH).map(
        (text): Line => ({ text, bold: false, height: BODY_LEAD, size: BODY_SIZE })
      ),
    ];

    let index = 0;
    while (index < lines.length) {
      let available = y - FOOTER_SPACE - PAD * 2;

      // На странице не осталось места под осмысленный кусок — переносим.
      if (available < BODY_LEAD * 3) {
        page = newPage();
        y = A4.height - MARGIN;
        available = y - FOOTER_SPACE - PAD * 2;
      }

      const chunk: Line[] = [];
      let used = 0;
      while (index < lines.length && used + lines[index].height <= available) {
        used += lines[index].height;
        chunk.push(lines[index]);
        index++;
      }

      // Защита от зацикливания на аномально высокой строке.
      if (chunk.length === 0) {
        used = lines[index].height;
        chunk.push(lines[index]);
        index++;
      }

      const cardHeight = used + PAD * 2;
      const cardBottom = y - cardHeight;

      // 1) подложка
      page.drawRectangle({
        x: MARGIN,
        y: cardBottom,
        width: CONTENT_WIDTH,
        height: cardHeight,
        color: cardBg,
      });
      page.drawRectangle({
        x: MARGIN,
        y: cardBottom,
        width: 2.5,
        height: cardHeight,
        color: accent,
      });

      // 2) текст поверх
      let cursor = y - PAD;
      for (const line of chunk) {
        if (line.text !== '') {
          page.drawText(line.text, {
            x: MARGIN + PAD,
            y: cursor - line.size,
            size: line.size,
            font: line.bold ? bold : regular,
            color: line.bold ? accent : bodyColor,
          });
        }
        cursor -= line.height;
      }

      y = cardBottom - 13;

      if (index < lines.length) {
        page = newPage();
        y = A4.height - MARGIN;
      }
    }
  }

  // --- Подвал на каждой странице ---
  const footer = sanitize(
    `${data.siteName} · Евдокимов Даниил Владимирович · ИНН 381928138362 · Самозанятый`
  );
  const total = pages.length;
  pages.forEach((p, i) => {
    const w = regular.widthOfTextAtSize(footer, 8);
    p.drawText(footer, {
      x: (A4.width - w) / 2,
      y: 26,
      size: 8,
      font: regular,
      color: mutedColor,
    });
    const num = `${i + 1} / ${total}`;
    const nw = regular.widthOfTextAtSize(num, 8);
    p.drawText(num, {
      x: A4.width - MARGIN - nw,
      y: 26,
      size: 8,
      font: regular,
      color: mutedColor,
    });
  });

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

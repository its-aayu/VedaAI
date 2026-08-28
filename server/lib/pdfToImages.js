import { createCanvas, loadImage } from '@napi-rs/canvas';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const pdfjsDir = path.dirname(require.resolve('pdfjs-dist/package.json'));
const standardFontDataUrl = pathToFileURL(path.join(pdfjsDir, 'standard_fonts') + path.sep).href;
const cMapUrl = pathToFileURL(path.join(pdfjsDir, 'cmaps') + path.sep).href;

const RENDER_SCALE = 2.0;

export function isPdf(mimetype, filename) {
  return mimetype === 'application/pdf' || /\.pdf$/i.test(filename || '');
}

async function pdfBufferToPages(buffer) {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    disableFontFace: false,
    standardFontDataUrl,
    cMapUrl,
    cMapPacked: true,
    fontExtraProperties: true,
  });
  const pdf = await loadingTask.promise;
  const pages = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: RENDER_SCALE });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const context = canvas.getContext('2d');
    await page.render({ canvasContext: context, viewport }).promise;
    pages.push({
      buffer: canvas.toBuffer('image/png'),
      width: canvas.width,
      height: canvas.height,
      contentType: 'image/png',
    });
  }
  return pages;
}

async function imageBufferToPage(buffer, mimetype) {
  const img = await loadImage(buffer);
  return {
    buffer,
    width: img.width,
    height: img.height,
    contentType: mimetype || 'image/png',
  };
}

export async function fileToPages(file) {
  if (isPdf(file.mimetype, file.originalname)) {
    return pdfBufferToPages(file.buffer);
  }
  const page = await imageBufferToPage(file.buffer, file.mimetype);
  return [page];
}

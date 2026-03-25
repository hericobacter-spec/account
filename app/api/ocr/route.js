import { NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';

export async function POST(request) {
  try {
    const data = await request.formData();
    const file = data.get('image');

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Vercel Serverless is completely read-only except /tmp.
    // Tesseract tries to download and save language models to the root directory by default, causing EACCES crashes.
    // We enforce a memory-only cache or point it to /tmp to bypass the crash.
    const worker = await createWorker('kor+eng', 1, {
      cachePath: '/tmp',
      logger: m => console.log(m)
    });

    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();

    console.log("Extracted OCR Text:", text);

    // Simple heuristic to find Total Amount:
    // Look for numbers larger than 100, might have commas.
    const amountRegex = /(?:합계|총액|금액|결제금액|합계금액)?\s*[:]?\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{4,})/g;
    let match;
    let maxAmount = 0;
    while ((match = amountRegex.exec(text)) !== null) {
      let num = parseInt(match[1].replace(/,/g, ''), 10);
      if (num > maxAmount) {
        maxAmount = num;
      }
    }

    // Attempt to guess Vendor name (first non-empty line usually or near Top)
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let vendor = '';
    if (lines.length > 0) {
      vendor = lines[0]; // Naive guess: first line is often the shop name
    }

    return NextResponse.json({
      amount: maxAmount > 0 ? maxAmount : null,
      vendor: vendor,
      rawText: text
    });
  } catch (error) {
    console.error('OCR Error:', error);
    return NextResponse.json({ error: 'Failed to process receipt' }, { status: 500 });
  }
}

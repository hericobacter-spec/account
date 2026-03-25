import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.formData();
    const file = data.get('image');

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const apiKey = process.env.OCR_SPACE_API_KEY || 'K84675994288957';
    if (!apiKey) {
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 });
    }

    // Forward the file directly to OCR.Space API
    const ocrFormData = new FormData();
    ocrFormData.append('apikey', apiKey);
    ocrFormData.append('language', 'kor');
    ocrFormData.append('isTable', 'true');
    ocrFormData.append('scale', 'true'); // Upscale image to improve recognition
    ocrFormData.append('file', file);

    const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: ocrFormData,
    });

    if (!ocrResponse.ok) {
      throw new Error(`OCR.Space 통신 오류: ${ocrResponse.status} 상태 코드`);
    }

    const ocrResult = await ocrResponse.json();

    if (ocrResult.IsErroredOnProcessing) {
      throw new Error(ocrResult.ErrorMessage[0] || '알 수 없는 OCR 엔진 오류');
    }

    const text = ocrResult.ParsedResults?.map(res => res.ParsedText).join('\n') || '';

    console.log("Extracted OCR Text from OCR.Space:\n", text);

    // Simple heuristic to find Total Amount:
    const amountRegex = /(?:합계|총액|금액|결제금액|합계금액|승인금액|받을금액)?\s*[:]?\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{4,})/g;
    let match;
    let maxAmount = 0;
    while ((match = amountRegex.exec(text)) !== null) {
      let num = parseInt(match[1].replace(/,/g, ''), 10);
      if (num > maxAmount) {
        maxAmount = num;
      }
    }

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

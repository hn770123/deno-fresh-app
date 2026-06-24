/**
 * PDF生成ユーティリティモジュール
 * レポート情報からPDFファイルを生成します。
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

/**
 * レポートのインターフェース
 */
export interface ReportData {
  title: string;
  summary?: string;
  details?: string;
  author?: string;
  createdAt?: string;
}

/**
 * 日本語フォントを読み込み、PDFドキュメントを生成します。
 * @param data レポートデータ
 * @returns PDFのバイト配列
 */
export async function generateReportPDF(data: ReportData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // フォントの読み込み (IPAゴシックを使用)
  const fontPath = "/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf";
  const fontBytes = await Deno.readFile(fontPath);
  const customFont = await pdfDoc.embedFont(fontBytes);

  const page = pdfDoc.addPage([595.28, 841.89]); // A4サイズ (points)
  const { width, height } = page.getSize();
  const margin = 50;

  // ページ罫線の描画
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  let currentY = height - margin;

  // タイトルの描画
  page.drawText("レポート詳細", {
    x: margin,
    y: currentY,
    size: 24,
    font: customFont,
    color: rgb(0, 0, 0),
  });
  currentY -= 40;

  // 項目の描画用関数
  const drawSection = (label: string, text: string, fontSize: number = 12) => {
    page.drawText(label + ":", {
      x: margin,
      y: currentY,
      size: fontSize + 2,
      font: customFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    currentY -= (fontSize + 10);

    // テキストの折り返し簡易実装
    const maxWidth = width - margin * 2;
    const lines = splitTextIntoLines(text, customFont, fontSize, maxWidth);

    for (const line of lines) {
      if (currentY < margin + 20) {
        // 必要に応じて改ページ処理をここに追加できますが、今回は簡易化のため1ページのみとします
        break;
      }
      page.drawText(line, {
        x: margin + 10,
        y: currentY,
        size: fontSize,
        font: customFont,
        color: rgb(0, 0, 0),
      });
      currentY -= (fontSize + 5);
    }
    currentY -= 15;
  };

  drawSection("タイトル", data.title, 16);
  if (data.author) drawSection("作成者", data.author);
  if (data.createdAt) drawSection("作成日時", data.createdAt);
  if (data.summary) drawSection("概要", data.summary);
  if (data.details) drawSection("詳細", data.details);

  return await pdfDoc.save();
}

/**
 * テキストを指定された幅で折り返すための簡易関数
 */
function splitTextIntoLines(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split(/\r?\n/);

  for (const paragraph of paragraphs) {
    let currentLine = "";
    for (const char of paragraph) {
      const testLine = currentLine + char;
      const textWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (textWidth > maxWidth && currentLine !== "") {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
  }
  return lines;
}

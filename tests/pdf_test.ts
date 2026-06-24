/**
 * PDF生成APIのユニットテスト
 */

import { assertEquals } from "jsr:@std/assert";
import { generateReportPDF } from "../services/pdf.ts";

Deno.test("PDF生成ロジックのテスト", async () => {
  const data = {
    title: "テストレポート",
    summary: "これはテストの概要です。",
    details: "これはテストの詳細内容です。日本語が含まれています。",
    author: "テストユーザー",
    createdAt: new Date().toLocaleString("ja-JP"),
  };

  const pdfBytes = await generateReportPDF(data);

  // PDFのシグネチャ (%PDF-) を確認
  assertEquals(pdfBytes[0], 0x25); // %
  assertEquals(pdfBytes[1], 0x50); // P
  assertEquals(pdfBytes[2], 0x44); // D
  assertEquals(pdfBytes[3], 0x46); // F
  assertEquals(pdfBytes[4], 0x2d); // -

  // バイト配列が空でないことを確認
  assertEquals(pdfBytes.length > 0, true);
});

/**
 * PDF生成APIエンドポイントモジュール
 * フォームデータを受け取り、PDFファイルを生成して返します。
 */

import { define, generateReportPDF } from "../../utils.ts";

/**
 * PDF生成APIハンドラ
 */
export const handler = define.handlers({
  /**
   * PDF生成処理 (POST)
   */
  async POST(ctx) {
    const form = await ctx.req.formData();
    const title = form.get("title")?.toString() || "無題のレポート";
    const summary = form.get("summary")?.toString() || "";
    const details = form.get("details")?.toString() || "";
    const author = ctx.state.user?.username || "ゲスト";
    const createdAt = new Date().toLocaleString("ja-JP");

    try {
      // PDFの生成
      const pdfBytes = await generateReportPDF({
        title,
        summary,
        details,
        author,
        createdAt,
      });

      // PDFファイルをレスポンスとして返す
      return new Response(pdfBytes, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="report_${Date.now()}.pdf"`,
        },
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
      return new Response("PDFの生成に失敗しました。", { status: 500 });
    }
  },
});

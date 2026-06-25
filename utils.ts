/**
 * ユーティリティモジュール
 * 認証、PDF生成、およびFreshの共通定義を提供します。
 */

import { createDefine } from "fresh";
import { encodeHex } from "jsr:@std/encoding/hex";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

/**
 * ctx.state の型定義
 */
export interface State {
  user?: {
    id: number;
    username: string;
  };
}

export const define = createDefine<State>();

// --- 認証ユーティリティ ---

/**
 * パスワードをハッシュ化します（PBKDF2を使用）
 */
export async function hashPassword(password: string, saltIn?: Uint8Array): Promise<string> {
  const salt = saltIn ?? crypto.getRandomValues(new Uint8Array(16));
  const passwordData = new TextEncoder().encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordData,
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt.slice(),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  return `${encodeHex(salt)}:${encodeHex(new Uint8Array(derivedBits))}`;
}

/**
 * パスワードを検証します
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [saltHex, _hashHex] = parts;

  const salt = new Uint8Array(
    saltHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
  );
  const newHash = await hashPassword(password, salt);
  return newHash === storedHash;
}

/**
 * セッションIDを生成します
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * セッションCookieを取得します
 */
export function getSessionId(req: Request): string | null {
  const cookies = req.headers.get("cookie");
  if (!cookies) return null;
  const match = cookies.match(/session_id=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * セッションCookieを設定するためのヘッダー値を生成します
 */
export function setSessionCookie(sessionId: string): string {
  return `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Strict; Secure`;
}

/**
 * セッションCookieを削除するためのヘッダー値を生成します
 */
export function deleteSessionCookie(): string {
  return `session_id=; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=0`;
}

// --- PDF生成ユーティリティ ---

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

    const maxWidth = width - margin * 2;
    const lines = splitTextIntoLines(text, customFont, fontSize, maxWidth);

    for (const line of lines) {
      if (currentY < margin + 20) break;
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

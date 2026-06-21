/**
 * 認証ユーティリティモジュール
 * パスワードのハッシュ化、検証、およびセッション管理のヘルパーを提供します。
 */

import { encodeHex } from "jsr:@std/encoding/hex";

/**
 * パスワードをハッシュ化します（PBKDF2を使用）
 * @param password 平文のパスワード
 * @param salt ソルト（指定しない場合は新しく生成）
 * @returns ハッシュ化された文字列（salt:hash の形式）
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
      salt,
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
 * @param password 平文のパスワード
 * @param storedHash 保存されているハッシュ（salt:hash の形式）
 * @returns 一致する場合は true
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
 * @returns 生成されたセッションID
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * セッションCookieを取得します
 * @param req Requestオブジェクト
 * @returns セッションID、または見つからない場合は null
 */
export function getSessionId(req: Request): string | null {
  const cookies = req.headers.get("cookie");
  if (!cookies) return null;
  const match = cookies.match(/session_id=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * セッションCookieを設定するためのヘッダー値を生成します
 * @param sessionId セッションID
 * @returns Set-Cookie ヘッダーの値
 */
export function setSessionCookie(sessionId: string): string {
  return `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Strict; Secure`;
}

/**
 * セッションCookieを削除するためのヘッダー値を生成します
 * @returns Set-Cookie ヘッダーの値
 */
export function deleteSessionCookie(): string {
  return `session_id=; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=0`;
}

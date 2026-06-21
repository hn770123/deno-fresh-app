/**
 * Buttonコンポーネントのテスト
 * Buttonコンポーネントが正しくレンダリングされることを確認します。
 */

import { render } from "preact-render-to-string";
import { assertEquals } from "jsr:@std/assert";
import { Button } from "../components/Button.tsx";

Deno.test("Buttonコンポーネントのレンダリングテスト", () => {
  const html = render(<Button>Click me</Button>);
  assertEquals(html.includes("Click me"), true);
  assertEquals(html.includes("button"), true);
});

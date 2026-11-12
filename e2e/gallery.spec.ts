import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() == "error" && errors.push(m.text()));
  (page as any).errors = errors;
});
test.afterEach(async ({ page }) => expect((page as any).errors).toEqual([]));

test("gallery lists every sound and plays one on click", async ({ page }) => {
  await page.goto("./");
  const tiles = page.locator(".tile");
  await expect(tiles).toHaveCount(Number(await page.locator("#total").textContent()));
  expect(await tiles.count()).toBeGreaterThanOrEqual(120);
  await page.locator('.tile[data-name="coin"]').click();
  await expect(page.locator('.tile[data-name="coin"]')).toHaveClass(/playing/);
  await expect(page.locator("#p-name")).toHaveText("coin");
  await expect(page.locator("#p-code")).toContainText('play("coin")');
  await expect(page).toHaveURL(/#coin$/);
});

test("the lede reads cleanly (no leftover template text)", async ({ page }) => {
  await page.goto("./");
  const lede = await page.locator(".lede").innerText();
  expect(lede).toMatch(/^\d+ sounds in \d+ categories, CC0, a 2\.8\skB player, no audio files\.$/);
});

test("search and category filter", async ({ page }) => {
  await page.goto("./");
  await page.locator("#search").fill("laser");
  await expect(page.locator(".tile:not([hidden])")).toHaveCount(3);
  await page.locator("#search").fill("");
  await page.locator('#chips [data-cat="explosion"]').click();
  await expect(page.locator(".tile:not([hidden])")).toHaveCount(10);
});

test("favourite pads play and select their sound", async ({ page }) => {
  await page.goto("./");
  await page.locator('.pad[data-pad="laser"]').click();
  await expect(page.locator('.pad[data-pad="laser"]')).toHaveClass(/playing/);
  await expect(page.locator("#p-name")).toHaveText("laser");
  await expect(page).toHaveURL(/#laser$/);
});

test("empty search hides every tile and offers a way out", async ({ page }) => {
  await page.goto("./");
  await page.locator("#search").fill("zzzz");
  await expect(page.locator("#empty")).toBeVisible();
  await expect(page.locator(".tile:visible")).toHaveCount(0);
  await page.locator('#empty [data-try="laser"]').click();
  await expect(page.locator(".tile:visible")).toHaveCount(3);
  await expect(page.locator("#empty")).toBeHidden();
});

test("phone: the panel is a bottom sheet", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#coin");
  await expect(page.locator("#p-copy")).not.toBeInViewport();
  await page.locator("#p-more").click();
  await expect(page.locator("#p-more")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#p-copy")).toBeInViewport();
  await page.keyboard.press("Escape");
  await expect(page.locator("#p-more")).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#p-copy")).not.toBeInViewport();
});

test("keyboard: arrows move and play, number keys pick takes", async ({ page }) => {
  await page.goto("./#coin");
  await page.locator('.tile[data-name="coin"]').focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#p-name")).not.toHaveText("coin");
  await page.keyboard.press("3");
  await expect(page.locator('[data-take="2"]')).toHaveAttribute("aria-pressed", "true");
});

test("knobs edit the sound and the code follows", async ({ page }) => {
  await page.goto("./#jump");
  await page.locator('input[name="pitch"]').fill("5");
  await expect(page.locator("#v-pitch")).toHaveText("+5 st");
  await expect(page.locator("#p-edited")).toBeVisible();
  await expect(page.locator("#p-code")).toContainText("layers: [");
  await page.locator("#p-reset").click();
  await expect(page.locator("#p-edited")).toBeHidden();
});

test("WAV download", async ({ page }) => {
  await page.goto("./#coin");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("#p-wav").click()]);
  expect(dl.suggestedFilename()).toBe("coin.wav");
});

test("demo game starts and runs", async ({ page }) => {
  await page.goto("./game.html");
  await page.locator("canvas").click();
  await page.waitForTimeout(3500);
  expect(await page.evaluate(() => (window as any).plinkrun.state())).toBe("run");
});

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
  expect(lede).toMatch(/^\d+ sounds in \d+ categories, CC0, a 2\.9\skB player, no audio files\.$/);
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

test("a tweak is written into the URL", async ({ page }) => {
  await page.goto("./#jump");
  await page.locator('input[name="pitch"]').fill("5");
  await expect(page).toHaveURL(/#jump\?p=5$/);
});

test("a shared tweak opens with a play banner", async ({ page }) => {
  await page.goto("./#coin?p=3&l=1.2&v=42");
  await expect(page.locator("#shared")).toBeVisible();
  await expect(page.locator("#v-pitch")).toHaveText("+3 st");
  await expect(page.locator("#p-seed")).toHaveText("take #42");
  await page.locator("#shared button").click();
  await expect(page.locator("#shared")).toBeHidden();
});

test("the tour plays through several sounds", async ({ page }) => {
  await page.goto("./");
  await page.locator("#tour").click();
  await expect(page.locator("#p-name")).toHaveText("coin");
  await expect(page.locator("#p-name")).toHaveText("jump", { timeout: 2000 });
  await page.locator("#tour").click();
  await expect(page.locator("#tour")).toHaveAttribute("aria-pressed", "false");
});

test("share copies the sound's own page, with the tweak", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("./#jump");
  await page.locator('input[name="pitch"]').fill("5");
  await page.locator("#p-link").click();
  await expect(page.locator("#p-link")).toHaveClass(/done/);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("http://localhost:4173/s/jump/?p=5");
});

test("a sound page has its own card and lands in the gallery on that sound", async ({ page, request }) => {
  const html = await (await request.get("./s/coin/")).text();
  expect(html).toContain("<title>coin · free CC0 game sound effect · plinkfx</title>");
  expect(html).toContain('<meta property="og:url" content="https://maximilianfeix.github.io/plinkfx/s/coin/">');
  expect(html).toContain('<meta property="og:image" content="https://maximilianfeix.github.io/plinkfx/s/coin/og.png">');
  expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
  expect(html).toContain('<link rel="canonical" href="https://maximilianfeix.github.io/plinkfx/s/coin/">');
  const png = await request.get("./s/coin/og.png");
  expect(png.headers()["content-type"]).toBe("image/png");
  const body = await png.body();
  expect([body.readUInt32BE(16), body.readUInt32BE(20)]).toEqual([1200, 630]);

  await page.goto("./s/coin/");
  await expect(page).toHaveURL(/\/#coin$/);
  await expect(page.locator("#p-name")).toHaveText("coin");
  await page.goto("./s/coin/?p=3&v=42");
  await expect(page).toHaveURL(/\/#coin\?p=3&v=42$/);
  await expect(page.locator("#v-pitch")).toHaveText("+3 st");
  await expect(page.locator("#shared")).toBeVisible();
});

test("sitemap lists every sound page", async ({ page, request }) => {
  await page.goto("./");
  const total = Number(await page.locator("#total").textContent());
  const xml = await (await request.get("./sitemap.xml")).text();
  expect(xml.match(/\/s\/[a-z0-9-]+\/<\/loc>/g)).toHaveLength(total);
  expect(await (await request.get("./robots.txt")).text()).toContain("Sitemap: https://maximilianfeix.github.io/plinkfx/sitemap.xml");
});

test("suggest a sound opens a prefilled issue form, from the panel and from an empty search", async ({ page }) => {
  await page.goto("./#coin?p=3");
  const href = new URL((await page.locator("#p-suggest").getAttribute("href"))!);
  expect(href.origin + href.pathname).toBe("https://github.com/maximilianfeix/plinkfx/issues/new");
  expect(href.searchParams.get("template")).toBe("new-sound.yml");
  expect(href.searchParams.get("title")).toBe("New sound: based on coin");
  expect(href.searchParams.get("what")).toContain("/s/coin/?p=3");
  expect(href.searchParams.get("params")).toContain("layers: [");
  await expect(page.locator("#p-suggest")).toHaveAttribute("target", "_blank");

  await page.locator("#search").fill("rubber duck");
  const empty = new URL((await page.locator("#empty-suggest").getAttribute("href"))!);
  expect(empty.searchParams.get("title")).toBe("New sound: rubber duck");
  expect(empty.searchParams.get("name")).toBe("rubber-duck");
});

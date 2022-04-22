const { test, expect } = require("@playwright/test");

test("opens", async ({ page }) => {
  await page.goto("http://localhost:3000");
  const title = page.locator("#title");
  await expect(title).toHaveText("Fighting Boxes");
});

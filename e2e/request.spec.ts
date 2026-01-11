import { test, expect } from "@playwright/test";

test("Request Flow", async ({ page }) => {
  await page.goto("/dashboard/request-medication");

  // Fill form
  await page.fill("#medication", "E2E Request Med");
  await page.fill("#quantity", "20");

  // Select Wait Time (Select content is in a separate layer, often need to click trigger first)
  // Selecting 'ALTO'
  await page.click("#waitTime");
  await page.getByRole("option", { name: /Alto/i }).click();

  await page.fill("#description", "E2E Request Description");

  // Submit
  await page.click('button[type="submit"]');

  // Verify Toast
  await expect(page.getByText("¡Solicitud enviada!")).toBeVisible({
    timeout: 10000,
  });
});

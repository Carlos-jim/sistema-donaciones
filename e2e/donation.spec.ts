import { test, expect } from "@playwright/test";

test("Donation Flow", async ({ page }) => {
  await page.goto("/dashboard/donate-medication");

  // Fill form
  await page.fill('input[name="medication"]', "E2E Test Med");
  await page.fill('input[name="quantity"]', "50");
  await page.fill('input[name="expiration"]', "2026-12-31");
  await page.fill('textarea[name="description"]', "E2E Automation Description");

  // Submit
  await page.click('button[type="submit"]');

  // Verify Toast
  // Shadcn toast usually appears in a region. We check for the title.
  await expect(page.getByText("¡Donación registrada!")).toBeVisible({
    timeout: 10000,
  });
});

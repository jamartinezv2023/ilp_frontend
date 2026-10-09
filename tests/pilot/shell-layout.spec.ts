import { expect, test } from "@playwright/test";
for (const locale of ["es", "en"]) {
  for (const width of [360, 768, 1440]) {
    test(`shell ${locale} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(value => localStorage.setItem("ilp.locale", value), locale);
      await page.route("**/auth/**", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ accessToken: "SYNTHETIC", email: "review@example.invalid", mfaRequired: false }) }));
      await page.route("**/api/**", route => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
      await page.goto("/inclusion");
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      const header = page.locator("header");
      await expect(header).toBeVisible();
      const main = page.locator("main");
      const heading = main.locator("h1,h2,h3,h4,h5,h6").filter({ visible: true }).first();
      await expect(heading).toBeVisible();
      const hb = await header.boundingBox();
      const cb = await heading.boundingBox();
      expect(cb!.y).toBeGreaterThanOrEqual(hb!.y + hb!.height);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width < 900) await header.getByRole("button").first().click();
      const nav = page.getByRole("list").filter({ visible: true }).first();
      await expect(nav).toBeVisible();
      const button = nav.getByRole("button").first();
      await expect(button).toBeVisible();
      const panel = nav.locator("..");
      expect(await panel.evaluate(el => getComputedStyle(el).backgroundColor)).toBe("rgb(16, 36, 58)");
      expect(await button.evaluate(el => getComputedStyle(el).color)).toBe("rgb(255, 255, 255)");
      const logo = page.locator('img[src="/brand/ilp-wordmark.svg"]').filter({ visible: true });
      await expect(logo).toHaveCount(1);
      expect(await logo.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      await button.click();
      await expect(page).toHaveURL(/institutional/);
      if (width < 900) await expect(nav).not.toBeVisible();
      else {
        await header.getByRole("button").first().click();
        await expect(header.getByRole("button").first()).toHaveAttribute("aria-expanded", "false");
        await expect(button).toBeVisible();
        await header.getByRole("button").first().click();
      }
      await header.getByRole("combobox").click();
      await page.getByRole("option").nth(locale === "es" ? 1 : 0).click();
      await expect(page.locator("html")).toHaveAttribute("lang", locale === "es" ? "en" : "es");
      await expect(page.getByRole("listbox")).not.toBeVisible();
      try {
        await expect.poll(
          () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          { message: "The translated page must fit the viewport" },
        ).toBe(true);
      } catch (error) {
        console.log("OVERFLOW_GEOMETRY", await page.evaluate(() => ({
          viewport: innerWidth,
          rootClientWidth: document.documentElement.clientWidth,
          rootScrollWidth: document.documentElement.scrollWidth,
          bodyClientWidth: document.body.clientWidth,
          bodyScrollWidth: document.body.scrollWidth,
          elements: Array.from(document.querySelectorAll("body *"))
            .filter(element => {
              const rect = element.getBoundingClientRect();
              return rect.width > 0 && rect.height > 0 &&
                (rect.right > innerWidth || rect.left < 0 ||
                 element.scrollWidth > element.clientWidth);
            })
            .slice(0, 50)
            .map(element => {
              const rect = element.getBoundingClientRect();
              const style = getComputedStyle(element);
              return {
                tag: element.tagName,
                className: element.getAttribute("class"),
                text: element.textContent?.trim().slice(0, 100),
                left: rect.left,
                right: rect.right,
                width: rect.width,
                clientWidth: element.clientWidth,
                scrollWidth: element.scrollWidth,
                overflowX: style.overflowX,
                whiteSpace: style.whiteSpace,
                visibility: style.visibility,
                position: style.position,
              };
            }),
        })));
        console.log("OVERFLOW_ELEMENTS", await page.evaluate(() =>
          Array.from(document.querySelectorAll("body *"))
            .filter(element => {
              const rect = element.getBoundingClientRect();
              const style = getComputedStyle(element);
              return rect.width > 0 && rect.height > 0 &&
                style.visibility !== "hidden" &&
                (rect.right > innerWidth + 1 || rect.left < -1);
            })
            .slice(0, 30)
            .map(element => ({
              tag: element.tagName,
              className: element.getAttribute("class"),
              text: element.textContent?.trim().slice(0, 100),
              left: element.getBoundingClientRect().left,
              right: element.getBoundingClientRect().right,
              viewport: innerWidth,
            })),
        ));
        throw error;
      }
    });
  }
}

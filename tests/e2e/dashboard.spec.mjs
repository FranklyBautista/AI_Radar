import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const evidenceDir = resolve("tmp/airadar-frontend");
const latestApiPattern = "**/api/signals/latest";
const demoSnapshotPattern = "**/data/daily/2026-07-18.json";
let declaredSnapshotFixture;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  await mkdir(evidenceDir, { recursive: true });
  declaredSnapshotFixture = await readFile(resolve("data/daily/2026-07-18.json"), "utf8");
});

test.beforeEach(async ({ page }) => {
  await page.route(latestApiPattern, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: declaredSnapshotFixture }),
  );
});

function monitorRuntime(page) {
  const issues = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      issues.push(`console:${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => issues.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) => {
    issues.push(`requestfailed: ${request.method()} ${request.url()}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && response.url().startsWith("http://127.0.0.1:4173")) {
      issues.push(`response:${response.status()}: ${response.url()}`);
    }
  });
  return issues;
}

async function expectNoAxeViolations(page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test("modo lector desktop: datos, teclado, vacío y captura", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const runtimeIssues = monitorRuntime(page);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Radar de hoy" })).toBeVisible();
  await expect(page.locator(".signal-row")).toHaveCount(5);
  await expect(page.locator(".signal-row").first()).toHaveAttribute("aria-current", "true");
  await expect(page.locator("#data-source-note")).toContainText("Supabase · en vivo · contrato 1.0.0");
  await expect(page.locator("#snapshot-date")).toHaveAttribute("datetime", "2026-07-18");
  await expect(
    page.locator("#signal-list").getByText(
      "Cohere abre Transcribe Arabic para reconocimiento de voz multidialecto",
    ),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Publicar/ })).toBeDisabled();

  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await page.keyboard.press("Escape");
  await page.keyboard.press("/");
  await expect(page.locator("#signal-search")).toBeFocused();

  await expectNoAxeViolations(page);
  await page.evaluate(() => document.activeElement?.blur());
  await page.screenshot({ path: resolve(evidenceDir, "desktop-lector.png") });

  await page.locator("#signal-search").fill("sin-resultados-para-validar-vacio");
  await expect(page.getByRole("heading", { name: "No encontramos señales" })).toBeVisible();
  await page.evaluate(() => document.activeElement?.blur());
  await page.screenshot({ path: resolve(evidenceDir, "desktop-vacio.png") });
  await page.getByRole("button", { name: "Limpiar búsqueda" }).click();
  await expect(page.locator(".signal-row")).toHaveCount(5);

  expect(runtimeIssues).toEqual([]);
});

test("modo operador desktop: acciones locales y transparencia de persistencia", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const runtimeIssues = monitorRuntime(page);

  await page.goto("/");
  await page.getByRole("button", { name: "Modo operador" }).click();
  await expect(page.getByRole("heading", { name: "Controles de operación" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Editar señal/ })).toBeEnabled();
  await expect(page.getByRole("button", { name: /Publicar/ })).toBeDisabled();
  await expect(page.locator("#publish-note")).toContainText("requiere una API");

  await page.getByRole("button", { name: /Fusionar duplicados/ }).click();
  await expect(page.locator("#operator-feedback")).toContainText("No se detectaron duplicados");
  await page.getByRole("button", { name: /Ajustar ranking/ }).click();
  await expect(page.locator("#score-adjustment")).toBeVisible();
  await page.locator("#score-adjustment").fill("-4");

  await page.getByRole("button", { name: /Editar señal/ }).click();
  await expect(page.getByRole("dialog", { name: "Editar señal" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await expectNoAxeViolations(page);
  await expect(page.locator("#toast")).toBeHidden({ timeout: 5_000 });
  await page.screenshot({ path: resolve(evidenceDir, "desktop-operador.png") });
  expect(runtimeIssues).toEqual([]);
});

test("mobile: layout sin overflow, navegación y accesibilidad", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const runtimeIssues = monitorRuntime(page);

  await page.goto("/");
  await expect(page.locator(".signal-row")).toHaveCount(5);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);

  const menuButton = page.locator(".mobile-menu-button");
  await expect(menuButton).toHaveAccessibleName("Abrir navegación");
  await menuButton.click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  await expect(menuButton).toHaveAccessibleName("Cerrar navegación");
  await page.keyboard.press("Escape");
  await expect(menuButton).toBeFocused();
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");

  await expectNoAxeViolations(page);
  await page.evaluate(() => document.activeElement?.blur());
  await page.screenshot({ path: resolve(evidenceDir, "mobile-lector.png") });
  expect(runtimeIssues).toEqual([]);
});

test("error de datos: informa la fuente y permite reintentar", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  let primaryAttempts = 0;
  let demoAttempts = 0;
  await page.route(latestApiPattern, (route) => {
    primaryAttempts += 1;
    if (primaryAttempts === 1) {
      return route.fulfill({
        status: 503,
        contentType: "application/json",
        body: '{"error":"temporal"}',
      });
    }
    return route.fallback();
  });
  await page.route(demoSnapshotPattern, (route) => {
    demoAttempts += 1;
    if (demoAttempts === 1) {
      return route.fulfill({ status: 503, contentType: "application/json", body: "{}" });
    }
    return route.fallback();
  });

  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("No pudimos cargar las señales");
  await expect(page.getByRole("alert")).toContainText("/api/signals/latest");

  await page.getByRole("button", { name: "Reintentar" }).click();
  await expect(page.locator(".signal-row")).toHaveCount(5);
});

test("sin runs: usa el snapshot demo y comunica el origen de los datos", async ({ page }) => {
  let attempts = 0;
  await page.route(latestApiPattern, (route) => {
    attempts += 1;
    if (attempts === 1) {
      return route.fulfill({
        status: 404,
        contentType: "application/json",
        body: '{"error":"Todavia no hay runs de AI Radar"}',
      });
    }
    return route.fallback();
  });

  await page.goto("/");
  await expect(page.locator("#data-source-note")).toContainText("Demo local · fallback · contrato 1.0.0");
  await expect(page.locator(".signal-row")).toHaveCount(5);
});

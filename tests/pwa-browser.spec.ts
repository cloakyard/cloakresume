import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vite-plus/test";
import puppeteer, { type Browser, type BrowserContext, type Page } from "puppeteer-core";
import { startPwaServer } from "./helpers/pwa-server.ts";
import { blankResume } from "../src/data/blankResume.ts";

describe("PWA recovery on production assets", { timeout: 20_000 }, () => {
  let server: Awaited<ReturnType<typeof startPwaServer>>;
  let browser: Browser, context: BrowserContext, page: Page;
  const errors: string[] = [];
  beforeAll(async () => {
    server = await startPwaServer();
    browser = await puppeteer.launch({
      executablePath:
        process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      headless: true,
    });
  });
  beforeEach(async () => {
    Object.assign(server.state, {
      version: 1,
      hold: false,
      failInstall: false,
      production: false,
      swRequests: 0,
    });
    errors.length = 0;
    context = await browser.createBrowserContext();
    page = await context.newPage();
    page.on("pageerror", (error) => errors.push(String(error)));
    await page.setViewport({ width: 1280, height: 720 });
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  });
  afterEach(async () => {
    await context.close();
    expect(errors).toEqual([]);
  });
  afterAll(async () => {
    await browser.close();
    await server.close();
  });
  async function startEditor() {
    await page.evaluateOnNewDocument(
      (resume) =>
        !localStorage.getItem("cloakresume:v1") &&
        localStorage.setItem(
          "cloakresume:v1",
          JSON.stringify({ resume, templateId: "ats-plain", primary: "#123456", paperSize: "a4" }),
        ),
      { ...blankResume, profile: { ...blankResume.profile, name: "PWA preserved draft" } },
    );
    await page.goto(server.url, { waitUntil: "networkidle0" });
    await page.evaluate(() =>
      [...document.querySelectorAll("button")]
        .find((b) => b.textContent?.startsWith("Resume editing"))!
        .click(),
    );
    await page.waitForSelector("[name='profile-name']");
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  }
  async function offerUpdate(hold = false) {
    server.state.version++;
    server.state.hold = hold;
    await page.evaluate(() =>
      navigator.serviceWorker
        .getRegistration()
        .then((r) => r!.update())
        .then(() => undefined),
    );
    await page.waitForSelector('.air-update button[aria-label="Update and reload"]');
  }
  async function finishActivation() {
    await page.waitForFunction(
      async () => (await navigator.serviceWorker.getRegistration())?.active?.state === "activating",
    );
    await page.evaluate(async () => {
      const r = await navigator.serviceWorker.getRegistration();
      r!.active!.postMessage({ type: "FINISH" });
    });
  }
  it("keeps offline and update notices independent and preserves focus on dismissal", async () => {
    await startEditor();
    await page.focus("[name='profile-name']");
    await offerUpdate();
    // Allow the original four-second offline timer to elapse while an update is visible.
    await new Promise((resolve) => setTimeout(resolve, 4200));
    expect(await page.$('.air-update button[aria-label="Update and reload"]')).not.toBeNull();
    await page.click(".air-update-actions button:first-child");
    await page.waitForSelector("[name='profile-name']:focus");
    expect(await page.$(".air-update")).toBeNull();
  });
  it("flushes the final keystroke and reloads once after real activation", async () => {
    await startEditor();
    await offerUpdate(true);
    await page.evaluate(() => {
      const old = Object.getOwnPropertyDescriptor(ServiceWorker.prototype, "postMessage")!
        .value as ServiceWorker["postMessage"];
      (window as unknown as { count: number }).count = 0;
      ServiceWorker.prototype.postMessage = function (
        message: { type?: string },
        options?: Transferable[] | StructuredSerializeOptions,
      ) {
        if (message?.type === "SKIP_WAITING") (window as unknown as { count: number }).count++;
        return Reflect.apply(old, this, [message, options]);
      };
    });
    await page.type("[name='profile-name']", " final");
    await page.click('[aria-label="Update and reload"]');
    await page.waitForSelector('.air-update [aria-busy="true"]:focus');
    await page.evaluate(() => {
      const button = document.querySelector<HTMLButtonElement>('.air-update [aria-busy="true"]')!;
      button.click();
      button.click();
    });
    expect(await page.evaluate(() => (window as unknown as { count: number }).count)).toBe(1);
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("cloakresume:v1")!).resume.profile.name,
      ),
    ).toBe("PWA preserved draft final");
    const navigation = page.waitForNavigation();
    await finishActivation();
    await navigation;
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("cloakresume:v1")!).resume.profile.name,
      ),
    ).toBe("PWA preserved draft final");
  });
  it("keeps the draft when storage fails before starting an update", async () => {
    await startEditor();
    await offerUpdate();
    await page.evaluate(() => {
      Storage.prototype.setItem = () => {
        throw new Error("Quota exceeded");
      };
    });
    await page.type("[name='profile-name']", " unsaved");
    await page.evaluate(() =>
      document.querySelector<HTMLButtonElement>('[aria-label="Update and reload"]')!.click(),
    );
    await page.waitForSelector('[role="alertdialog"]');
    expect(
      await page.$eval("[name='profile-name']", (e) => (e as HTMLInputElement).value),
    ).toContain("unsaved");
    expect(
      await page.evaluate(
        async () => (await navigator.serviceWorker.getRegistration())!.waiting?.state,
      ),
    ).toBe("installed");
    expect(await page.$eval(".air-update", (e) => e.textContent)).toContain("could not be saved");
  });
  it("keeps a busy action and its focus outline visible after short-screen resize", async () => {
    await startEditor();
    await offerUpdate(true);
    await page.click('[aria-label="Update and reload"]');
    await page.waitForSelector('.air-update [aria-busy="true"]:focus');
    await page.setViewport({ width: 844, height: 390 });
    await page.evaluate(() => (document.documentElement.style.fontSize = "32px"));
    await page.waitForFunction(() => {
      const button = document.activeElement;
      const notice = button?.closest(".air-update");
      if (!button || !notice) return false;
      const b = button.getBoundingClientRect(),
        n = notice.getBoundingClientRect();
      return b.top >= n.top + 4 && b.bottom <= n.bottom - 4;
    });
  });
  it("checks edits made during activation and offers a real storage retry", async () => {
    await startEditor();
    await offerUpdate(true);
    await page.click('[aria-label="Update and reload"]');
    await page.waitForSelector('.air-update [aria-busy="true"]');
    await page.evaluate(() => {
      (window as unknown as { restoreStorage: () => void }).restoreStorage = (() => {
        const old = Object.getOwnPropertyDescriptor(Storage.prototype, "setItem")!
          .value as Storage["setItem"];
        Storage.prototype.setItem = () => {
          throw new Error("Quota exceeded");
        };
        return () => {
          Storage.prototype.setItem = old;
        };
      })();
    });
    await page.type("[name='profile-name']", " during activation");
    await finishActivation();
    await page.waitForSelector('.air-update [aria-label="Try again"]');
    expect(
      await page.$eval("[name='profile-name']", (e) => (e as HTMLInputElement).value),
    ).toContain("during activation");
    await page.evaluate(() =>
      (window as unknown as { restoreStorage: () => void }).restoreStorage(),
    );
    await page.click('[role="alertdialog"] button');
    const navigation = page.waitForNavigation();
    await page.click('.air-update [aria-label="Try again"]');
    await navigation;
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("cloakresume:v1")!).resume.profile.name,
      ),
    ).toContain("during activation");
  });
  it("recovers from a failed update message without losing focus or duplicating work", async () => {
    await startEditor();
    await offerUpdate(true);
    await page.evaluate(() => {
      const old = Object.getOwnPropertyDescriptor(ServiceWorker.prototype, "postMessage")!
        .value as ServiceWorker["postMessage"];
      ServiceWorker.prototype.postMessage = function (
        message: { type?: string },
        options?: Transferable[] | StructuredSerializeOptions,
      ) {
        ServiceWorker.prototype.postMessage = old;
        if (message?.type === "SKIP_WAITING") throw new Error("Fixture message failure");
        return Reflect.apply(old, this, [message, options]);
      };
    });
    await page.click('[aria-label="Update and reload"]');
    await page.waitForSelector('.air-update [aria-label="Try again"]:focus');
    expect(await page.$eval('.air-update [role="alert"]', (e) => e.textContent)).toContain(
      "Check your connection",
    );
    await page.click('.air-update [aria-label="Try again"]');
    await page.waitForSelector('.air-update [aria-busy="true"]');
    const navigation = page.waitForNavigation();
    await finishActivation();
    await navigation;
  });
  it("does not reload this tab when another tab activates the worker", async () => {
    await startEditor();
    await offerUpdate();
    await page.evaluate(async () =>
      (await navigator.serviceWorker.getRegistration())!.waiting!.postMessage({
        type: "SKIP_WAITING",
      }),
    );
    await page.waitForFunction(
      async () => !(await navigator.serviceWorker.getRegistration())?.waiting,
    );
    expect(await page.$("[name='profile-name']")).not.toBeNull();
    await page.type("[name='profile-name']", " after other tab");
    const navigation = page.waitForNavigation();
    await page.click('[aria-label="Update and reload"]');
    await navigation;
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("cloakresume:v1")!).resume.profile.name,
      ),
    ).toContain("after other tab");
  });
  it("survives a failed worker install and offers the next valid version", async () => {
    await startEditor();
    server.state.version++;
    server.state.failInstall = true;
    await page.evaluate(async () => {
      const r = await navigator.serviceWorker.getRegistration();
      await r!.update();
    });
    await page.waitForFunction(
      async () => !(await navigator.serviceWorker.getRegistration())!.installing,
    );
    expect(
      await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())!.waiting),
    ).toBeNull();
    expect(await page.$eval("[name='profile-name']", (e) => (e as HTMLInputElement).value)).toBe(
      "PWA preserved draft",
    );
    server.state.failInstall = false;
    await offerUpdate();
    expect(await page.$('[aria-label="Update and reload"]')).not.toBeNull();
  });
  it("polls at the existing interval and skips offline or overlapping checks", async () => {
    await page.evaluateOnNewDocument(() => {
      const schedule = window.setInterval.bind(window);
      Object.defineProperty(window, "setInterval", {
        configurable: true,
        value: (handler: TimerHandler, delay?: number, ...args: unknown[]) => {
          if (delay === 600000 && typeof handler === "function")
            (window as unknown as { poll: () => Promise<void> }).poll = async () => {
              await Reflect.apply(handler, window, args);
            };
          return schedule(handler, delay, ...args);
        },
      });
    });
    await startEditor();
    const initial = server.state.swRequests;
    await page.evaluate(async () => {
      Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
      await (window as unknown as { poll: () => Promise<void> }).poll();
    });
    expect(server.state.swRequests).toBe(initial);
    await page.evaluate(async () => {
      Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
      await (window as unknown as { poll: () => Promise<void> }).poll();
    });
    expect(server.state.swRequests).toBeGreaterThan(initial);
    expect(await page.$('[aria-label="Update and reload"]')).toBeNull();
    const requests = await page.evaluate(async () => {
      const original = window.fetch.bind(window);
      let count = 0;
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      window.fetch = async (...args) => {
        count++;
        await gate;
        return original(...args);
      };
      const poll = (window as unknown as { poll: () => Promise<void> }).poll;
      const first = poll();
      await poll();
      release();
      await first;
      window.fetch = original;
      return count;
    });
    expect(requests).toBe(1);
  });
  it("serves a standalone noindex 404 with safe text and working no-script recovery", async () => {
    const violations: string[] = [];
    page.on("console", (message) => {
      if (message.text().includes("Content Security Policy")) violations.push(message.text());
    });
    const response = await page.goto(
      server.url + "/missing/%3Cimg%20src=x%3E?long=" + "a".repeat(200),
    );
    expect(response!.status()).toBe(404);
    await page.waitForSelector("#requested-path:not([hidden])");
    expect(await page.$("#requested-path img")).toBeNull();
    expect(await page.$("#app")).toBeNull();
    expect(await page.$eval('meta[name="robots"]', (e) => e.getAttribute("content"))).toBe(
      "noindex",
    );
    await page.setJavaScriptEnabled(false);
    await page.reload();
    expect(await page.$eval("main a", (e) => e.getAttribute("href"))).toBe("/");
    await page.click("main a");
    expect(new URL(page.url()).pathname).toBe("/");
    expect(violations).toEqual([]);
  });
  it("keeps root offline caching while cached missing routes still return 404", async () => {
    server.state.production = true;
    await page.goto(server.url, { waitUntil: "networkidle0" });
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
    await page.reload({ waitUntil: "networkidle0" });
    const response = await page.goto(server.url + "/missing-after-install");
    expect(response!.status()).toBe(404);
    await page.setOfflineMode(true);
    await page.goto(server.url);
    await page.waitForSelector(".resume-site");
    expect(await page.$eval("h1", (e) => e.textContent)).toBeTruthy();
  });
});

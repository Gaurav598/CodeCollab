import { expect, test, type Page } from "@playwright/test";

const apiBase = "http://localhost:8080/api/v1";

type FileEntry = {
  id: string;
  roomId: string;
  path: string;
  language: string;
  createdAt: string;
};

async function mockBackend(page: Page) {
  const user = { id: "user-1", username: "gaurav", email: "gaurav@example.com" };
  const room = {
    id: "room-1",
    roomCode: "ROOM42",
    ownerId: "user-1",
    visibility: "public",
    role: "owner",
    createdAt: "2026-06-24T00:00:00Z",
  };
  const files: FileEntry[] = [];

  await page.route(`${apiBase}/auth/me`, async (route) => {
    await route.fulfill({ status: 200, json: { user, accessToken: "access-token" } });
  });

  await page.route(`${apiBase}/auth/register`, async (route) => {
    await route.fulfill({ status: 200, json: { user, accessToken: "access-token" } });
  });

  await page.route(`${apiBase}/auth/login`, async (route) => {
    await route.fulfill({ status: 200, json: { user, accessToken: "access-token" } });
  });

  await page.route(`${apiBase}/rooms`, async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({ status: 200, json: room });
      return;
    }
    await route.fulfill({ status: 200, json: [room] });
  });

  await page.route(`${apiBase}/rooms/ROOM42`, async (route) => {
    await route.fulfill({ status: 200, json: room });
  });

  await page.route(`${apiBase}/rooms/ROOM42/files`, async (route) => {
    await route.fulfill({ status: 200, json: files });
  });

  await page.route(`${apiBase}/files`, async (route) => {
    const file = {
      id: "file-1",
      roomId: "room-1",
      path: "app.ts",
      language: "typescript",
      createdAt: "2026-06-24T00:00:00Z",
    };
    files.push(file);
    await route.fulfill({ status: 200, json: file });
  });

  await page.route(`${apiBase}/execution/run`, async (route) => {
    await route.fulfill({ status: 200, json: { stdout: "hello from sandbox\n", stderr: "", exitCode: 0, executionTimeMs: 18 } });
  });

  await page.route(`${apiBase}/chat/room-1/history?page=0&size=50`, async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        content: [
          { id: "message-1", senderId: "user-2", senderName: "Maya", message: "@gaurav please review this", createdAt: "2026-06-24T00:00:00Z" },
        ],
      },
    });
  });

  await page.route(`${apiBase}/notifications?page=0&size=20`, async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        content: [
          { id: "notification-1", type: "MENTION", title: "Mention", body: "Maya mentioned you", isRead: false, timestamp: "2026-06-24T00:00:00Z" },
        ],
      },
    });
  });

  await page.route(`${apiBase}/notifications/unread-count`, async (route) => {
    await route.fulfill({ status: 200, json: 1 });
  });

  await page.route(`${apiBase}/ai/**`, async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        feature: "EXPLAIN",
        provider: "local",
        fallback: true,
        content: "This file renders the app shell.",
        previewCode: "",
        findings: [],
        strengths: ["Readable structure"],
        weaknesses: [],
        suggestions: ["Add an integration test"],
        securityConcerns: [],
        performanceConcerns: [],
        contextFiles: [],
        latencyMs: 4,
      },
    });
  });
}

test.beforeEach(async ({ page }) => {
  page.on('console', msg => console.log('BROWSER_CONSOLE: ' + msg.text()));
  page.on('pageerror', err => console.log('BROWSER_ERROR: ' + err.message));
  page.on('response', resp => { if(resp.status() >= 400) console.log('HTTP ' + resp.status() + ' ' + resp.url()); });
  await mockBackend(page);
});

async function createAndOpenWorkspaceFile(page: Page) {
  page.once("dialog", async (dialog) => {
    await dialog.accept("app.ts");
  });
  await page.getByText("No Files Created").click({ button: "right" });
  await page.getByText("New File", { exact: true }).click();
  await page.getByText("app.ts").click();
}

test("registers and logs in with mocked backend auth", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Username").fill("gaurav");
  await page.getByLabel("Email").fill("gaurav@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page.getByRole("heading", { name: "CollabCode" })).toBeVisible();

  await page.goto("/login");
  await page.getByLabel(/email or username/i).fill("gaurav@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByRole("heading", { name: "CollabCode" })).toBeVisible();
});

test("creates room and file from workspace UI", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.getByRole("button", { name: /create public room/i }).click();
  await expect(page).toHaveURL(/\/room\/ROOM42/);
  await expect(page.getByText("ROOM: ROOM42")).toBeVisible();

  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("File name");
    await dialog.accept("app.ts");
  });
  
  await page.getByText("No Files Created").click({ button: "right" });
  await page.getByText("New File", { exact: true }).click();
  await expect(page.getByText("app.ts")).toBeVisible();
});

test("surfaces chat, notifications, and AI actions in the workspace", async ({ page }) => {
  await page.goto("/room/ROOM42");
  await expect(page.getByText("Room: ROOM42")).toBeVisible();
  await createAndOpenWorkspaceFile(page);

  await page.getByRole("button", { name: "Chat", exact: true }).click();
  await expect(page.getByText("@gaurav please review this")).toBeVisible();

  await page.getByRole("button", { name: /ai/i }).click();
  await page.getByRole("button", { name: /explain/i }).click();
  await expect(page.getByText("This file renders the app shell.")).toBeVisible();

  await page.getByRole("button", { name: /notifications/i }).click();
  await expect(page.getByText("Maya mentioned you")).toBeVisible();
});

test("documents live-only collaboration and run-code dependency", async ({ page }) => {
  await page.goto("/room/ROOM42");
  await createAndOpenWorkspaceFile(page);
  await expect(page.getByText(/connecting to sync service/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /run/i })).toBeDisabled();
});

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { createAdminDataStore } from "./admin";

describe("admin data store", () => {
  let tempFile: string;

  beforeEach(() => {
    tempFile = path.join(os.tmpdir(), `admin-store-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  });

  afterEach(async () => {
    await fs.rm(tempFile, { force: true });
  });

  it("creates default data when no file exists", async () => {
    const store = createAdminDataStore(tempFile);

    const data = await store.load();

    expect(data.siteData.title).toBeDefined();
    expect(data.users[0]?.username).toBe("ashrilll");
  });

  it("saves and reloads updated admin data", async () => {
    const store = createAdminDataStore(tempFile);

    await store.save({
      siteData: {
        title: "Updated title",
        subtitle: "Updated subtitle",
        introParagraph: "Updated intro",
        categories: [],
        ads: [],
      },
      users: [
        {
          id: "u1",
          username: "tester",
          password: "hashed",
          role: "admin",
          createdAt: new Date().toISOString(),
        },
      ],
    });

    const reloaded = await store.load();

    expect(reloaded.siteData.title).toBe("Updated title");
    expect(reloaded.users[0]?.username).toBe("tester");
  });
});

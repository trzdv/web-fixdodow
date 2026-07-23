import { promises as fs } from "fs";
import path from "path";
import { defaultSiteData, type SiteData } from "../../client/lib/data";
import { defaultUsers, type User } from "../../client/lib/auth";

export interface AdminDataPayload {
  siteData: SiteData;
  users: User[];
}

const defaultAdminData = (): AdminDataPayload => ({
  siteData: defaultSiteData,
  users: defaultUsers,
});

export function createAdminDataStore(filePath = path.resolve(process.cwd(), "data", "admin-data.json")) {
  const resolvedPath = filePath;

  const ensureDirectory = async () => {
    await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
  };

  const load = async (): Promise<AdminDataPayload> => {
    try {
      await ensureDirectory();
      const raw = await fs.readFile(resolvedPath, "utf8");
      const parsed = JSON.parse(raw);

      return {
        siteData: parsed?.siteData ?? defaultSiteData,
        users: Array.isArray(parsed?.users) && parsed.users.length > 0 ? parsed.users : defaultUsers,
      };
    } catch {
      await save(defaultAdminData());
      return defaultAdminData();
    }
  };

  const save = async (data: AdminDataPayload): Promise<void> => {
    await ensureDirectory();
    await fs.writeFile(resolvedPath, JSON.stringify(data, null, 2), "utf8");
  };

  return { load, save };
}

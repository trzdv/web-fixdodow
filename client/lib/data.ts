export interface ShoppingItem {
  id: string;
  number: number;
  title: string;
  source: string;
  shopLink: string;
  imageUrl: string;
}

export interface Ad {
  id: string;
  type: "image" | "video";
  imageUrl?: string;
  videoUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  items: ShoppingItem[];
}

export interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
}

export interface SiteData {
  title: string;
  subtitle: string;
  introParagraph: string;
  categories: Category[];
  ads: Ad[];
  theme?: ThemeSettings;
}

export interface CategoryDraft {
  name: string;
  description: string;
  imageUrl: string;
}

export const SITE_DATA_STORAGE_KEY = "siteData";
export const SITE_DATA_UPDATED_EVENT = "site-data-updated";

export const normalizeSiteData = (input: Partial<SiteData> | null | undefined, fallback: SiteData = defaultSiteData): SiteData => {
  const categories = Array.isArray(input?.categories)
    ? input!.categories.map((category) => ({
        id: category?.id ?? "",
        name: category?.name ?? "",
        description: category?.description ?? "",
        imageUrl: category?.imageUrl ?? "",
        items: Array.isArray(category?.items) ? category.items : [],
      }))
    : fallback.categories;

  const ads = Array.isArray(input?.ads)
    ? input.ads.map((ad) => ({
        id: ad?.id ?? "",
        type: ad?.type === "video" ? "video" : "image" as "video" | "image",
        imageUrl: ad?.imageUrl ?? "",
        videoUrl: ad?.videoUrl ?? "",
      }))
    : fallback.ads;

  const theme = input?.theme ? {
    primaryColor: input.theme.primaryColor ?? fallback.theme?.primaryColor ?? "#e93faa",
    secondaryColor: input.theme.secondaryColor ?? fallback.theme?.secondaryColor ?? "#1a1a1a",
    backgroundColor: input.theme.backgroundColor ?? fallback.theme?.backgroundColor ?? "#ffffff",
    textColor: input.theme.textColor ?? fallback.theme?.textColor ?? "#1a1a1a",
    accentColor: input.theme.accentColor ?? fallback.theme?.accentColor ?? "#e93faa",
  } : fallback.theme;

  return {
    title: input?.title ?? fallback.title,
    subtitle: input?.subtitle ?? fallback.subtitle,
    introParagraph: input?.introParagraph ?? fallback.introParagraph,
    categories,
    ads,
    theme,
  };
};

export const applySiteTheme = (theme: ThemeSettings = defaultSiteData.theme): void => {
  if (typeof window === "undefined" || !theme) {
    return;
  }

  const root = document.documentElement;
  root.style.setProperty("--site-background", theme.backgroundColor);
  root.style.setProperty("--site-foreground", theme.textColor);
  root.style.setProperty("--site-primary", theme.primaryColor);
  root.style.setProperty("--site-secondary", theme.secondaryColor);
  root.style.setProperty("--site-accent", theme.accentColor);
};

export const createCategoryFromDraft = (draft: CategoryDraft): Category => ({
  id: draft.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, ""),
  name: draft.name,
  description: draft.description,
  imageUrl: draft.imageUrl,
  items: [],
});

export const defaultSiteData: SiteData = {
  title: "✨ Dashboard 💌",
  subtitle: "Description of the dashboard",
  introParagraph: "˚ ༘ ⋆｡ ˚ ୨୧ ⋆ ˚｡⋆˚",
  categories: [],
  ads: [],
  theme: {
    primaryColor: "#e93faa",
    secondaryColor: "#1a1a1a",
    backgroundColor: "#ffffff",
    textColor: "#1a1a1a",
    accentColor: "#e93faa",
  },
};

export const loadSiteData = (): SiteData => {
  if (typeof window === "undefined") {
    return defaultSiteData;
  }

  const saved = localStorage.getItem(SITE_DATA_STORAGE_KEY);
  if (!saved) {
    applySiteTheme(defaultSiteData.theme);
    return defaultSiteData;
  }

  try {
    const normalized = normalizeSiteData(JSON.parse(saved) as Partial<SiteData>, defaultSiteData);
    applySiteTheme(normalized.theme);
    return normalized;
  } catch {
    applySiteTheme(defaultSiteData.theme);
    return defaultSiteData;
  }
};

export const saveSiteData = (data: SiteData): void => {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = normalizeSiteData(data, defaultSiteData);
  localStorage.setItem(SITE_DATA_STORAGE_KEY, JSON.stringify(normalized));
  notifySiteDataUpdated();
};

let siteDataBroadcastChannel: BroadcastChannel | null = null;

export const notifySiteDataUpdated = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(SITE_DATA_UPDATED_EVENT));

  if (typeof BroadcastChannel !== "undefined") {
    if (!siteDataBroadcastChannel) {
      siteDataBroadcastChannel = new BroadcastChannel("site-data-updates");
    }
    siteDataBroadcastChannel.postMessage({ type: SITE_DATA_UPDATED_EVENT });
  }
};

export const subscribeToSiteDataUpdates = (callback: () => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === SITE_DATA_STORAGE_KEY) {
      callback();
    }
  };

  const handleUpdated = () => callback();

  let channel: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel("site-data-updates");
    channel.addEventListener("message", handleUpdated);
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(SITE_DATA_UPDATED_EVENT, handleUpdated);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SITE_DATA_UPDATED_EVENT, handleUpdated);
    channel?.removeEventListener("message", handleUpdated);
    channel?.close();
  };
};

export const fetchAdminData = async () => {
  const response = await fetch("/api/admin/data");
  if (!response.ok) {
    throw new Error("Failed to fetch admin data");
  }

  return response.json();
};

export const saveAdminData = async (payload: { siteData: SiteData; users: unknown[] }) => {
  const response = await fetch("/api/admin/data", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to save admin data");
  }

  return response.json();
};

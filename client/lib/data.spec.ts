import { describe, expect, it } from "vitest";
import { createCategoryFromDraft, normalizeSiteData, defaultSiteData, SiteData } from "./data";

describe("createCategoryFromDraft", () => {
  it("creates a category with a slug id and empty items", () => {
    const category = createCategoryFromDraft({
      name: "New Category",
      description: "Fresh picks",
      imageUrl: "https://example.com/image.jpg",
    });

    expect(category.id).toBe("new-category");
    expect(category.name).toBe("New Category");
    expect(category.description).toBe("Fresh picks");
    expect(category.imageUrl).toBe("https://example.com/image.jpg");
    expect(category.items).toEqual([]);
  });
});

describe("normalizeSiteData", () => {
  it("falls back to defaults when the payload is incomplete", () => {
    const normalized = normalizeSiteData(
      { title: "Remote title" } as Partial<SiteData>,
      defaultSiteData,
    );

    expect(normalized.title).toBe("Remote title");
    expect(normalized.subtitle).toBe(defaultSiteData.subtitle);
    expect(normalized.categories).toEqual(defaultSiteData.categories);
    expect(normalized.ads).toEqual(defaultSiteData.ads);
  });

  it("normalizes ads and preserves image URLs", () => {
    const normalized = normalizeSiteData(
      {
        title: "Remote title",
        ads: [
          {
            id: "ad-x",
            imageUrl: "https://example.com/remote.jpg",
          },
        ],
      } as Partial<SiteData>,
      defaultSiteData,
    );

    expect(normalized.ads).toHaveLength(1);
    expect(normalized.ads[0]).toEqual({
      id: "ad-x",
      type: "image",
      imageUrl: "https://example.com/remote.jpg",
      videoUrl: undefined,
    });
  });

  it("normalizes video ads and preserves video URLs", () => {
    const normalized = normalizeSiteData(
      {
        title: "Remote title",
        ads: [
          {
            id: "ad-video",
            type: "video",
            videoUrl: "https://example.com/video.mp4",
          },
        ],
      } as Partial<SiteData>,
      defaultSiteData,
    );

    expect(normalized.ads).toHaveLength(1);
    expect(normalized.ads[0]).toEqual({
      id: "ad-video",
      type: "video",
      imageUrl: "",
      videoUrl: "https://example.com/video.mp4",
    });
  });
});

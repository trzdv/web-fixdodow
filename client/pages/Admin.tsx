import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Edit2, Save, X, LogOut, Search, XCircle } from "lucide-react";
import { defaultSiteData, SiteData, Ad, Category, ShoppingItem, loadSiteData, normalizeSiteData, saveSiteData as persistSiteData, fetchAdminData, saveAdminData, createCategoryFromDraft, type CategoryDraft, applySiteTheme } from "@/lib/data";
import { getStoredAuth, clearAuth, User, getStoredUsers, saveUsers, hashPassword } from "@/lib/auth";

export default function Admin() {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState(getStoredAuth());
  type SiteSettingsDraft = Pick<SiteData, "title" | "subtitle" | "introParagraph" | "theme">;

  const [siteData, setSiteData] = useState<SiteData>(loadSiteData());
  const [siteSettingsDraft, setSiteSettingsDraft] = useState<SiteSettingsDraft>({
    title: siteData.title,
    subtitle: siteData.subtitle,
    introParagraph: siteData.introParagraph,
    theme: siteData.theme,
  });
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{ categoryId: string; itemId: string } | null>(null);
  const [showNewItemForm, setShowNewItemForm] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<ShoppingItem>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState<CategoryDraft>({ name: "", description: "", imageUrl: "" });
  const [newAd, setNewAd] = useState<Partial<Ad>>({ type: "image", imageUrl: "", videoUrl: "" });
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [editingAdDraft, setEditingAdDraft] = useState<Partial<Ad>>({ type: "image", imageUrl: "", videoUrl: "" });
  const [newUser, setNewUser] = useState<{ username: string; password: string; role: "admin" | "editor" }>({ username: "", password: "", role: "editor" });
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"content" | "users">("content");
  const [searchQuery, setSearchQuery] = useState("");

  const saveAndSetSiteData = (updated: SiteData) => {
    setSiteData(updated);
    saveSiteData(updated);
  };

  const hasSiteSettingsChanges = JSON.stringify(siteSettingsDraft) !== JSON.stringify({
    title: siteData.title,
    subtitle: siteData.subtitle,
    introParagraph: siteData.introParagraph,
    theme: siteData.theme,
  });

  const saveSiteSettings = () => {
    saveSiteData({ ...siteData, ...siteSettingsDraft });
  };

  const discardSiteSettingsChanges = () => {
    setSiteSettingsDraft({
      title: siteData.title,
      subtitle: siteData.subtitle,
      introParagraph: siteData.introParagraph,
      theme: siteData.theme,
    });
  };

  useEffect(() => {
    if (!hasSiteSettingsChanges) {
      setSiteSettingsDraft({
        title: siteData.title,
        subtitle: siteData.subtitle,
        introParagraph: siteData.introParagraph,
        theme: siteData.theme,
      });
    }
  }, [siteData]);

  useEffect(() => {
    const syncData = async () => {
      try {
        const remoteData = await fetchAdminData();
        if (remoteData?.siteData) {
          const normalizedSite = normalizeSiteData(remoteData.siteData, defaultSiteData);
          setSiteData(normalizedSite);
          persistSiteData(normalizedSite);
        }
        if (Array.isArray(remoteData?.users)) {
          setUsers(remoteData.users);
          saveUsers(remoteData.users);
        }
      } catch {
        setSiteData(loadSiteData());
        setUsers(getStoredUsers());
      }

      setAuthState(getStoredAuth());
    };

    syncData();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "siteData" || event.key === "users" || event.key === "authState") {
        syncData();
      }
    };

    const handleSiteDataUpdated = () => {
      syncData();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("site-data-updated", handleSiteDataUpdated);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("site-data-updated", handleSiteDataUpdated);
    };
  }, []);

  useEffect(() => {
    applySiteTheme(siteData.theme);
  }, [siteData.theme]);

  const handleLogout = () => {
    clearAuth();
    setAuthState(null);
    navigate("/login");
  };

  const addUser = () => {
    if (!newUser.username || !newUser.password) {
      alert("Please fill in all fields");
      return;
    }

    const userExists = users.some((u) => u.username === newUser.username);
    if (userExists) {
      alert("Username already exists");
      return;
    }

    const createdUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username: newUser.username,
      password: hashPassword(newUser.password),
      role: newUser.role,
      createdAt: new Date().toISOString(),
    };

    const updated = [...users, createdUser];
    setUsers(updated);
    saveUsers(updated);
    void saveAdminData({ siteData, users: updated });
    setNewUser({ username: "", password: "", role: "editor" });
    setShowNewUserForm(false);
  };

  const deleteUser = (userId: string) => {
    // Don't allow deleting the current user
    if (authState?.user?.id === userId) {
      alert("You cannot delete your own account");
      return;
    }

    const updated = users.filter((u) => u.id !== userId);
    setUsers(updated);
    saveUsers(updated);
    void saveAdminData({ siteData, users: updated });
  };

  const updateUserRole = (userId: string, newRole: "admin" | "editor") => {
    const updated = users.map((u) =>
      u.id === userId ? { ...u, role: newRole } : u
    );
    setUsers(updated);
    saveUsers(updated);
    void saveAdminData({ siteData, users: updated });
  };

  const saveSiteData = async (data: SiteData) => {
    setSiteData(data);
    persistSiteData(data);

    try {
      await saveAdminData({ siteData: data, users });
    } catch {
      // fall back to local storage if server save fails
    }

  };

  const updateCategory = (categoryId: string, field: string, value: string) => {
    const updated = {
      ...siteData,
      categories: siteData.categories.map((cat) =>
        cat.id === categoryId
          ? { ...cat, [field]: value }
          : cat
      ),
    };
    saveSiteData(updated);
  };

  const updateItem = (categoryId: string, itemId: string, field: string, value: string | number) => {
    const updated = {
      ...siteData,
      categories: siteData.categories.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              items: cat.items.map((item) =>
                item.id === itemId
                  ? { ...item, [field]: value }
                  : item
              ),
            }
          : cat
      ),
    };
    saveSiteData(updated);
  };

  const deleteItem = (categoryId: string, itemId: string) => {
    const updated = {
      ...siteData,
      categories: siteData.categories.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              items: cat.items.filter((item) => item.id !== itemId),
            }
          : cat
      ),
    };
    saveSiteData(updated);
  };

  const deleteCategory = (categoryId: string) => {
    const targetCategory = siteData.categories.find((cat) => cat.id === categoryId);
    if (!targetCategory) return;

    const confirmed = window.confirm(`Delete category "${targetCategory.name}"?`);
    if (!confirmed) return;

    const updated = {
      ...siteData,
      categories: siteData.categories.filter((cat) => cat.id !== categoryId),
    };
    saveSiteData(updated);
  };

  const addCategory = () => {
    if (!newCategory.name.trim()) {
      alert("Please fill in category name");
      return;
    }

    const createdCategory = createCategoryFromDraft({
      name: newCategory.name.trim(),
      description: newCategory.description.trim(),
      imageUrl: newCategory.imageUrl.trim(),
    });

    const updated = {
      ...siteData,
      categories: [...siteData.categories, createdCategory],
    };

    saveSiteData(updated);
    setNewCategory({ name: "", description: "", imageUrl: "" });
    setShowNewCategoryForm(false);
  };

  const addAd = () => {
    const type = newAd.type === "video" ? "video" : "image";
    const hasValidUrl = type === "video"
      ? Boolean(newAd.videoUrl?.trim())
      : Boolean(newAd.imageUrl?.trim());

    if (!hasValidUrl) {
      alert(`Please fill in the ad ${type === "video" ? "video" : "image"} URL`);
      return;
    }

    const createdAd: Ad = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      imageUrl: type === "image" ? newAd.imageUrl?.trim() ?? "" : undefined,
      videoUrl: type === "video" ? newAd.videoUrl?.trim() ?? "" : undefined,
    };

    saveSiteData({
      ...siteData,
      ads: [...(siteData.ads ?? []), createdAd],
    });

    setNewAd({ type: "image", imageUrl: "", videoUrl: "" });
  };

  const startEditingAd = (ad: Ad) => {
    setEditingAdId(ad.id);
    setEditingAdDraft({ ...ad });
  };

  const cancelEditingAd = () => {
    setEditingAdId(null);
    setEditingAdDraft({});
  };

  const saveAdEdit = () => {
    if (!editingAdId) {
      return;
    }

    const type = editingAdDraft.type === "video" ? "video" : "image";
    const hasValidUrl = type === "video"
      ? Boolean(editingAdDraft.videoUrl?.trim())
      : Boolean(editingAdDraft.imageUrl?.trim());

    if (!hasValidUrl) {
      alert(`Please fill in the ad ${type === "video" ? "video" : "image"} URL`);
      return;
    }

    const updatedAds = (siteData.ads ?? []).map((ad) =>
      ad.id === editingAdId
        ? {
            ...ad,
            type: type as "video" | "image",
            imageUrl: type === "image" ? editingAdDraft.imageUrl?.trim() ?? "" : undefined,
            videoUrl: type === "video" ? editingAdDraft.videoUrl?.trim() ?? "" : undefined,
          }
        : ad
    );

    saveSiteData({ ...siteData, ads: updatedAds });
    cancelEditingAd();
  };

  const deleteAd = (adId: string) => {
    const updated = {
      ...siteData,
      ads: (siteData.ads ?? []).filter((ad) => ad.id !== adId),
    };
    saveSiteData(updated);
  };

  const moveAd = (adId: string, direction: "up" | "down") => {
    const ads = [...(siteData.ads ?? [])];
    const index = ads.findIndex((ad) => ad.id === adId);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= ads.length) return;

    [ads[index], ads[targetIndex]] = [ads[targetIndex], ads[index]];
    saveSiteData({ ...siteData, ads });
  };

  const addItem = (categoryId: string) => {
    if (!newItem.title || !newItem.shopLink) {
      alert("Please fill in title and shop link");
      return;
    }

    const category = siteData.categories.find((c) => c.id === categoryId);
    if (!category) return;

    const newShoppingItem: ShoppingItem = {
      id: Math.random().toString(36).substr(2, 9),
      number: Math.max(...category.items.map((i) => i.number), 0) + 1,
      title: newItem.title || "",
      source: newItem.source || "",
      shopLink: newItem.shopLink || "",
      imageUrl: newItem.imageUrl || "",
    };

    const updated = {
      ...siteData,
      categories: siteData.categories.map((cat) =>
        cat.id === categoryId
          ? { ...cat, items: [...cat.items, newShoppingItem] }
          : cat
      ),
    };
    saveSiteData(updated);
    setNewItem({});
    setShowNewItemForm(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between mb-5">
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-semibold hover:opacity-70 transition-opacity"
              style={{ color: "#e93faa" }}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Site</span>
            </Link>
            <h1 className="text-3xl font-bold" style={{ color: "#1a1a1a" }}>Admin Panel</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600" style={{ fontFamily: "Karla" }}>
                Logged in as: <span className="font-semibold text-primary">{authState?.user?.username}</span>
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-80 transition-opacity text-white font-semibold"
                style={{ backgroundColor: "#e93faa" }}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-t border-gray-200 pt-4 items-center justify-between">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("content")}
                className={`px-4 py-2 font-semibold text-sm transition-all ${
                  activeTab === "content"
                    ? "text-primary border-b-2"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                style={
                  activeTab === "content"
                    ? { borderBottomColor: "#e93faa", color: "#e93faa" }
                    : {}
                }
              >
                Content Management
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`px-4 py-2 font-semibold text-sm transition-all ${
                  activeTab === "users"
                    ? "text-primary border-b-2"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                style={
                  activeTab === "users"
                    ? { borderBottomColor: "#e93faa", color: "#e93faa" }
                    : {}
                }
              >
                User Management
              </button>
            </div>

            {/* Search Bar */}
            {activeTab === "content" && (
              <div className="relative w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search categories, items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Clear search"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Content Management Tab */}
        {activeTab === "content" && (
          <>
        {/* Site Settings */}
        <section className="bg-white rounded-xl shadow-md p-8 mb-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>Site Settings</h2>
              <p className="text-sm text-gray-500 mt-2">Edit site title, subtitle, and intro text in draft mode before saving.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={saveSiteSettings}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold"
                style={{ backgroundColor: "#e93faa" }}
                disabled={!hasSiteSettingsChanges}
              >
                <Save className="w-4 h-4" />
                Save Settings
              </button>
              <button
                onClick={discardSiteSettingsChanges}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                disabled={!hasSiteSettingsChanges}
              >
                Discard
              </button>
            </div>
          </div>
          <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-4 mb-8">
            <p className="text-sm text-gray-600">
              Your site settings are currently in draft mode. Click <span className="font-semibold text-primary">Save Settings</span> to apply them site-wide.
            </p>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: "#1a1a1a" }}>Main Title</label>
              <input
                type="text"
                value={siteSettingsDraft.title}
                onChange={(e) =>
                  setSiteSettingsDraft({ ...siteSettingsDraft, title: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: "#1a1a1a" }}>Subtitle</label>
              <input
                type="text"
                value={siteSettingsDraft.subtitle}
                onChange={(e) =>
                  setSiteSettingsDraft({ ...siteSettingsDraft, subtitle: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: "#1a1a1a" }}>Intro Paragraph</label>
              <input
                type="text"
                value={siteSettingsDraft.introParagraph}
                onChange={(e) =>
                  setSiteSettingsDraft({ ...siteSettingsDraft, introParagraph: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>
        </section>

        {/* Theme Customization */}
        <section className="bg-white rounded-3xl shadow-md p-8 mb-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>🎨 Appearance & Theme</h2>
              <p className="text-sm text-gray-500 mt-2">Pick the primary, secondary, background, text and accent colors for the site.</p>
            </div>
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs uppercase tracking-[0.2em] text-gray-500">
              Theme editor
            </span>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: "Primary", key: "primaryColor", value: siteSettingsDraft.theme?.primaryColor || "#e93faa" },
                { label: "Secondary", key: "secondaryColor", value: siteSettingsDraft.theme?.secondaryColor || "#1a1a1a" },
                { label: "Background", key: "backgroundColor", value: siteSettingsDraft.theme?.backgroundColor || "#ffffff" },
                { label: "Text", key: "textColor", value: siteSettingsDraft.theme?.textColor || "#1a1a1a" },
                { label: "Accent", key: "accentColor", value: siteSettingsDraft.theme?.accentColor || "#e93faa" },
              ].map((field) => (
                <div key={field.key} className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                  <label className="block text-sm font-semibold mb-3" style={{ color: "#1a1a1a" }}>{field.label} Color</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={field.value}
                      onChange={(e) =>
                        setSiteSettingsDraft({
                          ...siteSettingsDraft,
                          theme: { ...siteSettingsDraft.theme, [field.key]: e.target.value },
                        })
                      }
                      className="w-20 h-12 rounded-lg cursor-pointer border border-gray-200"
                    />
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) =>
                        setSiteSettingsDraft({
                          ...siteSettingsDraft,
                          theme: { ...siteSettingsDraft.theme, [field.key]: e.target.value },
                        })
                      }
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 text-sm font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold" style={{ color: "#1a1a1a" }}>Live Preview</h3>
                <p className="text-sm text-gray-500 mt-1">Draft theme changes are shown here before you save.</p>
              </div>
              <div className="rounded-3xl border border-gray-200 bg-white p-6 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">Site preview</p>
                  <h4 className="text-xl font-semibold" style={{ color: siteSettingsDraft.theme?.secondaryColor }}>Preview heading</h4>
                </div>
                <p className="text-sm" style={{ color: siteSettingsDraft.theme?.textColor }}>
                  This is how your text will look across the site with the selected theme colors.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="rounded-full px-4 py-2 text-sm font-semibold text-white"
                    style={{ backgroundColor: siteSettingsDraft.theme?.primaryColor }}
                  >
                    Primary button
                  </button>
                  <span
                    className="rounded-full px-4 py-2 text-sm font-semibold text-white"
                    style={{ backgroundColor: siteSettingsDraft.theme?.accentColor }}
                  >
                    Accent badge
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-md p-8 mb-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>Advertisement Slots</h2>
              <p className="text-sm text-gray-500 mt-1">Manage the rotating ads shown below the search bar.</p>
              <p className="text-sm text-gray-500 mt-2">Use image or video mode for ads. Recommended image size: 1200×300 px; video should be short and landscape.</p>
            </div>
            <button
              onClick={() => {
                setEditingAdId(null);
                setEditingAdDraft({ type: "image", imageUrl: "", videoUrl: "" });
                setNewAd({ type: "image", imageUrl: "", videoUrl: "" });
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white"
              style={{ backgroundColor: "#e93faa" }}
            >
              <Plus className="w-4 h-4" />
              Reset Form
            </button>
          </div>

          <div className="space-y-4">
            {(siteData.ads ?? []).map((ad, index) => (
              <div key={ad.id} className="border border-gray-200 rounded-2xl p-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: siteData.theme?.primaryColor }}>
                        {index + 1}
                      </span>
                      <h3 className="text-lg font-semibold" style={{ color: "#1a1a1a" }}>
                        Ad {ad.type === "video" ? "Video" : "Image"}
                      </h3>
                    </div>
                    <div
                      className="mb-3 rounded-2xl overflow-hidden bg-gray-100"
                      style={{ aspectRatio: "4 / 1" }}
                    >
                      {ad.type === "video" ? (
                        <video
                          src={ad.videoUrl}
                          controls
                          muted
                          playsInline
                          controlsList="nofullscreen"
                          disablePictureInPicture
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={ad.imageUrl}
                          alt={`Ad ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap items-center">
                    <button
                      onClick={() => moveAd(ad.id, "up")}
                      className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-100 transition-colors"
                      disabled={index === 0}
                    >
                      Up
                    </button>
                    <button
                      onClick={() => moveAd(ad.id, "down")}
                      className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-100 transition-colors"
                      disabled={index === (siteData.ads ?? []).length - 1}
                    >
                      Down
                    </button>
                    <button
                      onClick={() => startEditingAd(ad)}
                      className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-100 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteAd(ad.id)}
                      className="px-3 py-2 rounded-lg border border-red-200 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-gray-200 pt-8">
            <h3 className="text-xl font-semibold mb-4" style={{ color: "#1a1a1a" }}>
              {editingAdId ? "Edit Ad" : "Add New Ad"}
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "#1a1a1a" }}>Mode</label>
                <select
                  value={editingAdId ? editingAdDraft.type ?? "image" : newAd.type ?? "image"}
                  onChange={(e) => {
                    const value = e.target.value as "image" | "video";
                    if (editingAdId) {
                      setEditingAdDraft({ ...editingAdDraft, type: value });
                    } else {
                      setNewAd({ ...newAd, type: value });
                    }
                  }}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2" style={{ color: "#1a1a1a" }}>
                  {editingAdId ? editingAdDraft.type === "video" ? "Video URL" : "Image URL" : newAd.type === "video" ? "Video URL" : "Image URL"}
                </label>
                <input
                  type="text"
                  value={editingAdId ? (editingAdDraft.type === "video" ? editingAdDraft.videoUrl ?? "" : editingAdDraft.imageUrl ?? "") : (newAd.type === "video" ? newAd.videoUrl ?? "" : newAd.imageUrl ?? "")}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (editingAdId) {
                      if (editingAdDraft.type === "video") {
                        setEditingAdDraft({ ...editingAdDraft, videoUrl: value });
                      } else {
                        setEditingAdDraft({ ...editingAdDraft, imageUrl: value });
                      }
                    } else {
                      if (newAd.type === "video") {
                        setNewAd({ ...newAd, videoUrl: value });
                      } else {
                        setNewAd({ ...newAd, imageUrl: value });
                      }
                    }
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {editingAdId ? (
                <>
                  <button
                    onClick={saveAdEdit}
                    className="px-5 py-3 rounded-lg text-white font-semibold"
                    style={{ backgroundColor: "#e93faa" }}
                  >
                    Save Ad
                  </button>
                  <button
                    onClick={cancelEditingAd}
                    className="px-5 py-3 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={addAd}
                  className="px-5 py-3 rounded-lg text-white font-semibold"
                  style={{ backgroundColor: "#e93faa" }}
                >
                  Add Ad
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>Categories</h2>
            <button
              onClick={() => setShowNewCategoryForm((prev) => !prev)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all text-white"
              style={{ backgroundColor: "#e93faa" }}
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </div>

          {showNewCategoryForm && (
            <div className="bg-blue-50 border border-dashed border-blue-300 rounded-xl p-6">
              <h3 className="font-semibold mb-4" style={{ color: "#1a1a1a" }}>Create New Category</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#1a1a1a" }}>Category Name</label>
                  <input
                    type="text"
                    placeholder="Enter category name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#1a1a1a" }}>Description</label>
                  <input
                    type="text"
                    placeholder="Enter description"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#1a1a1a" }}>Image URL</label>
                  <input
                    type="text"
                    placeholder="Enter image URL"
                    value={newCategory.imageUrl}
                    onChange={(e) => setNewCategory({ ...newCategory, imageUrl: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={addCategory}
                    className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-all text-sm font-semibold"
                    style={{ backgroundColor: "#e93faa" }}
                  >
                    Create Category
                  </button>
                  <button
                    onClick={() => {
                      setShowNewCategoryForm(false);
                      setNewCategory({ name: "", description: "", imageUrl: "" });
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {siteData.categories
            .map((category) => {
              // Filter items within the category
              const filteredItems = category.items.filter(item =>
                searchQuery === "" || 
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.source.toLowerCase().includes(searchQuery.toLowerCase())
              );
              
              // Return category only if it matches search or has matching items
              const categoryMatches = searchQuery === "" ||
                category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                filteredItems.length > 0;

              return categoryMatches ? { category, filteredItems } : null;
            })
            .filter(Boolean)
            .map(({ category, filteredItems }: any) => (
            <div key={category.id} className="bg-white rounded-xl shadow-md p-8">
              {/* Category Header */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex-1">
                  {editingCategory === category.id ? (
                    <div className="space-y-5 mb-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: "#1a1a1a" }}>Category Name</label>
                        <input
                          type="text"
                          value={category.name}
                          onChange={(e) =>
                            updateCategory(category.id, "name", e.target.value)
                          }
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
          
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: "#1a1a1a" }}>Description</label>
                        <input
                          type="text"
                          value={category.description}
                          onChange={(e) =>
                            updateCategory(category.id, "description", e.target.value)
                          }
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
          
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: "#1a1a1a" }}>Image URL</label>
                        <input
                          type="text"
                          value={category.imageUrl}
                          onChange={(e) =>
                            updateCategory(category.id, "imageUrl", e.target.value)
                          }
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
          
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg font-bold mb-1" style={{ color: "#1a1a1a" }}>{category.name}</h3>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  )}
                </div>
                <div className="ml-4 flex items-center gap-2">
                  <button
                    onClick={() =>
                      setEditingCategory(
                        editingCategory === category.id ? null : category.id
                      )
                    }
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label={editingCategory === category.id ? "Save" : "Edit"}
                  >
                    {editingCategory === category.id ? (
                      <Save className="w-5 h-5 text-green-600" />
                    ) : (
                      <Edit2 className="w-5 h-5" style={{ color: "#e93faa" }} />
                    )}
                  </button>
                  <button
                    onClick={() => deleteCategory(category.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    aria-label="Delete category"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>

              <hr className="mb-8" />

              {/* Items List */}
              <div className="space-y-4 mb-6">
                {(searchQuery ? filteredItems : category.items).map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    {editingItem?.categoryId === category.id &&
                    editingItem?.itemId === item.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Title"
                          value={item.title}
                          onChange={(e) =>
                            updateItem(
                              category.id,
                              item.id,
                              "title",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Source (e.g., @username)"
                          value={item.source}
                          onChange={(e) =>
                            updateItem(
                              category.id,
                              item.id,
                              "source",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Shop Link"
                          value={item.shopLink}
                          onChange={(e) =>
                            updateItem(
                              category.id,
                              item.id,
                              "shopLink",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Image URL"
                          value={item.imageUrl}
                          onChange={(e) =>
                            updateItem(
                              category.id,
                              item.id,
                              "imageUrl",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-bold text-primary mb-1">
                            #{item.number}
                          </div>
                          <h4 className="font-semibold mb-1">{item.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            from {item.source}
                          </p>
                          <a
                            href={item.shopLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            {item.shopLink}
                          </a>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() =>
                              setEditingItem({
                                categoryId: category.id,
                                itemId: item.id,
                              })
                            }
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() =>
                              deleteItem(category.id, item.id)
                            }
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* New Item Form */}
              {showNewItemForm === category.id ? (
                <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-blue-50">
                  <h4 className="font-semibold mb-3">Add New Item</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Item Title"
                      value={newItem.title || ""}
                      onChange={(e) =>
                        setNewItem({ ...newItem, title: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Source (e.g., @username)"
                      value={newItem.source || ""}
                      onChange={(e) =>
                        setNewItem({ ...newItem, source: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Shop Link (Shopee URL)"
                      value={newItem.shopLink || ""}
                      onChange={(e) =>
                        setNewItem({ ...newItem, shopLink: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Image URL"
                      value={newItem.imageUrl || ""}
                      onChange={(e) =>
                        setNewItem({ ...newItem, imageUrl: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => addItem(category.id)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                      >
                        Add Item
                      </button>
                      <button
                        onClick={() => {
                          setShowNewItemForm(null);
                          setNewItem({});
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewItemForm(category.id)}
                  className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-sm font-semibold text-gray-600 hover:text-primary"
                >
                  <Plus className="w-4 h-4" />
                  Add New Item
                </button>
              )}
            </div>
          ))}

          {/* No Results Message */}
          {searchQuery && siteData.categories
            .map((category) => {
              const filteredItems = category.items.filter(item =>
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.source.toLowerCase().includes(searchQuery.toLowerCase())
              );
              
              const categoryMatches = 
                category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                filteredItems.length > 0;

              return categoryMatches;
            })
            .every(match => !match) && (
            <div className="text-center py-12 bg-white rounded-xl shadow-md">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-semibold">No results found for "{searchQuery}"</p>
              <p className="text-sm text-gray-400 mt-2">Try adjusting your search terms</p>
            </div>
          )}
        </section>

        {/* Save Notification */}
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          ✓ All changes are automatically saved to your browser
        </div>
          </>
        )}

        {/* User Management Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <section className="bg-white rounded-3xl shadow-md p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>User Management</h2>
                  <p className="text-sm text-gray-500 mt-2">Add and manage editor/admin accounts for this dashboard.</p>
                </div>
                <button
                  onClick={() => setShowNewUserForm((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#e93faa] px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-600"
                >
                  <Plus className="w-4 h-4" />
                  {showNewUserForm ? "Hide form" : "Add user"}
                </button>
              </div>

              {showNewUserForm && (
                <div className="rounded-3xl border border-gray-200 bg-blue-50 p-6 mb-8">
                  <div className="grid gap-4 lg:grid-cols-[1.8fr_1fr] lg:items-end">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: "#1a1a1a" }}>Username</label>
                        <input
                          type="text"
                          placeholder="Enter username"
                          value={newUser.username}
                          onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                          className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: "#1a1a1a" }}>Password</label>
                        <input
                          type="password"
                          placeholder="Enter password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: "#1a1a1a" }}>Role</label>
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: (e.target.value === "admin" ? "admin" : "editor") })}
                        className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      onClick={addUser}
                      className="inline-flex justify-center rounded-2xl bg-[#e93faa] px-5 py-3 text-sm font-semibold text-white transition hover:bg-pink-600"
                    >
                      Create user
                    </button>
                    <button
                      onClick={() => {
                        setShowNewUserForm(false);
                        setNewUser({ username: "", password: "", role: "editor" });
                      }}
                      className="inline-flex justify-center rounded-2xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="grid gap-4">
                {users.map((user) => (
                  <div key={user.id} className="rounded-3xl border border-gray-200 bg-gray-50 p-5 shadow-sm transition hover:bg-white">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">Account</p>
                        <h4 className="text-lg font-semibold text-gray-900">@{user.username}</h4>
                        <p className="text-sm text-gray-500 mt-1">Created: {new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, (e.target.value === "admin" ? "admin" : "editor"))}
                          className="rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                          disabled={authState?.user?.id === user.id}
                        >
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => deleteUser(user.id)}
                          disabled={authState?.user?.id === user.id}
                          className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

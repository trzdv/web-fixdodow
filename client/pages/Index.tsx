import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, X } from "lucide-react";
import { SiteData, loadSiteData, subscribeToSiteDataUpdates, normalizeSiteData, applySiteTheme } from "@/lib/data";

export default function Index() {
  const [siteData, setSiteData] = useState<SiteData>(loadSiteData());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeAdIndex, setActiveAdIndex] = useState(0);

  useEffect(() => {
    if (siteData.ads.length === 0) {
      setActiveAdIndex(0);
      return;
    }

    setActiveAdIndex((prevIndex) =>
      prevIndex >= siteData.ads.length ? 0 : prevIndex
    );

    const interval = window.setInterval(() => {
      setActiveAdIndex((prevIndex) =>
        siteData.ads.length > 0 ? (prevIndex + 1) % siteData.ads.length : 0
      );
    }, 4500);

    return () => window.clearInterval(interval);
  }, [siteData.ads.length]);

  useEffect(() => {
    const syncSiteData = async () => {
      try {
        const response = await fetch("/api/admin/data");
        if (response.ok) {
          const payload = await response.json();
          const normalized = normalizeSiteData(payload?.siteData, loadSiteData());
          localStorage.setItem("siteData", JSON.stringify(normalized));
          setSiteData(normalized);
          return;
        }
      } catch {
        // fall back to local storage data
      }

      setSiteData(loadSiteData());
    };

    void syncSiteData();

    return subscribeToSiteDataUpdates(() => {
      void syncSiteData();
    });
  }, []);

  useEffect(() => {
    applySiteTheme(siteData.theme);
  }, [siteData.theme]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const itemSearchResults = normalizedQuery
    ? siteData.categories.flatMap((category) =>
        category.items
          .filter(
            (item) =>
              item.title.toLowerCase().includes(normalizedQuery) ||
              item.source.toLowerCase().includes(normalizedQuery)
          )
          .map((item) => ({
            item,
            category,
          }))
      )
    : [];

  const categorySearchResults = normalizedQuery
    ? siteData.categories.filter(
        (category) =>
          category.name.toLowerCase().includes(normalizedQuery) ||
          category.description.toLowerCase().includes(normalizedQuery)
      )
    : [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: siteData.theme?.backgroundColor }}>
      {/* Header */}
      <div className="pt-16 pb-12 px-4 text-center">
        <h1 
          className="text-6xl md:text-7xl font-bold mb-6 leading-tight"
          style={{ fontFamily: "Cormorant Garamond", color: siteData.theme?.secondaryColor }}
        >
          {siteData.title}
        </h1>
        <p 
          className="text-lg md:text-xl mb-3 font-light tracking-wide" 
          style={{ fontFamily: "Karla", color: siteData.theme?.textColor }}
        >
          {siteData.subtitle}
        </p>
        <p 
          className="text-sm md:text-base" 
          style={{ fontFamily: "Karla", color: siteData.theme?.textColor }}
        >
          {siteData.introParagraph}
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-3xl mx-auto px-4 pb-10">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name or creator..."
            className="w-full pl-12 pr-12 py-3 border-2 border-gray-300 rounded-3xl focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {siteData.ads.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 pb-10">
          <div className="rounded-3xl overflow-hidden shadow-xl bg-white">
            <div
              className="relative overflow-hidden bg-gray-100 mx-auto"
              style={{ aspectRatio: "4 / 1", maxWidth: 1200 }}
            >
              {siteData.ads[activeAdIndex].type === "video" ? (
                <video
                  src={siteData.ads[activeAdIndex].videoUrl ?? ""}
                  controls
                  muted
                  playsInline
                  controlsList="nofullscreen"
                  disablePictureInPicture
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={siteData.ads[activeAdIndex].imageUrl ?? ""}
                  alt={`Ad ${activeAdIndex + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
            </div>
            <div className="flex justify-center gap-2 px-4 py-4 bg-white">
              {siteData.ads.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveAdIndex(index)}
                  className={`w-3.5 h-3.5 rounded-full transition-all ${
                    index === activeAdIndex ? "bg-primary scale-105" : "bg-gray-300"
                  }`}
                  aria-label={`Show ad ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 pb-16">
        {searchQuery.trim() ? (
          itemSearchResults.length > 0 ? (
            <div className="space-y-8">
              <div className="text-center mb-6">
                <p className="text-sm uppercase tracking-[0.3em] text-gray-500 mb-2">Search results</p>
                <h2 className="text-3xl font-bold" style={{ color: siteData.theme?.secondaryColor }}>
                  Found {itemSearchResults.length} product{itemSearchResults.length === 1 ? "" : "s"}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {itemSearchResults.map(({ item, category }) => (
                  <div key={`${category.id}-${item.id}`} className="group overflow-hidden rounded-3xl bg-white shadow-lg transition-all hover:-translate-y-1">
                    <div className="aspect-square overflow-hidden bg-gray-100">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6">
                      <div className="text-xs uppercase tracking-[0.3em] font-semibold mb-3" style={{ color: siteData.theme?.secondaryColor }}>
                        {category.name}
                      </div>
                      <h3 className="text-2xl font-bold mb-3" style={{ color: siteData.theme?.secondaryColor }}>
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">{item.source}</p>
                      <div className="flex flex-wrap gap-3">
                        <a
                          href={item.shopLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold"
                          style={{ backgroundColor: siteData.theme?.primaryColor }}
                        >
                          Shop item
                        </a>
                        <Link
                          to={`/category/${category.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-sm font-semibold"
                          style={{ color: siteData.theme?.secondaryColor }}
                        >
                          View category
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : categorySearchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categorySearchResults.map((category, index) => (
                <Link
                  key={category.id}
                  to={`/category/${category.id}`}
                  className="group"
                >
                  <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="aspect-square overflow-hidden bg-gray-200 relative">
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-70 transition-opacity" />
                    </div>
                    <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                      <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "Cormorant Garamond" }}>
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-200 mb-4" style={{ fontFamily: "Karla" }}>
                        {category.description}
                      </p>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm bg-white bg-opacity-20">
                        Explore
                        <span>→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl bg-white shadow-lg p-16 text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-gray-500 mb-4">No results found</p>
              <h2 className="text-3xl font-bold" style={{ color: siteData.theme?.secondaryColor }}>
                No products matched "{searchQuery}"
              </h2>
              <p className="text-gray-500 mt-4">Try another name or creator</p>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {siteData.categories.map((category, index) => (
              <Link
                key={category.id}
                to={`/category/${category.id}`}
                className="group"
              >
                <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  {/* Image Background */}
                  <div className="aspect-square overflow-hidden bg-gray-200 relative">
                    <img
                      src={category.imageUrl}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-70 transition-opacity" />
                  </div>

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                    <h3 
                      className="text-2xl font-bold mb-2 group-hover:translate-y-0 transition-transform"
                      style={{ fontFamily: "Cormorant Garamond" }}
                    >
                      {category.name}
                    </h3>
                    <p 
                      className="text-sm text-gray-200 mb-4 group-hover:opacity-100 opacity-80 transition-opacity"
                      style={{ fontFamily: "Karla" }}
                    >
                      {category.description}
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm group-hover:bg-opacity-90 transition-colors w-fit"
                      style={{ fontFamily: "Karla", backgroundColor: siteData.theme?.primaryColor }}
                    >
                      Explore
                      <span>→</span>
                    </div>
                  </div>

                  {/* Playful Element */}
                  <div className="absolute top-4 right-4 w-12 h-12 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="text-2xl">✨</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      {/* <div className="pb-12 text-center border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <p className="text-gray-600 mb-6" style={{ fontFamily: "Karla" }}>
            Manage your shopping collections
          </p>
          <Link
            to="/login"
            className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transition-all hover:scale-105"
            style={{ fontFamily: "Karla" }}
          >
            Admin Panel →
          </Link>
        </div>
      </div> */}
    </div>
  );
}

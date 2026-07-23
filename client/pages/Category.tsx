import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { defaultSiteData, SiteData, loadSiteData, subscribeToSiteDataUpdates, normalizeSiteData, applySiteTheme } from "@/lib/data";
import { ArrowLeft, ExternalLink } from "lucide-react";

const decorativeShapes = [
  { type: "rectangle", color: "fill-blue-400" },
  { type: "semicircle", color: "fill-purple-400" },
  { type: "arrow", color: "fill-cyan-400" },
];

export default function Category() {
  const { id } = useParams<{ id: string }>();
  const [siteData, setSiteData] = useState(defaultSiteData);

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

  const category = siteData.categories.find((c) => c.id === id);

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-800">Category not found</h1>
          <Link to="/" className="text-blue-600 hover:underline font-semibold">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const getShapeForIndex = (index: number) => {
    return decorativeShapes[index % decorativeShapes.length];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-blue-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-semibold hover:opacity-70 transition-opacity text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
          <h1 
            className="text-3xl md:text-4xl font-bold flex-1 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" 
            style={{ fontFamily: "Cormorant Garamond" }}
          >
            {category.name}
          </h1>
          <div className="w-20" />
        </div>
      </div>

      {/* Hero Image */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="aspect-video overflow-hidden rounded-3xl shadow-2xl mb-14 bg-gradient-to-br from-blue-100 to-purple-100">
          <img
            src={category.imageUrl}
            alt={category.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Section Header */}
        <div className="mb-12">
          <h2 
            className="text-5xl md:text-6xl font-bold mb-4 leading-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" 
            style={{ fontFamily: "Cormorant Garamond" }}
          >
            Collections
          </h2>
          <p 
            className="text-lg text-gray-600 font-light" 
            style={{ fontFamily: "Karla" }}
          >
            {category.description} • curated just for you ✨
          </p>
        </div>

        <hr className="mb-12 border-blue-200" />

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
          {category.items.map((item, itemIndex) => (
            <a
              key={item.id}
              href={item.shopLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="flex flex-col h-full">
                {/* Image Container */}
                <div className="relative mb-6 overflow-hidden rounded-2xl shadow-lg group-hover:shadow-2xl transition-all">
                  <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 relative overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    
                    {/* Decorative Shape Overlay */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                      {getShapeForIndex(itemIndex).type === "rectangle" && (
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          <rect x="15" y="15" width="70" height="70" className={getShapeForIndex(itemIndex).color} />
                        </svg>
                      )}
                      {getShapeForIndex(itemIndex).type === "semicircle" && (
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          <path d="M 10 50 A 40 40 0 0 1 90 50" className={getShapeForIndex(itemIndex).color} />
                        </svg>
                      )}
                      {getShapeForIndex(itemIndex).type === "arrow" && (
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          <path d="M 50 20 L 80 70 L 65 70 L 65 80 L 35 80 L 35 70 L 20 70 Z" className={getShapeForIndex(itemIndex).color} />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div 
                    className="text-sm font-bold uppercase tracking-wider mb-3 text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text" 
                    style={{ fontFamily: "Overpass", letterSpacing: "1.815px" }}
                  >
                    {String(item.number).padStart(2, "0")}
                  </div>
                  <h3 
                    className="text-2xl md:text-3xl font-bold mb-3 leading-tight text-gray-800 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all" 
                    style={{ fontFamily: "Karla" }}
                  >
                    {item.title}
                  </h3>
                  <p 
                    className="text-base text-gray-500 mb-6 font-light" 
                    style={{ fontFamily: "Karla" }}
                  >
                    from {item.source}
                  </p>
                  <div 
                    className="inline-flex items-center gap-3 uppercase tracking-wider font-bold text-sm group-hover:gap-4 transition-all px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg group-hover:shadow-lg" 
                    style={{ fontFamily: "Overpass", letterSpacing: "1.815px" }}
                  >
                    SHOP NOW
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Bottom Decorations */}
        <div className="flex justify-center gap-20 mt-20 mb-12 opacity-10">
          <svg width="100" height="100" viewBox="0 0 100 100" className="fill-blue-600">
            <rect x="15" y="15" width="70" height="70" />
          </svg>
          <svg width="100" height="100" viewBox="0 0 100 100" className="fill-purple-600">
            <path d="M 10 50 A 40 40 0 0 1 90 50" />
          </svg>
          <svg width="100" height="100" viewBox="0 0 100 100" className="fill-cyan-600">
            <circle cx="50" cy="50" r="40" />
          </svg>
        </div>
      </div>
    </div>
  );
}

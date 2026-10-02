"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/data/products";
import ProductCard from "./ui/ProductCard";

const groups = ["All", "Branding & graphics", "Websites & apps", "Stickers & labels", "Signs & printing", "Gifts & merchandise"];
const web = /website|web-app|app-ui|app-prototype|landing-page|online-store|booking|chatbot|dashboard|newsletter|seo/;
function groupFor(p: Product) {
  if (web.test(p.slug)) return "Websites & apps";
  if (p.category === "Stickers & Labels") return "Stickers & labels";
  if (p.category === "Design Services") return "Branding & graphics";
  if (p.category === "Merchandise") return "Gifts & merchandise";
  return "Signs & printing";
}
const recommended = ["custom-logo-design", "label-reorder-pack", "small-business-launch-bundle", "personalized-gift-collection", "flyer-design", "qr-business-sign"];
function price(p: Product) {
  if (p.pricing.mode === "inquiry") return Infinity;
  return p.pricing.basePrice ?? p.pricing.startingPrice ?? Math.min(...(p.packages ?? []).map(x => x.price ?? x.startingPrice ?? Infinity));
}

export default function StoreGrid({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState("All");
  const [query, setQuery] = useState("");
  const [budget, setBudget] = useState("all");
  const [sort, setSort] = useState("recommended");
  const filtered = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return products.filter(p => (selected === "All" || groupFor(p) === selected)
      && words.every(word => `${p.title} ${p.summary} ${p.category} ${groupFor(p)}`.toLowerCase().includes(word))
      && (budget === "all" || price(p) <= Number(budget)))
      .sort((a,b) => {
        if (sort === "name") return a.title.localeCompare(b.title);
        if (sort === "price") return price(a) - price(b) || a.title.localeCompare(b.title);
        const rank = (p: Product) => { const i = recommended.indexOf(p.slug); return i < 0 ? (p.featured ? 50 : 100) : i; };
        return rank(a) - rank(b);
      });
  }, [products, selected, query, budget, sort]);
  function reset() { setQuery(""); setSelected("All"); setBudget("all"); setSort("recommended"); }
  return <>
    <div className="store-tools">
      <label className="store-search">Find what you need<input type="search" placeholder="Try logos, tumblers, websites…" value={query} onChange={e=>setQuery(e.target.value)} /></label>
      <label>Budget<select value={budget} onChange={e=>setBudget(e.target.value)}><option value="all">All prices</option><option value="5000">$50 or less</option><option value="10000">$100 or less</option><option value="25000">$250 or less</option></select></label>
      <label>Sort by<select value={sort} onChange={e=>setSort(e.target.value)}><option value="recommended">Recommended starting points</option><option value="price">Price: low to high</option><option value="name">Name: A–Z</option></select></label>
    </div>
    <div className="portfolio-filters store-categories" role="group" aria-label="Shop by category">{groups.map(group=><button key={group} type="button" className="portfolio-filter" aria-pressed={selected===group} onClick={()=>setSelected(group)}>{group}</button>)}</div>
    <div className="store-result-line"><p role="status" aria-live="polite">{filtered.length} of {products.length} products{budget!=="all" ? " · starting prices shown; shipping extra" : ""}</p>{(query || selected!=="All" || budget!=="all") && <button type="button" onClick={reset}>Clear filters</button>}</div>
    <div className="product-grid">{filtered.length ? filtered.map(p=><ProductCard key={p.id} product={p} />) : <div className="store-empty"><p className="store-empty-heading">No matches yet.</p><p>Try a broader search or clear your filters. Quote-only products do not appear in budget filters.</p><button type="button" onClick={reset}>Show all products</button></div>}</div>
  </>;
}

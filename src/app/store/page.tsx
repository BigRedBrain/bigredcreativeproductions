import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BrandTokens from "@/components/BrandTokens";
import StoreGrid from "@/components/StoreGrid";
import Link from "next/link";
import { getPublishedProducts } from "@/server/queries/catalog";
import { storeIntro } from "@/data/store";

export const metadata: Metadata = {
  title: storeIntro.seo.title,
  description: storeIntro.seo.description,
};

// Time-based fallback only — the real freshness mechanism is
// revalidatePath("/store") called directly from every admin product
// mutation (see src/server/mutate-product.ts). This just guards against a
// missed revalidation call (e.g. a direct DB edit outside the admin UI).
export const revalidate = 3600;

export default async function StorePage() {
  const products = await getPublishedProducts();

  return (
    <BrandTokens>
      <main>
        <Header />
        <section className="section store-shop">
          <div className="store-shop-intro">
            <div><span className="kicker">The Big Red shop</span><h1>Make it yours.</h1><p>Branding, websites, custom print, and personalized gifts. Find the right product for your next idea.</p></div>
            <Link className="store-quote-link" href="/#contact">Need something custom? Request a quote</Link>
          </div>
          <div className="store-order-guide" aria-label="Ordering information">
            <p><strong>Built for your idea</strong>Custom artwork is approved in writing before production.</p>
            <p><strong>Pickup or shipping</strong>Free appointment pickup. Shipping estimates start at $15 or $25, depending on your items.</p>
            <p><strong>Know your price</strong>Fixed prices and starting estimates are labeled. Custom quotes are confirmed before payment.</p>
          </div>
          <StoreGrid products={products} />
          <section className="store-faq" aria-labelledby="store-faq-title">
            <h2 id="store-faq-title">Before you order</h2>
            <details><summary>What is included in the price?</summary><p>Check the product description and selected package for sizes, quantities, and deliverables. “Starting at” prices may change with your requirements. Quote-only products need a confirmed scope before pricing.</p></details>
            <details><summary>How long will my order take?</summary><p>We confirm turnaround after reviewing your artwork, materials, and our current workload. Production starts after required information and written proof approval. Shipping transit time is additional.</p></details>
            <details><summary>How do I send my artwork or customization?</summary><p>Include your request in checkout notes or contact us for a custom quote. We follow up to collect artwork and confirm details. Check your proof carefully and approve it in writing before production.</p></details>
            <details><summary>Can I pick up my order?</summary><p>Yes. Pickup by appointment is free; include your preference in checkout notes. We send instructions when your order is ready. Shipping estimates are subject to change for size, quantity, destination, or packaging and are confirmed before payment. Digital work is delivered electronically for free.</p></details>
            <details><summary>Need help choosing?</summary><p>Tell us what you are making, your budget, quantity, and deadline. <Link href="/#contact">Ask for a recommendation</Link>.</p></details>
          </section>
        </section>
        <Footer />
      </main>
    </BrandTokens>
  );
}

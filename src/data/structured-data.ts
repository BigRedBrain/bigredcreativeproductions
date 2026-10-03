// schema.org JSON-LD builders — pure functions, no database access. Each
// public page passes in data it has already fetched, and JsonLd renders the
// result. Everything here is derived from real, admin-managed content
// (site settings, services, portfolio, products); nothing is invented — no
// address, phone number, rating, review, or result appears unless the
// business has actually entered it.

import type { Service } from "./services";
import type { Project } from "./projects";
import type { Product } from "./products";
import { formatMoneyDecimal } from "./money";

// The subset of site settings structured data needs. Kept local (rather than
// importing the server query module's type) so this file stays a plain,
// dependency-free data module.
export type StructuredDataSettings = {
  siteName: string;
  legalName: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string | null;
  location: string;
  socialLinks: { platform: string; url: string }[];
  metaDescription: string;
  canonicalUrl: string;
  logoHorizontalSrc: string;
};

// What the business actually does, in the plain terms people search for.
// Mirrors the services listed in CLAUDE.md ("The business") — graphic design
// first, since that is the core discipline the rest builds on.
const KNOWS_ABOUT = [
  "Graphic design",
  "Branding",
  "Logo design",
  "Brand identity",
  "Packaging design",
  "Label design",
  "Print production",
  "Promotional products",
  "Event promotion",
  "Website design",
];

type Crumb = { name: string; path: string };

function absoluteUrl(pathOrUrl: string, settings: StructuredDataSettings): string {
  return new URL(pathOrUrl, settings.canonicalUrl).href;
}

function organizationId(settings: StructuredDataSettings): string {
  return absoluteUrl("/#organization", settings);
}

// A lightweight reference to the one Organization node, used by every page's
// entity so search engines tie services, projects and products back to the
// same business without repeating its details.
function organizationRef(settings: StructuredDataSettings) {
  return { "@id": organizationId(settings) };
}

// Homepage: the business itself (an Organization that is also a
// ProfessionalService) plus the WebSite node. Search engines use this to
// classify the site as a graphic design / creative production business.
export function buildOrganizationJsonLd(settings: StructuredDataSettings, services: Service[]) {
  const sameAs = settings.socialLinks.map((link) => link.url).filter(Boolean);
  const organization: Record<string, unknown> = {
    "@type": ["Organization", "ProfessionalService"],
    "@id": organizationId(settings),
    name: settings.siteName,
    legalName: settings.legalName,
    url: absoluteUrl("/", settings),
    logo: absoluteUrl(settings.logoHorizontalSrc, settings),
    image: absoluteUrl(settings.logoHorizontalSrc, settings),
    description: settings.metaDescription,
    slogan: settings.tagline,
    email: settings.contactEmail,
    areaServed: settings.location,
    knowsAbout: KNOWS_ABOUT,
  };
  if (settings.contactPhone) organization.telephone = settings.contactPhone;
  if (sameAs.length > 0) organization.sameAs = sameAs;
  if (services.length > 0) {
    organization.hasOfferCatalog = {
      "@type": "OfferCatalog",
      name: "Creative services",
      itemListElement: services.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.title,
          url: absoluteUrl(`/services/${encodeURIComponent(service.slug)}`, settings),
        },
      })),
    };
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      {
        "@type": "WebSite",
        "@id": absoluteUrl("/#website", settings),
        url: absoluteUrl("/", settings),
        name: settings.siteName,
        publisher: organizationRef(settings),
      },
    ],
  };
}

function buildBreadcrumbNode(crumbs: Crumb[], settings: StructuredDataSettings) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path, settings),
    })),
  };
}

// /services/[slug]: the service offered by the business, plus breadcrumbs
// matching the visible Home / Services trail.
export function buildServiceJsonLd(service: Service, settings: StructuredDataSettings) {
  const path = `/services/${encodeURIComponent(service.slug)}`;
  const node: Record<string, unknown> = {
    "@type": "Service",
    name: service.title,
    serviceType: service.title,
    description: service.summary,
    url: absoluteUrl(path, settings),
    provider: organizationRef(settings),
    areaServed: settings.location,
  };
  if (service.heroImage && service.heroImage.type !== "video") {
    node.image = absoluteUrl(service.heroImage.src, settings);
  }
  return {
    "@context": "https://schema.org",
    "@graph": [
      node,
      buildBreadcrumbNode(
        [
          { name: "Home", path: "/" },
          { name: "Services", path: "/#services" },
          { name: service.title, path },
        ],
        settings,
      ),
    ],
  };
}

// /work/[slug]: a portfolio piece created by the business. client/year are
// only included when real values exist (they are optional by design).
export function buildProjectJsonLd(project: Project, settings: StructuredDataSettings) {
  const path = `/work/${encodeURIComponent(project.slug)}`;
  const node: Record<string, unknown> = {
    "@type": "CreativeWork",
    name: project.title,
    description: project.summary,
    url: absoluteUrl(path, settings),
    genre: project.category,
    keywords: project.services.join(", "),
    creator: organizationRef(settings),
  };
  if (project.year) node.dateCreated = project.year;
  if (project.heroImage && project.heroImage.type !== "video") {
    node.image = absoluteUrl(project.heroImage.src, settings);
  }
  return {
    "@context": "https://schema.org",
    "@graph": [
      node,
      buildBreadcrumbNode(
        [
          { name: "Home", path: "/" },
          { name: "Work", path: "/#work" },
          { name: project.title, path },
        ],
        settings,
      ),
    ],
  };
}

// The Offer part of a product, only when a real price exists. Inquiry-mode
// products (and any product without a price set) get no offer at all —
// never a made-up number.
function buildProductOffer(product: Product, url: string) {
  const { pricing } = product;
  const base = { priceCurrency: "USD", url };
  if ((pricing.mode === "fixed-price" || pricing.mode === "full-payment") && pricing.basePrice !== undefined) {
    return { ...base, "@type": "Offer", price: formatMoneyDecimal(pricing.basePrice), availability: "https://schema.org/InStock" };
  }
  if (pricing.mode === "starting-price" && pricing.startingPrice !== undefined) {
    return { ...base, "@type": "AggregateOffer", lowPrice: formatMoneyDecimal(pricing.startingPrice), offerCount: 1 };
  }
  if (pricing.mode === "deposit") {
    const total = pricing.basePrice ?? pricing.startingPrice;
    if (total !== undefined) {
      return { ...base, "@type": "Offer", price: formatMoneyDecimal(total), availability: "https://schema.org/InStock" };
    }
  }
  return undefined;
}

// /store/[slug]: a product sold by the business, plus breadcrumbs matching
// the visible Home / Store trail.
export function buildProductJsonLd(product: Product, settings: StructuredDataSettings) {
  const path = `/store/${encodeURIComponent(product.slug)}`;
  const url = absoluteUrl(path, settings);
  const images = product.media
    .map((item) => (item.type === "video" ? item.poster : item.src))
    .filter((src): src is string => Boolean(src))
    .map((src) => absoluteUrl(src, settings));
  const node: Record<string, unknown> = {
    "@type": "Product",
    name: product.title,
    description: product.summary,
    url,
    category: product.category,
    brand: { "@type": "Brand", name: settings.siteName },
  };
  if (images.length > 0) node.image = images;
  const offer = buildProductOffer(product, url);
  if (offer) node.offers = { ...offer, seller: organizationRef(settings) };
  return {
    "@context": "https://schema.org",
    "@graph": [
      node,
      buildBreadcrumbNode(
        [
          { name: "Home", path: "/" },
          { name: "Store", path: "/store" },
          { name: product.title, path },
        ],
        settings,
      ),
    ],
  };
}

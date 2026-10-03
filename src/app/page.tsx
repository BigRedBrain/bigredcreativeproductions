import "./home-spacing.css";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Ticker from "@/components/Ticker";
import Manifesto from "@/components/Manifesto";
import Statement from "@/components/Statement";
import Services from "@/components/Services";
import Portfolio from "@/components/Portfolio";
import Studio from "@/components/Studio";
import Process from "@/components/Process";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";
import BrandTokens from "@/components/BrandTokens";
import { isSectionEnabled } from "@/config/sections";
import JsonLd from "@/components/JsonLd";
import { getSiteSettings } from "@/server/queries/site-content";
import { getPublishedServices } from "@/server/queries/services";
import { buildOrganizationJsonLd } from "@/data/structured-data";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const [settings, services] = await Promise.all([getSiteSettings(), getPublishedServices()]);
  return (
    <BrandTokens>
      <JsonLd data={buildOrganizationJsonLd(settings, services)} />
      <main className="home-page">
        {isSectionEnabled("header") && <Header />}
        <div id="main-content" tabIndex={-1} />
        {isSectionEnabled("hero") && <Hero hideVideo />}
        {isSectionEnabled("ticker") && <Ticker />}
        {isSectionEnabled("manifesto") && <Manifesto />}
        {isSectionEnabled("services") && <Services />}
        {isSectionEnabled("statement") && <Statement />}
        {isSectionEnabled("portfolio") && <Portfolio />}
        {isSectionEnabled("studio") && <Studio />}
        {isSectionEnabled("process") && <Process />}
        {isSectionEnabled("contact") && <ContactForm />}
        {isSectionEnabled("footer") && <Footer />}
      </main>
    </BrandTokens>
  );
}

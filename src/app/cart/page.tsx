import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BrandTokens from "@/components/BrandTokens";
import CartView from "@/components/CartView";
import SectionHeading from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Cart | Big Red Creative Productions",
  description: "Review your cart before continuing.",
};

export default function CartPage() {
  return (
    <BrandTokens>
      <main>
        <Header />
        <div id="main-content" tabIndex={-1} />
        <section className="section">
          <SectionHeading wrapperClassName="section-top" kicker="Your cart" heading="Cart" />
          <CartView />
        </section>
        <Footer />
      </main>
    </BrandTokens>
  );
}

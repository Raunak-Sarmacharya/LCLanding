import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import Carousel from './ui/carousel';

interface SlideData {
  title: string;
  button: string;
  src: string;
  link?: string;
  chef_name?: string;
  chefs_image?: string;
}

interface ShopData {
  sid: number;
  slug: string | null;
  sname: string;
  simage: string;
  saddress: string;
  sales_count?: number;
  chef_name?: string;
  chefs_image?: string;
}

interface LocationData {
  id: number;
  name: string;
  address: string;
  featuredKitchenImage: string | null;
  brandImageUrl: string | null;
  logoUrl: string | null;
  kitchenCount: number;
  description: string | null;
}

const SHOP_IMAGE_BASE = 'https://shop.localcook.shop/app/sadmin/images/';
const KITCHEN_PLACEHOLDER = 'https://images.unsplash.com/photo-1556910103-1c02745a872f?q=80&w=3456&auto=format&fit=crop';
const SHOP_PLACEHOLDER = 'https://images.unsplash.com/photo-1414235077428-338988691f17?q=80&w=3456&auto=format&fit=crop';

export default function FeaturedPartnersCarousel() {
  const [shopSlides, setShopSlides] = useState<SlideData[]>([]);
  const [kitchenSlides, setKitchenSlides] = useState<SlideData[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [kitchensLoading, setKitchensLoading] = useState(true);
  const [shopsError, setShopsError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch Locations (Commercial Kitchens)
    async function fetchKitchens() {
      try {
        const res = await fetch('/api/external/locations');
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data: LocationData[] = await res.json();
            const slides: SlideData[] = data.slice(0, 4).map((loc) => ({
              title: loc.name,
              button: 'View Availability',
              src: loc.featuredKitchenImage || loc.brandImageUrl || KITCHEN_PLACEHOLDER,
              link: `https://chef.localcooks.ca/kitchen-preview/${loc.id}`,
              badge_text: loc.name,
              badge_image: loc.logoUrl || undefined,
            }));
            setKitchenSlides(slides);
          }
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setKitchensLoading(false);
      }
    }

    // Fetch Shops
    async function fetchShops() {
      try {
        console.log('[FeaturedPartners] Fetching shops...');
        const res = await fetch('https://shop.localcook.shop/api-featured-shops.php');
        console.log('[FeaturedPartners] Shops response status:', res.status, 'ok:', res.ok);
        console.log('[FeaturedPartners] Shops content-type:', res.headers.get('content-type'));
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            console.log('[FeaturedPartners] Shops data:', data);
            if (Array.isArray(data)) {
              const slides: SlideData[] = data.slice(0, 4).map((shop: ShopData) => ({
                title: shop.sname,
                button: 'Order Now',
                src: shop.simage ? `${SHOP_IMAGE_BASE}${shop.simage}` : SHOP_PLACEHOLDER,
                link: shop.slug ? `https://localcook.shop/shop/${shop.slug}` : `https://localcook.shop`,
                badge_text: shop.chef_name ? `Chef ${shop.chef_name}` : undefined,
                badge_image: shop.chefs_image ? `${SHOP_IMAGE_BASE}${shop.chefs_image}` : undefined,
              }));
              console.log('[FeaturedPartners] Shop slides:', slides);
              setShopSlides(slides);
            } else {
              setShopsError('API did not return an array. Data: ' + JSON.stringify(data).substring(0, 100));
              console.warn('[FeaturedPartners] API did not return an array:', data);
            }
          } else {
            const text = await res.text();
            setShopsError('Response was not JSON. Content-Type: ' + contentType + ' | Body: ' + text.substring(0, 150));
            console.warn('[FeaturedPartners] Shops response was NOT JSON:', contentType, text.substring(0, 200));
          }
        } else {
          setShopsError(`HTTP Error: ${res.status} ${res.statusText}`);
          console.warn('[FeaturedPartners] Shops response not ok:', res.status);
        }
      } catch (error: any) {
        setShopsError(error.message || String(error));
        console.error('Error fetching shops:', error);
      } finally {
        setShopsLoading(false);
      }
    }

    fetchKitchens();
    fetchShops();
  }, []);

  // Loading spinner
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-full min-h-[300px]">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-[var(--color-charcoal)]/50 font-mono text-xs">Loading...</p>
      </div>
    </div>
  );

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: FEATURED SHOPS                                      */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28 overflow-hidden" id="featured-shops">
        {/* Cohesive background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-cream)] via-[var(--color-butter)]/10 to-[var(--color-cream)]" />
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[var(--color-primary)]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[var(--color-gold)]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full font-mono text-xs text-[var(--color-charcoal)] shadow-md border border-[var(--color-primary)]/10 mb-6"
            >
              <span className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-pulse" />
              Live on LocalCooks
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[var(--color-charcoal)] leading-tight mb-4 sm:mb-6"
            >
              Our{' '}
              <span className="font-display text-[var(--color-primary)]">Local Shops</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-body text-sm sm:text-base md:text-lg text-[var(--color-charcoal-light)] max-w-4xl mx-auto px-4 leading-relaxed"
            >
              Discover authentic homemade meals from talented local chefs in St. John's.
            </motion.p>
          </motion.div>
        </div>

        <div className="relative w-full min-h-[550px] sm:min-h-[600px] mb-8 sm:mb-24">
          {!shopsLoading && shopsError ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-red-500 font-body">Error loading shops: {shopsError}</p>
            </div>
          ) : !shopsLoading && shopSlides.length > 0 ? (
            <Carousel slides={shopSlides} />
          ) : shopsLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-[var(--color-charcoal)]/50 font-body">Shops coming soon!</p>
            </div>
          )}
        </div>

        <motion.div
          className="max-w-4xl mx-auto px-4 mt-6 sm:mt-10 flex justify-center relative z-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <a
            href="https://localcook.shop"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-8 py-4 rounded-full font-body font-semibold text-base transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2.5 shadow-lg shadow-[var(--color-primary)]/25"
          >
            Explore All Shops
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: COMMERCIAL KITCHENS                                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28 overflow-hidden" id="commercial-kitchens">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-cream)] via-white/40 to-[var(--color-cream)]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--color-primary)]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--color-gold)]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full font-mono text-xs text-[var(--color-charcoal)] shadow-md border border-[var(--color-primary)]/10 mb-6"
            >
              <span className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-pulse" />
              Kitchen Infrastructure
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[var(--color-charcoal)] leading-tight mb-4 sm:mb-6"
            >
              Commercial{' '}
              <span className="font-display text-[var(--color-primary)]">Kitchen Partners</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-body text-sm sm:text-base md:text-lg text-[var(--color-charcoal-light)] max-w-4xl mx-auto px-4 leading-relaxed"
            >
              Certified commercial kitchen spaces available for booking. Start small, scale as you grow.
            </motion.p>
          </motion.div>
        </div>

        <div className="relative w-full min-h-[550px] sm:min-h-[600px] mb-8 sm:mb-24">
          {!kitchensLoading && kitchenSlides.length > 0 ? (
            <Carousel slides={kitchenSlides} />
          ) : kitchensLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-[var(--color-charcoal)]/50 font-body">Kitchen partners coming soon!</p>
            </div>
          )}
        </div>

        <motion.div
          className="max-w-4xl mx-auto px-4 mt-6 sm:mt-10 flex justify-center relative z-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <a
            href="https://chef.localcooks.ca"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-[var(--color-charcoal)] hover:bg-[var(--color-charcoal-light)] text-white px-8 py-4 rounded-full font-body font-semibold text-base transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2.5 shadow-lg shadow-black/15"
          >
            Browse All Kitchens
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </motion.div>
      </section>
    </>
  );
}

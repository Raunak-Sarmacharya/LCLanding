import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import Carousel, { type SlideData } from './ui/carousel';

interface ShopData {
  sid: number;
  slug: string | null;
  sname: string;
  simage: string;
  saddress: string;
  sales_count?: number;
  chef_name?: string;
  chefs_image?: string;
  sowner?: string;
}

const FEATURED_SHOPS_URL = 'https://shop.localcook.shop/api-featured-shops.php';
/** Homepage carousel should open on these shops, in this order. */
const START_SHOP_SLUGS = ['misitimountain', 'thewafflelady'] as const;

/** Commercial kitchens should open on these, in this order. Matches against name or locationName. */
const START_KITCHEN_NAMES = ['First Point'];

interface KitchenData {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  galleryImages: string[];
  equipment: string[];
  hourlyRate: number | null;
  locationId: number;
  locationName: string;
  locationLogo?: string | null;
  address: string;
  storageSummary: {
    hasDryStorage: boolean;
    hasColdStorage: boolean;
    hasFreezerStorage: boolean;
    totalStorageUnits: number;
  };
}

const SHOP_IMAGE_BASE = 'https://shop.localcook.shop/app/sadmin/images/';
const KITCHEN_PLACEHOLDER = 'https://images.unsplash.com/photo-1556910103-1c02745a872f?q=80&w=3456&auto=format&fit=crop';
const SHOP_PLACEHOLDER = 'https://images.unsplash.com/photo-1414235077428-338988691f17?q=80&w=3456&auto=format&fit=crop';

function shopToSlide(shop: ShopData): SlideData {
  const chefName = shop.chef_name || shop.sowner;
  return {
    title: shop.sname,
    button: 'Order Now',
    src: shop.simage ? `${SHOP_IMAGE_BASE}${shop.simage}` : SHOP_PLACEHOLDER,
    link: shop.slug ? `https://localcook.shop/shop/${shop.slug}` : `https://localcook.shop`,
    subtitle: chefName ? `Chef ${chefName}` : undefined,
    avatar: shop.chefs_image ? `${SHOP_IMAGE_BASE}${shop.chefs_image}` : undefined,
  };
}


function orderShops(shops: ShopData[]): ShopData[] {
  const start = START_SHOP_SLUGS
    .map((slug) => shops.find((shop) => shop.slug === slug))
    .filter((shop): shop is ShopData => shop !== undefined);
  const startSet = new Set<string>(START_SHOP_SLUGS);
  const rest = shops.filter((shop) => !shop.slug || !startSet.has(shop.slug));
  return [...start, ...rest];
}

function orderKitchens(kitchens: KitchenData[]): KitchenData[] {
  const start = START_KITCHEN_NAMES
    .map((name) => kitchens.find((k) => 
      k.name.toLowerCase().includes(name.toLowerCase()) || 
      k.locationName.toLowerCase().includes(name.toLowerCase())
    ))
    .filter((k): k is KitchenData => k !== undefined);
  
  const startSet = new Set(start.map(k => k.id));
  const rest = kitchens.filter((k) => !startSet.has(k.id));
  
  return [...start, ...rest];
}

export function FeaturedShopsCarousel() {
  const [shopSlides, setShopSlides] = useState<SlideData[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [shopsError, setShopsError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch Shops
    async function fetchShops() {
      try {
        console.log('[FeaturedPartners] Fetching shops...');
        const res = await fetch(FEATURED_SHOPS_URL);
        console.log('[FeaturedPartners] Shops response status:', res.status, 'ok:', res.ok);
        console.log('[FeaturedPartners] Shops content-type:', res.headers.get('content-type'));
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            console.log('[FeaturedPartners] Shops data:', data);
            if (Array.isArray(data)) {
              const featured = data.slice(0, 8) as ShopData[];
              const slides: SlideData[] = [
                ...orderShops(featured).map(shopToSlide),
                {
                  variant: 'cta',
                  title: 'Discover more local chefs',
                  button: 'Discover more local chefs',
                  link: 'https://localcook.shop',
                },
              ];
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
      <section className="relative py-12 md:py-16" id="featured-shops">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[var(--color-primary)]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[var(--color-gold)]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mb-6 md:mb-8 text-center">
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

        <div className="relative w-full min-h-[240px] mb-6 sm:mb-8">
          {!shopsLoading && shopsError ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-red-500 font-body">Error loading shops: {shopsError}</p>
            </div>
          ) : !shopsLoading && shopSlides.length > 0 ? (
            <Carousel slides={shopSlides} loop={false} />
          ) : shopsLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-[var(--color-charcoal)]/50 font-body">Shops coming soon!</p>
            </div>
          )}
        </div>

        <motion.div
          className="max-w-4xl mx-auto px-4 mt-4 sm:mt-6 flex justify-center relative z-20"
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
    </>
  );
}

export function CommercialKitchensCarousel() {
  const [kitchenSlides, setKitchenSlides] = useState<SlideData[]>([]);
  const [kitchensLoading, setKitchensLoading] = useState(true);

  useEffect(() => {
    // Fetch Kitchens
    async function fetchKitchens() {
      try {
        const [kitchensRes, locationsRes] = await Promise.all([
          fetch('/api/external/kitchens'),
          fetch('/api/external/locations')
        ]);
        if (kitchensRes.ok && locationsRes.ok) {
          const contentType = kitchensRes.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data: KitchenData[] = await kitchensRes.json();
            const locationsData: LocationData[] = await locationsRes.json();
            const locationMap = new Map(locationsData.map(loc => [loc.id, loc]));

            const orderedKitchens = orderKitchens(data).slice(0, 8);

            const mappedKitchens: SlideData[] = orderedKitchens.map((kitchen) => {
              const loc = locationMap.get(kitchen.locationId);
              let subtitle = kitchen.locationName;
              let priceBadge: string | undefined;
              
              if (kitchen.hourlyRate && kitchen.hourlyRate > 0) {
                const rate = Math.round(kitchen.hourlyRate / 100);
                priceBadge = `$${rate}/hr`;
              }

              const meta: { label: string; value: string }[] = [];
              if (kitchen.storageSummary) {
                const storages = [];
                if (kitchen.storageSummary.hasColdStorage) storages.push("Cold");
                if (kitchen.storageSummary.hasFreezerStorage) storages.push("Freezer");
                if (kitchen.storageSummary.hasDryStorage) storages.push("Dry");
                
                let storageStr = storages.join(", ");
                if (kitchen.storageSummary.totalStorageUnits > storages.length) {
                  const extra = kitchen.storageSummary.totalStorageUnits - storages.length;
                  if (storages.length === 0) {
                    storageStr = `${extra} Units`;
                  } else {
                    storageStr += ` +${extra}`;
                  }
                }
                if (storageStr) {
                  meta.push({ label: "Storage", value: storageStr });
                }
              }
              if (kitchen.equipment && Array.isArray(kitchen.equipment) && kitchen.equipment.length > 0) {
                let eqStr = kitchen.equipment.slice(0, 2).join(", ");
                if (kitchen.equipment.length > 2) {
                  eqStr += ` +${kitchen.equipment.length - 2}`;
                }
                meta.push({ label: "Equipment", value: eqStr });
              }

              return {
                title: kitchen.name,
                button: 'View Details',
                src: kitchen.imageUrl || KITCHEN_PLACEHOLDER,
                link: `https://chef.localcooks.ca/kitchen-preview/${kitchen.locationId}`,
                subtitle,
                address: kitchen.address,
                priceBadge,
                avatar: kitchen.locationLogo || loc?.logoUrl || undefined,
                meta
              };
            });
            
            const slides: SlideData[] = [
              ...mappedKitchens,
              {
                variant: 'cta',
                title: 'Discover more Kitchens',
                button: 'Discover more Kitchens',
                link: 'https://chef.localcooks.ca/compare-kitchens',
              },
            ];

            setKitchenSlides(slides);
          }
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setKitchensLoading(false);
      }
    }

    fetchKitchens();
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
      {/* SECTION 2: COMMERCIAL KITCHENS                                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-12 md:py-16" id="commercial-kitchens">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--color-primary)]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--color-gold)]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mb-6 md:mb-8 text-center">
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

        <div className="relative w-full min-h-[240px] mb-6 sm:mb-8">
          {!kitchensLoading && kitchenSlides.length > 0 ? (
            <Carousel slides={kitchenSlides} loop={false} />
          ) : kitchensLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-[var(--color-charcoal)]/50 font-body">Kitchen partners coming soon!</p>
            </div>
          )}
        </div>

        <motion.div
          className="max-w-4xl mx-auto px-4 mt-4 sm:mt-6 flex justify-center relative z-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <a
            href="https://chef.localcooks.ca/compare-kitchens"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-8 py-4 rounded-full font-body font-semibold text-base transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2.5 shadow-lg shadow-[var(--color-primary)]/25"
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

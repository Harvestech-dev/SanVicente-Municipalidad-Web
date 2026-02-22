"use client";

import { useCMSComponents } from "./useCMSComponents";

/**
 * Hook para obtener datos CMS de una página.
 * Una sola llamada API (useCMSComponents) para todos los componentes.
 */
export function usePageCMS() {
  const {
    components,
    loading,
    error,
    getComponentByType,
    getComponentsByPage,
    cacheStats,
  } = useCMSComponents();

  const heroData = getComponentByType("hero_component");
  const aboutData =
    getComponentByType("about_component") || getComponentByType("about_split");
  const contactData =
    getComponentByType("contact_info") || getComponentByType("contact_split");
  const servicesData = getComponentByType("service_section");
  const faqData = getComponentByType("faq_section");
  const bannerCardData = getComponentByType("banner_card");
  const bannerHeroData = getComponentByType("banner_hero_component");
  const promotionalBannerData = getComponentByType("banner_promocional");

  return {
    heroData,
    aboutData,
    contactData,
    servicesData,
    faqData,
    bannerCardData,
    bannerHeroData,
    promotionalBannerData,
    components,
    loading,
    error,
    cacheStats,
    getComponentByType,
    getComponentsByPage,
    hasHeroData: !!heroData,
    hasAboutData: !!aboutData,
    hasContactData: !!contactData,
    hasServicesData: !!servicesData,
    hasFaqData: !!faqData,
    hasBannerCardData: !!bannerCardData,
    hasBannerHeroData: !!bannerHeroData,
    hasPromotionalBannerData: !!promotionalBannerData,
  };
}

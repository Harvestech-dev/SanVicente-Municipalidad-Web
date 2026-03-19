/**
 * Icono dinámico para redes/contactos.
 * Importa todo Fa (compatibilidad CMS) y usa Fa6 solo para X.
 */

import type { IconType } from "react-icons";
import * as FaIcons from "react-icons/fa";
import { FaShield, FaXTwitter } from "react-icons/fa6";
import { getTipoContacto } from "../lib/contactos-tipos";

interface SocialIconProps {
  value?: string;
  iconName?: string; // Nombre directo (ej: FaMapMarkerAlt) para lista_contactos
  size?: number;
  className?: string;
}

const ICON_ALIASES: Record<string, string> = {
  phone: "FaPhone",
  telefono: "FaPhone",
  tel: "FaPhone",
  "fa-phone": "FaPhone",
  "fa-phone-alt": "FaPhoneAlt",
  "fa-phone-square-alt": "FaPhoneSquareAlt",
  map: "FaMapMarkerAlt",
  location: "FaMapMarkerAlt",
  ubicacion: "FaMapMarkerAlt",
  "fa-map-marker": "FaMapMarkerAlt",
  "fa-map-marker-alt": "FaMapMarkerAlt",
  "fa-location-dot": "FaLocationDot",
  clock: "FaClock",
  horario: "FaClock",
  "fa-clock": "FaClock",
  mail: "FaEnvelope",
  email: "FaEnvelope",
  envelope: "FaEnvelope",
  "fa-envelope": "FaEnvelope",
  facebook: "FaFacebook",
  instagram: "FaInstagram",
  linkedin: "FaLinkedin",
  whatsapp: "FaWhatsapp",
  youtube: "FaYoutube",
  tiktok: "FaTiktok",
  twitter: "FaTwitter",
  x: "FaXTwitter",
  xtwitter: "FaXTwitter",
  "x-twitter": "FaXTwitter",
  faxtwitter: "FaXTwitter",
  "fa-xtwitter": "FaXTwitter",
  shield: "FaShield",
  policia: "FaShield",
  police: "FaShield",
  seguridad: "FaShield",
  discord: "FaDiscord",
  telegram: "FaTelegram",
  reddit: "FaReddit",
  pinterest: "FaPinterest",
  building: "FaBuilding",
  "fa-building": "FaBuilding",
};

function normalizeIconName(raw: string): string {
  const input = String(raw ?? "").trim();
  if (!input) return "FaLink";
  if (input === "FaXTwitter" || input === "FaShield") return input;
  if ((FaIcons as Record<string, IconType>)[input]) return input;

  const cleaned = input
    .replace(/\s+/g, "")
    .replace(/^icon:/i, "")
    .replace(/^fa[srlbd]?\s?/i, "")
    .replace(/^fa-?/i, "fa-")
    .toLowerCase();

  if (ICON_ALIASES[cleaned]) return ICON_ALIASES[cleaned];

  // Heurística final por substring (útil para nombres CMS no estandarizados)
  if (cleaned.includes("phone") || cleaned.includes("tel")) return "FaPhone";
  if (cleaned.includes("map") || cleaned.includes("loca") || cleaned.includes("ubica")) return "FaMapMarkerAlt";
  if (cleaned.includes("clock") || cleaned.includes("hora")) return "FaClock";
  if (cleaned.includes("mail") || cleaned.includes("envelope")) return "FaEnvelope";
  return "FaLink";
}

function getIconComponent(iconName: string): IconType {
  const normalized = normalizeIconName(iconName);
  if (normalized === "FaX" || normalized === "FaXTwitter") return FaXTwitter;
  if (normalized === "FaShield") return FaShield;
  const fromFa = (FaIcons as Record<string, IconType>)[normalized];
  return fromFa ?? FaIcons.FaLink;
}

export function SocialIcon({ value, iconName: iconNameProp, size = 20, className = "" }: SocialIconProps) {
  const tipo = value ? getTipoContacto(value) : undefined;
  const iconName = iconNameProp ?? tipo?.icon ?? "FaLink";
  const IconComponent = getIconComponent(iconName);

  if (!IconComponent || typeof IconComponent !== "function") {
    return null;
  }

  return <IconComponent size={size} className={className} />;
}

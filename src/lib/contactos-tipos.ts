/**
 * Tipos de contacto soportados.
 * Mapea value → icono (react-icons/fa).
 */

export interface TipoContacto {
  value: string;
  label: string;
  icon: string; // Nombre del componente Fa* (ej: FaWhatsapp)
}

export const TIPOS_CONTACTO: TipoContacto[] = [
  { value: "whatsapp", label: "WhatsApp", icon: "FaWhatsapp" },
  { value: "telefono", label: "Teléfono", icon: "FaPhone" },
  { value: "mail", label: "Email", icon: "FaEnvelope" },
  { value: "ubicacion", label: "Ubicación", icon: "FaMapMarkerAlt" },
  { value: "instagram", label: "Instagram", icon: "FaInstagram" },
  { value: "facebook", label: "Facebook", icon: "FaFacebook" },
  { value: "linkedin", label: "LinkedIn", icon: "FaLinkedin" },
  { value: "twitter", label: "Twitter", icon: "FaTwitter" },
  { value: "x", label: "X", icon: "FaX" },
  { value: "youtube", label: "YouTube", icon: "FaYoutube" },
  { value: "tiktok", label: "TikTok", icon: "FaTiktok" },
  { value: "telegram", label: "Telegram", icon: "FaTelegram" },
  { value: "discord", label: "Discord", icon: "FaDiscord" },
  { value: "reddit", label: "Reddit", icon: "FaReddit" },
  { value: "pinterest", label: "Pinterest", icon: "FaPinterest" },
  { value: "horario", label: "Horario", icon: "FaClock" },
  { value: "otro", label: "Otro...", icon: "FaLink" },
];

/** Obtiene el tipo de contacto por value */
export function getTipoContacto(value: string): TipoContacto | undefined {
  return TIPOS_CONTACTO.find((t) => t.value === value);
}

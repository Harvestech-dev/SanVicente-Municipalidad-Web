/**
 * Icono dinámico para redes/contactos.
 * Mapea value (ej: whatsapp, facebook) → icono react-icons/fa.
 */

import * as FaIcons from "react-icons/fa";
import { getTipoContacto } from "../lib/contactos-tipos";

interface SocialIconProps {
  value?: string;
  iconName?: string; // Nombre directo (ej: FaMapMarkerAlt) para lista_contactos
  size?: number;
  className?: string;
}

export function SocialIcon({ value, iconName: iconNameProp, size = 20, className = "" }: SocialIconProps) {
  const tipo = value ? getTipoContacto(value) : undefined;
  const iconName = (iconNameProp ?? tipo?.icon ?? "FaLink") as keyof typeof FaIcons;
  const IconComponent = FaIcons[iconName];

  if (!IconComponent || typeof IconComponent !== "function") {
    return null;
  }

  return <IconComponent size={size} className={className} />;
}

/**
 * Icono dinámico para redes/contactos.
 * Usa fa6 (Font Awesome 6) con fallback a fa (Font Awesome 5).
 */

import * as Fa6Icons from "react-icons/fa6";
import * as FaIcons from "react-icons/fa";
import { getTipoContacto } from "../lib/contactos-tipos";

interface SocialIconProps {
  value?: string;
  iconName?: string; // Nombre directo (ej: FaMapMarkerAlt) para lista_contactos
  size?: number;
  className?: string;
}

function getIconComponent(iconName: string) {
  const name = iconName as keyof typeof Fa6Icons;
  const fromFa6 = Fa6Icons[name];
  if (fromFa6 && typeof fromFa6 === "function") return fromFa6;
  const fromFa = FaIcons[name as keyof typeof FaIcons];
  if (fromFa && typeof fromFa === "function") return fromFa;
  return Fa6Icons.FaLink ?? FaIcons.FaLink;
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

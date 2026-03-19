export interface Contacto {
  icon_contacto?: string;
  txt_label?: string;
  link_destino?: string;
  txt_valor?: string;
}

export interface Dependencia {
  _id?: string;
  txt_titulo?: string;
  _orden?: number;
  _icon?: string;
  lista_contacto?: Contacto[];
  lista_contactos?: Contacto[];
  lista_dependencias?: Dependencia[];
}

export interface Edificio {
  txt_titulo?: string;
  txt_subtitulo?: string;
  _id?: string;
  _orden?: number;
  _boolean_isDefault?: boolean;
  _icon?: string;
  lista_contacto?: Contacto[];
  lista_contactos?: Contacto[];
  lista_dependencias?: Dependencia[];
}

export interface TelefonoItem {
  _orden?: number;
  txt_nombre?: string;
  _icon?: string;
  lista_contacto?: Contacto[];
  lista_contactos?: Contacto[];
}

export interface SearchResultItem {
  titulo: string;
  label: string;
  valor: string;
  link: string;
  icon: string;
}

export function getContactos(obj: {
  lista_contacto?: Contacto[];
  lista_contactos?: Contacto[];
}): Contacto[] {
  return obj.lista_contacto ?? obj.lista_contactos ?? [];
}

export function buildSearchIndex(edificios: Edificio[], telefonos: TelefonoItem[]): SearchResultItem[] {
  const items: SearchResultItem[] = [];
  const addContact = (titulo: string, c: Contacto, icon: string) => {
    items.push({
      titulo,
      label: c.txt_label ?? "",
      valor: c.txt_valor ?? "",
      link: c.link_destino ?? "",
      icon: c.icon_contacto ?? icon,
    });
  };
  (edificios ?? []).forEach((e) => {
    const baseTitulo = e.txt_titulo ?? "";
    getContactos(e).forEach((c) => addContact(baseTitulo, c, e._icon ?? "FaLink"));
    (e.lista_dependencias ?? []).forEach((sec) => {
      const tituloSec = baseTitulo ? `${baseTitulo} › ${sec.txt_titulo ?? ""}` : sec.txt_titulo ?? "";
      getContactos(sec).forEach((c) => addContact(tituloSec, c, sec._icon ?? "FaLink"));
      (sec.lista_dependencias ?? []).forEach((sub) => {
        const tituloSub = tituloSec ? `${tituloSec} › ${sub.txt_titulo ?? ""}` : sub.txt_titulo ?? "";
        getContactos(sub).forEach((c) => addContact(tituloSub, c, sub._icon ?? "FaLink"));
      });
    });
  });
  (telefonos ?? []).forEach((tel) => {
    const titulo = tel.txt_nombre ?? "";
    getContactos(tel).forEach((c) => addContact(titulo, c, tel._icon ?? "FaPhone"));
  });
  return items;
}

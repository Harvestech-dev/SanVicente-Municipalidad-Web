/**
 * Genera un slug estable para un programa (para URL /programas/[id]).
 * Usa _id si existe (CMS), si no: slug del título + _orden para unicidad.
 */
export function slugify(text: string): string {
  return (text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getProgramSlug(
  prog: { _id?: string; txt_titulo?: string; _orden?: number },
  index: number
): string {
  if (prog._id && String(prog._id).trim() !== "") return String(prog._id).trim();
  const base = slugify(prog.txt_titulo ?? "programa");
  const orden = prog._orden ?? index + 1;
  return base ? `${base}-${orden}` : `programa-${orden}`;
}

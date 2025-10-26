// src/lib/rm.ts
import { RMListResponse, RMCharacter } from "@/types/rickandmorty";

const BASE = "https://rickandmortyapi.com/api";

export async function fetchCharactersPage(
  page: number,
  init?: RequestInit
): Promise<RMListResponse> {
  const res = await fetch(`${BASE}/character?page=${page}`, init);
  if (!res.ok) throw new Error("Error al cargar personajes");
  return res.json();
}

export async function fetchAllCharacters(
  init?: RequestInit
): Promise<RMCharacter[]> {
  // 1) Obtener info para saber cuántas páginas hay
  const first = await fetchCharactersPage(1, init);
  const totalPages = first.info.pages;

  // 2) Traer todas las páginas en paralelo (cuidado: muchas peticiones)
  const promises: Promise<RMListResponse>[] = [];
  for (let p = 2; p <= totalPages; p++) {
    promises.push(fetchCharactersPage(p, init));
  }
  const rest = await Promise.all(promises);

  // 3) Aplanar results
  const all: RMCharacter[] = [
    ...first.results,
    ...rest.flatMap((r) => r.results),
  ];

  return all;
}

export async function fetchCharacterById(
  id: string | number,
  init?: RequestInit
): Promise<RMCharacter> {
  const res = await fetch(`${BASE}/character/${id}`, init);
  if (res.status === 404) {
    throw new Error("NOT_FOUND");
  }
  if (!res.ok) throw new Error("Error al cargar el personaje");
  return res.json();
}

export async function fetchCharactersByName(
  name: string,
  init?: RequestInit
): Promise<RMListResponse> {
  const res = await fetch(`${BASE}/character/?name=${encodeURIComponent(name)}`, init);
  if (res.status === 404) {
    // API responde 404 si no encuentra; devolvemos results vacíos
    return { info: { count: 0, pages: 0, next: null, prev: null }, results: [] };
  }
  if (!res.ok) throw new Error("Error al buscar por nombre");
  return res.json();
}

export function uniqueNames(chars: RMCharacter[]): string[] {
  const set = new Set<string>();
  for (const c of chars) {
    if (!set.has(c.name)) set.add(c.name);
  }
  return Array.from(set);
}

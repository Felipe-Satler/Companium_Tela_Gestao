import { createServerFn } from "@tanstack/react-start";

/** Converte links comuns do Google Sheets / OneDrive em link de export .xlsx. */
export function normalizarLinkPlanilha(raw: string): string {
  const url = raw.trim();

  // Link "Publicar na web" (/spreadsheets/d/e/2PACX.../pub...):
  // já é um endpoint público, só garantimos output=xlsx.
  const publicado = url.match(/docs\.google\.com\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
  if (publicado) {
    const base = `https://docs.google.com/spreadsheets/d/e/${publicado[1]}/pub`;
    const gid = url.match(/[#&?]gid=([0-9]+)/)?.[1];
    return `${base}?output=xlsx${gid ? `&gid=${gid}&single=true` : ""}`;
  }

  const google = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (google) {
    const id = google[1];
    const gid = url.match(/[#&?]gid=([0-9]+)/)?.[1];
    return `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx${gid ? `&gid=${gid}` : ""}`;
  }
  return url;
}

/**
 * Baixa a planilha publicada na web pelo servidor (evita CORS) e devolve
 * o arquivo em base64 para ser lido pelo parser no cliente.
 */
export const baixarPlanilhaRemota = createServerFn({ method: "POST" })
  .inputValidator((data: { url: string }) => {
    const url = normalizarLinkPlanilha(String(data?.url ?? ""));
    if (!/^https?:\/\//i.test(url)) throw new Error("Informe um link http(s) válido.");
    return { url };
  })
  .handler(async ({ data }) => {
    const res = await fetch(data.url, { redirect: "follow" });
    if (!res.ok) {
      throw new Error(
        `Não foi possível baixar a planilha (HTTP ${res.status}). Verifique se o link está publicado/compartilhado publicamente.`
      );
    }
    const buffer = new Uint8Array(await res.arrayBuffer());
    if (buffer.length === 0) throw new Error("O link retornou um arquivo vazio.");
    // HTML = página de login/permissão em vez do arquivo
    const head = new TextDecoder().decode(buffer.slice(0, 200)).trim().toLowerCase();
    if (head.startsWith("<!doctype html") || head.startsWith("<html")) {
      throw new Error(
        "O link retornou uma página HTML em vez da planilha. Publique a planilha na web ou use um link de export .xlsx."
      );
    }
    let binary = "";
    for (let i = 0; i < buffer.length; i += 8192) {
      binary += String.fromCharCode(...buffer.subarray(i, i + 8192));
    }
    return { base64: btoa(binary), url: data.url, baixadoEm: new Date().toISOString() };
  });

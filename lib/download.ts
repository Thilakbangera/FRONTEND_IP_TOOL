export async function responseToDownload(res: Response, defaultName: string) {
  const contentType = res.headers.get("content-type") || "";
  // If backend returns JSON with url
  if (contentType.includes("application/json")) {
    const j = await res.json();
    if (j?.url) return { kind: "url" as const, url: j.url as string, filename: j.filename || defaultName };
    throw new Error("JSON response did not include a download url.");
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  // Try infer filename from Content-Disposition
  const cd = res.headers.get("content-disposition") || "";
  const m = /filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(cd);
  const filename = decodeURIComponent(m?.[1] || m?.[2] || defaultName);

  return { kind: "blob" as const, url, filename };
}

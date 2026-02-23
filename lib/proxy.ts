import { NextRequest, NextResponse } from "next/server";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

function filterHeaders(headers: Headers): Headers {
  const out = new Headers();
  headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      out.set(key, value);
    }
  });
  return out;
}

function buildTargetUrl(baseUrl: string, path: string[], search: string): URL {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const target = new URL(path.map((segment) => encodeURIComponent(segment)).join("/"), normalizedBase);
  target.search = search;
  return target;
}

async function resolvePathParams(context: unknown): Promise<string[]> {
  const maybeParams = (context as { params?: unknown } | undefined)?.params;
  const params =
    maybeParams && typeof maybeParams === "object" && "then" in (maybeParams as Record<string, unknown>)
      ? await (maybeParams as Promise<unknown>)
      : maybeParams;

  const path = (params as { path?: unknown } | undefined)?.path;
  return Array.isArray(path) ? path.filter((x): x is string => typeof x === "string") : [];
}

export async function proxyRequest(
  request: NextRequest,
  context: unknown,
  backendBaseUrl: string
): Promise<NextResponse> {
  try {
    const path = await resolvePathParams(context);
    if (!path.length) {
      return NextResponse.json({ error: "Missing proxy path." }, { status: 400 });
    }

    const requestUrl = new URL(request.url);
    const targetUrl = buildTargetUrl(backendBaseUrl, path, requestUrl.search);
    const method = request.method.toUpperCase();

    const headers = filterHeaders(request.headers);
    const body = method === "GET" || method === "HEAD" ? undefined : await request.blob();

    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body,
      redirect: "manual",
    });

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: filterHeaders(upstream.headers),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Proxy request failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

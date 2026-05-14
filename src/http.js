import { JSON_HEADERS, SECURITY_HEADERS } from "./constants.js";

export function withHeaders(response, headers) {
  const cloned = new Response(response.body, response);
  for (const [key, value] of Object.entries(headers)) {
    cloned.headers.set(key, value);
  }
  return cloned;
}

export function withSecurityHeaders(response) {
  const secured = new Response(response.body, response);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    secured.headers.set(key, value);
  }
  return secured;
}

export function assetRequest(request, assetPath) {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = assetPath;
  assetUrl.search = "";
  return new Request(assetUrl.toString(), request);
}

export function shareStatusPage(status, title, description) {
  const safeStatus = Number.isInteger(status) && status >= 400 && status <= 599 ? status : 404;

  return new Response("", {
    status: safeStatus,
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": "no-store"
    }
  });
}

export function jsonWithCookies(payload, cookies = [], init = {}) {
  const headers = new Headers(JSON_HEADERS);
  if (init.headers) {
    const extraHeaders = new Headers(init.headers);
    extraHeaders.forEach((value, key) => {
      if (key.toLowerCase() !== "set-cookie") {
        headers.set(key, value);
      }
    });
  }

  for (const cookie of cookies) {
    if (cookie) {
      headers.append("Set-Cookie", cookie);
    }
  }

  return new Response(JSON.stringify(payload), {
    ...init,
    headers
  });
}

export function json(payload, init = {}) {
  const headers = new Headers(JSON_HEADERS);
  if (init.headers) {
    const extraHeaders = new Headers(init.headers);
    extraHeaders.forEach((value, key) => headers.set(key, value));
  }

  return new Response(JSON.stringify(payload), {
    ...init,
    headers
  });
}

export function html(content, init = {}) {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "text/html; charset=UTF-8");
  }
  if (!headers.has("Cache-Control")) {
    headers.set("Cache-Control", "no-store");
  }

  return new Response(content, {
    ...init,
    headers
  });
}

export function notFound(message) {
  return json(
    {
      ok: false,
      error: "not_found",
      message
    },
    { status: 404 }
  );
}

export function methodNotAllowed(methods) {
  return json(
    {
      ok: false,
      error: "method_not_allowed",
      message: "请求方法不被允许。"
    },
    {
      status: 405,
      headers: {
        Allow: methods.join(", ")
      }
    }
  );
}

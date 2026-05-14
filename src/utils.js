import {
  LOGIN_PATH,
  LOGIN_ASSET_PATH,
  LOGIN_API_PREFIX,
  LOGIN_STATIC_PATHS,
  LINK_HISTORY_PATH,
  LINK_HISTORY_ASSET_PATH,
  LINK_HISTORY_API_PREFIX,
  LINK_HISTORY_STATIC_PATHS,
  SUPER_LOGIN_PATH,
  SUPER_LOGIN_API_PREFIX,
  SUPER_ADMIN_ACCESS_EMAIL,
  ADMIN_ACCESS_APP_ID,
  ADMIN_ACCESS_POLICY_ID,
  ADMIN_ACCESS_AUD,
  CLOUDFLARE_ACCOUNT_ID,
  DEFAULT_ADMIN_EMAIL_REPLACEMENTS,
  ADMIN_CONFIG_TEMPLATE_BLANK,
  SHARE_PREFIX,
  SHARE_INDEX_PATH,
  SHARE_DATA_PATH,
  SHARE_SHELL_ASSET_PATH,
  SHARE_STATIC_PATHS,
  SHARE_ROOT_DOMAIN,
  DEFAULT_SHARE_SUBDOMAIN,
  SHARE_SUBDOMAIN_PATTERN,
  ROOT_SHARE_PATH,
  ROOT_SHARE_INDEX_PATH,
  ROOT_SHARE_DATA_PATH,
  ROOT_SHARE_ASSET_MAP,
  LOGIN_UPLOADS_PATH,
  LOGIN_COMPLETION_UPLOADS_PATH,
  PUBLIC_UPLOAD_PREFIX,
  PUBLIC_COMPLETION_UPLOAD_PREFIX,
  ATTACHMENT_PUBLIC_BASE_URL,
  COMPLETION_ATTACHMENT_PUBLIC_BASE_URL,
  ATTACHMENT_OBJECT_PREFIX,
  ATTACHMENT_PREVIEW_OBJECT_PREFIX,
  COMPLETION_ATTACHMENT_OBJECT_PREFIX,
  COMPLETION_ATTACHMENT_PREVIEW_OBJECT_PREFIX,
  MAX_ATTACHMENT_UPLOAD_BYTES,
  MAX_ATTACHMENT_PREVIEW_BYTES,
  MAX_ATTACHMENT_UPLOAD_COUNT,
  PUBLIC_ATTACHMENT_CACHE_CONTROL,
  ADMIN_PAGE_CACHE_CONTROL,
  ADMIN_STATIC_CACHE_CONTROL,
  SHARE_STATIC_CACHE_CONTROL,
  LOGIN_PRELOAD_LINK_HEADER,
  LINK_HISTORY_PRELOAD_LINK_HEADER,
  SHARE_PRELOAD_LINK_HEADER,
  ROOT_SHARE_PRELOAD_LINK_HEADER,
  MIME_TYPE_EXTENSION_MAP,
  COOKIE_NAME,
  SUPER_COOKIE_NAME,
  ACCESS_JWKS_CACHE_TTL_MS,
  ACCESS_JWT_CLOCK_TOLERANCE_SECONDS,
  SHARE_KEY_PREFIX,
  TRASH_KEY_PREFIX,
  ARCHIVE_KEY_PREFIX,
  ADMIN_KEY_PREFIX,
  ADMIN_DELETED_KEY_PREFIX,
  ADMIN_TEMPLATE_KEY_PREFIX,
  ADMIN_LINK_STATS_KEY_PREFIX,
  ADMIN_LINK_LIMIT_KEY_PREFIX,
  ADMIN_LOGIN_KEY_PREFIX,
  SESSION_KEY_PREFIX,
  SUPER_SESSION_KEY_PREFIX,
  RECYCLE_RETENTION_MS,
  MIN_EXPIRY_BUFFER_MS,
  BEIJING_OFFSET_MS,
  D1_SYNC_INTERVAL_MS,
  R2_FREE_STORAGE_BYTES,
  R2_FREE_CLASS_A_OPERATIONS_MONTHLY,
  R2_FREE_CLASS_B_OPERATIONS_MONTHLY,
  D1_FREE_STORAGE_BYTES,
  D1_FREE_ROW_READS_DAILY,
  D1_FREE_ROW_WRITES_DAILY,
  OPTIONAL_VISIBLE_FIELD_KEYS,
  D1_SCHEMA_STATEMENTS,
  JSON_HEADERS,
  CONTENT_SECURITY_POLICY,
  SECURITY_HEADERS,
  IMAGE_SIGNATURE_BYTES
} from "./constants.js";

export function normalizeAdminUsername(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function randomHex(byteLength) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  let result = "";
  for (const byte of bytes) {
    result += byte.toString(16).padStart(2, "0");
  }
  return result;
}

export function clearSessionCookie(path = "/") {
  return `${COOKIE_NAME}=; Max-Age=0; Path=${path}; HttpOnly; Secure; SameSite=Lax`;
}

export function clearSuperSessionCookie() {
  return `${SUPER_COOKIE_NAME}=; Max-Age=0; Path=${SUPER_LOGIN_PATH}; HttpOnly; Secure; SameSite=Lax`;
}

export function getCookie(cookieHeader, name) {
  if (!cookieHeader) {
    return null;
  }

  const prefix = `${name}=`;
  let value = null;
  for (const entry of cookieHeader.split(";")) {
    const trimmed = entry.trim();
    if (trimmed.startsWith(prefix)) {
      value = trimmed.slice(prefix.length);
    }
  }

  return value;
}

export function safeEquals(left, right) {
  if (typeof left !== "string" || typeof right !== "string") {
    return false;
  }

  const length = Math.max(left.length, right.length);
  let mismatch = left.length === right.length ? 0 : 1;
  for (let index = 0; index < length; index += 1) {
    const leftCode = left.charCodeAt(index) || 0;
    const rightCode = right.charCodeAt(index) || 0;
    mismatch |= leftCode ^ rightCode;
  }

  return mismatch === 0;
}

export function parseBeijingDateTime(value) {
  if (typeof value !== "string") {
    return null;
  }

  const match =
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] || 0);
  const utcMillis = Date.UTC(year, month - 1, day, hour - 8, minute, second);
  return Number.isFinite(utcMillis) ? utcMillis : null;
}

export function formatBeijingDateTime(timestamp) {
  if (!timestamp) {
    return "";
  }

  const date = new Date(timestamp + BEIJING_OFFSET_MS);
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate())
  ].join("-") +
    " " +
    [pad(date.getUTCHours()), pad(date.getUTCMinutes())].join(":");
}

export function pad(value) {
  return String(value).padStart(2, "0");
}

export function isValidShareId(value) {
  return typeof value === "string" && /^[0-9a-f]{32}$/i.test(value);
}

export function shareKey(shareId) {
  return `${SHARE_KEY_PREFIX}${shareId}`;
}

export function trashKey(shareId) {
  return `${TRASH_KEY_PREFIX}${shareId}`;
}

export function archiveKey(shareId) {
  return `${ARCHIVE_KEY_PREFIX}${shareId}`;
}

export function sessionKey(sessionId) {
  return `${SESSION_KEY_PREFIX}${sessionId}`;
}

export function superSessionKey(sessionId) {
  return `${SUPER_SESSION_KEY_PREFIX}${sessionId}`;
}

export function adminKey(username) {
  return `${ADMIN_KEY_PREFIX}${normalizeAdminUsername(username).toLowerCase()}`;
}

export function adminDeletedKey(username) {
  return `${ADMIN_DELETED_KEY_PREFIX}${normalizeAdminUsername(username).toLowerCase()}`;
}

export function adminTemplateKey(username) {
  return `${ADMIN_TEMPLATE_KEY_PREFIX}${normalizeAdminUsername(username).toLowerCase()}`;
}

export function adminLinkStatsKey(username) {
  return `${ADMIN_LINK_STATS_KEY_PREFIX}${normalizeAdminUsername(username).toLowerCase()}`;
}

export function adminLinkLimitKey(username) {
  return `${ADMIN_LINK_LIMIT_KEY_PREFIX}${normalizeAdminUsername(username).toLowerCase()}`;
}

export function adminLoginKey(username) {
  return `${ADMIN_LOGIN_KEY_PREFIX}${normalizeAdminUsername(username).toLowerCase()}`;
}
export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

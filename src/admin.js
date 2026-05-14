import { DEFAULT_CONFIG, EMPTY_CONFIG } from "./default-config.js";
import {
  handleAttachmentUpload,
  handleCompletionAttachmentUpload,
  handlePublicUploadRequest,
  buildAttachmentUrl,
  buildObjectUrl,
  sanitizeMetadataValue
} from "./attachments.js";
import {
  normalizeConfig,
  normalizeVisibleFields,
  normalizeDestination,
  normalizeCompletionApprovalStep,
  normalizeAttachmentUrls,
  normalizeAttachmentUrl,
  normalizeLocationUrl,
  normalizeExternalUrl,
  decodeMapAddressInLocationUrl,
  deepMerge
} from "./config-utils.js";
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
import {
  withHeaders,
  withSecurityHeaders,
  assetRequest,
  shareStatusPage,
  jsonWithCookies,
  json,
  html,
  notFound,
  methodNotAllowed
} from "./http.js";
import {
  normalizeAdminUsername,
  randomHex,
  clearSessionCookie,
  clearSuperSessionCookie,
  getCookie,
  safeEquals,
  parseBeijingDateTime,
  formatBeijingDateTime,
  pad,
  isValidShareId,
  shareKey,
  trashKey,
  archiveKey,
  sessionKey,
  superSessionKey,
  adminKey,
  adminDeletedKey,
  adminTemplateKey,
  adminLinkStatsKey,
  adminLinkLimitKey,
  adminLoginKey,
  readJson,
  escapeHtml,
  clone
} from "./utils.js";

let d1SchemaReadyPromise = null;
let d1KvSyncPromise = null;
let d1KvSyncedAt = 0;
let accessJwksCache = null;
let adminEmailReplacements = DEFAULT_ADMIN_EMAIL_REPLACEMENTS;
const adminRuntimeDeps = {};

export function configureAdminRuntimeDeps(deps = {}) {
  Object.assign(adminRuntimeDeps, deps);
}

function getAdminRuntimeDep(name) {
  const dependency = adminRuntimeDeps[name];
  if (typeof dependency !== "function") {
    throw new Error(`Missing admin runtime dependency: ${name}`);
  }
  return dependency;
}

function getShareRecord(...args) {
  return getAdminRuntimeDep("getShareRecord")(...args);
}

function getTrashRecord(...args) {
  return getAdminRuntimeDep("getTrashRecord")(...args);
}

function readTrashRecord(...args) {
  return getAdminRuntimeDep("readTrashRecord")(...args);
}

function getArchiveRecord(...args) {
  return getAdminRuntimeDep("getArchiveRecord")(...args);
}

function getRecordOwner(...args) {
  return getAdminRuntimeDep("getRecordOwner")(...args);
}

function recordBelongsToUser(...args) {
  return getAdminRuntimeDep("recordBelongsToUser")(...args);
}

function getRecordAttachmentUrls(...args) {
  return getAdminRuntimeDep("getRecordAttachmentUrls")(...args);
}

function getAttachmentStorageKeyFromUrl(...args) {
  return getAdminRuntimeDep("getAttachmentStorageKeyFromUrl")(...args);
}

function findAttachmentReferencesOutsideRecords(...args) {
  return getAdminRuntimeDep("findAttachmentReferencesOutsideRecords")(...args);
}

function buildShareUrl(...args) {
  return getAdminRuntimeDep("buildShareUrl")(...args);
}

function getTrashArchiveAt(...args) {
  return getAdminRuntimeDep("getTrashArchiveAt")(...args);
}

function getArchiveReasonText(...args) {
  return getAdminRuntimeDep("getArchiveReasonText")(...args);
}

export async function handleLoginAuth(request, env) {
  const accessSession = await getCloudflareAccessAdminSession(request, env);
  if (!accessSession) {
    return accessUnauthorized();
  }

  const accessNow = Date.now();
  await recordAdminLogin(env, accessSession.username, accessNow, getRequestAccessInfo(request));
  return jsonWithCookies(
    {
      ok: true,
      username: accessSession.username
    },
    [clearSessionCookie(), clearSessionCookie("/login")]
  );
}

export async function handleLogout(request, env) {
  const sessionToken = getCookie(request.headers.get("Cookie"), COOKIE_NAME);
  if (sessionToken) {
    await env.LEAVE_STATUS_DATA.delete(sessionKey(sessionToken));
  }

  return jsonWithCookies({ ok: true }, [clearSessionCookie(), clearSessionCookie("/login")]);
}

export async function handleSuperLoginAuth(request, env) {
  const session = await getSuperSession(request, env);
  if (!session) {
    return accessUnauthorized();
  }

  return json(
    {
      ok: true,
      username: session.username
    },
    {
      headers: {
        "Set-Cookie": clearSuperSessionCookie()
      }
    }
  );
}

export async function handleSuperLogout(request, env) {
  const sessionToken = getCookie(request.headers.get("Cookie"), SUPER_COOKIE_NAME);
  if (sessionToken) {
    await env.LEAVE_STATUS_DATA.delete(superSessionKey(sessionToken));
  }

  return json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": clearSuperSessionCookie()
      }
    }
  );
}

export async function getSuperSession(request, env) {
  return getCloudflareAccessSuperSession(request, env);
}

export async function requireSuperSession(request, env) {
  const session = await getSuperSession(request, env);
  if (!session) {
    return accessUnauthorized();
  }

  return session;
}

async function getCloudflareAccessSuperSession(request, env) {
  const expectedEmail = normalizeAccessEmail(env.SUPER_ADMIN_EMAIL || SUPER_ADMIN_ACCESS_EMAIL);
  if (!expectedEmail) {
    return null;
  }

  const payload = await verifyCloudflareAccessJwt(request, env);
  const tokenEmail = normalizeAccessEmail(payload?.email);
  if (!tokenEmail || !safeEquals(tokenEmail, expectedEmail)) {
    return null;
  }

  const headerEmail = normalizeAccessEmail(request.headers.get("cf-access-authenticated-user-email"));
  if (headerEmail && !safeEquals(headerEmail, expectedEmail)) {
    return null;
  }

  return {
    username: expectedEmail,
    email: expectedEmail,
    createdAt: Number(payload.iat) > 0 ? Number(payload.iat) * 1000 : Date.now(),
    accessAuthenticated: true
  };
}

async function getCloudflareAccessAdminSession(request, env) {
  const payload = await verifyCloudflareAccessJwt(
    request,
    env,
    env.CF_ACCESS_ADMIN_AUD || ADMIN_ACCESS_AUD
  );
  const tokenEmail = normalizeAccessEmail(payload?.email);
  if (!isValidAdminEmail(tokenEmail)) {
    return null;
  }

  const headerEmail = normalizeAccessEmail(request.headers.get("cf-access-authenticated-user-email"));
  if (headerEmail && !safeEquals(headerEmail, tokenEmail)) {
    return null;
  }

  const adminRecord = await getAdminAccountForAccessEmail(env, tokenEmail);
  if (!adminRecord) {
    return null;
  }

  return {
    username: adminRecord.username,
    email: tokenEmail,
    createdAt: Number(payload.iat) > 0 ? Number(payload.iat) * 1000 : Date.now(),
    accessAuthenticated: true
  };
}

async function verifyCloudflareAccessJwt(request, env, expectedAudience = "") {
  const teamDomain = normalizeAccessTeamDomain(env.CF_ACCESS_TEAM_DOMAIN);
  const audience = typeof expectedAudience === "string" && expectedAudience.trim()
    ? expectedAudience.trim()
    : typeof env.CF_ACCESS_AUD === "string"
      ? env.CF_ACCESS_AUD.trim()
      : "";
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!teamDomain || !audience || !token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  let header;
  let payload;
  try {
    header = parseJwtPart(parts[0]);
    payload = parseJwtPart(parts[1]);
  } catch (error) {
    console.error("Failed to parse Cloudflare Access JWT:", error);
    return null;
  }

  if (header?.alg !== "RS256" || !header.kid) {
    return null;
  }

  if (!accessJwtClaimsAreValid(payload, teamDomain, audience)) {
    return null;
  }

  const jwk = await getCloudflareAccessJwk(teamDomain, String(header.kid));
  if (!jwk) {
    return null;
  }

  try {
    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      base64UrlToBytes(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    );
    return valid ? payload : null;
  } catch (error) {
    console.error("Failed to verify Cloudflare Access JWT:", error);
    return null;
  }
}

function accessJwtClaimsAreValid(payload, teamDomain, audience) {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const issuer = typeof payload.iss === "string" ? payload.iss.replace(/\/+$/, "") : "";
  if (!safeEquals(issuer, teamDomain)) {
    return false;
  }

  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiences.some((item) => safeEquals(String(item || ""), audience))) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = Number(payload.exp);
  if (!Number.isFinite(exp) || exp <= now - ACCESS_JWT_CLOCK_TOLERANCE_SECONDS) {
    return false;
  }

  const nbf = Number(payload.nbf);
  if (Number.isFinite(nbf) && nbf > now + ACCESS_JWT_CLOCK_TOLERANCE_SECONDS) {
    return false;
  }

  const iat = Number(payload.iat);
  if (Number.isFinite(iat) && iat > now + ACCESS_JWT_CLOCK_TOLERANCE_SECONDS) {
    return false;
  }

  return true;
}

async function getCloudflareAccessJwk(teamDomain, kid) {
  const cached = accessJwksCache;
  if (
    cached &&
    cached.teamDomain === teamDomain &&
    cached.expiresAt > Date.now() &&
    Array.isArray(cached.keys)
  ) {
    return cached.keys.find((key) => safeEquals(String(key.kid || ""), kid)) || null;
  }

  const response = await fetch(`${teamDomain}/cdn-cgi/access/certs`, {
    cf: { cacheTtl: 300, cacheEverything: true }
  });
  if (!response.ok) {
    return null;
  }

  const payload = await response.json().catch(() => null);
  const keys = Array.isArray(payload?.keys) ? payload.keys : [];
  accessJwksCache = {
    teamDomain,
    keys,
    expiresAt: Date.now() + ACCESS_JWKS_CACHE_TTL_MS
  };
  return keys.find((key) => safeEquals(String(key.kid || ""), kid)) || null;
}

function parseJwtPart(value) {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(value)));
}

function base64UrlToBytes(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function normalizeAccessTeamDomain(value) {
  const trimmed = typeof value === "string" ? value.trim().replace(/\/+$/, "") : "";
  if (!trimmed) {
    return "";
  }
  const withProtocol = /^https:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    return `https://${url.hostname.toLowerCase()}`;
  } catch {
    return "";
  }
}

export function normalizeAccessEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function configureRuntimeEnv(env) {
  adminEmailReplacements = parseAdminEmailReplacements(env?.ADMIN_EMAIL_REPLACEMENTS_JSON);
}

function parseAdminEmailReplacements(value) {
  if (typeof value !== "string" || !value.trim()) {
    return DEFAULT_ADMIN_EMAIL_REPLACEMENTS;
  }

  try {
    const parsed = JSON.parse(value);
    const entries = Array.isArray(parsed) ? parsed : Object.entries(parsed || {});
    const replacements = new Map();
    for (const entry of entries) {
      const legacyUsername = Array.isArray(entry) ? entry[0] : entry?.username;
      const emailValue = Array.isArray(entry) ? entry[1] : entry?.email;
      const username = normalizeAdminUsername(legacyUsername).toLowerCase();
      const email = normalizeAccessEmail(emailValue);
      if (username && isValidAdminEmail(email)) {
        replacements.set(username, email);
      }
    }
    return replacements;
  } catch (error) {
    console.error("Failed to parse admin email replacements:", error);
    return DEFAULT_ADMIN_EMAIL_REPLACEMENTS;
  }
}

function getAdminEmailReplacements() {
  return adminEmailReplacements;
}

export function getCanonicalAdminUsername(value) {
  const normalized = normalizeAdminUsername(value).toLowerCase();
  return getAdminEmailReplacements().get(normalized) || normalized;
}

function getAdminPrincipalNames(value) {
  const canonical = getCanonicalAdminUsername(value);
  const names = new Set();
  if (canonical) {
    names.add(canonical);
  }
  const normalized = normalizeAdminUsername(value).toLowerCase();
  if (normalized) {
    names.add(normalized);
  }
  for (const [legacyUsername, email] of getAdminEmailReplacements()) {
    if (safeEquals(email, canonical)) {
      names.add(legacyUsername);
    }
  }
  return Array.from(names);
}

function getAdminRecordEmail(record, fallback = "") {
  const explicitEmail = normalizeAccessEmail(record?.email);
  if (isValidAdminEmail(explicitEmail)) {
    return explicitEmail;
  }

  const fallbackEmail = normalizeAccessEmail(fallback || record?.username || "");
  return isValidAdminEmail(fallbackEmail) ? fallbackEmail : "";
}

function adminUsernameEquals(left, right) {
  const leftUsername = normalizeAdminUsername(left).toLowerCase();
  const rightUsername = normalizeAdminUsername(right).toLowerCase();
  return Boolean(leftUsername && rightUsername && safeEquals(leftUsername, rightUsername));
}

function adminRecordMatchesUsername(record, username) {
  return adminUsernameEquals(record?.username || "", username);
}

function adminRecordAllowsAccessEmail(record, emailInput) {
  if (!record?.username) {
    return false;
  }

  const email = normalizeAccessEmail(emailInput);
  if (!isValidAdminEmail(email)) {
    return false;
  }

  const explicitEmail = normalizeAccessEmail(record.email);
  if (explicitEmail) {
    return safeEquals(explicitEmail, email);
  }

  const recordUsername = normalizeAdminUsername(record.username).toLowerCase();
  const replacementEmail = getAdminEmailReplacements().get(recordUsername);
  if (replacementEmail) {
    return safeEquals(replacementEmail, email);
  }

  const usernameEmail = normalizeAccessEmail(record.username);
  return isValidAdminEmail(usernameEmail) && safeEquals(usernameEmail, email);
}

export function getAdminOwnerNorms(value) {
  return getAdminPrincipalNames(value)
    .map((item) => item.toLowerCase())
    .filter(Boolean);
}

function canonicalizeAdminRecord(record) {
  if (!record) {
    return null;
  }
  const canonicalUsername = getCanonicalAdminUsername(record.username);
  return {
    ...record,
    username: canonicalUsername || normalizeAdminUsername(record.username)
  };
}

export function isValidAdminEmail(value) {
  const email = normalizeAccessEmail(value);
  return email.length >= 3 &&
    email.length <= 254 &&
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(email);
}

function accessUnauthorized() {
  return json(
    {
      ok: false,
      error: "access_unauthorized",
      message: "Cloudflare Access authorization is required."
    },
    { status: 401 }
  );
}

export async function syncCloudflareAdminAccessPolicy(env, extraEmails = []) {
  const token = typeof env.CF_API_TOKEN === "string" ? env.CF_API_TOKEN.trim() : "";
  const accountId = typeof env.CF_ACCOUNT_ID === "string" && env.CF_ACCOUNT_ID.trim()
    ? env.CF_ACCOUNT_ID.trim()
    : CLOUDFLARE_ACCOUNT_ID;
  const appId = typeof env.CF_ACCESS_ADMIN_APP_ID === "string" && env.CF_ACCESS_ADMIN_APP_ID.trim()
    ? env.CF_ACCESS_ADMIN_APP_ID.trim()
    : ADMIN_ACCESS_APP_ID;
  const policyId = typeof env.CF_ACCESS_ADMIN_POLICY_ID === "string" && env.CF_ACCESS_ADMIN_POLICY_ID.trim()
    ? env.CF_ACCESS_ADMIN_POLICY_ID.trim()
    : ADMIN_ACCESS_POLICY_ID;

  if (!token || !accountId || !appId || !policyId) {
    return json(
      { ok: false, error: "cloudflare_config_missing", message: "Cloudflare Access 同步配置不完整。" },
      { status: 500 }
    );
  }

  const emails = await listAdminAccessEmails(env, extraEmails);
  const includeEmails = emails.length ? emails : ["no-admins@invalid.example.com"];
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/access/apps/${appId}/policies/${policyId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "Allow admin emails",
        decision: "allow",
        include: includeEmails.map((email) => ({ email: { email } })),
        exclude: [],
        require: [],
        precedence: 1,
        session_duration: "8760h"
      })
    }
  );
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    console.error("Failed to sync Cloudflare Access admin policy:", payload || response.status);
    return json(
      { ok: false, error: "cloudflare_sync_failed", message: "Cloudflare Access 策略同步失败，请稍后重试。" },
      { status: 502 }
    );
  }

  if (!cloudflareAccessPolicyIncludesEmails(payload?.result?.include, includeEmails)) {
    console.error("Cloudflare Access admin policy response did not include expected emails:", {
      expectedCount: includeEmails.length,
      responseInclude: payload?.result?.include
    });
    return json(
      { ok: false, error: "cloudflare_sync_incomplete", message: "Cloudflare Access policy sync did not include all admin emails." },
      { status: 502 }
    );
  }

  return null;
}

function cloudflareAccessPolicyIncludesEmails(rules, expectedEmails) {
  if (!Array.isArray(rules)) {
    return false;
  }

  const actualEmails = new Set();
  for (const rule of rules) {
    const emailRule = rule?.email;
    if (typeof emailRule === "string") {
      const email = normalizeAccessEmail(emailRule);
      if (email) {
        actualEmails.add(email);
      }
      continue;
    }
    if (emailRule && typeof emailRule === "object") {
      const email = normalizeAccessEmail(emailRule.email);
      if (email) {
        actualEmails.add(email);
      }
    }
  }

  return expectedEmails.every((email) => actualEmails.has(normalizeAccessEmail(email)));
}

async function rollbackCreatedAdminAccount(env, record) {
  const username = normalizeAdminUsername(record?.username);
  if (!username) {
    return;
  }

  try {
    await Promise.all(getAdminPrincipalNames(username).map((name) =>
      env.LEAVE_STATUS_DATA.delete(adminKey(name))
    ));
    await markD1AdminDeleted(env, username, Date.now(), "cloudflare_sync_failed");
  } catch (error) {
    console.error("Failed to rollback admin account after Cloudflare Access sync failure:", error);
  }
}

async function restoreAdminAccountAfterEmailSyncFailure(env, previousRecord, rejectedEmail) {
  if (!previousRecord?.username) {
    return;
  }

  try {
    const restoredRecord = await putStoredAdminCredential(env, previousRecord);
    await syncAdminLoginAlias(env, restoredRecord, rejectedEmail);
    await upsertD1AdminAccount(env, restoredRecord, "kv", true);
  } catch (error) {
    console.error("Failed to restore admin account after Cloudflare Access sync failure:", error);
  }
}

async function listAdminAccessEmails(env, extraEmails = []) {
  const admins = await listAdminAccounts(env);
  const emails = new Set();
  for (const admin of admins) {
    const email = normalizeAccessEmail(admin?.email || admin?.username || "");
    if (isValidAdminEmail(email)) {
      emails.add(email);
    }
  }
  for (const value of extraEmails) {
    const email = normalizeAccessEmail(value);
    if (isValidAdminEmail(email)) {
      emails.add(email);
    }
  }
  return Array.from(emails).sort();
}

export async function listAdminAccounts(env) {
  const items = await listAdminAccountsFromKV(env);
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      maxGeneratedLinks: await getAdminLinkLimit(env, item.username)
    }))
  );
}

async function listAdminAccountsFromKV(env) {
  const itemMap = new Map();

  for (const item of await listAdminAccountsFromD1(env)) {
    if (item.username) {
      itemMap.set(item.username.toLowerCase(), item);
    }
  }

  let cursor;
  do {
    const page = await env.LEAVE_STATUS_DATA.list({
      prefix: ADMIN_KEY_PREFIX,
      cursor,
      limit: 100
    });

    for (const key of page.keys) {
      if (isAdminLoginAliasListKey(key)) {
        continue;
      }
      const metadataItem = serializeAdminAccountFromListKey(key);
      const item = metadataItem ||
        serializeAdminAccount(canonicalizeAdminRecord(await getStoredAdminCredentialByKey(env, key.name)));
      if (!item) {
        continue;
      }
      itemMap.set(item.username.toLowerCase(), item);
    }

    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  for (const account of getSecretAdminAccounts(env)) {
    const item = serializeAdminAccount(canonicalizeAdminRecord(account));
    const key = item.username.toLowerCase();
    if (itemMap.has(key) || (await isAdminDeletedOverride(env, account.username))) {
      continue;
    }

    itemMap.set(key, {
      username: item.username,
      email: item.email || normalizeAccessEmail(item.username),
      source: account.source,
      editable: true,
      createdAt: 0,
      createdAtBeijing: "",
      createdBy: ""
    });
  }

  return Array.from(itemMap.values())
    .sort((left, right) => {
      if (left.source !== right.source) {
        return left.source === "kv" ? 1 : -1;
      }
      return left.username.localeCompare(right.username);
    });
}

async function listAdminAccountsFromD1(env) {
  return runD1(env, async (db) => {
    const result = await db.prepare(
      `SELECT username, source, editable, created_at, created_by, updated_at, updated_by
       FROM admin_accounts
       WHERE deleted_at = 0
       ORDER BY CASE WHEN source = 'kv' THEN 1 ELSE 0 END, lower(username) ASC`
    ).all();

    return (result.results || [])
      .map((row) => {
        const username = getCanonicalAdminUsername(row.username || "");
        if (!username) {
          return null;
        }

        const email = getAdminRecordEmail({ username }, username);
        return {
          username,
          email,
          source: row.source || "kv",
          editable: Boolean(row.editable),
          createdAt: Number(row.created_at) || 0,
          createdAtBeijing: row.created_at ? formatBeijingDateTime(Number(row.created_at) || 0) : "",
          createdBy: row.created_by || "",
          updatedAt: Number(row.updated_at) || 0,
          updatedAtBeijing: row.updated_at ? formatBeijingDateTime(Number(row.updated_at) || 0) : "",
          updatedBy: row.updated_by || ""
        };
      })
      .filter(Boolean);
  }, []);
}

function buildAdminAccountMetadata(record, extra = {}) {
  const username = normalizeAdminUsername(record?.username);
  const email = getAdminRecordEmail(record, username);
  return {
    username,
    email,
    loginType: record?.loginType || "cloudflare_access",
    configTemplate: record?.configTemplate || ADMIN_CONFIG_TEMPLATE_BLANK,
    createdAt: Number(record?.createdAt) || 0,
    createdBy: record?.createdBy || "",
    updatedAt: Number(record?.updatedAt) || 0,
    updatedBy: record?.updatedBy || "",
    ...extra
  };
}

async function putStoredAdminCredential(env, record, keyUsername = record?.username, metadataExtra = {}) {
  const username = normalizeAdminUsername(record?.username);
  if (!username) {
    return null;
  }

  const email = getAdminRecordEmail(record, username);
  const storedRecord = {
    ...record,
    username,
    email,
    loginType: record?.loginType || "cloudflare_access",
    configTemplate: record?.configTemplate || ADMIN_CONFIG_TEMPLATE_BLANK
  };
  await env.LEAVE_STATUS_DATA.put(adminKey(keyUsername || username), JSON.stringify(storedRecord), {
    metadata: buildAdminAccountMetadata(storedRecord, metadataExtra)
  });
  return storedRecord;
}

async function deleteAdminLoginAlias(env, emailInput, usernameInput) {
  const email = normalizeAccessEmail(emailInput);
  const username = normalizeAdminUsername(usernameInput);
  if (!email || !username || safeEquals(email, normalizeAccessEmail(username))) {
    return;
  }

  const record = await getStoredAdminCredentialByKey(env, adminKey(email));
  if (record && adminRecordMatchesUsername(record, username)) {
    await env.LEAVE_STATUS_DATA.delete(adminKey(email));
  }
}

async function syncAdminLoginAlias(env, record, previousEmail = "") {
  const username = normalizeAdminUsername(record?.username);
  if (!username) {
    return;
  }

  const email = getAdminRecordEmail(record, username);
  const previous = normalizeAccessEmail(previousEmail);
  if (previous && !safeEquals(previous, email)) {
    await deleteAdminLoginAlias(env, previous, username);
  }

  if (email && !safeEquals(email, normalizeAccessEmail(username))) {
    await putStoredAdminCredential(env, record, email, { loginAliasFor: username });
  }
}

async function findAdminAccessEmailConflict(env, emailInput, currentUsername = "") {
  const email = normalizeAccessEmail(emailInput);
  if (!isValidAdminEmail(email)) {
    return null;
  }

  const keyedRecord = await getStoredAdminCredentialByKey(env, adminKey(email));
  if (keyedRecord && (!currentUsername || !adminRecordMatchesUsername(keyedRecord, currentUsername))) {
    return keyedRecord;
  }

  const loginRecord = await getAdminAccountForAccessEmail(env, email);
  if (loginRecord && (!currentUsername || !adminRecordMatchesUsername(loginRecord, currentUsername))) {
    return loginRecord;
  }

  const items = await listAdminAccountsFromKV(env);
  return items.find((item) =>
    safeEquals(normalizeAccessEmail(item.email || item.username), email) &&
    (!currentUsername || !adminUsernameEquals(item.username, currentUsername))
  ) || null;
}

export async function createAdminAccount(payload, env, createdBy) {
  const email = normalizeAccessEmail(payload.email || payload.username);
  if (!isValidAdminEmail(email)) {
    return json(
      { ok: false, error: "invalid_email", message: "请输入有效的管理员邮箱。" },
      { status: 400 }
    );
  }

  if (await findAdminAccessEmailConflict(env, email)) {
    return json(
      { ok: false, error: "duplicate_email", message: "管理员邮箱已存在。" },
      { status: 409 }
    );
  }

  const createdAt = Date.now();
  const adminRecord = {
    username: email,
    email,
    loginType: "cloudflare_access",
    configTemplate: ADMIN_CONFIG_TEMPLATE_BLANK,
    createdAt,
    createdBy
  };

  await putStoredAdminCredential(env, adminRecord);
  await upsertD1AdminAccount(env, adminRecord, "kv", true);
  const syncError = await syncCloudflareAdminAccessPolicy(env, [email]);
  if (syncError) {
    await rollbackCreatedAdminAccount(env, adminRecord);
    return syncError;
  }
  await Promise.all(getAdminPrincipalNames(email).map((name) =>
    env.LEAVE_STATUS_DATA.delete(adminDeletedKey(name))
  ));

  return json({
    ok: true,
    item: {
      username: email,
      email,
      source: "kv",
      editable: true,
      createdAt,
      createdAtBeijing: formatBeijingDateTime(createdAt),
      createdBy,
      maxGeneratedLinks: 0
    }
  });
}

export async function updateAdminAccountSettings(usernameInput, payload, env, updatedBy) {
  const requestedUsername = getCanonicalAdminUsername(usernameInput);
  const existingItemRecord = await getStoredAdminCredential(env, requestedUsername);
  const emailUsername = existingItemRecord?.username || requestedUsername;
  const hasEmailLimitChange = Object.prototype.hasOwnProperty.call(payload || {}, "maxGeneratedLinks");
  const hasAccessEmailChange = Object.prototype.hasOwnProperty.call(payload || {}, "email");
  const emailParsedLimit = hasEmailLimitChange ? parseAdminLinkLimit(payload.maxGeneratedLinks) : null;
  const requestedEmail = hasAccessEmailChange ? normalizeAccessEmail(payload.email) : "";

  if (!isValidAdminEmail(emailUsername)) {
    return json(
      { ok: false, error: "invalid_email", message: "管理员邮箱无效。" },
      { status: 400 }
    );
  }

  if (!hasEmailLimitChange && !hasAccessEmailChange) {
    return json(
      { ok: false, error: "missing_changes", message: "请填写需要修改的管理员设置。" },
      { status: 400 }
    );
  }

  if (hasAccessEmailChange && !isValidAdminEmail(requestedEmail)) {
    return json(
      { ok: false, error: "invalid_email", message: "请输入有效的管理员邮箱。" },
      { status: 400 }
    );
  }

  if (hasEmailLimitChange && emailParsedLimit === null) {
    return json(
      { ok: false, error: "invalid_link_limit", message: "累计生成子链接上限必须是 0 或正整数，0 表示不限制。" },
      { status: 400 }
    );
  }

  if (!existingItemRecord && !(await adminAccountExists(env, emailUsername))) {
    return json(
      { ok: false, error: "not_found", message: "找不到该管理员。" },
      { status: 404 }
    );
  }

  const currentEmail = getAdminRecordEmail(existingItemRecord, emailUsername) || normalizeAccessEmail(emailUsername);
  const shouldUpdateEmail = hasAccessEmailChange && !safeEquals(requestedEmail, currentEmail);
  let updatedRecord = existingItemRecord;

  if (shouldUpdateEmail) {
    if (!existingItemRecord) {
      return json(
        { ok: false, error: "email_update_not_supported", message: "密钥配置的管理员不能在这里修改登录邮箱。" },
        { status: 400 }
      );
    }

    const conflictRecord = await findAdminAccessEmailConflict(env, requestedEmail, emailUsername);
    if (conflictRecord) {
      return json(
        { ok: false, error: "duplicate_email", message: "管理员邮箱已存在。" },
        { status: 409 }
      );
    }

    const updatedAt = Date.now();
    updatedRecord = {
      ...existingItemRecord,
      email: requestedEmail,
      updatedAt,
      updatedBy: normalizeAdminUsername(updatedBy),
      emailUpdatedAt: updatedAt,
      emailUpdatedBy: normalizeAdminUsername(updatedBy)
    };
    updatedRecord = await putStoredAdminCredential(env, updatedRecord);
    await syncAdminLoginAlias(env, updatedRecord, currentEmail);
    await upsertD1AdminAccount(env, updatedRecord, "kv", true);
    await deleteAdminSessionsForUser(env, emailUsername);
  }

  let emailMaxGeneratedLinks = await getAdminLinkLimit(env, emailUsername);
  if (hasEmailLimitChange) {
    emailMaxGeneratedLinks = await putAdminLinkLimit(env, emailUsername, emailParsedLimit, updatedBy);
  }

  if (shouldUpdateEmail) {
    const syncError = await syncCloudflareAdminAccessPolicy(env, [requestedEmail]);
    if (syncError) {
      await restoreAdminAccountAfterEmailSyncFailure(env, existingItemRecord, requestedEmail);
      return syncError;
    }
    await env.LEAVE_STATUS_DATA.delete(adminDeletedKey(requestedEmail));
  }

  const emailItem = updatedRecord
    ? serializeAdminAccount(existingItemRecord)
    : {
        username: emailUsername,
        email: normalizeAccessEmail(emailUsername),
        source: "secret",
        editable: true,
        createdAt: 0,
        createdAtBeijing: "",
        createdBy: ""
      };
  emailItem.maxGeneratedLinks = emailMaxGeneratedLinks;
  if (updatedRecord) {
    Object.assign(emailItem, serializeAdminAccount(updatedRecord));
    emailItem.maxGeneratedLinks = emailMaxGeneratedLinks;
  }

  return json({
    ok: true,
    item: emailItem
  });
}

export async function deleteAdminAccount(usernameInput, env, deletedBy = "") {
  const requestedUsername = getCanonicalAdminUsername(usernameInput);
  const existingRecord = await getStoredAdminCredential(env, requestedUsername);
  const deleteUsername = existingRecord?.username || requestedUsername;
  if (!isValidAdminEmail(deleteUsername)) {
    return json(
      { ok: false, error: "invalid_email", message: "管理员邮箱无效。" },
      { status: 400 }
    );
  }

  if (!(await adminAccountExists(env, deleteUsername))) {
    return json(
      { ok: false, error: "not_found", message: "找不到该管理员。" },
      { status: 404 }
    );
  }

  const boundEmail = getAdminRecordEmail(existingRecord, deleteUsername);
  const namesToDelete = new Set(getAdminPrincipalNames(deleteUsername));
  if (boundEmail) {
    namesToDelete.add(boundEmail);
  }

  const deletedAtForEmail = Date.now();
  await Promise.all(Array.from(namesToDelete).map(async (name) => {
    await env.LEAVE_STATUS_DATA.delete(adminKey(name));
    await env.LEAVE_STATUS_DATA.put(
      adminDeletedKey(name),
      JSON.stringify({
        username: name,
        deletedAt: deletedAtForEmail,
        deletedBy
      }),
      {
        metadata: {
          username: name,
          deletedAt: deletedAtForEmail,
          deletedBy
        }
      }
    );
    await markD1AdminDeleted(env, name, deletedAtForEmail, deletedBy);
  }));
  await deleteAdminSessionsForUser(env, deleteUsername);
  await deleteTrashRecordsForOwner(env, deleteUsername);
  await deleteArchiveRecordsForOwner(env, deleteUsername);
  const syncError = await syncCloudflareAdminAccessPolicy(env);
  if (syncError) {
    return syncError;
  }

  return json({ ok: true, username: deleteUsername });
}

function serializeAdminAccount(record) {
  if (!record) {
    return null;
  }

  const email = getAdminRecordEmail(record, record.username);
  return {
    username: record.username,
    email,
    source: "kv",
    editable: true,
    createdAt: record.createdAt || 0,
    createdAtBeijing: record.createdAt ? formatBeijingDateTime(record.createdAt) : "",
    createdBy: record.createdBy || "",
    updatedAt: record.updatedAt || 0,
    updatedAtBeijing: record.updatedAt ? formatBeijingDateTime(record.updatedAt) : "",
    updatedBy: record.updatedBy || ""
  };
}

function getListKeyMetadata(key) {
  return key?.metadata && typeof key.metadata === "object" ? key.metadata : null;
}

function getListKeySuffix(key, prefix) {
  const name = typeof key?.name === "string" ? key.name : "";
  return name.startsWith(prefix) ? name.slice(prefix.length) : "";
}

function isAdminLoginAliasListKey(key) {
  const metadata = getListKeyMetadata(key);
  return Boolean(metadata?.loginAliasFor);
}

function adminRecordFromListKey(key) {
  const metadata = getListKeyMetadata(key);
  if (!metadata || (!metadata.username && !metadata.email)) {
    return null;
  }

  const username = getCanonicalAdminUsername(
    metadata.username || getListKeySuffix(key, ADMIN_KEY_PREFIX) || metadata.email
  );
  if (!username) {
    return null;
  }

  return {
    username,
    email: getAdminRecordEmail(metadata, username),
    loginType: metadata.loginType || "cloudflare_access",
    configTemplate: metadata.configTemplate || ADMIN_CONFIG_TEMPLATE_BLANK,
    createdAt: Number(metadata.createdAt) || 0,
    createdBy: metadata.createdBy || "",
    updatedAt: Number(metadata.updatedAt) || 0,
    updatedBy: metadata.updatedBy || ""
  };
}

function serializeAdminAccountFromListKey(key) {
  const record = adminRecordFromListKey(key);
  return record ? serializeAdminAccount(record) : null;
}

function adminDeletedRecordFromListKey(key) {
  const metadata = getListKeyMetadata(key);
  if (!metadata) {
    return null;
  }

  const username = getCanonicalAdminUsername(
    metadata.username || getListKeySuffix(key, ADMIN_DELETED_KEY_PREFIX)
  );
  if (!username) {
    return null;
  }

  return {
    username,
    deletedAt: Number(metadata.deletedAt) || 0,
    deletedBy: metadata.deletedBy || ""
  };
}

function adminLoginRecordFromListKey(key) {
  const metadata = getListKeyMetadata(key);
  if (!metadata?.username || !Number(metadata.lastLoginAt)) {
    return null;
  }

  return {
    username: getCanonicalAdminUsername(metadata.username),
    lastLoginAt: Number(metadata.lastLoginAt) || 0,
    lastAccessIp: metadata.lastAccessIp || "",
    lastAccessUserAgent: metadata.lastAccessUserAgent || ""
  };
}

function adminLinkStatsRecordFromListKey(key) {
  const metadata = getListKeyMetadata(key);
  if (!metadata?.username || !Number.isFinite(Number(metadata.generatedLinkCount))) {
    return null;
  }

  return {
    username: getCanonicalAdminUsername(metadata.username),
    generatedLinkCount: Number(metadata.generatedLinkCount) || 0,
    updatedAt: Number(metadata.updatedAt) || 0
  };
}

export async function getAdminTemplateConfig(env, username) {
  const storedConfig = await getStoredAdminTemplateConfig(env, username);
  if (storedConfig) {
    return clone(storedConfig);
  }

  const lastEditedConfig = await getLastEditedAdminConfig(env, username);
  if (lastEditedConfig) {
    return clone(lastEditedConfig);
  }

  const record = await getStoredAdminCredential(env, username);
  if (
    record?.configTemplate &&
    record.configTemplate !== ADMIN_CONFIG_TEMPLATE_BLANK &&
    typeof record.configTemplate === "object"
  ) {
    return normalizeConfig(record.configTemplate);
  }

  return clone(record?.configTemplate === ADMIN_CONFIG_TEMPLATE_BLANK ? EMPTY_CONFIG : DEFAULT_CONFIG);
}

async function getStoredAdminTemplateConfig(env, username) {
  for (const name of getAdminPrincipalNames(username)) {
    const raw = await env.LEAVE_STATUS_DATA.get(adminTemplateKey(name));
    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw);
      const config = parsed?.config && typeof parsed.config === "object" ? parsed.config : parsed;
      if (config && typeof config === "object" && !Array.isArray(config)) {
        return normalizeConfig(config);
      }
    } catch (error) {
      console.error("Failed to parse admin template config:", error);
    }
  }

  return null;
}

async function getLastEditedAdminConfig(env, username) {
  let latestUpdatedAt = 0;
  let latestConfig = null;
  const sources = [
    [SHARE_KEY_PREFIX, getShareRecord],
    [TRASH_KEY_PREFIX, readTrashRecord],
    [ARCHIVE_KEY_PREFIX, getArchiveRecord]
  ];

  for (const [prefix, readRecord] of sources) {
    let cursor;
    do {
      const page = await env.LEAVE_STATUS_DATA.list({
        prefix,
        cursor,
        limit: 100
      });

      for (const key of page.keys) {
        const id = key.name.slice(prefix.length);
        if (!isValidShareId(id)) {
          continue;
        }

        const metadata = key.metadata || {};
        const metadataOwner = metadata.createdBy || "";
        const metadataUpdatedAt = Number(metadata.updatedAt) || 0;
        if (metadataOwner && !adminOwnerMatches(metadataOwner, username)) {
          continue;
        }
        if (metadataOwner && metadataUpdatedAt && metadataUpdatedAt <= latestUpdatedAt) {
          continue;
        }

        const record = await readRecord(env, id);
        if (!record || !recordBelongsToUser(record, username, env)) {
          continue;
        }

        const updatedAt = Number(record.updatedAt) || Number(record.createdAt) || 0;
        if (updatedAt > latestUpdatedAt) {
          latestUpdatedAt = updatedAt;
          latestConfig = normalizeConfig(record.config);
        }
      }

      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
  }

  return latestConfig;
}

export async function persistAdminTemplateConfig(env, username, config) {
  const canonicalUsername = getCanonicalAdminUsername(username) || normalizeAdminUsername(username);
  if (!canonicalUsername) {
    return;
  }

  const updatedAt = Date.now();
  await env.LEAVE_STATUS_DATA.put(
    adminTemplateKey(canonicalUsername),
    JSON.stringify({
      username: canonicalUsername,
      config: normalizeConfig(config),
      updatedAt
    }),
    {
      metadata: {
        username: canonicalUsername,
        updatedAt
      }
    }
  );
}

export async function getAdminAccountDetails(usernameInput, env) {
  const requestedUsername = getCanonicalAdminUsername(usernameInput);
  const existingAdminRecord = await getStoredAdminCredential(env, requestedUsername);
  const username = existingAdminRecord?.username || requestedUsername;
  if (!isValidAdminUsername(username)) {
    return json(
      { ok: false, error: "invalid_username", message: "管理员账号无效。" },
      { status: 400 }
    );
  }

  if (!(await adminAccountExists(env, username))) {
    return json(
      { ok: false, error: "not_found", message: "找不到该管理员。" },
      { status: 404 }
    );
  }

  const [linkCounts, lastLoginAt] = await Promise.all([
    collectAdminLinkCounts(env, username),
    getAdminLastLoginAt(env, username)
  ]);
  const adminRecord = existingAdminRecord || await getStoredAdminCredential(env, username);
  const historicalLinkCount = await syncAdminGeneratedLinkCount(
    env,
    username,
    linkCounts.knownHistoricalCount
  );
  const maxGeneratedLinks = await getAdminLinkLimit(env, username);

  return json({
    ok: true,
    item: {
      username,
      email: getAdminRecordEmail(adminRecord, username) || normalizeAccessEmail(username),
      historicalLinkCount,
      currentLinkCount: linkCounts.currentCount,
      maxGeneratedLinks,
      remainingLinkCount: maxGeneratedLinks
        ? Math.max(0, maxGeneratedLinks - historicalLinkCount)
        : null,
      lastLoginAt,
      lastLoginAtBeijing: lastLoginAt ? formatBeijingDateTime(lastLoginAt) : ""
    }
  });
}

async function collectAdminLinkCounts(env, username) {
  const d1Counts = await queryD1AdminLinkCounts(env, username);
  if (d1Counts) {
    return d1Counts;
  }

  return collectAdminLinkCountsFromKV(env, username);
}

async function collectAdminLinkCountsFromKV(env, username) {
  const now = Date.now();
  let knownHistoricalCount = 0;
  let currentCount = 0;

  let cursor;
  do {
    const page = await env.LEAVE_STATUS_DATA.list({
      prefix: SHARE_KEY_PREFIX,
      cursor,
      limit: 100
    });

    for (const key of page.keys) {
      const id = key.name.slice(SHARE_KEY_PREFIX.length);
      const metadata = key.metadata || {};
      let owner = metadata.createdBy || "";
      let expiresAt = Number(metadata.expiresAt) || 0;
      let record = null;
      if (!owner || !expiresAt) {
        record = await getShareRecord(env, id);
        owner = owner || getRecordOwner(record, env);
        expiresAt = expiresAt || Number(record?.expiresAt) || 0;
      }

      if (!adminOwnerMatches(owner, username)) {
        continue;
      }

      knownHistoricalCount += 1;
      if (!expiresAt || expiresAt > now) {
        currentCount += 1;
      }
    }

    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  cursor = undefined;
  do {
    const page = await env.LEAVE_STATUS_DATA.list({
      prefix: TRASH_KEY_PREFIX,
      cursor,
      limit: 100
    });

    for (const key of page.keys) {
      const id = key.name.slice(TRASH_KEY_PREFIX.length);
      const metadata = key.metadata || {};
      const purgeAt = Number(metadata.purgeAt) || 0;
      if (purgeAt && purgeAt <= now) {
        continue;
      }

      let owner = metadata.createdBy || "";
      if (!owner) {
        const record = await getTrashRecord(env, id);
        owner = getRecordOwner(record, env);
      }

      if (adminOwnerMatches(owner, username)) {
        knownHistoricalCount += 1;
      }
    }

    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  cursor = undefined;
  do {
    const page = await env.LEAVE_STATUS_DATA.list({
      prefix: ARCHIVE_KEY_PREFIX,
      cursor,
      limit: 100
    });

    for (const key of page.keys) {
      const id = key.name.slice(ARCHIVE_KEY_PREFIX.length);
      const metadata = key.metadata || {};
      let owner = metadata.createdBy || "";
      if (!owner) {
        const record = await getArchiveRecord(env, id);
        owner = getRecordOwner(record, env);
      }

      if (adminOwnerMatches(owner, username)) {
        knownHistoricalCount += 1;
      }
    }

    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  return { knownHistoricalCount, currentCount };
}

async function syncAdminGeneratedLinkCount(env, username, minimumCount) {
  const stats = await getAdminLinkStats(env, username);
  const generatedLinkCount = Math.max(Number(stats.generatedLinkCount) || 0, minimumCount);
  if (generatedLinkCount !== (Number(stats.generatedLinkCount) || 0)) {
    await putAdminLinkStats(env, username, generatedLinkCount);
  }

  return generatedLinkCount;
}

export async function incrementAdminGeneratedLinkCount(env, username) {
  const stats = await getAdminLinkStats(env, username);
  await putAdminLinkStats(env, username, (Number(stats.generatedLinkCount) || 0) + 1);
}

export async function enforceAdminGeneratedLinkLimit(env, username) {
  const limit = await getAdminLinkLimit(env, username);
  if (!limit) {
    return null;
  }

  const stats = await getAdminLinkStats(env, username);
  let generatedLinkCount = Number(stats.generatedLinkCount) || 0;
  const d1Counts = await queryD1AdminLinkCounts(env, username);
  if (d1Counts) {
    generatedLinkCount = Math.max(generatedLinkCount, Number(d1Counts.knownHistoricalCount) || 0);
  }
  if (generatedLinkCount !== (Number(stats.generatedLinkCount) || 0)) {
    await putAdminLinkStats(env, username, generatedLinkCount);
  }

  if (generatedLinkCount >= limit) {
    return json(
      {
        ok: false,
        error: "admin_link_limit_reached",
        message: `该管理员累计生成子链接数已达上限 ${limit} 个，请联系超级管理员调整。`
      },
      { status: 403 }
    );
  }

  return null;
}

async function getAdminLinkStats(env, username) {
  let merged = {};
  for (const name of getAdminPrincipalNames(username)) {
    const raw = await env.LEAVE_STATUS_DATA.get(adminLinkStatsKey(name));
    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw) || {};
      if ((Number(parsed.generatedLinkCount) || 0) >= (Number(merged.generatedLinkCount) || 0)) {
        merged = {
          ...parsed,
          username: getCanonicalAdminUsername(parsed.username || name)
        };
      }
    } catch (error) {
      console.error("Failed to parse admin link stats:", error);
    }
  }
  return merged;
}

async function putAdminLinkStats(env, username, generatedLinkCount) {
  const now = Date.now();
  const canonicalUsername = getCanonicalAdminUsername(username);
  const record = {
    username: canonicalUsername,
    generatedLinkCount,
    updatedAt: now
  };
  await env.LEAVE_STATUS_DATA.put(adminLinkStatsKey(canonicalUsername), JSON.stringify(record), {
    metadata: record
  });
  await upsertD1AdminLinkStats(env, record.username, generatedLinkCount, now);
}

async function getAdminLinkLimit(env, username) {
  for (const name of getAdminPrincipalNames(username)) {
    const raw = await env.LEAVE_STATUS_DATA.get(adminLinkLimitKey(name));
    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw);
      return Math.max(0, Math.floor(Number(parsed?.maxGeneratedLinks) || 0));
    } catch (error) {
      console.error("Failed to parse admin link limit:", error);
    }
  }
  return 0;
}

async function putAdminLinkLimit(env, username, maxGeneratedLinks, updatedBy = "") {
  const normalizedUsername = getCanonicalAdminUsername(username);
  const limit = Math.max(0, Math.floor(Number(maxGeneratedLinks) || 0));
  if (!normalizedUsername) {
    return 0;
  }

  const record = {
    username: normalizedUsername,
    maxGeneratedLinks: limit,
    updatedAt: Date.now(),
    updatedBy: normalizeAdminUsername(updatedBy)
  };
  await env.LEAVE_STATUS_DATA.put(adminLinkLimitKey(normalizedUsername), JSON.stringify(record), {
    metadata: record
  });
  return limit;
}

function parseAdminLinkLimit(value) {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const limit = Number(value);
  if (!Number.isFinite(limit) || limit < 0 || Math.floor(limit) !== limit) {
    return null;
  }
  return limit;
}

async function recordAdminLogin(env, username, loginAt, accessInfo = {}) {
  const normalizedUsername = getCanonicalAdminUsername(username);
  if (!normalizedUsername) {
    return;
  }

  const record = {
    username: normalizedUsername,
    lastLoginAt: loginAt,
    lastAccessIp: sanitizeMetadataValue(accessInfo.ip || ""),
    lastAccessUserAgent: sanitizeMetadataValue(accessInfo.userAgent || "")
  };
  await Promise.all([
    env.LEAVE_STATUS_DATA.put(adminLoginKey(normalizedUsername), JSON.stringify(record), {
      metadata: record
    }),
    upsertD1AdminLogin(env, normalizedUsername, loginAt, accessInfo)
  ]);
}

function scheduleAdminAccessRecord(request, env, ctx, username) {
  const accessAt = Date.now();
  const accessInfo = getRequestAccessInfo(request);
  const task = recordAdminLogin(env, username, accessAt, accessInfo).catch((error) => {
    console.error("Failed to record admin access:", error);
  });

  if (ctx && typeof ctx.waitUntil === "function") {
    ctx.waitUntil(task);
  }
}

function getRequestAccessInfo(request) {
  const forwardedFor = request.headers.get("X-Forwarded-For") || "";
  const forwardedIp = forwardedFor.split(",")[0]?.trim() || "";
  return {
    ip: request.headers.get("CF-Connecting-IP") || forwardedIp,
    userAgent: request.headers.get("User-Agent") || ""
  };
}

async function getAdminLastLoginAt(env, username) {
  const d1LastLoginAt = await queryD1AdminLastLoginAt(env, username);
  if (d1LastLoginAt !== null) {
    return d1LastLoginAt;
  }

  return getAdminLastLoginAtFromKV(env, username);
}

async function getAdminLastLoginAtFromKV(env, username) {
  let lastLoginAt = 0;
  for (const name of getAdminPrincipalNames(username)) {
    const raw = await env.LEAVE_STATUS_DATA.get(adminLoginKey(name));
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        lastLoginAt = Math.max(lastLoginAt, Number(parsed?.lastLoginAt) || 0);
      } catch (error) {
        console.error("Failed to parse admin login record:", error);
      }
    }
  }

  let cursor;
  do {
    const page = await env.LEAVE_STATUS_DATA.list({
      prefix: SESSION_KEY_PREFIX,
      cursor,
      limit: 100
    });

    for (const key of page.keys) {
      const rawSession = await env.LEAVE_STATUS_DATA.get(key.name);
      if (!rawSession) {
        continue;
      }

      try {
        const session = JSON.parse(rawSession);
        if (adminOwnerMatches(session?.username || "", username)) {
          lastLoginAt = Math.max(lastLoginAt, Number(session.createdAt) || 0);
        }
      } catch (error) {
        console.error("Failed to parse admin session while reading details:", error);
      }
    }

    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  if (lastLoginAt) {
    await recordAdminLogin(env, username, lastLoginAt);
  }

  return lastLoginAt;
}

async function deleteAdminSessionsForUser(env, username) {
  let cursor;
  do {
    const page = await env.LEAVE_STATUS_DATA.list({
      prefix: SESSION_KEY_PREFIX,
      cursor,
      limit: 100
    });

    await Promise.all(page.keys.map(async (key) => {
      const raw = await env.LEAVE_STATUS_DATA.get(key.name);
      if (!raw) {
        return;
      }

      try {
        const session = JSON.parse(raw);
        if (adminOwnerMatches(session?.username || "", username)) {
          await env.LEAVE_STATUS_DATA.delete(key.name);
        }
      } catch (error) {
        console.error("Failed to parse admin session while invalidating:", error);
      }
    }));

    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
}

export function adminOwnerMatches(owner, username) {
  const left = getCanonicalAdminUsername(owner);
  const right = getCanonicalAdminUsername(username);
  return Boolean(left && right && safeEquals(left, right));
}

export async function getR2UsageStatus(env) {
  const bucket = env.LEAVE_ATTACHMENTS;
  if (!bucket) {
    return json(
      {
        ok: false,
        error: "missing_r2_binding",
        message: "附件 R2 存储未配置完成。"
      },
      { status: 500 }
    );
  }

  let cursor;
  let objectCount = 0;
  let totalSizeBytes = 0;
  let listRequests = 0;
  let nonStandardObjectCount = 0;
  const prefixStats = new Map();

  do {
    const page = await bucket.list({
      cursor,
      limit: 1000
    });
    listRequests += 1;

    for (const object of page.objects || []) {
      const size = Number(object.size) || 0;
      const group = getR2UsageGroup(object.key || "");
      const current = prefixStats.get(group.key) || {
        key: group.key,
        label: group.label,
        objectCount: 0,
        totalSizeBytes: 0
      };
      current.objectCount += 1;
      current.totalSizeBytes += size;
      prefixStats.set(group.key, current);

      objectCount += 1;
      totalSizeBytes += size;

      if (object.storageClass && String(object.storageClass).toLowerCase() !== "standard") {
        nonStandardObjectCount += 1;
      }
    }

    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);

  return json({
    ok: true,
    item: {
      checkedAt: Date.now(),
      bucketName: "leave-status-attachments",
      objectCount,
      totalSizeBytes,
      storageFreeBytes: R2_FREE_STORAGE_BYTES,
      storageUsedPercent: getUsagePercent(totalSizeBytes, R2_FREE_STORAGE_BYTES),
      storageWithinFreeTier: totalSizeBytes <= R2_FREE_STORAGE_BYTES && nonStandardObjectCount === 0,
      nonStandardObjectCount,
      listRequests,
      listRequestsUsedPercent: getUsagePercent(listRequests, R2_FREE_CLASS_A_OPERATIONS_MONTHLY),
      classAFreeMonthly: R2_FREE_CLASS_A_OPERATIONS_MONTHLY,
      classBFreeMonthly: R2_FREE_CLASS_B_OPERATIONS_MONTHLY,
      groups: Array.from(prefixStats.values())
        .map((group) => ({
          ...group,
          objectPercent: getUsagePercent(group.objectCount, objectCount),
          storagePercent: getUsagePercent(group.totalSizeBytes, totalSizeBytes)
        }))
        .sort((left, right) => right.totalSizeBytes - left.totalSizeBytes)
    }
  });
}

function getR2UsageGroup(key) {
  if (key.startsWith(`${COMPLETION_ATTACHMENT_PREVIEW_OBJECT_PREFIX}/`)) {
    return { key: "completionPreviews", label: "销假预览图" };
  }
  if (key.startsWith(`${COMPLETION_ATTACHMENT_OBJECT_PREFIX}/`)) {
    return { key: "completionAttachments", label: "销假原图" };
  }
  if (key.startsWith(`${ATTACHMENT_PREVIEW_OBJECT_PREFIX}/`)) {
    return { key: "attachmentPreviews", label: "请假预览图" };
  }
  if (key.startsWith(`${ATTACHMENT_OBJECT_PREFIX}/`)) {
    return { key: "attachments", label: "请假原图" };
  }
  return { key: "other", label: "其他对象" };
}

export async function getArchiveStorageStatus(env) {
  if (!env.LEAVE_ATTACHMENTS) {
    return json(
      {
        ok: false,
        error: "missing_r2_binding",
        message: "附件 R2 存储未配置完成。"
      },
      { status: 500 }
    );
  }

  return json({
    ok: true,
    items: await collectArchiveStorageByAdmin(env)
  });
}

async function collectArchiveStorageByAdmin(env) {
  const adminItems = await listAdminAccounts(env);
  const statsByOwner = new Map(
    adminItems.map((item) => [
      normalizeAdminUsername(item.username).toLowerCase(),
      {
        username: item.username,
        archiveRecordCount: 0,
        imageCount: 0,
        totalSizeBytes: 0,
        objectKeys: new Set()
      }
    ])
  );

  let cursor;
  do {
    const page = await env.LEAVE_STATUS_DATA.list({
      prefix: ARCHIVE_KEY_PREFIX,
      cursor,
      limit: 100
    });

    for (const key of page.keys) {
      const id = key.name.slice(ARCHIVE_KEY_PREFIX.length);
      const metadata = key.metadata || {};
      let record = null;
      let owner = normalizeAdminUsername(metadata.createdBy || "");
      if (!owner) {
        record = await getArchiveRecord(env, id);
        owner = normalizeAdminUsername(getRecordOwner(record, env));
      }
      if (!owner) {
        continue;
      }

      record = record || (await getArchiveRecord(env, id));
      const canonicalOwner = getCanonicalAdminUsername(owner);
      const ownerKey = canonicalOwner.toLowerCase();
      const stats = statsByOwner.get(ownerKey) || {
        username: canonicalOwner,
        archiveRecordCount: 0,
        imageCount: 0,
        totalSizeBytes: 0,
        objectKeys: new Set()
      };
      stats.archiveRecordCount += 1;
      for (const attachmentUrl of getRecordAttachmentUrls(record)) {
        const objectKey = getAttachmentStorageKeyFromUrl(attachmentUrl);
        if (objectKey) {
          stats.objectKeys.add(objectKey);
        }
      }
      statsByOwner.set(ownerKey, stats);
    }

    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  await runLimited(Array.from(statsByOwner.values()), 4, async (stats) => {
    const sizes = await headR2ObjectSizes(env, Array.from(stats.objectKeys));
    stats.imageCount = sizes.objectCount;
    stats.totalSizeBytes = sizes.totalSizeBytes;
    delete stats.objectKeys;
  });

  return Array.from(statsByOwner.values()).sort((left, right) => {
    if (right.totalSizeBytes !== left.totalSizeBytes) {
      return right.totalSizeBytes - left.totalSizeBytes;
    }
    return right.archiveRecordCount - left.archiveRecordCount;
  });
}

export async function clearAdminArchiveStorage(usernameInput, env) {
  if (!env.LEAVE_ATTACHMENTS) {
    return json(
      {
        ok: false,
        error: "missing_r2_binding",
        message: "附件 R2 存储未配置完成。"
      },
      { status: 500 }
    );
  }

  const requestedUsername = getCanonicalAdminUsername(usernameInput);
  const existingAdminRecord = await getStoredAdminCredential(env, requestedUsername);
  const username = existingAdminRecord?.username || requestedUsername;
  if (!isValidAdminUsername(username)) {
    return json(
      { ok: false, error: "invalid_username", message: "管理员账号无效。" },
      { status: 400 }
    );
  }

  if (!(await adminAccountExists(env, username))) {
    return json(
      { ok: false, error: "not_found", message: "找不到该管理员。" },
      { status: 404 }
    );
  }

  const archiveKeys = [];
  const shareIds = new Set();
  const objectKeys = new Set();
  const objectUrls = new Map();
  let cursor;

  do {
    const page = await env.LEAVE_STATUS_DATA.list({
      prefix: ARCHIVE_KEY_PREFIX,
      cursor,
      limit: 100
    });

    for (const key of page.keys) {
      const id = key.name.slice(ARCHIVE_KEY_PREFIX.length);
      const metadata = key.metadata || {};
      let record = null;
      let owner = metadata.createdBy || "";
      if (!owner) {
        record = await getArchiveRecord(env, id);
        owner = getRecordOwner(record, env);
      }
      if (!adminOwnerMatches(owner, username)) {
        continue;
      }

      record = record || (await getArchiveRecord(env, id));
      archiveKeys.push(key.name);
      shareIds.add(id);
      for (const attachmentUrl of getRecordAttachmentUrls(record)) {
        const objectKey = getAttachmentStorageKeyFromUrl(attachmentUrl);
        if (objectKey) {
          objectKeys.add(objectKey);
          objectUrls.set(objectKey, normalizeAttachmentUrl(attachmentUrl));
        }
      }
    }

    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  const referencedUrls = await findAttachmentReferencesOutsideRecords(
    env,
    Array.from(objectUrls.values()),
    shareIds
  );
  let deletedImageCount = 0;
  let deletedSizeBytes = 0;
  await runLimited(Array.from(objectKeys), 4, async (objectKey) => {
    if (referencedUrls.has(objectUrls.get(objectKey))) {
      return;
    }

    try {
      const head = await env.LEAVE_ATTACHMENTS.head(objectKey);
      await env.LEAVE_ATTACHMENTS.delete(objectKey);
      deletedImageCount += 1;
      deletedSizeBytes += Number(head?.size) || 0;
    } catch (error) {
      console.error("Failed to delete archive attachment:", error);
    }
  });

  await runLimited(archiveKeys, 10, async (key) => {
    const id = key.slice(ARCHIVE_KEY_PREFIX.length);
    await env.LEAVE_STATUS_DATA.delete(key);
    await deleteD1Link(env, id);
  });

  return json({
    ok: true,
    item: {
      username,
      archiveRecordCount: archiveKeys.length,
      deletedImageCount,
      deletedSizeBytes
    }
  });
}

async function headR2ObjectSizes(env, keys) {
  let objectCount = 0;
  let totalSizeBytes = 0;
  await runLimited(keys, 8, async (key) => {
    try {
      const head = await env.LEAVE_ATTACHMENTS.head(key);
      if (head) {
        objectCount += 1;
        totalSizeBytes += Number(head.size) || 0;
      }
    } catch (error) {
      console.error("Failed to read R2 object size:", error);
    }
  });
  return { objectCount, totalSizeBytes };
}

async function runLimited(items, limit, worker) {
  const values = Array.isArray(items) ? items : [];
  if (!values.length) {
    return;
  }

  const concurrency = Math.max(1, Math.min(values.length, Number(limit) || 1));
  let nextIndex = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      await worker(values[index], index);
    }
  }));
}

export async function getD1UsageStatus(env) {
  const db = getD1Database(env);
  if (!db) {
    return json(
      {
        ok: false,
        error: "missing_d1_binding",
        message: "D1 数据库未配置完成。"
      },
      { status: 500 }
    );
  }

  try {
    const tableResult = await db.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT GLOB '_cf_*' ORDER BY name"
    ).all();
    const tables = [];
    let totalRows = 0;
    let sizeAfterBytes = Number(tableResult.meta?.size_after) || 0;
    let rowsReadForThisCheck = Number(tableResult.meta?.rows_read) || 0;
    let rowsWrittenForThisCheck = Number(tableResult.meta?.rows_written) || 0;

    for (const row of tableResult.results || []) {
      const tableName = String(row.name || "");
      if (!tableName || tableName.startsWith("_cf_")) {
        continue;
      }

      const countResult = await db.prepare(
        `SELECT COUNT(*) AS row_count FROM ${quoteSqlIdentifier(tableName)}`
      ).all();
      const rowCount = Number(countResult.results?.[0]?.row_count) || 0;
      totalRows += rowCount;
      sizeAfterBytes = Number(countResult.meta?.size_after) || sizeAfterBytes;
      rowsReadForThisCheck += Number(countResult.meta?.rows_read) || 0;
      rowsWrittenForThisCheck += Number(countResult.meta?.rows_written) || 0;
      tables.push({
        name: tableName,
        rowCount,
        rowPercent: 0
      });
    }

    tables.forEach((table) => {
      table.rowPercent = getUsagePercent(table.rowCount, totalRows);
    });

    return json({
      ok: true,
      item: {
        checkedAt: Date.now(),
        databaseName: "leave-status-db",
        totalRows,
        tables,
        sizeAfterBytes,
        storageFreeBytes: D1_FREE_STORAGE_BYTES,
        storageUsedPercent: getUsagePercent(sizeAfterBytes, D1_FREE_STORAGE_BYTES),
        storageWithinFreeTier: sizeAfterBytes <= D1_FREE_STORAGE_BYTES,
        rowReadsFreeDaily: D1_FREE_ROW_READS_DAILY,
        rowWritesFreeDaily: D1_FREE_ROW_WRITES_DAILY,
        rowsReadForThisCheck,
        rowsWrittenForThisCheck,
        rowsReadUsedPercent: getUsagePercent(rowsReadForThisCheck, D1_FREE_ROW_READS_DAILY),
        rowsWrittenUsedPercent: getUsagePercent(rowsWrittenForThisCheck, D1_FREE_ROW_WRITES_DAILY)
      }
    });
  } catch (error) {
    console.error("Failed to collect D1 usage:", error);
    return json(
      {
        ok: false,
        error: "d1_usage_failed",
        message: "读取 D1 使用情况失败，请稍后重试。"
      },
      { status: 500 }
    );
  }
}

function quoteSqlIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function getUsagePercent(value, limit) {
  const used = Number(value) || 0;
  const max = Number(limit) || 0;
  if (!max) {
    return 0;
  }
  return Math.round((used / max) * 10000) / 100;
}

function getD1Database(env) {
  return env.LEAVE_STATUS_D1 || null;
}

export async function ensureD1Schema(env) {
  const db = getD1Database(env);
  if (!db) {
    return null;
  }

  if (!d1SchemaReadyPromise) {
    d1SchemaReadyPromise = (async () => {
      for (const statement of D1_SCHEMA_STATEMENTS) {
        await db.prepare(statement).run();
      }
      return db;
    })().catch((error) => {
      d1SchemaReadyPromise = null;
      console.error("Failed to ensure D1 schema:", error);
      return null;
    });
  }

  return d1SchemaReadyPromise;
}

async function runD1(env, operation, fallback = null) {
  const db = await ensureD1Schema(env);
  if (!db) {
    return fallback;
  }

  try {
    return await operation(db);
  } catch (error) {
    console.error("D1 operation failed:", error);
    return fallback;
  }
}

async function runD1Required(env, operation) {
  const hasD1Binding = Boolean(getD1Database(env));
  const db = await ensureD1Schema(env);
  if (!db) {
    if (hasD1Binding) {
      throw new Error("D1 schema is unavailable.");
    }
    return null;
  }

  try {
    return await operation(db);
  } catch (error) {
    console.error("D1 operation failed:", error);
    throw error;
  }
}

async function syncD1FromKV(env, options = {}) {
  const db = await ensureD1Schema(env);
  if (!db) {
    return false;
  }

  const now = Date.now();
  if (!options.force && d1KvSyncedAt && now - d1KvSyncedAt < D1_SYNC_INTERVAL_MS) {
    return true;
  }

  if (!options.force && d1KvSyncPromise) {
    return d1KvSyncPromise;
  }

  d1KvSyncPromise = (async () => {
    await syncD1AdminAccountsFromKV(env);
    await syncD1AdminLoginsFromKV(env);
    await syncD1AdminLinkStatsFromKV(env);
    await syncD1LinksFromKV(env);
    d1KvSyncedAt = Date.now();
    return true;
  })().catch((error) => {
    console.error("Failed to backfill D1 from KV:", error);
    return false;
  }).finally(() => {
    d1KvSyncPromise = null;
  });

  return d1KvSyncPromise;
}

async function syncD1LinksFromKV(env) {
  await syncD1LinkPrefixFromKV(env, SHARE_KEY_PREFIX, "active");
  await syncD1LinkPrefixFromKV(env, TRASH_KEY_PREFIX, "trash");
  await syncD1LinkPrefixFromKV(env, ARCHIVE_KEY_PREFIX, "archive");
}

async function syncD1LinkPrefixFromKV(env, prefix, status) {
  let cursor;
  const syncIndex = await getD1LinkSyncIndex(env, prefix, status);
  do {
    const page = await env.LEAVE_STATUS_DATA.list({
      prefix,
      cursor,
      limit: 100
    });

    for (const key of page.keys) {
      if (canSkipD1LinkSync(key, status, syncIndex)) {
        continue;
      }

      const id = key.name.slice(prefix.length);
      let record = null;
      if (status === "active") {
        record = await getShareRecord(env, id);
      } else if (status === "trash") {
        record = await readTrashRecord(env, id);
        if (record && shouldArchiveTrashRecord(record)) {
          await moveTrashRecordToArchive(env, record);
          continue;
        }
      } else {
        record = await getArchiveRecord(env, id);
      }

      if (record) {
        await upsertD1LinkRecord(env, record, status);
      } else {
        await deleteD1Link(env, id);
      }
    }

    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
}

async function getD1LinkSyncIndex(env, prefix, status) {
  const db = await ensureD1Schema(env);
  if (!db) {
    return new Map();
  }

  try {
    const result = await db.prepare(
      `SELECT source_key, status, updated_at, expires_at, deleted_at, purge_at,
        archive_at, archived_at, archive_reason
       FROM leave_links
       WHERE source_key LIKE ? AND status = ?`
    ).bind(`${prefix}%`, status).all();
    return new Map((result.results || []).map((row) => [row.source_key, row]));
  } catch (error) {
    console.error("Failed to build D1 link sync index:", error);
    return new Map();
  }
}

function metadataNumberMatches(value, expected) {
  const expectedNumber = Number(expected) || 0;
  if (!expectedNumber) {
    return true;
  }
  return (Number(value) || 0) === expectedNumber;
}

function canSkipD1LinkSync(key, status, syncIndex) {
  const metadata = getListKeyMetadata(key);
  const row = syncIndex.get(key.name);
  if (!metadata || !row || row.status !== status || !Number(metadata.updatedAt)) {
    return false;
  }

  if (!metadataNumberMatches(row.updated_at, metadata.updatedAt) ||
      !metadataNumberMatches(row.expires_at, metadata.expiresAt)) {
    return false;
  }

  if (status === "trash") {
    return Number(metadata.deletedAt) > 0 &&
      metadataNumberMatches(row.deleted_at, metadata.deletedAt) &&
      metadataNumberMatches(row.purge_at, metadata.purgeAt) &&
      metadataNumberMatches(row.archive_at, metadata.archiveAt);
  }

  if (status === "archive") {
    return Number(metadata.archivedAt) > 0 &&
      metadataNumberMatches(row.deleted_at, metadata.deletedAt) &&
      metadataNumberMatches(row.purge_at, metadata.purgeAt) &&
      metadataNumberMatches(row.archived_at, metadata.archivedAt) &&
      String(row.archive_reason || "") === String(metadata.archiveReason || "");
  }

  return true;
}

async function getD1AdminAccountSyncIndex(env) {
  const db = await ensureD1Schema(env);
  if (!db) {
    return new Map();
  }

  try {
    const result = await db.prepare(
      `SELECT username_norm, source, editable, created_at, created_by,
        updated_at, updated_by, deleted_at, deleted_by
       FROM admin_accounts`
    ).all();
    return new Map((result.results || []).map((row) => [row.username_norm, row]));
  } catch (error) {
    console.error("Failed to build D1 admin sync index:", error);
    return new Map();
  }
}

async function getD1AdminLoginSyncIndex(env) {
  const db = await ensureD1Schema(env);
  if (!db) {
    return new Map();
  }

  try {
    const result = await db.prepare(
      `SELECT username_norm, last_login_at, last_access_ip, last_access_user_agent
       FROM admin_logins`
    ).all();
    return new Map((result.results || []).map((row) => [row.username_norm, row]));
  } catch (error) {
    console.error("Failed to build D1 admin login sync index:", error);
    return new Map();
  }
}

async function getD1AdminLinkStatsSyncIndex(env) {
  const db = await ensureD1Schema(env);
  if (!db) {
    return new Map();
  }

  try {
    const result = await db.prepare(
      `SELECT username_norm, generated_link_count, updated_at
       FROM admin_link_stats`
    ).all();
    return new Map((result.results || []).map((row) => [row.username_norm, row]));
  } catch (error) {
    console.error("Failed to build D1 admin link stats sync index:", error);
    return new Map();
  }
}

function canSkipD1AdminAccountSync(record, source, editable, syncIndex) {
  const username = normalizeAdminUsername(record?.username);
  const row = username ? syncIndex.get(username.toLowerCase()) : null;
  if (!row || Number(row.deleted_at) > 0) {
    return false;
  }

  return String(row.source || "") === String(source || "kv") &&
    Boolean(row.editable) === Boolean(editable) &&
    metadataNumberMatches(row.created_at, record.createdAt) &&
    String(row.created_by || "") === String(record.createdBy || "") &&
    metadataNumberMatches(row.updated_at, record.updatedAt) &&
    String(row.updated_by || "") === String(record.updatedBy || "");
}

function canSkipD1AdminDeletedSync(record, syncIndex) {
  const username = normalizeAdminUsername(record?.username);
  const deletedAt = Number(record?.deletedAt) || 0;
  const row = username ? syncIndex.get(username.toLowerCase()) : null;
  if (!row || !deletedAt) {
    return false;
  }

  return Number(row.deleted_at) === deletedAt &&
    String(row.deleted_by || "") === String(record.deletedBy || "");
}

function canSkipD1AdminLoginSync(record, syncIndex) {
  const username = normalizeAdminUsername(record?.username);
  const lastLoginAt = Number(record?.lastLoginAt) || 0;
  const row = username ? syncIndex.get(username.toLowerCase()) : null;
  if (!row || !lastLoginAt) {
    return false;
  }

  const rowLastLoginAt = Number(row.last_login_at) || 0;
  if (rowLastLoginAt > lastLoginAt) {
    return true;
  }
  if (rowLastLoginAt < lastLoginAt) {
    return false;
  }

  const ip = sanitizeMetadataValue(record.lastAccessIp || "");
  const userAgent = sanitizeMetadataValue(record.lastAccessUserAgent || "");
  return (!ip || String(row.last_access_ip || "") === ip) &&
    (!userAgent || String(row.last_access_user_agent || "") === userAgent);
}

function canSkipD1AdminLinkStatsSync(record, syncIndex) {
  const username = normalizeAdminUsername(record?.username);
  const row = username ? syncIndex.get(username.toLowerCase()) : null;
  if (!row) {
    return false;
  }

  return (Number(row.generated_link_count) || 0) >= (Number(record.generatedLinkCount) || 0) &&
    (Number(row.updated_at) || 0) >= (Number(record.updatedAt) || 0);
}

async function syncD1AdminAccountsFromKV(env) {
  let cursor;
  const storedAdminKeys = new Set();
  const adminSyncIndex = await getD1AdminAccountSyncIndex(env);
  do {
    const page = await env.LEAVE_STATUS_DATA.list({
      prefix: ADMIN_KEY_PREFIX,
      cursor,
      limit: 100
    });

    for (const key of page.keys) {
      if (isAdminLoginAliasListKey(key)) {
        continue;
      }
      const record = adminRecordFromListKey(key) || await getStoredAdminCredentialByKey(env, key.name);
      if (!record) {
        continue;
      }

      const canonicalRecord = canonicalizeAdminRecord(record);
      storedAdminKeys.add(canonicalRecord.username.toLowerCase());
      if (canSkipD1AdminAccountSync(canonicalRecord, "kv", true, adminSyncIndex)) {
        continue;
      }
      await upsertD1AdminAccount(env, canonicalRecord, "kv", true);
    }

    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  for (const account of getSecretAdminAccounts(env)) {
    const canonicalAccount = canonicalizeAdminRecord(account);
    if (storedAdminKeys.has(canonicalAccount.username.toLowerCase())) {
      continue;
    }

    if (await isAdminDeletedOverride(env, account.username)) {
      await markD1AdminDeleted(env, account.username);
      continue;
    }

    if (canSkipD1AdminAccountSync(canonicalAccount, account.source, true, adminSyncIndex)) {
      continue;
    }
    await upsertD1AdminAccount(env, canonicalAccount, account.source, true);
  }

  cursor = undefined;
  do {
    const page = await env.LEAVE_STATUS_DATA.list({
      prefix: ADMIN_DELETED_KEY_PREFIX,
      cursor,
      limit: 100
    });

    for (const key of page.keys) {
      const metadataRecord = adminDeletedRecordFromListKey(key);
      if (metadataRecord) {
        if (canSkipD1AdminDeletedSync(metadataRecord, adminSyncIndex)) {
          continue;
        }

        await markD1AdminDeleted(
          env,
          metadataRecord.username,
          metadataRecord.deletedAt,
          metadataRecord.deletedBy
        );
      } else {
        const raw = await env.LEAVE_STATUS_DATA.get(key.name);
        if (!raw) {
          continue;
        }

        try {
          const parsed = JSON.parse(raw);
          const deletedRecord = {
            username: getCanonicalAdminUsername(parsed.username),
            deletedAt: Number(parsed.deletedAt) || 0,
            deletedBy: parsed.deletedBy || ""
          };
          if (canSkipD1AdminDeletedSync(deletedRecord, adminSyncIndex)) {
            continue;
          }
          await markD1AdminDeleted(env, deletedRecord.username, deletedRecord.deletedAt, deletedRecord.deletedBy);
        } catch (error) {
          console.error("Failed to parse deleted admin record for D1:", error);
        }
      }
    }

    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
}

async function syncD1AdminLoginsFromKV(env) {
  let cursor;
  const loginSyncIndex = await getD1AdminLoginSyncIndex(env);
  do {
    const page = await env.LEAVE_STATUS_DATA.list({
      prefix: ADMIN_LOGIN_KEY_PREFIX,
      cursor,
      limit: 100
    });

    for (const key of page.keys) {
      const metadataRecord = adminLoginRecordFromListKey(key);
      if (metadataRecord) {
        if (canSkipD1AdminLoginSync(metadataRecord, loginSyncIndex)) {
          continue;
        }

        await upsertD1AdminLogin(env, metadataRecord.username, metadataRecord.lastLoginAt, {
          ip: metadataRecord.lastAccessIp,
          userAgent: metadataRecord.lastAccessUserAgent
        });
      } else {
        const raw = await env.LEAVE_STATUS_DATA.get(key.name);
        if (!raw) {
          continue;
        }

        try {
          const parsed = JSON.parse(raw);
          const loginRecord = {
            username: getCanonicalAdminUsername(parsed.username),
            lastLoginAt: Number(parsed.lastLoginAt) || 0,
            lastAccessIp: parsed.lastAccessIp || "",
            lastAccessUserAgent: parsed.lastAccessUserAgent || ""
          };
          if (canSkipD1AdminLoginSync(loginRecord, loginSyncIndex)) {
            continue;
          }

          await upsertD1AdminLogin(env, loginRecord.username, loginRecord.lastLoginAt, {
            ip: parsed.lastAccessIp || "",
            userAgent: parsed.lastAccessUserAgent || ""
          });
        } catch (error) {
          console.error("Failed to parse admin login record for D1:", error);
        }
      }
    }

    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  cursor = undefined;
  do {
    const page = await env.LEAVE_STATUS_DATA.list({
      prefix: SESSION_KEY_PREFIX,
      cursor,
      limit: 100
    });

    for (const key of page.keys) {
      const raw = await env.LEAVE_STATUS_DATA.get(key.name);
      if (!raw) {
        continue;
      }

      try {
        const session = JSON.parse(raw);
        if (session?.username && Number(session.createdAt)) {
          const loginRecord = {
            username: getCanonicalAdminUsername(session.username),
            lastLoginAt: Number(session.createdAt) || 0
          };
          if (canSkipD1AdminLoginSync(loginRecord, loginSyncIndex)) {
            continue;
          }

          await upsertD1AdminLogin(env, loginRecord.username, loginRecord.lastLoginAt);
        }
      } catch (error) {
        console.error("Failed to parse admin session for D1:", error);
      }
    }

    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
}

async function syncD1AdminLinkStatsFromKV(env) {
  let cursor;
  const linkStatsSyncIndex = await getD1AdminLinkStatsSyncIndex(env);
  do {
    const page = await env.LEAVE_STATUS_DATA.list({
      prefix: ADMIN_LINK_STATS_KEY_PREFIX,
      cursor,
      limit: 100
    });

    for (const key of page.keys) {
      const metadataRecord = adminLinkStatsRecordFromListKey(key);
      if (metadataRecord) {
        if (canSkipD1AdminLinkStatsSync(metadataRecord, linkStatsSyncIndex)) {
          continue;
        }

        await upsertD1AdminLinkStats(
          env,
          metadataRecord.username,
          metadataRecord.generatedLinkCount,
          metadataRecord.updatedAt
        );
      } else {
        const raw = await env.LEAVE_STATUS_DATA.get(key.name);
        if (!raw) {
          continue;
        }

        try {
          const parsed = JSON.parse(raw);
          const statsRecord = {
            username: getCanonicalAdminUsername(parsed.username),
            generatedLinkCount: Number(parsed.generatedLinkCount) || 0,
            updatedAt: Number(parsed.updatedAt) || 0
          };
          if (canSkipD1AdminLinkStatsSync(statsRecord, linkStatsSyncIndex)) {
            continue;
          }

          await upsertD1AdminLinkStats(
            env,
            statsRecord.username,
            statsRecord.generatedLinkCount,
            statsRecord.updatedAt
          );
        } catch (error) {
          console.error("Failed to parse admin link stats for D1:", error);
        }
      }
    }

    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
}

export async function upsertD1LinkRecord(env, record, status) {
  if (!record?.id || !isValidShareId(record.id)) {
    return;
  }

  const row = buildD1LinkRow(record, status, env);
  await runD1Required(env, (db) =>
    db.prepare(
      `INSERT INTO leave_links (
        id, status, owner, owner_norm, user_name, start_time, end_time, url, config_json,
        created_at, updated_at, expires_at, deleted_at, purge_at, archive_at, archived_at,
        archive_reason, restored_at, source_key, last_synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        owner = excluded.owner,
        owner_norm = excluded.owner_norm,
        user_name = excluded.user_name,
        start_time = excluded.start_time,
        end_time = excluded.end_time,
        url = excluded.url,
        config_json = excluded.config_json,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        expires_at = excluded.expires_at,
        deleted_at = excluded.deleted_at,
        purge_at = excluded.purge_at,
        archive_at = excluded.archive_at,
        archived_at = excluded.archived_at,
        archive_reason = excluded.archive_reason,
        restored_at = excluded.restored_at,
        source_key = excluded.source_key,
        last_synced_at = excluded.last_synced_at`
    ).bind(
      row.id,
      row.status,
      row.owner,
      row.ownerNorm,
      row.userName,
      row.startTime,
      row.endTime,
      row.url,
      row.configJson,
      row.createdAt,
      row.updatedAt,
      row.expiresAt,
      row.deletedAt,
      row.purgeAt,
      row.archiveAt,
      row.archivedAt,
      row.archiveReason,
      row.restoredAt,
      row.sourceKey,
      row.lastSyncedAt
    ).run()
  );
}

function buildD1LinkRow(record, status, env) {
  const config = normalizeConfig(record.config);
  const owner = getRecordOwner(record, env);
  const normalizedStatus = status === "trash" || status === "archive" ? status : "active";
  return {
    id: record.id,
    status: normalizedStatus,
    owner,
    ownerNorm: owner.toLowerCase(),
    userName: config.userName || "",
    startTime: config.startTime || "",
    endTime: config.endTime || "",
    url: buildShareUrl(record.id, record),
    configJson: JSON.stringify(config),
    createdAt: Number(record.createdAt) || 0,
    updatedAt: Number(record.updatedAt) || 0,
    expiresAt: Number(record.expiresAt) || 0,
    deletedAt: Number(record.deletedAt) || 0,
    purgeAt: Number(record.purgeAt) || 0,
    archiveAt: normalizedStatus === "trash" ? Number(record.archiveAt) || getTrashArchiveAt(record) : 0,
    archivedAt: Number(record.archivedAt) || 0,
    archiveReason: record.archiveReason || "",
    restoredAt: Number(record.restoredAt) || 0,
    sourceKey: `${normalizedStatus === "active" ? SHARE_KEY_PREFIX : normalizedStatus === "trash" ? TRASH_KEY_PREFIX : ARCHIVE_KEY_PREFIX}${record.id}`,
    lastSyncedAt: Date.now()
  };
}

export async function deleteD1Link(env, shareId, options = {}) {
  if (!isValidShareId(shareId)) {
    return;
  }

  const runner = options.required ? runD1Required : runD1;
  await runner(env, (db) =>
    db.prepare("DELETE FROM leave_links WHERE id = ?").bind(shareId).run()
  );
}

export async function deleteD1LinkForOwnerStatus(env, shareId, usernameInput, status) {
  const ownerNorms = getAdminOwnerNorms(usernameInput);
  if (!isValidShareId(shareId) || !ownerNorms.length || !status) {
    return false;
  }

  const placeholders = ownerNorms.map(() => "?").join(", ");
  const result = await runD1(env, (db) =>
    db.prepare(`DELETE FROM leave_links WHERE id = ? AND owner_norm IN (${placeholders}) AND status = ?`)
      .bind(shareId, ...ownerNorms, status)
      .run()
  );

  return Boolean(result?.meta?.changes);
}

async function upsertD1AdminAccount(env, record, source = "kv", editable = true) {
  const username = normalizeAdminUsername(record?.username);
  if (!username) {
    return;
  }

  const now = Date.now();
  await runD1(env, (db) =>
    db.prepare(
      `INSERT INTO admin_accounts (
        username, username_norm, source, editable, created_at, created_by,
        updated_at, updated_by, deleted_at, deleted_by, last_synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, '', ?)
      ON CONFLICT(username_norm) DO UPDATE SET
        username = excluded.username,
        source = excluded.source,
        editable = excluded.editable,
        created_at = excluded.created_at,
        created_by = excluded.created_by,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by,
        deleted_at = 0,
        deleted_by = '',
        last_synced_at = excluded.last_synced_at`
    ).bind(
      username,
      username.toLowerCase(),
      source || "kv",
      editable ? 1 : 0,
      Number(record.createdAt) || 0,
      record.createdBy || "",
      Number(record.updatedAt) || 0,
      record.updatedBy || "",
      now
    ).run()
  );
}

async function markD1AdminDeleted(env, usernameInput, deletedAt = Date.now(), deletedBy = "") {
  const username = normalizeAdminUsername(usernameInput);
  if (!username) {
    return;
  }

  const now = Date.now();
  await runD1(env, (db) =>
    db.prepare(
      `INSERT INTO admin_accounts (
        username, username_norm, source, editable, deleted_at, deleted_by, last_synced_at
      ) VALUES (?, ?, 'deleted', 0, ?, ?, ?)
      ON CONFLICT(username_norm) DO UPDATE SET
        deleted_at = excluded.deleted_at,
        deleted_by = excluded.deleted_by,
        last_synced_at = excluded.last_synced_at`
    ).bind(username, username.toLowerCase(), Number(deletedAt) || now, deletedBy || "", now).run()
  );
}

async function upsertD1AdminLogin(env, usernameInput, loginAt, accessInfo = {}) {
  const username = normalizeAdminUsername(usernameInput);
  const lastLoginAt = Number(loginAt) || 0;
  if (!username || !lastLoginAt) {
    return;
  }

  const now = Date.now();
  await runD1(env, (db) =>
    db.prepare(
      `INSERT INTO admin_logins (
        username_norm, username, last_login_at, last_access_ip, last_access_user_agent, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(username_norm) DO UPDATE SET
        username = excluded.username,
        last_login_at = MAX(admin_logins.last_login_at, excluded.last_login_at),
        last_access_ip = CASE
          WHEN excluded.last_login_at >= admin_logins.last_login_at THEN excluded.last_access_ip
          ELSE admin_logins.last_access_ip
        END,
        last_access_user_agent = CASE
          WHEN excluded.last_login_at >= admin_logins.last_login_at THEN excluded.last_access_user_agent
          ELSE admin_logins.last_access_user_agent
        END,
        updated_at = excluded.updated_at`
    ).bind(
      username.toLowerCase(),
      username,
      lastLoginAt,
      sanitizeMetadataValue(accessInfo.ip || ""),
      sanitizeMetadataValue(accessInfo.userAgent || ""),
      now
    ).run()
  );
}

async function upsertD1AdminLinkStats(env, usernameInput, generatedLinkCount, updatedAt = Date.now()) {
  const username = normalizeAdminUsername(usernameInput);
  if (!username) {
    return;
  }

  await runD1(env, (db) =>
    db.prepare(
      `INSERT INTO admin_link_stats (
        username_norm, username, generated_link_count, updated_at
      ) VALUES (?, ?, ?, ?)
      ON CONFLICT(username_norm) DO UPDATE SET
        username = excluded.username,
        generated_link_count = MAX(admin_link_stats.generated_link_count, excluded.generated_link_count),
        updated_at = MAX(admin_link_stats.updated_at, excluded.updated_at)`
    ).bind(
      username.toLowerCase(),
      username,
      Math.max(0, Number(generatedLinkCount) || 0),
      Number(updatedAt) || Date.now()
    ).run()
  );
}

async function queryD1AdminAccounts(env) {
  const synced = await syncD1FromKV(env);
  if (!synced) {
    return null;
  }

  return runD1(env, async (db) => {
    const result = await db.prepare(
      `SELECT username, source, editable, created_at, created_by, updated_at, updated_by
       FROM admin_accounts
       WHERE deleted_at = 0
       ORDER BY CASE WHEN source = 'kv' THEN 1 ELSE 0 END, lower(username) ASC`
    ).all();
    return (result.results || []).map((row) => ({
      username: row.username || "",
      source: row.source || "kv",
      editable: Boolean(row.editable),
      createdAt: Number(row.created_at) || 0,
      createdAtBeijing: row.created_at ? formatBeijingDateTime(Number(row.created_at) || 0) : "",
      createdBy: row.created_by || "",
      updatedAt: Number(row.updated_at) || 0,
      updatedAtBeijing: row.updated_at ? formatBeijingDateTime(Number(row.updated_at) || 0) : "",
      updatedBy: row.updated_by || ""
    }));
  }, null);
}

async function queryD1AdminLinkCounts(env, usernameInput) {
  const ownerNorms = getAdminOwnerNorms(usernameInput);
  if (!ownerNorms.length) {
    return null;
  }

  const db = await ensureD1Schema(env);
  if (!db) {
    return null;
  }

  try {
    const placeholders = ownerNorms.map(() => "?").join(", ");
    const counts = await db.prepare(
      `SELECT
        COUNT(*) AS historical_count,
        COALESCE(SUM(CASE WHEN status = 'active' AND (expires_at = 0 OR expires_at > ?) THEN 1 ELSE 0 END), 0) AS current_count
       FROM leave_links
       WHERE owner_norm IN (${placeholders})`
    ).bind(Date.now(), ...ownerNorms).first();
    const stats = await db.prepare(
      `SELECT MAX(generated_link_count) AS generated_link_count
       FROM admin_link_stats
       WHERE username_norm IN (${placeholders})`
    ).bind(...ownerNorms).first();

    const knownHistoricalCount = Math.max(
      Number(counts?.historical_count) || 0,
      Number(stats?.generated_link_count) || 0
    );

    return {
      knownHistoricalCount,
      currentCount: Number(counts?.current_count) || 0
    };
  } catch (error) {
    console.error("D1 operation failed:", error);
    return null;
  }
}

async function queryD1AdminLastLoginAt(env, usernameInput) {
  const ownerNorms = getAdminOwnerNorms(usernameInput);
  if (!ownerNorms.length) {
    return null;
  }

  const db = await ensureD1Schema(env);
  if (!db) {
    return null;
  }

  try {
    const placeholders = ownerNorms.map(() => "?").join(", ");
    const row = await db.prepare(
      `SELECT MAX(last_login_at) AS last_login_at
       FROM admin_logins
       WHERE username_norm IN (${placeholders})`
    ).bind(...ownerNorms).first();
    return Number(row?.last_login_at) || 0;
  } catch (error) {
    console.error("D1 operation failed:", error);
    return null;
  }
}

export async function listD1LinkSummaries(env, url, usernameInput, status) {
  const ownerNorms = getAdminOwnerNorms(usernameInput);
  if (!ownerNorms.length) {
    return null;
  }

  const db = await ensureD1Schema(env);
  if (!db) {
    return null;
  }

  try {
    const orderColumn =
      status === "archive" ? "archived_at" : status === "trash" ? "deleted_at" : "updated_at";
    const placeholders = ownerNorms.map(() => "?").join(", ");
    const result = await db.prepare(
      `SELECT id, user_name, start_time, end_time, url, expires_at, updated_at,
        deleted_at, purge_at, archive_at, archived_at, archive_reason
       FROM leave_links
       WHERE owner_norm IN (${placeholders}) AND status = ?
       ORDER BY ${orderColumn} DESC, updated_at DESC, created_at DESC`
    ).bind(...ownerNorms, status).all();

    return (result.results || []).map((row) => {
      const item = {
        id: row.id || "",
        userName: row.user_name || "",
        startTime: row.start_time || "",
        endTime: row.end_time || "",
        expiresAt: Number(row.expires_at) || 0,
        expiresAtBeijing: row.expires_at ? formatBeijingDateTime(Number(row.expires_at) || 0) : "",
        url: row.url || buildShareUrl(row.id || "")
      };

      if (status === "active") {
        item.updatedAt = Number(row.updated_at) || 0;
        item.updatedAtBeijing = row.updated_at ? formatBeijingDateTime(Number(row.updated_at) || 0) : "";
        return item;
      }

      if (status === "trash") {
        item.deletedAt = Number(row.deleted_at) || 0;
        item.deletedAtBeijing = row.deleted_at ? formatBeijingDateTime(Number(row.deleted_at) || 0) : "";
        item.purgeAt = Number(row.purge_at) || 0;
        item.purgeAtBeijing = row.purge_at ? formatBeijingDateTime(Number(row.purge_at) || 0) : "";
        item.archiveAt = Number(row.archive_at) || 0;
        item.archiveAtBeijing = row.archive_at ? formatBeijingDateTime(Number(row.archive_at) || 0) : "";
        return item;
      }

      item.deletedAt = Number(row.deleted_at) || 0;
      item.deletedAtBeijing = row.deleted_at ? formatBeijingDateTime(Number(row.deleted_at) || 0) : "";
      item.purgeAt = Number(row.purge_at) || 0;
      item.purgeAtBeijing = row.purge_at ? formatBeijingDateTime(Number(row.purge_at) || 0) : "";
      item.archivedAt = Number(row.archived_at) || 0;
      item.archivedAtBeijing = row.archived_at ? formatBeijingDateTime(Number(row.archived_at) || 0) : "";
      item.archiveReason = row.archive_reason || "";
      item.archiveReasonText = getArchiveReasonText(item.archiveReason);
      return item;
    });
  } catch (error) {
    console.error("D1 operation failed:", error);
    return null;
  }
}

async function isAdminDeletedOverride(env, username) {
  for (const name of getAdminPrincipalNames(username)) {
    if (await env.LEAVE_STATUS_DATA.get(adminDeletedKey(name))) {
      return true;
    }
  }
  return false;
}

function getSecretAdminAccounts(env) {
  const accounts = [];
  if (env.ADMIN_USERNAME) {
    accounts.push({
      username: normalizeAdminUsername(env.ADMIN_USERNAME),
      source: "secret"
    });
  }

  for (const account of parseAdditionalAdminAccounts(env.ADMIN_ACCOUNTS_JSON)) {
    accounts.push({
      ...account,
      source: "secret"
    });
  }

  const seen = new Set();
  return accounts.filter((account) => {
    if (!account.username) {
      return false;
    }

    const key = account.username.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function parseAdditionalAdminAccounts(value) {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => ({
        username: normalizeAdminUsername(item?.username || item?.email),
        email: normalizeAccessEmail(item?.email)
      }))
      .filter((item) => item.username);
  } catch (error) {
    console.error("Failed to parse ADMIN_ACCOUNTS_JSON:", error);
    return [];
  }
}

function hasSecretAdminAccount(env, username) {
  const usernames = new Set(getAdminPrincipalNames(username).map((item) => item.toLowerCase()));
  return getSecretAdminAccounts(env).some((account) =>
    usernames.has(account.username.toLowerCase())
  );
}

async function adminAccountExists(env, username) {
  const normalizedUsername = getCanonicalAdminUsername(username);
  if (!normalizedUsername) {
    return false;
  }

  if (await getStoredAdminCredential(env, normalizedUsername)) {
    return true;
  }

  return hasSecretAdminAccount(env, normalizedUsername) &&
    !(await isAdminDeletedOverride(env, normalizedUsername));
}

async function getAdminAccountForAccessEmail(env, emailInput) {
  const email = normalizeAccessEmail(emailInput);
  if (!isValidAdminEmail(email)) {
    return null;
  }

  for (const name of getAdminPrincipalNames(email)) {
    const record = await getStoredAdminCredentialByKey(env, adminKey(name));
    if (!record || !adminRecordAllowsAccessEmail(record, email)) {
      continue;
    }

    const canonicalRecord = canonicalizeAdminRecord(record);
    if (!(await isAdminDeletedOverride(env, canonicalRecord.username))) {
      return canonicalRecord;
    }
  }

  for (const account of getSecretAdminAccounts(env)) {
    const canonicalAccount = canonicalizeAdminRecord(account);
    if (
      adminRecordAllowsAccessEmail(canonicalAccount, email) &&
      !(await isAdminDeletedOverride(env, canonicalAccount.username)) &&
      !(await getStoredAdminCredential(env, canonicalAccount.username))
    ) {
      return canonicalAccount;
    }
  }

  return null;
}

async function getStoredAdminCredential(env, username) {
  for (const name of getAdminPrincipalNames(username)) {
    const record = await getStoredAdminCredentialByKey(env, adminKey(name));
    if (record) {
      return canonicalizeAdminRecord(record);
    }
  }
  return null;
}

async function getStoredAdminCredentialByKey(env, key) {
  const raw = await env.LEAVE_STATUS_DATA.get(key);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.username) {
      return null;
    }

    return {
      ...parsed,
      username: normalizeAdminUsername(parsed.username),
      createdAt: Number(parsed.createdAt) || 0
    };
  } catch (error) {
    console.error("Failed to parse admin credential:", error);
    return null;
  }
}

export function isValidAdminUsername(value) {
  const normalized = normalizeAdminUsername(value);
  return isValidAdminEmail(normalized) || /^[A-Za-z0-9._-]{3,64}$/.test(normalized);
}

export async function getSession(request, env, ctx) {
  const accessSession = await getCloudflareAccessAdminSession(request, env);
  if (accessSession) {
    scheduleAdminAccessRecord(request, env, ctx, accessSession.username);
    return accessSession;
  }

  if (env.CF_ACCESS_ADMIN_AUD || ADMIN_ACCESS_AUD) {
    return null;
  }

  const sessionToken = getCookie(request.headers.get("Cookie"), COOKIE_NAME);
  if (!sessionToken) {
    return null;
  }

  const raw = await env.LEAVE_STATUS_DATA.get(sessionKey(sessionToken));
  if (!raw) {
    return null;
  }

  try {
    const session = JSON.parse(raw);
    if (!session) {
      await env.LEAVE_STATUS_DATA.delete(sessionKey(sessionToken));
      return null;
    }

    if (!session.permanent && (!session.expiresAt || session.expiresAt <= Date.now())) {
      await env.LEAVE_STATUS_DATA.delete(sessionKey(sessionToken));
      return null;
    }

    if (!(await adminAccountExists(env, session.username))) {
      await env.LEAVE_STATUS_DATA.delete(sessionKey(sessionToken));
      return null;
    }

    scheduleAdminAccessRecord(request, env, ctx, session.username);
    return session;
  } catch (error) {
    console.error("Failed to parse session:", error);
    await env.LEAVE_STATUS_DATA.delete(sessionKey(sessionToken));
    return null;
  }
}

export async function requireSession(request, env, ctx) {
  const session = await getSession(request, env, ctx);
  if (!session) {
    return json(
      {
        ok: false,
        error: "unauthorized",
        message: "请先登录后台。"
      },
      { status: 401 }
    );
  }

  return session;
}

async function deleteArchiveRecordsForOwner(env, username) {
  let cursor;

  do {
    const page = await env.LEAVE_STATUS_DATA.list({
      prefix: ARCHIVE_KEY_PREFIX,
      cursor,
      limit: 100
    });

    for (const key of page.keys) {
      const id = key.name.slice(ARCHIVE_KEY_PREFIX.length);
      const metadata = key.metadata || {};
      let owner = metadata.createdBy || "";
      if (!owner) {
        const record = await getArchiveRecord(env, id);
        owner = getRecordOwner(record, env);
      }

      if (adminOwnerMatches(owner, username)) {
        await env.LEAVE_STATUS_DATA.delete(key.name);
        await deleteD1Link(env, id);
      }
    }

    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
}

async function deleteTrashRecordsForOwner(env, username) {
  let cursor;

  do {
    const page = await env.LEAVE_STATUS_DATA.list({
      prefix: TRASH_KEY_PREFIX,
      cursor,
      limit: 100
    });

    for (const key of page.keys) {
      const id = key.name.slice(TRASH_KEY_PREFIX.length);
      const metadata = key.metadata || {};
      let owner = metadata.createdBy || "";
      if (!owner) {
        const record = await readTrashRecord(env, id);
        owner = getRecordOwner(record, env);
      }

      if (adminOwnerMatches(owner, username)) {
        await env.LEAVE_STATUS_DATA.delete(key.name);
        await deleteD1Link(env, id);
      }
    }

    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
}

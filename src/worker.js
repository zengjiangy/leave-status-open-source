import { DEFAULT_CONFIG, EMPTY_CONFIG } from "./default-config.js";
import { renderSuperLoginPage } from "./super-login-page.js";
import {
  adminOwnerMatches,
  clearAdminArchiveStorage,
  configureAdminRuntimeDeps,
  configureRuntimeEnv,
  createAdminAccount,
  deleteAdminAccount,
  deleteD1Link,
  deleteD1LinkForOwnerStatus,
  ensureD1Schema,
  enforceAdminGeneratedLinkLimit,
  getAdminAccountDetails,
  getAdminOwnerNorms,
  getAdminTemplateConfig,
  getArchiveStorageStatus,
  getD1UsageStatus,
  getR2UsageStatus,
  getSession,
  getSuperSession,
  handleLoginAuth,
  handleLogout,
  handleSuperLoginAuth,
  handleSuperLogout,
  incrementAdminGeneratedLinkCount,
  listAdminAccounts,
  listD1LinkSummaries,
  persistAdminTemplateConfig,
  requireSession,
  requireSuperSession,
  syncCloudflareAdminAccessPolicy,
  updateAdminAccountSettings,
  upsertD1LinkRecord
} from "./admin.js";
import {
  buildObjectUrl,
  handleAttachmentUpload,
  handleCompletionAttachmentUpload,
  handlePublicUploadRequest,
  sanitizeMetadataValue
} from "./attachments.js";
import {
  normalizeAttachmentUrls,
  normalizeConfig
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
  assetRequest,
  html,
  json,
  jsonWithCookies,
  methodNotAllowed,
  notFound,
  shareStatusPage,
  withHeaders,
  withSecurityHeaders
} from "./http.js";
import {
  adminDeletedKey,
  adminKey,
  adminLinkLimitKey,
  adminLinkStatsKey,
  adminLoginKey,
  adminTemplateKey,
  archiveKey,
  clearSessionCookie,
  clearSuperSessionCookie,
  clone,
  formatBeijingDateTime,
  getCookie,
  isValidShareId,
  normalizeAdminUsername,
  parseBeijingDateTime,
  randomHex,
  readJson,
  safeEquals,
  sessionKey,
  shareKey,
  superSessionKey,
  trashKey
} from "./utils.js";

configureAdminRuntimeDeps({
  getShareRecord,
  getTrashRecord,
  readTrashRecord,
  getArchiveRecord,
  getRecordOwner,
  recordBelongsToUser,
  getRecordAttachmentUrls,
  getAttachmentStorageKeyFromUrl,
  findAttachmentReferencesOutsideRecords,
  buildShareUrl,
  getTrashArchiveAt,
  getArchiveReasonText
});

export default {
  async fetch(request, env, ctx) {
    try {
      configureRuntimeEnv(env);
      return withSecurityHeaders(await routeRequest(request, env, ctx));
    } catch (error) {
      console.error("Unhandled request error:", error);
      return withSecurityHeaders(json(
        {
          ok: false,
          error: "server_error",
          message: "服务器处理请求失败，请稍后重试。"
        },
        { status: 500 }
      ));
    }
  }
};

async function routeRequest(request, env, ctx) {
  const url = new URL(request.url);
  const host = normalizeHostname(url.hostname);
  const path =
    url.pathname
      .replace(/\/{2,}/g, "/")
      .replace(/\/+$/, "") || "/";

  if (path === "/admin-sw.js" || path === "/admin-update.js") {
    if (!isAdminHost(host)) {
      return notFound("未找到对应页面。");
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return methodNotAllowed(["GET", "HEAD"]);
    }
    const response = await env.ASSETS.fetch(assetRequest(request, path));
    return withHeaders(response, {
      "Cache-Control": path === "/admin-sw.js" ? "no-store, max-age=0" : ADMIN_STATIC_CACHE_CONTROL
    });
  }

  if (
    path === SUPER_LOGIN_PATH ||
    path.startsWith(`${SUPER_LOGIN_API_PREFIX}/`) ||
    path === SUPER_LOGIN_API_PREFIX
  ) {
    if (!isAdminHost(host)) {
      return notFound("未找到对应页面。");
    }
    return handleSuperLoginRequest(request, env, path, url);
  }

  if (
    path === LOGIN_PATH ||
    LOGIN_STATIC_PATHS.has(path) ||
    path.startsWith(`${LOGIN_API_PREFIX}/`) ||
    path === LOGIN_API_PREFIX
  ) {
    if (!isAdminHost(host)) {
      return notFound("未找到对应页面。");
    }
    return handleLoginRequest(request, env, path, url, ctx);
  }

  if (
    path === LINK_HISTORY_PATH ||
    LINK_HISTORY_STATIC_PATHS.has(path) ||
    path.startsWith(`${LINK_HISTORY_API_PREFIX}/`) ||
    path === LINK_HISTORY_API_PREFIX
  ) {
    if (!isAdminHost(host)) {
      return notFound("未找到对应页面。");
    }
    return handleLinkHistoryRequest(request, env, path, url, ctx);
  }

  if (path === PUBLIC_UPLOAD_PREFIX || path.startsWith(`${PUBLIC_UPLOAD_PREFIX}/`)) {
    return handlePublicUploadRequest(request, env, path, {
      publicPrefix: PUBLIC_UPLOAD_PREFIX
    });
  }

  if (
    path === PUBLIC_COMPLETION_UPLOAD_PREFIX ||
    path.startsWith(`${PUBLIC_COMPLETION_UPLOAD_PREFIX}/`)
  ) {
    return handlePublicUploadRequest(request, env, path, {
      publicPrefix: PUBLIC_COMPLETION_UPLOAD_PREFIX
    });
  }

  if (
    path === ROOT_SHARE_PATH ||
    path === ROOT_SHARE_INDEX_PATH ||
    path === ROOT_SHARE_DATA_PATH ||
    ROOT_SHARE_ASSET_MAP.has(path) ||
    path === SHARE_PREFIX ||
    path === SHARE_INDEX_PATH ||
    path === SHARE_DATA_PATH ||
    path.startsWith(`${SHARE_PREFIX}/`)
  ) {
    return handleShareRequest(request, env, path, url);
  }

  return notFound("未找到对应页面。");
}

function normalizeHostname(value) {
  return String(value || "").trim().toLowerCase().replace(/\.$/, "");
}

function isAdminHost(hostname) {
  const host = normalizeHostname(hostname);
  return (
    host === SHARE_ROOT_DOMAIN ||
    host === `${DEFAULT_SHARE_SUBDOMAIN}.${SHARE_ROOT_DOMAIN}`
  );
}

async function handleSuperLoginRequest(request, env, path, url) {
  if (path === SUPER_LOGIN_PATH) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return methodNotAllowed(["GET", "HEAD"]);
    }

    return html(request.method === "HEAD" ? "" : renderSuperLoginPage(SUPER_LOGIN_API_PREFIX), {
      headers: {
        "Cache-Control": ADMIN_PAGE_CACHE_CONTROL
      }
    });
  }

  if (path === `${SUPER_LOGIN_API_PREFIX}/auth`) {
    if (request.method !== "POST") {
      return methodNotAllowed(["POST"]);
    }

    return handleSuperLoginAuth(request, env);
  }

  if (path === `${SUPER_LOGIN_API_PREFIX}/logout`) {
    if (request.method !== "POST") {
      return methodNotAllowed(["POST"]);
    }

    return handleSuperLogout(request, env);
  }

  if (path === `${SUPER_LOGIN_API_PREFIX}/session`) {
    if (request.method !== "GET") {
      return methodNotAllowed(["GET"]);
    }

    const session = await getSuperSession(request, env);
    return json({
      ok: true,
      authenticated: Boolean(session),
      username: session?.username ?? null
    });
  }

  if (path === `${SUPER_LOGIN_API_PREFIX}/admins`) {
    const session = await requireSuperSession(request, env);
    if (session instanceof Response) {
      return session;
    }

    if (request.method === "GET") {
      return json({
        ok: true,
        items: await listAdminAccounts(env)
      });
    }

    if (request.method === "POST") {
      const payload = await readJson(request);
      return createAdminAccount(payload, env, session.username);
    }

    return methodNotAllowed(["GET", "POST"]);
  }

  if (path === `${SUPER_LOGIN_API_PREFIX}/admins/sync-access`) {
    const session = await requireSuperSession(request, env);
    if (session instanceof Response) {
      return session;
    }

    if (request.method === "POST") {
      const syncError = await syncCloudflareAdminAccessPolicy(env);
      if (syncError) {
        return syncError;
      }

      return json({
        ok: true,
        syncedAt: Date.now()
      });
    }

    return methodNotAllowed(["POST"]);
  }

  if (path === `${SUPER_LOGIN_API_PREFIX}/usage/r2`) {
    const session = await requireSuperSession(request, env);
    if (session instanceof Response) {
      return session;
    }

    if (request.method === "GET") {
      return getR2UsageStatus(env);
    }

    return methodNotAllowed(["GET"]);
  }

  if (path === `${SUPER_LOGIN_API_PREFIX}/usage/d1`) {
    const session = await requireSuperSession(request, env);
    if (session instanceof Response) {
      return session;
    }

    if (request.method === "GET") {
      return getD1UsageStatus(env);
    }

    return methodNotAllowed(["GET"]);
  }

  if (path === `${SUPER_LOGIN_API_PREFIX}/archive-storage`) {
    const session = await requireSuperSession(request, env);
    if (session instanceof Response) {
      return session;
    }

    if (request.method === "GET") {
      return getArchiveStorageStatus(env);
    }

    return methodNotAllowed(["GET"]);
  }

  if (path === `${SUPER_LOGIN_API_PREFIX}/archive-storage/clear`) {
    const session = await requireSuperSession(request, env);
    if (session instanceof Response) {
      return session;
    }

    if (request.method === "POST") {
      const payload = await readJson(request);
      return clearAdminArchiveStorage(payload.username, env);
    }

    return methodNotAllowed(["POST"]);
  }

  if (path.startsWith(`${SUPER_LOGIN_API_PREFIX}/admins/`)) {
    const session = await requireSuperSession(request, env);
    if (session instanceof Response) {
      return session;
    }

    const adminPath = path.slice(`${SUPER_LOGIN_API_PREFIX}/admins/`.length);
    if (adminPath.endsWith("/details")) {
      const username = decodeURIComponent(adminPath.slice(0, -"/details".length));
      if (request.method === "GET") {
        return getAdminAccountDetails(username, env);
      }

      return methodNotAllowed(["GET"]);
    }

    const username = decodeURIComponent(adminPath);
    if (request.method === "PUT") {
      const payload = await readJson(request);
      return updateAdminAccountSettings(username, payload, env, session.username);
    }

    if (request.method === "DELETE") {
      return deleteAdminAccount(username, env, session.username);
    }

    return methodNotAllowed(["PUT", "DELETE"]);
  }

  return notFound("super admin endpoint not found.");
}

async function handleLoginRequest(request, env, path, url, ctx) {
  if (LOGIN_STATIC_PATHS.has(path)) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return methodNotAllowed(["GET", "HEAD"]);
    }

    const response = await env.ASSETS.fetch(request);
    return withHeaders(response, {
      "Cache-Control": ADMIN_STATIC_CACHE_CONTROL
    });
  }

  if (path === LOGIN_PATH) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return methodNotAllowed(["GET", "HEAD"]);
    }

    const response = await env.ASSETS.fetch(assetRequest(request, LOGIN_ASSET_PATH));
    return withHeaders(response, {
      "Cache-Control": ADMIN_PAGE_CACHE_CONTROL,
      Link: LOGIN_PRELOAD_LINK_HEADER
    });
  }

  if (path === `${LOGIN_API_PREFIX}/auth`) {
    if (request.method !== "POST") {
      return methodNotAllowed(["POST"]);
    }

    return handleLoginAuth(request, env);
  }

  if (path === `${LOGIN_API_PREFIX}/logout`) {
    if (request.method !== "POST") {
      return methodNotAllowed(["POST"]);
    }

    return handleLogout(request, env);
  }

  if (path === `${LOGIN_API_PREFIX}/session`) {
    if (request.method !== "GET") {
      return methodNotAllowed(["GET"]);
    }

    const session = await getSession(request, env, ctx);
    return json({
      ok: true,
      authenticated: Boolean(session),
      username: session?.username ?? null
    });
  }

  if (path === `${LOGIN_API_PREFIX}/template`) {
    if (request.method !== "GET") {
      return methodNotAllowed(["GET"]);
    }

    const session = await requireSession(request, env, ctx);
    if (session instanceof Response) {
      return session;
    }

    return json({
      ok: true,
      config: await getAdminTemplateConfig(env, session.username)
    });
  }

  if (path === LOGIN_UPLOADS_PATH) {
    const session = await requireSession(request, env, ctx);
    if (session instanceof Response) {
      return session;
    }

    if (request.method !== "POST") {
      return methodNotAllowed(["POST"]);
    }

    return handleAttachmentUpload(request, env, session.username);
  }

  if (path === LOGIN_COMPLETION_UPLOADS_PATH) {
    const session = await requireSession(request, env, ctx);
    if (session instanceof Response) {
      return session;
    }

    if (request.method !== "POST") {
      return methodNotAllowed(["POST"]);
    }

    return handleCompletionAttachmentUpload(request, env, session.username);
  }

  if (path === `${LOGIN_API_PREFIX}/trash`) {
    const session = await requireSession(request, env, ctx);
    if (session instanceof Response) {
      return session;
    }

    if (request.method === "GET") {
      return json({
        ok: true,
        items: await listTrashSummaries(env, url, session.username)
      });
    }

    return methodNotAllowed(["GET"]);
  }

  if (path === `${LOGIN_API_PREFIX}/trash/restore`) {
    const session = await requireSession(request, env, ctx);
    if (session instanceof Response) {
      return session;
    }

    if (request.method !== "POST") {
      return methodNotAllowed(["POST"]);
    }

    const payload = await readJson(request);
    const shareId = url.searchParams.get("id") || payload.id;
    return restoreShare(shareId, env, session.username, url);
  }

  if (path === `${LOGIN_API_PREFIX}/shares`) {
    const session = await requireSession(request, env, ctx);
    if (session instanceof Response) {
      return session;
    }

    if (request.method === "GET") {
      return json({
        ok: true,
        items: await listShareSummaries(env, url, session.username)
      });
    }

    if (request.method === "POST") {
      const payload = await readJson(request);
      return createShare(payload, env, session.username, url);
    }

    if (request.method === "DELETE") {
      const shareId = url.searchParams.get("id");
      if (!isValidShareId(shareId)) {
        return json(
          { ok: false, error: "invalid_id", message: "分享链接 ID 无效。" },
          { status: 400 }
        );
      }

      return destroyShare(shareId, env, session.username, url);
    }

    return methodNotAllowed(["GET", "POST", "DELETE"]);
  }

  if (path.startsWith(`${LOGIN_API_PREFIX}/shares/`)) {
    const session = await requireSession(request, env, ctx);
    if (session instanceof Response) {
      return session;
    }

    const shareId = path.slice(`${LOGIN_API_PREFIX}/shares/`.length);
    if (!isValidShareId(shareId)) {
      return json(
        { ok: false, error: "invalid_id", message: "分享链接 ID 无效。" },
        { status: 400 }
      );
    }

    if (request.method === "PUT") {
      const payload = await readJson(request);
      return updateShare(shareId, payload, env, session.username, url);
    }

    if (request.method !== "GET") {
      return methodNotAllowed(["GET", "PUT"]);
    }

    const record = await getShareRecordForOwner(env, shareId, session.username);
    if (!record) {
      return json(
        { ok: false, error: "not_found", message: "找不到对应的分享版本。" },
        { status: 404 }
      );
    }

    return json({
      ok: true,
      item: serializeShareRecord(record, url)
    });
  }

  return notFound("未找到对应后台接口。");
}

async function handleLinkHistoryRequest(request, env, path, url, ctx) {
  if (LINK_HISTORY_STATIC_PATHS.has(path)) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return methodNotAllowed(["GET", "HEAD"]);
    }

    const response = await env.ASSETS.fetch(request);
    return withHeaders(response, {
      "Cache-Control": ADMIN_STATIC_CACHE_CONTROL
    });
  }

  if (path === LINK_HISTORY_PATH) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return methodNotAllowed(["GET", "HEAD"]);
    }

    const response = await env.ASSETS.fetch(assetRequest(request, LINK_HISTORY_ASSET_PATH));
    return withHeaders(response, {
      "Cache-Control": ADMIN_PAGE_CACHE_CONTROL,
      Link: LINK_HISTORY_PRELOAD_LINK_HEADER
    });
  }

  if (path === `${LINK_HISTORY_API_PREFIX}/auth`) {
    if (request.method !== "POST") {
      return methodNotAllowed(["POST"]);
    }

    return handleLoginAuth(request, env);
  }

  if (path === `${LINK_HISTORY_API_PREFIX}/logout`) {
    if (request.method !== "POST") {
      return methodNotAllowed(["POST"]);
    }

    return handleLogout(request, env);
  }

  if (path === `${LINK_HISTORY_API_PREFIX}/session`) {
    if (request.method !== "GET") {
      return methodNotAllowed(["GET"]);
    }

    const session = await getSession(request, env, ctx);
    return json({
      ok: true,
      authenticated: Boolean(session),
      username: session?.username ?? null
    });
  }

  if (path === `${LINK_HISTORY_API_PREFIX}/items`) {
    const session = await requireSession(request, env, ctx);
    if (session instanceof Response) {
      return session;
    }

    if (request.method !== "GET") {
      return methodNotAllowed(["GET"]);
    }

    return json({
      ok: true,
      items: await listArchiveSummaries(env, url, session.username)
    });
  }

  if (path === `${LINK_HISTORY_API_PREFIX}/restore`) {
    const session = await requireSession(request, env, ctx);
    if (session instanceof Response) {
      return session;
    }

    if (request.method !== "POST") {
      return methodNotAllowed(["POST"]);
    }

    const payload = await readJson(request);
    const shareId = url.searchParams.get("id") || payload.id;
    return restoreArchivedShare(shareId, request, env, session.username, url);
  }

  return notFound("未找到对应封存库接口。");
}

async function handleShareRequest(request, env, path, url) {
  if (ROOT_SHARE_ASSET_MAP.has(path)) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return methodNotAllowed(["GET", "HEAD"]);
    }

    const response = await env.ASSETS.fetch(assetRequest(request, ROOT_SHARE_ASSET_MAP.get(path)));
    return withHeaders(response, {
      "Cache-Control": SHARE_STATIC_CACHE_CONTROL
    });
  }

  if (path === ROOT_SHARE_PATH || path === ROOT_SHARE_INDEX_PATH) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return methodNotAllowed(["GET", "HEAD"]);
    }

    const shareId = url.searchParams.get("id");
    if (shareId) {
      const validation = await getValidShareOrResponse(shareId, env);
      if (validation instanceof Response) {
        return validation;
      }
    }

    const response = await env.ASSETS.fetch(assetRequest(request, SHARE_SHELL_ASSET_PATH));
    return withHeaders(response, {
      "Cache-Control": "no-store",
      Link: ROOT_SHARE_PRELOAD_LINK_HEADER
    });
  }

  if (path === SHARE_PREFIX && request.method === "GET") {
    const redirectUrl = new URL(`${SHARE_PREFIX}/index.html`, url);
    redirectUrl.search = url.search;
    return Response.redirect(redirectUrl.toString(), 307);
  }

  if (path === SHARE_INDEX_PATH) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return methodNotAllowed(["GET", "HEAD"]);
    }

    const validation = await getValidShareOrResponse(url.searchParams.get("id"), env);
    if (validation instanceof Response) {
      return validation;
    }

    const response = await env.ASSETS.fetch(assetRequest(request, SHARE_SHELL_ASSET_PATH));
    return withHeaders(response, {
      "Cache-Control": "no-store",
      Link: SHARE_PRELOAD_LINK_HEADER
    });
  }

  if (path === SHARE_DATA_PATH || path === ROOT_SHARE_DATA_PATH) {
    if (request.method !== "GET") {
      return methodNotAllowed(["GET"]);
    }

    const validation = await getValidShareOrResponse(url.searchParams.get("id"), env, true);
    if (validation instanceof Response) {
      return validation;
    }

    return json({
      ok: true,
      config: normalizeConfig(validation.config),
      expiresAt: validation.expiresAt,
      expiresAtBeijing: formatBeijingDateTime(validation.expiresAt)
    });
  }

  if (SHARE_STATIC_PATHS.has(path)) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return methodNotAllowed(["GET", "HEAD"]);
    }

    const response = await env.ASSETS.fetch(request);
    return withHeaders(response, {
      "Cache-Control": SHARE_STATIC_CACHE_CONTROL
    });
  }

  const response = await env.ASSETS.fetch(request);
  if (response.status === 404) {
    return notFound("未找到分享页资源。");
  }

  return response;
}

async function createShare(payload, env, username, url) {
  const parsedPayload = parseSharePayload(payload);
  if (parsedPayload instanceof Response) {
    return parsedPayload;
  }

  const limitResponse = await enforceAdminGeneratedLinkLimit(env, username);
  if (limitResponse) {
    return limitResponse;
  }

  const requestedShareId = getRequestedShareIdOrResponse(payload);
  if (requestedShareId instanceof Response) {
    return requestedShareId;
  }

  const customSubdomain = getRequestedShareSubdomainOrResponse(payload);
  if (customSubdomain instanceof Response) {
    return customSubdomain;
  }

  if (requestedShareId && (await shareIdExists(env, requestedShareId))) {
    return json(
      { ok: false, error: "duplicate_id", message: "指定的子链接已存在，请换一个 32 位 ID。" },
      { status: 409 }
    );
  }

  const shareId = requestedShareId || (await generateUniqueShareId(env));
  const now = Date.now();
  const record = {
    id: shareId,
    config: parsedPayload.config,
    createdAt: now,
    updatedAt: now,
    expiresAt: parsedPayload.expiresAt,
    createdBy: username,
    customSubdomain
  };

  await persistShareRecord(env, record);
  await incrementAdminGeneratedLinkCount(env, username);
  await persistAdminTemplateConfig(env, username, parsedPayload.config);

  return json({
    ok: true,
    item: serializeShareRecord(record, url)
  });
}

async function updateShare(shareId, payload, env, username, url) {
  const existingRecord = await getShareRecordForOwner(env, shareId, username);
  if (!existingRecord) {
    return json(
      { ok: false, error: "not_found", message: "找不到对应的分享版本。" },
      { status: 404 }
    );
  }

  const parsedPayload = parseSharePayload(payload);
  if (parsedPayload instanceof Response) {
    return parsedPayload;
  }

  const customSubdomain = getRequestedShareSubdomainOrResponse(payload, existingRecord);
  if (customSubdomain instanceof Response) {
    return customSubdomain;
  }

  const record = {
    ...existingRecord,
    id: shareId,
    config: parsedPayload.config,
    expiresAt: parsedPayload.expiresAt,
    updatedAt: Date.now(),
    updatedBy: username,
    customSubdomain
  };

  await persistShareRecord(env, record);
  await persistAdminTemplateConfig(env, username, parsedPayload.config);

  return json({
    ok: true,
    item: serializeShareRecord(record, url)
  });
}

function parseSharePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return json(
      {
        ok: false,
        error: "invalid_payload",
        message: "请求体格式错误。"
      },
      { status: 400 }
    );
  }

  const expiresAt = parseBeijingDateTime(payload.expiresAtBeijing);
  if (!expiresAt) {
    return json(
      {
        ok: false,
        error: "invalid_expiry",
        message: "失效时间格式错误，请使用北京时间。"
      },
      { status: 400 }
    );
  }

  if (expiresAt <= Date.now() + MIN_EXPIRY_BUFFER_MS) {
    return json(
      {
        ok: false,
        error: "expiry_too_soon",
        message: "失效时间必须晚于当前北京时间至少 30 秒。"
      },
      { status: 400 }
    );
  }

  const config = normalizeConfig(payload.config);
  return {
    config,
    expiresAt
  };
}

function getRequestedShareIdOrResponse(payload) {
  const raw =
    typeof payload?.customShareUrl === "string"
      ? payload.customShareUrl.trim()
      : typeof payload?.customShareId === "string"
        ? payload.customShareId.trim()
        : "";

  if (!raw) {
    return "";
  }

  const shareId = extractShareId(raw);
  if (!isValidShareId(shareId)) {
    return json(
      {
        ok: false,
        error: "invalid_custom_id",
        message: "指定子链接必须包含 32 位十六进制 ID。"
      },
      { status: 400 }
    );
  }

  return shareId.toLowerCase();
}

function getRequestedShareSubdomainOrResponse(payload, existingRecord = null) {
  const hasCustomSubdomainEnabled = Object.prototype.hasOwnProperty.call(
    payload || {},
    "customSubdomainEnabled"
  );
  const hasCustomSubdomain = Object.prototype.hasOwnProperty.call(payload || {}, "customSubdomain");

  if (!hasCustomSubdomainEnabled && !hasCustomSubdomain) {
    return normalizeStoredShareSubdomain(existingRecord?.customSubdomain || "");
  }

  if (!payload?.customSubdomainEnabled) {
    return "";
  }

  const raw = typeof payload.customSubdomain === "string" ? payload.customSubdomain.trim() : "";
  if (!raw) {
    return json(
      {
        ok: false,
        error: "missing_custom_subdomain",
        message: "开启自定义二级域名后，请填写二级域名名称。"
      },
      { status: 400 }
    );
  }

  const customSubdomain = normalizeShareSubdomainInput(raw);
  if (!customSubdomain) {
    return json(
      {
        ok: false,
        error: "invalid_custom_subdomain",
        message: "二级域名名称只能包含字母、数字和短横线，长度 1-63 位，且不能以短横线开头或结尾。"
      },
      { status: 400 }
    );
  }

  return customSubdomain;
}

function normalizeStoredShareSubdomain(value) {
  return normalizeShareSubdomainInput(value);
}

function normalizeShareSubdomainInput(value) {
  let text = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!text) {
    return "";
  }

  const rootSuffix = `.${SHARE_ROOT_DOMAIN}`;
  try {
    const parsed = new URL(text.includes("://") ? text : `https://${text}`);
    text = parsed.hostname.toLowerCase();
  } catch {
    text = text.replace(/^https?:\/\//i, "").split(/[/?#]/)[0].toLowerCase();
  }

  if (text.endsWith(rootSuffix)) {
    text = text.slice(0, -rootSuffix.length);
  }

  if (!text || text.includes(".")) {
    return "";
  }

  return SHARE_SUBDOMAIN_PATTERN.test(text) ? text : "";
}

function extractShareId(value) {
  const text = typeof value === "string" ? value.trim() : "";
  if (isValidShareId(text)) {
    return text;
  }

  try {
    return new URL(text).searchParams.get("id") || "";
  } catch {
    const match = /(?:^|[?&])id=([0-9a-f]{32})(?:&|$)/i.exec(text);
    return match ? match[1] : "";
  }
}

async function persistIndexedLinkRecord(env, key, record, status, metadata) {
  const previousRaw = await env.LEAVE_STATUS_DATA.get(key);
  await upsertD1LinkRecord(env, record, status);

  try {
    await env.LEAVE_STATUS_DATA.put(key, JSON.stringify(record), { metadata });
  } catch (error) {
    await restoreD1LinkRecordAfterKVFailure(env, previousRaw, record.id, status);
    throw error;
  }
}

async function restoreD1LinkRecordAfterKVFailure(env, previousRaw, shareId, status) {
  try {
    if (previousRaw) {
      await upsertD1LinkRecord(env, JSON.parse(previousRaw), status);
    } else {
      await deleteD1Link(env, shareId, { required: true });
    }
  } catch (error) {
    console.error("Failed to restore D1 link after KV write failure:", error);
  }
}

async function persistShareRecord(env, record) {
  await persistIndexedLinkRecord(env, shareKey(record.id), record, "active", buildShareMetadata(record));
}

async function listShareSummaries(env, url, username) {
  const d1Items = await listD1LinkSummaries(env, url, username, "active");
  if (d1Items && d1Items.length > 0) {
    return d1Items;
  }

  return listShareSummariesFromKV(env, url, username);
}

function mergeShareSummaries(...groups) {
  const merged = new Map();
  for (const group of groups) {
    for (const item of Array.isArray(group) ? group : []) {
      if (isValidShareId(item?.id || "")) {
        merged.set(item.id, item);
      }
    }
  }

  return Array.from(merged.values())
    .sort((left, right) => (right.updatedAt || 0) - (left.updatedAt || 0));
}

async function reconcileActiveD1LinkSummaries(env, username, items) {
  const reconciledItems = [];

  for (const item of items) {
    const id = item?.id || "";
    if (!isValidShareId(id)) {
      continue;
    }

    const record = await getShareRecord(env, id);
    if (!record || !recordBelongsToUser(record, username, env)) {
      await deleteD1LinkForOwnerStatus(env, id, username, "active");
      continue;
    }

    reconciledItems.push(serializeShareSummary(record));
  }

  reconciledItems.sort((left, right) => (right.updatedAt || 0) - (left.updatedAt || 0));
  return reconciledItems;
}

async function listShareSummariesFromKV(env, url, username) {
  const items = [];
  let cursor;

  do {
    const page = await env.LEAVE_STATUS_DATA.list({
      prefix: SHARE_KEY_PREFIX,
      cursor,
      limit: 100
    });

    for (const key of page.keys) {
      if (!key.name.startsWith(SHARE_KEY_PREFIX)) {
        continue;
      }

      const id = key.name.slice(SHARE_KEY_PREFIX.length);
      const metadata = key.metadata || {};
      let record = null;
      let owner = metadata.createdBy || "";
      if (!owner || !metadata.userName || !metadata.expiresAt || !metadata.updatedAt) {
        record = await getShareRecord(env, id);
        owner = getRecordOwner(record, env);
      }
      if (!adminOwnerMatches(owner, username)) {
        continue;
      }

      const config = record?.config || {};
      const expiresAt = Number(metadata.expiresAt) || Number(record?.expiresAt) || 0;
      const updatedAt = Number(metadata.updatedAt) || Number(record?.updatedAt) || 0;

      items.push({
        id,
        userName: metadata.userName || config.userName || "",
        startTime: metadata.startTime || config.startTime || "",
        endTime: metadata.endTime || config.endTime || "",
        expiresAt,
        expiresAtBeijing: expiresAt ? formatBeijingDateTime(expiresAt) : "",
        updatedAt,
        updatedAtBeijing: updatedAt ? formatBeijingDateTime(updatedAt) : "",
        url: buildShareUrl(id, {
          customSubdomain: metadata.customSubdomain || record?.customSubdomain || ""
        })
      });
    }

    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  items.sort((left, right) => right.updatedAt - left.updatedAt);
  return items;
}

async function destroyShare(shareId, env, username, url) {
  const record = await getShareRecordForOwner(env, shareId, username);
  if (!record) {
    const cleaned = await deleteD1LinkForOwnerStatus(env, shareId, username, "active");
    if (cleaned) {
      return json({
        ok: true,
        cleaned: true
      });
    }

    return json(
      { ok: false, error: "not_found", message: "找不到可销毁的链接。" },
      { status: 404 }
    );
  }

  const now = Date.now();
  const deletedRecord = {
    ...record,
    deletedAt: now,
    deletedBy: username,
    purgeAt: now + RECYCLE_RETENTION_MS
  };

  await persistTrashRecord(env, deletedRecord);
  await env.LEAVE_STATUS_DATA.delete(shareKey(shareId));

  return json({
    ok: true,
    item: serializeTrashRecord(deletedRecord, url)
  });
}

async function restoreShare(shareId, env, username, url) {
  if (!isValidShareId(shareId)) {
    return json(
      { ok: false, error: "invalid_id", message: "分享链接 ID 无效。" },
      { status: 400 }
    );
  }

  const record = await readTrashRecord(env, shareId);
  if (!record || !recordBelongsToUser(record, username, env)) {
    return json(
      { ok: false, error: "not_found", message: "找不到可恢复的链接。" },
      { status: 404 }
    );
  }

  if (shouldArchiveTrashRecord(record)) {
    await moveTrashRecordToArchive(env, record);
    return json(
      { ok: false, error: "archived", message: "该链接已进入封存库，请到封存库恢复。" },
      { status: 410 }
    );
  }

  const [existingShare, existingArchive] = await Promise.all([
    env.LEAVE_STATUS_DATA.get(shareKey(shareId)),
    env.LEAVE_STATUS_DATA.get(archiveKey(shareId))
  ]);
  if (existingShare || existingArchive) {
    return json(
      { ok: false, error: "duplicate_id", message: "原链接 ID 已被占用，无法恢复。" },
      { status: 409 }
    );
  }

  const restoredRecord = {
    ...record,
    updatedAt: Date.now(),
    restoredAt: Date.now(),
    restoredBy: username
  };
  delete restoredRecord.deletedAt;
  delete restoredRecord.deletedBy;
  delete restoredRecord.purgeAt;
  delete restoredRecord.archiveAt;

  await persistShareRecord(env, restoredRecord);
  await env.LEAVE_STATUS_DATA.delete(trashKey(shareId));

  return json({
    ok: true,
    item: serializeShareRecord(restoredRecord, url)
  });
}

async function restoreArchivedShare(shareId, request, env, username, url) {
  if (!isValidShareId(shareId)) {
    return json(
      { ok: false, error: "invalid_id", message: "分享链接 ID 无效。" },
      { status: 400 }
    );
  }

  const accessArchiveRecord = await getArchiveRecord(env, shareId);
  if (!accessArchiveRecord || !recordBelongsToUser(accessArchiveRecord, username, env)) {
    return json(
      { ok: false, error: "not_found", message: "找不到可恢复的封存链接。" },
      { status: 404 }
    );
  }

  const [accessExistingShare, accessExistingTrash] = await Promise.all([
    env.LEAVE_STATUS_DATA.get(shareKey(shareId)),
    env.LEAVE_STATUS_DATA.get(trashKey(shareId))
  ]);
  if (accessExistingShare || accessExistingTrash) {
    return json(
      { ok: false, error: "duplicate_id", message: "原链接 ID 已被占用，无法恢复。" },
      { status: 409 }
    );
  }

  const accessRestoreAt = Date.now();
  const accessRestoredRecord = {
    ...accessArchiveRecord,
    updatedAt: accessRestoreAt,
    restoredAt: accessRestoreAt,
    restoredBy: username
  };
  delete accessRestoredRecord.deletedAt;
  delete accessRestoredRecord.deletedBy;
  delete accessRestoredRecord.purgeAt;
  delete accessRestoredRecord.archiveAt;
  delete accessRestoredRecord.archivedAt;
  delete accessRestoredRecord.archivedBy;
  delete accessRestoredRecord.archiveReason;

  await persistShareRecord(env, accessRestoredRecord);
  await env.LEAVE_STATUS_DATA.delete(archiveKey(shareId));

  return json({
    ok: true,
    item: serializeShareRecord(accessRestoredRecord, url)
  });
}

async function persistTrashRecord(env, record) {
  const recordWithArchiveAt = {
    ...record,
    archiveAt: getTrashArchiveAt(record)
  };
  await persistIndexedLinkRecord(
    env,
    trashKey(record.id),
    recordWithArchiveAt,
    "trash",
    buildTrashMetadata(recordWithArchiveAt)
  );
}

async function persistArchiveRecord(env, record) {
  const compactedRecord = await compactArchiveRecordAttachments(env, record);
  await persistIndexedLinkRecord(
    env,
    archiveKey(compactedRecord.id),
    compactedRecord,
    "archive",
    buildArchiveMetadata(compactedRecord)
  );
}

async function listTrashSummaries(env, url, username) {
  try {
    await migrateDueTrashRecordsForOwner(env, username);
    const d1Items = await listD1LinkSummaries(env, url, username, "trash");
    if (d1Items && d1Items.length > 0) {
      return d1Items;
    }
  } catch (error) {
    console.error("Failed to list trash records from D1:", error);
  }

  return listTrashSummariesFromKV(env, url, username);
}

async function listTrashSummariesFromKV(env, url, username) {
  const items = [];
  let cursor;
  const now = Date.now();

  do {
    const page = await env.LEAVE_STATUS_DATA.list({
      prefix: TRASH_KEY_PREFIX,
      cursor,
      limit: 100
    });

    for (const key of page.keys) {
      try {
        if (!key.name.startsWith(TRASH_KEY_PREFIX)) {
          continue;
        }

        const id = key.name.slice(TRASH_KEY_PREFIX.length);
        const metadata = key.metadata || {};
        let record = null;
        const archiveAt = Number(metadata.archiveAt) || getTrashArchiveAt(metadata);
        if (archiveAt && archiveAt <= now) {
          record = await readTrashRecord(env, id);
          if (record) {
            await moveTrashRecordToArchive(env, record, now);
          } else {
            await env.LEAVE_STATUS_DATA.delete(key.name);
            await deleteD1Link(env, id);
          }
          continue;
        }

        let owner = metadata.createdBy || "";
        if (!owner || !metadata.userName || !metadata.expiresAt || !metadata.deletedAt) {
          record = record || (await getTrashRecord(env, id));
          owner = getRecordOwner(record, env);
        }
        if (!adminOwnerMatches(owner, username)) {
          continue;
        }

        const config = record?.config || {};
        const expiresAt = Number(metadata.expiresAt) || Number(record?.expiresAt) || 0;
        const deletedAt = Number(metadata.deletedAt) || Number(record?.deletedAt) || 0;
        const purgeAt = Number(metadata.purgeAt) || Number(record?.purgeAt) || 0;
        const resolvedArchiveAt =
          Number(metadata.archiveAt) || Number(record?.archiveAt) || getTrashArchiveAt(record || metadata);

        items.push({
          id,
          userName: metadata.userName || config.userName || "",
          startTime: metadata.startTime || config.startTime || "",
          endTime: metadata.endTime || config.endTime || "",
          expiresAt,
          expiresAtBeijing: expiresAt ? formatBeijingDateTime(expiresAt) : "",
          deletedAt,
          deletedAtBeijing: deletedAt ? formatBeijingDateTime(deletedAt) : "",
          purgeAt,
          purgeAtBeijing: purgeAt ? formatBeijingDateTime(purgeAt) : "",
          archiveAt: resolvedArchiveAt,
          archiveAtBeijing: resolvedArchiveAt ? formatBeijingDateTime(resolvedArchiveAt) : "",
          url: buildShareUrl(id, {
            customSubdomain: metadata.customSubdomain || record?.customSubdomain || ""
          })
        });
      } catch (error) {
        console.error("Failed to process trash list item:", error);
      }
    }

    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  items.sort((left, right) => right.deletedAt - left.deletedAt);
  return items;
}

async function listArchiveSummaries(env, url, username) {
  await migrateDueTrashRecords(env);
  const d1Items = await listD1LinkSummaries(env, url, username, "archive");
  if (d1Items && d1Items.length > 0) {
    return d1Items;
  }

  return listArchiveSummariesFromKV(env, url, username);
}

async function listArchiveSummariesFromKV(env, url, username) {
  await migrateDueTrashRecords(env);

  const items = [];
  let cursor;

  do {
    const page = await env.LEAVE_STATUS_DATA.list({
      prefix: ARCHIVE_KEY_PREFIX,
      cursor,
      limit: 100
    });

    for (const key of page.keys) {
      if (!key.name.startsWith(ARCHIVE_KEY_PREFIX)) {
        continue;
      }

      const id = key.name.slice(ARCHIVE_KEY_PREFIX.length);
      const metadata = key.metadata || {};
      let record = null;
      let owner = metadata.createdBy || "";
      if (!owner || !metadata.userName || !metadata.expiresAt || !metadata.archivedAt) {
        record = await getArchiveRecord(env, id);
        owner = getRecordOwner(record, env);
      }
      if (!adminOwnerMatches(owner, username)) {
        continue;
      }

      const config = record?.config || {};
      const expiresAt = Number(metadata.expiresAt) || Number(record?.expiresAt) || 0;
      const deletedAt = Number(metadata.deletedAt) || Number(record?.deletedAt) || 0;
      const purgeAt = Number(metadata.purgeAt) || Number(record?.purgeAt) || 0;
      const archivedAt = Number(metadata.archivedAt) || Number(record?.archivedAt) || 0;
      const archiveReason = metadata.archiveReason || record?.archiveReason || "";

      items.push({
        id,
        userName: metadata.userName || config.userName || "",
        startTime: metadata.startTime || config.startTime || "",
        endTime: metadata.endTime || config.endTime || "",
        expiresAt,
        expiresAtBeijing: expiresAt ? formatBeijingDateTime(expiresAt) : "",
        deletedAt,
        deletedAtBeijing: deletedAt ? formatBeijingDateTime(deletedAt) : "",
        purgeAt,
        purgeAtBeijing: purgeAt ? formatBeijingDateTime(purgeAt) : "",
        archivedAt,
        archivedAtBeijing: archivedAt ? formatBeijingDateTime(archivedAt) : "",
        archiveReason,
        archiveReasonText: getArchiveReasonText(archiveReason),
        url: buildShareUrl(id, {
          customSubdomain: metadata.customSubdomain || record?.customSubdomain || ""
        })
      });
    }

    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  items.sort((left, right) => right.archivedAt - left.archivedAt);
  return items;
}

async function migrateDueTrashRecords(env) {
  let cursor;
  const now = Date.now();

  do {
    const page = await env.LEAVE_STATUS_DATA.list({
      prefix: TRASH_KEY_PREFIX,
      cursor,
      limit: 100
    });

    for (const key of page.keys) {
      const id = key.name.slice(TRASH_KEY_PREFIX.length);
      const metadata = key.metadata || {};
      let record = null;
      let archiveAt = Number(metadata.archiveAt) || getTrashArchiveAt(metadata);
      if (!archiveAt) {
        record = await readTrashRecord(env, id);
        archiveAt = Number(record?.archiveAt) || getTrashArchiveAt(record);
      }
      if (!archiveAt || archiveAt > now) {
        continue;
      }

      record = record || (await readTrashRecord(env, id));
      if (record) {
        await moveTrashRecordToArchive(env, record, now);
      } else {
        await env.LEAVE_STATUS_DATA.delete(key.name);
        await deleteD1Link(env, id);
      }
    }

    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
}

async function migrateDueTrashRecordsForOwner(env, usernameInput) {
  const ownerNorms = getAdminOwnerNorms(usernameInput);
  const db = await ensureD1Schema(env);
  if (!ownerNorms.length || !db) {
    return;
  }

  try {
    const placeholders = ownerNorms.map(() => "?").join(", ");
    const result = await db.prepare(
      `SELECT id FROM leave_links
       WHERE owner_norm IN (${placeholders}) AND status = 'trash' AND archive_at > 0 AND archive_at <= ?
       ORDER BY archive_at ASC
       LIMIT 50`
    ).bind(...ownerNorms, Date.now()).all();

    for (const row of result.results || []) {
      const id = row.id || "";
      if (!isValidShareId(id)) {
        continue;
      }

      const record = await readTrashRecord(env, id);
      if (record) {
        await moveTrashRecordToArchive(env, record);
      } else {
        await env.LEAVE_STATUS_DATA.delete(trashKey(id));
        await deleteD1Link(env, id);
      }
    }
  } catch (error) {
    console.error("Failed to migrate due trash records from D1:", error);
  }
}

async function moveTrashRecordToArchive(env, record, archivedAt = Date.now()) {
  if (!record?.id || !isValidShareId(record.id)) {
    return;
  }

  const archivedRecord = {
    ...record,
    archivedAt,
    archivedBy: "system",
    archiveReason: getTrashArchiveReason(record, archivedAt)
  };
  delete archivedRecord.archiveAt;

  await persistArchiveRecord(env, archivedRecord);
  await env.LEAVE_STATUS_DATA.delete(trashKey(record.id));
}

async function getValidShareOrResponse(shareId, env, asJson = false) {
  if (!isValidShareId(shareId)) {
    return asJson
      ? json(
          {
            ok: false,
            error: "invalid_id",
            message: "分享链接 ID 无效。"
          },
          { status: 400 }
        )
      : shareStatusPage(400, "链接无效", "该链接缺少正确的分享 ID。");
  }

  const record = await getShareRecord(env, shareId);
  if (!record) {
    return asJson
      ? json(
          {
            ok: false,
            error: "not_found",
            message: "找不到对应的分享版本。"
          },
          { status: 404 }
        )
      : shareStatusPage(404, "链接不存在", "该链接可能已被销毁，或从未生成成功。");
  }

  if (record.expiresAt <= Date.now()) {
    return asJson
      ? json(
          {
            ok: false,
            error: "expired",
            message: "该链接已过期。"
          },
          { status: 410 }
        )
      : shareStatusPage(410, "链接已失效", "该页面超过设定的北京时间后已自动失效。");
  }

  return record;
}

async function getShareRecord(env, shareId) {
  if (!isValidShareId(shareId)) {
    return null;
  }

  const text = await env.LEAVE_STATUS_DATA.get(shareKey(shareId));
  if (!text) {
    return null;
  }

  try {
    const parsed = JSON.parse(text);
    return {
      ...parsed,
      config: normalizeConfig(parsed.config),
      expiresAt: Number(parsed.expiresAt) || 0,
      createdAt: Number(parsed.createdAt) || 0,
      updatedAt: Number(parsed.updatedAt) || 0,
      customSubdomain: normalizeStoredShareSubdomain(parsed.customSubdomain || "")
    };
  } catch (error) {
    console.error("Failed to parse share record:", error);
    return null;
  }
}

async function getShareRecordForOwner(env, shareId, username) {
  const record = await getShareRecord(env, shareId);
  if (!record || !recordBelongsToUser(record, username, env)) {
    return null;
  }

  return record;
}

async function getTrashRecord(env, shareId) {
  const record = await readTrashRecord(env, shareId);
  if (!record) {
    return null;
  }

  if (shouldArchiveTrashRecord(record)) {
    await moveTrashRecordToArchive(env, record);
    return null;
  }

  return record;
}

async function readTrashRecord(env, shareId) {
  if (!isValidShareId(shareId)) {
    return null;
  }

  const text = await env.LEAVE_STATUS_DATA.get(trashKey(shareId));
  if (!text) {
    return null;
  }

  try {
    const parsed = JSON.parse(text);
    const record = {
      ...parsed,
      config: normalizeConfig(parsed.config),
      expiresAt: Number(parsed.expiresAt) || 0,
      createdAt: Number(parsed.createdAt) || 0,
      updatedAt: Number(parsed.updatedAt) || 0,
      deletedAt: Number(parsed.deletedAt) || 0,
      purgeAt: Number(parsed.purgeAt) || 0,
      archiveAt: Number(parsed.archiveAt) || getTrashArchiveAt(parsed),
      customSubdomain: normalizeStoredShareSubdomain(parsed.customSubdomain || "")
    };

    return record;
  } catch (error) {
    console.error("Failed to parse trash record:", error);
    return null;
  }
}

async function getArchiveRecord(env, shareId) {
  if (!isValidShareId(shareId)) {
    return null;
  }

  const text = await env.LEAVE_STATUS_DATA.get(archiveKey(shareId));
  if (!text) {
    return null;
  }

  try {
    const parsed = JSON.parse(text);
    return {
      ...parsed,
      config: normalizeConfig(parsed.config),
      expiresAt: Number(parsed.expiresAt) || 0,
      createdAt: Number(parsed.createdAt) || 0,
      updatedAt: Number(parsed.updatedAt) || 0,
      deletedAt: Number(parsed.deletedAt) || 0,
      purgeAt: Number(parsed.purgeAt) || 0,
      archivedAt: Number(parsed.archivedAt) || 0,
      customSubdomain: normalizeStoredShareSubdomain(parsed.customSubdomain || "")
    };
  } catch (error) {
    console.error("Failed to parse archive record:", error);
    return null;
  }
}

function getRecordOwner(record, env) {
  if (!record) {
    return "";
  }

  return record.createdBy || env.ADMIN_USERNAME || "";
}

function recordBelongsToUser(record, username, env) {
  const owner = getRecordOwner(record, env);
  return adminOwnerMatches(owner, username);
}

function buildShareMetadata(record) {
  return {
    userName: record.config.userName || "",
    startTime: record.config.startTime || "",
    endTime: record.config.endTime || "",
    expiresAt: record.expiresAt,
    updatedAt: record.updatedAt,
    createdBy: record.createdBy || "",
    customSubdomain: normalizeStoredShareSubdomain(record.customSubdomain || "")
  };
}

function buildTrashMetadata(record) {
  return {
    ...buildShareMetadata(record),
    deletedAt: record.deletedAt || 0,
    purgeAt: record.purgeAt || 0,
    archiveAt: record.archiveAt || getTrashArchiveAt(record)
  };
}

function buildArchiveMetadata(record) {
  return {
    ...buildShareMetadata(record),
    deletedAt: record.deletedAt || 0,
    purgeAt: record.purgeAt || 0,
    archivedAt: record.archivedAt || 0,
    archiveReason: record.archiveReason || ""
  };
}

function serializeShareRecord(record, url) {
  const customSubdomain = normalizeStoredShareSubdomain(record.customSubdomain || "");
  return {
    id: record.id,
    url: buildShareUrl(record.id, { customSubdomain }),
    customSubdomain,
    customSubdomainEnabled: Boolean(customSubdomain),
    config: normalizeConfig(record.config),
    expiresAt: record.expiresAt,
    expiresAtBeijing: formatBeijingDateTime(record.expiresAt),
    createdAt: record.createdAt,
    createdAtBeijing: formatBeijingDateTime(record.createdAt),
    updatedAt: record.updatedAt,
    updatedAtBeijing: formatBeijingDateTime(record.updatedAt),
    createdBy: record.createdBy || ""
  };
}

function serializeShareSummary(record) {
  const config = normalizeConfig(record.config);
  const customSubdomain = normalizeStoredShareSubdomain(record.customSubdomain || "");
  const expiresAt = Number(record.expiresAt) || 0;
  const updatedAt = Number(record.updatedAt) || 0;
  return {
    id: record.id,
    userName: config.userName || "",
    startTime: config.startTime || "",
    endTime: config.endTime || "",
    expiresAt,
    expiresAtBeijing: expiresAt ? formatBeijingDateTime(expiresAt) : "",
    updatedAt,
    updatedAtBeijing: updatedAt ? formatBeijingDateTime(updatedAt) : "",
    url: buildShareUrl(record.id, { customSubdomain })
  };
}

function serializeTrashRecord(record, url) {
  const customSubdomain = normalizeStoredShareSubdomain(record.customSubdomain || "");
  return {
    id: record.id,
    url: buildShareUrl(record.id, { customSubdomain }),
    customSubdomain,
    userName: record.config.userName || "",
    startTime: record.config.startTime || "",
    endTime: record.config.endTime || "",
    expiresAt: record.expiresAt,
    expiresAtBeijing: formatBeijingDateTime(record.expiresAt),
    deletedAt: record.deletedAt || 0,
    deletedAtBeijing: formatBeijingDateTime(record.deletedAt),
    purgeAt: record.purgeAt || 0,
    purgeAtBeijing: formatBeijingDateTime(record.purgeAt),
    archiveAt: record.archiveAt || getTrashArchiveAt(record),
    archiveAtBeijing: formatBeijingDateTime(record.archiveAt || getTrashArchiveAt(record)),
    createdBy: record.createdBy || ""
  };
}

function getTrashArchiveAt(record) {
  const candidates = [Number(record?.expiresAt) || 0, Number(record?.purgeAt) || 0].filter(
    (value) => value > 0
  );
  return candidates.length ? Math.min(...candidates) : 0;
}

function shouldArchiveTrashRecord(record, now = Date.now()) {
  const archiveAt = Number(record?.archiveAt) || getTrashArchiveAt(record);
  return Boolean(archiveAt && archiveAt <= now);
}

function getTrashArchiveReason(record, archivedAt = Date.now()) {
  if (Number(record?.expiresAt) && Number(record.expiresAt) <= archivedAt) {
    return "share_expired";
  }
  if (Number(record?.purgeAt) && Number(record.purgeAt) <= archivedAt) {
    return "recycle_expired";
  }
  return "archived";
}

function getArchiveReasonText(reason) {
  if (reason === "share_expired") {
    return "原链接已失效";
  }
  if (reason === "recycle_expired") {
    return "回收站保留期已到";
  }
  return "已封存";
}

async function compactArchiveRecordAttachments(env, record) {
  if (!record?.config || !env.LEAVE_ATTACHMENTS) {
    return record;
  }

  const config = clone(record.config);
  const deletionCandidates = [];
  const leaveResult = await compactArchiveAttachmentUrls(
    env,
    normalizeAttachmentUrls(config.attachments),
    deletionCandidates
  );
  config.attachments = leaveResult.urls;

  const completionInfo =
    config.completionInfo && typeof config.completionInfo === "object"
      ? { ...config.completionInfo }
      : {};
  const completionResult = await compactArchiveAttachmentUrls(
    env,
    normalizeAttachmentUrls(completionInfo.attachments),
    deletionCandidates
  );
  completionInfo.attachments = completionResult.urls;
  config.completionInfo = completionInfo;

  await deleteUnreferencedArchiveOriginals(env, record.id, deletionCandidates);
  return {
    ...record,
    config
  };
}

async function compactArchiveAttachmentUrls(env, urls, deletionCandidates) {
  const compactedUrls = [];
  for (const url of urls) {
    const reference = getArchiveAttachmentReference(url);
    if (!reference || reference.isPreview) {
      compactedUrls.push(url);
      continue;
    }

    const previewExists = await r2ObjectExists(env, reference.previewKey);
    if (!previewExists) {
      compactedUrls.push(url);
      continue;
    }

    compactedUrls.push(reference.previewUrl);
    deletionCandidates.push({
      originalUrl: reference.originalUrl,
      originalKey: reference.originalKey
    });
  }

  return { urls: normalizeAttachmentUrls(compactedUrls) };
}

function getArchiveAttachmentReference(value) {
  const normalized = normalizeAttachmentUrl(value);
  if (!normalized) {
    return null;
  }

  let parsed;
  try {
    parsed = new URL(normalized);
  } catch {
    return null;
  }

  const leaveReference = getArchiveAttachmentReferenceForBase(parsed, {
    publicBaseUrl: ATTACHMENT_PUBLIC_BASE_URL,
    objectPrefix: ATTACHMENT_OBJECT_PREFIX,
    previewObjectPrefix: ATTACHMENT_PREVIEW_OBJECT_PREFIX
  });
  if (leaveReference) {
    return leaveReference;
  }

  return getArchiveAttachmentReferenceForBase(parsed, {
    publicBaseUrl: COMPLETION_ATTACHMENT_PUBLIC_BASE_URL,
    objectPrefix: COMPLETION_ATTACHMENT_OBJECT_PREFIX,
    previewObjectPrefix: COMPLETION_ATTACHMENT_PREVIEW_OBJECT_PREFIX
  });
}

function getAttachmentStorageKeyFromUrl(value) {
  const normalized = normalizeAttachmentUrl(value);
  if (!normalized) {
    return "";
  }

  let parsed;
  try {
    parsed = new URL(normalized);
  } catch {
    return "";
  }

  return getAttachmentStorageKeyFromUrlForBase(parsed, {
    publicBaseUrl: ATTACHMENT_PUBLIC_BASE_URL,
    objectPrefix: ATTACHMENT_OBJECT_PREFIX,
    previewObjectPrefix: ATTACHMENT_PREVIEW_OBJECT_PREFIX
  }) || getAttachmentStorageKeyFromUrlForBase(parsed, {
    publicBaseUrl: COMPLETION_ATTACHMENT_PUBLIC_BASE_URL,
    objectPrefix: COMPLETION_ATTACHMENT_OBJECT_PREFIX,
    previewObjectPrefix: COMPLETION_ATTACHMENT_PREVIEW_OBJECT_PREFIX
  });
}

function getAttachmentStorageKeyFromUrlForBase(parsedUrl, options) {
  const baseUrl = new URL(options.publicBaseUrl);
  if (parsedUrl.origin !== baseUrl.origin) {
    return "";
  }

  const publicPathPrefix = `${baseUrl.pathname.replace(/\/+$/, "")}/`;
  for (const objectPrefix of [options.objectPrefix, options.previewObjectPrefix]) {
    const pathPrefix = `${publicPathPrefix}${objectPrefix}/`;
    if (!parsedUrl.pathname.startsWith(pathPrefix)) {
      continue;
    }

    const objectSuffix = decodeUrlPath(parsedUrl.pathname.slice(pathPrefix.length));
    return objectSuffix ? `${objectPrefix}/${objectSuffix}` : "";
  }

  return "";
}

function getArchiveAttachmentReferenceForBase(parsedUrl, options) {
  const baseUrl = new URL(options.publicBaseUrl);
  if (parsedUrl.origin !== baseUrl.origin) {
    return null;
  }

  const publicPathPrefix = `${baseUrl.pathname.replace(/\/+$/, "")}/`;
  const objectPathPrefix = `${publicPathPrefix}${options.objectPrefix}/`;
  const previewPathPrefix = `${publicPathPrefix}${options.previewObjectPrefix}/`;
  if (parsedUrl.pathname.startsWith(previewPathPrefix)) {
    return { isPreview: true };
  }

  if (!parsedUrl.pathname.startsWith(objectPathPrefix)) {
    return null;
  }

  const objectSuffix = decodeUrlPath(parsedUrl.pathname.slice(objectPathPrefix.length));
  if (!objectSuffix) {
    return null;
  }

  const originalKey = `${options.objectPrefix}/${objectSuffix}`;
  const previewKey = `${options.previewObjectPrefix}/${replaceExtension(objectSuffix, ".webp")}`;
  return {
    isPreview: false,
    originalUrl: normalizedUrlWithoutHash(parsedUrl),
    originalKey,
    previewKey,
    previewUrl: buildObjectUrl(previewKey, options.publicBaseUrl)
  };
}

function decodeUrlPath(value) {
  try {
    return value
      .split("/")
      .map((segment) => decodeURIComponent(segment))
      .join("/");
  } catch {
    return "";
  }
}

function normalizedUrlWithoutHash(parsedUrl) {
  const normalized = new URL(parsedUrl.toString());
  normalized.hash = "";
  return normalized.toString();
}

async function r2ObjectExists(env, key) {
  if (!env.LEAVE_ATTACHMENTS || !key) {
    return false;
  }

  try {
    return Boolean(await env.LEAVE_ATTACHMENTS.head(key));
  } catch (error) {
    console.error("Failed to check R2 object:", error);
    return false;
  }
}

async function deleteUnreferencedArchiveOriginals(env, archivedShareId, candidates) {
  if (!env.LEAVE_ATTACHMENTS || !candidates.length) {
    return;
  }

  const uniqueCandidates = Array.from(
    new Map(candidates.map((item) => [item.originalKey, item])).values()
  );
  const referencedUrls = await findAttachmentReferencesOutsideRecord(
    env,
    uniqueCandidates.map((item) => item.originalUrl),
    archivedShareId
  );

  for (const candidate of uniqueCandidates) {
    if (referencedUrls.has(candidate.originalUrl)) {
      continue;
    }

    try {
      await env.LEAVE_ATTACHMENTS.delete(candidate.originalKey);
    } catch (error) {
      console.error("Failed to delete archived original attachment:", error);
    }
  }
}

async function findAttachmentReferencesOutsideRecord(env, urls, excludedShareId) {
  return findAttachmentReferencesOutsideRecords(env, urls, new Set([excludedShareId]));
}

async function findAttachmentReferencesOutsideRecords(env, urls, excludedShareIds) {
  const targets = new Set(urls.map(normalizeAttachmentUrl).filter(Boolean));
  const referenced = new Set();
  if (!targets.size) {
    return referenced;
  }

  for (const prefix of [SHARE_KEY_PREFIX, TRASH_KEY_PREFIX, ARCHIVE_KEY_PREFIX]) {
    let cursor;
    do {
      const page = await env.LEAVE_STATUS_DATA.list({
        prefix,
        cursor,
        limit: 100
      });

      for (const key of page.keys) {
        const id = key.name.slice(prefix.length);
        if (excludedShareIds?.has(id)) {
          continue;
        }

        const record =
          prefix === SHARE_KEY_PREFIX
            ? await getShareRecord(env, id)
            : prefix === TRASH_KEY_PREFIX
              ? await readTrashRecord(env, id)
              : await getArchiveRecord(env, id);
        if (!record) {
          continue;
        }

        for (const attachmentUrl of getRecordAttachmentUrls(record)) {
          if (targets.has(attachmentUrl)) {
            referenced.add(attachmentUrl);
          }
        }

        if (referenced.size === targets.size) {
          return referenced;
        }
      }

      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
  }

  return referenced;
}

function getRecordAttachmentUrls(record) {
  const config = normalizeConfig(record?.config || {});
  return [
    ...normalizeAttachmentUrls(config.attachments),
    ...normalizeAttachmentUrls(config.completionInfo?.attachments)
  ];
}

function buildShareUrl(shareId, source = null) {
  const customSubdomain =
    source && typeof source === "object" ? normalizeStoredShareSubdomain(source.customSubdomain || "") : "";
  const subdomain = customSubdomain || DEFAULT_SHARE_SUBDOMAIN;
  return `https://${subdomain}.${SHARE_ROOT_DOMAIN}${SHARE_INDEX_PATH}?id=${shareId}&needApproval=1`;
}

async function generateUniqueShareId(env) {
  for (let index = 0; index < 10; index += 1) {
    const shareId = randomHex(16);
    if (!(await shareIdExists(env, shareId))) {
      return shareId;
    }
  }

  throw new Error("Unable to generate a unique share ID.");
}

async function shareIdExists(env, shareId) {
  const [existingShare, existingTrash, existingArchive] = await Promise.all([
    env.LEAVE_STATUS_DATA.get(shareKey(shareId)),
    env.LEAVE_STATUS_DATA.get(trashKey(shareId)),
    env.LEAVE_STATUS_DATA.get(archiveKey(shareId))
  ]);
  return Boolean(existingShare || existingTrash || existingArchive);
}

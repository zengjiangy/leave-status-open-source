export const LOGIN_PATH = "/login";
export const LOGIN_ASSET_PATH = "/login.html";
export const LOGIN_API_PREFIX = "/login/api";
export const LOGIN_STATIC_PATHS = new Set(["/login.css", "/login.js", "/china-divisions.js"]);
export const LINK_HISTORY_PATH = "/linkhistory";
export const LINK_HISTORY_ASSET_PATH = "/linkhistory.html";
export const LINK_HISTORY_API_PREFIX = "/linkhistory/api";
export const LINK_HISTORY_STATIC_PATHS = new Set(["/linkhistory.js"]);
export const SUPER_LOGIN_PATH = "/superloginv";
export const SUPER_LOGIN_API_PREFIX = "/superloginv/api";
export const SUPER_ADMIN_ACCESS_EMAIL = "";
export const ADMIN_ACCESS_APP_ID = "";
export const ADMIN_ACCESS_POLICY_ID = "";
export const ADMIN_ACCESS_AUD = "";
export const CLOUDFLARE_ACCOUNT_ID = "";
export const DEFAULT_ADMIN_EMAIL_REPLACEMENTS = new Map();
export const ADMIN_CONFIG_TEMPLATE_BLANK = "blank";
export const SHARE_PREFIX = "/wec-counselor-leave-apps/leave/share";
export const SHARE_INDEX_PATH = `${SHARE_PREFIX}/index.html`;
export const SHARE_DATA_PATH = `${SHARE_PREFIX}/data`;
export const SHARE_SHELL_ASSET_PATH = `${SHARE_PREFIX}/share-shell.html`;
export const SHARE_STATIC_PATHS = new Set([
  `${SHARE_PREFIX}/style.css`,
  `${SHARE_PREFIX}/app.js`,
  `${SHARE_PREFIX}/config.js`
]);
export const SHARE_ROOT_DOMAIN = "example.com";
export const DEFAULT_SHARE_SUBDOMAIN = "app";
export const SHARE_SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
export const ROOT_SHARE_PATH = "/";
export const ROOT_SHARE_INDEX_PATH = "/index.html";
export const ROOT_SHARE_DATA_PATH = "/data";
export const ROOT_SHARE_ASSET_MAP = new Map([
  ["/style.css", `${SHARE_PREFIX}/style.css`],
  ["/app.js", `${SHARE_PREFIX}/app.js`],
  ["/config.js", `${SHARE_PREFIX}/config.js`],
  ["/stamp.png", `${SHARE_PREFIX}/stamp.png`],
  ["/service-headset.png", `${SHARE_PREFIX}/service-headset.png`]
]);
export const LOGIN_UPLOADS_PATH = `${LOGIN_API_PREFIX}/uploads`;
export const LOGIN_COMPLETION_UPLOADS_PATH = `${LOGIN_API_PREFIX}/completion-uploads`;
export const PUBLIC_UPLOAD_PREFIX = "/uploads";
export const PUBLIC_COMPLETION_UPLOAD_PREFIX = "/completion-uploads";
export const ATTACHMENT_PUBLIC_BASE_URL = "https://app.example.com/uploads";
export const COMPLETION_ATTACHMENT_PUBLIC_BASE_URL = "https://app.example.com/completion-uploads";
export const ATTACHMENT_OBJECT_PREFIX = "attachments";
export const ATTACHMENT_PREVIEW_OBJECT_PREFIX = "attachment-previews";
export const COMPLETION_ATTACHMENT_OBJECT_PREFIX = "completion-attachments";
export const COMPLETION_ATTACHMENT_PREVIEW_OBJECT_PREFIX = "completion-attachment-previews";
export const MAX_ATTACHMENT_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENT_PREVIEW_BYTES = 2 * 1024 * 1024;
export const MAX_ATTACHMENT_UPLOAD_COUNT = 9;
export const PUBLIC_ATTACHMENT_CACHE_CONTROL = "public, max-age=31536000, immutable";
export const ADMIN_PAGE_CACHE_CONTROL = "private, max-age=60, must-revalidate";
export const ADMIN_STATIC_CACHE_CONTROL = "public, max-age=3600, stale-while-revalidate=86400";
export const SHARE_STATIC_CACHE_CONTROL = "public, max-age=3600, stale-while-revalidate=86400";
export const LOGIN_PRELOAD_LINK_HEADER =
  "</login.css?v=20260515-theme-swatches>; rel=preload; as=style, </login.js?v=20260515-upload-clean-2>; rel=preload; as=script";
export const LINK_HISTORY_PRELOAD_LINK_HEADER =
  "</login.css>; rel=preload; as=style, </linkhistory.js>; rel=preload; as=script";
export const SHARE_PRELOAD_LINK_HEADER =
  "</wec-counselor-leave-apps/leave/share/style.css?v=20260515-text-colors>; rel=preload; as=style, </wec-counselor-leave-apps/leave/share/config.js>; rel=preload; as=script, </wec-counselor-leave-apps/leave/share/app.js?v=20260515-text-colors>; rel=preload; as=script";
export const ROOT_SHARE_PRELOAD_LINK_HEADER =
  "</style.css?v=20260515-text-colors>; rel=preload; as=style, </config.js>; rel=preload; as=script, </app.js?v=20260515-text-colors>; rel=preload; as=script";
export const MIME_TYPE_EXTENSION_MAP = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["image/bmp", ".bmp"],
  ["image/avif", ".avif"],
  ["image/heic", ".heic"],
  ["image/heif", ".heif"]
]);

export const COOKIE_NAME = "leave_admin_session";
export const SUPER_COOKIE_NAME = "leave_super_admin_session";
export const ACCESS_JWKS_CACHE_TTL_MS = 5 * 60 * 1000;
export const ACCESS_JWT_CLOCK_TOLERANCE_SECONDS = 60;
export const SHARE_KEY_PREFIX = "share:";
export const TRASH_KEY_PREFIX = "trash:";
export const ARCHIVE_KEY_PREFIX = "archive:";
export const ADMIN_KEY_PREFIX = "admin:";
export const ADMIN_DELETED_KEY_PREFIX = "admin-deleted:";
export const ADMIN_TEMPLATE_KEY_PREFIX = "admin-template:";
export const ADMIN_LINK_STATS_KEY_PREFIX = "admin-link-stats:";
export const ADMIN_LINK_LIMIT_KEY_PREFIX = "admin-link-limit:";
export const ADMIN_LOGIN_KEY_PREFIX = "admin-login:";
export const SESSION_KEY_PREFIX = "session:";
export const SUPER_SESSION_KEY_PREFIX = "super-session:";
export const RECYCLE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
export const MIN_EXPIRY_BUFFER_MS = 30 * 1000;
export const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;
export const D1_SYNC_INTERVAL_MS = 60 * 1000;
export const R2_FREE_STORAGE_BYTES = 10 * 1000 * 1000 * 1000;
export const R2_FREE_CLASS_A_OPERATIONS_MONTHLY = 1_000_000;
export const R2_FREE_CLASS_B_OPERATIONS_MONTHLY = 10_000_000;
export const D1_FREE_STORAGE_BYTES = 5 * 1000 * 1000 * 1000;
export const D1_FREE_ROW_READS_DAILY = 5_000_000;
export const D1_FREE_ROW_WRITES_DAILY = 100_000;
export const OPTIONAL_VISIBLE_FIELD_KEYS = [
  "leaveType",
  "needLeaveSchool",
  "cancelRule",
  "actualVacationTime",
  "startTime",
  "endTime",
  "approvalFlow",
  "emergencyContact",
  "approver",
  "leaveReason",
  "location",
  "ccPerson",
  "destination",
  "dormInfo",
  "attachments",
  "approvedStamp",
  "disclaimer",
  "service",
  "completionInfo",
  "completionStatus",
  "completionAttachments",
  "completionLocation"
];
export const D1_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS leave_links (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    owner TEXT NOT NULL DEFAULT '',
    owner_norm TEXT NOT NULL DEFAULT '',
    user_name TEXT NOT NULL DEFAULT '',
    start_time TEXT NOT NULL DEFAULT '',
    end_time TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL DEFAULT '',
    config_json TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL DEFAULT 0,
    expires_at INTEGER NOT NULL DEFAULT 0,
    deleted_at INTEGER NOT NULL DEFAULT 0,
    purge_at INTEGER NOT NULL DEFAULT 0,
    archive_at INTEGER NOT NULL DEFAULT 0,
    archived_at INTEGER NOT NULL DEFAULT 0,
    archive_reason TEXT NOT NULL DEFAULT '',
    restored_at INTEGER NOT NULL DEFAULT 0,
    source_key TEXT NOT NULL DEFAULT '',
    last_synced_at INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS idx_leave_links_owner_status_updated
    ON leave_links(owner_norm, status, updated_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_leave_links_owner_status_deleted
    ON leave_links(owner_norm, status, deleted_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_leave_links_owner_status_archived
    ON leave_links(owner_norm, status, archived_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_leave_links_status_archive_at
    ON leave_links(status, archive_at)`,
  `CREATE TABLE IF NOT EXISTS admin_accounts (
    username TEXT PRIMARY KEY,
    username_norm TEXT NOT NULL UNIQUE,
    source TEXT NOT NULL DEFAULT '',
    editable INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT 0,
    created_by TEXT NOT NULL DEFAULT '',
    updated_at INTEGER NOT NULL DEFAULT 0,
    updated_by TEXT NOT NULL DEFAULT '',
    deleted_at INTEGER NOT NULL DEFAULT 0,
    deleted_by TEXT NOT NULL DEFAULT '',
    last_synced_at INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS admin_logins (
    username_norm TEXT PRIMARY KEY,
    username TEXT NOT NULL DEFAULT '',
    last_login_at INTEGER NOT NULL DEFAULT 0,
    last_access_ip TEXT NOT NULL DEFAULT '',
    last_access_user_agent TEXT NOT NULL DEFAULT '',
    updated_at INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS admin_link_stats (
    username_norm TEXT PRIMARY KEY,
    username TEXT NOT NULL DEFAULT '',
    generated_link_count INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL DEFAULT 0
  )`
];
export const JSON_HEADERS = {
  "Content-Type": "application/json; charset=UTF-8",
  "Cache-Control": "no-store"
};
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.example.com",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "worker-src 'self'"
].join("; ");
export const SECURITY_HEADERS = {
  "Content-Security-Policy": CONTENT_SECURITY_POLICY,
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000"
};
export const IMAGE_SIGNATURE_BYTES = 32;

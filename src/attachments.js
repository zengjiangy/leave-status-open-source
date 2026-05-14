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
import { json, methodNotAllowed, notFound } from "./http.js";
import { pad, randomHex } from "./utils.js";

export async function handleAttachmentUpload(request, env, username) {
  return handleImageUpload(request, env, username, {
    objectPrefix: ATTACHMENT_OBJECT_PREFIX,
    previewObjectPrefix: ATTACHMENT_PREVIEW_OBJECT_PREFIX,
    publicBaseUrl: ATTACHMENT_PUBLIC_BASE_URL
  });
}

export async function handleCompletionAttachmentUpload(request, env, username) {
  return handleImageUpload(request, env, username, {
    objectPrefix: COMPLETION_ATTACHMENT_OBJECT_PREFIX,
    previewObjectPrefix: COMPLETION_ATTACHMENT_PREVIEW_OBJECT_PREFIX,
    publicBaseUrl: COMPLETION_ATTACHMENT_PUBLIC_BASE_URL
  });
}

async function handleImageUpload(request, env, username, options) {
  if (!env.LEAVE_ATTACHMENTS) {
    return json(
      {
        ok: false,
        error: "missing_r2_binding",
        message: "\u9644\u4ef6 R2 \u5b58\u50a8\u672a\u914d\u7f6e\u5b8c\u6210\u3002"
      },
      { status: 500 }
    );
  }

  let formData;
  try {
    formData = await request.formData();
  } catch (error) {
    console.error("Failed to parse upload form data:", error);
    return json(
      {
        ok: false,
        error: "invalid_form_data",
        message: "\u4e0a\u4f20\u8bf7\u6c42\u683c\u5f0f\u65e0\u6548\uff0c\u8bf7\u91cd\u8bd5\u3002"
      },
      { status: 400 }
    );
  }

  const files = formData.getAll("files").filter(isFileLike);
  if (!files.length) {
    return json(
      {
        ok: false,
        error: "missing_file",
        message: "\u8bf7\u5148\u9009\u62e9\u8981\u4e0a\u4f20\u7684\u56fe\u7247\u3002"
      },
      { status: 400 }
    );
  }

  if (files.length > MAX_ATTACHMENT_UPLOAD_COUNT) {
    return json(
      {
        ok: false,
        error: "too_many_files",
        message: `\u5355\u6b21\u6700\u591a\u53ea\u80fd\u4e0a\u4f20 ${MAX_ATTACHMENT_UPLOAD_COUNT} \u5f20\u56fe\u7247\u3002`
      },
      { status: 400 }
    );
  }

  const items = [];
  const previewFiles = getUploadPreviewFiles(formData);
  for (const [index, file] of files.entries()) {
    const validation = await validateAttachmentFile(file);
    if (validation) {
      return validation;
    }

    const previewFile = previewFiles.get(index) || null;
    const previewValidation = previewFile ? await validateAttachmentPreviewFile(previewFile) : null;
    if (previewValidation) {
      return previewValidation;
    }

    const key = createAttachmentObjectKey(file, options.objectPrefix);
    const previewKey = previewFile
      ? createAttachmentPreviewObjectKey(key, options.objectPrefix, options.previewObjectPrefix)
      : "";
    const contentType = getAttachmentContentType(file);
    const previewContentType = previewFile ? getAttachmentContentType(previewFile) : "";
    const uploadedAt = new Date().toISOString();

    const putTasks = [
      env.LEAVE_ATTACHMENTS.put(key, file.stream(), {
        httpMetadata: {
          contentType,
          cacheControl: PUBLIC_ATTACHMENT_CACHE_CONTROL
        },
        customMetadata: {
          originalName: sanitizeMetadataValue(file.name),
          uploadedBy: sanitizeMetadataValue(username),
          uploadedAt,
          previewKey
        }
      })
    ];

    if (previewFile && previewKey) {
      putTasks.push(env.LEAVE_ATTACHMENTS.put(previewKey, previewFile.stream(), {
        httpMetadata: {
          contentType: previewContentType,
          cacheControl: PUBLIC_ATTACHMENT_CACHE_CONTROL
        },
        customMetadata: {
          originalKey: key,
          originalName: sanitizeMetadataValue(file.name),
          uploadedBy: sanitizeMetadataValue(username),
          uploadedAt,
          generatedFrom: "admin-canvas-preview"
        }
      }));
    }

    await Promise.all(putTasks);

    items.push({
      key,
      url: buildObjectUrl(key, options.publicBaseUrl),
      previewKey,
      previewUrl: previewKey ? buildObjectUrl(previewKey, options.publicBaseUrl) : "",
      name: file.name || "",
      size: Number(file.size) || 0,
      contentType
    });
  }

  return json({
    ok: true,
    items
  });
}

export async function handlePublicUploadRequest(request, env, path, options) {
  if (!env.LEAVE_ATTACHMENTS) {
    return notFound("\u9644\u4ef6\u5b58\u50a8\u672a\u53ef\u7528\u3002");
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return methodNotAllowed(["GET", "HEAD"]);
  }

  const key = extractAttachmentKey(path, options.publicPrefix);
  if (!key) {
    return notFound("\u9644\u4ef6\u4e0d\u5b58\u5728\u3002");
  }

  const object =
    request.method === "HEAD"
      ? await env.LEAVE_ATTACHMENTS.head(key)
      : await env.LEAVE_ATTACHMENTS.get(key);
  if (!object) {
    return notFound("\u9644\u4ef6\u4e0d\u5b58\u5728\u6216\u5df2\u88ab\u5220\u9664\u3002");
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", headers.get("Cache-Control") || PUBLIC_ATTACHMENT_CACHE_CONTROL);
  headers.set("Content-Type", headers.get("Content-Type") || "application/octet-stream");
  headers.set("Access-Control-Allow-Origin", "*");
  if (object.httpEtag) {
    headers.set("ETag", object.httpEtag);
  }

  return new Response(request.method === "HEAD" ? null : object.body, {
    status: 200,
    headers
  });
}

export function buildAttachmentUrl(key) {
  return buildObjectUrl(key, ATTACHMENT_PUBLIC_BASE_URL);
}

export function buildObjectUrl(key, publicBaseUrl) {
  return `${publicBaseUrl}/${encodeAttachmentKey(key)}`;
}

function encodeAttachmentKey(key) {
  return key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function extractAttachmentKey(path, publicPrefix = PUBLIC_UPLOAD_PREFIX) {
  if (!path.startsWith(`${publicPrefix}/`)) {
    return "";
  }

  const encodedKey = path.slice(`${publicPrefix}/`.length);
  if (!encodedKey) {
    return "";
  }

  try {
    return encodedKey
      .split("/")
      .map((segment) => decodeURIComponent(segment))
      .join("/");
  } catch {
    return "";
  }
}

function createAttachmentObjectKey(file, objectPrefix = ATTACHMENT_OBJECT_PREFIX) {
  const date = new Date();
  const datePrefix = [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate())
  ].join("/");

  return `${objectPrefix}/${datePrefix}/${Date.now()}-${randomHex(8)}${getAttachmentExtension(
    file
  )}`;
}

function createAttachmentPreviewObjectKey(originalKey, objectPrefix, previewObjectPrefix) {
  const prefix = `${objectPrefix}/`;
  const suffix = originalKey.startsWith(prefix) ? originalKey.slice(prefix.length) : originalKey;
  return `${previewObjectPrefix}/${replaceExtension(suffix, ".webp")}`;
}

function replaceExtension(value, extension) {
  const slashIndex = value.lastIndexOf("/");
  const dotIndex = value.lastIndexOf(".");
  if (dotIndex > slashIndex) {
    return `${value.slice(0, dotIndex)}${extension}`;
  }

  return `${value}${extension}`;
}

function getUploadPreviewFiles(formData) {
  const previewFiles = formData.getAll("previews").filter(isFileLike);
  const previewIndexes = formData.getAll("previewIndexes");
  const result = new Map();

  previewFiles.forEach((file, order) => {
    const index = Number(previewIndexes[order]);
    if (Number.isInteger(index) && index >= 0) {
      result.set(index, file);
    }
  });

  return result;
}

async function validateAttachmentFile(file) {
  if (!isFileLike(file)) {
    return json(
      {
        ok: false,
        error: "invalid_file",
        message: "\u4e0a\u4f20\u7684\u6587\u4ef6\u65e0\u6548\u3002"
      },
      { status: 400 }
    );
  }

  const contentType = getAttachmentContentType(file).toLowerCase();
  if (!isAllowedAttachmentContentType(contentType)) {
    return json(
      {
        ok: false,
        error: "invalid_file_type",
        message: "\u53ea\u652f\u6301\u4e0a\u4f20 jpg\u3001png\u3001webp\u3001gif \u7b49\u5e38\u89c1\u56fe\u7247\u683c\u5f0f\u3002"
      },
      { status: 400 }
    );
  }

  if (!Number.isFinite(file.size) || file.size <= 0) {
    return json(
      {
        ok: false,
        error: "empty_file",
        message: "\u4e0a\u4f20\u7684\u56fe\u7247\u4e3a\u7a7a\u6587\u4ef6\u3002"
      },
      { status: 400 }
    );
  }

  if (file.size > MAX_ATTACHMENT_UPLOAD_BYTES) {
    return json(
      {
        ok: false,
        error: "file_too_large",
        message: `\u5355\u5f20\u56fe\u7247\u4e0d\u80fd\u8d85\u8fc7 ${Math.floor(
          MAX_ATTACHMENT_UPLOAD_BYTES / (1024 * 1024)
        )}MB\u3002`
      },
      { status: 400 }
    );
  }

  const signatureValidation = await validateImageFileSignature(file, contentType);
  if (signatureValidation) {
    return signatureValidation;
  }

  return null;
}

async function validateAttachmentPreviewFile(file) {
  if (!isFileLike(file) || !Number.isFinite(file.size) || file.size <= 0) {
    return json(
      {
        ok: false,
        error: "invalid_preview",
        message: "\u538b\u7f29\u9884\u89c8\u56fe\u65e0\u6548\uff0c\u8bf7\u91cd\u65b0\u4e0a\u4f20\u3002"
      },
      { status: 400 }
    );
  }

  const contentType = getAttachmentContentType(file).toLowerCase();
  if (!isAllowedAttachmentContentType(contentType)) {
    return json(
      {
        ok: false,
        error: "invalid_preview_type",
        message: "\u538b\u7f29\u9884\u89c8\u56fe\u683c\u5f0f\u65e0\u6548\uff0c\u8bf7\u91cd\u65b0\u4e0a\u4f20\u3002"
      },
      { status: 400 }
    );
  }

  if (file.size > MAX_ATTACHMENT_PREVIEW_BYTES) {
    return json(
      {
        ok: false,
        error: "preview_too_large",
        message: "\u538b\u7f29\u9884\u89c8\u56fe\u8fc7\u5927\uff0c\u8bf7\u6362\u4e00\u5f20\u56fe\u7247\u91cd\u8bd5\u3002"
      },
      { status: 400 }
    );
  }

  const signatureValidation = await validateImageFileSignature(file, contentType);
  if (signatureValidation) {
    return signatureValidation;
  }

  return null;
}

function isAllowedAttachmentContentType(contentType) {
  return MIME_TYPE_EXTENSION_MAP.has(String(contentType || "").toLowerCase());
}

async function validateImageFileSignature(file, expectedContentType) {
  if (typeof file?.slice !== "function") {
    return invalidImageContentResponse();
  }

  let bytes;
  try {
    bytes = new Uint8Array(await file.slice(0, IMAGE_SIGNATURE_BYTES).arrayBuffer());
  } catch (error) {
    console.error("Failed to read image signature:", error);
    return invalidImageContentResponse();
  }

  const actualContentType = detectImageContentType(bytes);
  if (!actualContentType || !imageContentTypesCompatible(expectedContentType, actualContentType)) {
    return invalidImageContentResponse();
  }

  return null;
}

function invalidImageContentResponse() {
  return json(
    {
      ok: false,
      error: "invalid_image_content",
      message: "图片内容与文件格式不匹配，请重新选择图片上传。"
    },
    { status: 400 }
  );
}

function detectImageContentType(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  const gifHeader = bytesToAscii(bytes, 0, 6);
  if (gifHeader === "GIF87a" || gifHeader === "GIF89a") {
    return "image/gif";
  }
  if (bytes.length >= 12 && bytesToAscii(bytes, 0, 4) === "RIFF" && bytesToAscii(bytes, 8, 12) === "WEBP") {
    return "image/webp";
  }
  if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return "image/bmp";
  }

  const brand = getIsoBmffBrand(bytes);
  if (brand === "avif" || brand === "avis") {
    return "image/avif";
  }
  if (["heic", "heix", "hevc", "hevx"].includes(brand)) {
    return "image/heic";
  }
  if (["mif1", "msf1", "heim", "heis"].includes(brand)) {
    return "image/heif";
  }

  return "";
}

function getIsoBmffBrand(bytes) {
  return bytes.length >= 12 && bytesToAscii(bytes, 4, 8) === "ftyp"
    ? bytesToAscii(bytes, 8, 12).toLowerCase()
    : "";
}

function imageContentTypesCompatible(expectedContentType, actualContentType) {
  const expected = String(expectedContentType || "").toLowerCase();
  const actual = String(actualContentType || "").toLowerCase();
  if (expected === actual) {
    return true;
  }

  const heifTypes = new Set(["image/heic", "image/heif"]);
  return heifTypes.has(expected) && heifTypes.has(actual);
}

function bytesToAscii(bytes, start, end) {
  let result = "";
  for (let index = start; index < end && index < bytes.length; index += 1) {
    result += String.fromCharCode(bytes[index]);
  }
  return result;
}

function getAttachmentContentType(file) {
  const explicitType = typeof file?.type === "string" ? file.type.trim().toLowerCase() : "";
  if (explicitType) {
    return explicitType;
  }

  const extension = getAttachmentExtension(file);
  for (const [contentType, mappedExtension] of MIME_TYPE_EXTENSION_MAP.entries()) {
    if (mappedExtension === extension) {
      return contentType;
    }
  }

  return "application/octet-stream";
}

function getAttachmentExtension(file) {
  const fileName = typeof file?.name === "string" ? file.name.trim().toLowerCase() : "";
  const nameMatch = /\.([a-z0-9]+)$/.exec(fileName);
  if (nameMatch) {
    return `.${nameMatch[1]}`;
  }

  return MIME_TYPE_EXTENSION_MAP.get(typeof file?.type === "string" ? file.type.toLowerCase() : "") || "";
}

export function sanitizeMetadataValue(value) {
  return typeof value === "string" ? value.trim().slice(0, 255) : "";
}

function isFileLike(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.name === "string" &&
    typeof value.size === "number" &&
    typeof value.stream === "function"
  );
}

import { DEFAULT_CONFIG } from "./default-config.js";
import { OPTIONAL_VISIBLE_FIELD_KEYS } from "./constants.js";
import { clone } from "./utils.js";

export function normalizeConfig(input) {
  const merged = deepMerge(clone(DEFAULT_CONFIG), input && typeof input === "object" ? input : {});
  merged.attachments = normalizeAttachmentUrls(merged.attachments);
  merged.optionalVisibilityEnabled = Boolean(merged.optionalVisibilityEnabled);
  merged.visibleFields = normalizeVisibleFields(merged.visibleFields);
  merged.needLeaveSchoolUseCancelRuleColor = Boolean(merged.needLeaveSchoolUseCancelRuleColor);
  merged.showApprovedStamp = Boolean(merged.showApprovedStamp);
  merged.showEmergencyContact = Boolean(merged.showEmergencyContact);
  merged.emergencyContact =
    typeof merged.emergencyContact === "string" ? merged.emergencyContact.trim() : "";
  merged.destination = normalizeDestination(merged.destination);
  merged.statusSwitchAtBeijing =
    typeof merged.statusSwitchAtBeijing === "string" ? merged.statusSwitchAtBeijing.trim() : "";
  merged.locationUrl = normalizeLocationUrl(merged.locationUrl);
  merged.serviceUrl = normalizeExternalUrl(merged.serviceUrl);
  merged.cancelRule = merged.cancelRule && typeof merged.cancelRule === "object" ? merged.cancelRule : {};
  merged.personalInfo =
    merged.personalInfo && typeof merged.personalInfo === "object" ? merged.personalInfo : {};
  merged.completionInfo =
    merged.completionInfo && typeof merged.completionInfo === "object" ? merged.completionInfo : {};
  merged.completionInfo.enabled = Boolean(merged.completionInfo.enabled);
  merged.completionInfo.showAtBeijing =
    typeof merged.completionInfo.showAtBeijing === "string"
      ? merged.completionInfo.showAtBeijing.trim()
      : "";
  merged.completionInfo.inheritLeaveLocation = merged.completionInfo.inheritLeaveLocation !== false;
  merged.completionInfo.statusText =
    typeof merged.completionInfo.statusText === "string"
      ? merged.completionInfo.statusText.trim()
      : "";
  merged.completionInfo.statusActionText =
    typeof merged.completionInfo.statusActionText === "string"
      ? merged.completionInfo.statusActionText.trim()
      : "";
  merged.completionInfo.statusActionUrl = normalizeExternalUrl(merged.completionInfo.statusActionUrl);
  merged.completionInfo.locationText =
    typeof merged.completionInfo.locationText === "string"
      ? merged.completionInfo.locationText.trim()
      : "";
  merged.completionInfo.locationUrl = normalizeLocationUrl(merged.completionInfo.locationUrl);
  merged.completionInfo.attachments = normalizeAttachmentUrls(merged.completionInfo.attachments);
  merged.completionInfo.approvalFlow =
    merged.completionInfo.approvalFlow && typeof merged.completionInfo.approvalFlow === "object"
      ? merged.completionInfo.approvalFlow
      : {};
  merged.completionInfo.approvalFlow.title =
    typeof merged.completionInfo.approvalFlow.title === "string"
      ? merged.completionInfo.approvalFlow.title.trim()
      : "";
  merged.completionInfo.approvalFlow.confirmText =
    typeof merged.completionInfo.approvalFlow.confirmText === "string"
      ? merged.completionInfo.approvalFlow.confirmText.trim()
      : "";
  merged.completionInfo.approvalFlow.firstStep = normalizeCompletionApprovalStep(
    merged.completionInfo.approvalFlow.firstStep
  );
  merged.completionInfo.approvalFlow.secondStep = normalizeCompletionApprovalStep(
    merged.completionInfo.approvalFlow.secondStep
  );
  return merged;
}

export function normalizeVisibleFields(input) {
  const source = input && typeof input === "object" ? input : {};
  const result = {};
  for (const key of OPTIONAL_VISIBLE_FIELD_KEYS) {
    result[key] = source[key] !== false;
  }
  return result;
}

export function normalizeDestination(input) {
  const destination = input && typeof input === "object" ? input : {};
  return {
    enabled: Boolean(destination.enabled),
    province: typeof destination.province === "string" ? destination.province.trim() : "",
    city: typeof destination.city === "string" ? destination.city.trim() : "",
    county: typeof destination.county === "string" ? destination.county.trim() : "",
    detail: typeof destination.detail === "string" ? destination.detail.trim() : ""
  };
}

export function normalizeCompletionApprovalStep(input) {
  const step = input && typeof input === "object" ? input : {};
  const theme = typeof step.theme === "string" ? step.theme.trim().toLowerCase() : "";
  return {
    actor: typeof step.actor === "string" ? step.actor.trim() : "",
    actionText: typeof step.actionText === "string" ? step.actionText.trim() : "",
    timeText: typeof step.timeText === "string" ? step.timeText.trim() : "",
    opinion: typeof step.opinion === "string" ? step.opinion.trim() : "",
    theme: ["primary", "success", "warning", "error", "grey"].includes(theme) ? theme : "primary"
  };
}

export function normalizeAttachmentUrls(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  const seen = new Set();
  const result = [];
  for (const item of input) {
    const normalized = normalizeAttachmentUrl(item);
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

export function normalizeAttachmentUrl(value) {
  return normalizeExternalUrl(value);
}

export function normalizeLocationUrl(value) {
  return decodeMapAddressInLocationUrl(normalizeExternalUrl(value));
}

export function normalizeExternalUrl(value) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }

    return parsed.toString();
  } catch {
    return "";
  }
}

export function decodeMapAddressInLocationUrl(value) {
  if (!value) {
    return "";
  }

  const hashIndex = value.indexOf("#/map/");
  if (hashIndex < 0) {
    return value;
  }

  const hash = value.slice(hashIndex + 1);
  const segments = hash.split("/");
  if (
    segments.length < 5 ||
    segments[1] !== "map" ||
    !Number.isFinite(Number(segments[2])) ||
    !Number.isFinite(Number(segments[3]))
  ) {
    return value;
  }

  const address = segments.slice(4).join("/");
  if (!address) {
    return value;
  }

  try {
    return `${value.slice(0, hashIndex)}#/map/${segments[2]}/${segments[3]}/${decodeURIComponent(address)}`;
  } catch {
    return value;
  }
}

export function deepMerge(target, source) {
  if (!source || typeof source !== "object") {
    return target;
  }

  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) {
      target[key] = value.slice();
      continue;
    }

    if (value && typeof value === "object") {
      const base =
        target[key] && typeof target[key] === "object" && !Array.isArray(target[key])
          ? target[key]
          : {};
      target[key] = deepMerge({ ...base }, value);
      continue;
    }

    target[key] = value;
  }

  return target;
}

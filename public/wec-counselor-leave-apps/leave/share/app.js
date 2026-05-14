const PAGE_LOADING_MIN_DURATION_MS = 650;
const PAGE_LOADING_FADE_DURATION_MS = 180;
const UPCOMING_STATUS_TEXT = "即将休假";
const ACTIVE_STATUS_TEXT = "正在休假中";
const COMPLETED_STATUS_TEXT = "\u5df2\u5b8c\u6210";
const UPCOMING_STATUS_TYPE = "warning";
const ACTIVE_STATUS_TYPE = "success";
const COMPLETED_STATUS_TYPE = "grey";
const BEIJING_TIME_ZONE = "Asia/Shanghai";
const ATTACHMENT_PREVIEW_EXTENSION = ".webp";
const BEIJING_TIME_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
    timeZone: BEIJING_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
});

let pageLoadingShownAt = 0;
let activeConfig = null;
let attachmentImageLoadScheduled = false;
let completionInfoRenderSignature = "";
const pendingAttachmentImages = new Set();

async function initPage() {
    const config = await resolveConfig();
    if (!config) {
        return;
    }

    activeConfig = config;
    renderPage(config);
    updateTime();
    window.setInterval(updateTime, 1000);
}

async function resolveConfig() {
    const fallbackConfig = typeof CONFIG === "object" && CONFIG ? CONFIG : null;
    const shareId = new URLSearchParams(window.location.search).get("id");

    if (!shareId) {
        return fallbackConfig;
    }

    try {
        const response = await fetch(`data?id=${encodeURIComponent(shareId)}`, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch share config: ${response.status}`);
        }

        const payload = await response.json();
        return mergeConfig(fallbackConfig || {}, payload.config || {});
    } catch (error) {
        console.error(error);
        renderFatalState("页面内容加载失败，请返回后台重新生成链接。");
        return null;
    }
}

function renderPage(config) {
    const avatarBadge = document.getElementById("avatarBadge");
    const locationLink = document.getElementById("locationLink");
    const attachmentRow = document.getElementById("attachmentRow");
    const attachmentPreview = document.getElementById("attachmentPreview");
    const emergencyContactRow = document.getElementById("emergencyContactRow");
    const destinationRow = document.getElementById("destinationRow");
    const destinationText = document.getElementById("destinationText");
    const approvedStamp = document.getElementById("approvedStamp");
    const serviceBtn = document.getElementById("serviceBtn");

    applyBannerStatus(config);

    document.getElementById("userAvatar").textContent = config.userAvatarText;
    avatarBadge.style.backgroundColor = config.avatarBgColor || "";
    document.getElementById("userName").textContent = config.userName;
    document.getElementById("userId").textContent = config.userId;

    const needLeaveSchool = document.getElementById("needLeaveSchool");
    const cancelRuleText = document.getElementById("cancelRuleText");
    const cancelRuleColor = config.cancelRuleColor || "";
    document.getElementById("leaveType").textContent = config.leaveType;
    needLeaveSchool.textContent = config.needLeaveSchool;
    needLeaveSchool.style.color = config.needLeaveSchoolUseCancelRuleColor ? cancelRuleColor : "";
    cancelRuleText.textContent = config.cancelRuleText;
    cancelRuleText.style.color = cancelRuleColor;
    applyActualVacationTime(config);

    document.getElementById("startTime").textContent = config.startTime;
    document.getElementById("endTime").textContent = config.endTime;
    document.getElementById("durationBadge").textContent = config.durationText;
    document.getElementById("approvalFlow").textContent = config.approvalFlow;
    document.getElementById("emergencyContact").textContent = config.emergencyContact || "-";
    emergencyContactRow.hidden = !config.showEmergencyContact;
    document.getElementById("approver").textContent = config.approver;
    document.getElementById("leaveReason").textContent = config.leaveReason;
    document.getElementById("ccPerson").textContent = config.ccPerson;
    applyDestination(destinationRow, destinationText, config.destination, config);
    document.getElementById("dormInfo").textContent = config.dormInfo;
    document.getElementById("disclaimerText").textContent = config.disclaimerText;

    const attachments = Array.isArray(config.attachments) ? config.attachments : [];
    applyLocationLink(locationLink, config.locationText, config.locationUrl);
    renderImageList(attachmentPreview, attachments);
    attachmentRow.hidden = attachments.length === 0 || !isOptionalVisible(config, "attachments");

    approvedStamp.hidden = !config.showApprovedStamp || !isOptionalVisible(config, "approvedStamp");

    document.getElementById("ruleStartTime").textContent = config.cancelRule?.startTime || "-";
    document.getElementById("ruleOperator").textContent = config.cancelRule?.operator || "-";

    const personalInfo = config.personalInfo || {};
    document.getElementById("piPhoto").textContent = personalInfo.photo || "-";
    document.getElementById("piName").textContent = personalInfo.name || "-";
    document.getElementById("piStudentId").textContent = personalInfo.studentId || "-";
    document.getElementById("piGender").textContent = personalInfo.gender || "-";
    document.getElementById("piGrade").textContent = personalInfo.grade || "-";
    document.getElementById("piCollege").textContent = personalInfo.college || "-";
    document.getElementById("piMajor").textContent = personalInfo.major || "-";
    document.getElementById("piClassName").textContent = personalInfo.className || "-";
    document.getElementById("piDorm").textContent = personalInfo.dorm || "-";

    applyOptionalVisibility(config);

    const serviceUrl = normalizeExternalUrl(config.serviceUrl);
    if (serviceUrl && isOptionalVisible(config, "service")) {
        serviceBtn.href = serviceUrl;
        serviceBtn.hidden = false;
    } else {
        serviceBtn.hidden = true;
    }

    completionInfoRenderSignature = "";
    applyCompletionInfo(config);
    revealApp();
}

function mergeConfig(base, override) {
    const result = Array.isArray(base) ? base.slice() : { ...base };
    Object.entries(override || {}).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            result[key] = value.slice();
            return;
        }

        if (value && typeof value === "object") {
            const source = result[key] && typeof result[key] === "object" ? result[key] : {};
            result[key] = mergeConfig(source, value);
            return;
        }

        result[key] = value;
    });
    return result;
}

function applyLocationLink(element, text, url) {
    if (!element) {
        return;
    }

    element.textContent = text || "";
    const normalizedUrl = normalizeExternalUrl(url);
    if (normalizedUrl) {
        element.href = normalizedUrl;
        element.target = "_blank";
        element.rel = "noreferrer";
    } else {
        element.removeAttribute("href");
        element.removeAttribute("target");
        element.removeAttribute("rel");
    }
}

function applyDestination(row, element, destination, config) {
    if (!row || !element) {
        return;
    }

    const text = formatDestinationText(destination);
    const visible = Boolean(destination?.enabled) && Boolean(text) && isOptionalVisible(config, "destination");
    row.hidden = !visible;
    element.textContent = visible ? text : "";
}

function applyOptionalVisibility(config) {
    [
        ["leaveType", "leaveType"],
        ["needLeaveSchool", "needLeaveSchool"],
        ["cancelRuleText", "cancelRule"],
        ["actualVacationTime", "actualVacationTime"],
        ["startTime", "startTime"],
        ["endTime", "endTime"],
        ["approvalFlow", "approvalFlow"],
        ["approver", "approver"],
        ["leaveReason", "leaveReason"],
        ["locationLink", "location"],
        ["ccPerson", "ccPerson"],
        ["dormInfo", "dormInfo"],
        ["disclaimerText", "disclaimer"]
    ].forEach(([elementId, key]) => {
        setOptionalRowVisibility(document.getElementById(elementId), config, key);
    });
    setOptionalRowVisibility(
        document.getElementById("emergencyContact"),
        config,
        "emergencyContact",
        Boolean(config.showEmergencyContact)
    );
}

function setOptionalRowVisibility(element, config, key, baseVisible = true) {
    const row = element?.closest(".meta-item") || element?.closest(".flex");
    if (!row) {
        return;
    }

    row.hidden = !baseVisible || !isOptionalVisible(config, key);
}

function isOptionalVisible(config, key) {
    if (!config?.optionalVisibilityEnabled) {
        return true;
    }

    return Boolean(config.visibleFields && config.visibleFields[key]);
}

function formatDestinationText(destination) {
    return [
        destination?.province,
        destination?.city,
        destination?.county,
        destination?.detail
    ]
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .join("/");
}

function renderImageList(container, items) {
    if (!container) {
        return;
    }

    const images = (Array.isArray(items) ? items : [])
        .map(normalizeAttachmentImage)
        .filter((item) => item.originalUrl);
    const signature = images.map((item) => `${item.originalUrl}|${item.previewUrl}`).join("\n");
    if (container.dataset.attachmentSignature === signature) {
        return;
    }

    container.dataset.attachmentSignature = signature;
    container.innerHTML = "";
    images.forEach((item, index) => {
        const wrapper = document.createElement("div");
        wrapper.className = "attachment-item";

        const img = document.createElement("img");
        img.alt = `附件 ${index + 1}`;
        img.className = "attachment-img";
        img.loading = "lazy";
        img.decoding = "async";
        img.dataset.src = item.previewUrl || item.originalUrl;
        img.dataset.fallbackSrc = item.originalUrl;
        img.addEventListener("error", handleAttachmentPreviewError, { once: true });
        queueAttachmentImageLoad(img);

        wrapper.appendChild(img);
        container.appendChild(wrapper);
    });
}

function normalizeAttachmentImage(item) {
    const originalUrl = normalizeAttachmentUrl(typeof item === "string" ? item : item?.url || item?.originalUrl);
    const explicitPreviewUrl = normalizeAttachmentUrl(item?.previewUrl || item?.thumbnailUrl || "");

    return {
        originalUrl,
        previewUrl: explicitPreviewUrl || getAttachmentPreviewUrl(originalUrl)
    };
}

function getAttachmentPreviewUrl(value) {
    const normalized = normalizeAttachmentUrl(value);
    if (!normalized) {
        return "";
    }

    try {
        const url = new URL(normalized);
        const replacements = [
            ["/uploads/attachments/", "/uploads/attachment-previews/"],
            ["/completion-uploads/completion-attachments/", "/completion-uploads/completion-attachment-previews/"]
        ];

        for (const [originalPrefix, previewPrefix] of replacements) {
            if (url.pathname.startsWith(originalPrefix)) {
                url.pathname = replaceUrlPathExtension(
                    `${previewPrefix}${url.pathname.slice(originalPrefix.length)}`,
                    ATTACHMENT_PREVIEW_EXTENSION
                );
                url.search = "";
                url.hash = "";
                return url.toString();
            }
        }
    } catch {
        return normalized;
    }

    return normalized;
}

function normalizeAttachmentUrl(value) {
    return normalizeExternalUrl(value);
}

function normalizeExternalUrl(value) {
    const text = String(value || "").trim();
    if (!text) {
        return "";
    }

    try {
        const url = new URL(text);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
            return "";
        }

        return url.toString();
    } catch {
        return "";
    }
}

function replaceUrlPathExtension(path, extension) {
    const slashIndex = path.lastIndexOf("/");
    const dotIndex = path.lastIndexOf(".");
    if (dotIndex > slashIndex) {
        return `${path.slice(0, dotIndex)}${extension}`;
    }

    return `${path}${extension}`;
}

function queueAttachmentImageLoad(image) {
    pendingAttachmentImages.add(image);
    if (attachmentImageLoadScheduled) {
        return;
    }

    attachmentImageLoadScheduled = true;
    if (window.requestIdleCallback) {
        window.requestIdleCallback(loadPendingAttachmentImages, { timeout: 600 });
    } else {
        window.requestAnimationFrame(loadPendingAttachmentImages);
    }
}

function loadPendingAttachmentImages() {
    attachmentImageLoadScheduled = false;
    const images = Array.from(pendingAttachmentImages);
    pendingAttachmentImages.clear();

    images.forEach((image) => {
        const src = image.dataset.src || "";
        if (src && image.isConnected && !image.getAttribute("src")) {
            image.src = src;
        }
    });
}

function handleAttachmentPreviewError(event) {
    const image = event.currentTarget;
    const fallbackSrc = image?.dataset?.fallbackSrc || "";
    if (!fallbackSrc || image.src === fallbackSrc) {
        return;
    }

    image.removeAttribute("data-fallback-src");
    image.src = fallbackSrc;
}

function applyCompletionInfo(config) {
    const section = document.getElementById("completionInfoSection");
    if (!section) {
        return;
    }

    const completionInfo = config?.completionInfo || {};
    const showAt = parseBeijingDateTime(completionInfo.showAtBeijing);
    const isVisible =
        Boolean(completionInfo.enabled) &&
        isOptionalVisible(config, "completionInfo") &&
        (showAt === null || Date.now() >= showAt);

    const completionAttachments = Array.isArray(completionInfo.attachments)
        ? completionInfo.attachments
        : [];
    const completionLocationText = completionInfo.inheritLeaveLocation === false
        ? completionInfo.locationText || ""
        : config.locationText || "";
    const completionLocationUrl = completionInfo.inheritLeaveLocation === false
        ? completionInfo.locationUrl || ""
        : config.locationUrl || "";
    const statusText = completionInfo.statusText || COMPLETED_STATUS_TEXT;
    const statusActionText = completionInfo.statusActionText || "";
    const statusActionUrl = normalizeExternalUrl(completionInfo.statusActionUrl || "");
    const approvalFlow = completionInfo.approvalFlow || {};
    const completionStatusVisible = isOptionalVisible(config, "completionStatus");
    const completionAttachmentsVisible = isOptionalVisible(config, "completionAttachments");
    const completionLocationVisible = isOptionalVisible(config, "completionLocation");
    const renderSignature = JSON.stringify({
        isVisible,
        completionAttachments,
        completionLocationText,
        completionLocationUrl,
        statusText,
        statusActionText,
        statusActionUrl,
        approvalFlow,
        completionStatusVisible,
        completionAttachmentsVisible,
        completionLocationVisible
    });

    if (completionInfoRenderSignature === renderSignature) {
        return;
    }
    completionInfoRenderSignature = renderSignature;

    section.hidden = !isVisible;
    if (!isVisible) {
        return;
    }

    const actionButton = document.getElementById("completionActionButton");

    document.getElementById("completionStatusText").textContent = statusText;
    renderCompletionFlowModal(approvalFlow);

    const actionLink = document.getElementById("completionActionLink");
    const actionText = document.getElementById("completionActionText");
    const completionStatusRow = document.getElementById("completionStatusText")?.closest(".flex");
    if (completionStatusRow) {
        completionStatusRow.hidden = !completionStatusVisible;
    }

    if (!completionStatusVisible) {
        actionButton.hidden = true;
        actionButton.textContent = "";
        actionLink.hidden = true;
        actionLink.textContent = "";
        actionLink.removeAttribute("href");
        actionText.hidden = true;
        actionText.textContent = "";
    } else if (statusActionText && hasCompletionApprovalFlow(approvalFlow)) {
        actionButton.hidden = false;
        actionButton.textContent = statusActionText;
        actionLink.hidden = true;
        actionLink.textContent = "";
        actionLink.removeAttribute("href");
        actionText.hidden = true;
        actionText.textContent = "";
    } else if (statusActionText && statusActionUrl) {
        actionButton.hidden = true;
        actionButton.textContent = "";
        actionLink.hidden = false;
        actionLink.textContent = statusActionText;
        actionLink.href = statusActionUrl;
        actionText.hidden = true;
        actionText.textContent = "";
    } else if (statusActionText) {
        actionButton.hidden = true;
        actionButton.textContent = "";
        actionLink.hidden = true;
        actionLink.textContent = "";
        actionLink.removeAttribute("href");
        actionText.hidden = false;
        actionText.textContent = statusActionText;
    } else {
        actionButton.hidden = true;
        actionButton.textContent = "";
        actionLink.hidden = true;
        actionLink.textContent = "";
        actionLink.removeAttribute("href");
        actionText.hidden = true;
        actionText.textContent = "";
    }

    const completionAttachmentRow = document.getElementById("completionAttachmentRow");
    const completionAttachmentPreview = document.getElementById("completionAttachmentPreview");
    renderImageList(completionAttachmentPreview, completionAttachments);
    completionAttachmentRow.hidden =
        completionAttachments.length === 0 || !completionAttachmentsVisible;

    const completionLocationRow = document.getElementById("completionLocationRow");
    const completionLocationLink = document.getElementById("completionLocationLink");
    applyLocationLink(completionLocationLink, completionLocationText, completionLocationUrl);
    completionLocationRow.hidden =
        !completionLocationText || !completionLocationVisible;
}

function getCompletionApprovalSteps(approvalFlow) {
    const flow = approvalFlow && typeof approvalFlow === "object" ? approvalFlow : {};
    return [flow.firstStep, flow.secondStep]
        .map((step, index) => normalizeCompletionApprovalStep(step, index === 0 ? "primary" : "success"))
        .filter((step) => step.actor || step.timeText);
}

function normalizeCompletionApprovalStep(step, fallbackTheme) {
    const value = step && typeof step === "object" ? step : {};
    const theme = typeof value.theme === "string" ? value.theme.trim().toLowerCase() : "";
    return {
        actor: typeof value.actor === "string" ? value.actor.trim() : "",
        actionText: typeof value.actionText === "string" ? value.actionText.trim() : "",
        timeText: typeof value.timeText === "string" ? value.timeText.trim() : "",
        opinion: typeof value.opinion === "string" ? value.opinion.trim() : "",
        theme: ["primary", "success", "warning", "error", "grey"].includes(theme) ? theme : fallbackTheme
    };
}

function hasCompletionApprovalFlow(approvalFlow) {
    return getCompletionApprovalSteps(approvalFlow).length > 0;
}

function renderCompletionFlowModal(approvalFlow) {
    const title = document.getElementById("completionFlowTitle");
    const body = document.getElementById("completionFlowBody");
    const confirmButton = document.getElementById("completionFlowConfirmBtn");
    if (!title || !body || !confirmButton) {
        return;
    }

    const flow = approvalFlow && typeof approvalFlow === "object" ? approvalFlow : {};
    const steps = getCompletionApprovalSteps(flow);

    title.textContent = flow.title || "销假审批流程";
    confirmButton.textContent = flow.confirmText || "知道了";
    body.innerHTML = steps
        .map((step, index) => {
            const isLast = index === steps.length - 1;
            return `
                <div class="completion-flow-step${isLast ? " completion-flow-step--last" : ""}">
                    <div class="completion-flow-step__row">
                        <span class="completion-flow-step__dot completion-flow-step__dot--${escapeHtml(step.theme)}"></span>
                        <div class="completion-flow-step__main">
                            <span class="completion-flow-step__actor">${escapeHtml(step.actor)}</span>${step.actor && step.actionText ? '<span class="completion-flow-step__separator"> - </span>' : ""}<span class="completion-flow-step__status completion-flow-step__status--${escapeHtml(step.theme)}">${escapeHtml(step.actionText)}</span>
                        </div>
                        <span class="completion-flow-step__time">${escapeHtml(step.timeText)}</span>
                    </div>
                    ${step.opinion ? `<div class="completion-flow-step__opinion">审批意见：${escapeHtml(step.opinion)}</div>` : ""}
                </div>
            `;
        })
        .join("");
}

function updateTime() {
    const parts = getBeijingTimeParts();

    document.getElementById("currentTime").textContent =
        `\u5f53\u524d\u65f6\u95f4:${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;

    if (activeConfig) {
        applyBannerStatus(activeConfig);
        applyActualVacationTime(activeConfig);
        applyCompletionInfo(activeConfig);
    }
}

function applyActualVacationTime(config) {
    const actualVacationTime = document.getElementById("actualVacationTime");
    if (!actualVacationTime) {
        return;
    }

    actualVacationTime.textContent = shouldShowActualVacationTime(config)
        ? config.actualVacationTime || "-"
        : "-";
}

function shouldShowActualVacationTime(config) {
    const completedSwitchAt = parseBeijingDateTime(
        config.completedSwitchAtBeijing || config.statusSwitchAtBeijing
    );
    const legacyCompletedEnabled =
        config.completedStatusEnabled === undefined && Boolean(config.statusSwitchAtBeijing);
    const completedEnabled = Boolean(config.completedStatusEnabled) || legacyCompletedEnabled;

    if (!completedEnabled) {
        return false;
    }

    return completedSwitchAt !== null && Date.now() >= completedSwitchAt;
}

function revealApp() {
    const app = document.getElementById("app");
    if (app) {
        app.classList.remove("app-pending");
    }
}

function applyBannerStatus(config) {
    const flagDom = document.getElementById("flagDom");
    if (!flagDom) {
        return;
    }

    const bannerStatus = resolveBannerStatus(config);

    document.getElementById("statusText").textContent = bannerStatus.text;
    document.getElementById("statusSubText").textContent = config.statusSubText || "";

    flagDom.className = "flag-dom relative";
    flagDom.classList.add(`flag-${bannerStatus.type}`);
}

function resolveBannerStatus(config) {
    const now = Date.now();
    const upcomingSwitchAt = parseBeijingDateTime(config.upcomingSwitchAtBeijing);
    const completedSwitchAt = parseBeijingDateTime(
        config.completedSwitchAtBeijing || config.statusSwitchAtBeijing
    );
    const legacyCompletedEnabled =
        config.completedStatusEnabled === undefined && Boolean(config.statusSwitchAtBeijing);
    const completedEnabled = Boolean(config.completedStatusEnabled) || legacyCompletedEnabled;
    const managedStatuses =
        Boolean(config.upcomingStatusEnabled) ||
        Boolean(config.completedStatusEnabled) ||
        legacyCompletedEnabled;

    if (completedEnabled && completedSwitchAt !== null && now >= completedSwitchAt) {
        return {
            text: COMPLETED_STATUS_TEXT,
            type: COMPLETED_STATUS_TYPE
        };
    }

    if (config.upcomingStatusEnabled && upcomingSwitchAt !== null && now < upcomingSwitchAt) {
        return {
            text: UPCOMING_STATUS_TEXT,
            type: UPCOMING_STATUS_TYPE
        };
    }

    return {
        text: managedStatuses ? ACTIVE_STATUS_TEXT : config.statusText || ACTIVE_STATUS_TEXT,
        type: managedStatuses ? ACTIVE_STATUS_TYPE : config.statusType || ACTIVE_STATUS_TYPE
    };
}

function getBeijingTimeParts() {
    const parts = {};
    BEIJING_TIME_FORMATTER.formatToParts(new Date()).forEach((part) => {
        if (part.type !== "literal") {
            parts[part.type] = part.value;
        }
    });

    return {
        year: parts.year || "0000",
        month: parts.month || "00",
        day: parts.day || "00",
        hour: parts.hour || "00",
        minute: parts.minute || "00",
        second: parts.second || "00"
    };
}

function parseBeijingDateTime(value) {
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
    const timestamp = Date.UTC(year, month - 1, day, hour - 8, minute, second);

    return Number.isNaN(timestamp) ? null : timestamp;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function showCancelRuleModal() {
    document.getElementById("cancelRuleModal").classList.add("active");
}

function hideCancelRuleModal(event) {
    if (event && event.target && event.target !== document.getElementById("cancelRuleModal")) {
        return;
    }

    document.getElementById("cancelRuleModal").classList.remove("active");
}

function showPersonalInfoModal() {
    document.getElementById("personalInfoModal").classList.add("active");
}

function hidePersonalInfoModal(event) {
    if (event && event.target && event.target !== document.getElementById("personalInfoModal")) {
        return;
    }

    document.getElementById("personalInfoModal").classList.remove("active");
}

function showCompletionFlowModal() {
    if (!activeConfig || !hasCompletionApprovalFlow(activeConfig.completionInfo?.approvalFlow)) {
        return;
    }

    document.getElementById("completionFlowModal").classList.add("active");
}

function hideCompletionFlowModal(event) {
    if (event && event.target && event.target !== document.getElementById("completionFlowModal")) {
        return;
    }

    document.getElementById("completionFlowModal").classList.remove("active");
}

function renderFatalState(message) {
    document.body.innerHTML = `
        <div style="min-height: 100vh; display: grid; place-items: center; padding: 24px; background: #f5f7f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            <div style="width: min(420px, 100%); background: #ffffff; border-radius: 18px; padding: 24px; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08); color: #334155;">
                <h1 style="margin: 0 0 12px; font-size: 22px;">页面无法打开</h1>
                <p style="margin: 0; line-height: 1.7;">${message}</p>
            </div>
        </div>
    `;
}

function showPageLoading() {
    const loading = document.getElementById("pageLoading");
    if (!loading) {
        return;
    }

    pageLoadingShownAt = Date.now();
    loading.hidden = false;
    loading.classList.add("active");
}

function hidePageLoading() {
    const loading = document.getElementById("pageLoading");
    if (!loading) {
        return;
    }

    const elapsed = Date.now() - pageLoadingShownAt;
    const remaining = Math.max(0, PAGE_LOADING_MIN_DURATION_MS - elapsed);

    window.setTimeout(() => {
        loading.classList.remove("active");
        window.setTimeout(() => {
            loading.hidden = true;
        }, PAGE_LOADING_FADE_DURATION_MS);
    }, remaining);
}

async function bootstrapPage() {
    showPageLoading();

    try {
        await initPage();
    } finally {
        hidePageLoading();
    }
}

document.addEventListener("DOMContentLoaded", bootstrapPage);

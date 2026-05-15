const ATTACHMENT_TEXT_FIELD = "attachmentsText";
const COMPLETION_ATTACHMENT_TEXT_FIELD = "completionAttachmentsText";
const ATTACHMENT_UPLOAD_ENDPOINT = "/login/api/uploads";
const COMPLETION_ATTACHMENT_UPLOAD_ENDPOINT = "/login/api/completion-uploads";
const MAX_ATTACHMENT_UPLOAD_BYTES = 10 * 1024 * 1024;
const ATTACHMENT_PREVIEW_MAX_SIDE = 240;
const ATTACHMENT_PREVIEW_QUALITY = 0.72;
const ATTACHMENT_PREVIEW_MIME_TYPE = "image/webp";
const ATTACHMENT_PREVIEW_EXTENSION = ".webp";
const CHINA_DIVISIONS_SCRIPT_SRC = "/china-divisions.js?v=20260511-china-divisions";
let CHINA_DIVISIONS = getChinaDivisionsFromWindow();
let chinaDivisionsLoadPromise = null;
let chinaDivisionsLoadScheduled = false;
const OPTIONAL_VISIBLE_FIELDS_FIELD = "visibleFields";
const SHARE_ROOT_DOMAIN = "example.com";
const DEFAULT_SHARE_SUBDOMAIN = "app";
const SHARE_PATH = "/wec-counselor-leave-apps/leave/share/index.html";
const DEFAULT_CANCEL_RULE_COLOR = "#f4a11a";
const TEXT_COLOR_MODE_FIELD = "textColorModeEnabled";
const TEXT_COLOR_FIELD_PREFIX = "textColor:";
const DEFAULT_TEXT_COLOR = "#657180";
const TEXT_COLOR_FIELD_DEFAULTS = {
    statusSubText: "#ffffff",
    userAvatarText: "#ffffff",
    userName: "#464c5b",
    userId: "#657180",
    leaveType: "#657180",
    needLeaveSchool: "#657180",
    cancelRuleText: DEFAULT_CANCEL_RULE_COLOR,
    actualVacationTime: "#657180",
    startTime: "#657180",
    endTime: "#657180",
    durationText: "#3399ff",
    approvalFlow: "#657180",
    emergencyContact: "#657180",
    approver: "#657180",
    leaveReason: "#657180",
    locationText: "#3399ff",
    ccPerson: "#657180",
    "destination.detail": "#657180",
    dormInfo: "#657180",
    disclaimerText: "#ff9900",
    "completionInfo.statusText": "#00cc66",
    "completionInfo.statusActionText": "#3399ff",
    "completionInfo.locationText": "#3399ff",
    "completionInfo.approvalFlow.title": "#464c5b",
    "completionInfo.approvalFlow.confirmText": "#3399ff",
    "completionInfo.approvalFlow.firstStep.actor": "#657180",
    "completionInfo.approvalFlow.firstStep.actionText": "#657180",
    "completionInfo.approvalFlow.firstStep.timeText": "#9ea7b4",
    "completionInfo.approvalFlow.firstStep.opinion": "#9ea7b4",
    "completionInfo.approvalFlow.secondStep.actor": "#657180",
    "completionInfo.approvalFlow.secondStep.actionText": "#00cc66",
    "completionInfo.approvalFlow.secondStep.timeText": "#9ea7b4",
    "completionInfo.approvalFlow.secondStep.opinion": "#9ea7b4",
    "cancelRule.startTime": "#657180",
    "cancelRule.operator": "#657180",
    "personalInfo.photo": "#657180",
    "personalInfo.name": "#657180",
    "personalInfo.studentId": "#657180",
    "personalInfo.gender": "#657180",
    "personalInfo.grade": "#657180",
    "personalInfo.college": "#657180",
    "personalInfo.major": "#657180",
    "personalInfo.className": "#657180",
    "personalInfo.dorm": "#657180"
};
const APPROVAL_THEME_COLORS = {
    primary: { color: "#3399ff", textColor: "#657180", label: "蓝色" },
    success: { color: "#00cc66", textColor: "#00cc66", label: "绿色" },
    warning: { color: "#ff9900", textColor: "#ff9900", label: "橙色" },
    error: { color: "#ff4400", textColor: "#ff4400", label: "红色" },
    grey: { color: "#9ea7b4", textColor: "#9ea7b4", label: "灰色" }
};
const TIME_WHEEL_FIELDS = {
    upcomingSwitchAtBeijing: { format: "year-minute" },
    completedSwitchAtBeijing: { format: "year-minute" },
    startTime: { format: "month-day-minute" },
    endTime: { format: "month-day-minute" },
    "completionInfo.showAtBeijing": { format: "year-minute" },
    "completionInfo.approvalFlow.firstStep.timeText": { format: "smart", fallbackFormat: "month-day-minute" },
    "completionInfo.approvalFlow.secondStep.timeText": { format: "smart", fallbackFormat: "month-day-minute" },
    "cancelRule.startTime": { format: "year-second" },
    expiresAtBeijing: { format: "year-minute" }
};
const AUTO_TIME_OUTPUT_FIELDS = new Set(["actualVacationTime", "durationText"]);
const LINKED_STATUS_TIME_FIELDS = [
    { leaveField: "startTime", statusField: "upcomingSwitchAtBeijing" },
    { leaveField: "endTime", statusField: "completedSwitchAtBeijing" }
];
const TIME_WHEEL_SCROLL_DEBOUNCE_MS = 80;
const VACATION_DURATION_CONFIRM_THRESHOLD_MINUTES = 30 * 24 * 60;
const OPTIONAL_DISPLAY_FIELDS = [
    { key: "leaveType", path: "leaveType" },
    { key: "needLeaveSchool", path: "needLeaveSchool" },
    { key: "cancelRule", path: "cancelRuleText" },
    { key: "actualVacationTime", path: "actualVacationTime" },
    { key: "startTime", path: "startTime" },
    { key: "endTime", path: "endTime" },
    { key: "approvalFlow", path: "approvalFlow" },
    { key: "emergencyContact", path: "emergencyContact" },
    { key: "approver", path: "approver" },
    { key: "leaveReason", path: "leaveReason" },
    { key: "location", path: "locationText" },
    { key: "ccPerson", path: "ccPerson" },
    { key: "destination", path: "destination" },
    { key: "dormInfo", path: "dormInfo" },
    { key: "approvedStamp", path: "showApprovedStamp" },
    { key: "disclaimer", path: "disclaimerText" },
    { key: "service", path: "serviceUrl" },
    { key: "completionInfo", path: "completionInfo.enabled" },
    { key: "completionStatus", path: "completionInfo.statusText" },
    { key: "completionLocation", path: "completionInfo.locationText" }
];
const OPTIONAL_FIELD_BY_PATH = new Map(OPTIONAL_DISPLAY_FIELDS.map((item) => [item.path, item]));

const FIELD_GROUPS = [
    {
        title: "显示控制",
        hint: "开启后，符合条件的前端子项目会出现“前端显示”勾选项；取消勾选后保存，前端页面不再显示该项。",
        fields: [
            { path: "optionalVisibilityEnabled", label: "所有可选模式", type: "checkbox", span: 2 },
            { path: TEXT_COLOR_MODE_FIELD, label: "所有字体选择颜色模式", type: "checkbox", span: 2 }
        ]
    },
    {
        title: "状态栏",
        hint: "这里控制顶部横幅的三种状态；开启“已完成”后，实际休假时间会到达切换时间才在前端显示。",
        fields: [
            { path: "statusSubText", label: "副状态文本" },
            { path: "upcomingStatusEnabled", label: "开启“即将休假”", type: "checkbox" },
            { path: "upcomingSwitchAtBeijing", label: "“即将休假”切换到“正在休假中”时间点", type: "datetime-local", span: 2 },
            { path: "completedStatusEnabled", label: "开启“已完成”", type: "checkbox" },
            { path: "completedSwitchAtBeijing", label: "“正在休假中”切换到“已完成”时间点", type: "datetime-local", span: 2 }
        ]
    },
    {
        title: "头像卡片",
        hint: "显示在主卡片上的姓名、学号和头像缩写。",
        fields: [
            { path: "userName", label: "姓名" },
            { path: "userAvatarText", label: "头像文字" },
            { path: "userId", label: "学号/编号" },
            { path: "avatarBgColor", label: "头像背景色", type: "color" }
        ]
    },
    {
        title: "请假信息",
        hint: "这是页面正文最主要的一组信息。",
        fields: [
            { path: "leaveType", label: "请假类型" },
            {
                path: "needLeaveSchool",
                label: "是否离校",
                labelToggle: { path: "needLeaveSchoolUseCancelRuleColor", label: "是否与销假规则文字同色" }
            },
            { path: "cancelRuleText", label: "销假规则", type: "textarea", span: 2 },
            { path: "cancelRuleColor", label: "销假规则颜色", type: "color", defaultColor: DEFAULT_CANCEL_RULE_COLOR },
            { path: "actualVacationTime", label: "实际休假时间" },
            { path: "startTime", label: "开始时间" },
            { path: "endTime", label: "结束时间" },
            { path: "durationText", label: "时长标签" },
            { path: "approvalFlow", label: "审批流程" },
            { path: "emergencyContact", label: "紧急联系人" },
            { path: "showEmergencyContact", label: "显示紧急联系人", type: "checkbox", span: 2 },
            { path: "approver", label: "审批人" },
            { path: "leaveReason", label: "请假原因", type: "textarea", span: 2 },
            { path: "locationText", label: "发起位置", type: "textarea", span: 2 },
            {
                path: "locationUrl",
                label: "位置跳转链接",
                type: "map-link",
                span: 2,
                locationTextPath: "locationText"
            },
            { path: "ccPerson", label: "抄送人" },
            { path: "destination", label: "目的地", type: "destination", span: 2 },
            { path: "dormInfo", label: "宿舍信息" },
            {
                path: ATTACHMENT_TEXT_FIELD,
                label: "附件链接（可手填）",
                type: "textarea",
                span: 2,
                placeholder: "一行一个 https 图片地址，上传到 R2 后会自动填入"
            },
            { path: "showApprovedStamp", label: "显示审批通过章", type: "checkbox", span: 2 },
            { path: "disclaimerText", label: "底部声明", type: "textarea", span: 2 },
            { path: "serviceUrl", label: "智能客服链接", type: "textarea", span: 2 }
        ]
    },
    {
        title: "销假信息",
        hint: "控制前端“销假信息”卡片的显示、图片、状态和位置。",
        fields: [
            { path: "completionInfo.enabled", label: "开启销假信息", type: "checkbox", span: 2 },
            { path: "completionInfo.showAtBeijing", label: "开始显示时间（北京时间）", type: "datetime-local", span: 2 },
            { path: "completionInfo.statusText", label: "销假状态" },
            { path: "completionInfo.statusActionText", label: "状态侧文字" },
            { path: "completionInfo.statusActionUrl", label: "状态跳转链接（留空则弹审批流程）", type: "textarea", span: 2 },
            { path: "completionInfo.inheritLeaveLocation", label: "沿用上方定位信息", type: "checkbox", span: 2 },
            { path: "completionInfo.locationText", label: "销假位置", type: "textarea", span: 2 },
            {
                path: "completionInfo.locationUrl",
                label: "销假位置跳转链接",
                type: "map-link",
                span: 2,
                locationTextPath: "completionInfo.locationText"
            },
            {
                path: COMPLETION_ATTACHMENT_TEXT_FIELD,
                label: "销假图片链接（可手填）",
                type: "textarea",
                span: 2,
                placeholder: "一行一个 https 图片地址，上传到 R2 后会自动填入"
            }
        ]
    },
    {
        title: "销假审批流程",
        hint: "点击“查看审批流程 >”后会弹出这个二级浮层，下面这些内容都可以直接编辑。",
        fields: [
            { path: "completionInfo.approvalFlow.title", label: "弹层标题", span: 2 },
            { path: "completionInfo.approvalFlow.confirmText", label: "底部按钮文案", span: 2 },
            { path: "completionInfo.approvalFlow.firstStep.actor", label: "节点一姓名" },
            { path: "completionInfo.approvalFlow.firstStep.actionText", label: "节点一状态" },
            { path: "completionInfo.approvalFlow.firstStep.timeText", label: "节点一时间" },
            {
                path: "completionInfo.approvalFlow.firstStep.theme",
                label: "节点一颜色",
                type: "theme-color",
                options: [
                    { value: "primary", label: "primary" },
                    { value: "success", label: "success" },
                    { value: "warning", label: "warning" },
                    { value: "error", label: "error" },
                    { value: "grey", label: "grey" }
                ]
            },
            { path: "completionInfo.approvalFlow.firstStep.opinion", label: "节点一审批意见", type: "textarea", span: 2 },
            { path: "completionInfo.approvalFlow.secondStep.actor", label: "节点二姓名" },
            { path: "completionInfo.approvalFlow.secondStep.actionText", label: "节点二状态" },
            { path: "completionInfo.approvalFlow.secondStep.timeText", label: "节点二时间" },
            {
                path: "completionInfo.approvalFlow.secondStep.theme",
                label: "节点二颜色",
                type: "theme-color",
                options: [
                    { value: "success", label: "success" },
                    { value: "primary", label: "primary" },
                    { value: "warning", label: "warning" },
                    { value: "error", label: "error" },
                    { value: "grey", label: "grey" }
                ]
            },
            { path: "completionInfo.approvalFlow.secondStep.opinion", label: "节点二审批意见", type: "textarea", span: 2 }
        ]
    },
    {
        title: "销假弹窗",
        hint: "点击“查看”时弹出的说明内容。",
        fields: [
            { path: "cancelRule.startTime", label: "开启时间" },
            { path: "cancelRule.operator", label: "操作人" }
        ]
    },
    {
        title: "个人信息弹窗",
        hint: "二级菜单“个人信息”里的所有字段都在这里。",
        fields: [
            { path: "personalInfo.photo", label: "照片说明" },
            { path: "personalInfo.name", label: "姓名" },
            { path: "personalInfo.studentId", label: "学号" },
            { path: "personalInfo.gender", label: "性别" },
            { path: "personalInfo.grade", label: "年级" },
            { path: "personalInfo.college", label: "学院" },
            { path: "personalInfo.major", label: "专业" },
            { path: "personalInfo.className", label: "班级" },
            { path: "personalInfo.dorm", label: "宿舍" }
        ]
    },
    {
        title: "失效控制",
        hint: "这里设定链接的北京时间，到期后页面将无法打开。",
        fields: [
            { path: "expiresAtBeijing", label: "北京时间失效时间", type: "datetime-local", span: 2 }
        ]
    }
];

const IMAGE_UPLOADERS = {
    leave: {
        title: "请假附件上传",
        endpoint: ATTACHMENT_UPLOAD_ENDPOINT,
        fieldName: ATTACHMENT_TEXT_FIELD,
        inputId: "attachmentFileInput",
        buttonId: "uploadAttachmentBtn",
        feedbackId: "attachmentUploadFeedback",
        managerId: "attachmentManager",
        countId: "leaveAttachmentCountValue",
        emptyText: "当前没有请假附件。上传图片后会显示在这里。",
        uploadNoticeKey: "attachmentNotice",
        uploadErrorKey: "attachmentError",
        uploadProgressKey: "attachmentProgress",
        uploadingKey: "uploadingAttachments"
    },
    completion: {
        title: "销假图片上传",
        endpoint: COMPLETION_ATTACHMENT_UPLOAD_ENDPOINT,
        fieldName: COMPLETION_ATTACHMENT_TEXT_FIELD,
        inputId: "completionAttachmentFileInput",
        buttonId: "uploadCompletionAttachmentBtn",
        feedbackId: "completionAttachmentUploadFeedback",
        managerId: "completionAttachmentManager",
        countId: "completionAttachmentCountValue",
        emptyText: "当前没有销假图片。上传图片后会显示在这里。",
        uploadNoticeKey: "completionAttachmentNotice",
        uploadErrorKey: "completionAttachmentError",
        uploadProgressKey: "completionAttachmentProgress",
        uploadingKey: "uploadingCompletionAttachments"
    }
};

const state = {
    authenticated: false,
    username: "",
    template: null,
    shares: [],
    trash: [],
    sharesLoading: false,
    trashLoading: false,
    sharesError: "",
    trashError: "",
    currentRecord: null,
    message: "",
    error: "",
    attachmentNotice: "",
    attachmentError: "",
    attachmentProgress: null,
    completionAttachmentNotice: "",
    completionAttachmentError: "",
    completionAttachmentProgress: null,
    uploadingAttachments: false,
    uploadingCompletionAttachments: false,
    saving: false,
    destroyingShareId: "",
    restoringShareId: "",
    loggingOut: false
};

let dashboardListLoadToken = 0;

document.addEventListener("DOMContentLoaded", bootstrap);

async function bootstrap() {
    renderLoading();
    startClock();
    const session = await fetchSession();
    state.authenticated = session.authenticated;
    state.username = session.username || "";

    if (!state.authenticated) {
        renderLogin();
        return;
    }

    try {
        await loadDashboard();
    } catch (error) {
        state.authenticated = false;
        state.username = "";
        renderLogin();
        const feedback = document.getElementById("loginFeedback");
        if (feedback) {
            feedback.innerHTML = `<div class="error">后台配置加载失败：${escapeHtml(error.message)}</div>`;
        }
    }
}

function renderLoading() {
    document.getElementById("app").innerHTML = `
        <div class="panel loading">正在加载后台...</div>
    `;
}

function renderLogin() {
    document.getElementById("app").innerHTML = `
        <section class="panel login-shell">
            <h2>后台登录</h2>
            <p>登录地址固定为 <strong>app.example.com/login</strong>。如果当前邮箱已被超级管理员授权，继续后会进入后台。</p>
            <button class="primary-btn" type="button" id="accessLoginBtn">使用 Cloudflare Access 登录</button>
            <div id="loginFeedback"></div>
        </section>
    `;

    document.getElementById("accessLoginBtn").addEventListener("click", () => window.location.reload());
    updateClock();
}

async function loadDashboard() {
    const token = ++dashboardListLoadToken;
    state.shares = [];
    state.trash = [];
    state.sharesLoading = true;
    state.trashLoading = true;
    state.sharesError = "";
    state.trashError = "";

    const templateResponse = await api("/login/api/template");
    if (!isCurrentDashboardLoad(token)) {
        return;
    }
    state.template = templateResponse.config;

    if (!state.currentRecord) {
        state.currentRecord = createBlankRecord();
    }

    renderDashboard();
    loadDashboardLists(token);
}

async function loadDashboardLists(token) {
    await Promise.all([
        loadSharesList(token),
        loadTrashList(token)
    ]);

    if (isCurrentDashboardLoad(token)) {
        scheduleChinaDivisionsBackgroundLoad();
    }
}

async function loadSharesList(token = dashboardListLoadToken) {
    if (!isCurrentDashboardLoad(token)) {
        return;
    }

    state.sharesLoading = true;
    state.sharesError = "";
    refreshShareListRegion();

    try {
        const response = await api("/login/api/shares");
        if (!isCurrentDashboardLoad(token)) {
            return;
        }
        state.shares = response.items || [];
    } catch (error) {
        if (!isCurrentDashboardLoad(token)) {
            return;
        }
        state.sharesError = error.message;
    } finally {
        if (isCurrentDashboardLoad(token)) {
            state.sharesLoading = false;
            refreshShareListRegion();
        }
    }
}

async function loadTrashList(token = dashboardListLoadToken) {
    if (!isCurrentDashboardLoad(token)) {
        return;
    }

    state.trashLoading = true;
    state.trashError = "";
    refreshTrashListRegion();

    try {
        const response = await api("/login/api/trash");
        if (!isCurrentDashboardLoad(token)) {
            return;
        }
        state.trash = response.items || [];
    } catch (error) {
        if (!isCurrentDashboardLoad(token)) {
            return;
        }
        state.trashError = error.message;
    } finally {
        if (isCurrentDashboardLoad(token)) {
            state.trashLoading = false;
            refreshTrashListRegion();
        }
    }
}

function isCurrentDashboardLoad(token) {
    return state.authenticated && token === dashboardListLoadToken;
}

function refreshShareListRegion() {
    const container = document.getElementById("shareListRegion");
    if (!container) {
        return;
    }

    container.innerHTML = renderShareList();
    bindShareListEvents(container);
}

function refreshTrashListRegion() {
    const container = document.getElementById("trashListRegion");
    if (!container) {
        return;
    }

    container.innerHTML = renderTrashList();
    bindTrashListEvents(container);

    const countText = document.getElementById("trashCountText");
    if (countText) {
        countText.textContent = renderTrashSummaryText();
    }
}

function createBlankRecord() {
    const config = clone(state.template || {});
    return {
        id: "",
        url: "",
        customSubdomainEnabled: false,
        customSubdomain: "",
        config,
        expiresAtBeijing: createDefaultExpiry(config)
    };
}

function renderDashboard() {
    const currentLink = state.currentRecord?.url || "";
    const currentId = state.currentRecord?.id || "尚未生成";
    const expiresAt = state.currentRecord?.expiresAtBeijing || "";
    const isEditingExisting = Boolean(state.currentRecord?.id);
    const saveButtonText = state.saving
        ? (isEditingExisting ? "保存中..." : "生成中...")
        : (isEditingExisting ? "保存当前链接" : "保存并生成链接");

    document.getElementById("app").innerHTML = `
        <section class="panel toolbar">
            <div>
                <strong>管理工作台</strong>
                <span>当前账号：${escapeHtml(state.username)}；登录入口：app.example.com/login</span>
            </div>
            <div class="toolbar-actions">
                <button class="secondary-btn" type="button" id="historyBtn"${state.saving ? " disabled" : ""}>封存库</button>
                <button class="ghost-btn" type="button" id="logoutBtn"${state.loggingOut ? " disabled" : ""}>${state.loggingOut ? "退出中..." : "退出登录"}</button>
            </div>
        </section>

        <div class="workspace">
            <section class="panel editor">
                <form id="editorForm" class="editor-grid">
                    ${renderCustomSubdomainField()}
                    ${FIELD_GROUPS.map(renderFieldGroup).join("")}
                    ${renderImageUploader("leave")}
                    ${renderImageUploader("completion")}
                    <div class="form-actions">
                        <button class="primary-btn" type="submit"${state.saving ? " disabled" : ""}>${escapeHtml(saveButtonText)}</button>
                        <button class="ghost-btn" type="button" id="copyCurrentBtn"${!currentLink || state.saving ? " disabled" : ""}>复制当前链接</button>
                        <button class="danger-btn" type="button" id="destroyCurrentBtn"${!state.currentRecord?.id || state.saving || state.destroyingShareId === state.currentRecord?.id ? " disabled" : ""}>${state.destroyingShareId === state.currentRecord?.id ? "销毁中..." : "销毁当前链接"}</button>
                    </div>
                    <div id="formFeedback">
                        ${state.message ? `<div class="notice">${escapeHtml(state.message)}</div>` : ""}
                        ${state.error ? `<div class="error">${escapeHtml(state.error)}</div>` : ""}
                    </div>
                </form>
            </section>

            <aside class="side">
                <section class="panel side-card">
                    <h3>当前版本</h3>
                    <p>${isEditingExisting ? "当前表单已绑定到一个已生成链接。点击“保存当前链接”后，原子链接不变，页面内容会实时更新。" : "当前表单还是模板草稿。点击“保存并生成链接”后会创建一个新的子链接。"}</p>
                    <div class="meta-list">
                        <div class="meta-item"><span>当前 ID</span><strong>${escapeHtml(currentId)}</strong></div>
                        <div class="meta-item"><span>失效时间</span><strong>${escapeHtml(expiresAt || "未设置")}</strong></div>
                        <div class="meta-item"><span>请假附件</span><strong id="leaveAttachmentCountValue">${countAttachments(state.currentRecord?.config?.attachments)}</strong></div>
                        <div class="meta-item"><span>销假图片</span><strong id="completionAttachmentCountValue">${countAttachments(state.currentRecord?.config?.completionInfo?.attachments)}</strong></div>
                    </div>
                    ${currentLink ? `<a class="result-link" href="${escapeHtml(currentLink)}" target="_blank" rel="noreferrer">${escapeHtml(currentLink)}</a>` : '<div class="empty">保存后这里会显示可访问的独立分享链接。</div>'}
                </section>

                <section class="panel side-card">
                    <h3>已生成版本</h3>
                    <p>这里显示当前仍然存在的分享版本。到期后会自动失效，也可以手动销毁。点击“载入编辑”后，保存将直接更新原链接。</p>
                    <div id="shareListRegion">${renderShareList()}</div>
                </section>
            </aside>
        </div>

        <section class="panel recycle-shell">
            <details class="recycle-menu">
                <summary>
                    <span>回收站</span>
                    <small id="trashCountText">${renderTrashSummaryText()}</small>
                </summary>
                <div id="trashListRegion">${renderTrashList()}</div>
            </details>
        </section>
    `;

    fillEditorForm(state.currentRecord);
    bindDashboardEvents();
    syncCompletionLocationFieldsState();
    syncDestinationFieldsState();
    renderImageFeedback("leave");
    renderImageFeedback("completion");
    updateImageUploaderState("leave");
    updateImageUploaderState("completion");
    renderImageManager("leave");
    renderImageManager("completion");
    updateClock();
}

function renderCustomSubdomainField() {
    const value = state.currentRecord?.customSubdomain || "";
    const enabled = Boolean(state.currentRecord?.customSubdomainEnabled || value);
    const disabled = state.saving;
    const previewSubdomain = enabled && value ? value.trim().toLowerCase() : DEFAULT_SHARE_SUBDOMAIN;
    const previewUrl = `https://${previewSubdomain}.${SHARE_ROOT_DOMAIN}${SHARE_PATH}?id=随机32位&needApproval=1`;
    return `
        <section class="group">
            <h3>自定义二级域名</h3>
            <p>开启后填写名称，生成链接会使用对应的二级域名；关闭时继续使用默认的 ${DEFAULT_SHARE_SUBDOMAIN}.${SHARE_ROOT_DOMAIN}。</p>
            <div class="fields">
                <label class="checkbox-row span-2 domain-toggle">
                    <input type="checkbox" name="customSubdomainEnabled"${enabled ? " checked" : ""}${disabled ? " disabled" : ""}>
                    <span>开启自定义二级域名</span>
                </label>
                <label class="label span-2">
                    <span>二级域名名称</span>
                    <div class="domain-builder">
                        <span>https://</span>
                        <input class="field domain-field" type="text" name="customSubdomain" value="${escapeHtml(value)}" placeholder="abc" maxlength="63" autocomplete="off"${disabled || !enabled ? " disabled" : ""}>
                        <span>.${SHARE_ROOT_DOMAIN}</span>
                    </div>
                    <small class="domain-preview">${escapeHtml(previewUrl)}</small>
                </label>
            </div>
        </section>
    `;
}

function renderImageUploader(kind) {
    const uploader = IMAGE_UPLOADERS[kind];
    const uploading = state[uploader.uploadingKey];
    const optionalKey = kind === "completion" ? "completionAttachments" : "attachments";
    return `
        <section class="group">
            <h3>${escapeHtml(uploader.title)}</h3>
            ${renderOptionalVisibilityToggle(optionalKey)}
            <div class="attachment-admin">
                <div class="attachment-toolbar">
                    <input class="field attachment-file-input" id="${escapeHtml(uploader.inputId)}" type="file" accept="image/*" multiple${uploading ? " disabled" : ""}>
                </div>
                <div id="${escapeHtml(uploader.feedbackId)}"></div>
                <div class="attachment-manager" id="${escapeHtml(uploader.managerId)}"></div>
            </div>
        </section>
    `;
}

function renderFieldGroup(group) {
    return `
        <section class="group">
            <h3>${escapeHtml(group.title)}</h3>
            <p>${escapeHtml(group.hint)}</p>
            <div class="fields">
                ${group.fields.map(renderField).join("")}
            </div>
        </section>
    `;
}

function renderField(field) {
    const spanClass = field.span === 2 ? "span-2" : "";
    const placeholder = field.placeholder ? ` placeholder="${escapeHtml(field.placeholder)}"` : "";
    const labelHead = renderFieldLabelHead(field);

    if (getTimeWheelFieldOptions(field.path)) {
        return renderTimeWheelField(field, spanClass, placeholder, labelHead);
    }

    if (AUTO_TIME_OUTPUT_FIELDS.has(field.path)) {
        return renderAutoTimeField(field, spanClass, placeholder, labelHead);
    }

    if (field.type === "destination") {
        return renderDestinationField(field, spanClass);
    }

    if (field.type === "map-link") {
        return renderMapLinkField(field, spanClass, placeholder);
    }

    if (field.type === "textarea") {
        return `
            <div class="label ${spanClass}">
                ${labelHead}
                <textarea class="textarea" name="${escapeHtml(field.path)}"${placeholder}></textarea>
            </div>
        `;
    }

    if (field.type === "select") {
        return `
            <div class="label ${spanClass}">
                ${labelHead}
                <select class="select" name="${escapeHtml(field.path)}">
                    ${field.options.map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join("")}
                </select>
            </div>
        `;
    }

    if (field.type === "theme-color") {
        return renderThemeColorField(field, spanClass, labelHead);
    }

    if (field.type === "checkbox") {
        return `
            <div class="label ${spanClass}">
                ${labelHead}
                <span class="checkbox-row">
                    <input type="checkbox" name="${escapeHtml(field.path)}">
                    <span>开启</span>
                </span>
            </div>
        `;
    }

    if (field.type === "color") {
        return renderColorField(field, spanClass, placeholder, labelHead);
    }

    return `
        <div class="label ${spanClass}">
            ${labelHead}
            <input class="field" type="${field.type || "text"}" name="${escapeHtml(field.path)}"${placeholder}>
        </div>
    `;
}

function renderTimeWheelField(field, spanClass, placeholder, labelHead) {
    return `
        <div class="label ${spanClass}">
            ${labelHead}
            <input class="field" type="text" name="${escapeHtml(field.path)}"${placeholder} readonly inputmode="none" data-time-wheel="1" aria-haspopup="dialog">
        </div>
    `;
}

function renderAutoTimeField(field, spanClass, placeholder, labelHead) {
    return `
        <div class="label ${spanClass}">
            ${labelHead}
            <input class="field" type="text" name="${escapeHtml(field.path)}"${placeholder} readonly data-auto-time-field="1">
        </div>
    `;
}

function renderThemeColorField(field, spanClass, labelHead) {
    return `
        <div class="label ${spanClass}">
            ${labelHead}
            <input type="hidden" name="${escapeHtml(field.path)}" data-theme-color-input="1">
            <div class="theme-color-picker" data-theme-color-picker="${escapeHtml(field.path)}">
                ${field.options.map((option) => renderThemeColorOption(option.value)).join("")}
            </div>
        </div>
    `;
}

function renderThemeColorOption(value) {
    const theme = getApprovalThemeColor(value);
    return `
        <button class="theme-color-option" type="button" data-theme-value="${escapeHtml(value)}" aria-label="${escapeHtml(theme.label)}" title="${escapeHtml(theme.label)}">
            <span style="background:${escapeHtml(theme.color)}"></span>
        </button>
    `;
}

function renderColorField(field, spanClass, placeholder, labelHead) {
    const defaultColor = normalizeHexColor(field.defaultColor || "");
    const resetButton = defaultColor
        ? `<button class="color-reset-btn" type="button" data-color-reset="${escapeHtml(field.path)}" data-color-value="${escapeHtml(defaultColor)}">恢复默认</button>`
        : "";

    return `
        <div class="label ${spanClass}">
            ${labelHead}
            <div class="color-input-row">
                <input class="field color-field" type="color" name="${escapeHtml(field.path)}"${placeholder}>
                ${resetButton}
            </div>
        </div>
    `;
}

function renderFieldLabelHead(field) {
    const optionalField = OPTIONAL_FIELD_BY_PATH.get(field.path);
    const actions = [
        optionalField ? renderOptionalVisibilityToggle(optionalField.key) : "",
        field.labelToggle ? renderFieldLabelToggle(field.labelToggle) : "",
        renderTextColorPicker(field)
    ].filter(Boolean).join("");

    return `
        <span class="label-head">
            <span>${escapeHtml(field.label)}</span>
            ${actions ? `<span class="label-head-actions">${actions}</span>` : ""}
        </span>
    `;
}

function renderTextColorPicker(field) {
    if (!isTextColorModeEnabled() || !isTextColorField(field)) {
        return "";
    }

    const color = getTextColorValueForField(field.path, state.currentRecord?.config || state.template || {});
    return `
        <label class="text-color-picker" title="前端文字颜色">
            <input type="color" name="${TEXT_COLOR_FIELD_PREFIX}${escapeHtml(field.path)}" data-text-color-path="${escapeHtml(field.path)}" value="${escapeHtml(color)}" aria-label="${escapeHtml(field.label)}前端文字颜色">
        </label>
    `;
}

function renderFieldLabelToggle(toggle) {
    return `
        <span class="optional-toggle">
            <input type="checkbox" name="${escapeHtml(toggle.path)}">
            <span>${escapeHtml(toggle.label)}</span>
        </span>
    `;
}

function renderOptionalVisibilityToggle(key) {
    if (!key || !isOptionalVisibilityEnabled()) {
        return "";
    }

    return `
        <span class="optional-toggle">
            <input type="checkbox" name="${OPTIONAL_VISIBLE_FIELDS_FIELD}.${escapeHtml(key)}">
            <span>前端显示</span>
        </span>
    `;
}

function renderMapLinkField(field, spanClass, placeholder) {
    return `
        <div class="label ${spanClass}">
            ${renderFieldLabelHead(field)}
            <textarea class="textarea" name="${escapeHtml(field.path)}"${placeholder}></textarea>
        </div>
    `;
}

function renderDestinationField(field, spanClass) {
    return `
        <div class="label ${spanClass}">
            ${renderFieldLabelHead(field)}
            <div class="destination-picker">
                <label class="checkbox-row destination-toggle">
                    <input type="checkbox" name="destination.enabled">
                    <span>在前端显示目的地</span>
                </label>
                <div class="destination-selects">
                    <select class="select" name="destination.province" aria-label="目的地省份"></select>
                    <select class="select" name="destination.city" aria-label="目的地城市"></select>
                    <select class="select" name="destination.county" aria-label="目的地区县"></select>
                </div>
                <input class="field" type="text" name="destination.detail" placeholder="详细地址，例如：示例地址1号">
                <div class="destination-preview" id="destinationPreview"></div>
            </div>
        </div>
    `;
}

function renderShareList() {
    if (state.sharesLoading) {
        return `<div class="loading loading-inline">正在加载已生成版本...</div>`;
    }

    if (state.sharesError) {
        return `
            <div class="empty list-load-error">
                <p>已生成版本加载失败：${escapeHtml(state.sharesError)}</p>
                <button class="secondary-btn" type="button" id="retrySharesBtn">重试加载</button>
            </div>
        `;
    }

    if (!state.shares.length) {
        return `<div class="empty">暂无可用版本。保存一次后，新链接会显示在这里。</div>`;
    }

    return `
        <div class="share-list">
            ${state.shares.map((item) => {
                const isCurrent = item.id === state.currentRecord?.id;
                const destroying = state.destroyingShareId === item.id;
                return `
                    <article class="share-item">
                        <strong>${escapeHtml(item.userName || "未填写姓名")} · ${escapeHtml(item.startTime || "-")} 至 ${escapeHtml(item.endTime || "-")}</strong>
                        <p>ID：${escapeHtml(item.id)}</p>
                        <p>北京时间失效：${escapeHtml(item.expiresAtBeijing || "-")}</p>
                        <p>最近更新时间：${escapeHtml(item.updatedAtBeijing || "-")}</p>
                        <p>${isCurrent ? "当前正在编辑这个链接。" : "点击“载入编辑”后，保存会直接更新这个链接。"}</p>
                        <div class="share-actions">
                            <button class="secondary-btn" type="button" data-action="load" data-id="${escapeHtml(item.id)}"${state.saving ? " disabled" : ""}>载入编辑</button>
                            <button class="ghost-btn" type="button" data-action="copy" data-url="${escapeHtml(item.url)}"${state.saving ? " disabled" : ""}>复制链接</button>
                            <button class="danger-btn" type="button" data-action="destroy" data-id="${escapeHtml(item.id)}"${state.saving || destroying ? " disabled" : ""}>${destroying ? "销毁中..." : "销毁"}</button>
                        </div>
                    </article>
                `;
            }).join("")}
        </div>
    `;
}

function renderTrashSummaryText() {
    if (state.trashLoading) {
        return "正在加载回收站...";
    }

    if (state.trashError) {
        return "回收站加载失败";
    }

    return `${state.trash.length} 个链接，失效或保留期到达后进入封存库`;
}

function renderTrashList() {
    if (state.trashLoading) {
        return `<div class="loading loading-inline">正在加载回收站...</div>`;
    }

    if (state.trashError) {
        return `
            <div class="empty list-load-error">
                <p>回收站加载失败：${escapeHtml(state.trashError)}</p>
                <button class="secondary-btn" type="button" id="retryTrashBtn">重试加载</button>
            </div>
        `;
    }

    if (!state.trash.length) {
        return `<div class="empty">回收站暂无链接。销毁后的链接会先保留在这里，原链接失效或保留期到达后进入封存库。</div>`;
    }

    return `
        <div class="share-list recycle-list">
            ${state.trash.map((item) => {
                const restoring = state.restoringShareId === item.id;
                return `
                    <article class="share-item recycle-item">
                        <strong>${escapeHtml(item.userName || "未填写姓名")} · ${escapeHtml(item.startTime || "-")} 至 ${escapeHtml(item.endTime || "-")}</strong>
                        <p>ID：${escapeHtml(item.id)}</p>
                        <p>原链接失效时间：${escapeHtml(item.expiresAtBeijing || "-")}</p>
                        <p>销毁时间：${escapeHtml(item.deletedAtBeijing || "-")}</p>
                        <p>自动封存时间：${escapeHtml(item.archiveAtBeijing || item.purgeAtBeijing || "-")}</p>
                        <div class="share-actions">
                            <button class="secondary-btn" type="button" data-action="restore" data-id="${escapeHtml(item.id)}"${state.saving || restoring ? " disabled" : ""}>${restoring ? "恢复中..." : "恢复"}</button>
                            <button class="ghost-btn" type="button" data-action="copy" data-url="${escapeHtml(item.url)}"${state.saving ? " disabled" : ""}>复制原链接</button>
                        </div>
                    </article>
                `;
            }).join("")}
        </div>
    `;
}

function bindDashboardEvents() {
    document.getElementById("logoutBtn").addEventListener("click", handleLogout);
    document.getElementById("historyBtn").addEventListener("click", () => {
        window.location.href = "/linkhistory";
    });
    document.getElementById("resetFormBtn")?.addEventListener("click", resetFormToTemplate);
    document.getElementById("editorForm").addEventListener("submit", handleSaveSubmit);
    document.getElementById("copyCurrentBtn").addEventListener("click", copyCurrentLink);
    document.getElementById("destroyCurrentBtn").addEventListener("click", destroyCurrentLink);

    Object.keys(IMAGE_UPLOADERS).forEach((kind) => {
        const uploader = IMAGE_UPLOADERS[kind];
        const textField = document.querySelector(`textarea[name="${uploader.fieldName}"]`);
        if (textField) {
            textField.addEventListener("input", () => handleImageFieldInput(kind));
        }

        const fileInput = document.getElementById(uploader.inputId);
        if (fileInput) {
            fileInput.addEventListener("change", () => handleImageUpload(kind));
        }
    });

    const inheritLeaveLocation = document.querySelector('input[name="completionInfo.inheritLeaveLocation"]');
    if (inheritLeaveLocation) {
        inheritLeaveLocation.addEventListener("change", syncCompletionLocationFieldsState);
    }
    const optionalMode = document.querySelector('input[name="optionalVisibilityEnabled"]');
    if (optionalMode) {
        optionalMode.addEventListener("change", handleDisplayModeChange);
    }
    const textColorMode = document.querySelector(`input[name="${TEXT_COLOR_MODE_FIELD}"]`);
    if (textColorMode) {
        textColorMode.addEventListener("change", handleDisplayModeChange);
    }
    const customSubdomainEnabled = document.querySelector('input[name="customSubdomainEnabled"]');
    if (customSubdomainEnabled) {
        customSubdomainEnabled.addEventListener("change", syncCustomSubdomainFieldsState);
    }
    bindColorResetButtons();
    bindThemeColorPickers();
    bindTextColorInputs();
    bindDestinationPicker();
    bindLinkedIdentityFields();
    bindTimeWheelPickers();
    bindAutoVacationTimeFields();
    bindShareListEvents();
    bindTrashListEvents();
}

function bindShareListEvents(root = document.getElementById("shareListRegion")) {
    if (!root) {
        return;
    }

    const retryBtn = root.querySelector("#retrySharesBtn");
    if (retryBtn) {
        retryBtn.addEventListener("click", () => loadSharesList(dashboardListLoadToken));
    }

    root.querySelectorAll("[data-action='copy']").forEach((button) => {
        button.addEventListener("click", () => copyText(button.dataset.url || ""));
    });

    root.querySelectorAll("[data-action='load']").forEach((button) => {
        button.addEventListener("click", () => loadShareIntoEditor(button.dataset.id || ""));
    });

    root.querySelectorAll("[data-action='destroy']").forEach((button) => {
        button.addEventListener("click", () => destroyShare(button.dataset.id || ""));
    });
}

function bindTrashListEvents(root = document.getElementById("trashListRegion")) {
    if (!root) {
        return;
    }

    const retryBtn = root.querySelector("#retryTrashBtn");
    if (retryBtn) {
        retryBtn.addEventListener("click", () => loadTrashList(dashboardListLoadToken));
    }

    root.querySelectorAll("[data-action='copy']").forEach((button) => {
        button.addEventListener("click", () => copyText(button.dataset.url || ""));
    });

    root.querySelectorAll("[data-action='restore']").forEach((button) => {
        button.addEventListener("click", () => restoreShare(button.dataset.id || ""));
    });
}

function handleDisplayModeChange() {
    const form = document.getElementById("editorForm");
    if (!form) {
        return;
    }

    const payload = collectFormPayload(form);
    state.currentRecord = {
        id: state.currentRecord?.id || "",
        url: state.currentRecord?.url || "",
        customSubdomainEnabled: payload.customSubdomainEnabled,
        customSubdomain: payload.customSubdomain || "",
        config: payload.config,
        expiresAtBeijing: payload.expiresAtBeijing
    };
    renderDashboard();
}

function bindColorResetButtons(root = document) {
    root.querySelectorAll("[data-color-reset]").forEach((button) => {
        button.addEventListener("click", () => {
            const fieldName = button.dataset.colorReset || "";
            const color = normalizeHexColor(button.dataset.colorValue || "");
            const input = document.getElementById("editorForm")?.elements.namedItem(fieldName);
            if (!input || !color) {
                return;
            }

            input.value = color;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
        });
    });
}

function bindThemeColorPickers(root = document) {
    root.querySelectorAll("[data-theme-color-picker]").forEach((picker) => {
        picker.querySelectorAll("[data-theme-value]").forEach((button) => {
            button.addEventListener("click", () => {
                const form = document.getElementById("editorForm");
                const fieldName = picker.dataset.themeColorPicker || "";
                const input = form?.elements.namedItem(fieldName);
                if (!input) {
                    return;
                }

                input.value = button.dataset.themeValue || "";
                syncThemeColorPicker(picker, input.value);
                syncApprovalActionTextColorFromTheme(form, fieldName, input.value);
            });
        });
    });
}

function bindTextColorInputs(root = document) {
    root.querySelectorAll("[data-text-color-path]").forEach((input) => {
        input.addEventListener("input", () => {
            input.dataset.hasStoredTextColor = "1";
        });
    });
}

function syncThemeColorPickers(root = document) {
    root.querySelectorAll("[data-theme-color-picker]").forEach((picker) => {
        const input = root.elements?.namedItem(picker.dataset.themeColorPicker || "") ||
            document.getElementById("editorForm")?.elements.namedItem(picker.dataset.themeColorPicker || "");
        syncThemeColorPicker(picker, input?.value || "");
    });
}

function syncThemeColorPicker(picker, value) {
    picker.querySelectorAll("[data-theme-value]").forEach((button) => {
        const selected = button.dataset.themeValue === value;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
}

function syncApprovalActionTextColorFromTheme(form, themePath, themeValue) {
    const actionTextPath = themePath.replace(/\.theme$/, ".actionText");
    if (actionTextPath === themePath) {
        return;
    }

    const colorInput = form?.elements.namedItem(`${TEXT_COLOR_FIELD_PREFIX}${actionTextPath}`);
    if (!colorInput || colorInput.dataset.hasStoredTextColor === "1") {
        return;
    }

    colorInput.value = getCompletionApprovalActionTextColor(themeValue);
}

function syncCustomSubdomainFieldsState() {
    const form = document.getElementById("editorForm");
    if (!form) {
        return;
    }

    const enabled = Boolean(form.elements.namedItem("customSubdomainEnabled")?.checked);
    const input = form.elements.namedItem("customSubdomain");
    if (input) {
        input.disabled = state.saving || !enabled;
    }
}

function syncCompletionLocationFieldsState() {
    const form = document.getElementById("editorForm");
    if (!form) {
        return;
    }

    const inheritLocation = Boolean(form.elements.namedItem("completionInfo.inheritLeaveLocation")?.checked);
    ["completionInfo.locationText", "completionInfo.locationUrl"].forEach((fieldName) => {
        const element = form.elements.namedItem(fieldName);
        if (element) {
            element.disabled = inheritLocation;
        }
    });
}

function bindDestinationPicker() {
    const form = document.getElementById("editorForm");
    if (!form) {
        return;
    }

    const enabled = form.elements.namedItem("destination.enabled");
    const province = form.elements.namedItem("destination.province");
    const city = form.elements.namedItem("destination.city");
    const county = form.elements.namedItem("destination.county");
    const detail = form.elements.namedItem("destination.detail");

    if (enabled) {
        enabled.addEventListener("change", syncDestinationFieldsState);
    }

    if (province) {
        province.addEventListener("change", () => {
            refreshDestinationCityOptions(form);
            refreshDestinationCountyOptions(form);
            updateDestinationPreview(form);
        });
    }

    if (city) {
        city.addEventListener("change", () => {
            refreshDestinationCountyOptions(form);
            updateDestinationPreview(form);
        });
    }

    [county, detail].forEach((element) => {
        if (element) {
            element.addEventListener("input", () => updateDestinationPreview(form));
            element.addEventListener("change", () => updateDestinationPreview(form));
        }
    });
}

function getChinaDivisionsFromWindow() {
    return Array.isArray(window.CHINA_DIVISIONS_2026) ? window.CHINA_DIVISIONS_2026 : [];
}

function scheduleChinaDivisionsBackgroundLoad() {
    if (chinaDivisionsLoadScheduled || CHINA_DIVISIONS.length) {
        return;
    }

    chinaDivisionsLoadScheduled = true;
    const start = () => {
        loadChinaDivisions().catch((error) => {
            console.warn("Failed to load china divisions:", error);
        });
    };

    if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(start, { timeout: 3000 });
    } else {
        window.setTimeout(start, 600);
    }
}

function loadChinaDivisions() {
    CHINA_DIVISIONS = getChinaDivisionsFromWindow();
    if (CHINA_DIVISIONS.length) {
        refreshDestinationPickerAfterDivisionsLoad();
        return Promise.resolve(CHINA_DIVISIONS);
    }

    if (chinaDivisionsLoadPromise) {
        return chinaDivisionsLoadPromise;
    }

    chinaDivisionsLoadPromise = new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[src^="/china-divisions.js"]`);
        if (existingScript) {
            existingScript.addEventListener("load", () => {
                CHINA_DIVISIONS = getChinaDivisionsFromWindow();
                refreshDestinationPickerAfterDivisionsLoad();
                resolve(CHINA_DIVISIONS);
            }, { once: true });
            existingScript.addEventListener("error", reject, { once: true });
            return;
        }

        const script = document.createElement("script");
        script.src = CHINA_DIVISIONS_SCRIPT_SRC;
        script.async = true;
        script.dataset.backgroundLoad = "china-divisions";
        script.addEventListener("load", () => {
            CHINA_DIVISIONS = getChinaDivisionsFromWindow();
            refreshDestinationPickerAfterDivisionsLoad();
            resolve(CHINA_DIVISIONS);
        }, { once: true });
        script.addEventListener("error", reject, { once: true });
        document.head.appendChild(script);
    });

    return chinaDivisionsLoadPromise;
}

function refreshDestinationPickerAfterDivisionsLoad() {
    const form = document.getElementById("editorForm");
    if (!form || !CHINA_DIVISIONS.length) {
        return;
    }

    const storedDestination = normalizeDestinationEditorValue(
        getValue(state.currentRecord?.config || {}, "destination")
    );
    const currentDestination = collectDestinationValue(form);
    fillDestinationPicker(form, {
        ...storedDestination,
        enabled: currentDestination.enabled,
        province: currentDestination.province || storedDestination.province,
        city: currentDestination.city || storedDestination.city,
        county: currentDestination.county || storedDestination.county,
        detail: currentDestination.detail || storedDestination.detail
    });
    syncDestinationFieldsState();
}

function fillDestinationPicker(form, value) {
    const destination = normalizeDestinationEditorValue(value);
    const province = findDivisionByName(CHINA_DIVISIONS, destination.province) || CHINA_DIVISIONS[0] || null;
    setDestinationSelectOptions(form.elements.namedItem("destination.province"), CHINA_DIVISIONS, province?.name || "");

    const cities = province?.children || [];
    const city = findDivisionByName(cities, destination.city) || cities[0] || null;
    setDestinationSelectOptions(form.elements.namedItem("destination.city"), cities, city?.name || "");

    const counties = city?.children || [];
    const county = findDivisionByName(counties, destination.county) || counties[0] || null;
    setDestinationSelectOptions(form.elements.namedItem("destination.county"), counties, county?.name || "");

    const enabled = form.elements.namedItem("destination.enabled");
    const detail = form.elements.namedItem("destination.detail");
    if (enabled) {
        enabled.checked = Boolean(destination.enabled);
    }
    if (detail) {
        detail.value = destination.detail;
    }

    updateDestinationPreview(form);
}

function refreshDestinationCityOptions(form) {
    const provinceSelect = form.elements.namedItem("destination.province");
    const citySelect = form.elements.namedItem("destination.city");
    const province = findDivisionByName(CHINA_DIVISIONS, provinceSelect?.value || "") || CHINA_DIVISIONS[0] || null;
    const cities = province?.children || [];
    const selectedCity = findDivisionByName(cities, citySelect?.value || "") || cities[0] || null;
    setDestinationSelectOptions(citySelect, cities, selectedCity?.name || "");
}

function refreshDestinationCountyOptions(form) {
    const provinceSelect = form.elements.namedItem("destination.province");
    const citySelect = form.elements.namedItem("destination.city");
    const countySelect = form.elements.namedItem("destination.county");
    const province = findDivisionByName(CHINA_DIVISIONS, provinceSelect?.value || "") || CHINA_DIVISIONS[0] || null;
    const cities = province?.children || [];
    const city = findDivisionByName(cities, citySelect?.value || "") || cities[0] || null;
    const counties = city?.children || [];
    const selectedCounty = findDivisionByName(counties, countySelect?.value || "") || counties[0] || null;
    setDestinationSelectOptions(countySelect, counties, selectedCounty?.name || "");
}

function setDestinationSelectOptions(select, items, selectedName) {
    if (!select) {
        return;
    }

    select.innerHTML = (items || [])
        .map((item) => {
            const selected = item.name === selectedName ? " selected" : "";
            return `<option value="${escapeHtml(item.name)}"${selected}>${escapeHtml(item.name)}</option>`;
        })
        .join("");
}

function syncDestinationFieldsState() {
    const form = document.getElementById("editorForm");
    if (!form) {
        return;
    }

    const enabled = Boolean(form.elements.namedItem("destination.enabled")?.checked);
    const hasDivisionData = CHINA_DIVISIONS.length > 0;
    ["destination.province", "destination.city", "destination.county", "destination.detail"].forEach((fieldName) => {
        const element = form.elements.namedItem(fieldName);
        if (element) {
            element.disabled = !enabled || !hasDivisionData;
        }
    });

    updateDestinationPreview(form);
}

function updateDestinationPreview(form = document.getElementById("editorForm")) {
    const preview = document.getElementById("destinationPreview");
    if (!preview || !form) {
        return;
    }

    if (!CHINA_DIVISIONS.length) {
        preview.textContent = "行政区划数据未加载，请刷新页面。";
        return;
    }

    const destination = collectDestinationValue(form);
    const text = formatDestinationText(destination);
    preview.textContent = destination.enabled
        ? `前端显示：${text || "-"}`
        : "未勾选时前端不显示目的地。";
}

function collectDestinationValue(form) {
    return {
        enabled: Boolean(form.elements.namedItem("destination.enabled")?.checked),
        province: String(form.elements.namedItem("destination.province")?.value || "").trim(),
        city: String(form.elements.namedItem("destination.city")?.value || "").trim(),
        county: String(form.elements.namedItem("destination.county")?.value || "").trim(),
        detail: String(form.elements.namedItem("destination.detail")?.value || "").trim()
    };
}

function normalizeDestinationEditorValue(value) {
    const destination = value && typeof value === "object" ? value : {};
    return {
        enabled: Boolean(destination.enabled),
        province: typeof destination.province === "string" ? destination.province.trim() : "北京市",
        city: typeof destination.city === "string" ? destination.city.trim() : "北京市",
        county: typeof destination.county === "string" ? destination.county.trim() : "海淀区",
        detail: typeof destination.detail === "string" ? destination.detail.trim() : "示例地址1号"
    };
}

function findDivisionByName(items, name) {
    return (items || []).find((item) => item.name === name) || null;
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

function getTimeWheelFieldOptions(path) {
    return TIME_WHEEL_FIELDS[path] || null;
}

function bindTimeWheelPickers() {
    const form = document.getElementById("editorForm");
    if (!form) {
        return;
    }

    Object.keys(TIME_WHEEL_FIELDS).forEach((fieldName) => {
        const input = form.elements.namedItem(fieldName);
        if (!input) {
            return;
        }

        input.addEventListener("click", () => openTimeWheelPicker(input, TIME_WHEEL_FIELDS[fieldName]));
        input.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " " && event.key !== "ArrowDown") {
                return;
            }

            event.preventDefault();
            openTimeWheelPicker(input, TIME_WHEEL_FIELDS[fieldName]);
        });
    });
}

function bindAutoVacationTimeFields() {
    const form = document.getElementById("editorForm");
    if (!form) {
        return;
    }

    ["startTime", "endTime"].forEach((fieldName) => {
        const input = form.elements.namedItem(fieldName);
        if (input) {
            const handler = () => {
                syncLinkedStatusTimeFromLeaveField(form, fieldName);
                syncVacationTimeOutputs(form);
                syncDefaultExpiryFromLeaveTimes(form);
            };
            input.addEventListener("input", handler);
            input.addEventListener("change", handler);
        }
    });

    LINKED_STATUS_TIME_FIELDS.forEach(({ leaveField, statusField }) => {
        const input = form.elements.namedItem(statusField);
        if (!input) {
            return;
        }

        const handler = () => {
            syncLeaveTimeFromStatusField(form, leaveField, statusField);
            syncVacationTimeOutputs(form);
        };
        input.addEventListener("input", handler);
        input.addEventListener("change", handler);
    });
}

function syncLinkedStatusTimeFromLeaveField(form, leaveField) {
    const link = LINKED_STATUS_TIME_FIELDS.find((item) => item.leaveField === leaveField);
    if (!link) {
        return;
    }

    const leaveInput = form.elements.namedItem(link.leaveField);
    const statusInput = form.elements.namedItem(link.statusField);
    const leaveParts = parseTimeWheelValue(leaveInput?.value || "");
    if (!leaveParts || !statusInput) {
        return;
    }

    const statusParts = parseTimeWheelValue(statusInput.value || "");
    const year = statusParts?.year || inferStatusSwitchYear(form, link.leaveField, leaveParts);
    const nextValue = formatTimeWheelValue(
        normalizeTimeWheelParts({ ...leaveParts, year }, "year-minute"),
        "year-minute"
    );
    if (statusInput.value !== nextValue) {
        statusInput.value = nextValue;
    }
}

function syncLeaveTimeFromStatusField(form, leaveField, statusField) {
    const leaveInput = form.elements.namedItem(leaveField);
    const statusInput = form.elements.namedItem(statusField);
    const statusParts = parseTimeWheelValue(statusInput?.value || "");
    if (!statusParts || !leaveInput) {
        return;
    }

    const nextValue = formatTimeWheelValue(
        normalizeTimeWheelParts(statusParts, "month-day-minute"),
        "month-day-minute"
    );
    if (leaveInput.value !== nextValue) {
        leaveInput.value = nextValue;
    }
}

function syncLinkedStatusTimesFromLeaveFields(form) {
    LINKED_STATUS_TIME_FIELDS.forEach(({ leaveField }) => {
        syncLinkedStatusTimeFromLeaveField(form, leaveField);
    });
}

function inferStatusSwitchYear(form, leaveField, leaveParts) {
    const defaultYear = getDefaultTimeWheelParts("year-minute").year;
    if (leaveField !== "endTime") {
        return defaultYear;
    }

    const startParts = parseTimeWheelValue(form.elements.namedItem("startTime")?.value || "");
    const startStatusParts = parseTimeWheelValue(form.elements.namedItem("upcomingSwitchAtBeijing")?.value || "");
    const baseYear = startStatusParts?.year || defaultYear;
    if (!startParts) {
        return baseYear;
    }

    const startKey = (startParts.month * 1000000) + (startParts.day * 10000) + (startParts.hour * 100) + startParts.minute;
    const endKey = (leaveParts.month * 1000000) + (leaveParts.day * 10000) + (leaveParts.hour * 100) + leaveParts.minute;
    return endKey < startKey ? baseYear + 1 : baseYear;
}

function openTimeWheelPicker(input, options) {
    if (!input || state.saving) {
        return;
    }

    document.querySelectorAll(".native-time-picker").forEach((element) => element.remove());

    const format = resolveTimeWheelFormat(input.value, options);
    const picker = document.createElement("input");
    picker.className = "native-time-picker";
    picker.type = "datetime-local";
    picker.step = format === "year-second" ? "1" : "60";
    picker.value = getNativeTimePickerValue(input.value, format);
    picker.addEventListener("change", () => {
        const nextValue = formatNativeTimePickerValue(picker.value, format, input.value);
        if (nextValue) {
            input.value = nextValue;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
        }
        window.setTimeout(() => picker.remove(), 0);
    });

    document.body.appendChild(picker);
    picker.focus({ preventScroll: true });
    if (typeof picker.showPicker === "function") {
        try {
            picker.showPicker();
        } catch {
            picker.click();
        }
    } else {
        picker.click();
    }
}

function getNativeTimePickerValue(value, format) {
    const parsedParts = parseTimeWheelValue(value);
    const parts = normalizeTimeWheelParts(parsedParts || getDefaultTimeWheelParts(format), format);
    const year = format === "month-day-minute"
        ? getDefaultTimeWheelParts("year-minute").year
        : parts.year;
    const dateText = `${year}-${pad2(parts.month)}-${pad2(parts.day)}`;
    const timeText = `${pad2(parts.hour)}:${pad2(parts.minute)}`;
    return format === "year-second"
        ? `${dateText}T${timeText}:${pad2(parts.second)}`
        : `${dateText}T${timeText}`;
}

function formatNativeTimePickerValue(value, format, previousValue = "") {
    const match =
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(value || "").trim());
    if (!match) {
        return "";
    }

    const previousParts = parseTimeWheelValue(previousValue);
    const parts = normalizeTimeWheelParts({
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
        hour: Number(match[4]),
        minute: Number(match[5]),
        second: match[6] === undefined && format === "year-second"
            ? previousParts?.second || 0
            : Number(match[6] || 0)
    }, format);
    return formatTimeWheelValue(parts, format);
}

function createTimeWheelState(input, options) {
    const format = resolveTimeWheelFormat(input.value, options);
    const parsedParts = parseTimeWheelValue(input.value);
    return {
        input,
        options,
        format,
        label: getTimeWheelInputLabel(input),
        parts: normalizeTimeWheelParts(parsedParts || getDefaultTimeWheelParts(format), format),
        backdrop: null
    };
}

function getTimeWheelInputLabel(input) {
    const label = input.closest(".label")?.querySelector(".label-head > span:first-child")?.textContent?.trim();
    return label || "选择时间";
}

function renderTimeWheelColumns(pickerState) {
    const container = pickerState.backdrop?.querySelector("[data-time-wheel-columns]");
    if (!container) {
        return;
    }

    container.innerHTML = "";
    getTimeWheelColumns(pickerState.format, pickerState.parts).forEach((column) => {
        const wrapper = document.createElement("div");
        wrapper.className = "time-wheel-column";

        const label = document.createElement("div");
        label.className = "time-wheel-column-label";
        label.textContent = column.label;

        const list = document.createElement("div");
        list.className = "time-wheel-column-list";
        list.dataset.key = column.key;
        list.dataset.values = column.values.join(",");
        list.setAttribute("role", "listbox");
        list.setAttribute("aria-label", column.label);

        column.values.forEach((value) => {
            const button = document.createElement("button");
            button.className = "time-wheel-option";
            button.type = "button";
            button.dataset.value = String(value);
            button.textContent = column.format(value);
            button.setAttribute("role", "option");
            button.addEventListener("click", () => selectTimeWheelValue(pickerState, column.key, value));
            list.appendChild(button);
        });

        list.addEventListener("scroll", () => handleTimeWheelScroll(pickerState, list));
        wrapper.append(label, list);
        container.appendChild(wrapper);

        markTimeWheelColumnSelection(list, pickerState.parts[column.key]);
        window.requestAnimationFrame(() => scrollTimeWheelColumnToValue(list, pickerState.parts[column.key]));
    });
}

function handleTimeWheelScroll(pickerState, list) {
    window.clearTimeout(list.timeWheelScrollTimer);
    list.timeWheelScrollTimer = window.setTimeout(() => {
        const centeredButton = getCenteredTimeWheelButton(list);
        const value = Number(centeredButton?.dataset.value);
        const key = list.dataset.key;
        if (!key || !Number.isFinite(value)) {
            return;
        }

        if (pickerState.parts[key] === value) {
            markTimeWheelColumnSelection(list, value);
            return;
        }

        selectTimeWheelValue(pickerState, key, value);
    }, TIME_WHEEL_SCROLL_DEBOUNCE_MS);
}

function getCenteredTimeWheelButton(list) {
    const listRect = list.getBoundingClientRect();
    const center = listRect.top + listRect.height / 2;
    return Array.from(list.querySelectorAll(".time-wheel-option")).reduce((closest, button) => {
        const rect = button.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - center);
        return !closest || distance < closest.distance
            ? { button, distance }
            : closest;
    }, null)?.button || null;
}

function selectTimeWheelValue(pickerState, key, value) {
    pickerState.parts[key] = Number(value);
    pickerState.parts = normalizeTimeWheelParts(pickerState.parts, pickerState.format);
    renderTimeWheelColumns(pickerState);
}

function markTimeWheelColumnSelection(list, value) {
    list.querySelectorAll(".time-wheel-option").forEach((button) => {
        const selected = Number(button.dataset.value) === Number(value);
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-selected", selected ? "true" : "false");
    });
}

function scrollTimeWheelColumnToValue(list, value) {
    const selected = Array.from(list.querySelectorAll(".time-wheel-option"))
        .find((button) => Number(button.dataset.value) === Number(value));
    if (selected) {
        selected.scrollIntoView({ block: "center" });
    }
}

function confirmTimeWheelPicker(pickerState) {
    const nextValue = formatTimeWheelValue(pickerState.parts, pickerState.format);
    pickerState.input.value = nextValue;
    pickerState.input.dispatchEvent(new Event("input", { bubbles: true }));
    pickerState.input.dispatchEvent(new Event("change", { bubbles: true }));
}

function getTimeWheelColumns(format, parts) {
    const columns = [];
    if (format === "year-minute" || format === "year-second") {
        columns.push({
            key: "year",
            label: "年",
            values: getYearOptions(parts.year),
            format: (value) => String(value)
        });
    }

    columns.push(
        {
            key: "month",
            label: "月",
            values: createRange(1, 12),
            format: pad2
        },
        {
            key: "day",
            label: "日",
            values: createRange(1, getTimeWheelDaysInMonth(format, parts.year, parts.month)),
            format: pad2
        },
        {
            key: "hour",
            label: "时",
            values: createRange(0, 23),
            format: pad2
        },
        {
            key: "minute",
            label: "分",
            values: createRange(0, 59),
            format: pad2
        }
    );

    if (format === "year-second") {
        columns.push({
            key: "second",
            label: "秒",
            values: createRange(0, 59),
            format: pad2
        });
    }

    return columns;
}

function resolveTimeWheelFormat(value, options) {
    if (options?.format && options.format !== "smart") {
        return options.format;
    }

    return inferTimeWheelFormat(value) || options?.fallbackFormat || "month-day-minute";
}

function inferTimeWheelFormat(value) {
    const text = String(value || "").trim();
    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/.test(text)) {
        return "year-second";
    }
    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}$/.test(text)) {
        return "year-minute";
    }
    if (/^\d{2}-\d{2}[ T]\d{2}:\d{2}$/.test(text)) {
        return "month-day-minute";
    }

    return "";
}

function normalizeTimeWheelInputValue(value, options) {
    const text = String(value || "");
    if (!text.trim()) {
        return "";
    }

    const format = resolveTimeWheelFormat(text, options);
    const parts = parseTimeWheelValue(text);
    return parts ? formatTimeWheelValue(normalizeTimeWheelParts(parts, format), format) : text;
}

function parseTimeWheelValue(value) {
    const text = String(value || "").trim();
    let match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(text);
    if (match) {
        return {
            year: Number(match[1]),
            month: Number(match[2]),
            day: Number(match[3]),
            hour: Number(match[4]),
            minute: Number(match[5]),
            second: Number(match[6] || 0)
        };
    }

    match = /^(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/.exec(text);
    if (!match) {
        return null;
    }

    return {
        year: 2000,
        month: Number(match[1]),
        day: Number(match[2]),
        hour: Number(match[3]),
        minute: Number(match[4]),
        second: 0
    };
}

function getDefaultTimeWheelParts(format) {
    const date = new Date(Date.now() + 8 * 60 * 60 * 1000);
    return {
        year: format === "month-day-minute" ? 2000 : date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
        hour: date.getUTCHours(),
        minute: date.getUTCMinutes(),
        second: 0
    };
}

function normalizeTimeWheelParts(parts, format) {
    const next = {
        year: clampInteger(parts?.year, 1900, 2099, getDefaultTimeWheelParts(format).year),
        month: clampInteger(parts?.month, 1, 12, 1),
        day: 1,
        hour: clampInteger(parts?.hour, 0, 23, 0),
        minute: clampInteger(parts?.minute, 0, 59, 0),
        second: clampInteger(parts?.second, 0, 59, 0)
    };
    next.day = clampInteger(parts?.day, 1, getTimeWheelDaysInMonth(format, next.year, next.month), 1);
    return next;
}

function getTimeWheelDaysInMonth(format, year, month) {
    const safeYear = format === "month-day-minute" ? 2000 : year;
    return new Date(safeYear, month, 0).getDate();
}

function formatTimeWheelValue(parts, format) {
    const dateText = format === "month-day-minute"
        ? `${pad2(parts.month)}-${pad2(parts.day)}`
        : `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
    const timeText = `${pad2(parts.hour)}:${pad2(parts.minute)}`;
    return format === "year-second"
        ? `${dateText} ${timeText}:${pad2(parts.second)}`
        : `${dateText} ${timeText}`;
}

function getYearOptions(selectedYear) {
    const currentYear = getDefaultTimeWheelParts("year-minute").year;
    const startYear = Math.min(currentYear - 5, selectedYear);
    const endYear = Math.max(currentYear + 6, selectedYear);
    return createRange(startYear, endYear);
}

function syncVacationTimeOutputs(form) {
    const startValue = String(form.elements.namedItem("startTime")?.value || "").trim();
    const endValue = String(form.elements.namedItem("endTime")?.value || "").trim();
    const startParts = parseMonthDayMinute(startValue);
    const endParts = parseMonthDayMinute(endValue);
    if (!startParts || !endParts) {
        return;
    }

    const durationText = formatVacationDuration(startParts, endParts);
    if (!durationText) {
        return;
    }

    const actualVacationTime = form.elements.namedItem("actualVacationTime");
    const duration = form.elements.namedItem("durationText");
    if (actualVacationTime) {
        actualVacationTime.value = `${startValue} ~ ${endValue}（共${durationText}）`;
    }
    if (duration) {
        duration.value = durationText;
    }
}

function parseMonthDayMinute(value) {
    const match = /^(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(String(value || "").trim());
    if (!match) {
        return null;
    }

    const parts = {
        month: Number(match[1]),
        day: Number(match[2]),
        hour: Number(match[3]),
        minute: Number(match[4])
    };
    if (
        parts.month < 1 ||
        parts.month > 12 ||
        parts.day < 1 ||
        parts.day > getTimeWheelDaysInMonth("month-day-minute", 2000, parts.month) ||
        parts.hour < 0 ||
        parts.hour > 23 ||
        parts.minute < 0 ||
        parts.minute > 59
    ) {
        return null;
    }

    return parts;
}

function formatVacationDuration(startParts, endParts) {
    const totalMinutes = calculateVacationDurationMinutes(startParts, endParts);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    return [
        days ? `${days}天` : "",
        hours ? `${hours}小时` : "",
        minutes ? `${minutes}分钟` : ""
    ].filter(Boolean).join("") || "0分钟";
}

function calculateVacationDurationMinutes(startParts, endParts) {
    const start = Date.UTC(2000, startParts.month - 1, startParts.day, startParts.hour, startParts.minute);
    let end = Date.UTC(2000, endParts.month - 1, endParts.day, endParts.hour, endParts.minute);
    if (end <= start) {
        end = Date.UTC(2001, endParts.month - 1, endParts.day, endParts.hour, endParts.minute);
    }

    return Math.max(0, Math.round((end - start) / 60000));
}

function getVacationDurationWarningText(form) {
    const startParts = parseMonthDayMinute(form.elements.namedItem("startTime")?.value || "");
    const endParts = parseMonthDayMinute(form.elements.namedItem("endTime")?.value || "");
    if (!startParts || !endParts) {
        return "";
    }

    const totalMinutes = calculateVacationDurationMinutes(startParts, endParts);
    if (totalMinutes < VACATION_DURATION_CONFIRM_THRESHOLD_MINUTES) {
        return "";
    }

    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    return `当前请假时间为${days}天${hours}小时，你确认吗`;
}

function createRange(start, end) {
    return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);
}

function clampInteger(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
        return fallback;
    }

    return Math.min(max, Math.max(min, Math.trunc(number)));
}

function pad2(value) {
    return String(value).padStart(2, "0");
}

function bindLinkedIdentityFields() {
    const form = document.getElementById("editorForm");
    if (!form) {
        return;
    }

    const userName = form.elements.namedItem("userName");
    const personalName = form.elements.namedItem("personalInfo.name");
    if (userName && personalName) {
        userName.addEventListener("input", () => syncFieldValue(userName, personalName));
        personalName.addEventListener("input", () => syncFieldValue(personalName, userName));
    }

    const userId = form.elements.namedItem("userId");
    const studentId = form.elements.namedItem("personalInfo.studentId");
    const gender = form.elements.namedItem("personalInfo.gender");
    if (userId) {
        userId.addEventListener("input", () => syncPersonalIdentityFromUserId(form));
    }
    [studentId, gender].forEach((element) => {
        if (element) {
            element.addEventListener("input", () => syncUserIdFromPersonalIdentity(form));
        }
    });

    syncPersonalIdentityFromUserId(form);
}

function syncFieldValue(source, target) {
    if (!source || !target || target.value === source.value) {
        return;
    }

    target.value = source.value;
}

function syncPersonalIdentityFromUserId(form) {
    const userId = form.elements.namedItem("userId");
    const studentId = form.elements.namedItem("personalInfo.studentId");
    const gender = form.elements.namedItem("personalInfo.gender");
    const parsed = parseUserIdentity(userId?.value || "");

    if (studentId && parsed.studentId && studentId.value !== parsed.studentId) {
        studentId.value = parsed.studentId;
    }

    if (gender && parsed.gender && gender.value !== parsed.gender) {
        gender.value = parsed.gender;
    }
}

function syncUserIdFromPersonalIdentity(form) {
    const userId = form.elements.namedItem("userId");
    const studentId = form.elements.namedItem("personalInfo.studentId");
    const gender = form.elements.namedItem("personalInfo.gender");
    if (!userId || !studentId) {
        return;
    }

    const nextValue = formatUserIdentity(gender?.value || "", studentId.value, userId.value);
    if (nextValue && userId.value !== nextValue) {
        userId.value = nextValue;
    }
}

function parseUserIdentity(value) {
    const compact = String(value || "").trim().replace(/\s+/g, "");
    const digitMatch = compact.match(/\d+/);
    const prefix = digitMatch ? compact.slice(0, digitMatch.index) : compact;
    let gender = "";
    if (prefix.includes("女")) {
        gender = "女";
    } else if (prefix.includes("男")) {
        gender = "男";
    }

    return {
        gender,
        studentId: digitMatch ? digitMatch[0] : ""
    };
}

function formatUserIdentity(gender, studentId, fallbackUserId = "") {
    const numericStudentId = String(studentId || "").replace(/\D/g, "");
    if (!numericStudentId) {
        return "";
    }

    const normalizedGender = String(gender || "").trim();
    if (normalizedGender.includes("女")) {
        return `女生${numericStudentId}`;
    }
    if (normalizedGender.includes("男")) {
        return `男生${numericStudentId}`;
    }

    const parsedFallback = parseUserIdentity(fallbackUserId);
    return parsedFallback.gender
        ? `${parsedFallback.gender}生${numericStudentId}`
        : numericStudentId;
}

function handleImageFieldInput(kind) {
    const uploader = IMAGE_UPLOADERS[kind];
    state[uploader.uploadErrorKey] = "";
    state[uploader.uploadProgressKey] = null;
    renderImageFeedback(kind);
    renderImageManager(kind);
}

async function handleImageUpload(kind) {
    const uploader = IMAGE_UPLOADERS[kind];
    if (state[uploader.uploadingKey]) {
        return;
    }

    const input = document.getElementById(uploader.inputId);
    const files = Array.from(input?.files || []);

    state[uploader.uploadNoticeKey] = "";
    state[uploader.uploadErrorKey] = "";
    state[uploader.uploadProgressKey] = null;
    renderImageFeedback(kind);

    if (!files.length) {
        renderImageFeedback(kind);
        return;
    }

    const oversized = files.find((file) => file.size > MAX_ATTACHMENT_UPLOAD_BYTES);
    if (oversized) {
        state[uploader.uploadErrorKey] = `图片“${oversized.name}”超过 10MB，无法上传。`;
        renderImageFeedback(kind);
        return;
    }

    state[uploader.uploadingKey] = true;
    updateImageUploaderState(kind);
    updateImageUploadProgress(kind, 0, `正在处理 ${files.length} 张图片...`);

    try {
        let compressedCount = 0;
        const previews = [];
        for (const file of files) {
            const preview = await createCompressedImagePreview(file);
            compressedCount += 1;
            updateImageUploadProgress(
                kind,
                Math.round((compressedCount / files.length) * 20),
                `正在压缩预览图 ${compressedCount}/${files.length}...`
            );
            previews.push(preview);
        }
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file, file.name));
        previews.forEach((preview, index) => {
            if (!preview) {
                return;
            }

            formData.append("previewIndexes", String(index));
            formData.append("previews", preview, preview.name);
        });

        updateImageUploadProgress(kind, 20, "正在上传到 R2...");
        const response = await uploadFormDataWithProgress(uploader.endpoint, formData, (percent) => {
            updateImageUploadProgress(kind, 20 + Math.round(percent * 0.8), `正在上传到 R2 ${percent}%...`);
        });

        const nextUrls = mergeAttachmentUrls(
            getImageUrlsFromEditor(kind),
            (response.items || []).map((item) => item.url).filter(Boolean)
        );
        syncImageField(kind, nextUrls);
        if (input) {
            input.value = "";
        }

        const uploadedCount = Array.isArray(response.items) ? response.items.length : 0;
        const previewCount = previews.filter(Boolean).length;
        updateImageUploadProgress(kind, 100, "上传完成。");
        state[uploader.uploadNoticeKey] = uploadedCount
            ? `已上传 ${uploadedCount} 张图片，已生成 ${previewCount} 张压缩预览图。`
            : "图片上传完成。";
    } catch (error) {
        state[uploader.uploadErrorKey] = error.message || "图片上传失败。";
    } finally {
        state[uploader.uploadingKey] = false;
        state[uploader.uploadProgressKey] = null;
        updateImageUploaderState(kind);
        renderImageFeedback(kind);
        renderImageManager(kind);
    }
}

function updateImageUploadProgress(kind, value, text) {
    const uploader = IMAGE_UPLOADERS[kind];
    state[uploader.uploadProgressKey] = {
        value: Math.max(0, Math.min(100, Number(value) || 0)),
        text
    };
    renderImageFeedback(kind);
}

function uploadFormDataWithProgress(url, formData, onProgress) {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("POST", url);
        request.withCredentials = true;
        request.upload.onprogress = (event) => {
            if (!event.lengthComputable || !event.total) {
                return;
            }

            onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
        };
        request.onload = () => {
            const payload = parseJsonResponse(request.responseText);
            if (request.status >= 200 && request.status < 300) {
                resolve(payload);
                return;
            }

            if (request.status === 401) {
                state.authenticated = false;
                renderLogin();
            }
            reject(new Error(payload.message || "请求失败。"));
        };
        request.onerror = () => reject(new Error("网络异常，图片上传失败。"));
        request.onabort = () => reject(new Error("图片上传已取消。"));
        request.send(formData);
    });
}

function parseJsonResponse(text) {
    try {
        return JSON.parse(text);
    } catch {
        return {
            ok: false,
            message: "服务器返回了无法识别的内容。"
        };
    }
}

async function createCompressedImagePreview(file) {
    if (!file || !String(file.type || "").toLowerCase().startsWith("image/")) {
        return null;
    }

    let source = null;
    let canvas = null;
    try {
        source = await decodeImageSource(file);
        const size = fitImageSize(source.width || source.naturalWidth, source.height || source.naturalHeight);
        if (!size.width || !size.height) {
            return null;
        }

        canvas = createPreviewCanvas(size.width, size.height);
        const keepsAlpha = shouldKeepImageAlpha(file);
        const context = getPreviewCanvasContext(canvas, keepsAlpha);

        if (!context) {
            return null;
        }

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(source, 0, 0, size.width, size.height);
        const blob = await canvasToBlob(canvas, ATTACHMENT_PREVIEW_MIME_TYPE, ATTACHMENT_PREVIEW_QUALITY);
        if (!blob || !blob.size) {
            return null;
        }

        return new File(
            [blob],
            `${stripFileExtension(file.name || "preview")}${ATTACHMENT_PREVIEW_EXTENSION}`,
            { type: blob.type || ATTACHMENT_PREVIEW_MIME_TYPE }
        );
    } catch (error) {
        console.warn("Failed to create attachment preview:", error);
        return null;
    } finally {
        if (typeof source?.close === "function") {
            source.close();
        } else if (typeof HTMLImageElement !== "undefined" && source instanceof HTMLImageElement) {
            source.removeAttribute("src");
            source.load();
        }
        releasePreviewCanvas(canvas);
    }
}

async function decodeImageSource(file) {
    if (typeof createImageBitmap === "function") {
        try {
            return await createImageBitmap(file, {
                colorSpaceConversion: "default",
                imageOrientation: "from-image"
            });
        } catch (error) {
            console.warn("createImageBitmap failed, falling back to HTMLImageElement:", error);
        }
    }

    const objectUrl = URL.createObjectURL(file);
    try {
        return await loadImageElement(objectUrl);
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

function createPreviewCanvas(width, height) {
    if (typeof OffscreenCanvas !== "undefined") {
        return new OffscreenCanvas(width, height);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

function releasePreviewCanvas(canvas) {
    if (!canvas) {
        return;
    }

    try {
        canvas.width = 1;
        canvas.height = 1;
    } catch {
        // Ignore cleanup failures; the canvas will still be garbage-collected.
    }
}

function getPreviewCanvasContext(canvas, alpha) {
    try {
        return canvas.getContext("2d", {
            alpha,
            colorSpace: "srgb",
            desynchronized: true
        }) || canvas.getContext("2d", { alpha });
    } catch {
        return canvas.getContext("2d", { alpha });
    }
}

function shouldKeepImageAlpha(file) {
    const type = String(file?.type || "").toLowerCase();
    return type.includes("png") || type.includes("webp") || type.includes("gif") || type.includes("avif");
}

function loadImageElement(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("图片无法解码。"));
        image.src = src;
    });
}

function fitImageSize(width, height) {
    const safeWidth = Number(width) || 0;
    const safeHeight = Number(height) || 0;
    if (safeWidth <= 0 || safeHeight <= 0) {
        return { width: 0, height: 0 };
    }

    const ratio = Math.min(1, ATTACHMENT_PREVIEW_MAX_SIDE / Math.max(safeWidth, safeHeight));
    return {
        width: Math.max(1, Math.round(safeWidth * ratio)),
        height: Math.max(1, Math.round(safeHeight * ratio))
    };
}

function canvasToBlob(canvas, type, quality) {
    if (typeof canvas.convertToBlob === "function") {
        return canvas.convertToBlob({ type, quality });
    }

    return new Promise((resolve) => {
        canvas.toBlob(resolve, type, quality);
    });
}

function stripFileExtension(fileName) {
    return String(fileName || "preview").replace(/\.[^.\\/]+$/, "") || "preview";
}

function renderImageFeedback(kind) {
    const uploader = IMAGE_UPLOADERS[kind];
    const feedback = document.getElementById(uploader.feedbackId);
    if (!feedback) {
        return;
    }

    const progress = state[uploader.uploadProgressKey];
    feedback.innerHTML = [
        progress ? renderImageUploadProgress(progress) : "",
        state[uploader.uploadNoticeKey] ? `<div class="notice">${escapeHtml(state[uploader.uploadNoticeKey])}</div>` : "",
        state[uploader.uploadErrorKey] ? `<div class="error">${escapeHtml(state[uploader.uploadErrorKey])}</div>` : ""
    ].join("");
}

function renderImageUploadProgress(progress) {
    const value = Math.max(0, Math.min(100, Number(progress.value) || 0));
    return `
        <div class="notice">
            <div>${escapeHtml(progress.text || "正在上传...")}</div>
            <progress value="${value}" max="100">${value}%</progress>
        </div>
    `;
}

function updateImageUploaderState(kind) {
    const uploader = IMAGE_UPLOADERS[kind];
    const uploading = Boolean(state[uploader.uploadingKey]);
    const input = document.getElementById(uploader.inputId);

    if (input) {
        input.disabled = uploading;
    }
}

function renderImageManager(kind) {
    const uploader = IMAGE_UPLOADERS[kind];
    const container = document.getElementById(uploader.managerId);
    if (!container) {
        return;
    }

    const urls = getImageUrlsFromEditor(kind);
    const countValue = document.getElementById(uploader.countId);
    if (countValue) {
        countValue.textContent = countAttachments(urls);
    }

    if (!urls.length) {
        container.innerHTML = `<div class="empty attachment-empty">${escapeHtml(uploader.emptyText)}</div>`;
        return;
    }

    container.innerHTML = urls
        .map((url, index) => `
            <article class="attachment-card">
                <img class="attachment-card__image" src="${escapeHtml(getAttachmentPreviewUrl(url))}" data-fallback-src="${escapeHtml(url)}" alt="图片 ${index + 1}" loading="lazy" decoding="async">
                <div class="attachment-card__body">
                    <a class="attachment-card__link" href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(shortenText(url, 72))}</a>
                    <button class="ghost-btn attachment-card__remove" type="button" data-image-kind="${escapeHtml(kind)}" data-image-index="${index}">移除</button>
                </div>
            </article>
        `)
        .join("");

    container.querySelectorAll("img[data-fallback-src]").forEach((image) => {
        image.addEventListener("error", handleAttachmentPreviewError, { once: true });
    });

    container.querySelectorAll("[data-image-index]").forEach((button) => {
        button.addEventListener("click", () => removeImageAtIndex(kind, Number(button.dataset.imageIndex)));
    });
}

function removeImageAtIndex(kind, index) {
    if (!Number.isInteger(index) || index < 0) {
        return;
    }

    const uploader = IMAGE_UPLOADERS[kind];
    const urls = getImageUrlsFromEditor(kind);
    urls.splice(index, 1);
    syncImageField(kind, urls);
    state[uploader.uploadNoticeKey] = "";
    state[uploader.uploadErrorKey] = "";
    state[uploader.uploadProgressKey] = null;
    renderImageFeedback(kind);
    renderImageManager(kind);
}

function getImageUrlsFromEditor(kind) {
    const uploader = IMAGE_UPLOADERS[kind];
    const field = document.querySelector(`textarea[name="${uploader.fieldName}"]`);
    if (!field) {
        return kind === "completion"
            ? normalizeAttachmentUrls(state.currentRecord?.config?.completionInfo?.attachments || [])
            : normalizeAttachmentUrls(state.currentRecord?.config?.attachments || []);
    }

    return normalizeAttachmentUrls(String(field.value || "").split(/\r?\n/));
}

function syncImageField(kind, urls) {
    const uploader = IMAGE_UPLOADERS[kind];
    const field = document.querySelector(`textarea[name="${uploader.fieldName}"]`);
    if (field) {
        field.value = normalizeAttachmentUrls(urls).join("\n");
    }
}

function normalizeAttachmentUrls(items) {
    const values = Array.isArray(items) ? items : [items];
    const seen = new Set();
    const result = [];

    values.forEach((value) => {
        const normalized = normalizeAttachmentUrl(value);
        if (!normalized || seen.has(normalized)) {
            return;
        }

        seen.add(normalized);
        result.push(normalized);
    });

    return result;
}

function normalizeAttachmentUrl(value) {
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

function replaceUrlPathExtension(path, extension) {
    const slashIndex = path.lastIndexOf("/");
    const dotIndex = path.lastIndexOf(".");
    if (dotIndex > slashIndex) {
        return `${path.slice(0, dotIndex)}${extension}`;
    }

    return `${path}${extension}`;
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

function mergeAttachmentUrls(existing, incoming) {
    return normalizeAttachmentUrls([...(existing || []), ...(incoming || [])]);
}

function shortenText(value, maxLength) {
    const text = String(value || "");
    if (text.length <= maxLength) {
        return text;
    }

    const sideLength = Math.max(8, Math.floor((maxLength - 3) / 2));
    return `${text.slice(0, sideLength)}...${text.slice(-sideLength)}`;
}

async function handleSaveSubmit(event) {
    event.preventDefault();
    if (state.saving) {
        return;
    }

    const form = event.currentTarget;
    syncVacationTimeOutputs(form);
    const durationWarningText = getVacationDurationWarningText(form);
    if (durationWarningText && !window.confirm(durationWarningText)) {
        return;
    }

    state.message = "";
    state.error = "";

    const payload = collectFormPayload(form);
    state.currentRecord = {
        id: state.currentRecord?.id || "",
        url: state.currentRecord?.url || "",
        customSubdomainEnabled: payload.customSubdomainEnabled,
        customSubdomain: payload.customSubdomain || "",
        config: payload.config,
        expiresAtBeijing: payload.expiresAtBeijing
    };
    state.saving = true;
    renderDashboard();

    try {
        const updatingExisting = Boolean(state.currentRecord.id);
        const response = updatingExisting
            ? await api(`/login/api/shares/${encodeURIComponent(state.currentRecord.id)}`, {
                  method: "PUT",
                  body: payload
              })
            : await api("/login/api/shares", {
                  method: "POST",
                  body: payload
              });

        state.currentRecord = normalizeRecord(response.item);
        state.message = updatingExisting
            ? "当前子链接已更新，链接地址保持不变，前端内容已实时生效。"
            : "新子链接已生成。";
        upsertShareSummary(response.item);
    } catch (error) {
        state.error = error.message;
    } finally {
        state.saving = false;
        renderDashboard();
    }
}

function normalizeRecord(item) {
    const customSubdomain = item?.customSubdomain || "";
    const config = clone(item?.config || state.template || {});
    return {
        id: item?.id || "",
        url: item?.url || "",
        customSubdomainEnabled: Boolean(item?.customSubdomainEnabled || customSubdomain),
        customSubdomain,
        config,
        expiresAtBeijing: item?.expiresAtBeijing || createDefaultExpiry(config)
    };
}

function upsertShareSummary(item) {
    const summary = createShareSummary(item);
    if (!summary.id) {
        return;
    }

    state.shares = [
        summary,
        ...state.shares.filter((existing) => existing.id !== summary.id)
    ].sort((left, right) => (right.updatedAt || 0) - (left.updatedAt || 0));
}

function removeShareSummary(shareId) {
    state.shares = state.shares.filter((item) => item.id !== shareId);
}

function upsertTrashSummary(item) {
    const summary = createTrashSummary(item);
    if (!summary.id) {
        return;
    }

    state.trash = [
        summary,
        ...state.trash.filter((existing) => existing.id !== summary.id)
    ].sort((left, right) => (right.deletedAt || 0) - (left.deletedAt || 0));
}

function removeTrashSummary(shareId) {
    state.trash = state.trash.filter((item) => item.id !== shareId);
}

function createShareSummary(item) {
    const config = item?.config || {};
    return {
        id: item?.id || "",
        userName: config.userName || "",
        startTime: config.startTime || "",
        endTime: config.endTime || "",
        expiresAt: item?.expiresAt || 0,
        expiresAtBeijing: item?.expiresAtBeijing || "",
        updatedAt: item?.updatedAt || Date.now(),
        updatedAtBeijing: item?.updatedAtBeijing || "",
        url: item?.url || ""
    };
}

function createTrashSummary(item) {
    return {
        id: item?.id || "",
        userName: item?.userName || "",
        startTime: item?.startTime || "",
        endTime: item?.endTime || "",
        expiresAt: item?.expiresAt || 0,
        expiresAtBeijing: item?.expiresAtBeijing || "",
        deletedAt: item?.deletedAt || Date.now(),
        deletedAtBeijing: item?.deletedAtBeijing || "",
        purgeAt: item?.purgeAt || 0,
        purgeAtBeijing: item?.purgeAtBeijing || "",
        archiveAt: item?.archiveAt || 0,
        archiveAtBeijing: item?.archiveAtBeijing || "",
        url: item?.url || ""
    };
}

async function loadShareIntoEditor(shareId) {
    if (!shareId) {
        return;
    }

    try {
        const response = await api(`/login/api/shares/${encodeURIComponent(shareId)}`);
        state.currentRecord = normalizeRecord(response.item);
        state.message = "已载入该版本。点击“保存当前链接”会直接更新这个子链接，链接地址保持不变。";
        state.error = "";
        renderDashboard();
    } catch (error) {
        state.error = error.message;
        renderDashboard();
    }
}

async function destroyShare(shareId) {
    if (!shareId || state.destroyingShareId) {
        return;
    }

    if (!window.confirm(`确认销毁链接 ${shareId} 吗？销毁后将无法访问。`)) {
        return;
    }

    state.destroyingShareId = shareId;
    state.message = "";
    state.error = "";
    renderDashboard();

    try {
        const response = await api(`/login/api/shares?id=${encodeURIComponent(shareId)}`, { method: "DELETE" });
        removeShareSummary(shareId);
        if (response.item) {
            upsertTrashSummary(response.item);
        }

        if (state.currentRecord?.id === shareId) {
            state.currentRecord = createBlankRecord();
        }

        state.message = response.item
            ? "链接已移入回收站。原链接失效或保留期到达后会进入封存库。"
            : "链接记录已清理。";
    } catch (error) {
        state.error = error.message;
    } finally {
        state.destroyingShareId = "";
        renderDashboard();
    }
}

async function restoreShare(shareId) {
    if (!shareId || state.restoringShareId) {
        return;
    }

    state.restoringShareId = shareId;
    state.message = "";
    state.error = "";
    renderDashboard();

    try {
        const response = await api(`/login/api/trash/restore?id=${encodeURIComponent(shareId)}`, {
            method: "POST",
            body: { id: shareId }
        });
        removeTrashSummary(shareId);
        upsertShareSummary(response.item);
        state.message = "链接已恢复，原链接地址保持不变。";
    } catch (error) {
        state.error = error.message;
    } finally {
        state.restoringShareId = "";
        renderDashboard();
    }
}

async function destroyCurrentLink() {
    if (!state.currentRecord?.id) {
        state.error = "当前没有可销毁的已生成链接。";
        renderDashboard();
        return;
    }

    await destroyShare(state.currentRecord.id);
}

function resetFormToTemplate() {
    if (state.saving) {
        return;
    }

    state.currentRecord = createBlankRecord();
    state.message = "已恢复到默认模板。";
    state.error = "";
    renderDashboard();
}

async function handleLogout() {
    if (state.loggingOut) {
        return;
    }

    dashboardListLoadToken += 1;
    state.loggingOut = true;
    renderDashboard();

    try {
        await api("/login/api/logout", { method: "POST" });
        window.location.href = "/cdn-cgi/access/logout";
        state.authenticated = false;
        state.username = "";
        state.template = null;
        state.shares = [];
        state.trash = [];
        state.sharesLoading = false;
        state.trashLoading = false;
        state.sharesError = "";
        state.trashError = "";
        state.currentRecord = null;
        state.message = "";
        state.error = "";
        state.attachmentNotice = "";
        state.attachmentError = "";
        state.completionAttachmentNotice = "";
        state.completionAttachmentError = "";
    } finally {
        state.loggingOut = false;
        renderLogin();
    }
}

function fillEditorForm(record) {
    const form = document.getElementById("editorForm");
    const config = record?.config || clone(state.template || {});
    const customSubdomain = record?.customSubdomain || "";
    const customSubdomainEnabled = Boolean(record?.customSubdomainEnabled || customSubdomain);

    const customSubdomainToggle = form.elements.namedItem("customSubdomainEnabled");
    if (customSubdomainToggle) {
        customSubdomainToggle.checked = customSubdomainEnabled;
    }
    const customSubdomainInput = form.elements.namedItem("customSubdomain");
    if (customSubdomainInput) {
        customSubdomainInput.value = customSubdomain;
    }

    FIELD_GROUPS.forEach((group) => {
        group.fields.forEach((field) => {
            fillFieldLabelToggle(form, config, field);

            if (field.type === "destination") {
                fillDestinationPicker(form, getValue(config, field.path));
                return;
            }

            const element = form.elements.namedItem(field.path);
            if (!element) {
                return;
            }

            let value;
            if (field.path === ATTACHMENT_TEXT_FIELD) {
                value = Array.isArray(config.attachments) ? config.attachments.join("\n") : "";
            } else if (field.path === COMPLETION_ATTACHMENT_TEXT_FIELD) {
                value = Array.isArray(config.completionInfo?.attachments)
                    ? config.completionInfo.attachments.join("\n")
                    : "";
            } else if (field.path === "expiresAtBeijing") {
                value = record?.expiresAtBeijing ? record.expiresAtBeijing.replace(" ", "T") : createDefaultExpiry(config);
            } else {
                value = getValue(config, field.path);
            }

            const timeWheelOptions = getTimeWheelFieldOptions(field.path);
            if (timeWheelOptions && typeof value === "string") {
                value = normalizeTimeWheelInputValue(value, timeWheelOptions);
            } else if (field.type === "datetime-local" && typeof value === "string") {
                value = value.replace(" ", "T");
            }

            if (field.type === "checkbox") {
                element.checked = Boolean(value);
            } else {
                element.value = value == null ? "" : String(value);
            }
        });
    });
    fillOptionalVisibilityFields(form, config);
    fillTextColorFields(form, config);
    syncThemeColorPickers(form);
    const expiryElement = form.elements.namedItem("expiresAtBeijing");
    if (expiryElement) {
        const defaultExpiry = createDefaultExpiry(config);
        const currentExpiry = String(expiryElement.value || "").trim().replace("T", " ");
        if (!record?.id && currentExpiry === defaultExpiry) {
            expiryElement.dataset.autoDefaultExpiry = defaultExpiry;
        } else {
            delete expiryElement.dataset.autoDefaultExpiry;
        }
    }
    syncCustomSubdomainFieldsState();
}

function collectFormPayload(form) {
    syncLinkedStatusTimesFromLeaveFields(form);
    const config = clone(state.template || {});

    FIELD_GROUPS.forEach((group) => {
        group.fields.forEach((field) => {
            collectFieldLabelToggle(form, config, field);

            if (field.path === "expiresAtBeijing") {
                return;
            }

            if (field.type === "destination") {
                setValue(config, field.path, collectDestinationValue(form));
                return;
            }

            const element = form.elements.namedItem(field.path);
            if (!element) {
                return;
            }

            if (field.path === ATTACHMENT_TEXT_FIELD) {
                config.attachments = normalizeAttachmentUrls(String(element.value || "").split(/\r?\n/));
                return;
            }

            if (field.path === COMPLETION_ATTACHMENT_TEXT_FIELD) {
                if (!config.completionInfo || typeof config.completionInfo !== "object") {
                    config.completionInfo = {};
                }
                config.completionInfo.attachments = normalizeAttachmentUrls(String(element.value || "").split(/\r?\n/));
                return;
            }

            setValue(config, field.path, field.type === "checkbox" ? element.checked : element.value);
        });
    });
    config.visibleFields = collectOptionalVisibilityFields(form, config);
    config.textColors = collectTextColorFields(form, config);

    const customSubdomainEnabled = Boolean(form.elements.namedItem("customSubdomainEnabled")?.checked);
    const customSubdomain = String(form.elements.namedItem("customSubdomain")?.value || "").trim();
    const payload = {
        config,
        expiresAtBeijing: form.elements.namedItem("expiresAtBeijing").value,
        customSubdomainEnabled,
        customSubdomain: customSubdomainEnabled ? customSubdomain : ""
    };

    return payload;
}

function fillFieldLabelToggle(form, config, field) {
    const toggle = field.labelToggle;
    if (!toggle) {
        return;
    }

    const element = form.elements.namedItem(toggle.path);
    if (element) {
        element.checked = Boolean(getValue(config, toggle.path));
    }
}

function collectFieldLabelToggle(form, config, field) {
    const toggle = field.labelToggle;
    if (!toggle) {
        return;
    }

    const element = form.elements.namedItem(toggle.path);
    if (element) {
        setValue(config, toggle.path, Boolean(element.checked));
    }
}

function fillOptionalVisibilityFields(form, config) {
    if (!form) {
        return;
    }

    getOptionalVisibilityKeys().forEach((key) => {
        const element = form.elements.namedItem(`${OPTIONAL_VISIBLE_FIELDS_FIELD}.${key}`);
        if (element) {
            element.checked = isOptionalChildVisible(config, key);
        }
    });
}

function collectOptionalVisibilityFields(form, config) {
    const visibleFields = {
        ...(config?.visibleFields && typeof config.visibleFields === "object" ? config.visibleFields : {})
    };
    getOptionalVisibilityKeys().forEach((key) => {
        const element = form.elements.namedItem(`${OPTIONAL_VISIBLE_FIELDS_FIELD}.${key}`);
        visibleFields[key] = element ? Boolean(element.checked) : isOptionalChildVisible(config, key);
    });
    return visibleFields;
}

function fillTextColorFields(form, config) {
    if (!form) {
        return;
    }

    form.querySelectorAll("[data-text-color-path]").forEach((element) => {
        const path = element.dataset.textColorPath || "";
        element.dataset.hasStoredTextColor = config?.textColors?.[path] ? "1" : "0";
        const color = getTextColorValueForField(path, config);
        if (color) {
            element.value = color;
        }
    });
}

function collectTextColorFields(form, config) {
    const textColors = {
        ...(config?.textColors && typeof config.textColors === "object" ? config.textColors : {})
    };

    form.querySelectorAll("[data-text-color-path]").forEach((element) => {
        const path = element.dataset.textColorPath || "";
        const color = normalizeHexColor(element.value);
        if (path && color) {
            textColors[path] = color;
        }
    });

    return textColors;
}

function getOptionalVisibilityKeys() {
    return [
        ...OPTIONAL_DISPLAY_FIELDS.map((item) => item.key),
        "attachments",
        "completionAttachments"
    ];
}

function isOptionalVisibilityEnabled() {
    return Boolean(state.currentRecord?.config?.optionalVisibilityEnabled);
}

function isTextColorModeEnabled() {
    return Boolean(state.currentRecord?.config?.[TEXT_COLOR_MODE_FIELD]);
}

function isTextColorField(field) {
    return Boolean(TEXT_COLOR_FIELD_DEFAULTS[field?.path]);
}

function getTextColorValueForField(path, config) {
    return normalizeHexColor(config?.textColors?.[path]) || getDefaultTextColorForField(path, config);
}

function getDefaultTextColorForField(path, config) {
    if (path === "cancelRuleText") {
        return normalizeHexColor(config?.cancelRuleColor) || DEFAULT_CANCEL_RULE_COLOR;
    }

    if (path === "needLeaveSchool" && config?.needLeaveSchoolUseCancelRuleColor) {
        return normalizeHexColor(config?.cancelRuleColor) || DEFAULT_CANCEL_RULE_COLOR;
    }

    const approvalActionMatch =
        /^completionInfo\.approvalFlow\.(firstStep|secondStep)\.actionText$/.exec(path);
    if (approvalActionMatch) {
        return getCompletionApprovalActionTextColor(
            getValue(config, `completionInfo.approvalFlow.${approvalActionMatch[1]}.theme`)
        );
    }

    return TEXT_COLOR_FIELD_DEFAULTS[path] || DEFAULT_TEXT_COLOR;
}

function getCompletionApprovalActionTextColor(theme) {
    return getApprovalThemeColor(theme).textColor;
}

function getApprovalThemeColor(theme) {
    return APPROVAL_THEME_COLORS[String(theme || "").trim().toLowerCase()] || APPROVAL_THEME_COLORS.primary;
}

function isOptionalChildVisible(config, key) {
    const fields = config?.visibleFields;
    if (!fields || typeof fields !== "object" || !(key in fields)) {
        return true;
    }
    return Boolean(fields[key]);
}

async function copyCurrentLink() {
    if (!state.currentRecord?.url) {
        state.error = "当前还没有可复制的链接。";
        renderDashboard();
        return;
    }

    try {
        await copyText(state.currentRecord.url);
        state.message = "当前链接已复制到剪贴板。";
        state.error = "";
    } catch (error) {
        state.error = error.message || "复制失败。";
    }

    renderDashboard();
}

async function copyText(text) {
    if (!text) {
        throw new Error("没有可复制的内容。");
    }

    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }

    window.prompt("请手动复制以下链接：", text);
}

async function fetchSession() {
    try {
        return await api("/login/api/session", { timeoutMs: 1800 }, false);
    } catch {
        return { authenticated: false, username: "" };
    }
}

async function api(url, options = {}, throwOnUnauthorized = true) {
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
    const headers = new Headers(options.headers || {});
    const controller = options.timeoutMs ? new AbortController() : null;
    const timeoutId = controller
        ? window.setTimeout(() => controller.abort(), options.timeoutMs)
        : null;
    if (!isFormData && options.body !== undefined && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    let response;
    try {
        response = await fetch(url, {
            method: options.method || "GET",
            headers,
            credentials: "same-origin",
            signal: controller?.signal,
            body: options.body === undefined
                ? undefined
                : (isFormData ? options.body : JSON.stringify(options.body))
        });
    } finally {
        if (timeoutId) {
            window.clearTimeout(timeoutId);
        }
    }

    const payload = await response.json().catch(() => ({
        ok: false,
        message: "服务器返回了无法识别的内容。"
    }));

    if (!response.ok) {
        if (response.status === 401 && throwOnUnauthorized) {
            state.authenticated = false;
            renderLogin();
        }
        throw new Error(payload.message || "请求失败。");
    }

    return payload;
}

function getValue(object, path) {
    return path.split(".").reduce((current, key) => (current == null ? undefined : current[key]), object);
}

function setValue(object, path, value) {
    const keys = path.split(".");
    let current = object;
    for (let index = 0; index < keys.length - 1; index += 1) {
        const key = keys[index];
        if (!current[key] || typeof current[key] !== "object" || Array.isArray(current[key])) {
            current[key] = {};
        }
        current = current[key];
    }
    current[keys[keys.length - 1]] = value;
}

function countAttachments(items) {
    return `${Array.isArray(items) ? items.length : 0} 张`;
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function createDefaultExpiry(config = state.currentRecord?.config || state.template || {}) {
    return createExpiryFromEndTime(config) || formatBeijingDateTimeForInput(Date.now() + 24 * 60 * 60 * 1000);
}

function createExpiryFromEndTime(config) {
    const endParts = parseTimeWheelValue(config?.endTime || "");
    if (!endParts) {
        return "";
    }

    const year = inferExpiryYearFromEndTime(config, endParts);
    const endAt = Date.UTC(year, endParts.month - 1, endParts.day, endParts.hour - 8, endParts.minute);
    if (!Number.isFinite(endAt)) {
        return "";
    }

    return formatBeijingDateTimeForInput(endAt + 24 * 60 * 60 * 1000);
}

function inferExpiryYearFromEndTime(config, endParts) {
    if (endParts.year && endParts.year !== 2000) {
        return endParts.year;
    }

    const completedParts = parseTimeWheelValue(
        config?.completedSwitchAtBeijing || config?.statusSwitchAtBeijing || ""
    );
    if (completedParts?.year && completedParts.year !== 2000) {
        return completedParts.year;
    }

    const startParts = parseTimeWheelValue(config?.startTime || "");
    const defaultYear = getDefaultTimeWheelParts("year-minute").year;
    if (startParts && getMonthDayMinuteKey(endParts) < getMonthDayMinuteKey(startParts)) {
        return defaultYear + 1;
    }

    return defaultYear;
}

function syncDefaultExpiryFromLeaveTimes(form) {
    const expiryInput = form.elements.namedItem("expiresAtBeijing");
    if (!expiryInput) {
        return;
    }

    const previousConfig = state.currentRecord?.config || state.template || {};
    const currentValue = String(expiryInput.value || "").trim().replace("T", " ");
    const previousDefault = createDefaultExpiry(previousConfig);
    const autoDefault = expiryInput.dataset.autoDefaultExpiry || previousDefault;
    if (currentValue && currentValue !== autoDefault && currentValue !== previousDefault) {
        return;
    }

    const nextConfig = {
        ...previousConfig,
        startTime: String(form.elements.namedItem("startTime")?.value || "").trim(),
        endTime: String(form.elements.namedItem("endTime")?.value || "").trim()
    };
    const nextDefault = createDefaultExpiry(nextConfig);
    if (nextDefault && expiryInput.value !== nextDefault) {
        expiryInput.value = nextDefault;
        expiryInput.dataset.autoDefaultExpiry = nextDefault;
    }
}

function getMonthDayMinuteKey(parts) {
    return (parts.month * 1000000) + (parts.day * 10000) + (parts.hour * 100) + parts.minute;
}

function formatBeijingDateTimeForInput(timestamp) {
    const date = new Date(timestamp + 8 * 60 * 60 * 1000);
    return [
        date.getUTCFullYear(),
        String(date.getUTCMonth() + 1).padStart(2, "0"),
        String(date.getUTCDate()).padStart(2, "0")
    ].join("-") + " " + [
        String(date.getUTCHours()).padStart(2, "0"),
        String(date.getUTCMinutes()).padStart(2, "0")
    ].join(":");
}

function normalizeHexColor(value) {
    const color = String(value || "").trim();
    return /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : "";
}

function startClock() {
    updateClock();
    window.setInterval(updateClock, 1000);
}

function updateClock() {
    const date = new Date(Date.now() + 8 * 60 * 60 * 1000);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const seconds = String(date.getUTCSeconds()).padStart(2, "0");
    const clock = document.getElementById("beijingClock");
    if (clock) {
        clock.textContent = `北京时间 ${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

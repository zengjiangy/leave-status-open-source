const state = {
    authenticated: false,
    username: "",
    items: [],
    loading: true,
    message: "",
    error: "",
    loggingOut: false,
    restoringId: "",
    restoreTarget: null
};

document.addEventListener("DOMContentLoaded", bootstrap);

async function bootstrap() {
    renderLoading();
    const session = await fetchSession();
    state.authenticated = session.authenticated;
    state.username = session.username || "";

    if (state.authenticated) {
        await loadHistory();
        return;
    }

    state.loading = false;
    renderLogin();
}

function renderLoading() {
    document.getElementById("app").innerHTML = `
        <div class="hero">
            <div>
                <h1>链接封存库</h1>
                <p>正在检查登录状态。</p>
            </div>
        </div>
        <div class="panel loading">正在加载封存库...</div>
    `;
}

function renderLogin() {
    document.getElementById("app").innerHTML = `
        <div class="hero">
            <div>
                <h1>链接封存库</h1>
                <p>使用已授权的管理员邮箱通过 Cloudflare Access 登录。</p>
            </div>
        </div>
        <section class="panel login-shell">
            <h2>管理员登录</h2>
            <p>登录地址固定为 <strong>app.example.com/linkhistory</strong>。</p>
            <button class="primary-btn" type="button" id="accessLoginBtn">使用 Cloudflare Access 登录</button>
            <div id="loginFeedback">${state.error ? `<div class="error">${escapeHtml(state.error)}</div>` : ""}</div>
        </section>
    `;

    document.getElementById("accessLoginBtn").addEventListener("click", () => window.location.reload());
}

async function loadHistory() {
    state.loading = true;
    renderHistory();

    try {
        const response = await api("/linkhistory/api/items");
        state.items = response.items || [];
        state.error = "";
    } catch (error) {
        state.error = error.message;
    } finally {
        state.loading = false;
        renderHistory();
    }
}

function renderHistory() {
    document.getElementById("app").innerHTML = `
        <div class="hero">
            <div>
                <h1>链接封存库</h1>
                <p>当前账号：<strong>${escapeHtml(state.username || "-")}</strong>。封存链接不会被销毁，除非该管理员账号被直接删除。</p>
            </div>
        </div>

        <section class="panel toolbar">
            <div>
                <strong>封存库</strong>
                <span>访问入口：app.example.com/linkhistory；恢复使用当前 Cloudflare Access 会话。</span>
            </div>
            <div class="toolbar-actions">
                <button class="secondary-btn" type="button" id="refreshBtn"${state.loading ? " disabled" : ""}>刷新</button>
                <button class="secondary-btn" type="button" id="dashboardBtn">管理后台</button>
                <button class="ghost-btn" type="button" id="logoutBtn"${state.loggingOut ? " disabled" : ""}>${state.loggingOut ? "退出中..." : "退出登录"}</button>
            </div>
        </section>

        <section class="panel side-card history-panel">
            <h3>已封存链接</h3>
            <p>这些链接来自已失效或超过回收站保留期的回收站记录。恢复会沿用原 32 位链接 ID，并把记录放回管理后台。</p>
            ${state.message ? `<div class="notice">${escapeHtml(state.message)}</div>` : ""}
            ${state.error ? `<div class="error">${escapeHtml(state.error)}</div>` : ""}
            ${state.loading ? '<div class="loading">正在加载封存记录...</div>' : renderArchiveList()}
        </section>

        ${state.restoreTarget ? renderRestoreModal(state.restoreTarget) : ""}
    `;

    bindHistoryEvents();
}

function renderArchiveList() {
    if (!state.items.length) {
        return `<div class="empty">封存库暂无链接。</div>`;
    }

    return `
        <div class="share-list history-list">
            ${state.items.map((item) => {
                const restoring = state.restoringId === item.id;
                return `
                    <article class="share-item history-item">
                        <strong>${escapeHtml(item.userName || "未填写姓名")} · ${escapeHtml(item.startTime || "-")} 至 ${escapeHtml(item.endTime || "-")}</strong>
                        <p>ID：${escapeHtml(item.id)}</p>
                        <p>原链接：${escapeHtml(item.url || "-")}</p>
                        <p>原链接失效时间：${escapeHtml(item.expiresAtBeijing || "-")}</p>
                        <p>销毁时间：${escapeHtml(item.deletedAtBeijing || "-")}</p>
                        <p>封存时间：${escapeHtml(item.archivedAtBeijing || "-")} · ${escapeHtml(item.archiveReasonText || "已封存")}</p>
                        <div class="share-actions">
                            <button class="secondary-btn" type="button" data-action="restore" data-id="${escapeHtml(item.id)}"${restoring ? " disabled" : ""}>${restoring ? "恢复中..." : "恢复"}</button>
                            <button class="ghost-btn" type="button" data-action="copy" data-url="${escapeHtml(item.url)}"${restoring ? " disabled" : ""}>复制原链接</button>
                        </div>
                    </article>
                `;
            }).join("")}
        </div>
    `;
}

function renderRestoreModal(item) {
    return `
        <div class="history-modal-backdrop" role="presentation">
            <section class="history-modal" role="dialog" aria-modal="true" aria-labelledby="restoreTitle">
                <div class="history-modal-head">
                    <h2 id="restoreTitle">恢复封存链接</h2>
                    <button class="ghost-btn history-modal-close" type="button" id="closeRestoreModal">关闭</button>
                </div>
                <p>确认恢复 <strong>${escapeHtml(item.id)}</strong>。恢复后会跳转回管理后台。</p>
                <form id="restoreForm" class="login-form history-restore-form">
                    <div class="form-actions">
                        <button class="primary-btn" type="submit"${state.restoringId ? " disabled" : ""}>${state.restoringId ? "恢复中..." : "确认恢复"}</button>
                        <button class="ghost-btn" type="button" id="cancelRestoreBtn"${state.restoringId ? " disabled" : ""}>取消</button>
                    </div>
                </form>
            </section>
        </div>
    `;
}

function returnToDashboard() {
    if (canReturnToDashboard()) {
        window.history.back();
        return;
    }

    window.location.href = "/login";
}

function canReturnToDashboard() {
    if (window.history.length <= 1 || !document.referrer) {
        return false;
    }

    try {
        const referrer = new URL(document.referrer);
        const referrerPath = referrer.pathname.replace(/\/+$/, "") || "/";
        return referrer.origin === window.location.origin && referrerPath === "/login";
    } catch {
        return false;
    }
}

function bindHistoryEvents() {
    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", loadHistory);
    }

    const dashboardBtn = document.getElementById("dashboardBtn");
    if (dashboardBtn) {
        dashboardBtn.addEventListener("click", returnToDashboard);
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", handleLogout);
    }

    document.querySelectorAll("[data-action='copy']").forEach((button) => {
        button.addEventListener("click", () => copyText(button.dataset.url || ""));
    });

    document.querySelectorAll("[data-action='restore']").forEach((button) => {
        button.addEventListener("click", () => openRestoreModal(button.dataset.id || ""));
    });

    const closeRestoreModal = document.getElementById("closeRestoreModal");
    if (closeRestoreModal) {
        closeRestoreModal.addEventListener("click", closeRestoreModalDialog);
    }

    const cancelRestoreBtn = document.getElementById("cancelRestoreBtn");
    if (cancelRestoreBtn) {
        cancelRestoreBtn.addEventListener("click", closeRestoreModalDialog);
    }

    const restoreForm = document.getElementById("restoreForm");
    if (restoreForm) {
        restoreForm.addEventListener("submit", handleRestoreSubmit);
    }
}

function openRestoreModal(shareId) {
    const item = state.items.find((entry) => entry.id === shareId);
    if (!item || state.restoringId) {
        return;
    }

    state.restoreTarget = item;
    state.message = "";
    state.error = "";
    renderHistory();
}

function closeRestoreModalDialog() {
    if (state.restoringId) {
        return;
    }

    state.restoreTarget = null;
    renderHistory();
}

async function handleRestoreSubmit(event) {
    event.preventDefault();
    const shareId = state.restoreTarget?.id || "";

    if (!shareId) {
        return;
    }

    state.restoringId = shareId;
    state.error = "";
    renderHistory();

    try {
        await api(`/linkhistory/api/restore?id=${encodeURIComponent(shareId)}`, {
            method: "POST",
            body: { id: shareId }
        });
        window.location.href = "/login";
    } catch (error) {
        state.error = error.message;
        state.restoringId = "";
        renderHistory();
    }
}

async function handleLogout() {
    if (state.loggingOut) {
        return;
    }

    state.loggingOut = true;
    renderHistory();

    try {
        await api("/linkhistory/api/logout", { method: "POST" });
        window.location.href = "/cdn-cgi/access/logout";
        state.authenticated = false;
        state.username = "";
        state.items = [];
        state.message = "";
        state.error = "";
        state.restoreTarget = null;
        renderLogin();
    } catch (error) {
        state.error = error.message;
        state.loggingOut = false;
        renderHistory();
    }
}

async function copyText(text) {
    if (!text) {
        state.error = "没有可复制的链接。";
        renderHistory();
        return;
    }

    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            window.prompt("请手动复制以下链接：", text);
        }
        state.message = "链接已复制到剪贴板。";
        state.error = "";
    } catch (error) {
        state.error = error.message || "复制失败。";
    }

    renderHistory();
}

async function fetchSession() {
    try {
        return await api("/linkhistory/api/session", {}, false);
    } catch {
        return { authenticated: false, username: "" };
    }
}

async function api(url, options = {}, throwOnUnauthorized = true) {
    const headers = new Headers(options.headers || {});
    if (options.body !== undefined && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
        method: options.method || "GET",
        headers,
        credentials: "same-origin",
        body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });

    const payload = await response.json().catch(() => ({
        ok: false,
        message: "服务器返回了无法识别的内容。"
    }));

    if (!response.ok) {
        if (response.status === 401 && throwOnUnauthorized) {
            state.authenticated = false;
            state.items = [];
            state.restoreTarget = null;
            renderLogin();
        }
        throw new Error(payload.message || "请求失败。");
    }

    return payload;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

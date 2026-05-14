export function renderSuperLoginPage(apiPrefix = "/superloginv/api") {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>超级管理员</title>
  <style>
    :root {
      --bg: #f4f7fb;
      --panel: rgba(255, 255, 255, 0.75);
      --line: rgba(215, 224, 234, 0.6);
      --text: #0f172a;
      --muted: #64748b;
      --brand: #0a7cff;
      --danger: #ef4444;
      --ok: #10b981;
    }
    * { box-sizing: border-box; }
    html { width: 100%; overflow-x: hidden; -webkit-text-size-adjust: 100%; }
    body {
      margin: 0;
      min-height: 100vh;
      min-height: 100dvh;
      font-family: "Inter", "PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at 15% 15%, rgba(10, 124, 255, 0.15) 0%, transparent 40%),
        radial-gradient(circle at 85% 85%, rgba(16, 185, 129, 0.1) 0%, transparent 40%),
        linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      background-attachment: fixed;
      color: var(--text);
      overflow-x: hidden;
    }
    button, input { font: inherit; max-width: 100%; }
    .page { width: min(960px, 100%); margin: 0 auto; padding: clamp(14px, 3vw, 24px); }
    .hero { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 10px; }
    h1 { margin: 0 0 5px; font-size: clamp(24px, 3vw, 34px); letter-spacing: 0; }
    p { margin: 0; color: var(--muted); line-height: 1.5; font-size: 14px; }
    .panel {
      background: var(--panel);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.6);
      border-radius: 20px;
      box-shadow: 0 10px 40px -10px rgba(15, 23, 42, 0.08), 0 0 20px rgba(255, 255, 255, 0.5) inset;
      padding: 18px;
    }
    .stack { display: grid; gap: 10px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    label { display: grid; gap: 8px; color: var(--muted); font-size: 14px; }
    input {
      width: 100%;
      min-height: 44px;
      padding: 11px 14px;
      border: 1px solid var(--line);
      border-radius: 12px;
      color: var(--text);
    }
    button {
      min-height: 44px;
      padding: 0 18px;
      border: 0;
      border-radius: 12px;
      background: var(--brand);
      color: #fff;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
      transition: transform 160ms ease, box-shadow 160ms ease;
    }
    button:hover:not(.ghost) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1); }
    button:hover.ghost { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); }
    .ghost { background: transparent; border: 1px solid var(--line); color: var(--muted); }
    .toolbar { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 16px; }
    .toolbar-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
    .usage-panel { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-top: 16px; }
    .usage-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
    .usage-actions button { min-width: 150px; }
    .admin-list { display: grid; gap: 10px; margin-top: 16px; }
    .admin-item {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 12px;
      align-items: center;
      padding: 13px 14px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: #f8fafc;
      min-width: 0;
    }
    .admin-item span { color: var(--muted); font-size: 13px; }
    .admin-main { display: grid; gap: 4px; min-width: 0; }
    .admin-main strong, .admin-main span { overflow-wrap: anywhere; }
    .admin-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
    .admin-actions button { min-height: 38px; }
    .danger { background: var(--danger); }
    .readonly { color: var(--muted); font-size: 13px; }
    .notice, .error { margin-top: 14px; padding: 12px 14px; border-radius: 12px; line-height: 1.6; }
    .notice { color: var(--ok); background: #effdf6; border: 1px solid rgba(6, 118, 71, 0.16); }
    .error { color: var(--danger); background: #fff4f2; border: 1px solid rgba(217, 45, 32, 0.12); }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 20;
      display: grid;
      place-items: center;
      padding: 18px;
      background: rgba(15, 23, 42, 0.38);
    }
    .modal {
      width: min(440px, 100%);
      max-height: calc(100vh - 36px);
      overflow: auto;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 24px 70px rgba(15, 23, 42, 0.22);
      padding: 18px;
    }
    .modal-head { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 14px; }
    .modal-head h2 { margin: 0; font-size: 20px; }
    .icon-button { width: 40px; min-width: 40px; padding: 0; background: transparent; border: 1px solid var(--line); color: var(--muted); }
    .field-readonly, .stat-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 12px;
      border-radius: 12px;
      background: #f8fafc;
      color: var(--muted);
      line-height: 1.5;
    }
    .field-readonly strong, .stat-row strong { color: var(--text); overflow-wrap: anywhere; text-align: right; }
    .modal-actions { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-top: 4px; }
    .modal-actions button { flex: 1 1 130px; }
    .usage-note { margin-top: 2px; padding: 12px; border-radius: 12px; background: #f8fafc; color: var(--muted); line-height: 1.6; }
    .usage-breakdown { display: grid; gap: 8px; }
    .usage-breakdown h3 { margin: 4px 0 0; font-size: 15px; }
    .archive-clear-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; align-items: center; }
    .archive-clear-row button { min-width: 110px; }
    .ok-text { color: var(--ok); }
    .danger-text { color: var(--danger); }
    .stat-row strong.ok-text { color: var(--ok); }
    .stat-row strong.danger-text { color: var(--danger); }
    @media (max-width: 720px) {
      .hero, .toolbar, .usage-panel { flex-direction: column; align-items: stretch; }
      .toolbar-actions { justify-content: stretch; }
      .toolbar-actions button { flex: 1 1 130px; }
      .usage-actions { justify-content: stretch; }
      .usage-actions button { flex: 1 1 150px; }
      .grid { grid-template-columns: 1fr; }
      input { font-size: 16px; }
      .panel { padding: 16px; border-radius: 14px; }
      .admin-item { grid-template-columns: 1fr; }
      .admin-actions { justify-content: stretch; }
      .admin-actions button { flex: 1 1 120px; }
      .field-readonly, .stat-row { display: grid; gap: 4px; }
      .field-readonly strong, .stat-row strong { text-align: left; }
      .archive-clear-row { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main id="app" class="page">
    <section class="panel">正在加载...</section>
  </main>
  <script>
    const API_PREFIX = ${JSON.stringify(apiPrefix)};
    const state = { authenticated: false, username: "", admins: [], message: "", error: "", modal: null };

    document.addEventListener("DOMContentLoaded", bootstrap);

    async function bootstrap() {
      try {
        const session = await api(API_PREFIX + "/session", {}, false);
        state.authenticated = Boolean(session.authenticated);
        state.username = session.username || "";
        if (state.authenticated) {
          await loadAdmins();
          return;
        }
      } catch (error) {
        console.warn("Unable to restore super admin session:", error);
      }
      renderLogin();
    }

    function renderLogin() {
      document.getElementById("app").innerHTML =
        '<div class="hero"><div><h1>Super Admin</h1><p>Cloudflare Access authentication is required.</p></div></div>' +
        '<section class="panel stack">' +
        '<button id="accessLoginBtn" type="button">Continue with Cloudflare Access</button>' +
        '<div id="feedback"></div></section>';
      document.getElementById("accessLoginBtn").addEventListener("click", () => window.location.reload());
    }

    async function loadAdmins(pinnedItems = []) {
      const response = await api(API_PREFIX + "/admins");
      state.admins = mergeAdminItems(response.items || [], pinnedItems);
      renderManager();
    }

    function mergeAdminItems(items, pinnedItems = []) {
      const map = new Map();
      for (const item of [...items, ...pinnedItems]) {
        if (!item || !item.username) {
          continue;
        }
        map.set(String(item.username).toLowerCase(), item);
      }
      return Array.from(map.values()).sort((left, right) => {
        if (left.source !== right.source) {
          return left.source === "kv" ? 1 : -1;
        }
        return String(left.username || "").localeCompare(String(right.username || ""));
      });
    }

    function renderManager() {
      document.getElementById("app").innerHTML =
        '<div class="hero"><div><h1>超级管理员</h1><p>当前登录账号：<strong>' + esc(state.username) + '</strong></p></div></div>' +
        '<section class="panel toolbar"><div><strong>管理员邮箱</strong><p>新增邮箱会同步到 Cloudflare Access，并立即用于后台登录。</p></div><div class="toolbar-actions"><button class="ghost" id="syncAccessBtn" type="button">Sync Access</button><button class="ghost" id="logoutBtn" type="button">退出</button></div></section>' +
        '<section class="panel stack"><form id="adminForm" class="grid">' +
        '<label><span>管理员邮箱</span><input type="email" name="email" autocomplete="email" required></label>' +
        '<button type="submit">新增管理员</button></form><div id="feedback">' + renderFeedback() + '</div>' +
        '<div class="admin-list">' + renderAdminList() + '</div></section>' +
        '<section class="panel usage-panel"><div><strong>Cloudflare 免费额度</strong><p>R2 和 D1 使用情况按需读取，不影响管理员列表加载。</p></div>' +
        '<div class="usage-actions"><button class="ghost" type="button" data-action="open-r2-usage">R2 使用情况</button><button class="ghost" type="button" data-action="open-d1-usage">D1 使用情况</button><button class="ghost" type="button" data-action="open-archive-storage">封存库清空</button></div></section>' +
        renderModal();
      document.getElementById("adminForm").addEventListener("submit", createAdmin);
      document.getElementById("syncAccessBtn").addEventListener("click", syncAccessPolicy);
      document.getElementById("logoutBtn").addEventListener("click", logout);
      document.querySelectorAll("[data-action='open-edit-admin']").forEach((button) => {
        button.addEventListener("click", () => openEditAdmin(button.dataset.username || ""));
      });
      document.querySelectorAll("[data-action='open-admin-details']").forEach((button) => {
        button.addEventListener("click", () => openAdminDetails(button.dataset.username || ""));
      });
      document.querySelectorAll("[data-action='open-r2-usage']").forEach((button) => {
        button.addEventListener("click", openR2Usage);
      });
      document.querySelectorAll("[data-action='open-d1-usage']").forEach((button) => {
        button.addEventListener("click", openD1Usage);
      });
      document.querySelectorAll("[data-action='open-archive-storage']").forEach((button) => {
        button.addEventListener("click", openArchiveStorage);
      });
      attachModalEvents();
    }

    function renderAdminList() {
      if (!state.admins.length) {
        return '<div class="admin-item"><strong>暂无管理员</strong><span>-</span></div>';
      }
      return state.admins.map(renderAdminItem).join("");
    }

    function renderFeedback() {
      return (state.message ? '<div class="notice">' + esc(state.message) + '</div>' : '') +
        (state.error ? '<div class="error">' + esc(state.error) + '</div>' : '');
    }

    function renderAdminItem(item) {
      const editable = item.editable === true || item.source === "kv";
      const email = item.email || item.username || "";
      const sourceText = item.source === "kv" ? "超级管理员新增" : "密钥配置";
      const limitText = Number(item.maxGeneratedLinks) > 0 ? formatCount(item.maxGeneratedLinks) + " 个" : "不限制";
      const accountText = email && item.username && email !== item.username ? " · 数据账号：" + esc(item.username) : "";
      const meta = sourceText + accountText + " · 新增时间：" + (item.createdAtBeijing ? esc(item.createdAtBeijing) : "未记录") + " · 累计上限：" + esc(limitText);
      const actions = '<div class="admin-actions">' +
        (editable
          ? '<button type="button" data-action="open-edit-admin" data-username="' + esc(item.username) + '">修改</button>'
          : '<span class="readonly">不可修改</span>') +
        '<button class="ghost" type="button" data-action="open-admin-details" data-username="' + esc(item.username) + '">详情</button>' +
        '</div>';
      return '<div class="admin-item"><div class="admin-main"><strong>' + esc(email || item.username) + '</strong><span>' + meta + '</span></div>' + actions + '</div>';
    }

    function renderModal() {
      if (!state.modal) {
        return "";
      }

      const username = esc(state.modal.username || "");
      if (state.modal.type === "edit") {
        const accessMaxGeneratedLinks = Number(state.modal.maxGeneratedLinks) || 0;
        const accessEmail = esc(state.modal.email || state.modal.username || "");
        const canEditEmail = state.modal.source === "kv";
        const dataAccount = state.modal.email && state.modal.username && state.modal.email !== state.modal.username
          ? '<div class="field-readonly"><span>数据账号</span><strong>' + username + '</strong></div>'
          : "";
        return '<div class="modal-backdrop" data-action="close-modal">' +
          '<section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">' +
            '<div class="modal-head"><h2 id="modalTitle">管理员设置</h2><button class="icon-button" type="button" data-action="close-modal" aria-label="关闭">×</button></div>' +
            '<div class="stack">' +
              '<div class="field-readonly"><span>当前绑定邮箱</span><strong>' + accessEmail + '</strong></div>' +
              dataAccount +
              (state.modal.error ? '<div class="error">' + esc(state.modal.error) + '</div>' : '') +
              '<form id="editAdminForm" class="stack" data-username="' + username + '">' +
                '<label><span>绑定邮箱</span><input type="email" name="email" autocomplete="email" value="' + accessEmail + '"' + (canEditEmail ? ' required' : ' disabled') + '></label>' +
                '<label><span>累计生成子链接上限（0 为不限制）</span><input type="number" name="maxGeneratedLinks" min="0" step="1" value="' + esc(accessMaxGeneratedLinks) + '"></label>' +
                '<div class="modal-actions"><button type="submit">保存设置</button><button class="danger" id="deleteAdminBtn" type="button" data-username="' + username + '">删除</button></div>' +
              '</form>' +
            '</div>' +
          '</section>' +
        '</div>';
      }

      if (state.modal.type === "r2Usage") {
        const body = state.modal.loading
          ? '<div class="stat-row"><span>正在统计 R2</span><strong>-</strong></div>'
          : state.modal.error
            ? '<div class="error">' + esc(state.modal.error) + '</div>'
            : renderR2UsageBody(state.modal.item || {});

        return '<div class="modal-backdrop" data-action="close-modal">' +
          '<section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">' +
            '<div class="modal-head"><h2 id="modalTitle">R2 使用情况</h2><button class="icon-button" type="button" data-action="close-modal" aria-label="关闭">×</button></div>' +
            '<div class="stack">' + body + '</div>' +
          '</section>' +
        '</div>';
      }

      if (state.modal.type === "d1Usage") {
        const body = state.modal.loading
          ? '<div class="stat-row"><span>正在统计 D1</span><strong>-</strong></div>'
          : state.modal.error
            ? '<div class="error">' + esc(state.modal.error) + '</div>'
            : renderD1UsageBody(state.modal.item || {});

        return '<div class="modal-backdrop" data-action="close-modal">' +
          '<section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">' +
            '<div class="modal-head"><h2 id="modalTitle">D1 使用情况</h2><button class="icon-button" type="button" data-action="close-modal" aria-label="关闭">×</button></div>' +
            '<div class="stack">' + body + '</div>' +
          '</section>' +
        '</div>';
      }

      if (state.modal.type === "archiveStorage") {
        const body = state.modal.loading
          ? '<div class="stat-row"><span>正在统计封存库</span><strong>-</strong></div>'
          : state.modal.error
            ? '<div class="error">' + esc(state.modal.error) + '</div>'
            : renderArchiveStorageBody(state.modal.items || []);

        return '<div class="modal-backdrop" data-action="close-modal">' +
          '<section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">' +
            '<div class="modal-head"><h2 id="modalTitle">R2 封存库清空</h2><button class="icon-button" type="button" data-action="close-modal" aria-label="关闭">×</button></div>' +
            '<div class="stack">' + body + '</div>' +
          '</section>' +
        '</div>';
      }

      const detail = state.modal.detail || {};
      const body = state.modal.loading
        ? '<div class="stat-row"><span>正在加载</span><strong>-</strong></div>'
        : state.modal.error
          ? '<div class="error">' + esc(state.modal.error) + '</div>'
          : '<div class="stat-row"><span>账号名</span><strong>' + username + '</strong></div>' +
            '<div class="stat-row"><span>绑定邮箱</span><strong>' + esc(detail.email || username) + '</strong></div>' +
            '<div class="stat-row"><span>历史生成过的链接</span><strong>' + esc(formatCount(detail.historicalLinkCount)) + '</strong></div>' +
            '<div class="stat-row"><span>累计生成上限</span><strong>' + esc(formatLimit(detail.maxGeneratedLinks)) + '</strong></div>' +
            '<div class="stat-row"><span>剩余可生成</span><strong>' + esc(detail.remainingLinkCount === null ? "不限制" : formatCount(detail.remainingLinkCount)) + '</strong></div>' +
            '<div class="stat-row"><span>目前存在的链接</span><strong>' + esc(formatCount(detail.currentLinkCount)) + '</strong></div>' +
            '<div class="stat-row"><span>最后登录北京时间</span><strong>' + esc(detail.lastLoginAtBeijing || "暂无记录") + '</strong></div>';

      return '<div class="modal-backdrop" data-action="close-modal">' +
        '<section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">' +
          '<div class="modal-head"><h2 id="modalTitle">管理员详情</h2><button class="icon-button" type="button" data-action="close-modal" aria-label="关闭">×</button></div>' +
          '<div class="stack">' + body + '</div>' +
        '</section>' +
      '</div>';
    }

    function renderR2UsageBody(item) {
      const percent = formatPercent(item.storageUsedPercent);
      const statusText = item.storageWithinFreeTier ? "当前存储未超免费额度" : "当前存储已超过免费额度";
      const statusClass = item.storageWithinFreeTier ? "ok-text" : "danger-text";
      const groups = Array.isArray(item.groups) && item.groups.length
        ? '<div class="usage-breakdown"><h3>对象分布</h3>' + item.groups.map((group) =>
            '<div class="stat-row"><span>' + esc(group.label || group.key || "-") + '</span><strong>' +
            esc(formatCount(group.objectCount)) + ' 个（' + esc(formatPercent(group.objectPercent)) + '） / ' +
            esc(formatBytes(group.totalSizeBytes)) + '（' + esc(formatPercent(group.storagePercent)) + '）</strong></div>'
          ).join("") + '</div>'
        : "";
      const nonStandard = Number(item.nonStandardObjectCount) || 0;

      return '<div class="stat-row"><span>Bucket</span><strong>' + esc(item.bucketName || "-") + '</strong></div>' +
        '<div class="stat-row"><span>当前对象数</span><strong>' + esc(formatCount(item.objectCount)) + '</strong></div>' +
        '<div class="stat-row"><span>当前存储容量</span><strong>' + esc(formatBytes(item.totalSizeBytes)) + '</strong></div>' +
        '<div class="stat-row"><span>免费存储额度</span><strong>' + esc(formatBytes(item.storageFreeBytes)) + ' / 月</strong></div>' +
        '<div class="stat-row"><span>存储占比</span><strong>' + esc(percent) + '</strong></div>' +
        '<div class="stat-row"><span>本次统计消耗</span><strong>' + esc(formatCount(item.listRequests)) + ' 次 Class A ListObjects（免费月额 ' + esc(formatPercent(item.listRequestsUsedPercent)) + '）</strong></div>' +
        '<div class="stat-row"><span>免费操作额度</span><strong>A ' + esc(formatCount(item.classAFreeMonthly)) + ' / 月，B ' + esc(formatCount(item.classBFreeMonthly)) + ' / 月</strong></div>' +
        (nonStandard ? '<div class="stat-row"><span>非 Standard 对象</span><strong class="danger-text">' + esc(formatCount(nonStandard)) + '</strong></div>' : '') +
        '<div class="stat-row"><span>结论</span><strong class="' + statusClass + '">' + statusText + '</strong></div>' +
        groups +
        '<p class="usage-note">这里通过 R2 绑定统计当前对象容量；R2 月度 Class A/B 请求量属于账号级账单指标，请以 Cloudflare 仪表盘为准。</p>';
    }

    function renderD1UsageBody(item) {
      const percent = formatPercent(item.storageUsedPercent);
      const statusText = item.storageWithinFreeTier ? "当前存储未超免费额度" : "当前存储已超过免费额度";
      const statusClass = item.storageWithinFreeTier ? "ok-text" : "danger-text";
      const tables = Array.isArray(item.tables) && item.tables.length
        ? '<div class="usage-breakdown"><h3>表行数</h3>' + item.tables.map((table) =>
            '<div class="stat-row"><span>' + esc(table.name || "-") + '</span><strong>' + esc(formatCount(table.rowCount)) + ' 行（' + esc(formatPercent(table.rowPercent)) + '）</strong></div>'
          ).join("") + '</div>'
        : "";

      return '<div class="stat-row"><span>数据库</span><strong>' + esc(item.databaseName || "-") + '</strong></div>' +
        '<div class="stat-row"><span>当前数据库大小</span><strong>' + esc(formatBytes(item.sizeAfterBytes)) + '</strong></div>' +
        '<div class="stat-row"><span>免费存储额度</span><strong>' + esc(formatBytes(item.storageFreeBytes)) + '</strong></div>' +
        '<div class="stat-row"><span>存储占比</span><strong>' + esc(percent) + '</strong></div>' +
        '<div class="stat-row"><span>总行数</span><strong>' + esc(formatCount(item.totalRows)) + '</strong></div>' +
        '<div class="stat-row"><span>免费读写额度</span><strong>读 ' + esc(formatCount(item.rowReadsFreeDaily)) + ' / 日，写 ' + esc(formatCount(item.rowWritesFreeDaily)) + ' / 日</strong></div>' +
        '<div class="stat-row"><span>本次统计读取</span><strong>' + esc(formatCount(item.rowsReadForThisCheck)) + ' 行（免费日额 ' + esc(formatPercent(item.rowsReadUsedPercent)) + '）</strong></div>' +
        '<div class="stat-row"><span>本次统计写入</span><strong>' + esc(formatCount(item.rowsWrittenForThisCheck)) + ' 行（免费日额 ' + esc(formatPercent(item.rowsWrittenUsedPercent)) + '）</strong></div>' +
        '<div class="stat-row"><span>结论</span><strong class="' + statusClass + '">' + statusText + '</strong></div>' +
        tables +
        '<p class="usage-note">这里显示当前数据库大小和表行数；D1 当日 rows read / rows written 是账号级统计，请以 Cloudflare 仪表盘 Metrics > Row Metrics 为准。</p>';
    }

    function renderArchiveStorageBody(items) {
      const rows = Array.isArray(items) && items.length
        ? items.map((item) => {
            const disabled = !Number(item.archiveRecordCount) && !Number(item.imageCount);
            const clearing = state.modal && state.modal.clearingUsername === item.username;
            return '<div class="stat-row archive-clear-row"><span><strong>' + esc(item.username || "-") + '</strong><br>' +
              '封存链接 ' + esc(formatCount(item.archiveRecordCount)) + ' 个，图片 ' + esc(formatCount(item.imageCount)) +
              ' 张，占用 ' + esc(formatBytes(item.totalSizeBytes)) + '</span>' +
              '<button class="danger" type="button" data-action="clear-archive-storage" data-username="' + esc(item.username || "") + '"' +
              (disabled || clearing ? ' disabled' : '') + '>' + (clearing ? '清空中...' : '一键清空') + '</button></div>';
          }).join("")
        : '<div class="stat-row"><span>暂无管理员封存库</span><strong>-</strong></div>';

      return rows + '<p class="usage-note">只清空所选管理员的封存库记录及其未被其他链接引用的 R2 图片，不影响其他管理员。</p>';
    }

    function attachModalEvents() {
      const backdrop = document.querySelector(".modal-backdrop");
      if (backdrop) {
        backdrop.addEventListener("click", (event) => {
          if (event.target === backdrop) {
            closeModal();
          }
        });
      }

      document.querySelectorAll("button[data-action='close-modal']").forEach((element) => {
        element.addEventListener("click", (event) => {
          event.preventDefault();
          closeModal();
        });
      });

      const editForm = document.getElementById("editAdminForm");
      if (editForm) {
        editForm.addEventListener("submit", updateAdminSettings);
      }

      const deleteButton = document.getElementById("deleteAdminBtn");
      if (deleteButton) {
        deleteButton.addEventListener("click", () => deleteAdmin(deleteButton.dataset.username || ""));
      }

      document.querySelectorAll("[data-action='clear-archive-storage']").forEach((button) => {
        button.addEventListener("click", () => clearArchiveStorage(button.dataset.username || ""));
      });
    }

    function openEditAdmin(username) {
      if (!username) {
        return;
      }

      const admin = state.admins.find((item) => item.username === username) || {};
      state.modal = {
        type: "edit",
        username,
        email: admin.email || username,
        source: admin.source || "",
        maxGeneratedLinks: Number(admin.maxGeneratedLinks) || 0
      };
      state.message = "";
      state.error = "";
      renderManager();
    }

    async function openAdminDetails(username) {
      if (!username) {
        return;
      }

      state.modal = { type: "details", username, loading: true, detail: null, error: "" };
      renderManager();
      try {
        const response = await api(API_PREFIX + "/admins/" + encodeURIComponent(username) + "/details");
        if (!state.modal || state.modal.type !== "details" || state.modal.username !== username) {
          return;
        }
        state.modal = { type: "details", username, loading: false, detail: response.item || {}, error: "" };
      } catch (error) {
        if (!state.modal || state.modal.type !== "details" || state.modal.username !== username) {
          return;
        }
        state.modal = { type: "details", username, loading: false, detail: null, error: error.message };
      }
      renderManager();
    }

    async function openR2Usage() {
      state.modal = { type: "r2Usage", loading: true, item: null, error: "" };
      renderManager();
      try {
        const response = await api(API_PREFIX + "/usage/r2");
        if (!state.modal || state.modal.type !== "r2Usage") {
          return;
        }
        state.modal = { type: "r2Usage", loading: false, item: response.item || {}, error: "" };
      } catch (error) {
        if (!state.modal || state.modal.type !== "r2Usage") {
          return;
        }
        state.modal = { type: "r2Usage", loading: false, item: null, error: error.message };
      }
      renderManager();
    }

    async function openD1Usage() {
      state.modal = { type: "d1Usage", loading: true, item: null, error: "" };
      renderManager();
      try {
        const response = await api(API_PREFIX + "/usage/d1");
        if (!state.modal || state.modal.type !== "d1Usage") {
          return;
        }
        state.modal = { type: "d1Usage", loading: false, item: response.item || {}, error: "" };
      } catch (error) {
        if (!state.modal || state.modal.type !== "d1Usage") {
          return;
        }
        state.modal = { type: "d1Usage", loading: false, item: null, error: error.message };
      }
      renderManager();
    }

    async function openArchiveStorage() {
      state.modal = { type: "archiveStorage", loading: true, items: [], error: "", clearingUsername: "" };
      renderManager();
      try {
        const response = await api(API_PREFIX + "/archive-storage");
        if (!state.modal || state.modal.type !== "archiveStorage") {
          return;
        }
        state.modal = { type: "archiveStorage", loading: false, items: response.items || [], error: "", clearingUsername: "" };
      } catch (error) {
        if (!state.modal || state.modal.type !== "archiveStorage") {
          return;
        }
        state.modal = { type: "archiveStorage", loading: false, items: [], error: error.message, clearingUsername: "" };
      }
      renderManager();
    }

    async function clearArchiveStorage(username) {
      if (!username || !window.confirm("确认清空管理员 " + username + " 的封存库吗？此操作不可恢复。")) {
        return;
      }

      if (!state.modal || state.modal.type !== "archiveStorage") {
        return;
      }

      state.modal.clearingUsername = username;
      renderManager();
      try {
        await api(API_PREFIX + "/archive-storage/clear", {
          method: "POST",
          body: { username }
        });
        const response = await api(API_PREFIX + "/archive-storage");
        if (!state.modal || state.modal.type !== "archiveStorage") {
          return;
        }
        state.modal = { type: "archiveStorage", loading: false, items: response.items || [], error: "", clearingUsername: "" };
        state.message = "封存库已清空。";
      } catch (error) {
        if (state.modal && state.modal.type === "archiveStorage") {
          state.modal.error = error.message;
          state.modal.clearingUsername = "";
        }
      }
      renderManager();
    }

    function closeModal() {
      state.modal = null;
      renderManager();
    }

    function formatCount(value) {
      const number = Number(value);
      return Number.isFinite(number) ? Math.round(number).toLocaleString("zh-CN") : "0";
    }

    function formatBytes(value) {
      let number = Number(value);
      if (!Number.isFinite(number) || number <= 0) {
        return "0 B";
      }

      const units = ["B", "KB", "MB", "GB", "TB"];
      let unitIndex = 0;
      while (number >= 1000 && unitIndex < units.length - 1) {
        number /= 1000;
        unitIndex += 1;
      }

      const digits = number >= 100 ? 0 : number >= 10 ? 1 : 2;
      return number.toFixed(digits).replace(/\\.0+$/, "").replace(/(\\.\\d*[1-9])0+$/, "$1") + " " + units[unitIndex];
    }

    function formatPercent(value) {
      const number = Number(value);
      return Number.isFinite(number) ? number.toFixed(2).replace(/\\.00$/, "") + "%" : "0%";
    }

    function formatLimit(value) {
      const number = Number(value) || 0;
      return number > 0 ? formatCount(number) + " 个" : "不限制";
    }

    async function syncAccessPolicy() {
      try {
        await api(API_PREFIX + "/admins/sync-access", { method: "POST" });
        state.message = "Cloudflare Access policy has been synced.";
        state.error = "";
        await loadAdmins();
      } catch (error) {
        state.message = "";
        state.error = error.message;
        renderManager();
      }
    }

    async function createAdmin(event) {
      event.preventDefault();
      const formElement = event.currentTarget;
      const form = new FormData(formElement);
      try {
        const response = await api(API_PREFIX + "/admins", {
          method: "POST",
          body: {
            email: String(form.get("email") || "").trim()
          }
        });
        state.admins = mergeAdminItems(state.admins, [response.item]);
        state.message = "管理员已新增。";
        state.error = "";
        formElement.reset();
        renderManager();
        await loadAdmins([response.item]);
      } catch (error) {
        state.message = "";
        state.error = error.message;
        renderManager();
      }
    }

    async function updateAdminSettings(event) {
      event.preventDefault();
      const formElement = event.currentTarget;
      const username = formElement.dataset.username || "";
      const form = new FormData(formElement);
      try {
        const body = {
          maxGeneratedLinks: Number(form.get("maxGeneratedLinks") || 0)
        };
        const emailInput = formElement.elements.email;
        if (emailInput && !emailInput.disabled) {
          body.email = String(form.get("email") || "").trim();
        }
        const response = await api(API_PREFIX + "/admins/" + encodeURIComponent(username), {
          method: "PUT",
          body
        });
        state.admins = mergeAdminItems(
          state.admins.filter((item) => item.username !== username),
          [response.item]
        );
        state.message = "管理员设置已保存。";
        state.error = "";
        state.modal = null;
        formElement.reset();
        renderManager();
        await loadAdmins([response.item]);
      } catch (error) {
        state.message = "";
        state.error = "";
        if (state.modal && state.modal.type === "edit") {
          state.modal.error = error.message;
        } else {
          state.error = error.message;
        }
        renderManager();
      }
    }

    async function deleteAdmin(username) {
      if (!username || !window.confirm("确认删除管理员 " + username + " 吗？")) {
        return;
      }

      try {
        await api(API_PREFIX + "/admins/" + encodeURIComponent(username), { method: "DELETE" });
        state.admins = state.admins.filter((item) => item.username !== username);
        state.message = "管理员已删除。";
        state.error = "";
        state.modal = null;
        renderManager();
      } catch (error) {
        state.message = "";
        state.error = "";
        if (state.modal && state.modal.type === "edit") {
          state.modal.error = error.message;
        } else {
          state.error = error.message;
        }
        renderManager();
      }
    }

    async function logout() {
      await api(API_PREFIX + "/logout", { method: "POST" }, false);
      window.location.href = "/cdn-cgi/access/logout";
    }

    async function api(url, options = {}, throwOnUnauthorized = true) {
      const response = await fetch(url, {
        method: options.method || "GET",
        credentials: "same-origin",
        headers: options.body
          ? { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" }
          : { "X-Requested-With": "XMLHttpRequest" },
        body: options.body ? JSON.stringify(options.body) : undefined
      });
      const payload = await response.json().catch(() => ({ ok: false, message: "请求失败。" }));
      if (!response.ok) {
        if (response.status === 401 && throwOnUnauthorized) {
          state.authenticated = false;
          renderLogin();
        }
        throw new Error(payload.message || "请求失败。");
      }
      return payload;
    }

    function esc(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    }
  </script>
  <script src="/admin-update.js"></script>
</body>
</html>`;
}

# leave-status-open-source

这是一个基于 Cloudflare Workers 的请假状态分享系统开源脱敏版。项目包含管理后台、公开分享页、附件上传、链接回收站、封存库和超级管理员管理功能。

## 技术栈

- Cloudflare Workers
- Workers Assets
- Workers KV
- Cloudflare R2
- Cloudflare D1
- Cloudflare Access

## 主要功能

- 管理员通过 Cloudflare Access 登录后台。
- 创建、编辑、销毁请假状态分享链接。
- 支持请假附件和销假附件上传到 R2。
- 使用 KV 保存完整业务数据，D1 提供后台列表、统计和索引查询。
- 超级管理员可维护管理员邮箱、链接数量上限，并查看 R2/D1 使用情况。
- 公开分享页无需 Access 登录即可访问。

## 部署

完整部署步骤请阅读 [部署指南.docx](./部署指南.docx)。

部署前至少需要修改：

- `wrangler.toml` 中的 KV、R2、D1、Cloudflare Access 和路由配置。
- `src/constants.js` 中的根域名、默认子域名、附件公开 URL 和 CSP。
- `public/login.js`、`public/linkhistory.js` 中显示给用户看的入口域名。
- `src/default-config.js` 和 `public/wec-counselor-leave-apps/leave/share/config.js` 中的默认模板数据。

## 安全说明

本仓库是脱敏副本，配置文件中保留的是示例域名和占位符。不要把以下内容提交到公开仓库：

- Cloudflare API Token
- 真实 KV/D1/R2 资源 ID
- 真实 Access Application ID、Policy ID、AUD
- 真实邮箱、姓名、学号、地址等个人信息
- `.wrangler/`、`.env`、`.dev.vars`、日志文件

## 本地命令

```bash
npm install
npx wrangler deploy
```

首次部署前请先按部署指南创建并绑定 Cloudflare KV、R2、D1 和 Access 应用。

## 许可证

当前仓库尚未附带开源许可证。如需明确允许他人复制、修改或分发，请额外添加 `LICENSE` 文件。

// 注册 Service Worker 并处理更新弹窗
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/admin-sw.js').catch((error) => {
      console.error('ServiceWorker 注册失败:', error);
    });
  });

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
      showUpdateModal();
    }
  });
}

function showUpdateModal() {
  // 避免重复弹窗
  if (document.getElementById('admin-update-modal')) {
    return;
  }

  const backdrop = document.createElement('div');
  backdrop.id = 'admin-update-modal';
  backdrop.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(15, 23, 42, 0.4);
    -webkit-backdrop-filter: blur(4px);
    backdrop-filter: blur(4px);
    font-family: system-ui, -apple-system, sans-serif;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background: #fff;
    padding: 24px;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    width: min(320px, 90%);
    text-align: center;
    animation: fadeInScale 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInScale {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .update-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 44px;
      margin-top: 20px;
      border: none;
      border-radius: 12px;
      background: #0f172a;
      color: #fff;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .update-btn:hover { opacity: 0.9; }
  `;

  const title = document.createElement('h3');
  title.textContent = '发现新版本';
  title.style.cssText = 'margin: 0 0 8px 0; font-size: 18px; color: #0f172a; font-weight: 600;';

  const desc = document.createElement('p');
  desc.textContent = '后台系统数据或界面已更新，请刷新以加载最新版本。';
  desc.style.cssText = 'margin: 0; font-size: 14px; color: #64748b; line-height: 1.5;';

  const btn = document.createElement('button');
  btn.textContent = '立即刷新';
  btn.className = 'update-btn';
  btn.onclick = () => {
    window.location.reload();
  };

  modal.appendChild(style);
  modal.appendChild(title);
  modal.appendChild(desc);
  modal.appendChild(btn);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
}

<template>
  <div class="global-footer">
    <div class="footer-links">
      <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
      <span class="divider">|</span>
      <a href="#">使用指南</a>
      <span class="divider">|</span>
      <a href="#">更新日志</a>
    </div>
    <div class="copyright">© 2026 ZeroStack. Created by nijika. All Rights Reserved.</div>
  </div>
</template>

<style scoped>
.global-footer {
  padding: 24px 16px;
  text-align: center;
  background: #f0f2f5;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}

.footer-links {
  margin-bottom: 8px;
}

.footer-links a {
  color: rgba(0, 0, 0, 0.45);
  transition: color 0.3s;
  text-decoration: none;
}

.footer-links a:hover {
  color: #1890ff;
}

.divider {
  margin: 0 12px;
  color: rgba(0, 0, 0, 0.15);
}

.copyright {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
}
</style>

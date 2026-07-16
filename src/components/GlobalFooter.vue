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
  padding: 32px 16px;
  text-align: center;
  background: transparent;
  color: #5f6368;
  font-size: 14px;
}

.footer-links {
  margin-bottom: 12px;
}

.footer-links a {
  color: #5f6368;
  transition: color 0.3s;
  text-decoration: none;
}

.footer-links a:hover {
  color: #1a73e8;
}

.divider {
  margin: 0 16px;
  color: #e0e0e0;
}

.copyright {
  font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
  font-size: 13px;
  color: #8c8c8c;
}
</style>

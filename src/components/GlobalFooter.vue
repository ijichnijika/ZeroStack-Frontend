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
  color: #64748b;
  font-size: 14px;
}

.footer-links {
  margin-bottom: 8px;
}

.footer-links a {
  color: #64748b;
  transition: color 0.2s ease;
  text-decoration: none;
}

.footer-links a:hover {
  color: #4f46e5;
}

.divider {
  margin: 0 16px;
  color: #e2e8f0;
}

.copyright {
  font-family: inherit;
  font-size: 13px;
  color: #94a3b8;
}
</style>

/**
 * WQ Blog Theme - 暗色模式切换 & 侧边栏控制
 */

(function() {
    'use strict';

    // === 暗色模式 ===
    const themeToggles = document.querySelectorAll('.theme-toggle');
    const icons = [];

    function getTheme() {
        const stored = localStorage.getItem('theme');
        return stored || 'dark';
    }

    function setTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            icons.forEach(function(icon) {
                if (icon) icon.className = 'fas fa-sun';
            });
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            icons.forEach(function(icon) {
                if (icon) icon.className = 'fas fa-moon';
            });
        }
        localStorage.setItem('theme', theme);
    }

    function toggleTheme() {
        var current = document.documentElement.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'light' : 'dark');
    }

    // 收集所有主题切换图标
    themeToggles.forEach(function(btn) {
        var icon = btn.querySelector('i');
        if (icon) icons.push(icon);
        btn.addEventListener('click', toggleTheme);
    });

    setTheme(getTheme());

    // === 侧边栏控制 ===
    var sidebar = document.getElementById('sidebar');
    var hamburger = document.getElementById('hamburger');
    var sidebarClose = document.getElementById('sidebarClose');
    var overlay = document.getElementById('sidebarOverlay');

    function openSidebar() {
        if (sidebar) sidebar.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (hamburger) {
        hamburger.addEventListener('click', openSidebar);
    }

    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeSidebar);
    }

    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }

    // 点击侧边栏链接后关闭
    if (sidebar) {
        sidebar.querySelectorAll('.sidebar-link, .sidebar-tag, .sidebar-tag-item, .sidebar-social-link').forEach(function(link) {
            link.addEventListener('click', function() {
                // 只在移动端关闭
                if (window.innerWidth <= 1024) {
                    closeSidebar();
                }
            });
        });
    }

})();

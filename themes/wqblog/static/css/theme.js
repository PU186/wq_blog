/**
 * WQ Blog Theme - 暗色模式切换 & 侧边栏控制
 */

(function() {
    'use strict';

    // === 暗色模式 ===
    var themeToggles = document.querySelectorAll('.theme-toggle, #fixedThemeToggle');
    var icons = [];

    function getTheme() {
        var stored = localStorage.getItem('theme');
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
    var sidebarToggle = document.getElementById('sidebarToggle');
    var overlay = document.getElementById('sidebarOverlay');
    var isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';

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

    // 侧边栏折叠/展开（桌面端）
    function toggleCollapse() {
        if (!sidebar) return;
        if (window.innerWidth > 1024) {
            sidebar.classList.toggle('collapsed');
            isCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('sidebarCollapsed', isCollapsed);
            // 更新图标
            var icon = sidebarToggle ? sidebarToggle.querySelector('i') : null;
            if (icon) {
                icon.className = isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
            }
        }
    }

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleCollapse);
    }

    // 恢复侧边栏折叠状态
    if (sidebar && isCollapsed && window.innerWidth > 1024) {
        sidebar.classList.add('collapsed');
        var icon = sidebarToggle ? sidebarToggle.querySelector('i') : null;
        if (icon) icon.className = 'fas fa-chevron-right';
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
                if (window.innerWidth <= 1024) {
                    closeSidebar();
                }
            });
        });
    }

    // === 文章目录 (TOC) 自动生成 ===
    var tocContainer = document.querySelector('.article-toc');
    var articleContent = document.querySelector('.article-content');

    if (tocContainer && articleContent) {
        var tocList = document.createElement('ul');
        tocList.className = 'toc';
        var headings = articleContent.querySelectorAll('h2, h3');
        var tocItems = [];

        headings.forEach(function(heading, index) {
            if (!heading.id) {
                heading.id = 'toc-' + index;
            }
            var level = heading.tagName.toLowerCase();
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.href = '#' + heading.id;
            a.textContent = heading.textContent;
            li.appendChild(a);

            if (level === 'h2') {
                li.style.marginTop = '4px';
            } else {
                li.style.paddingLeft = '20px';
                li.style.fontSize = '0.9em';
            }

            tocItems.push(li);
        });

        if (tocItems.length > 0) {
            tocItems.forEach(function(item) {
                tocList.appendChild(item);
            });
            tocContainer.appendChild(tocList);
        } else {
            tocContainer.style.display = 'none';
        }
    }

    // 窗口变化时自动调整
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 1024) {
            if (sidebar) sidebar.classList.remove('collapsed');
        } else {
            var saved = localStorage.getItem('sidebarCollapsed') === 'true';
            if (sidebar) {
                if (saved) {
                    sidebar.classList.add('collapsed');
                } else {
                    sidebar.classList.remove('collapsed');
                }
            }
        }
    });

})();

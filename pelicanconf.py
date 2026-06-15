# -*- coding: utf-8 -*-
"""Pelican 博客主配置文件"""

AUTHOR = '王前'
SITENAME = "王前的博客"
SITEURL = ''
RELATIVE_URLS = True

SITETITLE = "王前的博客"
SITESUBTITLE = '记录学习与成长'
SITEDESCRIPTION = '王前的个人博客，分享技术、生活与思考'
SITELOGO = 'https://github.com/PU186.png'
# 使用 GitHub 头像作为博客头像

PATH = 'content'
THEME = 'themes/wqblog'
OUTPUT_PATH = 'output'

TIMEZONE = 'Asia/Shanghai'
DEFAULT_LANG = 'zh'
LOCALE = ('zh_CN', 'zh', 'en_US')

# Feed 生成
FEED_ALL_ATOM = 'feeds/all.atom.xml'
CATEGORY_FEED_ATOM = 'feeds/{slug}.atom.xml'
TRANSLATION_FEED_ATOM = None
AUTHOR_FEED_ATOM = None
AUTHOR_FEED_RSS = None

# 博客设置
DEFAULT_PAGINATION = 10
DEFAULT_CATEGORY = '未分类'
USE_FOLDER_AS_CATEGORY = False

# 文章 URL 设置
ARTICLE_URL = 'posts/{date:%Y}/{date:%m}/{slug}/'
ARTICLE_SAVE_AS = 'posts/{date:%Y}/{date:%m}/{slug}/index.html'
PAGE_URL = '{slug}/'
PAGE_SAVE_AS = '{slug}/index.html'
CATEGORY_URL = 'category/{slug}/'
CATEGORY_SAVE_AS = 'category/{slug}/index.html'
TAG_URL = 'tag/{slug}/'
TAG_SAVE_AS = 'tag/{slug}/index.html'
TAGS_URL = 'tags/'
TAGS_SAVE_AS = 'tags/index.html'
ARCHIVES_URL = 'archives/'
ARCHIVES_SAVE_AS = 'archives/index.html'

# 静态文件
STATIC_PATHS = ['images', 'extra']
EXTRA_PATH_METADATA = {
    'extra/robots.txt': {'path': 'robots.txt'},
    'extra/favicon.ico': {'path': 'favicon.ico'},
}

# 文章摘要
SUMMARY_MAX_LENGTH = 50

# 社交链接
SOCIAL = (
    ('GitHub', 'https://github.com/PU186'),
    ('Email', 'mailto:25b901072@stu.hit.edu.cn'),
    ('ORCID', 'https://orcid.org/0009-0003-1228-1989'),
)

# 页脚信息
COPYRIGHT_YEAR = 2026
COPYRIGHT_NAME = '王前'

# 导航菜单
MENUITEMS = (
    ('首页', '/'),
    ('归档', '/archives/'),
    ('标签', '/tags/'),
    ('关于', '/about/'),
    ('简历', 'https://resume.wangqianhit.me/'),
)

# 插件
PLUGINS = ['sitemap', 'related_posts']

# Sitemap 插件配置
SITEMAP = {
    'format': 'xml',
    'priorities': {
        'articles': 0.8,
        'indexes': 0.5,
        'pages': 0.6,
    },
    'changefreqs': {
        'articles': 'monthly',
        'indexes': 'daily',
        'pages': 'monthly',
    },
}

# Related Posts 插件配置
RELATED_POSTS_MAX = 5

# Markdown 扩展
MARKDOWN = {
    'extension_configs': {
        'markdown.extensions.codehilite': {
            'css_class': 'highlight',
            'linenums': True,
        },
        'markdown.extensions.extra': {},
        'markdown.extensions.meta': {},
        'markdown.extensions.toc': {
            'permalink': '🔗',
        },
        'markdown.extensions.admonition': {},
    },
    'output_format': 'html5',
}

# 主题配置
THEME_CONFIG = {
    'show_article_author': True,
    'show_article_category': True,
    'show_article_tags': True,
    'show_article_date': True,
    'default_dark_mode': True,
    'site_description': SITEDESCRIPTION,
}

# 王前的博客 - blog.wangqianhit.me

个人博客，使用 [Pelican](https://getpelican.com/) 静态网站生成器构建，托管在 [Cloudflare Pages](https://pages.cloudflare.com/)。

## 🚀 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 本地预览

```bash
# 生成并启动本地服务
pelican content -l -r
```

打开浏览器访问 `http://localhost:8000` 即可预览。

### 3. 新建文章

在 `content/articles/` 目录下创建 `.md` 文件，文件头部格式：

```markdown
---
title: 文章标题
date: 2026-06-15
category: 分类名
tags: 标签1, 标签2
slug: article-url
summary: 文章摘要
---

这里是文章内容...
```

## ☁️ 部署到 Cloudflare Pages

### 第一步：上传到 GitHub

```bash
# 1. 创建 GitHub 仓库（在 GitHub 网页上操作）
#    仓库名可以是 wq-blog 或 wangqianhit.me

# 2. 关联并推送
git remote add origin git@github.com:PU186/wq_blog.git
git branch -M main
git push -u origin main
```

### 第二步：在 Cloudflare Pages 中配置

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Pages** → **创建项目** → **连接到 Git**
3. 授权 GitHub，选择你的博客仓库
4. 在 **构建设置** 中配置：

| 配置项 | 值 |
|--------|-----|
| 框架预设 | **None** |
| 构建命令 | `pip install -r requirements.txt && pelican content -s publishconf.py -o output` |
| 构建输出目录 | `output` |
| 环境变量 | `PYTHON_VERSION=3.11` |

5. 点击 **保存并部署**

### 第三步：绑定自定义域名

1. 在 Cloudflare Pages 的项目页面 → **自定义域**
2. 添加域名 `wangqianhit.me`
3. Cloudflare 会自动添加 DNS 记录

### 自动部署

之后每次 `git push` 到 GitHub 仓库，Cloudflare Pages 会自动构建和部署！

## 📝 写文章工作流

```bash
# 1. 新建文章
在 content/articles/ 下创建 .md 文件

# 2. 本地预览
pelican content -l -r

# 3. 满意后提交
git add .
git commit -m "新文章：xxx"
git push
```

## 📄 Word 文档转 Markdown

推荐使用以下工具将 Word 文档转为 Markdown：

### 方法一：Pandoc（推荐）

```bash
# 安装 Pandoc
# 下载地址：https://pandoc.org/installing.html

# 转换命令
pandoc 文档.docx -o 文档.md -t markdown --wrap=none
```

### 方法二：python-docx2md

```bash
pip install python-docx2md
python -m docx2md 文档.docx 文档.md
```

### 方法三：在线工具

- [CloudConvert](https://cloudconvert.com/docx-to-md)
- [Convertio](https://convertio.co/zh/docx-md/)

## � 许可协议

本博客内容采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 许可协议。
转载请注明出处。

## �📁 项目结构

```
WQ_Blog/
├── content/           # 博客内容
│   ├── articles/      # 文章 (.md)
│   ├── pages/         # 页面 (关于等)
│   ├── images/        # 图片资源
│   └── extra/         # 额外文件
├── themes/
│   └── wqblog/        # 自定义暗色主题
├── pelicanconf.py     # 开发配置
├── publishconf.py     # 生产配置
└── requirements.txt   # Python 依赖
```

## 🎨 特性

- ✅ 暗色模式（默认）/ 亮色模式切换
- ✅ Markdown 写作
- ✅ 标签分类
- ✅ 文章归档
- ✅ RSS 订阅
- ✅ 响应式设计（手机/平板/电脑）
- ✅ Cloudflare CDN 加速
- ✅ 自动 HTTPS

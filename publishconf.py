# -*- coding: utf-8 -*-
"""发布配置 - 用于 Cloudflare Pages 生产构建"""

import os
import sys
sys.path.append(os.path.dirname(__file__))
from pelicanconf import *

# 生产环境设置
SITEURL = 'https://blog.wangqianhit.me'
RELATIVE_URLS = False

# 生产环境 Feed 全部开启
FEED_ALL_ATOM = 'feeds/all.atom.xml'
CATEGORY_FEED_ATOM = 'feeds/%s.atom.xml'

# 删除输出目录，确保干净构建
DELETE_OUTPUT_DIRECTORY = True

# 生产环境优化
USE_CDN = True

# 搜索优化
WITH_FUTURE_DATE = False

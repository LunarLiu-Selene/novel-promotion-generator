#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Vercel Serverless 入口文件
将Flask应用适配为Vercel Serverless函数
"""

import sys
import os
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# 导入Flask应用
from app import app

# Vercel需要的handler函数
def handler(request, context):
    """Vercel Serverless函数处理器"""
    return app(request.environ, lambda status, headers: None)

# 如果直接运行此文件，启动开发服务器
if __name__ == "__main__":
    app.run(debug=True)

# 导出app供Vercel使用
app = app
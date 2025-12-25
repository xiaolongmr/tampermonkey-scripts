#!/usr/bin/env python3
# -*- coding: utf-8 -*-

file_path = r'g:\桌面\坚果云相册\油猴脚本\花瓣去水印\花瓣去水印.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 找到最后一个})();
last_pos = content.rfind('})();')
if last_pos > 0:
    new_content = content[:last_pos + 4]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('已清理孤立代码')
    print(f'新文件行数: {new_content.count(chr(10)) + 1}')
else:
    print('未找到})();')

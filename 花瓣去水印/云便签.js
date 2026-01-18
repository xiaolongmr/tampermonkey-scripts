// ==UserScript==
// @name         webnote.cc 插入教程链接
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  向webnote.cc/p/页面的class="grid-x grid margin-x"的div最前面插入指定链接
// @author       自定义
// @match        https://webnote.cc/p/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 目标DOM的class名（精准匹配你指定的）
    const targetClass = 'grid-x grid margin-x';
    // 要插入的a标签完整代码（完全复用你给的样式+内容，无修改）
    // 可点击的版本（点击后跳转，样式不变）
    const insertHtml = `<a href="https://wx.z-l.top/qrcode.png" target="_blank" style="padding: 10px 0px;">不会更新脚本，公众号【爱吃馍】私信我</a>`;

    // 封装防抖+轮询函数，兼容页面异步加载DOM的情况，确保必生效
    function insertElement() {
        const targetDiv = document.querySelector(`div[class="${targetClass}"]`);
        if (targetDiv) {
            // ✅ 核心逻辑：向div内容的【最前面】插入元素
            targetDiv.insertAdjacentHTML('afterbegin', insertHtml);
            return true; // 插入成功，停止轮询
        }
        return false; // 未找到元素，继续轮询
    }

    // 先执行一次，能命中就直接插入
    if (!insertElement()) {
        // 未命中则开启轮询（最大轮询10秒，避免死循环）
        let timer = setInterval(() => {
            if (insertElement() || timer > 20) {
                clearInterval(timer);
            }
        }, 500);
    }
})();
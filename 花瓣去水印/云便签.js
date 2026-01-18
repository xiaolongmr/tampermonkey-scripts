// ==UserScript==
// @name         微信文章页 插入公众号二维码+提示
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  微信文章页class="grid-x grid margin-x"的div最前面插入带跳转的图片+文字提示
// @author       爱吃馍
// @match        https://webnote.cc/p/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 目标DOM的class名（精准匹配你指定的）
    const targetClass = 'grid-x grid margin-x';
    // ✅ 核心修改：移除a标签 改为【点击图片跳转】的纯图片+文字组合，完全按你要求定制
    const insertHtml = `
<div style="padding: 10px 0px;display:block;">
    <a href="https://wx.z-l.top/qrcode.png" target="_blank" style="text-decoration:none;">
        <img src="https://img.z-l.top/file/dh/F58b54kB.png" alt="公众号二维码" style="width:100%;height:auto;border:0;margin:0;padding:0;">
        <div style="color:red;font-size:14px;margin-top:6px;">不会更新脚本，上面公众号给我发私信：临时脚本怎么更新</div>
    </a>
</div>
`;

    // 防抖+轮询函数，微信页面异步加载严重，这个逻辑必须保留，确保100%插入成功
    function insertElement() {
        const targetDiv = document.querySelector(`div[class="${targetClass}"]`);
        if (targetDiv) {
            targetDiv.insertAdjacentHTML('afterbegin', insertHtml);
            return true;
        }
        return false;
    }

    if (!insertElement()) {
        let timer = setInterval(() => {
            if (insertElement() || timer > 30) {
                clearInterval(timer);
            }
        }, 500);
    }
})();
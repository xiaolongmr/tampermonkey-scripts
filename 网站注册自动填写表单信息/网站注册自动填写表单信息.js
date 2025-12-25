// ==UserScript==
// @name         网站注册自动填写表单信息
// @namespace    https://getquicker.net/User/Actions/388875-星河城野❤
// @version      1.0
// @description  自动填写指定网站的注册表单邀请码
// @author       小张 | 个人博客：https://blog.z-l.top | 公众号"爱吃馍" | 设计导航站：https://dh.z-l.top | quicker账号昵称：星河城野❤
// @match        http://121.40.25.9:8080/register.html
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @icon         https://dh.z-l.top/assets/favicon.ico
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    
    // 尝试填写邀请码，返回是否成功
    const fillInviteCode = () => {
        const input = document.querySelector('input[name="inviteCode"]') || 
                     document.querySelector('input[placeholder*="邀请码"]');
        if (input) {
            input.value = "1474728874";
            // 触发必要的事件
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        }
        return false;
    };
    
    // 初始尝试，如果失败则添加一次延迟重试
    if (!fillInviteCode()) {
        setTimeout(fillInviteCode, 500);
    }
})();
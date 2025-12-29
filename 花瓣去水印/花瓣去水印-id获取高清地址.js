// ==UserScript==
// @name         测试版
// @namespace    http://tampermonkey.net/
// @version      2025-12-24
// @description  同时替换主展示区和弹出层(vYzIMzy2)的图片为高清源
// @author       小张 | 个人博客：https://blog.z-l.top | 公众号“爱吃馍” | 设计导航站 ：https://dh.z-l.top | quicker账号昵称：星河城野❤
// @license      GPL-3.0
// @match        https://huaban.com/*
// @connect      gd.huaban.com
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// @require      https://cdn.jsdelivr.net/gh/xiaolongmr/tampermonkey-scripts@8ed09bc4be4797388576008ceadbe0f8258126e5/%E8%8A%B1%E7%93%A3%E5%8E%BB%E6%B0%B4%E5%8D%B0/%E8%8A%B1%E7%93%A3%E2%80%9C%E5%8E%BB%E2%80%9D%E6%B0%B4%E5%8D%B0%E6%9B%B4%E6%96%B0%E6%8F%90%E7%A4%BA%E8%84%9A%E6%9C%AC.js
// @require      https://cdn.tailwindcss.com
// ==/UserScript==

(function() {
    'use strict';

    let hdUrlCache = new Map(); // 存储 ID 对应的高清 URL

    // --- 逻辑 1：提取 ID 并预读取高清地址 ---
    function preloadHD() {
        const sourceDiv = document.querySelector('.__2p__B98x, .AGmy_6yA'); //ID选择器 .__2p__B98x是老版本花瓣网的，.AGmy_6yA是新版本花瓣网
        if (!sourceDiv) return;

        const match = sourceDiv.innerText.match(/ID[:：]\s*(\d+)/i);
        if (match && match[1]) {
            const pinId = match[1];
            if (hdUrlCache.has(pinId)) return;

            hdUrlCache.set(pinId, "loading");

            GM_xmlhttpRequest({
                method: "GET",
                url: `https://gd.huaban.com/editor/design?id=${pinId}`,
                onload: (res) => {
                    const scriptMatch = res.responseText.match(/window\.__SSR_TEMPLATE\s*=\s*(\{[\s\S]*?\})(?:;|\s*<\/script>)/);
                    if (scriptMatch) {
                        try {
                            const ssrData = JSON.parse(scriptMatch[1]);
                            if (ssrData?.preview?.image_url) {
                                const hdUrl = ssrData.preview.image_url;
                                hdUrlCache.set(pinId, hdUrl);
                                console.log(`[花瓣脚本] ID ${pinId} 高清源已获取`);
                                executeReplacement(hdUrl); // 立即尝试替换
                            }
                        } catch(e) { console.error("解析JSON失败"); }
                    }
                }
            });
        }
    }

    // --- 逻辑 2：执行 DOM 替换 ---
    function executeReplacement(url) {
        // 目标容器 1: 原始主展示区
        const container1 = document.querySelector('.OPWXbLYw , .Wa6mMsQV'); //图片详情选择器 .OPWXbLYw是老版本花瓣网，.Wa6mMsQV是新版本花瓣网
        // 目标容器 2: 新发现的弹出层/容器
        const container2 = document.querySelector('.vYzIMzy2 , .VFtkdxbR'); //图片详情弹出层选择器class

        const targets = [];
        if (container1) targets.push(container1.querySelector('img'));
        if (container2) {
            // 如果 vYzIMzy2 本身就是 img，直接添加；如果是 div，找内部 img
            if (container2.tagName === 'IMG') targets.push(container2);
            else targets.push(container2.querySelector('img'));
        }

        targets.forEach(img => {
            if (img && img.src !== url) {
                img.src = url;
                // 核心：移除 srcset，防止浏览器根据分辨率自动切回压缩图
                img.removeAttribute('srcset');
                // 视觉反馈：绿色边框表示已成功替换
                img.style.border = '1px solid #00FF00';
                img.style.boxSizing = 'border-box';
                console.log('[花瓣脚本] 成功替换图片');
            }
        });
    }

    // --- 逻辑 3：状态检查循环 ---
    function checkState() {
        const sourceDiv = document.querySelector('.__2p__B98x, .AGmy_6yA');
        if (!sourceDiv) return;

        const match = sourceDiv.innerText.match(/ID[:：]\s*(\d+)/i);
        if (match) {
            const currentId = match[1];
            const cachedUrl = hdUrlCache.get(currentId);

            // 如果已经有缓存好的高清图，检查页面是否需要更新
            if (cachedUrl && cachedUrl !== "loading") {
                executeReplacement(cachedUrl);
            }
        }
    }

    // --- 监听与启动 ---

    // 监听 DOM 变化：处理异步加载的 ID 和图片容器
    const observer = new MutationObserver(() => {
        preloadHD();
        checkState();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // 针对 URL 变化（带参数跳转）的额外轮询
    setInterval(checkState, 500);

    console.log('[花瓣脚本] 双容器强力替换模式已启动');
})();
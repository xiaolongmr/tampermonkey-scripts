// ==UserScript==
// @name         花瓣去水印-id获取高清地址
// @namespace    http://tampermonkey.net/
// @version      2026-1-02
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

    // 缓存高清URL，避免重复请求
    const hdUrlCache = new Map();

    // 处理页面更新：提取ID，请求或替换高清图片
    function handleUpdate() {
        // 查找包含ID的元素（支持新旧版本选择器）
        // .__2p__B98x: 老版本花瓣网的ID显示元素
        // .AGmy_6yA: 新版本花瓣网的ID显示元素
        const sourceDiv = document.querySelector('.__2p__B98x, .AGmy_6yA');
        if (!sourceDiv) return;

        // 提取ID
        const match = sourceDiv.innerText.match(/ID[:：]\s*(\d+)/i);
        if (!match) return;

        const id = match[1];
        const cachedUrl = hdUrlCache.get(id);

        // 如果正在加载或已有缓存，直接返回或替换
        if (cachedUrl === "loading") return;
        if (cachedUrl) {
            executeReplacement(cachedUrl);
            return;
        }

        // 标记为加载中
        hdUrlCache.set(id, "loading");

        // 请求高清图片数据
        GM_xmlhttpRequest({
            method: "GET",
            url: `https://gd.huaban.com/editor/design?id=${id}`,
            onload: (res) => {
                // 解析响应中的JSON数据
                const scriptMatch = res.responseText.match(/window\.__SSR_TEMPLATE\s*=\s*(\{[\s\S]*?\})(?:;|\s*<\/script>)/);
                if (scriptMatch) {
                    try {
                        const ssrData = JSON.parse(scriptMatch[1]);
                        if (ssrData?.preview?.url) {
                            const hdUrl = ssrData.preview.url;
                            hdUrlCache.set(id, hdUrl);
                            console.log(`ID: ${id}\nUrl: ${hdUrl}`);
                            executeReplacement(hdUrl);
                        }
                    } catch (e) {}
                }
            }
        });
    }

    // 替换图片并显示加载指示器
    function executeReplacement(url) {
        // 目标图片选择器（主展示区和弹出层）
        // .OPWXbLYw img: 老版本花瓣网主展示区图片
        // .Wa6mMsQV img: 新版本花瓣网主展示区图片
        // .vYzIMzy2 img: 弹出层图片（可能为老版本）
        // .VFtkdxbR img: 弹出层图片（可能为新版本）
        const selectors = ['.OPWXbLYw img', '.Wa6mMsQV img', '.vYzIMzy2 img', '.VFtkdxbR img'];
        const targets = selectors.map(sel => document.querySelector(sel)).filter(img => img && img.src !== url);

        targets.forEach(img => {
            const parent = img.parentElement;
            // 避免重复添加覆盖层
            if (parent.querySelector('.loading-overlay')) return;

            // 创建加载覆盖层
            const overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.textContent = '正在加载高清图片...';
            Object.assign(overlay.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 'bold',
                zIndex: '9999',
                pointerEvents: 'none'
            });

            // 确保父元素相对定位
            if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
            parent.appendChild(overlay);

            // 图片加载完成后移除覆盖层
            img.onload = () => {
                overlay.remove();
            };
            img.onerror = () => {
                overlay.remove();
                console.log('高清图片加载失败');
            };
            // 设置高清URL并移除srcset
            img.src = url;
            img.removeAttribute('srcset');
            img.style.boxSizing = 'border-box';
        });
    }

    // 监听DOM变化，处理异步加载内容
    const observer = new MutationObserver(handleUpdate);
    observer.observe(document.body, { childList: true, subtree: true });

    // 定期检查更新（处理URL变化等情况）
    setInterval(handleUpdate, 1000);

    console.log('✅脚本已运行_双容器替换模式已启动');
})();
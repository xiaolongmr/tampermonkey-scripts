/**
 * Greasy Fork 反代镜像站 - 最终增强版
 * 1. 边缘节点共享缓存 (一人访问，全网加速)
 * 2. 过期后台死循环重试更新 (确保缓存最终成功)
 * 3. 严格保留原始 WeChat 弹窗 HTML 和 邮件链接
 * 4. 缓存信息注入到 #script-info > header 的最前方
 */

const TARGET_DOMAIN = 'greasyfork.org';
const UPSTREAM_DOMAIN = 'greasyfork.org';
const UPDATE_DOMAIN = 'update.greasyfork.org';

// 🔥 【您的自定义配置】
const CUSTOM_CONFIG = {
    SITE_TITLE: 'Greasy Fork 镜像站', 
    LOGO_URL: 'https://cdn.h5ds.com/space/files/600972551685382144/20251124/917406810354032640.png',
    H1_TITLE: 'Greasy fork 爱吃馍镜像',
    FAVICON_URL: 'https://dh.z-l.top/assets/favicon.ico',
    WECHAT_QR_CODE_URL: 'https://open.weixin.qq.com/qr/code?username=gh_3ff7a91772aa',
    
    // 缓存配置
    CACHE_OPTIONS: {
        enable: true,            // 开启边缘共享缓存
        ttl: 3600,               // 缓存有效时长 (秒)
        retry_delay: 5000,       // 后台更新失败后的重试间隔 (毫秒)
        show_notice: true        // 是否在页面显示缓存提示
    },

    // 顶部 Banner (严格保留原始邮件链接)
    TOP_BANNER: {
        enable: true,
        text: '🎉 欢迎访问GreasyFork.Org 镜像站！本镜像站由公众号【爱吃馍】搭建，用于分享脚本。<a href="mailto:zlnp@qq.com?body=爱吃馍 团队你好，%0A%0A 我喜欢的功能：%0A1.%20%0A2.%20%0A3.%20%0A%0A 我不喜欢并认为可以改进的地方：%0A1.%20%0A2.%20%0A3.%20%0A%0A 此致，%0A [你的名字]" style="color: #721c24; margin-left: 15px;">联系邮箱📮</a>',
        backgroundColor: '#ffc0c0', 
        textColor: '#760000',       
        borderColor: '#bce8f100'      
    },

    FIX_403: {
        USER_AGENTS: [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15'
        ],
        MAX_RETRIES: 3, 
        RETRY_DELAY: 1500 
    }
};

// ==================== 1. HTMLRewriter 注入类 ====================

// 缓存状态提示注入 (位置：#script-info 里的 header 子元素最前面)
class CacheNoticeInjector {
    constructor(cacheTime, isExpired) {
        this.cacheTime = cacheTime;
        this.isExpired = isExpired;
    }
    element(element) {
        if (!CUSTOM_CONFIG.CACHE_OPTIONS.show_notice || !this.cacheTime) return;
        const dateStr = new Date(this.cacheTime).toLocaleString('zh-CN', { hour12: false });
        const status = this.isExpired ? 
            `<b style="color: #d9534f;">过期同步中...</b>` : `<b style="color: #5cb85c;">命中边缘加速</b>`;
        
        const noticeHtml = `
            <p style="background: #f9f9f9; border-left: 4px solid #4CAF50; padding: 12px; margin-bottom: 20px; font-size: 13px; color: #555; line-height: 1.6; border-radius: 0 4px 4px 0; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                🚀 <b>存储分发信息</b>：本页面已由镜像站成功缓存 (${status})<br>
                📅 <b>同步时间</b>：${dateStr} (新内容会在后台自动更新，无需刷新)
            </p>
        `;
        element.prepend(noticeHtml, { html: true });
    }
}

// 顶部 Banner 注入
class TopBannerInjector {
    element(element) {
        if (CUSTOM_CONFIG.TOP_BANNER.enable) {
            const bannerHtml = `<div style="background-color: ${CUSTOM_CONFIG.TOP_BANNER.backgroundColor}; color: ${CUSTOM_CONFIG.TOP_BANNER.textColor}; padding: 12px; text-align: center; font-size: 15px; font-weight: bold; border-bottom: 1px solid ${CUSTOM_CONFIG.TOP_BANNER.borderColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">${CUSTOM_CONFIG.TOP_BANNER.text}</div>`;
            element.prepend(bannerHtml, { html: true });
        }
    }
}

// 严格保留：原始公众号弹窗注入类 (代码结构未改动)
class WechatPopupInjector {
    constructor(qrCodeUrl) { 
        this.qrCodeUrl = qrCodeUrl;
        this.popupId = 'wechat-follow-modal';
        this.buttonId = 'wechat-follow-btn';
    }
    element(element) {
        const popupHtml = `
            <button id="${this.buttonId}" style="position: fixed; bottom: 50px; right: 20px; z-index: 10000; padding: 8px 15px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">↑</button>
            <div id="${this.popupId}" style="display: none; position: fixed; z-index: 10001; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.6);">
                <div style="background-color: #fefefe; margin: 10% auto; padding: 20px; border: 1px solid #888; width: 80%; max-width: 400px; border-radius: 10px; text-align: center; position: relative; box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19);">
                    <span id="close-wechat-modal" style="color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer;">&times;</span>
                    <h2 style="color: #4CAF50; margin-top: 5px;">扫码关注【爱吃馍】</h2>
                    <p>获取最新脚本和技术支持！</p>
                    <img src="${this.qrCodeUrl}" alt="公众号二维码" style="width: 250px; height: 250px; margin: 15px 0; border: 1px solid #ddd;">
                    <p style="font-size: 12px; color: #666;">关注公众号，获取最新地址</p>
                </div>
            </div>
            <script>
                (function() {
                    const modal = document.getElementById('${this.popupId}');
                    const btn = document.getElementById('${this.buttonId}');
                    const span = document.getElementById('close-wechat-modal');
                    btn.onclick = function() { modal.style.display = "block"; }
                    span.onclick = function() { modal.style.display = "none"; }
                    window.onclick = function(event) { if (event.target == modal) { modal.style.display = "none"; } }
                })();
            </script>
        `;
        element.prepend(popupHtml, { html: true });
    }
}

// 链接重写 (跳过邮件)
class AttributeRewriter {
    constructor(attributeName) { this.attributeName = attributeName; }
    element(element) { 
        const attribute = element.getAttribute(this.attributeName);
        if (attribute) {
            if (attribute.startsWith('mailto:')) return; // 严格保护邮件链接
            const newValue = this.rewriteUrl(attribute);
            if (newValue !== attribute) { element.setAttribute(this.attributeName, newValue); }
        }
    }
    rewriteUrl(url) {
        if (url.includes(UPDATE_DOMAIN)) return url.replace('https://' + UPDATE_DOMAIN, '').replace('http://' + UPDATE_DOMAIN, '');
        if (url.startsWith('https://' + TARGET_DOMAIN) || url.startsWith('http://' + TARGET_DOMAIN)) return url.replace('https://' + TARGET_DOMAIN, '').replace('http://' + TARGET_DOMAIN, '');
        if (url.startsWith('//' + TARGET_DOMAIN)) return url.replace('//' + TARGET_DOMAIN, '');
        return url;
    }
}

// ==================== 2. 请求处理逻辑 ====================

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
    const request = event.request;
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/') return Response.redirect(url.origin + '/zh-CN', 302);

    let upstreamDomain = UPSTREAM_DOMAIN;
    if (path.match(/\.(user|meta)\.js$/) || path.match(/\.json$/)) {
        upstreamDomain = UPDATE_DOMAIN;
    }
    const targetUrlStr = `https://${upstreamDomain}${path}${url.search}`;

    // 缓存系统
    const cache = caches.default;
    const cacheKey = new Request(url.toString(), { method: 'GET', headers: request.headers });
    let response = await cache.match(cacheKey);

    let isHit = !!response;
    let isExpired = false;
    let cacheTime = null;

    if (isHit) {
        cacheTime = response.headers.get('X-Proxy-Cache-Date');
        const age = (Date.now() - new Date(cacheTime).getTime()) / 1000;
        if (age > CUSTOM_CONFIG.CACHE_OPTIONS.ttl) isExpired = true;
    }

    if (!isHit) {
        // 全新拉取
        response = await fetchAndProcess(targetUrlStr, request);
        if (response.ok && CUSTOM_CONFIG.CACHE_OPTIONS.enable) {
            event.waitUntil(cache.put(cacheKey, response.clone()));
        }
    } else if (isExpired) {
        // 后台重试更新任务
        event.waitUntil(backgroundUpdateTask(cacheKey, targetUrlStr, request));
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
        const timestamp = cacheTime || new Date().toISOString();
        return rewriteHtml(response, timestamp, isExpired);
    }

    return response;
}

async function fetchAndProcess(targetUrl, request) {
    const res = await fetchWithRetry(targetUrl, request);
    let resultResponse = res;

    if (targetUrl.includes('.js') || (res.headers.get('content-type') || '').includes('javascript')) {
        let content = await res.text();
        const origin = new URL(request.url).origin;
        content = content.replace(new RegExp(`https://${UPDATE_DOMAIN}`, 'g'), origin)
                         .replace(new RegExp(`https://${TARGET_DOMAIN}`, 'g'), origin);
        resultResponse = new Response(content, res);
    }

    const newHeaders = new Headers(resultResponse.headers);
    newHeaders.set('X-Proxy-Cache-Date', new Date().toISOString());
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.delete('Cache-Control'); 

    return new Response(resultResponse.body, { status: resultResponse.status, headers: newHeaders });
}

async function backgroundUpdateTask(cacheKey, targetUrl, request) {
    let success = false;
    while (!success) {
        try {
            const freshRes = await fetchAndProcess(targetUrl, request);
            if (freshRes.ok) {
                await caches.default.put(cacheKey, freshRes);
                success = true;
            } else { throw new Error("Retry needed"); }
        } catch (e) {
            await new Promise(r => setTimeout(r, CUSTOM_CONFIG.CACHE_OPTIONS.retry_delay));
        }
    }
}

function rewriteHtml(response, cacheTime, isExpired) {
    return new HTMLRewriter()
        .on('head', new StyleInjector())
        // 指定位置插入缓存提示
        .on('section#script-info > header', new CacheNoticeInjector(cacheTime, isExpired))
        
        .on('body', new TopBannerInjector())
        .on('body', new WechatPopupInjector(CUSTOM_CONFIG.WECHAT_QR_CODE_URL))
        .on('#main-header .width-constraint #site-name #site-name-text h1', new H1TitleRewriter(CUSTOM_CONFIG.H1_TITLE))
        .on('#site-name img', new LogoRewriter(CUSTOM_CONFIG.LOGO_URL))
        .on('title', new SiteTitleRewriter(CUSTOM_CONFIG.SITE_TITLE))
        .on('link', new FaviconRewriter(CUSTOM_CONFIG.FAVICON_URL))
        .on('#installation-instructions-modal-content', new InstallModalInjector(CUSTOM_CONFIG))
        .on('a', new AttributeRewriter('href'))
        .on('img', new ImageRewriter())
        .on('link[rel="stylesheet"]', new AttributeRewriter('href'))
        .on('script', new AttributeRewriter('src'))
        .on('*', new StyleRewriter())
        .transform(response);
}

// ==================== 3. 工具辅助函数 ====================

async function fetchWithRetry(targetUrl, request, retries = 0) {
    const headers = new Headers(request.headers);
    headers.set('Host', new URL(targetUrl).hostname);
    headers.set('User-Agent', CUSTOM_CONFIG.FIX_403.USER_AGENTS[Math.floor(Math.random() * CUSTOM_CONFIG.FIX_403.USER_AGENTS.length)]);
    ['CF-Connecting-IP', 'CF-IPCountry', 'CF-Ray', 'CF-Visitor', 'Cdn-Loop'].forEach(h => headers.delete(h));

    try {
        const res = await fetch(targetUrl, { method: request.method, headers, redirect: 'follow' });
        if (res.status === 403 && retries < CUSTOM_CONFIG.FIX_403.MAX_RETRIES) {
            await new Promise(r => setTimeout(r, CUSTOM_CONFIG.FIX_403.RETRY_DELAY));
            return fetchWithRetry(targetUrl, request, retries + 1);
        }
        return res;
    } catch (e) {
        if (retries < CUSTOM_CONFIG.FIX_403.MAX_RETRIES) {
            await new Promise(r => setTimeout(r, CUSTOM_CONFIG.FIX_403.RETRY_DELAY));
            return fetchWithRetry(targetUrl, request, retries + 1);
        }
        throw e;
    }
}

// 其他辅助类 (保持样式不变)
class H1TitleRewriter { constructor(t) { this.t = t; } element(el) { el.setAttribute('style', 'font-size: 50px; line-height: 96px;'); el.setInnerContent(this.t); } }
class LogoRewriter { constructor(u) { this.u = u; } element(el) { el.setAttribute('src', this.u); } }
class SiteTitleRewriter { constructor(t) { this.t = t; } element(el) { el.setInnerContent(this.t); } }
class FaviconRewriter { constructor(u) { this.u = u; } element(el) { if ((el.getAttribute('rel') || '').includes('icon')) el.setAttribute('href', this.u); } }
class StyleInjector { element(el) { el.append(`<style>@media screen and (max-width: 920px) {#main-header .width-constraint #site-name #site-name-text h1 { font-size: 23px !important; line-height: 38px !important; }} #home-ad, .ad, .ad-ga { display: none !important; }</style>`, { html: true }); } }
class InstallModalInjector { constructor(c) { this.c = c; } element(el) { el.append(`<div style="margin-top:20px; padding:10px; border:2px dashed #4CAF50; border-radius:8px; text-align:center;"><p style="color:#4CAF50; font-weight:bold;">安装有问题？关注公众号获取帮助</p><img src="${this.c.WECHAT_QR_CODE_URL}" style="width:120px;"></div>`, { html: true }); } }
class ImageRewriter { element(el) { const src = el.getAttribute('src'); if (src && src.includes(TARGET_DOMAIN)) el.setAttribute('src', src.replace(`https://${TARGET_DOMAIN}`, '')); } }
class StyleRewriter { element(el) { const s = el.getAttribute('style'); if (s && s.includes(TARGET_DOMAIN)) el.setAttribute('style', s.replace(new RegExp(`https?://${TARGET_DOMAIN}`, 'g'), '')); } }
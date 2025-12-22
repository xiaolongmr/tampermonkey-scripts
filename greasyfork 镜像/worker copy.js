/**
 * Greasy Fork 反代镜像站 - 稳定修复版 (解决 1101 错误)
 * 
 * 修复重点：
 * 1. 完善响应流克隆机制，确保缓存写入不阻塞主页面加载。
 * 2. 增强后台异步任务的健壮性，捕获所有潜在异常。
 * 3. 保持所有原有的 HTML 结构、UA 列表和广告植入。
 */

const TARGET_DOMAIN = 'greasyfork.org';
const UPSTREAM_DOMAIN = 'greasyfork.org';
const UPDATE_DOMAIN = 'update.greasyfork.org';

const CUSTOM_CONFIG = {
    SITE_TITLE: 'Greasy Fork 镜像站', 
    LOGO_URL: 'https://cdn.h5ds.com/space/files/600972551685382144/20251124/917406810354032640.png',
    H1_TITLE: 'Greasy fork 爱吃馍镜像',
    FAVICON_URL: 'https://dh.z-l.top/assets/favicon.ico',
    WECHAT_QR_CODE_URL: 'https://open.weixin.qq.com/qr/code?username=gh_3ff7a91772aa',
    
    CACHE_OPTIONS: {
        enable: true,
        ttl: 3600,               
        retry_delay: 5000,       
        show_notice: true        
    },

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
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.109 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
        ],
        MAX_RETRIES: 3, 
        RETRY_DELAY: 1500 
    }
};

const LANGUAGE_PATHS = ['/zh-CN', '/zh-TW', '/en', '/ja', '/ko', '/de', '/fr', '/es', '/ru', '/pt-BR', '/it', '/pl'];
const STATIC_PATH_PATTERNS = ['/assets/', '/stylesheets/', '/javascripts/', '/images/', '/favicon', '/vite/', '/vendor/', '/packs/', '/fonts/', '/icons/', '/svg/', '/css/', '/js/'];

// ==================== 1. HTML 重写组件 ====================

class CacheNoticeInjector {
    constructor(cacheTime, isExpired, refreshUrl) {
        this.cacheTime = cacheTime;
        this.isExpired = isExpired;
        this.refreshUrl = refreshUrl;
    }
    element(element) {
        if (!CUSTOM_CONFIG.CACHE_OPTIONS.show_notice || !this.cacheTime) return;
        const cacheDate = new Date(this.cacheTime);
        const nextUpdateDate = new Date(cacheDate.getTime() + CUSTOM_CONFIG.CACHE_OPTIONS.ttl * 1000);
        const timeFormat = { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
        const curStr = cacheDate.toLocaleString('zh-CN', timeFormat);
        const nextStr = nextUpdateDate.toLocaleString('zh-CN', timeFormat);
        const statusText = this.isExpired ? 
            `<span style="color: #d9534f; font-weight: bold;">(过期同步中...)</span>` : 
            `<span style="color: #5cb85c; font-weight: bold;">(共享加速已生效)</span>`;

        const noticeHtml = `
            <div id="mirror-cache-dashboard" style="background: #fdfdfe; border: 1px solid #e1e4e8; border-left: 6px solid #4CAF50; padding: 15px; margin-bottom: 25px; border-radius: 4px; font-size: 13px; color: #444; line-height: 1.8; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <div style="margin-bottom: 4px;">📂 <b>缓存分发状态</b>：${statusText}</div>
                        <div style="color: #666;">🕒 <b>页面固定同步时间</b>：${curStr}</div>
                        <div style="color: #666;">🔄 <b>预计下次更新时间</b>：${nextStr}</div>
                    </div>
                    <a href="${this.refreshUrl}" style="background: #4CAF50; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none; font-weight: bold; font-size: 12px;">手动刷新缓存</a>
                </div>
            </div>
        `;
        element.prepend(noticeHtml, { html: true });
    }
}

class WechatPopupInjector {
    constructor(qrCodeUrl) { 
        this.qrCodeUrl = qrCodeUrl;
        this.popupId = 'wechat-follow-modal';
        this.buttonId = 'wechat-follow-btn';
    }
    element(element) {
        if (element.tagName.toLowerCase() === 'body') {
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
                        if(btn && modal && span) {
                            btn.onclick = function() { modal.style.display = "block"; }
                            span.onclick = function() { modal.style.display = "none"; }
                            window.onclick = function(event) { if (event.target == modal) { modal.style.display = "none"; } }
                        }
                    })();
                </script>
            `;
            element.prepend(popupHtml, { html: true });
        }
    }
}

class InstallModalInjector {
    constructor(config) { this.config = config; }
    element(element) {
        const adHtml = `
            <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border: 2px dashed #4CAF50; border-radius: 8px; text-align: center;">
                <h4 style="margin: 0 0 10px 0; color: #4CAF50; font-size: 16px;">🚀 安装遇到问题？关注公众号获取帮助</h4>
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;">
                    <img src="${this.config.WECHAT_QR_CODE_URL}" alt="公众号二维码" style="width: 150px; height: 150px; border: 1px solid #ddd;">
                    <div style="text-align: center;">
                        <p style="margin: 5px 0; font-weight: bold; color: #333;">扫码关注【爱吃馍】</p>
                        <p style="margin: 0; font-size: 12px; color: #666;">回复【脚本】获取最新教程和防失联地址</p>
                    </div>
                </div>
            </div>
        `;
        element.append(adHtml, { html: true });
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
    const isManualRefresh = url.searchParams.has('refresh');

    if (path === '/') return Response.redirect(url.origin + '/zh-CN', 302);

    let upstreamDomain = UPSTREAM_DOMAIN;
    if (path.match(/\.(user|meta)\.js$/) || path.match(/\.json$/)) {
        upstreamDomain = UPDATE_DOMAIN;
    }
    const targetUrlStr = `https://${upstreamDomain}${path}${url.search}`;

    const cache = caches.default;
    const cacheKeyUrl = new URL(url.href);
    cacheKeyUrl.searchParams.delete('refresh');
    const cacheKey = new Request(cacheKeyUrl.toString(), { method: 'GET' });

    let response = null;
    if (!isManualRefresh) {
        try {
            response = await cache.match(cacheKey);
        } catch (e) {
            console.error("Cache match error:", e);
        }
    }

    let isHit = !!response;
    let isExpired = false;
    let fixedCacheTime = null;

    if (isHit) {
        fixedCacheTime = response.headers.get('X-Proxy-Cache-Date');
        const age = (Date.now() - new Date(fixedCacheTime).getTime()) / 1000;
        if (age > CUSTOM_CONFIG.CACHE_OPTIONS.ttl) isExpired = true;
    }

    if (!isHit || isManualRefresh) {
        // 无缓存或手动刷新：抓取远端
        response = await fetchAndModify(targetUrlStr, request);
        
        if (response.ok && CUSTOM_CONFIG.CACHE_OPTIONS.enable) {
            // 重要：克隆响应体用于缓存写入，防止 1101 错误
            const responseToCache = response.clone();
            event.waitUntil(
                (async () => {
                    try {
                        const headers = new Headers(responseToCache.headers);
                        headers.set('Cache-Control', `public, max-age=${CUSTOM_CONFIG.CACHE_OPTIONS.ttl}`);
                        const cacheRes = new Response(responseToCache.body, {
                            status: responseToCache.status,
                            statusText: responseToCache.statusText,
                            headers: headers
                        });
                        await cache.put(cacheKey, cacheRes);
                    } catch (err) {
                        console.error("WaitUntil cache put error:", err);
                    }
                })()
            );
            fixedCacheTime = response.headers.get('X-Proxy-Cache-Date');
        }
    } else if (isExpired) {
        // 过期异步同步
        event.waitUntil(backgroundInfiniteSync(cacheKey, targetUrlStr, request));
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
        const timestamp = fixedCacheTime || new Date().toISOString();
        const refreshUrl = new URL(url.href);
        refreshUrl.searchParams.set('refresh', 'true');
        return rewriteHtmlPage(response, timestamp, isExpired, refreshUrl.href);
    }

    return response;
}

async function backgroundInfiniteSync(cacheKey, targetUrl, request) {
    let success = false;
    while (!success) {
        try {
            const fresh = await fetchAndModify(targetUrl, request);
            if (fresh.ok) {
                const headers = new Headers(fresh.headers);
                headers.set('Cache-Control', `public, max-age=${CUSTOM_CONFIG.CACHE_OPTIONS.ttl}`);
                const cacheRes = new Response(fresh.body, {
                    status: fresh.status,
                    statusText: fresh.statusText,
                    headers: headers
                });
                await caches.default.put(cacheKey, cacheRes);
                success = true;
            } else { throw new Error("Sync failed"); }
        } catch (e) {
            await new Promise(r => setTimeout(r, CUSTOM_CONFIG.CACHE_OPTIONS.retry_delay));
        }
    }
}

async function fetchAndModify(targetUrl, request) {
    const res = await fetchWithRetry(targetUrl, request);
    const contentType = res.headers.get('content-type') || '';
    
    let body;
    let modifiedHeaders = new Headers(res.headers);

    // 对于脚本文件，我们预读 Body 以进行修改，避免流竞争
    if (targetUrl.includes('.js') || contentType.includes('javascript')) {
        let content = await res.text();
        const origin = new URL(request.url).origin;
        body = content.replace(new RegExp(`https://${UPDATE_DOMAIN}`, 'g'), origin)
                      .replace(new RegExp(`https://${TARGET_DOMAIN}`, 'g'), origin);
    } else {
        body = res.body;
    }

    modifiedHeaders.set('X-Proxy-Cache-Date', new Date().toISOString());
    modifiedHeaders.set('Access-Control-Allow-Origin', '*');
    modifiedHeaders.delete('Vary');
    modifiedHeaders.delete('Set-Cookie');
    modifiedHeaders.delete('Content-Security-Policy');

    return new Response(body, {
        status: res.status,
        statusText: res.statusText,
        headers: modifiedHeaders
    });
}

function rewriteHtmlPage(response, cacheTime, isExpired, refreshUrl) {
    return new HTMLRewriter()
        .on('head', new StyleInjector())
        .on('section#script-info > header', new CacheNoticeInjector(cacheTime, isExpired, refreshUrl))
        .on('body', new TopBannerInjector(CUSTOM_CONFIG))
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
        .on('iframe', new AttributeRewriter('src'))
        .on('form', new AttributeRewriter('action'))
        .on('meta[content*="greasyfork.org"]', new AttributeRewriter('content'))
        .on('*', new StyleRewriter())
        .transform(response);
}

// ==================== 3. 工具重写类 ====================

class AttributeRewriter {
    constructor(attributeName) { this.attributeName = attributeName; }
    element(element) { 
        const attribute = element.getAttribute(this.attributeName);
        if (attribute) {
            if (attribute.startsWith('mailto:')) return; 
            const newValue = this.rewriteUrl(attribute);
            if (newValue !== attribute) { element.setAttribute(this.attributeName, newValue); }
        }
    }
    rewriteUrl(url) {
        if (url.includes(UPDATE_DOMAIN)) return url.replace('https://' + UPDATE_DOMAIN, '').replace('http://' + UPDATE_DOMAIN, '');
        if (url.startsWith('https://' + TARGET_DOMAIN) || url.startsWith('http://' + TARGET_DOMAIN)) return url.replace('https://' + TARGET_DOMAIN, '').replace('http://' + TARGET_DOMAIN, '');
        if (url.startsWith('//' + TARGET_DOMAIN)) return url.replace('//' + TARGET_DOMAIN, '');
        if (url.startsWith('/')) {
            const isStatic = STATIC_PATH_PATTERNS.some(p => url.startsWith(p)) || /\.(css|js|png|jpg|ico|svg)$/i.test(url);
            if (isStatic) return url;
            const isLanguagePath = LANGUAGE_PATHS.some(p => url.startsWith(p + '/') || url === p);
            const isSpecialPath = url.startsWith('/scripts/') || url.startsWith('/styles/') || url.startsWith('/users/') || url.startsWith('/forum/') || url.startsWith('/help/');
            if (!isLanguagePath && !isSpecialPath) return '/zh-CN' + url;
        }
        return url;
    }
}

class H1TitleRewriter { constructor(t) { this.t = t; } element(e) { e.setAttribute('style', 'font-size: 50px; line-height: 96px;'); e.setInnerContent(this.t); } }
class LogoRewriter { constructor(u) { this.u = u; } element(e) { e.setAttribute('src', this.u); } }
class SiteTitleRewriter { constructor(t) { this.t = t; } element(e) { e.setInnerContent(this.t); } }
class FaviconRewriter { constructor(u) { this.u = u; } element(e) { if ((e.getAttribute('rel') || '').includes('icon')) e.setAttribute('href', this.u); } }
class StyleInjector { element(e) { e.append(`<style>@media screen and (max-width: 920px) {#main-header .width-constraint #site-name #site-name-text h1 { font-size: 23px !important; line-height: 38px !important; white-space: normal !important; } h1 { font-size: 23px !important; line-height: 38px !important; }} #home-ad, .ad, .ad-ga {display: none;}</style>`, { html: true }); } }
class TopBannerInjector { constructor(c) { this.c = c; } element(e) { if (this.c.TOP_BANNER.enable) e.prepend(`<div style="background:${this.c.TOP_BANNER.backgroundColor};color:${this.c.TOP_BANNER.textColor};padding:12px;text-align:center;font-size:15px;font-weight:bold;border-bottom:1px solid ${this.c.TOP_BANNER.borderColor};">${this.c.TOP_BANNER.text}</div>`, { html: true }); } }
class ImageRewriter { element(e) { const r = new AttributeRewriter('src'); ['src', 'srcset'].forEach(a => { const v = e.getAttribute(a); if (v) e.setAttribute(a, a === 'src' ? r.rewriteUrl(v) : v); }); } }
class StyleRewriter { element(e) { const s = e.getAttribute('style'); if (s) e.setAttribute('style', s.replace(new RegExp(`https?:\/\/${TARGET_DOMAIN}`, 'g'), '').replace(new RegExp(`https?:\/\/${UPDATE_DOMAIN}`, 'g'), '')); } }

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
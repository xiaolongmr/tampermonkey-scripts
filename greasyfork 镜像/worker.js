// Greasy Fork反代配置 - 最终完全体 (顶部Banner提示 + 弹窗植入广告 + 修复安装链接 + 脚本内部元数据替换 + 精确H1 + 移动端适配)
// ---------------------------------------------------------------------

const TARGET_DOMAIN = 'greasyfork.org';
const UPSTREAM_DOMAIN = 'greasyfork.org';
const UPDATE_DOMAIN = 'update.greasyfork.org'; // 脚本下载专用域名
const ENABLE_CACHE = false; // 强烈建议保持关闭，以免缓存未替换域名的脚本文件

// 🔥 【您的自定义配置】
const CUSTOM_CONFIG = {
    SITE_TITLE: 'Greasy Fork 镜像站', 
    LOGO_URL: 'https://cdn.h5ds.com/space/files/600972551685382144/20251124/917406810354032640.png',
    H1_TITLE: 'Greasy fork 爱吃馍镜像',
    FAVICON_URL: 'https://dh.z-l.top/assets/favicon.ico',
    WECHAT_QR_CODE_URL: 'https://open.weixin.qq.com/qr/code?username=gh_3ff7a91772aa',
    
    // 🔥 【新增】顶部 Banner 提示配置 (替代原 VIP_USER)
    TOP_BANNER: {
        enable: true,
        text: '🎉 欢迎访问GreasyFork.Org 镜像站！本镜像站由公众号【爱吃馍】搭建，用于分享脚本。<a href="mailto:zlnp@qq.com?body=爱吃馍 团队你好，%0A%0A 我喜欢的功能：%0A1.%20%0A2.%20%0A3.%20%0A%0A 我不喜欢并认为可以改进的地方：%0A1.%20%0A2.%20%0A3.%20%0A%0A 此致，%0A [你的名字]" style="color: #721c24; margin-left: 15px;">联系邮箱📮</a>',
        backgroundColor: '#ffc0c0', // 背景
        textColor: '#760000',       // 文字
        borderColor: '#bce8f100'      // 边框颜色
    },

    FIX_403: {
        USER_AGENTS: [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.109 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
        ],
        RETRY_ON_FORBIDDEN: true,
        MAX_RETRIES: 3, 
        RETRY_DELAY: 1500 
    }
};

const MAX_RETRIES = CUSTOM_CONFIG.FIX_403.MAX_RETRIES;
const RETRY_DELAY = CUSTOM_CONFIG.FIX_403.RETRY_DELAY; 

const LANGUAGE_PATHS = [
    '/zh-CN', '/zh-TW', '/en', '/ja', '/ko', '/de',
    '/fr', '/es', '/ru', '/pt-BR', '/it', '/pl'
];
const STATIC_PATH_PATTERNS = [
    '/assets/', '/stylesheets/', '/javascripts/', '/images/',
    '/favicon', '/vite/', '/vendor/', '/packs/',
    '/fonts/', '/icons/', '/svg/', '/css/', '/js/'
];

// ==================== HTMLRewriter 辅助类 ====================

// 1. URL 重写类 (处理 href/src 等)
class AttributeRewriter {
    constructor(attributeName) { this.attributeName = attributeName; }
    
    element(element) { 
        const attribute = element.getAttribute(this.attributeName);
        if (attribute) {
            const newValue = this.rewriteUrl(attribute);
            if (newValue !== attribute) { element.setAttribute(this.attributeName, newValue); }
        }
    }
    
    rewriteUrl(url) {
        // 1. 处理脚本下载域名 (update.greasyfork.org)
        if (url.includes(UPDATE_DOMAIN)) {
            return url.replace('https://' + UPDATE_DOMAIN, '')
                      .replace('http://' + UPDATE_DOMAIN, '');
        }

        // 2. 处理主域名
        if (url.startsWith('https://' + TARGET_DOMAIN) || url.startsWith('http://' + TARGET_DOMAIN)) {
            return url.replace('https://' + TARGET_DOMAIN, '').replace('http://' + TARGET_DOMAIN, '');
        }
        if (url.startsWith('//' + TARGET_DOMAIN)) { return url.replace('//' + TARGET_DOMAIN, ''); }
        
        // 3. 处理相对路径
        if (url.startsWith('/')) {
            const isStatic = STATIC_PATH_PATTERNS.some(pattern => url.startsWith(pattern)) || /\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$/i.test(url);
            if (isStatic) { return url; }
            const isLanguagePath = LANGUAGE_PATHS.some(path => url.startsWith(path + '/') || url === path);
            const isSpecialPath = url.startsWith('/scripts/') || url.startsWith('/styles/') || url.startsWith('/users/') || url.startsWith('/forum/') || url.startsWith('/help/');
            if (!isLanguagePath && !isSpecialPath) { return '/zh-CN' + url; }
        }
        return url;
    }
}

// 样式重写
class StyleRewriter {
    element(element) {
        const style = element.getAttribute('style');
        if (style) {
            const newValue = style.replace(new RegExp(`https?:\/\/${TARGET_DOMAIN}`, 'g'), '')
                                .replace(new RegExp(`https?:\/\/${UPDATE_DOMAIN}`, 'g'), '');
            if (newValue !== style) { element.setAttribute('style', newValue); }
        }
    }
}

// 图片重写
class ImageRewriter {
    element(element) {
        const urlRewriter = new AttributeRewriter('src');
        ['src', 'srcset'].forEach(attr => {
            const attribute = element.getAttribute(attr);
            if (attribute) {
                if (attr === 'src') {
                    const newSrc = urlRewriter.rewriteUrl(attribute);
                    if (newSrc !== attribute) { element.setAttribute('src', newSrc); }
                } else if (attr === 'srcset') {
                    const newSrcset = attribute.split(',').map(item => {
                        const parts = item.trim().split(' ');
                        const url = parts[0];
                        const density = parts.slice(1).join(' ');
                        return urlRewriter.rewriteUrl(url) + (density ? ' ' + density : '');
                    }).join(', ');
                    if (newSrcset !== attribute) { element.setAttribute('srcset', newSrcset); }
                }
            }
        });
    }
}

// 2. Logo 重写
class LogoRewriter {
    constructor(logoUrl) { this.logoUrl = logoUrl; }
    element(element) {
        element.setAttribute('src', this.logoUrl);
    }
}

// 3. H1 标题重写 (使用精确样式)
class H1TitleRewriter {
    constructor(h1Title) { this.h1Title = h1Title; }
    element(element) {
        // 设置样式：桌面端字体 50px
        element.setAttribute('style', 'font-size: 50px; line-height: 96px;');
        element.setInnerContent(this.h1Title, { html: false });
    }
}

// 4. 网站 Title 重写
class SiteTitleRewriter {
    constructor(title) { this.title = title; }
    element(element) {
        element.setInnerContent(this.title, { html: false });
    }
}

// 5. Favicon 重写
class FaviconRewriter {
    constructor(faviconUrl) { this.faviconUrl = faviconUrl; }
    element(element) {
        const rel = element.getAttribute('rel') || '';
        if (rel.includes('icon') || rel.includes('shortcut')) {
            let newUrl = this.faviconUrl;
            newUrl += (newUrl.indexOf('?') === -1 ? '?' : '&') + `v=${Date.now()}`;
            element.setAttribute('href', newUrl);
        }
    }
}

// 6. 全局公众号弹窗 (悬浮按钮)
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
                        btn.onclick = function() { modal.style.display = "block"; }
                        span.onclick = function() { modal.style.display = "none"; }
                        window.onclick = function(event) { if (event.target == modal) { modal.style.display = "none"; } }
                    })();
                </script>
            `;
            element.prepend(popupHtml, { html: true });
        }
    }
}

// 🔥 【新增】安装弹窗内广告植入类
class InstallModalInjector {
    constructor(config) {
        this.config = config;
    }
    element(element) {
        // 在安装说明弹窗的内容区域末尾插入
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

// 🔥 【新增】顶部 Banner 注入类 (替代原 VIPBannerRewriter)
class TopBannerInjector {
    constructor(config) {
        this.config = config;
    }
    element(element) {
        if (this.config.TOP_BANNER.enable && element.tagName.toLowerCase() === 'body') {
            const bannerHtml = `
                <div style="
                    background-color: ${this.config.TOP_BANNER.backgroundColor}; 
                    color: ${this.config.TOP_BANNER.textColor}; 
                    padding: 12px; 
                    text-align: center; 
                    font-size: 15px; 
                    font-weight: bold;
                    border-bottom: 1px solid ${this.config.TOP_BANNER.borderColor};
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                ">
                    ${this.config.TOP_BANNER.text}
                </div>
            `;
            element.prepend(bannerHtml, { html: true });
        }
    }
}

// 7. 移动端样式注入
class StyleInjector {
    constructor() {
        this.mobileH1Style = `
        @media screen and (max-width: 920px) {
            #main-header .width-constraint #site-name #site-name-text h1 { font-size: 23px !important; line-height: 38px !important; white-space: normal !important; }
            h1 { font-size: 23px !important; line-height: 38px !important; }
        }
        #home-ad, .ad, .ad-ga{display: none;}
        `;
    }
    element(element) {
        if (element.tagName.toLowerCase() === 'head') {
            element.append(`<style>${this.mobileH1Style}</style>`, { html: true });
        }
    }
}

// ==================== 请求处理逻辑 ====================

function getRandomUserAgent() {
    return CUSTOM_CONFIG.FIX_403.USER_AGENTS[Math.floor(Math.random() * CUSTOM_CONFIG.FIX_403.USER_AGENTS.length)];
}

async function fetchWithRetry(targetUrl, request, retries = 0) {
    const url = new URL(targetUrl);
    const userAgent = getRandomUserAgent();
    
    const requestHeaders = new Headers(request.headers);
    
    // 智能路由 Header 设置
    if (targetUrl.includes(UPDATE_DOMAIN)) {
        requestHeaders.set('Host', UPDATE_DOMAIN);
    } else {
        requestHeaders.set('Host', UPSTREAM_DOMAIN);
    }
    
    requestHeaders.set('User-Agent', userAgent);
    requestHeaders.set('Referer', `https://${UPSTREAM_DOMAIN}/scripts/`); 
    
    ['CF-IPCountry', 'CF-Connecting-IP', 'CF-Ray', 'CF-Visitor', 'CF-Worker', 'Accept-Encoding'].forEach(header => {
        requestHeaders.delete(header);
    });

    try {
        const response = await fetch(targetUrl, {
            method: request.method,
            headers: requestHeaders,
            body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
            redirect: "follow",
            cf: {
                cacheEverything: ENABLE_CACHE,
                cacheTtl: url.pathname.includes('/assets/') ? 86400 : 900,
                forceRequest: retries > 0 
            }
        });

        if (response.status === 403 && CUSTOM_CONFIG.FIX_403.RETRY_ON_FORBIDDEN && retries < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return fetchWithRetry(targetUrl, request, retries + 1);
        }
        return response;

    } catch (error) {
        if (retries < MAX_RETRIES) {
             await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
             return fetchWithRetry(targetUrl, request, retries + 1);
        }
        throw error;
    }
}

async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === '/') {
        return Response.redirect(url.origin + '/zh-CN', 302);
    }
    
    // 🔥 【核心修复：智能路由】
    // 如果请求是脚本文件，路由到 update.greasyfork.org
    let upstreamDomain = UPSTREAM_DOMAIN;
    if (path.match(/\.user\.js$/) || path.match(/\.meta\.js$/) || path.match(/\.json$/)) {
        upstreamDomain = UPDATE_DOMAIN;
    }
    
    const targetUrlStr = `https://${upstreamDomain}${path}${url.search}`;
    
    try {
        const response = await fetchWithRetry(targetUrlStr, request);
        const contentType = response.headers.get('content-type') || '';
        let modifiedResponse = response;

        // -------------------------------------------------------
        // 🔥 【核心：处理脚本文件内容替换】 (@downloadURL, @updateURL)
        // -------------------------------------------------------
        if (path.endsWith('.user.js') || path.endsWith('.meta.js') || contentType.includes('javascript')) {
            let scriptContent = await response.text();
            const workerOrigin = url.origin;
            
            // 替换所有指向原站和下载站的链接为当前反代域名
            scriptContent = scriptContent
                .replace(new RegExp(`https://${UPDATE_DOMAIN}`, 'g'), workerOrigin)
                .replace(new RegExp(`https://${TARGET_DOMAIN}`, 'g'), workerOrigin);
            
            modifiedResponse = new Response(scriptContent, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
            });
        }
        // -------------------------------------------------------
        // HTML 页面重写
        // -------------------------------------------------------
        else if (contentType.startsWith('text/html')) {
            modifiedResponse = new HTMLRewriter()
                .on('head', new StyleInjector()) 
                .on('#main-header .width-constraint #site-name #site-name-text h1', new H1TitleRewriter(CUSTOM_CONFIG.H1_TITLE)) 
                .on('#site-name img', new LogoRewriter(CUSTOM_CONFIG.LOGO_URL)) 
                .on('title', new SiteTitleRewriter(CUSTOM_CONFIG.SITE_TITLE))
                .on('link', new FaviconRewriter(CUSTOM_CONFIG.FAVICON_URL)) 
                
                // 使用新的 TopBannerInjector
                .on('body', new TopBannerInjector(CUSTOM_CONFIG)) 
                .on('body', new WechatPopupInjector(CUSTOM_CONFIG.WECHAT_QR_CODE_URL)) 
                
                // 🔥 【新增】在安装弹窗内植入公众号广告
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

        const modifiedHeaders = new Headers(modifiedResponse.headers);
        modifiedHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
        modifiedHeaders.set('Pragma', 'no-cache');
        modifiedHeaders.set('Expires', '0');
        modifiedHeaders.set('Access-Control-Allow-Origin', '*');
        modifiedHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        modifiedHeaders.set('Access-Control-Allow-Headers', '*');

        ['Content-Security-Policy', 'X-Frame-Options', 'X-XSS-Protection', 'X-Content-Type-Options'].forEach(header => {
            modifiedHeaders.delete(header);
        });
        
        modifiedHeaders.set('X-Proxy-By', 'Cloudflare-Workers-Optimized');
        ['Transfer-Encoding', 'Connection', 'X-Runtime', 'X-Request-Id'].forEach(header => {
            modifiedHeaders.delete(header);
        });

        return new Response(modifiedResponse.body, {
            status: modifiedResponse.status,
            statusText: modifiedResponse.statusText,
            headers: modifiedHeaders
        });

    } catch (error) {
        return new Response(`
            <!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>${CUSTOM_CONFIG.SITE_TITLE} - 访问失败</title>
            <style>body{font-family:Arial,sans-serif;text-align:center;padding:50px}.error-container{max-width:600px;margin:0 auto}.error-code{font-size:48px;color:#dc3545}.error-message{font-size:24px;margin:20px 0}</style>
            </head><body><div class="error-container"><div class="error-code">503</div><div class="error-message">服务暂时不可用</div><p>错误信息：${error.message}</p><p>请检查网络连接或稍后重试</p></div></body></html>
        `, { status: 503, headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
    }
}

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});
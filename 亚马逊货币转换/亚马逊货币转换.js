// ==UserScript==
// @name         亚马逊货币转换
// @namespace    http://tampermonkey.net
// @version      0.1
// @description  亚马逊汇率助手：将当前亚马逊页面的货币转换为“元”“美元”、“日元”等
// @author       小张 | 个人博客：https://blog.z-l.top | 公众号“爱吃馍” | 设计导航站 ：https://dh.z-l.top | quicker账号昵称：星河城野❤
// @match        https://*.amazon.com/*
// @match        https://*.amazon.co.jp/*
// @match        https://*.amazon.co.uk/*
// @match        https://*.amazon.de/*
// @match        https://*.amazon.fr/*
// @match        https://*.amazon.it/*
// @match        https://*.amazon.es/*
// @match        https://*.amazon.ca/*
// @match        https://*.amazon.com.au/*
// @match        https://*.amazon.com.br/*
// @match        https://*.amazon.com.mx/*
// @match        https://*.amazon.nl/*
// @match        https://*.amazon.se/*
// @match        https://*.amazon.sg/*
// @match        https://*.amazon.ae/*
// @match        https://*.amazon.sa/*
// @match        https://*.amazon.pl/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_clipboard
// @require      https://cdn.tailwindcss.com
// @require      https://code.jquery.com/jquery-3.6.4.min.js
// @connect      api.frankfurter.app
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // ================= 0. 配置与样式注入 =================

    const tailwindConfig = document.createElement('script');
    tailwindConfig.innerHTML = `
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        ios: {
                            blue: '#007AFF',
                            text: '#000000',
                            textSec: '#6e6e73',
                        }
                    },
                    fontFamily: {
                        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
                    },
                    boxShadow: {
                        'glass': '0 20px 50px rgba(0,0,0,0.15)',
                    }
                }
            }
        }
    `;
    document.head.appendChild(tailwindConfig);

    $('<style>').text(`
        /* iOS 毛玻璃面板 */
        .ios-glass-panel {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(30px);
            -webkit-backdrop-filter: blur(30px);
            border: 1px solid rgba(255, 255, 255, 0.5);
            box-shadow: 0 25px 60px rgba(0,0,0,0.2);
        }

        /* 价格标签样式 */
        .ios-price-tag {
            display: inline-flex;
            align-items: center;
            background: #ffffff;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 2px 3px 2px 10px;
            margin: 2px 0 0 6px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            font-family: system-ui, sans-serif;
            line-height: 1;
        }

        /* 极简输入框：去除默认轮廓 */
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }

        /* 动画 */
        .pop-in { animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        @keyframes popIn {
            from { opacity: 0; transform: scale(0.9) translateY(20px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }
    `).appendTo('head');

    // ================= 1. 数据配置 (汉化版) =================
    const CONFIG = {
        defaultTarget: 'CNY',
        cacheTime: 1000 * 60 * 60 * 2
    };

    // 增加了 unit 字段，用于显示中文单位
    const CURRENCIES = [
        { code: 'CNY', unit: '元', flag: '🇨🇳' },
        { code: 'USD', unit: '美元', flag: '🇺🇸' },
        { code: 'JPY', unit: '日元', flag: '🇯🇵' },
        { code: 'EUR', unit: '欧元', flag: '🇪🇺' },
        { code: 'GBP', unit: '英镑', flag: '🇬🇧' },
        { code: 'HKD', unit: '港币', flag: '🇭🇰' },
        { code: 'TWD', unit: '台币', flag: '🇹🇼' },
        { code: 'CAD', unit: '加元', flag: '🇨🇦' },
        { code: 'AUD', unit: '澳元', flag: '🇦🇺' },
        { code: 'KRW', unit: '韩元', flag: '🇰🇷' },
        { code: 'SGD', unit: '新币', flag: '🇸🇬' },
    ];

    const TLD_MAP = {
        'co.jp': 'JPY', 'jp': 'JPY', 'com': 'USD', 'us': 'USD', 'co.uk': 'GBP', 'uk': 'GBP',
        'de': 'EUR', 'fr': 'EUR', 'it': 'EUR', 'es': 'EUR', 'nl': 'EUR', 'pl': 'PLN',
        'ca': 'CAD', 'com.au': 'AUD', 'com.br': 'BRL', 'com.mx': 'MXN', 'se': 'SEK', 'sg': 'SGD'
    };

    let state = {
        pageBase: detectBaseCurrency(),
        pageTarget: GM_getValue('targetCurrency', CONFIG.defaultTarget),
        rates: {},
        isOpen: false
    };

    function detectBaseCurrency() {
        const host = window.location.hostname;
        for (let tld in TLD_MAP) if (host.endsWith(tld)) return TLD_MAP[tld];
        return 'USD';
    }

    function getUnit(code) {
        const c = CURRENCIES.find(x => x.code === code);
        return c ? c.unit : code;
    }

    function getFlag(code) {
        const c = CURRENCIES.find(x => x.code === code);
        return c ? c.flag : '🌐';
    }

    async function fetchRates(base) {
        return new Promise((resolve) => {
            const cacheKey = `ios_v14_${base}`;
            const cached = GM_getValue(cacheKey);
            if (cached) {
                const data = JSON.parse(cached);
                if (Date.now() - data.timestamp < CONFIG.cacheTime) {
                    state.rates[base] = data.rates;
                    resolve(data.rates);
                    return;
                }
            }
            GM_xmlhttpRequest({
                method: "GET",
                url: `https://api.frankfurter.app/latest?from=${base}`,
                onload: function(response) {
                    try {
                        const res = JSON.parse(response.responseText);
                        res.rates[base] = 1.0;
                        state.rates[base] = res.rates;
                        GM_setValue(cacheKey, JSON.stringify({ rates: res.rates, timestamp: Date.now() }));
                        resolve(res.rates);
                    } catch(e) { resolve(null); }
                }
            });
        });
    }

    // ================= 2. 价格标签 (汉字单位) =================
    function scanAndInject() {
        const rates = state.rates[state.pageBase];
        if (!rates) return;
        const rate = rates[state.pageTarget];
        if (!rate) return;

        const selectors = ['.a-price', '.a-color-price', '.priceToPay', '#price_inside_buybox'];
        $(selectors.join(',')).each(function() {
            const $el = $(this);
            if ($el.attr('data-ios-done') === state.pageTarget) return;

            const whole = $el.find('.a-price-whole').text().replace(/[^\d]/g, '');
            let frac = $el.find('.a-price-fraction').text().replace(/[^\d]/g, '');
            if (!frac) frac = '00';
            if (!whole) return;

            const val = parseFloat(`${whole}.${frac}`) * rate;
            const numStr = val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const unitStr = getUnit(state.pageTarget);

            $el.find('.ios-price-tag').remove();

            // 标签：使用汉字单位
            const $tag = $(`
                <div class="ios-price-tag">
                    <span style="font-size: 16px; font-weight: bold; margin-right: 4px; color: #999;">≈</span>
                    <span style="font-size: 18px; font-weight: 800; color: #000;">${numStr}</span>
                    <span style="font-size: 13px; font-weight: 600; margin-left: 6px; background: #007AFF; color: white; border-radius: 4px; padding:6px;">${unitStr}</span>
                </div>
            `);

            $el.append($tag);
            $el.attr('data-ios-done', state.pageTarget);
        });
    }

    // ================= 3. 构建 UI (去壳极简版) =================

    function createUI() {
        const $root = $('<div id="ios-root"></div>').appendTo('body');

        // 1. 悬浮按钮
        const $fab = $(`
            <div class="fixed bottom-10 right-10 z-[9000] group cursor-pointer">
                <div class="w-16 h-16 bg-white/90 backdrop-blur-md rounded-full shadow-glass border border-white flex items-center justify-center transition-all duration-300 hover:scale-110" style="box-shadow: 1px 1px 16px 0px #ececec;">
                    <span class="text-3xl filter drop-shadow-sm">${getFlag(state.pageTarget)}</span>
                </div>
            </div>
        `).appendTo($root);

        // 2. 主面板
        const $panel = $(`
            <div id="ios-panel" class="fixed bottom-32 right-10 z-[9001] w-[360px] ios-glass-panel rounded-[28px] p-6 hidden transform origin-bottom-right transition-all box-border text-black">

                <!-- 顶部栏 -->
                <div class="flex items-center justify-between mb-8">
                    <div>
                        <h2 class="text-2xl font-bold tracking-tight">汇率助手</h2>
                        <div class="flex items-center text-sm font-semibold text-gray-500 mt-1">
                            <span>${getUnit(state.pageBase)}</span>
                            <span class="mx-2">→</span>
                            <span class="text-ios-blue">${getUnit(state.pageTarget)}</span>
                        </div>
                    </div>
                    <button id="btn-close" class="w-10 h-10 bg-black/5 rounded-full text-black/50 hover:bg-black/10 flex items-center justify-center font-bold text-xl transition-colors">✕</button>
                </div>

                <!-- 计算器区域：无外壳、无背景、纯文字悬浮 -->
                <div class="w-full box-border mb-8 px-2">
                    <!-- 输入行 -->
                    <div class="flex items-baseline w-full mb-1">
                        <input id="ios-in" type="number" value="1" class="flex-1 bg-transparent text-4xl font-bold text-black outline-none placeholder-gray-300 text-left !p-0 m-0 !border-none w-full" placeholder="0">
                        <span class="text-xl font-bold text-gray-400 ml-2 whitespace-nowrap">${getUnit(state.pageBase)}</span>
                    </div>

                    <!-- 分割线 (极淡) -->
                    <div class="w-full h-[1px] bg-black/5 my-4"></div>

                    <!-- 结果行 -->
                    <div class="flex items-baseline justify-between w-full">
                         <div id="ios-out" class="text-4xl font-bold text-ios-blue break-all text-left">...</div>
                         <span class="text-xl font-bold text-ios-blue ml-2 whitespace-nowrap">${getUnit(state.pageTarget)}</span>
                    </div>
                </div>

                <!-- 货币选择 -->
                <div class="w-full">
                    <div class="text-xs font-bold text-gray-400 uppercase mb-4 tracking-wider">切换目标货币</div>
                    <div class="grid grid-cols-4 gap-3 w-full" id="ios-grid">
                        <!-- JS 生成图标 -->
                    </div>
                </div>

            </div>
        `).appendTo($root);

        // 生成货币图标
        const $grid = $('#ios-grid');
        CURRENCIES.forEach(c => {
            const isActive = c.code === state.pageTarget;
            const activeClass = 'bg-black text-white shadow-xl scale-105';
            const normalClass = 'bg-white/60 text-black hover:bg-white hover:shadow-md';

            $(`<div class="flex flex-col items-center justify-center h-20 rounded-2xl cursor-pointer transition-all duration-200 ${isActive ? activeClass : normalClass}">
                <span class="text-2xl mb-1">${c.flag}</span>
                <span class="text-xs font-bold tracking-wide">${c.unit}</span>
               </div>`)
            .on('click', () => {
                if(c.code === state.pageTarget) return;
                GM_setValue('targetCurrency', c.code);
                location.reload();
            })
            .appendTo($grid);
        });

        // 交互绑定
        $fab.on('click', () => {
            state.isOpen = !state.isOpen;
            if(state.isOpen) {
                $panel.removeClass('hidden').addClass('pop-in');
            } else {
                $panel.addClass('hidden').removeClass('pop-in');
            }
        });

        $('#btn-close').on('click', () => {
            state.isOpen = false;
            $panel.addClass('hidden');
        });

        $('#ios-in').on('input', updateCalc);
        updateCalc();
    }

    function updateCalc() {
        const amount = parseFloat($('#ios-in').val()) || 0;
        const rates = state.rates[state.pageBase];
        if(!rates) return;
        const rate = rates[state.pageTarget];
        const res = amount * rate;
        $('#ios-out').text(res.toFixed(2));
    }

    function getUnit(code) {
        const c = CURRENCIES.find(x => x.code === code);
        return c ? c.unit : code;
    }

    function getFlag(code) {
        const c = CURRENCIES.find(x => x.code === code);
        return c ? c.flag : '🌐';
    }

    // ================= 4. 启动 =================
    async function init() {
        await fetchRates(state.pageBase);
        createUI();
        scanAndInject();

        const observer = new MutationObserver((mutations) => {
            let update = false;
            for(let m of mutations) if(m.addedNodes.length) update = true;
            if(update) scanAndInject();
        });
        observer.observe(document.body, {childList:true, subtree:true});
    }

    init();

})();

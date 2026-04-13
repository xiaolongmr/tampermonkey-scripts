// ==UserScript==
// @name         花瓣"去"水印-pro 1.1.3
// @version      1.1.3
// @description  主要功能：1.显示花瓣真假PNG（原理：脚本通过给花瓣图片添加背景色，显示出透明PNG图片，透出背景色的即为透明PNG，非透明PNG就会被过滤掉） 2.通过自定义修改背景色，区分VIP素材和免费素材。更多描述可安装后查看
// @author       小张 | 个人博客：https://blog.z-l.top | 公众号“爱吃馍” | 设计导航站 ：https://dh.z-l.top | quicker账号昵称：星河城野❤
// @license      GPL-3.0
// @namespace    https://getquicker.net/User/Actions/388875-%E6%98%9F%E6%B2%B3%E5%9F%8E%E9%87%8E%E2%9D%A4
// @match        https://huaban.com/*
// @match        http://121.40.25.9:8080/register.html
// @connect      gd.huaban.com
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @connect      *
// @grant        GM_download
// @run-at       document-end
// @icon         https://st0.dancf.com/static/02/202306090204-51f4.png
// @require      https://cdn.tailwindcss.com
// @require      https://cdn.jsdelivr.net/gh/xiaolongmr/tampermonkey-scripts/%E8%8A%B1%E7%93%A3%E5%8E%BB%E6%B0%B4%E5%8D%B0/%E8%8A%B1%E7%93%A3%E2%80%9C%E5%8E%BB%E2%80%9D%E6%B0%B4%E5%8D%B0Pro%E6%9B%B4%E6%96%B0%E6%8F%90%E7%A4%BA%E8%84%9A%E6%9C%AC.js
// @require      https://cdn.jsdelivr.net/gh/xiaolongmr/tampermonkey-scripts@09ee56b513ba1a42a4d0257c69a332d0a91aba77/%E7%BD%91%E7%AB%99%E6%B3%A8%E5%86%8C%E8%87%AA%E5%8A%A8%E5%A1%AB%E5%86%99%E8%A1%A8%E5%8D%95%E4%BF%A1%E6%81%AF/%E7%BD%91%E7%AB%99%E6%B3%A8%E5%86%8C%E8%87%AA%E5%8A%A8%E5%A1%AB%E5%86%99%E8%A1%A8%E5%8D%95%E4%BF%A1%E6%81%AF.js
// ==/UserScript==

(function () {
  "use strict";

  // ==================== 通用函数 ====================
  function showToast(text, isHtml = false) {
    const toast = document.createElement("div");
    toast.innerHTML = isHtml ? text : text;
    toast.style.cssText = `position:fixed; top:-50px; left:50%; transform:translateX(-50%) translateY(0); background:#00c853; color:#fff; padding:8px 20px; border-radius:50px; z-index:2147483647; font-size:13px; font-weight:bold; border:1px solid rgba(255,255,255,0.3); box-shadow:0 4px 15px rgba(0,200,83,0.4);`;
    const style = document.createElement("style");
    style.textContent = `
      @keyframes toastIn { 0%{top:-50px;transform:translateX(-50%) scale(0.8);opacity:0} 60%{top:25px;transform:translateX(-50%) scale(1.05)} 80%{top:15px;transform:translateX(-50%) scale(0.98)} 100%{top:20px;transform:translateX(-50%) scale(1);opacity:1} }
      @keyframes toastOut { 0%{top:20px;transform:translateX(-50%) scale(1);opacity:1} 100%{top:-50px;transform:translateX(-50%) scale(0.8);opacity:0} }
    `;
    document.head.appendChild(style);
    toast.style.animation = "toastIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards";
    if (isHtml) {
      toast.style.whiteSpace = "nowrap";
      toast.style.pointerEvents = "auto";
      toast.style.cursor = "pointer";
    }
    document.body.appendChild(toast);
    const duration = isHtml ? 4000 : 1200;
    setTimeout(() => {
      toast.style.animation = "toastOut 0.3s ease-in forwards";
      setTimeout(() => { toast.remove(); style.remove(); }, 300);
    }, duration);
  }

  // ==================== 常量定义 ====================

  // 时间配置（毫秒）
  const TIMING = {
    debounceWatermark: 200, // 去水印操作的防抖延迟
    watermarkCheckInterval: 2000, // 水印检测间隔
    minProcessInterval: 500, // 最小处理间隔
    switchTransition: 1000, // 开关状态变化反馈时长
  };

  // 设置面板背景图片
  const SETTINGS_BG_IMAGES = {
    left: 'https://cdn.h5ds.com/space/files/600972551685382144/20260405/965244304316362752.png',
    right: 'https://cdn.h5ds.com/space/files/600972551685382144/20260405/965244228593389568.png',
  };

  // DOM 选择器
  const SELECTORS = {
    // 花瓣网中的"查看大图"按钮图片
    imageButton:
      'img[data-button-name="查看大图"]',
    // 图片查看器中的大图元素
    imageViewer:
      'img.vYzIMzy2[alt="查看图片"]',
    // 图片查看器容器内的大图元素
    imageViewerContainer:
      '#imageViewerWrapper img.vYzIMzy2[alt="查看图片"]',
    // 简单图片查看器中的大图元素
    imageViewerSimple: 'img.vYzIMzy2[alt="查看图片"]',
  };

  // 默认配置
  const DEFAULT_CONFIG = {
    materialColor: "#ffe0e0",
    // 花瓣官方素材：淡红色
    userColor: "#ebffff",
    // 用户上传：粉蓝色
    enableCustom: true,
    // 启用自定义背景色
    enableDragDownload: true,
    // 启用拖拽下载功能
    enableRightClickDownload: true,
    // 启用右键下载功能
    enableRemoveWatermark: true,
    // 启用去水印功能
    enableHideSettingsButton: false,
    // 隐藏蜡笔小新设置按钮
  };

  // 配置字段映射（简化 getConfig/saveConfig）
  const CONFIG_KEYS = [
    "materialColor",
    "userColor",
    "enableCustom",
    "enableDragDownload",
    "enableRightClickDownload",
    "enableRemoveWatermark",
    "enableHideSettingsButton",
  ];

  // ==================== 状态变量 ====================

  // 状态变量：跟踪Ctrl+V/Cmd+V的使用状态
  let isImageSearchMode = false;

  // ==================== 工具函数 ====================

  function debugLog() {
    /* no-op */
  }

  // 获取脚本版本号
  const getScriptVersion = () => {
    try {
      return GM_info?.script?.version || "未知";
    } catch (e) {
      return "未知";
    }
  };

  // 颜色验证
  function isValidColor(color) {
    const hexRegex = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i;
    const rgbRegex =
      /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;
    return hexRegex.test(color) || rgbRegex.test(color);
  }

  // 获取清理后的文件名（移除后缀参数，使用PNG扩展名）
  // 根据alt属性或span标签生成文件名，如果没有则使用默认文件名
  function getFileNameFromAlt(img) {
    // 仅使用alt属性生成文件名
    const altText = img.alt || "";

    // 如果alt属性有内容且不是默认的"查看图片"，则使用alt作为文件名
    if (altText && altText.trim() && altText !== "查看图片") {
      // 清理alt文本，移除特殊字符，只保留字母、数字、中文和空格
      let cleanAlt = altText.replace(/[^\w\u4e00-\u9fa5\s]/g, "").trim();

      // 如果清理后的文本不为空，则使用alt作为文件名
      if (cleanAlt) {
        // 限制文件名长度，避免过长
        if (cleanAlt.length > 40) {
          cleanAlt = cleanAlt.substring(0, 40);
        }

        return cleanAlt;
      }
    }

    // 如果alt属性无效，返回默认名称
    return "花瓣图片";
  }

  // 检查快捷键是否匹配
  const isHotkeyMatch = (e, hotkeyConfig) => {
    if (!hotkeyConfig) return false;
    const ctrlCmd = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;
    const alt = e.altKey;
    const key = e.key.toLowerCase();

    return (
      ctrlCmd === hotkeyConfig.ctrlCmd &&
      shift === hotkeyConfig.shift &&
      alt === hotkeyConfig.alt &&
      key === hotkeyConfig.key
    );
  };

  // ==================== 配置相关 ====================

  // 获取配置 - 使用配置字段映射简化代码
  function getConfig() {
    const result = {};
    CONFIG_KEYS.forEach((key) => {
      result[key] = GM_getValue(key, DEFAULT_CONFIG[key]);
    });
    return result;
  }

  // 保存配置 - 使用配置字段映射简化代码
  function saveConfig(config) {
    CONFIG_KEYS.forEach((key) => {
      if (key in config) {
        GM_setValue(key, config[key]);
      }
    });
  }

  // 默认快捷键配置
  const DEFAULT_HOTKEYS = {
    searchFocus: {
      ctrlCmd: true,
      shift: false,
      alt: false,
      key: "k",
      description: "定位到搜索框",
    },
    imageSearch: {
      ctrlCmd: true,
      shift: false,
      alt: false,
      key: "p",
      description: "以图搜索功能",
    },
    openSettings: {
      ctrlCmd: true,
      shift: false,
      alt: false,
      key: ",",
      description: "打开设置界面",
    },
  };

  // 获取快捷键配置
  const getHotkeysConfig = () => {
    return typeof GM_getValue === "function"
      ? GM_getValue("hotkeysConfig", DEFAULT_HOTKEYS)
      : DEFAULT_HOTKEYS;
  };

  // ==================== 样式应用 ====================

  // 应用样式
  function applyStyles() {
    const config = getConfig();

    // 移除旧样式
    const oldStyle = document.getElementById("huaban-bg-style");
    if (oldStyle) oldStyle.remove();

    // 添加动画效果CSS
    const style = document.createElement("style");
    style.id = "huaban-bg-style";
    style.textContent = `

            /* 花瓣素材 背景色 */
            [data-material-id] img.transparent-img-bg,
            [data-material-id] img.transparent-img-black-bg {
                background-color: ${config.enableCustom ? config.materialColor : "transparent"} !important;
                ${config.enableCustom ? "background-image:none!important;" : ""}
            }

            /* 用户上传背景色 */
            .KKIUywzb:not([data-material-id]) img.transparent-img-bg,
            .KKIUywzb:not([data-material-id]) img.transparent-img-black-bg {
                background-color: ${config.enableCustom ? config.userColor : "transparent"} !important;
                ${config.enableCustom ? "background-image:none!important;" : ""}
            }
            
            /* 搜索框聚焦时的样式 - 仅在使用快捷键时触发 */
            [data-button-name="搜索框"].hb-search-focused:before {
                background: rgba(255, 40, 75, 0.3) !important;
            }
            

          /* antd弹出层样式宽度，花瓣采集框 */
           .ant-popover {
             min-width: 540px!important;
             }

          /* 下面是：花瓣添加到花瓣，画板列表元素 */
          .z8_k0U12 .JYXx0SF7 .__0nq08tOH {
              display: grid;
              grid-template-columns: repeat(2, minmax(0px, 1fr));
              height: auto!important;
              max-height: 300px;
          }
      
          /* 个人信息面板样式 */
          .user-profile { max-width: 800px; margin: 0 auto; }
          .profile-header { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
          .avatar { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .profile-info h3 { margin: 0 0 10px; font-size: 24px; color: #333; }
          .profile-info .job { color: #666; margin: 0 0 5px; }
          .profile-info .joined { color: #999; font-size: 14px; }
          .profile-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; }
          .stat-item { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-value { display: block; font-size: 28px; font-weight: bold; color: #333; margin-bottom: 5px; }
          .stat-label { color: #666; font-size: 14px; }
          .loading { text-align: center; padding: 40px 0; color: #666; }
          .error-message { color: #dc3545; padding: 20px; text-align: center; background: #f8d7da; border-radius: 4px; }
        `;
    document.head.appendChild(style);
  }

  // ==================== 图片处理 ====================



  // ==================== 页面元素处理 ====================

  // 加载素材网站列表数据（异步）
  // 实现CDN加载和缓存机制
  async function loadMaterialSites() {
    // 1. 检查缓存
    const cacheKey = 'materialSitesCache';
    const cacheExpiryKey = 'materialSitesCacheExpiry';
    const cachedData = GM_getValue(cacheKey, null);
    const cacheExpiry = GM_getValue(cacheExpiryKey, 0);
    const now = Date.now();
    const cacheDuration = 24 * 60 * 60 * 1000; // 24小时

    // 2. 缓存有效直接返回
    if (cachedData && now < cacheExpiry) {
      debugLog('使用缓存的素材网站数据');
      return cachedData;
    }

    // 3. 缓存失效，从CDN加载
    try {
      debugLog('从CDN加载素材网站数据');
      const response = await fetch('https://cdn.jsdelivr.net/gh/xiaolongmr/tampermonkey-scripts/花瓣去水印/素材网.json');
      const data = await response.json();

      // 4. 更新缓存
      GM_setValue(cacheKey, data);
      GM_setValue(cacheExpiryKey, now + cacheDuration);
      debugLog('素材网站数据已缓存');

      return data;
    } catch (error) {
      console.error('加载素材网站列表失败:', error);
      throw error;
    }
  }

  // 创建单个素材网站项
  function createSiteItem(site) {
    const siteItem = document.createElement("a");
    siteItem.href = site.href;
    siteItem.target = "_blank";
    siteItem.rel = "noopener noreferrer";
    siteItem.className = "flex items-center gap-2 p-3 border rounded-md hover:bg-slate-50 transition-colors text-sm";

    // 网站Logo
    const siteLogo = document.createElement("img");
    siteLogo.src = site.logoSrc;
    siteLogo.alt = site.alt;
    siteLogo.className = "w-6 h-6 object-contain";
    siteLogo.referrerPolicy = "no-referrer";

    // 网站信息容器
    const siteInfo = document.createElement("div");
    siteInfo.className = "flex-1 min-w-0";

    // 网站标题
    const siteTitle = document.createElement("div");
    siteTitle.className = "font-medium text-slate-700 truncate";
    siteTitle.textContent = site.title;

    // 网站描述
    const siteTip = document.createElement("div");
    siteTip.className = "text-xs text-slate-500 truncate";
    siteTip.textContent = site.tip;

    // 积分提示
    const sitePoints = document.createElement("div");
    sitePoints.className = "text-xs text-amber-600";
    sitePoints.textContent = site.jifen_tip;

    // 组装网站信息
    siteInfo.appendChild(siteTitle);
    siteInfo.appendChild(siteTip);

    // 组装网站项
    siteItem.appendChild(siteLogo);
    siteItem.appendChild(siteInfo);
    siteItem.appendChild(sitePoints);

    return siteItem;
  }

  // 创建素材网站列表容器
  function createMaterialSitesContainer() {
    const container = document.createElement("div");
    container.id = "material-sites-container";
    container.className = "bg-white rounded-lg p-4 mb-4";

    // 创建标题
    const title = document.createElement("h3");
    title.className = "text-lg font-medium text-slate-700 mb-3";
    title.textContent = "素材网站推荐";
    container.appendChild(title);

    return container;
  }

  // 添加文案信息
  function addInfoText(container) {
    const infoText = document.createElement("div");
    infoText.className = "mt-4 p-4 bg-slate-50 rounded-lg text-sm text-slate-700 border border-slate-200";
    infoText.innerHTML = '以上网站使用 <a href="http://121.40.25.9:8080" target="_blank" class="text-blue-500 hover:underline">http://www.sucaifeng.com</a> 网站 购买积分进行下载，你也可以注册一下，邀请码：1474728874 使用邀请码注册，我们都能得到1000积分，就可以给更多朋友下载素材，<br>如果可以的话,求求给公众号的文章点点广告，每天都可以点的，这样我会有更新的动力，也可以购买一些AI作图的接口，比如nano banana gemini等绘画的功能加入这个脚本供大家免费使用';
    container.appendChild(infoText);
  }

  // 在素材页面渲染素材网站列表
  async function renderMaterialSitesOnSucaiPage() {
    // 检查当前是否在指定页面
    if (window.location.href !== "https://huaban.com/pages/sucai") {
      return;
    }

    const layoutContent = document.getElementById("layout-content");
    if (!layoutContent) {
      return;
    }

    // 检查是否已经渲染过，避免重复创建
    if (document.getElementById("material-sites-container")) {
      return;
    }

    // 隐藏原有内容
    Array.from(layoutContent.children).forEach((child) => {
      child.style.display = "none";
    });

    // 创建容器和列表
    const materialSitesContainer = createMaterialSitesContainer();
    const sitesList = document.createElement("div");
    sitesList.className = "grid grid-cols-5 gap-3 overflow-auto";

    // 渲染素材网站列表
    try {
      // 从CDN或缓存加载数据
      const materialSites = await loadMaterialSites();

      // 创建并添加所有网站项
      materialSites.forEach((site) => {
        const siteItem = createSiteItem(site);
        sitesList.appendChild(siteItem);
      });
    } catch (error) {
      console.error("渲染素材网站列表失败:", error);
      sitesList.innerHTML = `<div class="col-span-3 text-center text-slate-500 py-4">无法加载素材网站列表</div>`;
    }

    // 组装并添加到页面
    materialSitesContainer.appendChild(sitesList);
    addInfoText(materialSitesContainer);
    layoutContent.insertBefore(materialSitesContainer, layoutContent.firstChild);
  }

  // ==================== 事件监听 ====================

  // 增强的页面变化监听，支持AJAX动态加载
  function observePageChanges() {
    const observer = new MutationObserver((mutations) => {
      // 检查是否有新的内容被添加
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              // 元素节点
              // 可以在这里添加其他需要的DOM变化处理逻辑
            }
          });
        }
      });
    });

    // 观察选项
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    debugLog("页面变化监听器已启动");
    return observer;
  }

  // ==================== Hover操作面板功能 ====================

  const HOVER_PANEL_STYLE = `
    .hover-img-container {
      position: relative !important;
      display: inline-block !important;
    }
    .hover-action-panel,
    .img-size-text {
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    }
    .hover-action-panel.show,
    .img-size-text.show {
      opacity: 1;
      pointer-events: auto;
    }
    .hover-action-panel {
      position: absolute;
      bottom: 6px;
      right: 6px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      z-index: 99999;
    }
    .hover-action-panel button {
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.85);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    color: black;
    align-items: center;
    padding: 7px;
    transition: transform 0.15s, background 0.15s, box-shadow 0.15s;
    }
    .hover-action-panel button:hover {
      background: rgba(255, 255, 255, 1);
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    }
    .hover-action-panel button:active {
      transform: scale(0.95);
    }
    .hover-action-panel .ps-btn {
      background: transparent;
      padding: 0;
      box-shadow: none;
    }
    .img-size-text {
      position: absolute;
      bottom: 6px;
      left: 6px;
      padding: 6px 12px;
      z-index: 9999;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.85);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(5px);
      font-size: 12px;
      color: black;
    }
  `;

  function createHoverPanel(imgElement) {
    const parent = imgElement.parentElement;
    if (!parent || parent.querySelector(".hover-action-panel")) return;

    parent.classList.add("hover-img-container");
    const panel = document.createElement("div");
    panel.className = "hover-action-panel";
    panel.innerHTML = `<button class="copy-btn"><svg width="1em" height="1em" fill="currentColor"><use xlink:href="#style"></use></svg></button><button class="download-btn"><svg width="1em" height="1em" fill="currentColor"><use xlink:href="#hb_download"></use></svg></button><button class="ps-btn"><img src="https://gd-hbimg-edge.huaban.com/8ea3a98066d2253e33315d747b9f5977cca2e29a4930f-5I1sE2_fw658webp?auth_key=1776024000-3cb0287b085f47fd8d86e234003a2fa2-0-ea9dfa59cc3762bff239d20b4536e5b6" alt="PS" style="width:30px"></button>`;
    parent.after(panel);

    // 获取原图尺寸
    let sizeUpdated = false;
    const updateSize = () => {
      if (sizeUpdated) return;
      sizeUpdated = true;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (img.naturalWidth > 0) {
          const sizeText = document.createElement("span");
          sizeText.className = "img-size-text";
          sizeText.textContent = `${img.naturalWidth} x ${img.naturalHeight}px`;
          parent.after(sizeText);
        }
      };
      img.src = processImageUrl(imgElement.dataset.originalSrc || imgElement.src);
    };
    imgElement.complete ? updateSize() : imgElement.addEventListener("load", updateSize);

    // hover事件
    let hoverTimeout;
    const show = () => {
      clearTimeout(hoverTimeout);
      panel.classList.add("show");
      const sizeText = parent.nextElementSibling;
      sizeText?.classList.add("show");
    };
    const hide = () => {
      hoverTimeout = setTimeout(() => {
        panel.classList.remove("show");
        const sizeText = parent.nextElementSibling;
        sizeText?.classList.remove("show");
      }, 100);
    };
    parent.addEventListener("mouseenter", show);
    parent.addEventListener("mouseleave", hide);
    panel.addEventListener("mouseenter", show);
    panel.addEventListener("mouseleave", hide);

    // 获取原图URL
    const getOriginalUrl = () => processImageUrl(imgElement.dataset.originalSrc || imgElement.src);

    // 复制按钮 - Canvas方式复制图片
    panel.querySelector(".copy-btn").addEventListener("click", async e => {
      e.stopPropagation();
      const url = getOriginalUrl();
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(async blob => {
          if (blob) {
            await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
            showToast("图片已复制");
          }
        });
      } catch (err) {
        await navigator.clipboard.writeText(url);
        showToast("图片URL已复制");
      }
    });

    // 下载按钮
    panel.querySelector(".download-btn").addEventListener("click", e => {
      e.stopPropagation();
      const url = getOriginalUrl();
      const fileName = getFileNameFromAlt(imgElement) + ".png";
      if (typeof GM_download === "function") {
        GM_download({ url, name: fileName });
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
      }
    });

    // PS导入按钮 - Ctrl点击新建文件导入
    panel.querySelector(".ps-btn").addEventListener("click", async e => {
      e.stopPropagation();
      const url = getOriginalUrl();
      const name = getFileNameFromAlt(imgElement);
      const isNewDoc = e.ctrlKey || e.metaKey;
      const clipboardStr = `PS_IMPORTER:${url}|||${name}${isNewDoc ? "|||NEW_DOC" : ""}`;
      try { GM_setClipboard(clipboardStr); } catch { await navigator.clipboard.writeText(clipboardStr); }
      showToast(isNewDoc ? "已发送至PS (新建文件)" : '已发送至PS <a href="https://mp.weixin.qq.com/s/TvPs50dl-RpO8LGNkobuYg" target="_blank" style="color:#fff;text-decoration:underline;pointer-events:auto;">(需安装图片导导插件)</a>', isNewDoc ? false : true);
    });
  }

  function initImageHover() {
    document.head.insertAdjacentHTML("beforeend", `<style>${HOVER_PANEL_STYLE}</style>`);

    const processImage = img => {
      const parent = img.closest("[data-material-id]") || img.closest(".KKIUywzb");
      if (parent && !parent.querySelector(".hover-action-panel")) createHoverPanel(img);
    };

    new MutationObserver(m => m.forEach(n => n.addedNodes.forEach(node => {
      if (node.nodeType !== 1) return;
      if (node.tagName === "IMG") processImage(node);
      node.querySelectorAll?.("img").forEach(processImage);
    }))).observe(document.body, { childList: true, subtree: true });

    document.querySelectorAll("img").forEach(processImage);
  }

  // 处理图片URL，删除_fwXXXwebp部分
  function processImageUrl(url) {
    let cleanUrl = url;
    // 匹配_fw后跟数字和webp的模式
    const fwRegex = /_fw\d+webp/;
    if (fwRegex.test(cleanUrl)) {
      cleanUrl = cleanUrl.replace(fwRegex, "");
      debugLog("处理后的下载URL:", url, "→", cleanUrl);
    }
    return cleanUrl;
  }

  // 去水印相关功能
  // 缓存高清URL，避免重复请求
  const hdUrlCache = new Map();

  // 目标图片/视频选择器（主展示区和弹出层）
  const TARGET_SELECTORS = ['.OPWXbLYw img', '.Wa6mMsQV img', '.vYzIMzy2 img', '.VFtkdxbR img', '.ujZSLFrU video', '.PBVOckbr img'];

  // 处理页面更新：提取ID，请求或替换高清图片
  function handleUpdate() {
    const config = getConfig();
    if (!config.enableRemoveWatermark) return;

    // 查找包含ID的父级div元素，支持新旧版本选择器，前面是旧版花瓣和面是新版花瓣（写给自己看的：id所在元素是span,其父级是div）
    const sourceDiv = document.querySelector('.__2p__B98x, .QzLweiwl');
    if (!sourceDiv) return;

    // 提取ID
    const match = sourceDiv.innerText.match(/ID[:：]\s*(\d+)/i);
    if (!match) return;

    const id = match[1];
    const cachedUrl = hdUrlCache.get(id);

    // 如果正在加载或已有缓存，直接返回或替换
    if (cachedUrl === "loading") return;
    if (cachedUrl) {
      // 只有type为image时才替换高清图片
      if (cachedUrl.type === 'image') {
        executeReplacement(cachedUrl.url);
      }
      // 尺寸信息和下载按钮不受type影响，始终显示
      if (cachedUrl.width && cachedUrl.height) {
        showSizeInfo(cachedUrl.width, cachedUrl.height, cachedUrl.dpi, cachedUrl.url, cachedUrl.file_format, cachedUrl.content_url, cachedUrl.type, cachedUrl.title);
      }
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
              const file_format = ssrData.files[0].file_format;
              const content_url = ssrData.content_url;
              const hdUrl = ssrData.preview.url;
              const video = ssrData.preview.video;
              const title = ssrData.title;
              const width = ssrData.preview.width;
              const height = ssrData.preview.height;
              const dpi = ssrData.dpi;
              const type = ssrData.type;
              const newCachedData = { url: hdUrl, width: width, height: height, dpi: dpi, file_format: file_format, content_url: content_url, type: type, title: title };
              hdUrlCache.set(id, newCachedData);

              // 只有type为image时才替换高清图片
              if (type === 'image') {
                executeReplacement(hdUrl);
              }

              // 尺寸信息和下载按钮不受type影响，始终显示
              if (width && height) {
                showSizeInfo(width, height, dpi, hdUrl, file_format, content_url, type, title);
              }
            }
          } catch (e) { }
        }
      }
    });
  }

  // 显示尺寸信息和下载按钮
  function showSizeInfo(width, height, dpi, url, fileFormat, contentUrl, type, title) {
    const targets = TARGET_SELECTORS.map(sel => document.querySelector(sel)).filter(img => img);

    targets.forEach(img => {
      const parent = img.parentElement;
      if (parent.querySelector('.size-info-overlay') || parent.querySelector('.download-btn-overlay')) return;

      // 创建尺寸信息覆盖层
      const sizeOverlay = document.createElement('div');
      sizeOverlay.className = 'size-info-overlay';
      sizeOverlay.textContent = `${width} 像素 x ${height} 像素 (${dpi} dpi)`;

      const sizeStyle = {
        position: 'absolute',
        bottom: '8px',
        left: '8px',
        color: '#000000ff',
        padding: '6px 12px',
        zIndex: '9999',
        transform: 'translateZ(0)',
        borderRadius: '99px',
        background: 'rgba(255, 255, 255, 0.7)',
        boxShadow: '0 0 1px 0 var(--boxshadow-color-medium-100, rgba(0, 0, 0, .1)), 0 8px 40px -2px var(--boxshadow-color-medium-200, rgba(0, 0, 0, .1))',
        transition: 'box-shadow .2s ease',
        userSelect: 'none'
      };

      Object.assign(sizeOverlay.style, sizeStyle);
      parent.appendChild(sizeOverlay);

      // 在包含ID信息的元素外添加a标签包裹
      if (contentUrl) {
        const sourceDiv = document.querySelector('.__2p__B98x, .QzLweiwl');
        if (sourceDiv && sourceDiv.parentElement && !sourceDiv.parentElement.classList.contains('content-url-wrapper')) {
          const wrapper = document.createElement('a');
          wrapper.className = 'content-url-wrapper';
          wrapper.href = contentUrl;
          wrapper.target = '_blank';
          wrapper.style.textDecoration = 'none';
          wrapper.style.color = 'inherit';
          sourceDiv.parentElement.insertBefore(wrapper, sourceDiv);
          wrapper.appendChild(sourceDiv);
        }
      }

      // 创建下载按钮（可能返回多个按钮）
      const extension = getFileExtension(url);
      createDownloadButton(url, img, extension, fileFormat, contentUrl, type, title, parent);
    });
  }

  // 获取文件扩展名
  function getFileExtension(url) {
    const match = url.match(/\.([^.?]+)(?:\?|$)/);
    return match ? '.' + match[1] : '.jpg';
  }

  // 创建下载按钮的公共函数
  function createDownloadButton(url, imgElement, extension, fileFormat, contentUrl, type, title, parent) {
    // 不论什么情况，始终显示下载PNG/JPG按钮（下载hdUrl）
    const pngButton = createSingleButton('下载 ' + extension.toUpperCase(), url, imgElement, 'image', title);
    pngButton.style.top = '8px';
    parent.appendChild(pngButton);

    let buttonIndex = 1;

    // 根据类型和文件格式添加额外的下载按钮
    if (type === 'poster' && fileFormat === 'psd') {
      // PSD素材：额外显示下载PSD按钮
      const psdButton = createSingleButton('下载 PSD', null, imgElement, 'psd', title);
      psdButton.style.top = (8 + buttonIndex * 40) + 'px';
      parent.appendChild(psdButton);
      buttonIndex++;
    } else if (type === 'image' && fileFormat === 'eps') {
      // EPS素材：需要先获取 originUrl，如果有才显示下载EPS按钮
      if (contentUrl) {
        fetch(contentUrl)
          .then(response => response.json())
          .then(data => {
            if (data.originUrl) {
              const epsButton = createSingleButton('下载 EPS', data.originUrl, imgElement, 'eps', title);
              epsButton.style.top = (8 + buttonIndex * 40) + 'px';
              parent.appendChild(epsButton);
            }
          })
          .catch(err => {
            console.error('获取EPS originUrl失败:', err);
          });
      }
    } else if (type === 'image' && fileFormat === 'ai') {
      // AI素材：额外显示下载AI按钮
      const aiButton = createSingleButton('下载 AI', contentUrl, imgElement, 'ai', title);
      aiButton.style.top = (8 + buttonIndex * 40) + 'px';
      parent.appendChild(aiButton);
      buttonIndex++;
    } else if (type === 'element' && fileFormat === 'svg') {
      // SVG元素素材：额外显示下载SVG按钮（与AI共用下载逻辑）
      const svgButton = createSingleButton('下载 SVG', contentUrl, imgElement, 'svg', title);
      svgButton.style.top = (8 + buttonIndex * 40) + 'px';
      parent.appendChild(svgButton);
      buttonIndex++;
    } else if (type === 'element' && fileFormat === 'ai') {
      // AI元素素材：额外显示下载AI按钮（与AI共用下载逻辑）
      const aiButton = createSingleButton('下载 AI', contentUrl, imgElement, 'ai', title);
      aiButton.style.top = (8 + buttonIndex * 40) + 'px';
      parent.appendChild(aiButton);
      buttonIndex++;
    } else if (type === 'movie' && fileFormat === 'zip') {
      // 视频素材：额外显示下载ZIP、MP3、MP4按钮
      const zipButton = createSingleButton('下载 ZIP', contentUrl, imgElement, 'zip', title);
      zipButton.style.top = (8 + buttonIndex * 40) + 'px';
      parent.appendChild(zipButton);
      buttonIndex++;

      const mp3Button = createSingleButton('下载 MP3', null, imgElement, 'mp3', title);
      mp3Button.style.top = (8 + buttonIndex * 40) + 'px';
      parent.appendChild(mp3Button);
      buttonIndex++;

      const mp4Button = createSingleButton('下载 MP4', null, imgElement, 'mp4', title);
      mp4Button.style.top = (8 + buttonIndex * 40) + 'px';
      parent.appendChild(mp4Button);
    } else if (fileFormat === 'zip' && type !== 'image') {
      // 普通ZIP素材（排除type='image'的情况）：额外显示下载ZIP按钮
      const zipButton = createSingleButton('下载 ZIP', contentUrl, imgElement, 'zip', title);
      zipButton.style.top = (8 + buttonIndex * 40) + 'px';
      parent.appendChild(zipButton);
    }
  }

  // 创建单个下载按钮
  function createSingleButton(text, url, imgElement, downloadType, title) {
    const downloadBtn = document.createElement('div');
    downloadBtn.className = 'download-btn-overlay';
    downloadBtn.textContent = text;

    // 判断是否为待实现的功能
    const isImplemented = downloadType === 'image' || downloadType === 'zip' || downloadType === 'eps' || downloadType === 'ai' || downloadType === 'svg';

    // 统一的按钮样式
    const btnStyle = {
      position: 'absolute',
      top: '8px',
      right: '8px',
      color: '#ffffff',
      padding: '6px 12px',
      zIndex: '9999',
      transform: 'translateZ(0)',
      borderRadius: '99px',
      background: 'rgba(0, 153, 255, 0.94)',
      boxShadow: '0 0 1px 0 var(--boxshadow-color-medium-100, rgba(0, 0, 0, .1)), 0 8px 40px -2px var(--boxshadow-color-medium-200, rgba(0, 0, 0, .1))',
      transition: 'box-shadow .2s ease',
      userSelect: 'none'
    };

    // 待实现的功能按钮样式
    if (!isImplemented) {
      btnStyle.cursor = 'not-allowed';
      btnStyle.opacity = '0.5';
      btnStyle.pointerEvents = 'none';
      btnStyle.background = 'rgba(128, 128, 128, 0.7)';
    } else {
      btnStyle.cursor = 'pointer';
    }

    Object.assign(downloadBtn.style, btnStyle);

    // 根据下载类型绑定不同的点击事件
    downloadBtn.addEventListener('click', () => {
      console.log(`点击了 ${text} 按钮，下载类型: ${downloadType}`);

      switch (downloadType) {
        case 'image':
          if (url) {
            downloadImage(url, imgElement, title);
          }
          break;
        case 'zip':
          if (url) {
            downloadZipFile(url, imgElement, title);
          }
          break;
        case 'eps':
          if (url) {
            downloadImage(url, imgElement, title);
          }
          break;
        case 'ai':
          if (url) {
            downloadAiFile(url, imgElement, title);
          }
          break;
        case 'svg':
          if (url) {
            downloadAiFile(url, imgElement, title);
          }
          break;
        case 'psd':
          // TODO: 实现PSD下载
          console.log('PSD下载功能待实现');
          break;
        case 'mp3':
          // TODO: 实现MP3下载
          console.log('MP3下载功能待实现');
          break;
        case 'mp4':
          // TODO: 实现MP4下载
          console.log('MP4下载功能待实现');
          break;
      }
    });

    return downloadBtn;
  }

  // 下载图片功能
  function downloadImage(url, imgElement, title) {
    const filename = title || imgElement?.alt || 'huaban_image';
    const extension = getFileExtension(url);
    const fullFilename = filename + extension;

    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.blob();
      })
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fullFilename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      })
      .catch(() => {
        const link = document.createElement('a');
        link.href = url;
        link.download = fullFilename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
  }

  // 下载ZIP文件功能
  function downloadZipFile(contentUrl, imgElement, title) {
    const filename = title || imgElement?.alt || 'huaban_素材';

    fetch(contentUrl)
      .then(response => response.json())
      .then(data => {
        if (data.url) {
          const link = document.createElement('a');
          link.href = data.url;
          link.download = `${filename}.zip`;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          throw new Error('ZIP URL not found');
        }
      })
      .catch(err => {
        console.error('ZIP下载失败:', err);
        alert('ZIP文件下载失败，请稍后重试');
      });
  }

  // 下载AI文件功能
  function downloadAiFile(contentUrl, imgElement, title) {
    const filename = title || imgElement?.alt || 'huaban_素材';

    fetch(contentUrl)
      .then(response => response.json())
      .then(data => {
        if (data.model && data.model.url) {
          const svgUrl = data.model.url;
          const colors = data.model.colors || [];

          fetch(svgUrl)
            .then(response => response.text())
            .then(svgContent => {
              let processedSvg = svgContent;

              if (colors.length > 0) {
                processedSvg = svgContent.replace(/\{\{colors\[(\d+)\]\}\}/g, (match, index) => {
                  const colorIndex = parseInt(index);
                  return colors[colorIndex] || '#000000';
                });
              }

              const blob = new Blob([processedSvg], { type: 'image/svg+xml' });
              const blobUrl = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = blobUrl;
              link.download = `${filename}.svg`;
              link.style.display = 'none';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(blobUrl);
            })
            .catch(err => {
              console.error('SVG下载失败:', err);
              alert('SVG文件下载失败，请稍后重试');
            });
        } else {
          throw new Error('AI data not found');
        }
      })
      .catch(err => {
        console.error('AI下载失败:', err);
        alert('AI文件下载失败，请稍后重试');
      });
  }

  // 替换图片/视频并显示加载指示器
  function executeReplacement(url) {
    const targets = TARGET_SELECTORS.map(sel => document.querySelector(sel)).filter(img => img && img.src !== url);

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

  // 拦截拖拽和右键下载事件
  function interceptDragAndDownload() {
    // 监听拖拽开始事件 - 支持传统拖拽（拖拽到桌面/资源管理器）
    document.addEventListener("dragstart", function (e) {
      // 确保是图片元素
      const img = e.target;
      if (img.tagName !== "IMG") {
        return;
      }

      // 只处理图片
      if (!img.src.includes("http") && !img.src.includes("data:image") && !img.dataset.originalSrc) {
        return;
      }

      // 检查拖拽下载功能是否启用
      const config = getConfig();
      if (!config.enableDragDownload) {
        debugLog("拖拽下载功能已禁用，跳过处理");
        return;
      }

      debugLog("检测到图片拖拽开始:", img.src);

      try {
        // 处理URL，删除_fwXXXwebp部分
        let cleanUrl;
        let isBase64 = img.src.includes("data:image");

        if (isBase64) {
          // 如果是base64格式，直接使用base64
          cleanUrl = img.src;
        } else {
          // 如果不是base64格式，使用原始URL并处理
          const originalSrc = img.dataset.originalSrc || img.src;
          cleanUrl = processImageUrl(originalSrc);
        }

        // 设置拖拽数据 - 支持多种拖拽场景
        e.dataTransfer.effectAllowed = "copy";

        // 设置URI列表（支持大多数文件管理器）
        e.dataTransfer.setData("text/uri-list", cleanUrl);

        // 设置纯文本URL（备用）
        e.dataTransfer.setData("text/plain", cleanUrl);

        // 设置DownloadURL（支持某些浏览器和工具）
        const fileName = getFileNameFromAlt(img) + ".png";
        e.dataTransfer.setData(
          "DownloadURL",
          `image/png:${fileName}:${cleanUrl}`
        );

        debugLog("已设置拖拽数据，文件名将保存为:", fileName);
        debugLog("拖拽数据设置完成");
      } catch (error) {
        console.error("拖拽处理失败:", error);
        // 失败时不阻止默认行为，让浏览器使用原始URL
      }
    });

    // 监听右键菜单事件 - 使用GM_download API直接下载
    document.addEventListener("contextmenu", function (e) {
      const img = e.target;
      if (
        img.tagName === "IMG" &&
        (img.src.includes("http") || img.src.includes("data:image") || img.dataset.originalSrc)
      ) {
        // 检查是否为需要处理的图片类型
        if (
          img.matches(SELECTORS.imageButton) ||
          img.closest("#imageViewerWrapper") ||
          img.matches(SELECTORS.imageViewerSimple) ||
          // 新增：支持预览图片（a标签内的img标签）
          (img.closest("a") &&
            img.closest("a").querySelector('span[style*="display: none"]'))
        ) {
          // 检查右键下载功能是否启用
          const config = getConfig();
          if (!config.enableRightClickDownload) {
            debugLog("右键下载功能已禁用，跳过处理");
            return;
          }

          // 立即阻止默认的右键菜单行为
          e.preventDefault();

          debugLog("检测到图片右键菜单，使用GM_download下载:", img.src);

          // 处理URL，删除_fwXXXwebp部分
          // 如果是base64格式，使用原始URL
          const originalSrc = img.dataset.originalSrc || img.src;
          const cleanUrl = processImageUrl(originalSrc);

          // 使用GM_download API直接下载图片
          // 注意：GM_download需要用户确认，所以这里使用异步方式
          setTimeout(() => {
            try {
              // 使用alt属性作为文件名，如果没有alt则使用默认文件名
              const fileName = getFileNameFromAlt(img) + ".png";

              // 使用GM_download下载图片
              // 注意：GM_download会弹出下载确认对话框
              GM_download({
                url: cleanUrl,
                name: fileName,
                onload: function () {
                  console.log("图片下载成功:", fileName, "URL:", cleanUrl);
                },
                onerror: function (error) {
                  console.error("图片下载失败:", error);
                  // 如果GM_download失败，尝试备用方案
                  fallbackDownload(cleanUrl, fileName, img);
                },
              });
            } catch (error) {
              console.error("GM_download调用失败:", error);
              // 备用下载方案
              fallbackDownload(cleanUrl, getFileNameFromAlt(img) + ".png", img);
            }
          }, 100);
        }
      }
    });

    // 备用下载方案：创建隐藏的下载链接
    function fallbackDownload(url, fileName, img) {
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        console.log("备用下载方案执行成功");
      } catch (error) {
        console.error("备用下载方案也失败:", error);
        // 最后的手段：在新标签页打开图片
        window.open(url, "_blank");
      }
    }

    debugLog("拖拽和右键下载拦截器已启动");
  }

  // ==================== UI组件 ====================

  // 创建配置界面（左侧导航 / 右侧内容）
  function createConfigUI() {
    const config = getConfig();

    // 检查是否已存在配置面板
    const existingPanel = document.getElementById("huabanConfig");
    if (existingPanel) {
      existingPanel.remove();
      return;
    }

    // 创建主容器
    const container = document.createElement("div");
    container.id = "huabanConfig";
    container.className =
      "fixed inset-0 bg-black/30 flex items-center justify-center z-[999] backdrop-blur-sm";

    // 创建卡片（更宽以容纳侧边栏）
    const card = document.createElement("div");
    // 固定高度布局，确保左侧导航与右侧内容高度一致
    card.className =
      "bg-white rounded-[20px] shadow-[0_8px_25px_rgba(0,0,0,0.15)] w-[900px] h-[680px] max-w-[96vw] flex flex-col overflow-hidden";
    card.style.fontFamily =
      '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

    // 侧边栏与主内容容器
    const bodyWrap = document.createElement("div");
    bodyWrap.className = "flex flex-1 min-h-0";

    const sidebar = document.createElement("div");
    // 侧栏采用纵向布局，底部显示版本号
    sidebar.className =
      "w-[160px] p-3 bg-slate-50 box-border flex flex-col justify-between overflow-hidden";

    // 左侧导航按钮
    const makeNavBtn = (id, text) => {
      const b = document.createElement("button");
      b.id = id;
      b.textContent = text;
      // 简约按钮样式：基础布局 + 简单过渡
      b.className =
        "block w-full text-left p-3 mb-2 rounded-lg bg-transparent cursor-pointer text-slate-700 text-sm transition-all duration-150 border-none";
      // 简约hover效果
      b.addEventListener("mouseenter", () => {
        if (!b.dataset.active) b.style.backgroundColor = "#e9edf3ff";
      });
      b.addEventListener("mouseleave", () => {
        if (!b.dataset.active) b.style.backgroundColor = "transparent";
      });
      return b;
    };

    // 切换激活态样式
    function setActive(activeId) {
      const btns = sidebar.querySelectorAll('button[id^="cfg-tab-"]');
      btns.forEach((b) => {
        if (b.id === activeId) {
          b.dataset.active = "1";
          // 极简选中状态：仅保留背景色和文字颜色
          b.style.backgroundColor = "rgb(255, 255, 255)";
          b.style.color = "rgb(255, 40, 75)";
        } else {
          delete b.dataset.active;
          b.style.backgroundColor = "transparent";
          b.style.color = "rgb(51, 65, 85)";
        }
      });
    }

    const navSettings = makeNavBtn("cfg-tab-settings", "⚙️ 设置选项");
    const navUsage = makeNavBtn("cfg-tab-usage", "📖 使用说明");
    const navUpdate = makeNavBtn("cfg-tab-update", "📝 更新记录");
    const navTwikoo = makeNavBtn("cfg-tab-twikoo", "🤝 网友互助");
    const navThanks = makeNavBtn("cfg-tab-thanks", "🙏 致谢名单");
    const navUserProfile = makeNavBtn("cfg-tab-user", "👤 个人信息");

    const navTop = document.createElement("div");
    navTop.className = "flex flex-col gap-2";
    navTop.appendChild(navSettings);
    navTop.appendChild(navUsage);
    navTop.appendChild(navUpdate);
    navTop.appendChild(navTwikoo);
    navTop.appendChild(navThanks);
    navTop.appendChild(navUserProfile);
    sidebar.appendChild(navTop);

    // 版本信息放在侧栏底部，参考示例布局
    const versionEl = document.createElement("div");
    versionEl.className = "text-xs text-slate-400 p-3 flex items-center justify-between";

    const versionText = document.createElement("span");
    versionText.textContent = `Pro版 v${getScriptVersion()}`;
    versionEl.appendChild(versionText);

    const donateLink = document.createElement("a");
    donateLink.href = "https://getquicker.net/DonateAuthor?serial=388875&nickname=%E7%88%B1%E5%90%83%E9%A6%8D%E7%9A%84%E5%B0%8F%E5%BC%A0";
    donateLink.className = "text-xs text-red-400 hover:text-red-300 transition-colors";
    donateLink.textContent = "捐助";
    donateLink.target = "_blank";
    donateLink.rel = "noopener noreferrer";
    versionEl.appendChild(donateLink);

    sidebar.appendChild(versionEl);

    const main = document.createElement("div");
    main.id = "hb-config-main-settings"; // 默认显示设置面板，所以默认id为settings
    // 主区使用滚动容器以适配内嵌大型面板（如历史、聊天）
    main.className = "flex-1 m-4 overflow-auto min-h-0 box-border";

    bodyWrap.appendChild(sidebar);
    bodyWrap.appendChild(main);

    // 添加到卡片（不再渲染顶部 header）
    card.appendChild(bodyWrap);
    container.appendChild(card);

    // 添加到页面
    document.body.appendChild(container);

    // 导航交互：渲染不同的面板
    function renderSettings() {
      // 设置主容器的 id，包含所属分类
      main.id = "hb-config-main-settings";
      // 重置所有可能受致谢名单影响的样式
      main.style.padding = "16px";
      main.style.margin = "0";
      main.style.background = "none";
      main.style.backgroundImage = `url(${SETTINGS_BG_IMAGES.left}), url(${SETTINGS_BG_IMAGES.right})`;
      main.style.backgroundPosition = '0 100%, 100% 100%';
      main.style.backgroundRepeat = 'no-repeat, no-repeat';
      main.style.backgroundSize = '18%';
      main.style.position = 'relative';
      // 清理旧内容
      main.innerHTML = "";
      // switchesSection, colorSettings, actions 会被插入后
      main.appendChild(switchesSection);
      main.innerHTML += colorSettings;
      main.appendChild(hotkeysSettings);
      main.appendChild(actions);

      // 添加免责提示
      const disclaimer = document.createElement('div');
      disclaimer.className = 'text-sm text-center absolute w-full bottom-0 left-1/2 -translate-x-1/2 text-gray-500 py-4';
      disclaimer.textContent = '免责声明：本脚本仅用于学习研究，请勿用于商业用途';
      main.appendChild(disclaimer);

      // 初始化时根据开关状态显示或隐藏颜色选择器
      const colorSettingsContainer = document.getElementById("colorSettingsContainer");
      const enableCustomSwitch = document.getElementById("enableCustomSwitch");
      if (colorSettingsContainer && enableCustomSwitch) {
        colorSettingsContainer.style.display = enableCustomSwitch.checked ? "block" : "none";
      }
    }

    // 更新记录在主区域嵌入 Feishu（iframe），若无法显示提供外链
    function renderUpdate() {
      // 设置主容器的 id，包含所属分类
      main.id = "hb-config-main-update";
      main.innerHTML = "";
      // 重置所有可能受致谢名单影响的样式
      main.style.padding = "0";
      main.style.margin = "0";
      main.style.background = "none";
      main.style.borderRadius = "0";
      main.style.position = "relative";
      const feishuUrl =
        "https://ai-chimo.feishu.cn/wiki/EcTAwKw2bifqGjku9pzccaVcnId";
      const iframe = document.createElement("iframe");
      iframe.src = feishuUrl;
      iframe.className = "w-full h-full min-h-[480px] border-0 rounded-lg";
      iframe.allow = "fullscreen; clipboard-write";
      const fallback = document.createElement("div");
      fallback.className =
        "text-sm text-center absolute w-full bottom-0 left-1/2 -translate-x-1/2 no-underline bg-white px-4 py-2 rounded shadow-md";
      fallback.innerHTML = `若内容无法显示，请 <a href="${feishuUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500">点我在新标签页打开更新记录</a>（飞书文档）`;
      main.appendChild(iframe);
      main.appendChild(fallback);
    }

    // 使用说明在主区域嵌入 Feishu（iframe），若无法显示提供外链
    function renderUsage() {
      // 设置主容器的 id，包含所属分类
      main.id = "hb-config-main-usage";
      main.innerHTML = "";
      // 重置所有可能受致谢名单影响的样式
      main.style.padding = "0";
      main.style.margin = "0";
      main.style.background = "none";
      main.style.borderRadius = "0";
      main.style.position = "relative";
      const feishuUrl =
        "https://ai-chimo.feishu.cn/wiki/E9SEwhoMmiv2CkkC1VgcAbRTnW3";
      const iframe = document.createElement("iframe");
      iframe.src = feishuUrl;
      iframe.className = "w-full h-full min-h-[480px] border-0 rounded-lg";
      iframe.allow = "fullscreen; clipboard-write";
      const fallback = document.createElement("div");
      fallback.className =
        "text-sm text-center absolute w-full bottom-0 left-1/2 -translate-x-1/2 no-underline bg-white px-4 py-2 rounded shadow-md";
      fallback.innerHTML = `若内容无法显示，请 <a href="${feishuUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500">点我在新标签页打开使用说明</a>（飞书文档）`;
      main.appendChild(iframe);
      main.appendChild(fallback);
    }

    // 导航按钮事件（同时设置激活态）
    navSettings.addEventListener("click", () => {
      setActive("cfg-tab-settings");
      renderSettings();
    });
    navUsage.addEventListener("click", () => {
      setActive("cfg-tab-usage");
      renderUsage();
    });
    navUpdate.addEventListener("click", () => {
      setActive("cfg-tab-update");
      renderUpdate();
    });

    //个人信息
    function renderUserProfile() {
      // 使用外部作用域中已经定义好的main变量
      if (!main) return;

      // 设置主容器的 id，包含所属分类
      main.id = "hb-config-main-user";
      main.innerHTML =
        '<div class="loading"><i class="fa fa-spinner fa-spin"></i> 加载个人信息中...</div>';
      // 重置所有可能受致谢名单影响的样式
      main.style.padding = "16px";
      main.style.margin = "0";
      main.style.background = "none";
      main.style.borderRadius = "0";
      main.style.position = "relative";

      fetch("https://huaban.com/v3/users/me")
        .then((response) => response.json())
        .then((data) => {
          const createdAt = new Date(
            data.created_at * 1000
          ).toLocaleDateString();
          main.innerHTML = `
                <div class="user-profile">
                    <div class="profile-header">
                        <img src="${data.avatar.url}" alt="${data.username
            }" class="avatar">
                        <div class="profile-info">
                            <h3>${data.username}</h3>
                            <p class="job">${data.profile.job || "未填写职业信息"
            }</p>
                            <p class="joined">注册时间: ${createdAt}</p>
                        </div>
                    </div>
                    <div class="profile-stats">
                        <div class="stat-item">
                            <span class="stat-value">${data.board_count}</span>
                            <span class="stat-label">画板</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${data.pin_count}</span>
                            <span class="stat-label">采集</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${data.follower_count
            }</span>
                            <span class="stat-label">粉丝</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${data.following_count
            }</span>
                            <span class="stat-label">关注</span>
                        </div>
                    </div>
            </div>
        `;
        })
        .catch((error) => {
          main.innerHTML =
            '<div class="error-message"><i class="fa fa-exclamation-circle"></i> 获取个人信息失败，请稍后重试</div>';
          console.error("获取花瓣用户信息失败:可能未登录", error);
        });
    }
    // 在主区域渲染致谢名单（iframe）
    function renderThanksPanel() {
      // 设置主容器的 id，包含所属分类
      main.id = "hb-config-main-thanks";
      main.style.padding = "0px";
      main.style.margin = "16px";
      main.style.background =
        "linear-gradient(rgb(255, 198, 196), rgba(255, 198, 196, 0.95) 50%, rgb(255, 255, 255) 90%)";
      main.style.borderRadius = "6px";
      // 清理旧内容
      main.innerHTML = "";
      const iframe = document.createElement("iframe");
      iframe.src =
        "https://xiaolongmr.github.io/tampermonkey-scripts/%E8%8A%B1%E7%93%A3%E5%8E%BB%E6%B0%B4%E5%8D%B0/%E8%87%B4%E8%B0%A2%E5%90%8D%E5%8D%95.html";
      iframe.className =
        "block mx-auto w-[420px] h-[585px] border-0 rounded-lg";
      main.appendChild(iframe);
    }

    // 重新创建修改后的renderTwikooPanel函数
    function renderTwikooPanel() {
      // 设置主容器的 id，包含所属分类
      main.id = "hb-config-main-twikoo";
      // 重置所有可能受致谢名单影响的样式
      main.style.padding = "16px";
      main.style.margin = "0";
      main.style.background = "none";
      main.style.borderRadius = "0";
      main.innerHTML = "";
      const title = document.createElement("div");
      title.className = "flex items-center justify-between mb-3";
      title.innerHTML = `<h3 class="m-0 text-base text-slate-700">网友互助区</h3><div class="text-xs text-slate-400">通过 Twikoo 聊天与其他用户交流</div>`;
      const wrapper = document.createElement("div");
      wrapper.className = "flex-1 flex flex-col gap-3 h-full min-h-0";

      // 创建说明文字区域
      const materialSitesSection = document.createElement("div");
      materialSitesSection.className = "bg-white rounded-lg p-3 box-border";
      const materialSitesTitle = document.createElement("div");
      const materialSitesList = document.createElement("div");
      materialSitesList.className = "text-sm text-slate-600 leading-relaxed";
      materialSitesList.innerHTML =
        "公众号文章开了广告，朋友们有空的话每天可点点广告，收益用于购买素材解析网站的积分，帮使用脚本的朋友免费下载素材，可下载的素材<a href='https://huaban.com/pages/sucai' target='_blank' class='text-blue-500 hover:underline'>点我进入查看</a>，复制你要下的素材网址，在下方或公众号任意文章下评论，我看到会帮忙下载的，积分用完为止！";
      materialSitesSection.appendChild(materialSitesTitle);
      materialSitesSection.appendChild(materialSitesList);

      const commentWrap = document.createElement("div");
      commentWrap.id = "tcomment";
      commentWrap.className =
        "flex-1 min-h-0 overflow-auto bg-white rounded-lg p-3 box-border";
      wrapper.appendChild(materialSitesSection);
      wrapper.appendChild(commentWrap);
      main.appendChild(title);
      main.appendChild(wrapper);

      // 动态加载Twikoo并初始化（若未加载）
      try {
        if (!document.querySelector('link[href*="twikoo"]')) {
          const twikooCss = document.createElement("link");
          twikooCss.rel = "stylesheet";
          twikooCss.href =
            "https://cdn.jsdelivr.net/npm/twikoo@1.6.44/dist/twikoo.css";
          document.head.appendChild(twikooCss);
        }
        if (typeof twikoo === "undefined") {
          const twikooScript = document.createElement("script");
          twikooScript.src =
            "https://cdn.jsdelivr.net/npm/twikoo@1.6.44/dist/twikoo.nocss.js";
          twikooScript.onload = function () {
            try {
              if (typeof twikoo !== "undefined") {
                twikoo.init({
                  envId: "https://twikookaishu.z-l.top",
                  el: "#tcomment",
                  path: "/huaban-helper-all",
                });
              }
            } catch (e) {
              console.error(e);
            }
          };
          document.head.appendChild(twikooScript);
        } else {
          try {
            twikoo.init({
              envId: "https://twikookaishu.z-l.top",
              el: "#tcomment",
              path: "/huaban-helper-all",
            });
          } catch (e) { }
        }
      } catch (e) {
        console.error("初始化 Twikoo 失败", e);
      }
    }

    navTwikoo.addEventListener("click", (e) => {
      e.preventDefault();
      setActive("cfg-tab-twikoo");
      renderTwikooPanel();
    });

    navThanks.addEventListener("click", (e) => {
      e.preventDefault();
      setActive("cfg-tab-thanks");
      renderThanksPanel();
    });
    navUserProfile.addEventListener("click", (e) => {
      e.preventDefault();
      setActive("cfg-tab-user");
      renderUserProfile();
    });

    // 初始显示设置面板并设置激活态
    // NOTE: moved below after switchesSection/colorSettings/actions are created
    const showThanksList = () => {
      try {
        // 创建模态框
        const modal = document.createElement("div");
        modal.className =
          "fixed inset-0 bg-black/30 flex items-center justify-center z-[9999] backdrop-blur-sm";

        // 禁止页面滚动
        document.body.style.overflow = "hidden";

        // 创建容器
        const container = document.createElement("div");
        container.className =
          "relative w-[420px] h-[585px] max-w-[95vw] max-h-[90vh] overflow-hidden";

        // 创建iframe嵌套致谢名单HTML文件
        const iframe = document.createElement("iframe");
        iframe.src =
          "https://xiaolongmr.github.io/tampermonkey-scripts/%E8%8A%B1%E7%93%A3%E5%8E%BB%E6%B0%B4%E5%8D%B0/%E8%87%B4%E8%B0%A2%E5%90%8D%E5%8D%95.html";
        iframe.className =
          "absolute inset-0 w-full h-full border-0 outline-none";
        iframe.allow = "autoplay; clipboard-write";

        // 创建关闭按钮
        const closeButton = document.createElement("div");
        closeButton.className =
          "absolute right-2.5 top-2.5 w-7 h-7 bg-black/10 rounded-full flex items-center justify-center select-none z-10 cursor-pointer";
        // 创建SVG关闭图标
        const closeIcon = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg"
        );
        closeIcon.setAttribute("width", "16");
        closeIcon.setAttribute("height", "16");
        closeIcon.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        closeIcon.setAttribute("viewBox", "0 0 1024 1024");
        closeIcon.setAttribute("fill", "white");

        // 创建路径
        const path = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        path.setAttribute(
          "d",
          "M198.1 267.7l75.4-75.4 576.3 576.3-75.4 75.4-576.3-576.3zm576.4-69.3l75.4 75.4-580.7 580.8-75.4-75.4 580.7-580.8z"
        );

        // 组装SVG图标
        closeIcon.appendChild(path);
        closeButton.appendChild(closeIcon);
        closeButton.addEventListener("click", () => {
          document.body.removeChild(modal);
          // 恢复页面滚动
          document.body.style.overflow = "auto";
        });
        closeButton.addEventListener("mouseenter", () => {
          closeButton.style.backgroundColor = "rgba(0, 0, 0, 0.2)";
        });
        closeButton.addEventListener("mouseleave", () => {
          closeButton.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
        });

        // 组装模态框
        container.appendChild(iframe);
        container.appendChild(closeButton);
        modal.appendChild(container);

        // 点击模态框背景关闭
        modal.addEventListener("click", (e) => {
          if (e.target === modal) {
            document.body.removeChild(modal);
            // 恢复页面滚动
            document.body.style.overflow = "auto";
          }
        });

        // 添加到文档
        document.body.appendChild(modal);
      } catch (error) {
        console.error("显示致谢名单失败:", error);
        alert("无法加载致谢名单，请稍后再试");
      }
    };

    // 延迟添加事件监听器，确保DOM已渲染
    setTimeout(() => {
      const thanksListLink = document.getElementById("thanksListLink");
      if (thanksListLink) {
        thanksListLink.addEventListener("click", (e) => {
          e.preventDefault();
          showThanksList();
        });
      }
    }, 0);

    // 卡片内容
    const content = main;

    // 启用开关区域 - 使用网格布局
    const switchesSection = document.createElement("div");
    switchesSection.className = "mb-4 grid grid-cols-2 gap-3";

    // 自定义背景色开关
    const enableCustomSection = document.createElement("div");
    enableCustomSection.className =
      "flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200";

    const enableCustomHTML = `
            <span class="text-sm font-medium text-slate-700 flex items-center">
                开启图片自定义背景色
            </span>
            <div class="relative w-10 h-5 cursor-pointer" id="enableCustomContainer">
                <input type="checkbox" id="enableCustomSwitch" ${config.enableCustom ? "checked" : ""
      }
                       class="absolute inset-0 opacity-0 cursor-pointer z-30">
                <span class="absolute inset-0 rounded-full transition-colors duration-200 z-10" style="background: ${config.enableCustom ? '#3b82f6' : '#e2e8f0'}"></span>
                <span class="absolute w-4 h-4 top-0.5 bg-white rounded-full transition-all duration-200 shadow-sm z-20" id="enableCustomThumb" style="left: ${config.enableCustom ? '22px' : '2px'}"></span>
            </div>
        `;

    enableCustomSection.innerHTML = enableCustomHTML;

    // 去水印功能开关
    const enableWatermarkSection = document.createElement("div");
    enableWatermarkSection.className =
      "flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200";

    const enableWatermarkHTML = `
            <span class="text-sm font-medium text-slate-700 flex items-center">花瓣去水印<span class="text-xs text-slate-400 ml-1">（仅支持商用无忧素材)</span>
            </span>
            <div class="relative w-10 h-5 cursor-pointer" id="enableWatermarkContainer">
                <input type="checkbox" id="enableWatermarkSwitch" ${config.enableRemoveWatermark ? "checked" : ""}
                       class="absolute inset-0 opacity-0 cursor-pointer z-30">
                <span class="absolute inset-0 rounded-full transition-colors duration-200 z-10" style="background: ${config.enableRemoveWatermark ? '#3b82f6' : '#e2e8f0'}"></span>
                <span class="absolute w-4 h-4 top-0.5 bg-white rounded-full transition-all duration-200 shadow-sm z-20" id="enableWatermarkThumb" style="left: ${config.enableRemoveWatermark ? '22px' : '2px'}"></span>
            </div>
        `;

    enableWatermarkSection.innerHTML = enableWatermarkHTML;

    // 拖拽下载功能开关
    const enableDragSection = document.createElement("div");
    enableDragSection.className =
      "flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200";

    const enableDragHTML = `
            <span class="text-sm font-medium text-slate-700 flex items-center">拖拽下载图片<span class="text-xs text-slate-400 ml-1">（适配资源管理器/<a href="https://wwz.lanzouq.com/iyUTy1zt2b4d" target="_blank" class="text-blue-500 no-underline" title="点击下载PureRef">PureRef</a>)</span>
            </span>
            <div class="relative w-10 h-5 cursor-pointer" id="enableDragContainer">
                <input type="checkbox" id="enableDragSwitch" ${config.enableDragDownload ? "checked" : ""
      }
                       class="absolute inset-0 opacity-0 cursor-pointer z-30">
                <span class="absolute inset-0 rounded-full transition-colors duration-200 z-10" style="background: ${config.enableDragDownload ? '#3b82f6' : '#e2e8f0'}"></span>
                <span class="absolute w-4 h-4 top-0.5 bg-white rounded-full transition-all duration-200 shadow-sm z-20" id="enableDragThumb" style="left: ${config.enableDragDownload ? '22px' : '2px'}"></span>
            </div>
        `;

    enableDragSection.innerHTML = enableDragHTML;

    // 右键下载功能开关
    const enableRightClickSection = document.createElement("div");
    enableRightClickSection.className =
      "flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200";

    const enableRightClickHTML = `
            <span class="text-sm font-medium text-slate-700 flex items-center">右键下载图片<span class="text-xs text-slate-400 ml-1">（修正乱码名称）</span>
            </span>
            <div class="relative w-10 h-5 cursor-pointer" id="enableRightClickContainer">
                <input type="checkbox" id="enableRightClickSwitch" ${config.enableRightClickDownload ? "checked" : ""
      }
                       class="absolute inset-0 opacity-0 cursor-pointer z-30">
                <span class="absolute inset-0 rounded-full transition-colors duration-200 z-10" style="background: ${config.enableRightClickDownload ? '#3b82f6' : '#e2e8f0'}"></span>
                <span class="absolute w-4 h-4 top-0.5 bg-white rounded-full transition-all duration-200 shadow-sm z-20" id="enableRightClickThumb" style="left: ${config.enableRightClickDownload ? '22px' : '2px'}"></span>
            </div>
        `;

    enableRightClickSection.innerHTML = enableRightClickHTML;

    // 隐藏蜡笔小新设置按钮开关
    const enableHideSettingsButtonSection = document.createElement("div");
    enableHideSettingsButtonSection.className =
      "flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200";

    const enableHideSettingsButtonHTML = `
            <span class="text-sm font-medium text-slate-700 flex items-center">隐藏蜡笔小新<span class="text-xs text-slate-400 ml-1">（进入此页面的按钮）</span>
            </span>
            <div class="relative w-10 h-5 cursor-pointer" id="enableHideSettingsButtonContainer">
                <input type="checkbox" id="enableHideSettingsButtonSwitch" ${config.enableHideSettingsButton ? "checked" : ""}
                       class="absolute inset-0 opacity-0 cursor-pointer z-30">
                <span class="absolute inset-0 rounded-full transition-colors duration-200 z-10" style="background: ${config.enableHideSettingsButton ? '#3b82f6' : '#e2e8f0'}"></span>
                <span class="absolute w-4 h-4 top-0.5 bg-white rounded-full transition-all duration-200 shadow-sm z-20" id="enableHideSettingsButtonThumb" style="left: ${config.enableHideSettingsButton ? '22px' : '2px'}"></span>
            </div>
        `;

    enableHideSettingsButtonSection.innerHTML = enableHideSettingsButtonHTML;

    // 组装开关区域
    switchesSection.appendChild(enableCustomSection);
    switchesSection.appendChild(enableWatermarkSection);
    switchesSection.appendChild(enableDragSection);
    switchesSection.appendChild(enableRightClickSection);
    switchesSection.appendChild(enableHideSettingsButtonSection);

    const colorSettings = `
            <!-- 素材背景颜色设置容器 -->
            <div id="colorSettingsContainer" class="mb-3">
            <div class="text-sm font-semibold text-slate-800 mb-2">
                🎨 背景颜色
            </div>
            <div class="grid grid-cols-2 gap-3">
            <!-- 花瓣素材颜色 -->
            <div class="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                <div class="text-xs font-medium text-slate-700">
                    花瓣素材
                </div>
                <div class="w-7 h-7 rounded border border-slate-200 cursor-pointer" id="materialPreview" style="background: ${config.materialColor}">
                    <input type="color" id="materialPicker" value="${config.materialColor}" class="w-full h-full opacity-0 cursor-pointer">
                </div>
            </div>

            <!-- 用户上传颜色 -->
            <div class="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                <div class="text-xs font-medium text-slate-700">
                    用户上传
                </div>
                <div class="w-7 h-7 rounded border border-slate-200 cursor-pointer" id="userPreview" style="background: ${config.userColor}">
                    <input type="color" id="userPicker" value="${config.userColor}" class="w-full h-full opacity-0 cursor-pointer">
                </div>
            </div>
            </div>
        `;

    // 快捷键设置区域
    const hotkeysSettings = document.createElement("div");
    hotkeysSettings.className = "mb-4";
    hotkeysSettings.innerHTML = `
        <div style="margin-bottom: 10px;">
            <div style="
                font-size: 13px;
                color: #334155;
                font-weight: 600;
                margin-bottom: 6px;
            ">
                ⌨️ 快捷键设置
            </div>
        </div>`;

    // 获取当前快捷键配置
    const hotkeysConfig = getHotkeysConfig();

    // 快捷键项目列表
    const hotkeyItems = [
      { id: "searchFocus", label: "定位到搜索框", defaultKey: "k" },
      { id: "imageSearch", label: "以图搜索功能", defaultKey: "p" },
      { id: "openSettings", label: "打开设置界面", defaultKey: "," },
    ];

    // 创建网格容器
    const hotkeysGrid = document.createElement("div");
    hotkeysGrid.className = "grid grid-cols-2 gap-3";

    // 创建每个快捷键设置项
    hotkeyItems.forEach((item) => {
      const hotkeyItem = document.createElement("div");
      hotkeyItem.className =
        "p-2 bg-slate-50 rounded-lg border border-slate-200";

      const hotkeyConfig = hotkeysConfig[item.id] || {
        ctrlCmd: true,
        shift: false,
        alt: false,
        key: item.defaultKey,
      };

      hotkeyItem.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 4px;
            "><span style="font-size: 12px; color: #334155; font-weight: 500;">${item.label
        }</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
                <div style="flex: 1;">
                    <input type="text" id="hotkey-${item.id}" 
                           value="${hotkeyConfig.ctrlCmd ? "Ctrl+" : ""}${hotkeyConfig.shift ? "Shift+" : ""
        }${hotkeyConfig.alt ? "Alt+" : ""}${hotkeyConfig.key.toUpperCase()}"
                           style="
                               width: 100%;
                               padding: 6px 8px;
                               border: 1px solid #e2e8f0;
                               border-radius: 4px;
                               font-size: 12px;
                               color: #334155;
                               font-family: monospace;
                           "
                           data-hotkey-id="${item.id}"
                           readonly>
                </div>
                <button type="button" id="reset-hotkey-${item.id}" 
                        style="
                            padding: 4px 8px;
                            background: #f8fafc;
                            color: #64748b;
                            border: 1px solid #e2e8f0;
                            border-radius: 4px;
                            font-size: 11px;
                            cursor: pointer;
                        ">
                    重置
                </button>
            </div>
        `;

      hotkeysGrid.appendChild(hotkeyItem);
    });

    // 将网格容器添加到快捷键设置区域
    hotkeysSettings.appendChild(hotkeysGrid);

    // 操作按钮
    const actions = document.createElement("div");
    actions.className = "flex gap-2";
    actions.innerHTML = `
            <button id="resetBtn" style="
                flex: 1;
                padding: 8px 12px;
                background: #f8fafc;
                color: #64748b;
                border: 1px solid #e2e8f0;
                border-radius: 44px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
            ">
                恢复默认
            </button>
            <button id="saveBtn" style="
                flex: 1;
                padding: 8px 12px;
                background: #ff284b;
                color: white;
                border: none;
                border-radius: 44px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
            ">
                保存设置
            </button>
        `;

    // 组装内容
    content.appendChild(switchesSection);
    content.innerHTML += colorSettings;
    content.appendChild(hotkeysSettings);
    content.appendChild(actions);

    // 初始显示设置面板并设置激活态（放在这里以确保所有元素已创建）
    setActive("cfg-tab-settings");
    renderSettings();

    // 卡片已在前面组装并添加到页面，后续只需填充 `content`（即 main）

    // 获取元素
    const enableCustomSwitch = document.getElementById("enableCustomSwitch");
    const enableCustomThumb = document.getElementById("enableCustomThumb");
    const enableCustomContainer = document.getElementById(
      "enableCustomContainer"
    );



    const enableDragSwitch = document.getElementById("enableDragSwitch");
    const enableDragThumb = document.getElementById("enableDragThumb");
    const enableDragContainer = document.getElementById("enableDragContainer");

    const enableRightClickSwitch = document.getElementById("enableRightClickSwitch");
    const enableRightClickThumb = document.getElementById("enableRightClickThumb");
    const enableRightClickContainer = document.getElementById(
      "enableRightClickContainer"
    );

    const enableWatermarkSwitch = document.getElementById("enableWatermarkSwitch");
    const enableWatermarkThumb = document.getElementById("enableWatermarkThumb");
    const enableWatermarkContainer = document.getElementById(
      "enableWatermarkContainer"
    );

    const enableHideSettingsButtonSwitch = document.getElementById("enableHideSettingsButtonSwitch");
    const enableHideSettingsButtonThumb = document.getElementById("enableHideSettingsButtonThumb");
    const enableHideSettingsButtonContainer = document.getElementById(
      "enableHideSettingsButtonContainer"
    );

    const materialPreview = document.getElementById("materialPreview");
    const materialPicker = document.getElementById("materialPicker");
    const userPreview = document.getElementById("userPreview");
    const userPicker = document.getElementById("userPicker");
    const saveBtn = document.getElementById("saveBtn");
    const resetBtn = document.getElementById("resetBtn");

    // 开关事件处理器工厂函数 - 消除重复代码
    const createSwitchHandler = (
      thumbElement,
      containerElement,
      callback
    ) => {
      return function () {
        const isChecked = this.checked;
        const switchBg = containerElement.querySelector("span:nth-child(2)");
        switchBg.style.backgroundColor = isChecked ? "#3b82f6" : "#e2e8f0";
        thumbElement.style.left = isChecked ? "22px" : "2px";
        if (typeof callback === "function") callback(isChecked);
      };
    };

    // 修复自定义背景色开关功能
    enableCustomSwitch.addEventListener(
      "change",
      createSwitchHandler(
        enableCustomThumb,
        enableCustomContainer,
        (isChecked) => {
          applyStyles();
          // 动态显示或隐藏颜色选择器
          const colorSettingsContainer = document.getElementById(
            "colorSettingsContainer"
          );
          if (colorSettingsContainer) {
            colorSettingsContainer.style.display = isChecked ? "block" : "none";
          }
        }
      )
    );



    // 拖拽下载开关功能
    enableDragSwitch.addEventListener(
      "change",
      createSwitchHandler(
        enableDragThumb,
        enableDragContainer,
        (isChecked) => {
          debugLog("拖拽下载开关状态变化:", isChecked);
        }
      )
    );

    // 右键下载功能
    enableRightClickSwitch.addEventListener(
      "change",
      createSwitchHandler(
        enableRightClickThumb,
        enableRightClickContainer,
        (isChecked) => {
          debugLog("右键下载开关状态变化:", isChecked);
        }
      )
    );

    // 去水印功能开关
    enableWatermarkSwitch.addEventListener(
      "change",
      createSwitchHandler(
        enableWatermarkThumb,
        enableWatermarkContainer,
        (isChecked) => {
          debugLog("去水印开关状态变化:", isChecked);
        }
      )
    );

    // 隐藏蜡笔小新设置按钮开关
    enableHideSettingsButtonSwitch.addEventListener(
      "change",
      createSwitchHandler(
        enableHideSettingsButtonThumb,
        enableHideSettingsButtonContainer,
        (isChecked) => {
          debugLog("隐藏蜡笔小新开关状态变化:", isChecked);
          // 立即更新设置按钮的显示状态
          const settingsButton = document.getElementById('hb-settings-button');
          if (settingsButton) {
            settingsButton.style.display = isChecked ? 'none' : 'block';
          }
        }
      )
    );

    // 颜色选择器工厂函数 - 简化版本，只保留拾色器功能
    const createColorPickerHandler = (
      pickerElement,
      previewElement
    ) => {
      // 预览元素点击打开拾色器
      previewElement.addEventListener("click", () => pickerElement.click());

      // 拾色器输入事件
      pickerElement.addEventListener("input", (e) => {
        previewElement.style.backgroundColor = e.target.value;
      });
    };

    // 绑定材料水印颜色选择器
    createColorPickerHandler(materialPicker, materialPreview);

    // 绑定用户水印颜色选择器
    createColorPickerHandler(userPicker, userPreview);

    // 保存配置
    // 初始化快捷键设置功能
    function initHotkeySettings() {
      // 快捷键配置变量
      let currentHotkeyInput = null;
      let currentHotkeyConfig = getHotkeysConfig();
      let originalHotkeyValue = null;

      // 默认快捷键配置
      const defaultHotkeys = DEFAULT_HOTKEYS;

      // 格式化快捷键显示文本
      const formatHotkeyText = (config) => {
        return `${config.ctrlCmd ? "Ctrl+" : ""}${config.shift ? "Shift+" : ""
          }${config.alt ? "Alt+" : ""}${config.key.toUpperCase()}`;
      };

      // 处理输入框激活
      const handleInputFocus = (input) => {
        // 移除其他输入框的激活状态
        document.querySelectorAll('input[id^="hotkey-"]').forEach((i) => {
          i.style.borderColor = "#e2e8f0";
          // 恢复其他输入框的原始值
          if (i !== input && i.dataset.originalValue) {
            i.value = i.dataset.originalValue;
          }
        });

        // 保存原始值
        originalHotkeyValue = input.value;
        input.dataset.originalValue = originalHotkeyValue;

        // 设置当前激活的输入框
        currentHotkeyInput = input;
        currentHotkeyInput.style.borderColor = "#ff284b";
        currentHotkeyInput.value = "请按下新的快捷键组合...";
      };

      // 处理输入框失焦
      const handleInputBlur = (input) => {
        if (currentHotkeyInput === input) {
          // 如果没有完成快捷键设置，恢复原始值
          input.value = input.dataset.originalValue || "";
          input.style.borderColor = "#e2e8f0";
          currentHotkeyInput = null;
          originalHotkeyValue = null;
        }
      };

      // 处理键盘事件
      const handleKeydown = (e) => {
        if (currentHotkeyInput) {
          e.preventDefault();

          // 获取按键信息
          const ctrlCmd = e.ctrlKey || e.metaKey;
          const shift = e.shiftKey;
          const alt = e.altKey;
          const key = e.key.toLowerCase();

          // 只允许字母、数字和部分符号
          if (key && key.length === 1 && !e.code.includes("F") && key !== " ") {
            // 构建快捷键配置
            const hotkeyConfig = {
              ctrlCmd,
              shift,
              alt,
              key,
              description: currentHotkeyConfig[currentHotkeyInput.dataset.hotkeyId].description,
            };

            // 更新输入框显示
            currentHotkeyInput.value = formatHotkeyText(hotkeyConfig);

            // 保存到临时配置
            currentHotkeyConfig[currentHotkeyInput.dataset.hotkeyId] = hotkeyConfig;

            // 移除激活状态和原始值标记
            currentHotkeyInput.style.borderColor = "#e2e8f0";
            delete currentHotkeyInput.dataset.originalValue;
            currentHotkeyInput = null;
            originalHotkeyValue = null;
          }
        }
      };

      // 处理重置按钮点击
      const handleResetClick = (btn) => {
        const hotkeyId = btn.id.replace("reset-hotkey-", "");
        const input = document.getElementById(`hotkey-${hotkeyId}`);

        // 获取默认配置
        const defaultConfig = defaultHotkeys[hotkeyId];

        // 更新输入框显示
        input.value = formatHotkeyText(defaultConfig);

        // 更新临时配置
        currentHotkeyConfig[hotkeyId] = defaultConfig;
      };

      // 保存快捷键配置
      const saveHotkeyConfig = () => {
        if (typeof GM_setValue === "function") {
          GM_setValue("hotkeysConfig", currentHotkeyConfig);
        }
      };

      // 绑定事件监听器
      // 输入框点击事件
      document.querySelectorAll('input[id^="hotkey-"]').forEach((input) => {
        input.addEventListener("click", () => handleInputFocus(input));
        input.addEventListener("blur", () => handleInputBlur(input));
      });

      // 键盘事件
      document.addEventListener("keydown", handleKeydown);

      // 重置按钮事件
      document.querySelectorAll('button[id^="reset-hotkey-"]').forEach((btn) => {
        btn.addEventListener("click", () => handleResetClick(btn));
      });

      // 返回保存配置的方法
      return { saveHotkeyConfig };
    }

    // 初始化快捷键设置
    const hotkeyManager = initHotkeySettings();

    saveBtn.addEventListener("click", () => {
      // 从颜色选择器获取颜色值
      const materialColor = materialPicker.value;
      const userColor = userPicker.value;

      // 由于使用了颜色选择器，颜色值一定是有效的HEX格式，所以可以跳过验证
      if (!isValidColor(materialColor) || !isValidColor(userColor)) {
        alert("请选择有效的颜色");
        return;
      }

      const newConfig = {
        enableCustom: enableCustomSwitch.checked,
        enableDragDownload: enableDragSwitch.checked,
        enableRightClickDownload: enableRightClickSwitch.checked,
        enableRemoveWatermark: enableWatermarkSwitch.checked,
        enableHideSettingsButton: enableHideSettingsButtonSwitch.checked,
        materialColor: materialColor,
        userColor: userColor,
      };

      saveConfig(newConfig);

      // 保存快捷键配置
      hotkeyManager.saveHotkeyConfig();

      applyStyles();



      const originalText = saveBtn.textContent;
      saveBtn.textContent = "已保存！";
      setTimeout(
        () => (saveBtn.textContent = originalText),
        TIMING.switchTransition
      );

      setTimeout(closeConfig, TIMING.switchTransition + 200);
    });

    // 恢复默认
    resetBtn.addEventListener("click", () => {
      if (confirm("确定恢复默认设置吗？")) {
        saveConfig(DEFAULT_CONFIG);

        // 恢复所有开关状态的工厂函数
        const restoreSwitchState = (
          switchEl,
          thumbEl,
          containerEl,
          isEnabled
        ) => {
          switchEl.checked = isEnabled;
          const switchBg = containerEl.querySelector("span:nth-child(2)");
          switchBg.style.backgroundColor = isEnabled
            ? "#3b82f6"
            : "#e2e8f0";
          thumbEl.style.left = isEnabled ? "22px" : "2px";
        };

        // 恢复所有开关状态
        restoreSwitchState(
          enableCustomSwitch,
          enableCustomThumb,
          enableCustomContainer,
          DEFAULT_CONFIG.enableCustom
        );

        restoreSwitchState(
          enableDragSwitch,
          enableDragThumb,
          enableDragContainer,
          DEFAULT_CONFIG.enableDragDownload
        );
        restoreSwitchState(
          enableRightClickSwitch,
          enableRightClickThumb,
          enableRightClickContainer,
          DEFAULT_CONFIG.enableRightClickDownload
        );
        restoreSwitchState(
          enableWatermarkSwitch,
          enableWatermarkThumb,
          enableWatermarkContainer,
          DEFAULT_CONFIG.enableRemoveWatermark
        );
        restoreSwitchState(
          enableHideSettingsButtonSwitch,
          enableHideSettingsButtonThumb,
          enableHideSettingsButtonContainer,
          DEFAULT_CONFIG.enableHideSettingsButton
        );

        // 恢复颜色设置
        materialPreview.style.backgroundColor = DEFAULT_CONFIG.materialColor;
        materialPicker.value = DEFAULT_CONFIG.materialColor;
        userPreview.style.backgroundColor = DEFAULT_CONFIG.userColor;
        userPicker.value = DEFAULT_CONFIG.userColor;

        // 应用设置
        applyStyles();

        const originalText = resetBtn.textContent;
        resetBtn.textContent = "已恢复！";
        setTimeout(
          () => (resetBtn.textContent = originalText),
          TIMING.switchTransition
        );
      }
    });

    // 关闭配置
    function closeConfig() {
      container.style.opacity = "0";
      setTimeout(() => {
        container.remove();
        // 恢复页面滚动
        document.body.style.overflow = "auto";
      }, 200);
    }

    // 点击外部关闭
    container.addEventListener("click", (e) => {
      if (e.target === container) closeConfig();
    });

    // ESC键关闭
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeConfig();
    });
  }




  // ==================== 初始化 ====================

  // 初始化
  function init() {
    // 注册油猴菜单命令
    GM_registerMenuCommand("⚙️ 设置首选项", createConfigUI);

    // 应用样式（包含动画效果）
    applyStyles();

    // 立即尝试渲染素材网站列表（不等待事件）
    renderMaterialSitesOnSucaiPage();

    // 使用MutationObserver监听DOM变化，确保元素出现后立即渲染
    const materialSitesObserver = new MutationObserver(() => {
      if (window.location.href === "https://huaban.com/pages/sucai") {
        const layoutContent = document.getElementById("layout-content");
        if (layoutContent) {
          // 检查容器是否存在，如果不存在则渲染
          if (!document.getElementById("material-sites-container")) {
            renderMaterialSitesOnSucaiPage();
          }
        }
      }
    });

    // 观察body的子元素变化，持续监听
    materialSitesObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // 监听URL变化，处理单页应用导航
    let lastUrl = window.location.href;
    new MutationObserver(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        if (currentUrl === "https://huaban.com/pages/sucai") {
          // 延迟执行，确保DOM已更新
          setTimeout(() => {
            renderMaterialSitesOnSucaiPage();
          }, 500);
        }
      }
    }).observe(document, {
      subtree: true,
      childList: true
    });

    // 页面加载完成后执行初始化
    window.addEventListener("load", () => {
      debugLog("页面加载完成，执行初始化");
      setTimeout(() => {
        applyStyles();
      }, 500); // 延迟一点时间，确保页面完全渲染
    });

    // 监听页面变化
    const observer = observePageChanges();


    // 拦截拖拽和右键下载事件
    interceptDragAndDownload();

    // 在页面左下角添加设置按钮
    addSettingsButtonToPage();

    // 初始化图片hover面板
    initImageHover();

    // 去水印功能初始化
    // 监听DOM变化，处理异步加载内容
    const watermarkObserver = new MutationObserver(handleUpdate);
    watermarkObserver.observe(document.body, { childList: true, subtree: true });

    // 定期检查更新（处理URL变化等情况）
    setInterval(handleUpdate, 1000);

    // 清理函数
    window.addEventListener("beforeunload", () => {
      observer.disconnect();
      watermarkObserver.disconnect();
    });

    // 在页面左下角添加设置按钮
    function addSettingsButtonToPage() {
      try {
        // 检查是否已经添加过
        if (document.getElementById('hb-settings-button')) return;

        // 获取配置，检查是否需要隐藏设置按钮
        const config = getConfig();
        if (config.enableHideSettingsButton) {
          debugLog("设置按钮已隐藏");
          return;
        }

        // 创建设置按钮
        const settingsButton = document.createElement('div');
        settingsButton.id = 'hb-settings-button';
        settingsButton.innerHTML = '<img src="https://cdn.h5ds.com/space/files/600972551685382144/20260406/965287727847845888.png" style="width: 70px; cursor: pointer;">';

        // 设置固定定位，左下角，距离顶部30%
        settingsButton.style.cssText = `
          position: fixed;
          left: 1px;
          top: 50%;
          z-index: 9999;
          cursor: pointer;
          transition: transform 0.2s ease;
        `;

        // 添加悬停效果
        settingsButton.addEventListener('mouseenter', () => {
          settingsButton.style.transform = 'scale(1.1)';
        });
        settingsButton.addEventListener('mouseleave', () => {
          settingsButton.style.transform = 'scale(1)';
        });

        // 添加点击事件，打开脚本设置
        settingsButton.addEventListener('click', () => {
          createConfigUI();
        });

        // 添加到页面
        document.body.appendChild(settingsButton);

        debugLog("设置按钮已添加到页面左下角");
      } catch (error) {
        console.error("添加设置按钮失败:", error);
      }
    }

    // 添加快捷键处理
    document.addEventListener("keydown", (e) => {
      // 获取当前快捷键配置
      const hotkeysConfig = getHotkeysConfig();

      // 快速定位到搜索框
      if (isHotkeyMatch(e, hotkeysConfig.searchFocus)) {
        // 阻止默认行为
        e.preventDefault();
        // 查找搜索框并聚焦
        const searchInput = document.getElementById("hb_search_input");
        if (searchInput) {
          searchInput.focus();
          // 选中搜索框内容，方便直接输入新内容
          searchInput.select();

          // 查找data-button-name="搜索框"的元素并修改其:before伪元素背景色
          const searchButton = document.querySelector(
            '[data-button-name="搜索框"]'
          );
          if (searchButton) {
            // 添加类名以便修改伪元素样式
            searchButton.classList.add("hb-search-focused");

            // 8秒后移除类名，恢复原来的样式
            setTimeout(() => {
              searchButton.classList.remove("hb-search-focused");
            }, 8000);
          }
        }
      }

      // 以图搜索功能
      if (isHotkeyMatch(e, hotkeysConfig.imageSearch)) {
        // 查找以图搜索按钮
        const imageSearchButton = document.querySelector(
          '[data-button-name="以图搜索按钮"]'
        );

        if (imageSearchButton) {
          // 如果是第一次按下Ctrl+V/Cmd+V
          if (!isImageSearchMode) {
            // 阻止默认的粘贴行为
            e.preventDefault();
            // 模拟点击以图搜索按钮
            imageSearchButton.click();
            // 设置状态为true，表示已进入图片搜索模式
            isImageSearchMode = true;

            // 3秒后自动重置状态（如果用户没有进行第二次操作）
            setTimeout(() => {
              isImageSearchMode = false;
            }, 3000);
          } else {
            // 如果是第二次按下Ctrl+V/Cmd+V，恢复正常粘贴功能
            // 不阻止默认行为，让用户可以粘贴图片
            // 重置状态，以便下次使用
            isImageSearchMode = false;
          }
        }
      }

      // 打开设置界面
      if (isHotkeyMatch(e, hotkeysConfig.openSettings)) {
        // 阻止默认行为
        e.preventDefault();
        // 调用设置首选项函数
        createConfigUI();
      }
    });
  }

  init();
})();
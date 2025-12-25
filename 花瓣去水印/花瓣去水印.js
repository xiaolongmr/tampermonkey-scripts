// ==UserScript==
// @name         花瓣"去"水印
// @version      2025-12-25
// @description  主要功能：1.显示花瓣真假PNG（原理：脚本通过给花瓣图片添加背景色，显示出透明PNG图片，透出背景色的即为透明PNG，非透明PNG就会被过滤掉） 2.通过自定义修改背景色，区分VIP素材和免费素材。 3.花瓣官方素材[vip素材]去水印（原理：去水印功能只是把图片链接替换花瓣官网提供的没有水印的最大尺寸图片地址，并非真正破破解去水印,仅供学习使用）更多描述可安装后查看
// @author       小张 | 个人博客：https://blog.z-l.top | 公众号“爱吃馍” | 设计导航站 ：https://dh.z-l.top | quicker账号昵称：星河城野❤
// @license      GPL-3.0
// @namespace    https://getquicker.net/User/Actions/388875-%E6%98%9F%E6%B2%B3%E5%9F%8E%E9%87%8E%E2%9D%A4
// @match        https://huaban.com/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @connect      *
// @grant        GM_download
// @icon         https://st0.dancf.com/static/02/202306090204-51f4.png
// @require      https://cdn.jsdelivr.net/gh/xiaolongmr/tampermonkey-scripts@8ed09bc4be4797388576008ceadbe0f8258126e5/%E8%8A%B1%E7%93%A3%E5%8E%BB%E6%B0%B4%E5%8D%B0/%E8%8A%B1%E7%93%A3%E2%80%9C%E5%8E%BB%E2%80%9D%E6%B0%B4%E5%8D%B0%E6%9B%B4%E6%96%B0%E6%8F%90%E7%A4%BA%E8%84%9A%E6%9C%AC.js
// @require      https://cdn.tailwindcss.com
// ==/UserScript==

(function () {
  "use strict";

  // 获取脚本版本号
  const getScriptVersion = () => {
    try {
      return GM_info?.script?.version || "未知";
    } catch (e) {
      return "未知";
    }
  };

  const getHotkeysConfig = () => {
    const defaultHotkeys = {
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
        key: "v",
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
    return typeof GM_getValue === "function"
      ? GM_getValue("hotkeysConfig", defaultHotkeys)
      : defaultHotkeys;
  };

  // 在素材页面渲染素材网站列表
  async function renderMaterialSitesOnSucaiPage() {
    // 检查当前是否在指定页面
    if (window.location.href === "https://huaban.com/pages/sucai") {
      const layoutContent = document.getElementById("layout-content");
      if (layoutContent) {
        // 检查是否已经渲染过，避免重复创建
        if (document.getElementById("material-sites-container")) {
          return;
        }

        // 隐藏原有内容
        const children = Array.from(layoutContent.children);
        children.forEach((child) => {
          child.style.display = "none";
        });

        // 创建素材网站列表容器
        const materialSitesContainer = document.createElement("div");
        materialSitesContainer.id = "material-sites-container";
        materialSitesContainer.className = "bg-white rounded-lg p-4 mb-4";

        // 创建标题
        const title = document.createElement("h3");
        title.className = "text-lg font-medium text-slate-700 mb-3";
        title.textContent = "素材网站推荐";
        materialSitesContainer.appendChild(title);

        // 创建列表
        const sitesList = document.createElement("div");
        sitesList.className = "grid grid-cols-5 gap-3 overflow-auto";

        // 渲染素材网站列表
        try {
          // 从CDN或缓存加载数据
          const materialSites = await loadMaterialSites();
          
          materialSites.forEach((site) => {
            const siteItem = document.createElement("a");
            siteItem.href = site.href;
            siteItem.target = "_blank";
            siteItem.rel = "noopener noreferrer";
            siteItem.className =
              "flex items-center gap-2 p-3 border rounded-md hover:bg-slate-50 transition-colors text-sm";

            const siteLogo = document.createElement("img");
            siteLogo.src = site.logoSrc;
            siteLogo.alt = site.alt;
            siteLogo.className = "w-6 h-6 object-contain";

            const siteInfo = document.createElement("div");
            siteInfo.className = "flex-1 min-w-0";

            const siteTitle = document.createElement("div");
            siteTitle.className = "font-medium text-slate-700 truncate";
            siteTitle.textContent = site.title;

            const siteTip = document.createElement("div");
            siteTip.className = "text-xs text-slate-500 truncate";
            siteTip.textContent = site.tip;

            const sitePoints = document.createElement("div");
            sitePoints.className = "text-xs text-amber-600";
            sitePoints.textContent = site.jifen_tip;

            siteInfo.appendChild(siteTitle);
            siteInfo.appendChild(siteTip);
            siteItem.appendChild(siteLogo);
            siteItem.appendChild(siteInfo);
            siteItem.appendChild(sitePoints);
            sitesList.appendChild(siteItem);
          });
        } catch (error) {
          console.error("渲染素材网站列表失败:", error);
          sitesList.innerHTML = `<div class="col-span-3 text-center text-slate-500 py-4">无法加载素材网站列表</div>`;
        }

        materialSitesContainer.appendChild(sitesList);

        // 添加文案信息
        const infoText = document.createElement("div");
        infoText.className =
          "mt-4 p-4 bg-slate-50 rounded-lg text-sm text-slate-700 border border-slate-200";
        infoText.innerHTML =
          '以上网站使用 <a href="http://121.40.25.9:8080/register.html" target="_blank" class="text-blue-500 hover:underline">http://121.40.25.9:8080/</a> 素材下载网站 购买积分进行下载，你也可以自己注册，邀请码：1474728874 使用邀请码注册双方各得1000积分';
        materialSitesContainer.appendChild(infoText);

        // 将列表添加到页面中
        layoutContent.insertBefore(
          materialSitesContainer,
          layoutContent.firstChild
        );
      }
    }
  }

  // ==================== 常量定义 ====================
  // UI 配色方案
  const COLORS = {
    switchCustom: { on: "#4ade80", off: "#e2e8f0" },
    switchWatermark: { on: "#ff6b6b", off: "#e2e8f0" },
    switchDrag: { on: "#3b82f6", off: "#e2e8f0" },
    switchRightClick: { on: "#8b5cf6", off: "#e2e8f0" },
  };

  // 时间配置（毫秒）
  const TIMING = {
    debounceWatermark: 200, // 去水印操作的防抖延迟
    watermarkCheckInterval: 2000, // 水印检测间隔
    minProcessInterval: 500, // 最小处理间隔
    switchTransition: 1000, // 开关状态变化反馈时长
  };


  // 状态变量：跟踪Ctrl+V/Cmd+V的使用状态
  let isImageSearchMode = false;

  // DOM 选择器
  const SELECTORS = {
    // 花瓣网中的"查看大图"按钮图片
    imageButton:
      'img[data-button-name="查看大图"][src*="gd-hbimg-edge.huaban.com"]',
    // 图片查看器中的大图元素（带花瓣域名限制）
    imageViewer:
      'img.vYzIMzy2[alt="查看图片"][src*="gd-hbimg-edge.huaban.com"]',
    // 图片查看器容器内的大图元素（带容器ID和花瓣域名限制）
    imageViewerContainer:
      '#imageViewerWrapper img.vYzIMzy2[alt="查看图片"][src*="gd-hbimg-edge.huaban.com"]',
    // 简单图片查看器中的大图元素（不带域名限制）
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
    enableRemoveWatermark: true,
    // 仅支持花瓣官方素材去水印功能，第三方素材无效
    enableDragDownload: true,
    // 启用拖拽下载功能
    enableRightClickDownload: true,
    // 启用右键下载功能
  };

  // 配置字段映射（简化 getConfig/saveConfig）
  const CONFIG_KEYS = [
    "materialColor",
    "userColor",
    "enableCustom",
    "enableRemoveWatermark",
    "enableDragDownload",
    "enableRightClickDownload",
  ];

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
            .KKIUywzb[data-content-type="素材采集"] .transparent-img-bg {
                background-color: ${
                  config.enableCustom ? config.materialColor : "transparent"
                } !important;
                ${config.enableCustom ? "background-image:none!important;" : ""}
            }

            /* 用户上传背景色，非花瓣素材 */
            .KKIUywzb:not([data-content-type="素材采集"]) .transparent-img-bg,.transparent-img-black-bg,.transparent-img-bg {
                background-color: ${
                  config.enableCustom ? config.userColor : "transparent"
                } !important;
                ${config.enableCustom ? "background-image:none!important;" : ""}
            }
            
            /* 搜索框聚焦时的样式 - 仅在使用快捷键时触发 */
            [data-button-name="搜索框"].hb-search-focused:before {
                background: #ffb4b4ff !important;
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

  // 保存原始URL到图片元素的dataset中
  function saveOriginalUrl(img) {
    if (!img.dataset.originalSrc) {
      img.dataset.originalSrc = img.src;
      debugLog("保存原始URL:", img.dataset.originalSrc);
    }
    if (img.srcset && !img.dataset.originalSrcset) {
      img.dataset.originalSrcset = img.srcset;
      debugLog("保存原始srcset:", img.dataset.originalSrcset);
    }
  }

  // 恢复图片的原始URL
  function restoreOriginalUrl(img) {
    if (img.dataset.originalSrc) {
      debugLog("恢复原始URL:", img.dataset.originalSrc);
      img.src = img.dataset.originalSrc;
      delete img.dataset.originalSrc;
    }
    if (img.dataset.originalSrcset) {
      debugLog("恢复原始srcset:", img.dataset.originalSrcset);
      img.srcset = img.dataset.originalSrcset;
      delete img.dataset.originalSrcset;
    }
    // 移除处理标记
    img.removeAttribute("data-watermark-removed");
  }

  // 检查图片链接是否有效
  function checkImageUrl(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

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

  // 核心URL处理逻辑（同步）
  // 参数：
  // - url: 原始图片URL
  // - isOfficialMaterial: 是否为官方自营素材
  // 返回：string - 处理后的图片URL
  function extractImageUrlCore(url, isOfficialMaterial) {
    // 分离URL和查询参数
    const [baseUrl, queryParams] = url.split("?");
    // 匹配花瓣图片URL中的后缀参数，如 _fw658webp
    const suffixRegex = /(_fw\d+webp)(\.webp)?$/i;
    // 匹配花瓣图片URL的域名和图片ID部分
    const watermarkRegex = /(https?:\/\/gd-hbimg-edge\.huaban\.com)\/([^\/?]+)/;

    let cleanUrl = url;
    
    if (suffixRegex.test(baseUrl) || watermarkRegex.test(baseUrl)) {
      // 去除后缀参数，得到基础URL
      const baseCleanUrl = baseUrl.replace(suffixRegex, "");
      
      // 如果是官方自营素材，尝试添加/small/前缀
      if (isOfficialMaterial) {
        let urlWithSmallPrefix;
        
        // 检查域名是否包含/small/，如果没有在域名后添加/small/前缀
        if (baseCleanUrl.includes("/small/")) {
          // 已经包含/small/前缀，直接使用
          urlWithSmallPrefix = baseCleanUrl;
        } else {
          // 没有包含/small/前缀，添加前缀
          urlWithSmallPrefix = watermarkRegex.test(baseCleanUrl) 
            ? baseCleanUrl.replace(watermarkRegex, "$1/small/$2") 
            : baseCleanUrl;
        }
        
        // 组合完整URL
        cleanUrl = queryParams 
          ? `${urlWithSmallPrefix}?${queryParams}` 
          : urlWithSmallPrefix;
      } else {
        // 非官方自营素材，仅去除后缀参数
        cleanUrl = queryParams 
          ? `${baseCleanUrl}?${queryParams}` 
          : baseCleanUrl;
      }
    }
    
    return cleanUrl;
  }

  // 统一处理图片URL的去水印操作
  // 参数：
  // - url: 原始图片URL
  // - isOfficialMaterial: 是否为官方自营素材
  // - checkValidity: 是否检查URL有效性
  // 返回：Promise<string> - 处理后的图片URL
  async function processImageUrl(url, isOfficialMaterial, checkValidity = false) {
    // URL替换逻辑注释：
    // 1. 分离URL和查询参数（如 ?auth_key=xxx）
    // 2. 检查是否为官方自营素材
    // 3. 如果是官方自营素材：
    //    a. 去除后缀参数
    //    b. 检查域名是否包含/small/，如果没有在域名后添加/small/前缀 有就下一步
    //    c. 检查URL有效性
    //    d. 如果无效，回退到仅去除后缀参数的URL
    // 4. 如果不是官方自营素材：
    //    a. 仅去除后缀参数
    // 5. 保留原始查询参数
    
    // 使用核心同步函数处理URL
    const processedUrl = extractImageUrlCore(url, isOfficialMaterial);
    
    // 如果不需要检查有效性，直接返回处理后的URL
    if (!checkValidity) {
      return processedUrl;
    }
    
    // 需要检查URL有效性
    debugLog("检查处理后URL的有效性:", processedUrl);
    const isValid = await checkImageUrl(processedUrl);
    
    if (isValid) {
      // URL有效，使用处理后的URL
      debugLog("URL有效，使用处理后的URL");
      return processedUrl;
    } else {
      // URL无效，回退到仅去除后缀参数的URL（不添加/small/前缀）
      debugLog("URL无效，回退到仅去除后缀参数的URL");
      return extractImageUrlCore(url, false);
    }
  }

  function isOfficialMaterial() {
    return (
      Array.from(document.querySelectorAll(".fgsjNg46")).some(
        (el) => el.textContent && el.textContent.includes("官方自营")
      ) || document.querySelectorAll('[title="来自官方自营"]').length > 0
    );
  }

  function debugLog() {
    /* no-op */
  }

  // 去水印功能：修改图片链接
  function processWatermark(force = false) {
    const config = getConfig();
    const materialImages = getMaterialImages();

    debugLog(
      "执行水印处理，enable:",
      config.enableRemoveWatermark,
      "force:",
      force
    );

    let processedCount = 0;
    let skippedCount = 0;

    materialImages.forEach((img) => {
      try {
        const originalSrc = img.src;

        // 检查是否需要处理
        if (!config.enableRemoveWatermark) {
          // 如果功能已关闭，恢复原始URL
          if (img.dataset.originalSrc) {
            restoreOriginalUrl(img);
            processedCount++;
            debugLog("恢复原始URL:", originalSrc);
          } else {
            skippedCount++;
          }
          return;
        }

        // 如果功能已启用，但图片已处理且不是force模式，跳过
        if (!force && img.hasAttribute("data-watermark-removed")) {
          skippedCount++;
          return;
        }

        // 核心判断逻辑：只处理包含"官方自营"字样的素材
        // 查找包含"官方自营"文本的元素
        const isOfficialMaterial =
          // 原有条件：.fgsjNg46 元素包含"官方自营"文本
          Array.from(document.querySelectorAll(".fgsjNg46")).some(
            (element) =>
              element.textContent && element.textContent.includes("官方自营")
          ) ||
          // 新增条件：存在 title="来自官方自营" 的元素
          document.querySelectorAll('[title="来自官方自营"]').length > 0;
        debugLog("素材检查结果 - 是官方自营素材:", isOfficialMaterial);

        // 只处理官方自营素材，其他类型的素材一概跳过
        if (!isOfficialMaterial) {
          debugLog("跳过非官方自营素材图片:", originalSrc);
          skippedCount++;
          return;
        }

        // 保存原始URL
        saveOriginalUrl(img);

        // 去水印规则：在域名后添加/small/
        const watermarkRegex =
          /(https?:\/\/gd-hbimg-edge\.huaban\.com)\/([^\/?]+)/;

        // 处理图片链接
        (async () => {
          let modified = false;

          // 处理src属性
          if (
            watermarkRegex.test(originalSrc) &&
            !originalSrc.includes("/small/")
          ) {
            // 分离URL和查询参数
            const [baseUrl, queryParams] = originalSrc.split("?");
            // 在基础URL上添加/small/
            const newBaseUrl = baseUrl.replace(watermarkRegex, "$1/small/$2");
            // 保留查询参数（如果有）
            const newSrc = queryParams
              ? `${newBaseUrl}?${queryParams}`
              : newBaseUrl;
            debugLog("检查新图片URL是否有效:", newSrc);

            // 检查新链接是否有效
            const isValid = await checkImageUrl(newSrc);
            if (isValid) {
              debugLog("修改VIP图片src:", originalSrc, "→", newSrc);
              img.src = newSrc;
              modified = true;
            } else {
              debugLog("新图片URL无效，跳过处理:", newSrc);
            }
          }

          // 处理srcset属性
          if (
            img.srcset &&
            watermarkRegex.test(img.srcset) &&
            !img.srcset.includes("/small/")
          ) {
            // 处理srcset中的每个URL
            const newSrcset = img.srcset
              .split(" ")
              .map((item) => {
                if (item.match(/^https?:\/\//)) {
                  // 这是一个URL，需要处理
                  const [baseUrl, queryParams] = item.split("?");
                  const newBaseUrl = baseUrl.replace(
                    watermarkRegex,
                    "$1/small/$2"
                  );
                  return queryParams
                    ? `${newBaseUrl}?${queryParams}`
                    : newBaseUrl;
                }
                // 这可能是一个宽度描述符（如w500），直接返回
                return item;
              })
              .join(" ");

            debugLog("检查新图片srcset是否有效:", newSrcset);

            // 检查新链接是否有效
            const isValid = await checkImageUrl(newSrcset.split(" ")[0]); // 取第一个URL检查
            if (isValid) {
              debugLog("修改VIP图片srcset:", img.srcset, "→", newSrcset);
              img.srcset = newSrcset;
              modified = true;
            } else {
              debugLog("新图片srcset URL无效，跳过处理:", newSrcset);
            }
          }

          if (modified) {
            processedCount++;
            img.setAttribute("data-watermark-removed", "true");
            debugLog("图片处理成功");
          } else {
            skippedCount++;
            debugLog("图片无需处理或已处理");
          }
        })();
      } catch (error) {
        console.error("水印处理失败:", error, "图片:", img.src);
        skippedCount++;
      }
    });

    debugLog("=== 处理完成 ===");
    debugLog(`总共处理了${processedCount}张图片，跳过了${skippedCount}张`);
    return processedCount > 0;
  }

  // 获取所有需要处理的花瓣素材图片
  function getMaterialImages() {
    // 使用更精准的选择器，基于你提供的HTML元素
    const selectors = [
      // 缩略图：使用 data-button-name="查看大图" 属性
      SELECTORS.imageButton,
      // 大图查看器中的图片 - 优先级高，确保能捕获所有大图模式下的图片
      SELECTORS.imageViewerContainer,
      // 大图：使用 class="vYzIMzy2" 类名 + alt="查看图片" 属性
      SELECTORS.imageViewer,
      // 备用：花瓣素材图片
      '[data-material-type="套系素材"] img[src*="gd-hbimg-edge.huaban.com"]',
      // 备用：素材采集类型图片
      'img[src*="gd-hbimg-edge.huaban.com"][data-content-type="素材采集"]',
    ];

    return document.querySelectorAll(selectors.join(", "));
  }

  // 处理大图查看器
  function handleImageViewer() {
    const config = getConfig();

    if (!config.enableRemoveWatermark) {
      return;
    }

    debugLog("检查大图查看器");

    let imageViewerInterval = null;

    // 处理大图查看器中的图片的函数
    function processImageViewerImages() {
      const imageViewer = document.querySelector("#imageViewerWrapper");
      if (imageViewer) {
        const viewerImage = imageViewer.querySelector(
          SELECTORS.imageViewerSimple
        );
        if (viewerImage) {
          // 检查图片是否已加载完成
          if (viewerImage.complete && viewerImage.naturalWidth > 0) {
            debugLog("大图查看器：检测到已加载的图片，执行去水印处理");
            processWatermark(true); // 强制处理

            // 如果已成功处理，停止定时器
            if (viewerImage.hasAttribute("data-watermark-removed")) {
              if (imageViewerInterval) {
                clearInterval(imageViewerInterval);
                imageViewerInterval = null;
              }
            }
          } else {
            debugLog("大图查看器：等待图片加载完成...");
          }
        }
      } else if (imageViewerInterval) {
        // 如果大图查看器已关闭，停止定时器
        clearInterval(imageViewerInterval);
        imageViewerInterval = null;
      }
    }

    // 监听大图模态框的打开
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              // 检查是否是大图模态框
              if (
                node.querySelector("#imageViewerWrapper") ||
                node.querySelector(SELECTORS.imageViewerSimple)
              ) {
                debugLog("检测到大图模态框打开");

                // 首次处理
                setTimeout(() => {
                  processWatermark(true);
                }, 100);

                // 启动定期检查，确保图片完全加载后能被处理
                if (!imageViewerInterval) {
                  debugLog("启动大图查看器定期检查机制");
                  imageViewerInterval = setInterval(
                    processImageViewerImages,
                    300
                  );

                  // 设置最长检查时间为5秒
                  setTimeout(() => {
                    if (imageViewerInterval) {
                      clearInterval(imageViewerInterval);
                      imageViewerInterval = null;
                      debugLog("大图查看器定期检查超时，停止检查");
                    }
                  }, 5000);
                }
              }
            }
          });
        }

        // 也检查属性变化，特别是图片的src属性变化
        if (
          mutation.type === "attributes" &&
          mutation.target.tagName === "IMG"
        ) {
          if (
            mutation.target.matches(SELECTORS.imageViewerSimple) &&
            mutation.target.closest("#imageViewerWrapper")
          ) {
            debugLog("大图查看器：图片src属性发生变化，重新处理");
            setTimeout(() => {
              processWatermark(true);
            }, 100);
          }
        }
      });
    });

    // 观察body的变化，检测大图模态框的出现和图片属性变化
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "srcset"],
    });

    debugLog("大图查看器监听器已启动，增强版支持");
  }

  // 增强的页面变化监听，支持AJAX动态加载
  function observePageChanges() {
    let lastProcessTime = 0;
    const MIN_PROCESS_INTERVAL = 500; // 最小处理间隔，避免频繁处理

    const observer = new MutationObserver((mutations) => {
      const now = Date.now();
      const config = getConfig();

      // 检查是否有新的图片节点被添加或属性变化
      let needProcess = false;
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              // 元素节点
              // 检查是否包含需要处理的图片
              if (
                node.matches(
                  SELECTORS.imageButton + ", " + SELECTORS.imageViewerSimple
                ) ||
                node.querySelector(
                  SELECTORS.imageButton + ", " + SELECTORS.imageViewerSimple
                ) ||
                node.id === "imageViewerWrapper"
              ) {
                needProcess = true;
              }
            }
          });
        } else if (
          mutation.type === "attributes" &&
          mutation.target.tagName === "IMG"
        ) {
          // 图片属性变化时也需要处理
          if (
            mutation.target.matches(
              SELECTORS.imageButton + ", " + SELECTORS.imageViewerSimple
            )
          ) {
            needProcess = true;
          }
        }
      });

      // 如果需要处理且距离上次处理时间足够长
      if (needProcess && now - lastProcessTime > MIN_PROCESS_INTERVAL) {
        debugLog("检测到图片变化，触发水印处理");
        setTimeout(() => {
          processWatermark();
          lastProcessTime = Date.now();
        }, 100); // 延迟一点时间，确保图片完全加载
      }
    });

    // 更全面的观察选项
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "src",
        "srcset",
        "data-material-type",
        "class",
        "data-button-name",
        "alt",
      ],
    });

    debugLog("页面变化监听器已启动");
    return observer;
  }

  // 拦截XMLHttpRequest，在AJAX请求完成后执行处理
  function interceptAjaxRequests() {
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.send = function (body) {
      this.addEventListener("load", function () {
        try {
          // 检查是否是花瓣网的API请求
          if (
            this.responseURL &&
            this.responseURL.includes("huaban.com") &&
            (this.responseURL.includes("/pins/") ||
              this.responseURL.includes("/api/") ||
              this.responseURL.includes("/similar/") ||
              this.responseURL.includes("/image/"))
          ) {
            // 图片查看相关请求
            debugLog("检测到AJAX请求完成:", this.responseURL);
            // 延迟执行，确保数据已渲染到页面
            setTimeout(() => {
              processWatermark();
            }, 300);
          }
        } catch (error) {
          console.error("AJAX拦截器错误:", error);
        }
      });

      return originalSend.apply(this, arguments);
    };

    debugLog("AJAX请求拦截器已启动");
  }

  // 拦截fetch请求
  function interceptFetchRequests() {
    const originalFetch = window.fetch;

    window.fetch = function (input, init) {
      return originalFetch.apply(this, arguments).then((response) => {
        try {
          const url = typeof input === "string" ? input : input.url;
          if (
            url &&
            url.includes("huaban.com") &&
            (url.includes("/pins/") ||
              url.includes("/api/") ||
              url.includes("/similar/") ||
              url.includes("/image/"))
          ) {
            // 图片查看相关请求
            debugLog("检测到fetch请求完成:", url);
            // 延迟执行，确保数据已渲染到页面
            setTimeout(() => {
              processWatermark();
            }, 300);
          }
        } catch (error) {
          console.error("fetch拦截器错误:", error);
        }
        return response;
      });
    };

    debugLog("fetch请求拦截器已启动");
  }

  // 拦截图片点击事件，提前处理大图URL
  function interceptImageClicks() {
    // 使用事件委托监听所有图片点击
    document.addEventListener(
      "click",
      function (e) {
        const config = getConfig();

        // 精准匹配：使用 data-button-name="查看大图" 属性
        const img = e.target.closest(SELECTORS.imageButton.split("[src*")[0]);
        if (img && img.src.includes("gd-hbimg-edge.huaban.com")) {
          // 检查是否为官方自营素材（新增 title 选择器，满足任一条件即判定）
          const isOfficialMaterial =
            // 原有条件：.fgsjNg46 元素包含“官方自营”文本
            Array.from(document.querySelectorAll(".fgsjNg46")).some(
              (element) =>
                element.textContent && element.textContent.includes("官方自营")
            ) ||
            // 新增条件：存在 title="来自官方自营" 的元素
            document.querySelectorAll('[title="来自官方自营"]').length > 0;

          if (isOfficialMaterial) {
            debugLog("检测到官方自营素材图片点击:", img.src);

            if (config.enableRemoveWatermark) {
              // 提前保存原始URL
              saveOriginalUrl(img);

              // 预生成大图URL
              const watermarkRegex =
                // /(https?:\/\/gd-hbimg-edge\.huaban.com)\/([^\/?]+)/;
                /(https?:\/\/gd-hbimg-edge\.huaban\.com)\/([^\/?]+)/;
              if (
                watermarkRegex.test(img.src) &&
                !img.src.includes("/small/")
              ) {
                const baseImageKey = img.src
                  .match(watermarkRegex)[2]
                  .split("_")[0];
                const largeImageUrl = `https://gd-hbimg-edge.huaban.com/small/${baseImageKey}`;
                debugLog("预生成VIP大图URL:", largeImageUrl);
              }
            } else {
              // 如果功能已关闭，确保使用原始URL
              restoreOriginalUrl(img);
            }
          } else {
            debugLog("检测到非官方自营素材图片点击，跳过预处理:", img.src);
            // 对于非官方自营素材，确保使用原始URL
            restoreOriginalUrl(img);
          }

          // 延迟一点时间，确保大图模态框已打开
          setTimeout(() => {
            processWatermark(true);
          }, 200);
        }
      },
      true
    );

    debugLog("图片点击事件拦截器已启动");
  }

  // 拦截拖拽和右键下载事件，移除图片后缀参数
  function interceptDragAndDownload() {
    // 监听拖拽开始事件 - 支持传统拖拽（拖拽到桌面/资源管理器）
    document.addEventListener("dragstart", function (e) {
      const img = e.target;
      if (
        img.tagName === "IMG" &&
        img.src.includes("gd-hbimg-edge.huaban.com")
      ) {
        // 检查是否为需要处理的图片类型
        if (
          img.matches(SELECTORS.imageButton.split("[src*")[0]) ||
          img.closest("#imageViewerWrapper") ||
          img.matches(SELECTORS.imageViewerSimple) ||
          // 新增：支持预览图片（a标签内的img标签）
          (img.closest("a") &&
            img.closest("a").querySelector('span[style*="display: none"]'))
        ) {
          // 检查拖拽下载功能是否启用
          const config = getConfig();
          if (!config.enableDragDownload) {
            debugLog("拖拽下载功能已禁用，跳过处理");
            return;
          }

          debugLog("检测到图片拖拽开始:", img.src);

          // 检查是否为官方自营素材
          const isOfficial = isOfficialMaterial();
          debugLog("是否为官方自营素材:", isOfficial);

          // 使用核心同步函数处理URL（不检查有效性）
          const cleanUrl = extractImageUrlCore(img.src, isOfficial);
          
          debugLog("同步处理后的下载URL:", img.src, "→", cleanUrl);

          // 设置拖拽数据 - 支持传统拖拽到桌面/资源管理器
          e.dataTransfer.setData("text/uri-list", cleanUrl);
          e.dataTransfer.setData("text/plain", cleanUrl);
          
          // 设置文件名：优先使用alt属性，如果没有则使用URL生成的文件名
          const fileName = getFileNameFromAlt(img) + ".png";
          e.dataTransfer.setData(
            "DownloadURL",
            `image/png:${fileName}:${cleanUrl}`
          );
          
          debugLog("已设置拖拽数据，文件名将保存为:", fileName);
        }
      }
    });

    // 监听右键菜单事件 - 使用GM_download API直接下载
    document.addEventListener("contextmenu", async function (e) {
      const img = e.target;
      if (
        img.tagName === "IMG" &&
        img.src.includes("gd-hbimg-edge.huaban.com")
      ) {
        // 检查是否为需要处理的图片类型
        if (
          img.matches(SELECTORS.imageButton.split("[src*")[0]) ||
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

          // 检查是否为官方自营素材
          const isOfficial = isOfficialMaterial();
          debugLog("是否为官方自营素材:", isOfficial);

          // 使用统一的URL处理函数
          const cleanUrl = await processImageUrl(img.src, isOfficial, true);
          debugLog("处理后的下载URL:", img.src, "→", cleanUrl);

          // 使用GM_download API直接下载处理后的图片
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
                  console.log("图片下载成功:", fileName);
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

        // 添加.png扩展名
        return cleanAlt;
      }
    }

    // 如果alt属性无效，返回默认名称
    return "未命名";
  }

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
      "fixed inset-0 bg-black/30 flex items-center justify-center z-[115] backdrop-blur-sm";

    // 禁止页面滚动
    document.body.style.overflow = "hidden";

    // 创建卡片（更宽以容纳侧边栏）
    const card = document.createElement("div");
    // 固定高度布局，确保左侧导航与右侧内容高度一致
    card.className =
      "bg-white rounded-xl shadow-[0_8px_25px_rgba(0,0,0,0.15)] w-[900px] h-[680px] max-w-[96vw] flex flex-col overflow-hidden";
    card.style.fontFamily =
      '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

    // 侧边栏与主内容容器
    const bodyWrap = document.createElement("div");
    bodyWrap.className = "flex flex-1 min-h-0";

    const sidebar = document.createElement("div");
    // 侧栏采用纵向布局，底部显示版本号
    sidebar.className =
      "w-[150px] p-3 bg-slate-50 box-border flex flex-col justify-between overflow-hidden";

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
    versionEl.className = "text-xs text-slate-400 p-3";
    versionEl.textContent = `版本 v${getScriptVersion()}`;
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
      main.style.borderRadius = "0";
      main.innerHTML = "";
      // 将原来的 content 区域内容渲染到 main
      main.innerHTML = "";
      // switchesSection, colorSettings, actions 会被插入后
      main.appendChild(switchesSection);
      main.innerHTML += colorSettings;
      main.appendChild(hotkeysSettings);
      main.appendChild(actions);

      // 初始化时根据开关状态显示或隐藏颜色选择器
      const colorSettingsContainer = document.getElementById(
        "colorSettingsContainer"
      );
      const enableCustomSwitch = document.getElementById("enableCustomSwitch");
      if (colorSettingsContainer && enableCustomSwitch) {
        colorSettingsContainer.style.display = enableCustomSwitch.checked
          ? "block"
          : "none";
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
      fallback.innerHTML = `若嵌入内容无法显示，请 <a href="${feishuUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500">在新标签页打开更新记录</a>（飞书文档）`;
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
      fallback.innerHTML = `若嵌入内容无法显示，请 <a href="${feishuUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500">在新标签页打开使用说明</a>（飞书文档）`;
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
                        <img src="${data.avatar.url}" alt="${
            data.username
          }" class="avatar">
                        <div class="profile-info">
                            <h3>${data.username}</h3>
                            <p class="job">${
                              data.profile.job || "未填写职业信息"
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
                            <span class="stat-value">${
                              data.follower_count
                            }</span>
                            <span class="stat-label">粉丝</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${
                              data.following_count
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
          console.error("获取花瓣用户信息失败:", error);
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
      main.innerHTML = "";
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
        "公众号文章开了广告，朋友们有空的话每天可点点广告，收益将用于购买素材解析网站的积分，帮使用脚本的朋友免费下载素材，可下载的素材<a href='https://huaban.com/pages/sucai' target='_blank' class='text-blue-500 hover:underline'>点我进入查看</a>，可在此处留言，看到会帮忙下载的，积分用完为止！";
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
          } catch (e) {}
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
        iframe.frameBorder = "0";

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
            <span style="
                font-size: 14px;
                font-weight: 500;
                color: #475569;
                display: flex;
                align-items: center;
            ">
                开启图片自定义背景色
            </span>
            <div style="position: relative; width: 40px; height: 20px; cursor: pointer;" id="enableCustomContainer">
                <input type="checkbox" id="enableCustomSwitch" ${
                  config.enableCustom ? "checked" : ""
                }
                       style="position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 3;">
                <span style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: ${config.enableCustom ? "#4ade80" : "#e2e8f0"};
                    border-radius: 10px;
                    transition: background 0.2s ease;
                    z-index: 1;
                "></span>
                <span style="
                    position: absolute;
                    width: 16px;
                    height: 16px;
                    left: ${config.enableCustom ? "22px" : "2px"};
                    top: 2px;
                    background: white;
                    border-radius: 50%;
                    transition: left 0.2s ease;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    z-index: 2;
                " id="enableCustomThumb"></span>
            </div>
        `;

    enableCustomSection.innerHTML = enableCustomHTML;

    // 去水印功能开关
    const enableWatermarkSection = document.createElement("div");
    enableWatermarkSection.className =
      "flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200";

    const enableWatermarkHTML = `
            <span style="
                font-size: 14px;
                font-weight: 500;
                color: #475569;
                display: flex;
                align-items: center;
            ">花瓣 vip 素材去水印
            </span>
            <div style="position: relative; width: 40px; height: 20px; cursor: pointer;" id="enableWatermarkContainer">
                <input type="checkbox" id="enableWatermarkSwitch" ${
                  config.enableRemoveWatermark ? "checked" : ""
                }
                       style="position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 3;">
                <span style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: ${
                      config.enableRemoveWatermark ? "#ff6b6b" : "#e2e8f0"
                    };
                    border-radius: 10px;
                    transition: background 0.2s ease;
                    z-index: 1;
                "></span>
                <span style="
                    position: absolute;
                    width: 16px;
                    height: 16px;
                    left: ${config.enableRemoveWatermark ? "22px" : "2px"};
                    top: 2px;
                    background: white;
                    border-radius: 50%;
                    transition: left 0.2s ease;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    z-index: 2;
                " id="enableWatermarkThumb"></span>
            </div>
        `;

    enableWatermarkSection.innerHTML = enableWatermarkHTML;

    // 拖拽下载功能开关
    const enableDragSection = document.createElement("div");
    enableDragSection.className =
      "flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200";

    const enableDragHTML = `
            <span style="
                font-size: 14px;
                font-weight: 500;
                color: #475569;
                display: flex;
                align-items: center;
            ">拖拽下载图片<span style="font-size: 12px; color: #94a3b8; margin-left: 4px;">（适配资源管理器/<a href="https://wwz.lanzouq.com/iyUTy1zt2b4d" target="_blank" style="color: #3b82f6; text-decoration: none;" title="点击下载PureRef">PureRef</a>）</span>
            </span>
            <div style="position: relative; width: 40px; height: 20px; cursor: pointer;" id="enableDragContainer">
                <input type="checkbox" id="enableDragSwitch" ${
                  config.enableDragDownload ? "checked" : ""
                }
                       style="position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 3;">
                <span style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: ${
                      config.enableDragDownload ? "#3b82f6" : "#e2e8f0"
                    };
                    border-radius: 10px;
                    transition: background 0.2s ease;
                    z-index: 1;
                "></span>
                <span style="
                    position: absolute;
                    width: 16px;
                    height: 16px;
                    left: ${config.enableDragDownload ? "22px" : "2px"};
                    top: 2px;
                    background: white;
                    border-radius: 50%;
                    transition: left 0.2s ease;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    z-index: 2;
                " id="enableDragThumb"></span>
            </div>
        `;

    enableDragSection.innerHTML = enableDragHTML;

    // 右键下载功能开关
    const enableRightClickSection = document.createElement("div");
    enableRightClickSection.className =
      "flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200";

    const enableRightClickHTML = `
            <span style="
                font-size: 14px;
                font-weight: 500;
                color: #475569;
                display: flex;
                align-items: center;
            ">右键下载图片<span style="font-size: 12px; color: #94a3b8; margin-left: 4px;">（修正乱码名称）</span>
            </span>
            <div style="position: relative; width: 40px; height: 20px; cursor: pointer;" id="enableRightClickContainer">
                <input type="checkbox" id="enableRightClickSwitch" ${
                  config.enableRightClickDownload ? "checked" : ""
                }
                       style="position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 3;">
                <span style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: ${
                      config.enableRightClickDownload ? "#8b5cf6" : "#e2e8f0"
                    };
                    border-radius: 10px;
                    transition: background 0.2s ease;
                    z-index: 1;
                "></span>
                <span style="
                    position: absolute;
                    width: 16px;
                    height: 16px;
                    left: ${config.enableRightClickDownload ? "22px" : "2px"};
                    top: 2px;
                    background: white;
                    border-radius: 50%;
                    transition: left 0.2s ease;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    z-index: 2;
                " id="enableRightClickThumb"></span>
            </div>
        `;

    enableRightClickSection.innerHTML = enableRightClickHTML;

    // 组装开关区域
    switchesSection.appendChild(enableCustomSection);
    switchesSection.appendChild(enableWatermarkSection);
    switchesSection.appendChild(enableDragSection);
    switchesSection.appendChild(enableRightClickSection);

    const colorSettings = `
            <!-- 颜色设置容器 -->
            <div id="colorSettingsContainer" class="mb-3">
            <div style="
                font-size: 13px;
                color: #334155;
                font-weight: 600;
                margin-bottom: 8px;
            ">
                🎨 颜色设置
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <!-- 花瓣素材颜色 -->
            <div style="p-2 bg-slate-50 rounded-lg border border-slate-200;">
                <div style="
                    display: flex;
                    align-items: center;
                    margin-bottom: 4px;
                    font-size: 11px;
                    color: #475569;
                    font-weight: 500;
                ">
                    <span style="
                        width: 8px;
                        height: 8px;
                        background: ${config.materialColor};
                        border-radius: 2px;
                        margin-right: 4px;
                        border: 1px solid #e2e8f0;
                    "></span>
                    花瓣素材
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <div style="
                        width: 28px;
                        height: 28px;
                        background: ${config.materialColor};
                        border-radius: 3px;
                        cursor: pointer;
                        border: 1px solid #e2e8f0;
                    " id="materialPreview">
                        <input type="color" id="materialPicker" value="${config.materialColor}"
                               style="width: 100%; height: 100%; opacity: 0; cursor: pointer;">
                    </div>
                    <input type="text" id="materialInput" value="${config.materialColor}"
                           style="
                               flex: 1;
                               padding: 4px 6px;
                               border: 1px solid #e2e8f0;
                               border-radius: 3px;
                               font-size: 11px;
                               color: #334155;
                           ">
                </div>
            </div>

            <!-- 用户上传颜色 -->
            <div style="p-2 bg-slate-50 rounded-lg border border-slate-200;">
                <div style="
                    display: flex;
                    align-items: center;
                    margin-bottom: 4px;
                    font-size: 11px;
                    color: #475569;
                    font-weight: 500;
                ">
                    <span style="
                        width: 8px;
                        height: 8px;
                        background: ${config.userColor};
                        border-radius: 2px;
                        margin-right: 4px;
                        border: 1px solid #e2e8f0;
                    "></span>
                    用户上传
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <div style="
                        width: 28px;
                        height: 28px;
                        background: ${config.userColor};
                        border-radius: 3px;
                        cursor: pointer;
                        border: 1px solid #e2e8f0;
                    " id="userPreview">
                        <input type="color" id="userPicker" value="${config.userColor}"
                               style="width: 100%; height: 100%; opacity: 0; cursor: pointer;">
                    </div>
                    <input type="text" id="userInput" value="${config.userColor}"
                           style="
                               flex: 1;
                               padding: 4px 6px;
                               border: 1px solid #e2e8f0;
                               border-radius: 3px;
                               font-size: 11px;
                               color: #334155;
                           ">
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
            <div style="color: #64748b; font-size: 11px; margin-bottom: 10px;">
                点击输入框后按下新的快捷键组合
            </div>
        </div>`;

    // 获取当前快捷键配置
    const hotkeysConfig = getHotkeysConfig();

    // 快捷键项目列表
    const hotkeyItems = [
      { id: "searchFocus", label: "定位到搜索框", defaultKey: "k" },
      { id: "imageSearch", label: "以图搜索功能", defaultKey: "v" },
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
            "><span style="font-size: 12px; color: #334155; font-weight: 500;">${
              item.label
            }</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
                <div style="flex: 1;">
                    <input type="text" id="hotkey-${item.id}" 
                           value="${hotkeyConfig.ctrlCmd ? "Ctrl+" : ""}${
        hotkeyConfig.shift ? "Shift+" : ""
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

    const enableWatermarkSwitch = document.getElementById(
      "enableWatermarkSwitch"
    );
    const enableWatermarkThumb = document.getElementById(
      "enableWatermarkThumb"
    );
    const enableWatermarkContainer = document.getElementById(
      "enableWatermarkContainer"
    );

    const materialPreview = document.getElementById("materialPreview");
    const materialPicker = document.getElementById("materialPicker");
    const materialInput = document.getElementById("materialInput");
    const userPreview = document.getElementById("userPreview");
    const userPicker = document.getElementById("userPicker");
    const userInput = document.getElementById("userInput");
    const saveBtn = document.getElementById("saveBtn");
    const resetBtn = document.getElementById("resetBtn");

    // 开关事件处理器工厂函数 - 消除重复代码
    const createSwitchHandler = (
      switchElement,
      thumbElement,
      containerElement,
      colorMap,
      callback
    ) => {
      return function () {
        const isChecked = this.checked;
        const switchBg = containerElement.querySelector("span:nth-child(2)");
        switchBg.style.backgroundColor = isChecked ? colorMap.on : colorMap.off;
        thumbElement.style.left = isChecked ? "22px" : "2px";
        if (typeof callback === "function") callback(isChecked);
      };
    };

    // 修复自定义背景色开关功能
    enableCustomSwitch.addEventListener(
      "change",
      createSwitchHandler(
        enableCustomSwitch,
        enableCustomThumb,
        enableCustomContainer,
        COLORS.switchCustom,
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

    // 修复去水印开关功能
    enableWatermarkSwitch.addEventListener(
      "change",
      createSwitchHandler(
        enableWatermarkSwitch,
        enableWatermarkThumb,
        enableWatermarkContainer,
        COLORS.switchWatermark,
        (isChecked) => {
          debugLog("去水印开关状态变化，立即处理所有图片");
          setTimeout(() => {
            processWatermark(true);
          }, TIMING.debounceWatermark);
        }
      )
    );

    // 拖拽下载开关功能
    enableDragSwitch.addEventListener(
      "change",
      createSwitchHandler(
        enableDragSwitch,
        enableDragThumb,
        enableDragContainer,
        COLORS.switchDrag,
        (isChecked) => {
          debugLog("拖拽下载开关状态变化:", isChecked);
        }
      )
    );

    // 右键下载开关功能
    enableRightClickSwitch.addEventListener(
      "change",
      createSwitchHandler(
        enableRightClickSwitch,
        enableRightClickThumb,
        enableRightClickContainer,
        COLORS.switchRightClick,
        (isChecked) => {
          debugLog("右键下载开关状态变化:", isChecked);
        }
      )
    );

    // 颜色验证
    function isValidColor(color) {
      const hexRegex = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i;
      const rgbRegex =
        /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;
      return hexRegex.test(color) || rgbRegex.test(color);
    }

    // 颜色选择器工厂函数 - 消除重复代码
    const createColorPickerHandler = (
      inputElement,
      pickerElement,
      previewElement
    ) => {
      // 预览元素点击打开拾色器
      previewElement.addEventListener("click", () => pickerElement.click());

      // 拾色器输入事件
      pickerElement.addEventListener("input", (e) => {
        inputElement.value = e.target.value;
        previewElement.style.backgroundColor = e.target.value;
      });

      // 文本输入事件
      inputElement.addEventListener("input", (e) => {
        const color = e.target.value;
        if (isValidColor(color)) {
          previewElement.style.backgroundColor = color;
          if (color.startsWith("#")) {
            pickerElement.value = color;
          }
        }
      });
    };

    // 绑定材料水印颜色选择器
    createColorPickerHandler(materialInput, materialPicker, materialPreview);

    // 绑定用户水印颜色选择器
    createColorPickerHandler(userInput, userPicker, userPreview);

    // 保存配置
    // 快捷键配置变量
    let currentHotkeyInput = null;
    let currentHotkeyConfig = null;

    // 快捷键输入框点击事件
    const hotkeyInputs = document.querySelectorAll('input[id^="hotkey-"]');
    hotkeyInputs.forEach((input) => {
      input.addEventListener("click", () => {
        // 移除其他输入框的激活状态
        hotkeyInputs.forEach((i) => (i.style.borderColor = "#e2e8f0"));

        // 设置当前激活的输入框
        currentHotkeyInput = input;
        currentHotkeyInput.style.borderColor = "#ff284b";
        currentHotkeyInput.value = "请按下新的快捷键组合...";
      });
    });

    // 键盘事件监听（捕获快捷键）
    document.addEventListener("keydown", (e) => {
      if (currentHotkeyInput) {
        e.preventDefault();

        // 获取按键信息
        const ctrlCmd = e.ctrlKey || e.metaKey;
        const shift = e.shiftKey;
        const alt = e.altKey;
        const key = e.key.toLowerCase();

        // 只允许字母、数字和部分符号
        if (key && key.length === 1 && !e.code.includes("F") && key !== " ") {
          // 更新输入框显示
          const hotkeyText = `${ctrlCmd ? "Ctrl+" : ""}${
            shift ? "Shift+" : ""
          }${alt ? "Alt+" : ""}${key.toUpperCase()}`;
          currentHotkeyInput.value = hotkeyText;

          // 保存到临时配置
          const hotkeyId = currentHotkeyInput.dataset.hotkeyId;
          if (!currentHotkeyConfig) {
            currentHotkeyConfig = getHotkeysConfig();
          }
          currentHotkeyConfig[hotkeyId] = {
            ctrlCmd,
            shift,
            alt,
            key,
            description: currentHotkeyConfig[hotkeyId].description,
          };

          // 移除激活状态
          currentHotkeyInput.style.borderColor = "#e2e8f0";
          currentHotkeyInput = null;
        }
      }
    });

    // 快捷键重置按钮事件
    const resetHotkeyBtns = document.querySelectorAll(
      'button[id^="reset-hotkey-"]'
    );
    resetHotkeyBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const hotkeyId = btn.id.replace("reset-hotkey-", "");
        const input = document.getElementById(`hotkey-${hotkeyId}`);

        // 获取默认配置
        const defaultHotkeys = {
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
            key: "v",
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

        // 重置配置
        const defaultConfig = defaultHotkeys[hotkeyId];
        input.value = `${defaultConfig.ctrlCmd ? "Ctrl+" : ""}${
          defaultConfig.shift ? "Shift+" : ""
        }${defaultConfig.alt ? "Alt+" : ""}${defaultConfig.key.toUpperCase()}`;

        // 更新临时配置
        if (!currentHotkeyConfig) {
          currentHotkeyConfig = getHotkeysConfig();
        }
        currentHotkeyConfig[hotkeyId] = defaultConfig;
      });
    });

    saveBtn.addEventListener("click", () => {
      const materialColor = materialInput.value;
      const userColor = userInput.value;

      if (!isValidColor(materialColor) || !isValidColor(userColor)) {
        alert("请输入有效的颜色代码（HEX或RGB格式）");
        return;
      }

      const newConfig = {
        enableCustom: enableCustomSwitch.checked,
        enableRemoveWatermark: enableWatermarkSwitch.checked,
        enableDragDownload: enableDragSwitch.checked,
        enableRightClickDownload: enableRightClickSwitch.checked,
        materialColor: materialColor,
        userColor: userColor,
      };

      saveConfig(newConfig);

      // 保存快捷键配置
      if (typeof GM_setValue === "function") {
        GM_setValue("hotkeysConfig", currentHotkeyConfig || getHotkeysConfig());
      }

      applyStyles();

      // 根据去水印开关状态处理图片
      debugLog("保存设置后，处理所有图片");
      setTimeout(() => {
        processWatermark(true); // force=true
      }, TIMING.debounceWatermark);

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
          colorMap,
          isEnabled
        ) => {
          switchEl.checked = isEnabled;
          const switchBg = containerEl.querySelector("span:nth-child(2)");
          switchBg.style.backgroundColor = isEnabled
            ? colorMap.on
            : colorMap.off;
          thumbEl.style.left = isEnabled ? "22px" : "2px";
        };

        // 恢复所有开关状态
        restoreSwitchState(
          enableCustomSwitch,
          enableCustomThumb,
          enableCustomContainer,
          COLORS.switchCustom,
          DEFAULT_CONFIG.enableCustom
        );
        restoreSwitchState(
          enableWatermarkSwitch,
          enableWatermarkThumb,
          enableWatermarkContainer,
          COLORS.switchWatermark,
          DEFAULT_CONFIG.enableRemoveWatermark
        );
        restoreSwitchState(
          enableDragSwitch,
          enableDragThumb,
          enableDragContainer,
          COLORS.switchDrag,
          DEFAULT_CONFIG.enableDragDownload
        );
        restoreSwitchState(
          enableRightClickSwitch,
          enableRightClickThumb,
          enableRightClickContainer,
          COLORS.switchRightClick,
          DEFAULT_CONFIG.enableRightClickDownload
        );

        // 恢复颜色设置
        materialInput.value = DEFAULT_CONFIG.materialColor;
        materialPreview.style.backgroundColor = DEFAULT_CONFIG.materialColor;
        materialPicker.value = DEFAULT_CONFIG.materialColor;
        userInput.value = DEFAULT_CONFIG.userColor;
        userPreview.style.backgroundColor = DEFAULT_CONFIG.userColor;
        userPicker.value = DEFAULT_CONFIG.userColor;

        // 应用设置
        applyStyles();
        debugLog("恢复默认后，处理所有图片");
        setTimeout(() => {
          processWatermark(true); // force=true
        }, TIMING.debounceWatermark);

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
          renderMaterialSitesOnSucaiPage();
          // 只需要渲染一次，所以停止观察
          materialSitesObserver.disconnect();
        }
      }
    });

    // 观察body的子元素变化
    materialSitesObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // 页面加载完成后执行水印处理
    window.addEventListener("load", () => {
      debugLog("页面加载完成，执行初始水印处理");
      setTimeout(() => {
        applyStyles();
        processWatermark(true); // 初始加载时强制处理，processWatermark函数内部会判断是否为VIP素材
      }, 500); // 延迟一点时间，确保页面完全渲染
    });

    // 监听页面变化，自动处理水印
    const observer = observePageChanges();

    // 拦截AJAX请求
    interceptAjaxRequests();

    // 拦截fetch请求
    interceptFetchRequests();

    // 拦截图片点击事件
    interceptImageClicks();

    // 拦截拖拽和右键下载事件
    interceptDragAndDownload();

    // 处理大图查看器
    handleImageViewer();

    // 定期检查（作为最后的保障）
    setInterval(() => {
      processWatermark();
    }, 2000);

    // 清理函数
    window.addEventListener("beforeunload", () => {
      observer.disconnect();
    });

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

    // 使用动态版本号输出日志（样式化控制台信息）
    (function () {
      const v = getScriptVersion();
      const s1 =
        "padding: 2px 6px; border-radius: 3px 0 0 3px; color: #fff; background: #FF6699; font-weight: bold;";
      const s2 =
        "padding: 2px 6px; border-radius: 0 3px 3px 0; color: #fff; background: #FF9999; font-weight: bold;";
      console.info(`%c 花瓣去水印 %c v${v} `, s1, s2);
    })();
  }

  // 显示使用说明弹窗（改为嵌入飞书文档）
  function showUsageGuide() {
    const existing = document.getElementById("huabanUsageGuide");
    if (existing) {
      existing.remove();
      return;
    }

    const container = document.createElement("div");
    container.id = "huabanUsageGuide";
    container.className =
      "fixed inset-0 bg-black/30 flex items-center justify-center z-[115] backdrop-blur-sm";

    // 禁止页面滚动
    document.body.style.overflow = "hidden";

    const card = document.createElement("div");
    card.className =
      "bg-white rounded-[24px] shadow-[0_8px_25px_rgba(0,0,0,0.15)] w-[1000px] h-[820px] max-w-[96vw] max-h-[86vh] flex flex-col overflow-hidden";

    const header = document.createElement("div");
    header.className =
      "px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-[rgb(248,250,252)]";
    header.innerHTML = `<h3 style="margin:0; font-size:16px; color:#334155; font-weight:600;">使用说明</h3><button id="closeUsageGuide" style="background:none;border:none;cursor:pointer;padding:4px;border-radius:4px;display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="#64748b"><path d="M198.1 267.7l75.4-75.4 576.3 576.3-75.4 75.4-576.3-576.3zm576.4-69.3l75.4 75.4-580.7 580.8-75.4-75.4 580.7-580.8z"/></svg></button>`;

    const content = document.createElement("div");
    content.className =
      "flex-1 overflow-auto p-0 flex items-stretch justify-stretch";

    // Feishu doc URL (嵌入为 iframe)，并提供外链作为回退
    const feishuUrl =
      "https://ai-chimo.feishu.cn/wiki/E9SEwhoMmiv2CkkC1VgcAbRTnW3";

    const iframeWrap = document.createElement("div");
    iframeWrap.className = "flex-1 min-h-0";

    const iframe = document.createElement("iframe");
    iframe.src = feishuUrl;
    iframe.className = "w-full h-full border-0 min-h-[400px]";
    iframe.allow = "fullscreen; clipboard-write";

    // 说明与外链回退
    const fallback = document.createElement("div");
    fallback.className =
      "p-3 text-sm text-slate-400 bg-amber-50 border-t border-amber-100 text-center";
    fallback.innerHTML = `若嵌入内容无法显示，请点击此处在新标签页打开： <a href="${feishuUrl}" target="_blank" rel="noopener noreferrer" style="color:#3b82f6;text-decoration:none;">打开使用说明（飞书文档）</a>`;

    iframeWrap.appendChild(iframe);
    content.appendChild(iframeWrap);

    card.appendChild(header);
    card.appendChild(content);
    card.appendChild(fallback);
    container.appendChild(card);
    document.body.appendChild(container);

    const closeBtn = header.querySelector("#closeUsageGuide");
    closeBtn.addEventListener("click", () => {
      container.remove();
      // 恢复页面滚动
      document.body.style.overflow = "auto";
    });

    container.addEventListener("click", (e) => {
      if (e.target === container) {
        container.remove();
        // 恢复页面滚动
        document.body.style.overflow = "auto";
      }
    });

    const escHandler = (e) => {
      if (e.key === "Escape") {
        container.remove();
        // 恢复页面滚动
        document.body.style.overflow = "auto";
      }
    };
    document.addEventListener("keydown", escHandler);
    container.addEventListener("remove", () => {
      document.removeEventListener("keydown", escHandler);
      // 恢复页面滚动
      document.body.style.overflow = "auto";
    });
  }

  init();
})();

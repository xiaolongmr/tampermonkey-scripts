// ==UserScript==
// @name         花瓣"去"水印
// @version      2.6
// @description  主要功能：1.显示花瓣真假PNG（原理：脚本通过给花瓣图片添加背景色，显示出透明PNG图片，透出背景色的即为透明PNG，非透明PNG就会被过滤掉） 2.通过自定义修改背景色，区分VIP素材和免费素材。 3.花瓣官方素材[vip素材]去水印（原理：去水印功能只是把图片链接替换花瓣官网提供的没有水印的最大尺寸图片地址，并非真正破破解去水印,仅供学习使用）
// @author       小张 | 个人博客：https://blog.z-l.top | 公众号“爱吃馍” | 设计导航站 ：https://dh.z-l.top | quicker账号昵称：星河城野❤
// @license      GPL-3.0
// @namespace    https://getquicker.net/User/Actions/388875-%E6%98%9F%E6%B2%B3%E5%9F%8E%E9%87%8E%E2%9D%A4
// @match        https://huaban.com/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @downloadURL https://update.greasyfork.org/scripts/554301/%E8%8A%B1%E7%93%A3%E7%9C%9F%E5%81%87PNG.user.js
// @updateURL https://update.greasyfork.org/scripts/554301/%E8%8A%B1%E7%93%A3%E7%9C%9F%E5%81%87PNG.meta.js
// @icon         https://st0.dancf.com/static/02/202306090204-51f4.png
// ==/UserScript==

(function () {
  'use strict';

  // 默认配置
  const DEFAULT_CONFIG = {
    materialColor: '#ffe0e0',
    // 花瓣官方素材：淡红色
    userColor: '#ebffff',
    // 用户上传：粉蓝色
    enableCustom: true,
    // 启用自定义背景色
    enableRemoveWatermark: true
  };

  // 获取配置
  function getConfig() {
    return {
      materialColor: GM_getValue('materialColor', DEFAULT_CONFIG.materialColor),
      userColor: GM_getValue('userColor', DEFAULT_CONFIG.userColor),
      enableCustom: GM_getValue('enableCustom', DEFAULT_CONFIG.enableCustom),
      enableRemoveWatermark: GM_getValue('enableRemoveWatermark', DEFAULT_CONFIG.enableRemoveWatermark)
    };
  }

  // 保存配置
  function saveConfig(config) {
    GM_setValue('materialColor', config.materialColor);
    GM_setValue('userColor', config.userColor);
    GM_setValue('enableCustom', config.enableCustom);
    GM_setValue('enableRemoveWatermark', config.enableRemoveWatermark);
  }

  // 应用样式
  function applyStyles() {
    const config = getConfig();

    // 移除旧样式
    const oldStyle = document.getElementById('huaban-bg-style');
    if (oldStyle) oldStyle.remove();

    // 添加动画效果CSS
    const style = document.createElement('style');
    style.id = 'huaban-bg-style';
    style.textContent = `
            /* 动画效果类 */
            .icon-spin {
                animation: spin 2s linear infinite;
            }
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            /* 花瓣素材背景色 */
            .KKIUywzb[data-material-type="套系素材"] .transparent-img-bg {
                background-color: ${config.enableCustom ? config.materialColor : 'transparent'} !important;
                ${config.enableCustom ? 'background-image:none!important;' : ''}
            }

            /* 用户上传背景色 */
            .KKIUywzb:not([data-material-type="套系素材"]) .transparent-img-bg,.transparent-img-black-bg {
                background-color: ${config.enableCustom ? config.userColor : 'transparent'} !important;
                ${config.enableCustom ? 'background-image:none!important;' : ''}
            }
            /* 设置按钮动画效果 */
           .setting-icon-container ._iconImg_1xz4q_15 {
                animation: spin 30s linear infinite;
            }
            /* 悬停动画效果 */
            .setting-icon-container:hover ._iconImg_1xz4q_15 {
                animation: spin 2s linear infinite;
            }
        `;
    document.head.appendChild(style);
  }

  // 保存原始URL到图片元素的dataset中
  function saveOriginalUrl(img) {
    if (!img.dataset.originalSrc) {
      img.dataset.originalSrc = img.src;
      console.log('保存原始URL:', img.dataset.originalSrc);
    }
    if (img.srcset && !img.dataset.originalSrcset) {
      img.dataset.originalSrcset = img.srcset;
      console.log('保存原始srcset:', img.dataset.originalSrcset);
    }
  }

  // 恢复图片的原始URL
  function restoreOriginalUrl(img) {
    if (img.dataset.originalSrc) {
      console.log('恢复原始URL:', img.dataset.originalSrc);
      img.src = img.dataset.originalSrc;
      delete img.dataset.originalSrc;
    }
    if (img.dataset.originalSrcset) {
      console.log('恢复原始srcset:', img.dataset.originalSrcset);
      img.srcset = img.dataset.originalSrcset;
      delete img.dataset.originalSrcset;
    }
    // 移除处理标记
    img.removeAttribute('data-watermark-removed');
  }

  // 去水印功能：修改图片链接
  function processWatermark(force = false) {
    const config = getConfig();
    const materialImages = getMaterialImages();

    console.log('执行水印处理，enable:', config.enableRemoveWatermark, 'force:', force);

    let processedCount = 0;
    let skippedCount = 0;

    materialImages.forEach(img => {
      try {
        const originalSrc = img.src;

        // 检查是否需要处理
        if (!config.enableRemoveWatermark) {
          // 如果功能已关闭，恢复原始URL
          if (img.dataset.originalSrc) {
            restoreOriginalUrl(img);
            processedCount++;
            console.log('恢复原始URL:', originalSrc);
          } else {
            skippedCount++;
          }
          return;
        }

        // 如果功能已启用，但图片已处理且不是force模式，跳过
        if (!force && img.hasAttribute('data-watermark-removed')) {
          skippedCount++;
          return;
        }

        // 核心判断逻辑：只处理包含"官方自营"字样的素材
        // 查找包含"官方自营"文本的元素
        const isOfficialMaterial = Array.from(document.querySelectorAll('.fgsjNg46')).some(element =>
          element.textContent && element.textContent.includes('官方自营')
        );

        console.log('素材检查结果 - 是官方自营素材:', isOfficialMaterial);

        // 只处理官方自营素材，其他类型的素材一概跳过
        if (!isOfficialMaterial) {
          console.log('跳过非官方自营素材图片:', originalSrc);
          skippedCount++;
          return;
        }

        // 保存原始URL
        saveOriginalUrl(img);

        // 去水印规则：在域名后添加/small/
        const watermarkRegex = /(https?:\/\/gd-hbimg\.huaban\.com)\/([^\/]+)/;

        let modified = false;

        // 处理src属性
        if (watermarkRegex.test(originalSrc) && !originalSrc.includes('/small/')) {
          const newSrc = originalSrc.replace(watermarkRegex, '$1/small/$2');
          console.log('修改VIP图片src:', originalSrc, '→', newSrc);
          img.src = newSrc;
          modified = true;
        }

        // 处理srcset属性
        if (img.srcset && watermarkRegex.test(img.srcset) && !img.srcset.includes('/small/')) {
          const newSrcset = img.srcset.replace(watermarkRegex, '$1/small/$2');
          console.log('修改VIP图片srcset:', img.srcset, '→', newSrcset);
          img.srcset = newSrcset;
          modified = true;
        }

        if (modified) {
          processedCount++;
          img.setAttribute('data-watermark-removed', 'true');
          console.log('图片处理成功');
        } else {
          skippedCount++;
          console.log('图片无需处理或已处理');
        }

      } catch (error) {
        console.error('水印处理失败:', error, '图片:', img.src);
        skippedCount++;
      }
    });

    console.log(`\n=== 处理完成 ===`);
    console.log(`总共处理了${processedCount}张图片，跳过了${skippedCount}张`);
    return processedCount > 0;
  }

  // 获取所有需要处理的花瓣素材图片
  function getMaterialImages() {
    // 使用更精准的选择器，基于你提供的HTML元素
    const selectors = [
      // 缩略图：使用 data-button-name="查看大图" 属性
      'img[data-button-name="查看大图"][src*="gd-hbimg.huaban.com"]',
      // 大图查看器中的图片 - 优先级高，确保能捕获所有大图模式下的图片
      '#imageViewerWrapper img.vYzIMzy2[alt="查看图片"][src*="gd-hbimg.huaban.com"]',
      // 大图：使用 class="vYzIMzy2" 类名 + alt="查看图片" 属性
      'img.vYzIMzy2[alt="查看图片"][src*="gd-hbimg.huaban.com"]',
      // 备用：花瓣素材图片
      '[data-material-type="套系素材"] img[src*="gd-hbimg.huaban.com"]',
      // 备用：素材采集类型图片
      'img[src*="gd-hbimg.huaban.com"][data-content-type="素材采集"]'
    ];

    return document.querySelectorAll(selectors.join(', '));
  }

  // 处理大图查看器
  function handleImageViewer() {
    const config = getConfig();

    if (!config.enableRemoveWatermark) {
      return;
    }

    console.log('检查大图查看器');

    let imageViewerInterval = null;

    // 处理大图查看器中的图片的函数
    function processImageViewerImages() {
      const imageViewer = document.querySelector('#imageViewerWrapper');
      if (imageViewer) {
        const viewerImage = imageViewer.querySelector('img.vYzIMzy2[alt="查看图片"]');
        if (viewerImage) {
          // 检查图片是否已加载完成
          if (viewerImage.complete && viewerImage.naturalWidth > 0) {
            console.log('大图查看器：检测到已加载的图片，执行去水印处理');
            processWatermark(true); // 强制处理

            // 如果已成功处理，停止定时器
            if (viewerImage.hasAttribute('data-watermark-removed')) {
              if (imageViewerInterval) {
                clearInterval(imageViewerInterval);
                imageViewerInterval = null;
              }
            }
          } else {
            console.log('大图查看器：等待图片加载完成...');
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
              if (node.querySelector('#imageViewerWrapper') ||
                node.querySelector('img.vYzIMzy2[alt="查看图片"]')) {
                console.log('检测到大图模态框打开');

                // 首次处理
                setTimeout(() => {
                  processWatermark(true);
                }, 100);

                // 启动定期检查，确保图片完全加载后能被处理
                if (!imageViewerInterval) {
                  console.log('启动大图查看器定期检查机制');
                  imageViewerInterval = setInterval(processImageViewerImages, 300);

                  // 设置最长检查时间为5秒
                  setTimeout(() => {
                    if (imageViewerInterval) {
                      clearInterval(imageViewerInterval);
                      imageViewerInterval = null;
                      console.log('大图查看器定期检查超时，停止检查');
                    }
                  }, 5000);
                }
              }
            }
          });
        }

        // 也检查属性变化，特别是图片的src属性变化
        if (mutation.type === 'attributes' && mutation.target.tagName === 'IMG') {
          if (mutation.target.matches('img.vYzIMzy2[alt="查看图片"]') &&
            mutation.target.closest('#imageViewerWrapper')) {
            console.log('大图查看器：图片src属性发生变化，重新处理');
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
      attributeFilter: ['src', 'srcset']
    });

    console.log('大图查看器监听器已启动，增强版支持');
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
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // 元素节点
              // 检查是否包含需要处理的图片
              if (node.matches('img[data-button-name="查看大图"], img.vYzIMzy2[alt="查看图片"]') ||
                node.querySelector('img[data-button-name="查看大图"], img.vYzIMzy2[alt="查看图片"]') ||
                node.id === 'imageViewerWrapper') {
                needProcess = true;
              }
            }
          });
        } else if (mutation.type === 'attributes' && mutation.target.tagName === 'IMG') {
          // 图片属性变化时也需要处理
          if (mutation.target.matches('img[data-button-name="查看大图"], img.vYzIMzy2[alt="查看图片"]')) {
            needProcess = true;
          }
        }
      });

      // 如果需要处理且距离上次处理时间足够长
      if (needProcess && now - lastProcessTime > MIN_PROCESS_INTERVAL) {
        console.log('检测到图片变化，触发水印处理');
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
      attributeFilter: ['src', 'srcset', 'data-material-type', 'class', 'data-button-name', 'alt']
    });

    console.log('页面变化监听器已启动');
    return observer;
  }

  // 拦截XMLHttpRequest，在AJAX请求完成后执行处理
  function interceptAjaxRequests() {
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.send = function (body) {
      this.addEventListener('load', function () {
        try {
          // 检查是否是花瓣网的API请求
          if (this.responseURL &&
            this.responseURL.includes('huaban.com') &&
            (this.responseURL.includes('/pins/') ||
              this.responseURL.includes('/api/') ||
              this.responseURL.includes('/similar/') ||
              this.responseURL.includes('/image/'))) { // 图片查看相关请求
            console.log('检测到AJAX请求完成:', this.responseURL);
            // 延迟执行，确保数据已渲染到页面
            setTimeout(() => {
              processWatermark();
            }, 300);
          }
        } catch (error) {
          console.error('AJAX拦截器错误:', error);
        }
      });

      return originalSend.apply(this, arguments);
    };

    console.log('AJAX请求拦截器已启动');
  }

  // 拦截fetch请求
  function interceptFetchRequests() {
    const originalFetch = window.fetch;

    window.fetch = function (input, init) {
      return originalFetch.apply(this, arguments)
        .then(response => {
          try {
            const url = typeof input === 'string' ? input : input.url;
            if (url &&
              url.includes('huaban.com') &&
              (url.includes('/pins/') ||
                url.includes('/api/') ||
                url.includes('/similar/') ||
                url.includes('/image/'))) { // 图片查看相关请求
              console.log('检测到fetch请求完成:', url);
              // 延迟执行，确保数据已渲染到页面
              setTimeout(() => {
                processWatermark();
              }, 300);
            }
          } catch (error) {
            console.error('fetch拦截器错误:', error);
          }
          return response;
        });
    };

    console.log('fetch请求拦截器已启动');
  }

  // 拦截图片点击事件，提前处理大图URL
  function interceptImageClicks() {
    // 使用事件委托监听所有图片点击
    document.addEventListener('click', function (e) {
      const config = getConfig();

      // 精准匹配：使用 data-button-name="查看大图" 属性
      const img = e.target.closest('img[data-button-name="查看大图"]');
      if (img && img.src.includes('gd-hbimg.huaban.com')) {
        // 检查是否为官方自营素材
        const isOfficialMaterial = Array.from(document.querySelectorAll('.fgsjNg46')).some(element =>
          element.textContent && element.textContent.includes('官方自营')
        );

        if (isOfficialMaterial) {
          console.log('检测到官方自营素材图片点击:', img.src);

          if (config.enableRemoveWatermark) {
            // 提前保存原始URL
            saveOriginalUrl(img);

            // 预生成大图URL
            const watermarkRegex = /(https?:\/\/gd-hbimg\.huaban\.com)\/([^\/]+)/;
            if (watermarkRegex.test(img.src) && !img.src.includes('/small/')) {
              const baseImageKey = img.src.match(watermarkRegex)[2].split('_')[0];
              const largeImageUrl = `https://gd-hbimg.huaban.com/small/${baseImageKey}`;
              console.log('预生成VIP大图URL:', largeImageUrl);
            }
          } else {
            // 如果功能已关闭，确保使用原始URL
            restoreOriginalUrl(img);
          }
        } else {
          console.log('检测到非官方自营素材图片点击，跳过预处理:', img.src);
          // 对于非官方自营素材，确保使用原始URL
          restoreOriginalUrl(img);
        }

        // 延迟一点时间，确保大图模态框已打开
        setTimeout(() => {
          processWatermark(true);
        }, 200);
      }
    }, true);

    console.log('图片点击事件拦截器已启动');
  }

  // 创建配置界面
  function createConfigUI() {
    const config = getConfig();

    // 检查是否已存在配置面板
    const existingPanel = document.getElementById('huabanConfig');
    if (existingPanel) {
      existingPanel.remove();
      return;
    }

    // 创建主容器
    const container = document.createElement('div');
    container.id = 'huabanConfig';
    container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            backdrop-filter: blur(4px);
        `;

    // 创建卡片
    const card = document.createElement('div');
    card.style.cssText = `
            background: white;
            border-radius: 24px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            width: 320px;
            max-width: 95vw;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        `;

    // 卡片头部
    const header = document.createElement('div');
    header.style.cssText = `
            padding: 16px;
            border-bottom: 1px solid #e2e8f0;
            text-align: center;
            background-color: var(--background-color-secondary-regular,rgb(248, 250, 252));
        `;
    header.innerHTML = `
            <h3 style="margin: 0; color: #334155; font-size: 16px; font-weight: 600;">
                花瓣 - 设置首选项
            </h3>
        `;

    // 卡片内容
    const content = document.createElement('div');
    content.style.cssText = `
            padding: 16px;
        `;

    // 启用开关区域
    const switchesSection = document.createElement('div');
    switchesSection.style.cssText = `
            margin-bottom: 16px;
        `;

    // 自定义背景色开关
    const enableCustomSection = document.createElement('div');
    enableCustomSection.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            padding: 12px;
            background: #f8fafc;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        `;

    const enableCustomHTML = `
            <span style="
                font-size: 14px;
                font-weight: 500;
                color: #475569;
                display: flex;
                align-items: center;
            ">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
                    <path d="M20 6L9 17l-5-5"/>
                </svg>
                开启图片自定义背景色
            </span>
            <div style="position: relative; width: 40px; height: 20px; cursor: pointer;" id="enableCustomContainer">
                <input type="checkbox" id="enableCustomSwitch" ${config.enableCustom ? 'checked' : ''}
                       style="position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 3;">
                <span style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: ${config.enableCustom ? '#4ade80' : '#e2e8f0'};
                    border-radius: 10px;
                    transition: background 0.2s ease;
                    z-index: 1;
                "></span>
                <span style="
                    position: absolute;
                    width: 16px;
                    height: 16px;
                    left: ${config.enableCustom ? '22px' : '2px'};
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
    const enableWatermarkSection = document.createElement('div');
    enableWatermarkSection.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
            padding: 12px;
            background: #f8fafc;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        `;

    const enableWatermarkHTML = `
            <span style="
                font-size: 14px;
                font-weight: 500;
                color: #475569;
                display: flex;
                align-items: center;
            ">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
                    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                    <line x1="16" y1="8" x2="2" y2="22"></line>
                    <line x1="17.5" y1="15" x2="9" y2="15"></line>
                </svg>
                花瓣 vip 素材去水印
            </span>
            <div style="position: relative; width: 40px; height: 20px; cursor: pointer;" id="enableWatermarkContainer">
                <input type="checkbox" id="enableWatermarkSwitch" ${config.enableRemoveWatermark ? 'checked' : ''}
                       style="position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 3;">
                <span style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: ${config.enableRemoveWatermark ? '#ff6b6b' : '#e2e8f0'};
                    border-radius: 10px;
                    transition: background 0.2s ease;
                    z-index: 1;
                "></span>
                <span style="
                    position: absolute;
                    width: 16px;
                    height: 16px;
                    left: ${config.enableRemoveWatermark ? '22px' : '2px'};
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

    // 组装开关区域
    switchesSection.appendChild(enableCustomSection);
    switchesSection.appendChild(enableWatermarkSection);

    // 颜色设置区域
    const colorSettings = `
            <!-- 花瓣素材颜色 -->
            <div style="margin-bottom: 12px;">
                <div style="
                    display: flex;
                    align-items: center;
                    margin-bottom: 8px;
                    font-size: 13px;
                    color: #475569;
                    font-weight: 500;
                ">
                    <span style="
                        width: 10px;
                        height: 10px;
                        background: ${config.materialColor};
                        border-radius: 3px;
                        margin-right: 6px;
                        border: 1px solid #e2e8f0;
                    "></span>
                    花瓣官方素材背景色
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="
                        width: 36px;
                        height: 36px;
                        background: ${config.materialColor};
                        border-radius: 6px;
                        cursor: pointer;
                        border: 1px solid #e2e8f0;
                    " id="materialPreview">
                        <input type="color" id="materialPicker" value="${config.materialColor}"
                               style="width: 100%; height: 100%; opacity: 0; cursor: pointer;">
                    </div>
                    <input type="text" id="materialInput" value="${config.materialColor}"
                           style="
                               flex: 1;
                               padding: 8px 10px;
                               border: 1px solid #e2e8f0;
                               border-radius: 6px;
                               font-size: 13px;
                               color: #334155;
                           ">
                </div>
            </div>

            <!-- 用户上传颜色 -->
            <div style="margin-bottom: 16px;">
                <div style="
                    display: flex;
                    align-items: center;
                    margin-bottom: 8px;
                    font-size: 13px;
                    color: #475569;
                    font-weight: 500;
                ">
                    <span style="
                        width: 10px;
                        height: 10px;
                        background: ${config.userColor};
                        border-radius: 3px;
                        margin-right: 6px;
                        border: 1px solid #e2e8f0;
                    "></span>
                    用户上传图片背景色
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="
                        width: 36px;
                        height: 36px;
                        background: ${config.userColor};
                        border-radius: 6px;
                        cursor: pointer;
                        border: 1px solid #e2e8f0;
                    " id="userPreview">
                        <input type="color" id="userPicker" value="${config.userColor}"
                               style="width: 100%; height: 100%; opacity: 0; cursor: pointer;">
                    </div>
                    <input type="text" id="userInput" value="${config.userColor}"
                           style="
                               flex: 1;
                               padding: 8px 10px;
                               border: 1px solid #e2e8f0;
                               border-radius: 6px;
                               font-size: 13px;
                               color: #334155;
                           ">
                </div>
            </div>
        `;

    // 操作按钮
    const actions = document.createElement('div');
    actions.style.cssText = `
            display: flex;
            gap: 8px;
        `;
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
    content.appendChild(actions);

    // 组装卡片
    card.appendChild(header);
    card.appendChild(content);
    container.appendChild(card);

    // 添加到页面
    document.body.appendChild(container);

    // 获取元素
    const enableCustomSwitch = document.getElementById('enableCustomSwitch');
    const enableCustomThumb = document.getElementById('enableCustomThumb');
    const enableCustomContainer = document.getElementById('enableCustomContainer');

    const enableWatermarkSwitch = document.getElementById('enableWatermarkSwitch');
    const enableWatermarkThumb = document.getElementById('enableWatermarkThumb');
    const enableWatermarkContainer = document.getElementById('enableWatermarkContainer');

    const materialPreview = document.getElementById('materialPreview');
    const materialPicker = document.getElementById('materialPicker');
    const materialInput = document.getElementById('materialInput');
    const userPreview = document.getElementById('userPreview');
    const userPicker = document.getElementById('userPicker');
    const userInput = document.getElementById('userInput');
    const saveBtn = document.getElementById('saveBtn');
    const resetBtn = document.getElementById('resetBtn');

    // 修复自定义背景色开关功能
    enableCustomSwitch.addEventListener('change', function () {
      const isChecked = this.checked;
      const switchBg = enableCustomContainer.querySelector('span:nth-child(2)');
      switchBg.style.background = isChecked ? '#4ade80' : '#e2e8f0';
      enableCustomThumb.style.left = isChecked ? '22px' : '2px';
      applyStyles(); // 重新应用样式
    });

    // 修复去水印开关功能
    enableWatermarkSwitch.addEventListener('change', function () {
      const isChecked = this.checked;
      const switchBg = enableWatermarkContainer.querySelector('span:nth-child(2)');
      switchBg.style.background = isChecked ? '#ff6b6b' : '#e2e8f0';
      enableWatermarkThumb.style.left = isChecked ? '22px' : '2px';

      // 立即应用水印处理（根据开关状态决定是去水印还是恢复）
      console.log('去水印开关状态变化，立即处理所有图片');
      setTimeout(() => {
        processWatermark(true); // force=true，强制重新处理
      }, 200);
    });

    // 颜色验证
    function isValidColor(color) {
      const hexRegex = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i;
      const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;
      return hexRegex.test(color) || rgbRegex.test(color);
    }

    // 事件监听
    materialPreview.addEventListener('click', () => materialPicker.click());
    userPreview.addEventListener('click', () => userPicker.click());

    materialPicker.addEventListener('input', (e) => {
      materialInput.value = e.target.value;
      materialPreview.style.background = e.target.value;
    });

    userPicker.addEventListener('input', (e) => {
      userInput.value = e.target.value;
      userPreview.style.background = e.target.value;
    });

    materialInput.addEventListener('input', (e) => {
      if (isValidColor(e.target.value)) {
        materialPreview.style.background = e.target.value;
        if (e.target.value.startsWith('#')) {
          materialPicker.value = e.target.value;
        }
      }
    });

    userInput.addEventListener('input', (e) => {
      if (isValidColor(e.target.value)) {
        userPreview.style.background = e.target.value;
        if (e.target.value.startsWith('#')) {
          userPicker.value = e.target.value;
        }
      }
    });

    // 保存配置
    saveBtn.addEventListener('click', () => {
      const materialColor = materialInput.value;
      const userColor = userInput.value;

      if (!isValidColor(materialColor) || !isValidColor(userColor)) {
        alert('请输入有效的颜色代码（HEX或RGB格式）');
        return;
      }

      const newConfig = {
        enableCustom: enableCustomSwitch.checked,
        enableRemoveWatermark: enableWatermarkSwitch.checked,
        materialColor: materialColor,
        userColor: userColor
      };

      saveConfig(newConfig);
      applyStyles();

      // 根据去水印开关状态处理图片
      console.log('保存设置后，处理所有图片');
      setTimeout(() => {
        processWatermark(true); // force=true
      }, 200);

      const originalText = saveBtn.textContent;
      saveBtn.textContent = '已保存！';
      setTimeout(() => saveBtn.textContent = originalText, 1000);

      setTimeout(closeConfig, 1200);
    });

    // 恢复默认
    resetBtn.addEventListener('click', () => {
      if (confirm('确定恢复默认设置吗？')) {
        saveConfig(DEFAULT_CONFIG);

        // 恢复自定义背景色开关
        enableCustomSwitch.checked = DEFAULT_CONFIG.enableCustom;
        const customSwitchBg = enableCustomContainer.querySelector('span:nth-child(2)');
        customSwitchBg.style.background = DEFAULT_CONFIG.enableCustom ? '#4ade80' : '#e2e8f0';
        enableCustomThumb.style.left = DEFAULT_CONFIG.enableCustom ? '22px' : '2px';

        // 恢复去水印开关
        enableWatermarkSwitch.checked = DEFAULT_CONFIG.enableRemoveWatermark;
        const watermarkSwitchBg = enableWatermarkContainer.querySelector('span:nth-child(2)');
        watermarkSwitchBg.style.background = DEFAULT_CONFIG.enableRemoveWatermark ? '#ff6b6b' : '#e2e8f0';
        enableWatermarkThumb.style.left = DEFAULT_CONFIG.enableRemoveWatermark ? '22px' : '2px';

        // 恢复颜色设置
        materialInput.value = DEFAULT_CONFIG.materialColor;
        materialPreview.style.background = DEFAULT_CONFIG.materialColor;
        materialPicker.value = DEFAULT_CONFIG.materialColor;
        userInput.value = DEFAULT_CONFIG.userColor;
        userPreview.style.background = DEFAULT_CONFIG.userColor;
        userPicker.value = DEFAULT_CONFIG.userColor;

        // 应用设置
        applyStyles();
        console.log('恢复默认后，处理所有图片');
        setTimeout(() => {
          processWatermark(true); // force=true
        }, 200);

        const originalText = resetBtn.textContent;
        resetBtn.textContent = '已恢复！';
        setTimeout(() => resetBtn.textContent = originalText, 1000);
      }
    });

    // 关闭配置
    function closeConfig() {
      container.style.opacity = '0';
      setTimeout(() => container.remove(), 200);
    }

    // 点击外部关闭
    container.addEventListener('click', (e) => {
      if (e.target === container) closeConfig();
    });

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeConfig();
    });
  }

  // 创建悬浮提示（与客服按钮100%视觉一致）
  function createPopupTip() {
    // 获取或创建popup-root
    let popupRoot = document.getElementById('popup-root');
    if (!popupRoot) {
      popupRoot = document.createElement('div');
      popupRoot.id = 'popup-root';
      document.body.appendChild(popupRoot);
    }

    // 创建提示框（完全使用花瓣原生类名和样式）
    const popup = document.createElement('div');
    popup.className = 'popup-content gd-suspension-panel_popup_tip-content gd-suspension-panel_popup_left-content center-content';
    popup.role = 'tooltip';
    popup.id = 'popup-0';
    popup.style.cssText = `
            position: absolute;
            z-index: 999;
            pointer-events: auto;
            display: none;
            visibility: hidden;
            margin-left: -4px;
        `;

    // 提示框内容（完全复制客服按钮的结构，不设置颜色）
    popup.innerHTML = `
            <div style="height: 8px; width: 16px; position: absolute; background: transparent; z-index: -1; transform: rotate(90deg); top: 50%; left: 100%; margin-top: -4px; margin-left: -1px;">
                <svg data-testid="arrow" class="popup-arrow gd-suspension-panel_popup_tip-arrow gd-suspension-panel_popup_left-arrow center-arrow" viewBox="0 0 32 16" style="position: absolute;">
                    <path d="M16 0l16 16H0z" fill="currentcolor"></path>
                </svg>
            </div>
            <div class="gd-suspension-panel_popup_content">
                <div>花瓣 - 设置首选项</div>
            </div>
        `;

    popupRoot.appendChild(popup);
    return popup;
  }

  // 在页面右下角区域添加设置按钮（与客服按钮100%视觉一致）
  function addSettingButtonToPage() {
    // 创建原生样式的设置按钮，添加合适的间距
    const settingButton = document.createElement('div');
    settingButton.className = 'gd-suspension-panel_popup_trigger';
    settingButton.setAttribute('aria-describedby', 'popup-0');
    // 添加与其他按钮一致的间距
    settingButton.style.marginBottom = '8px';


    // 使用用户提供的SVG图标，添加动画容器
    settingButton.innerHTML = `
            <div class="_menuFeedback__trigger_1uwcl_1 setting-icon-container">
                <div class="_iconBox_1xz4q_1">
                    <img class="_iconImg_1xz4q_15"
                         src="https://cdn.h5ds.com/space/files/600972551685382144/20251031/908681999043854336.svg"
                         alt="settings">
                </div>
            </div>
        `;

    // 添加点击事件
    settingButton.addEventListener('click', createConfigUI);

    // 创建悬浮提示
    const popup = createPopupTip();

    // 鼠标悬停显示提示
    settingButton.addEventListener('mouseenter', function () {
      const buttonRect = this.getBoundingClientRect();

      // 先显示提示框以计算实际尺寸
      popup.style.display = 'block';
      popup.style.visibility = 'visible';

      // 获取提示框的实际尺寸
      const popupRect = popup.getBoundingClientRect();

      // 计算正确的位置（与客服按钮完全一致的间距）
      const spacing = 4;
      // 与花瓣网原生完全一致的间距

      // 提示框左侧位置 = 按钮左侧 - 提示框宽度 - 间距
      const left = buttonRect.left - popupRect.width - spacing;

      // 提示框顶部位置 = 按钮垂直居中 - 提示框高度/2
      const top = buttonRect.top + buttonRect.height / 2 - popupRect.height / 2 + window.scrollY;

      // 设置提示框位置
      popup.style.left = left + 'px';
      popup.style.top = top + 'px';
      popup.style.marginLeft = '-3px';

      // 调整箭头位置（确保与客服按钮完全一致）
      const arrowElement = popup.querySelector('div[style*="transform: rotate(90deg)"]');
      if (arrowElement) {
        // 固定箭头位置，确保与客服按钮一致
        arrowElement.style.top = '50%';
        arrowElement.style.left = '100%';
        arrowElement.style.marginTop = '-4px';
        arrowElement.style.marginLeft = '-2px';
        arrowElement.style.zIndex = '-1';
        // 不设置颜色，让它继承父元素的颜色
      }
    });

    // 鼠标离开隐藏提示
    settingButton.addEventListener('mouseleave', function () {
      popup.style.display = 'none';
      popup.style.visibility = 'hidden';
    });

    // 找到悬浮面板容器
    function findSuspensionPanel() {
      const panel = document.querySelector('div._suspensionPanel_1wovf_1');
      if (panel) {
        // 在面板最前面插入设置按钮
        panel.insertBefore(settingButton, panel.firstChild);
        console.log('与客服按钮100%视觉一致的设置按钮已添加到页面顶部');
      } else {
        // 如果没找到，1秒后重试
        setTimeout(findSuspensionPanel, 1000);
      }
    }

    // 开始查找并添加按钮
    findSuspensionPanel();
  }

  // 初始化
  function init() {
    console.log('花瓣"去"水印 v2. 初始化');

    // 注册油猴菜单命令
    GM_registerMenuCommand('设置首选项', createConfigUI);

    // 应用样式（包含动画效果）
    applyStyles();

    // 添加页面顶部设置按钮（与客服按钮100%视觉一致）
    addSettingButtonToPage();

    // 页面加载完成后执行水印处理
    window.addEventListener('load', () => {
      console.log('页面加载完成，执行初始水印处理');
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

    // 处理大图查看器
    handleImageViewer();

    // 定期检查（作为最后的保障）
    setInterval(() => {
      processWatermark();
    }, 2000);

    // 清理函数
    window.addEventListener('beforeunload', () => {
      observer.disconnect();
    });

    console.log('花瓣"去"水印 v2. 初始化完成');
  }

  // 启动脚本
  init();

  console.log('花瓣"去"水印 v2. 已加载');
  console.log('功能：花瓣网背景色自定义+官网素材去水印（完美修复版）');
  console.log('特点：支持开关状态实时切换，自动恢复原始URL');
})();
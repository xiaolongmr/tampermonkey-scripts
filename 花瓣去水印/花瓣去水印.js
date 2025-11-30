// ==UserScript==
// @name         花瓣"去"水印
// @version      2.75
// @description  主要功能：1.显示花瓣真假PNG（原理：脚本通过给花瓣图片添加背景色，显示出透明PNG图片，透出背景色的即为透明PNG，非透明PNG就会被过滤掉） 2.通过自定义修改背景色，区分VIP素材和免费素材。 3.花瓣官方素材[vip素材]去水印（原理：去水印功能只是把图片链接替换花瓣官网提供的没有水印的最大尺寸图片地址，并非真正破破解去水印,仅供学习使用）
// @author       小张 | 个人博客：https://blog.z-l.top | 公众号“爱吃馍” | 设计导航站 ：https://dh.z-l.top | quicker账号昵称：星河城野❤
// @license      GPL-3.0
// @namespace    https://getquicker.net/User/Actions/388875-%E6%98%9F%E6%B2%B3%E5%9F%8E%E9%87%8E%E2%9D%A4
// @match        https://huaban.com/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_download
// @icon         https://st0.dancf.com/static/02/202306090204-51f4.png
// ==/UserScript==

(function () {
  'use strict';

  // 获取脚本版本号 - 移到全局作用域，确保所有地方都能访问
  const getScriptVersion = () => {
    try {
      return (GM_info && GM_info.script && typeof GM_info.script.version === 'string')
        ? GM_info.script.version
        : '未知';
    } catch (error) {
      console.warn('获取脚本版本失败:', error);
      return '未知';
    }
  };

  // 默认配置
  const DEFAULT_CONFIG = {
    materialColor: '#ffe0e0',
    // 花瓣官方素材：淡红色
    userColor: '#ebffff',
    // 用户上传：粉蓝色
    enableCustom: true,
    // 启用自定义背景色
    enableRemoveWatermark: true,
    // 仅支持花瓣官方素材去水印功能，第三方素材无效
    enableDragDownload: true,
    // 启用拖拽下载功能
    enableRightClickDownload: true
    // 启用右键下载功能
  };

  // 获取配置
  function getConfig() {
    return {
      materialColor: GM_getValue('materialColor', DEFAULT_CONFIG.materialColor),
      userColor: GM_getValue('userColor', DEFAULT_CONFIG.userColor),
      enableCustom: GM_getValue('enableCustom', DEFAULT_CONFIG.enableCustom),
      enableRemoveWatermark: GM_getValue('enableRemoveWatermark', DEFAULT_CONFIG.enableRemoveWatermark),
      enableDragDownload: GM_getValue('enableDragDownload', DEFAULT_CONFIG.enableDragDownload),
      enableRightClickDownload: GM_getValue('enableRightClickDownload', DEFAULT_CONFIG.enableRightClickDownload)
    };
  }

  // 保存配置
  function saveConfig(config) {
    GM_setValue('materialColor', config.materialColor);
    GM_setValue('userColor', config.userColor);
    GM_setValue('enableCustom', config.enableCustom);
    GM_setValue('enableRemoveWatermark', config.enableRemoveWatermark);
    GM_setValue('enableDragDownload', config.enableDragDownload);
    GM_setValue('enableRightClickDownload', config.enableRightClickDownload);
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

            /* 花瓣素材 背景色 */
            .KKIUywzb[data-content-type="素材采集"] .transparent-img-bg {
                background-color: ${config.enableCustom ? config.materialColor : 'transparent'} !important;
                ${config.enableCustom ? 'background-image:none!important;' : ''}
            }

            /* 用户上传背景色，非花瓣素材 */
            .KKIUywzb:not([data-content-type="素材采集"]) .transparent-img-bg,.transparent-img-black-bg,.transparent-img-bg {
                background-color: ${config.enableCustom ? config.userColor : 'transparent'} !important;
                ${config.enableCustom ? 'background-image:none!important;' : ''}
            }

            
            /* 隐藏指定元素 */
            // .CdxAiT3A {
            //     display: none;
            // }

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

  // 去除图片后缀参数，让图片保存为PNG格式
  function removeImageSuffixParams(url) {
    // 匹配花瓣图片URL中的后缀参数，如 _fw658webp
    const suffixRegex = /(_fw\d+webp)(\.webp)?$/i;

    if (suffixRegex.test(url)) {
      // 去除后缀参数，保留图片ID和扩展名
      const cleanUrl = url.replace(suffixRegex, '');
      console.log('去除图片后缀参数:', url, '→', cleanUrl);
      return cleanUrl;
    }

    return url;
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
        const isOfficialMaterial =
          // 原有条件：.fgsjNg46 元素包含"官方自营"文本
          Array.from(document.querySelectorAll('.fgsjNg46')).some(element =>
            element.textContent && element.textContent.includes('官方自营')
          )
          ||
          // 新增条件：存在 title="来自官方自营" 的元素
          document.querySelectorAll('[title="来自官方自营"]').length > 0;
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

        // 检查图片链接是否有效
        function checkImageUrl(url) {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
          });
        }

        // 处理图片链接
        (async () => {
          let modified = false;

          // 处理src属性
          if (watermarkRegex.test(originalSrc) && !originalSrc.includes('/small/')) {
            const newSrc = originalSrc.replace(watermarkRegex, '$1/small/$2');
            console.log('检查新图片URL是否有效:', newSrc);
            
            // 检查新链接是否有效
            const isValid = await checkImageUrl(newSrc);
            if (isValid) {
              console.log('修改VIP图片src:', originalSrc, '→', newSrc);
              img.src = newSrc;
              modified = true;
            } else {
              console.log('新图片URL无效，跳过处理:', newSrc);
            }
          }

          // 处理srcset属性
          if (img.srcset && watermarkRegex.test(img.srcset) && !img.srcset.includes('/small/')) {
            const newSrcset = img.srcset.replace(watermarkRegex, '$1/small/$2');
            console.log('检查新图片srcset是否有效:', newSrcset);
            
            // 检查新链接是否有效
            const isValid = await checkImageUrl(newSrcset.split(' ')[0]); // 取第一个URL检查
            if (isValid) {
              console.log('修改VIP图片srcset:', img.srcset, '→', newSrcset);
              img.srcset = newSrcset;
              modified = true;
            } else {
              console.log('新图片srcset URL无效，跳过处理:', newSrcset);
            }
          }

          if (modified) {
            processedCount++;
            img.setAttribute('data-watermark-removed', 'true');
            console.log('图片处理成功');
          } else {
            skippedCount++;
            console.log('图片无需处理或已处理');
          }
        })();
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
        // 检查是否为官方自营素材（新增 title 选择器，满足任一条件即判定）
        const isOfficialMaterial =
          // 原有条件：.fgsjNg46 元素包含“官方自营”文本
          Array.from(document.querySelectorAll('.fgsjNg46')).some(element =>
            element.textContent && element.textContent.includes('官方自营')
          )
          ||
          // 新增条件：存在 title="来自官方自营" 的元素
          document.querySelectorAll('[title="来自官方自营"]').length > 0;

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

  // 拦截拖拽和右键下载事件，移除图片后缀参数
  function interceptDragAndDownload() {
    // 监听拖拽开始事件
    document.addEventListener('dragstart', function (e) {
      const img = e.target;
      if (img.tagName === 'IMG' && img.src.includes('gd-hbimg.huaban.com')) {
        // 检查是否为需要处理的图片类型
        if (img.matches('img[data-button-name="查看大图"]') ||
          img.closest('#imageViewerWrapper') ||
          img.matches('img.vYzIMzy2[alt="查看图片"]') ||
          // 新增：支持预览图片（a标签内的img标签）
          (img.closest('a') && img.closest('a').querySelector('span[style*="display: none"]'))) {

          // 检查拖拽下载功能是否启用
          const config = getConfig();
          if (!config.enableDragDownload) {
            console.log('拖拽下载功能已禁用，跳过处理');
            return;
          }

          console.log('检测到图片拖拽开始:', img.src);

          // 移除后缀参数，保存为PNG格式
          const cleanUrl = removeImageSuffixParams(img.src);
          if (cleanUrl !== img.src) {
            console.log('拖拽时移除后缀参数，新URL:', cleanUrl);

            // 设置拖拽数据为处理后的URL
            e.dataTransfer.setData('text/uri-list', cleanUrl);
            e.dataTransfer.setData('text/plain', cleanUrl);

            // 设置文件名：优先使用alt属性，如果没有则使用URL生成的文件名
            const fileName = getFileNameFromAlt(img, cleanUrl);
            e.dataTransfer.setData('DownloadURL', `image/png:${fileName}:${cleanUrl}`);
          }
        }
      }
    });

    // 监听右键菜单事件 - 使用GM_download API直接下载
    document.addEventListener('contextmenu', function (e) {
      const img = e.target;
      if (img.tagName === 'IMG' && img.src.includes('gd-hbimg.huaban.com')) {
        // 检查是否为需要处理的图片类型
        if (img.matches('img[data-button-name="查看大图"]') ||
          img.closest('#imageViewerWrapper') ||
          img.matches('img.vYzIMzy2[alt="查看图片"]') ||
          // 新增：支持预览图片（a标签内的img标签）
          (img.closest('a') && img.closest('a').querySelector('span[style*="display: none"]'))) {

          // 检查右键下载功能是否启用
          const config = getConfig();
          if (!config.enableRightClickDownload) {
            console.log('右键下载功能已禁用，跳过处理');
            return;
          }

          console.log('检测到图片右键菜单，使用GM_download下载:', img.src);

          // 移除后缀参数，获取干净的URL
          const cleanUrl = removeImageSuffixParams(img.src);
          if (cleanUrl !== img.src) {
            console.log('处理后的下载URL:', cleanUrl);

            // 阻止默认的右键菜单行为
            e.preventDefault();

            // 使用GM_download API直接下载处理后的图片
            // 注意：GM_download需要用户确认，所以这里使用异步方式
            setTimeout(() => {
              try {
                // 使用alt属性作为文件名，如果没有alt则使用默认文件名
                const fileName = getFileNameFromAlt(img, cleanUrl);

                // 使用GM_download下载图片
                // 注意：GM_download会弹出下载确认对话框
                GM_download({
                  url: cleanUrl,
                  name: fileName,
                  onload: function () {
                    console.log('图片下载成功:', fileName);
                  },
                  onerror: function (error) {
                    console.error('图片下载失败:', error);
                    // 如果GM_download失败，尝试备用方案
                    fallbackDownload(cleanUrl, fileName);
                  }
                });
              } catch (error) {
                console.error('GM_download调用失败:', error);
                // 备用下载方案
                fallbackDownload(cleanUrl, getFileNameFromAlt(img, cleanUrl));
              }
            }, 100);
          }
        }
      }
    });

    // 备用下载方案：创建隐藏的下载链接
    function fallbackDownload(url, fileName) {
      try {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        console.log('备用下载方案执行成功');
      } catch (error) {
        console.error('备用下载方案也失败:', error);
        // 最后的手段：在新标签页打开图片
        window.open(url, '_blank');
      }
    }

    console.log('拖拽和右键下载拦截器已启动');
  }

  // 获取清理后的文件名（移除后缀参数，使用PNG扩展名）
  function getCleanFileName(url) {
    // 从URL中提取文件名
    const urlParts = url.split('/');
    let fileName = urlParts[urlParts.length - 1];

    // 移除后缀参数
    fileName = fileName.replace(/(_fw\d+webp)(\.webp)?$/i, '');

    // 确保使用PNG扩展名
    if (!fileName.includes('.')) {
      fileName += '.png';
    } else {
      fileName = fileName.replace(/\.(jpg|jpeg|webp)$/i, '.png');
    }

    return fileName;
  }

  // 根据alt属性或span标签生成文件名，如果没有则使用默认文件名
  function getFileNameFromAlt(img, url) {
    // 首先检查是否为预览图片（a标签内的img标签，且有隐藏的span）
    const parentA = img.closest('a');
    if (parentA) {
      const hiddenSpan = parentA.querySelector('span[style*="display: none"]');
      if (hiddenSpan && hiddenSpan.textContent) {
        // 使用span的文本内容作为文件名
        let spanText = hiddenSpan.textContent.trim();
        if (spanText) {
          // 清理文本，移除特殊字符，只保留字母、数字、中文和空格
          let cleanText = spanText.replace(/[^\w\u4e00-\u9fa5\s]/g, '').trim();

          // 如果清理后的文本不为空，则使用span文本作为文件名
          if (cleanText) {
            // 限制文件名长度，避免过长
            if (cleanText.length > 50) {
              cleanText = cleanText.substring(0, 50);
            }

            // 添加.png扩展名
            return cleanText + '.png';
          }
        }
      }
    }

    // 获取alt属性值
    const altText = img.alt || '';

    // 如果alt属性有内容且不是默认的"查看图片"，则使用alt作为文件名
    if (altText && altText.trim() && altText !== '查看图片') {
      // 清理alt文本，移除特殊字符，只保留字母、数字、中文和空格
      let cleanAlt = altText.replace(/[^\w\u4e00-\u9fa5\s]/g, '').trim();

      // 如果清理后的文本不为空，则使用alt作为文件名
      if (cleanAlt) {
        // 限制文件名长度，避免过长
        if (cleanAlt.length > 50) {
          cleanAlt = cleanAlt.substring(0, 50);
        }

        // 添加.png扩展名
        return cleanAlt + '.png';
      }
    }

    // 如果没有有效的alt属性或span文本，则使用默认的文件名生成逻辑
    return getCleanFileName(url);
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
            z-index: 1000;
            backdrop-filter: blur(4px);
        `;

    // 创建卡片
    const card = document.createElement('div');
    card.style.cssText = `
            background: white;
            border-radius: 24px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            width: 420px;
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
            <div style="display: flex;gap: 10px;align-items: center;justify-content: space-between; padding: 0 15px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <h3 style="margin: 0; color: #334155; font-size: 16px; font-weight: 600;">
                        花瓣 - 设置首选项
                    </h3>
                    <sup style="font-size: 10px; color: #94a3b8; font-weight: 400;">
                        v${getScriptVersion()}
                    </sup>
                </div>
                <div style="display: flex; gap: 8px;">
                    <a href="#" id="thanksListLink" style="font-size: 12px; color: #64748b; text-decoration: none; cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: all 0.2s;">
                        致谢名单
                    </a>
                    <a href="#" id="usageGuideLink" style="font-size: 12px; color: #64748b; text-decoration: none; cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: all 0.2s;">
                        使用说明
                    </a>
                </div>
            </div>`;

    // 显示致谢名单函数
    const showThanksList = () => {
      try {
        // 创建模态框
        const modal = document.createElement('div');
        modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                backdrop-filter: blur(4px);
            `;

        // 创建容器
        const container = document.createElement('div');
        container.style.cssText = `
                position: relative;
                width: 420px;
                height: 585px;
                max-width: 95vw;
                max-height: 90vh;
                overflow: hidden;
            `;

        // 创建iframe嵌套致谢名单HTML文件
        const iframe = document.createElement('iframe');
        iframe.src = 'https://xiaolongmr.github.io/tampermonkey-scripts/%E8%8A%B1%E7%93%A3%E5%8E%BB%E6%B0%B4%E5%8D%B0/%E8%87%B4%E8%B0%A2%E5%90%8D%E5%8D%95.html';
        iframe.style.cssText = `
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                border: none;
                outline: none;
            `;
        iframe.allow = 'autoplay; clipboard-write';
        iframe.frameBorder = '0';

        // 创建关闭按钮
        const closeButton = document.createElement('div');
        closeButton.style.cssText = `
                position: absolute;
                right: 10px;
                top: 10px;
                width: 30px;
                height: 30px;
                background-color: rgba(0, 0, 0, 0.1);
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                user-select: none;
                z-index: 10;
            `;
        // 创建SVG关闭图标
        const closeIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        closeIcon.setAttribute('width', '16');
        closeIcon.setAttribute('height', '16');
        closeIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        closeIcon.setAttribute('viewBox', '0 0 1024 1024');
        closeIcon.setAttribute('fill', 'white');

        // 创建路径
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M198.1 267.7l75.4-75.4 576.3 576.3-75.4 75.4-576.3-576.3zm576.4-69.3l75.4 75.4-580.7 580.8-75.4-75.4 580.7-580.8z');

        // 组装SVG图标
        closeIcon.appendChild(path);
        closeButton.appendChild(closeIcon);
        closeButton.addEventListener('click', () => {
          document.body.removeChild(modal);
        });
        closeButton.addEventListener('mouseenter', () => {
          closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
        });
        closeButton.addEventListener('mouseleave', () => {
          closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
        });

        // 组装模态框
        container.appendChild(iframe);
        container.appendChild(closeButton);
        modal.appendChild(container);

        // 点击模态框背景关闭
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            document.body.removeChild(modal);
          }
        });

        // 添加到文档
        document.body.appendChild(modal);

      } catch (error) {
        console.error('显示致谢名单失败:', error);
        alert('无法加载致谢名单，请稍后再试');
      }
    };

    // 延迟添加事件监听器，确保DOM已渲染
    setTimeout(() => {
      const thanksListLink = document.getElementById('thanksListLink');
      if (thanksListLink) {
        thanksListLink.addEventListener('click', (e) => {
          e.preventDefault();
          showThanksList();
        });
      }
    }, 0);

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

    // 拖拽下载功能开关
    const enableDragSection = document.createElement('div');
    enableDragSection.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            padding: 12px;
            background: #f8fafc;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        `;

    const enableDragHTML = `
            <span style="
                font-size: 14px;
                font-weight: 500;
                color: #475569;
                display: flex;
                align-items: center;
            ">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 1024 1024" style="margin-right: 6px;">
                    <path d="M597.333333 512a85.333333 85.333333 0 1 1-170.666666 0 85.333333 85.333333 0 0 1 170.666666 0z" fill="#3b82f6"></path>
                    <path d="M512 210.304L391.338667 330.965333 330.965333 270.634667 512 89.642667l181.034667 180.992-60.330667 60.330666L512 210.346667z m181.034667 181.034667l60.330666-60.373334L934.4 512l-181.034667 181.034667-60.330666-60.373334L813.653333 512l-120.661333-120.661333z m-60.330667 301.653333L512 813.781333l-120.661333-120.746666-60.373334 60.373333L512 934.357333l181.034667-180.992-60.330667-60.330666z m-362.069333 0L89.642667 512l180.992-181.034667 60.330666 60.373334L210.346667 512l120.661333 120.661333-60.330667 60.373334z" fill="#3b82f6"></path>
                </svg>
                拖拽下载图片<span style="font-size: 12px; color: #94a3b8; margin-left: 4px;">（适配资源管理器/<a href="https://wwz.lanzouq.com/iyUTy1zt2b4d" target="_blank" style="color: #3b82f6; text-decoration: none;" title="点击下载PureRef">PureRef</a>）</span>
            </span>
            <div style="position: relative; width: 40px; height: 20px; cursor: pointer;" id="enableDragContainer">
                <input type="checkbox" id="enableDragSwitch" ${config.enableDragDownload ? 'checked' : ''}
                       style="position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 3;">
                <span style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: ${config.enableDragDownload ? '#3b82f6' : '#e2e8f0'};
                    border-radius: 10px;
                    transition: background 0.2s ease;
                    z-index: 1;
                "></span>
                <span style="
                    position: absolute;
                    width: 16px;
                    height: 16px;
                    left: ${config.enableDragDownload ? '22px' : '2px'};
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
    const enableRightClickSection = document.createElement('div');
    enableRightClickSection.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
            padding: 12px;
            background: #f8fafc;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        `;

    const enableRightClickHTML = `
            <span style="
                font-size: 14px;
                font-weight: 500;
                color: #475569;
                display: flex;
                align-items: center;
            ">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 1024 1024" style="margin-right: 6px;">
                    <path d="M588.8 61.44c-20.48-5.12-40.96 10.24-46.08 30.72-5.12 20.48 5.12 40.96 25.6 46.08 0 0 117.76 35.84 148.48 153.6 5.12 15.36 20.48 30.72 35.84 30.72h10.24c20.48-5.12 35.84-25.6 30.72-46.08-40.96-168.96-199.68-209.92-204.8-215.04z" fill="#8b5cf6"></path>
                    <path d="M855.04 174.08c-35.84-102.4-117.76-148.48-158.72-168.96-20.48-10.24-40.96 0-51.2 20.48s0 40.96 20.48 51.2c35.84 15.36 92.16 51.2 117.76 122.88 5.12 15.36 20.48 25.6 35.84 25.6h10.24c20.48-10.24 30.72-30.72 25.6-51.2zM419.84 133.12C261.12 133.12 128 266.24 128 430.08v296.96C128 890.88 261.12 1024 419.84 1024s296.96-133.12 296.96-296.96V430.08c0-163.84-133.12-296.96-296.96-296.96zM384 215.04v225.28H204.8v-10.24C204.8 322.56 281.6 235.52 384 215.04z m35.84 732.16c-117.76 0-215.04-97.28-215.04-215.04v-209.92H634.88v209.92c5.12 117.76-92.16 215.04-215.04 215.04z" fill="#8b5cf6"></path>
                </svg>
                右键下载图片<span style="font-size: 12px; color: #94a3b8; margin-left: 4px;">（修正乱码名称）</span>
            </span>
            <div style="position: relative; width: 40px; height: 20px; cursor: pointer;" id="enableRightClickContainer">
                <input type="checkbox" id="enableRightClickSwitch" ${config.enableRightClickDownload ? 'checked' : ''}
                       style="position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 3;">
                <span style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: ${config.enableRightClickDownload ? '#8b5cf6' : '#e2e8f0'};
                    border-radius: 10px;
                    transition: background 0.2s ease;
                    z-index: 1;
                "></span>
                <span style="
                    position: absolute;
                    width: 16px;
                    height: 16px;
                    left: ${config.enableRightClickDownload ? '22px' : '2px'};
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

    // 获取拖拽下载和右键下载开关元素
    const enableDragSwitch = document.getElementById('enableDragSwitch');
    const enableDragThumb = document.getElementById('enableDragThumb');
    const enableDragContainer = document.getElementById('enableDragContainer');
    const enableRightClickSwitch = document.getElementById('enableRightClickSwitch');
    const enableRightClickThumb = document.getElementById('enableRightClickThumb');
    const enableRightClickContainer = document.getElementById('enableRightClickContainer');

    // 拖拽下载开关功能
    enableDragSwitch.addEventListener('change', function () {
      const isChecked = this.checked;
      const switchBg = enableDragContainer.querySelector('span:nth-child(2)');
      switchBg.style.background = isChecked ? '#3b82f6' : '#e2e8f0';
      enableDragThumb.style.left = isChecked ? '22px' : '2px';

      // 立即更新拖拽下载功能状态
      console.log('拖拽下载开关状态变化:', isChecked);
      // 拖拽功能会在下次页面加载时生效，因为事件监听器是基于配置动态添加的
    });

    // 右键下载开关功能
    enableRightClickSwitch.addEventListener('change', function () {
      const isChecked = this.checked;
      const switchBg = enableRightClickContainer.querySelector('span:nth-child(2)');
      switchBg.style.background = isChecked ? '#8b5cf6' : '#e2e8f0';
      enableRightClickThumb.style.left = isChecked ? '22px' : '2px';

      // 立即更新右键下载功能状态
      console.log('右键下载开关状态变化:', isChecked);
      // 右键功能会在下次页面加载时生效，因为事件监听器是基于配置动态添加的
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
        enableDragDownload: enableDragSwitch.checked,
        enableRightClickDownload: enableRightClickSwitch.checked,
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

        // 恢复拖拽下载开关
        enableDragSwitch.checked = DEFAULT_CONFIG.enableDragDownload;
        const dragSwitchBg = enableDragContainer.querySelector('span:nth-child(2)');
        dragSwitchBg.style.background = DEFAULT_CONFIG.enableDragDownload ? '#3b82f6' : '#e2e8f0';
        enableDragThumb.style.left = DEFAULT_CONFIG.enableDragDownload ? '22px' : '2px';

        // 恢复右键下载开关
        enableRightClickSwitch.checked = DEFAULT_CONFIG.enableRightClickDownload;
        const rightClickSwitchBg = enableRightClickContainer.querySelector('span:nth-child(2)');
        rightClickSwitchBg.style.background = DEFAULT_CONFIG.enableRightClickDownload ? '#8b5cf6' : '#e2e8f0';
        enableRightClickThumb.style.left = DEFAULT_CONFIG.enableRightClickDownload ? '22px' : '2px';

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





  // 初始化
  function init() {
    console.log('花瓣"去"水印. 初始化');


    // 注册油猴菜单命令
    GM_registerMenuCommand('⚙️ 设置首选项', createConfigUI);
    GM_registerMenuCommand('🤝 网友互助区', showTwikooChat);

    // 应用样式（包含动画效果）
    applyStyles();

    

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

    // 拦截拖拽和右键下载事件
    interceptDragAndDownload();

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

    // 使用动态版本号输出日志
    console.log(`花瓣"去"水印 v${getScriptVersion()}. 初始化完成`);
  }

  // 显示使用说明弹窗
  function showUsageGuide() {
    // 检查是否已存在使用说明弹窗
    const existingGuide = document.getElementById('huabanUsageGuide');
    if (existingGuide) {
      existingGuide.remove();
      return;
    }

    // 创建主容器
    const container = document.createElement('div');
    container.id = 'huabanUsageGuide';
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
            z-index: 1000;
            backdrop-filter: blur(4px);
        `;

    // 创建卡片
    const card = document.createElement('div');
    card.style.cssText = `
            background: white;
            border-radius: 24px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            width: 600px;
            max-width: 95vw;
            max-height: 80vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            flex-direction: column;
        `;

    // 卡片头部
    const header = document.createElement('div');
    header.style.cssText = `
            padding: 16px 20px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background-color: var(--background-color-secondary-regular,rgb(248, 250, 252));
            border-radius: 24px 24px 0 0;
        `;
    header.innerHTML = `
            <h3 style="margin: 0; color: #334155; font-size: 16px; font-weight: 600;">
                使用说明
            </h3>
            <button id="closeUsageGuide" style="
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="#64748b">
                    <path d="M198.1 267.7l75.4-75.4 576.3 576.3-75.4 75.4-576.3-576.3zm576.4-69.3l75.4 75.4-580.7 580.8-75.4-75.4 580.7-580.8z"/>
                </svg>
            </button>
        `;

    // 卡片内容
    const content = document.createElement('div');
    content.style.cssText = `
        padding: 20px;
        overflow-y: auto;
        flex: 1;
    `;


    // 组装卡片
    card.appendChild(header);
    card.appendChild(content);
    container.appendChild(card);
    document.body.appendChild(container);


    // 从markdown的YAML front matter中提取所有键值对
    function extractFrontMatter(markdown) {
      // 匹配YAML front matter部分
      const frontMatterMatch = markdown.match(/^---\s*([\s\S]*?)\s*---\s*/);
      const frontMatter = {};

      if (frontMatterMatch && frontMatterMatch[1]) {
        // 解析每一行的键值对
        const lines = frontMatterMatch[1].split('\n');

        lines.forEach(line => {
          // 跳过空行
          if (!line.trim()) return;

          // 匹配键值对格式
          const match = line.match(/^\s*([\w-]+)\s*:\s*(.+?)\s*$/);
          if (match) {
            const key = match[1];
            let value = match[2];

            // 移除可能的引号
            if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith('\'') && value.endsWith('\''))) {
              value = value.slice(1, -1);
            }

            frontMatter[key] = value;
          }
        });
      }

      return {
        frontMatter,
        // 返回移除front matter后的markdown内容
        content: frontMatterMatch ? markdown.replace(frontMatterMatch[0], '') : markdown
      };
    }




    // 加载外部markdown内容
    const markdownUrl = 'https://cdn.jsdelivr.net/gh/xiaolongmr/tampermonkey-scripts@master/花瓣去水印/花瓣脚本使用说明.md';
    fetch(markdownUrl)
      .then(response => response.text())
      .then(markdown => {
        // 从markdown中提取YAML front matter和内容
        const { frontMatter, content: markdownContent } = extractFrontMatter(markdown);

        // 保存front matter中的评论配置
        const commentConfig = frontMatter.comments || null;
        console.log('解析到的YAML Front Matter:', { comments: commentConfig });

        // 动态加载fancybox灯箱库
        const fancyboxCSS = document.createElement('link');
        fancyboxCSS.rel = 'stylesheet';
        fancyboxCSS.href = 'https://cdn.jsdelivr.net/npm/@fancyapps/ui@5.0/dist/fancybox/fancybox.css';
        document.head.appendChild(fancyboxCSS);

        const fancyboxScript = document.createElement('script');
        fancyboxScript.src = 'https://cdn.jsdelivr.net/npm/@fancyapps/ui@5.0/dist/fancybox/fancybox.umd.js';

        // 动态加载轻量级markdown解析库 - Marked.js
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/marked@12.0.0/marked.min.js';

        // 等待所有脚本加载完成
        Promise.all([
          new Promise(resolve => fancyboxScript.onload = resolve),
          new Promise(resolve => script.onload = resolve)
        ]).then(() => {
          // 处理相对路径，转换为完整URL
          const baseUrl = markdownUrl.substring(0, markdownUrl.lastIndexOf('/') + 1);

          // 替换图片的相对路径
          let processedMarkdown = markdownContent.replace(/!\[(.*?)\]\((.*?)\)/g, (match, altText, imgPath) => {
            // 如果已经是完整URL，则不处理
            if (imgPath.startsWith('http')) {
              return match;
            }
            // 如果是相对路径，转换为完整URL
            return `![${altText}](${baseUrl}${imgPath})`;
          });

          // 替换链接的相对路径
          processedMarkdown = processedMarkdown.replace(/\[(.*?)\]\((.*?)\)/g, (match, linkText, linkPath) => {
            // 如果已经是完整URL，则不处理
            if (linkPath.startsWith('http')) {
              return match;
            }
            // 如果是相对路径，转换为完整URL
            return `[${linkText}](${baseUrl}${linkPath})`;
          });

          // 使用marked.js解析markdown（只解析去除front matter后的内容）
          content.innerHTML = marked.parse(processedMarkdown);

          // 添加基本样式
          content.style.cssText += `
                  font-size: 14px;
                  line-height: 1.6;
                  color: #334155;
              `;

          // 限制图片宽度不超过容器并添加灯箱功能
          const images = content.querySelectorAll('img');
          images.forEach(img => {
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.cursor = 'pointer';
            img.style.borderRadius = '8px';

            // 添加fancybox属性
            img.setAttribute('data-fancybox', 'gallery');
            img.setAttribute('data-src', img.src);
          });

          // 为标题添加样式
          const headings = content.querySelectorAll('h1, h2, h3, h4, h5, h6');
          headings.forEach(heading => {
            heading.style.marginTop = '20px';
            heading.style.marginBottom = '10px';
            heading.style.color = '#1e293b';
          });

          // 为代码块添加样式
          const codeBlocks = content.querySelectorAll('code, pre');
          codeBlocks.forEach(code => {
            code.style.backgroundColor = '#f1f5f9';
            code.style.padding = '2px 4px';
            code.style.borderRadius = '4px';
            code.style.fontFamily = 'monospace';
          });

          // 为链接添加样式
          const links = content.querySelectorAll('a');
          links.forEach(link => {
            link.style.color = '#3b82f6';
            link.style.textDecoration = 'none';
            link.target = '_blank';
          });

          // 初始化fancybox灯箱
          if (typeof Fancybox !== 'undefined') {
            // 先解绑可能存在的绑定
            Fancybox.unbind('[data-fancybox]');

            // 重新绑定灯箱，让浏览器自动处理层级关系
            Fancybox.bind('[data-fancybox]', {
              // 灯箱配置选项
              Thumbs: false,
              Toolbar: false,
              infinite: false,
              // 确保灯箱显示在最顶层
              parentEl: document.body
            });
          }
        });

        // 将脚本添加到页面
        document.head.appendChild(fancyboxScript);
        document.head.appendChild(script);

        script.onerror = () => {
          // 如果加载失败，使用简单的文本显示
          content.innerHTML = `
                    <div style="white-space: pre-wrap; font-family: monospace; font-size: 14px; line-height: 1.5;">
                        ${markdown.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                    </div>
                `;
        };
        document.head.appendChild(script);
      })
      .catch(error => {
        content.innerHTML = `
                <div style="text-align: center; color: #ef4444;">
                    <div style="font-size: 14px;">加载使用说明失败</div>
                    <div style="font-size: 12px; margin-top: 8px;">${error.message}</div>
                </div>
            `;
      });

    // 关闭按钮事件
    const closeButton = header.querySelector('#closeUsageGuide');
    closeButton.addEventListener('click', () => {
      container.remove();
    });

    // 点击外部关闭
    container.addEventListener('click', (e) => {
      if (e.target === container) container.remove();
    });

    // ESC键关闭
    const escHandler = (e) => {
      if (e.key === 'Escape') container.remove();
    };
    document.addEventListener('keydown', escHandler);

    // 清理事件监听器
    container.addEventListener('remove', () => {
      document.removeEventListener('keydown', escHandler);
    });
  }

  // 显示Twikoo聊天模块
  function showTwikooChat() {
    // 检查是否已存在聊天弹窗
    const existingChat = document.getElementById('huabanTwikooChat');
    if (existingChat) {
      existingChat.remove();
      return;
    }

    // 创建主容器
    const container = document.createElement('div');
    container.id = 'huabanTwikooChat';
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
            z-index: 1000;
            backdrop-filter: blur(4px);
        `;

    // 创建卡片
    const card = document.createElement('div');
    card.style.cssText = `
            background: white;
            border-radius: 24px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            width: 600px;
            max-width: 95vw;
            max-height: 80vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            flex-direction: column;
        `;

    // 卡片头部
    const header = document.createElement('div');
    header.style.cssText = `
            padding: 16px 20px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background-color: var(--background-color-secondary-regular,rgb(248, 250, 252));
            border-radius: 24px 24px 0 0;
        `;
    header.innerHTML = `
            <h3 style="margin: 0; color: #334155; font-size: 16px; font-weight: 600;">
                网友互助区 💬
            </h3>
            <button id="closeTwikooChat" style="
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="#64748b">
                    <path d="M198.1 267.7l75.4-75.4 576.3 576.3-75.4 75.4-576.3-576.3zm576.4-69.3l75.4 75.4-580.7 580.8-75.4-75.4 580.7-580.8z"/>
                </svg>
            </button>
        `;

    // 卡片内容
    const content = document.createElement('div');
    content.style.cssText = `
            padding: 20px;
            overflow-y: auto;
            flex: 1;
        `;
    content.innerHTML = `
            <div style="margin-bottom: 15px; padding: 12px; background: linear-gradient(135deg, #fff0f5 0%, #f0f9ff 100%); border-radius: 12px; border: 1px solid #ffd6e7; position: relative; overflow: hidden;">
              <div style="position: absolute;top: 4px;right: 3px;font-size: 24px;transform: rotate(0deg);opacity: 0.6;"><img class="hb-image" alt="花瓣网" title="" src="https://grocery-cdn.huaban.com/file/hb_logo.svg"></div>
                <div style="font-weight: 600; color: #ff6b9c; margin-bottom: 8px; font-size: 15px; display: flex; align-items: center;">
                    <span>✨ 互助区使用说明</span>
                </div>
                <div style="font-size: 14px; color: #334155; line-height: 1.6;">
                    <div style="display: flex; align-items: center; margin-bottom: 6px;">
                        <span style="margin-right: 6px;">💡</span>
                        <span>在这里可以与其他花瓣用户交流互助</span>
                    </div>
                    <div style="display: flex; align-items: center; margin-bottom: 6px;">
                        <span style="margin-right: 6px;">❓</span>
                        <span>可以提问问题、分享使用经验或提供帮助</span>
                    </div>
                    <div style="display: flex; align-items: center; margin-bottom: 6px;">
                        <span style="margin-right: 6px;">😊</span>
                        <span>请保持友善，做文明设计师，祝大家升职加薪</span>
                    </div>
                </div>
            </div>
            <div id="tcomment"></div>
        `;

    // 组装卡片
    card.appendChild(header);
    card.appendChild(content);
    container.appendChild(card);
    document.body.appendChild(container);

    // 关闭按钮事件
    const closeButton = header.querySelector('#closeTwikooChat');
    closeButton.addEventListener('click', () => {
      container.remove();
    });

    // 点击外部关闭
    container.addEventListener('click', (e) => {
      if (e.target === container) container.remove();
    });

    // ESC键关闭
    const escHandler = (e) => {
      if (e.key === 'Escape') container.remove();
    };
    document.addEventListener('keydown', escHandler);

    // 清理事件监听器
    container.addEventListener('remove', () => {
      document.removeEventListener('keydown', escHandler);
    });

    // 动态加载Twikoo并初始化
    const twikooCss = document.createElement('link');
    twikooCss.rel = 'stylesheet';
    twikooCss.href = 'https://cdn.jsdelivr.net/npm/twikoo@1.6.44/dist/twikoo.css';
    document.head.appendChild(twikooCss);
    const twikooScript = document.createElement('script');
    twikooScript.src = 'https://cdn.jsdelivr.net/npm/twikoo@1.6.44/dist/twikoo.nocss.js';
    twikooScript.onload = function() {
      if (typeof twikoo !== 'undefined') {
        twikoo.init({
          envId: 'https://twikookaishu.z-l.top',
          el: '#tcomment',
          path: '/huaban-helper-all', // 固定路径，使所有页面显示相同评论
        });
      }
    };
    document.head.appendChild(twikooScript);
  }

  // 在配置界面创建完成后添加使用说明链接的事件监听
  function addUsageGuideListener() {
    const usageGuideLink = document.getElementById('usageGuideLink');
    if (usageGuideLink) {
      usageGuideLink.addEventListener('click', (e) => {
        e.preventDefault();
        showUsageGuide();
      });
    }
  }

  // 修改createConfigUI函数，在创建完成后添加使用说明链接的事件监听
  const originalCreateConfigUI = createConfigUI;
  createConfigUI = function () {
    originalCreateConfigUI();
    // 延迟一点时间确保DOM已渲染
    setTimeout(addUsageGuideListener, 100);
  };

  // 启动脚本
  init();

  // console.log('花瓣"去"水印 v${getScriptVersion()} 已加载');
  // console.log('功能：花瓣网背景色自定义+官网素材去水印（完美修复版）');
  // console.log('特点：支持开关状态实时切换，自动恢复原始URL');
})();

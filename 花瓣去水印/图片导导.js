// ==UserScript==
// @name         PS图片导导助手
// @namespace    http://tampermonkey.net/
// @version      0.1.3
// @description  获取网站的图片并发送给PS，需搭配PS插件图片导导使用
// @author       爱吃馍的小张，公众号：爱吃馍
// @match        *://*/*
// @grant        GM_setClipboard
// @grant        GM_notification
// @run-at       document-start
// ==/UserScript==

(function () {
  "use strict";

  // ==========================================
  // 1. UI 反馈元素
  // ==========================================
  const fx = document.createElement("div");
  Object.assign(fx.style, {
    position: "fixed",
    pointerEvents: "none",
    border: "4px solid #0078d4",
    zIndex: "2147483647",
    display: "none",
    transition: "all 0.15s ease-out",
    borderRadius: "4px",
    boxShadow: "0 0 15px rgba(0,120,212,0.6)",
    boxSizing: "border-box",
  });
  if (document.documentElement) {
    document.documentElement.appendChild(fx);
  } else {
    window.addEventListener("DOMContentLoaded", () =>
      document.documentElement.appendChild(fx),
    );
  }

  // ==========================================
  // 2. URL 处理
  // ==========================================

  // 检查URL是否包含图片格式后缀
  function hasImageExtension(url) {
    if (!url) return false;
    const imageExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".gif",
      ".bmp",
      ".svg",
      ".ico",
      ".tiff",
      ".tif",
    ];
    const urlLower = url.toLowerCase();
    return imageExtensions.some((ext) => urlLower.includes(ext));
  }

  // 将图片URL转换为base64
  async function urlToBase64(url) {
    try {
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Base64转换失败:", error);
      return null;
    }
  }

  /**
   * 处理京东图片URL优化
   * @param {string} url - 原始URL
   * @returns {string} 优化后的URL
   */
  function optimizeJdUrl(url) {
    let cleanUrl = url;
    // 移除.dpg后缀
    if (cleanUrl.endsWith(".dpg")) {
      cleanUrl = cleanUrl.slice(0, -4);
    }
    // 移除.avif后缀
    if (cleanUrl.endsWith(".avif")) {
      cleanUrl = cleanUrl.slice(0, -5);
    }

    // 优化尺寸参数，获取最大尺寸图片
    const sizeMatch = cleanUrl.match(/\/s(\d+)x(\d+)_/);
    if (sizeMatch) {
      // 替换为最大尺寸 s3000x3000
      cleanUrl = cleanUrl.replace(/\/s\d+x\d+_/, "/s3000x3000_");
    } else {
      // 如果没有尺寸参数，添加s3000x3000_参数
      const jfsIndex = cleanUrl.indexOf("/jfs/");
      if (jfsIndex !== -1) {
        cleanUrl =
          cleanUrl.substring(0, jfsIndex) +
          "/s3000x3000_jfs/" +
          cleanUrl.substring(jfsIndex + 5);
      }
    }
    return cleanUrl;
  }

  /**
   * 处理淘宝图片URL优化（原来的）
   * @param {string} url - 原始URL
   * @returns {string} 优化后的URL
   */
  /**
      function optimizeTaobaoUrl(url) {
          let cleanUrl = url;
          const formats = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
          
          for (const format of formats) {
              const formatIndex = cleanUrl.indexOf(format);
              if (formatIndex !== -1) {
                  // 保留原格式后缀并添加 _.webp
                  cleanUrl = cleanUrl.substring(0, formatIndex + format.length) + '_.webp';
                  break;
              }
          }
          return cleanUrl;
      }
           */
  /**
   * 处理淘宝/阿里图片URL，去除 _.webp 及常见尺寸后缀，保留原始格式
   * @param {string} url - 原始URL
   * @returns {string} 优化后的URL（原图地址）
   */
  function optimizeTaobaoUrl(url) {
    if (!url || typeof url !== "string") return url;

    let cleanUrl = url.trim();

    // 1. 先移除末尾的 _.webp（最常见情况）
    cleanUrl = cleanUrl.replace(/_\.webp$/, "");

    // 2. 处理带尺寸参数的情况，例如：xxx.jpg_960x960.jpg_.webp → xxx.jpg
    //    匹配模式： .jpg_数字x数字.jpg   或 .png_数字x数字.png 等
    cleanUrl = cleanUrl.replace(
      /(\.(?:jpg|jpeg|png|gif))_\d+x\d+\.\1(?:_\.webp)?$/i,
      "$1",
    );

    // 3. 如果还有残留的 _数字x数字.格式（某些旧格式）
    cleanUrl = cleanUrl.replace(/_\d+x\d+\.(jpg|jpeg|png|gif)$/i, ".$1");

    // 4. 兜底：如果 URL 中有多个相同格式后缀，只保留第一个（最前面的原格式）
    const formats = [".jpg", ".jpeg", ".png", ".gif"];
    for (const fmt of formats) {
      const idx = cleanUrl.toLowerCase().indexOf(fmt);
      if (idx !== -1) {
        // 截取到第一个后缀位置（包含后缀），去掉后面所有内容
        cleanUrl = cleanUrl.substring(0, idx + fmt.length);
        break;
      }
    }

    return cleanUrl;
  }

  /**
   * 处理亚马逊图片URL优化
   * @param {string} url - 原始URL
   * @returns {string} 优化后的URL
   */
  function optimizeAmazonUrl(url) {
    const originalUrl = url;
    let cleanUrl = url;

    // 找到最后一个斜杠的位置
    const lastSlashIndex = cleanUrl.lastIndexOf("/");
    if (lastSlashIndex !== -1) {
      // 获取斜杠后的部分
      const afterSlash = cleanUrl.substring(lastSlashIndex + 1);

      // 检查是否包含两个点，且两个点之间有内容
      const firstDotIndex = afterSlash.indexOf(".");
      if (firstDotIndex !== -1) {
        // 找到格式后缀前的最后一个点
        const formats = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
        for (const format of formats) {
          const formatIndex = afterSlash.indexOf(format);
          if (formatIndex !== -1 && formatIndex > firstDotIndex) {
            // 找到格式后缀前的最后一个点
            const lastDotBeforeFormat = afterSlash.lastIndexOf(
              ".",
              formatIndex - 1,
            );
            if (
              lastDotBeforeFormat !== -1 &&
              lastDotBeforeFormat >= firstDotIndex
            ) {
              // 移除第一个点和最后一个点之间的所有内容
              const beforeFirstDot = afterSlash.substring(0, firstDotIndex);
              // 只保留格式后缀，移除后面的查询参数
              cleanUrl =
                cleanUrl.substring(0, lastSlashIndex + 1) +
                beforeFirstDot +
                format;
              console.log("亚马逊图片处理:", originalUrl, "->", cleanUrl);
              break;
            }
          }
        }
      }
    }
    return cleanUrl;
  }

  /**
   * 处理花瓣网图片URL优化
   * @param {string} url - 原始URL
   * @returns {string} 优化后的URL
   */
  function optimizeHuabanUrl(url) {
    let cleanUrl = url;

    // 花瓣网处理规则：删除 _fwxxxwebp 参数
    // 示例：https://gd-hbimg-edge.huaban.com/78849c45be7f2a825a4bf09bf06baf797ae6424e20ac11-PPxFsF_fw658webp
    const huabanPattern = /_(fw\d+)(jpg|jpeg|png|webp|gif)/;
    if (huabanPattern.test(cleanUrl)) {
      // 删除 _fwxxxwebp 参数，保留原始图片ID
      cleanUrl = cleanUrl.replace(/_(fw\d+)(jpg|jpeg|png|webp|gif)/, "");
      console.log("花瓣网图片处理: 删除_fwxxxwebp参数");
    }

    return cleanUrl;
  }

  /**
   * 处理图片URL，优化各种平台的特殊格式
   * @param {string} url - 原始图片URL
   * @returns {string|null} 处理后的URL或base64数据
   */
  async function processImageUrl(url) {
    if (!url) return null;

    // 移除首尾引号、空白、回车符 (微信图片有时会有换行)
    let cleanUrl = url.replace(/^['"\s]+|['"\s]+$/g, "").trim();

    try {
      cleanUrl = new URL(cleanUrl, window.location.href).href;
    } catch (e) {
      console.error("URL解析失败:", e);
      return null;
    }

    // 先检查是否为特殊平台的URL，自定义规则优先
    if (cleanUrl.includes("gd-filems.dancf.com")) return cleanUrl.split("?")[0];
    if (cleanUrl.includes(".hdslb.com")) return cleanUrl.split("@")[0];
    if (cleanUrl.includes("360buyimg.com")) return optimizeJdUrl(cleanUrl);
    if (cleanUrl.includes("alicdn.com")) return optimizeTaobaoUrl(cleanUrl);
    if (
      cleanUrl.includes("amazon.com") &&
      (cleanUrl.includes("/images/I/") || cleanUrl.includes("/images/S/"))
    ) {
      return optimizeAmazonUrl(cleanUrl);
    }

    // 处理花瓣网图片（自定义规则优先）
    if (cleanUrl.includes("huaban.com") || cleanUrl.includes("hbimg-edge")) {
      return optimizeHuabanUrl(cleanUrl);
    }

    // 通用处理：检查URL是否包含图片格式后缀，如果没有则转换为base64
    if (!hasImageExtension(cleanUrl)) {
      console.log("检测到无图片格式后缀的URL，尝试转换为base64:", cleanUrl);
      const base64Data = await urlToBase64(cleanUrl);
      if (base64Data) {
        return base64Data;
      }
      return cleanUrl; // 转换失败返回原始URL
    }

    return cleanUrl;
  }

  // ==========================================
  // 3. 名称提取
  // ==========================================
  function findBestName(startNode) {
    const DEFAULT_NAME = "馍馍就是人间美味";
    if (!startNode) return DEFAULT_NAME;

    let current = startNode;
    let depth = 0;
    const maxSearchDepth = 4;

    while (current && depth < maxSearchDepth) {
      let name =
        current.getAttribute("alt") ||
        current.getAttribute("title") ||
        current.getAttribute("aria-label");

      if (
        !name &&
        current.tagName === "SPAN" &&
        current.innerText.length < 50
      ) {
        name = current.innerText;
      }

      if (name && name.trim()) return name.trim();
      current = current.parentElement;
      depth++;
    }
    return DEFAULT_NAME;
  }

  // ==========================================
  // 4. 核心探测 (全面升级：上/下/左/右)
  // ==========================================

  // 提取背景图 URL 的工具函数
  function extractBgUrl(node, pseudo = null) {
    try {
      const bg = window.getComputedStyle(node, pseudo).backgroundImage;
      if (bg && bg !== "none") {
        // 升级版正则：支持换行符，支持空格
        const m = bg.match(/url\(\s*(?:['"]?)([\s\S]*?)(?:['"]?)\s*\)/);
        if (m && m[1]) return m[1];
      }
    } catch (e) {}
    return null;
  }

  // 检查单个节点
  function checkNode(node) {
    if (!node || node.nodeType !== 1) return null;

    // ✅ 0. canvas 支持
    if (node.tagName === "CANVAS") {
      try {
        const dataUrl = node.toDataURL("image/png");
        return { url: dataUrl, element: node };
      } catch (e) {
        console.warn("canvas 转换失败（可能跨域）:", e);
      }
    }

    // 1. IMG
    if (node.tagName === "IMG" && node.src) {
      return { url: node.src, element: node };
    }

    // 2. 背景图
    let url = extractBgUrl(node);
    if (url) return { url: url, element: node };

    // 3. 伪类
    if ((url = extractBgUrl(node, "::before")))
      return { url: url, element: node };
    if ((url = extractBgUrl(node, "::after")))
      return { url: url, element: node };

    return null;
  }

  // 向下探测子元素 (解决微信嵌套问题)
  function checkChildren(node) {
    if (!node || node.nodeType !== 1) return null;

    // 尝试查找内部的 IMG
    const img = node.querySelector("img");
    if (img && img.src) return { url: img.src, element: img };

    // 尝试查找内部有 style="background-image..." 的元素 (针对你的截图场景)
    const bgEl = node.querySelector('[style*="background-image"]');
    if (bgEl) {
      let url = extractBgUrl(bgEl);
      if (url) return { url: url, element: bgEl };
    }

    // 如果是用 class 控制的背景图，尝试找 i 标签 (微信常用 i 做背景容器)
    const iTag = node.querySelector("i");
    if (iTag) {
      let url = extractBgUrl(iTag);
      if (url) return { url: url, element: iTag };
    }
    // ✅ canvas 子元素支持
    const canvas = node.querySelector("canvas");
    if (canvas) {
      try {
        const dataUrl = canvas.toDataURL("image/png");
        return { url: dataUrl, element: canvas };
      } catch (e) {}
    }
    return null;
  }

  function findTargetImage(startNode) {
    let current = startNode;
    let depth = 0;
    const maxDepth = 5;

    while (current && current !== document.body && depth < maxDepth) {
      // 1. 查自己
      let res = checkNode(current);
      if (res) return res;

      // 2. 查内部子元素 (解决容器嵌套问题)
      // 只有当当前节点是 DIV/SPAN/SECTION 等容器时才查，避免性能浪费
      if (["DIV", "SPAN", "SECTION", "A", "LI"].includes(current.tagName)) {
        let childRes = checkChildren(current);
        if (childRes) return childRes;
      }

      // 3. 查前兄弟 (解决视频封面问题)
      if (current.previousElementSibling) {
        let prevRes = checkNode(current.previousElementSibling);
        if (prevRes) return prevRes;
      }

      // 4. 查后兄弟
      if (current.nextElementSibling) {
        let nextRes = checkNode(current.nextElementSibling);
        if (nextRes) return nextRes;
      }

      // 5. 向上爬
      current = current.parentElement;
      depth++;
    }
    return null;
  }

  // ==========================================
  // 5. 事件监听
  // ==========================================
  const eventsToBlock = ["click", "mousedown"];

  eventsToBlock.forEach((eventName) => {
    document.addEventListener(
      eventName,
      async function (e) {
        if (e.ctrlKey || e.metaKey) {
          // 优先从点击目标开始找
          const result = findTargetImage(e.target);

          if (result) {
            // 在Mac上可能需要更宽松的事件处理
            if (navigator.platform.toLowerCase().includes("mac")) {
              // Mac上只阻止默认行为，不阻止传播
              e.preventDefault();
            } else {
              // Windows上保持原有严格处理
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
            }

            if (eventName === "click") {
              try {
                const finalUrl = await processImageUrl(result.url);

                if (finalUrl) {
                  let finalName = findBestName(result.element);
                  if (finalName === "馍馍就是人间美味")
                    finalName = findBestName(e.target);

                  const isNewDocMode = e.altKey;

                  // UI 反馈
                  const borderColor = isNewDocMode ? "#d13438" : "#0078d4";
                  fx.style.border = `4px solid ${borderColor}`;
                  fx.style.boxShadow = `0 0 15px ${isNewDocMode ? "rgba(209,52,56,0.6)" : "rgba(0,120,212,0.6)"}`;

                  const rect = result.element.getBoundingClientRect();
                  Object.assign(fx.style, {
                    left: rect.left + "px",
                    top: rect.top + "px",
                    width: rect.width + "px",
                    height: rect.height + "px",
                    display: "block",
                    opacity: "1",
                    transform: "scale(1)",
                  });
                  setTimeout(() => {
                    fx.style.opacity = "0";
                    fx.style.transform = "scale(1.05)";
                  }, 200);

                  // 写入剪贴板
                  let clipboardStr = `PS_IMPORTER:${finalUrl}|||${finalName}`;
                  if (isNewDocMode) clipboardStr += "|||NEW_DOC";

                  try {
                    GM_setClipboard(clipboardStr);
                  } catch (error) {
                    console.error("剪贴板写入失败:", error);
                    // Mac上尝试备用方法
                    if (navigator.platform.toLowerCase().includes("mac")) {
                      try {
                        // 尝试使用navigator.clipboard作为备用
                        await navigator.clipboard.writeText(clipboardStr);
                      } catch (clipError) {
                        console.error("备用剪贴板方法也失败:", clipError);
                      }
                    }
                  }

                  // 显示简短的URL预览（如果是base64则显示特殊标识）
                  let displayUrl = finalUrl;
                  if (finalUrl.startsWith("data:")) {
                    displayUrl = "[Base64图片数据]";
                  } else if (finalUrl.length > 50) {
                    displayUrl = "..." + finalUrl.slice(-40);
                  }

                  GM_notification({
                    text: displayUrl,
                    title: `[${isNewDocMode ? "新建" : "置入"}] ${finalName}`,
                    timeout: 1000,
                  });
                }
              } catch (error) {
                console.error("图片处理失败:", error);
                GM_notification({
                  text: "图片处理失败，请检查网络连接",
                  title: "错误",
                  timeout: 2000,
                });
              }
            }
          }
        }
      },
      { capture: true, passive: false },
    );
  });
})();

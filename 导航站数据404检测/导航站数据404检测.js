// ==UserScript==
// @name         导航站数据404检测工具
// @namespace    https://getquicker.net/User/Actions/388875-星河城野❤
// @version      1.1
// @description  自动检测导航网站中收录链接的有效性，识别404等无法访问的链接，支持网站和图片检测
// @author       小张 | 个人博客：https://blog.z-l.top | 公众号"爱吃馍" | 设计导航站：https://dh.z-l.top | quicker账号昵称：星河城野❤
// @match        https://dh.z-l.top
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @require      https://cdn.jsdelivr.net/npm/axios@1.6.2/dist/axios.min.js
// @require      https://cdn.tailwindcss.com
// @icon         https://dh.z-l.top/assets/favicon.ico
// @run-at       document-end
// ==/UserScript==

/**
 * 导航站数据404检测工具
 * 功能：自动提取导航网站中的链接和图片并检测其有效性
 * 作者：小张 - https://blog.z-l.top/
 * GitHub：https://github.com/xiaolongmr
 * 使用Tailwind CSS框架进行界面样式设计
 */

(function () {
  'use strict';

  // 配置参数
  const CONFIG = {
    // 并发请求数量
    CONCURRENT_REQUESTS: 5,
    // 请求超时时间（毫秒）
    TIMEOUT: 10000,
    // 请求延迟（毫秒）
    REQUEST_DELAY: 200,
    // 重试次数
    RETRY_COUNT: 2,
    // 是否检测图片
    DETECT_IMAGES: true,
    // 选择器配置
    SELECTORS: {
      // 网站名称选择器
      NAME: '.box-card a .item .logo span',
      // 网站图标选择器
      ICON: '.box-card a .item .logo img',
      // 网站链接选择器
      LINK: '.box-card a'
    }
  };

  // 状态统计
  let stats = {
    total: 0,
    totalWebsites: 0,
    totalImages: 0,
    success: 0,
    failed: 0,
    imageSuccess: 0,
    imageFailed: 0,
    timeout: 0,
    cors: 0,
    inProgress: 0,
    data: []
  };

  // 检测队列管理
  let detectionQueue = [];
  let activeRequests = 0;
  let isDetecting = false;
  let startTime;

  /**
   * 提取网站信息
   * @returns {Array} 网站信息数组
   */
  function extractWebsiteData() {
    console.log('开始提取网站数据...');

    // 重置统计数据
    stats = {
      total: 0,
      totalWebsites: 0,
      totalImages: 0,
      success: 0,
      failed: 0,
      imageSuccess: 0,
      imageFailed: 0,
      timeout: 0,
      cors: 0,
      inProgress: 0,
      data: []
    };

    const websiteData = [];

    // 获取所有网站链接元素
    const linkElements = document.querySelectorAll(CONFIG.SELECTORS.LINK);

    if (linkElements.length === 0) {
      console.warn('未找到符合选择器的链接元素');
      return [];
    }

    console.log(`找到 ${linkElements.length} 个链接元素`);

    linkElements.forEach((linkElement, index) => {
      try {
        // 获取网站链接
        const url = linkElement.getAttribute('href');
        if (!url || !url.startsWith('http')) return;

        // 获取网站名称
        let name = '未知网站';
        const nameElement = linkElement.querySelector(CONFIG.SELECTORS.NAME);
        if (nameElement) {
          name = nameElement.textContent.trim();
        }

        // 获取网站图标
        let iconUrl = '';
        const iconElement = linkElement.querySelector(CONFIG.SELECTORS.ICON);
        if (iconElement) {
          iconUrl = iconElement.getAttribute('src') || '';
          // 确保图标URL是完整的
          if (iconUrl && !iconUrl.startsWith('http')) {
            const baseUrl = window.location.origin;
            iconUrl = new URL(iconUrl, baseUrl).href;
          }
        }

        // 添加到数据数组
        websiteData.push({
          name,
          url,
          iconUrl
        });
      } catch (error) {
        console.error(`处理元素 ${index} 时出错:`, error);
      }
    });

    stats.totalWebsites = websiteData.length;
    stats.total = CONFIG.DETECT_IMAGES ? websiteData.length * 2 : websiteData.length;
    console.log(`成功提取 ${websiteData.length} 个网站信息`);

    return websiteData;
  }

  /**
   * 检测单个链接的有效性（使用fetch和预加载）
   * @param {Object} website 网站信息对象
   * @param {number} retry 当前重试次数
   * @returns {Promise<Object>} 检测结果
   */
  async function checkLink(website, retry = 0) {
    return new Promise((resolve) => {
      try {
        // 使用不同的检测策略
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
        
        // 对于网站URL，使用link prefetch方式进行检测，这种方式对CORS限制较小
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = website.url + '?' + Date.now();
        link.onload = function() {
          clearTimeout(timeoutId);
          document.head.removeChild(link);
          resolve({
            ...website,
            type: 'website',
            status: 'success',
            message: '链接可正常访问'
          });
        };
        
        link.onerror = function() {
          clearTimeout(timeoutId);
          document.head.removeChild(link);
          
          // 如果重试次数未用完，进行重试
          if (retry < CONFIG.RETRY_COUNT) {
            console.log(`网站 ${website.name} 检测失败，准备重试 (${retry + 1}/${CONFIG.RETRY_COUNT})...`);
            setTimeout(() => {
              resolve(checkLink(website, retry + 1));
            }, 500 * (retry + 1));
            return;
          }
          
          // 退回到使用fetch的head请求（虽然可能会遇到CORS问题）
          tryFetch(website, retry).then(result => resolve(result));
        };
        
        document.head.appendChild(link);
      } catch (error) {
        console.error(`检测网站 ${website.name} 时出错:`, error);
        resolve({
          ...website,
          type: 'website',
          status: 'failed',
          message: `检测出错: ${error.message}`
        });
      }
    });
  }
  
  /**
   * 使用fetch进行检测的备用方法
   */
  function tryFetch(website, retry) {
    return new Promise((resolve) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
      
      fetch(website.url + '?' + Date.now(), {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'cors',
        cache: 'no-cache',
        // 设置User-Agent模拟浏览器请求
        headers: {
          'User-Agent': navigator.userAgent
        }
      })
      .then(response => {
        clearTimeout(timeoutId);
        // 认为2xx和3xx状态码都是成功的
        if (response.ok || response.redirected) {
          resolve({
            ...website,
            type: 'website',
            status: 'success',
            message: `链接可正常访问 (状态码: ${response.status})`
          });
        } else {
          resolve({
            ...website,
            type: 'website',
            status: 'failed',
            message: `链接返回错误状态码: ${response.status}`
          });
        }
      })
      .catch(error => {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          // 超时情况
          if (retry < CONFIG.RETRY_COUNT) {
            console.log(`网站 ${website.name} 请求超时，准备重试 (${retry + 1}/${CONFIG.RETRY_COUNT})...`);
            setTimeout(() => {
              resolve(tryFetch(website, retry + 1));
            }, 500 * (retry + 1));
            return;
          }
          
          resolve({
            ...website,
            type: 'website',
            status: 'timeout',
            message: '请求超时'
          });
        } else if (error.message && error.message.includes('CORS')) {
          // CORS错误，但网站可能仍然可用
          resolve({
            ...website,
            type: 'website',
            status: 'success',
            message: '网站可能可访问（由于CORS限制无法确认状态码）'
          });
        } else {
          // 其他错误
          if (retry < CONFIG.RETRY_COUNT) {
            console.log(`网站 ${website.name} 检测失败，准备重试 (${retry + 1}/${CONFIG.RETRY_COUNT})...`);
            setTimeout(() => {
              resolve(tryFetch(website, retry + 1));
            }, 500 * (retry + 1));
            return;
          }
          
          resolve({
            ...website,
            type: 'website',
            status: 'failed',
            message: `请求失败: ${error.message}`
          });
        }
      });
    });
  }
  
  /**
   * 检测图片的有效性
   * @param {Object} website 网站信息对象
   * @param {number} retry 当前重试次数
   * @returns {Promise<Object>} 检测结果
   */
  async function checkImage(website, retry = 0) {
    return new Promise((resolve) => {
      if (!website.iconUrl) {
        resolve({
          ...website,
          type: 'image',
          status: 'skipped',
          message: '无图片URL，跳过检测'
        });
        return;
      }
      
      const img = new Image();
      let timeoutId;

      img.onload = function() {
        clearTimeout(timeoutId);
        resolve({
          ...website,
          type: 'image',
          status: 'success',
          message: '图片可正常加载'
        });
      };

      img.onerror = function() {
        clearTimeout(timeoutId);

        if (retry < CONFIG.RETRY_COUNT) {
          console.log(`网站 ${website.name} 的图片检测失败，准备重试 (${retry + 1}/${CONFIG.RETRY_COUNT})...`);
          setTimeout(() => {
            resolve(checkImage(website, retry + 1));
          }, 500 * (retry + 1));
          return;
        }

        resolve({
          ...website,
          type: 'image',
          status: 'failed',
          message: '图片无法加载（可能404）'
        });
      };

      timeoutId = setTimeout(() => {
        clearTimeout(timeoutId);

        if (retry < CONFIG.RETRY_COUNT) {
          console.log(`网站 ${website.name} 的图片请求超时，准备重试 (${retry + 1}/${CONFIG.RETRY_COUNT})...`);
          setTimeout(() => {
            resolve(checkImage(website, retry + 1));
          }, 500 * (retry + 1));
          return;
        }

        resolve({
          ...website,
          type: 'image',
          status: 'timeout',
          message: '图片请求超时'
        });
      }, CONFIG.TIMEOUT);

      img.src = website.iconUrl + '?' + Date.now();
    });
  }

  /**
   * 处理队列中的检测任务
   */
  async function processQueue() {
    if (detectionQueue.length === 0 && activeRequests === 0) {
      finishDetection();
      return;
    }

    // 当有空闲槽位且队列有任务时处理
    while (activeRequests < CONFIG.CONCURRENT_REQUESTS && detectionQueue.length > 0) {
      const task = detectionQueue.shift();
      activeRequests++;
      stats.inProgress++;

      // 添加请求延迟
      await new Promise(resolve => setTimeout(resolve, CONFIG.REQUEST_DELAY));

      // 执行检测，根据任务类型调用不同的检测函数
      const checkPromise = task.type === 'image' ? checkImage(task.data) : checkLink(task.data);
      
      checkPromise.then(result => {
        // 更新统计信息
        activeRequests--;
        stats.inProgress--;
        stats.data.push(result);

        // 根据类型更新不同的统计
        if (result.type === 'image') {
          if (result.status === 'success') {
            stats.imageSuccess++;
            stats.success++;
          } else if (result.status !== 'skipped') {
            stats.imageFailed++;
            stats.failed++;
            if (result.status === 'timeout') {
              stats.timeout++;
            }
          }
        } else {
          // 网站类型
          if (result.status === 'success') {
            stats.success++;
          } else if (result.status === 'timeout') {
            stats.timeout++;
            stats.failed++;
          } else {
            stats.failed++;
          }
        }
        
        // 添加到最近检测结果
        addRecentResult(result);

        // 更新进度显示
        updateProgressDisplay();

        // 继续处理队列
        processQueue();
      });
    }
  }

  /**
   * 开始检测网站链接和图片
   */
  function startDetection() {
    if (isDetecting) {
      console.warn('检测已在进行中');
      return;
    }

    isDetecting = true;
    startTime = Date.now();

    // 提取网站数据
    const websiteData = extractWebsiteData();

    if (websiteData.length === 0) {
      alert('未找到符合选择器的网站数据，请确认选择器配置是否正确');
      isDetecting = false;
      return;
    }

    // 创建进度显示
    createProgressDisplay();

    // 填充队列 - 创建任务对象
    detectionQueue = [];
    
    // 添加网站检测任务
    websiteData.forEach(website => {
      detectionQueue.push({
        type: 'website',
        data: website
      });
      
      // 如果启用图片检测，添加图片检测任务
      if (CONFIG.DETECT_IMAGES && website.iconUrl) {
        detectionQueue.push({
          type: 'image',
          data: website
        });
      }
    });

    const tasksText = CONFIG.DETECT_IMAGES ? 
      `${websiteData.length} 个网站链接和 ${websiteData.filter(w => w.iconUrl).length} 张图片` : 
      `${websiteData.length} 个网站链接`;
      
    console.log(`开始检测 ${tasksText}，最大并发数: ${CONFIG.CONCURRENT_REQUESTS}`);

    // 开始处理队列
    processQueue();
  }

  /**
   * 完成检测并生成报告
   */
  function finishDetection() {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`检测完成，耗时 ${duration} 秒`);

    // 生成检测报告
    generateReport();

    isDetecting = false;

    // 显示完成消息
    let message = `检测完成！\n\n`;
    message += `网站检测: ${stats.totalWebsites}\n`;
    
    if (CONFIG.DETECT_IMAGES) {
      message += `图片检测: ${stats.totalImages}\n`;
    }
    
    message += `\n成功: ${stats.success}\n失败: ${stats.failed}\n`;
    
    if (CONFIG.DETECT_IMAGES) {
      message += `网站成功: ${stats.success - stats.imageSuccess}\n`;
      message += `图片成功: ${stats.imageSuccess}\n`;
    }
    
    message += `\n详细报告已显示在页面上`;
    
    alert(message);
  }

  /**
   * 生成检测报告
   */
  function generateReport() {
    // 移除旧的报告
    const oldReport = document.getElementById('website-detection-report');
    if (oldReport) {
      oldReport.remove();
    }

    // 创建报告容器，使用Tailwind CSS
    const reportContainer = document.createElement('div');
    reportContainer.id = 'website-detection-report';
    reportContainer.className = 'fixed top-4 left-4 w-[95%] max-w-3xl max-h-[80vh] bg-white border-2 border-blue-500 rounded-lg p-5 z-50 overflow-y-auto shadow-lg font-sans';

    // 报告标题
    const title = document.createElement('h2');
    title.textContent = '网站链接检测报告';
    title.className = 'text-2xl font-bold text-gray-800 mb-4';
    reportContainer.appendChild(title);

    // 统计信息
    const statsDiv = document.createElement('div');
    statsDiv.className = 'bg-gray-50 p-4 rounded-lg mb-5';
    
    const statsTitle = document.createElement('h3');
    statsTitle.textContent = '统计信息';
    statsTitle.className = 'text-lg font-semibold mb-3';
    statsDiv.appendChild(statsTitle);
    
    const statsList = document.createElement('ul');
    statsList.className = 'list-none p-0 m-0 space-y-2';
    
    // 添加统计项
    const statsItems = [
      { label: '网站总数', value: stats.totalWebsites },
      { label: '成功访问', value: stats.success, className: 'text-green-600' }
    ];
    
    if (CONFIG.DETECT_IMAGES) {
      statsItems.push(
        { label: '图片总数', value: stats.totalImages },
        { label: '网站成功', value: stats.success - stats.imageSuccess, className: 'text-green-600' },
        { label: '图片成功', value: stats.imageSuccess, className: 'text-green-600' }
      );
    }
    
    statsItems.push(
      { label: '访问失败', value: stats.failed, className: 'text-red-600' },
      { label: '请求超时', value: stats.timeout, className: 'text-yellow-500' },
      { label: '成功率', value: `${((stats.success / (stats.success + stats.failed)) * 100).toFixed(2)}%`, className: '' }
    );
    
    statsItems.forEach(item => {
      const li = document.createElement('li');
      li.className = 'flex justify-between';
      li.innerHTML = `
        <span>${item.label}:</span>
        <strong class="${item.className}">${item.value}</strong>
      `;
      statsList.appendChild(li);
    });
    
    statsDiv.appendChild(statsList);
    reportContainer.appendChild(statsDiv);

    // 网站失败列表
    const websiteFailedDiv = document.createElement('div');
    websiteFailedDiv.className = 'mb-5';
    
    const websiteFailedTitle = document.createElement('h3');
    const websiteFailedCount = stats.data.filter(item => 
      item.type === 'website' && item.status !== 'success'
    ).length;
    websiteFailedTitle.textContent = `无法访问的网站 (${websiteFailedCount})`;
    websiteFailedTitle.className = 'text-lg font-semibold mb-3';
    websiteFailedDiv.appendChild(websiteFailedTitle);

    const websiteFailedList = document.createElement('table');
    websiteFailedList.className = 'w-full border-collapse';
    websiteFailedList.innerHTML = `
      <thead>
        <tr class="bg-gray-50">
          <th class="border border-gray-300 p-3 text-left">网站名称</th>
          <th class="border border-gray-300 p-3 text-left">URL</th>
          <th class="border border-gray-300 p-3 text-left">状态</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const websiteFailedRows = stats.data
      .filter(item => item.type === 'website' && item.status !== 'success')
      .map(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="border border-gray-300 p-3">${item.name}</td>
          <td class="border border-gray-300 p-3">
            <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${item.url}</a>
          </td>
          <td class="border border-gray-300 p-3 text-red-600">${item.message}</td>
        `;
        return row;
      });

    const websiteTbody = websiteFailedList.querySelector('tbody');
    websiteFailedRows.forEach(row => websiteTbody.appendChild(row));

    if (websiteFailedRows.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `<td colspan="3" class="border border-gray-300 p-3 text-center text-green-600">恭喜！所有网站均可正常访问。</td>`;
      websiteTbody.appendChild(emptyRow);
    }

    websiteFailedDiv.appendChild(websiteFailedList);
    reportContainer.appendChild(websiteFailedDiv);

    // 图片失败列表（如果启用了图片检测）
    if (CONFIG.DETECT_IMAGES) {
      const imageFailedDiv = document.createElement('div');
      imageFailedDiv.className = 'mb-5';
      
      const imageFailedTitle = document.createElement('h3');
      const imageFailedCount = stats.data.filter(item => 
        item.type === 'image' && item.status !== 'success'
      ).length;
      imageFailedTitle.textContent = `无法加载的图片 (${imageFailedCount})`;
      imageFailedTitle.className = 'text-lg font-semibold mb-3';
      imageFailedDiv.appendChild(imageFailedTitle);

      const imageFailedList = document.createElement('table');
      imageFailedList.className = 'w-full border-collapse';
      imageFailedList.innerHTML = `
        <thead>
          <tr class="bg-gray-50">
            <th class="border border-gray-300 p-3 text-left">网站名称</th>
            <th class="border border-gray-300 p-3 text-left">图片URL</th>
            <th class="border border-gray-300 p-3 text-left">状态</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;

      const imageFailedRows = stats.data
        .filter(item => item.type === 'image' && item.status !== 'success')
        .map(item => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td class="border border-gray-300 p-3">${item.name}</td>
            <td class="border border-gray-300 p-3">
              <a href="${item.iconUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline break-all">${item.iconUrl}</a>
            </td>
            <td class="border border-gray-300 p-3 text-red-600">${item.message}</td>
          `;
          return row;
        });

      const imageTbody = imageFailedList.querySelector('tbody');
      imageFailedRows.forEach(row => imageTbody.appendChild(row));

      if (imageFailedRows.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `<td colspan="3" class="border border-gray-300 p-3 text-center text-green-600">恭喜！所有图片均可正常加载。</td>`;
        imageTbody.appendChild(emptyRow);
      }

      imageFailedDiv.appendChild(imageFailedList);
      reportContainer.appendChild(imageFailedDiv);
    }

    // 操作按钮
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'mt-5 flex gap-3';

    // 复制JSON数据按钮
    const copyJsonBtn = document.createElement('button');
    copyJsonBtn.textContent = '复制JSON数据';
    copyJsonBtn.className = 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors';
    copyJsonBtn.onclick = () => {
      const jsonData = JSON.stringify(stats.data, null, 2);
      GM_setClipboard(jsonData);
      alert('JSON数据已复制到剪贴板');
    };
    actionsDiv.appendChild(copyJsonBtn);

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '关闭报告';
    closeBtn.className = 'px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors';
    closeBtn.onclick = () => reportContainer.remove();
    actionsDiv.appendChild(closeBtn);

    reportContainer.appendChild(actionsDiv);

    // 添加到页面
    document.body.appendChild(reportContainer);
  }

  // 存储最近的检测结果，用于实时显示
  let recentResults = [];
  const MAX_RECENT_RESULTS = 10; // 最多显示10条最近结果

  /**
   * 创建进度显示
   */
  function createProgressDisplay() {
    // 移除旧的进度显示
    const oldProgress = document.getElementById('website-detection-progress');
    if (oldProgress) {
      oldProgress.remove();
    }
    
    // 重置最近结果数组
    recentResults = [];

    // 创建进度显示容器，使用Tailwind CSS
    const progressContainer = document.createElement('div');
    progressContainer.id = 'website-detection-progress';
    progressContainer.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-blue-500 rounded-lg p-5 z-50 shadow-lg min-w-[500px] max-w-[80vw] max-h-[80vh] overflow-y-auto font-sans';

    // 标题
    const title = document.createElement('h3');
    title.textContent = '检测进度';
    title.className = 'text-xl font-semibold mb-4';
    progressContainer.appendChild(title);

    // 进度条
    const progressBarContainer = document.createElement('div');
    progressBarContainer.className = 'w-full h-5 bg-gray-200 rounded-full overflow-hidden';

    const progressBar = document.createElement('div');
    progressBar.id = 'progress-bar-fill';
    progressBar.className = 'h-full bg-blue-500 transition-all duration-300';
    progressBar.style.width = '0%';

    progressBarContainer.appendChild(progressBar);
    progressContainer.appendChild(progressBarContainer);

    // 进度文本
    const progressText = document.createElement('div');
    progressText.id = 'progress-text';
    progressText.className = 'mt-3 text-center font-medium';
    progressText.textContent = `处理中: 0/${stats.total} (0%)`;

    progressContainer.appendChild(progressText);
    
    // 最近检测结果标题
    const recentResultsTitle = document.createElement('h4');
    recentResultsTitle.textContent = '最近检测结果';
    recentResultsTitle.className = 'mt-5 mb-2 text-lg font-medium text-gray-700';
    progressContainer.appendChild(recentResultsTitle);
    
    // 最近检测结果列表
    const recentResultsList = document.createElement('div');
    recentResultsList.id = 'recent-results-list';
    recentResultsList.className = 'space-y-2 max-h-[300px] overflow-y-auto';
    recentResultsList.innerHTML = '<div class="text-gray-500 text-center py-4">开始检测后将显示实时结果...</div>';
    progressContainer.appendChild(recentResultsList);
    
    // 操作按钮
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'mt-4 flex justify-center';
    
    // 取消检测按钮
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消检测';
    cancelBtn.className = 'px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors';
    cancelBtn.onclick = () => {
      // 清空队列，停止检测
      detectionQueue = [];
      isDetecting = false;
      progressContainer.remove();
      alert('检测已取消');
    };
    actionsDiv.appendChild(cancelBtn);
    
    progressContainer.appendChild(actionsDiv);

    // 添加到页面
    document.body.appendChild(progressContainer);
  }

  /**
   * 更新进度显示
   */
  function updateProgressDisplay() {
    const progressBar = document.getElementById('progress-bar-fill');
    const progressText = document.getElementById('progress-text');
    const recentResultsList = document.getElementById('recent-results-list');

    if (!progressBar || !progressText || !recentResultsList) return;

    const completed = stats.success + stats.failed;
    const percentage = (completed / stats.total) * 100;

    progressBar.style.width = `${percentage}%`;
    
    // 更新统计文本
    let text = `处理中: ${completed}/${stats.total} (${percentage.toFixed(1)}%)`;
    text += `\n成功: ${stats.success}, 失败: ${stats.failed}, 进行中: ${stats.inProgress}`;
    
    if (CONFIG.DETECT_IMAGES) {
      text += `\n图片成功: ${stats.imageSuccess}, 图片失败: ${stats.imageFailed}`;
    }
    
    progressText.textContent = text;
    
    // 更新最近结果列表
    updateRecentResultsList(recentResultsList);
  }
  
  /**
   * 更新最近检测结果列表
   */
  function updateRecentResultsList(container) {
    if (recentResults.length === 0) {
      container.innerHTML = '<div class="text-gray-500 text-center py-4">开始检测后将显示实时结果...</div>';
      return;
    }
    
    // 清空容器
    container.innerHTML = '';
    
    // 添加最近的检测结果
    recentResults.forEach(result => {
      const resultItem = document.createElement('div');
      
      // 根据状态设置样式
      let statusClass = 'text-yellow-500';
      let statusIcon = '⏳';
      let message = result.message;
      
      if (result.status === 'success') {
        statusClass = 'text-green-600';
        statusIcon = '✅';
      } else if (result.status === 'failed') {
        statusClass = 'text-red-600';
        statusIcon = '❌';
      } else if (result.status === 'timeout') {
        statusClass = 'text-orange-500';
        statusIcon = '⏰';
      } else if (result.status === 'skipped') {
        statusClass = 'text-gray-500';
        statusIcon = '⚠️';
      }
      
      // 设置类型标签
      const typeTag = result.type === 'image' ? 
        '<span class="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded mr-2">图片</span>' : 
        '<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded mr-2">网站</span>';
      
      // 截断过长的消息
      const maxMessageLength = 50;
      if (message.length > maxMessageLength) {
        message = message.substring(0, maxMessageLength) + '...';
      }
      
      resultItem.className = 'p-2 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors';
      resultItem.innerHTML = `
        <div class="flex items-start">
          <span class="${statusClass} mr-2 text-lg">${statusIcon}</span>
          <div class="flex-1">
            <div class="flex items-center">
              ${typeTag}
              <span class="font-medium truncate max-w-[200px]">${result.name}</span>
            </div>
            <div class="text-sm text-gray-600 mt-1 truncate">${message}</div>
          </div>
        </div>
      `;
      
      container.appendChild(resultItem);
    });
  }
  
  /**
   * 添加最近检测结果
   */
  function addRecentResult(result) {
    // 添加到最近结果数组的开头
    recentResults.unshift(result);
    
    // 保持数组大小限制
    if (recentResults.length > MAX_RECENT_RESULTS) {
      recentResults.pop();
    }
  }

  /**
   * 显示配置面板
   */
  function showConfigPanel() {
    // 移除旧的配置面板
    const oldConfig = document.getElementById('website-detection-config');
    if (oldConfig) {
      oldConfig.remove();
    }

    // 创建配置面板，使用Tailwind CSS
    const configPanel = document.createElement('div');
    configPanel.id = 'website-detection-config';
    configPanel.className = 'fixed top-4 right-4 bg-white border border-gray-300 rounded-lg p-5 z-50 shadow-lg min-w-[300px] font-sans';

    // 标题
    const title = document.createElement('h3');
    title.textContent = '配置参数';
    title.className = 'text-xl font-semibold mb-4';
    configPanel.appendChild(title);

    // 配置表单
    const form = document.createElement('form');

    // 并发数配置
    const concurrentDiv = document.createElement('div');
    concurrentDiv.className = 'mb-4';
    
    const concurrentLabel = document.createElement('label');
    concurrentLabel.htmlFor = 'concurrent-requests';
    concurrentLabel.textContent = '并发请求数量:';
    concurrentLabel.className = 'block mb-1 text-sm font-medium';
    
    const concurrentInput = document.createElement('input');
    concurrentInput.type = 'number';
    concurrentInput.id = 'concurrent-requests';
    concurrentInput.value = CONFIG.CONCURRENT_REQUESTS;
    concurrentInput.min = 1;
    concurrentInput.max = 20;
    concurrentInput.className = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
    
    concurrentDiv.appendChild(concurrentLabel);
    concurrentDiv.appendChild(concurrentInput);
    form.appendChild(concurrentDiv);

    // 超时配置
    const timeoutDiv = document.createElement('div');
    timeoutDiv.className = 'mb-4';
    
    const timeoutLabel = document.createElement('label');
    timeoutLabel.htmlFor = 'timeout';
    timeoutLabel.textContent = '超时时间(毫秒):';
    timeoutLabel.className = 'block mb-1 text-sm font-medium';
    
    const timeoutInput = document.createElement('input');
    timeoutInput.type = 'number';
    timeoutInput.id = 'timeout';
    timeoutInput.value = CONFIG.TIMEOUT;
    timeoutInput.min = 1000;
    timeoutInput.max = 30000;
    timeoutInput.className = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
    
    timeoutDiv.appendChild(timeoutLabel);
    timeoutDiv.appendChild(timeoutInput);
    form.appendChild(timeoutDiv);

    // 重试次数配置
    const retryDiv = document.createElement('div');
    retryDiv.className = 'mb-4';
    
    const retryLabel = document.createElement('label');
    retryLabel.htmlFor = 'retry-count';
    retryLabel.textContent = '重试次数:';
    retryLabel.className = 'block mb-1 text-sm font-medium';
    
    const retryInput = document.createElement('input');
    retryInput.type = 'number';
    retryInput.id = 'retry-count';
    retryInput.value = CONFIG.RETRY_COUNT;
    retryInput.min = 0;
    retryInput.max = 5;
    retryInput.className = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
    
    retryDiv.appendChild(retryLabel);
    retryDiv.appendChild(retryInput);
    form.appendChild(retryDiv);
    
    // 图片检测配置
    const imageDetectionDiv = document.createElement('div');
    imageDetectionDiv.className = 'mb-4';
    
    const imageDetectionLabel = document.createElement('label');
    imageDetectionLabel.htmlFor = 'detect-images';
    imageDetectionLabel.className = 'flex items-center';
    
    const imageDetectionInput = document.createElement('input');
    imageDetectionInput.type = 'checkbox';
    imageDetectionInput.id = 'detect-images';
    imageDetectionInput.checked = CONFIG.DETECT_IMAGES;
    imageDetectionInput.className = 'mr-2 h-4 w-4 text-blue-500';
    
    const imageDetectionSpan = document.createElement('span');
    imageDetectionSpan.textContent = '启用图片404检测';
    imageDetectionSpan.className = 'text-sm font-medium';
    
    imageDetectionLabel.appendChild(imageDetectionInput);
    imageDetectionLabel.appendChild(imageDetectionSpan);
    imageDetectionDiv.appendChild(imageDetectionLabel);
    form.appendChild(imageDetectionDiv);

    // 按钮容器
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'flex gap-3 mt-5';

    // 保存按钮
    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = '保存配置';
    saveBtn.className = 'flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors';
    saveBtn.onclick = () => {
      CONFIG.CONCURRENT_REQUESTS = parseInt(document.getElementById('concurrent-requests').value);
      CONFIG.TIMEOUT = parseInt(document.getElementById('timeout').value);
      CONFIG.RETRY_COUNT = parseInt(document.getElementById('retry-count').value);
      CONFIG.DETECT_IMAGES = document.getElementById('detect-images').checked;

      alert('配置已保存');
      configPanel.remove();
    };
    buttonsDiv.appendChild(saveBtn);

    // 取消按钮
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = '取消';
    cancelBtn.className = 'flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors';
    cancelBtn.onclick = () => configPanel.remove();
    buttonsDiv.appendChild(cancelBtn);

    form.appendChild(buttonsDiv);
    configPanel.appendChild(form);

    // 添加到页面
    document.body.appendChild(configPanel);
  }

  /**
   * 导出网站数据为JSON
   */
  function exportJsonData() {
    const websiteData = extractWebsiteData();

    if (websiteData.length === 0) {
      alert('未找到网站数据');
      return;
    }

    const jsonData = JSON.stringify(websiteData, null, 2);
    GM_setClipboard(jsonData);
    alert(`已复制 ${websiteData.length} 个网站的JSON数据到剪贴板`);
  }

  // 注册菜单命令
  GM_registerMenuCommand('开始检测链接', startDetection);
  GM_registerMenuCommand('导出网站数据', exportJsonData);
  GM_registerMenuCommand('配置', showConfigPanel);

  console.log('导航站数据404检测工具已加载');
})();
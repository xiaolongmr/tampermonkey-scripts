// ==UserScript==
// @name         网页元素爬取工具 - UI元素提取与实时编辑
// @namespace    https://getquicker.net/User/Actions/388875-星河城野❤
// @version      1.0.0
// @description  可视化选择网页元素，提取HTML和CSS代码，支持实时编辑和预览
// @author       小张 | 个人博客：https://blog.z-l.top | 公众号"爱吃馍" | 设计导航站 ：https://dh.z-l.top | quicker账号昵称：星河城野❤
// @license      GPL-3.0
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @icon         https://dh.z-l.top/assets/favicon.ico
// @require      https://cdn.jsdelivr.net/npm/driver.js@latest/dist/driver.js.iife.js
// @resource     driverCSS https://cdn.jsdelivr.net/npm/driver.js@latest/dist/driver.css
// @require      https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.min.js
// @resource     prismCSS https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css
// @require      https://cdn.jsdelivr.net/npm/tailwindcss@3.4.0/dist/tailwind.min.js
// ==/UserScript==

/**
 * 网页元素爬取工具
 * 功能：可视化选择网页元素，提取HTML和CSS代码，支持实时编辑和预览
 * 技术栈：原生JavaScript + TailwindCSS + Driver.js + Prism.js
 * 作者：小张
 * 版本：1.0.0
 */

(function() {
    'use strict';

    // 全局变量定义
    let isSelecting = false; // 是否处于选择模式
    let selectedElement = null; // 当前选中的元素
    let overlay = null; // 高亮覆盖层
    let controlPanel = null; // 控制面板
    let editorModal = null; // 编辑弹窗
    let driver = null; // 新手引导实例

    // 初始化函数
    function init() {
        createControlPanel();
        loadTailwindCSS();
        addGlobalStyles();
        setupEventListeners();
        checkFirstTimeUser();
    }

    // 创建控制面板
    function createControlPanel() {
        controlPanel = document.createElement('div');
        controlPanel.id = 'ui-crawler-control-panel';
        controlPanel.className = 'fixed top-4 right-4 z-9999 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-4 min-w-64';
        
        controlPanel.innerHTML = `
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-white font-semibold text-sm">网页元素爬取工具</h3>
                <button id="close-panel" class="text-gray-400 hover:text-white text-xs">×</button>
            </div>
            <div class="space-y-3">
                <button id="select-element" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors">
                    <i class="fas fa-mouse-pointer mr-2"></i>选择元素
                </button>
                <button id="show-tutorial" class="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 py-2 px-3 rounded text-sm font-medium transition-colors">
                    <i class="fas fa-question-circle mr-2"></i>使用教程
                </button>
                <div class="text-xs text-gray-400 mt-2">
                    点击"选择元素"后，鼠标悬停可预览，点击选中元素
                </div>
            </div>
        `;

        document.body.appendChild(controlPanel);
        
        // 添加控制面板事件监听
        document.getElementById('select-element').addEventListener('click', toggleElementSelection);
        document.getElementById('close-panel').addEventListener('click', hideControlPanel);
        document.getElementById('show-tutorial').addEventListener('click', showTutorial);
    }

    // 加载TailwindCSS
    function loadTailwindCSS() {
        if (window.tailwindcss) {
            tailwindcss.init();
        }
    }

    // 添加全局样式
    function addGlobalStyles() {
        const styles = `
            /* 高亮覆盖层样式 */
            .ui-crawler-highlight {
                position: absolute !important;
                background: rgba(59, 130, 246, 0.1) !important;
                border: 2px solid #3b82f6 !important;
                border-radius: 4px !important;
                pointer-events: none !important;
                z-index: 9998 !important;
                transition: all 0.2s ease !important;
            }
            
            .ui-crawler-highlight:hover {
                background: rgba(59, 130, 246, 0.2) !important;
                border-color: #2563eb !important;
            }
            
            /* 选择模式下的页面遮罩 */
            .ui-crawler-selection-mode {
                cursor: crosshair !important;
            }
            
            .ui-crawler-selection-mode * {
                pointer-events: none !important;
            }
            
            .ui-crawler-selection-mode .ui-crawler-highlight {
                pointer-events: auto !important;
                cursor: pointer !important;
            }
            
            /* 控制面板样式 */
            #ui-crawler-control-panel {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                backdrop-filter: blur(10px);
            }
            
            /* 代码编辑器样式 */
            .code-editor {
                font-family: 'Fira Code', 'Consolas', 'Monaco', monospace !important;
                font-size: 13px !important;
                line-height: 1.5 !important;
            }
            
            /* 滚动条样式 */
            .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
                height: 6px;
            }
            
            .custom-scrollbar::-webkit-scrollbar-track {
                background: #1f2937;
                border-radius: 3px;
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #4b5563;
                border-radius: 3px;
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #6b7280;
            }
        `;
        
        GM_addStyle(styles);
    }

    // 设置全局事件监听
    function setupEventListeners() {
        // ESC键退出选择模式
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isSelecting) {
                exitSelectionMode();
            }
        });
        
        // 点击页面其他地方隐藏控制面板
        document.addEventListener('click', (e) => {
            if (controlPanel && !controlPanel.contains(e.target) && 
                !e.target.closest('#ui-crawler-control-panel')) {
                hideControlPanel();
            }
        });
    }

    // 检查是否为新用户并显示引导
    function checkFirstTimeUser() {
        const isFirstTime = GM_getValue('isFirstTime', true);
        if (isFirstTime) {
            setTimeout(showTutorial, 1000);
            GM_setValue('isFirstTime', false);
        }
    }

    // 切换元素选择模式
    function toggleElementSelection() {
        if (isSelecting) {
            exitSelectionMode();
        } else {
            enterSelectionMode();
        }
    }

    // 进入选择模式
    function enterSelectionMode() {
        isSelecting = true;
        document.body.classList.add('ui-crawler-selection-mode');
        
        // 更新按钮状态
        const selectBtn = document.getElementById('select-element');
        selectBtn.innerHTML = '<i class="fas fa-times mr-2"></i>退出选择';
        selectBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        selectBtn.classList.add('bg-red-600', 'hover:bg-red-700');
        
        // 添加鼠标移动监听
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('click', handleElementClick, true);
        
        showSelectionHint();
    }

    // 退出选择模式
    function exitSelectionMode() {
        isSelecting = false;
        document.body.classList.remove('ui-crawler-selection-mode');
        
        // 更新按钮状态
        const selectBtn = document.getElementById('select-element');
        selectBtn.innerHTML = '<i class="fas fa-mouse-pointer mr-2"></i>选择元素';
        selectBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
        selectBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
        
        // 移除事件监听
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('click', handleElementClick, true);
        
        // 清除高亮
        if (overlay) {
            overlay.remove();
            overlay = null;
        }
        
        hideSelectionHint();
    }

    // 处理鼠标移动（高亮显示）
    function handleMouseMove(e) {
        const element = e.target;
        
        // 跳过控制面板和覆盖层
        if (element.closest('#ui-crawler-control-panel') || 
            element.classList.contains('ui-crawler-highlight')) {
            return;
        }
        
        // 移除旧的高亮
        if (overlay) {
            overlay.remove();
        }
        
        // 创建新的高亮覆盖层
        const rect = element.getBoundingClientRect();
        overlay = document.createElement('div');
        overlay.className = 'ui-crawler-highlight';
        overlay.style.left = rect.left + window.scrollX + 'px';
        overlay.style.top = rect.top + window.scrollY + 'px';
        overlay.style.width = rect.width + 'px';
        overlay.style.height = rect.height + 'px';
        
        // 添加元素信息提示
        const tagName = element.tagName.toLowerCase();
        const className = element.className || '';
        overlay.setAttribute('data-tooltip', `${tagName}${className ? '.' + className.split(' ')[0] : ''}`);
        
        document.body.appendChild(overlay);
    }

    // 处理元素点击
    function handleElementClick(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const element = e.target;
        
        // 跳过控制面板
        if (element.closest('#ui-crawler-control-panel')) {
            return;
        }
        
        selectedElement = element;
        exitSelectionMode();
        analyzeAndShowEditor(element);
    }

    // 显示选择提示
    function showSelectionHint() {
        // 实现选择提示显示逻辑
    }

    // 隐藏选择提示
    function hideSelectionHint() {
        // 实现选择提示隐藏逻辑
    }

    // 隐藏控制面板
    function hideControlPanel() {
        if (controlPanel) {
            controlPanel.style.display = 'none';
        }
    }

    // 显示使用教程
    function showTutorial() {
        // 实现新手引导功能
    }

    // 分析元素并显示编辑器
    function analyzeAndShowEditor(element) {
        // 实现元素分析和编辑器显示逻辑
        console.log('选中元素:', element);
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
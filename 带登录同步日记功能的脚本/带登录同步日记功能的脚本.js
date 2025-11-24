// ==UserScript==
// @name         带登录同步日记功能的脚本
// @namespace    https://getquicker.net/User/Actions/388875-星河城野❤
// @version      1.0.5
// @description  一个简单的日记应用，支持GitHub登录和数据同步
// @author       小张 | 个人博客：https://blog.z-l.top | 公众号"爱吃馍" | 设计导航站 ：https://dh.z-l.top | quicker账号昵称：星河城野❤
// @license      GPL-3.0
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        GM_log
// @grant        GM_getResourceText
// @resource     TAILWIND_CSS https://cdn.bootcdn.net/ajax/libs/tailwindcss/3.4.1/tailwind.min.css
// @resource     FONTAWESOME https://font.onmicrosoft.cn/font6pro@6.7.1/css/all.min.css
// @icon         https://dh.z-l.top/assets/favicon.ico
// @require      https://cdn.jsdelivr.net/npm/jquery@3.6.4/dist/jquery.min.js
// @require      https://cdn.jsdelivr.net/npm/driver.js@latest/dist/driver.js.iife.js
// @resource     DRIVER_CSS https://cdn.jsdelivr.net/npm/driver.js@latest/dist/driver.css
// ==/UserScript==

// 等待jQuery和DOM加载完成后初始化
$(document).ready(function() {
  // 确保只有一个实例
  if (window.diaryAppInstance) {
    return;
  }
  window.diaryAppInstance = new DiaryApp();
  
  // 添加调试信息
  console.log('[日记应用] 脚本已加载，浮动按钮应该在页面右下角显示');
  console.log('[日记应用] 如果看不到按钮，请检查是否有广告拦截器或内容安全策略阻止');
});

/**
 * 带登录同步日记功能的脚本
 * 
 * 功能说明：
 * - 支持GitHub OAuth登录
 * - 本地存储日记数据
 * - 通过GitHub Gist实现数据同步
 * - 简单的日记编辑和显示界面
 * - 新用户引导功能
 */

// 导入Driver.js样式
GM_addStyle(GM_getResourceText('DRIVER_CSS'));

// 添加TailwindCSS基础样式
GM_addStyle(`
  @import url('https://font.onmicrosoft.cn/font6pro@6.7.1/css/all.min.css');
  
  .diary-container {
    position: fixed;
    top: 50px;
    right: 20px;
    width: 400px;
    max-height: 80vh;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    overflow: hidden;
  }
  
  .diary-header {
    background: #2563eb;
    color: white;
    padding: 16px;
    font-weight: 600;
    font-size: 18px;
  }
  
  .diary-content {
    padding: 16px;
    overflow-y: auto;
    max-height: calc(80vh - 120px);
  }
  
  .diary-entry {
    border-bottom: 1px solid #e5e7eb;
    padding: 12px 0;
  }
  
  .diary-entry:last-child {
    border-bottom: none;
  }
  
  .diary-date {
    color: #6b7280;
    font-size: 14px;
    margin-bottom: 4px;
  }
  
  .diary-text {
    font-size: 16px;
  }
`);

// 存储键名常量定义
const STORAGE_KEYS = {
  AUTH_TOKEN: 'diary_app_auth_token',
  USER_INFO: 'diary_app_user_info',
  DIARY_DATA: 'diary_app_diary_data',
  GIST_ID: 'diary_app_gist_id',
  LAST_SYNC: 'diary_app_last_sync',
  HAS_SEEN_GUIDE: 'diary_app_has_seen_guide',
  HAS_OPENED_BEFORE: 'diary_app_has_opened_before'
};

// 主应用类
class DiaryApp {
  constructor() {
    try {
      this.appContainer = null;
      this.isAppOpen = false;
      this.init();
    } catch (e) {
      console.error('应用构造函数错误:', e);
      this.showNotification('日记应用初始化失败: ' + e.message, 8000);
    }
  }
  
  init() {
    try {
      // 注入Tailwind CSS
      try {
        // 注入Tailwind CSS
        if (typeof GM_getResourceText !== 'undefined') {
          GM_addStyle(GM_getResourceText('TAILWIND_CSS'));
          // 注入Font Awesome
          GM_addStyle(GM_getResourceText('FONTAWESOME'));
          this.log('样式资源加载成功');
        } else {
          throw new Error('GM_getResourceText 未定义');
        }
      } catch (e) {
        this.log('样式资源加载失败:', e);
        this.showNotification('样式加载失败，应用可能无法正常显示', 5000, true);
        // 注入基础回退样式
        GM_addStyle(`
          .diary-container { position: fixed; top: 50px; right: 20px; width: 400px; max-height: 80vh; background: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15); z-index: 9999; overflow: hidden; }
          .diary-header { background: #2563eb; color: white; padding: 16px; font-weight: 600; font-size: 18px; }
          .diary-content { padding: 16px; overflow-y: auto; max-height: calc(80vh - 120px); }
          .diary-entry { border-bottom: 1px solid #e5e7eb; padding: 12px 0; }
          button { background: #4f46e5; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
          textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
          #diary-floating-button { position: fixed; bottom: 24px; right: 24px; background-color: #ff0000; color: white; width: 60px; height: 60px; border-radius: 50%; box-shadow: 0 4px 12px rgba(255, 0, 0, 0.8); z-index: 99999; display: flex; align-items: center; justify-content: center; border: 2px solid white; cursor: pointer; }
        `);
      }
      
      this.log('开始初始化日记应用');
      // 显示脚本加载通知
      this.log('注册菜单命令完成');
      this.showNotification('日记应用已加载，按Ctrl+Shift+D打开，或点击Tampermonkey菜单中的"打开日记应用"');
      
      // 注册快捷键 Ctrl+Shift+D 显示/隐藏应用
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
          e.preventDefault();
          this.toggleApp();
        }
      });
      
      // 注册Tampermonkey菜单命令作为备用入口
      if (typeof GM_registerMenuCommand !== 'undefined') {
        GM_registerMenuCommand('打开日记应用', () => this.toggleApp());
        GM_registerMenuCommand('GitHub登录', () => this.login());
        GM_registerMenuCommand('退出登录', () => this.logout());
        GM_registerMenuCommand('手动同步', () => this.syncData());
      }
  
      // 创建浮动按钮 - 延迟执行确保DOM准备就绪
      setTimeout(() => {
        this.createFloatingButton();
      }, 500);
      
      // 首次使用时自动显示应用
      const hasOpenedBefore = GM_getValue(STORAGE_KEYS.HAS_OPENED_BEFORE, false);
      if (!hasOpenedBefore) {
        setTimeout(() => this.toggleApp(), 1500); // 延迟1.5秒显示，确保页面加载完成
        GM_setValue(STORAGE_KEYS.HAS_OPENED_BEFORE, true);
      }
  
      // 检查登录状态
      this.checkLoginStatus();
  
      // 初始化数据
      this.initData();
    } catch (e) {
      this.log('初始化失败:', e);
      this.showNotification('应用初始化失败: ' + e.message, 8000, true);
    }
  }
  
  // 创建浮动按钮
  createFloatingButton() {
    // 避免重复创建按钮
    if (document.getElementById('diary-floating-button')) return;
    
    // 创建按钮元素
    const button = document.createElement('button');
    button.id = 'diary-floating-button';
    button.innerHTML = '<i class="fas fa-book-open text-xl"></i>';
    button.title = '打开日记应用';
    
    // 设置按钮样式
    const buttonStyles = {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      backgroundColor: '#ff0000',
      color: 'white',
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      boxShadow: '0 4px 12px rgba(255, 0, 0, 0.8)',
      zIndex: '99999',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid white',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    };
    
    // 应用样式
    Object.assign(button.style, buttonStyles);
    
    // 添加悬停效果
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
    });
    
    // 确保按钮点击事件正确绑定
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleApp();
    });
    
    // 尝试多种方式添加按钮到页面
    const appendButton = () => {
      if (document.body) {
        document.body.appendChild(button);
        this.log('浮动按钮创建成功');
        return true;
      }
      return false;
    };
    
    // 首先尝试直接添加
    if (!appendButton()) {
      // 如果直接添加失败，等待DOM准备好
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', appendButton);
      } else {
        // 使用轮询方式确保按钮被添加
        const interval = setInterval(() => {
          if (appendButton()) {
            clearInterval(interval);
          }
        }, 100);
        
        // 设置超时防止无限循环
        setTimeout(() => {
          clearInterval(interval);
        }, 5000);
      }
    }
  }
  
  // 初始化数据
  initData() {
    const diaryData = GM_getValue(STORAGE_KEYS.DIARY_DATA, []);
    if (!Array.isArray(diaryData)) {
      GM_setValue(STORAGE_KEYS.DIARY_DATA, []);
    }
    
    // 如果已登录，执行一次同步确保数据是最新的
    if (this.checkLoginStatus()) {
      setTimeout(() => {
        this.syncData();
      }, 2000); // 延迟2秒执行同步，确保应用初始化完成
    }
  }
  
  // 检查登录状态
  checkLoginStatus() {
    const token = GM_getValue(STORAGE_KEYS.AUTH_TOKEN, null);
    const userInfo = GM_getValue(STORAGE_KEYS.USER_INFO, null);
    
    return token && userInfo;
  }
  
  // 切换应用显示/隐藏
  toggleApp() {
    try {
      this.log('调用toggleApp方法');
      const container = document.getElementById('diary-app-container');
      this.log('当前容器状态:', container ? '已存在' : '不存在');
      if (container) {
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      } else {
        this.renderApp();
        // 首次打开应用，显示引导
        const hasSeenGuide = GM_getValue(STORAGE_KEYS.HAS_SEEN_GUIDE, false);
        if (!hasSeenGuide) {
          setTimeout(() => {
            try {
              this.initGuide();
            } catch (e) {
              this.log('引导初始化失败: ' + e.message, 'error');
            }
          }, 500);
          GM_setValue(STORAGE_KEYS.HAS_SEEN_GUIDE, true);
        }
      }
    } catch (e) {
      this.log('toggleApp执行出错: ' + e.message, 'error');
    }
  }
  
  // 初始化引导功能
  initGuide() {
    try {
      // 首先确保Driver.js已加载
      if (window.Driver) {
        // 添加Driver.js的CSS样式
        GM_addStyle(`
          @import url("https://cdn.jsdelivr.net/npm/driver.js@latest/dist/driver.css");
          /* 自定义Driver.js样式 */
          .driver-popover-title {
            font-size: 16px !important;
            font-weight: 600 !important;
            color: #1a202c !important;
          }
          .driver-popover-description {
            font-size: 14px !important;
            color: #4a5568 !important;
            line-height: 1.5 !important;
          }
          .driver-popover-footer {
            text-align: right !important;
          }
          .driver-next-btn, .driver-prev-btn {
            font-size: 14px !important;
            padding: 6px 16px !important;
            border-radius: 0.375rem !important;
            margin-left: 0.5rem !important;
          }
          .driver-next-btn {
            background-color: #4f46e5 !important;
            border-color: #4f46e5 !important;
          }
          .driver-next-btn:hover {
            background-color: #4338ca !important;
            border-color: #4338ca !important;
          }
        `);
        
        // 创建Driver实例
        const driver = new window.Driver({
          allowClose: false,
          doneBtnText: '完成',
          nextBtnText: '下一步',
          prevBtnText: '上一步',
          showButtons: true,
          stageBackground: 'rgba(0, 0, 0, 0.4)',
          steps: [
            {
              element: '#login-status',
              popover: {
                title: '登录同步',
                description: '通过GitHub账号登录后，可以将你的日记同步到云端，在不同设备间访问。',
                side: 'bottom',
                align: 'start'
              }
            },
            {
              element: '#diary-text',
              popover: {
                title: '记录日记',
                description: '在这个文本框中输入你的日记内容，点击保存按钮即可保存。',
                side: 'top',
                align: 'start'
              }
            },
            {
              element: '#save-diary',
              popover: {
                title: '保存日记',
                description: '点击保存按钮，你的日记将会被保存。如果你已经登录，还会自动同步到云端。',
                side: 'top',
                align: 'end'
              }
            },
            {
              element: '#diary-list',
              popover: {
                title: '日记列表',
                description: '所有保存的日记都会在这里显示，你可以编辑或删除它们。',
                side: 'top',
                align: 'start'
              }
            }
          ]
        });
        
        // 启动引导
        driver.start();
        
        // 引导完成后的回调
        driver.on('driver:complete', () => {
          // 可以在这里添加引导完成后的逻辑
          this.log('引导完成');
        });
      } else {
        this.log('Driver.js 未加载，跳过引导');
      }
    } catch (e) {
      this.log('引导功能初始化失败: ' + e.message, 'error');
      // 即使引导失败，也不影响主要功能
    }
  }
  
  // 渲染应用界面
  renderApp() {
    // 创建应用容器
    const container = document.createElement('div');
    container.id = 'diary-app-container';
    container.className = 'diary-container';
    
    // 创建标题栏
    const header = document.createElement('div');
    header.className = 'diary-header flex justify-between items-center';
    header.innerHTML = `
      <div class="flex items-center gap-2">
        <i class="fas fa-book-open"></i>
        <span>我的日记</span>
      </div>
      <div class="flex items-center gap-3">
        <div id="sync-status" class="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">已同步</div>
        <button id="close-app" class="hover:bg-white hover:bg-opacity-10 p-1 rounded" title="关闭">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    // 创建登录状态区域
    const loginStatus = document.createElement('div');
    loginStatus.id = 'login-status';
    loginStatus.className = 'px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm flex justify-between items-center';
    
    // 创建内容区域
    const content = document.createElement('div');
    content.className = 'diary-content';
    
    // 创建添加日记的表单
    const addForm = document.createElement('div');
    addForm.className = 'mb-4 p-3 bg-gray-50 rounded-md border border-gray-200';
    addForm.innerHTML = `
      <textarea id="diary-text" placeholder="写下今天的心情..." class="w-full p-2 border border-gray-300 rounded-md resize-none h-24 focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
      <div class="flex justify-end mt-2">
        <button id="save-diary" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-all">
          保存日记
        </button>
      </div>
    `;
    
    // 日记列表容器
    const diaryList = document.createElement('div');
    diaryList.id = 'diary-list';
    diaryList.className = 'diary-entries';
    
    // 组装内容区域
    content.appendChild(addForm);
    content.appendChild(diaryList);
    
    // 组装容器
    container.appendChild(header);
    container.appendChild(loginStatus);
    container.appendChild(content);
    
    // 添加到页面
    document.body.appendChild(container);
    
    // 更新登录状态显示 - 延迟执行确保元素已渲染
    setTimeout(() => {
      this.updateLoginStatusDisplay();
    }, 100);
    
    // 加载并显示日记
    setTimeout(() => {
      this.loadAndDisplayDiaries();
    }, 150);
    
    // 绑定事件 - 延迟执行确保元素已渲染
    setTimeout(() => {
      this.bindEvents();
    }, 200);
  }
  
  // 更新登录状态显示
  updateLoginStatusDisplay() {
    const loginStatus = document.getElementById('login-status');
    if (!loginStatus) return;
    
    const isLoggedIn = this.checkLoginStatus();
    const userInfo = GM_getValue(STORAGE_KEYS.USER_INFO);
    
    if (isLoggedIn && userInfo) {
      loginStatus.innerHTML = `
        <div class="flex items-center gap-2">
          <i class="fas fa-user-circle text-green-500"></i>
          <span>已登录: ${userInfo.login}</span>
        </div>
        <div class="flex gap-2">
          <button id="user-info" class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200" title="查看用户信息">
            <i class="fas fa-info-circle mr-1"></i>信息
          </button>
          <button id="sync-data" class="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200">
            <i class="fas fa-sync-alt mr-1"></i>同步
          </button>
          <button id="logout" class="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200">
            <i class="fas fa-sign-out-alt mr-1"></i>退出
          </button>
        </div>
      `;
    } else {
      loginStatus.innerHTML = `
        <div class="flex items-center gap-2">
          <i class="fas fa-user-circle text-gray-400"></i>
          <span>未登录</span>
        </div>
        <button id="login" class="text-xs px-3 py-1 bg-indigo-600 text-white rounded-full hover:bg-indigo-700">
          <i class="fab fa-github mr-1"></i>GitHub登录
        </button>
      `;
    }
    
    // 确保事件绑定正确执行
    setTimeout(() => {
      this.bindLoginStatusEvents();
    }, 150);
  }
  
  // 加载并显示日记
  loadAndDisplayDiaries() {
    const diaryList = document.getElementById('diary-list');
    if (!diaryList) return;
    
    const entries = this.getAllEntries();
    
    if (entries.length === 0) {
      diaryList.innerHTML = `
        <div class="text-center py-6 text-gray-500">
          <i class="fas fa-book-open text-3xl mb-2"></i>
          <p>还没有日记</p>
          <p class="text-xs mt-1">写下你的第一篇日记吧</p>
        </div>
      `;
      return;
    }
    
    // 清空列表
    diaryList.innerHTML = '';
    
    // 添加日记条目
    entries.forEach(entry => {
      const entryElement = this.createDiaryEntryElement(entry);
      diaryList.appendChild(entryElement);
    });
  }
  
  // 创建日记条目元素
  createDiaryEntryElement(entry) {
    const entryElement = document.createElement('div');
    entryElement.className = 'diary-entry';
    
    const date = new Date(entry.date).toLocaleString();
    
    entryElement.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <span class="diary-date text-sm text-gray-500">${date}</span>
        <div class="flex gap-1">
          <button class="edit-diary text-gray-400 hover:text-indigo-600" data-id="${entry.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="delete-diary text-gray-400 hover:text-red-600" data-id="${entry.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <p class="diary-text whitespace-pre-wrap">${entry.text}</p>
    `;
    
    return entryElement;
  }
  
  // 绑定事件
  bindEvents() {
    // 使用事件委托来确保事件正确绑定
    const container = document.getElementById('diary-app-container');
    if (!container) return;
    
    // 为容器内的元素绑定事件
    container.addEventListener('click', (e) => {
      // 防止事件冒泡
      e.stopPropagation();
      
      // 关闭按钮
      if (e.target.closest('#close-app')) {
        this.toggleApp();
        return;
      }
      
      // 保存按钮
      if (e.target.closest('#save-diary')) {
        const diaryText = document.getElementById('diary-text');
        const text = diaryText ? diaryText.value.trim() : '';
        if (text) {
          this.addEntry(text);
          diaryText.value = '';
          this.loadAndDisplayDiaries();
        }
        return;
      }
      
      // 登录按钮
      if (e.target.closest('#login')) {
        this.login();
        return;
      }
      
      // 退出按钮
      if (e.target.closest('#logout')) {
        this.logout();
        this.toggleApp();
        return;
      }
      
      // 同步按钮
      if (e.target.closest('#sync-data')) {
        this.syncData();
        return;
      }
      
      // 用户信息按钮
      if (e.target.closest('#user-info')) {
        this.showUserInfo();
        return;
      }
      
      // 编辑日记按钮
      const editButton = e.target.closest('.edit-diary');
      if (editButton) {
        const id = editButton.dataset.id;
        this.editDiary(id);
        return;
      }
      
      // 删除日记按钮
      const deleteButton = e.target.closest('.delete-diary');
      if (deleteButton) {
        const id = deleteButton.dataset.id;
        if (confirm('确定要删除这篇日记吗？')) {
          this.deleteEntry(id);
          this.loadAndDisplayDiaries();
        }
        return;
      }
    });
    
    // 单独绑定登录状态区域的事件
    setTimeout(() => {
      this.bindLoginStatusEvents();
    }, 100);
  }

  // 编辑日记
  editDiary(id) {
    const entries = this.getAllEntries();
    const entry = entries.find(e => e.id === id);
    
    if (entry) {
      const diaryText = document.getElementById('diary-text');
      const saveButton = document.getElementById('save-diary');
      
      if (diaryText) {
        diaryText.value = entry.text;
        diaryText.focus();
        
        // 临时修改保存按钮行为
        const originalText = saveButton.textContent;
        saveButton.textContent = '更新日记';
        
        const handleUpdate = () => {
          const text = diaryText.value.trim();
          if (text) {
            this.updateEntry(id, text);
            diaryText.value = '';
            saveButton.textContent = originalText;
            this.loadAndDisplayDiaries();
            
            // 移除临时事件监听器
            saveButton.removeEventListener('click', handleUpdate);
          }
        };
        
        // 移除之前的事件监听器
        const newSaveButton = saveButton.cloneNode(true);
        saveButton.parentNode.replaceChild(newSaveButton, saveButton);
        newSaveButton.textContent = '更新日记';
        
        newSaveButton.addEventListener('click', handleUpdate, { once: true });
      }
    }
  }
  
  // GitHub登录 - 使用个人访问令牌方式
  login() {
    const token = prompt('请输入您的GitHub个人访问令牌\n\n生成令牌步骤：\n1. 访问 https://github.com/settings/tokens\n2. 点击 "Generate new token"\n3. 设置名称，选择权限（需要gist权限）\n4. 复制生成的令牌并粘贴到此处');
    
    if (!token) return;
    
    // 验证令牌并获取用户信息
    this.verifyToken(token);
  }
  
  // 验证令牌
  async verifyToken(token) {
    try {
      const userInfo = await this.fetchUserData(token);
      if (userInfo) {
        // 保存用户信息和令牌
        GM_setValue(STORAGE_KEYS.AUTH_TOKEN, token);
        GM_setValue(STORAGE_KEYS.USER_INFO, userInfo);
        this.log(`登录成功！欢迎您，${userInfo.login}`);
        
        // 检查是否有现有的gist或者创建新的
        this.ensureGistExists();
        
        // 同步数据
        this.syncData();
        
        alert(`登录成功！欢迎您，${userInfo.login}`);
        return true;
      }
      return false;
    } catch (error) {
      this.log('登录失败，请检查令牌是否正确', 'error');
      this.log(error.message, 'error');
      alert('登录失败，请检查令牌是否正确');
      return false;
    }
  }

  // 获取用户数据
  async fetchUserData(token) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: 'https://api.github.com/user',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        onload: function(response) {
          if (response.status === 200) {
            resolve(JSON.parse(response.responseText));
          } else {
            reject(new Error(`获取用户信息失败: ${response.status}`));
          }
        },
        onerror: function(error) {
          reject(new Error('网络错误: ' + error.message));
        }
      });
    });
  }
  
  // 日志记录辅助函数
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    // 确保level是有效的控制台方法
    const validLevels = ['log', 'info', 'warn', 'error', 'debug'];
    const logLevel = validLevels.includes(level) ? level : 'log';
    
    console[logLevel](`[日记应用 ${timestamp}] ${message}`);
  }
  
  // 确保gist存在，用于存储日记数据
  ensureGistExists() {
    const token = GM_getValue(STORAGE_KEYS.AUTH_TOKEN);
    const savedGistId = GM_getValue(STORAGE_KEYS.GIST_ID, null);
    const userLogin = GM_getValue(STORAGE_KEYS.USER_INFO, {}).login;
    
    // 使用固定的Gist名称，确保不同浏览器使用同一个Gist
    const gistName = `diary_app_data_${userLogin || 'default'}`;
    
    if (savedGistId) {
      // 验证保存的gist是否存在
      this.verifyGistExists(savedGistId);
      return;
    }
    
    // 首先尝试查找已存在的gist
    this.findExistingGist(gistName, (existingGistId) => {
      if (existingGistId) {
        // 使用已存在的gist
        GM_setValue(STORAGE_KEYS.GIST_ID, existingGistId);
        this.log('找到已存在的Gist: ' + existingGistId);
        this.syncData();
      } else {
        // 创建新的gist
        GM_xmlhttpRequest({
          method: 'POST',
          url: 'https://api.github.com/gists',
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          data: JSON.stringify({
            description: `日记应用数据存储 - ${gistName}`,
            public: false,
            files: {
              'diary_data.json': {
                content: JSON.stringify({ entries: [], createdAt: new Date().toISOString() })
              }
            }
          }),
          onload: (response) => {
            try {
              const gist = JSON.parse(response.responseText);
              GM_setValue(STORAGE_KEYS.GIST_ID, gist.id);
              this.log('创建Gist成功: ' + gist.id);
              this.syncData();
            } catch (error) {
              this.log('创建Gist失败: ' + error.message, 'error');
            }
          },
          onerror: (error) => {
            this.log('创建Gist失败: ' + error.message, 'error');
          }
        });
      }
    });
  }
  
  // 查找已存在的gist
  findExistingGist(gistName, callback) {
    const token = GM_getValue(STORAGE_KEYS.AUTH_TOKEN);
    
    GM_xmlhttpRequest({
      method: 'GET',
      url: 'https://api.github.com/gists',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      onload: (response) => {
        try {
          const gists = JSON.parse(response.responseText);
          const existingGist = gists.find(gist => gist.description === `日记应用数据存储 - ${gistName}`);
          if (existingGist) {
            callback(existingGist.id);
          } else {
            callback(null);
          }
        } catch (error) {
          this.log('解析Gists失败: ' + error.message, 'error');
          callback(null);
        }
      },
      onerror: (error) => {
        this.log('获取Gists失败: ' + error.message, 'error');
        callback(null);
      }
    });
  }
  
  // 验证gist是否存在
  verifyGistExists(gistId) {
    const token = GM_getValue(STORAGE_KEYS.AUTH_TOKEN);
    
    GM_xmlhttpRequest({
      method: 'GET',
      url: `https://api.github.com/gists/${gistId}`,
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      onload: (response) => {
        if (response.status !== 200) {
          // Gist不存在，清除保存的ID
          GM_setValue(STORAGE_KEYS.GIST_ID, null);
          this.log('Gist不存在，将重新创建');
          // 创建新的Gist
          this.ensureGistExists();
        } else {
          try {
            const gist = JSON.parse(response.responseText);
            // 确保存在diary_data.json文件
            if (!gist.files || !gist.files['diary_data.json']) {
              this.log('Gist中缺少日记数据文件，将重新创建');
              // 更新gist添加缺少的文件
              this.updateGistFile(gistId);
            }
          } catch (error) {
            this.log('解析Gist数据失败: ' + error.message, 'error');
          }
        }
      },
      onerror: () => {
        // 请求失败，清除保存的ID
        this.log('验证Gist失败，将重新创建', 'error');
        GM_setValue(STORAGE_KEYS.GIST_ID, null);
        this.ensureGistExists();
      }
    });
  }
  
  // 更新Gist文件
  updateGistFile(gistId) {
    const token = GM_getValue(STORAGE_KEYS.AUTH_TOKEN);
    const entries = this.getAllEntries();
    
    GM_xmlhttpRequest({
      method: 'PATCH',
      url: `https://api.github.com/gists/${gistId}`,
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        files: {
          'diary_data.json': {
            content: JSON.stringify({ 
              entries: entries,
              lastUpdated: new Date().toISOString()
            }, null, 2)
          }
        }
      }),
      onload: (response) => {
        if (response.status === 200) {
          this.log('Gist文件更新成功');
        } else {
          this.log(`Gist文件更新失败: ${response.status}`, 'error');
        }
      },
      onerror: (error) => {
        this.log('Gist文件更新失败: ' + error.message, 'error');
      }
    });
  }

  // 退出登录
  logout() {
    if (confirm('确定要退出登录吗？')) {
      // 清除用户信息
      GM_setValue(STORAGE_KEYS.AUTH_TOKEN, null);
      GM_setValue(STORAGE_KEYS.USER_INFO, null);
      
      // 可以选择是否清除本地数据
      if (confirm('是否同时清除本地日记数据？')) {
        GM_setValue(STORAGE_KEYS.DIARY_DATA, []);
      }
      
      alert('已退出登录');
      
      // 刷新应用界面
      this.toggleApp();
    }
  }
  
  // 获取所有日记数据
  getAllEntries() {
    return GM_getValue(STORAGE_KEYS.DIARY_DATA, []);
  }
  
  // 添加日记条目
  addEntry(text) {
    const entries = this.getAllEntries();
    const newEntry = {
      id: Date.now().toString(),
      text: text,
      date: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    entries.unshift(newEntry); // 添加到开头
    GM_setValue(STORAGE_KEYS.DIARY_DATA, entries);
    
    // 自动同步
    if (this.checkLoginStatus()) {
      this.syncData();
    }
    
    return newEntry;
  }
  
  // 删除日记条目
  deleteEntry(id) {
    const entries = this.getAllEntries();
    const updatedEntries = entries.filter(entry => entry.id !== id);
    GM_setValue(STORAGE_KEYS.DIARY_DATA, updatedEntries);
    
    // 自动同步
    if (this.checkLoginStatus()) {
      this.syncData();
    }
    
    return updatedEntries;
  }
  
  // 更新日记条目
  updateEntry(id, newText) {
    const entries = this.getAllEntries();
    const index = entries.findIndex(entry => entry.id === id);
    
    if (index !== -1) {
      entries[index].text = newText;
      entries[index].lastModified = new Date().toISOString();
      GM_setValue(STORAGE_KEYS.DIARY_DATA, entries);
      
      // 自动同步
      if (this.checkLoginStatus()) {
        this.syncData();
      }
      
      return entries[index];
    }
    
    return null;
  }
  
  // 同步数据到GitHub Gist
  async syncData() {
    const token = GM_getValue(STORAGE_KEYS.AUTH_TOKEN);
    const gistId = GM_getValue(STORAGE_KEYS.GIST_ID);
    
    if (!token || !gistId) {
      this.log('未登录或没有gist ID，不进行同步');
      return; // 未登录或没有gist ID，不进行同步
    }
    
    // 显示同步状态
    const syncStatus = document.createElement('div');
    syncStatus.className = 'fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg z-50';
    syncStatus.textContent = '正在同步数据...';
    document.body.appendChild(syncStatus);
    
    try {
      // 获取本地日记数据
      const localEntries = this.getAllEntries();
      this.log(`开始同步，本地有${localEntries.length}条日记`);
      
      // 获取远程数据
      const remoteData = await this.fetchRemoteData();
      
      // 合并数据
      let mergedEntries = localEntries;
      
      if (remoteData && remoteData.entries) {
        this.log(`获取到远程${remoteData.entries.length}条日记`);
        // 合并本地和远程数据，保留最新的条目
        mergedEntries = this.mergeData(localEntries, remoteData.entries);
        // 保存合并后的数据
        GM_setValue(STORAGE_KEYS.DIARY_DATA, mergedEntries);
        this.log(`合并后共有${mergedEntries.length}条日记`);
      }
      
      // 上传数据到GitHub
      await this.uploadData(mergedEntries);
      
      // 更新UI显示
      this.loadAndDisplayDiaries();
      
      // 显示同步成功消息
      syncStatus.textContent = '同步成功！';
      setTimeout(() => {
        if (syncStatus.parentNode) {
          syncStatus.parentNode.removeChild(syncStatus);
        }
      }, 2000);
    } catch (error) {
      // 显示同步失败消息
      this.log('同步失败: ' + error.message, 'error');
      syncStatus.textContent = '同步失败，请稍后重试';
      setTimeout(() => {
        if (syncStatus.parentNode) {
          syncStatus.parentNode.removeChild(syncStatus);
        }
      }, 2000);
    }
  }
  
  // 从GitHub Gist获取数据
  fetchRemoteData() {
    return new Promise((resolve, reject) => {
      const token = GM_getValue(STORAGE_KEYS.AUTH_TOKEN);
      const gistId = GM_getValue(STORAGE_KEYS.GIST_ID);
      
      if (!token || !gistId) {
        this.log('无法获取远程数据：缺少认证信息或gist ID');
        reject(new Error('缺少认证信息'));
        return;
      }
      
      GM_xmlhttpRequest({
        method: 'GET',
        url: `https://api.github.com/gists/${gistId}`,
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        onload: (response) => {
          try {
            if (response.status !== 200) {
              reject(new Error(`获取Gist失败: ${response.status}`));
              return;
            }
            
            const gist = JSON.parse(response.responseText);
            // 提取日记内容
            if (gist.files && gist.files['diary_data.json']) {
              const diaryContent = JSON.parse(gist.files['diary_data.json'].content);
              this.log('成功获取远程日记数据');
              resolve(diaryContent);
            } else {
              this.log('Gist中未找到日记数据文件，创建空数据');
              resolve({ entries: [] });
            }
          } catch (error) {
            this.log('解析远程数据失败: ' + error.message, 'error');
            reject(error);
          }
        },
        onerror: (error) => {
          this.log('网络错误: ' + error.message, 'error');
          reject(new Error('网络错误: ' + error.message));
        }
      });
    });
  }
  
  // 上传数据到GitHub Gist
  uploadData(entries) {
    return new Promise((resolve, reject) => {
      const token = GM_getValue(STORAGE_KEYS.AUTH_TOKEN);
      const gistId = GM_getValue(STORAGE_KEYS.GIST_ID);
      
      if (!token || !gistId) {
        this.log('无法上传数据：缺少认证信息或gist ID');
        reject(new Error('缺少认证信息'));
        return;
      }
      
      const dataToUpload = {
        lastSync: new Date().toISOString(),
        entries: entries
      };
      
      GM_xmlhttpRequest({
        method: 'PATCH',
        url: `https://api.github.com/gists/${gistId}`,
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        data: JSON.stringify({
          files: {
            'diary_data.json': {
              content: JSON.stringify(dataToUpload, null, 2)
            }
          }
        }),
        onload: (response) => {
          if (response.status === 200) {
            this.log('成功上传日记数据到Gist');
            GM_setValue(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
            resolve(true);
          } else {
            this.log(`上传数据失败: ${response.status}`, 'error');
            reject(new Error(`上传数据失败: ${response.status}`));
          }
        },
        onerror: (error) => {
          this.log('网络错误: ' + error.message, 'error');
          reject(new Error('网络错误: ' + error.message));
        }
      });
    });
  }
  
  // 手动同步按钮点击处理
  handleManualSync() {
    // 显示同步状态
    const syncStatus = document.createElement('div');
    syncStatus.className = 'fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg z-50';
    syncStatus.textContent = '正在同步数据...';
    document.body.appendChild(syncStatus);
    
    // 执行同步
    this.syncData()
      .then(() => {
        syncStatus.textContent = '同步完成！';
        syncStatus.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
      })
      .catch((error) => {
        syncStatus.textContent = '同步失败！';
        syncStatus.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
        this.log('手动同步失败: ' + error.message, 'error');
      })
      .finally(() => {
        setTimeout(() => {
          if (syncStatus.parentNode) {
            syncStatus.parentNode.removeChild(syncStatus);
          }
        }, 3000);
      });
  }

  // 合并数据，解决冲突
  mergeData(localEntries, remoteEntries) {
    // 使用Map进行高效查找
    const entryMap = new Map();
    
    // 先添加本地条目
    localEntries.forEach(entry => {
      entryMap.set(entry.id, { ...entry, source: 'local' });
    });
    
    // 合并远程条目，如果有冲突，使用最新修改的
    remoteEntries.forEach(remoteEntry => {
      const existingEntry = entryMap.get(remoteEntry.id);
      
      if (!existingEntry) {
        // 远程有而本地没有的条目，添加
        entryMap.set(remoteEntry.id, { ...remoteEntry, source: 'remote' });
      } else {
        // 存在冲突，比较最后修改时间
        const localTime = new Date(existingEntry.lastModified).getTime();
        const remoteTime = new Date(remoteEntry.lastModified).getTime();
        
        if (remoteTime > localTime) {
          // 远程更新，使用远程数据
          entryMap.set(remoteEntry.id, { ...remoteEntry, source: 'remote' });
        }
      }
    });
    
    // 转换回数组并按日期排序（最新的在前）
    return Array.from(entryMap.values()).sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }
  
  // 显示同步通知
  showSyncNotification(message, isError = false) {
    try {
      // 首先移除已存在的通知
      const existingNotifications = document.querySelectorAll('.diary-notification');
      existingNotifications.forEach(notification => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      });
      
      // 创建通知元素
      const notification = document.createElement('div');
      notification.className = `diary-notification fixed top-4 right-4 px-4 py-2 rounded-md z-50 transition-opacity duration-300 ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`;
      notification.style.cssText = `
        opacity: 0;
        transition: opacity 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
      `;
      notification.textContent = message;
      
      if (document.body) {
        document.body.appendChild(notification);
        
        // 渐显效果
        setTimeout(() => {
          notification.style.cssText += 'opacity: 1;';
        }, 100);
        
        // 3秒后自动消失
        setTimeout(() => {
          notification.style.cssText += 'opacity: 0;';
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, 300);
        }, 3000);
      }
    } catch (e) {
      // 如果DOM操作失败，至少在控制台显示消息
      console.log(`[日记应用同步通知] ${message}`);
    }
  }

  // 显示用户通知
  showNotification(message, duration = 5000, isError = false) {
    try {
      // 首先移除已存在的通知
      const existingNotifications = document.querySelectorAll('.diary-user-notification');
      existingNotifications.forEach(notification => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      });
      
      // 创建通知元素
      const notification = document.createElement('div');
      notification.className = `diary-user-notification fixed top-4 right-4 px-4 py-2 rounded-md z-50 transition-all duration-500 ${isError ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white'}`;
      notification.style.cssText = `
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.5s ease;
        max-width: 300px;
        word-wrap: break-word;
      `;
      notification.textContent = message;
      
      // 添加到页面
      if (document.body) {
        document.body.appendChild(notification);
        
        // 渐显和滑入效果
        setTimeout(() => {
          notification.style.cssText += `
            opacity: 1;
            transform: translateX(0);
          `;
        }, 100);
        
        // 自动移除
        setTimeout(() => {
          notification.style.cssText += `
            opacity: 0;
            transform: translateX(100%);
          `;
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, 500);
        }, duration);
      }
    } catch (e) {
      // 如果DOM操作失败，至少在控制台显示消息
      console.log(`[日记应用通知] ${message}`);
    }
  }
  
  // 显示用户信息
  showUserInfo() {
    try {
      const userInfo = GM_getValue(STORAGE_KEYS.USER_INFO);
      const token = GM_getValue(STORAGE_KEYS.AUTH_TOKEN);
      
      if (!userInfo) {
        alert('未找到用户信息，请重新登录');
        return;
      }
      
      // 创建信息显示模态框
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 w-96 max-w-90vw">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">用户信息</h3>
            <button id="close-user-info" class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="space-y-3">
            <div>
              <label class="text-sm font-medium text-gray-500">用户名</label>
              <div class="mt-1 p-2 bg-gray-50 rounded">${userInfo.login || 'N/A'}</div>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500">用户ID</label>
              <div class="mt-1 p-2 bg-gray-50 rounded">${userInfo.id || 'N/A'}</div>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500">昵称</label>
              <div class="mt-1 p-2 bg-gray-50 rounded">${userInfo.name || 'N/A'}</div>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500">邮箱</label>
              <div class="mt-1 p-2 bg-gray-50 rounded break-words">${userInfo.email || 'N/A'}</div>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500">Token</label>
              <div class="mt-1 p-2 bg-gray-50 rounded break-words text-sm" id="token-display">
                ${token ? `************<button class="ml-2 text-blue-500 underline" id="show-full-token">显示完整Token</button>` : 'N/A'}
              </div>
              <p class="text-xs text-gray-500 mt-1">出于安全考虑，默认隐藏完整Token</p>
            </div>
          </div>
          <div class="mt-6 flex justify-end">
            <button id="close-user-info-btn" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
              关闭
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // 绑定关闭事件
      const closeButtons = modal.querySelectorAll('#close-user-info, #close-user-info-btn');
      closeButtons.forEach(button => {
        button.addEventListener('click', () => {
          if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
          }
        });
      });
      
      // 绑定显示完整Token事件
      const showFullTokenButton = modal.querySelector('#show-full-token');
      if (showFullTokenButton && token) {
        showFullTokenButton.addEventListener('click', (e) => {
          e.preventDefault();
          const tokenDisplay = modal.querySelector('#token-display');
          if (tokenDisplay) {
            tokenDisplay.innerHTML = `
              <div class="break-words">${token}</div>
              <div class="mt-2">
                <button class="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200" id="copy-token">复制Token</button>
                <button class="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 ml-2" id="hide-token">隐藏Token</button>
              </div>
            `;
            
            // 绑定复制Token事件
            const copyTokenButton = tokenDisplay.querySelector('#copy-token');
            if (copyTokenButton) {
              copyTokenButton.addEventListener('click', () => {
                navigator.clipboard.writeText(token).then(() => {
                  alert('Token已复制到剪贴板');
                }).catch(() => {
                  // 备用复制方法
                  const textArea = document.createElement('textarea');
                  textArea.value = token;
                  document.body.appendChild(textArea);
                  textArea.select();
                  document.execCommand('copy');
                  document.body.removeChild(textArea);
                  alert('Token已复制到剪贴板');
                });
              });
            }
            
            // 绑定隐藏Token事件
            const hideTokenButton = tokenDisplay.querySelector('#hide-token');
            if (hideTokenButton) {
              hideTokenButton.addEventListener('click', () => {
                tokenDisplay.innerHTML = `
                  ************<button class="ml-2 text-blue-500 underline" id="show-full-token">显示完整Token</button>
                `;
                // 重新绑定显示完整Token事件
                const newShowFullTokenButton = tokenDisplay.querySelector('#show-full-token');
                if (newShowFullTokenButton) {
                  newShowFullTokenButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    // 重新触发显示完整Token
                    this.showUserInfo();
                  });
                }
              });
            }
          }
        });
      }
      
      // 点击模态框外部关闭
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
          }
        }
      });
    } catch (e) {
      this.log('显示用户信息失败: ' + e.message, 'error');
      alert('获取用户信息失败，请查看控制台了解详情');
    }
  }
  
  // 绑定登录状态区域的事件
  bindLoginStatusEvents() {
    try {
      // 登录按钮
      const loginButton = document.getElementById('login');
      if (loginButton) {
        // 移除已存在的事件监听器
        const newLoginButton = loginButton.cloneNode(true);
        loginButton.parentNode.replaceChild(newLoginButton, loginButton);
        newLoginButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.login();
        });
      }
      
      // 退出按钮
      const logoutButton = document.getElementById('logout');
      if (logoutButton) {
        // 移除已存在的事件监听器
        const newLogoutButton = logoutButton.cloneNode(true);
        logoutButton.parentNode.replaceChild(newLogoutButton, logoutButton);
        newLogoutButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.logout();
          this.toggleApp();
        });
      }
      
      // 同步按钮
      const syncButton = document.getElementById('sync-data');
      if (syncButton) {
        // 移除已存在的事件监听器
        const newSyncButton = syncButton.cloneNode(true);
        syncButton.parentNode.replaceChild(newSyncButton, syncButton);
        newSyncButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handleManualSync(); // 使用新的手动同步方法
        });
      }
      
      // 用户信息按钮
      const userInfoButton = document.getElementById('user-info');
      if (userInfoButton) {
        // 移除已存在的事件监听器
        const newUserInfoButton = userInfoButton.cloneNode(true);
        userInfoButton.parentNode.replaceChild(newUserInfoButton, userInfoButton);
        newUserInfoButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.showUserInfo();
        });
      }
    } catch (e) {
      this.log('绑定登录状态事件失败: ' + e.message, 'error');
    }
  }

}

// 启动应用
// 确保DOM加载完成后初始化应用
(function() {
  'use strict';
  
  function initApp() {
    if (!window.diaryAppInstance) {
      window.diaryAppInstance = new DiaryApp();
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    // DOM已经加载完成
    initApp();
  }
})();
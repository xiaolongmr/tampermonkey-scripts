# 微信公众号登录系统 - 部署与集成指南

本文档详细说明如何将微信公众号登录系统部署到Vercel平台，以及如何将其集成到其他项目中。

## 快速链接
- [部署指南](#前提条件)
- [集成方法](#集成到其他项目)
- [API文档](#核心api接口)
- [集成示例](#完整示例代码)

## 前提条件

- GitHub账号
- Vercel账号
- 微信公众号账号

## 步骤1：准备GitHub仓库

1. **创建新的GitHub仓库**
   - 登录GitHub，创建一个新的私有或公开仓库
   - 命名建议：`wechat-login-service`

2. **将项目代码推送到GitHub**

```bash
# 初始化git仓库（如果尚未初始化）
git init

# 添加远程仓库
git remote add origin https://github.com/your-username/wechat-login-service.git

# 添加所有文件
git add .

# 提交更改
git commit -m "初始化微信登录服务"

# 推送代码
git push -u origin main
```

3. **创建版本标签**

```bash
# 创建版本标签
git tag v1.0.0

# 推送标签到远程仓库
git push origin v1.0.0
```

## 步骤2：配置Vercel项目

1. **登录Vercel**
   - 访问 [Vercel官网](https://vercel.com/) 并使用GitHub账号登录

2. **导入项目**
   - 点击"New Project"
   - 选择你的GitHub仓库 `wechat-login-service`
   - 点击"Import"

3. **配置项目**
   - 项目名称：`wechat-login-service`（可自定义）
   - 框架预设：Next.js（自动检测）
   - 根目录：保持默认

4. **配置环境变量**
   - 在"Environment Variables"部分添加以下变量：

   | 环境变量名 | 值 | 说明 |
   |----------|-----|------| 
   | WX_TOKEN | wxlogin2024 | 微信服务器配置中的Token |
   | WX_APPID | wx512489772fc8b284 | 微信公众号AppID |
   | WX_APPSECRET | 33f1ac94ad81684185f65809a76c8a07 | 微信公众号AppSecret |
   | WX_ENCODING_AES_KEY | Z2sQx3YeRCpm9rSkPGf2XEKZw2SDGwkTiFjqHEtcZ8F | 消息加密密钥 |
   | JWT_SECRET | your_jwt_secret_key | JWT签名密钥（使用强密钥） |
   | JWT_EXPIRES_IN | 30d | JWT令牌过期时间 |
   | NEXT_PUBLIC_APP_VERSION | v1.0.0 | 应用版本号 |
   | NEXT_PUBLIC_BASE_URL | https://wx.z-l.top | 部署域名 |

5. **部署项目**
   - 点击"Deploy"开始部署
   - 等待部署完成

## 步骤3：创建和配置Vercel KV

1. **创建KV实例**
   - 在Vercel项目页面，点击"Storage"标签
   - 点击"Connect Database"
   - 选择"KV"并点击"Create"
   - 为KV实例命名，例如：`wechat-login-kv`
   - 点击"Create"创建KV实例

2. **连接KV到项目**
   - 选择刚创建的KV实例
   - 点击"Connect to Project"
   - 选择你的`wechat-login-service`项目
   - 点击"Connect"

3. **确认环境变量**
   - 连接后，Vercel会自动在你的项目中添加以下环境变量：
     - `KV_URL`
     - `KV_REST_API_URL`
     - `KV_REST_API_TOKEN`
     - `KV_REST_API_READ_ONLY_TOKEN`
   - 这些变量已自动配置，无需手动添加

4. **重新部署项目**
   - 点击"Redeploy"按钮重新部署项目，使KV配置生效

## 步骤4：配置微信公众号

1. **登录微信公众平台**
   - 访问 [微信公众平台](https://mp.weixin.qq.com/)
   - 使用公众号账号登录

2. **配置服务器**
   - 进入"设置与开发" → "基本配置"
   - 点击"服务器配置"下的"修改配置"

3. **填写服务器信息**
   - URL：`https://wx.z-l.top/api/wechat/event`（替换为你的Vercel应用URL）
   - Token：与环境变量中的`WECHAT_TOKEN`一致
   - 消息加解密方式：选择"明文模式"
   - 点击"提交"

4. **启用服务器配置**
   - 配置保存成功后，点击"启用"按钮
   - 此时微信会发送验证请求到你的服务器，确保服务正常运行

## 步骤5：测试登录流程

1. **访问登录页面**
   - 打开浏览器，访问`https://wx.z-l.top/login`

2. **测试微信验证**
   - 扫描页面上的二维码关注公众号
   - 发送"验证码"消息到公众号
   - 公众号应回复6位数字验证码
   - 在网页上输入验证码，验证登录是否成功

3. **测试回调功能**
   - 访问`https://wx.z-l.top/login?callbackUrl=https://example.com`
   - 完成登录后，应跳转到`https://example.com`

## 常见问题排查

### 1. 微信验证失败
- 检查Token是否与微信公众号配置一致
- 确认服务器URL是否正确（必须使用HTTPS）
- 检查服务器是否正常响应GET请求

### 2. 验证码不生效
- 检查Vercel KV是否正常工作
- 查看Vercel日志，检查是否有错误信息
- 确认验证码生成和存储逻辑是否正常

### 3. 部署失败
- 检查package.json中的依赖是否正确
- 查看构建日志，解决代码语法或依赖问题
- 确认所有必要的环境变量都已配置

## 域名配置（可选）

如果你有Cloudflare托管的域名，可以配置自定义域名：

1. 在Vercel项目页面，点击"Settings" → "Domains"
2. 添加你的自定义域名（例如：login.yourdomain.com）
3. 按照Vercel提供的DNS配置指南，在Cloudflare中添加DNS记录
4. 等待DNS生效后，更新微信公众号的服务器URL为你的自定义域名

## 后续维护

- 定期更新依赖包
- 监控Vercel日志和性能
- 及时更新版本标签并修改`NEXT_PUBLIC_VERSION`环境变量

## 集成到其他项目

将这个微信登录系统集成到其他项目中，我们**强烈推荐使用API集成方式**，因为它提供了最大的灵活性和定制性，可以让你完全控制登录流程和用户界面。以下是详细的API集成指南：

### API集成方式（推荐）

API集成允许你在自己的项目中完全控制UI和登录体验，同时利用微信登录服务提供的验证功能。

#### 1. 核心API接口

微信登录服务提供以下关键API接口：

| 接口 | 方法 | 描述 | 请求体 | 成功响应 |
|------|------|------|--------|----------|
| `/api/auth/verify` | POST | 验证验证码并获取JWT令牌 | `{ "code": "验证码" }` | `{ "success": true, "token": "JWT令牌", "user": { "openid": "用户openid", "...": "其他信息" } }` |
| `/api/auth/validate` | GET | 验证JWT令牌是否有效 | 无（Authorization头: Bearer {token}） | `{ "valid": true, "user": { "openid": "用户openid" } }` |

#### 2. 登录流程实现

以下是在你的项目中实现微信登录的完整步骤：

##### 2.1 显示登录界面

首先，在你的项目中创建一个自定义的微信登录界面：

```html
<!-- 微信登录组件 -->
<div id="wechat-login">
  <div class="login-container">
    <h2>微信公众号登录</h2>
    <div class="qrcode-section">
      <p>请关注公众号并发送"验证码"获取登录码</p>
      <!-- 这里可以放置你的公众号二维码图片 -->
      <img src="/path-to-your-wechat-qrcode.png" alt="公众号二维码" class="qrcode" />
    </div>
    
    <div class="verification-section">
      <input type="text" id="verification-code" placeholder="请输入6位验证码" maxlength="6" />
      <button id="verify-button">验证登录</button>
    </div>
    
    <div id="message" class="message"></div>
  </div>
</div>

<style>
.login-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.qrcode {
  max-width: 200px;
  margin: 15px auto;
  display: block;
}

input {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #07c160;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #06b355;
}

.message {
  margin-top: 15px;
  padding: 10px;
  text-align: center;
  border-radius: 4px;
}

.success {
  background-color: #f0f9ff;
  color: #007bff;
}

.error {
  background-color: #fff0f0;
  color: #ff4d4f;
}
</style>
```

##### 2.2 实现验证码验证逻辑

添加JavaScript代码来处理验证码验证和登录流程：

```javascript
// 微信登录服务域名（部署后的Vercel地址或自定义域名）
const WECHAT_LOGIN_DOMAIN = 'https://wx.z-l.top'; // 用户实际部署地址

// 验证按钮点击事件
document.getElementById('verify-button').addEventListener('click', async function() {
  const code = document.getElementById('verification-code').value.trim();
  const messageElement = document.getElementById('message');
  
  // 基本验证
  if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
    messageElement.textContent = '请输入有效的6位数字验证码';
    messageElement.className = 'message error';
    return;
  }
  
  try {
    // 显示加载状态
    this.disabled = true;
    this.textContent = '验证中...';
    messageElement.textContent = '';
    
    // 调用验证API
    const response = await fetch(`${WECHAT_LOGIN_DOMAIN}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      // 登录成功
      messageElement.textContent = '登录成功，正在跳转...';
      messageElement.className = 'message success';
      
      // 存储token和用户信息
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_info', JSON.stringify(data.user));
      
      // 跳转到首页或刷新页面
      setTimeout(() => {
        location.reload();
      }, 1500);
    } else {
      // 登录失败
      messageElement.textContent = data.message || '验证码错误或已过期';
      messageElement.className = 'message error';
    }
  } catch (error) {
    console.error('验证请求失败:', error);
    messageElement.textContent = '网络错误，请稍后再试';
    messageElement.className = 'message error';
  } finally {
    // 恢复按钮状态
    this.disabled = false;
    this.textContent = '验证登录';
  }
});

// 处理键盘输入
 document.getElementById('verification-code').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    document.getElementById('verify-button').click();
  }
});
```

##### 2.3 实现用户认证状态管理

创建一个认证管理器，用于检查和维护用户的登录状态：

```javascript
// authManager.js - 用户认证管理器
const WECHAT_LOGIN_DOMAIN = 'https://wx.z-l.top'; // 用户实际部署地址

class AuthManager {
  constructor() {
    this.token = localStorage.getItem('auth_token');
    this.userInfo = this._getUserInfo();
  }
  
  // 获取存储的用户信息
  _getUserInfo() {
    try {
      const info = localStorage.getItem('user_info');
      return info ? JSON.parse(info) : null;
    } catch (e) {
      console.error('解析用户信息失败:', e);
      return null;
    }
  }
  
  // 检查是否已登录
  isLoggedIn() {
    return !!this.token && !!this.userInfo;
  }
  
  // 获取用户信息
  getUserInfo() {
    return this.userInfo;
  }
  
  // 验证token是否有效
  async validateToken() {
    if (!this.token) return false;
    
    try {
      const response = await fetch(`${WECHAT_LOGIN_DOMAIN}/api/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.valid;
      }
      return false;
    } catch (error) {
      console.error('验证token失败:', error);
      return false;
    }
  }
  
  // 登出
  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    this.token = null;
    this.userInfo = null;
  }
  
  // 确保用户已登录，如果未登录则跳转到登录页
  async ensureAuthenticated(loginPageUrl = '/login') {
    if (!this.isLoggedIn()) {
      window.location.href = loginPageUrl;
      return false;
    }
    
    // 可选：验证token是否有效
    const isValid = await this.validateToken();
    if (!isValid) {
      this.logout();
      window.location.href = loginPageUrl;
      return false;
    }
    
    return true;
  }
}

// 导出单例实例
export const authManager = new AuthManager();
```

#### 3. 在需要登录的页面中使用

在需要用户登录的页面中使用认证管理器：

```javascript
// 导入认证管理器
import { authManager } from './authManager.js';

// 页面加载时检查登录状态
async function initPage() {
  // 确保用户已登录，否则重定向到登录页
  const isAuthenticated = await authManager.ensureAuthenticated('/wechat-login.html');
  
  if (isAuthenticated) {
    // 用户已登录，可以获取用户信息并加载页面内容
    const userInfo = authManager.getUserInfo();
    console.log('当前登录用户:', userInfo);
    
    // 显示用户信息
    displayUserInfo(userInfo);
    
    // 加载受保护的内容
    loadProtectedContent();
  }
}

function displayUserInfo(userInfo) {
  // 更新UI显示用户信息
  const userInfoElement = document.getElementById('user-info');
  if (userInfoElement) {
    userInfoElement.textContent = `欢迎您，用户 ${userInfo.openid.substring(0, 8)}...`;
  }
}

// 登出按钮事件
document.getElementById('logout-button')?.addEventListener('click', function() {
  authManager.logout();
  window.location.href = '/';
});

// 初始化页面
initPage();
```

### 其他集成方式（仅作参考）

#### 方法一：OAuth风格重定向（简单集成）

如果您希望快速集成且不需要完全控制UI，可以使用OAuth风格的重定向方式：

```html
<!-- 登录按钮 -->
<button id="wechat-login-btn">微信公众号登录</button>

<script>
  // 微信登录服务地址
  const WECHAT_LOGIN_URL = 'https://wx.z-l.top'; // 用户实际部署地址
  
  // 登录按钮点击事件
  document.getElementById('wechat-login-btn').addEventListener('click', function() {
    // 生成当前页面的回调URL
    const callbackUrl = encodeURIComponent(window.location.href);
    
    // 重定向到微信登录服务
    window.location.href = `${WECHAT_LOGIN_URL}?redirect_uri=${callbackUrl}`;
  });
  
  // 处理从登录服务返回的登录信息
  function handleLoginCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userInfoStr = urlParams.get('user');
    
    if (token && userInfoStr) {
      try {
        // 解析并存储用户信息
        const userInfo = JSON.parse(decodeURIComponent(userInfoStr));
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_info', JSON.stringify(userInfo));
        
        // 清理URL参数
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        // 更新UI显示登录状态
        updateLoginStatus(true, userInfo);
      } catch (e) {
        console.error('处理登录信息失败:', e);
      }
    }
  }
  
  // 页面加载时检查是否有登录回调参数
  window.addEventListener('load', handleLoginCallback);
</script>
```

### 安全考虑

1. **跨域资源共享(CORS)**：确保您的微信登录服务配置了正确的CORS头，允许您的其他项目访问API。

2. **API密钥保护**：如果需要增加额外的API安全性，可以在请求中添加API密钥验证。

3. **Token存储**：在客户端使用localStorage存储JWT令牌，服务端使用HTTPS传输确保安全。

4. **Token验证**：定期验证存储的JWT令牌是否仍然有效。

5. **防CSRF攻击**：对于敏感操作，考虑添加CSRF令牌验证。

### 常见问题与排查

1. **API调用失败**
   - 检查域名是否正确
   - 验证是否配置了正确的CORS策略
   - 查看浏览器控制台的网络请求和错误信息

2. **验证码验证失败**
   - 确认验证码是否在有效期内（默认5分钟）
   - 检查微信登录服务的日志，查看是否有错误信息
   - 验证Vercel KV服务是否正常工作

3. **Token无效**
   - 检查JWT令牌是否已过期
   - 验证JWT密钥是否一致
   - 确认token格式是否正确

### 完整示例代码

为了方便您快速集成，我们在项目中提供了完整的集成示例文件，位于`integration-examples`目录下：

1. **`wechat-login.js`** - 完整的微信登录集成库，包含所有核心功能
   - 提供了简单易用的API接口
   - 支持事件监听和链式调用
   - 自动处理登录回调和token管理

2. **`wechat-login-component.html`** - 独立的微信登录组件示例
   - 包含完整的HTML、CSS和JavaScript代码
   - 实现了美观的登录界面
   - 演示了验证码验证和登录流程

3. **`protected-page-example.html`** - 受保护页面示例
   - 展示如何在需要登录的页面中集成微信登录
   - 实现了自动检查登录状态和页面保护
   - 包含用户信息显示和登出功能

您可以直接将这些文件复制到您的项目中使用，`wechat-login.js`文件已经默认配置了您的部署域名(`https://wx.z-l.top`)，无需额外修改：

```javascript
// 微信登录服务域名（已默认配置）
const WECHAT_LOGIN_DOMAIN = 'https://wx.z-l.top';
```

### 如何使用这些示例

#### 1. 集成登录组件到您的页面

1. 将`wechat-login.js`文件复制到您的项目中
2. 创建登录页面并引入组件代码
3. 修改样式以匹配您的网站设计

#### 2. 保护需要登录的页面

1. 在需要保护的页面中引入`wechat-login.js`
2. 使用以下代码检查用户登录状态：

```javascript
// 导入登录库
import { wechatLogin } from './wechat-login.js';

// 确保用户已登录
async function initPage() {
  const isAuthenticated = await wechatLogin.ensureAuthenticated({
    redirect: true, // 未登录时重定向到登录页面
    validateToken: true // 验证token有效性
  });
  
  if (isAuthenticated) {
    // 用户已登录，加载页面内容
    const userInfo = wechatLogin.getUserInfo();
    console.log('当前用户:', userInfo);
    // 渲染用户界面...
  }
}

// 页面加载时执行
initPage();
```
```

### 总结

**API集成方式是最佳选择**，因为它：

1. **灵活性最高**：完全控制UI和用户体验
2. **可维护性好**：代码分离，便于管理和更新
3. **安全性更好**：可以实现更严格的安全控制
4. **可扩展性强**：可以根据需要轻松添加新功能

通过使用我们提供的API和示例代码，您可以轻松地将微信公众号登录功能集成到任何网站项目中，无论使用什么技术栈。

### 注意事项

1. 确保在生产环境中设置强密码和密钥
2. 考虑添加CSRF保护和其他安全措施
3. 对于高流量应用，建议使用真实的KV服务而不是内存存储
4. 定期轮换密钥和令牌以提高安全性

### 常见问题

#### 微信服务器验证失败
- 检查服务器地址是否正确（必须是https）
- 确认Token与微信公众号配置一致
- 验证服务器是否可以正常响应GET请求

#### 验证码不生效
- 检查Redis/KV服务是否正常工作
- 确认验证码是否在有效期内（默认5分钟）
- 验证code和openid的映射是否正确存储

#### JWT验证失败
- 检查JWT密钥是否一致
- 确认token是否过期
- 验证token格式是否正确

---

如有任何问题，请参考 [README.md](README.md)、[作者博客](https://blog.z-l.top/) 或提交 [GitHub Issues](https://github.com/xiaolongmr)。
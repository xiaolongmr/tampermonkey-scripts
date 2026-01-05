# 微信登录系统集成指南

## 文件夹内容说明

本文件夹包含将微信登录功能集成到其他项目所需的所有文件和文档：

1. **wechat-login.js** - 微信登录核心集成库，包含完整的登录功能实现
2. **wechat-login-component.html** - 登录组件示例，展示如何创建登录界面
3. **protected-page-example.html** - 受保护页面示例，展示如何保护需要登录才能访问的页面
4. **DEPLOYMENT.md** - 完整的部署和集成文档，包含详细说明和API参考

## 集成步骤指南

请按照以下步骤将微信登录功能集成到目标项目中：

### 1. 引入核心库

将 `wechat-login.js` 文件复制到目标项目中，并在需要使用登录功能的HTML页面中通过`<script>`标签引入：

```html
<script src="path/to/wechat-login.js"></script>
```

### 2. 初始化微信登录实例

在页面加载时，创建WechatLogin实例：

```javascript
// 初始化微信登录实例
const wechatLogin = new WechatLogin({
  domain: 'https://wx.z-l.top' // 微信登录服务域名（已配置好，无需修改）
});
```

### 3. 添加登录组件

参考 `wechat-login-component.html` 示例，在目标项目中创建登录界面：
- 添加验证码输入框
- 实现验证码发送按钮
- 添加验证按钮
- 实现相应的事件处理逻辑

### 4. 保护需要登录的页面

参考 `protected-page-example.html` 示例，在需要登录才能访问的页面顶部添加：
- 登录状态检查代码
- 如果未登录，自动跳转到登录页面
- 登录成功后返回原页面的逻辑

### 5. 获取用户信息

在用户登录后，可以使用以下方法获取用户信息：

```javascript
// 获取当前登录用户信息
wechatLogin.getUserInfo()
  .then(userInfo => {
    console.log('用户信息:', userInfo);
    // 使用用户信息进行后续操作
  })
  .catch(error => {
    console.error('获取用户信息失败:', error);
  });
```

### 6. 实现退出登录功能

```javascript
// 实现退出登录
function logout() {
  wechatLogin.logout()
    .then(() => {
      console.log('退出登录成功');
      // 跳转到登录页面或其他页面
      window.location.href = '/login';
    })
    .catch(error => {
      console.error('退出登录失败:', error);
    });
}
```

## 重要注意事项

1. **域名配置**：确保目标项目的域名已在微信公众号的安全域名配置中添加
2. **API调用**：所有API调用都指向已部署的微信登录服务（https://wx.z-l.top）
3. **安全措施**：请务必遵循DEPLOYMENT.md中的安全建议，特别是关于token验证和错误处理的部分
4. **兼容性**：确保在目标项目中测试所有浏览器兼容性
5. **调试信息**：遇到问题时，请查看浏览器控制台的错误信息，并参考DEPLOYMENT.md中的"常见问题"部分

## 详细文档

请查阅 `DEPLOYMENT.md` 文件获取更详细的集成指南、API参考和常见问题解答。

## 作者信息

- 作者：小张
- 博客：https://blog.z-l.top/
- GitHub：https://github.com/xiaolongmr
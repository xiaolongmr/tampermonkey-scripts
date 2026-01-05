/**
 * 微信公众号登录集成库
 * 提供简单的API来集成微信公众号登录功能
 * 作者: 小张 (https://blog.z-l.top/)
 */
class WechatLogin {
  /**
   * 构造函数
   * @param {Object} config - 配置选项
   * @param {string} config.domain - 微信登录服务域名
   * @param {string} config.tokenKey - 存储token的localStorage键名
   * @param {string} config.userInfoKey - 存储用户信息的localStorage键名
   */
  constructor(config = {}) {
    this.domain = config.domain || 'https://wx.z-l.top'; // 微信登录服务域名
    this.tokenKey = config.tokenKey || 'auth_token';
    this.userInfoKey = config.userInfoKey || 'user_info';
    this._init();
  }

  /**
   * 初始化函数，检查是否有登录回调参数
   * @private
   */
  _init() {
    // 检查是否有登录回调
    this._checkCallback();
  }

  /**
   * 检查URL中是否有登录回调参数
   * @private
   */
  _checkCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userInfoStr = urlParams.get('user');

    if (token && userInfoStr) {
      try {
        const userInfo = JSON.parse(decodeURIComponent(userInfoStr));
        this._saveAuthData(token, userInfo);

        // 清理URL参数
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);

        // 触发登录成功事件
        this._triggerEvent('loginSuccess', { token, userInfo });
      } catch (e) {
        console.error('解析登录信息失败:', e);
      }
    }
  }

  /**
   * 保存认证数据到localStorage
   * @private
   * @param {string} token - JWT令牌
   * @param {Object} userInfo - 用户信息对象
   */
  _saveAuthData(token, userInfo) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userInfoKey, JSON.stringify(userInfo));
  }

  /**
   * 获取存储的token
   * @returns {string|null} - 存储的token或null
   */
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * 获取用户信息
   * @returns {Object|null} - 用户信息对象或null
   */
  getUserInfo() {
    try {
      const info = localStorage.getItem(this.userInfoKey);
      return info ? JSON.parse(info) : null;
    } catch (e) {
      console.error('解析用户信息失败:', e);
      return null;
    }
  }

  /**
   * 检查是否已登录
   * @returns {boolean} - 是否已登录
   */
  isLoggedIn() {
    return !!this.getToken() && !!this.getUserInfo();
  }

  /**
   * 验证验证码
   * @param {string} code - 6位数字验证码
   * @returns {Promise<Object>} - 验证结果对象
   */
  async verifyCode(code) {
    if (!this.domain) {
      console.error('未配置微信登录服务域名');
      return { success: false, message: '配置错误' };
    }

    try {
      const response = await fetch(`${this.domain}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 保存认证信息
        this._saveAuthData(data.token, data.user);
        // 触发登录成功事件
        this._triggerEvent('loginSuccess', { token: data.token, userInfo: data.user });
      }

      return data;
    } catch (error) {
      console.error('验证请求失败:', error);
      return { success: false, message: '网络错误，请稍后再试' };
    }
  }

  /**
   * 验证token是否有效
   * @returns {Promise<boolean>} - token是否有效
   */
  async validateToken() {
    if (!this.domain || !this.getToken()) return false;

    try {
      const response = await fetch(`${this.domain}/api/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
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

  /**
   * 登出
   */
  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userInfoKey);
    this._triggerEvent('logout');
  }

  /**
   * 跳转到登录页面
   * @param {string} redirectUri - 登录成功后重定向的地址，默认为当前页面
   */
  redirectToLogin(redirectUri = window.location.href) {
    if (!this.domain) {
      console.error('未配置微信登录服务域名');
      return;
    }

    const encodedRedirectUri = encodeURIComponent(redirectUri);
    // 修改参数名为redirect，匹配服务端期望的参数名
    window.location.href = `${this.domain}/login?redirect=${encodedRedirectUri}`;
  }

  /**
   * 确保用户已登录
   * @param {Object} options - 配置选项
   * @param {boolean} options.redirect - 未登录时是否重定向，默认为true
   * @param {string} options.redirectUri - 重定向地址，默认为当前页面
   * @param {boolean} options.validateToken - 是否验证token有效性，默认为false
   * @returns {Promise<boolean>} - 是否已登录
   */
  async ensureAuthenticated(options = {}) {
    const {
      redirect = true,
      redirectUri = window.location.href,
      validateToken = false
    } = options;

    if (!this.isLoggedIn()) {
      if (redirect) {
        this.redirectToLogin(redirectUri);
      }
      return false;
    }

    // 可选：验证token是否有效
    if (validateToken) {
      const isValid = await this.validateToken();
      if (!isValid) {
        this.logout();
        if (redirect) {
          this.redirectToLogin(redirectUri);
        }
        return false;
      }
    }

    return true;
  }

  /**
   * 触发自定义事件
   * @private
   * @param {string} eventName - 事件名称
   * @param {Object} detail - 事件详情
   */
  _triggerEvent(eventName, detail = {}) {
    const event = new CustomEvent(`wechatLogin:${eventName}`, { detail });
    window.dispatchEvent(event);
  }

  /**
   * 监听事件
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   * @returns {WechatLogin} - 返回this以支持链式调用
   */
  on(eventName, callback) {
    window.addEventListener(`wechatLogin:${eventName}`, (event) => {
      callback(event.detail);
    });
    return this; // 支持链式调用
  }
}

// 导出默认实例和类
export default WechatLogin;
export const wechatLogin = new WechatLogin();
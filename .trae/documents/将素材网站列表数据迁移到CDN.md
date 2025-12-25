## 实现计划

### 1. 核心修改思路
- **移除内联数据**：删除脚本中庞大的`MATERIAL_SITES`数组定义
- **动态CDN加载**：在`renderMaterialSitesOnSucaiPage`函数内部从CDN加载数据
- **添加缓存机制**：使用`GM_getValue`/`GM_setValue`缓存CDN数据，减少重复请求
- **实现错误处理**：CDN加载失败时显示友好提示

### 2. 具体实现步骤

#### 2.1 修改`renderMaterialSitesOnSucaiPage`函数
- 将当前的同步渲染逻辑改为异步加载模式
- 优先从缓存获取数据，缓存过期时间设置为24小时
- 缓存失效时从CDN加载最新数据
- 加载成功后更新缓存并渲染列表
- 加载失败时显示错误提示

#### 2.2 实现数据加载函数
```javascript
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
    return cachedData;
  }
  
  // 3. 缓存失效，从CDN加载
  try {
    const response = await fetch('https://cdn.jsdelivr.net/gh/xiaolongmr/tampermonkey-scripts@b2f92b4993ae29665edd705d104520108e7109e8/%E8%8A%B1%E7%93%A3%E5%8E%BB%E6%B0%B4%E5%8D%B0/%E7%B4%A0%E6%9D%90%E7%BD%91.json');
    const data = await response.json();
    
    // 4. 更新缓存
    GM_setValue(cacheKey, data);
    GM_setValue(cacheExpiryKey, now + cacheDuration);
    
    return data;
  } catch (error) {
    console.error('加载素材网站列表失败:', error);
    throw error;
  }
}
```

#### 2.3 更新渲染逻辑
```javascript
// 渲染素材网站列表
try {
  // 异步加载数据
  const materialSites = await loadMaterialSites();
  
  materialSites.forEach((site) => {
    // 原有渲染逻辑不变
    // ...
  });
} catch (error) {
  console.error('渲染素材网站列表失败:', error);
  sitesList.innerHTML = `<div class="col-span-3 text-center text-slate-500 py-4">无法加载素材网站列表</div>`;
}
```

### 3. 性能优化考虑
- **延迟加载**：只在特定页面（`https://huaban.com/pages/sucai`）加载数据
- **缓存策略**：24小时缓存周期，平衡数据新鲜度和加载性能
- **CDN选择**：使用jsdelivr，全球加速，可靠性高
- **异步加载**：不阻塞脚本的其他功能执行

### 4. 错误处理
- CDN加载失败时显示友好提示
- 保留原有错误处理逻辑，确保脚本稳定运行
- 控制台输出详细错误信息，便于调试

### 5. 实现位置
- **数据加载函数**：放在脚本的辅助函数部分
- **修改后的渲染函数**：替换原有函数
- **移除原内联数据**：删除`MATERIAL_SITES`数组定义

### 6. 测试要点
- 验证在目标页面能正常加载和渲染数据
- 验证CDN数据更新后能正确刷新
- 验证缓存机制正常工作
- 验证CDN加载失败时的错误提示
- 验证脚本其他功能不受影响

### 7. 预期效果
- 脚本大小显著减小，加快脚本初始加载速度
- 素材网站数据可独立更新，无需修改脚本
- 加载性能通过CDN和缓存机制得到保障
- 提高脚本的可维护性和扩展性
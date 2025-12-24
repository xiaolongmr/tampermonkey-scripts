// ==UserScript==
// @name         花瓣"去"水印
// @version      2025-12-24
// @description  主要功能：1.显示花瓣真假PNG（原理：脚本通过给花瓣图片添加背景色，显示出透明PNG图片，透出背景色的即为透明PNG，非透明PNG就会被过滤掉） 2.通过自定义修改背景色，区分VIP素材和免费素材。 3.花瓣官方素材[vip素材]去水印（原理：去水印功能只是把图片链接替换花瓣官网提供的没有水印的最大尺寸图片地址，并非真正破破解去水印,仅供学习使用）更多描述可安装后查看
// @author       小张 | 个人博客：https://blog.z-l.top | 公众号“爱吃馍” | 设计导航站 ：https://dh.z-l.top | quicker账号昵称：星河城野❤
// @license      GPL-3.0
// @namespace    https://getquicker.net/User/Actions/388875-%E6%98%9F%E6%B2%B3%E5%9F%8E%E9%87%8E%E2%9D%A4
// @match        https://huaban.com/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @connect      *
// @grant        GM_download
// @icon         https://st0.dancf.com/static/02/202306090204-51f4.png
// @require      https://cdn.jsdelivr.net/gh/xiaolongmr/tampermonkey-scripts@8ed09bc4be4797388576008ceadbe0f8258126e5/%E8%8A%B1%E7%93%A3%E5%8E%BB%E6%B0%B4%E5%8D%B0/%E8%8A%B1%E7%93%A3%E2%80%9C%E5%8E%BB%E2%80%9D%E6%B0%B4%E5%8D%B0%E6%9B%B4%E6%96%B0%E6%8F%90%E7%A4%BA%E8%84%9A%E6%9C%AC.js
// @require      https://cdn.tailwindcss.com
// ==/UserScript==

(function () {
  "use strict";

  // 获取脚本版本号 - 移到全局作用域，确保所有地方都能访问
  const getScriptVersion = () => {
    try {
      return GM_info &&
        GM_info.script &&
        typeof GM_info.script.version === "string"
        ? GM_info.script.version
        : "未知";
    } catch (error) {
      console.warn("获取脚本版本失败:", error);
      return "未知";
    }
  };

  // 在素材页面渲染素材网站列表
  function renderMaterialSitesOnSucaiPage() {
      // 检查当前是否在指定页面
      if (window.location.href === 'https://huaban.com/pages/sucai') {
        const layoutContent = document.getElementById('layout-content');
        if (layoutContent) {
          // 检查是否已经渲染过，避免重复创建
          if (document.getElementById('material-sites-container')) {
            return;
          }
          
          // 隐藏原有内容
          const children = Array.from(layoutContent.children);
          children.forEach(child => {
            child.style.display = 'none';
          });
          
          // 创建素材网站列表容器
          const materialSitesContainer = document.createElement('div');
          materialSitesContainer.id = 'material-sites-container';
          materialSitesContainer.className = 'bg-white rounded-lg p-4 mb-4';
          
          // 创建标题
          const title = document.createElement('h3');
          title.className = 'text-lg font-medium text-slate-700 mb-3';
          title.textContent = '素材网站推荐';
          materialSitesContainer.appendChild(title);
          
          // 创建列表
          const sitesList = document.createElement('div');
          sitesList.className = 'grid grid-cols-5 gap-3 overflow-auto';
          
          // 渲染素材网站列表
          try {
            MATERIAL_SITES.forEach(site => {
              const siteItem = document.createElement('a');
              siteItem.href = site.href;
              siteItem.target = '_blank';
              siteItem.rel = 'noopener noreferrer';
              siteItem.className = 'flex items-center gap-2 p-3 border rounded-md hover:bg-slate-50 transition-colors text-sm';
              
              const siteLogo = document.createElement('img');
              siteLogo.src = site.logoSrc;
              siteLogo.alt = site.alt;
              siteLogo.className = 'w-6 h-6 object-contain';
              
              const siteInfo = document.createElement('div');
              siteInfo.className = 'flex-1 min-w-0';
              
              const siteTitle = document.createElement('div');
              siteTitle.className = 'font-medium text-slate-700 truncate';
              siteTitle.textContent = site.title;
              
              const siteTip = document.createElement('div');
              siteTip.className = 'text-xs text-slate-500 truncate';
              siteTip.textContent = site.tip;
              
              const sitePoints = document.createElement('div');
              sitePoints.className = 'text-xs text-amber-600';
              sitePoints.textContent = site.jifen_tip;
              
              siteInfo.appendChild(siteTitle);
              siteInfo.appendChild(siteTip);
              siteItem.appendChild(siteLogo);
              siteItem.appendChild(siteInfo);
              siteItem.appendChild(sitePoints);
              sitesList.appendChild(siteItem);
            });
          } catch (error) {
            console.error('渲染素材网站列表失败:', error);
            sitesList.innerHTML = `<div class="col-span-3 text-center text-slate-500 py-4">无法加载素材网站列表</div>`;
          }
          
          materialSitesContainer.appendChild(sitesList);
          
          // 添加文案信息
          const infoText = document.createElement('div');
          infoText.className = 'mt-4 p-4 bg-slate-50 rounded-lg text-sm text-slate-700 border border-slate-200';
          infoText.innerHTML = '以上网站使用 <a href="http://121.40.25.9:8080/register.html" target="_blank" class="text-blue-500 hover:underline">http://121.40.25.9:8080/</a> 素材下载网站 购买积分进行下载，你也可以自己注册，邀请码：1474728874 使用邀请码注册双方各得1000积分';
          materialSitesContainer.appendChild(infoText);
          
          // 将列表添加到页面中
          layoutContent.insertBefore(materialSitesContainer, layoutContent.firstChild);
        }
      }
  };

  // ==================== 常量定义 ====================
  // UI 配色方案
  const COLORS = {
    switchCustom: { on: "#4ade80", off: "#e2e8f0" },
    switchWatermark: { on: "#ff6b6b", off: "#e2e8f0" },
    switchDrag: { on: "#3b82f6", off: "#e2e8f0" },
    switchRightClick: { on: "#8b5cf6", off: "#e2e8f0" },
  };

  // 时间配置（毫秒）
  const TIMING = {
    debounceWatermark: 200, // 去水印操作的防抖延迟
    watermarkCheckInterval: 2000, // 水印检测间隔
    minProcessInterval: 500, // 最小处理间隔
    switchTransition: 1000, // 开关状态变化反馈时长
  };
  
  // 素材网站列表数据
  const MATERIAL_SITES = [
    {"href":"https://www.design006.com/","logoSrc":"https://ico.cxr.cool/www.design006.com.ico","alt":"享设计","channelAlt":"1250积分下载一次","title":"享设计","tip":"超高质量素材","jifen_tip":"1250积分"},
    {"href":"https://www.redocn.com/","logoSrc":"https://ico.cxr.cool/www.redocn.com.ico","alt":"红动中国","channelAlt":"510积分下载一次","title":"红动中国","tip":"高质量素材","jifen_tip":"510积分"},
    {"href":"http://www.nipic.com/","logoSrc":"https://ico.cxr.cool/www.nipic.com.ico","alt":"昵图网","channelAlt":"对应昵图网积分,最低580分一次","title":"昵图网","tip":"共享图任性下","jifen_tip":"最低580积分"},
    {"href":"https://www.58pic.com/","logoSrc":"https://ico.cxr.cool/www.58pic.com.ico","alt":"千图网","channelAlt":"380积分下载一次","title":"千图网","tip":"超多设计素材下载","jifen_tip":"380积分"},
    {"href":"https://ibaotu.com/","logoSrc":"https://ico.cxr.cool/www.ibaotu.com.ico","alt":"包图网","channelAlt":"320积分下载一次","title":"包图网","tip":"高质量设计图片下载","jifen_tip":"320积分"},
    {"href":"http://699pic.com/","logoSrc":"https://ico.cxr.cool/www.699pic.com.ico","alt":"摄图网","channelAlt":"360积分下载一次","title":"摄图网","tip":"高清摄影图片下载","jifen_tip":"360积分"},
    {"href":"https://588ku.com/","logoSrc":"https://ico.cxr.cool/www.588ku.com.ico","alt":"千库网","channelAlt":"320积分下载一次","title":"千库网","tip":"做设计,不抠图","jifen_tip":"320积分"},
    {"href":"https://www.ztupic.com/","logoSrc":"https://ico.cxr.cool/www.ztupic.com.ico","alt":"众图网","channelAlt":"280积分下载一次","title":"众图网","tip":"高质量文化墙下载","jifen_tip":"280积分"},
    {"href":"https://www.tukuppt.com/","logoSrc":"https://ico.cxr.cool/www.tukuppt.com.ico","alt":"熊猫办公","channelAlt":"280积分下载一次","title":"熊猫办公","tip":"高质量PPT下载","jifen_tip":"280积分"},
    {"href":"https://www.51miz.com/","logoSrc":"https://ico.cxr.cool/www.51miz.com.ico","alt":"觅知网","channelAlt":"280积分下载一次","title":"觅知网","tip":"质量堪比收费素材","jifen_tip":"280积分"},
    {"href":"http://www.51yuansu.com/","logoSrc":"https://ico.cxr.cool/www.51yuansu.com.ico","alt":"觅元素","channelAlt":"240积分下载一次","title":"觅元素","tip":"无需抠图的元素专区","jifen_tip":"240积分"},
    {"href":"https://www.ooopic.com/sucaixiazai/","logoSrc":"https://ico.cxr.cool/www.ooopic.com.ico","alt":"我图网","channelAlt":"340积分下载一次","title":"我图网","tip":"我图网原创区","jifen_tip":"340积分"},
    {"href":"https://www.88tph.com/","logoSrc":"https://ico.cxr.cool/www.88tph.com.ico","alt":"图品汇","channelAlt":"360积分下载一次","title":"图品汇","tip":"原创设计","jifen_tip":"360积分"},
    {"href":"https://shipin520.com/","logoSrc":"https://ico.cxr.cool/www.shipin520.com.ico","alt":"潮点视频","channelAlt":"460积分下载一次","title":"潮点视频","tip":"做视频就要潮一点","jifen_tip":"460积分"},
    {"href":"https://huaban.com/","logoSrc":"https://ico.cxr.cool/www.huaban.com.ico","alt":"花瓣网","channelAlt":"880积分下载一次","title":"花瓣网","tip":"最新采集图片素材资源","jifen_tip":"880积分"},
    {"href":"https://zhitu66.com/","logoSrc":"https://ico.cxr.cool/www.zhitu66.com.ico","alt":"致图网","channelAlt":"360积分下载一次","title":"致图网","tip":"设计模板素材图库","jifen_tip":"360积分"},
    {"href":"https://www.16pic.com/","logoSrc":"https://ico.cxr.cool/www.16pic.com.ico","alt":"六图网","channelAlt":"240积分下载一次","title":"六图网","tip":"新潜力网站","jifen_tip":"240积分"},
    {"href":"http://90sheji.com/","logoSrc":"https://ico.cxr.cool/www.90sheji.com.ico","alt":"90设计","channelAlt":"280积分下载一次","title":"90设计","tip":"电商精品设计模板下载","jifen_tip":"280积分"},
    {"href":"https://izihun.com/","logoSrc":"https://ico.cxr.cool/www.izihun.com.ico","alt":"字魂网","channelAlt":"240积分下载一次","title":"字魂网","tip":"字体下载专区","jifen_tip":"240积分"},
    {"href":"https://www.bangongziyuan.com/","logoSrc":"https://ico.cxr.cool/www.bangongziyuan.com.ico","alt":"办公资源","channelAlt":"220积分下载一次","title":"办公资源","tip":"办公文档尽在办公资源","jifen_tip":"220积分"},
    {"href":"https://www.qiuziti.com/","logoSrc":"https://ico.cxr.cool/www.qiuziti.com.ico","alt":"求字体","channelAlt":"480积分下载一次","title":"求字体","tip":"字体实时预览","jifen_tip":"480积分"},
    {"href":"https://www.shetu66.com/","logoSrc":"https://ico.cxr.cool/www.shetu66.com.ico","alt":"设图网","channelAlt":"360积分下载一次","title":"设图网","tip":"原创素材分享平台","jifen_tip":"360积分"},
    {"href":"https://www.bigbigwork.com/","logoSrc":"https://ico.cxr.cool/www.bigbigwork.com.ico","alt":"大作网","channelAlt":"360积分下载一次","title":"大作网","tip":"设计灵感搜索引擎","jifen_tip":"360积分"},
    {"href":"http://www.ppt118.com/","logoSrc":"https://ico.cxr.cool/www.ppt118.com.ico","alt":"风云办公","channelAlt":"260积分下载一次","title":"风云办公","tip":"提供原创办公素材的下载","jifen_tip":"260积分"},
    {"href":"http://616pic.com/","logoSrc":"https://ico.cxr.cool/www.616pic.com.ico","alt":"图精灵","channelAlt":"360积分下载一次","title":"图精灵","tip":"配图背景素材","jifen_tip":"360积分"},
    {"href":"https://www.888ppt.com/","logoSrc":"https://ico.cxr.cool/www.888ppt.com.ico","alt":"办图网","channelAlt":"260积分下载一次","title":"办图网","tip":"小型网站","jifen_tip":"260积分"},
    {"href":"https://www.99ppt.com/","logoSrc":"https://ico.cxr.cool/www.99ppt.com.ico","alt":"当图网","channelAlt":"260积分下载一次","title":"当图网","tip":"海量精品PPT模板","jifen_tip":"260积分"},
    {"href":"http://300ppt.com/","logoSrc":"https://ico.cxr.cool/www.300ppt.com.ico","alt":"闪办网","channelAlt":"260积分下载一次","title":"闪办网","tip":"ppt模板音效素材","jifen_tip":"260积分"},
    {"href":"http://www.tuke88.com/","logoSrc":"https://ico.cxr.cool/www.tuke88.com.ico","alt":"图客巴巴","channelAlt":"360积分下载一次","title":"图客巴巴","tip":"创意图片设计","jifen_tip":"360积分"},
    {"href":"http://www.kuaipng.com/","logoSrc":"https://ico.cxr.cool/www.kuaipng.com.ico","alt":"快图网","channelAlt":"260积分下载一次","title":"快图网","tip":"免扣png图素材","jifen_tip":"260积分"},
    {"href":"https://www.yuantunet.com/","logoSrc":"https://ico.cxr.cool/www.yuantunet.com.ico","alt":"原图网","channelAlt":"1050积分下载一次","title":"原图网","tip":"高质量设计作品","jifen_tip":"1050积分"},
    {"href":"https://www.900ppt.com/","logoSrc":"https://ico.cxr.cool/www.900ppt.com.ico","alt":"工图网","channelAlt":"460积分下载一次","title":"工图网","tip":"海量ppt文档","jifen_tip":"460积分"},
    {"href":"https://www.officeplus.cn/","logoSrc":"https://ico.cxr.cool/www.officeplus.cn.ico","alt":"微软office","channelAlt":"360积分下载一次","title":"微软office","tip":"ppt模板word文档","jifen_tip":"360积分"},
    {"href":"https://www.5ifont.cn/","logoSrc":"https://ico.cxr.cool/www.5ifont.cn.ico","alt":"字格网","channelAlt":"360积分下载一次","title":"字格网","tip":"发现好字体","jifen_tip":"360积分"},
    {"href":"https://www.molishe.com/","logoSrc":"https://ico.cxr.cool/www.molishe.com.ico","alt":"魔力设","channelAlt":"360积分下载一次","title":"魔力设","tip":"海量图片素材库","jifen_tip":"360积分"},
    {"href":"https://ixintu.com/","logoSrc":"https://ico.cxr.cool/www.ixintu.com.ico","alt":"新图网","channelAlt":"360积分下载一次","title":"新图网","tip":"png图片背景素材","jifen_tip":"360积分"},
    {"href":"https://chaopx.com/","logoSrc":"https://ico.cxr.cool/www.chaopx.com.ico","alt":"潮国创意","channelAlt":"360积分下载一次","title":"潮国创意","tip":"国潮风格等创意设计","jifen_tip":"360积分"},
    {"href":"https://stock.xinpianchang.com/vip","logoSrc":"https://ico.cxr.cool/www.xinpianchang.com.ico","alt":"片场素材","channelAlt":"680积分下载一次","title":"片场素材","tip":"高清视频AE模板","jifen_tip":"680积分"},
    {"href":"https://www.xianpic.com/","logoSrc":"https://ico.cxr.cool/www.xianpic.com.ico","alt":"仙图网","channelAlt":"460积分下载一次","title":"仙图网","tip":"高质量共享素材","jifen_tip":"460积分"},
    {"href":"https://elements.envato.com/","logoSrc":"https://ico.cxr.cool/www.elements.envato.com.ico","alt":"envato综合","channelAlt":"460积分下载一次","title":"envato综合","tip":"海外站点:envato综合","jifen_tip":"460积分"},
    {"href":"https://www.freepik.com/","logoSrc":"https://ico.cxr.cool/www.freepik.com.ico","alt":"freepik综合","channelAlt":"460积分下载一次","title":"freepik综合","tip":"海外站点:freepik综合","jifen_tip":"460积分"},
    {"href":"https://www.vecteezy.com/","logoSrc":"https://ico.cxr.cool/www.vecteezy.com.ico","alt":"vecteezy综合","channelAlt":"360积分下载一次","title":"vecteezy综合","tip":"海外站点:vecteezy综合","jifen_tip":"360积分"},
    {"href":"https://www.rawpixel.com/free-images","logoSrc":"https://ico.cxr.cool/www.rawpixel.com.ico","alt":"rawpi元素","channelAlt":"360积分下载一次","title":"rawpi元素","tip":"海外站点:rawpi元素","jifen_tip":"360积分"},
    {"href":"https://motionarray.com/","logoSrc":"https://ico.cxr.cool/www.motionarray.com.ico","alt":"motion样式","channelAlt":"460积分下载一次","title":"motion样式","tip":"海外站点:motion样式","jifen_tip":"460积分"},
    {"href":"https://www.flaticon.com/","logoSrc":"https://ico.cxr.cool/www.flaticon.com.ico","alt":"flaticon图标","channelAlt":"360积分下载一次","title":"flaticon图标","tip":"海外站点:flaticon图标","jifen_tip":"360积分"},
    {"href":"https://slidesgo.com/","logoSrc":"https://ico.cxr.cool/www.slidesgo.com.ico","alt":"slidePPT","channelAlt":"360积分下载一次","title":"slidePPT","tip":"海外站点:slidePPT","jifen_tip":"360积分"},
    {"href":"https://www.storyblocks.com/","logoSrc":"https://ico.cxr.cool/www.storyblocks.com.ico","alt":"story视频","channelAlt":"360积分下载一次","title":"story视频","tip":"海外站点:story视频","jifen_tip":"360积分"},
    {"href":"https://pixabay.com/","logoSrc":"https://ico.cxr.cool/www.pixabay.com.ico","alt":"pixabay实拍","channelAlt":"360积分下载一次","title":"pixabay实拍","tip":"海外站点:pixabay实拍","jifen_tip":"360积分"},
    {"href":"https://iconscout.com/","logoSrc":"https://ico.cxr.cool/www.iconscout.com.ico","alt":"iconsco图标","channelAlt":"360积分下载一次","title":"iconsco图标","tip":"海外站点:iconsco图标","jifen_tip":"360积分"},
    {"href":"https://unsplash.com/","logoSrc":"https://ico.cxr.cool/www.unsplash.com.ico","alt":"unspla实拍","channelAlt":"360积分下载一次","title":"unspla实拍","tip":"海外站点:unspla实拍","jifen_tip":"360积分"},
    {"href":"https://pixelbuddha.net/","logoSrc":"https://ico.cxr.cool/www.pixelbuddha.net.ico","alt":"pixel样式","channelAlt":"360积分下载一次","title":"pixel样式","tip":"海外站点:pixel样式","jifen_tip":"360积分"},
    {"href":"https://www.brusheezy.com/","logoSrc":"https://ico.cxr.cool/www.brusheezy.com.ico","alt":"brushe效果","channelAlt":"360积分下载一次","title":"brushe效果","tip":"海外站点:brushe效果","jifen_tip":"360积分"},
    {"href":"https://www.slidemembers.com/en_US/","logoSrc":"https://ico.cxr.cool/www.slidemembers.com.ico","alt":"slidemembersPPT","channelAlt":"360积分下载一次","title":"slidemembersPPT","tip":"海外站点:slidemembersPPT","jifen_tip":"360积分"},
    {"href":"https://deeezy.com/","logoSrc":"https://ico.cxr.cool/www.deeezy.com.ico","alt":"deeezy字体","channelAlt":"360积分下载一次","title":"deeezy字体","tip":"海外站点:deeezy字体","jifen_tip":"360积分"},
    {"href":"https://www.yayimages.com/","logoSrc":"https://ico.cxr.cool/www.yayimages.com.ico","alt":"yay实拍","channelAlt":"360积分下载一次","title":"yay实拍","tip":"海外站点:yay实拍","jifen_tip":"360积分"},
    {"href":"https://imgbin.com/","logoSrc":"https://ico.cxr.cool/www.imgbin.com.ico","alt":"img免扣","channelAlt":"360积分下载一次","title":"img免扣","tip":"海外站点:img免扣","jifen_tip":"360积分"},
    {"href":"https://dribbble.com/shots","logoSrc":"https://ico.cxr.cool/www.dribbble.com.ico","alt":"dribbble前端","channelAlt":"360积分下载一次","title":"dribbble前端","tip":"海外站点:dribbble前端","jifen_tip":"360积分"}
  ];
  
  // 状态变量：跟踪Ctrl+V/Cmd+V的使用状态
  let isImageSearchMode = false;

  // DOM 选择器
  const SELECTORS = {
    // 花瓣网中的"查看大图"按钮图片
    imageButton:
      'img[data-button-name="查看大图"][src*="gd-hbimg-edge.huabanimg.com"]',
    // 图片查看器中的大图元素（带花瓣域名限制）
    imageViewer:
      'img.vYzIMzy2[alt="查看图片"][src*="gd-hbimg-edge.huabanimg.com"]',
    // 图片查看器容器内的大图元素（带容器ID和花瓣域名限制）
    imageViewerContainer:
      '#imageViewerWrapper img.vYzIMzy2[alt="查看图片"][src*="gd-hbimg-edge.huabanimg.com"]',
    // 简单图片查看器中的大图元素（不带域名限制）
    imageViewerSimple: 'img.vYzIMzy2[alt="查看图片"]',
  };

  // 默认配置
  const DEFAULT_CONFIG = {
    materialColor: "#ffe0e0",
    // 花瓣官方素材：淡红色
    userColor: "#ebffff",
    // 用户上传：粉蓝色
    enableCustom: true,
    // 启用自定义背景色
    enableRemoveWatermark: true,
    // 仅支持花瓣官方素材去水印功能，第三方素材无效
    enableDragDownload: true,
    // 启用拖拽下载功能
    enableRightClickDownload: true,
    // 启用右键下载功能
  };

  // 配置字段映射（简化 getConfig/saveConfig）
  const CONFIG_KEYS = [
    "materialColor",
    "userColor",
    "enableCustom",
    "enableRemoveWatermark",
    "enableDragDownload",
    "enableRightClickDownload",
    "historyLoadingStyle",
  ];

  // 获取配置 - 使用配置字段映射简化代码
  function getConfig() {
    const result = {};
    CONFIG_KEYS.forEach((key) => {
      result[key] = GM_getValue(key, DEFAULT_CONFIG[key]);
    });
    return result;
  }

  // 保存配置 - 使用配置字段映射简化代码
  function saveConfig(config) {
    CONFIG_KEYS.forEach((key) => {
      if (key in config) {
        GM_setValue(key, config[key]);
      }
    });
  }

  // 应用样式
  function applyStyles() {
    const config = getConfig();

    // 移除旧样式
    const oldStyle = document.getElementById("huaban-bg-style");
    if (oldStyle) oldStyle.remove();

    // 添加动画效果CSS
    const style = document.createElement("style");
    style.id = "huaban-bg-style";
    style.textContent = `

            /* 花瓣素材 背景色 */
            .KKIUywzb[data-content-type="素材采集"] .transparent-img-bg {
                background-color: ${
                  config.enableCustom ? config.materialColor : "transparent"
                } !important;
                ${config.enableCustom ? "background-image:none!important;" : ""}
            }

            /* 用户上传背景色，非花瓣素材 */
            .KKIUywzb:not([data-content-type="素材采集"]) .transparent-img-bg,.transparent-img-black-bg,.transparent-img-bg {
                background-color: ${
                  config.enableCustom ? config.userColor : "transparent"
                } !important;
                ${config.enableCustom ? "background-image:none!important;" : ""}
            }

            /* 历史下载素材名称hover样式 */
            .hb-history-item a:hover {
                opacity: 0.7;
            }
            
            /* 搜索框聚焦时的样式 - 仅在使用快捷键时触发 */
            [data-button-name="搜索框"].hb-search-focused:before {
                background: #ffb4b4ff !important;
            }
            

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
      
          /* 历史下载窗口滚动条弱化（容器与瀑布流均处理，覆盖多浏览器） */
          #huabanDownloadHistory .hb-history-content,
          #huabanDownloadHistory .hb-history-masonry {
              scrollbar-width: thin; /* Firefox */
              scrollbar-color: #e8e8e8 transparent; /* Firefox */
          }
          #huabanDownloadHistory .hb-history-content::-webkit-scrollbar,
          #huabanDownloadHistory .hb-history-masonry::-webkit-scrollbar {
              width: 6px; /* Chrome/Safari */
          }
          #huabanDownloadHistory .hb-history-content::-webkit-scrollbar-track,
          #huabanDownloadHistory .hb-history-masonry::-webkit-scrollbar-track {
              background: transparent;
          }
          #huabanDownloadHistory .hb-history-content::-webkit-scrollbar-thumb,
          #huabanDownloadHistory .hb-history-masonry::-webkit-scrollbar-thumb {
              background-color: #cbd5e1; /* slate-300 */
              border-radius: 8px;
          }
          #huabanDownloadHistory .hb-history-content:hover::-webkit-scrollbar-thumb,
          #huabanDownloadHistory .hb-history-masonry:hover::-webkit-scrollbar-thumb {
              background-color: #fce1e1ff; /* slate-400，悬浮时略加深 */
          }

          /* 个人信息面板样式 */
          .user-profile { max-width: 800px; margin: 0 auto; }
          .profile-header { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
          .avatar { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .profile-info h3 { margin: 0 0 10px; font-size: 24px; color: #333; }
          .profile-info .job { color: #666; margin: 0 0 5px; }
          .profile-info .joined { color: #999; font-size: 14px; }
          .profile-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; }
          .stat-item { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-value { display: block; font-size: 28px; font-weight: bold; color: #333; margin-bottom: 5px; }
          .stat-label { color: #666; font-size: 14px; }
          .loading { text-align: center; padding: 40px 0; color: #666; }
          .error-message { color: #dc3545; padding: 20px; text-align: center; background: #f8d7da; border-radius: 4px; }
        `;
    document.head.appendChild(style);
  }

  // 保存原始URL到图片元素的dataset中
  function saveOriginalUrl(img) {
    if (!img.dataset.originalSrc) {
      img.dataset.originalSrc = img.src;
      debugLog("保存原始URL:", img.dataset.originalSrc);
    }
    if (img.srcset && !img.dataset.originalSrcset) {
      img.dataset.originalSrcset = img.srcset;
      debugLog("保存原始srcset:", img.dataset.originalSrcset);
    }
  }

  // 恢复图片的原始URL
  function restoreOriginalUrl(img) {
    if (img.dataset.originalSrc) {
      debugLog("恢复原始URL:", img.dataset.originalSrc);
      img.src = img.dataset.originalSrc;
      delete img.dataset.originalSrc;
    }
    if (img.dataset.originalSrcset) {
      debugLog("恢复原始srcset:", img.dataset.originalSrcset);
      img.srcset = img.dataset.originalSrcset;
      delete img.dataset.originalSrcset;
    }
    // 移除处理标记
    img.removeAttribute("data-watermark-removed");
  }

  // 去除图片后缀参数，让图片保存为PNG格式，并保留查询参数
  function removeImageSuffixParams(url) {
    // 分离URL和查询参数
    const [baseUrl, queryParams] = url.split("?");
    // 匹配花瓣图片URL中的后缀参数，如 _fw658webp
    const suffixRegex = /(_fw\d+webp)(\.webp)?$/i;

    if (suffixRegex.test(baseUrl)) {
      // 去除后缀参数，保留图片ID和扩展名
      const cleanBaseUrl = baseUrl.replace(suffixRegex, "");
      // 保留查询参数（如果有）
      const cleanUrl = queryParams ? `${cleanBaseUrl}?${queryParams}` : cleanBaseUrl;
      debugLog("去除图片后缀参数，保留查询参数:", url, "→", cleanUrl);
      return cleanUrl;
    }

    // 如果没有匹配到后缀参数，直接返回原始URL（包含查询参数）
    return url;
  }

  // 下载历史存储与操作
  function getDownloadHistory() {
    try {
      const list = GM_getValue("downloadHistory", []);
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function saveDownloadHistory(list) {
    try {
      GM_setValue("downloadHistory", list);
    } catch (e) {
      console.error("保存下载历史失败:", e);
    }
  }

  // 保障：加载并桥接 pinyin-pro 到沙箱上下文
  function ensurePinyinLib(onReady) {
    const ready = () => {
      try {
        typeof onReady === "function" && onReady();
      } catch (e) {}
    };
    try {
      const has =
        typeof window.pinyinPro !== "undefined" &&
        typeof window.pinyinPro.pinyin === "function";
      if (has) return ready();
      const s = document.createElement("script");
      s.src = "https://unpkg.com/pinyin-pro";
      s.onload = () => {
        try {
          const gw =
            typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
          if (
            !window.pinyinPro ||
            typeof window.pinyinPro.pinyin !== "function"
          ) {
            if (gw.pinyinPro && typeof gw.pinyinPro.pinyin === "function") {
              window.pinyinPro = { pinyin: gw.pinyinPro.pinyin };
            } else if (typeof gw.pinyin === "function") {
              window.pinyinPro = { pinyin: gw.pinyin };
            }
          }
        } catch (e) {}
        ready();
      };
      document.head.appendChild(s);
    } catch (e) {
      ready();
    }
  }

  // 工具：生成文件名的拼音与首字母
  function makePinyinForName(name) {
    try {
      const txt = String(name || "");
      if (!txt) return { py: "", ac: "" };
      const fn = window.pinyinPro && window.pinyinPro.pinyin;
      if (typeof fn !== "function") return { py: "", ac: "" };
      const py = String(fn(txt, { toneType: "none", type: "string" }));
      const arr = fn(txt, { toneType: "none", type: "array" }) || [];
      const ac = arr
        .map((x) => (typeof x === "string" && x.length > 0 ? x[0] : ""))
        .join("");
      return { py, ac };
    } catch (e) {
      return { py: "", ac: "" };
    }
  }

  function addDownloadHistoryItem(item) {
    const list = getDownloadHistory();
    // 预生成拼音字段（若库未就绪，后续 hydratePinyinForHistory 会补齐）
    let pyInfo = { py: "", ac: "" };
    try {
      pyInfo = makePinyinForName(item.fileName);
    } catch (e) {}
    const record = {
      id: Date.now() + Math.random().toString(16).slice(2),
      fileName: item.fileName,
      url: item.url,
      pageUrl: item.pageUrl || location.href,
      originHref: item.originHref || "",
      time: Date.now(),
      official: !!item.official,
      width: item.width || 0,
      height: item.height || 0,
      action: item.action || "download",
      name_py: pyInfo.py,
      name_py_acronym: pyInfo.ac,
    };
    list.unshift(record);
    // 限制最大记录数，避免无限增长
    if (list.length > 300) list.length = 300;
    saveDownloadHistory(list);
    return record;
  }

  // 补齐历史记录中的拼音字段
  function hydratePinyinForHistory() {
    try {
      const list = getDownloadHistory();
      let changed = false;
      for (let i = 0; i < list.length; i++) {
        const it = list[i];
        if (!it.name_py || !it.name_py_acronym) {
          const info = makePinyinForName(it.fileName);
          if (info.py || info.ac) {
            it.name_py = info.py;
            it.name_py_acronym = info.ac;
            changed = true;
          }
        }
      }
      if (changed) saveDownloadHistory(list);
    } catch (e) {}
  }

  function removeDownloadHistoryItem(id) {
    const list = getDownloadHistory();
    const next = list.filter((x) => x.id !== id);
    saveDownloadHistory(next);
  }

  function clearDownloadHistory() {
    saveDownloadHistory([]);
  }

  function isOfficialMaterial() {
    return (
      Array.from(document.querySelectorAll(".fgsjNg46")).some(
        (el) => el.textContent && el.textContent.includes("官方自营")
      ) || document.querySelectorAll('[title="来自官方自营"]').length > 0
    );
  }

  function formatDateTime(ts) {
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function debugLog() {
    /* no-op */
  }

  // 去水印功能：修改图片链接
  function processWatermark(force = false) {
    const config = getConfig();
    const materialImages = getMaterialImages();

    debugLog(
      "执行水印处理，enable:",
      config.enableRemoveWatermark,
      "force:",
      force
    );

    let processedCount = 0;
    let skippedCount = 0;

    materialImages.forEach((img) => {
      try {
        const originalSrc = img.src;

        // 检查是否需要处理
        if (!config.enableRemoveWatermark) {
          // 如果功能已关闭，恢复原始URL
          if (img.dataset.originalSrc) {
            restoreOriginalUrl(img);
            processedCount++;
            debugLog("恢复原始URL:", originalSrc);
          } else {
            skippedCount++;
          }
          return;
        }

        // 如果功能已启用，但图片已处理且不是force模式，跳过
        if (!force && img.hasAttribute("data-watermark-removed")) {
          skippedCount++;
          return;
        }

        // 核心判断逻辑：只处理包含"官方自营"字样的素材
        // 查找包含"官方自营"文本的元素
        const isOfficialMaterial =
          // 原有条件：.fgsjNg46 元素包含"官方自营"文本
          Array.from(document.querySelectorAll(".fgsjNg46")).some(
            (element) =>
              element.textContent && element.textContent.includes("官方自营")
          ) ||
          // 新增条件：存在 title="来自官方自营" 的元素
          document.querySelectorAll('[title="来自官方自营"]').length > 0;
        debugLog("素材检查结果 - 是官方自营素材:", isOfficialMaterial);

        // 只处理官方自营素材，其他类型的素材一概跳过
        if (!isOfficialMaterial) {
          debugLog("跳过非官方自营素材图片:", originalSrc);
          skippedCount++;
          return;
        }

        // 保存原始URL
        saveOriginalUrl(img);

        // 去水印规则：在域名后添加/small/
        const watermarkRegex =
          /(https?:\/\/gd-hbimg-edge\.huabanimg\.com)\/([^\/?]+)/;

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
          if (
            watermarkRegex.test(originalSrc) &&
            !originalSrc.includes("/small/")
          ) {
            // 分离URL和查询参数
            const [baseUrl, queryParams] = originalSrc.split("?");
            // 在基础URL上添加/small/
            const newBaseUrl = baseUrl.replace(watermarkRegex, "$1/small/$2");
            // 保留查询参数（如果有）
            const newSrc = queryParams ? `${newBaseUrl}?${queryParams}` : newBaseUrl;
            debugLog("检查新图片URL是否有效:", newSrc);

            // 检查新链接是否有效
            const isValid = await checkImageUrl(newSrc);
            if (isValid) {
              debugLog("修改VIP图片src:", originalSrc, "→", newSrc);
              img.src = newSrc;
              modified = true;
            } else {
              debugLog("新图片URL无效，跳过处理:", newSrc);
            }
          }

          // 处理srcset属性
          if (
            img.srcset &&
            watermarkRegex.test(img.srcset) &&
            !img.srcset.includes("/small/")
          ) {
            // 处理srcset中的每个URL
            const newSrcset = img.srcset.split(" ")
              .map(item => {
                if (item.match(/^https?:\/\//)) {
                  // 这是一个URL，需要处理
                  const [baseUrl, queryParams] = item.split("?");
                  const newBaseUrl = baseUrl.replace(watermarkRegex, "$1/small/$2");
                  return queryParams ? `${newBaseUrl}?${queryParams}` : newBaseUrl;
                }
                // 这可能是一个宽度描述符（如w500），直接返回
                return item;
              })
              .join(" ");
              
            debugLog("检查新图片srcset是否有效:", newSrcset);

            // 检查新链接是否有效
            const isValid = await checkImageUrl(newSrcset.split(" ")[0]); // 取第一个URL检查
            if (isValid) {
              debugLog("修改VIP图片srcset:", img.srcset, "→", newSrcset);
              img.srcset = newSrcset;
              modified = true;
            } else {
              debugLog("新图片srcset URL无效，跳过处理:", newSrcset);
            }
          }

          if (modified) {
            processedCount++;
            img.setAttribute("data-watermark-removed", "true");
            debugLog("图片处理成功");
          } else {
            skippedCount++;
            debugLog("图片无需处理或已处理");
          }
        })();
      } catch (error) {
        console.error("水印处理失败:", error, "图片:", img.src);
        skippedCount++;
      }
    });

    debugLog("=== 处理完成 ===");
    debugLog(`总共处理了${processedCount}张图片，跳过了${skippedCount}张`);
    return processedCount > 0;
  }

  // 获取所有需要处理的花瓣素材图片
  function getMaterialImages() {
    // 使用更精准的选择器，基于你提供的HTML元素
    const selectors = [
      // 缩略图：使用 data-button-name="查看大图" 属性
      SELECTORS.imageButton,
      // 大图查看器中的图片 - 优先级高，确保能捕获所有大图模式下的图片
      SELECTORS.imageViewerContainer,
      // 大图：使用 class="vYzIMzy2" 类名 + alt="查看图片" 属性
      SELECTORS.imageViewer,
      // 备用：花瓣素材图片
      '[data-material-type="套系素材"] img[src*="gd-hbimg-edge.huabanimg.com"]',
      // 备用：素材采集类型图片
      'img[src*="gd-hbimg-edge.huabanimg.com"][data-content-type="素材采集"]',
    ];

    return document.querySelectorAll(selectors.join(", "));
  }

  // 处理大图查看器
  function handleImageViewer() {
    const config = getConfig();

    if (!config.enableRemoveWatermark) {
      return;
    }

    debugLog("检查大图查看器");

    let imageViewerInterval = null;

    // 处理大图查看器中的图片的函数
    function processImageViewerImages() {
      const imageViewer = document.querySelector("#imageViewerWrapper");
      if (imageViewer) {
        const viewerImage = imageViewer.querySelector(
          SELECTORS.imageViewerSimple
        );
        if (viewerImage) {
          // 检查图片是否已加载完成
          if (viewerImage.complete && viewerImage.naturalWidth > 0) {
            debugLog("大图查看器：检测到已加载的图片，执行去水印处理");
            processWatermark(true); // 强制处理

            // 如果已成功处理，停止定时器
            if (viewerImage.hasAttribute("data-watermark-removed")) {
              if (imageViewerInterval) {
                clearInterval(imageViewerInterval);
                imageViewerInterval = null;
              }
            }
          } else {
            debugLog("大图查看器：等待图片加载完成...");
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
              if (
                node.querySelector("#imageViewerWrapper") ||
                node.querySelector(SELECTORS.imageViewerSimple)
              ) {
                debugLog("检测到大图模态框打开");

                // 首次处理
                setTimeout(() => {
                  processWatermark(true);
                }, 100);

                // 启动定期检查，确保图片完全加载后能被处理
                if (!imageViewerInterval) {
                  debugLog("启动大图查看器定期检查机制");
                  imageViewerInterval = setInterval(
                    processImageViewerImages,
                    300
                  );

                  // 设置最长检查时间为5秒
                  setTimeout(() => {
                    if (imageViewerInterval) {
                      clearInterval(imageViewerInterval);
                      imageViewerInterval = null;
                      debugLog("大图查看器定期检查超时，停止检查");
                    }
                  }, 5000);
                }
              }
            }
          });
        }

        // 也检查属性变化，特别是图片的src属性变化
        if (
          mutation.type === "attributes" &&
          mutation.target.tagName === "IMG"
        ) {
          if (
            mutation.target.matches(SELECTORS.imageViewerSimple) &&
            mutation.target.closest("#imageViewerWrapper")
          ) {
            debugLog("大图查看器：图片src属性发生变化，重新处理");
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
      attributeFilter: ["src", "srcset"],
    });

    debugLog("大图查看器监听器已启动，增强版支持");
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
        if (mutation.type === "childList" && mutation.addedNodes.length) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              // 元素节点
              // 检查是否包含需要处理的图片
              if (
                node.matches(
                  SELECTORS.imageButton + ", " + SELECTORS.imageViewerSimple
                ) ||
                node.querySelector(
                  SELECTORS.imageButton + ", " + SELECTORS.imageViewerSimple
                ) ||
                node.id === "imageViewerWrapper"
              ) {
                needProcess = true;
              }
            }
          });
        } else if (
          mutation.type === "attributes" &&
          mutation.target.tagName === "IMG"
        ) {
          // 图片属性变化时也需要处理
          if (
            mutation.target.matches(
              SELECTORS.imageButton + ", " + SELECTORS.imageViewerSimple
            )
          ) {
            needProcess = true;
          }
        }
      });

      // 如果需要处理且距离上次处理时间足够长
      if (needProcess && now - lastProcessTime > MIN_PROCESS_INTERVAL) {
        debugLog("检测到图片变化，触发水印处理");
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
      attributeFilter: [
        "src",
        "srcset",
        "data-material-type",
        "class",
        "data-button-name",
        "alt",
      ],
    });

    debugLog("页面变化监听器已启动");
    return observer;
  }

  // 拦截XMLHttpRequest，在AJAX请求完成后执行处理
  function interceptAjaxRequests() {
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.send = function (body) {
      this.addEventListener("load", function () {
        try {
          // 检查是否是花瓣网的API请求
          if (
            this.responseURL &&
            this.responseURL.includes("huaban.com") &&
            (this.responseURL.includes("/pins/") ||
              this.responseURL.includes("/api/") ||
              this.responseURL.includes("/similar/") ||
              this.responseURL.includes("/image/"))
          ) {
            // 图片查看相关请求
            debugLog("检测到AJAX请求完成:", this.responseURL);
            // 延迟执行，确保数据已渲染到页面
            setTimeout(() => {
              processWatermark();
            }, 300);
          }
        } catch (error) {
          console.error("AJAX拦截器错误:", error);
        }
      });

      return originalSend.apply(this, arguments);
    };

    debugLog("AJAX请求拦截器已启动");
  }

  // 拦截fetch请求
  function interceptFetchRequests() {
    const originalFetch = window.fetch;

    window.fetch = function (input, init) {
      return originalFetch.apply(this, arguments).then((response) => {
        try {
          const url = typeof input === "string" ? input : input.url;
          if (
            url &&
            url.includes("huaban.com") &&
            (url.includes("/pins/") ||
              url.includes("/api/") ||
              url.includes("/similar/") ||
              url.includes("/image/"))
          ) {
            // 图片查看相关请求
            debugLog("检测到fetch请求完成:", url);
            // 延迟执行，确保数据已渲染到页面
            setTimeout(() => {
              processWatermark();
            }, 300);
          }
        } catch (error) {
          console.error("fetch拦截器错误:", error);
        }
        return response;
      });
    };

    debugLog("fetch请求拦截器已启动");
  }

  // 拦截图片点击事件，提前处理大图URL
  function interceptImageClicks() {
    // 使用事件委托监听所有图片点击
    document.addEventListener(
      "click",
      function (e) {
        const config = getConfig();

        // 精准匹配：使用 data-button-name="查看大图" 属性
        const img = e.target.closest(SELECTORS.imageButton.split("[src*")[0]);
        if (img && img.src.includes("gd-hbimg-edge.huabanimg.com")) {
          // 检查是否为官方自营素材（新增 title 选择器，满足任一条件即判定）
          const isOfficialMaterial =
            // 原有条件：.fgsjNg46 元素包含“官方自营”文本
            Array.from(document.querySelectorAll(".fgsjNg46")).some(
              (element) =>
                element.textContent && element.textContent.includes("官方自营")
            ) ||
            // 新增条件：存在 title="来自官方自营" 的元素
            document.querySelectorAll('[title="来自官方自营"]').length > 0;

          if (isOfficialMaterial) {
            debugLog("检测到官方自营素材图片点击:", img.src);

            if (config.enableRemoveWatermark) {
              // 提前保存原始URL
              saveOriginalUrl(img);

              // 预生成大图URL
              const watermarkRegex =
                /(https?:\/\/gd-hbimg-edge\.huabanimg\.com)\/([^\/?]+)/;
              if (
                watermarkRegex.test(img.src) &&
                !img.src.includes("/small/")
              ) {
                const baseImageKey = img.src
                  .match(watermarkRegex)[2]
                  .split("_")[0];
                const largeImageUrl = `https://gd-hbimg-edge.huabanimg.com/small/${baseImageKey}`;
                debugLog("预生成VIP大图URL:", largeImageUrl);
              }
            } else {
              // 如果功能已关闭，确保使用原始URL
              restoreOriginalUrl(img);
            }
          } else {
            debugLog("检测到非官方自营素材图片点击，跳过预处理:", img.src);
            // 对于非官方自营素材，确保使用原始URL
            restoreOriginalUrl(img);
          }

          // 延迟一点时间，确保大图模态框已打开
          setTimeout(() => {
            processWatermark(true);
          }, 200);
        }
      },
      true
    );

    debugLog("图片点击事件拦截器已启动");
  }

  // 拦截拖拽和右键下载事件，移除图片后缀参数
  function interceptDragAndDownload() {
    // 监听拖拽开始事件
    document.addEventListener("dragstart", function (e) {
      const img = e.target;
      if (
        img.tagName === "IMG" &&
        img.src.includes("gd-hbimg-edge.huabanimg.com")
      ) {
        // 检查是否为需要处理的图片类型
        if (
          img.matches(SELECTORS.imageButton.split("[src*")[0]) ||
          img.closest("#imageViewerWrapper") ||
          img.matches(SELECTORS.imageViewerSimple) ||
          // 新增：支持预览图片（a标签内的img标签）
          (img.closest("a") &&
            img.closest("a").querySelector('span[style*="display: none"]'))
        ) {
          // 检查拖拽下载功能是否启用
          const config = getConfig();
          if (!config.enableDragDownload) {
            debugLog("拖拽下载功能已禁用，跳过处理");
            return;
          }

          debugLog("检测到图片拖拽开始:", img.src);

          // 移除后缀参数，保存为PNG格式
          const cleanUrl = removeImageSuffixParams(img.src);
          if (cleanUrl !== img.src) {
            debugLog("拖拽时移除后缀参数，新URL:", cleanUrl);

            // 设置拖拽数据为处理后的URL
            e.dataTransfer.setData("text/uri-list", cleanUrl);
            e.dataTransfer.setData("text/plain", cleanUrl);

            // 设置文件名：优先使用alt属性，如果没有则使用URL生成的文件名
            const fileName = getFileNameFromAlt(img);
            e.dataTransfer.setData(
              "DownloadURL",
              `image/png:${fileName}:${cleanUrl}`
            );
            // 记录拖拽事件到历史（浏览器无法判断是否最终完成保存，但可作为“拖拽尝试”记录）
            try {
              const w = (img && img.naturalWidth) || 0;
              const h = (img && img.naturalHeight) || 0;
              // 判断是否为图片详情页，是的话使用当前页面URL作为originHref
              // 根据花瓣网实际URL结构，使用'pins'识别图片详情页
              const isDetailPage = window.location.pathname.includes("/pins/");
              const pa = img.closest("a");
              const originHref = isDetailPage
                ? window.location.href
                : pa
                ? pa.href
                : "";
              addDownloadHistoryItem({
                fileName,
                url: cleanUrl,
                pageUrl: location.href,
                originHref,
                official: isOfficialMaterial(),
                width: w,
                height: h,
                action: "drag",
              });
              // 后台缓存原图，提升后续历史视图命中率
              try {
                fetchImageAsDataURL(cleanUrl, (dataUrl) => {
                  if (dataUrl) cachePut(cleanUrl, dataUrl);
                });
              } catch (_) {}
            } catch (err) {
              console.error("记录拖拽历史失败:", err);
            }
          }
        }
      }
    });

    // 监听右键菜单事件 - 使用GM_download API直接下载
    document.addEventListener("contextmenu", function (e) {
      const img = e.target;
      if (
        img.tagName === "IMG" &&
        img.src.includes("gd-hbimg-edge.huabanimg.com")
      ) {
        // 检查是否为需要处理的图片类型
        if (
          img.matches('img[data-button-name="查看大图"]') ||
          img.closest("#imageViewerWrapper") ||
          img.matches('img.vYzIMzy2[alt="查看图片"]') ||
          // 新增：支持预览图片（a标签内的img标签）
          (img.closest("a") &&
            img.closest("a").querySelector('span[style*="display: none"]'))
        ) {
          // 检查右键下载功能是否启用
          const config = getConfig();
          if (!config.enableRightClickDownload) {
            debugLog("右键下载功能已禁用，跳过处理");
            return;
          }

          debugLog("检测到图片右键菜单，使用GM_download下载:", img.src);

          // 移除后缀参数，获取干净的URL
          const cleanUrl = removeImageSuffixParams(img.src);
          if (cleanUrl !== img.src) {
            debugLog("处理后的下载URL:", cleanUrl);

            // 阻止默认的右键菜单行为
            e.preventDefault();

            // 使用GM_download API直接下载处理后的图片
            // 注意：GM_download需要用户确认，所以这里使用异步方式
            setTimeout(() => {
              try {
                // 使用alt属性作为文件名，如果没有alt则使用默认文件名
                const fileName = getFileNameFromAlt(img) + ".png";

                // 使用GM_download下载图片
                // 注意：GM_download会弹出下载确认对话框
                GM_download({
                  url: cleanUrl,
                  name: fileName,
                  onload: function () {
                    console.log("图片下载成功:", fileName);
                    try {
                      const w = (img && img.naturalWidth) || 0;
                      const h = (img && img.naturalHeight) || 0;
                      // 判断是否为图片详情页，是的话使用当前页面URL作为originHref
                      // 根据花瓣网实际URL结构，使用'pins'识别图片详情页
                      const isDetailPage =
                        window.location.pathname.includes("/pins/");
                      const pa = img.closest("a");
                      const originHref = isDetailPage
                        ? window.location.href
                        : pa
                        ? pa.href
                        : "";
                      addDownloadHistoryItem({
                        fileName: getFileNameFromAlt(img),
                        url: cleanUrl,
                        pageUrl: location.href,
                        originHref,
                        official: isOfficialMaterial(),
                        width: w,
                        height: h,
                        action: "download",
                      });
                      // 下载完成后立即缓存原图
                      try {
                        fetchImageAsDataURL(cleanUrl, (dataUrl) => {
                          if (dataUrl) cachePut(cleanUrl, dataUrl);
                        });
                      } catch (_) {}
                    } catch (e) {
                      console.error("记录下载历史失败:", e);
                    }
                  },
                  onerror: function (error) {
                    console.error("图片下载失败:", error);
                    // 如果GM_download失败，尝试备用方案
                    fallbackDownload(cleanUrl, fileName, img);
                  },
                });
              } catch (error) {
                console.error("GM_download调用失败:", error);
                // 备用下载方案
                fallbackDownload(
                  cleanUrl,
                  getFileNameFromAlt(img) + ".png",
                  img
                );
              }
            }, 100);
          }
        }
      }
    });

    // 备用下载方案：创建隐藏的下载链接
    function fallbackDownload(url, fileName, img) {
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        console.log("备用下载方案执行成功");
        try {
          const w = (img && img.naturalWidth) || 0;
          const h = (img && img.naturalHeight) || 0;
          const pa = img ? img.closest("a") : null;
          const originHref = pa ? pa.href : "";
          addDownloadHistoryItem({
            fileName: getFileNameFromAlt(img),
            url,
            pageUrl: location.href,
            originHref,
            official: isOfficialMaterial(),
            width: w,
            height: h,
            action: "download",
          });
          // 备用下载后也进行缓存
          try {
            fetchImageAsDataURL(url, (dataUrl) => {
              if (dataUrl) cachePut(url, dataUrl);
            });
          } catch (_) {}
        } catch (e) {
          console.error("记录下载历史失败:", e);
        }
      } catch (error) {
        console.error("备用下载方案也失败:", error);
        // 最后的手段：在新标签页打开图片
        window.open(url, "_blank");
      }
    }

    debugLog("拖拽和右键下载拦截器已启动");
  }

  // 获取清理后的文件名（移除后缀参数，使用PNG扩展名）

  // 根据alt属性或span标签生成文件名，如果没有则使用默认文件名
  function getFileNameFromAlt(img) {
    // 仅使用alt属性生成文件名
    const altText = img.alt || "";

    // 如果alt属性有内容且不是默认的"查看图片"，则使用alt作为文件名
    if (altText && altText.trim() && altText !== "查看图片") {
      // 清理alt文本，移除特殊字符，只保留字母、数字、中文和空格
      let cleanAlt = altText.replace(/[^\w\u4e00-\u9fa5\s]/g, "").trim();

      // 如果清理后的文本不为空，则使用alt作为文件名
      if (cleanAlt) {
        // 限制文件名长度，避免过长
        if (cleanAlt.length > 40) {
          cleanAlt = cleanAlt.substring(0, 40);
        }

        // 添加.png扩展名
        return cleanAlt;
      }
    }

    // 如果alt属性无效，返回默认名称
    return "未命名";
  }

  // 创建配置界面（左侧导航 / 右侧内容）
  function createConfigUI() {
    const config = getConfig();

    // 检查是否已存在配置面板
    const existingPanel = document.getElementById("huabanConfig");
    if (existingPanel) {
      existingPanel.remove();
      return;
    }

    // 创建主容器
    const container = document.createElement("div");
    container.id = "huabanConfig";
    // 使用 Tailwind 工具类替代常规样式
    container.className = 
      "fixed inset-0 bg-black/30 flex items-center justify-center z-[115] backdrop-blur-sm";
    
    // 禁止页面滚动
    document.body.style.overflow = 'hidden';

    // 创建卡片（更宽以容纳侧边栏）
    const card = document.createElement("div");
    // 固定高度布局，确保左侧导航与右侧内容高度一致
    card.className =
      "bg-white rounded-xl shadow-[0_8px_25px_rgba(0,0,0,0.15)] w-[900px] h-[680px] max-w-[96vw] flex flex-col overflow-hidden";
    card.style.fontFamily =
      '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

    // 顶部标题条 已移除（界面改为侧边栏标题与底部版本信息）

    // 侧边栏与主内容容器
    const bodyWrap = document.createElement("div");
    bodyWrap.className = "flex flex-1 min-h-0";

    const sidebar = document.createElement("div");
    // 侧栏采用纵向布局，底部显示版本号
    sidebar.className =
      "w-[150px] p-3 bg-slate-50 box-border flex flex-col justify-between overflow-hidden";

    // 左侧导航按钮
    const makeNavBtn = (id, text) => {
      const b = document.createElement("button");
      b.id = id;
      b.textContent = text;
      // 简约按钮样式：基础布局 + 简单过渡
      b.className =
        "block w-full text-left p-3 mb-2 rounded-lg bg-transparent cursor-pointer text-slate-700 text-sm transition-all duration-150 border-none";
      // 简约hover效果
      b.addEventListener("mouseenter", () => {
        if (!b.dataset.active) b.style.backgroundColor = "#e9edf3ff";
      });
      b.addEventListener("mouseleave", () => {
        if (!b.dataset.active) b.style.backgroundColor = "transparent";
      });
      return b;
    };

    // 切换激活态样式
    function setActive(activeId) {
      const btns = sidebar.querySelectorAll('button[id^="cfg-tab-"]');
      btns.forEach((b) => {
        if (b.id === activeId) {
          b.dataset.active = "1";
          // 极简选中状态：仅保留背景色和文字颜色
          b.style.backgroundColor = "rgb(255, 255, 255)";
          b.style.color = "rgb(255, 40, 75)";
        } else {
          delete b.dataset.active;
          b.style.backgroundColor = "transparent";
          b.style.color = "rgb(51, 65, 85)";
        }
      });
    }

    const navSettings = makeNavBtn("cfg-tab-settings", "⚙️ 设置选项");
    const navUsage = makeNavBtn("cfg-tab-usage", "📖 使用说明");
    const navUpdate = makeNavBtn("cfg-tab-update", "📝 更新记录");
    const navTwikoo = makeNavBtn("cfg-tab-twikoo", "🤝 网友互助");
    const navHistory = makeNavBtn("cfg-tab-history", "📦 历史下载");
    const navThanks = makeNavBtn("cfg-tab-thanks", "🙏 致谢名单");
    const navUserProfile = makeNavBtn("cfg-tab-user", "👤 个人信息");

    const navTop = document.createElement("div");
    navTop.className = "flex flex-col gap-2";
    navTop.appendChild(navSettings);
    navTop.appendChild(navUsage);
    navTop.appendChild(navUpdate);
    navTop.appendChild(navTwikoo);
    navTop.appendChild(navHistory);
    navTop.appendChild(navThanks);
    navTop.appendChild(navUserProfile);
    sidebar.appendChild(navTop);

    // 版本信息放在侧栏底部，参考示例布局
    const versionEl = document.createElement("div");
    versionEl.className = "text-xs text-slate-400 p-3";
    versionEl.textContent = `版本 v${getScriptVersion()}`;
    sidebar.appendChild(versionEl);

    const main = document.createElement("div");
    main.id = "hb-config-main-settings"; // 默认显示设置面板，所以默认id为settings
    // 主区使用滚动容器以适配内嵌大型面板（如历史、聊天）
    main.className = "flex-1 m-4 overflow-auto min-h-0 box-border";

    bodyWrap.appendChild(sidebar);
    bodyWrap.appendChild(main);

    // 监听嵌入历史面板关闭事件，恢复侧栏选中为设置
    main.addEventListener("hb:historyClosed", () => {
      try {
        setActive("cfg-tab-settings");
        renderSettings();
      } catch (e) {}
    });

    // 添加到卡片（不再渲染顶部 header）
    card.appendChild(bodyWrap);
    container.appendChild(card);

    // 添加到页面
    document.body.appendChild(container);

    // 导航交互：渲染不同的面板
    function renderSettings() {
      // 设置主容器的 id，包含所属分类
      main.id = "hb-config-main-settings";
      // 重置所有可能受致谢名单影响的样式
      main.style.padding = "16px";
      main.style.margin = "0";
      main.style.background = "none";
      main.style.borderRadius = "0";
      main.innerHTML = "";
      // 将原来的 content 区域内容渲染到 main
      main.innerHTML = "";
      // switchesSection, colorSettings, actions 会被插入后
      main.appendChild(switchesSection);
      main.innerHTML += colorSettings;
      main.appendChild(hotkeysSettings);
      main.appendChild(actions);
      
      // 初始化时根据开关状态显示或隐藏颜色选择器
      const colorSettingsContainer = document.getElementById("colorSettingsContainer");
      const enableCustomSwitch = document.getElementById("enableCustomSwitch");
      if (colorSettingsContainer && enableCustomSwitch) {
        colorSettingsContainer.style.display = enableCustomSwitch.checked ? "block" : "none";
      }
    }

    // 更新记录在主区域嵌入 Feishu（iframe），若无法显示提供外链
    function renderUpdate() {
      // 设置主容器的 id，包含所属分类
      main.id = "hb-config-main-update";
      main.innerHTML = "";
      // 重置所有可能受致谢名单影响的样式
      main.style.padding = "0";
      main.style.margin = "0";
      main.style.background = "none";
      main.style.borderRadius = "0";
      main.style.position = "relative";
      const feishuUrl = 
        "https://ai-chimo.feishu.cn/wiki/EcTAwKw2bifqGjku9pzccaVcnId";
      const iframe = document.createElement("iframe");
      iframe.src = feishuUrl;
      iframe.className = "w-full h-full min-h-[480px] border-0 rounded-lg";
      iframe.allow = "fullscreen; clipboard-write";
      const fallback = document.createElement("div");
      fallback.className = 
        "text-sm text-center absolute w-full bottom-0 left-1/2 -translate-x-1/2 no-underline bg-white px-4 py-2 rounded shadow-md";
      fallback.innerHTML = `若嵌入内容无法显示，请 <a href="${feishuUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500">在新标签页打开更新记录</a>（飞书文档）`;
      main.appendChild(iframe);
      main.appendChild(fallback);
    }

    // 使用说明在主区域嵌入 Feishu（iframe），若无法显示提供外链
    function renderUsage() {
      // 设置主容器的 id，包含所属分类
      main.id = "hb-config-main-usage";
      main.innerHTML = "";
      // 重置所有可能受致谢名单影响的样式
      main.style.padding = "0";
      main.style.margin = "0";
      main.style.background = "none";
      main.style.borderRadius = "0";
      main.style.position = "relative";
      const feishuUrl = 
        "https://ai-chimo.feishu.cn/wiki/E9SEwhoMmiv2CkkC1VgcAbRTnW3";
      const iframe = document.createElement("iframe");
      iframe.src = feishuUrl;
      iframe.className = "w-full h-full min-h-[480px] border-0 rounded-lg";
      iframe.allow = "fullscreen; clipboard-write";
      const fallback = document.createElement("div");
      fallback.className = 
        "text-sm text-center absolute w-full bottom-0 left-1/2 -translate-x-1/2 no-underline bg-white px-4 py-2 rounded shadow-md";
      fallback.innerHTML = `若嵌入内容无法显示，请 <a href="${feishuUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500">在新标签页打开使用说明</a>（飞书文档）`;
      main.appendChild(iframe);
      main.appendChild(fallback);
    }

    // 导航按钮事件（同时设置激活态）
    navSettings.addEventListener("click", () => {
      setActive("cfg-tab-settings");
      renderSettings();
    });
    navUsage.addEventListener("click", () => {
      setActive("cfg-tab-usage");
      renderUsage();
    });
    navUpdate.addEventListener("click", () => {
      setActive("cfg-tab-update");
      renderUpdate();
    });

    //个人信息
    function renderUserProfile() {
      // 获取主容器元素（通过class或其他方式，而不是固定id）
      const main = document.querySelector('.flex-1.m-4.overflow-hidden.min-h-0.box-border');
      if (!main) return;
      
      // 设置主容器的 id，包含所属分类
      main.id = "hb-config-main-user";
      main.innerHTML = 
        '<div class="loading"><i class="fa fa-spinner fa-spin"></i> 加载个人信息中...</div>';
      // 重置所有可能受致谢名单影响的样式
      main.style.padding = "16px";
      main.style.margin = "0";
      main.style.background = "none";
      main.style.borderRadius = "0";
      main.style.position = "relative";

      fetch("https://huaban.com/v3/users/me")
        .then((response) => response.json())
        .then((data) => {
          const createdAt = new Date(
            data.created_at * 1000
          ).toLocaleDateString();
          main.innerHTML = `
                <div class="user-profile">
                    <div class="profile-header">
                        <img src="${data.avatar.url}" alt="${
            data.username
          }" class="avatar">
                        <div class="profile-info">
                            <h3>${data.username}</h3>
                            <p class="job">${
                              data.profile.job || "未填写职业信息"
                            }</p>
                            <p class="joined">注册时间: ${createdAt}</p>
                        </div>
                    </div>
                    <div class="profile-stats">
                        <div class="stat-item">
                            <span class="stat-value">${data.board_count}</span>
                            <span class="stat-label">画板</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${data.pin_count}</span>
                            <span class="stat-label">采集</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${
                              data.follower_count
                            }</span>
                            <span class="stat-label">粉丝</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${
                              data.following_count
                            }</span>
                            <span class="stat-label">关注</span>
                        </div>
                    </div>
            </div>
        `;
        })
        .catch((error) => {
          main.innerHTML =
            '<div class="error-message"><i class="fa fa-exclamation-circle"></i> 获取个人信息失败，请稍后重试</div>';
          console.error("获取花瓣用户信息失败:", error);
        });
    }
    // 在主区域渲染致谢名单（iframe）
    function renderThanksPanel() {
      // 设置主容器的 id，包含所属分类
      main.id = "hb-config-main-thanks";
      main.style.padding = "0px";
      main.style.margin = "16px";
      main.style.background = "linear-gradient(rgb(255, 198, 196), rgba(255, 198, 196, 0.95) 50%, rgb(255, 255, 255) 90%)";
      main.style.borderRadius = "6px";
      main.innerHTML = "";
      main.innerHTML = "";
      const iframe = document.createElement("iframe");
      iframe.src = 
        "https://xiaolongmr.github.io/tampermonkey-scripts/%E8%8A%B1%E7%93%A3%E5%8E%BB%E6%B0%B4%E5%8D%B0/%E8%87%B4%E8%B0%A2%E5%90%8D%E5%8D%95.html";
      iframe.className = 
        "block mx-auto w-[420px] h-[585px] border-0 rounded-lg";
      main.appendChild(iframe);
    }

    // 在主区域渲染网友互助区（Twikoo）
    // 先暂时移除这个函数，后面重新创建
    /* function renderTwikooPanel() {
      // 设置主容器的 id，包含所属分类
      main.id = "hb-config-main-twikoo";
      // 重置所有可能受致谢名单影响的样式
      main.style.padding = "16px";
      main.style.margin = "0";
      main.style.background = "none";
      main.style.borderRadius = "0";
      main.innerHTML = "";
      main.innerHTML = "";
      const title = document.createElement("div");
      title.className = "flex items-center justify-between mb-3";
      title.innerHTML = `<h3 class="m-0 text-base text-slate-700">网友互助区</h3><div class="text-xs text-slate-400">通过 Twikoo 聊天与其他用户交流</div>`;
      const wrapper = document.createElement("div");
      wrapper.className = "flex-1 flex flex-col gap-3 h-full min-h-0";
      
      // 创建素材网站列表区域
      const materialSitesSection = document.createElement("div");
      materialSitesSection.className = "bg-white rounded-lg p-3 box-border";
      const materialSitesTitle = document.createElement("div");
      // materialSitesTitle.className = "flex items-center justify-between mb-3";
      // materialSitesTitle.innerHTML = `<h4 class="m-0 text-sm text-slate-700">素材网站推荐</h4><div class="text-xs text-slate-400">精选设计素材网站</div>`;
      const materialSitesList = document.createElement("div");
      materialSitesList.className = "text-sm text-slate-600 p-4 text-center";
      materialSitesSection.appendChild(materialSitesTitle);
      materialSitesSection.appendChild(materialSitesList);
      
      // 显示迁移说明文字
      materialSitesList.innerHTML = "📁 素材网站推荐已迁移至<a href='https://huaban.com/pages/sucai' target='_blank' class='text-blue-500 hover:underline'>花瓣素材</a>页面，欢迎访问查看更多优质素材资源！";
      return;
              const siteItem = document.createElement("a");
              siteItem.href = site.href;
              siteItem.target = "_blank";
              siteItem.rel = "noopener noreferrer";
              siteItem.className = "flex items-center gap-2 p-2 border rounded-md hover:bg-slate-50 transition-colors text-sm";
              
              const siteLogo = document.createElement("img");
              siteLogo.src = site.logoSrc;
              siteLogo.alt = site.alt;
              siteLogo.className = "w-6 h-6 object-contain";
              
              const siteInfo = document.createElement("div");
              siteInfo.className = "flex-1 min-w-0";
              
              const siteTitle = document.createElement("div");
              siteTitle.className = "font-medium text-slate-700 truncate";
              siteTitle.textContent = site.title;
              
              const siteTip = document.createElement("div");
              siteTip.className = "text-xs text-slate-500 truncate";
              siteTip.textContent = site.tip;
              
              const sitePoints = document.createElement("div");
              sitePoints.className = "text-xs text-amber-600";
              sitePoints.textContent = site.jifen_tip;
              
              siteInfo.appendChild(siteTitle);
              siteInfo.appendChild(siteTip);
              siteItem.appendChild(siteLogo);
              siteItem.appendChild(siteInfo);
              siteItem.appendChild(sitePoints);
              materialSitesList.appendChild(siteItem);
              });
      } catch (error) {
        console.error("渲染素材网站列表失败:", error);
        materialSitesList.innerHTML = `<div class="col-span-2 text-center text-slate-500 py-4">无法加载素材网站列表</div>`;
      }
      
      const commentWrap = document.createElement("div");
      commentWrap.id = "tcomment";
      commentWrap.className = 
        "flex-1 min-h-0 overflow-auto bg-white rounded-lg p-3 box-border";
      wrapper.appendChild(materialSitesSection);
      wrapper.appendChild(commentWrap);
      main.appendChild(title);
      main.appendChild(wrapper);

      // 动态加载Twikoo并初始化（若未加载）
      try {
        if (!document.querySelector('link[href*="twikoo"]')) {
          const twikooCss = document.createElement("link");
          twikooCss.rel = "stylesheet";
          twikooCss.href =
            "https://cdn.jsdelivr.net/npm/twikoo@1.6.44/dist/twikoo.css";
          document.head.appendChild(twikooCss);
        }
        if (typeof twikoo === "undefined") {
          const twikooScript = document.createElement("script");
          twikooScript.src =
            "https://cdn.jsdelivr.net/npm/twikoo@1.6.44/dist/twikoo.nocss.js";
          twikooScript.onload = function () {
            try {
              if (typeof twikoo !== "undefined") {
                twikoo.init({
                  envId: "https://twikookaishu.z-l.top",
                  el: "#tcomment",
                  path: "/huaban-helper-all",
                });
              }
            } catch (e) {
              console.error(e);
            }
          };
          document.head.appendChild(twikooScript);
        } else {
          try {
            twikoo.init({
              envId: "https://twikookaishu.z-l.top",
              el: "#tcomment",
              path: "/huaban-helper-all",
            });
          } catch (e) {}
        }
      } catch (e) {
        console.error("初始化 Twikoo 失败", e);
      }
    } */
    
    // 重新创建修改后的renderTwikooPanel函数
    function renderTwikooPanel() {
      // 设置主容器的 id，包含所属分类
      main.id = "hb-config-main-twikoo";
      // 重置所有可能受致谢名单影响的样式
      main.style.padding = "16px";
      main.style.margin = "0";
      main.style.background = "none";
      main.style.borderRadius = "0";
      main.innerHTML = "";
      const title = document.createElement("div");
      title.className = "flex items-center justify-between mb-3";
      title.innerHTML = `<h3 class="m-0 text-base text-slate-700">网友互助区</h3><div class="text-xs text-slate-400">通过 Twikoo 聊天与其他用户交流</div>`;
      const wrapper = document.createElement("div");
      wrapper.className = "flex-1 flex flex-col gap-3 h-full min-h-0";
      
      // 创建说明文字区域
      const materialSitesSection = document.createElement("div");
      materialSitesSection.className = "bg-white rounded-lg p-3 box-border";
      const materialSitesTitle = document.createElement("div");
      const materialSitesList = document.createElement("div");
      materialSitesList.className = "text-sm text-slate-600 leading-relaxed";
      materialSitesList.innerHTML = "公众号文章开了广告，朋友们有空的话每天可点点广告，收益将用于购买素材解析网站的积分，帮使用脚本的朋友免费下载素材，可下载的素材<a href='https://huaban.com/pages/sucai' target='_blank' class='text-blue-500 hover:underline'>点我进入查看</a>，可在此处留言，看到会帮忙下载的，积分用完为止！";
      materialSitesSection.appendChild(materialSitesTitle);
      materialSitesSection.appendChild(materialSitesList);
      
      const commentWrap = document.createElement("div");
      commentWrap.id = "tcomment";
      commentWrap.className = 
        "flex-1 min-h-0 overflow-auto bg-white rounded-lg p-3 box-border";
      wrapper.appendChild(materialSitesSection);
      wrapper.appendChild(commentWrap);
      main.appendChild(title);
      main.appendChild(wrapper);

      // 动态加载Twikoo并初始化（若未加载）
      try {
        if (!document.querySelector('link[href*="twikoo"]')) {
          const twikooCss = document.createElement("link");
          twikooCss.rel = "stylesheet";
          twikooCss.href =
            "https://cdn.jsdelivr.net/npm/twikoo@1.6.44/dist/twikoo.css";
          document.head.appendChild(twikooCss);
        }
        if (typeof twikoo === "undefined") {
          const twikooScript = document.createElement("script");
          twikooScript.src =
            "https://cdn.jsdelivr.net/npm/twikoo@1.6.44/dist/twikoo.nocss.js";
          twikooScript.onload = function () {
            try {
              if (typeof twikoo !== "undefined") {
                twikoo.init({
                  envId: "https://twikookaishu.z-l.top",
                  el: "#tcomment",
                  path: "/huaban-helper-all",
                });
              }
            } catch (e) {
              console.error(e);
            }
          };
          document.head.appendChild(twikooScript);
        } else {
          try {
            twikoo.init({
              envId: "https://twikookaishu.z-l.top",
              el: "#tcomment",
              path: "/huaban-helper-all",
            });
          } catch (e) {}
        }
      } catch (e) {
        console.error("初始化 Twikoo 失败", e);
      }
    }

    navTwikoo.addEventListener("click", (e) => {
      e.preventDefault();
      setActive("cfg-tab-twikoo");
      renderTwikooPanel();
    });
    navHistory.addEventListener("click", (e) => {
      e.preventDefault();
      setActive("cfg-tab-history");
      // 设置主容器的 id，包含所属分类
      main.id = "hb-config-main-history";
      showDownloadHistory(main);
    });
    navThanks.addEventListener("click", (e) => {
      e.preventDefault();
      setActive("cfg-tab-thanks");
      renderThanksPanel();
    });
    navUserProfile.addEventListener("click", () => {
      setActive("cfg-tab-user");
      renderUserProfile();
    });

    // 初始显示设置面板并设置激活态
    // NOTE: moved below after switchesSection/colorSettings/actions are created
    const showThanksList = () => {
      try {
        // 创建模态框
        const modal = document.createElement("div");
        modal.className =
          "fixed inset-0 bg-black/30 flex items-center justify-center z-[9999] backdrop-blur-sm";
        
        // 禁止页面滚动
        document.body.style.overflow = 'hidden';

        // 创建容器
        const container = document.createElement("div");
        container.className =
          "relative w-[420px] h-[585px] max-w-[95vw] max-h-[90vh] overflow-hidden";

        // 创建iframe嵌套致谢名单HTML文件
        const iframe = document.createElement("iframe");
        iframe.src =
          "https://xiaolongmr.github.io/tampermonkey-scripts/%E8%8A%B1%E7%93%A3%E5%8E%BB%E6%B0%B4%E5%8D%B0/%E8%87%B4%E8%B0%A2%E5%90%8D%E5%8D%95.html";
        iframe.className =
          "absolute inset-0 w-full h-full border-0 outline-none";
        iframe.allow = "autoplay; clipboard-write";
        iframe.frameBorder = "0";

        // 创建关闭按钮
        const closeButton = document.createElement("div");
        closeButton.className =
          "absolute right-2.5 top-2.5 w-7 h-7 bg-black/10 rounded-full flex items-center justify-center select-none z-10 cursor-pointer";
        // 创建SVG关闭图标
        const closeIcon = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg"
        );
        closeIcon.setAttribute("width", "16");
        closeIcon.setAttribute("height", "16");
        closeIcon.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        closeIcon.setAttribute("viewBox", "0 0 1024 1024");
        closeIcon.setAttribute("fill", "white");

        // 创建路径
        const path = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        path.setAttribute(
          "d",
          "M198.1 267.7l75.4-75.4 576.3 576.3-75.4 75.4-576.3-576.3zm576.4-69.3l75.4 75.4-580.7 580.8-75.4-75.4 580.7-580.8z"
        );

        // 组装SVG图标
        closeIcon.appendChild(path);
        closeButton.appendChild(closeIcon);
        closeButton.addEventListener("click", () => {
          document.body.removeChild(modal);
          // 恢复页面滚动
          document.body.style.overflow = 'auto';
        });
        closeButton.addEventListener("mouseenter", () => {
          closeButton.style.backgroundColor = "rgba(0, 0, 0, 0.2)";
        });
        closeButton.addEventListener("mouseleave", () => {
          closeButton.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
        });

        // 组装模态框
        container.appendChild(iframe);
        container.appendChild(closeButton);
        modal.appendChild(container);

        // 点击模态框背景关闭
        modal.addEventListener("click", (e) => {
          if (e.target === modal) {
            document.body.removeChild(modal);
            // 恢复页面滚动
            document.body.style.overflow = 'auto';
          }
        });

        // 添加到文档
        document.body.appendChild(modal);
      } catch (error) {
        console.error("显示致谢名单失败:", error);
        alert("无法加载致谢名单，请稍后再试");
      }
    };

    // 延迟添加事件监听器，确保DOM已渲染
    setTimeout(() => {
      const thanksListLink = document.getElementById("thanksListLink");
      if (thanksListLink) {
        thanksListLink.addEventListener("click", (e) => {
          e.preventDefault();
          showThanksList();
        });
      }
    }, 0);

    // 卡片内容
    const content = main;

    // 启用开关区域
    const switchesSection = document.createElement("div");
    switchesSection.className = "mb-4";

    // 自定义背景色开关
    const enableCustomSection = document.createElement("div");
    enableCustomSection.className =
      "flex items-center justify-between mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200";

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
                <input type="checkbox" id="enableCustomSwitch" ${
                  config.enableCustom ? "checked" : ""
                }
                       style="position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 3;">
                <span style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: ${config.enableCustom ? "#4ade80" : "#e2e8f0"};
                    border-radius: 10px;
                    transition: background 0.2s ease;
                    z-index: 1;
                "></span>
                <span style="
                    position: absolute;
                    width: 16px;
                    height: 16px;
                    left: ${config.enableCustom ? "22px" : "2px"};
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
    const enableWatermarkSection = document.createElement("div");
    enableWatermarkSection.className =
      "flex items-center justify-between mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200";

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
                <input type="checkbox" id="enableWatermarkSwitch" ${
                  config.enableRemoveWatermark ? "checked" : ""
                }
                       style="position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 3;">
                <span style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: ${
                      config.enableRemoveWatermark ? "#ff6b6b" : "#e2e8f0"
                    };
                    border-radius: 10px;
                    transition: background 0.2s ease;
                    z-index: 1;
                "></span>
                <span style="
                    position: absolute;
                    width: 16px;
                    height: 16px;
                    left: ${config.enableRemoveWatermark ? "22px" : "2px"};
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
    const enableDragSection = document.createElement("div");
    enableDragSection.className =
      "flex items-center justify-between mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200";

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
                <input type="checkbox" id="enableDragSwitch" ${
                  config.enableDragDownload ? "checked" : ""
                }
                       style="position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 3;">
                <span style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: ${
                      config.enableDragDownload ? "#3b82f6" : "#e2e8f0"
                    };
                    border-radius: 10px;
                    transition: background 0.2s ease;
                    z-index: 1;
                "></span>
                <span style="
                    position: absolute;
                    width: 16px;
                    height: 16px;
                    left: ${config.enableDragDownload ? "22px" : "2px"};
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
    const enableRightClickSection = document.createElement("div");
    enableRightClickSection.className =
      "flex items-center justify-between mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200";

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
                <input type="checkbox" id="enableRightClickSwitch" ${
                  config.enableRightClickDownload ? "checked" : ""
                }
                       style="position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 3;">
                <span style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: ${
                      config.enableRightClickDownload ? "#8b5cf6" : "#e2e8f0"
                    };
                    border-radius: 10px;
                    transition: background 0.2s ease;
                    z-index: 1;
                "></span>
                <span style="
                    position: absolute;
                    width: 16px;
                    height: 16px;
                    left: ${config.enableRightClickDownload ? "22px" : "2px"};
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

    // 历史图片加载效果选择
    const loadingStyleSection = document.createElement("div");
    loadingStyleSection.className =
      "flex items-center justify-between mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200";
    const currentLoadingStyle =
      typeof GM_getValue === "function"
        ? GM_getValue("historyLoadingStyle", "spinner")
        : "spinner";
    loadingStyleSection.innerHTML = `
            <span style="
                font-size: 14px;
                font-weight: 500;
                color: #475569;
                display: flex;
                align-items: center;
            ">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 6v6l4 2"></path>
                </svg>
                历史图片加载效果
            </span>
            <select id="historyLoadingSelect" style="
                height: 32px; padding: 0 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; color: #334155; background: #ffffff;">
                <option value="spinner">动图加载</option>
                <option value="blur">模糊渐清</option>
            </select>
        `;
    switchesSection.appendChild(loadingStyleSection);

    // 颜色设置区域
    const colorSettings = `
            <!-- 颜色设置容器 -->
            <div id="colorSettingsContainer">
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
                <div style="display: flex; align-items: center; gap: 8px;    align-items: stretch;">
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
            </div>
        `;

    // 获取快捷键配置
    const getHotkeysConfig = () => {
        const defaultHotkeys = {
            searchFocus: { ctrlCmd: true, shift: false, alt: false, key: 'k', description: '快速定位到搜索框' },
            imageSearch: { ctrlCmd: true, shift: false, alt: false, key: 'v', description: '以图搜索功能' },
            openSettings: { ctrlCmd: true, shift: false, alt: false, key: ',', description: '打开设置界面' }
        };
        return typeof GM_getValue === "function" 
            ? GM_getValue("hotkeysConfig", defaultHotkeys)
            : defaultHotkeys;
    };

    // 快捷键设置区域
    const hotkeysSettings = document.createElement("div");
    hotkeysSettings.className = "mb-4";
    hotkeysSettings.innerHTML = `
        <div style="margin-bottom: 12px;">
            <div style="
                font-size: 14px;
                color: #334155;
                font-weight: 600;
                margin-bottom: 8px;
            ">
                ⌨️ 快捷键设置
            </div>
            <div style="color: #64748b; font-size: 12px; margin-bottom: 12px;">
                点击输入框后按下新的快捷键组合
            </div>
        </div>`;

    // 获取当前快捷键配置
    const hotkeysConfig = getHotkeysConfig();
    
    // 快捷键项目列表
    const hotkeyItems = [
        { id: 'searchFocus', label: '快速定位到搜索框', defaultKey: 'k' },
        { id: 'imageSearch', label: '以图搜索功能', defaultKey: 'v' },
        { id: 'openSettings', label: '打开设置界面', defaultKey: ',' }
    ];
    
    // 创建每个快捷键设置项
    hotkeyItems.forEach(item => {
        const hotkeyItem = document.createElement("div");
        hotkeyItem.className = "mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200";
        
        const hotkeyConfig = hotkeysConfig[item.id] || { ctrlCmd: true, shift: false, alt: false, key: item.defaultKey };
        
        hotkeyItem.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 6px;
            ">
                <span style="font-size: 13px; color: #334155; font-weight: 500;">${item.label}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="flex: 1;">
                    <input type="text" id="hotkey-${item.id}" 
                           value="${hotkeyConfig.ctrlCmd ? 'Ctrl+' : ''}${hotkeyConfig.shift ? 'Shift+' : ''}${hotkeyConfig.alt ? 'Alt+' : ''}${hotkeyConfig.key.toUpperCase()}"
                           style="
                               width: 100%;
                               padding: 8px 10px;
                               border: 1px solid #e2e8f0;
                               border-radius: 6px;
                               font-size: 13px;
                               color: #334155;
                               font-family: monospace;
                           "
                           data-hotkey-id="${item.id}"
                           readonly>
                </div>
                <button type="button" id="reset-hotkey-${item.id}" 
                        style="
                            padding: 6px 10px;
                            background: #f8fafc;
                            color: #64748b;
                            border: 1px solid #e2e8f0;
                            border-radius: 6px;
                            font-size: 12px;
                            cursor: pointer;
                        ">
                    重置
                </button>
            </div>
        `;
        
        hotkeysSettings.appendChild(hotkeyItem);
    });

    // 操作按钮
    const actions = document.createElement("div");
    actions.className = "flex gap-2";
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

    // 初始显示设置面板并设置激活态（放在这里以确保所有元素已创建）
    setActive("cfg-tab-settings");
    renderSettings();

    // 卡片已在前面组装并添加到页面，后续只需填充 `content`（即 main）

    // 获取元素
    const enableCustomSwitch = document.getElementById("enableCustomSwitch");
    const enableCustomThumb = document.getElementById("enableCustomThumb");
    const enableCustomContainer = document.getElementById(
      "enableCustomContainer"
    );

    const enableWatermarkSwitch = document.getElementById(
      "enableWatermarkSwitch"
    );
    const enableWatermarkThumb = document.getElementById(
      "enableWatermarkThumb"
    );
    const enableWatermarkContainer = document.getElementById(
      "enableWatermarkContainer"
    );

    const materialPreview = document.getElementById("materialPreview");
    const materialPicker = document.getElementById("materialPicker");
    const materialInput = document.getElementById("materialInput");
    const userPreview = document.getElementById("userPreview");
    const userPicker = document.getElementById("userPicker");
    const userInput = document.getElementById("userInput");
    const saveBtn = document.getElementById("saveBtn");
    const resetBtn = document.getElementById("resetBtn");
    const historyLoadingSelect = document.getElementById(
      "historyLoadingSelect"
    );
    if (historyLoadingSelect) {
      try {
        historyLoadingSelect.value =
          typeof GM_getValue === "function"
            ? GM_getValue("historyLoadingStyle", "spinner")
            : "spinner";
      } catch (_) {}
      historyLoadingSelect.addEventListener("change", () => {
        try {
          GM_setValue("historyLoadingStyle", historyLoadingSelect.value);
        } catch (_) {}
      });
    }

    // 开关事件处理器工厂函数 - 消除重复代码
    const createSwitchHandler = (
      switchElement,
      thumbElement,
      containerElement,
      colorMap,
      callback
    ) => {
      return function () {
        const isChecked = this.checked;
        const switchBg = containerElement.querySelector("span:nth-child(2)");
        switchBg.style.backgroundColor = isChecked ? colorMap.on : colorMap.off;
        thumbElement.style.left = isChecked ? "22px" : "2px";
        if (typeof callback === "function") callback(isChecked);
      };
    };

    // 修复自定义背景色开关功能
    enableCustomSwitch.addEventListener(
      "change",
      createSwitchHandler(
        enableCustomSwitch,
        enableCustomThumb,
        enableCustomContainer,
        COLORS.switchCustom,
        (isChecked) => {
          applyStyles();
          // 动态显示或隐藏颜色选择器
          const colorSettingsContainer = document.getElementById("colorSettingsContainer");
          if (colorSettingsContainer) {
            colorSettingsContainer.style.display = isChecked ? "block" : "none";
          }
        }
      )
    );

    // 修复去水印开关功能
    enableWatermarkSwitch.addEventListener(
      "change",
      createSwitchHandler(
        enableWatermarkSwitch,
        enableWatermarkThumb,
        enableWatermarkContainer,
        COLORS.switchWatermark,
        (isChecked) => {
          debugLog("去水印开关状态变化，立即处理所有图片");
          setTimeout(() => {
            processWatermark(true);
          }, TIMING.debounceWatermark);
        }
      )
    );

    // 拖拽下载开关功能
    enableDragSwitch.addEventListener(
      "change",
      createSwitchHandler(
        enableDragSwitch,
        enableDragThumb,
        enableDragContainer,
        COLORS.switchDrag,
        (isChecked) => {
          debugLog("拖拽下载开关状态变化:", isChecked);
        }
      )
    );

    // 右键下载开关功能
    enableRightClickSwitch.addEventListener(
      "change",
      createSwitchHandler(
        enableRightClickSwitch,
        enableRightClickThumb,
        enableRightClickContainer,
        COLORS.switchRightClick,
        (isChecked) => {
          debugLog("右键下载开关状态变化:", isChecked);
        }
      )
    );

    // 颜色验证
    function isValidColor(color) {
      const hexRegex = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i;
      const rgbRegex =
        /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;
      return hexRegex.test(color) || rgbRegex.test(color);
    }

    // 颜色选择器工厂函数 - 消除重复代码
    const createColorPickerHandler = (
      inputElement,
      pickerElement,
      previewElement
    ) => {
      // 预览元素点击打开拾色器
      previewElement.addEventListener("click", () => pickerElement.click());

      // 拾色器输入事件
      pickerElement.addEventListener("input", (e) => {
        inputElement.value = e.target.value;
        previewElement.style.backgroundColor = e.target.value;
      });

      // 文本输入事件
      inputElement.addEventListener("input", (e) => {
        const color = e.target.value;
        if (isValidColor(color)) {
          previewElement.style.backgroundColor = color;
          if (color.startsWith("#")) {
            pickerElement.value = color;
          }
        }
      });
    };

    // 绑定材料水印颜色选择器
    createColorPickerHandler(materialInput, materialPicker, materialPreview);

    // 绑定用户水印颜色选择器
    createColorPickerHandler(userInput, userPicker, userPreview);

    // 保存配置
    // 快捷键配置变量
    let currentHotkeyInput = null;
    let currentHotkeyConfig = null;
    
    // 快捷键输入框点击事件
    const hotkeyInputs = document.querySelectorAll('input[id^="hotkey-"]');
    hotkeyInputs.forEach(input => {
        input.addEventListener('click', () => {
            // 移除其他输入框的激活状态
            hotkeyInputs.forEach(i => i.style.borderColor = '#e2e8f0');
            
            // 设置当前激活的输入框
            currentHotkeyInput = input;
            currentHotkeyInput.style.borderColor = '#ff284b';
            currentHotkeyInput.value = '请按下新的快捷键组合...';
        });
    });
    
    // 键盘事件监听（捕获快捷键）
    document.addEventListener('keydown', (e) => {
        if (currentHotkeyInput) {
            e.preventDefault();
            
            // 获取按键信息
            const ctrlCmd = e.ctrlKey || e.metaKey;
            const shift = e.shiftKey;
            const alt = e.altKey;
            const key = e.key.toLowerCase();
            
            // 只允许字母、数字和部分符号
            if (key && key.length === 1 && !e.code.includes('F') && key !== ' ') {
                // 更新输入框显示
                const hotkeyText = `${ctrlCmd ? 'Ctrl+' : ''}${shift ? 'Shift+' : ''}${alt ? 'Alt+' : ''}${key.toUpperCase()}`;
                currentHotkeyInput.value = hotkeyText;
                
                // 保存到临时配置
                const hotkeyId = currentHotkeyInput.dataset.hotkeyId;
                if (!currentHotkeyConfig) {
                    currentHotkeyConfig = getHotkeysConfig();
                }
                currentHotkeyConfig[hotkeyId] = { ctrlCmd, shift, alt, key, description: currentHotkeyConfig[hotkeyId].description };
                
                // 移除激活状态
                currentHotkeyInput.style.borderColor = '#e2e8f0';
                currentHotkeyInput = null;
            }
        }
    });
    
    // 快捷键重置按钮事件
    const resetHotkeyBtns = document.querySelectorAll('button[id^="reset-hotkey-"]');
    resetHotkeyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const hotkeyId = btn.id.replace('reset-hotkey-', '');
            const input = document.getElementById(`hotkey-${hotkeyId}`);
            
            // 获取默认配置
            const defaultHotkeys = {
                searchFocus: { ctrlCmd: true, shift: false, alt: false, key: 'k', description: '快速定位到搜索框' },
                imageSearch: { ctrlCmd: true, shift: false, alt: false, key: 'v', description: '以图搜索功能' },
                openSettings: { ctrlCmd: true, shift: false, alt: false, key: ',', description: '打开设置界面' }
            };
            
            // 重置配置
            const defaultConfig = defaultHotkeys[hotkeyId];
            input.value = `${defaultConfig.ctrlCmd ? 'Ctrl+' : ''}${defaultConfig.shift ? 'Shift+' : ''}${defaultConfig.alt ? 'Alt+' : ''}${defaultConfig.key.toUpperCase()}`;
            
            // 更新临时配置
            if (!currentHotkeyConfig) {
                currentHotkeyConfig = getHotkeysConfig();
            }
            currentHotkeyConfig[hotkeyId] = defaultConfig;
        });
    });

    saveBtn.addEventListener("click", () => {
      const materialColor = materialInput.value;
      const userColor = userInput.value;

      if (!isValidColor(materialColor) || !isValidColor(userColor)) {
        alert("请输入有效的颜色代码（HEX或RGB格式）");
        return;
      }

      const newConfig = {
        enableCustom: enableCustomSwitch.checked,
        enableRemoveWatermark: enableWatermarkSwitch.checked,
        enableDragDownload: enableDragSwitch.checked,
        enableRightClickDownload: enableRightClickSwitch.checked,
        materialColor: materialColor,
        userColor: userColor,
        historyLoadingStyle: historyLoadingSelect
          ? historyLoadingSelect.value
          : GM_getValue("historyLoadingStyle", "spinner"),
      };

      saveConfig(newConfig);
      
      // 保存快捷键配置
      if (typeof GM_setValue === "function") {
          GM_setValue("hotkeysConfig", currentHotkeyConfig || getHotkeysConfig());
      }
      
      applyStyles();

      // 根据去水印开关状态处理图片
      debugLog("保存设置后，处理所有图片");
      setTimeout(() => {
        processWatermark(true); // force=true
      }, TIMING.debounceWatermark);

      const originalText = saveBtn.textContent;
      saveBtn.textContent = "已保存！";
      setTimeout(
        () => (saveBtn.textContent = originalText),
        TIMING.switchTransition
      );

      setTimeout(closeConfig, TIMING.switchTransition + 200);
    });

    // 恢复默认
    resetBtn.addEventListener("click", () => {
      if (confirm("确定恢复默认设置吗？")) {
        saveConfig(DEFAULT_CONFIG);

        // 恢复所有开关状态的工厂函数
        const restoreSwitchState = (
          switchEl,
          thumbEl,
          containerEl,
          colorMap,
          isEnabled
        ) => {
          switchEl.checked = isEnabled;
          const switchBg = containerEl.querySelector("span:nth-child(2)");
          switchBg.style.backgroundColor = isEnabled
            ? colorMap.on
            : colorMap.off;
          thumbEl.style.left = isEnabled ? "22px" : "2px";
        };

        // 恢复所有开关状态
        restoreSwitchState(
          enableCustomSwitch,
          enableCustomThumb,
          enableCustomContainer,
          COLORS.switchCustom,
          DEFAULT_CONFIG.enableCustom
        );
        restoreSwitchState(
          enableWatermarkSwitch,
          enableWatermarkThumb,
          enableWatermarkContainer,
          COLORS.switchWatermark,
          DEFAULT_CONFIG.enableRemoveWatermark
        );
        restoreSwitchState(
          enableDragSwitch,
          enableDragThumb,
          enableDragContainer,
          COLORS.switchDrag,
          DEFAULT_CONFIG.enableDragDownload
        );
        restoreSwitchState(
          enableRightClickSwitch,
          enableRightClickThumb,
          enableRightClickContainer,
          COLORS.switchRightClick,
          DEFAULT_CONFIG.enableRightClickDownload
        );

        // 恢复颜色设置
        materialInput.value = DEFAULT_CONFIG.materialColor;
        materialPreview.style.backgroundColor = DEFAULT_CONFIG.materialColor;
        materialPicker.value = DEFAULT_CONFIG.materialColor;
        userInput.value = DEFAULT_CONFIG.userColor;
        userPreview.style.backgroundColor = DEFAULT_CONFIG.userColor;
        userPicker.value = DEFAULT_CONFIG.userColor;

        // 应用设置
        applyStyles();
        debugLog("恢复默认后，处理所有图片");
        setTimeout(() => {
          processWatermark(true); // force=true
        }, TIMING.debounceWatermark);

        const originalText = resetBtn.textContent;
        resetBtn.textContent = "已恢复！";
        setTimeout(
          () => (resetBtn.textContent = originalText),
          TIMING.switchTransition
        );
      }
    });

    // 关闭配置
    function closeConfig() {
      container.style.opacity = "0";
      setTimeout(() => {
        container.remove();
        // 恢复页面滚动
        document.body.style.overflow = 'auto';
      }, 200);
    }

    // 点击外部关闭
    container.addEventListener("click", (e) => {
      if (e.target === container) closeConfig();
    });

    // ESC键关闭
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeConfig();
    });
  }

  // 初始化
  function init() {
    // 提前加载拼音库，保障后续下载历史写入时可生成拼音字段
    ensurePinyinLib(() => {
      try {
        hydratePinyinForHistory();
      } catch (e) {}
    });

    // 注册油猴菜单命令
    GM_registerMenuCommand("⚙️ 设置首选项", createConfigUI);

    // 应用样式（包含动画效果）
    applyStyles();

    // 立即尝试渲染素材网站列表（不等待事件）
    renderMaterialSitesOnSucaiPage();
    
    // 使用MutationObserver监听DOM变化，确保元素出现后立即渲染
    const materialSitesObserver = new MutationObserver(() => {
      if (window.location.href === 'https://huaban.com/pages/sucai') {
        const layoutContent = document.getElementById('layout-content');
        if (layoutContent) {
          renderMaterialSitesOnSucaiPage();
          // 只需要渲染一次，所以停止观察
          materialSitesObserver.disconnect();
        }
      }
    });
    
    // 观察body的子元素变化
    materialSitesObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 页面加载完成后执行水印处理
    window.addEventListener("load", () => {
      debugLog("页面加载完成，执行初始水印处理");
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
    window.addEventListener("beforeunload", () => {
      observer.disconnect();
    });
    
    // 获取快捷键配置
    const getHotkeysConfig = () => {
        const defaultHotkeys = {
            searchFocus: { ctrlCmd: true, shift: false, alt: false, key: 'k', description: '快速定位到搜索框' },
            imageSearch: { ctrlCmd: true, shift: false, alt: false, key: 'v', description: '以图搜索功能' },
            openSettings: { ctrlCmd: true, shift: false, alt: false, key: ',', description: '打开设置界面' }
        };
        return typeof GM_getValue === "function" 
            ? GM_getValue("hotkeysConfig", defaultHotkeys)
            : defaultHotkeys;
    };

    // 检查快捷键是否匹配
    const isHotkeyMatch = (e, hotkeyConfig) => {
        if (!hotkeyConfig) return false;
        const ctrlCmd = e.ctrlKey || e.metaKey;
        const shift = e.shiftKey;
        const alt = e.altKey;
        const key = e.key.toLowerCase();
        
        return ctrlCmd === hotkeyConfig.ctrlCmd && 
               shift === hotkeyConfig.shift && 
               alt === hotkeyConfig.alt && 
               key === hotkeyConfig.key;
    };

    // 添加快捷键处理
    document.addEventListener("keydown", (e) => {
      // 获取当前快捷键配置
      const hotkeysConfig = getHotkeysConfig();
      
      // 快速定位到搜索框
      if (isHotkeyMatch(e, hotkeysConfig.searchFocus)) {
        // 阻止默认行为
        e.preventDefault();
        // 查找搜索框并聚焦
        const searchInput = document.getElementById("hb_search_input");
        if (searchInput) {
          searchInput.focus();
          // 选中搜索框内容，方便直接输入新内容
          searchInput.select();
          
          // 查找data-button-name="搜索框"的元素并修改其:before伪元素背景色
          const searchButton = document.querySelector('[data-button-name="搜索框"]');
          if (searchButton) {
            // 添加类名以便修改伪元素样式
            searchButton.classList.add('hb-search-focused');
            
            // 8秒后移除类名，恢复原来的样式
            setTimeout(() => {
              searchButton.classList.remove('hb-search-focused');
            }, 8000);
          }
        }
      }
      
      // 以图搜索功能
      if (isHotkeyMatch(e, hotkeysConfig.imageSearch)) {
        // 查找以图搜索按钮
        const imageSearchButton = document.querySelector('[data-button-name="以图搜索按钮"]');
        
        if (imageSearchButton) {
          // 如果是第一次按下Ctrl+V/Cmd+V
          if (!isImageSearchMode) {
            // 阻止默认的粘贴行为
            e.preventDefault();
            // 模拟点击以图搜索按钮
            imageSearchButton.click();
            // 设置状态为true，表示已进入图片搜索模式
            isImageSearchMode = true;
            
            // 3秒后自动重置状态（如果用户没有进行第二次操作）
            setTimeout(() => {
              isImageSearchMode = false;
            }, 3000);
          } else {
            // 如果是第二次按下Ctrl+V/Cmd+V，恢复正常粘贴功能
            // 不阻止默认行为，让用户可以粘贴图片
            // 重置状态，以便下次使用
            isImageSearchMode = false;
          }
        }
      }
      
      // 打开设置界面
      if (isHotkeyMatch(e, hotkeysConfig.openSettings)) {
        // 阻止默认行为
        e.preventDefault();
        // 调用设置首选项函数
        createConfigUI();
      }
    });

    // 使用动态版本号输出日志（样式化控制台信息）
    (function () {
      const v = getScriptVersion();
      const s1 =
        "padding: 2px 6px; border-radius: 3px 0 0 3px; color: #fff; background: #FF6699; font-weight: bold;";
      const s2 =
        "padding: 2px 6px; border-radius: 0 3px 3px 0; color: #fff; background: #FF9999; font-weight: bold;";
      console.info(`%c 花瓣去水印 %c v${v} `, s1, s2);
    })();
  }

  // 显示使用说明弹窗（改为嵌入飞书文档）
  function showUsageGuide() {
    const existing = document.getElementById("huabanUsageGuide");
    if (existing) {
      existing.remove();
      return;
    }

    const container = document.createElement("div");
    container.id = "huabanUsageGuide";
    container.className =
      "fixed inset-0 bg-black/30 flex items-center justify-center z-[115] backdrop-blur-sm";
    
    // 禁止页面滚动
    document.body.style.overflow = 'hidden';

    const card = document.createElement("div");
    card.className =
      "bg-white rounded-[24px] shadow-[0_8px_25px_rgba(0,0,0,0.15)] w-[1000px] h-[820px] max-w-[96vw] max-h-[86vh] flex flex-col overflow-hidden";

    const header = document.createElement("div");
    header.className =
      "px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-[rgb(248,250,252)]";
    header.innerHTML = `<h3 style="margin:0; font-size:16px; color:#334155; font-weight:600;">使用说明</h3><button id="closeUsageGuide" style="background:none;border:none;cursor:pointer;padding:4px;border-radius:4px;display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="#64748b"><path d="M198.1 267.7l75.4-75.4 576.3 576.3-75.4 75.4-576.3-576.3zm576.4-69.3l75.4 75.4-580.7 580.8-75.4-75.4 580.7-580.8z"/></svg></button>`;

    const content = document.createElement("div");
    content.className =
      "flex-1 overflow-auto p-0 flex items-stretch justify-stretch";

    // Feishu doc URL (嵌入为 iframe)，并提供外链作为回退
    const feishuUrl =
      "https://ai-chimo.feishu.cn/wiki/E9SEwhoMmiv2CkkC1VgcAbRTnW3";

    const iframeWrap = document.createElement("div");
    iframeWrap.className = "flex-1 min-h-0";

    const iframe = document.createElement("iframe");
    iframe.src = feishuUrl;
    iframe.className = "w-full h-full border-0 min-h-[400px]";
    iframe.allow = "fullscreen; clipboard-write";

    // 说明与外链回退
    const fallback = document.createElement("div");
    fallback.className =
      "p-3 text-sm text-slate-400 bg-amber-50 border-t border-amber-100 text-center";
    fallback.innerHTML = `若嵌入内容无法显示，请点击此处在新标签页打开： <a href="${feishuUrl}" target="_blank" rel="noopener noreferrer" style="color:#3b82f6;text-decoration:none;">打开使用说明（飞书文档）</a>`;

    iframeWrap.appendChild(iframe);
    content.appendChild(iframeWrap);

    card.appendChild(header);
    card.appendChild(content);
    card.appendChild(fallback);
    container.appendChild(card);
    document.body.appendChild(container);

    const closeBtn = header.querySelector("#closeUsageGuide");
    closeBtn.addEventListener("click", () => {
      container.remove();
      // 恢复页面滚动
      document.body.style.overflow = 'auto';
    });

    container.addEventListener("click", (e) => {
      if (e.target === container) {
        container.remove();
        // 恢复页面滚动
        document.body.style.overflow = 'auto';
      }
    });

    const escHandler = (e) => {
      if (e.key === "Escape") {
        container.remove();
        // 恢复页面滚动
        document.body.style.overflow = 'auto';
      }
    };
    document.addEventListener("keydown", escHandler);
    container.addEventListener("remove", () => {
      document.removeEventListener("keydown", escHandler);
      // 恢复页面滚动
      document.body.style.overflow = 'auto';
    });
  }

  function showDownloadHistory(embedTarget) {
    const isEmbed = !!embedTarget;
    const existing = document.getElementById("huabanDownloadHistory");
    if (existing && !isEmbed) {
      existing.remove();
      return;
    }
    let overlay;
    if (!isEmbed) {
      overlay = document.createElement("div");
      overlay.id = "huabanDownloadHistory";
      overlay.className =
        "fixed inset-0 bg-black/40 flex items-center justify-center z-[10000] backdrop-blur-sm";
      
      // 禁止页面滚动
      document.body.style.overflow = 'hidden';
      
      // 监听overlay元素的移除事件，恢复页面滚动
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.removedNodes.forEach((node) => {
            if (node === overlay) {
              // 恢复页面滚动
              document.body.style.overflow = 'auto';
              observer.disconnect();
            }
          });
        });
      });
      
      observer.observe(document.body, { childList: true });
    }
    const card = document.createElement("div");
    card.className =
      "shadow-[0_8px_25px_rgba(0,0,0,0.15)] w-[1200px] max-w-[95vw] max-h-[88vh] flex flex-col relative";
    card.style.fontFamily =
      "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
    // 如果以嵌入方式渲染在右侧面板，调整样式以填满容器并弱化浮层风格
    if (isEmbed) {
      card.style.width = "100%";
      card.style.height = "100%";
      card.style.maxWidth = "100%";
      card.style.maxHeight = "100%";
      card.style.boxShadow = "none";
    }
    const header = document.createElement("div");
    header.className = "bg-white flex items-center gap-3 justify-between pb-[6px]";
    const tools = document.createElement("div");
    tools.className = "flex gap-2 items-stretch";
    const title = document.createElement("div");
    title.innerHTML = `
            <span id="historyCount" class="text-xs text-slate-400">共1条</span>
        `;
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "支持拼音模糊搜索";
    searchInput.className =
      "h-8 border border-slate-200 rounded-md text-sm text-slate-700 w-[220px] bg-white px-2";
    const sortSelect = document.createElement("select");
    sortSelect.className =
      "h-8 px-2 border border-slate-200 rounded-md text-sm text-slate-700 bg-white";
    sortSelect.innerHTML = `
            <option value="time_desc">最新优先</option>
            <option value="time_asc">最旧优先</option>
            <option value="name_asc">名称升序</option>
            <option value="name_desc">名称降序</option>
        `;
    const officialOnly = document.createElement("label");
    officialOnly.className =
      "flex items-center gap-1 text-sm text-slate-600 px-2 py-1 bg-slate-50 border border-slate-200 rounded-md cursor-pointer";
    officialOnly.innerHTML = `
            <input type="checkbox" id="officialOnlyCheckbox" class="cursor-pointer"> 仅官方自营
        `;
    const clearBtn = document.createElement("button");
    clearBtn.textContent = "清空";
    clearBtn.className =
      "h-8 px-3 border border-rose-500 text-rose-500 bg-rose-50 rounded-md text-sm cursor-pointer";
    tools.appendChild(searchInput);
    tools.appendChild(sortSelect);
    tools.appendChild(officialOnly);
    // 选择模式开关
    const selectBtn = document.createElement("button");
    selectBtn.textContent = "选择";
    selectBtn.className =
      "h-8 px-3 border border-slate-200 text-slate-700 bg-white rounded-md text-sm cursor-pointer";
    // 批量删除按钮
    const bulkDelBtnLocal = document.createElement("button");
    bulkDelBtnLocal.id = "hb-bulk-delete-btn";
    bulkDelBtnLocal.textContent = "删除";
    bulkDelBtnLocal.className =
      "h-8 px-3 border border-rose-500 text-rose-500 bg-rose-50 rounded-md text-sm cursor-pointer";
    bulkDelBtnLocal.disabled = true;
    tools.appendChild(selectBtn);
    tools.appendChild(bulkDelBtnLocal);
    tools.appendChild(clearBtn);
    // 将本地引用赋值到闭包变量
    // 绑定交互
    selectBtn.addEventListener("click", () => {
      selectionMode = !selectionMode;
      selectBtn.textContent = selectionMode ? "退出" : "选择";
      if (!selectionMode) {
        selectedIds.clear();
      }
      render();
    });
    bulkDelBtnLocal.addEventListener("click", () => {
      if (selectedIds.size === 0) return;
      const ok = window.confirm(
        `确定删除选中的 ${selectedIds.size} 条记录吗？`
      );
      if (!ok) return;
      const list = getDownloadHistory();
      const next = list.filter((x) => !selectedIds.has(x.id));
      saveDownloadHistory(next);
      selectedIds.clear();
      selectionMode = false;
      render();
    });
    header.appendChild(title);
    header.appendChild(tools);
    const content = document.createElement("div");
    content.id = "hb-history-content";
    content.className = "hb-history-content";
    content.className = "pt-2 overflow-y-auto flex-1 bg-white mr-[-16px]";
    const masonry = document.createElement("div");
    masonry.className = "hb-history-masonry";
    masonry.className = "hb-history-masonry";
    masonry.style.columnCount = 4;
    masonry.style.columnGap = "6px";
    content.appendChild(masonry);
    card.appendChild(header);
    card.appendChild(content);
    if (isEmbed) {
      // embed into provided target element
      embedTarget.innerHTML = "";
      embedTarget.appendChild(card);
    } else {
      overlay.appendChild(card);
      document.body.appendChild(overlay);
    }

    // 返回顶部按钮（在历史下载滚动时显示，固定在窗口区域右下角）
    const backTopBtn = document.createElement("button");
    backTopBtn.id = "hb-history-back-top";
    backTopBtn.className =
      "absolute right-4 bottom-4 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center opacity-0 pointer-events-none transition-opacity duration-200 cursor-pointer z-50";
    backTopBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#334155" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>';
    card.appendChild(backTopBtn);

    // 批量选择/删除状态
    let selectionMode = false;
    const selectedIds = new Set();
    let io; // IntersectionObserver for lazy images
    function updateBulkBtnState() {
      const btn = document.getElementById("hb-bulk-delete-btn");
      if (!btn) return;
      const count = selectedIds.size;
      btn.disabled = count === 0;
      btn.textContent = count > 0 ? `删除(${count})` : "删除"; // 动态更新删除按钮文本
    }

    function render() {
      let list = getDownloadHistory();
      // 准备拼音库（可选）
      const hasPinyin =
        (typeof window.pinyinPro !== "undefined" &&
          typeof window.pinyinPro.pinyin === "function") ||
        typeof window.pinyin === "function";
      const pinyinFn =
        typeof window.pinyinPro !== "undefined" &&
        typeof window.pinyinPro.pinyin === "function"
          ? window.pinyinPro.pinyin
          : typeof window.pinyin === "function"
          ? window.pinyin
          : null;
      const toPinyin = (s) => {
        if (!s || !pinyinFn) return "";
        try {
          return String(
            pinyinFn(String(s), { toneType: "none", type: "string" })
          ).toLowerCase();
        } catch (e) {
          return "";
        }
      };
      const acronym = (src) => {
        if (!src || !pinyinFn) return "";
        try {
          const arr =
            pinyinFn(String(src), { toneType: "none", type: "array" }) || [];
          return arr
            .map((x) => (typeof x === "string" && x.length > 0 ? x[0] : ""))
            .join("")
            .toLowerCase();
        } catch (e) {
          return "";
        }
      };
      const isSubseq = (q, t) => {
        let i = 0;
        for (let c of q) {
          i = t.indexOf(c, i);
          if (i === -1) return false;
          i++;
        }
        return true;
      };
      const historyCountEl = document.getElementById("historyCount");
      if (historyCountEl) historyCountEl.textContent = `共${list.length}条`;
      const q = searchInput.value.trim().toLowerCase();
      if (q) {
        const qFlat = q.replace(/\s+/g, "");
        list = list.filter((x) => {
          const name = String(x.fileName || "").toLowerCase();
          let pyFlat = String(x.name_py || "")
            .toLowerCase()
            .replace(/\s+/g, "");
          let ac = String(x.name_py_acronym || "").toLowerCase();
          // 对旧记录缺失字段的兜底：动态计算一次
          if ((!pyFlat || !ac) && pinyinFn) {
            try {
              const pyDyn = String(
                pinyinFn(String(x.fileName || ""), {
                  toneType: "none",
                  type: "string",
                })
              );
              pyFlat = pyFlat || pyDyn.replace(/\s+/g, "");
              const arrDyn =
                pinyinFn(String(x.fileName || ""), {
                  toneType: "none",
                  type: "array",
                }) || [];
              ac =
                ac ||
                arrDyn
                  .map((t) =>
                    typeof t === "string" && t.length > 0 ? t[0] : ""
                  )
                  .join("")
                  .toLowerCase();
            } catch (e) {}
          }
          return (
            name.includes(q) ||
            (pyFlat && pyFlat.includes(qFlat)) ||
            (ac && ac.includes(q)) ||
            isSubseq(q, name) ||
            (pyFlat && isSubseq(q, pyFlat))
          );
        });
      }
      const only = officialOnly.querySelector("input").checked;
      if (only) list = list.filter((x) => x.official);
      const sort = sortSelect.value;
      if (sort === "time_desc") list.sort((a, b) => b.time - a.time);
      if (sort === "time_asc") list.sort((a, b) => a.time - b.time);
      if (sort === "name_asc")
        list.sort((a, b) =>
          String(a.fileName).localeCompare(String(b.fileName))
        );
      if (sort === "name_desc")
        list.sort((a, b) =>
          String(b.fileName).localeCompare(String(a.fileName))
        );
      masonry.innerHTML = "";
      list.forEach((item) => {
        const box = document.createElement("div");
        box.className =
          "hb-history-item break-inside-avoid mb-4 border border-slate-200 rounded-xl overflow-hidden shadow-sm";
        const imgWrap = document.createElement("div");
        imgWrap.className =
          "hb-history-img-wrap bg-slate-50 relative overflow-hidden";
        if (item.width && item.height) {
          imgWrap.style.aspectRatio = `${item.width} / ${item.height}`;
        }
        const img = document.createElement("img");
        // 移除原生懒加载属性，避免与自定义加载逻辑冲突
        // img.setAttribute('loading', 'lazy');
        img.dataset.src = item.url;
        img.alt = item.fileName || "预览";
        img.className =
          "w-full h-full object-contain block opacity-0 transition-all duration-200";
        imgWrap.appendChild(img);
        // 立即命中缓存则直接使用，避免再次请求
        let loader = null;
        let cached0 = null;
        try {
          cached0 = cacheGet(item.url);
          if (cached0) {
            img.src = cached0;
            img.style.opacity = "1";
            img.style.filter = "blur(0px)";
            delete img.dataset.src;
          }
        } catch (_) {}
        // 根据用户选择的加载样式：spinner 或 blur，仅在未命中缓存时启用
        try {
          if (!cached0) {
            const mode =
              typeof GM_getValue === "function"
                ? GM_getValue("historyLoadingStyle", "spinner")
                : "spinner";
            if (mode === "spinner") {
              loader = document.createElement("img");
              loader.src = "https://butterfly.js.org/img/loading.gif";
              loader.className =
                "hb-history-loader absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/5 h-auto pointer-events-none";
              imgWrap.appendChild(loader);
            } else {
              img.style.opacity = "1";
              img.style.filter = "blur(12px)";
            }
          }
        } catch (_) {}
        // 懒加载：可见时替换为真实地址
        try {
          if (!io && "IntersectionObserver" in window) {
            // 使用视口作为根容器并增大触发区域
            io = new IntersectionObserver(
              (entries) => {
                entries.forEach((en) => {
                  if (en.isIntersecting) {
                    const el = en.target;
                    const ds = el.dataset && el.dataset.src;
                    if (ds) {
                      // 先附加事件监听器，再设置src
                      // 增强版加载完成处理
                      el.addEventListener("load", () => {
                        try {
                          el.style.opacity = "1";
                          el.style.filter = "blur(0px)";
                          const loader =
                            el.parentElement.querySelector(
                              ".hb-history-loader"
                            );
                          if (loader) {
                            loader.remove();
                            // 加载动画已移除
                          } else {
                            // 未找到加载动画元素
                          }
                        } catch (e) {
                          console.error("图片加载成功处理失败:", e);
                        }
                      });
                      // 增强版加载失败处理
                      // 错误事件监听
                      el.addEventListener("error", () => {
                        try {
                          console.error("图片加载失败:", ds);
                          const loader =
                            el.parentElement.querySelector(
                              ".hb-history-loader"
                            );
                          if (loader) loader.remove();
                          el.src =
                            "https://api.cxr.cool/bg/?size=200x200&bgc=573b48ff&text=加载失败";
                          Object.assign(el.style, {
                            backgroundColor: "#573b48ff",
                            opacity: "1",
                            filter: "blur(0px)",
                          });
                          el.dataset.originalSrc = ds;
                        } catch (e) {
                          console.error("图片加载失败处理错误:", e);
                        }
                      });

                      // 验证URL格式
                      if (
                        !ds ||
                        typeof ds !== "string" ||
                        !ds.startsWith("http")
                      ) {
                        console.error("无效的图片URL:", ds);
                        const loader =
                          el.parentElement.querySelector(".hb-history-loader");
                        if (loader) loader.remove();
                        el.src =
                          "https://api.cxr.cool/bg/?size=200x200&bgc=573b48ff&text=无效URL";
                        Object.assign(el.style, {
                          backgroundColor: "#573b48ff",
                          opacity: "1",
                        });
                      }
                      // 直接加载图片，不使用缓存
                      el.src = ds;
                      delete el.dataset.src;

                      // 处理缓存图片立即加载完成的情况
                      if (el.complete) {
                        try {
                          el.style.opacity = "1";
                          el.style.filter = "blur(0px)";
                          const loader =
                            el.parentElement.querySelector(
                              ".hb-history-loader"
                            );
                          if (loader) loader.remove();
                        } catch (e) {
                          console.error("缓存图片加载处理失败:", e);
                        }
                      }
                    }
                    io.unobserve(el);
                  }
                });
              },
              { rootMargin: "500px 0px", threshold: 0.01 }
            );
          }
          if (io) {
            // 只有在尚未设置真实地址时才进行懒加载观察
            if (img.dataset.src) io.observe(img);
          } else {
            // 兼容无 IO 的环境
            setTimeout(() => {
              if (img.dataset.src) {
                img.addEventListener("load", () => {
                  try {
                    img.style.opacity = "1";
                    const l =
                      img.parentElement &&
                      img.parentElement.querySelector(".hb-history-loader");
                    if (l) l.remove();
                    img.style.filter = "blur(0px)";
                  } catch (_) {}
                });
                img.addEventListener("error", () => {
                  try {
                    img.style.opacity = "1";
                    const l =
                      img.parentElement &&
                      img.parentElement.querySelector(".hb-history-loader");
                    if (l) l.remove();
                    img.style.filter = "blur(0px)";
                  } catch (_) {}
                });
                const ds = img.dataset.src;
                img.src = ds;
                delete img.dataset.src;
              }
            }, 0);
          }
        } catch (_) {
          setTimeout(() => {
            if (img.dataset.src) {
              img.addEventListener("load", () => {
                try {
                  img.style.opacity = "1";
                  const l =
                    img.parentElement &&
                    img.parentElement.querySelector(".hb-history-loader");
                  if (l) l.remove();
                } catch (_) {}
              });
              img.addEventListener("error", () => {
                try {
                  img.style.opacity = "1";
                  const l =
                    img.parentElement &&
                    img.parentElement.querySelector(".hb-history-loader");
                  if (l) l.remove();
                } catch (_) {}
              });
              const ds2 = img.dataset.src;
              img.src = ds2;
              delete img.dataset.src;
            }
          }, 0);
        }

        // 批量选择复选框（选择模式下显示）
        const selectBox = document.createElement("input");
        selectBox.type = "checkbox";
        selectBox.className = `absolute top-2 left-2 w-5 h-5 scale-130 border border-slate-200 rounded transition-opacity duration-200 cursor-pointer bg-white`;
        selectBox.style.opacity = selectionMode ? "1" : "0";
        selectBox.style.pointerEvents = selectionMode ? "auto" : "none";
        selectBox.checked = selectedIds.has(item.id);
        selectBox.addEventListener("click", (ev) => ev.stopPropagation());
        selectBox.addEventListener("change", () => {
          if (selectBox.checked) selectedIds.add(item.id);
          else selectedIds.delete(item.id);
          updateBulkBtnState();
        });
        imgWrap.appendChild(selectBox);
        const info = document.createElement("div");
        info.className = "p-2 flex flex-col gap-1";
        const nameLine = document.createElement("div");
        nameLine.className = "text-sm text-slate-800 font-semibold";
        if (item.originHref) {
          const link = document.createElement("a");
          link.href = item.originHref;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = item.fileName;
          link.className = "text-gray-800 no-underline";
          nameLine.appendChild(link);
        } else {
          nameLine.textContent = item.fileName;
        }
        const metaLine = document.createElement("div");
        metaLine.className = "text-xs text-slate-400";
        const tag = item.official ? "官方自营" : "用户素材";
        const act = item.action === "drag" ? "拖拽" : "下载";
        const wh =
          item.width && item.height ? `${item.width}×${item.height}` : "";
        metaLine.textContent = `${formatDateTime(item.time)} · ${tag} · ${act}${
          wh ? " · " + wh : ""
        }`;
        const actions = document.createElement("div");
        actions.className =
          "flex gap-3 absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 pointer-events-none transition-opacity duration-200";
        const redl = document.createElement("button");
        redl.className =
          "hb-redownload-btn h-9 w-9 border-0 text-white bg-blue-500 rounded-full text-xs cursor-pointer flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110 hover:shadow-lg";
        redl.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
        redl.addEventListener("mouseenter", () => {
          redl.style.transform = "scale(1.1)";
          redl.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.5)";
        });
        redl.addEventListener("mouseleave", () => {
          redl.style.transform = "scale(1)";
          redl.style.boxShadow = "0 2px 6px rgba(59, 130, 246, 0.4)";
        });
        redl.addEventListener("click", () => {
          try {
            GM_download({
              url: item.url,
              name: item.fileName,
              onload: function () {
                try {
                  fetchImageAsDataURL(item.url, (dataUrl) => {
                    if (dataUrl) cachePut(item.url, dataUrl);
                  });
                } catch (_) {}
              },
            });
          } catch (e) {
            const a = document.createElement("a");
            a.href = item.url;
            a.download = item.fileName;
            a.className = "hidden";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            try {
              fetchImageAsDataURL(item.url, (dataUrl) => {
                if (dataUrl) cachePut(item.url, dataUrl);
              });
            } catch (_) {}
          }
        });
        const copy = document.createElement("button");
        copy.className =
          "hb-copy-btn h-9 w-9 border-0 text-slate-700 bg-slate-50 rounded-full text-xs cursor-pointer flex items-center justify-center shadow-sm transition-all duration-200 hover:scale-110 hover:shadow-md";
        copy.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
        copy.addEventListener("mouseenter", () => {
          copy.style.transform = "scale(1.1)";
          copy.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
        });
        copy.addEventListener("mouseleave", () => {
          copy.style.transform = "scale(1)";
          copy.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.1)";
        });
        copy.addEventListener("click", () => {
          navigator.clipboard && navigator.clipboard.writeText(item.url);
        });
        // 悬浮删除图标按钮（图片右上角显示）
        const delIcon = document.createElement("button");
        delIcon.className =
          "absolute top-2 right-2 w-9 h-9 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center opacity-0 pointer-events-none transition-opacity duration-200 cursor-pointer";
        delIcon.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>';
        delIcon.addEventListener("click", (ev) => {
          ev.stopPropagation();
          removeDownloadHistoryItem(item.id);
          render();
        });
        imgWrap.addEventListener("mouseenter", () => {
          delIcon.style.opacity = "1";
          delIcon.style.pointerEvents = "auto";
          actions.style.opacity = "1";
          actions.style.pointerEvents = "auto";
        });
        imgWrap.addEventListener("mouseleave", () => {
          delIcon.style.opacity = "0";
          delIcon.style.pointerEvents = "none";
          actions.style.opacity = "0";
          actions.style.pointerEvents = "none";
        });
        imgWrap.appendChild(delIcon);
        actions.appendChild(redl);
        actions.appendChild(copy);
        info.appendChild(nameLine);
        info.appendChild(metaLine);
        imgWrap.appendChild(actions);
        box.appendChild(imgWrap);
        box.appendChild(info);
        masonry.appendChild(box);
        img.addEventListener("click", () => {
          const pv = document.createElement("div");
          pv.className =
            "fixed inset-0 bg-black/70 flex items-center justify-center z-[10001]";
          const img2 = document.createElement("img");
          img2.src = item.url;
          img2.alt = item.fileName;
          img2.className = "max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl";
          pv.appendChild(img2);
          pv.addEventListener("click", () => document.body.removeChild(pv));
          document.body.appendChild(pv);
        });
      });
      updateBulkBtnState();

      // 返回顶部按钮显示逻辑：根据实际可滚动容器（masonry 或 content）
      const backTopBtnLocal = document.getElementById("hb-history-back-top");
      const masonryEl = isEmbed
        ? embedTarget.querySelector(".hb-history-masonry")
        : document.querySelector(".hb-history-masonry");
      const contentEl =
        (isEmbed
          ? embedTarget.querySelector("#hb-history-content")
          : document.getElementById("hb-history-content")) || content;
      const scrollEl =
        masonryEl && masonryEl.scrollHeight > masonryEl.clientHeight
          ? masonryEl
          : contentEl;
      const onScrollShowBackTop = () => {
        try {
          const canScroll = scrollEl.scrollHeight > scrollEl.clientHeight;
          const show = canScroll && scrollEl.scrollTop > 10;
          if (backTopBtnLocal) {
            backTopBtnLocal.style.opacity = show ? "1" : "0";
            backTopBtnLocal.style.pointerEvents = show ? "auto" : "none";
          }
        } catch (_) {}
      };
      if (!scrollEl.dataset.backTopBound) {
        scrollEl.addEventListener("scroll", onScrollShowBackTop);
        scrollEl.addEventListener("wheel", onScrollShowBackTop, {
          passive: true,
        });
        scrollEl.addEventListener("touchmove", onScrollShowBackTop, {
          passive: true,
        });
        scrollEl.dataset.backTopBound = "1";
      }
      onScrollShowBackTop();
      if (backTopBtnLocal) {
        backTopBtnLocal.onclick = () => {
          try {
            scrollEl.scrollTo({ top: 0, behavior: "smooth" });
          } catch (_) {
            scrollEl.scrollTop = 0;
          }
        };
      }
    }
    render();
    // 动态加载拼音库（如未存在），加载后重新渲染
    if (
      typeof window.pinyinPro === "undefined" ||
      typeof window.pinyinPro.pinyin !== "function"
    ) {
      const s = document.createElement("script");
      s.src = "https://unpkg.com/pinyin-pro";
      s.onload = () => {
        try {
          const gw =
            typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
          if (
            typeof window.pinyinPro === "undefined" ||
            typeof window.pinyinPro.pinyin !== "function"
          ) {
            if (gw.pinyinPro && typeof gw.pinyinPro.pinyin === "function") {
              window.pinyinPro = { pinyin: gw.pinyinPro.pinyin };
            } else if (typeof gw.pinyin === "function") {
              window.pinyinPro = { pinyin: gw.pinyin };
            }
          }
          render();
        } catch (e) {
          try {
            render();
          } catch (_) {}
        }
      };
      document.head.appendChild(s);
    }
    let hbSearchTimer;
    const triggerSearch = () => {
      try {
        clearTimeout(hbSearchTimer);
        hbSearchTimer = setTimeout(() => {
          try {
            render();
          } catch (_) {}
        }, 400);
      } catch (_) {}
    };
    const triggerSearchImmediate = () => {
      try {
        clearTimeout(hbSearchTimer);
        render();
      } catch (_) {}
    };
    searchInput.addEventListener("input", triggerSearch);
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        triggerSearchImmediate();
      }
    });
    sortSelect.addEventListener("change", render);
    officialOnly.querySelector("input").addEventListener("change", render);
    clearBtn.addEventListener("click", () => {
      try {
        const ok = window.confirm("确定清空历史下载列表吗？此操作不可恢复");
        if (!ok) return;
        clearDownloadHistory();
        render();
        const original = clearBtn.textContent;
        clearBtn.textContent = "已清空";
        setTimeout(() => (clearBtn.textContent = original), 1000);
      } catch (e) {
        clearDownloadHistory();
        render();
      }
    });
  }

  // 在配置界面创建完成后添加使用说明链接的事件监听
  function addUsageGuideListener() {
    const usageGuideLink = document.getElementById("usageGuideLink");
    if (usageGuideLink) {
      usageGuideLink.addEventListener("click", (e) => {
        e.preventDefault();
        showUsageGuide();
      });
    }
  }

  // 在配置界面创建完成后添加历史下载链接的事件监听
  function addDownloadHistoryListener() {
    const link = document.getElementById("downloadHistoryLink");
    if (link) {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        showDownloadHistory();
      });
    }
  }

  // 修改createConfigUI函数，在创建完成后添加使用说明链接的事件监听
  const originalCreateConfigUI = createConfigUI;
  createConfigUI = function () {
    originalCreateConfigUI();
    // 延迟一点时间确保DOM已渲染
    setTimeout(() => {
      addUsageGuideListener();
      addDownloadHistoryListener();
    }, 100);
  };

  // 启动脚本
  init();
})();

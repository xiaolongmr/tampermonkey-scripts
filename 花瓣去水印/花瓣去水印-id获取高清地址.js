// ==UserScript==
// @name         花瓣去水印-id获取高清地址
// @namespace    http://tampermonkey.net/
// @version      2026-1-05
// @description  同时替换主展示区和弹出层(vYzIMzy2)的图片为高清源
// @author       小张 | 个人博客：https://blog.z-l.top | 公众号“爱吃馍” | 设计导航站 ：https://dh.z-l.top | quicker账号昵称：星河城野❤
// @license      GPL-3.0
// @match        https://huaban.com/*
// @connect      gd.huaban.com
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// @require      https://cdn.jsdelivr.net/gh/xiaolongmr/tampermonkey-scripts@8ed09bc4be4797388576008ceadbe0f8258126e5/%E8%8A%B1%E7%93%A3%E5%8E%BB%E6%B0%B4%E5%8D%B0/%E8%8A%B1%E7%93%A3%E2%80%9C%E5%8E%BB%E2%80%9D%E6%B0%B4%E5%8D%B0%E6%9B%B4%E6%96%B0%E6%8F%90%E7%A4%BA%E8%84%9A%E6%9C%AC.js
// @require      https://cdn.tailwindcss.com
// ==/UserScript==

(function() {
    'use strict';

    // 缓存高清URL，避免重复请求
    const hdUrlCache = new Map();

    // 处理页面更新：提取ID，请求或替换高清图片
    function handleUpdate() {
        // 查找包含ID的元素（支持新旧版本选择器）
        // .__2p__B98x: 老版本花瓣网的ID显示元素
        // .AGmy_6yA: 新版本花瓣网的ID显示元素
        const sourceDiv = document.querySelector('.__2p__B98x, .AGmy_6yA');
        if (!sourceDiv) return;

        // 提取ID
        const match = sourceDiv.innerText.match(/ID[:：]\s*(\d+)/i);
        if (!match) return;

        const id = match[1];
        const cachedUrl = hdUrlCache.get(id);

        // 如果正在加载或已有缓存，直接返回或替换
        if (cachedUrl === "loading") return;
        if (cachedUrl) {
            // 只有type为image时才替换高清图片
            if (cachedUrl.type === 'image') {
                executeReplacement(cachedUrl.url);
            }
            // 尺寸信息和下载按钮不受type影响，始终显示
            if (cachedUrl.width && cachedUrl.height) {
                showSizeInfo(cachedUrl.width, cachedUrl.height, cachedUrl.dpi, cachedUrl.url, cachedUrl.file_format, cachedUrl.content_url, cachedUrl.type, cachedUrl.title);
            }
            return;
        }

        // 标记为加载中
        hdUrlCache.set(id, "loading");

        // 请求高清图片数据
        GM_xmlhttpRequest({
            method: "GET",
            url: `https://gd.huaban.com/editor/design?id=${id}`,
            onload: (res) => {
                // 解析响应中的JSON数据
                const scriptMatch = res.responseText.match(/window\.__SSR_TEMPLATE\s*=\s*(\{[\s\S]*?\})(?:;|\s*<\/script>)/);
                if (scriptMatch) {
                    try {
                        const ssrData = JSON.parse(scriptMatch[1]);
                        if (ssrData?.preview?.url) {
                            const file_format = ssrData.files[0].file_format;
                            const content_url = ssrData.content_url;
                            const hdUrl = ssrData.preview.url;
                            const video = ssrData.preview.video;
                            const title = ssrData.title;
                            const width = ssrData.preview.width;
                            const height = ssrData.preview.height;
                            const dpi = ssrData.dpi;
                            const type = ssrData.type;
                            const newCachedData = { url: hdUrl, width: width, height: height, dpi: dpi, file_format: file_format, content_url: content_url, type: type, title: title};
                            hdUrlCache.set(id, newCachedData);
                            
                            // 只有type为image时才替换高清图片
                            if (type === 'image') {
                                executeReplacement(hdUrl);
                            }
                            
                            // 尺寸信息和下载按钮不受type影响，始终显示
                            if (width && height) {
                                showSizeInfo(width, height, dpi, hdUrl, file_format, content_url, type, title);
                            }
                        }
                    } catch (e) {}
                }
            }
        });
    }

    // 显示尺寸信息和下载按钮
    function showSizeInfo(width, height, dpi, url, fileFormat, contentUrl, type, title) {
        const selectors = ['.OPWXbLYw img', '.Wa6mMsQV img', '.vYzIMzy2 img', '.VFtkdxbR img', '.ujZSLFrU video'];
        const targets = selectors.map(sel => document.querySelector(sel)).filter(img => img);

        targets.forEach(img => {
            const parent = img.parentElement;
            if (parent.querySelector('.size-info-overlay') || parent.querySelector('.download-btn-overlay')) return;

            // 创建尺寸信息覆盖层
            const sizeOverlay = document.createElement('div');
            sizeOverlay.className = 'size-info-overlay';
            sizeOverlay.textContent = `${width} 像素 x ${height} 像素 (${dpi} dpi)`;
            
            const sizeStyle = {
                position: 'absolute',
                bottom: '8px',
                left: '8px',
                color: '#000000ff',
                padding: '6px 12px',
                zIndex: '9999',
                transform: 'translateZ(0)',
                borderRadius: '99px',
                background: 'rgba(255, 255, 255, 0.7)',
                boxShadow: '0 0 1px 0 var(--boxshadow-color-medium-100, rgba(0, 0, 0, .1)), 0 8px 40px -2px var(--boxshadow-color-medium-200, rgba(0, 0, 0, .1))',
                transition: 'box-shadow .2s ease',
                userSelect: 'none'
            };
            
            Object.assign(sizeOverlay.style, sizeStyle);
            parent.appendChild(sizeOverlay);

            // 在包含ID信息的元素外添加a标签包裹
            if (contentUrl) {
                const sourceDiv = document.querySelector('.__2p__B98x, .AGmy_6yA');
                if (sourceDiv && sourceDiv.parentElement && !sourceDiv.parentElement.classList.contains('content-url-wrapper')) {
                    const wrapper = document.createElement('a');
                    wrapper.className = 'content-url-wrapper';
                    wrapper.href = contentUrl;
                    wrapper.target = '_blank';
                    wrapper.style.textDecoration = 'none';
                    wrapper.style.color = 'inherit';
                    sourceDiv.parentElement.insertBefore(wrapper, sourceDiv);
                    wrapper.appendChild(sourceDiv);
                }
            }

            // 创建下载按钮（可能返回多个按钮）
            const extension = getFileExtension(url);
            createDownloadButton(url, img, extension, fileFormat, contentUrl, type, title, parent);
        });
    }

    // 获取文件扩展名
    function getFileExtension(url) {
        const match = url.match(/\.([^.?]+)(?:\?|$)/);
        return match ? '.' + match[1] : '.jpg';
    }

    // 创建下载按钮的公共函数
    function createDownloadButton(url, imgElement, extension, fileFormat, contentUrl, type, title, parent) {
        // 不论什么情况，始终显示下载PNG/JPG按钮（下载hdUrl）
        const pngButton = createSingleButton('下载 ' + extension.toUpperCase(), url, imgElement, 'image', title);
        pngButton.style.top = '8px';
        parent.appendChild(pngButton);
        
        let buttonIndex = 1;
        
        // 根据类型和文件格式添加额外的下载按钮
        if (type === 'poster' && fileFormat === 'psd') {
            // PSD素材：额外显示下载PSD按钮
            const psdButton = createSingleButton('下载 PSD', null, imgElement, 'psd', title);
            psdButton.style.top = (8 + buttonIndex * 40) + 'px';
            parent.appendChild(psdButton);
            buttonIndex++;
        } else if (type === 'image' && fileFormat === 'eps') {
            // EPS素材：需要先获取 originUrl，如果有才显示下载EPS按钮
            if (contentUrl) {
                fetch(contentUrl)
                    .then(response => response.json())
                    .then(data => {
                        if (data.originUrl) {
                            const epsButton = createSingleButton('下载 EPS', data.originUrl, imgElement, 'eps', title);
                            epsButton.style.top = (8 + buttonIndex * 40) + 'px';
                            parent.appendChild(epsButton);
                        }
                    })
                    .catch(err => {
                        console.error('获取EPS originUrl失败:', err);
                    });
            }
        } else if (type === 'image' && fileFormat === 'ai') {
            // AI素材：额外显示下载AI按钮
            const aiButton = createSingleButton('下载 AI', contentUrl, imgElement, 'ai', title);
            aiButton.style.top = (8 + buttonIndex * 40) + 'px';
            parent.appendChild(aiButton);
            buttonIndex++;
        } else if (type === 'movie' && fileFormat === 'zip') {
            // 视频素材：额外显示下载ZIP、MP3、MP4按钮
            const zipButton = createSingleButton('下载 ZIP', contentUrl, imgElement, 'zip', title);
            zipButton.style.top = (8 + buttonIndex * 40) + 'px';
            parent.appendChild(zipButton);
            buttonIndex++;
            
            const mp3Button = createSingleButton('下载 MP3', null, imgElement, 'mp3', title);
            mp3Button.style.top = (8 + buttonIndex * 40) + 'px';
            parent.appendChild(mp3Button);
            buttonIndex++;
            
            const mp4Button = createSingleButton('下载 MP4', null, imgElement, 'mp4', title);
            mp4Button.style.top = (8 + buttonIndex * 40) + 'px';
            parent.appendChild(mp4Button);
        } else if (fileFormat === 'zip' && type !== 'image') {
            // 普通ZIP素材（排除type='image'的情况）：额外显示下载ZIP按钮
            const zipButton = createSingleButton('下载 ZIP', contentUrl, imgElement, 'zip', title);
            zipButton.style.top = (8 + buttonIndex * 40) + 'px';
            parent.appendChild(zipButton);
        }
    }

    // 创建单个下载按钮
    function createSingleButton(text, url, imgElement, downloadType, title) {
        const downloadBtn = document.createElement('div');
        downloadBtn.className = 'download-btn-overlay';
        downloadBtn.textContent = text;
        
        // 判断是否为待实现的功能
        const isImplemented = downloadType === 'image' || downloadType === 'zip' || downloadType === 'eps' || downloadType === 'ai';
        
        // 统一的按钮样式
        const btnStyle = {
            position: 'absolute',
            top: '8px',
            right: '8px',
            color: '#ffffff',
            padding: '6px 12px',
            zIndex: '9999',
            transform: 'translateZ(0)',
            borderRadius: '99px',
            background: 'rgba(0, 153, 255, 0.94)',
            boxShadow: '0 0 1px 0 var(--boxshadow-color-medium-100, rgba(0, 0, 0, .1)), 0 8px 40px -2px var(--boxshadow-color-medium-200, rgba(0, 0, 0, .1))',
            transition: 'box-shadow .2s ease',
            userSelect: 'none'
        };
        
        // 待实现的功能按钮样式
        if (!isImplemented) {
            btnStyle.cursor = 'not-allowed';
            btnStyle.opacity = '0.5';
            btnStyle.pointerEvents = 'none';
            btnStyle.background = 'rgba(128, 128, 128, 0.7)';
        } else {
            btnStyle.cursor = 'pointer';
        }
        
        Object.assign(downloadBtn.style, btnStyle);
        
        // 根据下载类型绑定不同的点击事件
        downloadBtn.addEventListener('click', () => {
            console.log(`点击了 ${text} 按钮，下载类型: ${downloadType}`);
            
            switch(downloadType) {
                case 'image':
                    if (url) {
                        downloadImage(url, imgElement, title);
                    }
                    break;
                case 'zip':
                    if (url) {
                        downloadZipFile(url, imgElement, title);
                    }
                    break;
                case 'eps':
                    if (url) {
                        downloadImage(url, imgElement, title);
                    }
                    break;
                case 'ai':
                    if (url) {
                        downloadAiFile(url, imgElement, title);
                    }
                    break;
                case 'psd':
                    // TODO: 实现PSD下载
                    console.log('PSD下载功能待实现');
                    break;
                case 'mp3':
                    // TODO: 实现MP3下载
                    console.log('MP3下载功能待实现');
                    break;
                case 'mp4':
                    // TODO: 实现MP4下载
                    console.log('MP4下载功能待实现');
                    break;
            }
        });
        
        return downloadBtn;
    }

    // 下载图片功能
    function downloadImage(url, imgElement, title) {
        const filename = title || imgElement?.alt || 'huaban_image';
        const extension = getFileExtension(url);
        const fullFilename = filename + extension;
        
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.blob();
            })
            .then(blob => {
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = fullFilename;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(blobUrl);
            })
            .catch(() => {
                const link = document.createElement('a');
                link.href = url;
                link.download = fullFilename;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
    }

    // 下载ZIP文件功能
    function downloadZipFile(contentUrl, imgElement, title) {
        const filename = title || imgElement?.alt || 'huaban_素材';
        
        fetch(contentUrl)
            .then(response => response.json())
            .then(data => {
                if (data.url) {
                    const link = document.createElement('a');
                    link.href = data.url;
                    link.download = `${filename}.zip`;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else {
                    throw new Error('ZIP URL not found');
                }
            })
            .catch(err => {
                console.error('ZIP下载失败:', err);
                alert('ZIP文件下载失败，请稍后重试');
            });
    }

    // 下载AI文件功能
    function downloadAiFile(contentUrl, imgElement, title) {
        const filename = title || imgElement?.alt || 'huaban_素材';
        
        fetch(contentUrl)
            .then(response => response.json())
            .then(data => {
                if (data.model && data.model.url) {
                    const svgUrl = data.model.url;
                    const colors = data.model.colors || [];
                    
                    fetch(svgUrl)
                        .then(response => response.text())
                        .then(svgContent => {
                            let processedSvg = svgContent;
                            
                            if (colors.length > 0) {
                                processedSvg = svgContent.replace(/\{\{colors\[(\d+)\]\}\}/g, (match, index) => {
                                    const colorIndex = parseInt(index);
                                    return colors[colorIndex] || '#000000';
                                });
                            }
                            
                            const blob = new Blob([processedSvg], { type: 'image/svg+xml' });
                            const blobUrl = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = blobUrl;
                            link.download = `${filename}.svg`;
                            link.style.display = 'none';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(blobUrl);
                        })
                        .catch(err => {
                            console.error('SVG下载失败:', err);
                            alert('SVG文件下载失败，请稍后重试');
                        });
                } else {
                    throw new Error('AI data not found');
                }
            })
            .catch(err => {
                console.error('AI下载失败:', err);
                alert('AI文件下载失败，请稍后重试');
            });
    }

    // 替换图片/视频并显示加载指示器
    function executeReplacement(url) {
        // 目标图片选择器（主展示区和弹出层）
        // .OPWXbLYw img: 老版本花瓣网主展示区图片
        // .Wa6mMsQV img: 新版本花瓣网主展示区图片
        // .vYzIMzy2 img: 弹出层图片（可能为老版本）
        // .VFtkdxbR img: 弹出层图片（可能为新版本）
        // .ujZSLFrU video 新版花瓣视频
        const selectors = ['.OPWXbLYw img', '.Wa6mMsQV img', '.vYzIMzy2 img', '.VFtkdxbR img', '.ujZSLFrU video'];
        const targets = selectors.map(sel => document.querySelector(sel)).filter(img => img && img.src !== url);

        targets.forEach(img => {
            const parent = img.parentElement;
            // 避免重复添加覆盖层
            if (parent.querySelector('.loading-overlay')) return;

            // 创建加载覆盖层
            const overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.textContent = '正在加载高清图片...';
            Object.assign(overlay.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 'bold',
                zIndex: '9999',
                pointerEvents: 'none'
            });

            // 确保父元素相对定位
            if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
            parent.appendChild(overlay);

            // 图片加载完成后移除覆盖层
            img.onload = () => {
                overlay.remove();
            };
            img.onerror = () => {
                overlay.remove();
                console.log('高清图片加载失败');
            };
            // 设置高清URL并移除srcset
            img.src = url;
            img.removeAttribute('srcset');
            img.style.boxSizing = 'border-box';
        });
    }

    // 监听DOM变化，处理异步加载内容
    const observer = new MutationObserver(handleUpdate);
    observer.observe(document.body, { childList: true, subtree: true });

    // 定期检查更新（处理URL变化等情况）
    setInterval(handleUpdate, 1000);

    console.log('✅脚本已运行_双容器替换模式已启动');
})();
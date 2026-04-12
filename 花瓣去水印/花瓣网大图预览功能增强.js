// ==UserScript==
// @name         花瓣网大图预览功能增强
// @namespace    http://tampermonkey.net/
// @version      8.3
// @description  修复取色点击复制。支持右键菜单变换构图线。极坐标螺旋方程驱动，取色(C)与双击复制。
// @author       爱吃馍
// @match        *://huaban.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- 状态配置 ---
    const isPersistentGuide = false;
    let currentScale = 1, baseWidth = 0, baseHeight = 0, currentImgSrc = "";
    let guideMode = 0;
    let flipX = 1, flipY = 1, rotation = 0;

    const modes = [
        "关闭", "三分法", "黄金分割", "数学黄金螺旋 (b≈0.306)",
        "等角螺旋 (b=0.175)", "哈蒙网格", "拉巴特矩形",
        "动态对称", "黄金三角", "对角线法则", "V形透视", "S形流线", "放射向心", "根号2矩形", "正/倒三角", "安全边距"
    ];

    const getOriginalUrl = (url) => url ? url.replace(/_(f|m)w\d+(webp)?/g, '') : url;

    // --- UI 组件 ---
    function showToast(text) {
        const toast = document.createElement('div');
        toast.innerText = text;
        toast.style.cssText = `position:fixed; top:20px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.85); color:#fff; padding:8px 20px; border-radius:50px; z-index:2147483647; font-size:13px; font-weight:bold; pointer-events:none; border:1px solid rgba(255,255,255,0.2); box-shadow:0 4px 15px rgba(0,0,0,0.4);`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 1200);
    }

    const pickerLabel = document.createElement('div');
    pickerLabel.style.cssText = `position:fixed; display:none; background:rgba(0,0,0,0.9); color:#fff; padding:5px 12px; border-radius:4px; font-size:12px; z-index:2147483646; pointer-events:none; font-family:monospace; border:1px solid #555;`;
    document.body.appendChild(pickerLabel);

    const menu = document.createElement('div');
    menu.id = "guide-context-menu";
    menu.style.cssText = `position:fixed; display:none; background:#1a1a1a; color:#eee; border:1px solid #333; border-radius:8px; z-index:2147483647; padding:6px 0; font-size:13px; box-shadow:0 10px 30px rgba(0,0,0,0.6); min-width:150px; cursor:default; overflow:hidden;`;

    [{l:'↔ 水平镜像', a:()=>{flipX*=-1}}, {l:'↕ 垂直翻转', a:()=>{flipY*=-1}}, {l:'↻ 旋转 90°', a:()=>{rotation=(rotation+90)%360}}, {l:'↺ 重置变换', a:()=>{flipX=1;flipY=1;rotation=0}}].forEach(item => {
        const btn = document.createElement('div');
        btn.innerText = item.l;
        btn.style.cssText = `padding:10px 18px; transition:0.2s;`;
        btn.onmouseover = () => btn.style.background = '#333';
        btn.onmouseout = () => btn.style.background = 'transparent';
        btn.onmousedown = (e) => {
            e.preventDefault(); e.stopPropagation();
            item.a();
            const div = document.querySelector('div[data-gd-expose="dialog_expose"]');
            if(div) updateGuides(div);
            menu.style.display = 'none';
        };
        menu.appendChild(btn);
    });
    document.body.appendChild(menu);

    // --- 核心方程 ---
    function getSpiralD(cX, cY, b, rotations, a=1.2) {
        let d = ""; const pts = 300;
        for (let i = 0; i <= pts * rotations; i++) {
            const t = (i / pts) * (Math.PI * 2);
            const r = a * Math.exp(b * t);
            const x = cX + r * Math.cos(t + Math.PI), y = cY + r * Math.sin(t + Math.PI);
            if (x < -400 || x > 500 || y < -400 || y > 500) break;
            d += (i === 0 ? "M" : "L") + `${x.toFixed(3)},${y.toFixed(3)} `;
        }
        return d;
    }

    // --- 事件流 ---

    // 1. 缩放
    window.addEventListener('wheel', function(e) {
        const div = document.querySelector('div[data-gd-expose="dialog_expose"]');
        if (div && e.altKey) {
            e.preventDefault();
            const img = div.querySelector('img');
            const hr = getOriginalUrl(img.src);
            if (currentImgSrc !== hr) {
                currentImgSrc = hr; img.src = hr; img.crossOrigin = "Anonymous";
                currentScale = 1; baseWidth = div.offsetWidth; baseHeight = div.offsetHeight;
                if (!isPersistentGuide) { guideMode = 0; flipX = 1; flipY = 1; rotation = 0; }
                updateGuides(div);
            }
            const prev = currentScale;
            currentScale = Math.max(1, Math.min(12, currentScale + (e.deltaY < 0 ? 0.05 : -0.05)));
            const rect = div.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width, py = (e.clientY - rect.top) / rect.height;
            div.style.width = (baseWidth * currentScale) + 'px';
            div.style.height = (baseHeight * currentScale) + 'px';
            div.style.marginLeft = ((parseFloat(div.style.marginLeft) || 0) - (baseWidth * currentScale - baseWidth * prev) * px) + 'px';
            div.style.marginTop = ((parseFloat(div.style.marginTop) || 0) - (baseHeight * currentScale - baseHeight * prev) * py) + 'px';
            updateGuides(div);
        }
    }, { passive: false });

    // 2. 右键菜单拦截 (捕获阶段)
    window.addEventListener('contextmenu', (e) => {
        const div = e.target.closest('div[data-gd-expose="dialog_expose"]');
        if (div && guideMode !== 0) {
            e.preventDefault(); e.stopPropagation();
            menu.style.display = 'block';
            menu.style.left = e.clientX + 'px';
            menu.style.top = e.clientY + 'px';
        }
    }, true);

    // 3. 点击逻辑 (取色复制 + 关闭菜单)
    window.addEventListener('mousedown', (e) => {
        // 关闭菜单
        if (!e.target.closest('#guide-context-menu')) {
            menu.style.display = 'none';
        }

        // 取色复制逻辑 (左键 button 0)
        if (pickerLabel.style.display === 'block' && e.button === 0) {
            const hex = pickerLabel.innerText;
            if (hex && hex.startsWith("#")) {
                navigator.clipboard.writeText(hex).then(() => {
                    showToast(`已复制色值: ${hex}`);
                });
            }
        }
    }, true); // 同样使用捕获阶段确保优先处理

    // 4. 双击复制图片
    window.addEventListener('dblclick', async (e) => {
        const div = e.target.closest('div[data-gd-expose="dialog_expose"]');
        if (div && !e.target.closest('#guide-context-menu') && pickerLabel.style.display !== 'block') {
            const img = div.querySelector('img');
            try {
                showToast('正在读取原图...');
                const resp = await fetch(getOriginalUrl(img.src));
                const blob = await resp.blob();
                await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
                showToast('✅ 原图已复制');
            } catch (err) { showToast('❌ 复制失败'); }
        }
    });

    // 5. 键盘与鼠标移动
    window.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        const div = document.querySelector('div[data-gd-expose="dialog_expose"]');
        if (k === 'g' && div) {
            guideMode = (guideMode + 1) % modes.length;
            showToast(`模式: ${modes[guideMode]}`);
            updateGuides(div);
        }
        if (k === 'c') pickerLabel.style.display = 'block';
    });
    window.addEventListener('keyup', (e) => {
        if (e.key.toLowerCase() === 'c') pickerLabel.style.display = 'none';
    });

    window.addEventListener('mousemove', (e) => {
        const div = document.querySelector('div[data-gd-expose="dialog_expose"]');
        if (pickerLabel.style.display === 'block' && div) {
            const img = div.querySelector('img');
            pickerLabel.style.left = (e.clientX + 15) + 'px';
            pickerLabel.style.top = (e.clientY + 15) + 'px';
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = canvas.height = 1;
            const rect = img.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * img.naturalWidth;
            const y = ((e.clientY - rect.top) / rect.height) * img.naturalHeight;
            try {
                ctx.drawImage(img, x, y, 1, 1, 0, 0, 1, 1);
                const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
                const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
                pickerLabel.innerText = hex;
                pickerLabel.style.borderLeft = `12px solid ${hex}`;
            } catch (err) { pickerLabel.innerText = "CORS Locked"; }
        }
    });

    // --- 绘图引擎 ---
    function updateGuides(container) {
        let overlay = container.querySelector('.pro-guides');
        if (guideMode === 0) { if (overlay) overlay.remove(); return; }
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'pro-guides';
            overlay.style.cssText = `position:absolute; inset:0; pointer-events:none; z-index:1000; overflow:hidden; transition: transform 0.2s linear;`;
            container.appendChild(overlay);
        }
        overlay.style.transform = `scale(${flipX}, ${flipY}) rotate(${rotation}deg)`;
        overlay.innerHTML = '';
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", "0 0 100 100");
        svg.setAttribute("preserveAspectRatio", "none");
        svg.style.cssText = `width:100%; height:100%; opacity:0.9; fill:none; stroke:#fff; stroke-width:0.3; filter: drop-shadow(0 0 1px #000);`;
        const draw = (d, color="#fff", w=0.3) => {
            const p = document.createElementNS(svgNS, "path");
            p.setAttribute("d", d); p.setAttribute("stroke", color); p.setAttribute("stroke-width", w);
            return p;
        };
        const bGold = Math.log(1.618034) / (Math.PI / 2);
        switch(guideMode) {
            case 1: svg.appendChild(draw("M33.3,0 V100 M66.6,0 V100 M0,33.3 H100 M0,66.6 H100")); break;
            case 2: svg.appendChild(draw("M38.2,0 V100 M61.8,0 V100 M0,38.2 H100 M0,61.8 H100")); break;
            case 3:
                svg.appendChild(draw(getSpiralD(61.803, 38.196, bGold, 4.5), "#FFD700", 0.5));
                svg.appendChild(draw("M61.8,0 V100 M0,38.2 H100", "rgba(255,255,255,0.2)", 0.2)); break;
            case 4:
                svg.appendChild(draw(getSpiralD(50, 50, 0.175, 6), "#00FFFF", 0.5));
                svg.appendChild(draw("M50,0 V100 M0,50 H100", "rgba(255,255,255,0.2)", 0.2)); break;
            case 5: svg.appendChild(draw("M25,0 V100 M50,0 V100 M75,0 V100 M0,25 H100 M0,50 H100 M0,75 H100")); break;
            case 6:
                const r = container.offsetHeight / container.offsetWidth, e = r < 1 ? r * 100 : (1/r) * 100;
                svg.appendChild(draw(`M${e},0 V100 M${100-e},0 V100 M0,${e} H100 M0,${100-e} H100`)); break;
            case 7:
                svg.appendChild(draw("M0,0 L100,100 M0,100 L100,0"));
                svg.appendChild(draw("M0,0 L100,61.8 M0,100 L100,38.2 M100,0 L0,61.8 M100,100 L0,38.2", "rgba(255,255,255,0.3)")); break;
            case 8: svg.appendChild(draw("M0,100 L100,0 M0,0 L61.8,100 M100,100 L38.2,0")); break;
            case 9: svg.appendChild(draw("M0,0 L100,100 M100,0 L0,100 M50,0 V100 M0,50 H100")); break;
            case 10: svg.appendChild(draw("M0,0 L50,85 L100,0 M50,85 V100")); break;
            case 11: svg.appendChild(draw("M50,0 C120,30 -20,70 50,100", "#FFD700", 0.5)); break;
            case 12: for(let i=0; i<360; i+=45) { const rad = (i * Math.PI) / 180; svg.appendChild(draw(`M50,50 L${50+50*Math.cos(rad)},${50+50*Math.sin(rad)}`)); } break;
            case 13: svg.appendChild(draw("M0,70.7 H100 M0,29.3 H100 M29.3,0 V100 M70.7,0 V100", "rgba(200,255,255,0.4)")); break;
            case 14: svg.appendChild(draw("M50,5 L95,90 H5 Z M5,5 H95 L50,90 Z")); break;
            case 15: svg.appendChild(draw("M5,5 H95 V95 H5 Z M10,10 H90 V90 H10 Z", "rgba(255,255,255,0.2)")); break;
        }
        overlay.appendChild(svg);
    }

    const resetState = () => {
        currentScale = 1; baseWidth = 0; baseHeight = 0; currentImgSrc = "";
        flipX = 1; flipY = 1; rotation = 0; guideMode = 0;
        const div = document.querySelector('div[data-gd-expose="dialog_expose"]');
        if (div) {
            div.style.marginLeft = div.style.marginTop = "0px"; div.style.width = div.style.height = "";
            const g = div.querySelector('.pro-guides'); if (g) g.remove();
        }
    };

    const obs = new MutationObserver(() => { if (!document.querySelector('div[data-gd-expose="dialog_expose"]')) resetState(); });
    obs.observe(document.body, { childList: true, subtree: true });

})();
# 移动端性能优化报告 - dele-miku

## 一、当前实现分析

### main.js 关键发现

| 特性 | 当前状态 | 评价 |
|------|----------|------|
| `passive: true` | 已正确使用在 scroll/touch 事件 | ✅ |
| `requestAnimationFrame` | 用于 parallax 和 picker 动画 | ✅ |
| IntersectionObserver | 用于 timeline 入场动画 | ✅ |
| 图片懒加载 | `loading="lazy"` | ⚠️ 仅原生属性 |
| 骨架屏隐藏 | 等待所有 Promise.all 图片加载完成 | ❌ 阻塞首屏 |
| Timeline 渲染 | 17个项目全部渲染 | ⚠️ 无虚拟化 |

### CSS 关键发现

| 特性 | 当前状态 | 评价 |
|------|----------|------|
| `scroll-behavior: smooth` | 全局启用 | ⚠️ 在低端机上有性能问题 |
| `will-change` | 未使用 | ❌ 可优化 |
| 硬件加速 | 使用 transform/opacity | ✅ |

---

## 二、骨架屏优化 (gallery-skeleton)

### 问题分析

当前实现 (`main.js` 第 580-590 行):
```javascript
Promise.all(galleryImages.map(src => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve;
    img.src = src;
  });
})).then(() => {
  if (gallerySkeleton) gallerySkeleton.style.display = 'none';
});
```

**问题**: 必须等待所有 4 张图片加载完成才消失，即使首屏只显示 1 张。

### 优化方案

```javascript
// 方案 1: 首图优先 + 超时保底
function hideSkeletonEarly() {
  const skeleton = document.getElementById('gallerySkeleton');
  if (!skeleton) return;
  
  // 方案 A: 首图加载完成即隐藏
  const firstImg = new Image();
  firstImg.onload = () => { skeleton.style.display = 'none'; };
  firstImg.onerror = () => { skeleton.style.display = 'none'; };
  firstImg.src = galleryImages[0];
  
  // 方案 B: 超时保底 (避免首图加载失败一直显示骨架)
  setTimeout(() => { skeleton.style.display = 'none'; }, 2000);
}

// 方案 2: IntersectionObserver 检测实际可见性
function setupSkeletonObserver() {
  const skeleton = document.getElementById('gallerySkeleton');
  const gallery = document.getElementById('galleryTrack');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
        hideSkeletonEarly();
        observer.disconnect();
      }
    });
  }, { threshold: [0.1, 0.5] });
  
  observer.observe(gallery);
}
```

### 推荐配置

```javascript
// 最佳实践: 首图优先 + 300ms 最小显示 + 2s 超时
function initGallerySkeleton() {
  const skeleton = document.getElementById('gallerySkeleton');
  if (!skeleton) return;
  
  let hidden = false;
  const hide = () => {
    if (hidden) return;
    hidden = true;
    skeleton.style.opacity = '0';
    skeleton.style.transition = 'opacity 0.3s ease';
    setTimeout(() => skeleton.style.display = 'none', 300);
  };
  
  // 首图加载成功即隐藏
  const firstImg = new Image();
  firstImg.onload = hide;
  firstImg.onerror = hide;
  firstImg.src = galleryImages[0];
  
  // 2秒强制隐藏 (保底)
  setTimeout(hide, 2000);
}
```

---

## 三、图片懒加载最佳实践

### 当前问题

```html
<img src="assets/images/gallery-1.webp" loading="lazy">
```

**问题**: 原生 `loading="lazy"` 在某些旧版移动浏览器不支持，且无法控制加载优先级。

### 优化方案

```javascript
// IntersectionObserver 懒加载 + 预加载哨兵
function initLazyLoad() {
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        img.classList.add('loaded');
        imageObserver.unobserve(img);
      }
    });
  }, {
    root: null,
    rootMargin: '50px 0px',  // 提前 50px 开始加载
    threshold: 0.01
  });
  
  lazyImages.forEach(img => imageObserver.observe(img));
}

// CSS 过渡效果
img {
  opacity: 0;
  transition: opacity 0.3s ease;
}
img.loaded,
img[loading="lazy"].loaded {
  opacity: 1;
}
```

---

## 四、Timeline 时间线优化 (17个项目)

### 问题分析

快速滑动时:
1. 17 个 DOM 节点全部渲染
2. 每个 item 有 150ms 过渡延迟动画
3. 可能触发大量重排/重绘

### 优化方案

#### 方案 1: 虚拟滚动 (推荐用于 20+ 项目)

```javascript
// 虚拟滚动实现
class VirtualTimeline {
  constructor(container, items, itemHeight = 120) {
    this.container = container;
    this.items = items;
    this.itemHeight = itemHeight;
    this.visibleCount = 0;
    this.startIndex = 0;
    
    this.viewport = document.createElement('div');
    this.viewport.className = 'timeline-viewport';
    this.viewport.style.cssText = `
      height: ${this.visibleCount * this.itemHeight}px;
      position: relative;
    `;
    
    this.content = document.createElement('div');
    this.content.className = 'timeline-content';
    this.viewport.appendChild(this.content);
    container.appendChild(this.viewport);
    
    this.setupObserver();
    this.update();
  }
  
  setupObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.update();
        }
      });
    }, { threshold: 0.1 });
    
    observer.observe(this.container);
  }
  
  update() {
    const scrollTop = window.scrollY;
    const viewportHeight = window.innerHeight;
    const containerRect = this.container.getBoundingClientRect();
    const offsetTop = containerRect.top + scrollTop;
    
    this.startIndex = Math.max(0, Math.floor((scrollTop - offsetTop) / this.itemHeight) - 2);
    const endIndex = Math.min(
      this.items.length,
      Math.ceil((scrollTop + viewportHeight - offsetTop) / this.itemHeight) + 2
    );
    
    // 只渲染可见区域 + buffer
    this.content.style.transform = `translateY(${this.startIndex * this.itemHeight}px)`;
    this.content.innerHTML = this.items
      .slice(this.startIndex, endIndex)
      .map((item, i) => this.renderItem(item, this.startIndex + i))
      .join('');
  }
  
  renderItem(item, index) {
    return `
      <div class="timeline-item visible" style="height: ${this.itemHeight}px">
        ${item.content}
      </div>
    `;
  }
}
```

#### 方案 2: 快速滑动时的动画节流 (17个项目无需虚拟滚动)

```javascript
// 滚动时禁用过渡动画
function initTimelineAnimations() {
  const timeline = document.querySelector('.timeline');
  const items = document.querySelectorAll('.timeline-item');
  let scrollTimeout;
  let isFastScrolling = false;
  
  // 快速滑动时临时禁用动画
  function disableAnimations() {
    if (isFastScrolling) return;
    isFastScrolling = true;
    items.forEach(item => item.style.transition = 'none');
  }
  
  // 滚动停止后恢复动画
  function enableAnimations() {
    if (!isFastScrolling) return;
    scrollTimeout = setTimeout(() => {
      isFastScrolling = false;
      items.forEach(item => item.style.transition = '');
    }, 150);
  }
  
  timeline.addEventListener('scroll', disableAnimations, { passive: true });
  window.addEventListener('scroll', enableAnimations, { passive: true });
  
  // IntersectionObserver 保持原样
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
  
  items.forEach(item => observer.observe(item));
}
```

---

## 五、CSS will-change 优化

### 正确使用方式

```css
/* 正确的 will-change 使用: 明确指定属性 */
.gallery-track {
  will-change: transform;
}

/* 避免: 滥用 all */
.bad-example {
  will-change: all; /* 造成严重性能问题 */
}

/* 何时使用:
   1. 元素即将开始动画 (提前 100-200ms)
   2. 动画是确定会发生的
   3. 动画结束后移除 will-change
*/

.gallery-item {
  will-change: transform, opacity;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

/* 激活时的 will-change */
.gallery-item.active {
  will-change: transform;
}

/* 动画结束后清理 */
.gallery-item.animated {
  will-change: auto; /* 让浏览器释放内存 */
}
```

### JS 控制 will-change

```javascript
// 预判滚动方向，提前开启硬件加速
function setupParallaxOptimization() {
  const heroBg = document.getElementById('heroBg');
  let lastScrollY = 0;
  let scrollDirection = 'down';
  
  window.addEventListener('scroll', () => {
    scrollDirection = window.scrollY > lastScrollY ? 'down' : 'up';
    lastScrollY = window.scrollY;
    
    // 向下滚动时提前准备 transform
    if (scrollDirection === 'down' && !heroBg.style.willChange) {
      heroBg.style.willChange = 'transform';
    }
  }, { passive: true });
  
  // 滚动停止后清理
  let resetTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(resetTimeout);
    resetTimeout = setTimeout(() => {
      heroBg.style.willChange = 'auto';
    }, 500);
  }, { passive: true });
}
```

---

## 六、scroll-behavior: smooth 替代方案

### 问题

```css
html {
  scroll-behavior: smooth; /* 在低端机上有性能问题 */
}
```

### 替代方案: JS 控制平滑滚动

```javascript
// 推荐: 根据设备性能选择性启用
function initSmoothScroll() {
  const isLowEndDevice = () => {
    return navigator.hardwareConcurrency <= 2 || 
           /Android.*Mobile/.test(navigator.userAgent);
  };
  
  if (isLowEndDevice()) {
    // 低端设备: 禁用 CSS smooth scroll，改用 JS 即时跳转
    document.documentElement.style.scrollBehavior = 'auto';
  }
}

// 点击导航跳转使用 JS 动画
function setupNavigationScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        const offset = target.offsetTop - 80;
        // 低端机用即时跳转，高端机用平滑滚动
        if (isLowEndDevice()) {
          window.scrollTo(0, offset);
        } else {
          window.scrollTo({
            top: offset,
            behavior: 'smooth'
          });
        }
      }
    });
  });
}
```

---

## 七、被动事件监听器全面检查

### 当前已正确实现的地方

```javascript
// ✅ 已正确使用 passive: true
window.addEventListener('scroll', handler, { passive: true });
galleryTrack.addEventListener('touchstart', handler, { passive: true });
document.addEventListener('touchmove', handler, { passive: true });
progressBar.addEventListener('touchstart', startDrag, { passive: true });
```

### 需要修复的地方

```javascript
// ❌ progressBar mousedown/mousemove/mouseup 不是 passive
progressBar.addEventListener('mousedown', startDrag);  // 需要 passive: true
document.addEventListener('mousemove', handleProgressDrag);  // 需要 passive: true
document.addEventListener('mouseup', endDrag);  // 需要 passive: true

// ✅ 修复后
progressBar.addEventListener('mousedown', startDrag, { passive: true });
document.addEventListener('mousemove', handleProgressDrag, { passive: true });
document.addEventListener('mouseup', endDrag, { passive: true });
```

---

## 八、硬件加速技巧

### transform 和 opacity 优先

```css
/* ✅ 好: 使用 transform/opacity */
.fade-in {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.3s, transform 0.3s;
}
.fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}

/* ❌ 差: 使用 layout 属性 */
.fade-in {
  display: none;
  height: 100px;
  margin-top: 20px;
  transition: height 0.3s, margin-top 0.3s;
}
```

### 启用 GPU 加速

```css
/* 强制使用 GPU */
.gallery-item {
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* 组合使用 */
.hero-content {
  transform: translateZ(0);
  will-change: transform, opacity;
}
```

---

## 九、完整优化清单

### 高优先级 (立即实施)

| 优化项 | 预期效果 | 实施难度 |
|--------|----------|----------|
| 骨架屏改为首图加载即隐藏 | 首屏快 1-3s | ⭐ |
| 移除 `scroll-behavior: smooth` | 减少滚动卡顿 | ⭐ |
| 修复 mouse 事件为 passive | 滚动更流畅 | ⭐ |
| Timeline 项目添加 `will-change` | 动画更顺滑 | ⭐ |

### 中优先级 (建议实施)

| 优化项 | 预期效果 | 实施难度 |
|--------|----------|----------|
| 引入 IntersectionObserver 懒加载 | 节省带宽 | ⭐⭐ |
| Timeline 动画节流 | 快速滑动更流畅 | ⭐⭐ |
| 导航滚动降级为即时跳转 | 低端机体验提升 | ⭐⭐ |

### 低优先级 (可选)

| 优化项 | 预期效果 | 实施难度 |
|--------|----------|----------|
| 实现虚拟滚动 | 内存占用降低 | ⭐⭐⭐ |
| 预加载哨兵机制 | 滚动时图片加载无白块 | ⭐⭐⭐ |

---

## 十、建议的代码修改顺序

1. **main.js 第 580-590 行**: 骨架屏优化
2. **style.css**: 移除 `scroll-behavior: smooth`
3. **main.js**: 修复 mouse 事件 passive
4. **main.js**: Timeline will-change 优化
5. **main.js**: 懒加载增强

报告生成时间: 2026-04-10

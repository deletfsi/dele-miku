/**
 * 初音未来 - 交互逻辑
 * 包含：Parallax、粒子系统、打字机效果、画廊滑动、灯箱、21首歌曲选择
 */

(function() {
  'use strict';

  // ========================================
  // 歌曲播放列表
  // ========================================
  const PLAYLIST = [
    { index: 0,  title: "世界第一的公主殿下",        duration: 210, filename: "000_世界第一的公主殿下.m4a" },
    { index: 1,  title: "千本桜",                    duration: 243, filename: "playlist/001_【初音未来】MIKU经典歌曲合集 p01 千本桜.m4a" },
    { index: 2,  title: "胧月（朦胧月色）",          duration: 255, filename: "playlist/002_【初音未来】MIKU经典歌曲合集 p02 胧月 (朦胧月色).m4a" },
    { index: 3,  title: "深海少女",                  duration: 206, filename: "playlist/003_【初音未来】MIKU经典歌曲合集 p03 深海少女.m4a" },
    { index: 4,  title: "私の世界",                  duration: 279, filename: "playlist/004_【初音未来】MIKU经典歌曲合集 p04 私の世界.m4a" },
    { index: 5,  title: "ツギハギスタッカート",      duration: 249, filename: "playlist/005_【初音未来】MIKU经典歌曲合集 p05 ツギハギスタッカート (拼凑的断音).m4a" },
    { index: 6,  title: "恋愛裁判",                  duration: 220, filename: "playlist/006_【初音未来】MIKU经典歌曲合集 p06 恋愛裁判.m4a" },
    { index: 7,  title: "愛言葉（爱的言语）",        duration: 265, filename: "playlist/007_【初音未来】MIKU经典歌曲合集 p07 愛言葉 (爱的言语).m4a" },
    { index: 8,  title: "Hand in Hand",              duration: 312, filename: "playlist/008_【初音未来】MIKU经典歌曲合集 p08 Hand in Hand.m4a" },
    { index: 9,  title: "就算没有爱只要有你就好",    duration: 273, filename: "playlist/009_【初音未来】MIKU经典歌曲合集 p09 愛されなくても君がいる (就算没有爱 只要有你就好）.m4a" },
    { index: 10, title: "夕日坂（夕阳下的坡道）",     duration: 381, filename: "playlist/010_【初音未来】MIKU经典歌曲合集 p10 夕日坂 (夕阳下的坡道).m4a" },
    { index: 11, title: "蜘蛛糸モノポリー",          duration: 272, filename: "playlist/011_【初音未来】MIKU经典歌曲合集 p11 蜘蛛糸モノポリー (蜘蛛丝Monopoly).m4a" },
    { index: 12, title: "夢と葉桜（梦与叶樱）",      duration: 254, filename: "playlist/012_【初音未来】MIKU经典歌曲合集 p12 夢と葉桜 (梦与叶樱）.m4a" },
    { index: 13, title: "你的梦就是我的梦",          duration: 232, filename: "playlist/013_【初音未来】MIKU经典歌曲合集 p13 君の夢は私の夢 (你的梦就是我的梦).m4a" },
    { index: 14, title: "君に嘘（对你撒谎）",        duration: 240, filename: "playlist/014_【初音未来】MIKU经典歌曲合集 p14 君に嘘 (对你撒谎).m4a" },
    { index: 15, title: "ReAct",                      duration: 288, filename: "playlist/015_【初音未来】MIKU经典歌曲合集 p15 ReAct.m4a" },
    { index: 16, title: "December 26th",             duration: 290, filename: "playlist/016_【初音未来】MIKU经典歌曲合集 p16 December 26th (Re-present).m4a" },
    { index: 17, title: "ジェンガ（积木）",          duration: 298, filename: "playlist/017_【初音未来】MIKU经典歌曲合集 p17 ジェンガ (积木).m4a" },
    { index: 18, title: "magnet（磁铁）",            duration: 245, filename: "playlist/018_【初音未来】MIKU经典歌曲合集 p18 magnet (磁铁).m4a" },
    { index: 19, title: "鏡花水月",                  duration: 357, filename: "playlist/019_【初音未来】MIKU经典歌曲合集 p19 鏡花水月.m4a" },
    { index: 20, title: "天空之城 (TV Version)",       duration: 202, filename: "playlist/020_【初音未来】MIKU经典歌曲合集 p20 天空之城 (TV Version).m4a" },
    { index: 21, title: "花葬",                      duration: 243, filename: "playlist/021_【初音未来】MIKU经典歌曲合集 p21 花葬.m4a" }
  ];

  // ========================================
  // 播放模式
  // ========================================
  const PLAY_MODES = {
    SEQUENTIAL: 'sequential',  // 顺序播放
    LOOP: 'loop',               // 单曲循环
    RANDOM: 'random'            // 随机播放
  };

  let currentSongIndex = 0;
  let isPlaying = false;
  let audioContext = null;
  let sourceNode = null;
  let audioBuffer = null;
  let startOffset = 0;
  let audioStartTime = 0;
  let playMode = PLAY_MODES.SEQUENTIAL;
  let isDraggingProgress = false;

  // ========================================
  // DOM 元素
  // ========================================
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  // ========================================
  // 1. 导航栏
  // ========================================
  const navbar = $('#navbar');
  const navToggle = $('#navToggle');
  const navMenu = $('#navMenu');
  const navLinks = $$('.nav-link');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
      navToggle.classList.remove('active');
    });
  });

  // 高亮当前 section
  const sections = $$('section[id]');
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => link.classList.remove('active'));
        const activeLink = $(`.nav-link[href="#${entry.target.id}"]`);
        if (activeLink) activeLink.classList.add('active');
      }
    });
  }, { rootMargin: '-50% 0px -50% 0px' });
  sections.forEach(section => navObserver.observe(section));

  // ========================================
  // 2. Hero - 多层景深视差
  // ========================================
  const heroBg = $('#heroBg');
  const heroGlows = $$('.hero-glow');
  const heroContent = $('.hero-content');
  let ticking = false;

  function updateParallax() {
    const scrolled = window.scrollY;
    const heroHeight = $('#hero').offsetHeight;
    if (scrolled <= heroHeight) {
      // 背景层 - 最慢
      heroBg.style.transform = `translateY(${scrolled * 0.3}px)`;
      // 光斑层 - 中等速度
      heroGlows.forEach((glow, i) => {
        const speed = 0.2 + i * 0.1;
        glow.style.transform = `translateY(${scrolled * speed}px)`;
      });
      // 内容层 - 最快，渐隐
      const opacity = Math.max(0, 1 - scrolled / heroHeight);
      heroContent.style.transform = `translateY(${scrolled * 0.15}px)`;
      heroContent.style.opacity = opacity;
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });

  // ========================================
  // 3. Hero - 音乐播放
  // ========================================
  const heroPlay = $('#heroPlay');
  const playText = $('#playText');

  heroPlay.addEventListener('click', () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playCurrentSong();
    }
  });

  // ========================================
  // 4. Profile - 打字机效果
  // ========================================
  const profileData = [
    { label: '年龄', value: '16 岁' },
    { label: '身高', value: '158cm' },
    { label: '体重', value: '42kg' },
    { label: '声源', value: '藤田咲' },
    { label: '生日', value: '8月31日' },
    { label: '代表色', value: '#39C5BB 苍绿' }
  ];

  function typeWriter(element, text, callback) {
    const valueEl = element.querySelector('.data-value');
    valueEl.classList.add('typing');
    let i = 0;
    function type() {
      if (i < text.length) {
        valueEl.textContent += text.charAt(i);
        i++;
        setTimeout(type, 80 + Math.random() * 40);
      } else {
        valueEl.classList.remove('typing');
        if (callback) callback();
      }
    }
    type();
  }

  const profileObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        let delay = 0;
        $$('.data-item').forEach((item, index) => {
          setTimeout(() => typeWriter(item, profileData[index].value), delay);
          delay += 400;
        });
        profileObserver.disconnect();
      }
    });
  }, { threshold: 0.3 });

  const profileSection = $('#profile');
  if (profileSection) profileObserver.observe(profileSection);

  // 水波纹效果
  const profileBadge = $('#profileBadge');
  const rippleContainer = $('#rippleContainer');

  profileBadge.addEventListener('click', (e) => {
    const rect = profileBadge.getBoundingClientRect();
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    ripple.style.left = (e.clientX - rect.left) + 'px';
    ripple.style.top = (e.clientY - rect.top) + 'px';
    rippleContainer.appendChild(ripple);
    setTimeout(() => ripple.remove(), 800);
  });

  // ========================================
  // 5. Gallery - 横向滑动
  // ========================================
  const galleryTrack = $('#galleryTrack');
  const gallerySkeleton = $('#gallerySkeleton');
  const galleryPrev = $('#galleryPrev');
  const galleryNext = $('#galleryNext');
  const galleryDots = $('#galleryDots');

  const galleryImages = [
    'assets/images/gallery-1.webp',
    'assets/images/gallery-2.webp',
    'assets/images/gallery-3.webp',
    'assets/images/gallery-4.webp'
  ];

  let currentSlide = 0;
  let touchStartX = 0;

  function createGallery() {
    galleryImages.forEach((src, index) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.dataset.index = index;
      const img = document.createElement('img');
      img.src = src;
      img.alt = `初音未来 ${index + 1}`;
      img.loading = 'lazy';
      item.appendChild(img);
      galleryTrack.appendChild(item);
      item.addEventListener('click', () => openLightbox(index));
    });
  }

  function createDots() {
    galleryImages.forEach((_, index) => {
      const dot = document.createElement('div');
      dot.className = 'gallery-dot' + (index === 0 ? ' active' : '');
      dot.dataset.index = index;
      dot.addEventListener('click', () => goToSlide(index));
      galleryDots.appendChild(dot);
    });
  }

  function goToSlide(index) {
    currentSlide = index;
    const items = $$('.gallery-item');
    if (items[index]) {
      items[index].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
    $$('.gallery-dot').forEach((dot, i) => dot.classList.toggle('active', i === index));
  }

  galleryPrev.addEventListener('click', () => { if (currentSlide > 0) goToSlide(currentSlide - 1); });
  galleryNext.addEventListener('click', () => { if (currentSlide < galleryImages.length - 1) goToSlide(currentSlide + 1); });

  galleryTrack.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
  galleryTrack.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentSlide < galleryImages.length - 1) goToSlide(currentSlide + 1);
      else if (diff < 0 && currentSlide > 0) goToSlide(currentSlide - 1);
    }
  }, { passive: true });

  let scrollTimeout;
  galleryTrack.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const items = $$('.gallery-item');
      const trackRect = galleryTrack.getBoundingClientRect();
      const centerX = trackRect.left + trackRect.width / 2;
      items.forEach((item, index) => {
        const itemRect = item.getBoundingClientRect();
        const itemCenterX = itemRect.left + itemRect.width / 2;
        if (Math.abs(centerX - itemCenterX) < itemRect.width / 2) {
          currentSlide = index;
          $$('.gallery-dot').forEach((dot, i) => dot.classList.toggle('active', i === index));
        }
      });
    }, 100);
  }, { passive: true });

  // ========================================
  // 6. 灯箱
  // ========================================
  const lightbox = $('#lightbox');
  const lightboxImg = $('#lightboxImg');
  const lightboxClose = $('#lightboxClose');
  const lightboxPrev = $('#lightboxPrev');
  const lightboxNext = $('#lightboxNext');
  const lightboxCurrent = $('#lightboxCurrent');
  const lightboxTotal = $('#lightboxTotal');

  let lightboxIndex = 0;

  function openLightbox(index) {
    lightboxIndex = index;
    lightboxImg.src = galleryImages[index];
    lightboxCurrent.textContent = index + 1;
    lightboxTotal.textContent = galleryImages.length;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  lightboxPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    lightboxIndex = (lightboxIndex - 1 + galleryImages.length) % galleryImages.length;
    lightboxImg.src = galleryImages[lightboxIndex];
    lightboxCurrent.textContent = lightboxIndex + 1;
  });
  lightboxNext.addEventListener('click', (e) => {
    e.stopPropagation();
    lightboxIndex = (lightboxIndex + 1) % galleryImages.length;
    lightboxImg.src = galleryImages[lightboxIndex];
    lightboxCurrent.textContent = lightboxIndex + 1;
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') {
      lightboxIndex = (lightboxIndex - 1 + galleryImages.length) % galleryImages.length;
      lightboxImg.src = galleryImages[lightboxIndex];
      lightboxCurrent.textContent = lightboxIndex + 1;
    }
    if (e.key === 'ArrowRight') {
      lightboxIndex = (lightboxIndex + 1) % galleryImages.length;
      lightboxImg.src = galleryImages[lightboxIndex];
      lightboxCurrent.textContent = lightboxIndex + 1;
    }
  });

  // ========================================
  // 7. Canvas 粒子系统
  // ========================================
  const canvas = $('#particleCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let touchTrail = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 3 + 1.5;
      this.speedX = (Math.random() - 0.5) * 0.6;
      this.speedY = (Math.random() - 0.5) * 0.6;
      this.opacity = Math.random() * 0.6 + 0.3;
      this.hue = 170 + Math.random() * 20;
      this.connected = false;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (touchTrail.length > 0) {
        const latest = touchTrail[touchTrail.length - 1];
        const dx = latest.x - this.x;
        const dy = latest.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const force = (150 - dist) / 150;
          this.x += dx * force * 0.03;
          this.y += dy * force * 0.03;
        }
      }
      if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
      if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      this.speedX *= 0.999;
      this.speedY *= 0.999;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue}, 80%, 65%, ${this.opacity})`;
      ctx.fill();
      ctx.shadowBlur = 20;
      ctx.shadowColor = `hsla(${this.hue}, 80%, 65%, ${this.opacity})`;
    }
  }

  // 增强粒子系统：60-80个粒子
  const PARTICLE_COUNT = 65;
  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

  // 粒子连线绘制
  function drawConnections() {
    const connectionDistance = 120;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < connectionDistance) {
          const opacity = (1 - dist / connectionDistance) * 0.3;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `hsla(170, 70%, 60%, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections(); // 绘制粒子连线
    if (touchTrail.length > 20) touchTrail.shift();
    requestAnimationFrame(animateParticles);
  }
  animateParticles();

  document.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    touchTrail.push({ x: touch.clientX, y: touch.clientY });
  }, { passive: true });
  document.addEventListener('touchend', () => { touchTrail = []; }, { passive: true });

  // ========================================
  // 8. 音频播放系统
  // ========================================

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function initAudioContext() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  async function loadSong(index) {
    currentSongIndex = index;
    const song = PLAYLIST[index];

    initAudioContext();

    try {
      const response = await fetch(`assets/audio/${song.filename}`);
      const arrayBuffer = await response.arrayBuffer();
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      startOffset = 0;

      updateUI();
    } catch (e) {
      console.error('加载音频失败:', e);
    }
  }

  function playCurrentSong() {
    if (!audioBuffer) return;

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    if (sourceNode) {
      try { sourceNode.stop(); } catch(e) {}
      sourceNode.disconnect();
    }

    sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(audioContext.destination);

    const offset = startOffset;
    sourceNode.start(0, offset);
    sourceNode.onended = () => {
      if (isPlaying) {
        handleSongEnd();
      }
    };

    isPlaying = true;
    audioStartTime = audioContext.currentTime - offset;
    updateUI();
    updateProgress();
  }

  function handleSongEnd() {
    switch (playMode) {
      case PLAY_MODES.LOOP:
        // 单曲循环：重新播放当前歌曲
        loadSong(currentSongIndex).then(() => playCurrentSong());
        break;
      case PLAY_MODES.RANDOM:
        // 随机播放：随机选择下一首（避免重复当前）
        let nextRandom;
        do {
          nextRandom = Math.floor(Math.random() * PLAYLIST.length);
        } while (nextRandom === currentSongIndex && PLAYLIST.length > 1);
        loadSong(nextRandom).then(() => playCurrentSong());
        break;
      case PLAY_MODES.SEQUENTIAL:
      default:
        // 顺序播放：播放下一首，到末尾则停止
        if (currentSongIndex < PLAYLIST.length - 1) {
          currentSongIndex++;
          loadSong(currentSongIndex).then(() => playCurrentSong());
        } else {
          // 到末尾，停止播放
          isPlaying = false;
          startOffset = 0;
          updateUI();
        }
        break;
    }
  }

  function pauseAudio() {
    if (sourceNode) {
      startOffset = audioContext.currentTime - audioStartTime;
      try { sourceNode.stop(); } catch(e) {}
      sourceNode.disconnect();
      sourceNode = null;
    }
    isPlaying = false;
    updateUI();
  }

  function updateUI() {
    const song = PLAYLIST[currentSongIndex];

    // 更新播放卡片
    $('#nowTitle').textContent = song.title;
    $('#selectorTitle').textContent = song.title;
    $('#timeTotal').textContent = formatTime(song.duration);
    $('#playIcon').innerHTML = isPlaying
      ? '<rect x="7" y="5" width="4" height="18" fill="currentColor"/><rect x="17" y="5" width="4" height="18" fill="currentColor"/>'
      : '<polygon points="9,5 23,14 9,23" fill="currentColor"/>';

    // 更新旋转唱片
    const disc = $('#nowPlayingDisc');
    disc.classList.toggle('spinning', isPlaying);

    // 更新播放按钮文字
    playText.textContent = isPlaying ? '暂停' : '点击聆听';

    // 更新 Hero 按钮状态
    heroPlay.classList.toggle('playing', isPlaying);

    // 更新歌曲网格
    $$('.song-card').forEach((card, index) => {
      card.classList.toggle('playing', index === currentSongIndex);
    });

    // 更新下拉列表选中状态
    $$('.song-dropdown-item').forEach((item, index) => {
      item.classList.toggle('active', index === currentSongIndex);
    });

    // 更新滑动选择器
    updatePickerItems();
    scrollPickerToCurrentSong(true);
  }

  function updateProgress() {
    if (!isPlaying || !audioBuffer || isDraggingProgress) return;

    const currentTime = audioContext.currentTime - audioStartTime;
    const progress = Math.min(currentTime / audioBuffer.duration, 1);

    $('#progressFill').style.width = (progress * 100) + '%';
    updateProgressThumb(progress);
    $('#timeCurrent').textContent = formatTime(currentTime);

    if (isPlaying) {
      requestAnimationFrame(updateProgress);
    }
  }

  function updateProgressThumb(progress) {
    const thumb = $('#progressThumb');
    const bar = $('#progressBar');
    if (thumb && bar) {
      const barWidth = bar.offsetWidth;
      thumb.style.left = (progress * barWidth) + 'px';
    }
  }

  // 播放按钮
  $('#playBtn').addEventListener('click', () => {
    if (isPlaying) pauseAudio();
    else playCurrentSong();
  });

  // 上一首/下一首
  $('#prevBtn').addEventListener('click', () => {
    const wasPlaying = isPlaying;
    if (wasPlaying) pauseAudio();

    // 随机模式：随机选择
    if (playMode === PLAY_MODES.RANDOM) {
      let nextRandom;
      do {
        nextRandom = Math.floor(Math.random() * PLAYLIST.length);
      } while (nextRandom === currentSongIndex && PLAYLIST.length > 1);
      currentSongIndex = nextRandom;
    } else {
      currentSongIndex = (currentSongIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
    }

    loadSong(currentSongIndex).then(() => {
      if (wasPlaying) playCurrentSong();
    });
  });

  $('#nextBtn').addEventListener('click', () => {
    const wasPlaying = isPlaying;
    if (wasPlaying) pauseAudio();

    // 随机模式：随机选择
    if (playMode === PLAY_MODES.RANDOM) {
      let nextRandom;
      do {
        nextRandom = Math.floor(Math.random() * PLAYLIST.length);
      } while (nextRandom === currentSongIndex && PLAYLIST.length > 1);
      currentSongIndex = nextRandom;
    } else {
      currentSongIndex = (currentSongIndex + 1) % PLAYLIST.length;
    }

    loadSong(currentSongIndex).then(() => {
      if (wasPlaying) playCurrentSong();
    });
  });

  // 进度条拖动
  const progressBar = $('#progressBar');

  function handleProgressDrag(e) {
    if (!audioBuffer) return;
    const rect = progressBar.getBoundingClientRect();
    let clientX = e.clientX;
    if (e.touches) clientX = e.touches[0].clientX;
    let percent = (clientX - rect.left) / rect.width;
    percent = Math.max(0, Math.min(1, percent));

    $('#progressFill').style.width = (percent * 100) + '%';
    updateProgressThumb(percent);

    const seekTime = percent * audioBuffer.duration;
    $('#timeCurrent').textContent = formatTime(seekTime);
    startOffset = seekTime;
  }

  function startDrag(e) {
    if (!audioBuffer) return;
    isDraggingProgress = true;
    progressBar.classList.add('dragging');
    handleProgressDrag(e);
  }

  function endDrag(e) {
    if (!isDraggingProgress) return;
    isDraggingProgress = false;
    progressBar.classList.remove('dragging');

    if (isPlaying) {
      // 重新计算 audioStartTime
      audioStartTime = audioContext.currentTime - startOffset;
    }
  }

  progressBar.addEventListener('mousedown', startDrag);
  progressBar.addEventListener('touchstart', startDrag, { passive: true });

  document.addEventListener('mousemove', (e) => {
    if (isDraggingProgress) handleProgressDrag(e);
  });
  document.addEventListener('touchmove', (e) => {
    if (isDraggingProgress) handleProgressDrag(e);
  }, { passive: true });

  document.addEventListener('mouseup', endDrag);
  document.addEventListener('touchend', endDrag);

  // 进度条点击跳转
  progressBar.addEventListener('click', (e) => {
    if (isDraggingProgress) return;
    if (!audioBuffer) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const wasPlaying = isPlaying;
    if (wasPlaying) pauseAudio();
    startOffset = percent * audioBuffer.duration;
    if (wasPlaying) {
      playCurrentSong();
    } else {
      updateUI();
    }
  });

  // ========================================
  // 9. 播放模式切换
  // ========================================
  const playModeBtn = $('#playModeBtn');
  const playModeLabel = $('#playModeLabel');
  const playModeIcon = $('#playModeIcon');

  const playModeConfig = {
    [PLAY_MODES.SEQUENTIAL]: {
      label: '顺序',
      icon: '<path d="M4 6 L4 12 M7 5 L7 13 M10 7 L10 11 M13 4 L13 14 M16 6 L16 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'
    },
    [PLAY_MODES.LOOP]: {
      label: '循环',
      icon: '<path d="M9 4 L9 14 M4 7 A 6 6 0 1 1 7 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'
    },
    [PLAY_MODES.RANDOM]: {
      label: '随机',
      icon: '<path d="M3 5 L3 13 M6 4 L6 14 M9 6 L9 10 M12 3 L12 15 M15 5 L15 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'
    }
  };

  function updatePlayModeUI() {
    const config = playModeConfig[playMode];
    playModeLabel.textContent = config.label;
    playModeIcon.innerHTML = config.icon;
    playModeBtn.classList.toggle('active', playMode !== PLAY_MODES.SEQUENTIAL);
  }

  function cyclePlayMode() {
    const modes = [PLAY_MODES.SEQUENTIAL, PLAY_MODES.LOOP, PLAY_MODES.RANDOM];
    const currentIndex = modes.indexOf(playMode);
    playMode = modes[(currentIndex + 1) % modes.length];
    updatePlayModeUI();
  }

  playModeBtn.addEventListener('click', cyclePlayMode);
  updatePlayModeUI();

  // ========================================
  // 10. 歌曲下拉选择器
  // ========================================
  const songSelector = $('#songSelector');
  const songSelectorBtn = $('#songSelectorBtn');
  const songDropdown = $('#songDropdown');
  const songDropdownList = $('#songDropdownList');

  function createDropdownList() {
    songDropdownList.innerHTML = PLAYLIST.map((song, index) => `
      <div class="song-dropdown-item ${index === currentSongIndex ? 'active' : ''}" data-index="${index}">
        <span class="dropdown-item-index">${String(song.index).padStart(2, '0')}</span>
        <span class="dropdown-item-title">${song.title}</span>
        <span class="dropdown-item-duration">${formatTime(song.duration)}</span>
      </div>
    `).join('');

    songDropdownList.querySelectorAll('.song-dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        const wasPlaying = isPlaying;
        if (wasPlaying) pauseAudio();
        loadSong(index).then(() => {
          if (wasPlaying) playCurrentSong();
        });
        closeDropdown();
      });
    });
  }

  function toggleDropdown() {
    songDropdown.classList.toggle('active');
  }

  function closeDropdown() {
    songDropdown.classList.remove('active');
  }

  songSelectorBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  // 点击外部关闭
  document.addEventListener('click', (e) => {
    if (!songSelector.contains(e.target)) {
      closeDropdown();
    }
  });

  // ========================================
  // 11. Now Playing Card 滑动切换歌曲
  // ========================================
  const nowPlayingCard = $('#nowPlayingCard');
  let cardTouchStartX = 0;
  let cardTouchStartY = 0;
  let isSwipingCard = false;

  nowPlayingCard.addEventListener('touchstart', (e) => {
    cardTouchStartX = e.changedTouches[0].screenX;
    cardTouchStartY = e.changedTouches[0].screenY;
    isSwipingCard = false;
  }, { passive: true });

  nowPlayingCard.addEventListener('touchmove', (e) => {
    const diffX = e.changedTouches[0].screenX - cardTouchStartX;
    const diffY = e.changedTouches[0].screenY - cardTouchStartY;

    // 判断是否为水平滑动（水平移动距离大于垂直，且大于30px）
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
      isSwipingCard = true;
    }
  }, { passive: true });

  nowPlayingCard.addEventListener('touchend', (e) => {
    if (!isSwipingCard) return;

    const diffX = e.changedTouches[0].screenX - cardTouchStartX;

    if (diffX < -50) {
      // 向左滑：下一首
      $('#nextBtn').click();
    } else if (diffX > 50) {
      // 向右滑：上一首
      $('#prevBtn').click();
    }
  }, { passive: true });

  // ========================================
  // 12. 垂直滑动式歌曲选择器 (网易云风格)
  // ========================================
  const songPickerViewport = $('#songPickerViewport');
  const songPickerTrack = $('#songPickerTrack');
  const ITEM_HEIGHT = 72; // 每项高度
  const VISIBLE_ITEMS = 3; // 可见项数
  const PICKER_PADDING = 60; // 上下padding

  let pickerScrollY = 0;
  let pickerStartY = 0;
  let pickerStartScrollY = 0;
  let pickerVelocity = 0;
  let pickerLastY = 0;
  let pickerLastTime = 0;
  let pickerAnimating = false;
  let pickerTouching = false;

  function createSongPicker() {
    songPickerTrack.innerHTML = PLAYLIST.map((song, index) => `
      <div class="song-picker-item ${index === currentSongIndex ? 'active playing' : ''}" data-index="${index}">
        <div class="picker-item-index">${String(song.index).padStart(2, '0')}</div>
        <div class="picker-item-info">
          <div class="picker-item-title">${song.title}</div>
          <div class="picker-item-artist">初音未来</div>
        </div>
        <div class="picker-item-duration">${formatTime(song.duration)}</div>
        <div class="picker-playing-icon" style="display: ${index === currentSongIndex && isPlaying ? 'flex' : 'none'}"></div>
      </div>
    `).join('');

    // 点击切换歌曲
    songPickerTrack.querySelectorAll('.song-picker-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        if (index === currentSongIndex) {
          // 点击当前歌曲则切换播放/暂停
          if (isPlaying) pauseAudio();
          else playCurrentSong();
        } else {
          const wasPlaying = isPlaying;
          if (wasPlaying) pauseAudio();
          loadSong(index).then(() => {
            playCurrentSong();
          });
        }
      });
    });

    // 初始化位置
    updatePickerPosition(false);

    // 更新歌曲数量显示
    const songPickerCount = $('#songPickerCount');
    if (songPickerCount) {
      songPickerCount.textContent = PLAYLIST.length + '首';
    }
  }

  function updatePickerItems() {
    const items = songPickerTrack.querySelectorAll('.song-picker-item');
    items.forEach((item, index) => {
      const isActive = index === currentSongIndex;
      item.classList.toggle('active', isActive);
      item.classList.toggle('playing', isActive && isPlaying);

      const playingIcon = item.querySelector('.picker-playing-icon');
      if (playingIcon) {
        playingIcon.style.display = isActive && isPlaying ? 'flex' : 'none';
      }
    });
  }

  function updatePickerPosition(animate = true) {
    const items = songPickerTrack.querySelectorAll('.song-picker-item');
    const totalHeight = PLAYLIST.length * ITEM_HEIGHT;
    const viewportHeight = songPickerViewport.offsetHeight;
    const maxScroll = Math.max(0, totalHeight - viewportHeight + PICKER_PADDING * 2);

    // 限制滚动范围
    pickerScrollY = Math.max(0, Math.min(maxScroll, pickerScrollY));

    // 计算当前选中项
    const centerOffset = pickerScrollY + viewportHeight / 2 - ITEM_HEIGHT / 2 - PICKER_PADDING;
    const currentIndex = Math.round(centerOffset / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(PLAYLIST.length - 1, currentIndex));

    // 更新transform
    if (!pickerAnimating || !animate) {
      songPickerTrack.style.transition = animate ? 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' : 'none';
      songPickerTrack.style.transform = `translateY(${-pickerScrollY}px)`;
    }

    // 更新选中状态
    items.forEach((item, index) => {
      const distance = Math.abs(index - clampedIndex);
      const scale = distance === 0 ? 1 : Math.max(0.85, 1 - distance * 0.08);
      const opacity = distance === 0 ? 1 : Math.max(0.4, 1 - distance * 0.25);

      item.style.transform = `scale(${scale})`;
      item.style.opacity = opacity;
      item.classList.toggle('active', index === clampedIndex);
    });

    // 如果当前索引改变且不是在触摸中，自动滚动到该项
    if (currentIndex !== clampedIndex && !pickerTouching) {
      const targetScroll = clampedIndex * ITEM_HEIGHT - viewportHeight / 2 + ITEM_HEIGHT / 2 + PICKER_PADDING;
      smoothScrollTo(Math.max(0, Math.min(maxScroll, targetScroll)));
    }
  }

  function smoothScrollTo(targetY) {
    pickerAnimating = true;
    const startY = pickerScrollY;
    const startTime = performance.now();
    const duration = 400;

    function easeOutQuart(t) {
      return 1 - Math.pow(1 - t, 4);
    }

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);

      pickerScrollY = startY + (targetY - startY) * easedProgress;
      updatePickerPosition(false);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        pickerAnimating = false;
      }
    }

    requestAnimationFrame(animate);
  }

  // 触摸事件处理
  function handlePickerTouchStart(e) {
    pickerTouching = true;
    pickerStartY = e.touches[0].clientY;
    pickerStartScrollY = pickerScrollY;
    pickerLastY = pickerStartY;
    pickerLastTime = performance.now();
    pickerVelocity = 0;

    songPickerTrack.style.transition = 'none';
  }

  function handlePickerTouchMove(e) {
    if (!pickerTouching) return;

    const currentY = e.touches[0].clientY;
    const deltaY = pickerStartY - currentY;
    const currentTime = performance.now();
    const dt = currentTime - pickerLastTime;

    if (dt > 0) {
      pickerVelocity = (pickerLastY - currentY) / dt * 16; // 转换为"像素/帧"
    }

    pickerLastY = currentY;
    pickerLastTime = currentTime;

    pickerScrollY = pickerStartScrollY + deltaY;

    // 添加弹性边界效果
    const items = songPickerTrack.querySelectorAll('.song-picker-item');
    const totalHeight = PLAYLIST.length * ITEM_HEIGHT;
    const viewportHeight = songPickerViewport.offsetHeight;
    const maxScroll = Math.max(0, totalHeight - viewportHeight + PICKER_PADDING * 2);

    // 超出边界时的弹性效果 - 提升系数到0.5
    if (pickerScrollY < 0) {
      const over = Math.abs(pickerScrollY);
      pickerScrollY = -over * 0.5;
    } else if (pickerScrollY > maxScroll) {
      const over = pickerScrollY - maxScroll;
      pickerScrollY = maxScroll + over * 0.5;
    }

    updatePickerPosition(false);
  }

  function handlePickerTouchEnd(e) {
    if (!pickerTouching) return;
    pickerTouching = false;

    // 惯性滚动
    if (Math.abs(pickerVelocity) > 0.5) {
      const items = songPickerTrack.querySelectorAll('.song-picker-item');
      const totalHeight = PLAYLIST.length * ITEM_HEIGHT;
      const viewportHeight = songPickerViewport.offsetHeight;
      const maxScroll = Math.max(0, totalHeight - viewportHeight + PICKER_PADDING * 2);

      pickerAnimating = true;
      const startY = pickerScrollY;
      const startTime = performance.now();
      const duration = Math.min(500, Math.abs(pickerVelocity) * 20);

      function easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
      }

      function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutQuart(progress);

        pickerScrollY = startY + pickerVelocity * (1 - easedProgress) * 10;

        // 边界吸附
        if (pickerScrollY < 0) {
          pickerScrollY = 0;
        } else if (pickerScrollY > maxScroll) {
          pickerScrollY = maxScroll;
        }

        updatePickerPosition(false);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          pickerAnimating = false;
          pickerVelocity = 0;
          snapToNearest();
        }
      }

      requestAnimationFrame(animate);
    } else {
      snapToNearest();
    }
  }

  function snapToNearest() {
    const items = songPickerTrack.querySelectorAll('.song-picker-item');
    const totalHeight = PLAYLIST.length * ITEM_HEIGHT;
    const viewportHeight = songPickerViewport.offsetHeight;
    const maxScroll = Math.max(0, totalHeight - viewportHeight + PICKER_PADDING * 2);

    // 找到最近的项
    const centerOffset = pickerScrollY + viewportHeight / 2 - ITEM_HEIGHT / 2 - PICKER_PADDING;
    const nearestIndex = Math.round(centerOffset / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(PLAYLIST.length - 1, nearestIndex));

    const targetScroll = clampedIndex * ITEM_HEIGHT - viewportHeight / 2 + ITEM_HEIGHT / 2 + PICKER_PADDING;
    const targetClamped = Math.max(0, Math.min(maxScroll, targetScroll));

    smoothScrollTo(targetClamped);

    // 如果切换了歌曲，更新选中项
    if (clampedIndex !== currentSongIndex) {
      // 延迟切换以匹配动画
      setTimeout(() => {
        const wasPlaying = isPlaying;
        if (wasPlaying) pauseAudio();
        loadSong(clampedIndex).then(() => {
          playCurrentSong();
        });
      }, 150);
    }
  }

  // 绑定触摸事件
  songPickerViewport.addEventListener('touchstart', handlePickerTouchStart, { passive: true });
  songPickerViewport.addEventListener('touchmove', handlePickerTouchMove, { passive: true });
  songPickerViewport.addEventListener('touchend', handlePickerTouchEnd, { passive: true });

  // 鼠标滚轮支持 (桌面端)
  songPickerViewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const items = songPickerTrack.querySelectorAll('.song-picker-item');
    const totalHeight = PLAYLIST.length * ITEM_HEIGHT;
    const viewportHeight = songPickerViewport.offsetHeight;
    const maxScroll = Math.max(0, totalHeight - viewportHeight + PICKER_PADDING * 2);

    pickerScrollY = Math.max(0, Math.min(maxScroll, pickerScrollY + e.deltaY));
    updatePickerPosition();
  }, { passive: false });

  // 更新picker位置（当歌曲切换时）
  function scrollPickerToCurrentSong(animate = true) {
    const viewportHeight = songPickerViewport.offsetHeight;
    const totalHeight = PLAYLIST.length * ITEM_HEIGHT;
    const maxScroll = Math.max(0, totalHeight - viewportHeight + PICKER_PADDING * 2);

    const targetScroll = currentSongIndex * ITEM_HEIGHT - viewportHeight / 2 + ITEM_HEIGHT / 2 + PICKER_PADDING;
    const targetClamped = Math.max(0, Math.min(maxScroll, targetScroll));

    if (animate) {
      smoothScrollTo(targetClamped);
    } else {
      pickerScrollY = targetClamped;
      updatePickerPosition(false);
    }
  }

  // ========================================
  // 13. 滚动入场动画 Observer
  // ========================================
  function initScrollAnimations() {
    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    };

    const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Timeline items 需要逐个显示
          if (entry.target.classList.contains('timeline-item')) {
            const delay = Array.from($$('.timeline-item')).indexOf(entry.target) * 150;
            entry.target.style.transitionDelay = `${delay}ms`;
          }
          // Impact cards 需要错开显示
          if (entry.target.classList.contains('impact-card')) {
            const delay = Array.from($$('.impact-card')).indexOf(entry.target) * 100;
            entry.target.style.transitionDelay = `${delay}ms`;
          }
        }
      });
    }, observerOptions);

    // 观察 Timeline items
    $$('.timeline-item').forEach(item => scrollObserver.observe(item));

    // 观察 Impact cards
    $$('.impact-card').forEach(card => scrollObserver.observe(card));

    // 观察 About cards
    $$('.about-card').forEach((card, index) => {
      card.style.transitionDelay = `${index * 100}ms`;
      scrollObserver.observe(card);
    });

    // 观察 Gallery items
    $$('.gallery-item').forEach((item, index) => {
      item.style.transitionDelay = `${index * 100}ms`;
      scrollObserver.observe(item);
    });
  }

  // ========================================
  // 14. 初始化
  // ========================================
  function init() {
    createGallery();
    createDots();
    createSongPicker();
    createDropdownList();

    // 等待图片加载
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

    // 加载默认歌曲（世界第一的公主殿下 = index 0）
    loadSong(0);

    // 初始化后滚动到当前歌曲
    setTimeout(() => scrollPickerToCurrentSong(false), 100);

    // 初始化滚动入场动画
    initScrollAnimations();
  }

  init();

})();

  // 音乐引导提示
  (function() {
    const STORAGE_KEY = 'miku_music_prompt_v1';
    const prompt = $('#musicPrompt');
    if (!prompt) return;
    if (localStorage.getItem(STORAGE_KEY)) { prompt.remove(); return; }
    prompt.addEventListener('click', function() {
      localStorage.setItem(STORAGE_KEY, 'true');
      prompt.classList.add('hidden');
      setTimeout(() => { prompt.remove(); if (!isPlaying) playCurrentSong(); }, 500);
    });
  })();

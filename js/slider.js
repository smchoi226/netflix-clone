export default class Slider {
  constructor(section, opts = {}) {
    console.log('Slider constructor called', section, opts);
    
    this.section = section;
    this.options = {
      visible: 6,
      step: 3,
      infinite: true,
      duration: 450,
      easing: 'ease',
      label: 'slider',
      ...opts
    };

    this.currentIndex = 0;
    this.isMoving = false;

    this._init();
  }

  _init() {
    try {
      console.log('Initializing slider...');
      this._findElements();
      this._buildDOM();
      this._createInfiniteLoop();
      this._measure();
      this._goTo(0, false);
      this._updateControls();
      this._bind();
      
      this.section._sliderInstance = this;
      console.log('Slider initialized successfully');
    } catch (error) {
      console.error('Slider initialization failed:', error);
    }
  }

  _findElements() {
    this.cardContainer = this.section.querySelector('.card-row');
    
    if (!this.cardContainer) {
      throw new Error('Card container (.card-row) not found');
    }

    this.originalCards = Array.from(this.cardContainer.children);
    this.cardCount = this.originalCards.length;
    
    console.log(`Found ${this.cardCount} cards`);
    
    if (this.cardCount === 0) {
      throw new Error('No cards found');
    }

    this.totalPages = Math.ceil(this.cardCount / this.options.step);
  }

  _buildDOM() {
    this.slider = document.createElement('div');
    this.slider.className = 'slider';
    this.slider.tabIndex = 0;

    this.track = document.createElement('div');
    this.track.className = 'slider-track';

    this.cardContainer.replaceWith(this.slider);
    this.slider.appendChild(this.track);

    this._applyStyles();
    this._buildControls();
  }

  _applyStyles() {
    Object.assign(this.slider.style, {
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
      marginBottom: '20px'
    });

    Object.assign(this.track.style, {
      display: 'flex',
      willChange: 'transform',
      transition: `transform ${this.options.duration}ms ${this.options.easing}`,
      gap: '8px'
    });
  }

  _createInfiniteLoop() {
    if (!this.options.infinite) {
      this.originalCards.forEach(card => {
        this.track.appendChild(card);
      });
      return;
    }

    console.log('Creating infinite loop with modular arithmetic...');
    
    // 충분한 카드 생성 (왼쪽으로만 계속 이동하기 위해)
    // visible + step * 5 정도면 충분
    const totalCards = this.options.visible + (this.options.step * 10);
    
    this.allCards = [];
    
    // 모듈러 연산으로 카드 생성
    for (let i = 0; i < totalCards; i++) {
      const originalIndex = i % this.cardCount;
      const card = this.originalCards[originalIndex].cloneNode(true);
      card.dataset.originalIndex = originalIndex;
      card.dataset.position = i;
      this.track.appendChild(card);
      this.allCards.push(card);
    }

    console.log(`Created ${totalCards} cards with modular pattern`);
  }

  _measure() {
    const sliderWidth = this.slider.offsetWidth;
    const gap = 8;
    
    this.cardWidth = (sliderWidth - (gap * (this.options.visible - 1))) / this.options.visible;
    this.gap = gap;
    this.itemWidth = this.cardWidth + this.gap;

    console.log(`Card width: ${this.cardWidth}, Item width: ${this.itemWidth}`);

    this.allCards.forEach(card => {
      card.style.flex = 'none';
      card.style.width = `${this.cardWidth}px`;
    });
  }

  _buildControls() {
    this.prevBtn = this._createButton('prev', '‹', '이전');
    this.nextBtn = this._createButton('next', '›', '다음');

    this.pageIndicator = document.createElement('div');
    this.pageIndicator.className = 'page-indicator';

    this.dots = document.createElement('div');
    this.dots.className = 'dots';
    this._buildDots();

    const controls = document.createElement('div');
    controls.className = 'slider-controls';
    
    const spacer = document.createElement('div');
    spacer.style.flex = '1';
    
    controls.appendChild(spacer);
    controls.appendChild(this.prevBtn);
    controls.appendChild(this.pageIndicator);
    controls.appendChild(this.dots);
    controls.appendChild(this.nextBtn);

    this.slider.parentNode.insertBefore(controls, this.slider);
  }

  _createButton(type, text, label) {
    const btn = document.createElement('button');
    btn.className = `slider-btn slider-${type}`;
    btn.textContent = text;
    btn.type = 'button';
    btn.setAttribute('aria-label', `${this.options.label} ${label}`);
    return btn;
  }

  _buildDots() {
    this.dots.innerHTML = '';
    for (let i = 0; i < this.totalPages; i++) {
      const dot = document.createElement('button');
      dot.className = 'dot';
      dot.type = 'button';
      dot.addEventListener('click', () => this.goToPage(i));
      this.dots.appendChild(dot);
    }
  }

  _bind() {
    this.prevBtn.addEventListener('click', () => this.prev());
    this.nextBtn.addEventListener('click', () => this.next());

    this.slider.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.next();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.prev();
      }
    });

    this.track.addEventListener('transitionend', () => {
      this._handleTransitionEnd();
    });

    window.addEventListener('resize', () => {
      this._handleResize();
    });
  }

  _handleResize() {
    clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => {
      this._measure();
      this._goTo(this.currentIndex, false);
    }, 100);
  }

  _goTo(index, animate = true) {
    if (this.isMoving && animate) return;

    this.currentIndex = index;
    
    // 단순히 왼쪽으로만 이동 (모듈러 연산은 논리적으로만)
    const translateX = -(this.currentIndex * this.itemWidth);
    
    this.track.style.transition = animate ? 
      `transform ${this.options.duration}ms ${this.options.easing}` : 'none';
    this.track.style.transform = `translateX(${translateX}px)`;
    
    if (animate) {
      this.isMoving = true;
    }
    
    this._updateControls();
    
    console.log(`Index: ${index}, TranslateX: ${translateX}px`);
  }

  _handleTransitionEnd() {
    this.isMoving = false;
    
    if (!this.options.infinite) return;

    // 필요하면 더 많은 카드 추가 (동적으로)
    this._ensureEnoughCards();
    
    this._updateControls();
  }

  _ensureEnoughCards() {
    // 현재 인덱스가 너무 크면 더 많은 카드 필요
    const remainingCards = this.allCards.length - this.currentIndex - this.options.visible;
    
    if (remainingCards < this.options.step * 3) {
      console.log('Adding more cards...');
      
      // 추가 카드 생성
      const cardsToAdd = this.cardCount * 2;
      const currentLength = this.allCards.length;
      
      for (let i = 0; i < cardsToAdd; i++) {
        const originalIndex = (currentLength + i) % this.cardCount;
        const card = this.originalCards[originalIndex].cloneNode(true);
        card.dataset.originalIndex = originalIndex;
        card.dataset.position = currentLength + i;
        card.style.flex = 'none';
        card.style.width = `${this.cardWidth}px`;
        this.track.appendChild(card);
        this.allCards.push(card);
      }
      
      console.log(`Added ${cardsToAdd} more cards`);
    }
  }

  _updateControls() {
    this._updatePagination();
    this._updateButtons();
  }

  _updatePagination() {
    // 모듈러 연산으로 논리적 페이지 계산
    const logicalIndex = this.currentIndex % this.cardCount;
    const currentPage = Math.floor(logicalIndex / this.options.step) + 1;
    
    this.pageIndicator.textContent = `${currentPage} / ${this.totalPages}`;

    Array.from(this.dots.children).forEach((dot, i) => {
      dot.classList.toggle('active', i === (currentPage - 1));
    });
  }

  _updateButtons() {
    if (this.options.infinite) {
      this.prevBtn.disabled = false;
      this.nextBtn.disabled = false;
    } else {
      this.prevBtn.disabled = this.currentIndex <= 0;
      this.nextBtn.disabled = this.currentIndex >= this.cardCount - this.options.visible;
    }
  }

  next() {
    if (this.isMoving) return;
    console.log(`Next: ${this.currentIndex} -> ${this.currentIndex + this.options.step}`);
    this.currentIndex += this.options.step;
    this._goTo(this.currentIndex, true);
  }

  prev() {
    if (this.isMoving) return;
    console.log(`Prev: ${this.currentIndex} -> ${this.currentIndex - this.options.step}`);
    this.currentIndex -= this.options.step;
    this._goTo(this.currentIndex, true);
  }

  goToPage(page) {
    if (this.isMoving) return;
    this.currentIndex = page * this.options.step;
    this._goTo(this.currentIndex, true);
  }

  destroy() {
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }
    if (this.section._sliderInstance) {
      delete this.section._sliderInstance;
    }
  }
}
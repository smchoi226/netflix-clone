export class HoverModal {
  constructor(trigger, type, portal, options = {}) {
    this.trigger = trigger;
    this.type = type;
    this.portal = portal;
    this.options = {
      offset: 8,
      hoverDelayOpen: 80,
      hoverDelayClose: 120,
      closeOnOutsideClick: false,
      ...options
    };

    this.container = null;
    this.timers = { open: null, close: null };
    this.isVisible = false;

    this._init();
  }

  _init() {
    this._createContainer();
    this._renderContent();
    this._bind();
    this._setupAccessibility();
  }

  _createContainer() {
    this.container = document.createElement('div');
    this.container.className = 'hover-modal';
    this.container.setAttribute('role', this.type === 'notifications' ? 'dialog' : 'menu');
    this.container.setAttribute('aria-hidden', 'true');
    this.container.hidden = true;
    
    // 고유 ID 생성
    const id = `modal-${this.type}-${Date.now()}`;
    this.container.id = id;
    
    this.portal.appendChild(this.container);
  }

  _renderContent() {
    if (this.type === 'notifications') {
      this.container.innerHTML = `
        <div class="popover">
          <div class="popover__header">
            <h4>알림</h4>
          </div>
          <ul class="popover__list" role="list">
            <li class="notif" role="listitem">
              <img src="images/card-01.jpg" alt="콘텐츠 썸네일" loading="lazy">
              <div>
                <p>넷플릭스 '신규 콘텐츠 가이드'</p>
                <small>2주 전</small>
              </div>
            </li>
            <li class="notif" role="listitem">
              <img src="images/card-03.jpg" alt="콘텐츠 썸네일" loading="lazy">
              <div>
                <p>대한민국의 TOP 10 시리즈</p>
                <small>3주 전</small>
              </div>
            </li>
            <li class="notif" role="listitem">
              <img src="images/card-02.jpg" alt="콘텐츠 썸네일" loading="lazy">
              <div>
                <p>추천 콘텐츠가 업데이트되었습니다</p>
                <small>1일 전</small>
              </div>
            </li>
          </ul>
          <div class="popover__footer">
            <a href="#" class="view-all">모든 알림 보기</a>
          </div>
        </div>`;
    } else {
      this.container.innerHTML = `
        <div class="popover" role="menu">
          <div class="popover__header">
            <button role="menuitem" class="menuitem profile-main" tabindex="0">
              <img class="avatar" src="images/profile.jpg" alt="프로필 아바타" loading="lazy"> 
              <span>사용자님</span>
            </button>
          </div>
          <ul class="popover__list" role="none">
            <li role="none">
              <button role="menuitem" class="menuitem" tabindex="0">프로필 관리</button>
            </li>
            <li role="none">
              <button role="menuitem" class="menuitem" tabindex="0">프로필 이전</button>
            </li>
            <li role="none">
              <button role="menuitem" class="menuitem" tabindex="0">계정</button>
            </li>
            <li role="none">
              <button role="menuitem" class="menuitem" tabindex="0">고객 센터</button>
            </li>
          </ul>
          <hr class="sep" role="separator"/>
          <div class="popover__footer">
            <button role="menuitem" class="menuitem logout" tabindex="0">넷플릭스에서 로그아웃</button>
          </div>
        </div>`;
    }
  }

  _setupAccessibility() {
    // 트리거에 접근성 속성 추가
    this.trigger.setAttribute('aria-haspopup', this.type === 'notifications' ? 'dialog' : 'menu');
    this.trigger.setAttribute('aria-expanded', 'false');
    this.trigger.setAttribute('aria-controls', this.container.id);

    // 메뉴 아이템들에 키보드 네비게이션 추가
    if (this.type === 'profile') {
      this._setupMenuNavigation();
    }
  }

  _setupMenuNavigation() {
    const menuItems = this.container.querySelectorAll('[role="menuitem"]');
    
    menuItems.forEach((item, index) => {
      item.addEventListener('keydown', (e) => {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            const nextIndex = (index + 1) % menuItems.length;
            menuItems[nextIndex].focus();
            break;
          case 'ArrowUp':
            e.preventDefault();
            const prevIndex = (index - 1 + menuItems.length) % menuItems.length;
            menuItems[prevIndex].focus();
            break;
          case 'Escape':
            e.preventDefault();
            this.hide();
            this.trigger.focus();
            break;
          case 'Enter':
          case ' ':
            e.preventDefault();
            item.click();
            break;
        }
      });

      // 메뉴 아이템 클릭 시 모달 닫기
      item.addEventListener('click', () => {
        this.hide();
      });
    });
  }

  _bind() {
    // 마우스 이벤트
    this.trigger.addEventListener('mouseenter', () => this._queueOpen());
    this.trigger.addEventListener('mouseleave', () => this._queueClose());
    
    // 포커스 이벤트
    this.trigger.addEventListener('focusin', () => this._open());
    this.trigger.addEventListener('focusout', (e) => {
      // 포커스가 모달 내부로 이동하지 않은 경우에만 닫기
      if (!this.container.contains(e.relatedTarget)) {
        this._queueClose();
      }
    });

    // 모달 자체의 이벤트
    this.container.addEventListener('mouseenter', () => this._clearCloseTimer());
    this.container.addEventListener('mouseleave', () => this._queueClose());
    
    // 모달 내부에서 포커스 아웃 처리
    this.container.addEventListener('focusout', (e) => {
      if (!this.container.contains(e.relatedTarget) && e.relatedTarget !== this.trigger) {
        this._queueClose();
      }
    });

    // 전역 이벤트
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
        this.trigger.focus();
      }
    });

    // 외부 클릭 시 닫기 (옵션)
    if (this.options.closeOnOutsideClick) {
      document.addEventListener('click', (e) => {
        if (this.isVisible && 
            !this.container.contains(e.target) && 
            !this.trigger.contains(e.target)) {
          this.hide();
        }
      });
    }
  }

  _queueOpen() {
    this._clearCloseTimer();
    this.timers.open = setTimeout(() => this._open(), this.options.hoverDelayOpen);
  }

  _queueClose() {
    this._clearOpenTimer();
    this.timers.close = setTimeout(() => this.hide(), this.options.hoverDelayClose);
  }

  _clearOpenTimer() {
    if (this.timers.open) {
      clearTimeout(this.timers.open);
      this.timers.open = null;
    }
  }

  _clearCloseTimer() {
    if (this.timers.close) {
      clearTimeout(this.timers.close);
      this.timers.close = null;
    }
  }

  _open() {
    this._clearOpenTimer();
    this._clearCloseTimer();
    this.show();
  }

  show() {
    if (this.isVisible) return;

    this._position();
    this.container.hidden = false;
    this.container.setAttribute('aria-hidden', 'false');
    this.trigger.setAttribute('aria-expanded', 'true');
    
    // 애니메이션을 위한 클래스 추가
    requestAnimationFrame(() => {
      this.container.classList.add('show');
    });

    this.isVisible = true;

    // 포커스 관리 (메뉴인 경우 첫 번째 아이템에 포커스)
    if (this.type === 'profile') {
      const firstMenuItem = this.container.querySelector('[role="menuitem"]');
      if (firstMenuItem) {
        firstMenuItem.focus();
      }
    }
  }

  hide() {
    if (!this.isVisible) return;

    this._clearOpenTimer();
    this._clearCloseTimer();

    this.container.classList.remove('show');
    this.container.setAttribute('aria-hidden', 'true');
    this.trigger.setAttribute('aria-expanded', 'false');
    
    // 애니메이션 완료 후 hidden 처리
    setTimeout(() => {
      if (!this.isVisible) { // 중복 호출 방지
        this.container.hidden = true;
      }
    }, 200); // CSS 트랜지션 시간과 맞춤

    this.isVisible = false;
  }

  _position() {
    const triggerRect = this.trigger.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    // 모달을 먼저 보이게 해서 크기를 측정
    this.container.style.visibility = 'hidden';
    this.container.hidden = false;
    const modalRect = this.container.getBoundingClientRect();

    // 위치 계산
    let top = triggerRect.bottom + this.options.offset + scrollY;
    let left = triggerRect.right + scrollX;

    // 화면 경계 체크 및 조정
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 오른쪽 끝 맞춤 (bottom-end)
    left = triggerRect.right + scrollX - modalRect.width;

    // 화면 오른쪽 경계 체크
    if (left < scrollX) {
      left = scrollX + 10; // 최소 여백
    }

    // 화면 아래쪽 경계 체크
    if (top + modalRect.height > scrollY + viewportHeight) {
      top = triggerRect.top + scrollY - modalRect.height - this.options.offset;
    }

    // 최종 위치 적용
    Object.assign(this.container.style, {
      position: 'absolute',
      top: `${Math.max(scrollY + 10, top)}px`,
      left: `${left}px`,
      zIndex: '1000',
      visibility: 'visible'
    });

    this.container.hidden = true; // 다시 숨김
  }

  // 정리 메서드
  destroy() {
    this._clearOpenTimer();
    this._clearCloseTimer();
    
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

// 향상된 모달 매니저 클래스
export class ModalManager {
  constructor(options = {}) {
    this.options = {
      offset: 8,
      hoverDelayOpen: 80,
      hoverDelayClose: 120,
      closeOnOutsideClick: false,
      ...options
    };
    this.modals = new Map();
    this.portal = null;
    this._init();
  }

  _init() {
    // 포털 요소 생성 또는 찾기
    this.portal = document.getElementById('modal-root');
    if (!this.portal) {
      this.portal = document.createElement('div');
      this.portal.id = 'modal-root';
      this.portal.setAttribute('aria-live', 'polite');
      document.body.appendChild(this.portal);
    }
  }

  register(selector, type, customOptions = {}) {
    const triggers = typeof selector === 'string' 
      ? document.querySelectorAll(selector) 
      : [selector];

    triggers.forEach(trigger => {
      if (!trigger || this.modals.has(trigger)) return;

      const modalOptions = { ...this.options, ...customOptions };
      const modal = new HoverModal(trigger, type, this.portal, modalOptions);
      this.modals.set(trigger, modal);
    });
  }

  unregister(selector) {
    const triggers = typeof selector === 'string' 
      ? document.querySelectorAll(selector) 
      : [selector];

    triggers.forEach(trigger => {
      const modal = this.modals.get(trigger);
      if (modal) {
        modal.destroy();
        this.modals.delete(trigger);
      }
    });
  }

  hideAll() {
    this.modals.forEach(modal => modal.hide());
  }

  destroy() {
    this.modals.forEach(modal => modal.destroy());
    this.modals.clear();
    
    if (this.portal && this.portal.parentNode) {
      this.portal.parentNode.removeChild(this.portal);
    }
  }
}

// 기존 호환성을 위한 초기화 함수들
export function initHoverModals(options = {}) {
  const manager = new ModalManager(options);
  
  // 기존 방식 지원
  document.querySelectorAll('[data-hover-modal]').forEach(trigger => {
    const type = trigger.getAttribute('data-hover-modal');
    manager.register(trigger, type);
  });

  // 새로운 방식도 지원
  manager.register('[data-modal="notifications"]', 'notifications');
  manager.register('[data-modal="profile"]', 'profile');

  return manager;
}

// 개별 모달 생성 헬퍼 함수
export function createModal(trigger, type, options = {}) {
  const portal = document.getElementById('modal-root') || (() => {
    const p = document.createElement('div');
    p.id = 'modal-root';
    document.body.appendChild(p);
    return p;
  })();

  return new HoverModal(trigger, type, portal, options);
}
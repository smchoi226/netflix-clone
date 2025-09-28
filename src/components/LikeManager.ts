import { LikeStorage, Content } from '../types/index.js';

/**
 * 메모리 기반 좋아요 저장소
 */
class MemoryLikeStorage implements LikeStorage {
  likes: Set<string> = new Set();
  private likeCounts: Map<string, number> = new Map(); // 콘텐츠별 좋아요 개수

  save(): void {
    // 메모리 기반이므로 별도 저장 로직 없음
    console.log('현재 좋아요 목록:', Array.from(this.likes));
    console.log('좋아요 개수:', Object.fromEntries(this.likeCounts));
  }

  load(): void {
    // 메모리 기반이므로 별도 로드 로직 없음
    console.log('좋아요 데이터 로드됨 (메모리 기반)');
  }

  toggle(contentId: string): boolean {
    if (this.likes.has(contentId)) {
      this.likes.delete(contentId);
      // 좋아요 개수 감소 (최소 0)
      const currentCount = this.likeCounts.get(contentId) || 0;
      this.likeCounts.set(contentId, Math.max(0, currentCount - 1));
      return false;
    } else {
      this.likes.add(contentId);
      // 좋아요 개수 증가
      const currentCount = this.likeCounts.get(contentId) || 0;
      this.likeCounts.set(contentId, currentCount + 1);
      return true;
    }
  }

  isLiked(contentId: string): boolean {
    return this.likes.has(contentId);
  }

  getLikeCount(contentId: string): number {
    return this.likeCounts.get(contentId) || 0;
  }

  // 초기 랜덤 좋아요 개수 설정 (실제 서비스처럼 보이게)
  initializeRandomCounts(contentIds: string[]): void {
    contentIds.forEach(id => {
      if (!this.likeCounts.has(id)) {
        // 10-500 사이의 랜덤 좋아요 개수
        const randomCount = Math.floor(Math.random() * 490) + 10;
        this.likeCounts.set(id, randomCount);
      }
    });
  }
}

/**
 * 좋아요 기능 관리 클래스
 */
export class LikeManager {
  private storage: LikeStorage;
  private likeButtons: Map<string, HTMLElement> = new Map();

  constructor() {
    this.storage = new MemoryLikeStorage();
    this.storage.load();
    console.log('LikeManager 초기화됨');
  }

  /**
   * 콘텐츠의 좋아요 상태 토글
   */
  toggleLike(contentId: string): boolean {
    const isLiked = this.storage.toggle(contentId);
    this.storage.save();
    
    // UI 업데이트
    this.updateButtonState(contentId, isLiked);
    
    // 이벤트 발생
    this.dispatchLikeEvent(contentId, isLiked);
    
    console.log(`${contentId} 좋아요 ${isLiked ? '추가' : '제거'}`);
    return isLiked;
  }

  /**
   * 콘텐츠의 좋아요 상태 확인
   */
  isLiked(contentId: string): boolean {
    return this.storage.isLiked(contentId);
  }

  /**
   * 좋아요 버튼 렌더링
   */
  renderLikeButton(content: Content): HTMLElement {
    const button = document.createElement('button');
    button.className = 'like-btn';
    button.setAttribute('data-content-id', content.id);
    button.setAttribute('aria-label', `${content.title} 좋아요`);
    button.setAttribute('title', '좋아요');
    
    const isLiked = this.isLiked(content.id);
    this.setButtonState(button, isLiked);
    
    // 이벤트 리스너 추가
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleLikeClick(content.id);
    });

    // 키보드 접근성
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.handleLikeClick(content.id);
      }
    });

    // 버튼 저장
    this.likeButtons.set(content.id, button);
    
    return button;
  }

  /**
   * 좋아요 버튼 클릭 핸들러
   */
  private handleLikeClick(contentId: string): void {
    const button = this.likeButtons.get(contentId);
    if (!button) return;

    const wasLiked = this.isLiked(contentId);
    
    // 좋아요 토글
    const isNowLiked = this.toggleLike(contentId);
    
    // 애니메이션 효과
    if (isNowLiked) {
      this.showLikeAnimation(button);
    } else {
      this.showUnlikeAnimation(button);
    }
  }

  /**
   * 버튼 상태 설정
   */
  private setButtonState(button: HTMLElement, isLiked: boolean): void {
    const contentId = button.dataset.contentId!;
    const likeCount = this.getLikeCountForContent(contentId);
    
    button.classList.toggle('like-btn--active', isLiked);
    button.innerHTML = `
      <div class="like-btn__content">
        <svg class="like-btn__icon" viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="${isLiked ? 
            'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' :
            'M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z'
          }"/>
        </svg>
        <span class="like-btn__count">${likeCount}</span>
      </div>
    `;
  }

  /**
   * 버튼 상태 업데이트
   */
  private updateButtonState(contentId: string, isLiked: boolean): void {
    const button = this.likeButtons.get(contentId);
    if (!button) return;

    this.setButtonState(button, isLiked);
  }

  /**
   * 좋아요 이벤트 발생
   */
  private dispatchLikeEvent(contentId: string, isLiked: boolean): void {
    const event = new CustomEvent('like-changed', {
      detail: { contentId, isLiked },
      bubbles: true
    });
    document.dispatchEvent(event);
  }

  /**
   * 특정 콘텐츠의 좋아요 개수 반환
   */
  getLikeCountForContent(contentId: string): number {
    return (this.storage as MemoryLikeStorage).getLikeCount(contentId);
  }

  /**
   * 초기 좋아요 개수 설정 (모든 콘텐츠)
   */
  initializeContentCounts(contentIds: string[]): void {
    (this.storage as MemoryLikeStorage).initializeRandomCounts(contentIds);
  }

  /**
   * 좋아요 애니메이션 효과
   */
  private showLikeAnimation(button: HTMLElement): void {
    // 하트 애니메이션
    button.classList.add('like-btn--clicked');
    
    // 좋아요 숫자 팝업 애니메이션
    const popup = document.createElement('div');
    popup.className = 'like-popup';
    popup.textContent = '+1';
    button.appendChild(popup);
    
    setTimeout(() => {
      button.classList.remove('like-btn--clicked');
      popup.remove();
    }, 600);
  }

  /**
   * 좋아요 취소 애니메이션 효과
   */
  private showUnlikeAnimation(button: HTMLElement): void {
    button.classList.add('like-btn--unlike');
    
    const popup = document.createElement('div');
    popup.className = 'unlike-popup';
    popup.textContent = '-1';
    button.appendChild(popup);
    
    setTimeout(() => {
      button.classList.remove('like-btn--unlike');
      popup.remove();
    }, 600);
  }

  /**
   * 좋아요 개수 반환
   */
  getLikeCount(): number {
    return this.storage.likes.size;
  }

  /**
   * 모든 좋아요 제거
   */
  clearAllLikes(): void {
    this.storage.likes.clear();
    this.storage.save();
    
    // 모든 버튼 상태 업데이트
    this.likeButtons.forEach((button, contentId) => {
      this.setButtonState(button, false);
    });
    
    console.log('모든 좋아요가 제거되었습니다.');
  }

  /**
   * 좋아요 상태를 초기화된 카드에 적용
   */
  initializeCardLikes(card: HTMLElement, contentId: string): void {
    const existingButton = card.querySelector('.like-btn');
    if (existingButton) {
      // 이미 버튼이 있다면 상태만 업데이트
      const isLiked = this.isLiked(contentId);
      this.setButtonState(existingButton as HTMLElement, isLiked);
    }
  }

  /**
   * 정리
   */
  destroy(): void {
    this.likeButtons.clear();
    this.storage.save();
    console.log('LikeManager 정리됨');
  }
}

// CSS 스타일을 동적으로 추가하는 함수
export function injectLikeStyles(): void {
  if (document.querySelector('#like-styles')) return;

  const style = document.createElement('style');
  style.id = 'like-styles';
  style.textContent = `
    .like-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      min-width: 60px;
      height: 32px;
      background: rgba(0, 0, 0, 0.8);
      border: none;
      border-radius: 16px;
      color: #ffffff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transform: scale(0.8);
      transition: all 0.3s ease;
      z-index: 10;
      backdrop-filter: blur(4px);
      padding: 0 8px;
    }

    .like-btn__content {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .like-btn__count {
      font-size: 12px;
      font-weight: 600;
      min-width: 20px;
      text-align: center;
    }

    .card:hover .like-btn,
    .card:focus-within .like-btn {
      opacity: 1;
      transform: scale(1);
    }

    .like-btn:hover {
      background: rgba(0, 0, 0, 0.9);
      transform: scale(1.05);
    }

    .like-btn:focus {
      outline: 2px solid var(--primary-red);
      outline-offset: 2px;
    }

    .like-btn__icon {
      transition: all 0.3s ease;
    }

    .like-btn--active {
      color: #e50914;
      background: rgba(229, 9, 20, 0.2);
    }

    .like-btn--active .like-btn__icon {
      transform: scale(1.2);
      filter: drop-shadow(0 0 4px rgba(229, 9, 20, 0.6));
    }

    .like-btn--clicked {
      animation: likeButtonClick 0.6s ease;
    }

    .like-btn--unlike {
      animation: unlikeButtonClick 0.6s ease;
    }

    @keyframes likeButtonClick {
      0% { transform: scale(1); }
      25% { transform: scale(1.2); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    @keyframes unlikeButtonClick {
      0% { transform: scale(1); }
      25% { transform: scale(0.9); }
      50% { transform: scale(0.95); }
      100% { transform: scale(1); }
    }

    /* 좋아요 팝업 애니메이션 */
    .like-popup, .unlike-popup {
      position: absolute;
      top: -20px;
      right: 50%;
      transform: translateX(50%);
      font-size: 14px;
      font-weight: bold;
      pointer-events: none;
      animation: popupAnimation 0.6s ease-out forwards;
    }

    .like-popup {
      color: #e50914;
    }

    .unlike-popup {
      color: #666;
    }

    @keyframes popupAnimation {
      0% {
        opacity: 1;
        transform: translateX(50%) translateY(0px) scale(1);
      }
      100% {
        opacity: 0;
        transform: translateX(50%) translateY(-20px) scale(1.2);
      }
    }

    /* 반응형 */
    @media (max-width: 768px) {
      .like-btn {
        opacity: 1;
        transform: scale(1);
        min-width: 50px;
        height: 28px;
        padding: 0 6px;
      }
      
      .like-btn__count {
        font-size: 11px;
      }
    }
  `;
  
  document.head.appendChild(style);
}
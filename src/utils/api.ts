import { HeroContent, ContentResponse } from '../types/index.js';

/**
 * API 관련 유틸리티 클래스
 */
export class ContentAPI {
  private static readonly BASE_URL = '/data';

  /**
   * HTTP 요청을 위한 기본 fetch 래퍼
   */
  private static async request<T>(url: string): Promise<T> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API 요청 실패: ${url}`, error);
      throw new Error(`데이터를 불러오는데 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 히어로 섹션 데이터 가져오기
   */
  static async fetchHeroData(): Promise<HeroContent> {
    return this.request<HeroContent>(`${this.BASE_URL}/hero.json`);
  }

  /**
   * 모든 콘텐츠 섹션 데이터 가져오기
   */
  static async fetchAllContent(): Promise<ContentResponse> {
    return this.request<ContentResponse>(`${this.BASE_URL}/contents.json`);
  }

  /**
   * 특정 섹션의 데이터만 가져오기 (향후 확장용)
   */
  static async fetchSectionData(sectionId: string): Promise<any> {
    return this.request(`${this.BASE_URL}/sections/${sectionId}.json`);
  }
}

/**
 * 로딩 상태 관리 클래스
 */
export class LoadingManager {
  private loadingElements: Set<HTMLElement> = new Set();

  /**
   * 로딩 상태 표시
   */
  showLoading(element: HTMLElement, message: string = '로딩 중...'): void {
    element.innerHTML = `
      <div class="loading-container" style="
        display: flex;
        justify-content: center;
        align-items: center;
        height: 200px;
        color: #b3b3b3;
        font-size: 16px;
      ">
        <div class="loading-spinner" style="
          width: 20px;
          height: 20px;
          border: 2px solid #333;
          border-top: 2px solid #e50914;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 12px;
        "></div>
        ${message}
      </div>
    `;

    // CSS 애니메이션 추가
    if (!document.querySelector('#loading-styles')) {
      const style = document.createElement('style');
      style.id = 'loading-styles';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    this.loadingElements.add(element);
  }

  /**
   * 에러 상태 표시
   */
  showError(element: HTMLElement, message: string = '데이터를 불러오는데 실패했습니다.'): void {
    element.innerHTML = `
      <div class="error-container" style="
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 200px;
        color: #ff6b6b;
        text-align: center;
        padding: 20px;
      ">
        <div style="font-size: 24px; margin-bottom: 8px;">⚠️</div>
        <div style="font-size: 16px; margin-bottom: 12px;">${message}</div>
        <button 
          onclick="window.location.reload()" 
          style="
            padding: 8px 16px;
            background: #e50914;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          "
        >
          다시 시도
        </button>
      </div>
    `;

    this.loadingElements.delete(element);
  }

  /**
   * 로딩 상태 제거
   */
  hideLoading(element: HTMLElement): void {
    this.loadingElements.delete(element);
  }

  /**
   * 모든 로딩 상태 제거
   */
  hideAllLoading(): void {
    this.loadingElements.clear();
  }
}

/**
 * 캐시 관리 클래스 (선택사항)
 */
export class DataCache {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5분

  /**
   * 캐시에 데이터 저장
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * 캐시에서 데이터 가져오기
   */
  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    // TTL 체크
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * 특정 키 삭제
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 모든 캐시 삭제
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 만료된 캐시 정리
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }
}
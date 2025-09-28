import './style.css';
import { ContentAPI, LoadingManager } from './utils/api.js';
import { LikeManager, injectLikeStyles } from './components/LikeManager.js';
import { initHoverModals } from './components/Modal.js';
import Slider from './components/Slider.js';
import { Content, ContentSection, HeroContent } from './types/index.js';

/**
 * 메인 넷플릭스 애플리케이션 클래스
 */
class NetflixApp {
  private likeManager: LikeManager;
  private loadingManager: LoadingManager;
  private sliders: Slider[] = [];

  constructor() {
    this.likeManager = new LikeManager();
    this.loadingManager = new LoadingManager();
    
    console.log('NetflixApp 초기화 시작');
    this.init();
  }

  /**
   * 애플리케이션 초기화
   */
  private async init(): Promise<void> {
    try {
      // CSS 스타일 주입
      injectLikeStyles();
      
      // 병렬로 데이터 로딩 및 UI 초기화
      await Promise.all([
        this.loadHeroContent(),
        this.loadMainContent(),
        this.initializeModals(),
        this.initializeHeaderEffects()
      ]);

      console.log('NetflixApp 초기화 완료');
    } catch (error) {
      console.error('앱 초기화 실패:', error);
      this.handleAppError(error as Error);
    }
  }

  /**
   * 히어로 섹션 로딩
   */
  private async loadHeroContent(): Promise<void> {
    const heroSection = document.querySelector('.hero') as HTMLElement;
    if (!heroSection) return;

    try {
      const heroData = await ContentAPI.fetchHeroData();
      this.renderHeroSection(heroData, heroSection);
    } catch (error) {
      console.error('히어로 데이터 로딩 실패:', error);
      this.loadingManager.showError(heroSection, '히어로 콘텐츠를 불러올 수 없습니다.');
    }
  }

  /**
   * 메인 콘텐츠 로딩
   */
  private async loadMainContent(): Promise<void> {
    const mainContainer = document.querySelector('main') || document.body;
    
    try {
      this.loadingManager.showLoading(mainContainer as HTMLElement, '콘텐츠를 불러오는 중...');
      
      const contentData = await ContentAPI.fetchAllContent();
      this.renderContentSections(contentData.sections);
      
      // 슬라이더 초기화
      await this.initializeSliders();
      
      this.loadingManager.hideLoading(mainContainer as HTMLElement);
    } catch (error) {
      console.error('메인 콘텐츠 로딩 실패:', error);
      this.loadingManager.showError(mainContainer as HTMLElement);
    }
  }

  /**
   * 히어로 섹션 렌더링
   */
  private renderHeroSection(heroData: HeroContent, container: HTMLElement): void {
    const heroContent = container.querySelector('.hero-content');
    if (!heroContent) return;

    // 배경 이미지 업데이트
    container.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url('${heroData.image}')`;

    heroContent.innerHTML = `
      <div class="hero-badge">${heroData.badge}</div>
      <h1 class="hero-title">${heroData.title}</h1>
      <p class="hero-description">${heroData.description}</p>
      <div class="hero-buttons">
        <button class="play-btn" type="button">
          <span>▶</span> 재생
        </button>
        <button class="info-btn" type="button">
          <span>ⓘ</span> 상세 정보
        </button>
      </div>
    `;

    // 히어로 버튼 이벤트 추가
    this.attachHeroButtonEvents(heroContent);
  }

  /**
   * 콘텐츠 섹션들 렌더링
   */
  private renderContentSections(sections: ContentSection[]): void {
    const existingSections = document.querySelectorAll('.category-section[data-slider]');
    
    // 모든 콘텐츠 ID 수집
    const allContentIds = sections.flatMap(section => 
      section.contents.map(content => content.id)
    );
    
    // 초기 좋아요 개수 설정
    this.likeManager.initializeContentCounts(allContentIds);
    
    // 기존 섹션들을 새 데이터로 업데이트
    sections.forEach((sectionData, index) => {
      const existingSection = existingSections[index] as HTMLElement;
      if (existingSection) {
        this.renderSection(sectionData, existingSection);
      } else {
        // 새 섹션 생성 (필요한 경우)
        this.createNewSection(sectionData);
      }
    });
  }

  /**
   * 개별 섹션 렌더링
   */
  private renderSection(sectionData: ContentSection, container: HTMLElement): void {
    // 섹션 제목 업데이트
    const titleElement = container.querySelector('.section-title') as HTMLElement;
    if (titleElement) {
      titleElement.textContent = sectionData.title;
    }

    // 슬라이더 옵션 설정
    container.dataset.visible = sectionData.sliderOptions.visible.toString();
    container.dataset.step = sectionData.sliderOptions.step.toString();

    // 카드 컨테이너 찾기 또는 생성
    let cardContainer = container.querySelector('.card-row') as HTMLElement;
    if (!cardContainer) {
      cardContainer = document.createElement('div');
      cardContainer.className = 'card-row';
      container.appendChild(cardContainer);
    }

    // 카드들 렌더링
    cardContainer.innerHTML = '';
    sectionData.contents.forEach(content => {
      const card = this.createCard(content, sectionData.id === 'top10');
      cardContainer.appendChild(card);
    });
  }

  /**
   * 카드 생성
   */
  private createCard(content: Content, isTop10: boolean = false): HTMLElement {
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('data-content-id', content.id);

    const cardLink = document.createElement('a');
    cardLink.href = '#';
    cardLink.setAttribute('aria-label', `${content.title} 보기`);

    const cardImage = document.createElement('img');
    cardImage.className = 'card-image';
    cardImage.src = content.image;
    cardImage.alt = content.title;
    cardImage.loading = 'lazy';

    // 좋아요 버튼 추가
    const likeButton = this.likeManager.renderLikeButton(content);

    // TOP 10 랭킹 번호 추가
    let rankElement = '';
    if (isTop10 && content.rank) {
      rankElement = `<div class="rank-number">${content.rank}</div>`;
    }

    // 카드 오버레이
    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';
    overlay.innerHTML = `
      <div class="card-title">${content.title}</div>
    `;

    cardLink.appendChild(cardImage);
    card.appendChild(cardLink);
    card.appendChild(likeButton);
    card.appendChild(overlay);
    
    if (rankElement) {
      card.insertAdjacentHTML('afterbegin', rankElement);
    }

    // 카드 클릭 이벤트
    cardLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleCardClick(content);
    });

    return card;
  }

  /**
   * 새 섹션 생성 (동적 확장용)
   */
  private createNewSection(sectionData: ContentSection): void {
    const main = document.querySelector('main');
    if (!main) return;

    const section = document.createElement('section');
    section.className = 'category-section';
    section.setAttribute('data-slider', '');
    section.dataset.visible = sectionData.sliderOptions.visible.toString();
    section.dataset.step = sectionData.sliderOptions.step.toString();

    section.innerHTML = `
      <h2 class="section-title">${sectionData.title}</h2>
      <div class="card-row"></div>
    `;

    main.appendChild(section);
    this.renderSection(sectionData, section);
  }

  /**
   * 슬라이더 초기화
   */
  private async initializeSliders(): Promise<void> {
    console.log('슬라이더 초기화 중...');
    
    const sections = document.querySelectorAll('.category-section[data-slider]');
    console.log(`${sections.length}개의 슬라이더 섹션 발견`);

    sections.forEach((section, index) => {
      try {
        const htmlSection = section as HTMLElement;
        const visible = parseInt(htmlSection.dataset.visible || '6', 10);
        const step = parseInt(htmlSection.dataset.step || '3', 10);

        console.log(`슬라이더 ${index + 1} 생성: visible=${visible}, step=${step}`);

        const slider = new Slider(htmlSection, {
          visible,
          step,
          infinite: true,
          duration: 450,
          easing: 'ease',
          label: `slider-${index + 1}`
        });

        this.sliders.push(slider);
        console.log(`슬라이더 ${index + 1} 생성 완료`);
      } catch (error) {
        console.error(`슬라이더 ${index + 1} 생성 실패:`, error);
      }
    });
  }

  /**
   * 모달 초기화
   */
  private async initializeModals(): Promise<void> {
    try {
      initHoverModals();
      console.log('모달 초기화 완료');
    } catch (error) {
      console.error('모달 초기화 실패:', error);
    }
  }

  /**
   * 헤더 스크롤 효과 초기화
   */
  private initializeHeaderEffects(): void {
    const header = document.querySelector('.header') as HTMLElement;
    if (!header) return;

    let ticking = false;

    const updateHeaderStyle = () => {
      const scrolled = window.scrollY > 10;
      header.style.background = scrolled
        ? 'rgba(0,0,0,0.75)'
        : 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)';
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateHeaderStyle);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateHeaderStyle();
  }

  /**
   * 히어로 버튼 이벤트 연결
   */
  private attachHeroButtonEvents(heroContent: Element): void {
    const playBtn = heroContent.querySelector('.play-btn');
    const infoBtn = heroContent.querySelector('.info-btn');

    playBtn?.addEventListener('click', () => {
      console.log('재생 버튼 클릭');
      // 재생 로직 구현
    });

    infoBtn?.addEventListener('click', () => {
      console.log('상세 정보 버튼 클릭');
      // 상세 정보 모달 표시 로직 구현
    });
  }

  /**
   * 카드 클릭 핸들러
   */
  private handleCardClick(content: Content): void {
    console.log('카드 클릭:', content.title);
    // 상세 페이지 또는 재생 로직 구현
  }

  /**
   * 앱 에러 핸들러
   */
  private handleAppError(error: Error): void {
    console.error('애플리케이션 오류:', error);
    
    const errorMessage = document.createElement('div');
    errorMessage.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.9);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      z-index: 9999;
    `;
    errorMessage.innerHTML = `
      <h3>오류가 발생했습니다</h3>
      <p>${error.message}</p>
      <button onclick="location.reload()" style="
        padding: 8px 16px;
        background: #e50914;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
      ">새로고침</button>
    `;
    
    document.body.appendChild(errorMessage);
  }

  /**
   * 앱 정리
   */
  destroy(): void {
    this.sliders.forEach(slider => slider.destroy());
    this.sliders = [];
    this.likeManager.destroy();
    console.log('NetflixApp 정리 완료');
  }
}

// DOM 로드 완료 시 앱 시작
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM 로드 완료, 앱 시작');
  new NetflixApp();
});

// 전역 에러 핸들링
window.addEventListener('error', (event) => {
  console.error('전역 에러:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('처리되지 않은 Promise 거부:', event.reason);
});
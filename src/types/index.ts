// 기본 콘텐츠 인터페이스
export interface Content {
  id: string;
  title: string;
  image: string;
  category: string;
  isNew: boolean;
  rating: string;
  year: number;
  rank?: number; // TOP 10용
  description?: string;
  genres?: string[];
  seasons?: number;
}

// 히어로 섹션 전용 인터페이스
export interface HeroContent extends Content {
  badge: string;
  description: string;
  genres: string[];
}

// 슬라이더 옵션 인터페이스
export interface SliderOptions {
  visible: number;
  step: number;
  infinite?: boolean;
  duration?: number;
  easing?: string;
  label?: string;
}

// 섹션 인터페이스
export interface ContentSection {
  id: string;
  title: string;
  sliderOptions: SliderOptions;
  contents: Content[];
}

// API 응답 인터페이스
export interface ContentResponse {
  sections: ContentSection[];
}

// 좋아요 관련 인터페이스
export interface LikeData {
  contentId: string;
  likedAt: Date;
}

export interface LikeStorage {
  likes: Set<string>;
  save(): void;
  load(): void;
  toggle(contentId: string): boolean;
  isLiked(contentId: string): boolean;
}

// 모달 관련 인터페이스
export interface ModalOptions {
  offset: number;
  hoverDelayOpen: number;
  hoverDelayClose: number;
  closeOnOutsideClick: boolean;
}

export type ModalType = 'profile' | 'notifications';

// 슬라이더 클래스를 위한 인터페이스
export interface SliderInstance {
  currentIndex: number;
  isMoving: boolean;
  next(): void;
  prev(): void;
  goToPage(page: number): void;
  destroy(): void;
}

// 이벤트 핸들러 타입
export type EventHandler = (event: Event) => void;
export type ClickHandler = (event: MouseEvent) => void;
export type KeyboardHandler = (event: KeyboardEvent) => void;

// DOM 요소 확장
export interface HTMLElementWithSlider extends HTMLElement {
  _sliderInstance?: SliderInstance;
}
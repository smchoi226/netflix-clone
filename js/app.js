import Slider from './slider.js';
import { initHoverModals } from './modal.js';

console.log('App.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing...');
  
  // 1) 헤더 호버 모달 초기화
  try {
    initHoverModals();
    console.log('Modals initialized');
  } catch (error) {
    console.error('Modal initialization failed:', error);
  }

  // 2) 슬라이더 초기화
  initializeSliders();

  // 3) 스크롤 시 헤더 배경 색상 변화
  initializeHeaderScrollEffect();
});

function initializeSliders() {
  console.log('Initializing sliders...');
  
  // 모든 category-section을 찾아서 슬라이더로 변환
  const sections = document.querySelectorAll('.category-section[data-slider]');
  console.log(`Found ${sections.length} slider sections`);
  
  sections.forEach((section, index) => {
    try {
      // 각 섹션의 설정값 가져오기
      const visible = parseInt(section.dataset.visible || '6', 10);
      const step = parseInt(section.dataset.step || '3', 10);
      
      console.log(`Creating slider ${index + 1}: visible=${visible}, step=${step}`);
      
      new Slider(section, {
        visible: visible,
        step: step,
        infinite: true,
        duration: 450,
        easing: 'ease',
        label: `slider-${index + 1}`
      });
      
      console.log(`Slider ${index + 1} created successfully`);
    } catch (error) {
      console.error(`Slider ${index + 1} failed:`, error);
    }
  });
}

function initializeHeaderScrollEffect() {
  const header = document.querySelector('.header');
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
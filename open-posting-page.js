import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // 개발 서버로 이동
  await page.goto('http://localhost:5173');
  
  // localStorage에 더미 책 데이터 추가 (포스팅 테스트용)
  await page.evaluate(() => {
    const existingBooks = JSON.parse(localStorage.getItem('myLibraryBooks') || '[]');
    
    // 이미 완독 상태인 책이 있는지 확인
    let completedBook = existingBooks.find(book => book.status === 'completed');
    
    if (!completedBook) {
      // 완독 책이 없으면 더미 완독 책 추가
      const dummyBook = {
        id: Date.now(),
        title: '테스트 책',
        author: '테스트 저자',
        memo: '포스팅 테스트용',
        progress: 100,
        status: 'completed',
        startDate: new Date().toISOString().split('T')[0],
        completedDate: new Date().toISOString().split('T')[0],
        totalPage: 300,
        readPage: 300,
        totalReadingTime: 7200,
        publisher: '테스트 출판사',
        publishDate: '2024.01.01',
        thumbnail: '',
        isbn: '1234567890'
      };
      
      existingBooks.push(dummyBook);
      localStorage.setItem('myLibraryBooks', JSON.stringify(existingBooks));
      completedBook = dummyBook;
    }
    
    // 포스팅 페이지로 이동할 수 있도록 전역 변수에 저장
    window.__testBook = completedBook;
    
    console.log('✅ 테스트용 책 준비 완료:', completedBook);
  });
  
  // 포스팅 페이지로 이동 (책 정보를 state로 전달)
  await page.evaluate(() => {
    const book = window.__testBook;
    if (book) {
      // React Router의 navigate를 사용하기 위해 이벤트 발생
      window.dispatchEvent(new CustomEvent('navigate', { 
        detail: { 
          path: '/posting', 
          state: { book } 
        } 
      }));
    }
  });
  
  // 직접 URL로 이동 (state는 sessionStorage에 저장)
  await page.evaluate(() => {
    const book = window.__testBook;
    if (book) {
      sessionStorage.setItem('postingPageBook', JSON.stringify(book));
      window.location.href = '/posting';
    }
  });
  
  console.log('✅ 포스팅 페이지를 열었습니다!');
  console.log('브라우저에서 확인하세요.');
  
  // 브라우저는 열어둠
})();


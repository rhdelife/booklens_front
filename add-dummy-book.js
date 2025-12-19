import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // 개발 서버로 이동
  await page.goto('http://localhost:5173');
  
  // localStorage에 더미 책 데이터 추가
  await page.evaluate(() => {
    const existingBooks = JSON.parse(localStorage.getItem('myLibraryBooks') || '[]');
    
    const dummyBook = {
      id: Date.now(),
      title: '해리포터와 마법사의 돌',
      author: 'J.K. 롤링',
      memo: '테스트용 더미 데이터입니다',
      progress: 30,
      status: 'reading',
      startDate: new Date().toISOString().split('T')[0],
      completedDate: null,
      totalPage: 300,
      readPage: 90,
      totalReadingTime: 3600,
      publisher: '문학수첩',
      publishDate: '2020.01.01',
      thumbnail: 'https://books.google.com/books/content?id=39iYWTb6n48C&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
      isbn: '9788983927925'
    };
    
    existingBooks.push(dummyBook);
    localStorage.setItem('myLibraryBooks', JSON.stringify(existingBooks));
    
    console.log('✅ 더미 책이 추가되었습니다!', dummyBook);
  });
  
  console.log('✅ 더미 책 데이터가 localStorage에 추가되었습니다!');
  console.log('브라우저를 닫고 홈페이지를 새로고침하세요.');
  
  // 2초 후 브라우저 닫기
  await new Promise(resolve => setTimeout(resolve, 2000));
  await browser.close();
})();


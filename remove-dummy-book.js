import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // 개발 서버로 이동
  await page.goto('http://localhost:5173');
  
  // localStorage에서 더미 책 데이터 제거
  await page.evaluate(() => {
    const existingBooks = JSON.parse(localStorage.getItem('myLibraryBooks') || '[]');
    
    // "해리포터와 마법사의 돌" 제목을 가진 책 제거
    const filteredBooks = existingBooks.filter(book => 
      book.title !== '해리포터와 마법사의 돌'
    );
    
    localStorage.setItem('myLibraryBooks', JSON.stringify(filteredBooks));
    
    console.log('✅ 더미 책이 제거되었습니다!');
    console.log(`제거 전: ${existingBooks.length}권, 제거 후: ${filteredBooks.length}권`);
  });
  
  console.log('✅ 더미 책 데이터가 localStorage에서 제거되었습니다!');
  
  // 2초 후 브라우저 닫기
  await new Promise(resolve => setTimeout(resolve, 2000));
  await browser.close();
})();


const { chromium } = require('@playwright/test');

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('BROWSER CONSOLE ERROR:', msg.text());
    } else {
      console.log('BROWSER CONSOLE:', msg.text());
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.message);
    console.log('BROWSER PAGE EXCEPTION:', err.message);
  });

  try {
    console.log("Navigating to http://localhost:8080/students...");
    await page.goto('http://localhost:8080/students', { waitUntil: 'networkidle' });
    
    // Check if redirect/login is needed
    if (page.url().includes('/login') || (await page.locator('input[type="email"]').count()) > 0) {
      console.log("Login form detected. Logging in...");
      await page.fill('input[type="email"]', 'admin@sunstone.edu');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      console.log("Login submitted, waiting for navigation...");
      await page.waitForNavigation({ waitUntil: 'networkidle' });
    }

    console.log("Current URL:", page.url());
    
    // Wait for the students table or specific elements to render
    console.log("Waiting for students list/table to render...");
    await page.waitForTimeout(5000); // Wait 5 seconds to let state resolve and check for runtime errors

    // Let's check page URL again
    if (!page.url().includes('/students')) {
      console.log("Not on students page, navigating to /students...");
      await page.goto('http://localhost:8080/students', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
    }
    
    console.log("Taking screenshot...");
    const screenshotPath = 'C:\\Users\\Acer\\.gemini\\antigravity-ide\\brain\\3b29ad1f-0870-4e20-9fe1-1b69cafdec13\\students_page_rendered.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log("Screenshot saved to:", screenshotPath);
    
    console.log("Checking if student names are present on page...");
    const content = await page.content();
    console.log("Does the page contain student names like Aarav or Aditi?", content.includes("Aarav") || content.includes("Aditi") || content.includes("Student User"));
    
    if (consoleErrors.length > 0) {
      console.log("Verification finished with console errors:", consoleErrors);
    } else {
      console.log("Verification finished: No console errors detected!");
    }
  } catch (error) {
    console.error("Test execution failed:", error);
  } finally {
    await browser.close();
  }
})();

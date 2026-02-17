# Dark Theme Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 新增深色/淺色主題手動切換功能

**Architecture:** 在 `<html>` 上設定 `data-theme="light|dark"` 屬性，用 CSS 選擇器覆蓋 `:root` 變數。Navbar 右側放切換按鈕，偏好存 localStorage。

**Tech Stack:** HTML, CSS (custom properties), Vanilla JS, Playwright (E2E)

---

## Task 1: 切換按鈕顯示

**Files:**
- Test: `tests/timer.spec.ts`
- Modify: `public/index.html`
- Modify: `public/style.css`

**Step 1: Write the failing test**

在 `tests/timer.spec.ts` 最後加入新的 describe block：

```typescript
test.describe('Theme Toggle', () => {
  test('should display theme toggle button in navbar', async ({ page }) => {
    await page.goto('/');

    const toggleButton = page.getByTestId('theme-toggle-button');
    await expect(toggleButton).toBeVisible();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx playwright test --grep "should display theme toggle button"`
Expected: FAIL - element not found

**Step 3: Write minimal implementation**

在 `public/index.html` 的 navbar 中，info-button 之後加入：

```html
<button data-testid="theme-toggle-button" class="theme-toggle-button">☽</button>
```

在 `public/style.css` 加入：

```css
.theme-toggle-button {
  width: 28px;
  height: 28px;
  padding: 0;
  font-size: 1rem;
  border-radius: 50%;
  background-color: var(--color-border);
  color: var(--color-text-muted);
  margin-left: auto;
}

.theme-toggle-button:hover {
  background-color: #d5d0ca;
}
```

**Step 4: Run test to verify it passes**

Run: `npx playwright test --grep "should display theme toggle button"`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/timer.spec.ts public/index.html public/style.css
git commit -m "feat: add theme toggle button to navbar"
```

---

## Task 2: 點擊切換主題

**Files:**
- Test: `tests/timer.spec.ts`
- Modify: `public/app.js`

**Step 1: Write the failing test**

```typescript
test('should toggle to dark theme when clicked', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('theme-toggle-button').click();

  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(theme).toBe('dark');
});

test('should toggle back to light theme when clicked again', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('theme-toggle-button').click();
  await page.getByTestId('theme-toggle-button').click();

  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(theme).toBe('light');
});
```

**Step 2: Run test to verify it fails**

Run: `npx playwright test --grep "should toggle to dark theme"`
Expected: FAIL

**Step 3: Write minimal implementation**

在 `public/app.js` 的 DOMContentLoaded 中加入：

```javascript
const themeToggleButton = document.querySelector('[data-testid="theme-toggle-button"]');

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggleButton.textContent = theme === 'dark' ? '☀' : '☽';
}

themeToggleButton.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', next);
  setTheme(next);
});
```

**Step 4: Run test to verify it passes**

Run: `npx playwright test --grep "should toggle"`
Expected: PASS

**Step 5: Commit**

```bash
git add public/app.js tests/timer.spec.ts
git commit -m "feat: toggle theme on button click"
```

---

## Task 3: 深色 CSS 變數

**Files:**
- Test: `tests/timer.spec.ts`
- Modify: `public/style.css`

**Step 1: Write the failing test**

```typescript
test('should apply dark background color in dark theme', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('theme-toggle-button').click();

  const bgColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  // #1a1917 = rgb(26, 25, 23)
  expect(bgColor).toBe('rgb(26, 25, 23)');
});
```

**Step 2: Run test to verify it fails**

Run: `npx playwright test --grep "should apply dark background"`
Expected: FAIL

**Step 3: Write minimal implementation**

在 `public/style.css` 加入：

```css
[data-theme="dark"] {
  --color-bg: #1a1917;
  --color-card: #262421;
  --color-card-alt: #2e2b28;
  --color-text: #e8e4df;
  --color-text-muted: #9a9590;
  --color-border: #3a3735;
  --color-accent: #b0a090;
}
```

**Step 4: Run test to verify it passes**

Run: `npx playwright test --grep "should apply dark background"`
Expected: PASS

**Step 5: Commit**

```bash
git add public/style.css tests/timer.spec.ts
git commit -m "feat: add dark theme CSS variables"
```

---

## Task 4: 主題持久化

**Files:**
- Test: `tests/timer.spec.ts`
- Modify: `public/index.html`

**Step 1: Write the failing test**

```typescript
test('should persist theme preference across page reload', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('theme-toggle-button').click();
  await page.reload();

  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(theme).toBe('dark');
});
```

**Step 2: Run test to verify it fails**

Run: `npx playwright test --grep "should persist theme"`
Expected: FAIL - theme resets to light after reload

**Step 3: Write minimal implementation**

在 `public/index.html` 的 `<head>` 中，`<link rel="stylesheet">` 之前加入 inline script：

```html
<script>document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'light');</script>
```

同時在 `public/app.js` 的 DOMContentLoaded 中，setTheme 呼叫處讀取 localStorage：

```javascript
setTheme(localStorage.getItem('theme') || 'light');
```

**Step 4: Run test to verify it passes**

Run: `npx playwright test --grep "should persist theme"`
Expected: PASS

**Step 5: Commit**

```bash
git add public/index.html public/app.js tests/timer.spec.ts
git commit -m "feat: persist theme preference in localStorage"
```

---

## Task 5: 按鈕圖示同步

**Files:**
- Test: `tests/timer.spec.ts`

**Step 1: Write the failing test**

```typescript
test('should show sun icon in dark mode and moon icon in light mode', async ({ page }) => {
  await page.goto('/');

  // 預設淺色：顯示月亮
  await expect(page.getByTestId('theme-toggle-button')).toHaveText('☽');

  // 切到深色：顯示太陽
  await page.getByTestId('theme-toggle-button').click();
  await expect(page.getByTestId('theme-toggle-button')).toHaveText('☀');
});

test('should show correct icon after reload in dark mode', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('theme-toggle-button').click();
  await page.reload();

  await expect(page.getByTestId('theme-toggle-button')).toHaveText('☀');
});
```

**Step 2: Run test to verify it passes (or fails)**

Run: `npx playwright test --grep "should show sun icon|should show correct icon"`
Expected: 若 Task 2 和 4 已正確實作，這些測試應該直接 PASS。若 FAIL 則修正 setTheme 邏輯。

**Step 3: Commit**

```bash
git add tests/timer.spec.ts
git commit -m "test: add theme icon synchronization tests"
```

---

## Task 6: 深色模式下 hover 色修正

**Files:**
- Modify: `public/style.css`

**Step 1: Write the failing test**

```typescript
test('should apply dark hover color for info button in dark mode', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('theme-toggle-button').click();

  // 驗證 info button hover 顏色在深色模式不是淺色的硬編碼值
  const bgColor = await page.evaluate(() => {
    const btn = document.querySelector('.info-button') as HTMLElement;
    return getComputedStyle(btn).backgroundColor;
  });
  // 深色模式下 border 色為 #3a3735 = rgb(58, 55, 53)
  expect(bgColor).toBe('rgb(58, 55, 53)');
});
```

**Step 2: Run test to verify it fails**

Run: `npx playwright test --grep "should apply dark hover color"`
Expected: FAIL - info-button 仍用淺色的硬編碼 background

**Step 3: Write minimal implementation**

在 `public/style.css` 加入深色 hover 覆蓋：

```css
[data-theme="dark"] .info-button:hover {
  background-color: #4a4745;
}

[data-theme="dark"] .theme-toggle-button:hover {
  background-color: #4a4745;
}

[data-theme="dark"] button:hover {
  background-color: #a09080;
}

[data-theme="dark"] .date-nav button:hover {
  background-color: #4a4745;
}
```

**Step 4: Run test to verify it passes**

Run: `npx playwright test --grep "should apply dark hover color"`
Expected: PASS

**Step 5: Commit**

```bash
git add public/style.css tests/timer.spec.ts
git commit -m "fix: correct hover colors in dark mode"
```

---

## Task 7: 全部測試通過 + 視覺驗證

**Step 1: Run all tests**

Run: `npx playwright test`
Expected: All tests PASS

**Step 2: 手動視覺驗證**

開啟 http://localhost:8080，切換深色/淺色模式，確認：
- 所有文字可讀
- 階段色 pill 在深色背景上對比足夠
- 圖表長條可辨識
- modal 在深色模式下正確顯示

**Step 3: Commit (if any fixes needed)**

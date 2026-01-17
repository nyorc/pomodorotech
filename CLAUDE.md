# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PomodoroTech - A simple Pomodoro timer web application with daily statistics tracking. Built with vanilla HTML, CSS, and JavaScript (no frameworks or build tools).

## Tech Stack

- HTML
- CSS
- JavaScript (Vanilla)
- Playwright (E2E Testing)

## Development

No build step required. Use a local server:

```bash
# 啟動開發伺服器 (port 8080)
npm run dev

# 執行測試
npm test
```

## Architecture

This is a simple single-page application with no build process:
- `public/` - Static files for deployment
  - `index.html` - Main entry point
  - `style.css` - Styles
  - `app.js` - Application logic
- `tests/` - Playwright E2E tests
- `.github/workflows/` - GitHub Actions for deployment

## Data Structure

localStorage key: `stats-{YYYY-MM-DD}`

```json
{
  "completed": 3,
  "cancelled": 1,
  "records": [
    { "type": "work", "timestamp": "2026-01-17T10:30:00.000Z" },
    { "type": "shortBreak", "timestamp": "2026-01-17T10:55:00.000Z" },
    { "type": "longBreak", "timestamp": "2026-01-17T12:00:00.000Z" },
    { "type": "cancelled", "timestamp": "2026-01-17T14:00:00.000Z" }
  ]
}
```

## Test-Driven Development (TDD)

本專案採用 TDD 開發流程，請遵循以下原則。

### 執行測試

- 測試框架: Playwright
- 測試目錄: `tests/`
- 執行所有測試: `npm test`
- 執行單一測試檔: `npx playwright test tests/timer.spec.ts`
- 執行特定測試: `npm test -- --grep "測試名稱"`

### 核心循環: Red-Green-Refactor

1. **Red**: 先寫一個會失敗的測試，定義預期行為
2. **Green**: 用最簡單的方式讓測試通過
3. **Refactor**: 在測試保護下重構程式碼，消除重複與壞味道

### TDD 原則

- 測試先行 (Test First): 在寫任何 production code 之前，必須先有一個失敗的測試
- 小步前進 (Baby Steps): 每次只專注於一個小功能，逐步累積
- 只寫剛好夠用的程式碼 (Just Enough Code): 不要過度設計，只實作讓測試通過的最少程式碼
- 頻繁執行測試 (Run Tests Frequently): 每次修改後都要跑測試，確保沒有破壞既有功能
- 測試即文件 (Tests as Documentation): 測試應清楚表達程式碼的預期行為

### 開發流程

當收到功能需求時，請依照以下步驟進行:

1. 分析需求，拆解成可測試的小單元
2. 為第一個單元撰寫失敗測試
3. 執行測試，確認測試失敗 (Red)
4. 撰寫最少量的程式碼讓測試通過 (Green)
5. 重構程式碼，保持測試通過 (Refactor)
6. 重複步驟 2-5 直到功能完成

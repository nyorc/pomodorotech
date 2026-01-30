# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PomodoroTech - A simple Pomodoro timer web application with daily statistics tracking. Built with vanilla HTML, CSS, and JavaScript (no frameworks or build tools).

## 番茄鐘核心價值

本專案的功能設計應體現以下核心價值：

### 1. 重新定義與時間的關係
- 傳統觀念：時間控制我們，帶來壓力與焦慮
- 番茄鐘：我們成為時間的夥伴，而非受害者
- 從「被時間追著跑」變成「主動運用時間」

### 2. 培養時間意識
- 多數人從未追蹤自己的時間，導致大量浪費
- 透過記錄，發現實際耗時與預期的落差
- 目標不是完成番茄，而是覺察自己心智發生了什麼

### 3. 休息是最重要的元素
- 休息讓你在下一個番茄開始時更清晰、更有意願工作
- 打破「一直工作才有生產力」的迷思

### 4. 保護專注力
- 番茄不可分割：沒有半個番茄，被打斷就作廢
- 訓練拒絕干擾的能力
- 完成一個不被打斷的番茄，本身就是成就

### 5. 低科技哲學
- 簡單的工具，專注的體驗
- 減少不必要的功能干擾

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

## UI Design

### 配色系統

使用 CSS 變數統一管理，定義於 `:root`：

- 基底色：大地色系 (米白 #f7f5f2、棕灰 #4a4540)
- 階段色：Work 暖珊瑚、Short Break 柔和綠、Long Break 淡藍
- 今日標記：藍色 #5b8fb9 (與階段色區隔)

### 設計原則

1. 專注：計時器為視覺焦點 (7rem)，其他元素低調輔助
2. 含蓄：階段狀態用 pill 標籤 + 12% 透明度背景，避免突兀邊框
3. 響應式：固定寬度 480px，搭配 `max-width: calc(100vw - 2rem)`
4. 一致：數字使用 `tabular-nums` 避免跳動

### 佈局結構

```
計時器區塊 (純白背景，主角)
統計區塊 (淺灰背景，兩行式：日期導航 + 統計數據)
週圖表 (淺灰背景，長條上方顯示數值)
```

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

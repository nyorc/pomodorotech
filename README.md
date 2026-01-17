# PomodoroTech

A simple Pomodoro timer web application with daily statistics tracking.

## What is Pomodoro Technique?

The Pomodoro Technique helps you maintain focus and avoid burnout by alternating between concentrated work sessions and regular breaks.

番茄鐘工作法透過專注工作與定期休息的交替循環，幫助你維持專注力並避免過度疲勞。

### Original Steps

The original technique has six steps:
0. Decide on the task to be done.
1. Set the Pomodoro timer (typically for 25 minutes).
2. Work on the task.
3. End work when the timer rings and take a short break (typically 5–10 minutes).
4. Go back to Step 2 and repeat until you complete four pomodori.
5. After four pomodori are done, take a long break (typically 20 to 30 minutes) instead of a short break. Once the long break is finished, return to step 2.

## Features

- 25 分鐘工作 / 5 分鐘短休息 / 15 分鐘長休息
- 每 4 個工作週期後進入長休息
- 每日統計（可切換日期查看歷史）
- 詳細記錄每次完成/取消的時間戳
- 倒數完成提示音
- 瀏覽器通知

## Tech Stack

- HTML
- CSS
- JavaScript (Vanilla)
- Playwright (E2E Testing)

## Getting Started

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 執行測試
npm test
```

## Reference

- https://en.wikipedia.org/wiki/Pomodoro_Technique

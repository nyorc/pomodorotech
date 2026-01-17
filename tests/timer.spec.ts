import { test, expect } from '@playwright/test';

test.describe('PomodoroTech', () => {
  test.describe('Initial State', () => {
    test('should display 25:00 as initial time', async ({ page }) => {
      await page.goto('/');

      const timerDisplay = page.getByTestId('timer-display');

      await expect(timerDisplay).toHaveText('25:00');
    });

    test('should display counter labels', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByTestId('completed-label')).toHaveText('Completed');
      await expect(page.getByTestId('cancelled-label')).toHaveText('Cancelled');
    });
  });

  test.describe('Start Button Click', () => {
    test('should hide start button and show cancel button', async ({ page }) => {
      await page.goto('/');

      await page.getByTestId('start-button').click();

      await expect(page.getByTestId('start-button')).toBeHidden();
      await expect(page.getByTestId('cancel-button')).toBeVisible();
    });

    test('should start countdown', async ({ page }) => {
      await page.goto('/');

      await page.getByTestId('start-button').click();
      await page.waitForTimeout(1000);

      await expect(page.getByTestId('timer-display')).toHaveText('24:59');
    });
  });

  test.describe('Cancel Button Click', () => {
    test('should stop countdown and reset time to 25:00', async ({ page }) => {
      await page.goto('/');
      await page.getByTestId('start-button').click();
      await page.waitForTimeout(1000);

      await page.getByTestId('cancel-button').click();

      await expect(page.getByTestId('timer-display')).toHaveText('25:00');
      await page.waitForTimeout(1000);
      await expect(page.getByTestId('timer-display')).toHaveText('25:00');
    });

    test('should increment cancelled count', async ({ page }) => {
      await page.goto('/');
      await page.getByTestId('start-button').click();

      await page.getByTestId('cancel-button').click();

      await expect(page.getByTestId('cancelled-count')).toHaveText('1');
    });

    test('should show start button and hide cancel button', async ({ page }) => {
      await page.goto('/');
      await page.getByTestId('start-button').click();

      await page.getByTestId('cancel-button').click();

      await expect(page.getByTestId('start-button')).toBeVisible();
      await expect(page.getByTestId('cancel-button')).toBeHidden();
    });
  });

  test.describe('Timer Finish', () => {
    test('should increment completed count', async ({ page }) => {
      await page.goto('/?testMode=true');

      await page.getByTestId('start-button').click();
      await page.waitForTimeout(3000);

      await expect(page.getByTestId('completed-count')).toHaveText('1');
    });

    test('should enter short break phase after work', async ({ page }) => {
      await page.goto('/?testMode=true');

      await page.getByTestId('start-button').click();
      await page.waitForTimeout(3000);

      await expect(page.getByTestId('phase-display')).toHaveText('Short Break');
      await expect(page.getByTestId('timer-display')).toHaveText('0:02');
      await expect(page.getByTestId('start-button')).toBeVisible();
    });

    test('should return to work phase after short break', async ({ page }) => {
      await page.goto('/?testMode=true');

      await page.getByTestId('start-button').click();
      await page.waitForTimeout(3000);

      await page.getByTestId('start-button').click();
      await page.waitForTimeout(3000);

      await expect(page.getByTestId('phase-display')).toHaveText('Work');
      await expect(page.getByTestId('timer-display')).toHaveText('0:02');
      await expect(page.getByTestId('start-button')).toBeVisible();
    });

    test('should enter long break after 4 pomodoros', async ({ page }) => {
      await page.goto('/?testMode=true');

      for (let i = 0; i < 4; i++) {
        await page.getByTestId('start-button').click();
        await page.waitForTimeout(3000);

        if (i < 3) {
          await page.getByTestId('start-button').click();
          await page.waitForTimeout(3000);
        }
      }

      await expect(page.getByTestId('phase-display')).toHaveText('Long Break');
    });
  });

  test.describe('Notification', () => {
    // 倒數結束時應發出瀏覽器通知，讓用戶知道進入下一階段
    test('should show notification when timer finishes', async ({ page }) => {
      // Playwright 無法攔截真實瀏覽器通知，需透過 mock 來驗證呼叫行為
      await page.addInitScript(() => {
        (window as any).notificationCalls = [];
        (window as any).Notification = class {
          constructor(title: string, options?: any) {
            (window as any).notificationCalls.push({ title, options });
          }
          static permission = 'granted';
          static requestPermission() {
            return Promise.resolve('granted');
          }
        };
      });

      await page.goto('/?testMode=true');
      await page.getByTestId('start-button').click();
      await page.waitForTimeout(3000);

      const calls = await page.evaluate(() => (window as any).notificationCalls);
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0].title).toContain('PomodoroTech');
    });

    // 倒數完成時應播放音效提醒用戶
    test('should play sound when timer finishes', async ({ page }) => {
      await page.addInitScript(() => {
        (window as any).oscillatorStartCalls = 0;
        const MockOscillator = {
          connect: () => {},
          frequency: { value: 0 },
          type: 'sine',
          start: () => { (window as any).oscillatorStartCalls++; },
          stop: () => {}
        };
        const MockGainNode = {
          connect: () => {},
          gain: { value: 0, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }
        };
        (window as any).AudioContext = class {
          currentTime = 0;
          destination = {};
          createOscillator() { return MockOscillator; }
          createGain() { return MockGainNode; }
        };
      });

      await page.goto('/?testMode=true');
      await page.getByTestId('start-button').click();
      await page.waitForTimeout(3000);

      const calls = await page.evaluate(() => (window as any).oscillatorStartCalls);
      expect(calls).toBeGreaterThan(0);
    });
  });

  test.describe('Persistence', () => {
    test('should persist counts after page reload', async ({ page }) => {
      await page.goto('/?testMode=true');
      await page.getByTestId('start-button').click();
      await page.waitForTimeout(3000);

      await expect(page.getByTestId('completed-count')).toHaveText('1');

      await page.reload();

      await expect(page.getByTestId('completed-count')).toHaveText('1');
    });
  });

  test.describe('Daily Statistics', () => {
    // 統計區應顯示當前查看的日期，預設為今天
    test('should display today date in stats section', async ({ page }) => {
      await page.goto('/');

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      await expect(page.getByTestId('stats-date')).toHaveText(today);
    });

    // 完成計數應按日期儲存，以便查詢歷史記錄
    test('should store completed count by date', async ({ page }) => {
      await page.goto('/?testMode=true');

      await page.getByTestId('start-button').click();
      await page.waitForTimeout(3000);

      const today = new Date().toISOString().split('T')[0];
      const stats = await page.evaluate((date) => {
        const data = localStorage.getItem(`stats-${date}`);
        return data ? JSON.parse(data) : null;
      }, today);

      expect(stats).not.toBeNull();
      expect(stats.completed).toBe(1);
    });

    // 取消計數應按日期儲存，與完成計數使用相同資料結構
    test('should store cancelled count by date', async ({ page }) => {
      await page.goto('/');

      await page.getByTestId('start-button').click();
      await page.getByTestId('cancel-button').click();

      const today = new Date().toISOString().split('T')[0];
      const stats = await page.evaluate((date) => {
        const data = localStorage.getItem(`stats-${date}`);
        return data ? JSON.parse(data) : null;
      }, today);

      expect(stats).not.toBeNull();
      expect(stats.cancelled).toBe(1);
    });

    // 頁面載入時應從當天記錄讀取統計，而非全域累計值
    test('should load today stats on page load', async ({ page }) => {
      const today = new Date().toISOString().split('T')[0];

      await page.goto('/');
      await page.evaluate((date) => {
        localStorage.setItem(`stats-${date}`, JSON.stringify({ completed: 5, cancelled: 2 }));
      }, today);

      await page.reload();

      await expect(page.getByTestId('completed-count')).toHaveText('5');
      await expect(page.getByTestId('cancelled-count')).toHaveText('2');
    });

    // 點擊「前一天」按鈕後，日期應切換到前一天並顯示該日統計
    test('should navigate to previous day and show its stats', async ({ page }) => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      await page.goto('/');
      await page.evaluate((date) => {
        localStorage.setItem(`stats-${date}`, JSON.stringify({ completed: 3, cancelled: 1 }));
      }, yesterdayStr);

      await page.getByTestId('prev-day-button').click();

      await expect(page.getByTestId('stats-date')).toHaveText(yesterdayStr);
      await expect(page.getByTestId('completed-count')).toHaveText('3');
      await expect(page.getByTestId('cancelled-count')).toHaveText('1');
    });

    // 點擊「後一天」按鈕後，日期應切換到後一天並顯示該日統計
    test('should navigate to next day and show its stats', async ({ page }) => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      await page.goto('/');
      await page.evaluate((date) => {
        localStorage.setItem(`stats-${date}`, JSON.stringify({ completed: 7, cancelled: 0 }));
      }, todayStr);

      await page.getByTestId('prev-day-button').click();
      await page.getByTestId('next-day-button').click();

      await expect(page.getByTestId('stats-date')).toHaveText(todayStr);
      await expect(page.getByTestId('completed-count')).toHaveText('7');
    });

    // 在今天時，後一天按鈕應禁用，避免用戶查看不存在的未來統計
    test('should disable next day button when viewing today', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByTestId('next-day-button')).toBeDisabled();
    });

    // 每次工作完成應記錄時間戳，以便追蹤詳細歷史
    test('should record work completion with timestamp', async ({ page }) => {
      await page.goto('/?testMode=true');

      await page.getByTestId('start-button').click();
      await page.waitForTimeout(3000);

      const today = new Date().toISOString().split('T')[0];
      const stats = await page.evaluate((date) => {
        const data = localStorage.getItem(`stats-${date}`);
        return data ? JSON.parse(data) : null;
      }, today);

      expect(stats.records).toBeDefined();
      expect(stats.records.length).toBe(1);
      expect(stats.records[0].type).toBe('work');
      expect(stats.records[0].timestamp).toBeDefined();
    });

    // 短休息完成也應記錄，以完整追蹤一天的活動
    test('should record short break completion with timestamp', async ({ page }) => {
      await page.goto('/?testMode=true');

      // 完成工作 -> 進入短休息 -> 完成短休息
      await page.getByTestId('start-button').click();
      await page.waitForTimeout(3000);
      await page.getByTestId('start-button').click();
      await page.waitForTimeout(3000);

      const today = new Date().toISOString().split('T')[0];
      const stats = await page.evaluate((date) => {
        const data = localStorage.getItem(`stats-${date}`);
        return data ? JSON.parse(data) : null;
      }, today);

      expect(stats.records.length).toBe(2);
      expect(stats.records[1].type).toBe('shortBreak');
    });
  });
});

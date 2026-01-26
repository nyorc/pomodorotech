import { test, expect } from '@playwright/test';

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

test.describe('PomodoroTech', () => {
  test.describe('Initial State', () => {
    test('should display initial timer and counter labels', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByTestId('timer-display')).toHaveText('25:00');
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
    test('should reset timer, increment cancelled count, and toggle buttons', async ({ page }) => {
      await page.goto('/');
      await page.getByTestId('start-button').click();
      await page.waitForTimeout(1000);

      await page.getByTestId('cancel-button').click();

      await expect(page.getByTestId('timer-display')).toHaveText('25:00');
      await expect(page.getByTestId('cancelled-count')).toHaveText('1');
      await expect(page.getByTestId('start-button')).toBeVisible();
      await expect(page.getByTestId('cancel-button')).toBeHidden();
      // 確認計時器已停止
      await page.waitForTimeout(1000);
      await expect(page.getByTestId('timer-display')).toHaveText('25:00');
    });
  });

  test.describe('Timer Finish', () => {
    test('should increment completed count', async ({ page }) => {
      await page.goto('/?testMode=true');

      await page.getByTestId('start-button').click();
      await page.waitForTimeout(1500);

      await expect(page.getByTestId('completed-count')).toHaveText('1');
    });

    test('should enter short break phase after work', async ({ page }) => {
      await page.goto('/?testMode=true');

      await page.getByTestId('start-button').click();
      await page.waitForTimeout(1500);

      await expect(page.getByTestId('phase-display')).toHaveText('Short Break');
      await expect(page.getByTestId('timer-display')).toHaveText('0:01');
      await expect(page.getByTestId('start-button')).toBeVisible();
    });

    test('should return to work phase after short break', async ({ page }) => {
      await page.goto('/?testMode=true');

      await page.getByTestId('start-button').click();
      await page.waitForTimeout(1500);

      await page.getByTestId('start-button').click();
      await page.waitForTimeout(1500);

      await expect(page.getByTestId('phase-display')).toHaveText('Work');
      await expect(page.getByTestId('timer-display')).toHaveText('0:01');
      await expect(page.getByTestId('start-button')).toBeVisible();
    });

    test('should enter long break after 4 pomodoros', async ({ page }) => {
      await page.goto('/?testMode=true');

      for (let i = 0; i < 4; i++) {
        await page.getByTestId('start-button').click();
        await page.waitForTimeout(1500);

        if (i < 3) {
          await page.getByTestId('start-button').click();
          await page.waitForTimeout(1500);
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
      await page.waitForTimeout(1500);

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
      await page.waitForTimeout(1500);

      const calls = await page.evaluate(() => (window as any).oscillatorStartCalls);
      expect(calls).toBeGreaterThan(0);
    });
  });

  test.describe('Persistence', () => {
    test('should persist counts after page reload', async ({ page }) => {
      await page.goto('/?testMode=true');
      await page.getByTestId('start-button').click();
      await page.waitForTimeout(1500);

      await expect(page.getByTestId('completed-count')).toHaveText('1');

      await page.reload();

      await expect(page.getByTestId('completed-count')).toHaveText('1');
    });
  });

  test.describe('Daily Statistics', () => {
    // 統計區應顯示休息次數標籤和計數，讓用戶了解休息頻率
    test('should display breaks counter label and count', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByTestId('breaks-label')).toHaveText('Breaks');
      await expect(page.getByTestId('breaks-count')).toHaveText('0');
    });

    // 完成短休息後，休息計數應增加
    test('should increment breaks count after short break completion', async ({ page }) => {
      await page.goto('/?testMode=true');

      // 完成工作 -> 進入短休息 -> 完成短休息
      await page.getByTestId('start-button').click();
      await page.waitForTimeout(1500);
      await page.getByTestId('start-button').click();
      await page.waitForTimeout(1500);

      await expect(page.getByTestId('breaks-count')).toHaveText('1');
    });

    // 統計區應顯示當前查看的日期，預設為今天
    test('should display today date in stats section', async ({ page }) => {
      await page.goto('/');

      const today = toLocalDateString(new Date());
      await expect(page.getByTestId('stats-date')).toHaveText(today);
    });

    // 完成計數應按日期儲存，以便查詢歷史記錄
    test('should store completed count by date', async ({ page }) => {
      await page.goto('/?testMode=true');

      await page.getByTestId('start-button').click();
      await page.waitForTimeout(1500);

      const today = toLocalDateString(new Date());
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

      const today = toLocalDateString(new Date());
      const stats = await page.evaluate((date) => {
        const data = localStorage.getItem(`stats-${date}`);
        return data ? JSON.parse(data) : null;
      }, today);

      expect(stats).not.toBeNull();
      expect(stats.cancelled).toBe(1);
    });

    // 頁面載入時應從 records 陣列計算統計值，確保資料一致性
    test('should calculate stats from records array on page load', async ({ page }) => {
      const today = toLocalDateString(new Date());

      await page.goto('/');
      await page.evaluate((date) => {
        // 只設定 records，不設定數字欄位，驗證系統會從 records 計算
        localStorage.setItem(`stats-${date}`, JSON.stringify({
          records: [
            { type: 'work', timestamp: '2026-01-17T10:00:00.000Z' },
            { type: 'work', timestamp: '2026-01-17T11:00:00.000Z' },
            { type: 'shortBreak', timestamp: '2026-01-17T10:30:00.000Z' },
            { type: 'longBreak', timestamp: '2026-01-17T12:00:00.000Z' },
            { type: 'cancelled', timestamp: '2026-01-17T14:00:00.000Z' }
          ]
        }));
      }, today);

      await page.reload();

      // 從 records 計算：work=2, breaks=2 (shortBreak+longBreak), cancelled=1
      await expect(page.getByTestId('completed-count')).toHaveText('2');
      await expect(page.getByTestId('breaks-count')).toHaveText('2');
      await expect(page.getByTestId('cancelled-count')).toHaveText('1');
    });

    // 頁面載入時應從當天記錄讀取統計，而非全域累計值
    test('should load today stats on page load', async ({ page }) => {
      const today = toLocalDateString(new Date());

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
      const yesterdayStr = toLocalDateString(yesterday);

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
      const todayStr = toLocalDateString(today);

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
      await page.waitForTimeout(1500);

      const today = toLocalDateString(new Date());
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
      await page.waitForTimeout(1500);
      await page.getByTestId('start-button').click();
      await page.waitForTimeout(1500);

      const today = toLocalDateString(new Date());
      const stats = await page.evaluate((date) => {
        const data = localStorage.getItem(`stats-${date}`);
        return data ? JSON.parse(data) : null;
      }, today);

      expect(stats.records.length).toBe(2);
      expect(stats.records[1].type).toBe('shortBreak');
    });
  });

  test.describe('Timezone Handling', () => {
    // 凌晨完成的番茄鐘應記錄到本地日期，而非 UTC 日期
    // 例如：台灣時間 01/26 03:00 (UTC 01/25 19:00) 應記錄到 01/26
    test('should use local date for stats storage, not UTC date', async ({ page }) => {
      // 模擬本地時間凌晨 3:00（UTC 時間會是前一天）
      const localMidnight = new Date();
      localMidnight.setHours(3, 0, 0, 0);
      const localDateStr = `${localMidnight.getFullYear()}-${String(localMidnight.getMonth() + 1).padStart(2, '0')}-${String(localMidnight.getDate()).padStart(2, '0')}`;

      await page.addInitScript((fakeTime) => {
        const OriginalDate = Date;
        const mockDate = new OriginalDate(fakeTime);

        class MockDate extends OriginalDate {
          constructor(...args: any[]) {
            if (args.length === 0) {
              super(mockDate.getTime());
            } else {
              // @ts-ignore
              super(...args);
            }
          }
          static now() {
            return mockDate.getTime();
          }
        }
        // @ts-ignore
        window.Date = MockDate;
      }, localMidnight.getTime());

      await page.goto('/?testMode=true');
      await page.getByTestId('start-button').click();
      await page.waitForTimeout(1500);

      // 驗證資料儲存在本地日期的 key 下
      const stats = await page.evaluate((dateStr) => {
        const data = localStorage.getItem(`stats-${dateStr}`);
        return data ? JSON.parse(data) : null;
      }, localDateStr);

      expect(stats).not.toBeNull();
      expect(stats.completed).toBe(1);
    });
  });

  test.describe('Weekly Chart', () => {
    // 統計區下方應顯示七天長條圖容器
    test('should display weekly chart with 7 bars', async ({ page }) => {
      await page.goto('/');

      const chart = page.getByTestId('weekly-chart');
      await expect(chart).toBeVisible();

      const bars = page.locator('[data-testid="weekly-chart"] [data-testid^="chart-bar-"]');
      await expect(bars).toHaveCount(7);
    });

    // 長條圖應根據歷史資料顯示對應高度
    test('should display bar heights based on completed counts', async ({ page }) => {
      const today = new Date();
      const dates: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        dates.push(toLocalDateString(d));
      }

      await page.goto('/');
      // 設定測試資料：最近 7 天完成次數分別為 2, 0, 4, 1, 0, 3, 5
      const testData = [2, 0, 4, 1, 0, 3, 5];
      await page.evaluate(({ dates, testData }) => {
        dates.forEach((date, i) => {
          if (testData[i] > 0) {
            localStorage.setItem(`stats-${date}`, JSON.stringify({ completed: testData[i], breaks: 0, cancelled: 0 }));
          }
        });
      }, { dates, testData });

      await page.reload();

      // 驗證今天（最右邊）的長條有對應的 data-value
      const todayBar = page.getByTestId('chart-bar-6');
      await expect(todayBar).toHaveAttribute('data-value', '5');
    });

    // 長條圖應有標題讓用戶了解圖表用途
    test('should display chart title', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByTestId('chart-title')).toHaveText('Weekly Completed');
    });

    // 每個長條下方應顯示星期幾的標籤
    test('should display weekday labels under each bar', async ({ page }) => {
      await page.goto('/');

      const labels = page.locator('[data-testid="weekly-chart"] [data-testid^="chart-label-"]');
      await expect(labels).toHaveCount(7);

      // 驗證今天（最右邊）的標籤是正確的星期
      const today = new Date();
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const todayLabel = weekdays[today.getDay()];
      await expect(page.getByTestId('chart-label-6')).toHaveText(todayLabel);
    });

    // 長條高度應按比例顯示，最高的長條應有最大高度
    test('should scale bar heights proportionally', async ({ page }) => {
      const today = new Date();
      const dates: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        dates.push(toLocalDateString(d));
      }

      await page.goto('/');
      // 設定：第 3 天 (index 2) 完成 10 次（最多），今天完成 5 次
      await page.evaluate(({ dates }) => {
        localStorage.setItem(`stats-${dates[2]}`, JSON.stringify({ completed: 10, breaks: 0, cancelled: 0 }));
        localStorage.setItem(`stats-${dates[6]}`, JSON.stringify({ completed: 5, breaks: 0, cancelled: 0 }));
      }, { dates });

      await page.reload();

      // 最高的長條 (10 次) 應該有 100px 高度
      const maxBar = page.getByTestId('chart-bar-2');
      const maxBarHeight = await maxBar.evaluate(el => el.style.height);
      expect(maxBarHeight).toBe('100px');

      // 今天的長條 (5 次) 應該是最高的一半 = 50px
      const todayBar = page.getByTestId('chart-bar-6');
      const todayBarHeight = await todayBar.evaluate(el => el.style.height);
      expect(todayBarHeight).toBe('50px');
    });

    // 工作完成時圖表應即時更新，無需重新載入頁面
    test('should update chart immediately when work session completes', async ({ page }) => {
      await page.goto('/?testMode=true');

      // 初始狀態：今天的長條 data-value 應為 0
      const todayBar = page.getByTestId('chart-bar-6');
      await expect(todayBar).toHaveAttribute('data-value', '0');

      // 完成一個工作週期
      await page.getByTestId('start-button').click();
      await page.waitForTimeout(1500);

      // 圖表應即時更新為 1
      await expect(todayBar).toHaveAttribute('data-value', '1');
    });
  });
});

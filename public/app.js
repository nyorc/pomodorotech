document.addEventListener('DOMContentLoaded', () => {
  // testMode 讓 E2E 測試能在數秒內完成完整流程，避免等待 25 分鐘
  const isTestMode = new URLSearchParams(window.location.search).has('testMode');

  // 在頁面載入時請求權限，因為計時結束時用戶可能不在螢幕前，
  // 若等到那時才請求會錯過通知且打斷用戶體驗
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  const POMODORO_DURATION = isTestMode ? 2 : 25 * 60;
  const SHORT_BREAK_DURATION = isTestMode ? 2 : 5 * 60;
  const LONG_BREAK_DURATION = isTestMode ? 2 : 15 * 60;
  // Pomodoro Technique 標準規則：每 4 個工作週期後進入長休息
  const POMODOROS_UNTIL_LONG_BREAK = 4;

  const startButton = document.querySelector('[data-testid="start-button"]');
  const cancelButton = document.querySelector('[data-testid="cancel-button"]');
  const timerDisplay = document.querySelector('[data-testid="timer-display"]');
  const phaseDisplay = document.querySelector('[data-testid="phase-display"]');
  const completedCountDisplay = document.querySelector('[data-testid="completed-count"]');
  const cancelledCountDisplay = document.querySelector('[data-testid="cancelled-count"]');
  const statsDateDisplay = document.querySelector('[data-testid="stats-date"]');
  const prevDayButton = document.querySelector('[data-testid="prev-day-button"]');
  const nextDayButton = document.querySelector('[data-testid="next-day-button"]');

  let remainingSeconds = POMODORO_DURATION;
  let timerId = null;
  let currentPhase = 'work';
  let viewingDate = new Date().toISOString().split('T')[0];
  let completedCount = 0;
  let cancelledCount = 0;

  function updateNavButtons() {
    const today = new Date().toISOString().split('T')[0];
    nextDayButton.disabled = viewingDate >= today;
  }

  function loadStatsForDate(dateStr) {
    const stats = JSON.parse(localStorage.getItem(`stats-${dateStr}`)) || { completed: 0, cancelled: 0 };
    completedCount = stats.completed;
    cancelledCount = stats.cancelled;
    completedCountDisplay.textContent = completedCount;
    cancelledCountDisplay.textContent = cancelledCount;
    statsDateDisplay.textContent = dateStr;
    updateNavButtons();
  }

  loadStatsForDate(viewingDate);

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  function updateDisplay() {
    timerDisplay.textContent = formatTime(remainingSeconds);
  }

  function saveDailyStat(type, recordType) {
    const todayDate = new Date().toISOString().split('T')[0];
    const statsKey = `stats-${todayDate}`;
    const stats = JSON.parse(localStorage.getItem(statsKey)) || { completed: 0, cancelled: 0, records: [] };
    stats[type]++;
    if (!stats.records) stats.records = [];
    stats.records.push({ type: recordType, timestamp: new Date().toISOString() });
    localStorage.setItem(statsKey, JSON.stringify(stats));
  }

  function navigateDate(offset) {
    const date = new Date(viewingDate);
    date.setDate(date.getDate() + offset);
    viewingDate = date.toISOString().split('T')[0];
    loadStatsForDate(viewingDate);
  }

  function playNotificationSound() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.value = 1800;
    oscillator.type = 'square';
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.05);
  }

  prevDayButton.addEventListener('click', () => navigateDate(-1));
  nextDayButton.addEventListener('click', () => navigateDate(1));

  startButton.addEventListener('click', () => {
    cancelButton.classList.remove('hidden');
    startButton.classList.add('hidden');

    timerId = setInterval(() => {
      remainingSeconds--;
      updateDisplay();
      if (remainingSeconds <= 0) {
        clearInterval(timerId);
        timerId = null;
        let notificationMessage = '';
        if (currentPhase === 'work') {
          notificationMessage = 'Work session completed! Time for a break.';
          completedCount++;
          completedCountDisplay.textContent = completedCount;
          saveDailyStat('completed', 'work');
          if (completedCount % POMODOROS_UNTIL_LONG_BREAK === 0) {
            currentPhase = 'longBreak';
            phaseDisplay.textContent = 'Long Break';
            remainingSeconds = LONG_BREAK_DURATION;
          } else {
            currentPhase = 'shortBreak';
            phaseDisplay.textContent = 'Short Break';
            remainingSeconds = SHORT_BREAK_DURATION;
          }
        } else if (currentPhase === 'shortBreak' || currentPhase === 'longBreak') {
          notificationMessage = 'Break is over! Time to work.';
          saveDailyStat('completed', currentPhase);
          currentPhase = 'work';
          phaseDisplay.textContent = 'Work';
          remainingSeconds = POMODORO_DURATION;
        }
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('PomodoroTech', { body: notificationMessage });
        }
        playNotificationSound();
        updateDisplay();
        startButton.classList.remove('hidden');
        cancelButton.classList.add('hidden');
      }
    }, 1000);
  });

  cancelButton.addEventListener('click', () => {
    clearInterval(timerId);
    remainingSeconds = POMODORO_DURATION;
    updateDisplay();
    cancelledCount++;
    cancelledCountDisplay.textContent = cancelledCount;
    saveDailyStat('cancelled', 'cancelled');
    startButton.classList.remove('hidden');
    cancelButton.classList.add('hidden');
  });
});

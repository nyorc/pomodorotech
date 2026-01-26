document.addEventListener('DOMContentLoaded', () => {
  // testMode 讓 E2E 測試能在數秒內完成完整流程，避免等待 25 分鐘
  const isTestMode = new URLSearchParams(window.location.search).has('testMode');

  // 在頁面載入時請求權限，因為計時結束時用戶可能不在螢幕前，
  // 若等到那時才請求會錯過通知且打斷用戶體驗
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  const POMODORO_DURATION = isTestMode ? 1 : 25 * 60;
  const SHORT_BREAK_DURATION = isTestMode ? 1 : 5 * 60;
  const LONG_BREAK_DURATION = isTestMode ? 1 : 15 * 60;
  // Pomodoro Technique 標準規則：每 4 個工作週期後進入長休息
  const POMODOROS_UNTIL_LONG_BREAK = 4;

  function toDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const startButton = document.querySelector('[data-testid="start-button"]');
  const cancelButton = document.querySelector('[data-testid="cancel-button"]');
  const timerDisplay = document.querySelector('[data-testid="timer-display"]');
  const timerSection = document.querySelector('.timer-section');
  const phaseDisplay = document.querySelector('[data-testid="phase-display"]');
  const completedCountDisplay = document.querySelector('[data-testid="completed-count"]');
  const breaksCountDisplay = document.querySelector('[data-testid="breaks-count"]');
  const cancelledCountDisplay = document.querySelector('[data-testid="cancelled-count"]');
  const statsDateDisplay = document.querySelector('[data-testid="stats-date"]');
  const prevDayButton = document.querySelector('[data-testid="prev-day-button"]');
  const nextDayButton = document.querySelector('[data-testid="next-day-button"]');

  let remainingSeconds = POMODORO_DURATION;
  let timerId = null;
  let currentPhase = 'work';
  let viewingDate = toDateString(new Date());
  let completedCount = 0;
  let breaksCount = 0;
  let cancelledCount = 0;

  function updateNavButtons() {
    const today = toDateString(new Date());
    nextDayButton.disabled = viewingDate >= today;
  }

  function calculateStatsFromRecords(records) {
    return {
      completed: records.filter(r => r.type === 'work').length,
      breaks: records.filter(r => r.type === 'shortBreak' || r.type === 'longBreak').length,
      cancelled: records.filter(r => r.type === 'cancelled').length
    };
  }

  function loadStatsForDate(dateStr) {
    const stats = JSON.parse(localStorage.getItem(`stats-${dateStr}`)) || { completed: 0, breaks: 0, cancelled: 0, records: [] };
    // 優先從 records 陣列計算統計值，確保資料一致性
    if (stats.records && stats.records.length > 0) {
      const calculated = calculateStatsFromRecords(stats.records);
      completedCount = calculated.completed;
      breaksCount = calculated.breaks;
      cancelledCount = calculated.cancelled;
    } else {
      completedCount = stats.completed || 0;
      breaksCount = stats.breaks || 0;
      cancelledCount = stats.cancelled || 0;
    }
    completedCountDisplay.textContent = completedCount;
    breaksCountDisplay.textContent = breaksCount;
    cancelledCountDisplay.textContent = cancelledCount;
    statsDateDisplay.textContent = dateStr;
    updateNavButtons();
  }

  loadStatsForDate(viewingDate);

  function updateWeeklyChart() {
    const today = new Date();
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = [];
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const dateStr = toDateString(d);
      const stats = JSON.parse(localStorage.getItem(`stats-${dateStr}`)) || { completed: 0 };
      counts.push(stats.completed);
      days.push(weekdays[d.getDay()]);
    }
    const maxCount = Math.max(...counts, 1);
    const maxHeight = 100;
    for (let i = 0; i < 7; i++) {
      const bar = document.querySelector(`[data-testid="chart-bar-${i}"]`);
      const label = document.querySelector(`[data-testid="chart-label-${i}"]`);
      const isToday = i === 6;
      if (bar) {
        bar.setAttribute('data-value', counts[i].toString());
        bar.setAttribute('data-today', isToday.toString());
        const height = Math.round((counts[i] / maxCount) * maxHeight);
        bar.style.height = height > 0 ? `${height}px` : '4px';
      }
      if (label) {
        label.textContent = days[i];
        label.setAttribute('data-today', isToday.toString());
      }
    }
  }

  updateWeeklyChart();

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  function updateDisplay() {
    timerDisplay.textContent = formatTime(remainingSeconds);
  }

  function saveDailyStat(type, recordType) {
    const todayDate = toDateString(new Date());
    const statsKey = `stats-${todayDate}`;
    const stats = JSON.parse(localStorage.getItem(statsKey)) || { completed: 0, breaks: 0, cancelled: 0, records: [] };
    stats[type]++;
    if (!stats.records) stats.records = [];
    stats.records.push({ type: recordType, timestamp: new Date().toISOString() });
    localStorage.setItem(statsKey, JSON.stringify(stats));
  }

  function navigateDate(offset) {
    const date = new Date(viewingDate);
    date.setDate(date.getDate() + offset);
    viewingDate = toDateString(date);
    loadStatsForDate(viewingDate);
  }

  function setTimerRunning(isRunning) {
    startButton.classList.toggle('hidden', isRunning);
    cancelButton.classList.toggle('hidden', !isRunning);
  }

  function updatePhaseDisplay(phase) {
    const phaseNames = { work: 'Work', shortBreak: 'Short Break', longBreak: 'Long Break' };
    phaseDisplay.textContent = phaseNames[phase];
    timerSection.setAttribute('data-phase', phase);
  }

  function notifyUser(message) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('PomodoroTech', { body: message });
    }
    playNotificationSound();
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
    setTimerRunning(true);

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
          updateWeeklyChart();
          if (completedCount % POMODOROS_UNTIL_LONG_BREAK === 0) {
            currentPhase = 'longBreak';
            remainingSeconds = LONG_BREAK_DURATION;
          } else {
            currentPhase = 'shortBreak';
            remainingSeconds = SHORT_BREAK_DURATION;
          }
          updatePhaseDisplay(currentPhase);
        } else if (currentPhase === 'shortBreak' || currentPhase === 'longBreak') {
          notificationMessage = 'Break is over! Time to work.';
          breaksCount++;
          breaksCountDisplay.textContent = breaksCount;
          saveDailyStat('breaks', currentPhase);
          currentPhase = 'work';
          remainingSeconds = POMODORO_DURATION;
          updatePhaseDisplay(currentPhase);
        }
        notifyUser(notificationMessage);
        updateDisplay();
        setTimerRunning(false);
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
    setTimerRunning(false);
  });
});

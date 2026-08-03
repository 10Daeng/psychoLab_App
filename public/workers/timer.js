let timerInterval;
let remainingSeconds = 0;

self.onmessage = function(e) {
  const { command, seconds } = e.data;

  if (command === 'START') {
    remainingSeconds = seconds;
    clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
      remainingSeconds--;
      self.postMessage({ type: 'TICK', remainingSeconds });
      
      if (remainingSeconds <= 0) {
        clearInterval(timerInterval);
        self.postMessage({ type: 'TIMEOUT' });
      }
    }, 1000);
  } else if (command === 'START_COUNTUP') {
    remainingSeconds = 0;
    clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
      remainingSeconds++;
      self.postMessage({ type: 'TICK', elapsedSeconds: remainingSeconds, remainingSeconds });
    }, 1000);
  } else if (command === 'STOP') {
    clearInterval(timerInterval);
  } else if (command === 'GET_TIME') {
    self.postMessage({ type: 'TICK', remainingSeconds, elapsedSeconds: remainingSeconds });
  }
};

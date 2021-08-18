let activeTimeout;

function timeout(ms) {
  return new Promise(resolve => {
    activeTimeout = setTimeout(resolve, ms)
  });
}

function clearActiveTimeout() {
  clearTimeout(activeTimeout);
}

module.exports = {
  timeout, clearActiveTimeout
}
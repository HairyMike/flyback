// malfromed-tape.json parse error message is expected,
// so dont pollute test logs
const logError = console.error;

console.error = (message: Object) => {
  if (!message.toString().match(/(malformed-tape.json)/)) {
    logError(message);
  }
};

// uncomment when debugging
// jest.setTimeout(1000000);

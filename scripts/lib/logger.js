const DIVIDER = '━'.repeat(50);

function header(scriptName) {
  console.log('');
  console.log(DIVIDER);
  console.log(`  flick-app dev / ${scriptName}`);
  console.log(DIVIDER);
}

function session(userId, name, gender, festivalId) {
  console.log(`  User      : ${name} (${gender}) — ${userId}`);
  console.log(`  Festival  : ${festivalId}`);
  console.log('');
}

function step(msg) {
  console.log(`  ${msg}`);
}

function success(msg) {
  console.log(`  ✓ ${msg}`);
}

function error(msg) {
  console.log('');
  console.log(`  ERROR: ${msg}`);
  console.log('');
}

function footer(msg) {
  console.log('');
  if (msg) console.log(`  ${msg}`);
  console.log(DIVIDER);
  console.log('');
}

module.exports = { header, session, step, success, error, footer };

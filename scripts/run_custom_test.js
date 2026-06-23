const { execSync } = require('child_process');
try {
  execSync('yarn test', { stdio: 'inherit' });
} catch (e) {
  console.log("Error occurred.");
}

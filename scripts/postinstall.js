const execSync = require('child_process').execSync

const exec = (cmd, env) =>
  execSync(cmd, {
    stdio: 'inherit',
    env: Object.assign({}, process.env, env)
  })

if (process.env.CI) {
  exec('lerna bootstrap --stream --ignore react-router-website --hoist --nohoist react-native --nohoist react-test-renderer')
} else {
  exec('lerna bootstrap  --stream --hoist --nohoist react-native --nohoist react-test-renderer')
}

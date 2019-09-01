// 存放用户需要的常量
const { version } = require('../package.json');

// 存储模板的位置
const downloadDirectory = process.env[
  process.platform === 'darwin'
    ? 'HOME'
    : 'USERPROFILE'
];

module.exports = {
  downloadDirectory,
  version,
};

// 1) 要解析用户的参数
const program = require('commander');
const path = require('path');
const { version } = require('./constant');
// npm link 可以把bin字段关联到全局 调试

// npm i eslint
// npx eslint --init 初始化
const mapActions = {
  create: {
    alias: 'c',
    description: 'create a project',
    examples: [
      'ssh-cli create <projectName>',
    ],
  },
  config: {
    alias: 'conf',
    description: 'config project variable',
    examples: [
      'ssh-cli config set <key> <value>',
      'ssh-cli config get <key>',
    ],
  },
  '*': {
    alias: '',
    description: 'command not found',
    examples: [],
  },
};

Reflect.ownKeys(mapActions).forEach((action) => {
  program
    .command(action) // 配置名字
    .alias(mapActions[action].alias) // 配置别名
    .description(mapActions[action].desciption) // 配置描述
    .action(() => {
      if (action === '*') {
        console.log(mapActions[action].description);
      } else {
        // ssh-cli create <projectName>
        require(path.resolve(__dirname, action))(...process.argv.slice(3));
      }
    });
});

// 监听用户的help
program.on('--help', () => {
  Reflect.ownKeys(mapActions).forEach((action) => {
    mapActions[action].examples.forEach((example) => {
      console.log(example);
    });
  });
});

// 参数会存在进程
// 解析用户传递的参数
program.version(version).parse(process.argv);

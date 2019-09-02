// create的所有逻辑

// create功能是创建项目
// 拉取你自己的项目 列出来 让用户选安装哪一项 projectName
// 选完后 显示所有的版本号

// https://api.github.com/orgs/zhu-cli/repos 获取用户/组织下的仓库
// 可能还需要用户配置一些数据 来结合初始化项目

const axios = require('axios');
const ora = require('ora');
const fs = require('fs');
const chalk = require('chalk');
const Inquirer = require('inquirer');
const { promisify } = require('util');
const path = require('path');
// 遍历文件夹 找需不需要模板渲染
const MetalSmith = require('metalsmith');
// consolidate 统一了所有的模板引擎
let { render } = require('consolidate').ejs;
let ncp = require('ncp');
let downloadGitRepo = require('download-git-repo');
const { downloadDirectory } = require('./constant');

downloadGitRepo = promisify(downloadGitRepo);
ncp = promisify(ncp);
render = promisify(render);

const waitLoading = (fn, message) => async (...args) => {
  const spinner = ora(message);
  spinner.start();
  const result = await fn(...args);
  spinner.succeed();
  return result;
};

// 1) 获取项目的所有模板
const fetchRepoList = async () => {
  const { data } = await axios.get('https://api.github.com/orgs/zhu-cli/repos');
  return data;
};

const fetchTagList = async (repo) => {
  const { data } = await axios.get(`https://api.github.com/repos/zhu-cli/${repo}/tags`);
  return data;
};

const download = async (repo, tag) => {
  let api = `zhu-cli/${repo}`;
  if (tag) {
    api += `#${tag}`;
  }

  const dest = `${downloadDirectory}/${repo}`;
  await downloadGitRepo(api, dest);
  return dest; // 下载的目录
};

const chalkSuccess = (text) => console.log(chalk.green(text));

const chalkError = (text) => console.log(chalk.red(text));

module.exports = async (projectName) => {
  // 1) 获取项目的所有模板
  const repos = await waitLoading(fetchRepoList, '正在获取模板中 请稍后 ...')();

  // 获取之前 显示loading
  // 选择模板
  const { repo } = await Inquirer.prompt({
    name: 'repo', // 获取选择后的结果
    type: 'list',
    message: '请选择一个模板来创建项目',
    choices: repos,
  });

  let tags = await waitLoading(fetchTagList, '正在获取版本号 ...')(repo);
  tags = tags.map(({ name }) => name);

  const { tag } = await Inquirer.prompt({
    name: 'tag', // 获取选择后的结果
    type: 'list',
    message: '请选择一个版本',
    choices: tags,
  });

  // 利用download-git-repo
  // 下载模板 把模板放到一个临时目录里 存好 以备后续使用、
  const resultDirectory = await waitLoading(download, '正在下载模板')(repo, tag);

  // 下载下来 如果有ask文件 就是个复杂的模板 需要用户选择 然后编译模板
  if (!fs.existsSync(path.join(resultDirectory, 'ask.js'))) {
    // 利用ncp复制下载好的模板到当前目录 利用传入的项目名创建文件夹
    await ncp(resultDirectory, path.resolve(projectName));
    chalkSuccess(`创建项目成功 请执行\n cd ${projectName}`);
  } else {
    await new Promise((resolve, reject) => {
      // metalsmith 只要是模板编译 都需要
      MetalSmith(__dirname) // 如果你传入路径 默认会遍历当前路径下的src文件夹
        .source(resultDirectory)
      // 拷贝到用户指定的目录下
        .destination(path.resolve(projectName))
        .use(async (files, metal, done) => {
          const asks = require(path.join(resultDirectory, 'ask.js'));
          // 1) 用户填写信息
          const userSelected = await Inquirer.prompt(asks);
          const meta = metal.metadata();
          // 填写的信息拷贝到meta里去
          Object.assign(meta, userSelected);
          delete files['ask.js'];
          done();
        })
        .use((files, metal, done) => {
          // 2) 利用填写的信息渲染模板
          const metaData = metal.metadata();
          Reflect.ownKeys(files).forEach(async (fileName) => {
            // 处理 带<%的文件
            if (fileName.includes('js') || fileName.includes('json')) {
              let content = files[fileName].contents.toString();
              console.log('content: ', content);
              if (content.includes('<%')) {
                // 渲染content结果
                content = await render(content, metaData);
                files[fileName].contents = Buffer.from(content);
              }
            }
          });
          done();
        })
        .build((err) => {
          if (err) {
            chalkError(err);
            reject();
          } else {
            chalkSuccess(`创建项目成功 请执行 cd ${projectName}`);
            resolve();
          }
        });
    });
  }
};

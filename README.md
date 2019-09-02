```
// 安装eslint
npm i eslint
npx eslint --init 初始化

// 切换淘宝源
nrm use taobao

// 切换npm源
nrm use npm

// 调试
npm link
ssh-cli create project
```


## 为什么可以在命令行使用
package.json里写了`bin`，把ssh-cli这个命令指向www文件
```
  "bin": {
    "ssh-cli": "./bin/www"
  },
```

bin/www 指定用node去运行src/main下面的内容
```
#! /usr/bin/env node
require('../src/main')
```

在项目下执行`npm link`，把命令挂载到全局使用  


## 使用的第三方包

- `ora` 命令行显示loading提示。
- `chalk` 命令行打印出带颜色的文字
- `Inquirer` 命令行用户输入交互
- `MetalSmith` 遍历整个项目的文件，完成改动渲染。
- `consolidate` 集成了所有的模板引擎工具
- `ncp` 拷贝文件夹
- `download-git-repo` 下载git上的项目

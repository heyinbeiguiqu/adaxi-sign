# Adaxi 签到助手

基于 [adaxi.net](https://adaxi.net) 接口的自动签到工具，提供 Web 面板、Windows 批处理脚本与命令行三种使用方式。

## 注册 Adaxi

还没有 Adaxi 账号？欢迎通过我的[邀请链接](https://adaxi.net/?r=196324)注册。

## 项目背景

每次进入 adaxi 官网，几乎都需要重新登录，再手动完成验证码签到、查看流量与订阅链接，整体流程较为繁琐、耗时较长。

因此编写本项目，将登录、签到、信息查询串联起来，实现**一键签到**与**关键信息快速获取**（剩余流量、已用流量、订阅链接等），减少重复操作。

## 功能

- 自动登录并获取用户信息
- 一键签到（自动获取验证码并识别）
- 验证码识别失败时**自动重试**，最多重试 5 次
- 展示套餐名称、剩余流量、已使用流量
- 生成订阅链接（`https://adaxi.net/sub?token=...`）
- Windows 下可双击 `sign.bat` 快速签到
- Web 页面支持 Toast 提示签到结果

## 项目结构

```
adaxi/
├── lib/adaxi.js      # 核心 API 逻辑（登录、验证码、签到、用户信息）
├── server.js         # Express 本地服务
├── sign.bat          # Windows 一键签到脚本
├── public/           # Web 前端页面
├── eng.traineddata   # OCR 本地语言包
├── .env.example      # 环境变量模板
└── package.json
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制模板并填写你自己的账号信息：

```bash
# Linux / macOS
cp .env.example .env

# Windows
copy .env.example .env
```

`.env` 配置项说明：

| 变量 | 说明 |
|------|------|
| `PORT` | 本地 Web 服务端口，默认 `8080` |
| `ADAXI_USERNAME` | adaxi.net 登录用户名 |
| `ADAXI_PASSWORD` | adaxi.net 登录密码 |

> `.env` 已加入 `.gitignore`，请勿将真实账号信息提交到仓库。

### 3. Windows 一键签到（推荐）

完成上述配置后，**双击项目根目录下的 `sign.bat`** 即可执行签到。

脚本会自动检查 Node.js 与 `.env`，并在控制台输出验证码识别结果、签到状态、剩余流量、已用流量及订阅链接。

### 4. 启动 Web 面板

```bash
npm start
```

浏览器访问 [http://localhost:8080](http://localhost:8080)。

若 8080 端口被占用，服务会自动尝试 8081、8082 等端口，也可在 `.env` 中修改 `PORT`。

### 5. 命令行签到（可选）

```bash
npm run sign
```

## 注意事项

签到流程会自动获取图片验证码，并通过 Tesseract.js OCR 识别字符。由于 OCR 并非 100% 准确，**存在一定识别失败率**。

当签到返回 **「验证码错误」** 时，程序会**自动重新获取验证码并再次签到**，最多重试 5 次；若仍然失败，会直接返回最后一次签到结果。

以下情况**不会**自动重试，会直接返回结果：

- 今日已签到（如「今日已签到，每日八点重置」）
- 登录失效（401）
- 网络超时或其他异常

如果提示网络相关的问题，请尝试开启 Clash Verge 的虚拟网卡模式，然后重新执行脚本。

Web 面板、`sign.bat`、`npm run sign` 均使用同一套自动重试逻辑。签到过程中控制台会输出每次重试的识别结果。

## API 说明

本地服务提供以下接口：

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/user` | 获取用户信息 |
| `POST` | `/api/sign` | 执行签到，可选 body：`{ "captchaText": "验证码" }` |

## 技术栈

- Node.js
- Express
- Tesseract.js（验证码 OCR 识别）
- dotenv（环境变量管理）

## 免责声明

本项目仅供个人学习与交流使用，与 adaxi.net 官方无关。请遵守目标网站的服务条款，合理使用。

# Adaxi 签到助手

基于 [adaxi.net](https://adaxi.net) 接口的自动签到工具，提供 Web 面板与命令行两种使用方式。

## 项目背景

每次进入 adaxi 官网，几乎都需要重新登录，再手动完成验证码签到、查看流量与订阅链接，整体流程较为繁琐、耗时较长。

因此编写本项目，将登录、签到、信息查询串联起来，实现**一键签到**与**关键信息快速获取**（剩余流量、已用流量、订阅链接等），减少重复操作。

## 功能

- 自动登录并获取用户信息
- 一键签到（自动获取验证码并识别）
- 展示套餐名称、剩余流量、已使用流量
- 生成订阅链接（`https://adaxi.net/sub?token=...`）
- Web 页面支持 Toast 提示签到结果

## 项目结构

```
adaxi/
├── lib/adaxi.js      # 核心 API 逻辑（登录、验证码、签到、用户信息）
├── server.js         # Express 本地服务
├── public/           # Web 前端页面
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
cp .env.example .env
```

`.env` 配置项说明：

| 变量 | 说明 |
|------|------|
| `PORT` | 本地 Web 服务端口，默认 `8080` |
| `ADAXI_USERNAME` | adaxi.net 登录用户名 |
| `ADAXI_PASSWORD` | adaxi.net 登录密码 |

> `.env` 已加入 `.gitignore`，请勿将真实账号信息提交到仓库。

## 注意事项

签到流程会自动获取图片验证码，并通过 Tesseract.js OCR 识别字符。由于 OCR 并非 100% 准确，**存在一定识别失败率**。

若签到失败并提示「验证码错误」，通常不是账号或接口问题，而是 OCR 识别偏差。此时**多点击几次「立即签到」按钮**即可，每次都会重新拉取验证码并再次识别。

命令行方式同理，可重复执行 `npm run sign` 重试。

### 3. 启动 Web 面板

```bash
npm start
```

浏览器访问 [http://localhost:8080](http://localhost:8080)。

若 8080 端口被占用，服务会自动尝试 8081、8082 等端口，也可在 `.env` 中修改 `PORT`。

### 4. 命令行签到（可选）

```bash
npm run sign
```

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

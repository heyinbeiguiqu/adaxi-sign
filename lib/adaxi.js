require("dotenv").config({
  path: require("node:path").join(__dirname, "..", ".env"),
});

const https = require("node:https");
const tesseract = require("tesseract.js");

const HOST = "adaxi.net";
const BASE_URL = `https://${HOST}`;
const username = process.env.ADAXI_USERNAME || "";
const password = process.env.ADAXI_PASSWORD || "";

function request({ method = "GET", path: reqPath, headers = {}, body }) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const req = https.request(
      {
        hostname: HOST,
        method,
        path: reqPath,
        headers: {
          ...headers,
          ...(payload
            ? {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload),
              }
            : {}),
        },
      },
      (res) => {
        let responseBody = "";

        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          responseBody += chunk;
        });

        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseBody,
          });
        });
      },
    );

    req.on("error", reject);
    if (payload) {
      req.write(payload);
    }

    req.end();
  });
}

function buildCookie({ token, cookie }) {
  return [cookie, token ? `token=${token}` : ""].filter(Boolean).join("; ");
}

function mergeCookie(oldCookie, setCookie) {
  const jar = {};

  String(oldCookie || "")
    .split("; ")
    .filter(Boolean)
    .forEach((part) => {
      const index = part.indexOf("=");
      if (index > 0) {
        jar[part.slice(0, index)] = part.slice(index + 1);
      }
    });

  (setCookie || []).forEach((item) => {
    const part = item.split(";")[0];
    const index = part.indexOf("=");
    if (index > 0) {
      jar[part.slice(0, index)] = part.slice(index + 1);
    }
  });

  return Object.entries(jar)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
}

function browserHeaders({ token, cookie }) {
  const requestCookie = buildCookie({ token, cookie });

  return {
    ...(requestCookie ? { Cookie: requestCookie } : {}),
  };
}

function apiHeaders({ token, cookie }) {
  const requestCookie = buildCookie({ token, cookie });

  return {
    Authorization: `Bearer ${token}`,
    accept: "*/*",
    referer: "https://adaxi.net/dashboard",
    ...(requestCookie ? { Cookie: requestCookie } : {}),
  };
}

async function login() {
  const response = await request({
    method: "POST",
    path: "/api/user/login",
    body: { username, password },
  });

  const result = JSON.parse(response.body);

  if (response.statusCode < 200 || response.statusCode >= 300 || !result.data) {
    throw new Error(`登录失败：HTTP ${response.statusCode} ${response.body}`);
  }

  return {
    token: result.data,
    cookie: response.headers["set-cookie"]
      ?.map((item) => item.split(";")[0])
      .join("; "),
  };
}

async function getCaptcha(session) {
  const random = Math.random();
  const response = await request({
    path: `/captcha?${random}`,
    headers: browserHeaders(session),
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(
      `获取验证码失败：HTTP ${response.statusCode} ${response.body}`,
    );
  }

  session.cookie = mergeCookie(session.cookie, response.headers["set-cookie"]);

  const result = JSON.parse(response.body);

  return result.img;
}

async function recognizeCaptcha(captchaBase64) {
  const base64Data = captchaBase64.replace(/^data:image\/\w+;base64,/, "");
  const imageBuffer = Buffer.from(base64Data, "base64");
  const { createWorker } = tesseract;
  const worker = await createWorker("eng");
  const result = await worker.recognize(imageBuffer);
  await worker.terminate();
  return result.data.text;
}

async function sign(session, captchaText) {
  const code = String(captchaText || "").replace(/\s/g, "");

  if (!code) {
    throw new Error("captchaText 不能为空");
  }

  const response = await request({
    method: "GET",
    path: `/api/user/sign?v=${encodeURIComponent(code)}`,
    headers: apiHeaders(session),
  });

  let result;
  try {
    result = JSON.parse(response.body);
  } catch {
    throw new Error(`签到响应解析失败：${response.body}`);
  }

  if (result.message === "401") {
    throw new Error("登录已失效，请重新登录");
  }

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(
      `签到请求失败：HTTP ${response.statusCode} ${response.body}`,
    );
  }

  return result;
}

function bytesToGB(bytes) {
  return (Number(bytes) / 1024 ** 3).toFixed(2);
}

function formatUsedTraffic(bytes) {
  const value = Number(bytes);

  if (value < 1024 ** 3) {
    return `${(value / 1024 ** 2).toFixed(2)} MB`;
  }

  return `${bytesToGB(value)} GB`;
}

function formatRemainingTraffic(bytes) {
  return `${bytesToGB(bytes)} GB`;
}

function buildSubLink(subToken) {
  return `${BASE_URL}/sub?token=${subToken}`;
}

async function getUserInfo(session) {
  const response = await request({
    method: "POST",
    path: "/api/user/info",
    headers: apiHeaders(session),
  });

  let result;
  try {
    result = JSON.parse(response.body);
  } catch {
    throw new Error(`用户信息响应解析失败：${response.body}`);
  }

  if (result.message === "401") {
    throw new Error("登录已失效，请重新登录");
  }

  if (response.statusCode < 200 || response.statusCode >= 300 || !result.data) {
    throw new Error(
      `获取用户信息失败：HTTP ${response.statusCode} ${response.body}`,
    );
  }

  return result.data;
}

function formatUserInfo(userInfo) {
  return {
    username: userInfo.username,
    planName: userInfo.plan_detail?.name || "-",
    remainingTraffic: formatRemainingTraffic(userInfo.traffic),
    usedTraffic: formatUsedTraffic(userInfo.trafficked),
    subLink: buildSubLink(userInfo.token),
    raw: userInfo,
  };
}

async function fetchUserInfo() {
  const session = await login();
  const userInfo = await getUserInfo(session);
  return formatUserInfo(userInfo);
}

async function runSign(captchaText) {
  const session = await login();
  const captchaBase64 = await getCaptcha(session);
  const code = captchaText || (await recognizeCaptcha(captchaBase64));
  const signResult = await sign(session, code);
  const userInfo = formatUserInfo(await getUserInfo(session));

  return {
    signResult,
    captchaText: String(code).replace(/\s/g, ""),
    userInfo,
  };
}

module.exports = {
  fetchUserInfo,
  runSign,
  formatUserInfo,
  formatUsedTraffic,
  formatRemainingTraffic,
  buildSubLink,
};

if (require.main === module) {
  (async () => {
    try {
      const { signResult, captchaText, userInfo } = await runSign();

      console.log(`验证码识别结果：${captchaText}`);

      if (signResult.message === "签到成功") {
        console.log(`签到成功，奖励流量：${signResult.data}`);
      } else {
        console.log(`签到失败：${signResult.message}`);
      }

      console.log(
        `当前剩余流量：${formatRemainingTraffic(userInfo.raw.traffic)}`,
      );
      console.log(`已使用流量：${formatUsedTraffic(userInfo.raw.trafficked)}`);
      console.log(`订阅链接：${buildSubLink(userInfo.raw.token)}`);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  })();
}

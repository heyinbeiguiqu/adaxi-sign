require("dotenv").config();

const express = require("express");
const path = require("node:path");
const { fetchUserInfo, runSign } = require("./lib/adaxi");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/user", async (_req, res) => {
  try {
    const userInfo = await fetchUserInfo();
    res.json({ ok: true, data: userInfo });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

app.post("/api/sign", async (req, res) => {
  try {
    const { captchaText } = req.body || {};
    const result = await runSign(captchaText);
    const { signResult, userInfo } = result;
    const success = signResult.message === "签到成功";

    res.json({
      ok: success,
      message: signResult.message,
      reward: signResult.data,
      data: userInfo,
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

function startServer(port) {
  const server = app.listen(port);

  server.on("listening", () => {
    console.log(`页面已启动：http://localhost:${port}`);
  });

  server.on("error", (error) => {
    server.close();

    if (error.code === "EADDRINUSE") {
      const nextPort = port + 1;

      if (nextPort <= 8090) {
        console.warn(`端口 ${port} 已被占用，尝试使用 ${nextPort}...`);
        startServer(nextPort);
        return;
      }

      console.error(
        "8080-8090 端口均被占用。请先关闭占用进程，或在 .env 中修改 PORT。",
      );
      process.exit(1);
    }

    console.error(error.message);
    process.exit(1);
  });
}

startServer(Number(process.env.PORT) || 8080);

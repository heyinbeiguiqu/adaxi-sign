const infoTable = document.getElementById("infoTable");
const signBtn = document.getElementById("signBtn");
const refreshBtn = document.getElementById("refreshBtn");
const toastContainer = document.getElementById("toastContainer");

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3200);
}

function renderTable(data) {
  infoTable.innerHTML = `
    <tr>
      <td>${data.username}</td>
      <td>${data.planName}</td>
      <td>${data.remainingTraffic}</td>
      <td>${data.usedTraffic}</td>
      <td><a class="sub-link" href="${data.subLink}" target="_blank" rel="noreferrer">${data.subLink}</a></td>
    </tr>
  `;
}

function renderEmpty(message) {
  infoTable.innerHTML = `<tr><td colspan="5" class="empty">${message}</td></tr>`;
}

async function loadUserInfo() {
  refreshBtn.disabled = true;
  renderEmpty("加载中...");

  try {
    const response = await fetch("/api/user");
    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.message || "获取用户信息失败");
    }

    renderTable(result.data);
  } catch (error) {
    renderEmpty(error.message);
    showToast(error.message, "error");
  } finally {
    refreshBtn.disabled = false;
  }
}

async function handleSign() {
  signBtn.disabled = true;
  signBtn.textContent = "签到中...";
  showToast("正在获取验证码并签到，请稍候...", "info");

  try {
    const response = await fetch("/api/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const result = await response.json();

    if (result.ok) {
      showToast(result.message || "签到成功", "success");
      if (result.data) {
        renderTable(result.data);
      }
    } else {
      showToast(result.message || "签到失败", "error");
      if (result.data) {
        renderTable(result.data);
      }
    }
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    signBtn.disabled = false;
    signBtn.textContent = "立即签到";
  }
}

signBtn.addEventListener("click", handleSign);
refreshBtn.addEventListener("click", loadUserInfo);
loadUserInfo();

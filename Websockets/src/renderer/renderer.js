const rlStatus = document.getElementById("rlStatus");
const wsStatus = document.getElementById("wsStatus");
const clientCount = document.getElementById("clientCount");
const logs = document.getElementById("logs");

window.bridgeApi.onStatus((status) => {
  rlStatus.textContent = status.rlStatus;
  wsStatus.textContent = status.wsStatus;
  clientCount.textContent = String(status.clientCount);

  logs.replaceChildren(
    ...status.logs.map((line) => {
      const item = document.createElement("div");
      item.className = "log-entry";
      item.textContent = line;
      return item;
    })
  );
});

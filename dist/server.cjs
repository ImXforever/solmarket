var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_meta = {};
import_dotenv.default.config();
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
var state = {
  balance: 1e4,
  equity: 1e4,
  goldPrice: 2585.5,
  eurusdPrice: 1.085,
  dxyPrice: 101.9,
  activePositions: [],
  history: [],
  logs: ["Pythian Engine initialized with real-time XAUUSD feed synchronization."],
  trendBias: "VOLATILE",
  volatility: 1,
  tickIntervalMs: 2e3
};
var initialGold = 2585.5;
for (let i = 0; i < 40; i++) {
  initialGold += (Math.random() - 0.5) * 4;
  state.history.push({
    time: new Date(Date.now() - (40 - i) * 2e3).toISOString(),
    price: Number(initialGold.toFixed(2)),
    rsi: Number((45 + Math.random() * 20).toFixed(1)),
    emaFast: Number((initialGold - 0.5).toFixed(2)),
    emaSlow: Number((initialGold - 1.2).toFixed(2))
  });
}
function calculateRSIAndEMAs() {
  const prices = state.history.map((h) => h.price);
  if (prices.length === 0) return { rsi: 50, emaFast: state.goldPrice, emaSlow: state.goldPrice };
  let emaFast = prices[prices.length - 1];
  let emaSlow = prices[prices.length - 1];
  if (prices.length >= 8) {
    let sum8 = prices.slice(-8).reduce((a, b) => a + b, 0);
    emaFast = Number((sum8 / 8).toFixed(2));
  }
  if (prices.length >= 21) {
    let sum21 = prices.slice(-21).reduce((a, b) => a + b, 0);
    emaSlow = Number((sum21 / 21).toFixed(2));
  }
  let changes = 0;
  for (let i = Math.max(0, prices.length - 14); i < prices.length; i++) {
    const diff = prices[i] - (prices[i - 1] || prices[i]);
    changes += diff;
  }
  const rsiVal = 50 + changes * 10;
  const rsi = Math.max(10, Math.min(90, Number(rsiVal.toFixed(1))));
  return { rsi, emaFast, emaSlow };
}
var tickerIntervalId = null;
function appendLog(message) {
  const timestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString();
  state.logs.unshift(`[${timestamp}] ${message}`);
  if (state.logs.length > 100) state.logs.pop();
}
var liveBaseGoldPrice = 2585.5;
var lastFlashedSuccessfulFetchTime = "";
async function fetchCurrentGlobalGoldRate() {
  try {
    const response = await fetch("https://data-asg.goldprice.org/dbXRates/USD", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    if (response.ok) {
      const data = await response.json();
      if (data && data.items && data.items[0] && typeof data.items[0].xauPrice === "number") {
        const rate = Number(data.items[0].xauPrice);
        if (rate > 1e3 && rate < 4e3) {
          liveBaseGoldPrice = rate;
          lastFlashedSuccessfulFetchTime = (/* @__PURE__ */ new Date()).toLocaleTimeString();
          return;
        }
      }
    }
  } catch (err) {
  }
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd");
    if (response.ok) {
      const data = await response.json();
      if (data && data["pax-gold"] && typeof data["pax-gold"].usd === "number") {
        const rate = Number(data["pax-gold"].usd);
        if (rate > 1e3 && rate < 4e3) {
          liveBaseGoldPrice = rate;
          lastFlashedSuccessfulFetchTime = (/* @__PURE__ */ new Date()).toLocaleTimeString();
        }
      }
    }
  } catch (err) {
  }
}
fetchCurrentGlobalGoldRate();
setInterval(fetchCurrentGlobalGoldRate, 15e3);
function runRealtimeTicker() {
  if (tickerIntervalId) clearInterval(tickerIntervalId);
  tickerIntervalId = setInterval(() => {
    const trackingError = liveBaseGoldPrice - state.goldPrice;
    let dGold = trackingError * 0.15 + (Math.random() - 0.5) * 0.4;
    if (state.trendBias === "BULL") dGold += 0.25;
    if (state.trendBias === "BEAR") dGold -= 0.25;
    if (state.trendBias === "STAG") dGold *= 0.1;
    dGold *= state.volatility;
    state.goldPrice = Number((state.goldPrice + dGold).toFixed(2));
    const targetDxy = 101.9 - (state.goldPrice - 2585.5) * 0.015;
    const dDXY = (targetDxy - state.dxyPrice) * 0.1 + (Math.random() - 0.5) * 0.04;
    state.dxyPrice = Number((state.dxyPrice + dDXY).toFixed(2));
    const targetEur = 1.085 + (state.goldPrice - 2585.5) * 1e-4;
    const dEUR = (targetEur - state.eurusdPrice) * 0.1 + (Math.random() - 0.5) * 1e-4;
    state.eurusdPrice = Number((state.eurusdPrice + dEUR).toFixed(4));
    if (state.goldPrice < 1e3) state.goldPrice = liveBaseGoldPrice || 2585.5;
    if (state.dxyPrice < 40) state.dxyPrice = 101.9;
    if (state.eurusdPrice < 0.1) state.eurusdPrice = 1.085;
    const indicators = calculateRSIAndEMAs();
    state.history.push({
      time: (/* @__PURE__ */ new Date()).toISOString(),
      price: state.goldPrice,
      rsi: indicators.rsi,
      emaFast: indicators.emaFast,
      emaSlow: indicators.emaSlow
    });
    if (state.history.length > 100) state.history.shift();
    let combinedPnL = 0;
    const closedPositionIds = [];
    state.activePositions = state.activePositions.map((pos) => {
      const direction = pos.action === "BUY" ? 1 : -1;
      const profit = (state.goldPrice - pos.entryPrice) * pos.lot * 100 * direction;
      const unrealizedPnL = Number(profit.toFixed(2));
      let updatedPos = { ...pos, unrealizedPnL };
      if (pos.tp && (pos.action === "BUY" && state.goldPrice >= pos.tp || pos.action === "SELL" && state.goldPrice <= pos.tp)) {
        closedPositionIds.push(pos.id);
        const settledAmount = pos.lot * 100 * direction * (pos.tp - pos.entryPrice);
        state.balance = Number((state.balance + settledAmount).toFixed(2));
        appendLog(`\u{1F680} [TP HIT] Position ${pos.action} closed at TP boundary $${pos.tp}. Profit: $${settledAmount.toFixed(2)}`);
      } else if (pos.sl && (pos.action === "BUY" && state.goldPrice <= pos.sl || pos.action === "SELL" && state.goldPrice >= pos.sl)) {
        closedPositionIds.push(pos.id);
        const settledAmount = pos.lot * 100 * direction * (pos.sl - pos.entryPrice);
        state.balance = Number((state.balance + settledAmount).toFixed(2));
        appendLog(`\u26A0\uFE0F [SL TRIGGERED] Position ${pos.action} closed at risk threshold SL $${pos.sl}. Loss: $${settledAmount.toFixed(2)}`);
      } else {
        combinedPnL += unrealizedPnL;
      }
      return updatedPos;
    }).filter((pos) => !closedPositionIds.includes(pos.id));
    state.equity = Number((state.balance + combinedPnL).toFixed(2));
  }, state.tickIntervalMs);
}
runRealtimeTicker();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "10mb" }));
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not defined. Continuing with lazy validation.");
    }
    return new import_genai.GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  };
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    if (username === "admin" && password === "ImX") {
      appendLog("User 'admin' signed in securely.");
      res.json({ success: true, token: "gqr-system-token-jwt-secure-proof", role: "ADMIN" });
    } else {
      appendLog(`Failed login attempt for user: ${username || "anonymous"}`);
      res.status(401).json({ success: false, error: "Access denied. Valid credentials required." });
    }
  });
  app.get("/api/market/state", (req, res) => {
    res.json({
      balance: state.balance,
      equity: state.equity,
      goldPrice: state.goldPrice,
      eurusdPrice: state.eurusdPrice,
      dxyPrice: state.dxyPrice,
      activePositions: state.activePositions,
      logs: state.logs,
      trendBias: state.trendBias,
      volatility: state.volatility,
      tickIntervalMs: state.tickIntervalMs,
      history: state.history.slice(-60),
      // return last hour ticks
      liveSynced: true,
      liveBaseGoldPrice,
      lastFlashedSuccessfulFetchTime
    });
  });
  app.post("/api/market/trade", (req, res) => {
    const { symbol, action, lot, tp, sl } = req.body;
    if (!action || !lot) {
      res.status(400).json({ error: "Trade action (BUY/SELL) and lot size are required bounds." });
      return;
    }
    const currentPrice = state.goldPrice;
    const positionId = `POS-${Math.floor(1e3 + Math.random() * 9e3)}`;
    const position = {
      id: positionId,
      symbol: symbol || "XAUUSD",
      action,
      entryPrice: currentPrice,
      lot: Number(lot),
      unrealizedPnL: 0,
      tp: tp ? Number(tp) : void 0,
      sl: sl ? Number(sl) : void 0
    };
    state.activePositions.push(position);
    appendLog(`\u{1F4BC} Created Server-Side Trade: ${action} ${lot} Lots of ${symbol || "Gold"} at $${currentPrice}`);
    res.json({ success: true, position });
  });
  app.post("/api/market/close", (req, res) => {
    const { id } = req.body;
    if (!id) {
      res.status(400).json({ error: "Position ID is required." });
      return;
    }
    const index = state.activePositions.findIndex((pos2) => pos2.id === id);
    if (index === -1) {
      res.status(404).json({ error: "Specified trading position not found." });
      return;
    }
    const pos = state.activePositions[index];
    const direction = pos.action === "BUY" ? 1 : -1;
    const currentPrice = state.goldPrice;
    const finalPnL = (currentPrice - pos.entryPrice) * pos.lot * 100 * direction;
    state.balance = Number((state.balance + finalPnL).toFixed(2));
    state.activePositions.splice(index, 1);
    appendLog(`\u2705 Liquidated Position ${pos.id} (${pos.action}) at $${currentPrice}. Realized: $${finalPnL.toFixed(2)}`);
    res.json({ success: true, balance: state.balance });
  });
  app.post("/api/market/reset", (req, res) => {
    state.balance = 1e4;
    state.equity = 1e4;
    state.goldPrice = 2341.6;
    state.activePositions = [];
    state.logs = ["Real-time state database reset to initial conditions."];
    appendLog("System Simulation Database rebooted.");
    res.json({ success: true });
  });
  app.post("/api/market/config", (req, res) => {
    const { trendBias, volatility, tickIntervalMs } = req.body;
    if (trendBias) {
      state.trendBias = trendBias;
      appendLog(`Admin tuned Trend Bias parameters to: ${trendBias}`);
    }
    if (volatility !== void 0) {
      state.volatility = Number(volatility);
      appendLog(`Admin set market Volatility modifier to: ${volatility}x`);
    }
    if (tickIntervalMs !== void 0) {
      state.tickIntervalMs = Math.max(500, Math.min(1e4, Number(tickIntervalMs)));
      appendLog(`Admin recalibrated ticker interval parameters to: ${state.tickIntervalMs}ms`);
      runRealtimeTicker();
    }
    res.json({ success: true, state: { trendBias: state.trendBias, volatility: state.volatility, tickIntervalMs: state.tickIntervalMs } });
  });
  app.post("/api/gemini/analyze", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(400).json({
          error: "GEMINI_API_KEY is missing. Please configure your API Credentials in Settings > Secrets."
        });
        return;
      }
      const { symbol, price, rsi, emaFast, emaSlow, rlLoss, winRate, activePositions, isBacktest, backtestStats, image, grokMode, userCustomQuestion } = req.body;
      const ai = getAiClient();
      let targetContextPrompt = "";
      if (isBacktest) {
        targetContextPrompt = `The system just executed a comprehensive Golden Horizon Historical Backtest with the following parameters & performance metrics:
- Historical Data Period: ${backtestStats?.period || "N/A"}
- Initial Capital: $${backtestStats?.initialCapital || "10,000"}
- Ending Balance/Equity: $${backtestStats?.endingBalance || "N/A"}
- Win Rate achieved by RL Network: ${backtestStats?.winRate || "N/A"}%
- Total trades parsed sequentially: ${backtestStats?.totalTrades || "N/A"}
- Max Drawdown Limit Peak: ${backtestStats?.maxDrawdown || "N/A"}%
- Profit Factor: ${backtestStats?.profitFactor || "N/A"}`;
      } else {
        targetContextPrompt = `The Reinforcement Learning agent is running live in the background. The current real-time market attributes are:
- Target symbol: ${symbol || "XAUUSD (Spot Gold)"}
- Current Market Price: $${price || "N/A"}
- Compiled Indicators: RSI is ${rsi || "N/A"}, EMA-Fast (8-period) is ${emaFast || "N/A"}, EMA-Slow (21-period) is ${emaSlow || "N/A"}
- Active positions managed by RL Agent: ${JSON.stringify(activePositions || [])}
- Synapse update status: RL Model loss is ${rlLoss || "N/A"}, historical simulated target accuracy is ${winRate || "N/A"}%`;
      }
      let prompt = "";
      if (grokMode) {
        prompt = `You are Grok, the witty, brutally honest, cybernetic trading copilot designed by xAI, inspired directly by Elon Musk's physics-first space-exploration ideals.
Act as a supercharged, high-intelligence quant and space-grade engineering leader.
You speak with absolute truth, mild constructive sarcasm, razor-sharp technical references to rocket science, simulation theory, and first-principles reasoning.

${targetContextPrompt}

Based on these statistics and any attached chart screenshots, provide an extremely witty, highly intelligent xAI Grok-styled report in 3 sections:
1. GROK'S SPACETIME INDEX (First-principles analysis of the spot price, volatility vectors, and planetary market trends. If a chart image was provided, roast or analyze its geometric qualities).
2. MULTI-PLANETARY RISKS (Is the Reinforcement Learning network acting like a genius autopilot or a runaway rocket? Breakdown of RSI/EMA convergence and DXY orbital pressure).
3. ELON'S COMMAND LINE (Brutally honest, actionable algorithmic order recommendations: take profit orbits, escape velocity stops, and physical risk hedging vectors).

Write back in premium, high-impact Grok style with custom emojis (e.g., \u{1F680}, \u{1D54F}, \u{1F9E0}, \u{1F6F0}\uFE0F, \u{1F525}). Speak like an engineering genius who is mildly amused by human markets but completely dedicated to multi-planetary capital coordination. Keep it professional yet incredibly fun, punchy, and space-bound!`;
        if (userCustomQuestion) {
          prompt += `

CRITICAL INSTRUCTION - USER INTERACTION SYNC: The user (named Kiamadmax) has asked you this specific query: "${userCustomQuestion}". Answer this beautifully, comprehensively and directly in your characteristic Elon / Grok persona! Integrate current live trading values into your response and keep it delightfully witty and inspiring.`;
        }
      } else {
        prompt = `You are the Pythian Oracle of Algorithmic Trading (styled in gold/bronze Greek mythological majesty).
Act as a premium quantitative strategist and market analyst, fusing Reinforcement Learning (RL) network data and Deep LLM heuristic parameters.

${targetContextPrompt}

Based on these statistics and any attached chart screenshots, provide an elegant, majestic Greek-Oracle styled report of 3 high-level sections:
1. THE PYTHIAN INSIGHT (Heuristic market forecast of the asset trend, inverse relation with DXY, and current indicator state. If a chart image was provided, include visual layout/geometric details observed).
2. THE TITANIC JUDGMENT (RL parameters critique: is the neural net showing high convergence/fit or is there risk of catastrophic forgetting? What does the RSI/EMA suggest for leverage risks?).
3. THE ORACLE'S COMMAND (Actionable, clear algorithmic commands: position targets, stop loss adjustments, or risk protection offsets).

Write back in majestic, concise, professional Markdown format. Keep the tone dignified, poetic yet highly structured, with professional quantitative market insights. Avoid emojis except classic Greek/market ones (e.g., \u{1F3DB}\uFE0F, \u2696\uFE0F, \u{1F9ED}, \u{1F4C8}). Do not use placeholders.`;
      }
      let contentParts = [prompt];
      if (image && typeof image === "string" && image.startsWith("data:")) {
        const parts = image.split(",");
        if (parts.length === 2) {
          const match = parts[0].match(/data:(.*?);/);
          const mimeType = match ? match[1] : "image/png";
          const base64Data = parts[1];
          contentParts.push({
            inlineData: {
              data: base64Data,
              mimeType
            }
          });
        }
      }
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contentParts
      });
      const analysisText = response.text || "The Oracle remains silent. Please refine indicators.";
      res.json({ analysis: analysisText });
    } catch (error) {
      console.error("Gemini API Error in backend:", error);
      res.status(500).json({ error: error?.message || "Internal server error conducting LLM analysis." });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Greek Oracle GQR Server is running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map

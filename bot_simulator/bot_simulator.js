"use strict";

const FLOW_PATH = "bot_flow.json";

const FALLBACK_FLOW = {
  steps: [
    {
      id: "mode",
      message: "Оберіть режим роботи",
      options: ["Діагностика", "Перевірка рецепта", "Ризик-контроль"]
    },
    {
      id: "natural_base",
      message: "Натуральна база клієнта",
      options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
    },
    {
      id: "root_level",
      message: "Поточний рівень кореня",
      options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
    },
    {
      id: "length_level",
      message: "Поточний рівень довжини",
      options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
    },
    {
      id: "target_level",
      message: "Бажаний рівень",
      options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
    },
    {
      id: "target_direction",
      message: "Бажаний напрям відтінку",
      options: ["neutral", "warm", "ash", "beige", "copper", "red"]
    },
    {
      id: "grey_percent",
      message: "Відсоток сивини",
      options: ["0", "до 30", "30-50", "50-70", "70+"]
    },
    {
      id: "length_condition",
      message: "Стан довжини",
      options: ["натуральна", "фарбована", "освітлена", "пошкоджена", "плямиста"]
    },
    {
      id: "chemical_history",
      message: "Хімічна історія",
      options: ["невідома", "фарба", "порошок", "хна/метали", "довга складна історія"]
    },
    {
      id: "final_protocol",
      message: "Фінальний протокол",
      options: []
    }
  ]
};

const FIELD_ORDER = [
  "mode",
  "natural_base",
  "root_level",
  "length_level",
  "target_level",
  "target_direction",
  "grey_percent",
  "length_condition",
  "chemical_history"
];

const IS_BROWSER = typeof document !== "undefined";

const appState = {
  flow: FALLBACK_FLOW,
  stepIndex: 0,
  answers: {},
  flowSource: "fallback",
  finalRendered: false
};

let chatLog = null;
let optionButtons = null;
let statePanel = null;
let stateDump = null;
let resetButton = null;
let toggleStateButton = null;

if (IS_BROWSER) {
  chatLog = document.getElementById("chatLog");
  optionButtons = document.getElementById("optionButtons");
  statePanel = document.getElementById("statePanel");
  stateDump = document.getElementById("stateDump");
  resetButton = document.getElementById("resetButton");
  toggleStateButton = document.getElementById("toggleStateButton");
  document.addEventListener("DOMContentLoaded", init);
}

async function init() {
  appState.flow = await loadFlow();
  appState.stepIndex = 0;
  appState.answers = {};
  appState.finalRendered = false;

  resetButton.addEventListener("click", resetSimulator);
  toggleStateButton.addEventListener("click", toggleStatePanel);

  resetSimulator();
}

async function loadFlow() {
  try {
    const response = await fetch(FLOW_PATH, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const flow = await response.json();
    appState.flowSource = "bot_flow.json";
    return normalizeFlow(flow);
  } catch (error) {
    appState.flowSource = "fallback";
    return normalizeFlow(FALLBACK_FLOW);
  }
}

function normalizeFlow(flow) {
  if (!flow || !Array.isArray(flow.steps)) {
    return FALLBACK_FLOW;
  }

  return {
    steps: flow.steps.map((step) => ({
      id: String(step.id || ""),
      message: String(step.message || ""),
      options: Array.isArray(step.options) ? step.options.map(String) : []
    }))
  };
}

function resetSimulator() {
  appState.stepIndex = 0;
  appState.answers = {};
  appState.finalRendered = false;

  chatLog.replaceChildren();
  optionButtons.replaceChildren();

  if (appState.flowSource === "fallback") {
    appendMessage(
      "system",
      "bot_flow.json не завантажено через обмеження браузера для file://. Використано вбудований fallback flow."
    );
  }

  renderCurrentStep();
  updateDebugState();
}

function renderCurrentStep() {
  const step = getCurrentStep();
  if (!step) {
    return;
  }

  if (step.id === "final_protocol") {
    renderFinalProtocol(step);
    return;
  }

  appendMessage("bot", step.message);
  renderOptionButtons(step);
}

function getCurrentStep() {
  return appState.flow.steps[appState.stepIndex];
}

function renderOptionButtons(step) {
  optionButtons.replaceChildren();

  step.options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-button";
    button.textContent = option;
    button.addEventListener("click", () => selectOption(step, option));
    optionButtons.appendChild(button);
  });
}

function selectOption(step, option) {
  appState.answers[step.id] = option;
  appendMessage("user", option);

  appState.stepIndex += 1;
  updateDebugState();
  renderCurrentStep();
}

function appendMessage(type, text) {
  const message = document.createElement("div");
  message.className = `message ${type}`;
  message.textContent = text;
  chatLog.appendChild(message);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function renderFinalProtocol(step) {
  if (appState.finalRendered) {
    return;
  }

  appState.finalRendered = true;
  optionButtons.replaceChildren();
  appendMessage("bot", step.message);

  const protocol = buildFinalProtocol(appState.answers);
  const protocolNode = buildProtocolNode(protocol);
  chatLog.appendChild(protocolNode);
  chatLog.scrollTop = chatLog.scrollHeight;
  updateDebugState(protocol);
}

function buildFinalProtocol(state) {
  const answers = state || {};
  const risks = [];
  const forbiddenActions = [];
  let status = "OK";

  function addNeedReview(risk) {
    if (status !== "BLOCKED") {
      status = "NEED_REVIEW";
    }
    risks.push(risk);
  }

  function addBlocked(risk) {
    status = "BLOCKED";
    risks.push(risk);
  }

  if (answers.chemical_history === "хна/метали") {
    addBlocked("Можлива реакція з металевими солями / хною");
    forbiddenActions.push("Не виконувати освітлення або агресивне фарбування без тест-пасма");
  }

  if (answers.chemical_history === "невідома" && answers.length_condition !== "натуральна") {
    addNeedReview("Невідома історія на ненатуральній довжині");
  }

  if (
    (answers.grey_percent === "50-70" || answers.grey_percent === "70+") &&
    answers.target_direction === "ash"
  ) {
    addNeedReview("Сивина 50%+ і холодний напрям потребують точного контролю рецепта");
  }

  if (answers.length_condition === "пошкоджена") {
    addNeedReview("Пошкоджена довжина — високий ризик нерівномірного результату");
    forbiddenActions.push("Не працювати агресивним підйомом без оцінки еластичності");
  }

  if (answers.length_condition === "плямиста") {
    addNeedReview("Плямиста база — ризик нерівномірного проявлення кольору");
    forbiddenActions.push("Не наносити єдиний рецепт на всю довжину без зонування");
  }

  const rootLevel = Number(answers.root_level);
  const lengthLevel = Number(answers.length_level);
  const targetLevel = Number(answers.target_level);

  if (Number.isFinite(rootLevel) && Number.isFinite(targetLevel) && targetLevel - rootLevel >= 2) {
    addNeedReview("Підйом на 2+ рівні потребує контролю фону освітлення");
  }

  if (
    Number.isFinite(lengthLevel) &&
    Number.isFinite(targetLevel) &&
    targetLevel > lengthLevel &&
    answers.length_condition === "пошкоджена"
  ) {
    addNeedReview("Підйом по пошкодженій довжині підвищує ризик ламкості");
  }

  const recommendedNextAction = getRecommendation(status);

  return {
    status,
    inputs: FIELD_ORDER.reduce((result, field) => {
      result[field] = answers[field] || null;
      return result;
    }, {}),
    risks,
    forbiddenActions,
    recommendedNextAction
  };
}

function getRecommendation(status) {
  if (status === "BLOCKED") {
    return "Зупинити автоматичний сценарій. Потрібна ручна оцінка майстра і тест-пасмо перед будь-якою хімічною дією.";
  }

  if (status === "NEED_REVIEW") {
    return "Перед побудовою рецепта потрібна ручна перевірка ризиків, бренду, окисника, пропорції і зонування.";
  }

  return "Можна переходити до побудови рецепта після перевірки бренду, окисника і пропорції";
}

function buildProtocolNode(protocol) {
  const wrapper = document.createElement("article");
  wrapper.classList.add("protocol", `status-${protocol.status}`);

  const title = document.createElement("h2");
  title.textContent = "Фінальний протокол";
  wrapper.appendChild(title);

  const statusLine = document.createElement("div");
  statusLine.className = "status-line";
  statusLine.textContent = `STATUS: ${protocol.status}`;
  wrapper.appendChild(statusLine);

  appendListSection(wrapper, "Зібрані вхідні дані", formatInputs(protocol.inputs));
  appendListSection(wrapper, "Ризики", protocol.risks.length ? protocol.risks : ["Ризики в межах MVP-логіки не виявлені"]);
  appendListSection(
    wrapper,
    "Заборонені дії",
    protocol.forbiddenActions.length
      ? protocol.forbiddenActions
      : ["Немає MVP-заборон за вибраними даними"]
  );
  appendListSection(wrapper, "Рекомендована наступна дія", [protocol.recommendedNextAction]);

  return wrapper;
}

function appendListSection(parent, titleText, items) {
  const title = document.createElement("h3");
  title.textContent = titleText;
  parent.appendChild(title);

  const list = document.createElement("ul");
  items.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    list.appendChild(listItem);
  });
  parent.appendChild(list);
}

function formatInputs(inputs) {
  return FIELD_ORDER.map((field) => `${field}: ${inputs[field] || "-"}`);
}

function toggleStatePanel() {
  const shouldShow = statePanel.hidden;
  statePanel.hidden = !shouldShow;
  toggleStateButton.textContent = shouldShow ? "Сховати state" : "Показати state";
  updateDebugState();
}

function updateDebugState(protocol) {
  const debugData = {
    flowSource: appState.flowSource,
    currentStep: getCurrentStep() ? getCurrentStep().id : null,
    answers: appState.answers,
    finalProtocol: protocol || null
  };

  stateDump.textContent = JSON.stringify(debugData, null, 2);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    buildFinalProtocol,
    normalizeFlow,
    FALLBACK_FLOW,
    FIELD_ORDER
  };
}

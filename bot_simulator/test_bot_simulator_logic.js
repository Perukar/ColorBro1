"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
  buildFinalProtocol
} = require("./bot_simulator.js");

const FLOW_PATH = path.join(__dirname, "bot_flow.json");
const REQUIRED_STEP_IDS = [
  "mode",
  "natural_base",
  "root_level",
  "length_level",
  "target_level",
  "target_direction",
  "grey_percent",
  "length_condition",
  "chemical_history",
  "final_protocol"
];

let total = 0;

function test(name, fn) {
  total += 1;
  try {
    fn();
    console.log(`PASS ${total}. ${name}`);
  } catch (error) {
    console.error(`FAIL ${total}. ${name}`);
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
  }
}

function protocolFrom(partialState) {
  return buildFinalProtocol(partialState);
}

function hasText(items, part) {
  return items.some((item) => String(item).toLowerCase().includes(String(part).toLowerCase()));
}

test("1) Хна/метали -> BLOCKED + risk + forbidden action", () => {
  const protocol = protocolFrom({ chemical_history: "хна/метали" });
  assert.strictEqual(protocol.status, "BLOCKED");
  assert.ok(hasText(protocol.risks, "хною") || hasText(protocol.risks, "металев"));
  assert.ok(hasText(protocol.forbiddenActions, "агресивне"));
  assert.ok(hasText(protocol.forbiddenActions, "тест-пасма"));
});

test("2) Невідома історія + ненатуральна довжина -> NEED_REVIEW", () => {
  const protocol = protocolFrom({
    chemical_history: "невідома",
    length_condition: "фарбована"
  });
  assert.strictEqual(protocol.status, "NEED_REVIEW");
  assert.ok(hasText(protocol.risks, "Невідома історія на ненатуральній довжині"));
});

test("3) Сивина 50%+ + ash -> NEED_REVIEW", () => {
  const protocol = protocolFrom({
    grey_percent: "50-70",
    target_direction: "ash"
  });
  assert.strictEqual(protocol.status, "NEED_REVIEW");
  assert.ok(hasText(protocol.risks, "Сивина 50%+"));
});

test("4) Пошкоджена довжина -> NEED_REVIEW + forbidden action", () => {
  const protocol = protocolFrom({
    length_condition: "пошкоджена"
  });
  assert.strictEqual(protocol.status, "NEED_REVIEW");
  assert.ok(hasText(protocol.risks, "Пошкоджена довжина"));
  assert.ok(hasText(protocol.forbiddenActions, "оцінки еластичності"));
});

test("5) Плямиста довжина -> NEED_REVIEW + forbidden action", () => {
  const protocol = protocolFrom({
    length_condition: "плямиста"
  });
  assert.strictEqual(protocol.status, "NEED_REVIEW");
  assert.ok(hasText(protocol.risks, "Плямиста база"));
  assert.ok(hasText(protocol.forbiddenActions, "без зонування"));
});

test("6) Підйом на 2+ рівні -> NEED_REVIEW", () => {
  const protocol = protocolFrom({
    root_level: "6",
    target_level: "8"
  });
  assert.strictEqual(protocol.status, "NEED_REVIEW");
  assert.ok(hasText(protocol.risks, "Підйом на 2+ рівні"));
});

test("7) Підйом по пошкодженій довжині -> NEED_REVIEW", () => {
  const protocol = protocolFrom({
    length_level: "7",
    target_level: "9",
    length_condition: "пошкоджена"
  });
  assert.strictEqual(protocol.status, "NEED_REVIEW");
  assert.ok(hasText(protocol.risks, "Підйом по пошкодженій довжині"));
});

test("8) Безпечний базовий сценарій -> OK", () => {
  const protocol = protocolFrom({
    mode: "Діагностика",
    natural_base: "6",
    root_level: "6",
    length_level: "6",
    target_level: "6",
    target_direction: "neutral",
    grey_percent: "0",
    length_condition: "натуральна",
    chemical_history: "фарба"
  });
  assert.strictEqual(protocol.status, "OK");
  assert.strictEqual(protocol.risks.length, 0);
  assert.ok(hasText([protocol.recommendedNextAction], "Можна переходити до побудови рецепта"));
});

test("9) BLOCKED має пріоритет над NEED_REVIEW", () => {
  const protocol = protocolFrom({
    chemical_history: "хна/метали",
    length_condition: "пошкоджена",
    target_level: "10",
    root_level: "6"
  });
  assert.strictEqual(protocol.status, "BLOCKED");
});

test("10) Перевірка flow JSON", () => {
  const raw = fs.readFileSync(FLOW_PATH, "utf8");
  const flow = JSON.parse(raw);
  assert.ok(flow && Array.isArray(flow.steps), "steps мають бути масивом");

  const ids = flow.steps.map((step) => step.id);
  REQUIRED_STEP_IDS.forEach((id) => {
    assert.ok(ids.includes(id), `Відсутній step id: ${id}`);
  });

  flow.steps.forEach((step, index) => {
    assert.ok(typeof step.message === "string" && step.message.trim().length > 0, `Порожній message у step ${step.id}`);

    if (step.id === "final_protocol") {
      return;
    }

    assert.ok(Array.isArray(step.options), `options мають бути масивом у step ${step.id}`);
    assert.ok(step.options.length > 0, `options порожні у step ${step.id}`);

    step.options.forEach((option, optionIndex) => {
      if (typeof option === "string") {
        assert.ok(option.trim().length > 0, `Порожній label у step ${step.id}, option ${optionIndex}`);
        return;
      }

      assert.ok(option && typeof option === "object", `Некоректний option у step ${step.id}`);
      const label = option.label;
      const value = option.value;
      assert.ok(typeof label === "string" && label.trim().length > 0, `Відсутній label у step ${step.id}`);
      assert.ok(
        (typeof value === "string" && value.trim().length > 0) ||
        (typeof label === "string" && label.trim().length > 0),
        `Відсутній value/label для запису в state у step ${step.id}`
      );
    });

    if (index < flow.steps.length - 1) {
      assert.ok(ids[index + 1], `Відсутня логіка переходу для step ${step.id}`);
    }
  });
});

if (!process.exitCode) {
  console.log(`PASS: ${total} тестів виконано успішно`);
}

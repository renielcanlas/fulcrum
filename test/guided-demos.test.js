import assert from "node:assert/strict";
import test from "node:test";
import guidedDemos from "../data/config/guided-demos.json" with {type: "json"};

test("guided demos are authored as view-aware, targetable definitions", () => {
  assert.ok(Array.isArray(guidedDemos));
  assert.ok(guidedDemos.length >= 2);
  const ids = guidedDemos.map((demo) => demo.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes("welcome-tour"));
  assert.ok(ids.includes("create-golden-initiative"));

  for (const demo of guidedDemos) {
    assert.equal(typeof demo.name, "string");
    assert.equal(typeof demo.description, "string");
    assert.ok(["tour", "interactive"].includes(demo.kind));
    assert.ok(demo.steps.length > 0);
    for (const [index, step] of demo.steps.entries()) {
      assert.equal(typeof step.view, "string", `${demo.id}[${index}] view`);
      assert.equal(typeof step.target, "string", `${demo.id}[${index}] target`);
      assert.equal(typeof step.title, "string", `${demo.id}[${index}] title`);
      assert.equal(typeof step.text, "string", `${demo.id}[${index}] text`);
    }
  }
});

test("golden initiative demo preserves the guarded creation checkpoints", () => {
  const demo = guidedDemos.find((item) => item.id === "create-golden-initiative");
  const targets = demo.steps.map((step) => step.target);
  assert.deepEqual(targets.slice(-3), [
    "initiative-context",
    "initiative-create",
    "initiative-confirm",
  ]);
  assert.ok(demo.steps.every((step) => step.view === "initiatives"));
  assert.ok(demo.steps.filter((step) => step.interactive).length >= 5);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { compare, valueLabel } from "./compare.ts";

test("identical ratings give 100% match", () => {
  const r = [{ place_id: "a", yum: 7, dollars: 4 }, { place_id: "b", yum: 3, dollars: 8 }];
  assert.equal(compare(r, r).matchScore, 100);
});

test("no overlap gives null score and suggests friend's places", () => {
  const c = compare([{ place_id: "a", yum: 7, dollars: 4 }], [{ place_id: "b", yum: 9, dollars: 3 }]);
  assert.equal(c.matchScore, null);
  assert.equal(c.shared.length, 0);
  assert.deepEqual(c.tryNext.map((t) => t.place_id), ["b"]);
});

test("opposite tastes score low", () => {
  const c = compare([{ place_id: "a", yum: 0, dollars: 0 }], [{ place_id: "a", yum: 10, dollars: 10 }]);
  assert.equal(c.matchScore, 0);
});

test("try-next corrects for a generous friend and ranks value", () => {
  const mine = [{ place_id: "s1", yum: 5, dollars: 5 }, { place_id: "s2", yum: 6, dollars: 5 }];
  const theirs = [
    { place_id: "s1", yum: 7, dollars: 5 },
    { place_id: "s2", yum: 8, dollars: 5 },
    { place_id: "cheap", yum: 8, dollars: 2 },
    { place_id: "fancy", yum: 8.5, dollars: 9 },
    { place_id: "meh", yum: 5, dollars: 5 },
  ];
  const c = compare(mine, theirs);
  assert.equal(c.yumBias, 1);
  assert.deepEqual(c.tryNext.map((t) => t.place_id), ["cheap", "fancy"]);
  assert.equal(c.tryNext[0].predictedYum, 7);
});

test("value labels", () => {
  assert.equal(valueLabel({ yum: 9, dollars: 3 }), "Steal");
  assert.equal(valueLabel({ yum: 5, dollars: 5 }), "Fair price");
  assert.equal(valueLabel({ yum: 2, dollars: 9 }), "Rip-off");
});

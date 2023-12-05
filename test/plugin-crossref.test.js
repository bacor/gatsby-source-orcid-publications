import { Cite } from "@citation-js/core";
import crossrefData from "./crossref.json"
import "../src/plugins/plugin-crossref.js";

test("@crossref/item", async () => {
  const items = crossrefData.message.items
  const cite = new Cite(items[0])
  expect(cite.data.length).toBe(1)
});

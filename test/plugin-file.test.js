import { Cite } from "@citation-js/core";
import "../src/plugins/plugin-file.js";
import "@citation-js/plugin-bibtex";

test("@file", async () => {
  const path = "./test/bcornelissen.bib"
  const cite = await new Cite.async(path);
  expect(cite.data.length).toBe(5)
});

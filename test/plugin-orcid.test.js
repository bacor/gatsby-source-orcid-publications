import { Cite } from "@citation-js/core";
import "@citation-js/plugin-csl";
import "../src/plugins/plugin-orcid.js";

test("@orcid/id", async () => {
  const orcidId = "0000-0002-0766-7305";
  const cite = await Cite.async(orcidId);
  expect(cite.data.length).toBe(5)
}, 10000);

// test("large publication list", async () => {
//   const hhoning = "0000-0001-7046-7923";
//   const cite = await Cite.async(hhoning);
//   expect(cite.data.length > 200).toBe(true)
// });

test("@orcid/works", async () => {
  const cite = await Cite.async({
    orcidId: "0000-0002-0766-7305",
    putCodes: [114870302, 114870772]
  });
  expect(cite.data.length).toBe(2)
});

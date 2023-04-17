import fs from "fs";
import path from "path";
import OrcidWorkCollection from "../src/work-collection.js";
import OrcidWorkSummary from "../src/work-summary.js";

const filepath = path.resolve("test/works.json");
const response = fs.readFileSync(filepath);
const EXAMPLE_DATA = JSON.parse(response);

test("fetching works data by orcid id", async () => {
  const works = await OrcidWorkCollection.load("0000-0002-0766-7305");
  expect(works).toBeInstanceOf(OrcidWorkCollection);
});

test("works example data", () => {
  const collection = new OrcidWorkCollection(EXAMPLE_DATA);
  expect(typeof collection._summaries).toEqual("object");
  const ids = [
    "doi:10.5281/zenodo.5624531",
    "doi:10.1145/3424911.3425514",
    "doi:10.5281/zenodo.4245572",
    "slug:2017_bayesian-language-games:-unifying-and-ev",
    "slug:2016_categorization-in-the-speech-to-song-tra",
  ];
  expect(collection.internalIds).toEqual(ids);
  for (const summary of collection.summaries()) {
    expect(summary).toBeInstanceOf(OrcidWorkSummary);
  }
});

import OrcidFetcher from "../src/fetcher";
import OrcidWorkCollection from "../src/work-collection";
import OrcidWorkSummary from "../src/work-summary";

test("initialize fetcher", async () => {
  const orcidIds = ["0000-0002-0766-7305"];
  const fetcher = await OrcidFetcher.load(orcidIds);
  expect(fetcher).toBeInstanceOf(OrcidFetcher);
  const collection = fetcher.collection(orcidIds[0]);
  expect(collection).toBeInstanceOf(OrcidWorkCollection);
});

test("iterate all summaries", async () => {
  const orcidIds = ["0000-0002-0766-7305"];
  const fetcher = await OrcidFetcher.load(orcidIds);
  for (const summary of fetcher.allSummaries()) {
    expect(summary).toBeInstanceOf(OrcidWorkSummary);
  }
});

test("iterate unique summaries", async () => {
  const orcidA = "0000-0001-6854-5646"; // Ashley
  const orcidB = "0000-0002-0766-7305"; // Bas
  const fetcherA = await OrcidFetcher.load([orcidA]);
  const fetcherB = await OrcidFetcher.load([orcidB]);
  const fetcherAB = await OrcidFetcher.load([orcidA, orcidB]);
  const lengthA = Object.keys(fetcherA.uniqueSummaries).length;
  const lengthB = Object.keys(fetcherB.uniqueSummaries).length;
  const lengthAB = Object.keys(fetcherAB.uniqueSummaries).length;
  expect(lengthA + lengthB).toBeGreaterThan(lengthAB);
});

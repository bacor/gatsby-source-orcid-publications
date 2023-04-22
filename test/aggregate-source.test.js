import { AggregateSource } from "../src/source-aggregate";
import { DOISource } from "../src/source-doi";
import { OrcidSource } from "../src/source-orcid";

test("aggregating sources", async () => {
  const source1 = await DOISource.load("source1", [
    "10.5281/ZENODO.5624531",
    "10.1145/3424911.3425514",
  ]);
  const source2 = await DOISource.load("source2", [
    "10.1145/3424911.3425514",
    "10.5281/ZENODO.4245572",
  ]);
  const aggregate = await AggregateSource.load("aggregrate", [
    source1,
    source2,
  ]);
  expect(aggregate.length).toBe(3);
  expect(aggregate.index(0).sources).toEqual(["source1"]);
  expect(aggregate.index(1).sources).toEqual(["source1", "source2"]);
  expect(aggregate.index(2).sources).toEqual(["source2"]);
});

test("two orcid sources", async () => {
  const orcidA = "0000-0001-6854-5646"; // Ashley
  const orcidB = "0000-0002-0766-7305"; // Bas
  const sourceA = await OrcidSource.load("ashley", orcidA);
  const sourceB = await OrcidSource.load("bas", orcidB);
  const agg = await AggregateSource.load("ashley&bas", [sourceA, sourceB]);
  expect(sourceA.length + sourceB.length).toBeGreaterThan(agg.length);
});

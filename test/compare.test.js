import {
  compareTitles,
  compareDois,
  compare,
  groupDuplicates,
} from "../src/compare.js";

test("compare refs by DOI", async () => {
  const a = { _normDoi: "10.18653/v1/N18-1108" };
  const b = { DOI: "10.18653/v1/N18-1108" };
  expect(compareDois(a, a)).toBe(true);
  expect(compareDois(a, b)).toBe(true);
  expect(compareDois(a, {})).toBeNull();
});

test("compare refs by title", () => {
  const a = {
    title: "Colorless Green Recurrent Networks Dream Hierarchically",
  };
  const diffCase = {
    title: "COLORLESS GREEN RECURRENT Networks Dream Hierarchically",
  };
  const diffLength = { title: "Colorless Green Recurrent Networks" };
  const diffSpelling = { title: "Colourless Green Recurrent Networks" };
  const otherTitle = { title: "Colourless RED Recurrent Networks" };
  expect(compareTitles(a, a)).toBe(true);
  expect(compareTitles(a, diffCase)).toBe(true);
  expect(compareTitles(a, diffLength)).toBe(true);
  expect(compareTitles(a, diffSpelling)).toBe(true);
  expect(compareTitles(a, otherTitle)).toBe(false);
  expect(compareTitles(a, {})).toBeNull();
});

test("compare using multiple tet functions", () => {
  const a = {
    _normDoi: "10.18653/v1/N18-1108",
    title: "Colorless Green Recurrent Networks",
  };
  const b = { title: "Colorless Green Recurrent Networks" };
  expect(compare(a, b, [compareDois])).toBe(false);
  expect(compare(a, b, [compareDois, compareTitles])).toBe(true);

  // Check if errors are thrown
  expect(() => {
    compare(a, b, []);
  }).toThrow();
  expect(() => {
    compare(a, b, [(x, y) => "hello"]);
  }).toThrow();
});

test("group duplicates exhaustively", () => {
  const array = [
    {
      DOI: "DOI1",
    },
    {
      DOI: "DOI1",
      title: "a rather peculiar title",
    },
    {
      title: "a rather peculiar title",
    },
    {
      title: "A very different title",
    },
  ];
  const groups = [
    ...groupDuplicates(array, {
      testFns: [compareDois, compareTitles],
      exhaustive: true,
    }),
  ];
  expect(groups.length).toBe(2);
  expect([...groups[0]]).toEqual([0, 1, 2]);
  expect([...groups[1]]).toEqual([3]);
});

test("group duplicates not exhaustively", () => {
  const array = [
    {
      DOI: "DOI1",
    },
    {
      DOI: "DOI1",
      title: "a rather peculiar title",
    },
    {
      title: "a rather peculiar title",
    },
    {
      title: "A very different title",
    },
  ];
  const groups = [
    ...groupDuplicates(array, {
      testFns: [compareDois, compareTitles],
      exhaustive: false,
    }),
  ];
  expect(groups.length).toBe(3);
  expect([...groups[0]]).toEqual([0, 1]);
  expect([...groups[1]]).toEqual([2]);
  expect([...groups[2]]).toEqual([3]);
});

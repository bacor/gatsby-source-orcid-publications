import "@citation-js/plugin-doi";
import ReferenceManager from "../src/manager.js";
import {
  compareTitles,
  compareDois,
  compare,
  groupDuplicates,
} from "../src/manager.js";

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

test("deduplicate", async () => {
  const manager = new ReferenceManager();
  const source1 = [
    {
      DOI: "DOI1",
      title: "title 1 (source 1)",
    },
    {
      DOI: "DOI2",
      title: "title 2 (from source 1)",
    },
  ];
  const source2 = [
    {
      DOI: "DOI1",
      title: "title 1 (source 2)",
    },
    {
      title: "title 2 (from source 2)",
    },
    {
      title: "A very different title",
    },
  ];
  const source3 = [
    {
      DOI: "DOI1",
      title: "title 1 (source 3)",
    },
    {
      title: "A very different title",
    },
    {
      DOI: "bla",
    },
  ];
  await manager.add({ data: source1, name: "source1" });
  await manager.add({ data: source2, name: "source2", priority: 2 });
  await manager.add({ data: source3, name: "source3", priority: 1 });

  manager.deduplicate();
  const refs = manager.cite.data;
  expect(refs.length).toBe(4);
  expect(refs[0].DOI).toBe("DOI1");
  expect(refs[0]._sources).toEqual(["source1", "source2", "source3"]);
  expect(refs[0].title).toBe("title 1 (source 2)"); // source2 has highest priority!

  expect(refs[1].title).toBe("title 2 (from source 2)");
  expect(refs[1]._sources).toEqual(["source1", "source2"]);

  expect(refs[2].title).toBe("A very different title");
  expect(refs[2]._sources).toEqual(["source2", "source3"]);

  expect(refs[3].DOI).toBe("bla");
  expect(refs[3]._sources).toEqual(["source3"]);
});

test("orcid, dois and bib", async () => {
  const manager = new ReferenceManager();
  await manager.add({
    data: "0000-0002-0766-7305",
    name: "bcornelissen",
    priority: 2,
  });
  await manager.add({ data: "10.5281/zenodo.4245572", name: "source2" });
  await manager.add({
    data: "test/bcornelissen.bib",
    name: "source3",
  });
  manager.deduplicate();
});

test("exclude field values", async () => {
  const manager = new ReferenceManager();
  await manager.add({
    data: [
      "10.31234/osf.io/qjfpe",
      "10.1177/10298649221149109",
      "10.1007/s10071-023-01763-4",
      "10.1016/j.ijpsycho.2015.02.024",
    ],
    exclude: [
      { field: "DOI", values: ["10.31234/osf.io/qjfpe"] },
      { field: "DOI", regexp: '10.1007/*' },
    ],
  });
  expect(manager.cite.data.length).toBe(2);
});

test("exclude by year", async () => {
  const manager = new ReferenceManager();
  await manager.add({
    data: [
      "10.31234/osf.io/qjfpe",
      "10.1177/10298649221149109",
      "10.1007/s10071-023-01763-4",
      "10.1016/j.ijpsycho.2015.02.024",
    ],
    exclude: [
      { after: 2020 },
    ],
  });
  expect(manager.cite.data.length).toBe(1);
});

test(
  "add orcid source",
  async () => {
    const hhoning = "0000-0001-7046-7923";
    const manager = new ReferenceManager();
    await manager.add({ data: hhoning });
    expect(manager.cite.data.length > 200).toBe(true);
  },
  1000 * 60 * 5
);

test("export in order", async () => {
  const manager = new ReferenceManager();
  await manager.add({ data: "test/bcornelissen.bib", name: "source3" });
  const items = manager.output();
  expect(items[0].order).toBe(0);
  expect(items[items.length - 1].order).toBe(items.length - 1);
});

test("customFields", async () => {
  const manager = new ReferenceManager();
  await manager.add({ data: "test/bcornelissen.bib", name: "source3" });
  const items = manager.output({
    customFields: (cite) => ({
      myCustomField: cite.format("citation", { template: "harvard1" }),
      foo: "bar",
    }),
  });
  expect(items[0]).toHaveProperty("myCustomField");
  expect(items[0]).toHaveProperty("foo");
  expect(items[0].foo).toBe("bar");
});

test("transform output", async () => {
  const manager = new ReferenceManager();
  await manager.add({ data: "test/bcornelissen.bib", name: "source3" });
  const items = manager.output({
    transform: (entry) => {
      entry.html = "bla";
      return entry;
    },
  });
  expect(items[0].html).toBe("bla");
  expect(items[1].html).toBe("bla");
});

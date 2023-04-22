import { DOISource, DOISourceItem } from "../src/source-doi";

test("doi source item initialization", async () => {
  const item = new DOISourceItem("10.5281/ZENODO.5624531");
  expect(item.id).toEqual("doi:10.5281/zenodo.5624531");
  expect(item.lastModified).toBeFalsy();
  const out = await item.export();
  expect(out.year).toEqual(2021);
  expect(out.citation).toEqual("(Cornelissen et al., 2021)");
});

test("initialize doi source", async () => {
  const source = await DOISource.load("dois", [
    "10.5281/ZENODO.5624531",
    "10.1145/3424911.3425514",
    "10.5281/ZENODO.4245572",
  ]);
  expect(source.length).toBe(3);
  expect(source.name).toBe("dois");
});

test("doi source filter", async () => {
  const source = await DOISource.load(
    "dois",
    [
      "10.5281/ZENODO.5624531",
      "10.1145/3424911.3425514",
      "10.5281/ZENODO.4245572",
    ],
    {
      filter: (item) => item.data.startsWith("10.5"),
    }
  );
  expect(source.length).toBe(2);
});

import { OrcidSource, OrcidSourceItem } from "../src/source-orcid";
import { ORCID_WORK_SUMMARY_PROPERTIES } from "../src/orcid-work.js";
import Publication from "../src/publication";

const EXAMPLE_1 = {
  "last-modified-date": { value: 1655995396899 },
  "external-ids": {
    "external-id": [
      {
        "external-id-type": "doi",
        "external-id-value": "10.5281/ZENODO.5624531",
        "external-id-normalized": {
          value: "10.5281/zenodo.5624531",
          transient: true,
        },
        "external-id-normalized-error": null,
        "external-id-url": {
          value: "https://doi.org/10.5281/zenodo.5624531",
        },
        "external-id-relationship": "self",
      },
    ],
  },
  "work-summary": [
    {
      "put-code": 114870302,
      "created-date": { value: 1655995125154 },
      "last-modified-date": { value: 1655995396899 },
      source: {
        "source-orcid": {
          uri: "https://orcid.org/0000-0002-0766-7305",
          path: "0000-0002-0766-7305",
          host: "orcid.org",
        },
        "source-client-id": null,
        "source-name": { value: "Bas Cornelissen" },
        "assertion-origin-orcid": null,
        "assertion-origin-client-id": null,
        "assertion-origin-name": null,
      },
      title: {
        title: {
          value: "Cosine Contours: a Multipurpose Representation for Melodies",
        },
        subtitle: null,
        "translated-title": null,
      },
      "external-ids": {
        "external-id": [
          {
            "external-id-type": "doi",
            "external-id-value": "10.5281/ZENODO.5624531",
            "external-id-normalized": {
              value: "10.5281/zenodo.5624531",
              transient: true,
            },
            "external-id-normalized-error": null,
            "external-id-url": {
              value: "https://doi.org/10.5281/zenodo.5624531",
            },
            "external-id-relationship": "self",
          },
        ],
      },
      url: { value: "https://zenodo.org/record/5624531" },
      type: "conference-paper",
      "publication-date": {
        year: { value: "2021" },
        month: { value: "11" },
        day: { value: "07" },
      },
      "journal-title": {
        value:
          "International Society for Music Information Retrieval Conference",
      },
      visibility: "public",
      path: "/0000-0002-0766-7305/work/114870302",
      "display-index": "1",
    },
  ],
};

test("orcid source", async () => {
  const source = await OrcidSource.load("bas", "0000-0002-0766-7305", {
    filter: (item) => item.year < 2020,
  });
  expect(source.length).toBe(2);
});

test("orcid source publications", async () => {
  const source = await OrcidSource.load("bas", "0000-0002-0766-7305", {
    filter: (item) => item.year < 2018,
  });
  const item = source.items[source.ids[0]];
  const pub = await item.getPublication();
  expect(pub.year).toBe(2017);
});

test("all properties of work summary example 1", () => {
  const summary = new OrcidSourceItem({
    data: EXAMPLE_1,
    orcidId: "0000-0002-0766-7305",
  });
  expect(summary.data).toEqual(EXAMPLE_1);
  expect(summary.id).toEqual("doi:10.5281/zenodo.5624531");
  expect(summary.doi).toEqual("10.5281/zenodo.5624531");
  expect(summary.orcidId).toEqual("0000-0002-0766-7305");
  expect(summary.putCode).toEqual(114870302);
  expect(summary.path).toEqual("/0000-0002-0766-7305/work/114870302");
  expect(summary.lastModified).toEqual(1655995396899);
  expect(summary.created).toEqual(1655995125154);
  expect(summary.type).toEqual("conference-paper");
  expect(summary.journal).toEqual(
    "International Society for Music Information Retrieval Conference"
  );
  expect(summary.title).toEqual(
    "Cosine Contours: a Multipurpose Representation for Melodies"
  );
  expect(summary.subtitle).toBeUndefined();
});

test("initialize work summary with empty object", () => {
  const summary = new OrcidSourceItem({});
  const exclude = ["internalId"];
  ORCID_WORK_SUMMARY_PROPERTIES.forEach((prop) => {
    if (!exclude.includes(prop)) {
      expect(summary[prop]).toBeUndefined();
    }
  });
});

test("fetch full publication", async () => {
  const summary = new OrcidSourceItem({
    data: EXAMPLE_1,
    orcidId: "0000-0002-0766-7305",
  });
  const pub = await summary.fetchPublication();
  expect(pub).toBeInstanceOf(Publication);
});

import OrcidWork from "../src/work.js";
import OrcidWorkSummary, {
  ORCID_WORK_SUMMARY_PROPERTIES,
} from "../src/work-summary.js";

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

test("all properties of work summary example 1", () => {
  const summary = new OrcidWorkSummary(EXAMPLE_1);
  expect(summary.data).toEqual(EXAMPLE_1);
  expect(summary.internalId).toEqual("doi:10.5281/zenodo.5624531");
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
  const summary = new OrcidWorkSummary({});
  const exclude = ["internalId"];
  ORCID_WORK_SUMMARY_PROPERTIES.forEach((prop) => {
    if (!exclude.includes(prop)) {
      expect(summary[prop]).toBeUndefined();
    }
  });
});

test("specify internalId of work summary", () => {
  const summary = new OrcidWorkSummary({}, { internalId: "hello world" });
  expect(summary.internalId).toEqual("hello world");
});

test("fetch full work", async () => {
  const summary = new OrcidWorkSummary(EXAMPLE_1);
  const work = await summary.fetchFullWork();
  expect(work).toBeInstanceOf(OrcidWork);
  expect(work.internalId).toEqual(summary.internalId);
});

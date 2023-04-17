import OrcidWork, { ORCID_WORK_PROPERTIES } from "../src/work.js";

const EXAMPLE_1 = {
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
  "put-code": 114870302,
  path: "/0000-0002-0766-7305/work/114870302",
  title: {
    title: {
      value: "Cosine Contours: a Multipurpose Representation for Melodies",
    },
    subtitle: null,
    "translated-title": null,
  },
  "journal-title": {
    value: "International Society for Music Information Retrieval Conference",
  },
  "short-description":
    "Melodic contour is central to our ability to perceive and produce music. We propose to represent melodic contours as a combination of cosine functions, using the discrete cosine transform. The motivation for this approach is twofold: (1) it approximates a maximally informative contour representation (capturing most of the variation in as few dimensions as possible), but (2) it is nevertheless independent of the specifics of the data sets for which it is used. We consider the relation with principal component analysis, which only meets the first of these requirements. Theoretically, the principal components of a repertoire of random walks are known to be cosines. We find, empirically, that the principal components of melodies also closely approximate cosines in multiple musical traditions. We demonstrate the usefulness of the proposed representation by analyzing contours at three levels (complete songs, melodic phrases and melodic motifs) across multiple traditions in three small case studies.",
  citation: {
    "citation-type": "bibtex",
    "citation-value":
      "\n@inproceedings{Cornelissen2020,\n  title = {Mode {{Classification}} and {{Natural Units}} in {{Plainchant}}},\n  booktitle = {Proceedings of the 21st {{International Conference}} on {{Music Information Retrieval}} ({{ISMIR}} 2020)},\n  author = {Cornelissen, Bas and Zuidema, Willem and Burgoyne, John Ashley},\n  date = {2020},\n  pages = {869--875},\n  location = {{Montréal, Canada}},\n  doi = {10.5281/zenodo.4245572},\n  abstract = {Many musics across the world are structured around multiple modes, which hold a middle ground between scales and melodies. We study whether we can classify mode in a corpus of 20,865 medieval plainchant melodies from the Cantus database. We revisit the traditional ‘textbook’ classification approach (using the final, the range and initial note) as well as the only prior computational study we are aware of, which uses pitch profiles. Both approaches work well, but largely reduce modes to scales and ignore their melodic character. Our main contribution is a model that reaches 93–95\\% 1 score on mode classification, compared to 86–90\\% using traditional pitch-based musicological methods. Importantly, it reaches 81–83\\% even when we discard all absolute pitch information and reduce a melody to its contour. The model uses tf–idf vectors and strongly depends on the choice of units: i.e., how the melody is segmented. If we borrow the syllable or word structure from the lyrics, the model outperforms all of our baselines. This suggests that, like language, music is made up of ‘natural’ units, in our case between the level of notes and complete phrases, a finding that may well be useful in other musics.},\n  eventtitle = {{{ISMIR}}},\n  langid = {english}\n}",
  },
  type: "conference-paper",
  "publication-date": {
    year: { value: "2021" },
    month: { value: "11" },
    day: { value: "07" },
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
  contributors: { contributor: [] },
  "language-code": "en",
  country: null,
  visibility: "public",
};

test("async fetching data of work example 1", async () => {
  const work = await OrcidWork.load("0000-0002-0766-7305", 114870302);
  expect(work).toBeInstanceOf(OrcidWork);
  expect(work.data).toEqual(EXAMPLE_1);
});

test("test all properties of work example 1", () => {
  const work = new OrcidWork(EXAMPLE_1);
  expect(work.lastModified).toEqual(1655995396899);
  expect(work.created).toEqual(1655995125154);
  expect(work.orcidId).toEqual("0000-0002-0766-7305");
  expect(work.putCode).toEqual(114870302);

  expect(work.day).toEqual("07");
  expect(work.month).toEqual("11");
  expect(work.year).toEqual("2021");
  expect(work.date).toEqual("2021-11-07");

  expect(work.url).toEqual("https://zenodo.org/record/5624531");
  expect(work.doi).toEqual("10.5281/zenodo.5624531");

  expect(work.type).toEqual("conference-paper");
  expect(work.journal).toEqual(
    "International Society for Music Information Retrieval Conference"
  );
  expect(work.title).toEqual(
    "Cosine Contours: a Multipurpose Representation for Melodies"
  );
  expect(work.subtitle).toBeUndefined();
  expect(work.translatedTitle).toBeUndefined();
  expect(work.authors).toBeUndefined();

  expect(work.language).toEqual("en");
  expect(work.description).toEqual(
    "Melodic contour is central to our ability to perceive and produce music. We propose to represent melodic contours as a combination of cosine functions, using the discrete cosine transform. The motivation for this approach is twofold: (1) it approximates a maximally informative contour representation (capturing most of the variation in as few dimensions as possible), but (2) it is nevertheless independent of the specifics of the data sets for which it is used. We consider the relation with principal component analysis, which only meets the first of these requirements. Theoretically, the principal components of a repertoire of random walks are known to be cosines. We find, empirically, that the principal components of melodies also closely approximate cosines in multiple musical traditions. We demonstrate the usefulness of the proposed representation by analyzing contours at three levels (complete songs, melodic phrases and melodic motifs) across multiple traditions in three small case studies."
  );
  expect(work.bibtex).toBe(
    "\n@inproceedings{Cornelissen2020,\n  title = {Mode {{Classification}} and {{Natural Units}} in {{Plainchant}}},\n  booktitle = {Proceedings of the 21st {{International Conference}} on {{Music Information Retrieval}} ({{ISMIR}} 2020)},\n  author = {Cornelissen, Bas and Zuidema, Willem and Burgoyne, John Ashley},\n  date = {2020},\n  pages = {869--875},\n  location = {{Montréal, Canada}},\n  doi = {10.5281/zenodo.4245572},\n  abstract = {Many musics across the world are structured around multiple modes, which hold a middle ground between scales and melodies. We study whether we can classify mode in a corpus of 20,865 medieval plainchant melodies from the Cantus database. We revisit the traditional ‘textbook’ classification approach (using the final, the range and initial note) as well as the only prior computational study we are aware of, which uses pitch profiles. Both approaches work well, but largely reduce modes to scales and ignore their melodic character. Our main contribution is a model that reaches 93–95\\% 1 score on mode classification, compared to 86–90\\% using traditional pitch-based musicological methods. Importantly, it reaches 81–83\\% even when we discard all absolute pitch information and reduce a melody to its contour. The model uses tf–idf vectors and strongly depends on the choice of units: i.e., how the melody is segmented. If we borrow the syllable or word structure from the lyrics, the model outperforms all of our baselines. This suggests that, like language, music is made up of ‘natural’ units, in our case between the level of notes and complete phrases, a finding that may well be useful in other musics.},\n  eventtitle = {{{ISMIR}}},\n  langid = {english}\n}"
  );

  const bibjson = {
    type: "conference-paper",
    title: "Cosine Contours: a Multipurpose Representation for Melodies",
    year: "2021",
    journal: {
      name: "International Society for Music Information Retrieval Conference",
    },
    link: [{ url: "https://zenodo.org/record/5624531" }],
    identifier: [{ type: "doi", id: "10.5281/zenodo.5624531" }],
    abstract:
      "Melodic contour is central to our ability to perceive and produce music. We propose to represent melodic contours as a combination of cosine functions, using the discrete cosine transform. The motivation for this approach is twofold: (1) it approximates a maximally informative contour representation (capturing most of the variation in as few dimensions as possible), but (2) it is nevertheless independent of the specifics of the data sets for which it is used. We consider the relation with principal component analysis, which only meets the first of these requirements. Theoretically, the principal components of a repertoire of random walks are known to be cosines. We find, empirically, that the principal components of melodies also closely approximate cosines in multiple musical traditions. We demonstrate the usefulness of the proposed representation by analyzing contours at three levels (complete songs, melodic phrases and melodic motifs) across multiple traditions in three small case studies.",
  };
  expect(work.bibjson).toEqual(bibjson);
});

test("passing an internalId", () => {
  const work = new OrcidWork({}, { internalId: "hello world" });
  expect(work.internalId).toEqual("hello world");
});

test("test empty object", () => {
  const work = new OrcidWork({});
  const exclude = ["internalId", "bibjson"];
  ORCID_WORK_PROPERTIES.forEach((prop) => {
    if (!exclude.includes(prop)) {
      expect(work[prop]).toBeUndefined();
    }
  });
});

import fs from "fs";
import path from "path";
import { Cite } from "@citation-js/core";
import Publication from "../src/publication";

const filepath = path.resolve("test/chicago.xml");
const CHICACO_CSL = fs.readFileSync(filepath).toString();

const BIBTEX = `
  @inproceedings{Cornelissen2020, 
    title = {Mode {{Classification}} and {{Natural Units}} in {{Plainchant}}}, 
    booktitle = {Proceedings of the 21st {{International Conference}} on {{Music Information Retrieval}} ({{ISMIR}} 2020)}, 
    author = {Cornelissen, Bas and Zuidema, Willem and Burgoyne, John Ashley}, 
    date = {2020}, pages = {869--875}, 
    location = {{Montréal, Canada}}, 
    doi = {10.5281/zenodo.4245572}, 
    abstract = {Many musics across the world are structured around multiple modes}, 
    eventtitle = {{{ISMIR}}}, 
    langid = {english} 
  }
`;

test("initialize from doi", async () => {
  const pub = await Publication.load("10.5281/zenodo.5624531");
  expect(pub).toBeInstanceOf(Publication);
  expect(pub.cite).toBeInstanceOf(Cite);
});

test("initialize from bibtex", async () => {
  const pub = await Publication.load(BIBTEX);
  expect(pub).toBeInstanceOf(Publication);
  expect(pub.cite).toBeInstanceOf(Cite);
});

test("custom csl style", async () => {
  const pub = await Publication.load(BIBTEX, {
    template: CHICACO_CSL,
    style: "chicago-author-year",
  });
  const text = pub.text;
  const ref = `Cornelissen, Bas, Willem Zuidema, and John Ashley Burgoyne. 2020. “Mode Classification and Natural Units in Plainchant.” In Proceedings of the 21st International Conference on Music Information Retrieval (ISMIR 2020), 869–75. Montréal, Canada. https://doi.org/10.5281/zenodo.4245572.`;
  expect(text.startsWith(ref)).toBeTruthy();
});

test("fetch csl style", async () => {
  const url =
    "https://raw.githubusercontent.com/citation-style-language/styles/master/chicago-author-date.csl";
  const response = await fetch(url);
  if (response.ok) {
    const csl_template = response.text();
    const pub = await Publication.load(BIBTEX, {
      template: csl_template,
      style: "chicago-author-year",
    });
    const text = pub.text;
    const ref = `Cornelissen, Bas, Willem Zuidema, and John Ashley Burgoyne. 2020. “Mode Classification and Natural Units in Plainchant.” In Proceedings of the 21st International Conference on Music Information Retrieval (ISMIR 2020), 869–75. Montréal, Canada. https://doi.org/10.5281/zenodo.4245572.`;
    expect(text.startsWith(ref)).toBeTruthy();
  }
});

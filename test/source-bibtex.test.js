import { BibTexSource } from "../src/source-bibtex";

const BIBTEX = `
@article{Nash1950,
    title={Equilibrium points in n-person games},
    author={Nash, John},
    journal={Proceedings of the national academy of sciences},
    volume={36},
    number={1},
    pages={48--49},
    year={1950},
    publisher={USA}
  }
  
  @article{Nash1951,
    title={Non-cooperative games},
    author={Nash, John},
    journal={Annals of mathematics},
    pages={286--295},
    year={1951},
    publisher={JSTOR}
  }

  @inproceedings{Gulordava2018,
    title = {Colorless {{Green Recurrent Networks Dream Hierarchically}}},
    booktitle = {Proceedings of the 2018 {{Conference}} of the {{North American Chapter}} of           the {{Association}} for {{Computational Linguistics}}: {{Human Language}}           {{Technologies}}, {{Volume}} 1 ({{Long Papers}})},
    author = {Gulordava, Kristina and Bojanowski, Piotr and Grave, Edouard and Linzen, Tal and Baroni, Marco},
    year = {2018},
    pages = {1195--1205},
    publisher = {{Association for Computational Linguistics}},
    address = {{New Orleans, Louisiana}},
    doi = {10.18653/v1/N18-1108},
    urldate = {2022-09-04},
    langid = {english},
  }
  
`;

test("initialize bibtex source", async () => {
  const source = await BibTexSource.load("bibtex", BIBTEX);
  expect(source.length).toBe(3);
  expect(source.ids).toEqual([
    "slug:1950_equilibrium-points-in-n-person-games",
    "slug:1951_non-cooperative-games",
    "doi:10.18653/v1/n18-1108",
  ]);
});

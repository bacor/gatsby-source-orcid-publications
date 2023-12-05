import { plugins } from "@citation-js/core";
import { tryToParseCiteData } from "./plugin-orcid.js";
import Crossref from "../crossref.js";
import { CONFIG } from "../index.js";

const crossref = new Crossref();

const formats = {
  "@crossref/dois": {
    async parseAsync(data) {
      console.log(
        `@crossref/dois Collecting ${data.dois.length} DOIs from Crossref`
      );
      const works = await crossref.fetchDOIsBatch(data.dois);

      // Break parse chain to catch errors
      return await Promise.all(
        works.map(async (work) => {
          const messageFn = (work, err) =>
            `Parsing error for work ${work.DOI}. Error: ${err.message}`;
          console.log(`> Collected doi ${work.DOI}`);
          return await tryToParseCiteData(work, messageFn);
        })
      );
    },
    parseType: {
      dataType: "SimpleObject",
      propertyConstraint: {
        props: ["dois"],
      },
    },
  },

  "@crossref/item": {
    parse(data) {
      // replace eg "title": ["my title"] by "title": "my title"
      for (const prop of ["title", "container-title"]) {
        if (Array.isArray(data[prop])) {
          data[prop] = data[prop][0];
        }
        // TODO: Hacky way to make sure it's not parsed again here
        delete data["source"];
      }
      return data;
    },
    parseType: {
      dataType: "SimpleObject",
      propertyConstraint: {
        props: ["source"],
        value: (value) => {
          return value === "Crossref";
        },
      },
    },
  },
};

plugins.add("@crossref", { input: formats });

import { plugins } from "@citation-js/core";
import fs from "fs";

// Adds support for reading data from files
const formats = {
  "@file": {
    parse(path) {
      if(fs.existsSync(path)) {
        return fs.readFileSync(path, 'utf-8')
      } else {
        console.warn(`File not found: ${path}`)
      }
    },
    parseType: {
      dataType: "String",
      predicate: /^(.+\/)?[^/\n]+\.\w{1,9}$/,
    },
  },
};

plugins.add("@file", { input: formats });

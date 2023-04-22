# `gatsby-source-orcid-publications`

[Gatsby](https://gatsbyjs.com/) source plugin to pull publications from [ORCID](https://orcid.org/) and format them using [Citation.js](https://citation.js.org/).

- Pulls publications from multiple ORCID ids
- Formatted bibliography using custom citation styles
- Query publications in GraphQL

---

## Basic usage

The only required option is a list of ORCID ids, but you can find [a list of all options below](#plugin-options).

```js
// In your gatsby-config.js
plugins: [
  {
    resolve: "gatsby-source-orcid-publications",
    options: {
      orcidIds: ["0000-0000-0000-0001", "0000-0000-0000-0002"],
      style: "apa",
      // See below for all options
    },
  },
];
```
```js
// In your gatsby-config.js
plugins: [
  {
    resolve: "gatsby-source-orcid-publications",
    options: {
      sources: [
        { orcidId: "0000-0000-0000-0001" }, 
        { 
          orcidId: "0000-0000-0000-0002",
          filter: summary => parseInt(summary.year) > 2000,
          include: ['10.5281/zenodo.5624531']
        }
      ]
      style: "apa",
      // See below for all options
    },
  },
];
```


You can then query your publications as follows.

```graphql
query MyQuery {
  allPublication {
    nodes {
      year
      citation # an inline citation, e.g. (Author, 2023)
      bibtex # a bibtex reference
      html # formatted html reference
      text # plain text reference
      orcid_ids # list of associated ORCID ids (see below)
      # The Cite object is exported to bibjson, and all its fields
      # are added to the graph under props:
      props {
        DOI
        title
        author {
          given
          family
        }
        abstract
        issued {
          date_parts
        }
        # And more...
      }
    }
  }
}
```

## Plugin options

- **`orcidIds`** (required list of strings). A list of all ORCID ids from which works are fetched.
- **`style`** (optional string, default `'apa'`). Name of the citation style. The styles that are included by default in Citation.js are `'apa'`, `'vancouver'`, and `'harvard1'`. If you use a custom CSL template, you have to specify a name for it using the `style` option here.
- **`template`** (optional string). A custom CSL template, passed as a XML string. If you use a custom template, make sure to also name it using the `style` option, or otherwise the template will not be used.
- **`locale`** (optional string, default `'en-US'`). The locale, used by Citation.js. Supported values are `'en-US'`, `'es-ES'`, `'de-DE'`, `'fr-FR'`, and `'nl-NL'`.
- **`skipWithoutBibtexOrDoi`** (optional boolean, default `false`). If `true`, all works without bibtex or doi are skipped. It is possible to construct Cite objects for such works from the information returned by ORCID, but they maybe turn out to be incomplete.
- **`replaceDOIsByAnchors`** (optional boolean, default `true`). If this is enabled and the style is `'apa'`, then the DOIs at the end of the formatted HTML reference are replaced by anchors.
- **`nodeType`** (optional string, default `'Publication'`). Name of the nodes.
- **`endpoint`** (optional string, default `'https://pub.orcid.org/v3.0'`). The ORCID endpoint from which to fetch all data.
- **`delayAfterFetch`** (optional int, default `25`ms). The delay in ms after every request to ORCID.

## Custom citation styles

You can use custom citation styles by passing a CSL template to the plugin options. You can find many citation styles [in this Github repository](https://github.com/citation-style-language/styles). Pass the XML template to the plugin as a string:

```js
// In your gatsby-config.js

// Your CSL template: copy-paste it directly, or fetch it from file/url
const csl_template = '<?xml version="1.0" encoding="utf-8"?><style ...';

module.exports = {
  // ...
  plugins: [
    {
      resolve: "gatsby-source-orcid-publications",
      options: {
        orcidIds: [],
        // ...
        style: "my-custom-style",
        template: csl_template,
        // ...
      },
    },
    //...
  ],
};
```

### Resolving duplicate publications

If multiple ORCID ids are passed, the same publication could appear multiple times. The plugin uses (normalized) DOIs to identify and remove duplicates. If no DOI can be found, the plugin uses the year and title, which may not always work well. The best way to resolve unwanted duplicates is to edit the ORCID entries so that the works in question all have the same DOI, or otherwise have identical titles.

The plugin tracks from which ORCID id a publication was retrieved. If a publication is for example found in the works of both ORCID id `0000-0000-0000-0001` and ORCID id `0000-0000-0000-0002`, then only one node will be created, and it will have `Publication.orcid_ids = ['0000-0000-0000-0001', '0000-0000-0000-0002']`.

### Linking publications

One way you can use `orcid_ids`, is to associate publications to other nodes, such as users. The specifics will vary depending on the setup, but suppose you have a node type `Users` with an `orcid_id` field, then the following schema customization should do the trick:

```js
// In your gatsby-node.js
exports.createSchemaCustomization = ({ actions }) => {
  actions.createTypes(`
    type User implements Node @infer {
      orcid_id: String
    }

    type Publication implements Node @infer {
      orcid_ids: [User] @link(by: "orcid_id")
    }
  `);
};
```

## License

[MIT License](/LICENSE), Copyright (c) 2023 [Bas Cornelissen](https://github.com/bacor)

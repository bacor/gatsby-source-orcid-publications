# `gatsby-source-publications`

[Gatsby](https://gatsbyjs.com/) source plugin to pull publications from bibtex, DOIs, or [ORCID](https://orcid.org/) and format them using [Citation.js](https://citation.js.org/). The key features:

- Pull publications from multiple sources: BibTex, DOIs and ORCID.
- Formatted bibliography using custom citation styles
- Query publications in GraphQL
- Easily filter which publications are added to the graph 

---

## Basic usage

The only required option is a list of sources, but you can find [a list of all options below](#plugin-options).

```js
// In your gatsby-config.js
plugins: [
  {
    resolve: "gatsby-source-publications",
    options: {
      sources: [
        { 
          // Fetch all works from a given ORCIDiD
          type: "orcid", 
          name: "bcornelissen", 
          orcidId: "0000-0002-0766-7305",
          // You can exclude some of them using a filter...
          filter: (item) => item.year > 2020,
          // ...or by passing a list of DOIs to exlucde
          excludeDOIs: ['10.1177/10298649221149109'],
        },
        { 
          // And another one...
          type: "orcid", 
          name: "jaburgoyne", 
          orcidId: "0000-0001-6854-5646"
        },
        {
          // Or you can pass a list of DOIs to load
          type: "doi",
          name: "some-dois",
          DOIs: [
            "10.31234/osf.io/qjfpe", 
            "10.1177/10298649221149109",
            "10.1007/s10071-023-01763-4"
          ]
        },
        {
          // Or read out a bibtex file
          type: "bibtex"
          name: "my-bibtex-pubs",
          path: path.resolve('./src/my-bibliography.bib')
        }
      ],
      
      style: "apa", // harvard1 or vancouver
      // ... or pick your favourite citation style 
      template: 'https://.../my-style.csl',
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
      sources # list of source names
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

## Sources

The plugin fetches and combines publications from multiple sources. Three types of sources are currently supported: BibTex, DOIs and ORCID. 
You can pass as many sources as you like to `plugins.options.sources` using dictionaries of the following form:

```js
{
  // Required options
  type: 'orcid', // one of 'orcid', 'bibtex' or 'doi'
  name: 'my_name' // required

  // Required when type == 'bibtex', either one of these:
  path: '' // path to a bibtex file
  bibtex: '' // or, alternatively the contents of a bibtex file

  // Required when type == 'orcid'
  orcidId: '0000-0001-6854-5646'  // an ORCIDiD

  // Required when type == 'doi'
  DOIs: [...] // a list of dois

   // Optional: excludes items for which the filter returns false
  filter: (item) => true 
  
  // Optional: exlude certain DOIs (a shorthand filter)
  excludeDOIs: [...] // A list of DOIs that are excluded
}
```

## Plugin options

- **`sources`** (required list of strings). A list of all source objects, [see section on sources](#sources).
- **`style`** (optional string, default `'apa'`). Name of the citation style. The styles that are included by default in Citation.js are `'apa'`, `'vancouver'`, and `'harvard1'`. This field is ignored if you also specify a custom CSL template
- **`template`** (optional string). A custom CSL template, passed as an url or an XML string. 
- **`locale`** (optional string, default `'en-US'`). The locale, used by Citation.js. Supported values are `'en-US'`, `'es-ES'`, `'de-DE'`, `'fr-FR'`, and `'nl-NL'`.
- **`skipWithoutBibtexOrDoi`** (optional boolean, default `false`). If `true`, all works without bibtex or doi are skipped. It is possible to construct Cite objects for such works from the information returned by ORCID, but they maybe turn out to be incomplete.
- **`replaceDOIsByAnchors`** (optional boolean, default `true`). If this is enabled and the style is `'apa'`, then the DOIs at the end of the formatted HTML reference are replaced by anchors.
- **`nodeType`** (optional string, default `'Publication'`). Name of the nodes.
- **`orcidEndpoint`** (optional string, default `'https://pub.orcid.org/v3.0'`). The ORCID endpoint from which to fetch all data.
- **`delayAfterFetch`** (optional int, default `25`ms). The delay in ms after every request to ORCID.

## Custom citation styles

You can use custom citation styles by passing a CSL template to the plugin options. You can find many citation styles [in this Github repository](https://github.com/citation-style-language/styles). Pass the XML template to the plugin as a url or as an XML string:

```js
// In your gatsby-config.js
module.exports = {
  // ...
  plugins: [
    {
      resolve: "gatsby-source-orcid-publications",
      options: {
        sources: [
          // ...
        ],
        // Option 1: pass an url"
        template: 'https://raw.githubusercontent.com/citation-style-language/styles/master/chicago-author-date-16th-edition.csl',
        
        // Option 2: pass the CLS style directly
        template: '<?xml version="1.0" encoding="utf-8"?><style ...';
        // ...
      },
    },
    //...
  ],
};
```

## Resolving duplicate publications

The same publication could appear in multiple sources. The plugin first tries to identify and remove duplicates using (normalized) DOIs. If no DOI can be found, the plugin uses the year and title, but this may not always work well. If problems arise, edit the source data so that the works in question all have the same DOI, or otherwise have identical titles. You can also write a custom filter to remove duplicates. 

The plugin tracks from which source each publication was retrieved using the `source.name` field. If a publication is for example found in sources with names `source_1` and `source_2` then one node will be created, and it will have `Publication.sources = ['source_1', 'source_2']`.

## Filtering publications

You can of course filter publications using GraphQL queries, but you can also prevent certain publications from being added to the graph altogether. (This may for example reduce build time for ORCID sources in particular). To filter publications *before nodes are created*, pass a `source.filter` function, that takes a `SourceItem` and returns `true` if the item is to be included:

```js
{
  type: 'orcid',
  name: 'my_source'
  //...
  filter: (item) => {
    // Your fancy filtering function
    return item.year > 2020
  }
}
```

The `item` is a `SourceItem` instance, and does not *yet* contain all information about the publication: this is fetched only when it is really needed, when nodes are finally created. Which data is available depends on the source type:
 
- **DOI.** With `DOISourceItems` you can use `item.doi` and `item.id`
- **ORCID.** With `OrcidSourceItem` you can use the properties `id`, `lastModified`, `created`, `putCode`, `path`, `doi`, `type`, `title`, `journal`, `year`.
- **BibTex.** With `BibTexSourceItem` you can use `id`, `doi`, `citationKey`, `title`, `year`, or other fields by accessing `item.data` directly.

(N.B.: If you really need all data, you can hack the filter by accessing `item.export`. This will fetch and cache all data for that item.)

## Linking publications

One way you can use the `sources` field, is to associate publications to other nodes, such as users. The specifics will vary depending on the setup, but suppose you have a node type `Users` with a `username` field. *If the names of your publication sources correspond to usernames*, then the following schema customization should do the trick:

```js
// In your gatsby-node.js
exports.createSchemaCustomization = ({ actions }) => {
  actions.createTypes(`
    type User implements Node @infer {
      username: String
    }

    type Publication implements Node @infer {
      users: [User] @link(from: "sources", by: "username")
    }
  `);
};
```

## License

[MIT License](/LICENSE), Copyright (c) 2023 [Bas Cornelissen](https://github.com/bacor)

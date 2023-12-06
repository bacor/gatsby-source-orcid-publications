# `gatsby-source-publications`

[Gatsby](https://gatsbyjs.com/) source plugin to pull publications from a wide range of sources, such as bibtex, DOIs,[ORCID](https://orcid.org/), pubmed, Refworks, Wikidata — heavily building on  [Citation.js](https://citation.js.org/). The key features:

- Pull publications from many types of sources: BibTex, DOIs, ORCID, pubmed, RIS, ISBN, Wikidata, Refer, and Refworks. Basically, if there is a citation-js plugin for it, you can add it.
- Formatted bibliography using custom citation styles
- Query publications in GraphQL
- Easily filter which publications are added to the graph 

---

## Minimal example

```js
// In your gatsby-config.js
plugins: [
  {
    resolve: "gatsby-source-publications",
    options: {
      sources: [
        {
          data: path.resolve('./src/my-bibliography.bib') // Required
          format: "bibtex", // ~required (to load the right plugins)
          name: "my-publication" // Optional
        }
      ]
    },
  },
];
```


## More elaborate example

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
          format: "orcid", 
          data: "0000-0002-0766-7305",
          name: "bcornelissen", 
          exclude: [
            // Exclude items by a field value...
            { field: "DOI", values: ['10.1177/10298649221149109'] },
            // ... or using some regular expression
            { field: "title", regexp: "Zebra finches*" }
            // ... or filter by year (a shorthand)
            { before: 2020, after: 2023 },
            // ... or pass a custom filter
            (item) => item.title.length < 3
          ]
        },
        { 
          // And another one...
          format: "orcid", 
          data: "0000-0001-6854-5646"
          name: "jaburgoyne", 
        },
        {
          // Or you can pass a list of DOIs to load
          format: "doi",
          name: "some-dois",
          data: [
            "10.31234/osf.io/qjfpe", 
            "10.1177/10298649221149109",
            "10.1007/s10071-023-01763-4"
          ],
        },
        {
          format: "bibtex"
          name: "my-bibtex-pubs",
          data: path.resolve('./src/my-corrections.bib')
          
          // You can give sources a priority. When publication occurs 
          // in multiple sources, the version from the highest-priority 
          // source is kept. You could for example use this to fix 
          // mistakes from other sources
          priority: 10
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
      order # the order in the the sorted publication list
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

The plugin fetches and combines publications from multiple sources. You can pass as many sources as you like to `plugins.options.sources` using dictionaries of the following form:

```js
{
  // 'orcid', 'bibtex', 'doi', 'ris', 'isbn', 'wikidata', 'refer', 'refworks'
  // This is mostly used to ensure the right citation-js plugins are loaded
  format: 'orcid', 

  // Name of the source
  name: 'my_name'

  // The data passed to citation-js. This can be many things,
  // from a list of DOIs to a filename, to an ORCID id.
  data: ''
  
  // Optional: exclusion rules
  exclude: [
    // Exclude items by a field value...
    { field: "DOI", values: ['10.1177/10298649221149109'] },
    // ... or using some regular expression
    { field: "title", regexp: "Zebra finches*" }
    // ... or filter by year (a shorthand)
    { before: 2020, after: 2023 },
    // ... or pass a custom filter
    (item) => item.title.length < 3
  ]
}
```

## Plugin options

- **`sources`** (required list of strings). A list of all source objects, [see section on sources](#sources).
- **`style`** (optional string, default `'apa'`). Name of the citation style. The styles that are included by default in Citation.js are `'apa'`, `'vancouver'`, and `'harvard1'`. This field is ignored if you also specify a custom CSL template
- **`template`** (optional string). A custom CSL template, passed as an url or an XML string. 
- **`locale`** (optional string, default `'en-US'`). The locale, used by Citation.js. Supported values are `'en-US'`, `'es-ES'`, `'de-DE'`, `'fr-FR'`, and `'nl-NL'`.
- **`nodeType`** (optional string, default `'Publication'`). Name of the nodes.
- **`refresh`** (optional boolean) whether to refresh the cache
- **`customFields`** (optional function) a function that takes a cite object and returns an object with custom fields. These are exported to the graph.
- **`outputTransform`** (optional function) a function that takes a publication object, transforms it in whatever way you like and returns the modified object before it is added to the graph. You can use this to e.g. tweak HTML output.
- **`serviceName`**, **`serviceEmail`** and **`serviceDomain`** specify these to ensure you end up in the pool of polite users of Crossref.
- **`silent`** (optional boolean) to supress all loggin (not yet fully implemented)

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

## Resolving duplicate publications (To be updated)

The same publication could appear in multiple sources. The plugin first tries to identify and remove duplicates using (normalized) DOIs. If no DOI can be found, the plugin uses the year and title, but this may not always work well. If problems arise, edit the source data so that the works in question all have the same DOI, or otherwise have identical titles. You can also write a custom filter to remove duplicates. 

The plugin tracks from which source each publication was retrieved using the `source.name` field. If a publication is for example found in sources with names `source_1` and `source_2` then one node will be created, and it will have `Publication.sources = ['source_1', 'source_2']`.

## Filtering publications (To be updated)

You can of course filter publications using GraphQL queries, but you can also prevent certain publications from being added to the graph altogether. (This may for example reduce build time for ORCID sources in particular). To filter publications *before nodes are created*, pass a `source.exclude` function, that takes a `Cite` object and returns `true` if the item is to be excluded:

```js
{
  type: 'orcid',
  name: 'my_source'
  //...
  exclude: [
    (item) => {
      // Your fancy filtering function
      return item.year > 2020
    }
  ]
}
```

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

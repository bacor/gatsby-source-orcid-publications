`gatsby-source-orcid-publications`
=================================

Gatsby source plugin that fetches publications from ORCID using [https://github.com/citation-js/plugin-orcid](@citation-js/plugin-orcid). You can pass multiple ORCID ids. The plugin will
retrieve all publications (works) associated with these ids, and create nodes for all unique publications, while also associating
each publication to the ORCID ids.

Usage
-----

```js
// In your gatsby-config.js
plugins: [
  {
    resolve: 'gatsby-source-orcid-publications',
    options: {
      // Required: a list of ORCID ids
      orcidIds: [
        '0000-0000-0000-0000', 
      ],

      // Optional: citation style, defaults to 'apa'
      // It is not (yet) possible to use custom styles, but 
      // it shouldn't be difficult to implement this
      template: 'apa', // 'vancouver', 'chicago'

      // Optional: delay in ms between requests for every orcid id 
      delay: 100

      // Optioinal: excluded bibjson fields to keep the GraphQL nodes uncluttered.
      excludedFields: [
        '_graph',
        'reference'
      ]
    }
  }
]
```


Querying
--------

```graphql
query {
  allPublication {
    nodes {
      # List of ORCID-ids associated to this publication
      orchidIds 
      
      # Formatted HTML citation
      html 
      
      bibjson {
        DOI
        title
        author {
          given
          family
        }
        # And much more...
      }
    }
  }
}
```
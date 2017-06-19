# arturo-query

`arturo-query` is a parser for a simple, boolean-term full-text query syntax. It's intended to be both a preprocessor (e.g. to screen expensive queries) and augmentation (e.g. provide extra-search fields) for existing full-text stores.

[![Build Status](https://travis-ci.org/maxvu/arturo-query.svg?branch=master)](https://travis-ci.org/maxvu/arturo-query)
[![Coverage Status](https://coveralls.io/repos/github/maxvu/arturo-query/badge.svg?branch=master)](https://coveralls.io/github/maxvu/arturo-query?branch=master)

## Features

* Negation (`!`, `-` and `not`), disjunctive (`|`, `or`) and grouping (`()`) operators.
* Logical refactoring toward disjunction-of-conjunctions.

## Live Demo

See [here](https://maxvu.github.io/arturo-query/).

## Examples

### `moonkeys | boars`
```
and(
  or(
      term(moonkeys)
      term(boars)
  )
)
```

### `alpha not ( beta or not ( gamma or delta ) )`
```
or(
  and(
      term(alpha)
      term(beta)
      term(gamma)
  )
  and(
      term(alpha)
      term(beta)
      term(delta)
  )
)
```


### `a !( b or !( c or d ) )`
```
or(
  and(
      term(a)
      term(b)
      term(c)
  )
  and(
      term(a)
      term(b)
      term(d)
  )
)
```

## Still TODO

* Extra-search attributes, e.g. ``
* `query` methods:
   * "Does this have any positive terms?"
   * "Does this query have a specific positive term? Or specific negative?"
   * "Are there conflicting terms (e.g. `X !X`)?"
   * "What is the disjunctive degree of this query? (i.e. 'how many ORs are there?')
* i18n gotchyas



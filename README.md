# arturo-query

`arturo-query` is a parser for a simple, boolean-term full-text query syntax.




## Features

* Negation (`!`, `-` and `not`), disjunctive (`|`, `or`) and grouping (`()`) operators.
* Logical refactoring toward disjunctionс-of-conjunctions.


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

* `query` methods:
   * "Does this have any positive terms?"
   * "Does this query have a specific positive term? Or specific negative?"
   * "Are there conflicting terms (e.g. `X !X`)?"
   * "What is the disjunctive degree of this query? (i.e. 'how many ORs are there?')
* i18n



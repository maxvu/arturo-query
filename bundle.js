(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.query = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var extend = require('xtend/immutable');

// Public API
module.exports = cartesian;

/**
 * Creates cartesian product of the provided properties
 *
 * @param   {object|array} list - list of (array) properties or array of arrays
 * @returns {array} all the combinations of the properties
 */
function cartesian(list)
{
  var last, init, keys, product = [];

  if (Array.isArray(list))
  {
    init = [];
    last = list.length - 1;
  }
  else if (typeof list == 'object' && list !== null)
  {
    init = {};
    keys = Object.keys(list);
    last = keys.length - 1;
  }
  else
  {
    throw new TypeError('Expecting an Array or an Object, but `' + (list === null ? 'null' : typeof list) + '` provided.');
  }

  function add(row, i)
  {
    var j, k, r;

    k = keys ? keys[i] : i;

    // either array or not, not expecting objects here
    Array.isArray(list[k]) || (typeof list[k] == 'undefined' ? list[k] = [] : list[k] = [list[k]]);

    for (j=0; j < list[k].length; j++)
    {
      r = clone(row);
      store(r, list[k][j], k);

      if (i >= last)
      {
        product.push(r);
      }
      else
      {
        add(r, i + 1);
      }
    }
  }

  add(init, 0);

  return product;
}

/**
 * Clones (shallow copy) provided object or array
 *
 * @param   {object|array} obj - object or array to clone
 * @returns {object|array} - shallow copy of the provided object or array
 */
function clone(obj)
{
  return Array.isArray(obj) ? [].concat(obj) : extend(obj);
}

/**
 * Stores provided element in the provided object or array
 *
 * @param   {object|array} obj - object or array to add to
 * @param   {mixed} elem - element to add
 * @param   {string|number} key - object's property key to add to
 * @returns {void}
 */
function store(obj, elem, key)
{
  Array.isArray(obj) ? obj.push(elem) : (obj[key] = elem);
}

},{"xtend/immutable":2}],2:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],3:[function(require,module,exports){
'use strict';

/*
    Given an array and a sorting function, divide an array into map 'buckets'.
    I think this is like lodash's partition().
    
    sort should return a string or, if it shouldn't be included, not-a-string.
*/

module.exports = ( arr, sort ) => {

    var map = {};
    
    for ( var i = 0; i < arr.length; i++ ) {
        let result = sort( arr[ i ] );
        if ( !( result instanceof String ) && typeof result !== 'string' )
            continue;
        if ( !( result in map ) )
            map[ result ] = [];
        map[ result ].push( arr[ i ] );
    }
    
    return map;
    
};


},{}],4:[function(require,module,exports){
'use strict';

/*
    A bunch of character constants, mostly used by lexer.
*/

module.exports = {

    // whitespace
    wts : " \n\t\v\r",
    
    // quoted terms
    quo : {
        det : "\"'"
    },
    
    // parentheticals
    par : {
        opn : '(',
        cls : ')'
    },
    
    // attr/value 'tag' pairs
    tag : {
        det : ':'
    },
    
    // negation
    neg : {
        det : '!-'
    },
    
    // disjunctive operator
    oro : {
        det : '|',
    },
    
    // bare term, interrupting characters
    trm : {
        int : ':!(\"\')|'
    }
};


},{}],5:[function(require,module,exports){
'use strict';
var site = require( './site' );

/*
    A simple union with JS-standard Error with our site information.
*/

module.exports = class ParsingError extends Error {

    constructor ( site, message ) {
        super( message );
        this.site = site;
        this.stack = (new Error()).stack;
    }
    
    getReport () {
        return `${this.message} at position ${this.site.getBegin()}`;
    };
    
    getSite () {
        return this.site;
    }
    
};


},{"./site":10}],6:[function(require,module,exports){
'use strict';
var token = require( './token' );
var bucket = require( './bucket' );

/*
    Parser-result expressions and query-constituent parts.
*/

// enumerated expression types
const type_ids = {
    conj : 107,
    disj : 109,
    term : 113,
    tagp : 127
};

// base, abstract expression
class expr {

    constructor ( tokens ) {
        if ( !( tokens instanceof Array ) && typeof tokens !== 'array' )
            throw new Error( "expr accepts only an array of lexer tokens" );
        this._tokens = tokens;
    }
    
    getType () {
        return this._type;
    }
    
    getTokens () {
        return this._tokens;
    }
    
    // can this expression contain other expressions?
    isRecursive () {
        return false;
    }
    
    // fold down to a standard form
    normalize () {
        return this;
    }
    
    // does this query represent all queryable items?
    isUniverse () {
        return false;
    }
    
    // does this query represent the zero-set?
    isZeroSet () {
        return false;
    }
    
};

// abstract recursive expression
class rcrs extends expr {

    constructor ( subexprs ) {
        if ( !( subexprs instanceof Array ) && typeof subexprs !== 'array' )
            throw new Error( "recursive expressions accept only an array of expr's" );
        super([]);
        this._children = subexprs;
    }
    
    getTokens () {
        return this._children.reduce( ( acc, child ) => {
            return acc.concat( child.getTokens() );
        }, [] );
    }
    
    getChildren () {
        return this._children;
    }
    
    isRecursive () {
        return true;
    }
    
    isNegated () {
        return false;
    }
    
    toString ( outtermost ) {
        let inner = this._children.reduce( ( acc, child ) => {
            return acc.concat([ child.toString() ]);
        }, [] ).join( this._infix );
        return outtermost ? inner : '( ' + inner + ' )';
    }
    
    // remove redundant terms and tags
    makeUnique () {
        let buckets = bucket( this._children, ( child ) => {
            return child.toString();
        } );
        for ( var e in buckets ) {
            if ( buckets[ e ].length === 1 )
                continue;
            while ( buckets[ e ].length > 1 ) {
                let to_remove = this._children.indexOf( buckets[ e ].pop() );
                this._children.splice( to_remove, 1 );
            }
        }
        return this;
    }
    
    normalize () {
        // remove superfluous nesting
        if ( this._children.length === 1 )
            return this._children[ 0 ].normalize();
        // promote like terms
        return new this.constructor(
            [].concat.apply( [], this._children.map( ( child ) => {
                child = child.normalize();
                return ( child.getType() === this.getType() )
                    ? child.getChildren()
                    : child;
            } ) )
        ).makeUnique();
    }
    
    hasContradictingTerms () { // e.g. "a !a"
        let terms = bucket( this._children, ( child ) => {
            if ( child.getType() === type_ids.term )
                return child.getId();
            return null;
        } );
        for ( var id in terms ) {
            if ( terms[ id ].some( ( t ) => {
                return t.isNegated();
            } ) && terms[ id ].some( ( t ) => {
                return !t.isNegated();
            } ) ) {
                return true;
            }
        }
        return false;
    }
    
    hasContradictingTags () { // e.g. "attr:val !attr:val"
        let tags = bucket( this._children, ( child ) => {
            if ( child.getType() === type_ids.tagp )
                return child.getAttr() + ':' + child.getVal();
            return null;
        } );
        for ( var id in tags ) {
            if ( tags[ id ].some( ( t ) => {
                return t.isNegated();
            } ) && tags[ id ].some( ( t ) => {
                return !t.isNegated();
            } ) ) {
                return true;
            }
        }
        return false;
    }
    
    // does this query represent all queryable items?
    isUniverse () {
        return this._children.some( ( child ) => {
            return child.isUniverse();
        } );
    }
    
    // is this query unsatisfiable?
    isZeroSet () {
        return this._children.some( ( child ) => {
            return child.isZeroSet();
        } );
    }
    
};

class conj extends rcrs {

    constructor ( subexprs ) {
        super( subexprs );
        this._type = type_ids.conj;
        this._infix = ' ';
    }
    
    negate () {
        return new disj( this._children.map ( ( child ) => {
            return child.negate();
        } ) );
    }
    
    isZeroSet () {
        // conjunction with no terms is the zero set
        // (empty queries meaning 'everything' can be fitted on later)
        if ( this._children.length === 0 )
            return true;
        
        // zero-sets with extra qualifiers are still zero sets
        if ( super.isZeroSet() )
            return true;
        
        if ( this.hasContradictingTerms() || this.hasContradictingTags() )
            return true;

        return false;
    }

};

class disj extends rcrs {

    constructor ( subexprs ) {
        super( subexprs );
        this._type = type_ids.disj;
        this._infix = ' OR ';
    }
    
    negate () {
        return new conj( this._children.map ( ( child ) => {
            return child.negate()
        } ) );
    }
    
    isZeroSet () {
        return this.getChildren().length == 0;
    }
    
    isUniverse () {
        if ( super.isUniverse() )
            return true;
        return this.hasContradictingTerms();
    }

};

class term extends expr {
    
    constructor ( trm ) {
        if ( !( trm instanceof token.trm ) )
            throw new Error( "'term' expression accepts only a token 'trm'" );
        super([ trm ]);
        this._type = type_ids.term;
        this._negated = false;
    }
    
    getId () {
        return this._tokens[ 0 ].getText();
    }
    
    negate () {
        let ng = new term( this.getTokens()[ 0 ] );
        ng._negated = true;
        return ng;
    }
    
    isNegated () {
        return this._negated;
    }
    
    toString () {
        return ( this._negated ? '-' : '' ) + `"${this.getId()}"`;
    }
    
};

class tagp extends expr {

    constructor ( tokens ) {
        if ( !( tokens instanceof Array ) && typeof tokens !== 'array' )
            throw new Error( "expr.tagp accepts only an Array" );
        if ( tokens.length !== 3 )
            throw new Error( "expr.tagp accepts only a term-tag-term triplet" );
            
        let attr = tokens[ 0 ];
        let tag  = tokens[ 1 ];
        let val  = tokens[ 2 ];
        
        if ( 
            !( attr instanceof token.trm ) ||
            !( tag  instanceof token.tag ) ||
            !( val  instanceof token.trm )
        ) {
            throw new Error( "expr.tagp accepts only a term-tag-term triplet" );
        }
        
        super( tokens );
        
        this._type = type_ids.tagp;
        this._negated = false;
    }
    
    getAttr () {
        return this.getTokens()[ 0 ].getText();
    }
    
    getVal () {
        return this.getTokens()[ 2 ].getText();
    }
    
    negate () {
        let ng = new tagp( this._tokens );
        ng._negated = true;
        return ng;
    }
    
    isNegated () {
        return this._negated;
    }
    
    toString () {
        let neg = this._negated ? '-' : '';
        return neg + `"${this.getAttr()}":"${this.getVal()}"`;
    }

};

module.exports = {
    expr : expr,
    rcrs : rcrs,
    conj : conj,
    disj : disj,
    term : term,
    tagp : tagp,
    type_ids : type_ids
};


},{"./bucket":3,"./token":12}],7:[function(require,module,exports){
'use strict';
var site = require( './site' );
var token = require( './token' );
var stream = require( './stream' );
var charmap = require( './charmap' );

/*
    Transform a string into an array of token symbols defined in 'token'.
*/

module.exports = ( raw ) => {
    
    var input = new stream( raw );
    var output = [];
    
    // lex whitespace
    function lx_wts () {
        while( input.scan( charmap.wts ) )
            input.step();
        output.push( new token.wts( input.extract() ) );
    }
    
    // lex bare terms
    function lx_trm () {
        while (
            !input.scan( charmap.trm.int ) &&
            !input.scan( charmap.wts ) &&
            !input.done()
        ) {
            input.step();
        }
        output.push( new token.trm( input.extract() ) );
    }
    
    // lex quoted terms
    function lx_quo () {
        let opening_quote = new token.quo( input.step().extract() );
        while ( !input.done() && !input.scan( opening_quote.getText() ) )
            input.step();
        if ( input.done() )
            throw opening_quote.getSite().error( "Unterminated quote" );
        output.push( opening_quote );
        output.push( new token.trm( input.extract() ) );
        output.push( new token.quo( input.step().extract() ) );
    }
    
    function lx () {
        if ( input.scan( charmap.wts ) )
            lx_wts();
        else if ( input.scan( charmap.quo.det ) )
            lx_quo();
        else if ( input.scan( charmap.par.opn ) )
            output.push( new token.lpr( input.step().extract() ) );
        else if ( input.scan( charmap.par.cls ) )
            output.push( new token.rpr( input.step().extract() ) );
        else if ( input.scan( charmap.tag.det ) )
            output.push( new token.tag( input.step().extract() ) );
        else if ( input.scan( charmap.neg.det ) )
            output.push( new token.neg( input.step().extract() ) );
        else if ( input.scan( charmap.oro.det ) )
            output.push( new token.oro( input.step().extract() ) );
        else
            lx_trm();
    }
    
    while ( !input.done() )
        lx();
    
    return output;
    
};



},{"./charmap":4,"./site":10,"./stream":11,"./token":12}],8:[function(require,module,exports){
'use strict';
var token = require( './token' );
var lex = require( './lex' );
var expr = require( './expr' );

/*
    Transform a list of lexer tokens into some recursive expression.
*/

const T_NOT = 'not';
const T_OR  = 'or';
const T_AND = 'and';

module.exports = function parse ( input ) {

    // try to act as passthrough for lex()
    if ( input instanceof String || typeof input === 'string' )
        input = lex( input );
    if ( !( input instanceof Array ) && typeof input !== 'array' )
        throw new Error( "parse() accepts string or array-of-tokens" );
    
    // strip out whitespace and quotes
    input = input.filter( ( tk ) => {
        return !(
            tk instanceof token.wts ||
            tk instanceof token.quo
        );
    } );
 
    // remove all bare 'and's
    input = input.filter( ( tk ) => {
        return !(
            tk instanceof token.trm && tk.getText().toLowerCase() === T_AND
        );
    } );
    
    // promote all lexer 'trm's to expr 'terms'
    // convert 'OR's and 'NOT's from terms to negators
    input = input.map( ( tk ) => {
        if ( !( tk instanceof token.trm ) )
            return tk;
        else if ( tk.getText().toLowerCase() === T_NOT )
            return new token.neg( tk.getSite() );
        else if ( tk.getText().toLowerCase() === T_OR  )
            return new token.oro( tk.getSite() );
        else
            return new expr.term( tk );
    } );
    
    // combine tag pairs
    var idx_tag;
    while ( ( idx_tag = input.findIndex( ( tk ) => {
        return tk instanceof token.tag;
    } ) ) !== -1 ) {
        if ( idx_tag === 0 || idx_tag === input.length - 1 )
            throw input[ idx_tag ].error( "Unpaired tag delimiter" );
        if ( !( input[ idx_tag - 1 ] instanceof expr.term ) )
            throw input[ idx_tag - 1 ].error( "Tag attribute not given as term" );
        if ( !( input[ idx_tag + 1 ] instanceof expr.term ) )
            throw input[ idx_tag + 1 ].error( "Tag value not given as term" );
            
        let triplet = input.splice( idx_tag - 1, 3 );
        let tag = new expr.tagp([
            triplet[ 0 ].getTokens()[ 0 ],
            triplet[ 1 ],
            triplet[ 2 ].getTokens()[ 0 ]
        ]);
        input.splice( idx_tag - 1, 0, tag );
    }
    
    // fold parenthetical groups, recursive descent
    function ps_expr ( input, expectRpr ) {
        let output = [];
        while ( input.length ) {
            let curr = input.shift();
            if ( curr instanceof token.lpr ) {
                let subexpr;
                try {
                    subexpr = parse( ps_expr( input, true ) );
                } catch ( ex ) {
                    throw curr.error( ex.message );
                }
                output.push( subexpr );
            } else if ( curr instanceof token.rpr ) {
                if ( !expectRpr )
                    throw curr.error( "Unbalanced paren" );
                return output;
            } else {
                output.push( curr );
            }
        }
        if ( expectRpr )
            // this needs to be caught in the call above this one in order to
            // identify the token that caused this error --
            // this is handled by the try/catch above
            throw new Error( "Unbalanced paren" );
        return output;
    }
    input = ps_expr( input );
    
    // apply negation
    // needs to happen backwards because it's easier to implement right-assoc.
    var idx_neg;
    if ( input[ input.length - 1 ] instanceof token.neg )
        throw input[ input.length - 1 ].error( "Stray negator" );
    for ( var idx_neg = input.length - 2; idx_neg >= 0; idx_neg-- ) {
        if ( input[ idx_neg ] instanceof token.neg )
            input.splice( idx_neg, 2, input[ idx_neg + 1 ].negate() );
    }
    
    // combine OR'ed expressions
    var idx_oro;
    while ( ( idx_oro = input.findIndex( ( tk ) => {
        return tk instanceof token.oro;
    } ) ) !== -1 ) {
        if ( idx_oro === 0 || idx_oro === input.length - 1 )
            throw input[ idx_oro ].error( "Unpaired OR operator" );
        let triplet = input.splice( idx_oro - 1, 3 );
        input.splice( idx_oro - 1, 0, new expr.disj([ triplet[ 0 ], triplet[ 2 ] ]) );
    }
    
    // clean it up
    input = new expr.conj( input ).normalize();
    
    // all terms are implicitly AND'ed -- always return something recursive
    if ( !input.isRecursive() )
        input = new expr.conj([ input ]);
    
    return input;

};

},{"./expr":6,"./lex":7,"./token":12}],9:[function(require,module,exports){
'use strict';
var expr = require( './expr' );
var parse = require( './parse' );
var cartesian = require( 'cartesian' );

const DEFAULTS = {
    max_query_length   : 256,  // maximum string query string length
    max_term_count     : 32,   // maximum number of distinct terms allowed
    max_subquery_count : 8     // maximum number of disjunctive subqueries
};

let assert = {
    subquery_count : ( actual, allowed ) => {
        if ( actual > allowed )
            throw new Error(
                `Query too broad: produces ${actual} subqueries,`
                +  `where ${allowed} are allowed.`
            )
    },
    query_length : ( actual, allowed ) => {
        if ( actual > allowed ) {
            throw new Error(
                `Query too long: query is length ${actual}, `
                + `where ${allowed} is allowed.`
            );
        }
    }
};

/*
    Interface to expose to user: report syntax errors, provide constituent
      queries and answer some aggregate questions about their composition.
*/

module.exports = class query {

    constructor ( raw_query, options ) {
    
        options = Object.assign( {}, DEFAULTS, options );
        
        assert.query_length( raw_query.length, options.max_query_length );
        
        this._raw = raw_query;              // original string query passed
        this._parsed = parse( raw_query );  // parse() result
        this._subqueries = [];              // dissected query, as a list
        
        // edge case: empty queries
        if ( !this._parsed.getChildren().length )
            return this;
        
        // represent all queries as a set of disjunctive subqueries
        // e.g. ( "cars" ( "trains" | "planes" ) )
        //    -> ( "cars" "trains" ) OR ( "cars" "planes" )
        
        if ( this._parsed.getType() === expr.type_ids.disj ) {
        
            // when parse() returns a disj, we can simply pick apart those terms
            
            this._subqueries = this._parsed.getChildren().map( ( child ) => {
                return child.isRecursive() ? child : new expr.conj([ child ]);
            } );
            assert.subquery_count(
                this._subqueries.length,
                options.max_subquery_count
            );
            
        } else {
        
            // separate the expressions which must occur in all subqueries from
            // the conditional ones
        
            let conjunctives = this._parsed.getChildren().filter( ( child ) => {
                return child.getType() !== expr.type_ids.disj;
            }).reduce( ( acc, child ) => {
                return acc.concat( child );
            }, [] );
            
            let disjunctives = this._parsed.getChildren().filter( ( child ) => {
                return child.getType() === expr.type_ids.disj;
            }).map( ( dsj ) => {
                return dsj.getChildren();
            } );
            
            assert.subquery_count(
                disjunctives.reduce( ( acc, dsj ) => {
                    return acc * dsj.length;
                }, 1 ),
                options.max_subquery_count
            );
            
            if ( !disjunctives.length ) {
            
                // if there are no disjunctive terms, there is just one query
                
                this._subqueries = [ new expr.conj( conjunctives ) ];
                
            } else {
            
                // otherwise, the subqueries are the conjunctive terms cat'ed
                // with all combinations of disjunctive terms
                // whether it is truly 'cartesian' is best left to mathematicians
                
                cartesian( disjunctives ).forEach( ( combo ) => {
                    this._subqueries.push( new expr.conj(
                        conjunctives.concat( combo )
                    ).normalize() );
                } );
            
            }
            
            // TODO: canonical subquery ordering?
            
        }
        
    }
    
    toString () {
        return this.toDisjunction().toString( 1 );
    }
    
    getSubqueries () {
        return this._subqueries;
    }
    
    toDisjunction () {
        return new expr.disj( this._subqueries );
    }
    
    // does this query represent all queryable items?
    isUniverse () {
        
        // empty query takes opposite meaning between 'expr' and 'query':
        //   - an 'expr' with no children is zero set
        //   - a 'query' with no subqueries is the universe
        
        return (
            !this._subqueries.length ||
            this.toDisjunction().normalize().isUniverse()
        );
        
    }
    
    // is this query unsatisfiable?
    isZeroSet () {
    
        return (
            !this.isUniverse() &&
            this.toDisjunction().normalize().isZeroSet()
        );
        
    }

};


},{"./expr":6,"./parse":8,"cartesian":1}],10:[function(require,module,exports){
'use strict';
var error = require( './error' );

/*
    A simple tuple that describes where, in a lexer stream, a particular token
    was found and which characters make it up.
*/

module.exports = class site {

    constructor ( begin, end, text ) {
        this._begin = begin;  // beginning of substring in the stream (incl.)
        this._end = end;      // end of substring in stream (excl.)
        this._text = text;    // the substring
    }
    
    getBegin () {
        return this._begin;
    }
    
    getEnd () {
        return this._end;
    }
    
    getText () {
        return this._text;
    }
    
    error ( message ) {
        return new error( this, message );
    }

};


},{"./error":5}],11:[function(require,module,exports){
'use strict';
var site = require( './site.js' );

/*
    A string paired with two marching pointers (indices).
    Helps, with `site`, to pull out substrings and their locations without
      needing client to juggle index numbers.
    Because we want to be able to `peek()` at characters without committing to
      keeping them, the end-bound is -- like `site`'s and like slice() 
      -- exclusive.
*/

module.exports = class stream {

    constructor ( raw ) {
        this._raw = raw || '';
        this._begin = 0;
        this._end = 0;
    }
    
    // have we reached the end of the string?
    done () {
        return this._end === this._raw.length;
    }
    
    // advance 'end' pointer one index
    step () {
        if ( !this.done() )
            this._end++;
        return this;
    }
    
    // what character sits under 'end'?
    peek ( n ) {
        if ( !Number.isInteger( n ) )
            n = Math.floor( n );
        return this._raw[ this._end + ( n || 0 ) ];
    }
    
    // is the `peek()`'ed character in `chars`?
    scan ( chars, n ) {
        return chars.indexOf( this.peek( n || 0 ) ) !== -1;
    }
    
    // pull out the substring between 'begin' and 'end',  return as a site
    // and sync 'begin' to 'end'
    extract () {
        let s = new site(
            this._begin,
            this._end,
            this._raw.slice( this._begin, this._end )
        );
        this._begin = this._end;
        return s;
    }
    
};


},{"./site.js":10}],12:[function(require,module,exports){
'use strict';
var site = require( './site' );
var charmap = require( './charmap' );
var error = require( './error' );

/*
    lexer token types
*/

// lexer token type enumeration
const type_ids = {
    trm : 1,
    tag : 2,
    lpr : 3,
    rpr : 5,
    neg : 7,
    oro : 11,
    wts : 13,
    quo : 17
};

// base, abstract token type
class tok {
    constructor ( tok_site ) {
        if ( !( tok_site instanceof site ) )
            throw new Error( "tok accepts only one site" );
        this._site = tok_site;
    }
    
    getType () {
        return this._type;
    }
    
    getSite () {
        return this._site;
    }
    
    getText () {
        return this.getSite().getText();
    }
    
    error ( msg ) {
        return new error( this.getSite(), msg );
    }
};

// term
class trm extends tok {
    constructor ( trm_site ) {
        super( trm_site );
        this._type = type_ids.trm;
    }
};

// quote
class quo extends tok {
    constructor ( site ) {
        super( site );
        this._type = type_ids.quo;
    }
}

// tag identifier (':')
class tag extends tok {
    constructor( tag_site ) {
        super( tag_site );
        this._type = type_ids.tag;
    }
};

// left parenthesis
class lpr extends tok {
    constructor ( lpr_site ) {
        super( lpr_site );
        this._type = type_ids.lpr;
    }
};

// right parenthesis
class rpr extends tok {
    constructor ( rpr_site ) {
        super( rpr_site );
        this._type = type_ids.rpr;
    }
};

// negation operator ('!', '-')
class neg extends tok {
    constructor ( neg_site ) {
        super( neg_site );
        this._type = type_ids.neg;
    }
};

// disjunctive operator ('|')
class oro extends tok {
    constructor ( oro_site ) {
        super( oro_site );
        this._type = type_ids.oro;
    }
};

// whitespace
class wts extends tok {
    constructor ( wts_site ) {
        super( wts_site );
        this._type = type_ids.wts;
    }
};

module.exports = {
    tok : tok,
    trm : trm,
    quo : quo,
    tag : tag,
    lpr : lpr,
    rpr : rpr,
    neg : neg,
    oro : oro,
    wts : wts,
    type_ids : type_ids
};

},{"./charmap":4,"./error":5,"./site":10}],"/index.js":[function(require,module,exports){
var query = require( './src/query' );

module.exports = ( txt_query ) => {

    return (new query( txt_query ) );
    
};

},{"./src/query":9}]},{},[])("/index.js")
});
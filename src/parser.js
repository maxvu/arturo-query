'use strict';

var expr = require( './expr.js' );
var disj = expr.disj;
var conj = expr.conj;
var term = expr.term;
var ormk = expr.ormk;

const I_WHITESPACE = " \n\t\v\r"; // ASCII whitespace
const I_NEGATION = "!-n";         // negators '!', '-' and 'not'
const I_NOT = 'not';              // literal, spelled-out "not"
const I_OR = 'or';                // literal, spelled-out "or"
const I_BAREINT = "\"'()|";       // characters that will interrupt bare terms
const I_TERMPAREN = ')';          // character that will end a paren-bound expr
const I_QUOTES = "\"'";           // characters that will open quoted terms
const I_QUOTEESC = "\\";          // characters that will escape quoted chars

class parser {
    constructor ( raw ) {
        if ( !( raw instanceof String ) && typeof raw !== 'string' )
            throw new Error( "parser only accepts String" );
        this.raw = raw;
        this.i = 0;
        this._debug = false;
    }
    
    // character at current index
    _c ( n ) {
        return this.raw[ this.i + ( n || 0 ) ];
    }
    
    // have reached the end of the stream?
    _end () {
        return this.i >= this.raw.length;
    }
    
    _step ( n ) {
        this.i += ( n || 1 );
    }
    
    // dispatch a debug message to the console
    _dbg ( msg ) {
        if ( !this._debug ) return;
        console.log( `DEBUG: ${msg}` );
    }
    
    // for debugging, print the intermediate state of the parser output
    _dump () {
        var marker = '';
        for ( var i = 0; i < this.i + 1; i++ )
            marker += ' ';
        marker += '^';
        this._dbg( ` [${this.raw}] (idx=${this.i}/${this.raw.length})` );
        this._dbg( ` ${marker}` );
    }
    
    debug () {
        this._debug = true;
        return this;
    }
    
    // set it off
    parse () {
        return this.ps_query();
    }
    
    // parse an entire expression -- root level or paren-braced
    ps_query () {
        /*
            offload 'OR' parsing to a kind of higher-level symbol:
                look ahead two symbols
                if you encounter an OR, then drop the last item and add instead
                  a disjunction wrapping both it and the current item.
                impose the following rules:
                  'or' terms cannot begin or end an expression
                  two 'or' terms cannot occur consecutively
        */
        let buf = [];
        while ( !this._end() && this._c() != I_TERMPAREN ) {
            let b = this.ps_expr();
            if ( b._type !== expr.types.T_ORMK ) {
                buf.push( b );
                this.ps_ws();
                continue;
            }
            if ( buf.length === 0 )
                throw new Error( 'dangling or (start of query)' );
            let pos_b = this.i;
            let c = this.ps_expr();
            if ( c === null )
                throw new Error( 'dangling or (end of query)' );
            if ( c._type === expr.types.T_ORMK )
                throw new Error( 'two consecutive or\'s' );
            buf.push( new disj([ buf.pop(), c ]) );
            this.ps_ws();
        }        
        return new conj( buf );
    }
    
    // parse a (possibly-recursing) expression
    ps_expr () {
        // expr -> _ ( quoted | neg | paren | disj | term ) _
        this.ps_ws();
        this._dump();
        if ( this._end() ) {
            this._dbg( 'end of stream' );
            return null;
        }
        if ( this.peek_or() !== false ) {
            this.ps_or();
            return new ormk();
        } else if ( I_QUOTES.indexOf( this._c() ) !== -1 ) {
            return this.ps_quoted();
        } else if ( I_NEGATION.indexOf( this._c().toLowerCase() ) !== -1 ) {
            return this.ps_neg();
        } else if ( this._c() === '(' ) {
            return this.ps_paren();
        } else {
            return this.ps_bare();
        }
    }
    
    // skip whitespace
    ps_ws () {
        let begin = this.i;
        while ( I_WHITESPACE.indexOf( this._c() ) !== -1 )
            this._step();
        return begin === this.i;
    }
    
    // parse a quoted term
    ps_quoted () {
        this._dbg( 'quoted term' );
        let open = this.i;
        this._step();
        while ( !this._end() ) {
            if (
                this._c() === this.raw[ open ] &&
                I_QUOTEESC.indexOf( this.raw[ this.i - 1 ] ) === -1
            ) {
                break;
            }
            this._dbg( `quoted char (${this.raw[ this.i ]})` );
            this._dump();
            this._step();
        }
        if ( this._c() !== this.raw[ open ] )
        throw new Error( `unterminated quote (${this.raw[ open ]})` );
        this._step();
        let term_id = this.raw.slice( open + 1, this.i - 1 ).replace(
            new RegExp( '\\\\"' ), '"'
        ).replace(
            new RegExp( "\\\'" ), "'"
        );
        if ( term_id.length === 0 )
            return new conj([ ]);
        return new term( term_id );
    }
    
    // parse a negated expression (and toggle its flag)
    ps_neg () {
        this._dbg( 'negated term' );
        // get the negation operator
        if ( this._c() === '!' || this._c() === '-' ) {
            this._step();
        } else {
            // don't get confused with a term that begins with NOT...
            let term = this.ps_bare();
            if ( term.getId().toLowerCase() !== I_NOT )
                return term;
        }
        // get the expression to be negated
        let e;
        if ( ( e = this.ps_expr() ) !== null )
            return e.negate();
        throw new Error( "no expression to negate" );
    }
    
    // parse a recursing, parenthetical term
    ps_paren () {
        this._dbg( 'paranthetical' );
        this._step();
        this.ps_ws();
        let e = this.ps_query();
        this.ps_ws();
        if ( this._c() !== I_TERMPAREN )
            throw new Error( 'unterminted paranthetical' );
        this._dbg( 'paranthetical, end' );
        this._step();
        return e;
    }
    
    // parse an unquoted term
    ps_bare () {
        this._dbg( 'bare term' );
        this.ps_ws();
        let start = this.i;
        while (
            !this._end() &&
            I_BAREINT.indexOf( this._c() ) === -1 &&
            I_WHITESPACE.indexOf( this._c() ) === -1
        ) {
            this._dbg( `bare char (${this.raw[ this.i ]})` );
            this._step();
        }
        this._dump();
        let substr = this.raw.slice( start, this.i );
        if ( substr.toLowerCase() === I_OR )
            return new ormk;
        return new term( this.raw.slice( start, this.i ) );
    }
    
    // is an or marker coming next?
    peek_or () {
        if ( this._c() === '|' )
            return true;
        let begin = this.i;
        try {
            let term = this.ps_bare();
            this.i = begin;
            return term instanceof or;
        } catch ( e ) {
            return false;
        }
    }
    
    // parse an or marker
    // cannot be called without first checking with peek_or()
    ps_or ( suppress_dbg ) {
        if ( !suppress_dbg )
            this._dbg( 'OR marker' );
        if ( this.raw[ this.i ] === '|' ) {
            this._step();
        } else {
            this.ps_bare();
        }
    }
};

module.exports = parser;

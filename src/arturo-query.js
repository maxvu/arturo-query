'use strict';

var util = require( 'util' );

const WHITESPACE = " \n\t\v\r";
const BARE_INTERRUPT = "\"'()|";
const QUOTES = "\"'";
const NEGATORS = "n-!";
const PARENS = "()";
const ORS = "|o";

class term {
    constructor ( id ) {
        if (
            ! typeof id === 'string' &&
            ! id instanceof String
        ) {
            throw `invalid term: '${id}'`;
        } else if ( id.length === 0 ) {
            throw 'invalid, empty term';
        }
        this.id = id;
    }
};

class expr {
    constructor ( subexprs ) {
        this._children = [];
        if ( subexprs instanceof Array )
            this._children = subexprs;
        this.negated = false;
    }
    negate () {
        this.negated = !this.negated;
    }
};

class conj extends expr {
    constructor ( subexprs ) {
        super( subexprs );
    }
};

// TODO: remove
function dbg ( msg ) {
    console.log( `DBG: ${msg}` );
}

class parser {
    constructor ( raw_query ) {
        dbg( 'parser init' );
        this.i = 0;
        this.raw = raw_query;
        this.q = this.ps_query();
    }
    
    static parse ( raw_query ) {
        try {
            return (new parser( raw_query )).q;
        } catch ( e ) {
            return null;
        }
    }
    
    _c () { return this.raw[ this.i ]; }
    _end () { return this.i === this.raw.length; }
    _step ( n ) {
        n = n || 1;
        this.i += n;
    }
    
    ps_query () {
        dbg( 'ps_query()' );
        let buf = [];
        while ( !this._end() && this._c() !== ')' ) {
            this.ps_ws();
            buf.push( this.ps_expr() );
            this.ps_ws();
        }
        return new expr( buf );
    }
    
    ps_expr () {
        dbg( `ps_expr(), char '${this._c()}'` );
        // expr -> _ ( quoted | neg | paren | or | term ) _
        if ( QUOTES.indexOf( this._c() ) !== -1 ) {
            return this.ps_quoted();
        } else if ( NEGATORS.indexOf( this._c().toLowerCase() ) !== -1 ) {w
            return this.ps_neg();
        } else if ( this._c() === '(' ) {
            return this.ps_paren();
        } else {
            return this.ps_bare();
        }
    }
    
    ps_ws () {
        dbg( 'ps_ws():' );
        var begin = this.i;
        while ( WHITESPACE.indexOf( this._c() ) !== -1 )
            this._step();
        return this.i !== begin;
    }
    
    ps_quoted () {
        dbg( `ps_quoted(), '${this.raw[ this.i + 1 ]}'` );
        let open = this.i;
        this._step();
        while ( !this._end() && this._c() !== this.raw[ open ] )
            this._step();
        if ( this._c() === this.raw[ open ] ) {
            this.i++;
            return new expr([
                new term( this.raw.slice( open + 1, this.i - 1 ) )
            ]);
        }
        throw `unterminated quote (${this.raw[ open ]})`;
    }
    
    ps_neg () {
        dbg( 'ps_neg():' );
        if ( this._c() === '!' || this._c() === '-' )
            this._step();
        else if ( this.raw.slice( i, i + 3 ).toLowerCase() === 'not' )
            this._step( 3 );
        this.ps_ws();
        let e = ps_expr();
        if ( e instanceof expr )
            return e.negate();
        else
            throw 'dangling not';
    }
    
    ps_paren () {
        dbg( 'ps_paren():' );
        this._step();
        this.ps_ws();
        let e = this.ps_query();
        this.ps_ws();
        if ( this._c() !== ')' )
            throw 'unterminted paranthetical';
        this._step();
        return e;
    }
    
    ps_bare () {
        dbg( `ps_bare(), char '${this._c()}'` );
        let start = this.i;
        while (
            !this._end() &&
            BARE_INTERRUPT.indexOf( this._c() ) === -1 &&
            WHITESPACE.indexOf( this._c() ) === -1
        ) this._step();  
        return new expr([
            new term( this.raw.slice( start, this.i ) )
        ]);
    }
    
    ps_or () {
        
    }
    
};

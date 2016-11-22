'use strict';
var util = require( 'util' );

const I_WHITESPACE = " \n\t\v\r"; // ASCII whitespace
const I_NEGATION = "!-n";         // negators '!', '-' and 'not'
const I_BAREINT = "\"'()|";       // characters that will interrupt bare terms
const I_TERMPAREN = ')';
const I_QUOTES = "\"'";

const T_CONJ = 0;
const T_DISJ = 1;
const T_OR = 2;
const T_TERM = 3;

class expr {
    constructor ( subexprs ) {
        this._children = [];
        if ( subexprs instanceof Array )
            this._children = subexprs;
        this.negated = false;
    }
    
    negate () {
        this.negated = !this.negated;
        return this;
    }
    
    getType () {
        return T_CONJ;
    }
    
    getSize () {
        let totalSize = 0;
        this._children.forEach( ( child ) => {
            if ( child instanceof expr ) {
                totalSize += child.getSize();
            } else if ( child instanceof term ) {
                totalSize++;
            }
        } );
        return totalSize;
    }
    
    isRecursive () {
        return true;
    }
    
    isNegated () {
        return this.negated ? true : false;
    }
    
    getCanonical () {
        let canonical = '';
        if ( this.negated )
            canonical += '!';
        canonical += '( ';
        this._children.forEach( ( child ) => {
            canonical += child.getCanonical();
            if ( child !== this._children[ this._children.length - 1 ] )
                canonical += this._infix();
        } );
        canonical += ' )';
        return canonical;
    }
    
    refactor () {
        let clone = new expr;
        Object.assign( clone, this );
        
        // AND and OR have the distributive property -- flatten those out
        let flattened = [];
        clone._children.forEach( ( child ) => {
            if ( child.getType() === this.getType() ) {
                child._children.forEach( ( grandchild ) => {
                    flattened.push(
                        child.negated ? grandchild.negate() : grandchild
                    );
                } );
            } else {
                flattened.push( child );
            }
        } );
        clone._children = flattened;
        
        // expressions can be replaced with their only child
        flattened = [];
        clone._children.forEach( ( child ) => {
            if ( child._children.length === 1 ) {
                flattened.push(
                    child.isNegated()
                        ? child._children[ 0 ].negate()
                        : child._children[ 0 ]
                );
            } else {
                flattened.push( child );
            }
        } );
        clone._children = flattened;
        
        // top-down order
        clone._children.forEach( ( child ) => {
            child.refactor();
        } );
        
        return clone;
    }
    
    satisfies ( condition ) {
        if ( !condition( this ) )
            return;
        var toggle = true;
        this._children.forEach( ( child ) => {
            if ( !condition( child ) )
                toggle = false;
                return;
        } );
        return toggle;
    }
    
    _infix () {
        return ' ';
    }
};

class term extends expr {
    constructor ( id ) {
        super([]);
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
    
    getType() {
        return T_TERM;
    }
    
    isRecursive () {
        return false;
    }
    
    getCanonical () {
        var escaped = this.id.replace( /"/, "\"" );
        return ( this.negated ? '-' : '' ) + '"' + escaped + '"';
    }
};

class disj extends expr {
    constructor ( subexprs ) {
        super( subexprs );
    }
    getType () {
        return T_DISJ;
    }
    _infix () {
        return ' OR ';
    }
};

class or extends expr {
    constructor () {
        super();
    }
    getType () {
        return T_OR;
    }
    isRecursive () {
        return false;
    }
}

class parser {
    constructor ( raw ) {
        this.raw = raw;
        this.i = 0;
        this.debug = false;
    }
    
    _c () {
        return this.raw[ this.i ];
    }
    
    _end () {
        return this.i >= this.raw.length;
    }
    
    _step ( n ) {
        this.i += ( n || 1 );
    }
    
    _dbg ( msg ) {
        if ( !this.debug ) return;
        console.log( `DEBUG: ${msg}` );
    }
    
    _dump () {
        var marker = '';
        for ( var i = 0; i < this.i + 1; i++ )
            marker += ' ';
        marker += '^';
        this._dbg( ` [${this.raw}] (idx=${this.i}/${this.raw.length})` );
        this._dbg( ` ${marker}` );
    }
    
    parse () {
        return this.ps_query();
    }
    
    ps_query () {
        let buf = [];
        while ( !this._end() && this._c() != I_TERMPAREN ) {
            let b = this.ps_expr();
            if ( b instanceof expr && b.getType() !== T_OR ) {
                buf.push( b );
                this.ps_ws();
                continue;
            }
            if ( buf.length === 0 )
                throw 'dangling or (start of query)';
            if ( buf[ buf.length - 1 ].getType() === T_OR )
                throw 'two consecutive or\'s';
            let pos_b = this.i;
            let c = this.ps_expr();
            if ( c === null )
                throw 'dangling or (end of query)';
            if ( c.getType() === T_OR )
                throw 'two consecutive or\'s';
            buf.push( new disj([ buf.pop(), c ]) );
            this.ps_ws();
        }
        return new expr( buf );
    }
    
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
            return new or();
        } else if ( I_QUOTES.indexOf( this._c() ) !== -1 ) {
            return this.ps_quoted();
        } else if ( I_NEGATION.indexOf( this._c().toLowerCase() ) !== -1 ) {
            return this.ps_neg();
        } else if ( this._c() === '(' ) {
            return this.ps_paren();
        } else {
            return this.ps_bare();
        }
        ps_ws();
    }
    
    ps_ws () {
        let begin = this.i;
        while ( I_WHITESPACE.indexOf( this._c() ) !== -1 )
            this._step();
        return begin === this.i;
    }
    
    ps_quoted () {
        this._dbg( 'quoted term' );
        let open = this.i;
        this._step();
        while ( !this._end() && this._c() !== this.raw[ open ] )
            this._step();
        if ( this._c() !== this.raw[ open ] )
        throw `unterminated quote (${this.raw[ open ]})`;
        this._step();
        return new expr([
            new term( this.raw.slice( open + 1, this.i - 1 ) )
        ]);
    }
    
    ps_neg () {
        this._dbg( 'negated term' );
        if ( this._c() === '!' || this._c() === '-' )
            this._step();
        else if ( this.raw.slice( this.i, this.i + 3 ).toLowerCase() === 'not' )
            this._step( 3 );
        try {
            return new expr([ this.ps_expr().negate() ]);
        } catch ( e ) {
            throw typeof e === 'string'
                ? 'dangling not' :
                `dangling not (${e})`;
        }
            
    }
    
    ps_paren () {
        this._dbg( 'paranthetical' );
        this._step();
        this.ps_ws();
        let e = this.ps_query();
        this.ps_ws();
        if ( this._c() !== I_TERMPAREN )
            throw 'unterminted paranthetical';
        this._dbg( 'paranthetical, end' );
        this._step();
        return e instanceof expr ? e : null;
    }
    
    ps_bare () {
        this._dbg( 'bare term' );
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
        return new expr([
            new term( this.raw.slice( start, this.i ) )
        ]);
    }
    
    peek_or () {
        let begin = this.i;
        let ans = this.ps_or( true );
        this.i = begin;
        return ans;
    }
    
    ps_or ( suppress_dbg ) {
        if ( !suppress_dbg )
            this._dbg( 'OR marker' );
        if ( this.raw.substr( this.i, 2 ).toLowerCase() === 'or' ) {
            this._step( 2 );
            return true;
        } else if ( this.raw[ this.i ] === '|' ) {
            this._step();
            return true;
        } else {
            return false;
        }
    }
};

// TODO: get rid of
var x = [
    'hello world',
    'another test',
    'austin "danger" powers',
    'George Herman"Babe"Ruth',
    "  Ivan('the terrible')IV  ",
    'John ( not McDermott ) ( !"Big Bad John" -England)',
    "Allan or 'White Lightening' or Donald"
];
x.forEach( ( item ) => {
    let ps = (new parser( item ));
    //ps.debug = true;
    var q = ps.parse();
    console.log(
        util.inspect( [
            q, q.getCanonical(),
            q.refactor(), q.refactor().getCanonical()
        ], { depth: 10, colors: true } )
    );
} );


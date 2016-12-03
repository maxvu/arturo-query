'use strict';

const I_WHITESPACE = " \n\t\v\r"; // ASCII whitespace
const I_NEGATION = "!-n";         // negators '!', '-' and 'not'
const I_BAREINT = "\"'()|";       // characters that will interrupt bare terms
const I_TERMPAREN = ')';          // character that will end a paren-bound expr
const I_QUOTES = "\"'";           // characters that will open quoted terms

const T_CONJ = 0;
const T_DISJ = 1;
const T_OR = 2;
const T_TERM = 3;

// A root class describing anything that can exist in a query.
// This would've probably been better modeled using 'conj' and 'disj' as child
// classes, but I found flipping the '_type' flag easier to implement.
class expr {

    constructor ( subexprs ) {
        this._children = [];
        if ( subexprs instanceof Array )
            this._children = subexprs;
        else if ( typeof subexprs !== 'undefined' && subexprs !== null )
            if ( typeof subexprs === 'string' || subexprs instanceof String )
                throw new Error( `expr constructor: ${subexprs} is not an array` );
            else
                throw new Error( `expr instantiated with non-array constructor argument` );
        this._negated = false;
        this._valid = true;
        this._type = T_CONJ;
    }
    
    getChildren () {
        return this._children;
    }
    
    getType () {
        return this._type;
    }
    
    isNegated () {
        return this._negated;
    }
    
    // flip the _negated flag and apply De Morgan's
    negate () {
        if ( this.isDisjunction() ) {
            this.forEach( ( child ) => {
                child = child.negate();
            } );
            this.makeConjunction();
        } else if ( this.isConjunction() ) {
            this.forEach( ( child ) => {
                child = child.negate();
            } );
            this.makeDisjunction();
        }
        this._negated = !this._negated;
        return this;
    }
    
    // "can contain child elements"
    isRecursive () {
        return true;
    }
    
    // number of children
    getSize () {
        return this._children.length;
    }
    
    isValid () {
        return this._valid;
    }
    
    getError () {
        return this._error;
    }
    
    invalidate ( msg ) {
        this._valid = false;
        this._error = msg;
        return this;
    }
    
    // number of distinct terms
    getCardinality () {
        let sum = 0;
        this.forEach( ( child ) => {
            if ( child.isRecursive() )
                sum += child.getCardinality();
            else
                sum += 1;
        } );
    }
    
    makeConjunction () {
        this._type = T_CONJ;
        return this;
    }
    
    makeDisjunction () {
        this._type = T_DISJ;
        return this;
    }
    
    isConjunction () {
        return this._type === T_CONJ;
    }
    
    isDisjunction () {
        return this._type === T_DISJ;
    }
    
    hasConjunctions () {
        if ( this._type === T_CONJ )
            return true;
        this.forEach( ( child ) => {
            if ( child.hasConjunctions() )
                return true;
        } );
        return false;
    }
    
    hasDisjunctions () {
        if ( this._type === T_DISJ )
            return true;
        this.forEach( ( child ) => {
            if ( child.hasDisjunctions() )
                return true;
        } );
        return false;
    }
    
    // splay terms into disjunctions-of-conjunctions while forcing negation
    // operators to act on search terms instead of sets
    // should be idempotent
    refactor () {
        
        // Distribute NOTs
        this.forEach( ( child ) => {
            if ( child.isRecursive() && child.isNegated() )
                child.negate();
        } );
        
        // Distribute ANDs
        if ( this.isConjunction() ) {
            this.forEach( ( child ) => {
                if ( child.isConjunction() && !child.hasDisjunctions() ) {
                    if ( child.isNegated() )
                        child.negate();
                    this.replaceChildWith( child, child._children );
                }
            } );
        }
        
        // Distribute ORs
        if ( this.isDisjunction() ) {
            this.forEach( ( child ) => {
                if ( child.isDisjunction() && !child.hasConjunctions() ) {
                    if ( child.isNegated() )
                        child.negate();
                    this.replaceChildWith( child, child._children );
                }
            } );
        }
        
        // Recurse top-down
        this.forEach( ( child ) => {
            child = child.refactor();
        } );
        
        // Topmost-layer trim
        return this.trim();
        
    }
    
    // unnecessary, but cleans up a little bit
    forEach ( fn ) {
        this._children.forEach( fn );
        return this;
    }
    
    // trim empty recursive items and superfluous nesting
    trim () {
        this.forEach( ( child ) => {
            if ( !child.isRecursive() )
                return;
            let idx = this._children.indexOf( child );
            if ( child.getSize() === 0 )
                this._children.splice( idx, 1 );
            else if ( child.getSize() === 1 ) {
                this._children[ idx ] = child._children[ 0 ];
            }
        } );
        if ( this.getSize() === 1 && !this.isNegated() )
            return this._children[ 0 ];
        return this;
    }
    
    // not strictly necessary but preserves order
    replaceChildWith ( child, replacements ) {
        Array.prototype.splice.apply( this._children, [
            this._children.indexOf( child ),
            1
        ].concat(
            replacements
        ) );
    }
    
    // canonical string representation
    getCanonical ( constituent ) {
        let canonical = '';
        if ( this._negated )
            canonical += this.isRecursive() ? '!' : '-';
        if ( constituent )
            canonical += '( ';
        this.forEach( ( child ) => {
            canonical += child.getCanonical( true );
            if ( child !== this._children[ this._children.length - 1 ] )
                canonical += this.getInfix();
        } );
        if ( constituent )
            canonical += ' )';
        return canonical;
    }
    
    getInfix () {
        switch ( this._type ) {
            case T_CONJ: return ' '; break;
            case T_DISJ: return ' OR '; break;
        }
        return ' . ';
    }
    
};

// Leaf node describing a (possibly-negated) search term
class term extends expr {
    
    constructor ( id ) {
        super();
        if ( typeof id !== 'string' && !( id instanceof String ) ) {
            throw new Error( `invalid, non-string term id ${id}` );
        } else if ( id.length === 0 ) {
            throw new Error( 'invalid, empty term' );
        }
        this._id = id;
        this._type = T_TERM;
    }
    
    getId () {
        return this._id;
    }
    
    getCanonical () {
        var escaped = this._id.replace( /"/, "\"" );
        return ( this._negated ? '-' : '' ) + '"' + escaped + '"';
    }
    
    isRecursive () {
        return false;
    }
    
    refactor () {
        return this;
    }
    
};

// Stub representing disjunctive-term "OR" markers that are used only by the 
// parser and should not appear in any result.
class or extends expr {
    constructor () {
        super();
        this._type = T_OR;
    }
}

// The meat and potatoes.
class parser {
    constructor ( raw ) {
        this.raw = raw;
        this.i = 0;
        this.debug = false;
    }
    
    // character at current index
    _c () {
        return this.raw[ this.i ];
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
        if ( !this.debug ) return;
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
    
    // set it off
    parse () {
        return this.ps_query();
    }
    
    // parse an entire expression -- root level or paren-braced
    ps_query () {
        /*
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
            if ( b instanceof expr && b.getType() !== T_OR ) {
                buf.push( b );
                this.ps_ws();
                continue;
            }
            if ( buf.length === 0 )
                throw new Error( 'dangling or (start of query)' );
            if ( buf[ buf.length - 1 ].getType() === T_OR )
                throw new Error( 'two consecutive or\'s' );
            let pos_b = this.i;
            let c = this.ps_expr();
            if ( c === null )
                throw new Error( 'dangling or (end of query)' );
            if ( c.getType() === T_OR )
                throw new Error( 'two consecutive or\'s' );
            buf.push( new expr([ buf.pop(), c ]).makeDisjunction() );
            this.ps_ws();
        }        
        return new expr( buf );
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
        while ( !this._end() && ( this._c() !== this.raw[ open ] ) )
            this._step();
        if ( this._c() !== this.raw[ open ] )
        throw new Error( `unterminated quote (${this.raw[ open ]})` );
        this._step();
        return new term( this.raw.slice( open + 1, this.i - 1 ) );
    }
    
    // parse a negated expression (and toggle its flag)
    ps_neg () {
        this._dbg( 'negated term' );
        if ( this._c() === '!' || this._c() === '-' )
            this._step();
        else if ( this.raw.slice( this.i, this.i + 3 ).toLowerCase() === 'not' )
            this._step( 3 );
        try {
            // The negate() term does the refactor() folding later --
            // it's enough to just tickle the flag for now.
            let e = this.ps_expr();
            e._negated = true;
            return e;
        } catch ( e ) {
            throw ( typeof e === 'string' || e instanceof String )
                ? new Error( 'dangling not' ) :
                new Error( `dangling not (${e})` );
        }
            
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
        return e instanceof expr ? e : null;
    }
    
    // parse an unquoted term
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
        return new term( this.raw.slice( start, this.i ) );
    }
    
    // is an or marker coming next?
    peek_or () {
        let begin = this.i;
        let ans = this.ps_or( true );
        this.i = begin;
        return ans;
    }
    
    // parse an or marker
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

module.exports = {
    'parse' : ( raw_query ) => {
        return (new parser( raw_query )).parse().refactor();
    },
    'parse_safe' : ( raw_query ) => {
        try {
            return (new parser( raw_query )).parse().refactor();
        } catch ( e ) {
            return (new expr).invalidate( e );
        }
    },
    parser : parser
};


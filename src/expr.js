'use strict';

// Enumerable for expr types
const T_CONJ = 1;
const T_DISJ = 2;
const T_TERM = 3;

// How to print, for toString()
const C_TERM_NEGATE = '-';
const C_EXPR_NEGATE = '!';
const C_CONJ_JOIN = ' ';
const C_DISJ_JOIN = ' OR ';

class expr {
    
    // can be empty or with constituent expr parts
    constructor ( subexprs ) {
        this._children = [];
        if ( subexprs instanceof Array && subexprs.some( ( item ) => {
            return !( item instanceof expr );
        } ) ) {
            throw new Error( "`expr` constructed with non-expr children" );
        } else if ( subexprs instanceof Array ) {
            this._children = subexprs;
        } else if ( typeof subexprs !== 'undefined' ) {
            throw new Error( "`expr` constructed with non-Array object" );
        }
        this._negated = false;
    }
    
    isNegated () {
        return this._negated;
    }
    
    // for immutability
    getChildren () {
        return this._children;
    }
    
    // number of terms (although perhaps not distinct)
    getTermCount () {
        return this._children.reduce( ( acc, val ) => {
            return acc + val.getTermCount();
        }, 0 ) + ( this._type === T_TERM ? 1 : 0 );
    }
    
    forEach ( fn ) {
        this._children.forEach( fn );
        return this;
    }
    
    trim () {
        this.forEach( ( child ) => {
            if ( !child.isRecursive() )
                return;
            let idx = this.getChildren().indexOf( child );
            if ( child.getSize() === 0 )
                this._children.splice( idx, 1 );
            else if ( child.getSize() === 1 )
                this._children[ idx ] = child._children[ 0 ];
        } );
        if ( this.getChildren().length === 1 ) {
            if ( this.isNegated() )
                return this._children[ 0 ].negate();
            return this._children[ 0 ];
        }
    }
    
};

class term extends expr {
    
    constructor ( id ) {
        super();
        if ( typeof id === 'undefined' ) {
            throw new Error( "`term` constructed with no `id`" );
        } else if ( !( id instanceof String ) && typeof id !== 'string' ) {
            throw new Error( "`term` constructed with non-String arg" );
        } else if ( id.length <= 0 ) {
            throw new Error( "`term` constructed with empty `id` string" );
        } else {
            this._id = id;
        }
        this._type = T_TERM;
    }
    
    getId () {
        return this._id;
    }
    
    isRecursive () {
        return false;
    }
    
    isNegated () {
        return this._negated;
    }
    
    negate () {
        this._negated = !this._negated;
        return this;
    }
    
    toString () {
        return ( this._negated ? C_TERM_NEGATE : '' ) + this._id;
    }
    
};

class conj extends expr {

    constructor ( terms ) {
        super( terms );
        this._type = T_CONJ;
    }
    
    isRecursive () {
        return true;
    }
    
    negate () {
        if ( this.getChildren().length === 0 )
            return this;
        if ( this.getChildren().length === 1 ) {
            this._children[ 0 ].negate();
            return this;
        }
        return new disj(
            this.getChildren().map( ( x ) => {
                return x.negate();
            } )
        )
    }
    
    toString ( topmost ) {
        let inside = this.getChildren().map( ( cld ) => {
            return cld.toString();
        } ).join( C_CONJ_JOIN );
        return (
            this.isNegated() ? C_EXPR_NEGATE : ''
        ) + (
            topmost ? inside : '(' + inside + ')'
        );
    }

};

class disj extends expr {

    constructor ( terms ) {
        super( terms );
        this._type = T_DISJ;
    }
    
    isRecursive () {
        return true;
    }
    
    negate () {
        if ( this.getChildren().length === 0 )
            return this;
        if ( this.getChildren().length === 1 ) {
            this._children[ 0 ] = this._children[ 0 ].negate();
            return this;
        }
        return new conj(
            this.getChildren().map( ( x ) => {
                return x.negate();
            } )
        )
    }
    
    toString ( topmost ) {
        let inside = this.getChildren().map( ( cld ) => {
            return cld.toString();
        } ).join( C_DISJ_JOIN );
        return (
            this.isNegated() ? C_EXPR_NEGATE : ''
        ) + (
            topmost ? inside : '(' + inside + ')'
        );
    }

};

module.exports = {
    term : term,
    conj : conj,
    disj : disj
};
// ...expr intentionally left out

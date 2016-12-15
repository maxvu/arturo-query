'use strict';
var token = require( './token' );

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
    
    isRecursive () {
        return false;
    }
    
    normalize () {
        return this;
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
        return outtermost ? '( ' + inner + ' )' : inner;
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
        );
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
        return neg + `'${this.getAttr()}':'${this.getVal()}'`;
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


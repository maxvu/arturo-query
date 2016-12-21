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
        ng._negated = !this._negated;
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


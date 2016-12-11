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
    
    isRecursive () {
        return true;
    }
    
};

class conj extends rcrs {

    constructor ( subexprs ) {
        super( subexprs );
        this._type = type_ids.conj;
    }

};

class disj extends rcrs {

    constructor ( subexprs ) {
        super( subexprs );
        this._type = type_ids.disj;
    }

};

class term extends expr {
    
    constructor ( trm ) {
        if ( !( trm instanceof token.trm ) )
            throw new Error( "'term' expression accepts only a token 'trm'" );
        super([ trm ]);
        this._type = type_ids.term;
    }
    
    getId () {
        return this._tokens[ 0 ].getText();
    }
    
};

class tagp extends expr {

    constructor ( tokens ) {
        if (
            ( !( tokens instanceof Array ) && typeof tokens !== 'array' ) ||
            tokens.length !== 3 ||
            !( tokens[ 0 ] instanceof token.trm ) ||
            !( tokens[ 1 ] instanceof token.tag ) ||
            !( tokens[ 2 ] instanceof token.trm )
        ) {
            throw new Error( "tagp accepts only a term-tag-term triplet" );
        }
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

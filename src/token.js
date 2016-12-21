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

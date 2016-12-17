'use strict';
var token = require( './token' );
var lex = require( './lex' );
var expr = require( './expr' );

/*
    Transform a list of lexer tokens into a expr-symbols.
*/

const T_NOT = 'not';
const T_OR  = 'or';

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
        if ( triplet[ 0 ].isNegated() )
            tag = tag.negate();
        input.splice( idx_tag - 1, 0, tag );
    }
    
    // fold parenthetical groups, recursive descent
    function ps_expr ( input, expectRpr ) {
        let output = [];
        while ( input.length ) {
            let curr = input.shift();
            if ( curr instanceof token.lpr ) {
                let subexpr = parse( ps_expr( input, true ) );
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
            throw new Error( "Unbalanced paren" );
        return output;
    }
    input = ps_expr( input );
    
    // apply negation
    var idx_neg;
    while ( ( idx_neg = input.findIndex( ( tk ) => {
        return tk instanceof token.neg;
    } ) ) !== -1 ) {
        if ( idx_neg === input.length - 1 )
            throw input[ idx_neg ].error( "Stray negator" );
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
        input.splice( idx_oro, 0, new expr.disj([ triplet[ 0 ], triplet[ 2 ] ]) );
    }
    
    // implicit AND
    input = (new expr.conj( input )).normalize();
    
    return input;

};

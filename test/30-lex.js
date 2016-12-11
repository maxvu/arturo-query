'use strict';
var should = require( 'should' );
var lex = require( '../src/lex' );
var error = require( '../src/error' );

function lexdump ( raw ) {
    let result = lex( raw );
    if ( result instanceof Error )
        throw error;
    return result.reduce( ( acc, curr ) => {
        if ( curr === null )
            return acc.concat([ 'null' ]);
        acc.push(
            curr.constructor.name + '(' + curr.getText() + ')'
        );
        return acc;
    }, [] ).join( ' ' );
}

describe( 'lex', function () {

    it( 'should load', function () {
        lexdump( '' ).should.equal( '' );
    } );
    
    it( 'should parse whitespace correctly', function () {
        lexdump( '   ' ).should.equal( 'wts(   )' );
        lexdump( 'a b' ).should.equal( 'trm(a) wts( ) trm(b)' );
        lexdump( 'a\nb' ).should.equal( 'trm(a) wts(\n) trm(b)' );
        lexdump( 'a\tb' ).should.equal( 'trm(a) wts(\t) trm(b)' );
        lexdump( 'a\vb' ).should.equal( 'trm(a) wts(\v) trm(b)' );
        lexdump( 'a\rb' ).should.equal( 'trm(a) wts(\r) trm(b)' );
        
    } );
    
    it( 'should parse quoted terms correctly', function () {
        lexdump( '"abc"' ).should.equal( 'quo(") trm(abc) quo(")' );
        lexdump( "'abc'" ).should.equal( "quo(') trm(abc) quo(')" );
        lexdump( "' (abc) '" ).should.equal( "quo(') trm( (abc) ) quo(')" );
    } );
    
    it( 'should throw on unmatched quotes', function () {
        ( () => { lexdump( '"' ) } ).should.throw();
        ( () => { lexdump( 'a !" ()  \'' ) } ).should.throw();
        ( () => { lexdump( '!--&\'^% ' ) } ).should.throw();
    } );
    
    it( 'should parse parens correctly', function () {
        lexdump( '(t)' ).should.equal( 'lpr(() trm(t) rpr())' );
        lexdump( 'a(b)' ).should.equal( 'trm(a) lpr(() trm(b) rpr())' );
    } );
    
    it( 'should disjunctors correctly', function () {
        lexdump( 'a | b' ).should.equal( 'trm(a) wts( ) oro(|) wts( ) trm(b)' );
        lexdump( 'a|b' ).should.equal( 'trm(a) oro(|) trm(b)' );
    } );
    
    it( 'should parse tag determiners correctly', function () {
        lexdump( 'a:b' ).should.equal( 'trm(a) tag(:) trm(b)' );
        lexdump( '"a":b' ).should.equal( 'quo(") trm(a) quo(") tag(:) trm(b)' );
        lexdump( 'a:"b"' ).should.equal( 'trm(a) tag(:) quo(") trm(b) quo(")' );
        lexdump( 'a :"b"' ).should.equal( 'trm(a) wts( ) tag(:) quo(") trm(b) quo(")' );
    } );
    
    it( 'should parse negation correctly', function () {
        lexdump( '!a' ).should.equal( 'neg(!) trm(a)' );
        lexdump( '-a' ).should.equal( 'neg(-) trm(a)' );
        lexdump( '(-a)' ).should.equal( 'lpr(() neg(-) trm(a) rpr())' );
        lexdump( 'a-b' ).should.equal( 'trm(a-b)' );
        lexdump( 'a!b' ).should.equal( 'trm(a) neg(!) trm(b)' );
    } );

} );

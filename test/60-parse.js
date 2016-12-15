'use strict';
var should = require( 'should' );
var expr = require( '../src/expr' );
var token = require( '../src/token' );
var parse = require( '../src/parse' );
var lex = require( '../src/lex' );

let parsedump = ( query ) => {
    return parse( lex( query ) ).toString();
};

describe( 'parse()', function () {

    describe( 'args', function () {
    
        it( 'should accept string input', function () {
            ( () => { parse( '' ); } ).should.not.throw();
            ( () => { parse( 'abc' ); } ).should.not.throw();
            ( () => { parse( '!abc' ); } ).should.not.throw();
        } );
        
        it( 'should accept lex() array output', function () {
            ( () => { parse( lex( '' ) ); } ).should.not.throw();
            ( () => { parse( lex( 'abc' ) ); } ).should.not.throw();
            ( () => { parse( lex( '!abc' ) ); } ).should.not.throw();
        } );
        
    } );

    describe( 'quoted terms', function () {
    
        it( 'should be parsed correctly', function () {
            parsedump( '"hello"' ).should.equal( parsedump(
                'hello'
            ) );
            parsedump( "'hello'" ).should.equal( parsedump(
                'hello'
            ) );
            parsedump( "'hello-world'" ).should.equal( parsedump(
                'hello-world'
            ) );
        } );
        
    } );

    describe( 'tags', function () {
    
        it( 'should throw when found at beginning or end of stream', function () {
            ( () => { parsedump( ': hello' ); } ).should.throw();
            ( () => { parsedump( 'hello:' ); } ).should.throw();
        } );
        
        it( 'should throw when sandwiched between non-terms', function () {
            ( () => { parsedump( 'a:()' ); } ).should.throw();
            ( () => { parsedump( '():a' ); } ).should.throw();
            ( () => { parsedump( 'or:b' ); } ).should.throw();
            ( () => { parsedump( 'b:or' ); } ).should.throw();
        } );
        
        it( 'should be parsed correctly', function () {
            parsedump( 'status:fubar' ).should.equal( parsedump(
                '"status":"fubar"'
            ) );
            parsedump( '!nationality:belgian' ).should.equal( parsedump(
                '!( nationality : belgian )'
            ) );
            ( () => {
                parsedump( 'acceptable:!no' );
            } ).should.throw();
        } );
        
    } );
    
    describe( 'disjunctions', function () {
        
        it( 'should die when found at beginning or end of stream', function () {
            ( () => { parsedump( 'or a' ); } ).should.throw();
            ( () => { parsedump( 'a or' ); } ).should.throw();
        } );
        
        it( 'take precedence over AND', function () {
            parsedump( "a b or c" ).should.equal( parsedump(
                'a (b or c)'
            ) );
        } );
        
        it( 'take precedence under negation', function () {
            parsedump( "! a or b" ).should.equal( parsedump(
                '(!a) or b'
            ) );
        } );
        
    } );

    describe( 'negation', function () {
        
    } );
    
    describe( 'parenthetical expressions', function () {
        
    } );

} );

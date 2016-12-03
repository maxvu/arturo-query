'use strict';
var assert = require( 'assert' );
var parse = require( '../src/arturo-query.js' ).parse;
var parse_safe = require( '../src/arturo-query.js' ).parse_safe;

describe( 'parser', function () {

    describe( 'bare term', function () {
    
        it( 'should be recognized alone', function () {
            assert.equal(
                parse( 'hello-world' ).getCanonical(),
                '"hello-world"'
            );
        } );
        
        it( 'should ignore whitespace', function () {
            assert.equal(
                parse( '     hello world     ' ).getCanonical(),
                parse( 'hello world' ).getCanonical()
            );
        } );
        
        it( 'should be interrupted by quoted terms', function () {
            assert.equal(
                parse( 'alpha"beta"gamma"delta"' ).getCanonical(),
                parse( 'alpha beta gamma delta' ).getCanonical()
            );
            
            assert.equal(
                parse( 'alpha\'beta\'gamma\'delta\'' ).getCanonical(),
                parse( 'alpha beta gamma delta' ).getCanonical()
            );
        } );
        
        it( 'should be interrupted by parentheses', function () {
            assert.equal(
                parse( 'epsilon(zeta)eta' ).getCanonical(),
                parse( 'epsilon zeta eta' ).getCanonical()
            );
            
            assert.equal(
                parse( 'alpha\'beta\'gamma\'delta\'' ).getCanonical(),
                parse( 'alpha beta gamma delta' ).getCanonical()
            );
        } );
        
        it( 'should be interrupted by "or" bar', function () {
            assert.equal(
                parse( 'theta|iota' ).getCanonical(),
                parse( 'theta or iota' ).getCanonical()
            );
        } );
        
    } );
    
    describe( 'quoted term', function () {
        
        it( 'should not require whitespace', function () {
            assert.equal(
                parse( '"hello""world"' ).getCanonical(),
                parse( 'hello world' ).getCanonical()
            );
        } );
        
        it( 'should be triggered by both single- and double- quotes', function () {
            assert.equal(
                parse( '"hello""world"' ).getCanonical(),
                parse( '\'hello\'\'world\'' ).getCanonical()
            );
        } );
        
        it( 'should not escape', function () {
            assert.throws( () => {
                parse( " \\\" " );
            }, Error );
        } );
        
        it( 'throw when unmatched', function () {
            assert.throws( () => {
                parse( " ' " );
            }, Error );
        } );
        
    } );
    
    describe( 'parenthetical expressions', function () {
        
        it( 'nest', function () {
            assert.equal(
                parse( '()((()(a))())()' ).getCanonical(),
                parse( 'a' ).getCanonical()
            );
        } );
        
        it( 'ignore whitespace', function () {
            assert.equal(
                parse( ' ()(    (()(a    ))())   (   )   ' ).getCanonical(),
                parse( '    a' ).getCanonical()
            );
        } );
        
    } );
    
    describe( 'or expressions', function () {
        
        it( 'are recognized', function () {
            assert.equal(
                parse( 'a or b' ).getCanonical(),
                parse( 'a | b' ).getCanonical()
            );
            assert.notEqual(
                parse( 'a or b' ).getCanonical(),
                parse( 'a b' ).getCanonical()
            );
        } );
        
        it( 'die when seen at beginning of stream', function () {
            assert.throws( () => {
                parse( "or a b" );
            }, Error );
            assert.throws( () => {
                parse( "| a b" );
            }, Error );
        } );
        
        it( 'die when seen at end of stream', function () {
            assert.throws( () => {
                parse( "a b or" );
            }, Error );
            assert.throws( () => {
                parse( "a b |" );
            }, Error );
        } );
        
        it( 'die when seen twice in a row', function () {
            assert.throws( () => {
                parse( "a or or b" );
            }, Error );
            assert.throws( () => {
                parse( "a || b" );
            }, Error );
            assert.throws( () => {
                parse( "a | | b" );
            }, Error );
        } );
        
        it( 'are not clobbered by barewords beginning with "or"', function () {
            assert.equal(
                parse( 'oration' ).getCanonical(),
                parse( '"oration"' ).getCanonical()
            );
        } );
        
    } );
    
    describe( 'negated expressions', function () {
        
        it( 'are recognized', function () {
            let a = '-alpha';
            let b = 'not alpha';
            let c = '!alpha';
            assert.equal(
                parse( a ).getCanonical(),
                parse( b ).getCanonical(),
                parse( c ).getCanonical()
            );
        } );
        
        it( 'negate bare words', function () {
            assert.equal(
                parse( '-smoking' ).getCanonical(),
                parse( '!smoking' ).getCanonical(),
                parse( 'not smoking' ).getCanonical()
            );
            assert.notEqual(
                parse( 'smoking' ).getCanonical(),
                parse( '!smoking' ).getCanonical()
            );
        } );
        
        it( 'negate expressions', function () {
            assert.equal(
                parse( '-(hooliganism)' ).getCanonical(),
                parse( '!(hooliganism)' ).getCanonical(),
                parse( 'not (hooliganism)' ).getCanonical()
            );
            assert.notEqual(
                parse( 'tomfoolery' ).getCanonical(),
                parse( '!tomfoolery' ).getCanonical()
            );
        } );
        
        it( 'toggle', function () {
            assert.equal(
                parse( '--toggle' ).getCanonical(),
                parse( '- -toggle' ).getCanonical(),
                parse( 'not not toggle' ).getCanonical(),
                parse( '!!toggle' ).getCanonical()
            );
        } );
        
        it( 'are not clobbered by barewords beginning with "not"', function () {
            assert.equal(
                parse( 'nothing' ).getCanonical(),
                parse( '"nothing"' ).getCanonical()
            );
        } );
        
    } );
    
} );
    

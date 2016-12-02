var assert = require( 'assert' );
var parse = require( '../src/arturo-query.js' );

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
                parse( '     hello-world     ' ).getCanonical(),
                parse( 'hello-world' ).getCanonical()
            );
        } );
        
        it( 'should be negated by both "!" and "-"', function () {
            assert.equal(
                parse( '-smoking' ).getCanonical(),
                parse( '!smoking' ).getCanonical()
            );
            assert.notEqual(
                parse( 'smoking' ).getCanonical(),
                parse( '!smoking' ).getCanonical()
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
        
        it( 'should interrupt itself', function () {
            assert.equal(
                parse( '"hello""world"' ).getCanonical(),
                parse( 'hello world' ).getCanonical()
            );
        } );
        
    } );
    
} );
    

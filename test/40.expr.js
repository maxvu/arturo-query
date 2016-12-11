'use strict';
var should = require( 'should' );
var expr = require( '../src/expr' );
var token = require( '../src/token' );
var site = require( '../src/site' );

var stub = {
    term : function ( id ) {
        return new expr.term(
            new token.trm(
                new site( 0, 0, id )
            )
        );
    },
    site : function ( text ) {
        return new site( 0, 0, text );
    }
};

describe( 'expr', function () {

    describe( 'term', function () {
    
        it( 'should identify as a "term"', function () {
            should(
                stub.term( 'someterm' ).getType()
            ).equal(
                expr.type_ids.term
            );
        } );
        
        it( 'should not report as recursive', function () {
            should(
                stub.term( 'someterm' ).isRecursive()
            ).be.false();
        } );
        
        it( 'should only accept a single trm', function () {
            ( () => {
                return new expr.term( 1 );
            } ).should.throw();
            ( () => {
                return new expr.term([ ]);
            } ).should.throw();
            ( () => {
                return new expr.term( new token.oro( stub.site( '|' ) ) );
            } ).should.throw();
        } );
        
        it( 'should give tokens (array of size one)', function () {
            let tokens = stub.term( 'someterm' ).getTokens();
            tokens.should.be.an.Array();
            tokens.length.should.equal( 1 );
            ( tokens[ 0 ] instanceof token.trm ).should.be.true();
        } );
        
        it( 'should give id as string', function () {
            stub.term( 'someterm' ).getId().should.equal( 'someterm' );
        } );
    
    } );

} );

'use strict';
var should = require( 'should' );
var expr = require( '../src/expr' );
var token = require( '../src/token' );
var site = require( '../src/site' );

var stub = {
    trm : function ( text ) {
        return new token.trm(
            new site( 0, 0, text )
        );
    },
    term : function ( id ) {
        return new expr.term(
            new token.trm(
                new site( 0, 0, id )
            )
        );
    },
    site : function ( text ) {
        return new site( 0, 0, text );
    },
    tag : function () {
        return new token.tag( new site( 0, 0, ':' ) );
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
    
    describe( 'tagp', function () {
    
        let tg = new expr.tagp([
            stub.trm( 'a' ),
            stub.tag(),
            stub.trm( 'b' )
        ]);
        
        it( 'should only accept a trm-tag-trm triplet', function () {
            ( () => {
                new expr.tagp();
            } ).should.throw();
            
            ( () => {
                new expr.tagp([]);
            } ).should.throw();
            
            ( () => {
                new expr.tagp([ new token.oro( sub.site( '|' ) ) ]);
            } ).should.throw();
        } );
        
        it( 'should not report as recursive', function () {
            should(
                stub.term( 'someterm' ).isRecursive()
            ).be.false();
        } );
        
        it( 'should give tokens', function () {
            should( tg.getTokens() ).be.an.Array();
            tg.getTokens().forEach( ( tk ) => {
                ( tk instanceof token.tok ).should.be.true();
            } );
        } );
    
    } );

} );

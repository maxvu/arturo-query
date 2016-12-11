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
        
        it( 'should give tokens as array of size one', function () {
            let tokens = stub.term( 'someterm' ).getTokens();
            tokens.should.be.an.Array();
            tokens.length.should.equal( 1 );
            ( tokens[ 0 ] instanceof token.trm ).should.be.true();
        } );
        
        it( 'should give id as string', function () {
            stub.term( 'someterm' ).getId().should.equal( 'someterm' );
        } );
        
        it( 'should negate() statelessly', function () {
            let nt = stub.term('a');
            nt.isNegated().should.be.false();
            nt.negate().isNegated().should.be.true();
            nt.negate().isNegated().should.be.true();
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
        
        it( 'should report as type "tagp"', function () {
            tg.getType().should.equal( expr.type_ids.tagp );
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
        
        it( 'should ignore negate()', function () {
            tg.isNegated().should.be.false();
            tg.negate().isNegated().should.be.false();
        } );
    
    } );
    
    describe( 'conj', function () {
    
        let someconj = new expr.conj([
            stub.term( 'alpha' ),
            stub.term( 'beta' )
        ]);
        
        it( 'should report as type "conj"', function () {
            someconj.getType().should.equal( expr.type_ids.conj );
        } );
        
        it( 'should report as recursive', function () {
            someconj.isRecursive().should.be.true();
        } );
        
        it( 'should give tokens as concatenation of childrens\'', function () {
            let tokens = someconj.getTokens();
            tokens.should.be.an.Array();
            tokens.length.should.equal( 2 );
            ( tokens[ 0 ] instanceof token.trm ).should.be.true();
            ( tokens[ 1 ] instanceof token.trm ).should.be.true();
        } );
        
        it( 'should statelessly De Morgan on negate()', function () {
            someconj.negate().getType().should.equal( expr.type_ids.disj );
            someconj.isNegated().should.be.false();
            someconj.negate().getChildren().forEach( ( child ) => {
                child.isNegated().should.be.true();
                // ...only because we know it's two terms
            } );
        } );
    
    } );
    
    describe( 'disj', function () {
    
        let somedisj = new expr.disj([
            stub.term( 'alpha' ),
            stub.term( 'beta' )
        ]);
        
        it( 'should report as type "disj"', function () {
            somedisj.getType().should.equal( expr.type_ids.disj );
        } );
        
        it( 'should report as recursive', function () {
            somedisj.isRecursive().should.be.true();
        } );
        
        it( 'should give tokens as concatenation of childrens\'', function () {
            let tokens = somedisj.getTokens();
            tokens.should.be.an.Array();
            tokens.length.should.equal( 2 );
            ( tokens[ 0 ] instanceof token.trm ).should.be.true();
            ( tokens[ 1 ] instanceof token.trm ).should.be.true();
        } );
        
        it( 'should statelessly De Morgan on negate()', function () {
            somedisj.negate().getType().should.equal( expr.type_ids.conj );
            somedisj.isNegated().should.be.false();
            somedisj.negate().getChildren().forEach( ( child ) => {
                child.isNegated().should.be.true();
            } );
        } );
    
    } );

} );


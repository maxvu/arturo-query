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
    },
    tagp : function ( attr, val, negated ) {
        return new expr.tagp([
            stub.trm( attr ),
            stub.tag(),
            stub.trm( val )
        ]);
    }
};

describe( 'expr', function () {

    it( 'should accept only an Array', function () {
        ( () => { return new expr.disj(); } ).should.throw();
        ( () => { return new expr.conj( 1 ); } ).should.throw();
        ( () => { return new expr.disj( new Date ); } ).should.throw();
        ( () => { return new expr.conj( {} ); } ).should.throw();
    } );

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
        
            // not an array
            ( () => {
                new expr.tagp();
            } ).should.throw();
            
            // not size 3
            ( () => {
                new expr.tagp([]);
            } ).should.throw();
            
            ( () => {
                new expr.tagp([ new token.oro( sub.site( '|' ) ) ]);
            } ).should.throw();
            
            // wrong types
            ( () => {
                new expr.tagp([
                    new token.oro( sub.site( '|' ) ),
                    new token.oro( sub.site( '|' ) ),
                    new token.oro( sub.site( '|' ) )
                ]);
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
        
        it( 'should negate() statelessly', function () {
            tg.isNegated().should.be.false();
            tg.negate().isNegated().should.be.true();
            tg.isNegated().should.be.false();
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
    
    describe( 'toString()', function () {
    
        it( 'terms are double-quoted', function () {
            stub.term( 'alpha' ).toString().should.equal( '"alpha"' );
        } );
        
        it( 'conj - without toString() arg, produces parens', function () {
            (new expr.conj([
                stub.term( 'beta' )
            ])).toString().should.equal('( "beta" )');
        } );
        
        it( 'conj - /with/ toString() arg, does not produce parens', function () {
            (new expr.conj([
                stub.term( 'beta' )
            ])).toString( 1 ).should.equal('"beta"');
        } );
        
        it( 'tags are separated by colon', function () {
            stub.tagp( 'attr', 'val' ).toString().should.equal( '"attr":"val"' );
        } );
        
        it( 'terms, negated, get a dash', function () {
            stub.term( 'alpha' ).negate().toString().should.equal( '-"alpha"' );
        } );
        
        it( 'tags, negated, get a dash', function () {
            stub.tagp( 'attr', 'val' ).negate().toString().should.equal( '-"attr":"val"' );
        } );
        
        it( 'expressions get parens', function () {
            (new expr.conj([
                stub.term( 'a' ),
                stub.term( 'b' )
            ])).toString().should.equal('( "a" "b" )');
        } );
        
        it( 'disjunctions are infixed with "OR"', function () {
            (new expr.disj([
                stub.term( 'a' ),
                stub.term( 'b' )
            ])).toString().should.equal('( "a" OR "b" )');
        } );

    } );
    
    describe( 'normalize()', function () {
        
        it( 'should fold superflous conj nesting', function () {
            (new expr.conj([
                new expr.disj([
                    new expr.conj([
                        stub.term( 'a' )
                    ])
                ])
            ])).normalize().should.deepEqual(
                stub.term( 'a' )
            );
        } );
        
        it( 'should fold superflous disj nesting', function () {
            (new expr.disj([
                new expr.disj([
                    stub.term( 'a' )
                ]),
                stub.term( 'b' )
            ])).normalize().should.deepEqual(
                new expr.disj([
                    stub.term( 'a' ),
                    stub.term( 'b' )
                ])
            );
        } );
        
        it( 'should promote like expressions', function () {
        
            (new expr.conj([
                new expr.disj([
                    new expr.conj([
                        stub.term( 'a' )
                    ]),
                    stub.term( 'b' ),
                    stub.term( 'c' )
                ])
            ])).normalize().should.deepEqual(
                (new expr.disj([
                    stub.term( 'a' ),
                    stub.term( 'b' ),
                    stub.term( 'c' )
                ]))
            );
            
            ((new expr.disj([
                stub.term( 'a' ),
                new expr.disj([
                    stub.term( 'b' ),
                    stub.term( 'c' )
                ])
            ])).normalize()).should.deepEqual(
                new expr.disj([
                    stub.term( 'a' ),
                    stub.term( 'b' ),
                    stub.term( 'c' )
                ])
            );
            
        } );
        
    } );
    
    describe( 'isZeroSet()', function () {

        it( 'should be true for empty rcrs\'', function () {
            (new expr.conj([])).isZeroSet().should.be.true();
            (new expr.disj([])).isZeroSet().should.be.true();
        } );
        
        it( 'should be true with contradicting conjunctive terms and tags', function () {
            (new expr.conj([
                stub.term( 'a' ),
                stub.term( 'a' ).negate()
            ])).isZeroSet().should.be.true();
            (new expr.conj([
                stub.tagp( 'attr', 'val' ),
                stub.tagp( 'attr', 'val' ).negate(),
            ])).isZeroSet().should.be.true();
        } );
        
        it( 'should be false for a tag pair differing in value', function () {
            (new expr.conj([
                stub.tagp( 'attr', 'val' ),
                stub.tagp( 'attr', 'some-other-val' ).negate(),
            ])).isZeroSet().should.be.false();
        } );
        
        it( 'should be true for descendant zero-set expressions', function () {
            (new expr.conj([
                new expr.conj([
                    stub.term( 'a' ),
                    stub.term( 'a' ).negate()
                ]),
                stub.term( 'b' )
            ])).isZeroSet().should.be.true();
        } );
        
        it( 'should be false for non-contradicting queries', function () {
            (new expr.conj([
                stub.term( 'a' )
            ])).isZeroSet().should.be.false();
        } );
        
        it( 'should be false for disjunctions of size > 0', function () {
            (new expr.disj([
                stub.term( 'b' )
            ])).isZeroSet().should.be.false();
        } );
        
    } );
    
    describe( 'isUniverse()', function () {

        it( 'should be false in the normal case\'', function () {
            (new expr.conj([])).isUniverse().should.be.false();
            (new expr.disj([])).isUniverse().should.be.false();
        } );
        
        it( 'should be true for contradicting disjunctive terms', function () {
            (new expr.disj([
                stub.term( 'a' ),
                stub.term( 'a' ).negate()
            ])).isUniverse().should.be.true();
        } );
        
        it( 'should be false for a tag pair differing in value', function () {
            (new expr.disj([
                stub.tagp( 'attr', 'val' ),
                stub.tagp( 'attr', 'some-other-val' ).negate(),
            ])).isUniverse().should.be.false();
        } );
        
        it( 'should be true for descendant universal expressions', function () {
        
            (new expr.conj([
                new expr.disj([
                    stub.term( 'a' ),
                    stub.term( 'a' ).negate()
                ]),
                stub.term( 'b' )
            ])).isUniverse().should.be.true();
            
            (new expr.disj([
                new expr.disj([
                    stub.term( 'a' ),
                    stub.term( 'a' ).negate()
                ]),
                stub.term( 'b' )
            ])).isUniverse().should.be.true();
            
        } );
        
        it( 'should be false for non-contradicting queries', function () {
            (new expr.disj([
                stub.term( 'a' )
            ])).isUniverse().should.be.false();
        } );
        
    } );
    
} );


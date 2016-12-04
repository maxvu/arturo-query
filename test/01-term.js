'use strict';
var should = require( 'should' );
var expr = require( '../src/expr.js' );

describe( 'term', function () {
    
    describe( 'constructor', function () {
    
        it( 'should die with no constructor argument', function () {
            ( () => { new expr.term; } ).should.throw();
        } );
        
        it( 'should die with non-String constructor argument', function () {
            ( () => { new expr.term([]); } ).should.throw();
        } );
        
        it( 'should die with empty-String constructor argument', function () {
            ( () => { new expr.term(''); } ).should.throw();
        } );
        
        it( 'should not die with non-empty string constructor argument', function () {
            ( () => { new expr.term( 'test' ); } ).should.not.throw();
        } );
        
    } );
    
    describe( 'id', function () {
        
        it( 'should be accessible by getId()', function () {
            (new expr.term( 'hello' )).getId().should.equal( 'hello' );
        } );
        
    } );
    
    describe( 'isRecursive()', function () {
        
        it( 'should always be false', function () {
            (new expr.term( 'hello' )).isRecursive().should.be.false();
        } );
        
    } );
    
    describe( 'negate(), isNegated()', function () {
        
        it( 'defaults to false', function () {
            (new expr.term( 'hello' )).isNegated().should.be.false();
        } );
        
        it( 'toggles to false', function () {
            (new expr.term( 'hello' )).negate().isNegated().should.be.true();
        } );
        
        it( 'toggles back to true', function () {
            (new expr.term( 'hello' )).negate().negate().isNegated().should.be.false();
        } );
        
    } );
    
    describe( 'getTermCount()', function () {
        
        it( 'should always be one', function () {
            (new expr.term( 'hello' )).getTermCount().should.equal( 1 );
        } );
        
    } );
    
} );

describe( 'conj', function () {
    
    describe( 'constructor', function () {
    
        it( 'should not die with no constructor argument', function () {
            ( () => { new expr.conj; } ).should.not.throw();
        } );
        
        it( 'should not die with empty constructor argument', function () {
            ( () => { new expr.conj( [] ); } ).should.not.throw();
        } );
        
        it( 'should not die with non-empty Array constructor argument', function () {
            ( () => { new expr.conj([
                new expr.term( 'a' )
            ]); } ).should.not.throw();
        } );
        
        it( 'should die with Array constructor argument with non-expr items', function () {
            ( () => { new expr.conj([
                new expr.term( 'a' ),
                1
            ]); } ).should.throw();
            ( () => { new expr.conj([
                1
            ]); } ).should.throw();
        } );
        
    } );
    
    describe( 'isRecursive()', function () {
    
        it( 'should always be true', function () {
            return ( new expr.conj([]) ).isRecursive().should.be.true();
        } );
        
    } );
    
    describe( 'negate()', function () {
    
        it( 'returns self when size = 0', function () {
            let c = ( new expr.conj([]) ).negate();
            ( c instanceof expr.conj ).should.be.true();
            ( c.isNegated() ).should.be.false();
        } );
        
        it( 'negates child when size = 1', function () {
            let c = ( new expr.conj([
                new expr.term( 'b' )
            ]) ).negate();
            ( c instanceof expr.conj ).should.be.true();
            ( c.isNegated() ).should.be.false();
            ( c.getChildren().length ).should.equal( 1 );
            ( c.getChildren()[ 0 ].isNegated() ).should.be.true();
        } );
        
        it( 'DeMorgans to a disj when size > 1', function () {
            let c = ( new expr.conj([
                new expr.term( 'c' ),
                new expr.term( 'd' )
            ]) ).negate();
            ( c instanceof expr.conj ).should.be.false();
            ( c instanceof expr.disj ).should.be.true();
            ( c.isNegated() ).should.be.false();
            ( c.getChildren().length ).should.equal( 2 );
            ( c.getChildren()[ 0 ].isNegated() ).should.be.true();
            ( c.getChildren()[ 1 ].isNegated() ).should.be.true();
        } );
        
    } );
    
} );

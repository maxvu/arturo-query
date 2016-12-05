'use strict';
var should = require( 'should' );
var expr = require( '../src/expr.js' );

var term = expr.term;
var conj = expr.conj;
var disj = expr.disj;

describe( 'term', function () {
    
    describe( 'constructor', function () {
    
        it( 'should die with no constructor argument', function () {
            ( () => { new term; } ).should.throw();
        } );
        
        it( 'should die with non-String constructor argument', function () {
            ( () => { new term([]); } ).should.throw();
        } );
        
        it( 'should die with empty-String constructor argument', function () {
            ( () => { new term(''); } ).should.throw();
        } );
        
        it( 'should not die with non-empty string constructor argument', function () {
            ( () => { new term( 'test' ); } ).should.not.throw();
        } );
        
    } );
    
    describe( 'id', function () {
        
        it( 'should be accessible by getId()', function () {
            (new term( 'hello' )).getId().should.equal( 'hello' );
        } );
        
    } );
    
    describe( 'isRecursive()', function () {
        
        it( 'should always be false', function () {
            (new term( 'hello' )).isRecursive().should.be.false();
        } );
        
    } );
    
    describe( 'negate(), isNegated()', function () {
        
        it( 'defaults to false', function () {
            (new term( 'hello' )).isNegated().should.be.false();
        } );
        
        it( 'toggles to false', function () {
            (new term( 'hello' )).negate().isNegated().should.be.true();
        } );
        
        it( 'toggles back to true', function () {
            (new term( 'hello' )).negate().negate().isNegated().should.be.false();
        } );
        
    } );
    
    describe( 'getTermCount()', function () {
        
        it( 'should always be one', function () {
            (new term( 'hello' )).getTermCount().should.equal( 1 );
        } );
        
    } );
    
} );

describe( 'conj', function () {
    
    describe( 'constructor', function () {
    
        it( 'should not die with no constructor argument', function () {
            ( () => { new conj; } ).should.not.throw();
        } );
        
        it( 'should not die with empty constructor argument', function () {
            ( () => { new conj( [] ); } ).should.not.throw();
        } );
        
        it( 'should not die with non-empty Array constructor argument', function () {
            ( () => { new conj([
                new term( 'a' )
            ]); } ).should.not.throw();
        } );
        
        it( 'should die with Array constructor argument with non-expr items', function () {
            ( () => { new conj([
                new term( 'a' ),
                1
            ]); } ).should.throw();
            ( () => { new conj([
                1
            ]); } ).should.throw();
        } );
        
    } );
    
    describe( 'isRecursive()', function () {
    
        it( 'should always be true', function () {
            return ( new conj([]) ).isRecursive().should.be.true();
        } );
        
    } );
    
    describe( 'negate()', function () {
    
        it( 'returns self when size = 0', function () {
            let c = ( new conj([]) ).negate();
            ( c instanceof conj ).should.be.true();
            ( c.isNegated() ).should.be.false();
        } );
        
        it( 'negates child when size = 1', function () {
            let c = ( new conj([
                new term( 'b' )
            ]) ).negate();
            ( c instanceof conj ).should.be.true();
            ( c.isNegated() ).should.be.false();
            ( c.getChildren().length ).should.equal( 1 );
            ( c.getChildren()[ 0 ].isNegated() ).should.be.true();
        } );
        
        it( 'DeMorgans to a disj when size > 1', function () {
            let c = ( new conj([
                new term( 'c' ),
                new term( 'd' )
            ]) ).negate();
            ( c instanceof conj ).should.be.false();
            ( c instanceof disj ).should.be.true();
            ( c.isNegated() ).should.be.false();
            ( c.getChildren().length ).should.equal( 2 );
            ( c.getChildren()[ 0 ].isNegated() ).should.be.true();
            ( c.getChildren()[ 1 ].isNegated() ).should.be.true();
        } );
        
    } );
    
} );

describe( 'disj', function () {
    
    describe( 'constructor', function () {
    
        it( 'should not die with no constructor argument', function () {
            ( () => { new disj; } ).should.not.throw();
        } );
        
        it( 'should not die with empty constructor argument', function () {
            ( () => { new disj( [] ); } ).should.not.throw();
        } );
        
        it( 'should not die with non-empty Array constructor argument', function () {
            ( () => { new disj([
                new term( 'e' )
            ]); } ).should.not.throw();
        } );
        
        it( 'should die with Array constructor argument with non-expr items', function () {
            ( () => { new disj([
                new term( 'f' ),
                1
            ]); } ).should.throw();
            ( () => { new disj([
                1
            ]); } ).should.throw();
        } );
        
    } );
    
    describe( 'isRecursive()', function () {
    
        it( 'should always be true', function () {
            return ( new disj([]) ).isRecursive().should.be.true();
        } );
        
    } );
    
    describe( 'negate()', function () {
    
        it( 'returns self when size = 0', function () {
            let d = ( new disj([]) ).negate();
            ( d instanceof disj ).should.be.true();
            ( d.isNegated() ).should.be.false();
        } );
        
        it( 'negates child when size = 1', function () {
            let d = ( new disj([
                new term( 'g' )
            ]) ).negate();
            ( d instanceof disj ).should.be.true();
            ( d.isNegated() ).should.be.false();
            ( d.getChildren().length ).should.equal( 1 );
            ( d.getChildren()[ 0 ].isNegated() ).should.be.true();
        } );
        
        it( 'DeMorgans to a disj when size > 1', function () {
            let c = ( new disj([
                new term( 'h' ),
                new term( 'i' )
            ]) ).negate();
            ( c instanceof disj ).should.be.false();
            ( c instanceof conj ).should.be.true();
            ( c.isNegated() ).should.be.false();
            ( c.getChildren().length ).should.equal( 2 );
            ( c.getChildren()[ 0 ].isNegated() ).should.be.true();
            ( c.getChildren()[ 1 ].isNegated() ).should.be.true();
        } );
        
    } );
    
} );

describe( 'expr', function () {

    describe( 'getTermCount()', function () {
        
        it( 'should be zero for empty expressions', function () {
            (new conj([])).getTermCount().should.equal( 0 );
        } );

    } );

} );

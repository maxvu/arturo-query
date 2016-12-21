'use strict';
var expr = require( './expr' );
var parse = require( './parse' );
var cartesian = require( 'cartesian' );

const DEFAULTS = {
    max_query_length   : 256,  // maximum string query string length
    max_term_count     : 32,   // maximum number of distinct terms allowed
    max_subquery_count : 8     // maximum number of disjunctive subqueries
};

let assert = {
    subquery_count : ( actual, allowed ) => {
        if ( actual > allowed )
            throw new Error(
                `Query too broad: produces ${actual} subqueries,`
                +  `where ${allowed} are allowed.`
            )
    },
    query_length : ( actual, allowed ) => {
        if ( actual > allowed ) {
            throw new Error(
                `Query too long: query is length ${actual}, `
                + `where ${allowed} is allowed.`
            );
        }
    }
};

/*
    Interface to expose to user: report syntax errors, provide constituent
      queries and answer some aggregate questions about their composition.
*/

module.exports = class query {

    constructor ( raw_query, options ) {
    
        options = Object.assign( DEFAULTS, options );
        
        assert.query_length( raw_query.length, options.max_query_length );
        
        this._raw = raw_query;              // original string query passed
        this._parsed = parse( raw_query );  // parse() result
        this._subqueries = [];              // dissected query, as a list
        
        // edge case: empty queries
        if ( !this._parsed.getChildren().length )
            return this;
        
        // represent all queries as a set of disjunctive subqueries
        // e.g. ( "cars" ( "trains" | "planes" ) )
        //    -> ( "cars" "trains" ) OR ( "cars" "planes" )
        
        if ( this._parsed.getType() === expr.type_ids.disj ) {
        
            // when parse() returns a disj, we can simply pick apart those terms
            
            this._subqueries = this._parsed.getChildren().map( ( child ) => {
                return child.isRecursive() ? child : new expr.conj([ child ]);
            } );
            assert.subquery_count(
                this._subqueries.length,
                options.max_subquery_count
            );
            
        } else {
        
            // separate the expressions which must occur in all subqueries from
            // the conditional ones
        
            let conjunctives = this._parsed.getChildren().filter( ( child ) => {
                return child.getType() !== expr.type_ids.disj;
            }).reduce( ( acc, child ) => {
                return acc.concat( child );
            }, [] );
            
            let disjunctives = this._parsed.getChildren().filter( ( child ) => {
                return child.getType() === expr.type_ids.disj;
            }).map( ( dsj ) => {
                return dsj.getChildren();
            } );
            
            assert.subquery_count(
                disjunctives.reduce( ( acc, dsj ) => {
                    return acc * dsj.length;
                }, 1 ),
                options.max_subquery_count
            );
            
            if ( !disjunctives.length ) {
            
                // if there are no disjunctive terms, there is just one query
                this._subqueries = [ new expr.conj( conjunctives ) ];
                
            } else {
            
                // otherwise, the subqueries are the conjunctive terms cat'ed
                // with all combinations of disjunctive terms
                // whether it is truly 'cartesian' is best left to mathematicians
                
                cartesian( disjunctives ).forEach( ( combo ) => {
                    this._subqueries.push( new expr.conj(
                        conjunctives.concat( combo )
                    ).normalize() );
                } );
            
            }
            
            // TODO: canonical subquery ordering?
            
        }
        
    }
    
    toString () {
        return this.toDisjunction().toString( 1 );
    }
    
    getSubqueries () {
        return this._subqueries;
    }
    
    toDisjunction () {
        return new expr.disj( this._subqueries );
    }
    
    // does this query represent all queryable items?
    isUniverse () {
        
        // empty query takes opposite meaning between 'expr' and 'query':
        //   - an 'expr' with no children is zero set
        //   - a 'query' with no subqueries is the universe
        
        return (
            !this._subqueries.length ||
            this.toDisjunction().normalize().isUniverse()
        );
        
    }
    
    // is this query unsatisfiable?
    isZeroSet () {
    
        return (
            !this.isUniverse() &&
            this.toDisjunction().normalize().isZeroSet()
        );
        
    }

};


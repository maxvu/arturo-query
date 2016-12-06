'use strict';

var parser = require( './parser.js' );
var expr = require( './expr.js' );

module.exports = {

    // a simple, non-disjunctive query
    subquery : class subquery {
        
        constructor ( conj ) {
            this._raw = raw;
            this._terms = conj._children;
        }
        
        getTerms () {
            this._terms;
        }
        
        toString () {
            return this._raw.toString();
        }
        
        optimize () {
            // Remove duplicate terms, keeping those the first-used
            // thanks, georg from SO
            this._terms = this._terms.filter( ( el, idx ) => {
                return this._terms.indexOf( el ) === idx;
            } );
        }
        
    },

    query : class query {
    
        constructor ( raw ) {
            this._raw = raw;
            this._parsed = null;
            this._error = null;
            this._subqueries = [];
            try {
                this._parsed = (new parser( raw )).parse().reduce();
            } catch ( e ) {
                this._error = e;
                return this;
            }
            if ( this._parsed._type === expr.types.T_CONJ ) {
                this._subqueries = [ this._parsed._children ];
            } else if ( this._parsed._type === expr.types.T_DISJ ) {
                this._subqueries = this._parsed._children.map( ( child ) => {
                    return child._children;
                } );
            } else {
                throw new Error( "Got neither a conj nor disj from reduce()!" );
            }
        }
        
        isOkay () {
            return this._error === null;
        }
        
        getError () {
            return this._error.message;
        }
        
        getRaw () {
            return this._raw;
        }
        
        getParsed () {
            return this._parsed;
        }
        
        getSubqueryCount () {
            return this.subquries.length;
        }
        
        getSubqueries () {
            return this._subqueries;
        }
        
        optimize () {
            // Call optimize on subqueries
        }
    
    }
};


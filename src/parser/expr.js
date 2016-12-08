'use strict';

const type_ids = {
    TRM : 1,
    TAG : 2,
    CNJ : 3,
    DSJ : 5
};

class expr {
    constructor ( lexsyms ) {
        this._lexsyms = lexsyms;
    }
    getLexerSymbols () {
        return this._lexsyms;
    }
};

class term extends expr {

    constructor ( lexsym ) {
        super([ lexsym ]);
        this._id = lexsym.getSite().getText();
        this._type = type_ids.TRM;
        this._negated = false;
    }
    
    getId () {
        return this._lexsyms[ 0 ].getSite().getText();
    }
    
    isRecursive () {
        return false;
    }
    
    isNegated () {
        return this.negated();
    }
    
    negate () {
        this._negated = !this._negated;
    }
    
};

class tag extends expr {
    constructor ( syms ) {
        super( syms );
        this._type = type_ids.TAG;
        this._attr = syms[ 0 ].getId();
        this._val = syms[ 2 ].getId();
    }
    
    getAttr () {
        return this._attr;
    }
    
    getVal () {
        return this._val;
    }
};

class conj extends expr {

    constructor ( subexprs ) {
        super([]);
        this._children = subexprs;
        this._type = type_ids.CNJ;
    }
    
    getChildren() {
        return this._children;
    }
    
    isRecursive () {
        return true;
    }
    
    isNegated () {
        return false;
    }
    
    negate () {
    
    }
    
};

class disj extends expr {

    constructor ( subexprs ) {
        super([]);
        this._children = subexprs;
        this._type = type_ids.DSJ;
    }
    
    getChildren() {
        return this._children;
    }
    
    isRecursive () {
        return true;
    }
    
    isNegated () {
        return false;
    }
    
    negate () {
    
    }
    
};

module.exports = {
    type_ids : type_ids,
    types : {
        term : term,
        tag  : tag,
        expr : expr,
        conj : conj,
        disj : disj
    }
};

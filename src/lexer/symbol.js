'use strict';
var charmap = require( './charmap.js' );
    
/*
    output symbol type enumeration
*/

const type_ids = {
    WTS : 1,   // whitespace
    QUO : 2,   // quote
    TRM : 3,   // bare term
    LPR : 5,   // open (left) parenthesis
    RPR : 7,  // close (right) parenthesis
    TAG : 11,  // tag delimiter (':')
    NEG : 13,  // negating operator
    ORO : 17   // disjunctive ('or') operator
};

/*
    output symbols
*/

class sym { 
    constructor ( txt ) {
        this._txt = txt;
    }
    getType () {
        return this._type;
    }
    getText () {
        return this._txt;
    }
};

class wts extends sym {
    constructor( txt ) {
        super( txt );
        this._type = type_ids.WTS;
    }
};

class quo extends sym {
    constructor ( txt ) {
        super( txt );
        this._type = type_ids.QUO;
    }
};

class trm extends sym {
    constructor( txt ) {
        super( txt );
        this._type = type_ids.TRM;
    }
};

class lpr extends sym {
    constructor () {
        super( charmap.PAR.OPN );
        this._type = type_ids.LPR;
    }  
};

class rpr extends sym {
    constructor () {
        super( charmap.PAR.CLS );
        this._type = type_ids.RPR;
    }  
};

class tag extends sym {
    constructor () {
        super( charmap.TAG.DET );
        this._type = type_ids.TAG;
    }
};

class neg extends sym {
    constructor ( txt ) {
        super( txt );
        this._type = type_ids.NEG;
    }
};

class oro extends sym {
    constructor ( txt ) {
        super( txt );
        this._type = type_ids.ORO;
    }
};

module.exports = {
    type_ids : type_ids,
    types    : {
        sym : sym,
        wts : wts,
        quo : quo,
        trm : trm,
        lpr : lpr,
        rpr : rpr,
        tag : tag,
        neg : neg,
        oro : oro
    }
};

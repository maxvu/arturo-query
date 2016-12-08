'use strict';

/*
    input symbol (char) map
*/

module.exports = {

    // whitespace
    WTS : " \n\t\v\r",
    
    // quoted terms
    QUO : {
        DET : "\"'",
        ESC : "\\"
    },
    
    // parentheticals
    PAR : {
        OPN : '(',
        CLS : ')'
    },
    
    // attr/value 'tag' pairs
    TAG : {
        DET : ':'
    },
    
    // negation
    NEG : {
        DET : '!-'
    },
    
    // disjunctive operator
    ORO : {
        DET : '|',
    },
    
    // bare term, interrupting characters
    TRM : {
        INT : ':!(\"\')'
    }
    
};

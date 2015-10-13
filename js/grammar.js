var grammar;
var relations;
var grammarType;
const START = '[';
const END = ']';
var axiom;
var Grammar = function(string) {
  this.rules = {};
  var lines = string.split('\n');
  lines = lines.map(Function.prototype.call, String.prototype.trim);
  lines = lines.clean("");
  for (var i=0;i< lines.length;i++) {
    var tokens = lines[i].split(' ');
    var nonterminal = tokens[0];
        if (nonterminal.length!=1)
            throw new Error("Can not find nonterminal in line "+i);
        if (i==0)
            axiom = nonterminal;
    var rightPart = lines[i].substring(2);
    if (rightPart.length==0)
            throw new Error("Right part is missing in line "+i);
    var parts = rightPart.split('|');
    parts = parts.map(Function.prototype.call, String.prototype.trim);
    var values = [];
    for (var j=0;j<parts.length;j++) {
      values.push(parts[j]);
    }
    if (nonterminal in this.rules)
      this.rules[nonterminal] = this.rules[nonterminal].concat(values);
    else
      this.rules[nonterminal] = values;
  }
};

Grammar.prototype.getAllSymbols = function() {
  var symbols = [];
  for (var key in this.rules) {
    if (this.rules.hasOwnProperty(key)) {
      symbols.push(key);
      for (var i=0;i<this.rules[key].length;i++) {
        var rs = this.rules[key][i].split('');
        for (var j=0;j<rs.length;j++) {
          symbols.push(rs[j]);
        }
      }
    }
  }
  return symbols.getUnique();
};
Grammar.prototype.isReversible = function() {
    var rightParts = [];
    for (var key in this.rules) {
        if (this.rules.hasOwnProperty(key)) {
            for (var i=0;i<this.rules[key].length;i++) {
                var r = this.rules[key][i];
                if (rightParts.contains(r))
                    return false;
                rightParts.push(r);
            }
        }
    }
    return true;
};
Grammar.prototype.getNonterminals = function() {
    var terminals=[];
    var symbols = this.getAllSymbols();
    for (var i=0;i<symbols.length;i++) {
        if (isNonterminal(symbols[i]))
            terminals.push(symbols[i]);
    }
    return terminals;
};
Grammar.prototype.getTerminals = function() {
    var terminals=[];
    var symbols = this.getAllSymbols();
    for (var i=0;i<symbols.length;i++) {
        if (!isNonterminal(symbols[i]))
            terminals.push(symbols[i]);
    }
    return terminals;
};
Grammar.prototype.first = function(symbol,preset){
    if (!preset)
        preset = [];
    if (isNonterminal(symbol)) {
        if (!this.rules[symbol])
            throw new Error(symbol+" is missing");
        for (var i=0;i<this.rules[symbol].length;i++) {
            var r = this.rules[symbol][i];
            if (r.charAt(0)!=symbol && !preset.contains(r.charAt(0))) {
                preset.push(r.charAt(0));
                preset = preset.concat(this.first(r.charAt(0), preset));
            }
        }
    }
    return preset.getUnique();
};

Grammar.prototype.last = function(symbol,preset){
    if (!preset)
        preset = [];
    if (isNonterminal(symbol)) {
        if (!this.rules[symbol])
            throw new Error(symbol+" is missing");
        for (var i=0;i<this.rules[symbol].length;i++) {
            var r = this.rules[symbol][i];
            if (r.charAt(r.length-1)!=symbol && !preset.contains(r.charAt(r.length-1))) {
                preset.push(r.charAt(r.length - 1));
                preset = preset.concat(this.last(r.charAt(r.length - 1), preset));
            }
        }
    }
    return preset.getUnique();
};

Grammar.prototype.equal = function(x,y){
    for (var key in this.rules) {
        if (this.rules.hasOwnProperty(key)) {
            for (var i = 0; i < this.rules[key].length; i++) {
                var r = this.rules[key][i];
                if (r.indexOf(x + y) > -1)
                    return true;
            }
        }
    }
    return false;
};
Grammar.prototype.less = function(x,y){
    var nonterminals = this.getNonterminals();
    for (var i=0;i<nonterminals.length;i++) {
        if (this.equal(x, nonterminals[i]) && this.first(nonterminals[i]).contains(y))
            return true;
    }
    return false;
};
Grammar.prototype.greater = function(x,y){
    var nonterminals = this.getNonterminals();
    var symbols = this.getAllSymbols();
    if (this.getTerminals().contains(y)) {
        for (var i=0;i<nonterminals.length;i++) {
            var z1 = nonterminals[i];
            for (var j=0;j<symbols.length;j++) {
                var z2 = symbols[j];
                if (this.equal(z1,z2)&&this.last(z1).contains(x)&&(z2==y||this.first(z2).contains(y)))
                    return true;
            }
        }
    }
    return false;
};

Grammar.prototype.getRelation = function(x,y){
    var relation='';
    if (this.equal(x, y))
        relation+='=';
    if (this.less(x, y))
        relation+='<';
    if (this.greater(x, y))
        relation+='>';
    if (!relation)
        relation+='0';
    return relation;
};
Grammar.prototype.getConvolution = function(base){
    var nonterminals = this.getNonterminals();
    for (var i=0;i<nonterminals.length;i++)
        for (var j=0;j<this.rules[nonterminals[i]].length;j++) {
            if (this.rules[nonterminals[i]][j] == base)
                return nonterminals[i];
        }
};
Grammar.prototype.canBeWeak =function() {
    for (var key1 in this.rules) {
        if (this.rules.hasOwnProperty(key1)) {
            for (var i=0;i<this.rules[key1].length;i++) {
                var r1 = this.rules[key1][i];
                for (var key2 in this.rules) {
                    if (this.rules.hasOwnProperty(key2)) {
                        for (var j=0;j<this.rules[key2].length;j++) {
                            var r2 = this.rules[key2][j];
                            if (r1!=r2 && r2.endsWith(r1) && !grammar.equal(r1.charAt(r2.length-r1.length-1),key1) && !grammar.less(r1.charAt(r2.length-r1.length-1),key1))
                                return false;
                        }
                    }
                }
            }
        }
    }
    return true;
};
Grammar.prototype.getRelationTable = function(){
    var symbols = this.getAllSymbols();
    var n = symbols.length;
    var tbl = {};
    for (var i = 0; i < n; i++) {
        for (var j = 0; j < n; j++) {
            if(!(symbols[i] in tbl)) {
                tbl[symbols[i]] = {};
            }
            tbl[symbols[i]][symbols[j]] = this.getRelation(symbols[i],symbols[j]);
        }
    }
    var firstSymbols =  this.first(axiom);
    var lastSymbols =  this.last(axiom);
    tbl[START]={};
    for (i=0;i<symbols.length;i++) {
        if (firstSymbols.contains(symbols[i]))
            tbl[START][symbols[i]] = '<';
        else
            tbl[START][symbols[i]] = '0';
        if (lastSymbols.contains(symbols[i]))
            tbl[symbols[i]][END] = '>';
        else
            tbl[symbols[i]][END] = '0';
    }
    tbl[START][END] = '1';
    return tbl;
};
Grammar.prototype.isSimple = function(){
    if (!this.isReversible())
        return false;
    var relations = this.getRelationTable();
    for (var i in relations) {
        if (relations.hasOwnProperty(i)) {
            for (var j in relations[i]) {
                if (relations[i].hasOwnProperty(j)) {
                    if(relations[i][j].length>1)
                        return false;
                }
            }
        }
    }
    return true;
};
Grammar.prototype.isWeak = function(){
    if (!this.isReversible())
        return false;
    if (!this.canBeWeak())
        return false;
    var relations = this.getRelationTable();
    for (var i in relations) {
        if (relations.hasOwnProperty(i)) {
            for (var j in relations[i]) {
                if (relations[i].hasOwnProperty(j)) {
                    if(!(relations[i][j].length==1 || relations[i][j]=="=<"))
                        return false;
                }
            }
        }
    }
    return true;
};

// function generateDOMTable(relations) {
//     var tbl = document.createElement('table');
//     var tr = tbl.insertRow();
//     var cellInd = 0;
//     var td = tr.insertCell(cellInd++);
//     for (var s in relations[axiom]) {
//         if (relations[axiom].hasOwnProperty(s)) {
//             td = tr.insertCell(cellInd++);
//             td.appendChild(document.createTextNode(s));
//         }
//     }
//     for (var i in relations) {
//         if (relations.hasOwnProperty(i)) {
//             cellInd = 0;
//             tr = tbl.insertRow();
//             td = tr.insertCell(cellInd++);
//             td.appendChild(document.createTextNode(i));
//             for (var j in relations[i]) {
//                 if (relations[i].hasOwnProperty(j)) {
//                     td = tr.insertCell(cellInd++);
//                     td.appendChild(document.createTextNode(relations[i][j]));
//                 }
//             }
//         }
//     }
//     return tbl;
// }

// function analyseBtnClick() {
//     try {
//         grammar = new Grammar(document.getElementById('grammar-input').value);    }
//     catch(e) {
//         alert(e.message);
//     }
//         if (grammar.isSimple()) {
//             grammarType =1;
//             console.log("Simple");
//         }
//         else if (grammar.isWeak()) {
//             grammarType =2;
//             console.log("Weak");
//         }
//         else {
//             grammarType =0;
//             console.log("Nope");
//         }
//         relations = grammar.getRelationTable();
//         document.getElementById("table-div").appendChild(generateDOMTable(relations));
// }

// function checkBtnClick() {
//     try {
//         checkCurGrammar();
//     }
//     catch(e) {
//         alert(e.message);
//     }
// }

function checkCurGrammar(str) {
    // var str = document.getElementById('string-input').value;
    var lines = str.split('\n');
    lines = lines.map(Function.prototype.call, String.prototype.trim);
    lines = lines.clean("");
    str = lines[0];
    for (var i=0;i<str.length;i++)
        if (!grammar.getAllSymbols().contains(str.charAt(i)))
            throw new Error("undefined symbol "+str.charAt(i));
    if (grammarType==1)
        return checkSimple(lines[0]);
    if (grammarType==2)
        return checkWeak(lines[0]);
}
function checkSimple(string) {
    var w = START+string+END;
    while (w!=START+axiom+END) {
        var n = w.length-2;
        var i = 0;
        var k = 0;
        var m = 0;
        while (i<=n&&m==0) {
            if (relations[w.charAt(i)][w.charAt(i+1)]=='0')
                return false;
            if (relations[w.charAt(i)][w.charAt(i+1)]=='<') {
                k=i+1;
            }
            else if (relations[w.charAt(i)][w.charAt(i+1)]=='>')
                m = i;
            i++;
        }
        if (m==0)
            return false;
        var convolution = grammar.getConvolution(w.substring(k,m+1));
        if (!convolution)
            return false;
        w = w.substring(0,k)+convolution+ w.substring(m+1);
    }
    return true;
}
function checkWeak(string) {
    var w = START+string+END;
    while (w!=START+axiom+END) {
        var n = w.length-2;
        var i = 0;
        var lefts = [];
        var m = 0;
        while (i<=n&&m==0) {
            if (relations[w.charAt(i)][w.charAt(i+1)]=='0')
                return false;
            if (relations[w.charAt(i)][w.charAt(i+1)].indexOf('<')!=-1) {
                lefts.push(i+1);
            }
            else if (relations[w.charAt(i)][w.charAt(i+1)]=='>')
                m = i;
            i++;
        }
        if (m==0)
            return false;
        for (var j=0;j<lefts.length;j++) {
            var convolution = grammar.getConvolution(w.substring(lefts[j], m + 1));
            if (convolution)
                break;
        }
        if (!convolution)
            return false;
        w = w.substring(0,lefts[j])+convolution+ w.substring(m+1);
    }
    return true;
}

function isNonterminal(symbol) {
    return (symbol.length == 1 && symbol.match(/[a-z]/i) && symbol == symbol.toUpperCase());
}

Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {         
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};
Array.prototype.getUnique = function(){
    var u = {}, a = [];
    for(var i = 0, l = this.length; i < l; ++i){
        if(u.hasOwnProperty(this[i])) {
            continue;
        }
        a.push(this[i]);
        u[this[i]] = 1;
    }
    return a;
};
Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
};
String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
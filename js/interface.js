initRule = function(rule) {
  var $rule = $(rule);
  $removeBtn = $rule.find('.remove');
  $removeBtn.bind('click', function() {
    $rule.remove();
  });
}


$(function(){
  $rules = $('.rules');
  $ruleTemplate = $('.rule.template');
  
  $addRuleBtn = $(".add-rule");
  $analyseBtn = $(".analyse");

  $checkInput = $(".check");
  $checkBtn = $(".check-btn");
  $checkResult = $(".check-result");

  check = function() {
    value = $checkInput.val();
    try {
      if (checkCurGrammar(value)) {
        $checkResult.removeClass('bg-warning').removeClass('bg-danger').addClass('bg-success');
        $checkResult.html('true');
      } else {
        $checkResult.removeClass('bg-success').removeClass('bg-danger').addClass('bg-warning');
        $checkResult.html('false');
      }
    } catch(e) {
      $checkResult.removeClass('bg-warning').removeClass('bg-success').addClass('bg-danger');
      $checkResult.html(e.message);
    }
  }
  $checkBtn.bind('click', check);

  addRule = function() {
    $rule = $ruleTemplate.clone();
    $rule.removeClass('template');
    $rules.append($rule);
    setTimeout(function(){
      initRule($rule);
    }, 0);
  }
  addRule();

  analyse = function(text) {
    $p = $(".analyse-result");
    try {
        grammar = new Grammar(text);    
        if (grammar.isSimple()) {
            grammarType = 1;
            $p.html("Simple");
            $p.removeClass('bg-warning').removeClass('bg-danger').addClass('bg-success');
        }
        else if (grammar.isWeak()) {
            grammarType = 2;
            $p.html("Weak");
            $p.removeClass('bg-warning').removeClass('bg-danger').addClass('bg-success');
        }
        else {
            grammarType = 0;
            $p.html("Neither simple nor weak");
            $p.removeClass('bg-success').removeClass('bg-danger').addClass('bg-warning');
        }
        relations = grammar.getRelationTable();
        $("#table-div").html(generateDOMTable(relations));
        $checkInput.show();
        $checkBtn.show();
        $checkResult.show();
    } catch(e) {
        $p.html(e.message);
        $p.removeClass('bg-warning').removeClass('bg-success').addClass('bg-danger');
    }
  }

  generateDOMTable = function(relations) {
    var tbl = $("<table class='table table-striped table-bordered'></table>")[0]
    var tr = tbl.insertRow();
    var cellInd = 0;
    var td = tr.insertCell(cellInd++);
    for (var s in relations[axiom]) {
        if (relations[axiom].hasOwnProperty(s)) {
            td = tr.insertCell(cellInd++);
            td.appendChild(document.createTextNode(s));
        }
    }
    for (var i in relations) {
        if (relations.hasOwnProperty(i)) {
            cellInd = 0;
            tr = tbl.insertRow();
            td = tr.insertCell(cellInd++);
            td.appendChild(document.createTextNode(i));
            for (var j in relations[i]) {
                if (relations[i].hasOwnProperty(j)) {
                    td = tr.insertCell(cellInd++);
                    td.appendChild(document.createTextNode(relations[i][j]));
                }
            }
        }
    }
    return tbl;
  }

  analyseBtnClick = function() {
    var a = [];
    $('.rule:not(.template)').each(function(index, rule) {
      var leftData = $('input[name="left"]', rule).val();
      var rightData = $('input[name="right"]', rule).val();
      rightData = rightData.split(' ').join('');
      a.push(leftData + ' ' + rightData);
    })
    analyse(a.join('\n'));
  }

  $addRuleBtn.bind('click', addRule);
  $analyseBtn.bind('click', analyseBtnClick);
});

// function checkBtnClick() {
//     try {
//         checkCurGrammar();
//     }
//     catch(e) {
//         alert(e.message);
//     }
// }
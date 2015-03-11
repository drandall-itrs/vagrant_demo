var allRows="#fault table.statsHolderTable td table tbody tr";
var ctrlRows="#fault table.statsHolderTable td.names table tbody tr";
var dataRows="#fault table.statsHolderTable td.values table tbody tr";


function hideChildRows(ele,relIdx,rowType)
{
  if (relIdx<=0) return true;
  var currentRowType=getRowType(ele,"st-");
  if (currentRowType==rowType) return false;
  if (currentRowType>rowType) $(ele).hide();
}

function showChildRows(ele,relIdx,rowType)
{
   if (relIdx<=0) return true;
  var currentRowType=getRowType(ele,"st-");
  if (currentRowType==rowType) return false;
  if (currentRowType==((+rowType)+1)) 
    $(ele).show().removeClass("closed").addClass("closed");
}

function closeRow(row) {
  var rowType=getRowType(row,"st-");
  var rowIdx=$(ctrlRows).index(row);
  $(ctrlRows).each(function (i) { return hideChildRows(this,i-rowIdx,rowType); });
  $(dataRows).each(function (i) { return hideChildRows(this,i-rowIdx,rowType); });
  $(row).addClass("closed");
  setCtrlWidth();
}
    
function openRow(row) {
  var rowType=getRowType(row,"st-");
  var rowIdx=$(ctrlRows).index(row);
  $(ctrlRows).each(function (i) { return showChildRows(this,i-rowIdx,rowType); });
  $(dataRows).each(function (i) { return showChildRows(this,i-rowIdx,rowType); });
  $(row).removeClass("closed");
  setCtrlWidth();
}
    
function setRowLevel(ele) {
  //console.profile('Measuring time');
  var level=getRowType(ele,"c");
  var rows="#fault table.statsHolderTable td table tbody tr";
  $(rows).hide();
  for (var v=0;v<level;v++) 
  {
    $(rows+".st-"+v).show().removeClass("closed");
  }
  $(rows+".st-"+level).show().removeClass("closed").addClass("closed");
  setCtrlWidth();
  //console.profileEnd();
}
    
function getRowType(ele, classKey) {
  var clsStr=$(ele).attr("class");
  var clArr=clsStr.split(" ");
  var kLen=classKey.length;
  for ( var i in clArr )
  {
      if (clArr[i].substr(0,kLen) == classKey) 
        return clArr[i].substr(kLen);
  }
  return "no-class";
}

function setCtrlWidth()
{
   $("#fault table.statsHolderTable td.names table").width(100);
  var w=$("#fault table.statsHolderTable td.names table").width();
  if (w>660) w=660;
  $("#fault table.statsHolderTable td.names div").width(w);
  $("#fault table.statsHolderTable td.values div").width(900-w);
  $("#fault table.statsHolderTable td.names div table").width(w);
  $("#fault table.statsHolderTable td.values div table").width(900-w);
}
function initFaultReport()
{
  $(ctrlRows+" td.active").click(function() {
    var p=$(this).parent();
    if (p.hasClass("closed"))
      openRow(p);
    else
      closeRow(p);
  });
  $("#fault td.names th").click(function() { setRowLevel(this); });
  if ($("#fault td.names tr.st-0").size()<=3)
    $("#fault td.names th").eq(1).each(function() { setRowLevel($(this)); });
  else
    $("#fault td.names th").eq(0).each(function() { setRowLevel($(this)); });
  setTimeout("setCtrlWidth()",10);

}
$(document).ready(function() {
  initFaultReport();
});

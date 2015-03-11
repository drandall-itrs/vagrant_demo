// Current Page Loaded
var currentPage="";

// Moves the Report to the specified Section
function moveTo(urlPage,internalRef)
{
  currentPage=urlPage;
  if (internalRef=="")
    $('#currentReport').scrollTo(0);
  else
    $('#currentReport').scrollTo("#"+internalRef);
   return false;
}

function resizeWindows()
{
  if ($.browser.msie)
  {
    var h0=$("#nav1").height();
    var h2=$("#content").height();
    var hW=$("body").height()-$("#top").height()+3;
    $("#nav0").height(hW);
    $("#nav1").height(hW);
    $("#currentReport").height(hW);
    var w=$("body").width();
    $("#nav0:visible").each(function() { w-=$(this).width()-8; } );
    $("#nav1:visible").each(function() { w-=$(this).width(); } );
    
    
    $("#currentReport").width(w-25-18);
  }
}

// Fix for IE bugs
function fixPage() {
  // Fix IE Issues
  if ($.browser.msie)
  {
    $("#currentReport").css("margin-left","0");
    $("#currentReport").css("margin-right","0");
    $("#currentReport").css("padding-right","20px");
    $("#currentReport").css("padding-bottom","20px");
    $("#currentReport").css("padding","0");
    $("#content").css("padding","0px");
    $("#content").css("margin","0px");
    
    $("div.scrollX").css("overflow-y","hidden");
    $("div.scrollX").css("padding-bottom","20px");
    $("#nav1").css("overflow-y","auto");
    $("#nav1").css("overflow-x","hidden");
    $("#nav1").css("padding-right","20px");
    $("body").css("overflow","hidden");
    
    resizeWindows();
   
  }
}

// Ajax page retrival
 // Ajax page retrival
function getTextContentsByLink()
{
  var url=$(this).attr("href");
  if (currentPage==url) return; 
  $("#currentReport").load(url,function() { });
  $.ajax({
    url: url,
    cache: false,
    success: function(html) {
      $("#currentReport").html("<h1>Express Reports Error Log</h1>");
      var lines=html.split("\n");
      for ( var i in lines )
      {
        $("#currentReport").append($('<div/>').text(lines[i]).html());
        $("#currentReport").append("<br />");
      } 
    }
  });
  return false;
}

function getContentsByLink()
{
  var url=$(this).attr("href");
  getContents(url);
  return false;
}

function getContents(url)
{
  var urlArr=url.split('#');
  var urlPage=urlArr[0];
  var urlWithLocation=urlPage+" "+"#page";
  var internalRef="";
  if (urlArr[1]!=undefined) internalRef=urlArr[1];
  if (currentPage==urlPage) return moveTo(urlPage,internalRef); 
  $("#currentReport").load(urlWithLocation,function() { fixPage(); moveTo(urlPage,internalRef); initFaultReport(); });
}
  
// Highlight binding functions
$(document).ready(function(){
  getContents($("a.nav-link").eq(0).attr("href"));
  $('#nav1 img.close').click(function() {
      $('#nav0').show();
      $('#nav1').hide();
      resizeWindows();
  });
   $('#nav0 img.open').click(function() {
      $('#nav0').hide();
      $('#nav1').show();
      resizeWindows();
  });
  $("a.nav-link").click(getContentsByLink);
  $("a.err-link").click(getTextContentsByLink);
  //$(window).resize(fixPage);
  
  $(window).resize(function(){
        resizeWindows();
    });

});
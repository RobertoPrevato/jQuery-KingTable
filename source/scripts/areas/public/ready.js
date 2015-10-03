$(document).ready(function () {
  //set theme roller
  $("#theme").on("change", function () {
    var v = $(this).val();
    $("body").attr("class", v);
  });
});

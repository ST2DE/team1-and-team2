var back = document.querySelectorAll(".back");
var go = document.querySelectorAll(".go");
back.forEach(back => {
    back.addEventListener("click", function () {
        back.style.borderBottom = "none";
        back.previousSibling.style.borderBottom = "solid 1px #FCCC22";
    }   
)});

go.forEach(go => {
    go.addEventListener("click", function () {
        go.style.borderBottom = "none";
        go.nextSibling.style.borderBottom = "solid 1px #FCCC22";
    }   
)});


var pointer = document.querySelector("#pointer");
var sidebar = document.querySelector("#sidebar");
pointer.addEventListener("click",function () {
    sidebar.toggleClass("slide-toggle")
})

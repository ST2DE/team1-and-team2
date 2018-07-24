var back = document.querySelectorAll(".back");
var go = document.querySelectorAll(".go");
back.forEach(back => {
    back.addEventListener("click", function () {
        this.style.borderBottom = "none";
        this.previousSibling.style.borderBottom = "solid 1px #FCCC22";
    }   
)});

go.forEach(go => {
    go.addEventListener("click", function () {
        this.style.borderBottom = "none";
        this.nextSibling.style.borderBottom = "solid 1px #FCCC22";
    }   
)});


var pointer = document.querySelector("#pointer");
var sidebar = document.querySelector("#sidebar");
pointer.addEventListener("click",function () {
    
    sidebar.toggleClass("slide-toggle")
})


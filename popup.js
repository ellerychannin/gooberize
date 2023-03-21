let toxicitySetting;
function loadPopup(tsetting) {
    var r = document.querySelector(':root');
    var inputAdj = document.getElementById('inputAdj');
    document.getElementsByClassName("rangeInput")[0].value = tsetting;
    if (tsetting <= 30) {
        r.style.setProperty('--colorBg', '#F0642D');
        r.style.setProperty('--colorCnt', '#FFFFFF');
        r.style.setProperty('--emoji', "url(" + "https://em-content.zobj.net/thumbs/240/apple/325/zany-face_1f92a.png" + ")");
        inputAdj.innerHTML = 'goofy';
    } else if (tsetting <= 70) {
        r.style.setProperty('--colorBg', '#E0666D');
        r.style.setProperty('--colorCnt', '#FFFFFF');
        r.style.setProperty('--emoji', "url(" + "https://em-content.zobj.net/thumbs/240/apple/325/smiling-face-with-smiling-eyes_1f60a.png" + ")");
        inputAdj.innerHTML = 'classy';            
    } else if (tsetting <= 100) {
        r.style.setProperty('--colorBg', '#9747FF');
        r.style.setProperty('--colorCnt', '#FFFFFF');
        r.style.setProperty('--emoji', "url(" + "https://em-content.zobj.net/thumbs/240/apple/325/face-with-symbols-on-mouth_1f92c.png" + ")");
        inputAdj.innerHTML = 'serious';
    } 

}
document.addEventListener("DOMContentLoaded", function(event) {

    let rangeInput = document.getElementsByClassName("rangeInput");
    // console.log("hello", rangeInput[0]);
    chrome.storage.local.get(["toxicitySetting"]).then((result) => {
        // console.log("old toxicity is ", result.toxicitySetting);
        loadPopup(result.toxicitySetting);
    });
    // loadPopup(oldToxicity);
    rangeInput[0].addEventListener('mousemove', function(){

        // console.log("value is ", this.value);
        chrome.storage.local.set({toxicitySetting: this.value}).then(()=> {console.log("saved locally")});
        loadPopup(this.value);
    });    
})



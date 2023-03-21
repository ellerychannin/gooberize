console.log("hello from content js");
let syllablesCount = function(word) {
    let syllables = RiTa.syllables(word);
    let syllablesCount = syllables.split(/\//).length;
    // console.log(syllablesCount);
    return syllablesCount;
};

async function fetchToxicity(sentence) {
    // let s = "They pay people for 1 person's worth of work, then expect you to complete 3 people's worth."
    // let score;
    try {
        const response = await fetch('https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=AIzaSyBY5TIaAQ_9ZNX5aO3r08LN1D5SHbksEfc', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({comment: {text: sentence},languages: ["en"],requestedAttributes: {TOXICITY:{}} })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.log(error);
    }
}
function mapSliderToToxicity (number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}
function getRhymes(sentence) {
    let words = RiTa.tokenize(sentence);
    let rhymedSentence = ''; //words.slice();''
    // console.log(words);
    let posWords = RiTa.pos(sentence, {simple:true});
    // console.log(posWords);

    for (const[idx, w] of words.entries()) {
        if(RiTa.isPunct(w)) {
            rhymedSentence = rhymedSentence.concat(w);
            continue;
        } else if (posWords[idx] == 'a' || posWords[idx] == 'n'){
            let rhymedW = RiTa.rhymes(w, {limit: 1, numSyllables: syllablesCount(w), pos: posWords[idx]});
            // console.log(rhymedW);
            if (rhymedW.length==1) {
                // if (idx == 0) {
                //     rhymedW[0] = rhymedW[0].charAt(0).toUpperCase() + rhymedW[0].slice(1);
                // }
                rhymedSentence = rhymedSentence.concat(" ",rhymedW[0]);
            } else {
                rhymedSentence = rhymedSentence.concat(" ", w);
            } 
        } else {
            rhymedSentence = rhymedSentence.concat(" ", w);
        }
    }
    // console.log(rhymedSentence);
    return rhymedSentence.trim();
}

function modifyComment(i, newComment) {
    // comment.innerText = modifiedComment.join(" ");
    let ithComment = document.querySelectorAll("ytd-comment-renderer")[i].querySelector("#content-text");
    // console.log(i, ithComment.innerText);
    // console.log(`comment ${i}`, ithComment);
    ithComment.innerText = newComment;

    // replace the comment avatar
    // let ithAvatar = document.querySelectorAll("ytd-comment-renderer")[i].querySelector("#img");
    // // console.log(ithAvatar);
    // ithAvatar.setAttribute('src', 'https://media.newyorker.com/photos/5d979417daf38e00089a9354/master/w_2560%2Cc_limit/191014_r35108.jpg');
}

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}


let numComments = 0;
let prevNumComments = 0;
let indexedModifiedComments = [];
let indexedOriginalComments = [];
let indexedToxicityScores = [];
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      // listen for messages sent from background.js
      if (request.message === 'hello!') {
        // new url is now in content scripts!
        // console.log(`url changed to ${request.url}`);
        // prevNumComments = 0;
        numComments = 0;
        indexedModifiedComments = [];
        indexedOriginalComments = [];
        indexedToxicityScores = [];
      } else if (request.message === 'new toxicity!') {
        chrome.storage.local.get(["toxicitySetting"]).then((result) => {
            // console.log("new toxicity", result.toxicitySetting);
            // modify the comments based on new toxicity setting
            let t = result.toxicitySetting;
            // numComments = 0;
            modifyComments(t);
        });
      }
});
function modifyComments(t) {

    for (var i=0; i < indexedOriginalComments.length; i++) {
        let modifiedComment = indexedOriginalComments[i].slice();
        // console.log("original comment: ", modifiedComment);
        // console.log("indexed toxicity score i: ", indexedToxicityScores[i]);
        
        indexedToxicityScores[i].forEach((score, idx) => {
            if (score >= mapSliderToToxicity(t, 0, 100, 0, 0.5)) {
                // console.log('toxic comment');
                modifiedComment[idx] = indexedModifiedComments[i][idx];
            }
        });
        // console.log("modified comment: ", modifiedComment);
        modifyComment(i, modifiedComment.join(" "));
    }
}

function processComments(t, renderOptions) {
    // console.log("numComments: ", numComments);
    var comments = document.querySelectorAll("ytd-comment-renderer");
    // console.log(comments.length);
    // if (prevNumComments == comments.length - 20) {
    if ((numComments == (comments.length - 20))) { //|| ((prevNumComments == comments.length) && (comments.length != 0))) {
        // console.log("commentS modified");    
        // if (numComments < 3) {
            // for each comment
            const commentPromises = [];
            for (var i = numComments; i < comments.length; i++) {
                // if this comment has never been processed before
                // if (i >= indexedOriginalComments.length) {
                    // console.log("i: ", i);
                    // Get the comment text
                    var comment = comments[i].querySelector("#content-text");
                    var commentText = comment.innerText;

                    // process each comment into sentences
                    var commentSentences = RiTa.sentences(commentText);
                    let splittedLength = commentSentences.join().length;
                    if (commentText.length - splittedLength > 2) {
                        commentSentences.push(commentText.substring(splittedLength));
                    }
                
                    // console.log("new comment processed");
                    // store the original version of the comment
                    indexedOriginalComments.push(commentSentences);

                    // store the modified version of the comment
                    let modifiedSentences = commentSentences.map(sentence => {
                        return getRhymes(sentence);
                    });
                    indexedModifiedComments.push(modifiedSentences);

                    // calculate and store toxicity scores for each sentence within each comment
                    commentPromises.push(Promise.all(commentSentences.map((sentence) => fetchToxicity(sentence)))
                    .then((results) => 
                    { 
                        let toxicityScores = [];
                        // for each sentence of the comment with its toxicity score
                        results.forEach((result, idx) => {
                            // let s = commentSentences[idx];
                            if (result?.ok) {
                                let score = result.attributeScores.TOXICITY.summaryScore["value"];
                                toxicityScores.push(score); 
                            } else {
                                toxicityScores.push(0); 
                                console.log(`HTTP Response Code: ${result?.status}`);
                            }
                        });

                        return toxicityScores;
                    })
                    .catch((error) => {
                        console.log(error);
                    }));
                // }
        } 
        // }
        numComments = comments.length;
        // console.log("comment promises:", commentPromises);
        Promise.all(commentPromises).then((values) => { values.forEach((v) => {
            indexedToxicityScores.push(v);
        });
            // console.log("indexed toxicity score: ", indexedToxicityScores);
            // console.log("indexed original comments: ", indexedOriginalComments);
            // console.log("indexed modified comments: ", indexedModifiedComments);
        });//.then(() => {if (renderOptions.renderComments) {modifyComments(t);}});
    }
    // prevNumComments = comments.length;

}


var observer = new MutationObserver(function(mutations) {
    // if (timer) clearTimeout(timer);
    // timer = setTimeout(() => {
        mutations.forEach(function(mutation) {
            // Check if the comment section has been added to the DOM
            if (mutation.addedNodes.length) {
                chrome.storage.local.get(["toxicitySetting"]).then((result) => {
                    // modify the comments based on new toxicity setting
                    let t = result.toxicitySetting;
                    
                    processComments(t, {"renderComments": true});
                });
            }
            });
    // }, 1);
});
observer.observe(document.body, { childList: true, subtree: true });


// var isInViewPort = function(elem) {
//     var bounding = elem.getBoundingClientRect();
//     return (
//         bounding.top >= 0 &&
//         bounding.left >= 0 &&
//         bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
//         bounding.right <= (window.innerWidth || document.documentElement.clientWidth)
//     );
// }

// span, a, 

// const text = $('p').text();
// console.log(text);

// Promise.all([
//     console.log(chrome.runtime.getURL('/models'))
//     //faceapi.nets.faceExpressionNet.loadFromUri(chrome.runtime.getURL('/models'))
// ]).then(console.log("model loaded")).catch((err) => {console.log(err)});

// async function loadModel() {
//     if(!faceapi.nets.faceExpressionNet.params) {
//         console.log("loading model");
//         const net = await faceapi.create
//     }
// }

// var mediaDevices = navigator.mediaDevices;
// mediaDevices.getUserMedia({
//     video:true
// })
// .then(console.log("got video"));


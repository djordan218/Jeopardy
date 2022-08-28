const NUM_CATEGORIES = 6;
const NUM_CLUES_PER_CAT = 5;

// category example
//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    }

let categories = [];

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds() {
  let res = await axios.get('https://jservice.io/api/categories?count=100'); // API data
  let catCount = res.data.map(value => new Object({ id: value.id, clues_count: value.clues_count })); // creating a new object to just have the id and clues_count - don't want to send out ids that have less than 5 clues
  let newCatCount = catCount.filter(function (count) { // filtering out clue count values less than 5
    return count.clues_count >= 5;
  });
  let catIds = newCatCount.map(value => value.id); // variable to map out the data ids
  return _.sampleSize(catIds, NUM_CATEGORIES) // using lodash to shuffle # of ids based on variable stated above
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

async function getCategory(catId) {
  let res = await axios.get(`https://jservice.io/api/category?id=${catId}`);
  let category = res.data;
  let clues = category.clues;
  let shuffledClues = _.sampleSize(clues, NUM_CLUES_PER_CAT); // using lodash to set the sample size
  let cluesObj = shuffledClues.map(value => ({ // mapping object and creating a new object with desired key/value pairs
    question: value.question,
    answer: value.answer,
    showing: null,
  }))
  return { title: category.title, cluesObj }
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */

async function fillTable() {
  $("#jeopardy thead").empty(); // emptying the head for the reset button
  let $tr = $("<tr>"); // variable to create a table row using jQuery
  for (let i = 0; i < NUM_CATEGORIES; i++) { // looping through num of categories
    $tr.append($("<th>").text(categories[i].title)); // 
  }
  $("#jeopardy thead").append($tr); // append rows to the thead element

  $("#jeopardy tbody").empty(); // adding rows for questions, emptying for the reset button
  for (let j = 0; j < NUM_CLUES_PER_CAT; j++) { // looping through num of categories
    let $tr = $("<tr>"); // variable to create a table row
    for (let k = 0; k < NUM_CATEGORIES; k++) { // for each category, loop through category questions
      $tr.append($("<td>").attr("id", `${k}-${j}`).text("?")); // append data to row, add attribute of an id and add text "?"
    }
    $("#jeopardy tbody").append($tr); // append rows to the tbody element
  }
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(evt) {
  let id = evt.target.id;
  let [catId, clueId] = id.split("-"); // variable to create a [0-1], etc array for positioning
  let clue = categories[catId].cluesObj[clueId];

  let msg;

  if (!clue.showing) { // if the clue isn't showing
    msg = clue.question; // set msg to the question
    clue.showing = "question"; // now show the question
  } else if (clue.showing === "question") { // but if the question is showing
    msg = clue.answer; // change to answer
    clue.showing = "answer";
  } else {
    return; // return if answer is displayed
  }

  $(`#${catId}-${clueId}`).html(msg); // display the html based on the msg according to position we defined above
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
  let catIds = await getCategoryIds(); // retrieve ids array
  categories = [];
  for (let catId of catIds) { // loop through that array
    categories.push(await getCategory(catId)); // and send to getCategory function
  }
  fillTable(); // run fillTable function and populate table
}

$("#restart").on("click", setupAndStart); // restart button event listener

$(async function () {
  setupAndStart();
  $("#jeopardy").on("click", "td", handleClick);
}
);
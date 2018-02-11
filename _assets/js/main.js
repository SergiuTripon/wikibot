// variable to hold wikipedia extract endpoint
var wikipedia_extract_endpoint = "https://en.wikipedia.org/w/api.php?origin=*&action=query&format=json&prop=extracts&explaintext&redirects&titles=";

// variable to hold cape ai admin token
var cape_ai_admin_token = "BJONJ_gfjkakPucSl8j5qjIVK6mAhUbpzS23GgbvY0s";

// variable to hold cape ai add document endpoint
var cape_ai_add_document_endpoint = "https://responder.thecape.ai/api/0.1/documents/add-document?adminToken=" + cape_ai_admin_token + "&replace=true";

// variable to hold cape ai answer endpoint
var cape_ai_answer_endpoint = "https://responder.thecape.ai/api/0.1/answer?adminToken=" + cape_ai_admin_token;

// cape ai create saved reply endpoint
var cape_ai_create_saved_reply_endpoint = "https://responder.thecape.ai/api/0.1/saved-replies/add-saved-reply?adminToken=" + cape_ai_admin_token;

// variable to hold error status
var form_error = false;

// variable to hold submit
var submit = $("#submit");

// variable to hold subjects
var subject = $("#subject");

// variable to hold question
var question = $("#question");

// variable to hold question answer
var question_answer = $("#question-answer");

// variable to hold loading
var loading = $("#loading");

// hide loading
loading.hide();

// variable to hold questions and answers
var questions_n_answers = {};

// variable to hold question and answer number
var question_n_answer_no = 1;

// function to get current date and time
function get_current_date_time() {
    return moment().format('ddd D MMM | h:mma');
}

// function to create saved reply
function create_saved_reply(question_n_answer_no) {

    // variable to hold question
    var question = questions_n_answers[question_n_answer_no][0];
    // variable to hold answer
    var answer = questions_n_answers[question_n_answer_no][1];

    $.ajax({
        type: "POST",
        url: cape_ai_create_saved_reply_endpoint,
        data: {
            "question": question,
            "answer": answer
        }
    })
    .then(
        function(data) {
            if (data !== 500) {
                $("#" + question_n_answer_no).replaceWith("<p class='card-text mb-0'><small class='text-success'>Thank you!</small></p>");
            }
        }
    )
    .catch(
        function(xhr) {
            if (xhr.status === 500) {
                $("#" + question_n_answer_no).replaceWith("<p class='card-text mb-0'><small class='text-info'>Already a good answer!</small></p>");
            }
        }
    );
}

// function to answer question
function answer_question(question, data) {
    var document_ids = "";
    document_ids += data.result.documentId;
    return $.ajax({
        type: "POST",
        url: cape_ai_answer_endpoint,
        data: {
            "question": question,
            "documentIds": document_ids
        }
    }).then(function(data) { return data }).catch(function(xhr) { return xhr.status });
}

// function to upload document
function upload_document(page_id, extract) {

    return $.ajax({
        type: "POST",
        url: cape_ai_add_document_endpoint,
        data: {
            "title": page_id,
            "text": extract
        }
    }).then(function(data) { return data }).catch(function(xhr) { return xhr.status });
}

// function to get extract
function get_extract(subject) {
    return $.ajax({ url: wikipedia_extract_endpoint + encodeURIComponent(subject) }).then(function(data) { return data }).catch(function(xhr) { return xhr.status });
}


// click function
submit.click(function (e) {
    e.preventDefault();

    // form validation
    var subject_value = subject.val();
    if (subject_value === '') {
        subject.focus();
        subject.tooltip("dispose");
        question.tooltip("dispose");
        subject.tooltip({
            html: true,
            trigger: "manual",
            placement: "bottom",
            template: "<div class='tooltip' role='tooltip'><div class='arrow border-danger'></div><div class='tooltip-inner bg-danger'></div></div>",
            title: "<span>No subject, no question!</span>"
        }).tooltip("show");
        form_error  = true;
        return false;
    } else {
        subject.tooltip("dispose");
        form_error  = false;
    }

    var question_value = question.val();
    if (question_value === '') {
        question.focus();
        subject.tooltip("dispose");
        question.tooltip("dispose");
        question.tooltip({
            html: true,
            trigger: "manual",
            placement: "bottom",
            template: "<div class='tooltip' role='tooltip'><div class='arrow border-danger'></div><div class='tooltip-inner bg-danger'></div></div>",
            title: "<span>No question, no answer!</span>"
        }).tooltip("show");
        form_error  = true;
        return false;
    } else {
        question.tooltip("dispose");
        form_error  = false;
    }

    // if there are no form errors
    if (form_error === false) {

        // trigger ajax call
        $.when(get_extract(subject_value)).then(function(data) {

            // variable to hold page
            var page = Object.values(data.query.pages)[0];

            // if page extract is not set
            if (!page.extract) {
                subject.tooltip({
                    html: true,
                    trigger: "manual",
                    placement: "bottom",
                    template: "<div class='tooltip' role='tooltip'><div class='arrow border-danger'></div><div class='tooltip-inner bg-danger'></div></div>",
                    title: "<span>No Wikipedia article for this subject, I'm afraid...</span>"
                }).tooltip("show");
                return;
            }

            // set question value
            question.val("");
            // append content
            $(".card-body").find("#loading").before(
                "<div id='question-block' class='d-flex align-items-center justify-content-center mt-3'>" +
                "<div id='question-icon' class='mr-3'>" +
                "<i class='fas fa-user-circle fa-2x text-warning'></i>" +
                "</div>" +
                "<div id='question-text' class='card card-body p-2 rounded-0'>" +
                "<p class='mb-0'>" +
                "<b>" + question_value + "</b>" +
                "</p>" +
                "<hr class='mt-2 mb-2'>" +
                "<div class='d-flex justify-content-between'>" +
                "<p class='card-text mb-0'><small class='text-muted'>" + get_current_date_time() + "</small></p>" +
                "</div>" +
                "</div>" +
                "</div>"
            );
            // show loading
            loading.show();
            // scroll to bottom
            question_answer.animate({ scrollTop: question_answer.prop("scrollHeight")}, 1000);

            // trigger ajax call
            $.when(upload_document((page.pageid + " - " + page.title), page.extract)).then(function(data) {
                // trigger ajax call
                $.when(answer_question(question_value, data)).then(function(data) {
                    // hide loading
                    loading.hide();
                    // variable to hold answer
                    var answer = data.result.items[0];
                    // add question and answer to questions and answers
                    questions_n_answers[question_n_answer_no] = [question_value, answer.answerText];
                    // append content
                    $(".card-body").find("#loading").before(
                        "<div id='answer-block' class='d-flex align-items-center justify-content-center mt-3'>" +
                        "<div id='answer-text' class='card card-body p-2 rounded-0'>" +
                        "<p class='mb-0'>" +
                        "<b>" + answer.answerText + "</b>" + (answer.answerContext ? " (" + answer.answerContext + ")" : "") +
                        "</p>" +
                        "<hr class='mt-2 mb-2'>" +
                        "<div class='d-flex justify-content-between'>" +
                        "<p class='card-text mb-0'><small class='text-muted'>" + get_current_date_time() + "</small></p>" +
                        "<a id='" + question_n_answer_no + "' href='#' class='good-answer card-link' tabindex='-1' onclick='event.preventDefault(); create_saved_reply(" + question_n_answer_no + ")'><small>Good answer!</small></a>" +
                        "</div>" +
                        "</div>" +
                        "<div id='answer-icon' class='ml-3'>" +
                        "<i class='fas fa-user-circle text-success'></i>" +
                        "</div>" +
                        "</div>"
                    );
                    // increment question and answer number
                    question_n_answer_no++;
                    // scroll bottom
                    question_answer.animate({ scrollTop: question_answer.prop("scrollHeight")}, 1000);
                });
            });
        });
    }
    return true;
});
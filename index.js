'use strict';
var https = require('https');
var User = require(__dirname + '/tools/CanvasUser');
var storage = require(__dirname + '/storage');
var express = require("express");
var ERRORS = require("./customerror");
var Promise = require("bluebird");

Promise.config({
    cancellation: true,
    longStackTraces: true
});


const alexia = require('alexia');
const app = alexia.createApp('CanvasGradie');


app.setShouldEndSessionByDefault(true);


function isValidObject(obj) {
    if ((typeof(obj) !== 'undefined') && (obj !== null)) {
        return Object.keys(obj).length;
    } else
        return false;
}

function checkLinked() {

}

function getAmazon(token, session) {
    var amz_account = session.amz_account || {};
    console.log(ERRORS.Request.StatusCodeError)
    if (process.env.NODE_CLAYTON === "true") {
        console.log("------------HI Clayton-------------");
        amz_account = require("./accounts").amz_account;
        console.log(amz_account)
        console.log("-----------------------------------");
    }
    if (isValidObject(amz_account)) {
        console.log("using session")
        return Promise.resolve(amz_account);
    } else {
        if (token) {
            return storage.getAmazonAccount(token).then(amz_account => {
                session.amz_account = {}
                session.amz_account = amz_account;
                return amz_account;
            })
        } else {
            return Promise.reject(new ERRORS.NotLinkedError("Not linked"));
        }
    }
}

function wrapSSML(ssml) {
    return "<speak>" + ssml + "</speak>";
}


app.onStart(() => {
    return 'Welcome to My Hello World App, say hello world to get started, or say help to get more instructions';
});


function handleNoMatch(user, done) {
    var stringResult = 'I could not tell what course you wanted. I suggest you login to canvas skill <break time=".1ms"/>dot <break time=".1ms"/>tk <break time="1ms"/>so you can add more custom nicknames' +
        '<break time="5ms"/> Would you like me to list your current courses? ';

    var courselist = "";
    var cnt = 1;
    var listResult = "";

    user.courses.forEach((course, index) => {
        courselist += cnt + '. ' + (course.meta.title || course.nickname || course.name) + '\n';
        listResult += cnt + '<break time="1ms"/>' + (course.meta.title || course.nickname || course.name) + '<break time="2ms"/>\n';
        cnt++;
    })
    done({
        text: "<speak>" + stringResult + "</speak>",
        ssml: true,
        attrs: {
            from: "GetGradeIntent",
            courselist: courselist,
            listResult: listResult,
            courseCount: user.courses.length
        },
        end: false
    });
}

function linkAccount(done) {
    done({
        text: "Unable to gather grades, please link your account in the Alexa app.",
        card: {
            type: "LinkAccount"
        },
        attrs: {
            saved: "asdf"
        },
        end: true
    })
}


function getUserfromIntent(slots, attrs, data, done) {
    var accessToken = data.session.user.accessToken || 0;

    // if (accessToken) {
    return getAmazon(accessToken, data.session.user).then(account => {
        return storage.getUser(account).then(u => {
            if (u === false) {}
            var user = new User(u);
            console.log("Got user from intent")
            return user;
        });
    }).catch(ERRORS.NotLinkedError, function(err) {
        linkAccount(done);
        return Promise.reject(new ERRORS.HandledError(err.message, err));
    }).catch(ERRORS.Request.StatusCodeError, function(err) {
        return Promise.reject(new ERRORS.PresentableError("Unable to verifiy amazon account.", err));
    });
}



var getHowWellIntent = app.intent('GetHowWellIntent', 'read original request data async', (slots, attrs, data, done) => {
    console.log("how well inside")
    getUserfromIntent(slots, attrs, data, done).then(user => {

        var letters = {
            'a': 0,
            'b': 0,
            'c': 0,
            'd': 0,
            'f': 0,
        };
        //Populate letters with the amount of letter grades in gradebook
        user.getCourses().then(courses => {
            courses.forEach(course => {
                var grade = course.getGrade();
                console.log(grade + "\t " + course.name)
                if (grade !== null) {
                    if (grade >= 90) {
                        letters.a++
                    } else if (grade >= 80) {
                        letters.b++
                    } else if (grade >= 70) {
                        letters.c++
                    } else if (grade >= 60) {
                        letters.d++
                    } else {
                        letters.f++
                    }
                }
            });


            var output = "You are doing ";
            var howWell = "good"
            if ((letters.f + letters.d + letters.c + letters.b) == 0 && letters.a > 0) {
                howWell = "fantastic";
            } else if ((letters.f + letters.d + letters.c) == 0 && (letters.a + letters.b > 0)) {
                howWell = "great";
            } else if ((letters.f + letters.d) == 0 && (letters.a + letters.b + letters.c > 0)) {
                howWell = "good";
            } else if ((letters.f) == 0 && (letters.a + letters.b + letters.c + letters.d > 0)) {
                howWell = "well";
            } else {
                howWell = "okay";
            }
            output += howWell;

            var str = " with ";

            Object.keys(letters).forEach(function(key, index) {
                if (letters[key] == 0)
                    delete letters[key];
            })

            Object.keys(letters).forEach(function(key, index) {
                var numOfGradeLetter = letters[key];
                if (numOfGradeLetter > 0) {
                    var addS = numOfGradeLetter > 1 ? "&apos;s " : " ";
                    var and = index == Object.keys(letters).length - 1 ? "and " : "";
                    str += and + numOfGradeLetter + key + addS + '<break time="5ms"/>'
                    console.log(numOfGradeLetter + key + addS)
                }
            });


            output += str;
            //TODO post issue for createOutputSpeechObject() on Alexia

            console.log(output)

            if (Object.keys(letters).length == 0) {
                done({
                    text: "You don't seem to have any grades yet.. I'm sure you will do great though.",
                    ssml: false,
                    end: true
                });
            } else {
                done({
                    text: wrapSSML(output),
                    ssml: true,
                    end: true
                });
            }
        });
    })
});


var getUpcommingEventsIntent = app.intent('GetUpcommingEventsIntent', 'read original request data async', (slots, attrs, data, done) => {
    getUserfromIntent(slots, attrs, data, done).then(user => {
        return user.getUpcommingEvents();
    }).then(events => {
        console.log("events")

        if (events) {
            var event = {};
            var upcomming = "You have " + events.length + " upcoming events<break time='2ms'/>";
            console.log(upcomming)
            events.forEach(function(event) {
                upcomming += event.title + "<break time='4ms'/>";
            });

            done({
                text: wrapSSML(upcomming),
                ssml: true,
                end: true
            });
        } else {
            var upcomming = "You have no upcoming events<break time='2ms'/>";
            done({
                text: wrapSSML(upcomming),
                ssml: true,
                end: true
            });
        }
    });
});

var getLastAssignmentsIntent = app.intent('GetLastAssignmentsIntent', 'read original request data async', (slots, attrs, data, done) => {
    var course = slots.ClassName || "";
    var coursenumberOfAssignments = slots.numberOfAssignments || 3

    var accessToken = data.session.user.accessToken || 0;

    getUserfromIntent(slots, attrs, data, done).then(user => {
        if (course === "") {

            done({
                text: "No course name provided",
                end: true
            });
        } else {
            user.findCourse(course).then(y => {

                if (typeof y !== 'undefined') {
                    if (!Array.isArray(y)) {

                        var stringResult = "Your last " + coursenumberOfAssignments + " graded assignments are";

                        // y.getAssignments(function(assignments) {
                        y.getLastGraded(coursenumberOfAssignments).then(assignmentArr => {
                            assignmentArr.forEach(assignment => {
                                // console.log(assignment.getGrade())
                                stringResult += (assignment.name) + " is " + assignment.getGrade()[0] + " percent.<break time='2ms'/>";
                            });
                            done({
                                text: wrapSSML(stringResult),
                                ssml: true,
                                end: true
                            });
                        });

                    } else {
                        //Todo theres hope here for the user to find what they want, just out of time
                        handleNoMatch(user, done);
                    }
                } else {
                    handleNoMatch(user, done);
                }
            });
        }
    });
});

function doGetGradeIntent(slots, attrs, data, done) {
    var course = slots.ClassName || "";
    var accessToken = data.session.user.accessToken || 0;

    function doGetGrade(course, done) {
        // console.log(course)
        var stringResult = "Your current grade in " + (course.meta.title || course.nickname) + " is " + course.getGrade() + " percent.";
        console.log(stringResult);

        done({
            text: stringResult,
            end: true
        });
        return;
    }

    return getUserfromIntent(slots, attrs, data, done).then(user => {
            console.log(user)
            var choice = slots.number || 0;

            if (attrs.previousIntent === "GetNumberIntent") {
                return user.getCourses().then(courses => {
                    return doGetGrade(courses[choice - 1], done);
                });
            } else {
                if (course === "" || typeof course === 'undefined') {
                    return user.getCourses().then(courses => {
                        var stringResult = "Your current grades are ";
                        courses.forEach(course => {
                            var strGrade = "";
                            var grade = course.getGrade();
                            if (grade !== 'undefined' && grade !== null) {
                                strGrade = grade + " percent."
                            } else {
                                strGrade = "not listed."
                            }

                            stringResult += (course.meta.title || course.nickname || course.name) + '<break time="2ms"/>' + strGrade + '<break time="2ms"/>';
                        });
                        done({
                            text: wrapSSML(stringResult),
                            ssml: true,
                            end: true
                        });
                    });
                } else {
                    return user.findCourse(course).then(y => {
                        if (typeof y !== 'undefined') {
                            if (!Array.isArray(y)) {
                                return doGetGrade(y, done);
                            } else {
                                //Todo theres hope here for the user to find what they want, just out of time
                                handleNoMatch(user, done);
                            }
                        } else {
                            handleNoMatch(user, done);
                        }
                    });
                }
            }
        }).catch(ERRORS.PresentableError, function(err) {
            done({
                text: err.message,
                end: true
            });
        }).catch(ERRORS.HandledError, function(err) {
            //Handled error
            console.log("I dont have to worry");
        })
        // .catch(function(err) {
        //     done({
        //         text: "Unexpected error",
        //         end: true
        //     });
        // });
}

var getGradeIntent = app.intent('GetGradeIntent', 'read original request data async', doGetGradeIntent);

//Allow main intents starting access

const YesIntent = app.builtInIntent('yes', 'read original request data async', (slots, attrs, data, done) => {
    console.log("yes start")

    if (attrs.from === "GetGradeIntent") {
        done({
            text: wrapSSML("Choose a number. <break time='2ms'/>" + attrs.listResult),
            ssml: true,
            card: {
                title: 'Current Courses',
                content: attrs.courselist
            },
            end: false
        });
    } else {
        done({
            text: "Okay",
            end: true
        })
    }
});



var NoIntent = app.intent('no', 'read original request data async', (slots, attrs, data, done) => {
    // // Clear calendar for date `attrs.date` here
    if (attrs.from === "GetGradeIntent") {
        done({
            text: wrapSSML("Okay."),
            ssml: true,
            card: {
                title: 'Current Courses',
                content: attrs.courselist
            },
            end: true
        });
    } else {
        done({
            text: "Okay",
            end: true
        })
    }
});

var GetNumberIntent = app.intent('GetNumberIntent', 'read original request data async', (slots, attrs, data, done) => {
    var choice = slots.number || -1;

    if (choice >= 1 && choice <= attrs.courseCount + 1) {
        console.log("eval true");
        //Manually set beacuse were going to forward the intent
        attrs.previousIntent = "GetNumberIntent";

        doGetGradeIntent(slots, attrs, data, done);
    } else {
        done({
            text: choice + " is not a valid choice, say a number between one and " + attrs.courseCount + ". I have sent a card with valid choices.",
            attrs: attrs,
            end: false
        });
    }


});

app.action({
    from: '*',
    to: [getHowWellIntent, getLastAssignmentsIntent, getGradeIntent, getUpcommingEventsIntent]
});
app.action({
    from: getGradeIntent,
    to: ["AMAZON.YesIntent", "AMAZON.NoIntent"]
});
app.action({
    from: "AMAZON.YesIntent",
    to: ["GetNumberIntent"]
});
//Allow looping over determining the correct course
app.action({
    from: 'GetNumberIntent',
    to: "GetNumberIntent"
})

// exports.handler = (event, context, callback) => {
//     app.handle(event, data => {
//         callback(null, data);
//     });
// };
// Testing over HTTPS
module.exports = app;

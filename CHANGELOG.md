## Feedback recived from Amazon & TODO
- [x] Your skill does not meet invocation name requirement #2: One-word invocation names are not allowed, unless the invocation name is unique to your brand/intellectual property.  
    - [x] Change invocation name to `"my grade book"`
- [x] The example phrases that you choose to present to users in the companion app must be included in your sample utterances. These sample utterances should not include the wake word or any relevant launch phrasing.
    - [x] Add `GetLastAssignmentsIntent` to sample utterances in app configuration 
- [x] The example phrases that you chose to present to users in the companion app currently use unsupported launch phrasing. More information available [here.](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/supported-phrases-to-begin-a-conversation?ref_=pe_679090_102923190)
    - [x] Change launch phrases to match the outlined way. ie. Use connecting words. 
- [x] When attempting to invoke the skill with your first and second example phrase, the skill fails to recognize and the third example throws an error.  The example phrases must function without error since these are interactions that users are most likely to try.  Please see test case 3.1 from our Submission Checklist for guidance on example phrases.
    - [x] Error Handling
        - [x] implement Promises?
    - [x] Add request to link to Canvas and to link skill to Amazon
- [x] When invoking the skill with the following command “open grades”, the skill’s response is irrelevant to the request.  Please see test case 4.3 from our Submission Checklist for guidance on intent responses.
    - [x] Remove intent
- [x] When invoking the “GetUpcommingEventsIntent” intent, the skill’s fails to recognize.  Please see test case 4.3 from our Submission Checklist for guidance on intent responses. More information available [here.](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-voice-interface-and-user-experience-testing?ref_=pe_679090_102923190#intent-response-design)
    - [x] Implement `"to"` phrase. Ie. "Alexa ask My Gradebook to tell me about my upcoming assignments".
- [x] If user input is required after launching the skill with no intent, a welcome prompt must be provided which describes what users can ask of the skill and the session must remain open for a user response. If the session closes after launching the skill, a core functionality must be completed without prompting users to speak. Also the welcome phrase must be appropriate to the context of the skill’s functionality as defined in its description. Please see test case 4.1 from our Submission Checklist for guidance on session management.
    - [x] Add instructions, keep session open ~~and forward to appropriate intent. ~~
- [x] Update readme
   
## Feedback round two  
- [x] Throws error when no token added....  
    - [x] Send warning when invalid canvas token is in account  
- [x] Implement stop and cancel  
- [x] Fails to recognize the phrase `"...about my current grade in Math."`  
    - [x] Add `about` utterances  

## Change log	
- Added promise support for all of storage  
	- Including database and get/put requests  
	- Added promise support for server  
    - Added promise support for skill  
- Added `getLastGraded` global support  
- Added capability to determine desired course via listing  
- Error handling  
    - Created custom error classes  
    - Added to all intents  
    - Added prompt to link alexa and canvas
- Alexa Config Changes  
    - Changed name to `My GradeBook`  
        - Updated logos accordingly  
    - Changed invocation name to `my grade book`  
    - Automatic generation of sample utterances  
- Added basic help  
    - Lists the main intents and refers to website  
- Added stop and cancel intents  
- Basic sound interface quality changes

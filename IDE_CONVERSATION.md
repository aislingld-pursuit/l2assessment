# Conversation Transcript: Week 8 Assessment

**User:**
Week 8 Assessment — Technical

You've been tasked to work on an existing AI-powered customer support triage tool. Your job: identify areas for improvement, propose solutions, and implement at least one.

The company: Relay AI is a subscription-based customer operations platform that uses AI to categorize, prioritize, and route incoming customer messages for small businesses. Its SaaS model is built around boosting team efficiency and enabling companies to handle more customer volume without hiring additional support staff.

The product: Customer Inbox Triage (https://github.com/jimenezatmit/l2assessment). A small web app that uses an LLM to categorize and route customer support messages.

Your task:
- Fork, clone, and run the project in your IDE of choice
- Test the app with multiple customer messages
- Identify the top 3 areas for improvement
- Think through the most important improvements that would address these issues
- Implement at least one improvement that you think will make the biggest difference for Relay AI
- Test your changes with new examples
- Push your changes back to Github
Deliverables: Updated GitHub repo link + full IDE conversation copy-pasted

My School Github is https://github.com/aislingld-pursuit

---

**Antigravity (AI):**
I have reviewed the repository and identified the top 3 areas for improvement in the Customer Inbox Triage app:

1. Flawed Urgency Scoring: The rule-based approach incorrectly identifies short urgent messages (like "Server down now") as "Low" urgency, and long non-urgent messages with exclamation marks as "High" urgency.
2. Fragile LLM Response Parsing: The current system determines categories by searching the LLM's response for keywords. This breaks easily if the LLM writes a nuanced explanation (e.g., "This is NOT a billing issue").
3. Incorrect Action Templates & Missing Validation: The recommendation for a Feature Request is currently mapped to "Ask user to check billing portal." Additionally, there is no minimum length validation to prevent processing useless inputs like "hi".

I have generated a detailed Implementation Plan mapping out how I will solve these issues. My primary focus will be replacing the flawed `urgencyScorer` with a unified LLM request that expects a strict JSON response containing both category and urgency.

Please review the plan and click Proceed if you're ready for me to implement these changes!

---

**User:**
Ok good first let me pull this into this project folder to run it and test it first and verify your claim to see if that it's true we'll get started. Let me do that first.

---

**Antigravity (AI):**
I have started the development server for you in the background!

You can open your browser and navigate to http://localhost:5173/ to test the application.

To test the flawed urgency scoring and parsing, you can try pasting some of the examples from `sample-messages.json` (such as "Server down now", which incorrectly flags as Low urgency, or "hi", which passes without validation).

Once you've had a chance to test it out and verify the issues, just let me know if you approve the implementation plan and I will get started on the improvements!

---

**User:**
https://github.com/jimenezatmit/l2assessment

Have we installed this locally Did we follow the instructions to make this work Localhost is not working for me?

---

**Antigravity (AI):**
Ah, that might be because I originally ran it without exposing it to your local network! I've gone ahead and restarted the server with the `--host` flag to make sure it's accessible. I also set up the `.env.local` file for you, which defaults to the mock version of the LLM (which perfectly demonstrates the flaws).

You can now try accessing it via these URLs:
- http://localhost:5173/
- http://127.0.0.1:5173/
- http://192.168.3.111:5173/

If you are using a cloud IDE or a VM, it should now properly forward the port 5173 to your browser. Give it another try and see if it loads!

---

**User:**
Ok what I'm test for again?

---

**Antigravity (AI):**
Here is what you should test to see the 3 major flaws in the app that we are going to fix:

1. Flawed Urgency Scoring
Test this: Type a short, critical message like: `Server down now`
What happens: It gets marked as Low urgency. The app has a hardcoded rule that penalizes short messages, completely missing the actual meaning.
Test this: Type a long, happy message with exclamation marks: `Hi!!! I just wanted to say thank you!!! Your product is amazing!!!`
What happens: It gets marked as High urgency simply because it counts the exclamation marks and the length.

2. Incorrect Action Templates
Test this: Paste a feature request like: `Could you add an export to CSV feature?`
What happens: The app correctly categorizes it as a "Feature Request", but look at the Recommended Action—it says "Ask user to check billing portal." This is mapped incorrectly in the code.

3. No Input Validation
Test this: Type a single word like: `hi`
What happens: The app processes it anyway instead of telling the user they need to provide more context.

Go ahead and give those a try on the dashboard! Once you see how broken the current logic is, let me know if you approve the implementation plan and I'll jump in to fix them.

---

**User:**
I verified everything so I guess we will go through the implementation plan

---

**Antigravity (AI):**
I have finished implementing the solutions, and I pushed everything to your fork of the repository!

Here is a summary of what was completed:
1. Unified LLM Request (JSON Mode): Completely rewrote the parsing logic in `llmHelper.js`. It now asks the LLM to output a strict JSON format returning `category`, `urgency`, and `reasoning`. This removes the fragile string-matching that would easily break if the LLM output nuanced explanations. (The mock fallback was also updated to return structured objects).
2. Dynamic Urgency Scoring: Removed the flawed rule-based calculation in `AnalyzePage.jsx`. The UI now pulls the urgency directly from the LLM, properly identifying short messages like "Server down" as High urgency.
3. Input Validation: Added a character count check in `AnalyzePage.jsx` so unhelpful 2-character messages (like "hi") will now be rejected before they trigger an API request.
4. Corrected Action Templates: Fixed the mapped action in `templates.js` so Feature Requests now appropriately suggest logging a request for the product team instead of asking the user to check their billing portal.

Deliverables:
Your updated GitHub repo link is: https://github.com/aislingld-pursuit/l2assessment

---

**User:**
Perfect you can shut down the and make me a fool copy or transcript of our conversation here for me upload as my completed Assignment

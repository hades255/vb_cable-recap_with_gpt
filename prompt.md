I am going to make a web app to do this.

- tech stack
frontend: react
backend: express.js or any other useful node.js backend framework for below purpose
database: mongoDB
- workflow
This app is similar as a GPT app using openai api key.
in the dashboard page, show new interview button, and then show history of interviews below.
- new interview
show a modal with text area, customers can input the information of the interview, ilke about the company, about the project, about the client, and about my status.
below is create button to go interview page with unique id from backend.
in the backend, send inputed information of the interview to the openai, and when get response, make interview Model with unique id, and send to frontned.
frontend receives response and shows it on the screen like chatgpt sites.
this page has common chatgpt interface
...
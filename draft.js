const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const openai = require('openai');
const path = require('path');
const fs = require('fs');
const { format } = require('date-fns');

const app = express();
const logStream = fs.createWriteStream(path.join(__dirname, 'app.log'), { flags: 'a' });

// Set the OpenAI API key
openai.apiKey = process.env.OPENAI_API_KEY;

// Configure logging
const logMessage = (message) => {
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    logStream.write(`${timestamp} - ${message}\n`);
};

// Set up session middleware
app.use(session({
    secret: '_5#y2L"F4Q8z\n\xec]/',
    resave: false,
    saveUninitialized: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const generatePrompt = (query, session) => {
    const now = new Date();
    const dtString = format(now, 'EEEE dd/MM/yyyy HH:mm:ss');
    const date_time_string = `Current date and time now is ${dtString}.`;
    const prompt_input_string = `${session.prompt_input}. Your patient name is ${session.patient_name} with ${session.patient_dob}. Your name is ${session.avatar_name}.`;
    const prompt_context_and_query = `Previous conversation (just for the context, don't reply to this):
- The patient: ${session.previous_question}
- You: ${session.previous_answer}
Current conversation:
Please reply to the patient's question in one sentence?
- The question: ${query}
- You: `;
    return date_time_string + prompt_input_string + prompt_context_and_query;
};

app.post('/api', async (req, res) => {
    if (!req.session.previous_question) req.session.previous_question = "";
    if (!req.session.previous_answer) req.session.previous_answer = "";

    const query = req.body.query;
    console.log("Query: " + query);

    try {
        const response = await openai.Completion.create({
            model: "text-davinci-003",
            prompt: generatePrompt(query, req.session),
            temperature: 0.6,
            max_tokens: 200
        });
        const data = { reply: response.choices[0].text.trim() };
        console.log("Reply: " + response.choices[0].text);

        req.session.previous_question = query;
        req.session.previous_answer = response.choices[0].text;

        logMessage(`User Information: patient_name=${req.session.patient_name}, patient_dob=${req.session.patient_dob}, avatar_name=${req.session.avatar_name}, prompt_input=${req.session.prompt_input}, previous_question=${req.session.previous_question}, previous_answer=${req.session.previous_answer}`);

        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/how-to-use', (req, res) => {
    res.render('how-to-use');
});

app.get('/register', (req, res) => {
    if (!req.session.patient_name) req.session.patient_name = "Julia";
    if (!req.session.avatar_name) req.session.avatar_name = "Jessica";
    if (!req.session.avatar_gender) req.session.avatar_gender = "female";
    if (!req.session.patient_dob) req.session.patient_dob = "1963-11-26";
    if (!req.session.prompt_input) req.session.prompt_input = `Imagine we are in a nursing home in Ho Chi Minh City. 
Please act as a healthcare worker to take care of a dementia patient.
The patient's children usually visit him on the weekend, like Saturday.`;

    req.session.previous_question = "";
    req.session.previous_answer = "";
    res.render('index', {
        patient_name: req.session.patient_name,
        patient_dob: req.session.patient_dob,
        prompt_input: req.session.prompt_input,
        avatar_name: req.session.avatar_name,
        avatar_gender: req.session.avatar_gender
    });
});

app.post('/chatbot', (req, res) => {
    req.session.patient_name = req.body['patient-name'];
    req.session.patient_dob = req.body['patient-dob'];
    req.session.avatar_name = req.body['avatar-name'];
    req.session.avatar_gender = req.body['avatar-gender'];
    req.session.prompt_input = req.body['prompt-input'];
    res.render('chatbot', {
        avatar_gender: req.session.avatar_gender,
        avatar_name: req.session.avatar_name,
        patient_name: req.session.patient_name
    });
});

app.get('/', (req, res) => {
    res.redirect('/register');
});

app.get('/chatbot', (req, res) => {
    res.redirect('/register');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Starting server on port ${PORT}`);
});

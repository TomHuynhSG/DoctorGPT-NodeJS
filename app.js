// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();
import OpenAI from "openai";
// Pass the API key when creating an instance of OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY  // Replace with your actual API key
});


import express from 'express';
import session from 'express-session';

const app = express();
// Set up session middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

// Middleware to parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));


// Serve static files from the "public" directory
app.use(express.static('public'));

// Set EJS as the templating engine
app.set('view engine', 'ejs');




async function main() {
    try {
        // const completion = await openai.chat.completions.create({
        //   messages: [{ role: "system", content: "You are a helpful assistant." }],
        //   model: "gpt-3.5-turbo",
        // });

        const completion = await openai.chat.completions.create({
            messages: [{ "role": "system", "content": "You are a helpful assistant." },
            { "role": "user", "content": "Who won the world series in 2020?" },
            { "role": "assistant", "content": "The Los Angeles Dodgers won the World Series in 2020." },
            { "role": "user", "content": "What is the current date and time?" }],
            model: "gpt-3.5-turbo",
        });

        console.log(completion.choices[0]);
    } catch (error) {
        console.error("Error creating completion:", error);
    }
}

// main();

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

app.get('/how-to-use', (req, res) => {
    res.render('how-to-use');
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Starting server on port ${PORT}`);
});

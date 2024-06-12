// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();
import OpenAI from "openai";
import { format } from 'date-fns';


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

// Use express.json() middleware to parse JSON request body (for Express 4.16.0 and higher)
app.use(express.json());

// Middleware to parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));


// Serve static files from the "public" directory
app.use(express.static('public'));

// Set EJS as the templating engine
app.set('view engine', 'ejs');


const generatePrompt = (session) => {
    const now = new Date();
    const dtString = format(now, 'EEEE dd/MM/yyyy HH:mm:ss');
    const date_time_string = `Current date and time now is ${dtString}.`;
    const prompt_input_string = `${session.prompt_input}. Your patient name is ${session.patient_name} with ${session.patient_dob}. Your name is ${session.avatar_name}.`;
    const ai_model_string = ` The selected AI model is ${session.ai_chatbot_model}.`;
    return date_time_string + prompt_input_string + ai_model_string;
};


app.post('/api', async (req, res) => {
    if (!req.session.conversation) req.session.conversation = [];

    const query = req.body.query;
    req.session.conversation.push({ role: 'user', content: query });
    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: 'system', content: generatePrompt(req.session) },
                ...req.session.conversation
            ],
            model: req.session.ai_chatbot_model || "gpt-3.5-turbo", // Use the selected model or default to gpt-3.5-turbo
        });

        const reply = completion.choices[0].message.content.trim();
        req.session.conversation.push({ role: 'assistant', content: reply });
        const data = { reply: reply };
        res.json(data);

    } catch (error) {
        console.error("Error creating completion:", error);
        res.status(500).json({ error: "Error creating completion" });
    }
});



app.get('/register', (req, res) => {
    req.session.conversation = [];
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
    req.session.ai_chatbot_model= req.body['ai-chatbot'];
    res.render('chatbot', {
        avatar_gender: req.session.avatar_gender,
        avatar_name: req.session.avatar_name,
        patient_name: req.session.patient_name,
        ai_chatbot_model:req.session.ai_chatbot_model
    });
});

app.get('/', (req, res) => {
    res.redirect('/register');
});

app.get('/chatbot', (req, res) => {
    res.redirect('/register');
});

app.get('/marketplace', (req, res) => {
    res.render('marketplace');
});



const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Starting server on port ${PORT}`);
});

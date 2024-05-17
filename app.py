import os

import openai
from flask import Flask, redirect, render_template, request, url_for, jsonify, session
from datetime import datetime
import logging


app = Flask(__name__)
openai.api_key = os.getenv("OPENAI_API_KEY")

# Configure logging
logging.basicConfig(filename='app.log', level=logging.INFO, format='%(asctime)s - %(message)s')

# Suppress Flask's log messages below WARNING level
log = logging.getLogger('werkzeug')
log.setLevel(logging.WARNING)


# # Suppress OpenAI's log messages below WARNING level
# openai_log = logging.getLogger('openai')
# openai_log.setLevel(logging.WARNING)


# Set the secret key to some random bytes. Keep this really secret!
app.secret_key = b'_5#y2L"F4Q8z\n\xec]/'

@app.route("/api", methods=["POST"])
def chatbot_api():
    if request.method == "POST":
        if 'previous_question' not in session:
            session['previous_question'] = ""
        if 'previous_answer' not in session:
            session['previous_answer'] = ""
        query = request.json["query"]
        print("Query:" + query)
        response = openai.Completion.create(
            model="text-davinci-003",
            prompt=generate_prompt(query),
            temperature=0.6,
            max_tokens=200
        )
        print("Prompt: "+ generate_prompt(query))
        data = {'reply': response.choices[0].text.strip(" ,")}
        print("Reply:" + response.choices[0].text)
        print(response)
        session['previous_question'] = query
        session['previous_answer'] = response.choices[0].text

        # Log the user information
        log_message = (
            f"User Information: patient_name={session['patient_name']}, patient_dob={session['patient_dob']}, avatar_name={session['avatar_name']}, "
            f"prompt_input={session['prompt_input']}, previous_question={session['previous_question']}, previous_answer={session['previous_answer']}"
        )
        logging.info(log_message)

        return jsonify(data)
    return abort(404)

@app.route("/how-to-use", methods=["GET"])
def howToUse():
    return render_template("/how-to-use.html");


@app.route("/register", methods=["GET"])
def register():
    if 'patient_name' not in session:
        session['patient_name'] = "Julia"
    if 'avatar_name' not in session:
        session['avatar_name'] = "Jessica"
    if 'avatar_gender' not in session:
        session['avatar_gender'] = "female"
    if 'patient_dob' not in session:
        session['patient_dob'] = "1963-11-26"
    if 'prompt_input' not in session:
        session['prompt_input'] = """Imagine we are in a nursing home in Ho Chi Minh City. 
    Please acting as a healthcare worker to take care a dementia patient.
    The patient's children usually visit him in the weekend like Saturday. 
    """
        
    session['previous_question'] = ""
    session['previous_answer'] = ""
    return render_template("index.html", patient_name=session['patient_name'], patient_dob=session['patient_dob'], prompt_input = session['prompt_input'], avatar_name=session['avatar_name'], avatar_gender=session['avatar_gender'], )

@app.route("/", methods=["POST", "GET"])
def index():
    return redirect("/register")

@app.route("/chatbot", methods=["POST", "GET"])
def chatbot():
    if request.method == "GET":
        return redirect("/register")
    if request.method == "POST":
        session['patient_name'] = request.form["patient-name"]
        session['patient_dob'] = request.form["patient-dob"]
        session['avatar_name'] = request.form["avatar-name"]
        session['avatar_gender'] = request.form["avatar-gender"]
        session['prompt_input'] = request.form["prompt-input"]
        return render_template("chatbot.html", avatar_gender=session['avatar_gender'], avatar_name=session['avatar_name'], patient_name=session['patient_name'])


def generate_prompt(query):
    # datetime object containing current date and time
    now = datetime.now() # dd/mm/YY H:M:S
    dt_string = now.strftime("%A %d/%m/%Y %H:%M:%S")
    date_time_string="Current date and time now is {}.".format(dt_string)
    prompt_input_string="{}.Your patient name is {} with {}. Your name is {}.".format(session['prompt_input'], session['patient_name'], session['patient_dob'], session['avatar_name'])
    prompt_context_and_query="""Previous conversation (just for the context, don't reply to this):
- The patient: {}
- You: {}
Current converstation:
Please reply to the patient's question in one sentence?
- The question: {}
- You: """.format(session['previous_question'] , session['previous_answer'], query)
    final_prompt_string = date_time_string + prompt_input_string + prompt_context_and_query
    print(final_prompt_string)
    return final_prompt_string

if __name__ == '__main__':
    print("Starting server on port 5000")
    app.run(host='0.0.0.0', port=5001)
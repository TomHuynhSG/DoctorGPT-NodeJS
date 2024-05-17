import OpenAI from "openai";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Pass the API key when creating an instance of OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY  // Replace with your actual API key
});

async function main() {
  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: "You are a helpful assistant." }],
      model: "gpt-3.5-turbo",
    });

    // const completion = await openai.chat.completions.create({
    //     messages: [{"role": "system", "content": "You are a helpful assistant."},
    //         {"role": "user", "content": "Who won the world series in 2020?"},
    //         {"role": "assistant", "content": "The Los Angeles Dodgers won the World Series in 2020."},
    //         {"role": "user", "content": "Where was it played?"}],
    //     model: "gpt-3.5-turbo",
    //   });

    console.log(completion.choices[0]);
  } catch (error) {
    console.error("Error creating completion:", error);
  }
}

main();
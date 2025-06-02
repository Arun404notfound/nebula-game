from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import random
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Gemini API
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-pro')

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/get_hint', methods=['POST'])
def get_hint():
    data = request.json
    target_number = data['target']
    user_guess = data['guess']
    max_num = data['max_num']
    previous_guesses = data['previous_guesses']
    guesses_left = data['guesses_left'] 
    hint_level = data['hint_level']

    # Determine basic directional hint
    direction_hint = ""
    if user_guess < target_number:
        direction_hint = f"Your last guess ({user_guess}) was too low. The number is higher."
    elif user_guess > target_number:
        direction_hint = f"Your last guess ({user_guess}) was too high. The number is lower."

    # Construct a detailed prompt for Gemini
    prompt_parts = [
        f"You are playing a number guessing game. The secret number is {target_number}.",
        f"The range for the number is 1 to {max_num}.",
        f"The user just guessed {user_guess}. {direction_hint}",
        f"They have already guessed: {', '.join(map(str, previous_guesses))} and have {guesses_left} guesses remaining.",
        "Provide a *single, concise, and helpful mathematical hint* about the secret number. Focus on its properties (like divisibility, prime/composite, even/odd, sum of digits, digit properties, relation to powers or specific numbers) or further narrowing the range.",
        "Do NOT reveal the number directly. Do NOT repeat previous hints if possible. The hint should be appropriate for a game and sound like a guiding cosmic entity.",
        "Here are some examples of the kind of hints I'm looking for:",
        "- 'The cosmic number is a multiple of 7.'",
        "- 'It is an even number, and its last digit is 4.'",
        "- 'The sum of its digits is 15.'",
        "- 'It's a prime number, waiting silently in the void.'",
        "- 'Consider its position: it's less than half of the maximum range.'",
        "- 'It is a perfect square, shimmering brightly.'",
        "- 'Look closely at its binary representation – it ends with 101.'",
        "- 'The product of its digits is greater than 20.'",
        f"Adjust the complexity of the hint to be suitable for a '{hint_level}' difficulty level.",
        "Provide ONLY the hint text, no conversational filler."
    ]

    try:
        response = model.generate_content(
            "\n".join(prompt_parts)
        )
        hint = response.text.strip()
        # Basic sanitization/fallback in case Gemini gets too chatty
        if hint.lower().startswith("the hint is:"):
            hint = hint[len("the hint is:"):].strip()
        if hint.startswith("Sure, here's a hint:"): 
            hint = hint.split(':', 1)[1].strip()
        if hint.startswith("Okay, here's your hint:"):
            hint = hint.split(':', 1)[1].strip()

    except Exception as e:
        print(f"Gemini API error: {e}")
        # Fallback hints if API fails or rate-limited
        if user_guess < target_number:
            hint = "The number is higher than your last guess. Focus on its unique properties."
        elif user_guess > target_number:
            hint = "The number is lower than your last guess. Seek its mathematical secrets."
        else: # Should not happen if guess is incorrect
            hint = "Consider the number's properties and your previous guesses."

    return jsonify({'hint': hint})

if __name__ == '__main__':
    app.run(debug=True)

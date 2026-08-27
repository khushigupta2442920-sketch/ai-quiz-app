from flask import Flask, render_template, request, jsonify
from PIL import Image
import os
import google.generativeai as genai
import json

app = Flask(__name__)

# -----------------------------
# AI SETUP (GEMINI)
# -----------------------------
# Yahan apni asli API key aayegi (Environment variable se)
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

# Model ko 'gemini-1.5-flash' kar diya hai (Yeh image padhne mein expert hai)
model = genai.GenerativeModel('gemini-1.5-flash',
                              generation_config={"response_mime_type":"application/json"})

# -----------------------------
# HOME PAGE
# -----------------------------
@app.route("/")
def home():
    return render_template("index.html")

# -----------------------------
# GENERATE QUIZ
# -----------------------------
@app.route("/generate_quiz", methods=["POST"])
def generate_quiz():
    image_file = request.files.get("image")
    language = request.form.get("language", "english")
    difficulty = request.form.get("difficulty", "medium")
    question_count = int(request.form.get("questionCount", 5))

    if image_file is None:
        return jsonify({"success": False, "message": "Please upload a book page."}), 400

    # 1. READ IMAGE
    try:
        image = Image.open(image_file).convert("RGB")
    except Exception:
        return jsonify({"success": False, "message": "Could not read the image."}), 400

    # 2. CREATE QUESTIONS DIRECTLY USING GEMINI VISION
    try:
        # Prompt ko update kar diya taaki woh blur photo bhi check kar le
        prompt = f"""
        You are an expert teacher. Look at the attached image of a book page.
        First, check if the image is readable and contains enough text. If the image is blurry, blank, or does not contain readable text, return an empty JSON array: []

        If the text is readable, generate exactly {question_count} quiz questions based ONLY on the text in the image.
        Language: {language}
        Difficulty: {difficulty}

        Include a mix of these 3 types:
        1. Multiple Choice (MCQ)
        2. Fill in the Blanks
        3. True or False

        Respond STRICTLY in a JSON array format.
        Structure each question exactly like this:
        [
          {{
            "question": "Question text here (for fill in blanks put __)",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "answer": "Option A"
          }}
        ]
        Make sure the "answer" exactly matches one of the text in the "options" array.
        For True/False questions, give only 2 options: ["True", "False"] or ["Sahi", "Galat"].
        """

        # Direct prompt aur image Gemini ko bhej rahe hain
        response = model.generate_content([prompt, image])
        
        # Gemini ke extra json aur  ko saaf karne ka code
        raw_text = response.text
        clean_text = raw_text.replace("json", "").replace("", "").strip()
        
        # Ab saaf JSON ko array mein badal rahe hain
        questions_list = json.loads(clean_text)


        # 3. CHECK IF PHOTO IS CLEAR (Agar Gemini ko text nahi mila toh woh [] bhejega)
        if not questions_list or len(questions_list) == 0:
            return jsonify({
                "success": False, 
                "message": "Photo clear nahi hai ya text theek se padha nahi ja raha. Kripya ek saaf (clear) photo upload karein!"
            }), 400

        return jsonify({
            "success": True,
            "questions": questions_list
        })

    except Exception as e:
        return jsonify({
            "success": False, 
            "message": f"AI dimaag lagane mein fail ho gaya. Kripya dobara try karein. (Error: {str(e)})"
        }), 500

# -----------------------------
# START SERVER
# -----------------------------
if __name__ == "__main__":
    app.run(debug=True)

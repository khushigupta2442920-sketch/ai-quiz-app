from flask import Flask, render_template, request, jsonify
from PIL import Image
import os
from dotenv import load_dotenv
load_dotenv()
import pytesseract
import google.generativeai as genai
import re
import json

app = Flask(__name__)

# -----------------------------
# AI SETUP (GEMINI)
# -----------------------------
# Yahan apni asli API key daalein!
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-3.5-flash',
                              generation_config={"response_mime_type":"application/json"})

# Tesseract ka path
#pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

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

    # 2. OCR (SCAN TEXT)
    try:
        text = pytesseract.image_to_string(image)
        # Clean text
        text = text.replace("\n", " ")
        text = re.sub(r"\s+", " ", text).strip()
    except Exception:
        return jsonify({"success": False, "message": "OCR could not read the image."}), 500

    # 3. CHECK IF PHOTO IS CLEAR (Aapki Requirement)
    # Agar Tesseract ko 50 letters se kam milte hain, toh matlab photo blur hai ya kachra hai
    if len(text) < 50:
        return jsonify({
            "success": False, 
            "message": "Photo clear nahi hai. Kripya ek saaf (clear) photo upload karein jisme text theek se dikh raha ho!"
        }), 400

    # 4. CREATE QUESTIONS USING GEMINI AI (Advanced Prompt)
    try:
        prompt = f"""
        You are an expert teacher. Read the following text extracted from a book:
        ---
        {text}
        ---
        Based ONLY on this text, generate exactly {question_count} quiz questions.
        Language: {language}
        Difficulty: {difficulty}

        Include a mix of these 3 types:
        1. Multiple Choice (MCQ)
        2. Fill in the Blanks
        3. True or False

        Respond STRICTLY in a JSON array format. Do not use markdown blocks like json.
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

        response = model.generate_content(prompt)
        raw_text = response.text
        clean_text = raw_text.replace("json", "").replace("", "").strip()
        questions_list = json.loads(clean_text)

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

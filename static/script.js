let globalQuizData = [];

// ==========================================
// 1. 🌙 DARK MODE TOGGLE
// ==========================================
const darkModeBtn = document.getElementById('darkModeToggle');
if (darkModeBtn) {
    darkModeBtn.addEventListener('click', function() {
        document.body.classList.toggle('dark-theme');
        if (document.body.classList.contains('dark-theme')) {
            this.innerText = "☀️"; 
        } else {
            this.innerText = "🌙"; 
        }
    });
}

// ==========================================
// 2. 📸 PHOTO PREVIEW WALA CODE
// ==========================================
const imageInput = document.getElementById('imageInput');
if (imageInput) {
    imageInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        const previewDiv = document.getElementById('imagePreview');

        if (file && previewDiv) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewDiv.innerHTML = `<img src="${e.target.result}" alt="Uploaded Page" style="max-width: 100%; border-radius: 8px; margin-top: 15px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">`;
            }
            reader.readAsDataURL(file);
        } else if (previewDiv) {
            previewDiv.innerHTML = "";
        }
    });
}

// ==========================================
// 3. 🚀 QUIZ GENERATE KARNE WALA CODE
// ==========================================
const generateBtn = document.getElementById('generateQuiz');
if (generateBtn) {
    generateBtn.addEventListener('click', async function() {
        const fileInput = document.getElementById('imageInput');

        if (!fileInput || !fileInput.files[0]) {
            alert("Bina book ki photo ke quiz kaise banega? Pehle photo upload karein! 📸");
            return;
        }

        if (!navigator.onLine) {
            alert("🌐 Network Issue: Aapka internet nahi chal raha hai.");
            return;
        }

        generateBtn.innerText = "⏳ AI is generating... Please wait";
        generateBtn.disabled = true;

        let formData = new FormData();
        formData.append('image', fileInput.files[0]); // Python expects 'image'

        // Ab hum HTML se dropdowns ki values bhi bhejenge!
        const questionCountBox = document.getElementById('questionCount');
        const languageBox = document.getElementById('language');
        const difficultyBox = document.getElementById('difficulty');

        if (questionCountBox) formData.append('questionCount', questionCountBox.value);
        if (languageBox) formData.append('language', languageBox.value);
        if (difficultyBox) formData.append('difficulty', difficultyBox.value);

        try {
            const response = await fetch('/generate_quiz', {
                method: 'POST',
                body: formData
            });

            const data = await response.json(); // Python ka response padha

            // YAHAN THI ASLI BIMARI - Ab hum theek se check kar rahe hain
            if (data.success === true) {
                globalQuizData = data.questions; 
                renderQuizUI(globalQuizData);
            } else {
                // Agar Python se error aaye (jaise photo blur hai) toh alert dikhao
                alert("⚠️ " + data.message);
            }

        } catch (error) {
            console.error(error);
            alert("⚠️ Oops! Kuch gadbad hai. JavaScript ko data samajh nahi aaya.");
        } finally {
            generateBtn.innerText = "✨ Generate Quiz";
            generateBtn.disabled = false;
        }
    });
}

// ==========================================
// 4. 📝 QUIZ KO 'NEXT PAGE' PAR DIKHANE WALA CODE
// ==========================================
function renderQuizUI(data) {
    // Yeh line purane upload page ko mita kar naya design bana degi
    document.body.style.backgroundColor = "#f4f7f6";
    
    let htmlContent = `
    <div style="max-width: 800px; margin: 40px auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 20px rgba(0,0,0,0.1); font-family: sans-serif;">
        <h2 style="text-align: center; color: #2c3e50; font-size: 2rem; border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 30px;">📝 Your AI Quiz</h2>
    `;

    data.forEach((item, index) => {
        htmlContent += `
            <div style="margin-bottom: 25px;">
                <p style="font-size: 1.2rem; font-weight: bold; color: #34495e; margin-bottom: 15px;">Q${index + 1}: ${item.question}</p>
        `;
        
        item.options.forEach(opt => {
            htmlContent += `
                <label style="display: block; padding: 12px 15px; margin-bottom: 10px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; font-size: 1.05rem;">
                    <input type="radio" name="question${index}" value="${opt.replace(/"/g, '&quot;')}" style="margin-right: 10px; transform: scale(1.2);">
                    ${opt}
                </label>
            `;
        });
        htmlContent += `</div><hr style="border: 0; border-top: 1px solid #eaeaea; margin: 30px 0;">`;
    });

    htmlContent += `
        <button id="final-submit-btn" style="background: #4CAF50; color: white; padding: 15px 20px; border: none; border-radius: 8px; font-size: 1.2rem; cursor: pointer; width: 100%; font-weight: bold;">
            ✅ Submit & Check Answers
        </button>

        <div id="result-box" style="display: none; background: #e0f7fa; padding: 25px; margin-top: 30px; border-radius: 8px; text-align: center; border-left: 5px solid #009688;">
            <h3 id="score-text" style="color: #00796b; font-size: 1.8rem; margin-bottom: 10px;"></h3>
            <h2 id="percentage-text" style="color: #004d40; font-size: 1.4rem;"></h2>
            
            <button onclick="window.location.reload()" style="background: #3498db; color: white; padding: 12px 20px; border: none; border-radius: 6px; font-size: 1rem; cursor: pointer; margin-top: 20px;">
                🔄 Upload Another Book Page
            </button>
        </div>
    </div>
    `;

    document.body.innerHTML = htmlContent;

    // Submit Button ka code ab isi ke andar hai
    document.getElementById('final-submit-btn').addEventListener('click', function() {
        let score = 0;
        let total = data.length;

        data.forEach((item, index) => {
            let selectedOption = document.querySelector(`input[name="question${index}"]:checked`);
            let allOptions = document.querySelectorAll(`input[name="question${index}"]`);
            
            if (selectedOption && selectedOption.value === item.answer) {
                score++;
            }

            allOptions.forEach(radio => {
                radio.disabled = true; 
                let parentLabel = radio.parentElement;

                if (radio.value === item.answer) {
                    parentLabel.style.backgroundColor = "#c8e6c9"; 
                    parentLabel.style.fontWeight = "bold";
                } else if (selectedOption && radio === selectedOption) {
                    parentLabel.style.backgroundColor = "#ffcdd2"; 
                }
            });
        });

        let percentage = (score / total) * 100;

        document.getElementById("score-text").innerText = `🎉 You scored ${score} out of ${total}!`;
        document.getElementById("percentage-text").innerText = `Accuracy: ${percentage.toFixed(2)}%`;
        
        document.getElementById("result-box").style.display = "block";
        this.style.display = "none"; 
        
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });
}

// ==========================================
// 5. ✅❌ Submit karne ke baad wala code
// ==========================================
function calculateResult() {
    let score = 0;
    let total = globalQuizData.length;

    globalQuizData.forEach((item, index) => {
        let selectedOption = document.querySelector(`input[name="question${index}"]:checked`);
        let allOptions = document.querySelectorAll(`input[name="question${index}"]`);
        
        if (selectedOption && selectedOption.value === item.answer) {
            score++;
        }

        allOptions.forEach(radio => {
            radio.disabled = true; 
            let parentLabel = radio.parentElement;

            if (radio.value === item.answer) {
                parentLabel.style.backgroundColor = "#c8e6c9"; 
                parentLabel.style.padding = "8px";
                parentLabel.style.borderRadius = "5px";
                parentLabel.style.fontWeight = "bold";
            } else if (selectedOption && radio === selectedOption) {
                parentLabel.style.backgroundColor = "#ffcdd2";
                parentLabel.style.padding = "8px";
                parentLabel.style.borderRadius = "5px";
            }
        });
    });

    let percentage = (score / total) * 100;

    document.getElementById("score-text").innerText = `Aapka Score: ${score} / ${total} Sahi hue! 🎉`;
    document.getElementById("percentage-text").innerText = `Percentage: ${percentage.toFixed(2)}%`;
    
    document.getElementById("result-box").style.display = "block";
    document.getElementById("final-submit-btn").style.display = "none";
    
    document.getElementById("result-box").scrollIntoView({ behavior: 'smooth' });
}


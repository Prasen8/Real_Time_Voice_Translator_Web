document.addEventListener('DOMContentLoaded', () => {
    const languages = {
        "Auto": "auto",
        "English": "en",
        "Marathi": "mr",
        "Hindi": "hi",
        "Bengali": "bn",
        "Spanish": "es",
        "Chinese (Simplified)": "zh-CN",
        "Russian": "ru",
        "Japanese": "ja",
        "Korean": "ko",
        "German": "de",
        "French": "fr",
        "Tamil": "ta",
        "Telugu": "te",
        "Kannada": "kn",
        "Gujarati": "gu",
        "Punjabi": "pa",
        "Assamese": "as"
    };

    const inputLangSelect = document.getElementById('input-lang');
    const outputLangSelect = document.getElementById('output-lang');

    // Populate language options
    for (let [name, code] of Object.entries(languages)) {
        let option1 = document.createElement('option');
        option1.value = code;
        option1.text = name;
        inputLangSelect.appendChild(option1);

        // Skip 'Auto' for output language
        if (code !== 'auto') {
            let option2 = document.createElement('option');
            option2.value = code;
            option2.text = name;
            outputLangSelect.appendChild(option2);
        }
    }

    inputLangSelect.value = 'auto';
    outputLangSelect.value = 'hi'; // Default to Hindi

    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const aboutBtn = document.getElementById('about-btn');

    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');

    let recognition;
    let isRecording = false;

    // About Modal
    const modal = document.getElementById("about-modal");
    const span = document.getElementsByClassName("close")[0];

    aboutBtn.onclick = () => {
        modal.style.display = "block";
    };

    span.onclick = () => {
        modal.style.display = "none";
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };

    startBtn.addEventListener('click', () => {
        startBtn.disabled = true;
        stopBtn.disabled = false;
        startTranslation();
    });

    stopBtn.addEventListener('click', () => {
        startBtn.disabled = false;
        stopBtn.disabled = true;
        stopTranslation();
    });

    stopBtn.disabled = true;

    function startTranslation() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Your browser does not support Speech Recognition. Try Google Chrome.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = inputLangSelect.value;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.start();
        isRecording = true;

        recognition.onresult = async (event) => {
            const speechText = event.results[0][0].transcript;
            inputText.value += speechText + "\n";

            if (speechText.toLowerCase() === 'exit' || speechText.toLowerCase() === 'stop') {
                stopTranslation();
                return;
            }

            // Send speechText to backend for translation and TTS
            const response = await fetch('/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: speechText,
                    source_lang: inputLangSelect.value,
                    target_lang: outputLangSelect.value
                }),
            });

            const data = await response.json();
            if (data.success) {
                outputText.value += data.translated_text + "\n";

                // Play the translated audio (Use a dynamic URL with timestamp to prevent caching)
                const audio = new Audio(`/voice/${data.voice_filename}?${new Date().getTime()}`);
                audio.play();
            } else {
                outputText.value += "Error: " + data.error + "\n";
            }

            // Continue listening
            if (isRecording) {
                recognition.start();
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error detected: ' + event.error);
            outputText.value += "Error: " + event.error + "\n";
            if (isRecording) {
                recognition.start();
            }
        };

        recognition.onend = () => {
            if (isRecording) {
                recognition.start();
            }
        };
    }

    function stopTranslation() {
        isRecording = false;
        if (recognition) {
            recognition.stop();
        }
    }
});

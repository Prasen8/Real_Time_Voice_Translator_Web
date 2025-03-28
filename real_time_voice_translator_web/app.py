from flask import Flask, render_template, request, jsonify, send_from_directory
from gtts import gTTS
import speech_recognition as sr
import os
from deep_translator import GoogleTranslator
import uuid


app = Flask(__name__)

# Folder to store audio files
AUDIO_FOLDER = 'static/voices'
if not os.path.exists(AUDIO_FOLDER):
    os.makedirs(AUDIO_FOLDER)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/translate', methods=['POST'])
def translate():
    data = request.get_json()
    input_lang_code = data['source_lang']
    output_lang_code = data['target_lang']
    speech_text = data['text']

    try:
        # Translate the text
        translated_text = GoogleTranslator(source=input_lang_code, target=output_lang_code).translate(text=speech_text)

        # Generate the voice using gTTS
        voice = gTTS(translated_text, lang=output_lang_code)
        voice_filename = f'{uuid.uuid4()}.mp3'
        voice_path = os.path.join(AUDIO_FOLDER, voice_filename)
        voice.save(voice_path)

        return jsonify({
            'success': True,
            'translated_text': translated_text,
            'voice_filename': voice_filename
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/voice/<filename>')
def serve_voice(filename):
    return send_from_directory(AUDIO_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True)

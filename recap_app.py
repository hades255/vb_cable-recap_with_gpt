import tkinter as tk
import sounddevice as sd
import numpy as np
import whisper
import queue
import threading
import datetime
import os
import requests

SAMPLERATE = 16000
CHANNELS = 1
BLOCK_SECONDS = 5
preferred_name = "CABLE Output (VB-Audio Virtual Cable)"
preferred_hostapis = {"MME", "Windows DirectSound", "Windows WASAPI"}
MIC_NAME = "Microphone"

model_path = os.path.join(os.path.dirname(__file__), "models", "base.en.pt")
model = whisper.load_model(model_path)

mic_queue = queue.Queue()
vb_queue = queue.Queue()
translated_lines = []
stream = None
vb_device_index = None
mic_device_index = None
last_user = None
last_submit_index = 0
token = ""
backend_url = "http://167.88.39.55:8000/submit"  # Update to your actual backend URL

mic_muted = False
vb_muted = False

# GUI
root = tk.Tk()
root.title("Live Interview Recap")
root.geometry("800x600")

# Top Frame: Token input + Submit button in one line
token_frame = tk.Frame(root)
token_frame.pack(pady=5, padx=10, anchor="w", fill="x")

tk.Label(token_frame, text="Token:").pack(side="left")
token_entry = tk.Entry(token_frame, width=40)
token_entry.pack(side="left", padx=5, fill="x", expand=True)

submit_button = tk.Button(token_frame, text="📤 Submit", font=("Arial", 12), command=lambda: submit_to_backend())
submit_button.pack(side="left", padx=5)

# Text area below
text_widget = tk.Text(root, wrap="word", font=("Consolas", 14), bg="black", fg="cyan")
text_widget.pack(expand=True, fill="both", padx=10, pady=4)

text_widget.insert("end", "🔊 Listening for audio...\n")

# Bottom controls in same row
controls_frame = tk.Frame(root)
controls_frame.pack(pady=2)

mic_button = tk.Button(controls_frame, text="🔇 Mute Mic", width=16, command=lambda: toggle_mic())
mic_button.pack(side="left", padx=5)

vb_button = tk.Button(controls_frame, text="🔇 Mute Client", width=16, command=lambda: toggle_vb())
vb_button.pack(side="left", padx=5)
# Finish GUI


def toggle_mic():
    global mic_muted
    mic_muted = not mic_muted
    if mic_muted:
        mic_button.config(text="🎙️ Unmute Mic", bg="red", fg="white")
        print("🔇 Mic muted")
    else:
        mic_button.config(text="🔇 Mute Mic", bg="SystemButtonFace", fg="black")
        print("🎙️ Mic unmuted")


def toggle_vb():
    global vb_muted
    vb_muted = not vb_muted
    if vb_muted:
        vb_button.config(text="🔈 Unmute Client", bg="red", fg="white")
        print("🔇 Client muted")
    else:
        vb_button.config(text="🔇 Mute Client", bg="SystemButtonFace", fg="black")
        print("🔈 Client unmuted")


def get_hostapi_name(index):
    return sd.query_hostapis()[sd.query_devices(index)['hostapi']]['name']


def find_best_vb_cable_device():
    matching_devices = []
    devices = sd.query_devices()

    for i, d in enumerate(devices):
        if preferred_name.lower() not in d['name'].lower():
            continue
        if d['max_input_channels'] < 1:
            continue

        hostapi_name = get_hostapi_name(i)
        if hostapi_name not in preferred_hostapis:
            continue

        matching_devices.append((i, d, hostapi_name))

    if not matching_devices:
        print("❌ No suitable VB-CABLE device found.")
        return None

    best = sorted(matching_devices,
                  key=lambda x: (-x[1]['max_input_channels'], x[0]))[0]
    print(f"✅ Selected: [{best[0]}] {best[1]['name']} ({best[2]})")
    return best[0]


def find_input_device_by_name(target_name):
    for i, d in enumerate(sd.query_devices()):
        if target_name.lower() in d['name'].lower() and d['max_input_channels'] > 0:
            return i
    return None


def append_text(label, text):
    global last_user
    text = text.strip()

    if not text or text.lower() in {"you", ".", "uh", "um"}:
        return

    if text.startswith("[Error]"):
        text_widget.insert("end", f"{text}\n")
        text_widget.see("end")
        return

    full_line = f"    {text}" if label == last_user else f"{label}: {text}"
    last_user = label
    translated_lines.append(full_line)
    text_widget.insert("end", full_line + "\n")
    text_widget.see("end")


def transcribe_loop(label, queue):
    while True:
        audio_block = queue.get()
        if audio_block is None:
            break
        try:
            audio = np.concatenate(audio_block, dtype=np.float32).flatten()
            if audio.size == 0 or np.max(np.abs(audio)) < 1e-4:
                continue
            audio = whisper.pad_or_trim(audio)
            result = model.transcribe(
                audio, fp16=False, task="transcribe", language="en")
            append_text(label, result['text'].strip())
        except Exception as e:
            append_text(label, f"[Error]: {e}")


def audio_callback(indata, frames, time, status):
    if status:
        print(f"[Audio Status]: {status}")
    if not vb_muted:
        vb_queue.put([indata.copy()])


def submit_to_backend():
    global last_submit_index, token
    token = token_entry.get().strip()

    if not token:
        print("❌ No token entered.")
        return

    new_lines = translated_lines[last_submit_index:]
    if not new_lines:
        print("ℹ️ Nothing new to submit.")
        return

    payload = {
        "token": token,
        "transcript": "\n".join(new_lines),
        "timestamp": datetime.datetime.now().isoformat()
    }

    try:
        response = requests.post(backend_url, json=payload)
        if response.status_code == 200:
            print("✅ Submitted successfully.")
            last_submit_index = len(translated_lines)
        else:
            print(f"❌ Submission failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error during submit: {e}")


def on_close():
    global stream
    if stream:
        for s in stream:
            s.stop()
            s.close()
    mic_queue.put(None)
    vb_queue.put(None)
    filename = f"translated_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    with open(filename, "w", encoding="utf-8") as f:
        f.write("\n".join(translated_lines))
    print(f"✅ Transcript saved to: {filename}")
    root.destroy()


def start_recap():
    global stream
    threading.Thread(target=transcribe_loop, args=("me", mic_queue), daemon=True).start()
    threading.Thread(target=transcribe_loop, args=("client", vb_queue), daemon=True).start()

    mic_stream = sd.InputStream(device=mic_device_index,
                                samplerate=SAMPLERATE,
                                channels=CHANNELS,
                                dtype='float32',
                                callback=lambda indata, frames, time, status: mic_queue.put([indata.copy()]) if not mic_muted else None,
                                blocksize=int(SAMPLERATE * BLOCK_SECONDS))

    vb_stream = sd.InputStream(device=vb_device_index,
                               samplerate=SAMPLERATE,
                               channels=CHANNELS,
                               dtype='float32',
                               callback=audio_callback,
                               blocksize=int(SAMPLERATE * BLOCK_SECONDS))
    mic_stream.start()
    vb_stream.start()
    stream = (mic_stream, vb_stream)
    root.protocol("WM_DELETE_WINDOW", on_close)
    root.mainloop()


vb_device_index = find_best_vb_cable_device()
mic_device_index = find_input_device_by_name(MIC_NAME)

if vb_device_index is not None and mic_device_index is not None:
    start_recap()
else:
    print("❌ Could not find required devices.")

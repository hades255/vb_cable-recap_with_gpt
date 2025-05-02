import tkinter as tk
import sounddevice as sd
import numpy as np
import whisper
import queue
import threading
import datetime

# Load Whisper model
model = whisper.load_model("base")  # use 'tiny' or 'small' for faster response

# Settings
SAMPLERATE = 16000
CHANNELS = 1
BLOCK_SECONDS = 5

DEVICE_INDEX = 2

# Queues
audio_queue = queue.Queue()
translated_lines = []

# GUI
root = tk.Tk()
root.title("Live Translation Caption")
root.geometry("800x500")
text_widget = tk.Text(root, wrap="word", font=(
    "Consolas", 14), bg="black", fg="cyan")
text_widget.pack(expand=True, fill="both")


def append_text(text):
    if text.strip():
        print(text)
        translated_lines.append(text)
        text_widget.insert("end", text + "\n")
        text_widget.see("end")


def transcribe_loop():
    while True:
        audio_block = audio_queue.get()
        if audio_block is None:
            break
        # audio = np.concatenate(audio_block, axis=0)
        # audio = whisper.pad_or_trim(audio)
        audio = np.concatenate(audio_block, dtype=np.float32).flatten()
        try:
            audio = whisper.pad_or_trim(audio)
            result = model.transcribe(
                audio, fp16=False, task="translate")  # <-- Translate
            append_text(result["text"].strip())
        except Exception as e:
            append_text(f"[Error]: {e}")


def audio_callback(indata, frames, time, status):
    if status:
        print(f"Audio status: {status}")
    audio_queue.put([indata.copy()])


# Start transcription thread
threading.Thread(target=transcribe_loop, daemon=True).start()

# Start VB-CABLE audio stream
stream = sd.InputStream(device=DEVICE_INDEX,
                        samplerate=SAMPLERATE,
                        channels=CHANNELS,
                        dtype='float32',
                        callback=audio_callback,
                        blocksize=int(SAMPLERATE * BLOCK_SECONDS))
stream.start()


def on_close():
    stream.stop()
    audio_queue.put(None)
    filename = f"translated_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    with open(filename, "w", encoding="utf-8") as f:
        f.write("\n".join(translated_lines))
    print(f"Translation transcript saved: {filename}")
    root.destroy()


root.protocol("WM_DELETE_WINDOW", on_close)
root.mainloop()

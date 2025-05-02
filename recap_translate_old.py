import tkinter as tk
import sounddevice as sd
import numpy as np
import whisper
import queue
import threading
import datetime


# Config
SAMPLERATE = 16000
CHANNELS = 1
BLOCK_SECONDS = 5
VB_CABLE_NAME = "CABLE Output (VB-Audio Virtual Cable)"
# change as needed
DEFAULT_AUDIO_DEVICE = "Headphones (High Definition Audio Device)"

model = whisper.load_model("base.en")
audio_queue = queue.Queue()
translated_lines = []
stream = None
DEVICE_INDEX = None
root = tk.Tk()

# Set default output using PowerShell + AudioDeviceCmdlets


# def set_default_audio_output(device_name):
#     script = f'Set-AudioDevice -Name "{device_name}"'
#     ps_filename = "set_output_device.ps1"
#     with open(ps_filename, "w") as f:
#         f.write(script)
#     subprocess.run([
#         "powershell", "-Command",
#         f"Start-Process powershell -Verb runAs -ArgumentList '-ExecutionPolicy Bypass -File {ps_filename}'"
#     ])
#     time.sleep(2)
#     os.remove(ps_filename)
preferred_name = "CABLE Output (VB-Audio Virtual Cable)"
preferred_hostapis = {"MME", "Windows DirectSound", "Windows WASAPI"}


def get_hostapi_name(index):
    return sd.query_hostapis()[sd.query_devices(index)['hostapi']]['name']


def find_best_vb_cable_device():
    matching_devices = []
    devices = sd.query_devices()

    for i, d in enumerate(devices):
        name_match = preferred_name.lower() in d['name'].lower()
        if not name_match or d['max_input_channels'] < 1:
            continue

        hostapi_name = get_hostapi_name(i)
        if hostapi_name not in preferred_hostapis:
            continue

        matching_devices.append((i, d, hostapi_name))

    if not matching_devices:
        print("❌ No suitable VB-CABLE device found.")
        return None

    # Prioritize devices with more input channels, then lowest index
    best = sorted(matching_devices,
                  key=lambda x: (-x[1]['max_input_channels'], x[0]))[0]
    print(f"✅ Selected: [{best[0]}] {best[1]['name']} ({best[2]})")
    return best[0]


def append_text(text):
    if text.strip():
        translated_lines.append(text)
        text_widget.insert("end", text + "\n")
        text_widget.see("end")


def transcribe_loop():
    while True:
        audio_block = audio_queue.get()
        if audio_block is None:
            break
        audio = np.concatenate(audio_block, dtype=np.float32).flatten()
        try:
            audio = whisper.pad_or_trim(audio)
            # result = model.transcribe(audio, fp16=False, task="translate")
            result = model.transcribe(
                audio, fp16=False, task="transcribe", language="en")
            append_text(result["text"].strip())
        except Exception as e:
            append_text(f"[Error]: {e}")


def audio_callback(indata, frames, time, status):
    if status:
        print(f"Audio status: {status}")
    audio_queue.put([indata.copy()])


def on_close():
    if stream:
        stream.stop()
    audio_queue.put(None)
    filename = f"translated_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    with open(filename, "w", encoding="utf-8") as f:
        f.write("\n".join(translated_lines))
    # set_default_audio_output(DEFAULT_AUDIO_DEVICE)
    print(f"Transcript saved: {filename}")
    root.destroy()


def start_recap():
    global stream
    threading.Thread(target=transcribe_loop, daemon=True).start()
    stream = sd.InputStream(device=DEVICE_INDEX,
                            samplerate=SAMPLERATE,
                            channels=CHANNELS,
                            dtype='float32',
                            callback=audio_callback,
                            blocksize=int(SAMPLERATE * BLOCK_SECONDS))
    stream.start()
    root.protocol("WM_DELETE_WINDOW", on_close)
    root.mainloop()


# GUI Setup
root.title("Live Translation Caption")
root.geometry("800x500")
text_widget = tk.Text(root, wrap="word", font=(
    "Consolas", 14), bg="black", fg="cyan")
text_widget.pack(expand=True, fill="both")

DEVICE_INDEX = find_best_vb_cable_device()
if DEVICE_INDEX is not None:
    start_recap()
else:
    print("❌ VB-CABLE input device not found. Exiting.")

# Detect exact VB-CABLE match
# for i, d in enumerate(sd.query_devices()):
#     if VB_CABLE_NAME.lower() in d['name'].lower():
#         DEVICE_INDEX = i
#         print(f"✅ Found VB-CABLE device at index {i}: {d['name']}")
#         # set_default_audio_output("CABLE Input (VB-Audio Virtual Cable)")
#         start_recap()
#         break
# else:
#     print("❌ VB-Audio CABLE Output device not found.")

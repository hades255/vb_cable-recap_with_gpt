# install modules and env

"C:\Program Files\Python311\python" -m venv whisper_env

python3.10 -m venv whisper_env
whisper_env\Scripts\activate

pip install openai-whisper sounddevice numpy

---

`https://vb-audio.com/Cable/`

# How to Install

`pip install openai-whisper sounddevice numpy`

- Run in PowerShell as Admin:

`Install-Module -Name AudioDeviceCmdlets -Force`

`pip install pyinstaller`

`pyinstaller --noconsole --onefile recap_translate.py`

build to .exe app

`python -c "import whisper; whisper.load_model('base.en')"`

go `%USERPROFILE%\.cache\whisper\`, copy to `./models/`

```
whisper_env\Scripts\pyinstaller.exe --noconsole --onefile ^
--add-data "whisper_env\Lib\site-packages\whisper\assets\mel_filters.npz;whisper/assets" ^
--add-data "whisper_env\Lib\site-packages\whisper\assets\multilingual.tiktoken;whisper/assets" ^
--add-data "whisper_env\Lib\site-packages\whisper\assets\gpt2.tiktoken;whisper/assets" ^
--add-data "models\base.en.pt;models" ^
recap_translate.py
```

---

# Audio Flow Overview

```
Zoom (client voice)
   ↓
Krisp Speaker
   ↓
CABLE Input (VB-Audio Virtual Cable)
   ↓
CABLE Output (virtual mic)
   ↙                ↘
Recap App        Windows "Listen to Device" → Your speakers
```

- zoom

```
| Setting        | Device             |
| -------------- | ------------------ |
| **Microphone** | `Krisp Microphone` |
| **Speaker**    | `Krisp Speaker`    |
```

- krisp

```
| Component            | Set To                                 |
| -------------------- | -------------------------------------- |
| **Input (Mic)**      | Your actual microphone                 |
| **Output (Speaker)** | `CABLE Input (VB-Audio Virtual Cable)` |
```

- windows sound

```
| Setting               | Device                                  |
| --------------------- | --------------------------------------- |
| **Playback (Output)** | *Doesn't matter* (Krisp handles it)     |
| **Recording (Input)** | `CABLE Output (VB-Audio Virtual Cable)` |
```

✅ Extra Step (to hear the client):

Go to Sound → Recording tab

Right-click CABLE Output → Properties

Go to Listen tab

✅ Check "Listen to this device"

Set playback to your real headphones/speakers

# how to run

1. install [vb_cable](https://vb-audio.com/Cable/)

2. go windows sound setting, set output to vb_cable

3. run the app before the call

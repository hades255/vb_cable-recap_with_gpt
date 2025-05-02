import sounddevice as sd

# List all audio devices
# for i, device in enumerate(sd.query_devices()):
#     print(f"{i}: {device['name']}")

# for i, d in enumerate(sd.query_devices()):
#     if "CABLE Output" in d['name']:
#         print(i, d['name'])


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


DEVICE_INDEX = find_best_vb_cable_device()

print(DEVICE_INDEX)

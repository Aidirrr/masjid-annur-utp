# Masjid An-Nur UTP · Interactive 3D Visualizer

[![Live Demo](https://img.shields.io/badge/Live_Demo-masjid--annur--utp.netlify.app-00C7B7?style=flat&logo=netlify)](https://masjid-annur-utp.netlify.app)
[![Netlify Status](https://api.netlify.com/api/v1/badges/92707481-2380-42c2-a7ff-6a8ce4d7a9cf/deploy-status)](https://app.netlify.com/sites/masjid-annur-utp/deploys)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=flat&logo=github)](https://github.com/Aidirrr/masjid-annur-utp)
[![Rendering](https://img.shields.io/badge/Rendering-WebGL_2.0_%2F_GLSL-blue?style=flat)](https://www.khronos.org/webgl/)
[![Format](https://img.shields.io/badge/Model-glTF_2.0_Binary_(.glb)-orange?style=flat)](https://www.khronos.org/gltf/)
[![Dependencies](https://img.shields.io/badge/Dependencies-Zero_(Vanilla_JS)-success?style=flat)]()

> 🌐 **Live Web Application**: **[https://masjid-annur-utp.netlify.app](https://masjid-annur-utp.netlify.app)** *(Installable as a PWA on mobile & desktop)*

An interactive, self-contained 3D architectural recreation and living digital twin of **Masjid An-Nur** at Universiti Teknologi PETRONAS (UTP) in Seri Iskandar, Perak, Malaysia.

Built with procedural Python geometry and a zero-dependency WebGL 2.0 engine, it simulates real-time Seri Iskandar sunlight, lake reflections, congregational life, campus events, and interactive community features directly in the browser.

---

## 🎬 Showcase & Tour

![Masjid An-Nur 3D Visualizer Animated Tour](image/masjid-an-nur-tour.gif)

> 📹 *60fps HD video tour available in the repository: [image/masjid-an-nur-tour.mp4](image/masjid-an-nur-tour.mp4)*

![Daytime lakeside view of the 3D model showing the mosque’s dome, arcades and reflections](image/masjid-an-nur-3d-viewer.jpg)

---

## ✨ Features

### 🏛️ Architecture & Interior Spaces
* **Iconic Floating Mosque**: Parametric diamond-lattice grand dome, 60-mullion clerestory drum, tiered brass finial, and colonnaded arcades extending over the lake.
* **Main Prayer Hall & Muslimat Gallery**: Marble mihrab wall, carved teakwood minbar, Qur'anic calligraphy drum frieze, *Bilik Imam & Khatib*, and an accessible upper-floor **Muslimat mezzanine** with privacy lattice screens and *rak telekung*.
* **Dedicated Wudu Wings**: Separated male and female ablution areas with wash bays, drainage troughs, mirrors, and shoe racks.

### 👥 Living Simulation & Campus Life
* **Jumu’ah (Friday Prayer)**: Synchronized congregation sequence with worshippers crossing the causeway, performing wudu, and gathering behind the imam for the khutbah.
* **Thursday · Blessings Over Meals (BOM)**: Special event preset recreating UTP's *Malam Jumaat* tradition with communal *talam* dining along the corridors and evening recitation in the hall.
* **Campus & Wildlife Details**: UTP students with backpacks, parked motorbikes and bicycles near the entrance, children playing on the lawn, flocking lake birds, koi fish schools, and **Si Kucing Masjid** (a roaming mosque cat you can pet).

![Friday congregation seated in the prayer hall facing the imam on the minbar](image/masjid-an-nur-friday-khutbah.jpg)

### 🤝 Interactive Community & Heritage
* **Tabung Masjid & Official DuitNow QR**: Clickable donation boxes at the main foyer and lakeside terrace with the embedded Masjid An-Nur UTP DuitNow QR code.
* **Lakeside Fish Feeding**: Toss virtual fish food to gather the koi school, with an optional RM1 mosque maintenance sponsorship prompt.
* **Rakan Masjid UTP Noticeboard & Live Prayer Times**: Entrance info board displaying real-time JAKIM Perak Zone 2 prayer times and RMUTP community programs.
* **Ayah Explainer & Guided History Tour**: Interactive calligraphy hotspots explaining *Surah An-Nur (24:35)* and *Ayat al-Kursi (2:255)*, plus a guided story tour and outdoor **Contributor & Founder Wall**.
* **Athan Audio & Live Solar Lighting**: Ambient/Athan audio playback alongside live astronomical sun positioning for Seri Iskandar (**4.3858° N, 100.9739° E**) and Sunrise, Day, Sunset, and Night presets.

---

## 🎮 Controls & Navigation

* **Touchscreen**: Opens in first-person mode. Use the left thumbstick to walk, swipe right to look around, tap **Jump** or **Sprint**, and tap nearby prompts beside interactive objects.
* **Keyboard & Mouse**: Use **`W` / `A` / `S` / `D`** to walk, **`Shift`** to sprint, **`Space`** to jump, **`F`** to feed the fish, or switch to **Orbit** mode in **View controls** for 360° camera rotation and 12 preset viewpoints.
* **Explore Menu**: Quick access to the noticeboard, donation boxes, contributor plaque, ayah readings, and guided history tour.

---

## 🚀 How to Run

### Option 1: Live Web App (Netlify)
Open **[https://masjid-annur-utp.netlify.app](https://masjid-annur-utp.netlify.app)** in any modern browser, or jump straight to a viewpoint using URL parameters:

| Viewpoint | Live URL Link |
| :--- | :--- |
| **Daytime Lakeside** | [?light=day&view=lake](https://masjid-annur-utp.netlify.app/?light=day&view=lake) |
| **Main Prayer Hall** | [?light=day&view=hall](https://masjid-annur-utp.netlify.app/?light=day&view=hall) |
| **Friday Khutbah** | [?light=day&scene=friday&phase=2&view=gathering](https://masjid-annur-utp.netlify.app/?light=day&scene=friday&phase=2&view=gathering) |
| **Sunset on the Lake** | [?light=sunset&view=lake](https://masjid-annur-utp.netlify.app/?light=sunset&view=lake) |
| **Live Seri Iskandar Sun** | [?light=live](https://masjid-annur-utp.netlify.app/?light=live) |
| **Clean Capture (No UI)** | [?clean=1&light=day&view=lake](https://masjid-annur-utp.netlify.app/?clean=1&light=day&view=lake) |

### Option 2: Build & Run Locally
Requires **Python 3.10+** (standard library only, zero `pip` dependencies):

```bash
# 1. Compile the glTF 2.0 model and offline bundle
cd annur-viewer/source
python3 build.py

# 2. Serve locally (from repository root)
cd ../..
python3 -m http.server 8080 --directory annur-viewer/dist
```
Then open **[http://localhost:8080](http://localhost:8080)**, or open `annur-viewer/dist/index.html` directly for offline use. You can also import `annur-viewer/dist/Masjid-An-Nur-UTP.glb` into Blender, Unity, Unreal Engine, Godot, or macOS Quick Look.

---

## 🔬 Technical Documentation

All deep engineering details—including the system architecture Mermaid diagram, procedural dome & lathe mathematics, custom `.glb` binary packer, WebGL 2.0 / GLSL shader pipeline, USNO solar algorithm, and technical specifications—have been organized into a dedicated technical reference:

👉 **[Read ARCHITECTURE.md](ARCHITECTURE.md)**

---

## 🤝 Roadmap & Contributing

Check the project enhancement backlog and completed milestones in **[TODO.md](TODO.md)**.

1. **Fork** the repository and create a feature branch (`git checkout -b feature/your-feature`).
2. Edit the procedural Python generators or JS modules in [annur-viewer/source/](annur-viewer/source/).
3. Recompile with `python3 annur-viewer/source/build.py` and test locally.
4. Commit your changes and open a **Pull Request**.

---

## 📜 Acknowledgements
Architectural study and interactive 3D visualizer developed for **Masjid An-Nur, Universiti Teknologi PETRONAS**.
Reference photography, QR assets, and community details courtesy of contributors.

# Masjid An-Nur UTP · Interactive 3D Visualizer

An interactive, self-contained 3D architectural model and living simulation of **Masjid An-Nur** at Universiti Teknologi PETRONAS (UTP) in Seri Iskandar, Perak, Malaysia.

Explore the iconic floating mosque from the lake, step inside the grand domed prayer hall, or experience the Friday prayer congregation with animated worshippers, birds, and real-time sun positioning.

---

## 🎬 3D Model Showcase & Tour

![Masjid An-Nur 3D Visualizer Animated Tour](image/masjid-an-nur-tour.gif)

> 📹 *A high-definition MP4 video tour is also included: [image/masjid-an-nur-tour.mp4](image/masjid-an-nur-tour.mp4)*.

---

## ✨ What I Made

This project is an interactive 3D recreation of Masjid An-Nur UTP, designed to run completely offline in modern web browsers with zero external frameworks or server dependencies.

![Daytime lakeside view of the 3D model showing the mosque’s dome, arcades and reflections](image/masjid-an-nur-3d-viewer.jpg)

### Key Features:
* **Authentic Architecture**:
  * **Central Grand Dome**: Procedurally generated ribbed dome with Islamic diamond lattice patterns and finial, resting on an elevated drum.
  * **Stepped Arcades & Plaza**: Extensive colonnaded walkways topped with multiple miniature cupolas extending out into the lake, based on visual reference views.
  * **Interior Prayer Hall**: Detailed prayer hall with authentic marble mihrab, minbar staircase, Qur'anic calligraphy drum frieze, mezzanine gallery railing, and prayer carpet rows.
  * **Lakeside Setting**: Realistic water shaders with real-time reflections, surrounding tropical hills, causeway approach, and fish feeding terrace.
* **Living Simulation**:
  * **Jumu’ah (Friday Prayer) Sequence**: A choreographed sequence where worshippers arrive across the causeway, perform ablution at the wudu stations, and assemble in prayer rows behind the imam delivering the khutbah from the minbar.
  * **Everyday Activity**: Visitors walking along the terrace, students sitting in Qur'an study circles (**Halaqah**), and visitors washing at wudu stations.
  * **Interactive Fish Feeding**: Press **`F`** or click **Feed fish** on the terrace to toss food and watch schools of koi fish gather in the lake.
  * **Flocking Birds**: Procedurally animated birds soaring over the lake and perching on the mosque rooflines.
* **Solar & Astronomical Lighting**:
  * **Live Seri Iskandar Sun Position**: Real-time solar azimuth and elevation calculated from coordinates (4.3858° N, 100.9739° E) in Malaysia Time (MYT).
  * **Preset Lighting Modes**: Daytime, Sunrise, Golden Sunset, Morning, and Illuminated Night mode with glowing lanterns and water reflections.
* **Exploration Modes**:
  * **Orbit Mode**: Smooth orbit camera with zoom, pan, and 12 curated viewpoints.
  * **First-Person Tour**: Walk freely across the plaza, corridors, and prayer hall using **`W` / `A` / `S` / `D`** (hold **`Shift`** to sprint).

![Friday congregation seated in the prayer hall facing the imam on the minbar](image/masjid-an-nur-friday-khutbah.jpg)

---

## 🛠️ How I Made It

The project combines procedural 3D geometric modeling in Python with a custom lightweight WebGL 2.0 rendering engine:

### 1. Visual Reference & Screenshot Alignment
The dimensions and layout follow actual reference photographs, high-angle drone views, and site screenshots:
* **Overhead & Aerial Perspective**: High-angle drone imagery and satellite views guided the stepped terrace perimeter, lakeside topography, and arcade alignment.
* **Interior & Structural Details**: On-site reference photographs were used to accurately place columns, arcade grids, prayer hall bounds, mezzanine railings, and wudu areas.
* **Texture Studies**: Authentic photographs of the marble mihrab ([image/mihrab-marble-wall-detail.jpeg](image/mihrab-marble-wall-detail.jpeg)) and calligraphy bands were processed into custom PBR textures.

### 2. Procedural Geometry Engine (`annur-viewer/source/`)
Rather than relying solely on monolithic 3D sculpting software, the architecture is procedurally constructed using clean, mathematically defined Python generators:
* **`annur_arch.py`**: Constructs the mosque superstructure, dome lathe profiles, stepped arcade columns, cupolas, and glazing curtain-walls.
* **`main_hall.py`**: Builds the interior prayer space, minbar, calligraphy drum, balcony railings, and prayer rows.
* **`annur_land.py`**: Models the lake basin, causeway bridge, stepped plazas, and surrounding low-poly terrain hills.
* **`build.py`**: A custom glTF 2.0 exporter that packs geometry into standard binary GLB files (`Masjid-An-Nur-UTP.glb`) with vertex normals, UV coordinates, and PBR metallic-roughness materials. It also bundles the entire application into a self-contained, gzip-compressed offline viewer (`annur-viewer/dist/index.html`).

### 3. Pure WebGL Engine (`viewer.js`, `miniatures.js`, `birds.js`)
* **Zero Heavy Dependencies**: Built with native WebGL 2.0 and GLSL shaders, ensuring fast load times and high framerates on both desktop and mobile.
* **Autonomous Agent AI**: `miniatures.js` manages state machines for worshippers (walking, sitting, praying, washing), while `birds.js` runs a 3D boid flocking simulation.

---

## 🚀 How to Run the Visualizer

### Option 1: Direct File Opening (No Server Needed)
Simply open the self-contained build file in Google Chrome or any modern browser:
* [annur-viewer/dist/index.html](annur-viewer/dist/index.html)

### Option 2: Local HTTP Server
Run a local Python server from the repository root:
```bash
python3 -m http.server 8080 --directory annur-viewer/dist
```
Then visit **[http://localhost:8080](http://localhost:8080)** in your browser.

### URL Query Parameters
You can jump directly to specific viewpoints and lighting presets:
* Daytime Lakeside: `http://localhost:8080/?light=day&view=lake`
* Inside Mosque: `http://localhost:8080/?light=day&view=hall`
* Friday Khutbah: `http://localhost:8080/?light=day&scene=friday&phase=2&view=gathering`
* Clean Screenshot Mode (hides UI): `http://localhost:8080/?clean=1&light=day&view=lake`

### Standalone 3D Model (GLB)
The compiled [Masjid-An-Nur-UTP.glb](annur-viewer/dist/Masjid-An-Nur-UTP.glb) (5.3 MB) file is standard glTF 2.0. You can import it directly into **Blender**, **Unity**, **Unreal Engine**, **Godot**, or view it with macOS Quick Look (press Space in Finder).

---

## 🤝 Feel Free to Contribute & Make It Better!

Contributions, ideas, and improvements are very welcome! Here are some exciting areas to explore:

* **Architectural Details**: Adding chandeliers, interior lighting fixtures, acoustic paneling, or detailed ablution fountain stations.
* **Landscape & Foliage**: Enhancing surrounding trees, water lilies, and shoreline vegetation.
* **Audio & Atmosphere**: Adding spatial 3D audio (ambient water ripples, breeze, call to prayer / adhan, and recitation).
* **WebXR / VR Tour**: Enabling VR headsets for a fully immersive walkthrough inside the prayer hall.
* **Performance Optimizations**: Further shader optimizations and level-of-detail (LOD) handling for lower-powered mobile devices.

### How to Contribute:
1. **Fork** the repository.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/masjid-annur-utp.git
   cd masjid-annur-utp
   ```
3. Make your changes in `annur-viewer/source/`.
4. Rebuild the 3D model and offline viewer:
   ```bash
   cd annur-viewer/source
   python3 build.py
   ```
5. Test your changes locally in your browser.
6. Commit your changes and open a **Pull Request**!

---

## 📜 License & Acknowledgements
Architectural study and visualizer developed for **Masjid An-Nur, Universiti Teknologi PETRONAS**.
Reference photographs and visual documentation courtesy of community contributors.

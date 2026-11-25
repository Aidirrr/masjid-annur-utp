"""Build a standard, colour-managed glTF model and an offline viewer."""
import base64
import gzip
import hashlib
from datetime import datetime, timezone
import json
import math
import struct
from collections import defaultdict
from functools import lru_cache
from pathlib import Path

import annur_arch
import annur_land
import main_hall

SRC = Path(__file__).resolve().parent
DIST = SRC.parent / "dist"


def sub(a, b):
    return tuple(x-y for x,y in zip(a,b))


def cross(a, b):
    return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])


def unit(v):
    length = math.hypot(*v)
    return tuple(a/length for a in v) if length else (0, 1, 0)


@lru_cache(maxsize=None)
def color_bytes(hex_color):
    def linear(i):
        v = int(hex_color[i:i+2], 16)/255
        return round(255*(v/12.92 if v<=0.04045 else ((v+.055)/1.055)**2.4))
    return bytes([linear(1),linear(3),linear(5),255])


class Scene:
    def __init__(self):
        self.parts = defaultdict(bytearray)
        self.textures = {}

    def tri(self, name, a, b, c, color, normals=None, uv=None):
        n = cross(sub(b,a),sub(c,a))
        if math.hypot(*n) < 1e-10:
            return
        normals = normals or [unit(n)]*3
        rgba = color_bytes(color)
        for i,(p,normal) in enumerate(zip((a,b,c),normals)):
            vertex=struct.pack('<6f',*p,*normal)+rgba
            self.parts[name].extend(vertex if uv is None else vertex+struct.pack('<2f',*uv[i]))

    def textured_tri(self, name, image, points, uv):
        self.textures[name] = image
        self.tri(name, *points, '#ffffff', uv=uv)

    def quad(self, name, a,b,c,d, color):
        self.tri(name,a,b,c,color)
        self.tri(name,a,c,d,color)

    def box(self,name,center,size,color):
        pts=[tuple(center[k]+size[k]*(1 if (i>>k)&1 else -1)/2 for k in range(3)) for i in range(8)]
        for face in ((0,4,6,2),(1,3,7,5),(0,1,5,4),(2,6,7,3),(0,2,3,1),(4,5,7,6)):
            self.quad(name, *(pts[j] for j in face),color)

    def beam(self,name,a,b,radius,color,sides=8):
        axis=unit(sub(b,a))
        u=unit(cross(axis,(1,0,0) if abs(axis[0])<.8 else (0,0,1)))
        v=cross(axis,u)
        def ring(p):
            return [tuple(p[k]+radius*(u[k]*math.cos(i*math.tau/sides)+v[k]*math.sin(i*math.tau/sides)) for k in range(3)) for i in range(sides)]
        lo,hi=ring(a),ring(b)
        for i in range(sides):
            j=(i+1)%sides
            self.quad(name,lo[i],lo[j],hi[j],hi[i],color)
            self.tri(name,a,lo[j],lo[i],color)
            self.tri(name,b,hi[i],hi[j],color)

    def lathe(self,name,cx,cz,profile,color,segments=64,capped=True):
        angles=[(math.cos(i*math.tau/segments),math.sin(i*math.tau/segments)) for i in range(segments)]
        rings=[[(cx+r*x,y,cz+r*z) for x,z in angles] for y,r in profile]
        for k,(lo,hi) in enumerate(zip(rings,rings[1:])):
            y,r=profile[k]
            yn,rn=profile[k+1]
            normals=[unit(((yn-y)*x,r-rn,(yn-y)*z)) for x,z in angles]
            for i in range(segments):
                j=(i+1)%segments
                self.tri(name,lo[i],hi[i],hi[j],color,(normals[i],normals[i],normals[j]))
                self.tri(name,lo[i],hi[j],lo[j],color,(normals[i],normals[j],normals[j]))
        if not capped:
            return
        for i in range(segments):
            j=(i+1)%segments
            self.tri(name,(cx,profile[-1][0],cz),rings[-1][j],rings[-1][i],color)
            self.tri(name,(cx,profile[0][0],cz),rings[0][i],rings[0][j],color)

    def glb(self):
        doc={'asset':{'version':'2.0','generator':'Masjid An-Nur architectural study'},'scene':0,
             'scenes':[{'name':'Masjid An-Nur, UTP','nodes':[]}], 'nodes':[], 'meshes':[], 'buffers':[],
             'bufferViews':[], 'accessors':[], 'materials':[]}
        binary=bytearray()
        texture_ids = {}
        for name, raw in self.parts.items():
            texture = self.textures.get(name)
            stride = 36 if texture else 28
            # Indexed vertices preserve hard edges, materials and GLB editability.
            vertices={}
            indices=[]
            for i in range(0,len(raw),stride):
                key=bytes(raw[i:i+stride])
                if key not in vertices:
                    vertices[key]=len(vertices)
                indices.append(vertices[key])
            offset=len(binary)
            binary.extend(b''.join(v[:28] for v in vertices))
            view=len(doc['bufferViews'])
            doc['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(vertices)*28,'byteStride':28,'target':34962})
            positions=list(zip(*(struct.unpack_from('<3f',v) for v in vertices)))
            acc=len(doc['accessors'])
            for ofs,t,ct,extra in [(0,'VEC3',5126,{'min':[min(p) for p in positions],'max':[max(p) for p in positions]}),(12,'VEC3',5126,{}),(24,'VEC4',5121,{'normalized':True})]:
                doc['accessors'].append({'bufferView':view,'byteOffset':ofs,'componentType':ct,'count':len(vertices),'type':t,**extra})
            large=len(vertices)>65535
            packed=struct.pack('<'+('I' if large else 'H')*len(indices),*indices)
            doc['bufferViews'].append({'buffer':0,'byteOffset':len(binary),'byteLength':len(packed),'target':34963})
            binary.extend(packed)
            binary.extend(b'\0'*(-len(binary)%4))
            doc['accessors'].append({'bufferView':view+1,'componentType':5125 if large else 5123,'count':len(indices),'type':'SCALAR'})
            material=len(doc['materials'])
            metallic=.33 if any(k in name.lower() for k in ('aluminium','finial','seams','handrail')) else .05
            glass=any(k in name.lower() for k in ('glazing','turquoise','curtain-wall'))
            doc['materials'].append({'name':name,'doubleSided':True,'pbrMetallicRoughness':{'metallicFactor':metallic,'roughnessFactor':.23 if glass else .64}})
            doc['meshes'].append({'name':name,'primitives':[{'attributes':{'POSITION':acc,'NORMAL':acc+1,'COLOR_0':acc+2},'indices':acc+3,'material':material}]})
            if name == 'Clear architectural glazing':
                doc['materials'][-1].update(alphaMode='BLEND',doubleSided=False)
                doc['materials'][-1]['pbrMetallicRoughness']['baseColorFactor'] = [1,1,1,.12]
            if texture:
                uv_view = len(doc['bufferViews'])
                uv_data = b''.join(v[28:] for v in vertices)
                doc['bufferViews'].append({'buffer':0,'byteOffset':len(binary),'byteLength':len(uv_data),'target':34962})
                binary.extend(uv_data)
                attributes = doc['meshes'][-1]['primitives'][0]['attributes']
                attributes['TEXCOORD_0'] = len(doc['accessors'])
                doc['accessors'].append({'bufferView':uv_view,'componentType':5126,'count':len(vertices),'type':'VEC2'})
                if texture not in texture_ids:
                    image = (SRC/'materials'/texture).read_bytes()
                    image_view = len(doc['bufferViews'])
                    doc['bufferViews'].append({'buffer':0,'byteOffset':len(binary),'byteLength':len(image)})
                    binary.extend(image)
                    binary.extend(b'\0'*(-len(binary)%4))
                    texture_ids[texture] = len(texture_ids)
                    doc.setdefault('images',[]).append({'bufferView':image_view,'mimeType':'image/jpeg'})
                    doc.setdefault('textures',[]).append({'source':texture_ids[texture]})
                doc['materials'][-1]['pbrMetallicRoughness']['baseColorTexture'] = {'index':texture_ids[texture]}
            doc['scenes'][0]['nodes'].append(material)
            doc['nodes'].append({'name':name,'mesh':material})
        doc['buffers'].append({'byteLength':len(binary)})
        js=json.dumps(doc,separators=(',',':')).encode()
        js+=b' '*(-len(js)%4)
        return struct.pack('<4sII',b'glTF',2,28+len(js)+len(binary))+struct.pack('<I4s',len(js),b'JSON')+js+struct.pack('<I4s',len(binary),b'BIN\0')+binary


class OverheadPlan(Scene):
    """Ground-plan X increases to the right on the aerial, with qibla at the top.
    Looking toward +Z inside the model, screen-right is world -X.
    """
    def __init__(self, scene):
        self.scene = scene

    def tri(self, name, a, b, c, color, normals=None):
        def mirror(p):
            return (-p[0], p[1], p[2])
        reflected = [mirror(normals[i]) for i in (0,2,1)] if normals else None
        self.scene.tri(name, mirror(a), mirror(c), mirror(b), color, reflected)


def embedded(data):
    return base64.b64encode(gzip.compress(data,compresslevel=8,mtime=0)).decode()


if __name__=='__main__':
    DIST.mkdir(exist_ok=True)
    arch,land=Scene(),Scene()
    plan=OverheadPlan(arch)
    annur_arch.build(plan)
    main_hall.build(arch)
    annur_land.build_plaza(plan)
    annur_land.build(OverheadPlan(land))
    model=arch.glb()
    (DIST/'Masjid-An-Nur-UTP.glb').write_bytes(model)
    viewer=(SRC/'viewer.js').read_text().replace('/* MINIATURES_SCRIPT */',(SRC/'miniatures.js').read_text()+'\n'+(SRC/'birds.js').read_text())
    for marker, filename in [('AUDIO_SCRIPT','audio.js'), ('COMMUNITY_SCRIPT','community.js'), ('INTERACTION_SCRIPT','interaction.js')]:
        viewer=viewer.replace('/* '+marker+' */',(SRC/filename).read_text())
    qr = (SRC.parent.parent/'sedekahje-masjid-an-nur-utp.png').read_bytes()
    viewer=viewer.replace('__MOSQUE_QR__','data:image/png;base64,'+base64.b64encode(qr).decode())
    page=(SRC/'viewer.html').read_text().replace('/* VIEWER_SCRIPT */',viewer)
    page=page.replace('__NAMES_DATA__',(SRC/'names.json').read_text())
    page=page.replace('__QURAN_DATA__',(SRC/'quran.txt').read_text())
    page=page.replace('__FONT_LICENSE__',(SRC/'materials'/'naskh-license.txt').read_text())
    for marker,file,mime in [('__NASKH__','naskh.ttf','font/ttf'),('__MASJID_LOGO__','masjid-logo.png','image/png'),('__ATHAN__','athan.mp3','audio/mpeg'),('__MEOW__','meow.mp3','audio/mpeg')]:
        encoded=base64.b64encode((SRC/'materials'/file).read_bytes()).decode()
        page=page.replace(marker,'data:'+mime+';base64,'+encoded)
    (DIST/'manifest.webmanifest').write_bytes((SRC/'manifest.webmanifest').read_bytes())
    (DIST/'app-icon.png').write_bytes((SRC/'materials'/'app-icon.png').read_bytes())
    page=page.replace('__ARCH_DATA__',embedded(model)).replace('__LAND_DATA__',embedded(land.glb()))
    version=hashlib.sha256(page.encode()).hexdigest()[:12]
    page=page.replace('__MODEL_VERSION__',version).replace('__BUILD_TIME__',datetime.now(timezone.utc).isoformat(timespec='seconds'))
    (DIST/'index.html').write_text(page)
    print('Wrote GLB and offline viewer.',len(model),'GLB bytes')

'use strict';
const $ = id => document.getElementById(id);
const canvas=$('scene'), statusBox=$('status'), preset=$('preset');
const TAU=Math.PI*2, fov=.61;
const environments={
    day:{direction:[-.51,.83,.39],horizon:[.82,.865,.84],zenith:[.36,.64,.80],cloud:[.98,.965,.90],
        ambient:[1,1,1],direct:[.85,.75,.59],water:[.255,.42,.37],lamps:0},
    night:{direction:[.47,.61,-.64],horizon:[.13,.18,.29],zenith:[.019,.033,.092],cloud:[.16,.19,.30],
        ambient:[.085,.12,.22],direct:[.055,.093,.20],water:[.035,.072,.12],lamps:1},
    morning:{direction:[.70,.53,-.47],horizon:[.98,.91,.76],zenith:[.47,.74,.89],cloud:[1,.97,.86],
        ambient:[1.04,.98,.88],direct:[1.02,.86,.60],water:[.31,.46,.39],lamps:0},
    sunrise:{direction:[.87,.18,-.46],horizon:[.99,.72,.62],zenith:[.49,.55,.78],cloud:[1,.79,.73],
        ambient:[.83,.65,.78],direct:[1.18,.59,.31],water:[.39,.32,.37],lamps:.12},
    sunset:{direction:[-.87,.14,.46],horizon:[.97,.54,.32],zenith:[.31,.32,.56],cloud:[.98,.58,.43],
        ambient:[.73,.48,.55],direct:[1.28,.48,.17],water:[.34,.23,.27],lamps:.30}
};
// Perak e-Masjid lists the site at 4.38587194 N, 100.97396424 E.
// Solar coordinates follow aa.usno.navy.mil/faq/sun_approx. The model's
// positive Z axis points toward the mihrab, aligned here to the qibla bearing.
const siteLatitude=4.38587194,siteLongitude=100.97396424,rad=Math.PI/180;
const clockFormat=new Intl.DateTimeFormat('en-MY',{timeZone:'Asia/Kuala_Lumpur',hour:'numeric',minute:'2-digit',hour12:true});
let lightingMode='live',lastLightMinute=-1,nightAmount=0,skyDisk=1;
let environment=environments.day,sun=normalize(environment.direction);
function solarPosition(ms){
    const days=(ms-Date.UTC(2000,0,1,12))/86400000;
    const anomaly=(357.529+.98560028*days)*rad;
    const longitude=(280.459+.98564736*days+1.915*Math.sin(anomaly)+.020*Math.sin(2*anomaly))*rad;
    const tilt=(23.439-.00000036*days)*rad;
    const ra=Math.atan2(Math.cos(tilt)*Math.sin(longitude),Math.cos(longitude));
    const dec=Math.asin(Math.sin(tilt)*Math.sin(longitude));
    const hour=((280.46061837+360.98564736629*days+siteLongitude)%360)*rad-ra;
    const lat=siteLatitude*rad,east=-Math.cos(dec)*Math.sin(hour);
    const north=Math.sin(dec)*Math.cos(lat)-Math.cos(dec)*Math.cos(hour)*Math.sin(lat);
    const up=Math.sin(lat)*Math.sin(dec)+Math.cos(lat)*Math.cos(dec)*Math.cos(hour);
    const delta=(39.8262-siteLongitude)*rad;
    const bearing=Math.atan2(Math.sin(delta),Math.cos(lat)*Math.tan(21.4225*rad)-Math.sin(lat)*Math.cos(delta));
    return {altitude:Math.asin(up)/rad,rising:east>0,direction:[
        -east*Math.cos(bearing)+north*Math.sin(bearing),up,east*Math.sin(bearing)+north*Math.cos(bearing)]};
}
function liveEnvironment(ms){
    const solar=solarPosition(ms),h=solar.altitude;
    const stops=solar.rising?[[-7,'night'],[2,'sunrise'],[18,'morning'],[36,'day']]:[[-7,'night'],[2,'sunset'],[29,'day']];
    const i=stops.findIndex(row=>h<=row[0]);
    const upper=i<0?stops.length-1:i,lower=Math.max(0,upper-1);
    const [lowH,lowKey]=stops[lower],[highH,highKey]=stops[upper];
    const u=clamp((h-lowH)/(highH-lowH||1),0,1),t=u*u*(3-2*u);
    const a=environments[lowKey],b=environments[highKey],mix=(x,y)=>x+(y-x)*t;
    const lighting={};
    for(const key of ['horizon','zenith','cloud','ambient','direct','water'])lighting[key]=a[key].map((v,c)=>mix(v,b[key][c]));
    lighting.lamps=mix(a.lamps,b.lamps);
    const night=mix(lowKey==='night'?1:0,highKey==='night'?1:0);
    const direction=solar.direction.map((v,c)=>mix(c===1?Math.max(.04,v):v,environments.night.direction[c],night));
    return {lighting,sun:normalize(direction),night,disc:clamp((h+.8)/1.1,0,1)};
}
function setLighting(key,now=Date.now()){
    if(key!=='live' && !Object.hasOwn(environments,key))return;
    lightingMode=key;
    if(key==='live'){
        const state=liveEnvironment(now);
        environment=state.lighting;sun=state.sun;nightAmount=state.night;skyDisk=state.disc;
        lastLightMinute=Math.floor(now/60000);
        $('liveTime').textContent='Live · '+clockFormat.format(now).toUpperCase()+' MYT';
    }else{
        environment=environments[key];sun=normalize(environment.direction);nightAmount=key==='night'?1:0;skyDisk=1;
    }
    if(renderer && !renderer.still)renderer.updateShadows();
    dirty=true;
}
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
function normalize(v){const d=Math.hypot(...v)||1;return v.map(k=>k/d)}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function dot(a,b){return a.reduce((s,n,i)=>s+n*b[i],0)}
function multiply(a,b){
    const out=new Float32Array(16);
    for(let col=0;col<4;col++) for(let row=0;row<4;row++)
        for(let k=0;k<4;k++) out[col*4+row]+=a[k*4+row]*b[col*4+k];
    return out;
}
function view(eye,target){
    const back=normalize(eye.map((n,i)=>n-target[i])),right=normalize(cross([0,1,0],back)),up=cross(back,right);
    return [right[0],up[0],back[0],0,right[1],up[1],back[1],0,right[2],up[2],back[2],0,-dot(right,eye),-dot(up,eye),-dot(back,eye),1];
}
function fieldOfView(){return camera.fov||fov;}
function perspective(aspect){
    const f=1/Math.tan(fieldOfView()/2), near=clamp(camera.distance*.009,.07,1.4), far=1050;
    return [f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0];
}
const cameraViews={
    lake:{yaw:.68,pitch:.247,scale:1.19,target:[7,7,-8]},
    aerial:{yaw:3.10,pitch:1.36,scale:2.05,target:[1,1,-32]},
    waterside:{yaw:-.80,pitch:-.083,distance:62,target:[1,8,2],eye:[-39.72,2.68,43.5],fov:1.06},
    qibla:{yaw:Math.PI,pitch:-.09,distance:18,target:[0,4.6,15],eye:[0,3.0,-1.9],fov:.98},
    gallery:{yaw:0,pitch:-.23,distance:14,target:[0,5.7,-2],eye:[0,2.92,9],fov:1.12},
    street:{yaw:-Math.PI/2,pitch:-.065,distance:34,target:[-41,4,-29.8],eye:[-67,2.88,-29.8],fov:.86},
    court:{yaw:3.56,pitch:.23,scale:.99,target:[0,5,-6]},
    hall:{yaw:3.037,pitch:-.59,distance:9.33,target:[0,8.1,6.6],eye:[.8,2.75,-1],fov:1.57},
    prayer:{yaw:2.57,pitch:.24,distance:5.4,target:[.9,2.25,-12.8]},
    wudu:{yaw:2.09,pitch:.13,distance:6.9,target:[-40.3,1.95,-18.9]},
    halaqah:{yaw:.60,pitch:.46,distance:3.46,target:[-4,2,6.05]},
    feeding:{yaw:.66,pitch:.28,distance:9.1,target:[8,1.25,24.85]},
    roofbirds:{yaw:2.82,pitch:.20,distance:7,target:[3.1,8.10,-18.64]},
    arrivals:{yaw:.94,pitch:.30,distance:37,target:[1,1.65,-31]},
    gathering:{yaw:2.74,pitch:.19,distance:5,eye:[4.4,3.48,-.50],target:[0,3,7],fov:1.04},
    dome:{yaw:.57,pitch:.23,scale:.37,target:[0,16.5,5.6]}
};
let camera,transition=null,renderer=null,miniatures=null,modelBytes=null,dirty=true;
// Bake a ground-height and wall-clearance map from the displayed geometry.
// Both renderers use the same map, including the entrance steps and ramps.
class WalkingMap {
    constructor(parts){
        this.step=.20;this.x0=-80;this.z0=-95;this.width=800;this.height=750;
        this.floor=new Float32Array(this.width*this.height).fill(-Infinity);
        this.blocked=new Uint8Array(this.floor.length);
        const floors=/paving|carpet|landing|stair nosings|lake elevation stairs|plaza limestone|plaza lawn|stepped plaza walk|court entrance extension|service colonnade deck|ramp|threshold|wudu.*(tile|floor)|lawns|lakeside walk/i;
        const walls=/envelope|glazing|wall|portal jamb|pier|column|handrail|cistern|lectern|bollard|wudu.*(seat|stool|bench|partition)|qibla marble|street portal|marble ashlar/i;
        for(const part of parts){
            const ground=floors.test(part.name),wall=walls.test(part.name);
            if(!ground&&!wall)continue;
            const v=new Float32Array(part.vertices.buffer,part.vertices.byteOffset,part.vertices.byteLength/4);
            for(let k=0;k<part.indices.length;k+=3){
                const a=part.indices[k]*7,b=part.indices[k+1]*7,c=part.indices[k+2]*7;
                const top=Math.max(v[a+1],v[b+1],v[c+1]),bottom=Math.min(v[a+1],v[b+1],v[c+1]);
                if(ground&&top<4&&bottom>.01)this.surface(v,a,b,c);
                if(wall){
                    const level=/seat|stool|bench/i.test(part.name)?1.46:2.02;
                    if(bottom<level&&top>level)this.wallSlice(v,[a,b,c],level);
                }
            }
        }
    }
    surface(v,a,b,c){
        const ax=v[a],az=v[a+2],bx=v[b]-ax,bz=v[b+2]-az,cx=v[c]-ax,cz=v[c+2]-az,det=bx*cz-cx*bz;
        if(Math.abs(det)<.00001)return;
        const ix=x=>(x-this.x0)/this.step,iz=z=>(z-this.z0)/this.step;
        const x0=Math.max(0,Math.floor(ix(ax+Math.min(0,bx,cx)))),x1=Math.min(this.width-1,Math.ceil(ix(ax+Math.max(0,bx,cx))));
        const z0=Math.max(0,Math.floor(iz(az+Math.min(0,bz,cz)))),z1=Math.min(this.height-1,Math.ceil(iz(az+Math.max(0,bz,cz))));
        for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++){
            const dx=this.x0+(x+.5)*this.step-ax,dz=this.z0+(z+.5)*this.step-az;
            const u=(dx*cz-dz*cx)/det,w=(bx*dz-bz*dx)/det;
            if(u<-.0001||w<-.0001||u+w>1.0001)continue;
            const i=z*this.width+x,y=v[a+1]+u*(v[b+1]-v[a+1])+w*(v[c+1]-v[a+1]);
            this.floor[i]=Math.max(this.floor[i],y);
        }
    }
    cell(x,z){
        const col=Math.floor((x-this.x0)/this.step),row=Math.floor((z-this.z0)/this.step);
        return col>=0&&row>=0&&col<this.width&&row<this.height?row*this.width+col:-1;
    }
    wallSlice(v,ids,y){
        const pts=[];
        for(let i=0;i<3;i++){
            const a=ids[i],b=ids[(i+1)%3];
            if((v[a+1]<y)===(v[b+1]<y))continue;
            const t=(y-v[a+1])/(v[b+1]-v[a+1]);
            pts.push([v[a]+t*(v[b]-v[a]),v[a+2]+t*(v[b+2]-v[a+2])]);
        }
        if(pts.length!==2)return;
        const [[x,z],[ex,ez]]=pts,n=Math.max(1,Math.ceil(Math.hypot(ex-x,ez-z)/.08));
        for(let j=0;j<=n;j++){
            const i=this.cell(x+(ex-x)*j/n,z+(ez-z)*j/n);
            if(i>=0)this.blocked[i]=1;
        }
    }
    ground(x,z){
        const i=this.cell(x,z);
        return i<0||this.blocked[i]?-Infinity:this.floor[i];
    }
    canStep(x,z,from){
        for(const [dx,dz] of [[0,0],[.18,0],[-.18,0],[0,.18],[0,-.18]]){
            if(Math.abs(this.ground(x+dx,z+dz)-from)>.46)return false;
        }
        return true;
    }
}
const walkStarts={
    waterside:[-40.8,24,-1.12,-.10],qibla:[0,-1.9,Math.PI,-.09],gallery:[0,9,0,-.23],
    street:[-46.5,-29.8,-Math.PI/2,-.20],roofbirds:[2,-23,Math.PI,-.77],arrivals:[2,-32,Math.PI,0],gathering:[4.4,-.50,2.74,0],
    lake:[0,-29,Math.PI,0],court:[0,-29,Math.PI,0],aerial:[0,-43,Math.PI,0],dome:[0,7,Math.PI,-1.15],
    hall:[1,-1,3.05,-.32],prayer:[3.6,-16.8,2.55,.19],feeding:[8.9,22.1,2.93,.54],
    wudu:[-34.3,-22.4,2.09,.13],halaqah:[-2.25,8.6,.60,.35]
};
let walkMap=null,walking=false,lastOrbit='lake';
const held=new Set();
function enterAt(id){
    const [x,z,yaw,pitch]=walkStarts[id]||walkStarts.lake;
    camera={eye:[x,walkMap.ground(x,z)+1.62,z],yaw,pitch,distance:3,fov:1.25,target:[x,2,z]};
    transition=null;dirty=true;preset.value=id;held.clear();
}
function setWalking(on){
    if(!walkMap){$('walk').checked=false;return;}
    if(on===walking)return;
    followFriday=false;walking=on;held.clear();lastOrbitTime=null;rotateControl.disabled=on;
    $('walk').checked=on;$('walkPad').hidden=!on;
    $('walkHint').hidden=!on;
    if(on){lastOrbit=cameraViews[preset.value]?preset.value:'lake';enterAt(lastOrbit);}
    else chooseView(lastOrbit,false);
    canvas.focus({preventScroll:true});
}
function walkStep(dt){
    const ahead=Number(held.has('w')||held.has('arrowup'))-Number(held.has('s')||held.has('arrowdown'));
    const side=Number(held.has('d'))-Number(held.has('a'));
    const turn=Number(held.has('arrowleft'))-Number(held.has('arrowright'));
    if(turn){camera.yaw+=turn*dt*1.65;dirty=true;}
    if(!ahead&&!side)return;
    const speed=held.has('shift')||$('fast').checked?10:5;
    const step=speed*dt/Math.hypot(ahead,side),eye=camera.eye,cs=Math.cos(camera.yaw),sn=Math.sin(camera.yaw);
    const dx=(side*cs-ahead*sn)*step,dz=(-side*sn-ahead*cs)*step;
    // Sample along fast strides so a long frame cannot skip a thin wall.
    const n=Math.ceil(Math.hypot(dx,dz)/.12);
    for(let i=0;i<n;i++){
        if(walkMap.canStep(eye[0]+dx/n,eye[2],walkMap.ground(eye[0],eye[2])))eye[0]+=dx/n;
        if(walkMap.canStep(eye[0],eye[2]+dz/n,walkMap.ground(eye[0],eye[2])))eye[2]+=dz/n;
    }
    eye[1]=walkMap.ground(eye[0],eye[2])+1.62;dirty=true;
}

function fitDistance(){return Math.max(51,91/Math.max(.38,canvas.clientWidth/Math.max(1,canvas.clientHeight)))/(2*Math.tan(fov/2))}
function presetCamera(id){
    const p=cameraViews[id];
    return {eye:p.eye,fov:p.fov,yaw:p.yaw,pitch:p.pitch,distance:p.distance||fitDistance()*p.scale,target:p.target.slice()};
}
function chooseView(id,animated=true){
    if(walking){enterAt(id);return;}
    const next=presetCamera(id);
    preset.value=id;
    if(animated&&camera&&!next.eye&&!camera.eye&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
        next.yaw=camera.yaw+Math.atan2(Math.sin(next.yaw-camera.yaw),Math.cos(next.yaw-camera.yaw));
        transition={start:performance.now(),from:camera,to:next};
    }else{camera=next;transition=null}
    dirty=true;
}
function custom(){followFriday=false;transition=null;if(!walking)preset.value='custom';dirty=true}
function zoom(factor){if(!camera)return;custom();if(camera.eye)camera.fov=clamp(camera.fov*factor,.40,1.74);else camera.distance=clamp(camera.distance*factor,.9,Math.max(210,fitDistance()*1.7))}
function orbit(x,y){if(!camera)return;custom();camera.yaw-=x;camera.pitch=clamp(camera.pitch+y,camera.eye?-1.48:.075,1.49)}
function pose(){
    const {yaw,pitch,target,distance}=camera;
    const back=[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)];
    const eye=camera.eye||target.map((v,i)=>v+distance*back[i]);
    const lookAt=camera.eye?eye.map((v,i)=>v-back[i]):target;
    const right=normalize(cross([0,1,0],back)), up=cross(back,right);
    return {eye,back,right,up,vp:multiply(perspective(canvas.width/canvas.height),view(eye,lookAt))};
}
async function unpack(id){
    const data=Uint8Array.from(atob($(id).textContent.trim()),c=>c.charCodeAt(0));
    return new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
}
async function parseModel(data){
    const dv=new DataView(data),len=dv.getUint32(12,true),start=28+len;
    const doc=JSON.parse(new TextDecoder().decode(new Uint8Array(data,20,len)));
    const images=await Promise.all((doc.images||[]).map(img=>{
        const view=doc.bufferViews[img.bufferView];
        const bytes=new Uint8Array(data,start+view.byteOffset,view.byteLength);
        return createImageBitmap(new Blob([bytes],{type:img.mimeType}));
    }));
    return doc.meshes.map(mesh=>{
        const p=mesh.primitives[0],a=doc.accessors[p.attributes.POSITION],b=doc.bufferViews[a.bufferView],i=doc.accessors[p.indices],idx=doc.bufferViews[i.bufferView];
        const m=doc.materials[p.material].pbrMetallicRoughness;
        const coords=doc.accessors[p.attributes.TEXCOORD_0];
        const uv=coords?new Float32Array(data,start+doc.bufferViews[coords.bufferView].byteOffset,2*coords.count):null;
        const image=m.baseColorTexture?images[doc.textures[m.baseColorTexture.index].source]:null;
        return {name:mesh.name,uv,image,vertices:new Uint8Array(data,start+b.byteOffset,b.byteLength),
            indices:i.componentType===5125?new Uint32Array(data,start+idx.byteOffset,i.count):new Uint16Array(data,start+idx.byteOffset,i.count),
            roughness:m.roughnessFactor,metal:m.metallicFactor};
    });
}

// A single draw can cover all opaque parts that share shader settings. Keep
// object names in the downloadable GLB and merge only the GPU upload.
function surfaceKind(name){
    if(name==='Travertine paving')return 3;
    if(name==='Lake fish')return -2;
    if(/downlights|Bollard lenses/i.test(name))return 6;
    if(/marble|stone panels|stone bays|stone mihrab/i.test(name))return 4;
    if(/carpet|woven prayer/i.test(name))return 5;
    if(/Tree crowns|Palm fronds/.test(name))return 2;
    if(/Banks|Ridges|Lawns|Woodland/.test(name))return 1;
    return 0;
}
function staticBatches(parts){
    const groups=new Map(),individual=[];
    for(const part of parts){
        if(part.image || part.name==='Clear architectural glazing'){individual.push(part);continue;}
        const key=surfaceKind(part.name)+'/'+part.roughness;
        if(!groups.has(key))groups.set(key,[]);
        groups.get(key).push(part);
    }
    return Array.from(groups.values(),group=>{
        const vertices=new Uint8Array(group.reduce((n,p)=>n+p.vertices.length,0));
        const indices=new Uint32Array(group.reduce((n,p)=>n+p.indices.length,0));
        let byteOffset=0,indexOffset=0;
        for(const part of group){
            vertices.set(part.vertices,byteOffset);
            const base=byteOffset/28;
            for(let i=0;i<part.indices.length;i++)indices[indexOffset++]=base+part.indices[i];
            byteOffset+=part.vertices.length;
        }
        return {name:group[0].name,roughness:group[0].roughness,vertices,indices};
    }).concat(individual);
}

const sceneVS=`#version 300 es
layout(location=0) in vec3 pos;layout(location=1) in vec3 normal;layout(location=2) in vec4 color;
layout(location=3) in vec2 uv;out vec2 surfaceUV;
uniform mat4 VP,lightMatrix;uniform float mirror;
out vec3 point,norm,paint;out vec4 shadowPos;
void main(){surfaceUV=uv;point=pos;norm=normal;paint=color.rgb;shadowPos=lightMatrix*vec4(pos,1.);gl_Position=VP*vec4(pos.x,pos.y*mirror,pos.z,1.);}`;
const noiseGL=`
float hash21(vec2 p){vec3 q=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+1.),f.x),f.y);}
float fbm(vec2 p){return noise2(p)*.54+noise2(p*2.07+13.)*.27+noise2(p*4.17-3.)*.13+noise2(p*8.39+7.)*.06;}
uniform vec3 horizon,zenith,cloudColor,lightDirection;
uniform float nightSky,diskStrength;
vec3 sky(vec3 d){
 float h=max(d.y,0.);vec3 c=mix(horizon,zenith,smoothstep(-.10,.55,h));
 vec2 uv=d.xz/max(.06,h+.115)*1.8;float clouds=fbm(uv*1.15)+.05*noise2(uv*12.);
 c=mix(c,cloudColor,smoothstep(.48,.73,clouds)*smoothstep(-.02,.12,h)*.84);
 float facing=clamp(dot(d,lightDirection),0.,1.);
 float glow=pow(facing,14.)*(1.-nightSky)*.38;
 c=mix(c,cloudColor,glow);
 vec3 diskColor=mix(vec3(1.,.92,.70),vec3(.84,.88,.98),nightSky);
 c=mix(c,diskColor,diskStrength*smoothstep(.99980,.99994,facing)*smoothstep(0.,.035,d.y));
 if(nightSky>.5 && d.y>.025){
    vec2 cell=d.xz/(.48+d.y)*235.;
    float lum=hash21(floor(cell));
    float star=(1.-smoothstep(.06,.22,length(fract(cell)-.5)))*step(.989,lum);
    c+=vec3(.60,.70,.86)*star*smoothstep(.025,.22,d.y);
 }
 return c;
}`;
const sceneFS=`#version 300 es
precision highp float;
in vec2 surfaceUV;uniform sampler2D detailMap;uniform bool textured;uniform float opacity;
in vec3 point,norm,paint;in vec4 shadowPos;uniform vec3 eye,sun;uniform vec3 ambientTint,directColor;uniform float mirror,roughness,kind,lampStrength;uniform highp sampler2D shadowMap;out vec4 frag;
`+noiseGL+`
float shade(vec3 n){
 vec3 sc=shadowPos.xyz/shadowPos.w*.5+.5;
 if(any(lessThan(sc,vec3(0.)))||any(greaterThan(sc,vec3(1.))))return 1.;
 float bias=max(.00010,.0005*(1.-abs(dot(n,sun))));float total=0.;
 vec2 pixel=1./vec2(textureSize(shadowMap,0));
 for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++)total+=step(sc.z-bias,texture(shadowMap,sc.xy+vec2(i,j)*pixel*1.25).r);
 return total/9.;
}
void main(){
 if(mirror<0.&&point.y<.015)discard;
 vec3 cam=eye*vec3(1.,mirror,1.);vec3 v=normalize(cam-point);vec3 n=normalize(norm);if(dot(n,v)<0.)n=-n;
 float nl=max(0.,dot(n,sun));
 float sh=1.;
 if(nl>0. && mirror>0.)sh=shade(n);
 float shelter=(1.-smoothstep(4.4,4.9,point.y))*float(point.z< -18.7 && point.z> -33.4 && abs(point.x)<27.);
 vec3 ambient=mix(vec3(.25,.28,.27),vec3(.46,.54,.61),n.y*.5+.5)*(1.-.53*shelter);
 vec3 light=ambient*ambientTint+directColor*nl*sh;
 bool indoors=abs(point.x)<12.55 && point.z> -17.94 && point.z<16.65 && point.y>1.46 && point.y<10.46;
 if(indoors){
    float warmPool=.5+.5*cos(point.x*1.12)*cos(point.z*1.18);
    light+=vec3(.21,.18,.14)*(.62+.38*warmPool)+lampStrength*vec3(.46,.35,.24);
 }
 vec3 albedo=textured?texture(detailMap,surfaceUV).rgb:paint;vec2 tex=point.xz+vec2(point.y*.61,point.y*.83);
 if(textured){light+=vec3(.12,.14,.15);}
 else if(kind>4.5){
    float grain=noise2(tex*72.)-.5;
    albedo*=1.+grain*.14*(1.-smoothstep(.08,.22,length(fwidth(tex))));
 }else if(kind>3.5){
    vec2 slab=vec2(point.x+point.z*.39,point.y)*1.34;
    float vein=abs(sin(slab.x*3.1+slab.y*1.9+fbm(slab*1.9)*8.));
    albedo*=.94+.14*fbm(slab*5.)-.19*(1.-smoothstep(.02,.12,vein));
 }else if(kind>2.5 && n.y>.8){
    // Filter the two-metre paving grid over the pixel footprint. Thin stacked
    // joint meshes used to compete with the terrace for the same depth.
    vec2 tile=point.xz*.5;
    vec2 footprint=max(fwidth(tile),vec2(.0001));
    vec2 dist=abs(fract(tile+.5)-.5);
    vec2 coverage=(1.-smoothstep(vec2(.003),.003+footprint,dist))*min(vec2(1.),.008/footprint);
    albedo*=1.-.24*max(coverage.x,coverage.y);
 }else if(kind>1.5 && kind<2.5){float varied=fbm(tex*1.26)+.26*noise2(tex*13.);albedo*=.66+.49*varied;}
 else if(kind>.5){albedo*=.83+.35*fbm(tex*.4);}
 else {albedo*=.975+.043*noise2(tex*6.5);}
 // A pair of low terrace lamps casts warm pools at the lake edge.
 float terraceLight=lampStrength*(exp(-.088*dot(point-vec3(10.4,2.05,23.5),point-vec3(10.4,2.05,23.5)))+
    exp(-.088*dot(point-vec3(-10.4,2.05,23.5),point-vec3(-10.4,2.05,23.5))));
 vec3 col=albedo*(light+terraceLight*vec3(1.07,.75,.40));
 if(kind>5.5)col+=vec3(1.,.78,.46)*(.36+.55*lampStrength);
 float gloss=pow(max(dot(n,normalize(sun+v)),0.),mix(80.,18.,roughness));
 col+=directColor*gloss*.12*(1.-roughness)*sh;
 if(roughness<.3){float fres=pow(1.-max(0.,dot(n,v)),3.);col=mix(col,vec3(.36,.54,.55)*ambientTint,.13+.35*fres);col+=lampStrength*vec3(.57,.31,.105);}
 // Cool floodlights wash the pearl crown and folded lakeside walls.
 if(lampStrength>0. && point.y>1.16){
    float domeWash=smoothstep(9.9,14.,point.y)*exp(-max(0.,point.y-16.)*.075);
    float mainBlock=float(abs(point.x)<14. && point.z> -5.5 && point.z<19.3);
    float pierWash=float(point.z> -34. && point.z<15. && abs(point.x)<45.)*
        exp(-max(0.,point.y-1.2)*.48)*smoothstep(.2,.9,1.-abs(n.y));
    col+=albedo*lampStrength*(vec3(.99,.96,.81)*domeWash*mainBlock+
        vec3(.68,.69,.70)*mainBlock*.51+vec3(.90,.77,.57)*pierWash);
 }
 col=pow(max(col,vec3(0)),vec3(1./2.2));
 float fog=1.-exp(-.0009*max(length(cam-point)-45.,0.));col=mix(col,horizon,fog);
 if(kind< -1.5){
    float grazing=1.-max(v.y,0.);
    col=mix(col,vec3(.14,.32,.29)*sqrt(ambientTint),.20+.18*grazing);
    frag=vec4(col,.88-.33*grazing);
 }else frag=vec4(col,opacity);
}`;
const quadVS=`#version 300 es
out vec2 uv;void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=p;gl_Position=vec4(p*2.-1.,1.,1.);}`;
const skyFS=`#version 300 es
precision highp float;in vec2 uv;uniform vec3 right,up,back;uniform float aspect,mirror,tangent;out vec4 frag;`+noiseGL+`
void main(){vec2 ndc=uv*2.-1.;vec3 ray=normalize(-back+right*ndc.x*tangent*aspect+up*ndc.y*tangent);ray.y*=mirror;frag=vec4(sky(ray),1.);}`;
const waterVS=`#version 300 es
uniform mat4 VP;out vec3 point;void main(){vec2 corners[6]=vec2[6](vec2(-1,-1),vec2(1,-1),vec2(1,1),vec2(-1,-1),vec2(1,1),vec2(-1,1));vec2 p=corners[gl_VertexID]*550.;point=vec3(p.x,.008,p.y);gl_Position=VP*vec4(point,1.);}`;
const waterFS=`#version 300 es
precision highp float;in vec3 point;uniform sampler2D reflection;uniform vec3 eye,sun,waterColor,directColor;uniform float seconds,lampStrength,impactAge;uniform vec2 resolution;out vec4 frag;
`+noiseGL+`
float wave(vec2 p,float t){return .46*sin(p.y*5.8+p.x*1.16+t*1.3+noise2(p*.5)*3.)+.28*sin(p.x*2.5-p.y*8.3+t*1.5)+.26*sin(p.y*2.5-p.x*.62+t*.54+noise2(p*.28)*4.);}
void main(){vec2 p=point.xz;float dist=distance(eye,point);float w=wave(p,seconds);
 float soften=1.-smoothstep(30.,250.,dist);float a=wave(p+vec2(.12,0),seconds)-w,b=wave(p+vec2(0,.12),seconds)-w;
 vec3 n=normalize(vec3(-a*.11*soften,1.,-b*.11*soften));vec3 v=normalize(eye-point);
 vec2 shift=vec2(a*.0026,b*.0063)*soften;vec2 coord=clamp(gl_FragCoord.xy/resolution+shift,.002,.998);
 vec3 ref=texture(reflection,coord).rgb;float fres=.27+.62*pow(1.-max(dot(n,v),0.),2.3);
 float ripple=(w*.015+.026*noise2(p*.28))*soften;
 vec3 base=waterColor*(.78+.44*fbm(p*.049));
 vec3 outCol=mix(base+ripple,ref,fres);
 float age=impactAge;
 float radial=length(p-vec2(8.,26.1));
 float ring=exp(-55.*abs(radial-age*.72))*(1.-smoothstep(.35,2.65,age));
 outCol+=cloudColor*ring*.12;
 vec2 lamp=p-vec2(10.4,23.5);
 outCol+=vec3(.12,.080,.037)*lampStrength*exp(-dot(lamp,lamp)*.065)*(.85+.15*w);
 float shimmer=pow(max(dot(reflect(-sun,n),v),0.),170.)*.52;
 frag=vec4(outCol+directColor*shimmer,1.);
}`;
const depthVS=`#version 300 es
layout(location=0) in vec3 pos;uniform mat4 lightMatrix;void main(){gl_Position=lightMatrix*vec4(pos,1.);}`;
const depthFS=`#version 300 es
precision highp float;void main(){}`;

/* MINIATURES_SCRIPT */

class WebGLScene{
    constructor(gl,parts){
        this.gl=gl;this.locations=new Map();
        this.solid=this.program(sceneVS,sceneFS);this.sky=this.program(quadVS,skyFS);
        this.water=this.program(waterVS,waterFS);this.depth=this.program(depthVS,depthFS);
        const upload=(p,dynamic=false)=>{
            const vao=gl.createVertexArray();gl.bindVertexArray(vao);
            const v=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,v);gl.bufferData(gl.ARRAY_BUFFER,p.vertices,dynamic?gl.DYNAMIC_DRAW:gl.STATIC_DRAW);
            for(const [id,num,type,norm,offset] of [[0,3,gl.FLOAT,false,0],[1,3,gl.FLOAT,false,12],[2,4,gl.UNSIGNED_BYTE,true,24]]){
                gl.enableVertexAttribArray(id);gl.vertexAttribPointer(id,num,type,norm,28,offset);
            }
            let texture=null;
            if(p.image){
                const coords=gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER,coords);gl.bufferData(gl.ARRAY_BUFFER,p.uv,gl.STATIC_DRAW);
                gl.enableVertexAttribArray(3);gl.vertexAttribPointer(3,2,gl.FLOAT,false,0,0);
                texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
                gl.texImage2D(gl.TEXTURE_2D,0,gl.SRGB8_ALPHA8,gl.RGBA,gl.UNSIGNED_BYTE,p.image);
                gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
                gl.generateMipmap(gl.TEXTURE_2D);
            }
            const ind=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ind);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,p.indices,gl.STATIC_DRAW);
            const kind=surfaceKind(p.name);
            return {vao,texture,buffer:v,source:dynamic?p:null,rough:p.roughness,kind,count:p.indices.length,type:p.indices instanceof Uint32Array?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT};
        };
        // Bind a complete texture even for the many untextured scene batches.
        this.white=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.white);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
        this.params(gl.NEAREST);
        const batches=staticBatches(parts);
        this.meshes=batches.filter(p=>p.name!=='Clear architectural glazing').map(p=>upload(p));
        this.panes=batches.filter(p=>p.name==='Clear architectural glazing').map(p=>upload(p));
        this.animated=[...miniatures.parts,birds.part].map(p=>upload(p,true));
        this.visitors=this.animated.filter(m=>m.kind!==-2);
        this.fish=this.animated.filter(m=>m.kind===-2);
        gl.bindVertexArray(null);
        this.shadowSize=Math.min(2048,gl.getParameter(gl.MAX_TEXTURE_SIZE));
        this.shadow=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.shadow);
        gl.texStorage2D(gl.TEXTURE_2D,1,gl.DEPTH_COMPONENT24,this.shadowSize,this.shadowSize);this.params(gl.NEAREST);
        this.shadowFbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,this.shadowFbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,this.shadow,0);gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);
        this.checkFramebuffer();this.updateShadows();
        this.reflectFbo=gl.createFramebuffer();this.refTex=gl.createTexture();this.refDepth=gl.createRenderbuffer();
    }
    updateShadows(){
        const gl=this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER,this.shadowFbo);
        const radius=62,eye=sun.map(n=>n*100);
        this.light=multiply([1/radius,0,0,0,0,1/radius,0,0,0,0,-2/185,0,0,0,-1,1],view(eye,[0,0,0]));
        gl.viewport(0,0,this.shadowSize,this.shadowSize);gl.enable(gl.DEPTH_TEST);gl.clear(gl.DEPTH_BUFFER_BIT);
        gl.useProgram(this.depth);this.mat(this.depth,'lightMatrix',this.light);this.geometry(this.depth,false);
        gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    }
    program(vs,fs){
        const g=this.gl, prog=g.createProgram();
        for(const [type,source] of [[g.VERTEX_SHADER,vs],[g.FRAGMENT_SHADER,fs]]){
            const shader=g.createShader(type);g.shaderSource(shader,source);g.compileShader(shader);
            if(!g.getShaderParameter(shader,g.COMPILE_STATUS))throw Error(g.getShaderInfoLog(shader));
            g.attachShader(prog,shader);
        }
        g.linkProgram(prog);
        if(!g.getProgramParameter(prog,g.LINK_STATUS))throw Error(g.getProgramInfoLog(prog));
        this.locations.set(prog,new Map());return prog;
    }
    loc(p,n){const loc=this.locations.get(p);if(!loc.has(n))loc.set(n,this.gl.getUniformLocation(p,n));return loc.get(n)}
    scalar(p,n,x){this.gl.uniform1f(this.loc(p,n),x)}
    mat(p,n,v){this.gl.uniformMatrix4fv(this.loc(p,n),false,v)}
    vec(p,n,v){this.gl.uniform3fv(this.loc(p,n),v)}
    params(filter){
        const g=this.gl;for(const [p,v] of [[g.TEXTURE_MIN_FILTER,filter],[g.TEXTURE_MAG_FILTER,filter],[g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE],[g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE]])g.texParameteri(g.TEXTURE_2D,p,v);
    }
    checkFramebuffer(){const g=this.gl;if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE)throw Error('Framebuffer unavailable')}
    geometry(program,lit,meshes=this.meshes){
        const g=this.gl;
        for(const m of meshes){
            if(m.source?.visible===false)continue;
            if(lit){
                this.scalar(program,'roughness',m.rough);this.scalar(program,'kind',m.kind);
                g.activeTexture(g.TEXTURE2);g.bindTexture(g.TEXTURE_2D,m.texture||this.white);
                g.uniform1i(this.loc(program,'textured'),m.texture?1:0);
            }
            g.bindVertexArray(m.vao);g.drawElements(g.TRIANGLES,m.count,m.type,0);
        }
        g.bindVertexArray(null);
    }
    resize(w,h){
        const g=this.gl;this.rw=Math.max(1,Math.floor(w*.5));this.rh=Math.max(1,Math.floor(h*.5));
        g.bindTexture(g.TEXTURE_2D,this.refTex);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,this.rw,this.rh,0,g.RGBA,g.UNSIGNED_BYTE,null);this.params(g.LINEAR);
        g.bindRenderbuffer(g.RENDERBUFFER,this.refDepth);g.renderbufferStorage(g.RENDERBUFFER,g.DEPTH_COMPONENT16,this.rw,this.rh);
        g.bindFramebuffer(g.FRAMEBUFFER,this.reflectFbo);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,this.refTex,0);
        g.framebufferRenderbuffer(g.FRAMEBUFFER,g.DEPTH_ATTACHMENT,g.RENDERBUFFER,this.refDepth);this.checkFramebuffer();g.bindFramebuffer(g.FRAMEBUFFER,null);
    }
    pass(p,mirror){
        const g=this.gl,s=this.sky;g.disable(g.DEPTH_TEST);g.useProgram(s);
        for(const n of ['right','up','back'])this.vec(s,n,p[n]);
        this.vec(s,'horizon',environment.horizon);this.vec(s,'zenith',environment.zenith);
        this.vec(s,'cloudColor',environment.cloud);this.vec(s,'lightDirection',sun);
        this.scalar(s,'nightSky',nightAmount);this.scalar(s,'diskStrength',skyDisk);
        this.scalar(s,'aspect',canvas.width/canvas.height);this.scalar(s,'tangent',Math.tan(fieldOfView()/2));this.scalar(s,'mirror',mirror);g.drawArrays(g.TRIANGLES,0,3);
        g.enable(g.DEPTH_TEST);g.clear(g.DEPTH_BUFFER_BIT);const m=this.solid;g.useProgram(m);
        this.mat(m,'VP',p.vp);this.mat(m,'lightMatrix',this.light);this.vec(m,'sun',sun);this.vec(m,'eye',p.eye);this.scalar(m,'mirror',mirror);
        this.vec(m,'horizon',environment.horizon);this.vec(m,'ambientTint',environment.ambient);
        this.vec(m,'directColor',environment.direct);this.scalar(m,'lampStrength',environment.lamps);
        g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,this.shadow);g.uniform1i(this.loc(m,'shadowMap'),0);
        g.uniform1i(this.loc(m,'detailMap'),2);this.scalar(m,'opacity',1);
        this.geometry(m,true);this.geometry(m,true,this.visitors);
        g.enable(g.BLEND);g.blendFunc(g.SRC_ALPHA,g.ONE_MINUS_SRC_ALPHA);g.depthMask(false);
        this.scalar(m,'opacity',.12);this.geometry(m,true,this.panes);this.scalar(m,'opacity',1);
        g.depthMask(true);g.disable(g.BLEND);g.activeTexture(g.TEXTURE0);
    }
    draw(time,changed){
        const g=this.gl,p=pose();
        updateLife(time);
        for(const m of this.animated){
            if(m.source.visible===false)continue;
            g.bindBuffer(g.ARRAY_BUFFER,m.buffer);
            g.bufferSubData(g.ARRAY_BUFFER,0,m.source.vertices);
        }
        if(changed || this.reflectionTime===undefined || time-this.reflectionTime>.12){
            this.reflectionTime=time;
            // The reflection is camera dependent. Ripples animate independently.
            g.activeTexture(g.TEXTURE1);g.bindTexture(g.TEXTURE_2D,null);g.activeTexture(g.TEXTURE0);
            g.bindFramebuffer(g.FRAMEBUFFER,this.reflectFbo);g.viewport(0,0,this.rw,this.rh);this.pass(p,-1);
        }
        g.bindFramebuffer(g.FRAMEBUFFER,null);g.viewport(0,0,canvas.width,canvas.height);this.pass(p,1);
        const w=this.water;g.useProgram(w);this.mat(w,'VP',p.vp);this.vec(w,'eye',p.eye);this.vec(w,'sun',sun);
        this.vec(w,'waterColor',environment.water);this.vec(w,'directColor',environment.direct);
        this.vec(w,'cloudColor',environment.cloud);
        this.scalar(w,'lampStrength',environment.lamps);this.scalar(w,'seconds',time);this.scalar(w,'impactAge',miniatures.rippleAge(time));g.uniform2f(this.loc(w,'resolution'),canvas.width,canvas.height);
        g.activeTexture(g.TEXTURE1);g.bindTexture(g.TEXTURE_2D,this.refTex);g.uniform1i(this.loc(w,'reflection'),1);
        // Preserve the solid scene's depth so fish at the surface remain
        // hidden behind the terrace and can blend with the reflected water.
        g.depthMask(false);g.drawArrays(g.TRIANGLES,0,6);g.depthMask(true);
        g.enable(g.BLEND);g.blendFunc(g.SRC_ALPHA,g.ONE_MINUS_SRC_ALPHA);
        g.useProgram(this.solid);this.geometry(this.solid,true,this.fish);g.disable(g.BLEND);
    }
}
// A depth-buffered software view keeps orbit and zoom available on devices
// where the browser has disabled hardware acceleration.
class SoftwareScene {
    constructor(context,parts){
        this.ctx=context;
        const prepare=(p,dynamic)=>{
            if(!dynamic && /Tree crowns|Tree bark/.test(p.name))p=this.simplifyTrees(p);
            const data=new Float32Array(p.vertices.buffer,p.vertices.byteOffset,p.vertices.length/4);
            let pixels=null;
            if(p.image){
                const bitmap=document.createElement('canvas');
                bitmap.width=p.image.width;bitmap.height=p.image.height;
                const ctx=bitmap.getContext('2d');ctx.drawImage(p.image,0,0);
                pixels=ctx.getImageData(0,0,bitmap.width,bitmap.height);
            }
            return {...p,pixels,source:p,data,projected:new Float32Array(data.length),light:new Uint8Array(data.length/7*6),
                dynamic,fish:p.name==='Lake fish',flora:/Tree crowns|Palm fronds/.test(p.name)};
        };
        this.parts=parts.filter(p=>p.name!=='Clear architectural glazing').map(p=>prepare(p,false));
        this.moving=[...miniatures.parts,birds.part].map(p=>prepare(p,true));
        this.still=true;
    }
    simplifyTrees(p){
        // At this rendering resolution a cluster of leaves needs one surface.
        const data=new Float32Array(p.vertices.buffer,p.vertices.byteOffset,p.vertices.length/4);
        const remap=new Uint32Array(data.length/7),cells=new Map(),kept=[];
        const size=p.name==='Tree crowns'?1.45:.34;
        for(let i=0;i<remap.length;i++){
            const k=i*7,x=Math.round(data[k]/size),y=Math.round(data[k+1]/size),z=Math.round(data[k+2]/size);
            const key=(x+2048)*8388608+(z+2048)*1024+y+256;
            let id=cells.get(key);
            if(id===undefined){id=kept.length;cells.set(key,id);kept.push(i);}
            remap[i]=id;
        }
        const vertices=new Uint8Array(kept.length*28);
        kept.forEach((v,i)=>vertices.set(p.vertices.subarray(v*28,v*28+28),i*28));
        const indices=[];
        for(let k=0;k<p.indices.length;k+=3){
            const a=remap[p.indices[k]],b=remap[p.indices[k+1]],c=remap[p.indices[k+2]];
            if(a!==b && b!==c && a!==c)indices.push(a,b,c);
        }
        return {...p,vertices,indices:Uint32Array.from(indices)};
    }
    shadeMesh(mesh){
        if(!mesh.dynamic && mesh.environment===environment)return;
        mesh.environment=environment;
        const {data,light,vertices}=mesh;
        for(let k=0,v=0;k<data.length;k+=7,v++){
            const nx=data[k+3],ny=data[k+4],nz=data[k+5],direct=nx*sun[0]+ny*sun[1]+nz*sun[2];
            const dome=data[k+1]>11 && Math.abs(data[k])<11 && Math.abs(data[k+2]-6)<11;
            for(let side=0;side<2;side++){
                const sign=side?-1:1,ambient=.36+.17*(ny*sign*.5+.5),daylight=Math.max(0,sign*direct);
                for(let c=0;c<3;c++){
                    const paint=vertices[v*28+24+c]/255;
                    const lamp=mesh.roughness<.3?[.57,.31,.105][c]:dome?paint*[.45,.25,.1][c]:0;
                    const value=paint*(ambient*environment.ambient[c]+daylight*environment.direct[c])+environment.lamps*lamp;
                    light[v*6+side*3+c]=Math.min(255,255*Math.pow(value,1/2.2));
                }
            }
        }
    }
    resize(w,h){
        this.w=w;this.h=h;this.frame=this.ctx.createImageData(w,h);this.z=new Float32Array(w*h);
        this.backdrop=new Uint8ClampedArray(w*h*4);this.backDepth=new Float32Array(w*h);this.cacheValid=false;
        this.lakeDepth=new Float32Array(h);
    }
    draw(time,changed){
        changed=changed || !this.cacheValid;
        updateLife(time);
        const {eye,back,right,up}=pose(), {w,h,frame,z}=this, rgba=frame.data, focal=h/(2*Math.tan(fieldOfView()/2));
        const channels=(c,i,r,g,b)=>{c[i]=r;c[i+1]=g;c[i+2]=b;c[i+3]=255};
        // Sky and lake are evaluated in camera space so the horizon survives a full orbit.
        const lakeDepth=this.lakeDepth, water=environment.water.map(v=>v*255);
        if(changed)for(let y=0;y<h;y++){
            const dy=-back[1]+up[1]*(h/2-y)/focal;
            const t=dy<-.0001?-eye[1]/dy:Infinity;lakeDepth[y]=t;
            const isLake=t<550;const d=clamp(dy*1.65,0,1);
            const skyColor=environment.horizon.map((v,c)=>255*(v*(1-d)+environment.zenith[c]*d));
            for(let x=0;x<w;x++){
                const k=(y*w+x)*4;
                if(!isLake){channels(rgba,k,...skyColor);continue}
                const wx=eye[0]+t*(-back[0]+right[0]*(x-w/2)/focal+up[0]*(h/2-y)/focal);
                const wz=eye[2]+t*(-back[2]+right[2]*(x-w/2)/focal+up[2]*(h/2-y)/focal);
                const ripple=2*Math.sin(wz*2.83+wx*.56)+1.7*Math.sin(wz*5.71-wx*.73);
                channels(rgba,k,water[0]+ripple,water[1]+ripple,water[2]+ripple);
            }
        }
        const triangle=(mesh,i,j,k,reflection)=>{
            const {projected:pts,flora,fish,pixels,uv}=mesh;
            const ai=i*7,bi=j*7,ci=k*7, ax=pts[ai],ay=pts[ai+1],bx=pts[bi],by=pts[bi+1],cx=pts[ci],cy=pts[ci+1];
            const az=pts[ai+2],bz=pts[bi+2],cz=pts[ci+2];
            if(Math.min(az,bz,cz)<=.16)return;
            const area=(bx-ax)*(cy-ay)-(by-ay)*(cx-ax);if(Math.abs(area)<.04)return;
            const x0=Math.max(0,Math.floor(Math.min(ax,bx,cx))),x1=Math.min(w-1,Math.ceil(Math.max(ax,bx,cx)));
            const y0=Math.max(0,Math.floor(Math.min(ay,by,cy))),y1=Math.min(h-1,Math.ceil(Math.max(ay,by,cy)));
            const inv=1/area, rr=pts[ai+3],gg=pts[ai+4],bb=pts[ai+5];
            for(let y=y0;y<=y1;y++){
                if(reflection&&lakeDepth[y]>550)continue;
                for(let x=x0;x<=x1;x++){
                    const u=((x+.5-ax)*(cy-ay)-(y+.5-ay)*(cx-ax))*inv;
                    const v=((bx-ax)*(y+.5-ay)-(by-ay)*(x+.5-ax))*inv;
                    if(u<0||v<0||u+v>1)continue;
                    const dep=1/((1-u-v)/az+u/bz+v/cz);
                    let xx=x;
                    if(reflection)xx+=Math.round(Math.sin(y*.87+Math.sin(y*.137))*1.35);
                    if(xx<0||xx>=w)continue;
                    const off=y*w+xx;if(dep>=z[off])continue;
                    if(!reflection&&!fish&&dep>lakeDepth[y]+.05)continue;
                    z[off]=dep;const ix=off*4;
                    if(pixels && !reflection){
                        const us=((1-u-v)*uv[2*i]/az+u*uv[2*j]/bz+v*uv[2*k]/cz)*dep;
                        const vs=((1-u-v)*uv[2*i+1]/az+u*uv[2*j+1]/bz+v*uv[2*k+1]/cz)*dep;
                        const px=clamp(Math.floor(us*pixels.width),0,pixels.width-1);
                        const py=clamp(Math.floor(vs*pixels.height),0,pixels.height-1);
                        const q=(py*pixels.width+px)*4;
                        channels(rgba,ix,rr*pixels.data[q]/255,gg*pixels.data[q+1]/255,bb*pixels.data[q+2]/255);continue;
                    }
                    if(reflection){
                        const mix=.36+.04*Math.sin(y*.63);
                        channels(rgba,ix,water[0]+(rr-water[0])*mix,water[1]+(gg-water[1])*mix,water[2]+(bb-water[2])*mix);
                    }else if(fish){
                        channels(rgba,ix,rgba[ix]*.34+rr*.66,rgba[ix+1]*.34+gg*.66,rgba[ix+2]*.34+bb*.66);
                    }else{
                        const d=flora?3*Math.sin(x*1.52+y*1.13)*Math.sin(x*.58-y*.73):0;
                        channels(rgba,ix,rr+d,gg+d,bb+d);
                    }
                }
            }
        };
        for(const pass of changed?[-1,1,2]:[2]){
            const mirror=pass<0?-1:1;
            if(pass===2){
                if(changed){this.backdrop.set(rgba);this.backDepth.set(z);this.cacheValid=true;}
                else{rgba.set(this.backdrop);z.set(this.backDepth);}
            }else z.fill(Infinity);
            for(const mesh of pass===2?this.moving:this.parts){
                if(mesh.source.visible===false)continue;
                const {data,light,indices,projected}=mesh;
                this.shadeMesh(mesh);
                for(let i=0;i<data.length;i+=7){
                    const x=data[i]-eye[0],y=mirror*data[i+1]-eye[1],zz=data[i+2]-eye[2];
                    const depth=-(x*back[0]+y*back[1]+zz*back[2]);
                    projected[i]=w/2+focal*(x*right[0]+zz*right[2])/depth;
                    projected[i+1]=h/2-focal*(x*up[0]+y*up[1]+zz*up[2])/depth;
                    projected[i+2]=depth;
                    const side=data[i+3]*x+data[i+4]*y*mirror+data[i+5]*zz>0?3:0;
                    const lit=i/7*6+side,fog=clamp((depth-42)*.0009,0,.36);
                    for(let c=0;c<3;c++)projected[i+3+c]=light[lit+c]*(1-fog)+255*environment.horizon[c]*fog;
                }
                for(let i=0;i<indices.length;i+=3)triangle(mesh,indices[i],indices[i+1],indices[i+2],mirror<0);
            }
        }
        this.ctx.putImageData(frame,0,0);
    }
}

let lastTime=-1000,lastW=0,lastH=0;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
// One revolution every three minutes. Ignore time spent in a hidden tab.
let lastOrbitTime=null,sceneSeconds=0,previousFrame=null;
let birds=null,fridayStart=0,fridayPhase=-1,followFriday=false,lastCast=-100,restoreLive=false;
const phases=[
    {start:0,view:'arrivals'}, {start:14,view:'wudu'}, {start:30,view:'gathering'}, {start:60,view:'gathering'}
];
function phaseCamera(index){
    chooseView(phases[index].view,false);
    // Keep the sermon and the prayer rows in sight during the guided sequence.
    lastOrbitTime=null;
}
function setFriday(on){
    if(!miniatures)return;
    if(on && lightingMode==='live'){
        restoreLive=true;$('lighting').value='day';setLighting('day');
    }else if(!on && restoreLive){
        restoreLive=false;$('lighting').value='live';setLighting('live');
    }
    miniatures.friday=on;fridayStart=sceneSeconds;fridayPhase=-1;followFriday=on&&!walking;
    $('phaseControls').hidden=!on;
    if(on){phaseCamera(0);}else if(preset.value==='gathering'||preset.value==='arrivals')chooseView('lake',false);
    dirty=true;
}
function updateLife(t){
    const clock=((t-fridayStart)%100+100)%100;
    if(miniatures.friday){
        miniatures.fridayTime=clock;
        const index=clock<14?0:clock<30?1:clock<60?2:3;
        if(index!==fridayPhase){fridayPhase=index;$('phase').value=String(index);}
    }
    miniatures.update(t);birds.update(t);
}
function tossFood(){
    if(!miniatures)return;
    followFriday=false;
    if(sceneSeconds-lastCast<.25)return;
    const atTerrace=walking&&Math.hypot(camera.eye[0]-8.9,camera.eye[2]-22.1)<3;
    if(walking?!atTerrace:preset.value!=='feeding')chooseView('feeding',false);
    miniatures.feedFish(sceneSeconds);lastCast=sceneSeconds;dirty=true;
    $('feed').textContent='Food tossed';
    canvas.focus({preventScroll:true});
}
$('feed').onclick=tossFood;
$('activity').onchange=e=>setFriday(e.target.value==='friday');
$('phase').onchange=e=>{
    const index=Number(e.target.value);
    fridayStart=sceneSeconds-phases[index].start;fridayPhase=-1;
    followFriday=!walking;phaseCamera(index);dirty=true;
};
const rotateControl=$('rotate');
rotateControl.checked=!reducedMotion.matches;
rotateControl.onchange=()=>{lastOrbitTime=null;};
$('lighting').onchange=e=>{restoreLive=false;setLighting(e.target.value);};
document.addEventListener('visibilitychange',()=>{lastOrbitTime=null;previousFrame=null;});
function frame(time){
    if(!renderer)return;
    if(document.hidden){previousFrame=null;requestAnimationFrame(frame);return;}
    const animate=!reducedMotion.matches||miniatures.friday||sceneSeconds-lastCast<4;
    if(previousFrame!==null && animate)sceneSeconds+=Math.min(time-previousFrame,500)*.001;
    if(walking&&previousFrame!==null)walkStep(clamp((time-previousFrame)/1000,0,.25));
    previousFrame=time;
    if(lastCast>-99 && sceneSeconds-lastCast>1.15 && $('feed').textContent!=='Feed fish')$('feed').textContent='Feed fish';
    if(followFriday && miniatures.friday){
        const t=(sceneSeconds-fridayStart+100)%100;
        const next=t<14?0:t<30?1:t<60?2:3;
        if(next!==fridayPhase)phaseCamera(next);
    }
    const now=Date.now();
    if(lightingMode==='live' && Math.floor(now/60000)!==lastLightMinute)setLighting('live',now);
    let ratio=Math.min(devicePixelRatio||1,1.5,1560/Math.max(canvas.clientWidth,canvas.clientHeight,1));
    if(renderer.still)ratio=Math.min(ratio,760/Math.max(canvas.clientWidth,canvas.clientHeight,1));
    const w=Math.max(1,Math.round(canvas.clientWidth*ratio)),h=Math.max(1,Math.round(canvas.clientHeight*ratio));
    if(w!==lastW||h!==lastH){
        if(lastW && cameraViews[preset.value]?.scale){
            const oldFit=Math.max(51,91/(lastW/lastH)),newFit=Math.max(51,91/(w/h));
            camera.distance*=newFit/oldFit;
        }
        canvas.width=w;canvas.height=h;lastW=w;lastH=h;renderer.resize(w,h);dirty=true;
    }
    if(!walking && !followFriday && rotateControl.checked && !transition && !pointers.size && !document.hidden){
        if(lastOrbitTime===null)lastOrbitTime=time;
        const elapsed=time-lastOrbitTime;
        if(elapsed>=(renderer.still?75:0) && elapsed>0){
            camera.yaw=(camera.yaw+TAU*Math.min(500,elapsed)/180000)%TAU;
            lastOrbitTime=time;dirty=true;
        }
    }else{lastOrbitTime=null;}
    if(transition){
        const a=transition.from,b=transition.to,t=clamp((time-transition.start)/540,0,1);
        const s=t*t*(3-2*t),mix=(x,y)=>x+(y-x)*s;
        camera={yaw:mix(a.yaw,b.yaw),pitch:mix(a.pitch,b.pitch),distance:mix(a.distance,b.distance),target:a.target.map((n,i)=>mix(n,b.target[i]))};
        if(t>=1)transition=null;dirty=true;
    }
    if(dirty||(animate&&time-lastTime>(renderer.still?80:32))){
        renderer.draw(sceneSeconds,dirty);dirty=false;lastTime=time;
    }
    requestAnimationFrame(frame);
}
const pointers=new Map();let gap=0;
function pinchGap(){const [a,b]=[...pointers.values()];return Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))}
canvas.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    lastOrbitTime=null;canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.classList.add('dragging');
    if(pointers.size===2)gap=pinchGap();
});
canvas.addEventListener('pointermove',e=>{
    const old=pointers.get(e.pointerId);if(!old)return;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===2){const next=pinchGap();zoom(gap/next);gap=next}
    else if(pointers.size===1)orbit((e.clientX-old.x)*.007,(e.clientY-old.y)*.005);
});
function release(e){pointers.delete(e.pointerId);if(pointers.size===2)gap=pinchGap();if(!pointers.size)canvas.classList.remove('dragging')}
canvas.addEventListener('lostpointercapture',release);
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
canvas.addEventListener('wheel',e=>{e.preventDefault();const px=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?canvas.clientHeight:1);zoom(Math.exp(clamp(px*.0017,-.7,.7)))},{passive:false});
canvas.addEventListener('keydown',e=>{
    if(walking && ['w','a','s','d','shift','arrowleft','arrowright','arrowup','arrowdown'].includes(e.key.toLowerCase())){
        held.add(e.key.toLowerCase());e.preventDefault();return;
    }
    if(walking && e.key==='Escape'){setWalking(false);return;}
    if(e.key.toLowerCase()==='f'&&!e.repeat){tossFood();e.preventDefault();return;}
    const actions={'+':()=>zoom(.84),'=':()=>zoom(.84),'-':()=>zoom(1/.84),ArrowLeft:()=>orbit(-.1,0),ArrowRight:()=>orbit(.1,0),ArrowUp:()=>orbit(0,.07),ArrowDown:()=>orbit(0,-.07),Home:()=>chooseView('lake')};
    if(actions[e.key]){e.preventDefault();actions[e.key]()}
});
$('in').onclick=()=>zoom(.8);$('out').onclick=()=>zoom(1.25);$('reset').onclick=()=>{followFriday=false;chooseView('lake');};
preset.onchange=()=>{followFriday=false;if(cameraViews[preset.value])chooseView(preset.value);if(walking)canvas.focus({preventScroll:true});};
$('walk').onchange=e=>setWalking(e.target.checked);
$('fast').onchange=()=>canvas.focus({preventScroll:true});
canvas.addEventListener('keyup',e=>held.delete(e.key.toLowerCase()));
canvas.addEventListener('blur',()=>held.clear());
document.addEventListener('visibilitychange',()=>held.clear());
for(const key of ['w','a','s','d']){
    const btn=$('move-'+key);
    btn.addEventListener('pointerdown',e=>{e.preventDefault();btn.setPointerCapture(e.pointerId);held.add(key);});
    const release=()=>held.delete(key);
    for(const event of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(event,release);
    btn.addEventListener('click',e=>{if(!e.detail && walking){held.add(key);walkStep(.12);held.delete(key);}});
}
const expand=$('expand');
if(!document.fullscreenEnabled)expand.hidden=true;
if(expand.hidden)expand.style.display='none';
expand.onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('app').requestFullscreen()}catch{expand.style.display='none'}};
document.addEventListener('fullscreenchange',()=>{const text=document.fullscreenElement?'Exit fullscreen':'Enter fullscreen';expand.title=text;expand.setAttribute('aria-label',text)});
$('export').onclick=async()=>{
    const a=document.createElement('a');a.download='Masjid-An-Nur-UTP.glb';
    if(!modelBytes){try{modelBytes=await unpack('arch')}catch{a.href=a.download;a.click();return}}
    const url=URL.createObjectURL(new Blob([modelBytes],{type:'model/gltf-binary'}));
    a.href=url;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
};
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();renderer=null;statusBox.textContent='Restoring the 3D view…'});
canvas.addEventListener('webglcontextrestored',()=>location.reload());
(async()=>{
    try{
        setLighting('live');chooseView('lake',false);
        const [arch,land]=await Promise.all([unpack('arch'),unpack('land')]);modelBytes=arch;
        const parts=(await Promise.all([parseModel(arch),parseModel(land)])).flat().filter(part=>part.name!=='Paving joints');
        walkMap=new WalkingMap(parts);miniatures=new MiniatureScene();birds=new MosqueBirds();
        const gl=canvas.getContext('webgl2',{alpha:false,antialias:true,powerPreference:'high-performance'});
        renderer=gl?new WebGLScene(gl,parts):new SoftwareScene(canvas.getContext('2d',{alpha:false}),parts);
        $('activity').disabled=false;$('feed').disabled=false;
        statusBox.textContent='';requestAnimationFrame(frame);
    }catch(error){console.error(error);statusBox.textContent='The 3D view could not start. Open the GLB download in a 3D viewer.'}
})();

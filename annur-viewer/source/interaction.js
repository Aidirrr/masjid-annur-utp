// World coordinates also drive the touch interaction prompt in walking mode.
const destinations=[
    {key:'donate',label:'Open tabung',point:[3.6,2.38,-18.9]},
    {key:'donate',label:'Open tabung',point:[7.1,2.04,22.7]},
    {key:'feed',label:'Feed koi',point:[8.9,2,22.1]},
    {key:'board',label:'Read noticeboard',point:[-4.35,2.72,-18.94]},
    {key:'founders',label:'Read plaque',point:[4.8,2.15,-34.7]},
    {key:'ayah',label:'Read ayah',point:[0,3,15]},
    {key:'cat',label:'Pet cat'}
];
let nearestAction=null,pickParts=[];
function updateNearby(){
    let nearest=null,best=4;
    if(walking){
        const {eye,back,right,up}=pose(),tan=Math.tan(fieldOfView()/2);
        for(const stop of destinations){
            const point=stop.point||miniatures.catPosition;
            if(!point)continue;
            const offset=point.map((v,i)=>v-eye[i]),distance=Math.hypot(...offset);
            if(distance>=best)continue;
            const depth=-dot(offset,back);
            if(depth<=.1)continue;
            const x=.5+dot(offset,right)*canvas.clientHeight/(2*depth*tan*canvas.clientWidth);
            let y=.5-dot(offset,up)/(2*depth*tan);
            if(x<.07||x>.93||y<.07||y>.93)continue;
            if(stop.key==='cat'){
                // Leave room for the ears and tail even when the camera is close.
                const clearance=.55/(2*tan*Math.max(.1,depth-.45))+30/canvas.clientHeight;
                y=y-clearance>.07?y-clearance:y+clearance;
                if(y>.93)continue; // The cat itself still accepts a tap.
            }
            nearest=stop;best=distance;
            $('nearby').style.left=(100*x)+'%';
            $('nearby').style.top=(100*y)+'%';
        }
    }
    if(nearestAction===nearest)return;
    nearestAction=nearest;$('nearby').hidden=!nearest;
    $('nearby').classList.toggle('tabung-action',nearest?.key==='donate');
    if(nearest)$('nearby').textContent=nearest.label;
}
function interact(key){
    if(key==='cat'){
        worldAudio.meow();miniatures.petCat(sceneSeconds);petUntil=sceneSeconds+4;dirty=true;
    }else openCommunity(key);
}
$('nearby').onclick=()=>{if(nearestAction)interact(nearestAction.key);};
$('explore').onchange=e=>{
    const key=e.target.value;e.target.value='';
    const stop={donate:'foyer',board:'foyer',founders:'memorial',ayah:'qibla',cat:'cat'}[key];
    if(stop)followFriday=false;
    if(key==='cat'&&walking)setWalking(false);
    if(stop)chooseView(stop,false);
    if(key==='cat'&&!walking&&miniatures.catPosition)camera.target=miniatures.catPosition.slice();
    interact(key);
};
$('settings').onclick=e=>{
    const btn=e.currentTarget;
    btn.setAttribute('aria-expanded',String(btn.getAttribute('aria-expanded')!=='true'));
};

const gameOptions=$('gameOptions');
const landscapeTouch=matchMedia('(pointer:coarse) and (orientation:landscape)');
const menuGroups=['.activity-bar','#scene-options','.buttons','#export'].map(selector=>{
    const element=document.querySelector(selector);
    const marker=document.createComment(selector);
    element.before(marker);
    return {element,marker};
});
function layoutGameMenu(){
    const immersive=landscapeTouch.matches||document.fullscreenElement===$('app');
    $('app').classList.toggle('immersive',immersive);
    gameOptions.close();
    for(const {element,marker} of menuGroups){
        if(immersive)gameOptions.append(element);
        else marker.after(element);
    }
}
$('gameMenu').onclick=()=>gameOptions.showModal();
$('resumeGame').onclick=()=>gameOptions.close();
document.addEventListener('fullscreenchange',layoutGameMenu);
landscapeTouch.addEventListener('change',layoutGameMenu);
layoutGameMenu();

const stickInput={forward:0,side:0};
const stick=$('stick');
let stickPointer=null;
function moveStick(e){
    const rect=stick.getBoundingClientRect(),radius=rect.width*.33;
    const x=(e.clientX-rect.left-rect.width/2)/radius,y=(e.clientY-rect.top-rect.height/2)/radius;
    const length=Math.max(1,Math.hypot(x,y));
    stickInput.side=x/length;stickInput.forward=-y/length;
    stick.firstElementChild.style.transform='translate('+stickInput.side*radius+'px,'+(-stickInput.forward*radius)+'px)';
}
function resetStick(){
    stickPointer=null;stickInput.side=0;stickInput.forward=0;stick.firstElementChild.style.transform='';
}
stick.onpointerdown=e=>{
    if(stickPointer!==null)return;
    e.preventDefault();stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e);
};
stick.onpointermove=e=>{if(e.pointerId===stickPointer)moveStick(e);};
for(const event of ['pointerup','pointercancel','lostpointercapture']){
    stick.addEventListener(event,e=>{if(e.pointerId===stickPointer)resetStick();});
}
window.addEventListener('blur',resetStick);
document.addEventListener('visibilitychange',resetStick);

// Test only meshes whose bounding boxes intersect the tap ray. The nearest
// opaque triangle wins, including unselectable walls in front of a hotspot.
function meshAction(name){
    if(/^(Foyer|Terrace) tabung/i.test(name))return 'donate';
    if(/^RMUTP board/i.test(name))return 'board';
    if(/^Contributors plaque/i.test(name))return 'founders';
    if(name==='Inscribed drum frieze')return 'ayah';
    if(name==='Qibla marble elevation')return 'ayah-kursi';
    return '';
}
function intersectsBounds(eye,ray,min,max,limit){
    let near=0,far=limit;
    for(let i=0;i<3;i++){
        if(Math.abs(ray[i])<1e-8){
            if(eye[i]<min[i]||eye[i]>max[i])return false;
            continue;
        }
        const a=(min[i]-eye[i])/ray[i],b=(max[i]-eye[i])/ray[i];
        near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));
        if(near>far)return false;
    }
    return true;
}
function meshDistance(part,eye,ray,limit){
    const v=new Float32Array(part.vertices.buffer,part.vertices.byteOffset,part.vertices.byteLength/4);
    const indices=part.indices,[rx,ry,rz]=ray;
    for(let i=0;i<indices.length;i+=3){
        const a=indices[i]*7,b=indices[i+1]*7,c=indices[i+2]*7;
        const ux=v[b]-v[a],uy=v[b+1]-v[a+1],uz=v[b+2]-v[a+2];
        const vx=v[c]-v[a],vy=v[c+1]-v[a+1],vz=v[c+2]-v[a+2];
        const px=ry*vz-rz*vy,py=rz*vx-rx*vz,pz=rx*vy-ry*vx;
        const det=ux*px+uy*py+uz*pz;
        if(Math.abs(det)<1e-8)continue;
        const x=eye[0]-v[a],y=eye[1]-v[a+1],z=eye[2]-v[a+2];
        const u=(x*px+y*py+z*pz)/det;
        if(u<0||u>1)continue;
        const qx=y*uz-z*uy,qy=z*ux-x*uz,qz=x*uy-y*ux;
        const w=(rx*qx+ry*qy+rz*qz)/det;
        if(w<0||u+w>1)continue;
        const distance=(vx*qx+vy*qy+vz*qz)/det;
        if(distance>.06&&distance<limit)limit=distance;
    }
    return limit;
}
function pickAt(x,y){
    if(!renderer)return;
    const rect=canvas.getBoundingClientRect(),p=pose(),tan=Math.tan(fieldOfView()/2);
    const sx=(2*(x-rect.left)/rect.width-1)*tan*rect.width/rect.height;
    const sy=(1-2*(y-rect.top)/rect.height)*tan;
    const ray=normalize(p.back.map((b,i)=>-b+sx*p.right[i]+sy*p.up[i]));
    let closest=Infinity,key='';
    const cat=miniatures.catPosition;
    if(cat){
        const offset=cat.map((v,i)=>v-p.eye[i]),along=dot(offset,ray);
        if(along>0&&Math.hypot(...offset.map((v,i)=>v-along*ray[i]))<.46){closest=along;key='cat';}
    }
    if(!hasStaticTarget()&&!Number.isFinite(closest))return;
    function hasStaticTarget(){
        return pickParts.some(part=>part.action&&intersectsBounds(p.eye,ray,part.min,part.max,Infinity));
    }
    for(const part of pickParts){
        if(part.name==='Clear architectural glazing'||!intersectsBounds(p.eye,ray,part.min,part.max,closest))continue;
        const distance=meshDistance(part,p.eye,ray,closest);
        if(distance>=closest)continue;
        closest=distance;
        key=part.action;
    }
    if(key)interact(key);
}
let tap=null;
canvas.addEventListener('pointerdown',e=>{
    tap=e.isPrimary&&e.button===0?{id:e.pointerId,x:e.clientX,y:e.clientY}:null;
});
canvas.addEventListener('pointermove',e=>{
    if(tap&&Math.hypot(tap.x-e.clientX,tap.y-e.clientY)>6)tap=null;
});
canvas.addEventListener('pointerup',e=>{
    if(tap?.id===e.pointerId)pickAt(e.clientX,e.clientY);
    tap=null;
});
canvas.addEventListener('pointercancel',()=>{tap=null;});

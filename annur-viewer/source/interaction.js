// World coordinates also drive the touch interaction prompt in walking mode.
const destinations=[
    {key:'donate',label:'Open tabung',point:[-3.4,2.15,-5.18]},
    {key:'feed',label:'Fish food · RM1',point:[8.9,2,22.1]},
    {key:'board',label:'Read noticeboard',point:[-39.65,2.69,-32.23]},
    {key:'founders',label:'Read plaque',point:[4.8,2.15,-34.7]},
    {key:'wall',label:'Explore inscriptions',point:[0,3,15]},
    {key:'clock',label:'Read prayer clock',point:[-10.77,3.20,-3.68]},
    {key:'shelf',label:'Qur’an shelf',point:[8.8,2.55,-4.15]},
    {key:'shelf',label:'Qur’an shelf',point:[-8.8,2.55,-4.15]},
    {key:'mat',label:'Take sejadah',point:[7.96,2.12,-4.18]},
    {key:'pray',label:'Pray here',point:[.4,1.60,-9.6]},
    {key:'stand',label:'Qur’an rehal'},
    {key:'ball',label:'Kick the ball'},
    ...[-21.8,-25.5,-29.2].map(z=>({key:'joinMeal',label:'Join the talam',point:[-9.9,1.38,z]})),
    ...[-19.98,-44.98].map(z=>({key:'wash',label:'Take wudu’',point:[-40.68,1.90,z]})),
    {key:'cat',label:'Pet cat'}
];
let participation=null,feedbackTimer;
function feedback(message){
    $('catReaction').textContent=message;
    clearTimeout(feedbackTimer);
    feedbackTimer=setTimeout(()=>{$('catReaction').textContent='';},2600);
}
function updateInventory(){
    const items=[];
    if(miniatures.carryingBook)items.push('Carrying Qur’an');
    if(miniatures.matState==='carried')items.push('Carrying sejadah');
    $('heldItem').hidden=!items.length;$('heldItem').textContent=items.join(' · ');
}
function leaveActivity(){
    if(!participation)return;
    const {eye,yaw,pitch,ground,kind}=participation;
    camera.eye=eye;camera.yaw=yaw;camera.pitch=pitch;playerFloor=ground;
    if(kind==='wash')miniatures.setTap(null);
    if(kind==='joinMeal')miniatures.joinedTray=null;
    participation=null;$('participation').hidden=true;held.clear();resetStick();dirty=true;
    canvas.focus({preventScroll:true});
}
const washSteps=['Wash hands','Rinse mouth','Rinse nose','Wash face','Wash arms','Wipe head and ears','Wash feet'];
const prayerSteps=[
    ['Stand',1.62,.12],['Bow',1,.86],['Stand upright',1.62,.12],
    ['Prostrate',.29,1.16],['Sit',.82,.35],['Prostrate',.29,1.16],
    ['Stand',1.62,.12],['Bow',1,.86],['Stand upright',1.62,.12],
    ['Prostrate',.29,1.16],['Sit',.82,.35],['Prostrate',.29,1.16],['Final sitting',.82,.35]
];
function activityStep(){
    const {kind,index}=participation;
    if(kind==='pray'){
        const [label,height,pitch]=prayerSteps[index];
        camera.eye[1]=1.53+height;camera.pitch=pitch;
        $('stepLabel').textContent=(index<6?'First':'Second')+' rak‘ah · '+label;
        $('stepNext').textContent=index===12?'Finish prayer':'Continue';
    }else if(kind==='wash'){
        $('stepLabel').textContent='Wudu’ · '+(index+1)+' / '+washSteps.length;
        $('stepNext').textContent=washSteps[index];
        camera.pitch=index===6?.92:.40;
    }else{
        $('stepLabel').textContent='Seated at the BOM talam';
        $('stepNext').textContent=index===0?'Take a date':index===3?'Finish meal':'Eat rice';
        miniatures.bites=index;camera.pitch=.52+.06*(index%2);
    }
    dirty=true;
}
function startActivity(kind,point){
    if(!walking)setWalking(true);
    leaveActivity();
    participation={kind,index:0,eye:camera.eye.slice(),ground:playerFloor,yaw:camera.yaw,pitch:camera.pitch};
    held.clear();resetStick();jumpHeight=jumpVelocity=0;followFriday=false;
    if(kind==='joinMeal'){
        miniatures.joinedTray=point[2];camera.eye=[-9.9,2.03,point[2]+.96];camera.yaw=0;
    }else if(kind==='wash'){
        miniatures.setTap(point[2]);camera.eye=[-39.58,2.42,point[2]];camera.yaw=Math.PI/2;
    }else{
        if(miniatures.matState==='carried')miniatures.placeMat('floor');
        camera.eye=[.4,3.15,-10.12];camera.yaw=Math.PI;
    }
    updateInventory();$('nearby').hidden=true;nearestAction=null;
    $('participation').hidden=false;activityStep();
}
$('stepLeave').onclick=leaveActivity;
$('stepNext').onclick=()=>{
    if(!participation)return;
    const {kind}=participation;
    const limit=kind==='pray'?prayerSteps.length:kind==='wash'?washSteps.length:4;
    if(++participation.index<limit){activityStep();return;}
    leaveActivity();feedback(kind==='pray'?'Prayer complete.':kind==='wash'?'Wudu’ complete.':'You finished the meal.');
};

let nearestAction=null,pickParts=[];
function updateNearby(){
    let nearest=null,best=4;
    if(participation)return;
    if(walking){
        const {eye,back,right,up}=pose(),tan=Math.tan(fieldOfView()/2);
        for(const stop of destinations){
            if(stop.key==='joinMeal'&&!miniatures.dinner.visible||stop.key==='ball'&&!miniatures.lawn.visible||
               stop.key==='mat'&&miniatures.matState==='carried'||stop.key==='stand'&&miniatures.friday)continue;
            const point=stop.key==='stand'?[miniatures.readingSide*8.65,1.85,-3.25]:
                stop.key==='ball'?miniatures.ballPoint:stop.point||miniatures.catPosition;
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
let catFeedbackTimer;
function interact(key,point){
    if(key==='mat'){
        miniatures.placeMat('carried');updateInventory();feedback('Sejadah picked up. Lay it in the prayer space.');dirty=true;return;
    }
    if(key==='joinMeal'||key==='wash'||key==='pray'){
        startActivity(key,point||destinations.find(stop=>stop.key===key).point);return;
    }
    if(key==='ball'){
        miniatures.ballKick=sceneSeconds;petUntil=sceneSeconds+5;dirty=true;feedback('You kicked the ball. The children chase it back.');return;
    }
    if(key==='stand'&&miniatures.carryingBook){placeBook();return;}
    if(key==='stand')key='shelf';
    if(key==='cat'){
        const reaction=miniatures.petCat(sceneSeconds,pose().eye);
        if(!reaction)return;
        worldAudio.meow();petUntil=sceneSeconds+6;dirty=true;
        $('catReaction').textContent=reaction;
        clearTimeout(catFeedbackTimer);
        catFeedbackTimer=setTimeout(()=>{$('catReaction').textContent='';},2200);
    }else openCommunity(key);
}
$('nearby').onclick=()=>{if(nearestAction)interact(nearestAction.key,nearestAction.point);};
$('explore').onchange=e=>{
    const key=e.target.value;e.target.value='';
    if(gameOptions.open)gameOptions.close();
    if(key==='joinMeal'){
        $('activity').value='thursday';$('activity').dispatchEvent(new Event('change'));
    }
    if(key==='ball'){
        $('activity').value='daily';$('activity').dispatchEvent(new Event('change'));
        $('lighting').value='sunset';setLighting('sunset');
    }
    if(['joinMeal','mat','pray','wash','ball'].includes(key)&&!walking)setWalking(true);
    const stop={joinMeal:'meal',mat:'shelf',wash:'wudu',pray:'prayer',ball:'padang',wall:'qibla',shelf:'shelf',clock:'clock',donate:'tabung',board:'foyer',founders:'memorial',ayah:'qibla',cat:'cat'}[key];
    if(stop)followFriday=false;
    if(key==='cat'&&walking)setWalking(false);
    if(stop)chooseView(stop,false);
    if(key==='cat'&&!walking&&miniatures.catPosition)camera.target=miniatures.catPosition.slice();
    if(key==='ball'){feedback('Walk up to the ball to join the game.');return;}
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
    if(name.startsWith('Prayer clock'))return 'clock';
    if(/^(Bookcase|Shelved books)/.test(name))return 'shelf';
    if(/^(Foyer|Terrace) tabung/i.test(name))return 'donate';
    if(/^RMUTP board/i.test(name))return 'board';
    if(/^Contributors plaque/i.test(name))return 'founders';
    if(name==='Inscribed drum frieze')return 'ayah';
    if(name==='Qibla marble elevation'||name==='Marble moulding returns')return 'wall';
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
function pickAt(x,y,hover=false){
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
    if(!miniatures.friday){
        const offset=[8.65*miniatures.readingSide,1.8,-3.25].map((v,i)=>v-p.eye[i]);
        const along=dot(offset,ray);
        if(along>0&&along<closest&&Math.hypot(...offset.map((v,i)=>v-along*ray[i]))<.32){
            closest=along;key='stand';
        }
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
    if(hover)return key;
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

let lastHover=0;
canvas.addEventListener('pointermove',e=>{
    if(e.pointerType!=='mouse'||e.buttons||performance.now()-lastHover<100)return;
    lastHover=performance.now();
    $('wallHint').hidden=pickAt(e.clientX,e.clientY,true)!=='wall';
});
canvas.addEventListener('pointerleave',()=>{$('wallHint').hidden=true;});

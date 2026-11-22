// Each rigid piece shares one indexed batch. Animation changes positions and
// normals in place while the triangle topology and vertex colours stay fixed.
class MiniatureBatch {
    constructor(name,compact=false) {
        this.name=name;
        this.compact=compact;
        this.roughness=.68;
        this.bind=[];
        this.triangles=[];
        this.colors=[];
        this.origin=[0,0,0];
        this.heading=0;
    }
    surface(profile,tint,length,sides=9) {
        const first=this.colors.length;
        if(this.compact){
            sides=Math.min(sides,6);
            if(profile.length>4)profile=profile.filter((_,i)=>i===0||i===profile.length-1||i%2===1);
        }
        const palette=typeof tint==='function'?tint:()=>tint;
        for(let row=0;row<profile.length;row++) {
            const [y,rx,rz]=profile[row];
            const prev=profile[Math.max(0,row-1)], next=profile[Math.min(profile.length-1,row+1)];
            const dy=Math.max(.0001,(next[0]-prev[0])*length);
            const slopeX=(next[1]-prev[1])/dy,slopeZ=(next[2]-prev[2])/dy;
            for(let i=0;i<sides;i++) {
                const angle=2*Math.PI*i/sides,c=Math.cos(angle),s=Math.sin(angle);
                const nx=c/Math.max(.005,rx), nz=s/Math.max(.005,rz);
                const ny=-(nx*c*slopeX+nz*s*slopeZ), n=Math.hypot(nx,ny,nz);
                this.bind.push(rx*c,y,rz*s,nx/n,ny/n,nz/n);
                this.colors.push(palette(row,i,sides));
                if(row) {
                    const a=first+(row-1)*sides+i,b=first+(row-1)*sides+(i+1)%sides;
                    this.triangles.push(a,a+sides,b+sides,a,b+sides,b);
                }
            }
        }
        return {first,end:this.colors.length};
    }
    oval(x,z,color,length,sides=9) {
        return this.surface([[0,0,0],[.15,.72*x,.72*z],[.42,x,z],[.65,.98*x,.98*z],[.86,.72*x,.72*z],[1,0,0]],color,length,sides);
    }
    sleeve(start,end,color,length) {
        return this.surface([[0,0,0],[.035,start*.86,start*.81],[.15,start,start*.91],[.92,end,end*.92],[1,end*.92,end*.85],[1,0,0]],color,length);
    }
    panel(a,b,c,d,color) {
        const u=b.map((v,i)=>v-a[i]), v=c.map((n,i)=>n-a[i]);
        const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
        const length=Math.hypot(...n);
        if(length===0)return;
        const first=this.colors.length;
        for(const point of [a,b,c,d]){
            this.bind.push(...point,n[0]/length,n[1]/length,n[2]/length);
            this.colors.push(color);
        }
        this.triangles.push(first,first+1,first+2,first,first+2,first+3);
    }
    finish() {
        this.base=new Float32Array(this.bind);
        this.indices=this.colors.length<=65536?new Uint16Array(this.triangles):new Uint32Array(this.triangles);
        this.vertices=new Uint8Array(this.colors.length*28);
        this.coords=new Float32Array(this.vertices.buffer);
        const palette=new Map();
        this.colors.forEach((hex,i)=>{
            if(!palette.has(hex)) {
                const rgb=[1,3,5].map(k=>{
                    const c=parseInt(hex.slice(k,k+2),16)/255;
                    return Math.round(255*(c<=.04045?c/12.92:((c+.055)/1.055)**2.4));
                });
                palette.set(hex,[...rgb,255]);
            }
            this.vertices.set(palette.get(hex),i*28+24);
        });
        this.bind=null;this.colors=null;this.triangles=null;
    }
    frame(x,y,z,heading) {
        this.origin[0]=x;this.origin[1]=y;this.origin[2]=z;
        this.c=Math.cos(heading);this.s=Math.sin(heading);
    }
    place(piece,a,b,scale=1) {
        const [x,y,z]=a;
        const dx=b[0]-x,dy=b[1]-y,dz=b[2]-z;
        const length=Math.hypot(dx,dy,dz)||1;
        const ux=dx/length,uy=dy/length,uz=dz/length;
        // The local right axis stays level through a bow or prostration.
        const f=Math.hypot(uy,uz);
        const fy=f>1e-6?-uz/f:0, fz=f>1e-6?uy/f:1;
        const rx=uy*fz-uz*fy, ry=-ux*fz, rz=ux*fy;
        const c=this.c,s=this.s,ox=this.origin[0]+c*x+s*z,oy=this.origin[1]+y,oz=this.origin[2]-s*x+c*z;
        const xx=c*rx+s*rz,xz=-s*rx+c*rz,yx=c*ux+s*uz,yz=-s*ux+c*uz,zx=s*fz,zz=c*fz;
        const base=this.base,out=this.coords;
        for(let i=piece.first;i<piece.end;i++) {
            const j=i*6,k=i*7, px=base[j]*scale,py=base[j+1]*length,pz=base[j+2]*scale;
            out[k]=ox+xx*px+yx*py+zx*pz;out[k+1]=oy+ry*px+uy*py+fy*pz;out[k+2]=oz+xz*px+yz*py+zz*pz;
            const nx=base[j+3],ny=base[j+4],nz=base[j+5];
            out[k+3]=xx*nx+yx*ny+zx*nz;out[k+4]=ry*nx+uy*ny+fy*nz;out[k+5]=xz*nx+yz*ny+zz*nz;
        }
    }
}

class MiniatureScene {
    constructor() {
        this.people=new MiniatureBatch('Visitors and fish food');
        this.lake=new MiniatureBatch('Lake fish');
        this.congregation=new MiniatureBatch('Friday congregation',true);
        this.congregation.visible=false;
        this.friday=false;
        this.fridayTime=0;
        this.parts=[this.people,this.lake,this.congregation];
        this.walker=this.person('#477f80','#314554','#a7804f','#b57e5d','#f3eee0');
        this.worshipper=this.person('#e1d6b6','#5c6864','#86724e','#a26a4b','#333633');
        this.feeder=this.person('#a45d48','#344755','#55645a','#b98059','#d9c7a2');
        this.readers=[
            {body:this.person('#577465','#6c6458','#a38a64','#b78061','#eee8d7'),x:-4,z:5.35},
            {body:this.person('#a8b8b6','#4a6163','#6c8583','#ab7658','#484742'),x:-5.02,z:5.97},
            {body:this.person('#c0a281','#514b47','#78665a','#b47c59','#e9e5da'),x:-4.39,z:7.02},
            {body:this.person('#7a8b9f','#545967','#68778c','#aa7054','#454342'),x:-2.97,z:6.26}
        ];
        this.rehal=this.openBookOnStand();
        this.washers=[
            {z:-21.58,body:this.person('#7596a5','#56685e','#849079','#b87e5e','#343635',this.people,true)},
            {z:-16.78,body:this.person('#cab998','#68777a','#85775e','#a77555','#403a34',this.people,true)}
        ];
        this.wuduStreams=this.washers.map(()=>this.people.sleeve(.012,.009,'#9bc6c8',.69));
        this.washPose=new Float64Array(14);
        this.seats=[];
        this.makeCongregation();
        this.pouch=this.people.oval(.095,.066,'#bf9b70',.19);
        this.pellets=Array.from({length:6},()=>this.people.oval(.019,.017,'#d6a458',.036,5));
        this.handfuls=Array.from({length:4},()=>({
            start:-Infinity,active:true,pieces:Array.from({length:6},()=>this.people.oval(.025,.022,'#e2ae62',.043,5))
        }));
        this.nextHandful=0;
        this.lastThrow=-Infinity;
        this.school=Array.from({length:9},(_,i)=>this.fish(i));
        // hip height/advance, knee and ankle in the sagittal plane, torso
        // angle, head angle, then elbow and wrist positions.
        this.stand=[.88,0,.49,.025,.088,0,0,.12,.22,1.13,.055,.065,1.17,.17];
        this.bow=[.86,-.06,.49,.025,.088,0,1.44,1.46,.205,.69,.39,.12,.53,.13];
        this.sit=[.37,-.16,.092,.18,.075,-.21,.04,.14,.20,.64,.01,.115,.43,.14];
        this.prostrate=[.66,-.15,.093,.13,.073,-.29,2.40,2.44,.25,.24,.36,.165,.06,.33];
        this.prayerKeys=[[0,this.stand],[2.1,this.stand],[3.3,this.bow],[5.6,this.bow],[6.8,this.stand],
            [8.1,this.stand],[9.55,this.sit],[10.8,this.prostrate],[13,this.prostrate],
            [14.15,this.sit],[15.55,this.sit],[16.75,this.prostrate],[18.95,this.prostrate],
            [20.2,this.sit],[22.2,this.sit],[24,this.stand]];
        this.pose=new Float64Array(this.stand.length);
        this.readingPose=new Float64Array(this.sit);
        this.parts.forEach(part=>part.finish());
        this.people.frame(-4,1.53,5.96,0);
        this.people.place(this.rehal,[0,0,0],[0,1,0]);
        this.update(0);
    }
    openBookOnStand() {
        const m=this.people,first=m.colors.length;
        // A pair of interlocking wooden planks form the X of the folding rehal.
        function plank(sign,start,end,z0,z1) {
            const p=(t,z,thick)=>[sign*(t-.5)*.37+thick,.008+t*.316,z];
            const a=p(start,z0,-.009),b=p(end,z0,-.009),c=p(end,z1,-.009),d=p(start,z1,-.009);
            const A=p(start,z0,.009),B=p(end,z0,.009),C=p(end,z1,.009),D=p(start,z1,.009);
            m.panel(a,b,c,d,'#885a37');m.panel(A,D,C,B,'#a27449');
            m.panel(a,A,B,b,'#aa7c50');m.panel(d,c,C,D,'#976d47');
            m.panel(a,d,D,A,'#725031');m.panel(b,B,C,c,'#bb9060');
        }
        for(const sign of [-1,1]){
            plank(sign,.03,.36,-.132,-.047);
            plank(sign,.03,.36,.047,.132);
            plank(sign,.36,.47,-.132,.132);
            plank(sign,.47,.53,sign<0?-.132:.001,sign<0?-.001:.132);
            plank(sign,.53,1,-.132,.132);
        }
        // The gilt-edged covers and curved page blocks meet at the sewn spine.
        // Narrow coloured borders leave both cream pages open and unlettered.
        for(const side of [-1,1]){
            const y=x=>.277+.34*x+.013*Math.sin(x/.203*Math.PI);
            const at=(x,z,lift)=>[side*x,y(x)+lift,z];
            const strip=(x0,x1,z0,z1,lift,col)=>
                m.panel(at(x0,z0,lift),at(x0,z1,lift),at(x1,z1,lift),at(x1,z0,lift),col);
            for(const [x0,x1] of [[0,.033],[.033,.092],[.092,.158],[.158,.203]]){
                strip(x0,x1,-.155,.155,-.022,'#245344');
                strip(x0,x1,-.148,.148,0,'#f5e6bd');
                for(const z of [-.148,.148]){
                    m.panel(at(x0,z,-.017),at(x1,z,-.017),at(x1,z,0),at(x0,z,0),'#d9c28a');
                }
            }
            strip(.203,.210,-.155,.155,-.021,'#305443');
            strip(.205,.208,-.155,.155,-.020,'#b99856');
            m.panel(at(.203,-.148,-.017),at(.203,.148,-.017),at(.203,.148,0),at(.203,-.148,0),'#d7be80');
            for(const z of [-.125,.125])for(const [a,b] of [[.021,.092],[.092,.183]])strip(a,b,z,z+.002,.001,'#b9a273');
            strip(.021,.023,-.125,.127,.001,'#b9a273');strip(.181,.183,-.125,.127,.001,'#b9a273');
        }
        m.panel([-.005,.277,.08],[.004,.277,.08],[.009,.279,.15],[0,.279,.15],'#93533e');
        m.panel([0,.279,.15],[.009,.279,.15],[.015,.225,.168],[.006,.225,.168],'#93533e');
        return {first,end:m.colors.length};
    }
    person(shirt,trousers,sash,skin,cap,m=this.people,washedArms=false) {
        const torso=m.surface([[0,0,0],[.01,.194,.125],[.10,.196,.128],[.35,.173,.119],[.78,.20,.12],[.91,.202,.11],[1,.088,.075]],shirt,.64,12);
        const waist=m.surface([[0,.202,.136],[.11,.203,.137],[.97,.198,.135],[1,.198,.135]],(r)=>r===1?'#beac7a':sash,.15,12);
        const collar=m.sleeve(.076,.062,shirt,.064);
        const head=m.surface([[0,.050,.062],[.13,.084,.088],[.34,.100,.104],[.67,.100,.103],[.93,.082,.084],[1,.060,.069]],skin,.235,12);
        const hat=m.surface([[0,.105,.106],[.10,.106,.107],[.29,.101,.102],[.85,.089,.094],[1,.063,.070],[1,0,0]],cap,.073,12);
        const nose=m.oval(.025,.029,skin,.064,7);
        const eyes=m.compact?[]:[-1,1].map(()=>m.oval(.010,.006,'#422e24',.013,6));
        const ears=m.compact?[]:[-1,1].map(()=>m.oval(.021,.021,skin,.059,7));
        const sides=[-1,1].map(()=>({
            thigh:m.sleeve(.091,.076,trousers,.42),calf:m.sleeve(.075,.054,trousers,.42),
            foot:m.oval(.055,.046,skin,.21),arm:m.sleeve(.071,.055,shirt,.29),
            forearm:m.sleeve(.055,.043,washedArms?skin:shirt,.25),hand:m.oval(.043,.031,skin,.105,7)
        }));
        return {batch:m,torso,waist,collar,head,hat,nose,eyes,ears,sides};
    }
    makeCongregation(){
        const clothing=[
            ['#e1d8c6','#616b69','#a49276'],['#7f9693','#526062','#877d64'],
            ['#a5afbf','#4a5966','#6a7381'],['#c6a891','#6f6359','#897963'],
            ['#e4e0d1','#888b7e','#879078'],['#7b898e','#57585a','#9c8f76'],
            ['#bfc5a7','#68705f','#86896d'],['#a99388','#545e62','#796961']
        ];
        const skins=['#b07959','#bc8d6d','#9b6e50','#c59574'];
        for(let row=0;row<6;row++)for(let col=0;col<12;col++){
            const x=(col-5.5)*.9,z=4.28+row*1.72;
            if((row===1||row===2)&&x< -2.2)continue;
            const outfit=clothing[(row*5+col*3+Math.floor(col/3))%clothing.length];
            const body=this.person(...outfit,skins[(row*3+col)%4],(row+col)%3===0?'#383a36':'#ece8d7',this.congregation);
            let route=null;
            if(row===0||row===1&&col>=8){
                // Approach through the shaded east colonnade and the ramp in
                // its glazed facade. The interior aisle stays outside the rows.
                const lane=col%2,aisle=-7.18-lane*.50,door=6.48+lane*.77;
                const outside=-15.05-lane*.68;
                const startZ=row===0?-19+Math.floor(col/2)*3.65:1.6+(col-8)*.95;
                route=this.walkRoute([[outside,startZ],[outside,door],[aisle,door],[aisle,z-.72],[x,z-.72],[x,z]]);
            }
            this.seats.push({x,z,row,col,body,route});
        }
        for(let i=0;i<8;i++){
            // Arrivals cross the rear arcade to the carpeted entrance lobby.
            const col=i%4,row=Math.floor(i/4),x=[-3.42,-2.45,1.46,3.44][col],z=-15.62+row*4.45;
            const lane=col%2?.92:-.92,start=-43.6+Math.floor(i/2)*3.95;
            const doorAisle=-16.95+.28*(i%2);
            const route=this.walkRoute([[lane,start],[lane,doorAisle],[x,doorAisle],[x,z]]);
            const body=this.person(...clothing[i],skins[col],i%3?'#e6e5d4':'#343b38',this.congregation);
            this.seats.push({x,z,row,col,body,route,rear:true});
        }
        this.imam=this.person('#ede6cf','#57675d','#758064','#a57355','#e9e5d0',this.congregation);
        this.crowdPose=new Float64Array(14);
        this.sermonPose=new Float64Array(14);
    }
    walkRoute(points){
        const rounded=[points[0]],legs=[];
        for(let i=1;i<points.length-1;i++){
            const a=points[i-1],b=points[i],c=points[i+1];
            const ba=[a[0]-b[0],a[1]-b[1]],bc=[c[0]-b[0],c[1]-b[1]];
            const lenA=Math.hypot(...ba),lenC=Math.hypot(...bc);
            if(!lenA||!lenC)continue;
            const r=Math.min(.29,lenA*.4,lenC*.4);
            const p=[b[0]+ba[0]*r/lenA,b[1]+ba[1]*r/lenA],q=[b[0]+bc[0]*r/lenC,b[1]+bc[1]*r/lenC];
            for(let k=0;k<=4;k++){
                const t=k/4,v=1-t;
                rounded.push([v*v*p[0]+2*v*t*b[0]+t*t*q[0],v*v*p[1]+2*v*t*b[1]+t*t*q[1]]);
            }
        }
        rounded.push(points[points.length-1]);
        let total=0;
        for(let i=1;i<rounded.length;i++){
            const [x,z]=rounded[i-1],dx=rounded[i][0]-x,dz=rounded[i][1]-z,len=Math.hypot(dx,dz);
            if(len<1e-5)continue;
            legs.push({x,z,ux:dx/len,uz:dz/len,start:total,end:total+len,yaw:Math.atan2(dx,dz)});
            total+=len;
        }
        return {total,legs};
    }
    posture(seconds) {
        const t=((seconds%24)+24)%24, keys=this.prayerKeys;
        let i=1;
        while(i<keys.length-1&&t>keys[i][0])i++;
        const [start,a]=keys[i-1],[end,b]=keys[i];
        let k=(t-start)/(end-start);k=k*k*(3-2*k);
        for(let j=0;j<a.length;j++)this.pose[j]=a[j]+(b[j]-a[j])*k;
        return this.pose;
    }
    human(model,x,ground,z,heading,p,gait=0,strength=0,feedPhase=-1,crossLegged=false,wash=null) {
        const m=model.batch;
        m.frame(x,ground,z,heading);
        const bob=strength*.025*(1-Math.cos(2*gait));
        const hipY=p[0]+bob,hipZ=p[1], cs=Math.cos(p[6]),sn=Math.sin(p[6]),hc=Math.cos(p[7]),hs=Math.sin(p[7]);
        const spine=(d,forward=0)=>[0,hipY+d*cs-forward*sn,hipZ+d*sn+forward*cs];
        const shoulder=spine(.535),neck=spine(.585);
        const skull=(d,forward=0)=>[0,neck[1]+d*hc-forward*hs,neck[2]+d*hs+forward*hc];
        m.place(model.torso,spine(-.095),spine(.56));
        m.place(model.waist,spine(-.087),spine(.064));
        m.place(model.collar,spine(.525),neck);
        m.place(model.head,neck,skull(.215));m.place(model.hat,skull(.179),skull(.263));
        m.place(model.nose,skull(.083,.101),skull(.14,.104));
        for(let j=0;j<2;j++){
            const sign=j===0?-1:1,swing=sign*Math.sin(gait), footLift=strength*.107*Math.max(0,sign*Math.cos(gait));
            const foot=[sign*.109,p[4]+footLift,p[5]+strength*.285*swing];
            const knee=[sign*.107,p[2]+footLift*.69,p[3]+strength*(.106*swing+.115*Math.max(0,sign*Math.cos(gait)))];
            if(crossLegged){
                knee[0]=sign*.32;knee[1]=.12;knee[2]=.11;
                foot[0]=-sign*.055;foot[1]=.081;foot[2]=.19+sign*.042;
            }
            if(wash){
                const footWeight=sign<0?wash.leftFoot:wash.rightFoot;
                foot[1]+=.13*footWeight;foot[2]+=.09*footWeight;
                knee[1]+=.11*footWeight;knee[2]+=.05*footWeight;
            }
            if(!m.compact){
                const eye=skull(.128,.094);eye[0]=sign*.040;
                m.place(model.eyes[j],eye,[eye[0],eye[1]+.011*hc,eye[2]+.011*hs]);
                const ear=skull(.08);ear[0]=sign*.096;
                m.place(model.ears[j],ear,[ear[0],ear[1]+.051*hc,ear[2]+.051*hs]);
            }
            const leg=model.sides[j];
            m.place(leg.thigh,[sign*.095,hipY,hipZ],knee);
            m.place(leg.calf,knee,foot);
            const kneeling=Math.min(1,Math.max(0,(.26-(p[2]-p[4]))/.20));
            if(crossLegged){
                m.place(leg.foot,[foot[0],foot[1],foot[2]],[-sign*.21,.060,foot[2]-.025]);
            }else{
                m.place(leg.foot,[foot[0],foot[1]-.039,foot[2]-.041],[foot[0],foot[1]-.043+.018*kneeling,foot[2]+.16-.35*kneeling]);
            }
            const armStart=[sign*.178,shoulder[1],shoulder[2]];
            let elbow=[sign*p[8],p[9]+bob,p[10]], wrist=[sign*p[11],p[12]+bob,p[13]+sign*.011];
            if(strength>0) {
                const blend=(a,b)=>a+(b-a)*strength;
                elbow=[sign*.204,blend(elbow[1],1.14+bob),blend(elbow[2],-.065-.099*swing)];
                wrist=[blend(wrist[0],sign*.196),blend(wrist[1],.905+bob+.039*Math.abs(swing)),blend(wrist[2],.018-.193*swing)];
            }
            if(feedPhase>=0){
                if(sign<0){elbow=[-.22,1.10,.025];wrist=[-.10,1.07,.20];}
                else{
                    // Reach into the pouch, cast over the rail, and bring the hand back.
                    const toss=this.pulse(feedPhase,.65,1.60,1.83,2.75);
                    elbow=[.20,1.11+.25*toss,.04+.16*toss];
                    wrist=[.04+.12*toss,1.12+.34*toss,.17+.28*toss];
                }
            }
            if(wash){
                const path=wash.arms[j];elbow=path[0];wrist=path[1];
            }
            m.place(leg.arm,armStart,elbow);m.place(leg.forearm,elbow,wrist);
            const dx=wrist[0]-elbow[0],dy=wrist[1]-elbow[1],dz=wrist[2]-elbow[2];
            const k=.092/(Math.hypot(dx,dy,dz)||1);
            m.place(leg.hand,wrist,[wrist[0]+dx*k,Math.max(.033,wrist[1]+dy*k),wrist[2]+dz*k]);
        }
    }
    pulse(t,start,up,hold,end) {
        const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
        return smooth((t-start)/(up-start))*(1-smooth((t-hold)/(end-hold)));
    }
    terraceHeight(z){
        let height=1.15;
        for(let i=0;i<4;i++)height+=.095*Math.max(0,Math.min(1,(z+21-i*.48)/.14));
        return height;
    }
    washAtStation(washer,t,index){
        const phase=(t+index*11)%29,p=this.washPose;
        const face=this.pulse(phase,3.3,4.2,7.1,8.0),rightArm=this.pulse(phase,8.6,9.4,11.9,12.7);
        const leftArm=this.pulse(phase,12.7,13.5,16,16.8),head=this.pulse(phase,17.0,18.0,19.4,20.4);
        const rightFoot=this.pulse(phase,20.7,21.7,23.6,24.5), leftFoot=this.pulse(phase,24.5,25.5,27.5,28.5);
        const feet=rightFoot+leftFoot,arms=leftArm+rightArm,wave=Math.sin(phase*5.1);
        p.set(this.sit);
        p[0]=.55;p[1]=.19;p[2]=.47;p[3]=.50;p[4]=.205;p[5]=.60;
        p[6]=.91-.55*face-.51*arms-.68*head+.32*feet;
        p[7]=.84-.51*face-.36*arms-.25*head+.31*feet;
        const armTargets=[];
        for(const sign of [-1,1]){
            const elbow=[sign*.195,.88,.73],wrist=[sign*.034,.64+.018*wave,1.01];
            function toward(point,target,weight){for(let k=0;k<3;k++)point[k]+=(target[k]-point[k])*weight;}
            toward(elbow,[sign*.21,.89,.58],face);toward(wrist,[sign*.059,1.105+.043*wave,.58-.012*wave],face);
            const rub=sign<0?rightArm:leftArm,rest=sign<0?leftArm:rightArm;
            toward(elbow,[sign*.19,.85,.37],rub);toward(wrist,[-sign*.085,.79+.032*wave,.58+.10*wave],rub);
            toward(elbow,[sign*.14,.71,.44],rest);toward(wrist,[sign*.07,.85,.72],rest);
            toward(elbow,[sign*.22,1.05,.46],head);toward(wrist,[sign*.055,1.32,.43+.10*wave],head);
            toward(elbow,[sign*.19,.62,.73],feet);toward(wrist,[(rightFoot-leftFoot)*.095+sign*.028,.33+.027*wave,.70+.04*wave],feet);
            armTargets.push([elbow,wrist]);
        }
        this.human(washer.body,-39.58,1.17,washer.z,-Math.PI/2,p,0,0,-1,false,{leftFoot,rightFoot,arms:armTargets});
        this.people.frame(-40.68,1.17,washer.z,0);
        this.people.place(this.wuduStreams[index],[.004*Math.sin(t*5.2),.025,0],[0,.73,0]);
    }
    servicePrayer(clock,lag=0){
        const elapsed=Math.max(0,clock-60-lag);
        // The first rakah rises again. The second ends in the seated posture.
        const phase=elapsed<20?elapsed*1.2:Math.min(21.3,(elapsed-20)*1.2);
        return this.posture(phase);
    }
    fridayService(seconds){
        const clock=((seconds%100)+100)%100;
        const ease=k=>{k=Math.max(0,Math.min(1,k));return k*k*(3-2*k);};
        const takePose=(a,b,k)=>{
            for(let j=0;j<a.length;j++)this.crowdPose[j]=a[j]+(b[j]-a[j])*k;
            return this.crowdPose;
        };
        for(const seat of this.seats){
            let {x,z}=seat,ground=1.53,yaw=0,gait=0,stride=0,pose;
            if(clock<30&&seat.route){
                const {total,legs}=seat.route;
                const arrival=Math.min(28.6,total/(1.22+.035*(seat.col%4)));
                const walked=total*Math.min(1,clock/arrival);
                const leg=legs.find(l=>l.end>=walked)||legs[legs.length-1];
                x=leg.x+leg.ux*(walked-leg.start);z=leg.z+leg.uz*(walked-leg.start);yaw=leg.yaw;
                ground=seat.rear?this.terraceHeight(z):1.15+.38*Math.max(0,Math.min(1,(14.9-x)/2.08));
                stride=1-ease((clock-arrival+.50)/.5);
                gait=walked*2*Math.PI/1.42;
                pose=takePose(this.stand,this.sit,ease((clock-arrival)/1.15));
            }else if(clock<60){
                const rise=ease((clock-56.3-.06*seat.row)/2.65);
                pose=takePose(this.sit,this.stand,rise);
                pose[7]+=.025*Math.sin(clock*.7+seat.col+seat.row)*(1-rise);
                yaw=clock>=30?Math.atan2(-5.25-seat.x,14.85-seat.z)*.22*(1-rise):0;
            }else{
                pose=this.servicePrayer(clock,.03*seat.row);
            }
            this.human(seat.body,x,ground,z,yaw,pose,gait,stride);
        }
        if(clock<51.5){
            const p=this.sermonPose;p.set(this.stand);
            const gest=clock<30?.18:.52+.40*Math.sin(clock*1.16);
            p[7]=.09+.047*Math.sin(clock*.7);
            const arms=[[[-.20,1.10,.08],[-.09,1.13,.19]],
                [[.20,1.14+.10*gest,.08],[.16,1.21+.21*gest,.24+.1*gest]]];
            this.human(this.imam,-5.25,3.825,14.85,Math.PI,p,0,0,-1,false,{leftFoot:0,rightFoot:0,arms});
        }else if(clock<60){
            const path=clock-51.5;
            let x=-5.25,z=14.85,yaw=0,ground=3.825;
            if(path<1){
                z+=.67*path;
            }else if(path<2.5){
                x+=1.49*(path-1)/1.5;z=15.52;yaw=Math.PI/2;
            }else if(path<5.3){
                x=-3.76;z=15.52-(path-2.5);yaw=Math.PI;
                ground=1.53+.2295*clamp(Math.floor((z-12.86)/.28)+1,0,10);
            }else{
                const progress=clamp((path-5.3)/3.2,0,1);
                x=-3.76*(1-progress);z=12.72+.98*progress;
                yaw=Math.atan2(3.76,.98);ground=1.53;
            }
            const stride=ease(path/.3)*(1-ease((path-8.12)/.38));
            this.human(this.imam,x,ground,z,yaw,this.stand,path*6.1,stride);
        }else{
            this.human(this.imam,0,1.53,13.70,0,this.servicePrayer(clock));
        }
    }
    travel(seconds) {
        const duration=16,ramp=.75;
        if(seconds<=0)return 0;
        if(seconds>=duration)return 1;
        if(seconds<ramp)return seconds*seconds/(2*ramp*(duration-ramp));
        if(seconds>duration-ramp)return 1-(duration-seconds)**2/(2*ramp*(duration-ramp));
        return (seconds-ramp*.5)/(duration-ramp);
    }
    fish(i) {
        const m=this.lake, size=.81+.10*(i%4), cream='#e8d4a4',gold='#de9a42',red='#c25d32',dark='#586456';
        const coat=[cream,gold,red,dark][i%4];
        const stripe=[red,cream,cream,gold][i%4];
        const colors=(r,k,n)=>{
            const underside=k>0&&k<n/2;
            if(underside)return '#b8ad81';
            return (r===2 && (k+i)%5<3)||(r===4&&k%4<2)?stripe:coat;
        };
        const body=m.surface([[0,0,0],[.08,.039,.045],[.25,.095,.091],[.46,.124,.117],[.65,.12,.113],[.83,.091,.087],[.97,.041,.051],[1,0,0]],colors,.54,10);
        const fin=m.oval(.018,.052,coat,.20,6),tails=[m.oval(.013,.064,coat,.19,6),m.oval(.013,.064,coat,.19,6)];
        const pectorals=[m.oval(.017,.039,stripe,.145,6),m.oval(.017,.039,stripe,.145,6)];
        const eyes=[m.oval(.012,.012,'#2b302c',.023,6),m.oval(.012,.012,'#2b302c',.023,6)];
        return {size,body,fin,tails,pectorals,eyes};
    }
    swim(time,feeding){
        const m=this.lake;
        for(let i=0;i<this.school.length;i++){
            const f=this.school[i],a=time*(.34+.025*(i%4))+i*2.39996;
            const radius=(.99+(i%4)*.51)*(1-.52*feeding);
            const x=8+radius*Math.sin(a), z=26.42+radius*.65*Math.cos(a);
            const heading=Math.atan2(Math.cos(a),-.65*Math.sin(a));
            const depth=-.165-.034*(i%3)+.034*Math.sin(a*3)+.037*feeding;
            m.frame(x,depth,z,heading);
            const size=f.size,tail=.074*Math.sin(time*(5.6+i*.16)+i),wag=tail*size;
            const snout=[0,0,.275*size],base=[wag*.26,0,-.26*size],tip=[wag,0,-.405*size];
            m.place(f.body,base,snout,size);
            m.place(f.fin,[0,.069*size,-.075*size],[0,.146*size,.02*size],size);
            for(let side=0;side<2;side++){
                const h=side===0?-1:1;
                m.place(f.tails[side],base,[tip[0],h*.096*size,tip[2]-.017*size],size);
                m.place(f.pectorals[side],[h*.091*size,-.021*size,.062*size],[h*.178*size,-.058*size,-.049*size],size);
                m.place(f.eyes[side],[h*.066*size,.023*size,.178*size],[h*.072*size,.046*size,.183*size],size);
            }
        }
    }
    feedFish(seconds=this.lastSceneTime){
        if(!Number.isFinite(seconds))return false;
        const handful=this.handfuls[this.nextHandful];
        handful.start=seconds;handful.active=true;
        this.nextHandful=(this.nextHandful+1)%this.handfuls.length;
        this.lastThrow=seconds;
        return true;
    }
    rippleAge(seconds){
        let age=((seconds-2.17)%6+6)%6;
        for(const handful of this.handfuls){
            const sinceImpact=seconds-handful.start-.65;
            if(sinceImpact>=0)age=Math.min(age,sinceImpact);
        }
        return age;
    }
    scatterFood(pieces,age,scatter=0){
        for(let i=0;i<pieces.length;i++){
            const flight=(age-i*.045)/.65,k=Math.max(0,Math.min(1,flight));
            const x=.16+(-.16+.23*Math.sin(i*4.19+scatter))*k;
            const z=.49+(2.26+.21*Math.cos(i*2.7+scatter))*k;
            const y=1.45+1.6*k-4.19*k*k,scale=flight>=0&&flight<=1?1:.0001;
            this.people.place(pieces[i],[x,y,z],[x,y+.034*scale,z],scale);
        }
    }
    update(seconds) {
        const t=Math.max(0,Number.isFinite(seconds)?seconds:0);
        this.lastSceneTime=t;
        this.congregation.visible=this.friday;
        const service=((this.fridayTime%100)+100)%100;
        const cycle=(t+8)%59;
        let z=-13, yaw=0, speed=0, gait=0, pose=this.stand;
        if(cycle<16||cycle>=41.5&&cycle<57.5){
            const incoming=cycle<16, clock=incoming?cycle:cycle-41.5;
            const progress=this.travel(clock);
            z=incoming?-32+19*progress:-13-19*progress;
            yaw=incoming?0:Math.PI;
            speed=this.pulse(clock,0,.75,15.25,16);
            gait=progress*19*2*Math.PI/1.42;
        }else if(cycle<40)pose=this.posture(cycle-16);
        else if(cycle<41.5)yaw=Math.PI*(1-Math.cos((cycle-40)*Math.PI/1.5))*.5;
        else{z=-32;yaw=Math.PI+Math.PI*(1-Math.cos((cycle-57.5)*Math.PI/1.5))*.5;}
        if(this.friday){
            this.fridayService(service);
            const weight=Math.min(1,Math.max(0,(service-56.3)/2.65));
            const a=weight*weight*(3-2*weight);
            for(let k=0;k<this.sit.length;k++)this.crowdPose[k]=this.sit[k]+(this.stand[k]-this.sit[k])*a;
            const rearPose=service>=60?this.servicePrayer(service):this.crowdPose;
            this.human(this.walker,0,1.53,-13,0,rearPose);
            this.human(this.worshipper,2,1.53,-13,0,rearPose);
        }else{
            this.human(this.walker,0,this.terraceHeight(z),z,yaw,pose,gait,speed);
            this.human(this.worshipper,2,1.53,-13,0,this.posture(t+10.3));
        }
        this.readers.forEach((reader,i)=>{
            const p=this.readingPose;p.set(this.sit);
            const breath=Math.sin(t*(.93+i*.08)+i*1.6);
            const nod=Math.sin(t*(.48+i*.035)+i*2.2);
            p[0]=.345+.006*breath;p[1]=-.065;p[6]=(i===0?.20:.085)+.014*breath;
            p[7]=(i===0?.64:.34)+.052*nod;
            p[8]=.22;p[9]=.62+.008*breath;p[10]=.09;
            p[11]=i===0?.13:.19;p[12]=(i===0?.40:.34)+.007*nod;
            p[13]=i===0?.30+.015*nod:.18;
            let yaw=Math.atan2(-4-reader.x,5.96-reader.z),x=reader.x,z=reader.z;
            let posture=p,step=0,walking=0,crossLegged=true;
            if(this.friday&&service>=28){
                const ease=k=>{k=Math.max(0,Math.min(1,k));return k*k*(3-2*k);};
                const look=ease((service-28)/2),toward=Math.atan2(-5.25-x,14.85-z);
                yaw+=look*Math.atan2(Math.sin(toward-yaw),Math.cos(toward-yaw));
                p[6]*=1-.7*look;p[7]=p[7]*(1-look)+.10*look;p[13]-=.06*look;
                if(service>=53){
                    const rise=ease((service-53)/1.7),travel=ease((service-54.7)/3.6);
                    const destX=[-3.15,-4.95,-4.95,-3.15][i],destZ=i<2?6.00:7.72;
                    const dx=destX-reader.x,dz=destZ-reader.z;
                    x+=travel*dx;z+=travel*dz;step=travel*Math.hypot(dx,dz)*2*Math.PI/1.42;
                    for(let k=0;k<p.length;k++)p[k]+=(this.stand[k]-p[k])*rise;
                    const heading=Math.atan2(dx,dz),turn=ease((service-53.6)/1.5);
                    yaw+=turn*Math.atan2(Math.sin(heading-yaw),Math.cos(heading-yaw));
                    yaw*=1-ease((service-57.5)/1.5);
                    walking=this.pulse(service,54.7,55.2,57.4,58.3);
                    crossLegged=rise<.3;
                    if(service>=60)posture=this.servicePrayer(service);
                }
            }
            this.human(reader.body,x,1.53,z,yaw,posture,step,walking,-1,crossLegged);
        });
        this.washers.forEach((person,i)=>this.washAtStation(person,t,i));
        const phase=t%6;
        const manualAge=t-this.lastThrow;
        this.human(this.feeder,8,1.15,23.35,0,this.stand,0,0,manualAge>=0&&manualAge<1.5?1.55+manualAge:phase);
        this.people.place(this.pouch,[-.11,.93,.18],[-.11,1.115,.18]);
        this.scatterFood(this.pellets,phase-1.52);
        let gathering=this.pulse(phase,1.65,3.2,3.9,5.6);
        for(let i=0;i<this.handfuls.length;i++){
            const handful=this.handfuls[i],age=t-handful.start;
            if(handful.active){
                this.scatterFood(handful.pieces,age,i*.77);
                if(age>.90||age<0)handful.active=false;
            }
            if(age>=0&&age<4.8)gathering=Math.max(gathering,1.32*this.pulse(age,.15,1.15,2.8,4.8));
        }
        this.swim(t,gathering);
    }
}

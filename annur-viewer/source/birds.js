// Lake birds share a fixed mesh. Each flight returns to the rear prayer-hall
// parapet, whose cap is at y=7.775, z=-18.64 in the architectural model.
class MosqueBirds {
    constructor() {
        this.part = new MiniatureBatch('Lake birds');
        this.flock = [
            {x: -6.4, scale: .95, offset: 14.8, perch: 8, pace: 1.02},
            {x: -1.6, scale: .82, offset: 12.3, perch: 6.8, pace: 1.04},
            {x: 3.1, scale: .88, offset: 2.4, perch: 9.2, pace: .98},
            {x: 8.2, scale: .92, offset: 30.5, perch: 7.8, pace: 1.05}
        ].map((bird, i) => {
            const model = this.createBird(i);
            const path = this.flightPath(bird.x, i);
            return {...bird, model, path, last: path[path.length - 1].time};
        });
        this.part.finish();
        this.update(0);
    }

    createBird(index) {
        const m = this.part;
        const feather = ['#efece0', '#e8e5d7', '#e7e9e4', '#f2eee4'][index];
        const shaded = ['#c9c9bd', '#c5c6b8', '#c4cbc8', '#cac9bf'][index];
        const body = m.oval(.096, .099, feather, .39, 8);
        const tail = m.oval(.071, .031, shaded, .25, 7);
        const lowerNeck = m.oval(.048, .047, feather, .20, 7);
        const upperNeck = m.oval(.039, .041, feather, .15, 7);
        const head = m.oval(.056, .052, feather, .123, 8);
        const bill = m.surface([[0,.029,.018],[.22,.022,.016],[1,.001,.001]], '#bf9449', .127, 6);
        const legs = [-1,1].map(() => ({
            shank: m.sleeve(.011, .008, '#504e41', .16),
            foot: m.sleeve(.008, .004, '#615e46', .083),
            eye: m.oval(.009,.009,'#363930',.017,5)
        }));
        const wings = [-1,1].map(side => {
            const first = m.colors.length;
            // The changing chord forms a broad inner wing and tapering primaries.
            const stations = [[0,.06,-.09],[.13,.11,-.15],[.31,.13,-.17],
                [.49,.10,-.16],[.63,.055,-.10],[.77,-.027,-.055]];
            const point = (row, type) => {
                const [span, lead, trail] = row;
                if (type === 0) return [side*span, .001, lead];
                if (type === 1) return [side*span, .027, lead*.55+trail*.45];
                return [side*span, -.009, trail];
            };
            for (let k=1; k<stations.length; k++) {
                const a=stations[k-1], b=stations[k];
                for (let j=0; j<2; j++) {
                    const quad=[point(a,j),point(b,j),point(b,j+1),point(a,j+1)];
                    if (side<0) quad.reverse();
                    m.panel(...quad,j===0 ? feather : shaded);
                }
            }
            // Individual flight feathers extend beyond the trailing edge.
            for (let k=0; k<5; k++) {
                const d=.31+k*.081, reach=.09+.045*Math.sin(k*.7);
                const z=-.19+k*.023;
                const featherPanel=[[side*d,.004,z+.15],[side*(d+.079),.001,z+.145],
                    [side*(d+reach+.065),-.016,z-.021],[side*(d+reach+.027),-.023,z-.034]];
                if (side<0) featherPanel.reverse();
                m.panel(...featherPanel,k%2 ? shaded : feather);
            }
            return {side,first,end:m.colors.length};
        });
        return {body, tail, lowerNeck, upperNeck, head, bill, legs, wings};
    }

    flightPath(x, index) {
        // Cubic Hermite spans share velocities; the two roof endpoints have zero
        // velocity so each bird settles before its next departure.
        const roof=7.775, spread=index*.8;
        const knots = [
            [0,x,roof,-18.64], [1.95,x+5.2,11.4,-21.9], [5.6,28+spread,16,-32],
            [10.5,43+spread,16.8,-4], [16.0,28,19+spread,35+spread],
            [21, -9,17.4+spread,40], [25.8,-34-spread,15.5,18],
            [30.5,-34-spread,14,-14], [34.5,-18,12.5,-25-spread],
            [38,x-4.8,9.15,-20.1], [40,x,roof,-18.64]
        ];
        return knots.map(([time,px,py,pz],i) => {
            const knot={time,p:[px,py,pz],v:[0,0,0]};
            if (i>0 && i<knots.length-1) {
                const a=knots[i-1], b=knots[i+1];
                knot.v=[1,2,3].map(axis => (b[axis]-a[axis])/(b[0]-a[0]));
            }
            return knot;
        });
    }

    sample(path, time) {
        let i=1;
        while (i<path.length-1 && path[i].time<time) i++;
        const a=path[i-1], b=path[i], dt=b.time-a.time;
        const u=Math.max(0,Math.min(1,(time-a.time)/dt)), u2=u*u, u3=u2*u;
        const p=[], v=[];
        // At rest, use the limiting travel direction so the bird's head keeps
        // facing forward at the exact instant the horizontal speed reaches zero.
        const w=Math.max(.0001,Math.min(.9999,u)), w2=w*w;
        for (let j=0;j<3;j++) {
            p[j]=(2*u3-3*u2+1)*a.p[j]+(u3-2*u2+u)*dt*a.v[j]
                +(-2*u3+3*u2)*b.p[j]+(u3-u2)*dt*b.v[j];
            v[j]=(6*w2-6*w)*a.p[j]/dt+(3*w2-4*w+1)*a.v[j]
                +(-6*w2+6*w)*b.p[j]/dt+(3*w2-2*w)*b.v[j];
        }
        return {p, heading:Math.atan2(v[0],v[2])};
    }

    ease(value) {
        const u=Math.max(0,Math.min(1,value));
        return u*u*(3-2*u);
    }

    moveWing(wing, size, spread, stroke, lag, bank) {
        const m=this.part, side=wing.side;
        const joint=.31, fold=1-spread;
        const shoulderX=.058, shoulderY=.31, shoulderZ=.034;
        const angles=[stroke+side*bank, lag+side*bank];
        const sweeps=[.08+1.03*fold,.16+1.60*fold];
        const axes=angles.map((angle,j) => {
            const c=Math.cos(angle),s=Math.sin(angle),cs=Math.cos(sweeps[j]),ss=Math.sin(sweeps[j]);
            return {xx:c*cs,xy:s,xz:-c*ss, yx:-s*cs,yy:c,yz:s*ss, zx:ss,zz:cs};
        });
        const [inner,outer]=axes;
        const chordScale=1-.52*fold;
        for(let i=wing.first; i<wing.end; i++) {
            const j=i*6,k=i*7;
            const span=side*m.base[j], localY=m.base[j+1], localZ=m.base[j+2]*chordScale;
            const innerSpan=Math.min(span,joint)*(1-.21*fold);
            const outerSpan=Math.max(0,span-joint)*(1-.36*fold);
            const f=span<=joint ? inner : outer;
            const lx=side*size*(shoulderX+innerSpan*inner.xx+outerSpan*outer.xx+localY*f.yx+localZ*f.zx);
            const ly=size*(shoulderY+innerSpan*inner.xy+outerSpan*outer.xy+localY*f.yy);
            const lz=size*(shoulderZ+innerSpan*inner.xz+outerSpan*outer.xz+localY*f.yz+localZ*f.zz);
            m.coords[k]=m.origin[0]+m.c*lx+m.s*lz;
            m.coords[k+1]=m.origin[1]+ly;
            m.coords[k+2]=m.origin[2]-m.s*lx+m.c*lz;
            const rawX=side*m.base[j+3],rawY=m.base[j+4],rawZ=m.base[j+5];
            const nx=side*(rawX*f.xx+rawY*f.yx+rawZ*f.zx);
            const ny=rawX*f.xy+rawY*f.yy;
            const nz=rawX*f.xz+rawY*f.yz+rawZ*f.zz;
            m.coords[k+3]=m.c*nx+m.s*nz;
            m.coords[k+4]=ny;
            m.coords[k+5]=-m.s*nx+m.c*nz;
        }
    }

    update(seconds) {
        const m=this.part, t=Math.max(0,Number.isFinite(seconds) ? seconds : 0);
        this.flock.forEach((bird,i) => {
            const phase=(t*bird.pace+bird.offset)%(bird.last+bird.perch);
            const flight=phase-bird.perch, resting=flight<0;
            let state, spread, tuck;
            if (resting) {
                state=this.sample(bird.path,0);
                const incoming=this.sample(bird.path,bird.last).heading;
                const turn=Math.atan2(Math.sin(state.heading-incoming),Math.cos(state.heading-incoming));
                state.heading=incoming+turn*this.ease((phase-.7)/(bird.perch-2));
                spread=1-this.ease(phase/.65)+this.ease((phase-bird.perch+.65)/.65);
                tuck=0;
            } else {
                state=this.sample(bird.path,flight);
                spread=1;
                tuck=this.ease(flight/1.05)*this.ease((bird.last-flight)/1.75);
            }
            m.frame(...state.p,state.heading);
            const model=bird.model, size=bird.scale;
            const local=point=>point.map(c=>c*size);
            const place=(piece,a,b)=>m.place(piece,local(a),local(b),size);
            const clock=t*(2.2+i*.12)*Math.PI*2+i*1.4;
            const cruise=resting ? 0 : this.ease((flight-2.5)/2)*this.ease((bird.last-flight-1.8)/2);
            const beats=1-cruise*.98*this.ease((Math.sin(t*.81+i*1.67)+.43)/.8);
            const stroke=(-.21* (1-spread))+spread*(.13+beats*.69*Math.sin(clock));
            const delayed=(-.33*(1-spread))+spread*(.09+beats*.82*Math.sin(clock-.66));
            const bank=cruise*(.065*Math.sin(flight*.36)+.05*Math.cos(flight*.8+i));
            for (const wing of model.wings) this.moveWing(wing,size,spread,stroke,delayed,bank);
            const look=(1-tuck)*.027*Math.sin(t*1.4+i*2.3);
            place(model.body,[0,.24,-.21],[0,.32,.18]);
            place(model.tail,[0,.263,-.12],[0,.22,-.37]);
            place(model.lowerNeck,[0,.28,.095],[0,.423,.173-.036*tuck]);
            place(model.upperNeck,[0,.399,.168-.036*tuck],[look,.493-.042*tuck,.214+.020*tuck]);
            place(model.head,[look,.492-.042*tuck,.175+.021*tuck],[look,.499-.052*tuck,.295+.021*tuck]);
            place(model.bill,[look,.498-.051*tuck,.276+.021*tuck],[look,.478-.060*tuck,.405+.021*tuck]);
            for(let k=0;k<2;k++) {
                const side=k===0 ? -1 : 1, leg=model.legs[k];
                const heel=[side*.040,.009+.167*tuck,-.026-.28*tuck];
                place(leg.shank,[side*.048,.236,-.035],heel);
                place(leg.foot,heel,[heel[0]+side*.012,.007+.151*tuck,.058-.45*tuck]);
                place(leg.eye,[look+side*.043,.497-.047*tuck,.253+.020*tuck],
                    [look+side*.045,.510-.047*tuck,.256+.020*tuck]);
            }
        });
    }
}

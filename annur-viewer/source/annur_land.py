"""Lake edge, landscaped grounds and tree-covered ridges for the An-Nur exterior study."""
import math
import random

TAU = math.tau

def build_plaza(s):
    """Model the stepped grass court and two-bay service roof from the plan photographs."""
    paving = '#dcd7c8'
    coping = '#e8e4d8'
    concrete = '#ece9df'
    blade = '#698282'
    grass = '#769556'
    ground, floor = .38, 1.15

    def slab(name, x0, x1, z0, z1, bottom, top, color):
        if x1 > x0 and z1 > z0:
            s.box(name,((x0+x1)/2,(bottom+top)/2,(z0+z1)/2),
                  (x1-x0,top-bottom,z1-z0),color)

    def surface(name,x0,x1,z0,z1,y,col):
        s.tri(name,(x0,y,z0),(x0,y,z1),(x1,y,z1),col)
        s.tri(name,(x0,y,z0),(x1,y,z1),(x1,y,z0),col)

    # Survey the orthogonal shoreline in strips. The turf is one uninterrupted
    # field with a long straight return on its service side.
    courts=[(-47,-42,-45),(-42,-37,-50),(-37,-32,-55),(-32,-27,-60),
            (-27,-22,-65),(-22,-2,-88),(-2,3,-83),(3,8,-78),
            (8,13,-73),(13,18,-68),(18,22,-63),(22,27,-59)]
    for i,(a,b,back) in enumerate(courts):
        slab('Plaza masonry',a,b,back,-34.10,-.51,1.08,'#a2a291')
        slab('Plaza limestone',a,b,back,-34.10,1.08,floor,paving)
        # Inset the lawn at each exposed return as well as along the front.
        left=courts[i-1][2] if i else -34.1
        right=courts[i+1][2] if i+1<len(courts) else -34.1
        for x0,x1,neighbor in [(a,a+1.75,left),(a+1.75,b-1.75,back),(b-1.75,b,right)]:
            lawn_end=min(x1,12.0)
            if lawn_end>x0 and max(back,neighbor)+1.75 < -37.3:
                surface('Plaza lawn',x0,lawn_end,max(back,neighbor)+1.75,-37.3,floor+.012,grass)
        slab('Plaza waterline coping',a,b,back,back+.18,floor,floor+.08,coping)
        if left>back:slab('Plaza waterline coping',a,a+.18,back,left,floor,floor+.08,coping)
        if right>back:slab('Plaza waterline coping',b-.18,b,back,right,floor,floor+.08,coping)

    x0,x1,z0,z1=27.0,41.8,-58.,2.0
    slab('Service wing podium',x0,x1+.45,z0-.45,z1+.5,-.47,1.04,'#a8a797')
    slab('Service wing paving',x0,x1+.45,z0-.45,z1+.50,1.04,floor,paving)
    # Covered gallery facing the court. The outer bay is occupied by the service
    # rooms and the inward strip is open, with a continuous shaded walking line.
    # The public ablution bay occupies two structural bays of the service wing.
    # Its court-side entrance is flush with the covered pedestrian gallery.
    # Two independent bays flank the central entrance passage; their exact
    # dimensions are interpretations of the roof bays on the satellite view.
    for a,b in ((z0+.62,-49.4),(-39,-32.45),(-27.15,-24.4),(-14,z1-.60)):
        slab('Service wing walls',30.15,41.27,a,b,floor,4.32,concrete)

    def ablution_wing(offset):
        room_min_z,room_max_z=-24.4+offset,-14.0+offset
        slab('Service wing walls',41.04,41.27,room_min_z,room_max_z,floor,4.32,concrete)
        for a,b in ((room_min_z,-20.9+offset),(-17.7+offset,room_max_z)):
            slab('Service wing walls',30.15,30.37,a,b,floor,4.32,concrete)
        slab('Wudu entrance lintel',30.15,30.37,-20.9+offset,-17.7+offset,3.72,4.32,concrete)
        slab('Wudu ceiling',30.37,41.04,room_min_z,room_max_z,4.10,4.22,'#ebe8db')

        # Slip-resistant rectangular floor tiles, pale celadon glazed wall tiles and
        # a deep green dado make the seated washing line legible from the doorway.
        wet_floor=1.17
        surface('Wudu floor grout',30.16,41.04,room_min_z,room_max_z,wet_floor-.006,'#8e9c96')
        nx,nz=18,17
        for i in range(nx):
            a,b=30.16+i*10.88/nx,30.16+(i+1)*10.88/nx
            for j in range(nz):
                u,v=room_min_z+j*10.4/nz,room_min_z+(j+1)*10.4/nz
                col=('#c1c9bc','#c8cdbd','#c6cdbf')[(i*5+j*7)%3]
                surface('Wudu floor tiles',a+.007,b-.007,u+.007,v-.007,wet_floor,col)
        wall_tiles=('#b3cfc3','#afc9be','#bdd4c6','#c0d5c8')
        for j in range(20):
            u=room_min_z+j*.52+.004;v=u+.512
            for row in range(4):
                bottom=wet_floor+row*.36+.004
                slab('Wash bay glazed tiles',41.016,41.038,u,v,bottom,bottom+.352,
                     wall_tiles[(j*5+row*3)%4])
        slab('Wash bay dado',40.999,41.039,room_min_z,room_max_z,2.62,2.71,'#507973')
        slab('Wudu slotted drain',40.39,40.57,room_min_z+.36,room_max_z-.36,
             wet_floor,wet_floor+.011,'#536765')
        for j in range(72):
            z=room_min_z+.39+j*.132
            slab('Drain cover slats',40.39,40.57,z,z+.040,wet_floor+.011,wet_floor+.024,'#a5b2ac')

        # The long channel is interrupted at each seat so the user's feet reach the
        # sloping, drained wet floor. The concrete seats are fixed to short plinths.
        for j in range(6):
            z=-23.18+offset+j*1.60
            slab('Wudu stool plinths',39.4,39.76,z-.18,z+.18,wet_floor,1.52,'#92aaa1')
            slab('Wudu fixed seats',39.3,39.86,z-.30,z+.30,1.52,1.64,'#dce0d0')
            s.beam('Wudu tap fittings',(41.0,1.99,z),(40.73,1.99,z),.037,'#a8b8b7',10)
            s.beam('Wudu tap fittings',(40.73,1.99,z),(40.68,1.90,z),.042,'#b4c0bf',10)
            s.beam('Wudu tap fittings',(40.82,2.00,z),(40.82,2.09,z),.023,'#a4b0ac',8)
            s.beam('Wudu tap fittings',(40.82,2.09,z-.089),(40.82,2.09,z+.089),.018,'#c3cecb',8)
            # Compact stone footrest on the dry side of the grating.
            slab('Wudu footrests',40.13,40.33,z-.27,z+.27,wet_floor,1.31,'#a6b3a9')
        for z in (-22.60+offset,-16.8+offset):
            for x in (33.1,38.8):
                s.lathe('Wash bay ceiling lights',x,z,[(4.075,.115),(4.091,.14)],'#f8edce',10)

        slab('Dry wudu threshold',30.14,31.18,-20.9+offset,-17.7+offset,1.15,1.31,'#dfd9c6')
        slab('Wudu privacy partition wall',32.04,32.17,-21.3+offset,-17.2+offset,1.17,3.42,concrete)
        for x in (34.0,36.6):
            z=room_min_z+.39
            s.lathe('Ceramic wash basins',x,z,[(1.17,.15),(1.80,.14),(1.92,.34),(2.04,.36),(2.04,.29),(1.93,.10)],'#ecece0',16,False)
            s.beam('Basin tap fittings',(x,2.02,z-.27),(x,2.20,z-.27),.025,'#91a3a2')
            s.beam('Basin tap fittings',(x,2.20,z-.27),(x,2.20,z-.12),.025,'#91a3a2')
            slab('Wudu mirror frames',x-.49,x+.49,room_min_z,room_min_z+.06,2.25,3.22,'#899895')
            slab('Wash bay mirrors',x-.46,x+.46,room_min_z+.06,room_min_z+.065,2.28,3.19,'#aec5c3')
    ablution_wing(0)
    ablution_wing(-25)
    for k in range(11):
        z=z0+.77+k*((z1-z0)-1.52)/10
        slab('Gallery piers',27.19,27.56,z-.19,z+.19,floor,4.25,concrete)
        slab('Gallery piers',29.83,30.31,z-.21,z+.21,floor,4.28,concrete)
        if k==10:
            continue
        mid=z+2.28
        for x in (30.13,41.29):
            if x<31.0 and any(mid-1.51<hi and mid+1.51>lo for lo,hi in ((-20.9,-17.7),(-45.9,-42.7))):
                continue
            if -33.8<mid<-25.8:continue
            outer=1 if x>40 else -1
            slab('Service opening reveals',x-.025,x+.025,mid-1.43,mid+1.43,2.72,3.78,'#485d5a')
            for row in range(4):
                y=2.78+row*.24
                slab('Service ventilating louvres',x+.05*outer-.025,x+.05*outer+.025,
                     mid-1.40,mid+1.40,y,y+.08,blade)
            slab('Service opening sills',x-.10,x+.10,mid-1.51,mid+1.51,2.65,2.74,coping)

    # Lengthwise roof ranges flank a narrow longitudinal gutter. A transverse flat
    # plant bay breaks both ranges, corresponding to the tank bay on the plan.
    roof0,roof1=26.94,41.91
    for za,zb in ((z0,-32.7),(-26.9,z1)):
        for xa,xb in ((roof0,34.65),(34.94,roof1)):
            slab('Service roof eaves',xa,xb,za,zb,4.23,4.40,'#cfcbbd')
            midx=(xa+xb)*.5
            for a,b,y0,y1 in ((xa,midx,4.42,4.64),(midx,xb,4.64,4.42)):
                s.tri('Aluminium service roof',(a,y0,za),(a,y0,zb),(b,y1,zb),'#c7c9c0')
                s.tri('Aluminium service roof',(a,y0,za),(b,y1,zb),(b,y1,za),'#c7c9c0')
                count=max(2,round((b-a)/.52))
                for j in range(1,count+1):
                    t=j/count
                    x=a+(b-a)*t
                    y=y0+(y1-y0)*t
                    slab('Roof standing seams',x-.025,x+.025,za+.04,zb-.04,y,y+.035,'#b0b6af')
            for x in (xa,xb):
                slab('Roof fascia trims',x-.05,x+.05,za,zb,4.30,4.58,coping)
            for z in (za,zb):
                slab('Roof fascia trims',xa,xb,z-.05,z+.05,4.30,4.68,coping)
        slab('Roof gutter',34.64,34.95,za,zb,4.25,4.32,'#84928d')
    slab('Service plant roof',roof0,roof1,-32.7,-26.9,4.24,4.49,'#aaa99a')
    for x in (roof0,roof1):
        slab('Service plant upstand',x-.1,x+.1,-32.7,-26.9,4.46,4.87,concrete)
    for z in (-32.70,-26.90):
        slab('Service plant upstand',roof0,roof1,z-.1,z+.1,4.46,4.87,concrete)
    s.lathe('Screened roof cistern',35.8,-29.8,
            [(4.49,2.34),(4.58,2.41),(5.54,2.41),(5.65,2.33),(5.75,.18)],
            '#b1b7ac',24)

    # The single row turns from the rear canopy alongside the grass court.
    for i in range(5):
        z=-33.39-i*4.88
        slab('Service colonnade roof',22.86,27.94,z-4.88,z,4.60,5.14,coping)
        slab('Service colonnade deck',22.74,27.10,z-4.88,z,-.46,floor+.025,paving)
        for x in (22.94,27.60):
            slab('Service colonnade columns',x-.18,x+.18,z-4.78,z-4.40,floor,4.62,concrete)
        slab('Lantern grille',23.53,27.27,z-4.24,z-.64,5.14,5.73,blade)
        slab('Lantern cornice',23.36,27.44,z-4.40,z-.48,5.73,5.91,coping)
        s.lathe('Service gallery lanterns',25.40,z-2.44,
                [(5.91,1.66),(6.17,1.63),(6.67,1.41),(7.12,.84),(7.36,.03)],concrete,24)

    # Street elevation. Successive recessed pointed arches frame the open passage.
    mid=-29.8
    for k in range(5):
        outer=5.5-.41*k
        span=4.20-.39*k
        spring=3.58-.15*k
        peak=7.32-.54*k
        x=42.50-.29*k
        top=8.72-.30*k
        profile=[(-outer,floor),(-span,floor),(-span,spring)]
        for j in range(1,17):
            t=j/16
            profile.append((-span+2*span*t,spring+(peak-spring)*(1-.67*abs(2*t-1)-.33*abs(2*t-1)**3)))
        profile.extend([(span,floor),(outer,floor)])
        for (u,y),(v,h) in zip(profile,profile[1:]):
            if u!=v:
                s.quad('Stepped street portal',(x,y,mid+u),(x,h,mid+v),
                       (x,top,mid+v),(x,top,mid+u),concrete)
            s.quad('Street arch reveals',(x,y,mid+u),(x-.29,y,mid+u),
                   (x-.29,h,mid+v),(x,h,mid+v),'#d0cebf')
        slab('Street portal coping',x-.29,x,mid-outer,mid+outer,top,top+.08,coping)
    slab('Street entrance paving',41.27,48.0,mid-6,mid+6,-.35,floor,paving)

    # The road and paved apron run across the entrance elevation.
    slab('Street forecourt paving',42.27,48.0,-58.3,2.45,.48,1.06,'#bdafa2')
    slab('Street carriageway',48.0,59.5,-59.0,2.45,.45,1.02,'#858789')
    # Oval drop-off loop on the street side of the portal. The pedestrian
    # crossing joins the eastern apron and the covered perimeter walkway.
    for i in range(48):
        a,b=TAU*i/48,TAU*(i+1)/48
        def edge(t,rx,rz,y):
            return (55+rx*math.cos(t),y,mid+rz*math.sin(t))
        for rx0,rz0,rx1,rz1,h,col,name in [
                (0,0,2.68,4.85,1.28,'#839568','Drop-off planted island'),
                (2.68,4.85,2.94,5.11,1.28,'#dfdbcf','Roundabout kerb'),
                (2.94,5.11,7.02,9.17,1.055,'#838385','Drop-off carriageway')]:
            s.quad(name,edge(a,rx0,rz0,h),edge(b,rx0,rz0,h),edge(b,rx1,rz1,h),edge(a,rx1,rz1,h),col)
        s.quad('Roundabout kerb',edge(a,2.94,5.11,1.055),edge(a,2.94,5.11,1.28),edge(b,2.94,5.11,1.28),edge(b,2.94,5.11,1.055),coping)
    for i in range(5):
        slab('Pedestrian crossing',48.1+i*.78,48.52+i*.78,mid-1.30,mid+1.30,1.055,1.07,coping)
    for z in range(-56,1,8):
        if abs(z-mid)<10:continue
        slab('Street lane markings',53.65,53.78,z,z+2.25,1.02,1.035,'#dcd7c2')
    for z in range(-55,2,6):
        if -35.35<z<-24.25:continue
        for x in (42.1,44.8):
            slab('Street portico piers',x-.12,x+.12,z-.12,z+.12,1.06,3.74,concrete)
    for a,b in ((-58.,-35.35),(-24.25,2.0)):
        slab('Street portico eaves',41.40,45.1,a,b,3.70,3.92,coping)
    # The straight covered link runs along the outside of the service wing
    # and continues above the lake on piers, visible in the aerial photograph.
    for bay in range(11):
        za=2.5+bay*5.2
        zb=za+5.2
        slab('Covered bridge paving',40.10,43.25,za,zb,.86,floor,paving)
        slab('Covered bridge canopy',39.90,43.45,za,zb,4.12,4.32,coping)
        for x in (40.24,43.12):
            slab('Bridge piers',x-.12,x+.12,za,za+.25,-.8,4.12,concrete)
            slab('Bridge handrail',x-.035,x+.035,za,zb,2.13,2.20,blade)


def build(s):
    rng = random.Random(41932)
    # The mosque-side landing sits at the southern extremity of an asymmetric lake.
    # Radial distance to the lip varies continuously, including across the angle seam.
    def shore(a):
        north = math.cos(a)
        variation = 4.0 * math.sin(3*a) + 2.2 * math.sin(5*a) + 2.0 * math.sin(7*a)
        lake = 96 + 34*north - 20*north*north + max(0, north)*29 + max(0,-north)*44 + variation
        # The street meets the service podium and continues along the shore.
        east=math.sin(a)
        if east>.15:
            street=42.2/east
            shore_z=street*north
            if shore_z<5:
                lake=min(lake,street+max(0.,shore_z-1.)**2)
        return lake

    def hill(a):
        return (12.4 + 6.0*math.cos(3*a-.6) + 3.6*math.cos(9*a+2) + 1.7*math.cos(19*a)
                + 1.0*math.sin(28*a+.7) + .7*math.sin(35*a+.33))

    def elevation(a, d):
        if d < 0:
            return -.54 + (d+1.1)*.37
        if d < 1.6:
            return -.133 + d*.68
        t = min(1, (d-1.6)/15)
        ground = .955 + t*(.48 + .45*math.sin(a*6+d*.06)) + .009*d
        # Grass gives way to an irregular wooded rise behind the landscaped banks.
        ridge = max(0, min(1, (d-51)/102))**1.5 * hill(a) + max(0,(d-170)/124) * (.26*hill(a)+5)
        # Keep the bank beneath the plinth and the planted court below their paving.
        x,z = (shore(a)+d)*math.sin(a),(shore(a)+d)*math.cos(a)
        edge = max(-48-x, x-60, -89-z, z-3)
        blend = max(0,min(1,(3.5-edge)/3.5))
        return (ground+ridge)*(1-blend)+min(.79,ground+ridge)*blend

    def pt(a, d, lift=0):
        r = shore(a)+d
        return (r*math.sin(a), elevation(a,d)+lift, r*math.cos(a))

    def tri(name, a, b, c, col):
        s.tri(name, a, b, c, col)

    def quad(name, a, b, c, d, col):
        tri(name,a,b,c,col)
        tri(name,a,c,d,col)

    bands = [-1.1,0,.45,1.6,3.8,7,15,25,38,55,76,101,132,162,210,265,326]
    ground_colors = ['#84956b','#83966c','#82936a','#86966b']
    horizon_colors = ['#738878','#788d7f','#7a9084','#84968a']
    arc_n = 160
    rings = [[pt(TAU*i/arc_n,d) for i in range(arc_n)] for d in bands]
    for j,d in enumerate(bands[:-1]):
        mid = (d+bands[j+1])/2
        for i in range(arc_n):
            nxt = (i+1)%arc_n
            name = 'Banks'
            if d < .45:
                color = rng.choice(('#8b897b','#8b8a79','#898777','#8d8b7a'))
            elif d < 1.6:
                color = rng.choice(('#8d9273','#919475','#8d9171'))
            elif d < 55:
                name = 'Lawns'
                color = rng.choice(ground_colors)
            else:
                name = 'Ridges'
                color = horizon_colors[min(3,int((mid-50)/65))]
            quad(name,rings[j][i],rings[j+1][i],rings[j+1][nxt],rings[j][nxt],color)

    def walk_edge(a):
        return 5.1 + .7*(1+math.cos(a*5+.7))

    for i in range(arc_n):
        a,b=TAU*i/arc_n,TAU*(i+1)/arc_n
        if math.cos((a+b)/2) > .48:
            continue
        wa,wb=walk_edge(a),walk_edge(b)
        for inner,outer,color in ((-.12,0,'#a3a391'),(0,1.78,'#c6c4af'),(1.78,1.89,'#a3a391')):
            quad('Lakeside walk',pt(a,wa+inner,.055),pt(a,wa+outer,.055),
                 pt(b,wb+outer,.055),pt(b,wb+inner,.055),color)
    def height_at(x,z):
        a = math.atan2(x,z)
        return elevation(a,math.hypot(x,z)-shore(a))

    def woodland_edge(a):
        return 56 + 7*math.cos(4*a+1) + 4.7*math.sin(9*a+.3) + 2.4*math.cos(15*a)

    def woodland_height(x,z):
        a=math.atan2(x,z)
        depth=math.hypot(x,z)-shore(a)-woodland_edge(a)
        t=max(0,min(1,depth/13))
        canopy=5.7+.94*math.sin(x*.21+z*.17)+1.00*math.cos(z*.26-x*.10)
        canopy+=.73*math.sin(x*.47+z*.23)+.54*math.cos(z*.62+x*.31)
        canopy+=1.45*math.cos(x*.054+z*.081)+.67*math.sin(z*.105)
        return height_at(x,z)+canopy*t-.14

    # Stagger the rows so the woodland silhouette varies independently of the shore.
    wood_rows=[]
    wood_arc=320
    depths=[0,2.5,6,10,15]+[20+3.8*i for i in range(35)]+[157,171,191,221,257,294]
    for row,depth in enumerate(depths):
        points=[]
        for i in range(wood_arc):
            a=(i+(.31 if row%2 else -.08))*TAU/wood_arc
            x,_,z=pt(a,woodland_edge(a)+depth)
            points.append((x,woodland_height(x,z),z))
        wood_rows.append(points)
    wood_colors=('#496951','#4b6b53','#4e6d55','#517057','#53735a','#57765c',
                 '#5a785f','#5d7a62','#617d65','#668069','#6b856f','#718976')
    for j,(lo,hi) in enumerate(zip(wood_rows,wood_rows[1:])):
        for i in range(wood_arc):
            k=(i+1)%wood_arc
            x,_,z=hi[i]
            wave=.50+.17*math.sin(x*.21+z*.17)+.13*math.cos(z*.26-x*.10)
            wave+=.11*math.cos(x*.081-z*.052)+.06*math.sin(z*.41+x*.31)
            shade=max(0,min(11,int((1.5+5.8*wave+min(3.5,j*.077)))))
            quad('Wooded ridges',lo[i],hi[i],hi[k],lo[k],wood_colors[shade])

    crown_groups=[
        ('#466448','#4b6a4b','#517050','#577653'),
        ('#3d5b45','#45634a','#4c6a4f','#527254'),
        ('#466752','#4b6b54','#527057','#58785d'),
        ('#526a43','#576e45','#5d754a','#637b4e'),
        ('#426749','#496e4e','#517451','#567b57'),
    ]
    def crown(cx,cy,cz,rx,ry,rz,colors,segments=8,distant=False):
        phase=rng.uniform(0,TAU)
        angles=[phase+i*TAU/segments+rng.uniform(-.10,.10) for i in range(segments)]
        shape=[rng.uniform(.83,1.15) for _ in angles]
        stack=[]
        levels=((-.62,.70),(-.07,1.0),(.55,.84)) if not distant else ((-.46,.78),(.14,1.0),(.65,.68))
        for h,width in levels:
            tier=[]
            twist=.17*math.sin(h*2+.38)
            for i,a in enumerate(angles):
                rr=shape[i]*width*rng.uniform(.92,1.07)
                tier.append((cx+rx*rr*math.cos(a+twist)+rx*.16*h,
                             cy+ry*(h+rng.uniform(-.15,.15)),cz+rz*rr*math.sin(a+twist)))
            stack.append(tier)
        bark_side=rng.randrange(4)
        for level,(lo,hi) in enumerate(zip(stack,stack[1:])):
            for i in range(segments):
                j=(i+1)%segments
                # Lobes retain their local hue through all elevations. Lighting
                # supplies the vertical gradient, so no latitude bands are visible.
                side_shade=int(.6*math.sin(angles[i]+phase)+.48*math.cos(angles[i]*2))
                color=colors[max(0,min(3,bark_side+side_shade))]
                quad('Tree crowns',lo[i],hi[i],hi[j],lo[j],color)
        top=(cx+rx*rng.uniform(-.21,.21),cy+ry,cz+rz*rng.uniform(-.20,.20))
        bottom=(cx,cy-.78*ry,cz)
        for i in range(segments):
            j=(i+1)%segments
            tri('Tree crowns',stack[-1][i],top,stack[-1][j],colors[bark_side])
            tri('Tree crowns',stack[0][i],stack[0][j],bottom,colors[bark_side])

    def tree(x,z,h,broad,distant):
        ground=height_at(x,z)-.25
        radius=h*broad
        colors=rng.choice(crown_groups)
        if distant:
            colors=rng.choice((('#52715a','#58755d','#5d7b60','#637e66'),
                              ('#526b53','#597257','#60785b','#667c60')))
        lean=(x+rng.uniform(-.48,.48),ground+h*.43,z+rng.uniform(-.48,.48))
        s.beam('Tree bark',(x,ground-.23,z),lean,h*.026,'#686451',sides=5 if distant else 7)
        crown(x,ground+h*.80,z,radius*.60,h*.22,radius*.61,colors,8 if not distant else 6,distant)
        count=rng.choice((3,4)) if distant else rng.choice((7,8,9))
        phase=rng.uniform(0,TAU)
        for i in range(count):
            a=phase+TAU*i/count+rng.uniform(-.22,.22)
            span=radius*rng.uniform(.37,.78)
            cx,cz=x+span*math.cos(a),z+span*math.sin(a)
            yc=ground+h*rng.uniform(.55,.80)
            if not distant or i%2==0:
                s.beam('Tree bark',(lean[0],lean[1]-.09*h,lean[2]),(cx,yc,cz),
                       h*(.014 if distant else .012),'#6b6551',sides=4)
            crown(cx,yc,cz,radius*rng.uniform(.34,.61),h*rng.uniform(.14,.24),radius*rng.uniform(.34,.60),
                  colors,7 if not distant else 5,distant)

    # Feather palms have individual leaflets on arching rachises, grouped around a leaning bole.
    def palm(x,z,h):
        y=height_at(x,z)-.10
        a=rng.uniform(0,TAU)
        lean=h*rng.uniform(.06,.14)
        def stem(t):
            return (x+lean*t*t*math.cos(a),y+h*t,z+lean*t*t*math.sin(a))
        for i in range(5):
            s.beam('Palm trunks',stem(i/5),stem((i+1)/5),(.18-.06*i/4)*h/9,
                   '#888674' if i<4 else '#8d9770',sides=8)
        xx,yy,zz=stem(1)
        for f in range(12):
            ang=a+f*TAU/12+rng.uniform(-.1,.1)
            dx,dz=math.cos(ang),math.sin(ang)
            L=h*rng.uniform(.34,.55)
            droop=rng.uniform(.16,.45)
            edge_color=rng.choice(('#496b48','#55774d','#63804f'))
            upper=rng.choice(('#668352','#718957','#608050'))
            def frond(t):
                return (xx+dx*L*t,yy+L*(.24*math.sin(t*math.pi)-droop*t*t+.03),
                        zz+dz*L*t)
            for k in range(3):
                s.beam('Palm rachises',frond(k/3),frond((k+1)/3),(.031-.007*k)*h/9,'#76835a',sides=3)
            for k in range(1,11):
                t=k/11.8
                p=frond(t)
                q=frond(min(.995,t+.10))
                spread=L*(.04+.16*math.sin(math.pi*t)**.7)
                for side in (-1,1):
                    tx=p[0]+dx*L*.17-side*dz*spread
                    tz=p[2]+dz*L*.17+side*dx*spread
                    tip=(tx,p[1]-.53*spread,tz)
                    waist=((p[0]+tx)*.5-dx*L*.018,p[1]-.10*spread,(p[2]+tz)*.5-dz*L*.018)
                    tri('Palm fronds',p,tip,waist,edge_color)
                    tri('Palm fronds',q,waist,tip,upper)

    tree_spots=[]
    for n in range(540):
        a=rng.uniform(0,TAU)
        d=rng.uniform(11,77)
        x,_,z=pt(a,d)
        # Leave the open green near the ceremonial axis and generous space between groves.
        if (-91<z<4 and -47<x<80) or (z<0 and -20<x<max(18,(-z-43)*.36) and d<58) or (d<28 and math.sin(5*a+1)>.38):
            continue
        if any((x-u)**2+(z-v)**2<50 for u,v in tree_spots):
            continue
        tree_spots.append((x,z))
        if len(tree_spots)>=119:
            break
    for x,z in tree_spots:
        tree(x,z,rng.uniform(5.9,12.6),rng.uniform(.36,.56),False)
    for n in range(177):
        a=rng.uniform(0,TAU)
        d=woodland_edge(a) + rng.triangular(-4,112,18)
        x,_,z=pt(a,d)
        tree(x,z,rng.uniform(7.3,11.9),rng.uniform(.46,.70),True)
    for a,d,h in ((2.74,9,8),(2.83,11,7.7),(3.49,10,9.5),(3.66,12,8.3),
                  (4.05,10,9),(4.20,9,8.2),(1.85,10,9.6),(1.96,11,8.4)):
        x,_,z=pt(a,d)
        if not (-60<z<-3 and -42<x<56):
            palm(x,z,h)

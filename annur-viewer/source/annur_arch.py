"""An architectural interpretation of Masjid An-Nur from the supplied photographs."""
from math import sin, cos, pi, sqrt, ceil

WHITE = '#eeeae0'
CREAM = '#e3dfd2'
TRIM = '#faf6eb'
SHADE = '#bab7ac'
GLASS = '#387677'
MULLION = '#aec4bc'
SLATE = '#3b5154'
METAL = '#777d76'
TILE = '#ddd8c8'


def rear_prayer_room(s):
    """Walkable rear musalla, with the doorway facing the entrance causeway."""
    box = s.box

    def quad(part, a, b, c, d, color):
        s.tri(part, a, b, c, color)
        s.tri(part, a, c, d, color)

    # Four broad treads connect the lake platform to the carpeted prayer floor.
    for i in range(4):
        rise = .095*(i+1)
        box('Entrance stair nosings', (0, 1.15+rise/2, -20.76+i*.48),
            (11.30, rise, .48), TRIM)
    box('Entrance landing', (0, 1.34, -18.53), (11.30, .38, 1.10), TILE)
    box('Prayer floor substrate', (0, 1.33, -11.43), (22.52, .37, 13.10), CREAM)

    # Precisely adjacent strips let the dark row dividers stay flush with the carpet.
    def carpet_strip(z0, z1, color):
        quad('Woven prayer carpet', (-11.26,1.53,z0), (-11.26,1.53,z1),
             (11.26,1.53,z1), (11.26,1.53,z0), color)

    z0 = -17.98
    for line in (-16.78, -15.08, -13.38, -11.68, -9.98, -8.28, -6.58):
        carpet_strip(z0, line, '#89aba8')
        carpet_strip(line, line+.040, '#365e67')
        carpet_strip(line+.040, line+.064, '#c7c2a1')
        carpet_strip(line+.064, line+.104, '#365e67')
        z0 = line+.104
    carpet_strip(z0, -4.62, '#89aba8')

    # Separate runner borders and fields share edges instead of stacked surfaces.
    for cx in (0., 2.):
        rug = 'Woven prayer rugs'
        floor = 1.537
        for left, right, col in ((-.49,-.45,'#af9969'),(-.45,.45,'#366c64'),(.45,.49,'#af9969')):
            quad(rug,(cx+left,floor,-13.77),(cx+left,floor,-12.15),
                 (cx+right,floor,-12.15),(cx+right,floor,-13.77),col)
        for z in (-13.81,-12.15):
            quad(rug,(cx-.49,floor,z),(cx-.49,floor,z+.04),
                 (cx+.49,floor,z+.04),(cx+.49,floor,z),'#aa9366')

    # Two glazed wings and a high fanlight leave a full-height open portal below.
    for sign in (-1, 1):
        wing_x = sign*6.70
        box('Clear architectural glazing', (wing_x, 4.04, -18.0),
            (9.20, 5.75, .10), '#557e7c')
        box('Clear architectural glazing', (sign*11.25, 4.04, -11.43),
            (.10, 5.75, 13.00), '#658b86')
        for x in (2.19, 4.0, 6.0, 8.0, 10.0):
            box('Rear entrance glazing bars', (sign*x, 4.12, -18.07),
                (.085, 5.68, .08), MULLION)
        for y in (2.16, 3.21, 4.26, 5.31, 6.36):
            box('Rear entrance transoms',(wing_x, y, -18.07),(9.20,.047,.065),MULLION)
        for x in (2.48, 6.0, 10.0):
            box('Entrance piers',(sign*x,4.08,-18.45),(.53,5.86,.63),WHITE)
        for z in (-17.6, -14.6, -11.6, -8.6, -5.6):
            box('Inner window frames',(sign*11.18,4.12,z),(.085,5.46,.08),CREAM)
        box('Inner window frames',(sign*11.18,3.92,-11.43),(.085,.085,13.00),CREAM)
    box('Clear architectural glazing',(0,6.30,-18.0),(4.20,1.08,.10),'#628782')
    box('Portal head',(0,5.73,-18.0),(4.20,.06,.21),CREAM)

    # The photographed rear doors look through into the domed hall.
    for x in (-10.3,-6.8,-3.4,3.4,6.8,10.3):
        box('Lobby door mullions',(x,3.27,-4.78),(.085,3.5,.12),MULLION)
    box('Lobby door transom',(0,4.17,-4.78),(21.2,.085,.12),MULLION)

    # The rear soffit carries shallow recessed warm-white ceiling fittings.
    for x in (-7.,-2.7,2.7,7.):
        for z in (-15.5,-10.5,-6.5):
            for k in range(12):
                a,b = k*pi/6,(k+1)*pi/6
                s.tri('Ceiling downlights',(x,6.85,z),
                      (x+.13*cos(a),6.85,z+.13*sin(a)),
                      (x+.13*cos(b),6.85,z+.13*sin(b)),'#fff1cb')


def build(s):
    box, tri, lathe = s.box, s.tri, s.lathe
    def quad(name,a,b,c,d,col):
        tri(name,a,b,c,col)
        tri(name,a,c,d,col)
    def deck_piece(x1,x2,z1,z2):
        x,z=(x1+x2)/2,(z1+z2)/2
        w,d=x2-x1,z2-z1
        quad('Travertine paving',(x1,1.15,z1),(x1,1.15,z2),
             (x2,1.15,z2),(x2,1.15,z1),TILE)
        quad('Waterline plinth',(x1,-.515,z1),(x2,-.515,z1),
             (x2,-.515,z2),(x1,-.515,z2),'#989b87')
        # Set out the paving from a single datum across the stepped terraces.
        for i in range(ceil(x1/2),ceil(x2/2)):
            if i*2>x1+.01:
                box('Paving joints',(i*2,1.151,z),(.019,.003,d),'#b7b2a3')
        for j in range(ceil(z1/2),ceil(z2/2)):
            if j*2>z1+.01:
                box('Paving joints',(x,1.152,j*2),(w,.003,.019),'#b7b2a3')
    def railing(x1,z1,x2,z2):
        length=((x2-x1)**2+(z2-z1)**2)**.5
        if length<.05:return
        count=ceil(length/1.8)
        for i in range(count):
            t=i/count
            x,z=x1+(x2-x1)*t,z1+(z2-z1)*t
            box('Terrace balusters',(x,1.64,z),(.10,1.0,.10),METAL)
        for y,thick,col in [(1.53,.03,'#9ca09a'),(1.82,.031,'#9ca09a'),(2.13,.065,'#817e70')]:
            box('Terrace handrail',((x1+x2)/2,y,(z1+z2)/2),
                (abs(x2-x1)+thick,thick,abs(z2-z1)+thick),col)
    # The platform follows the receding pavilion bays on either side.
    limits=[(-47,-42,-11),(-42,-37,-6),(-37,-32,-1),(-32,-27,4),
            (-27,-22,7),(-22,22,24),(22,26,7),(26,27,2)]
    back=-34.1
    outline=[p for a,b,front in limits for p in ((a,front),(b,front))]
    outline.extend([(27,back),(-47,back)])
    for (ax,az),(bx,bz) in zip(outline,outline[1:]+outline[:1]):
        for name,lo,hi,col in [('Waterline plinth',-.515,.63,'#989b87'),
                               ('Terrace coping',.63,1.09,CREAM),('Travertine paving',1.09,1.15,TILE)]:
            quad(name,(ax,lo,az),(bx,lo,bz),(bx,hi,bz),(ax,hi,az),col)
    for i,(a,b,f) in enumerate(limits):
        deck_piece(a,b,back,f)
        railing(a,f,b,f)
        if i:railing(a,limits[i-1][2],a,f)
    railing(-47,back,-47,-11)
    railing(27,2,27,-6.7)

    for lamp_x in (-10.4,10.4):
        lathe('Terrace bollards',lamp_x,23.5,[(1.15,.13),(1.24,.13),(1.26,.085),(1.94,.085)],METAL,12)
        lathe('Bollard lenses',lamp_x,23.5,[(1.94,.096),(2.13,.096)],'#fff1ce',12)
        lathe('Terrace bollard caps',lamp_x,23.5,[(2.13,.13),(2.17,.13),(2.20,.075)],METAL,12)
    # Structure with corner chamfers and glazing recessed behind the white fins.
    def clipped_rect(hx,hz,cut,cy):
        return [(-hx+cut,cy,6+hz),(hx-cut,cy,6+hz),(hx,cy,6+hz-cut),
                (hx,cy,6-hz+cut),(hx-cut,cy,6-hz),(-hx+cut,cy,6-hz),
                (-hx,cy,6-hz+cut),(-hx,cy,6+hz-cut)]
    def ring(name,a,b,col):
        for i in range(len(a)):
            j=(i+1)%len(a)
            quad(name,a[i],a[j],b[j],b[i],col)
    for y0,y1,hx0,hx1,hz0,hz1,c0,c1,col in [
        (1.15,1.48,13.4,13.4,11,11,2.4,2.4,CREAM),
        (1.48,7.42,12.9,12.9,10.7,10.7,2.0,2.0,'#396567'),
        (7.42,10.1,12.9,13.4,10.7,11.2,2.0,2.95,WHITE),
        (10.1,10.52,13.4,13.4,11.2,11.2,2.95,2.95,TRIM)]:
        lo, hi = clipped_rect(hx0,hz0,c0,y0), clipped_rect(hx1,hz1,c1,y1)
        for i in range(8):
            j=(i+1)%8
            if i in (2,6) and y0<10.1:
                continue  # Full-height glazed side elevations are built below.
            if i==4 and y0<7.4:
                continue  # Open connection beneath the rear gallery.
            if i in (1,7) and 1.47<y0<1.49:
                quad('Clear architectural glazing',lo[i],lo[j],hi[j],hi[i],'#bedbdd')
            else:
                quad('Prayer hall envelope',lo[i],lo[j],hi[j],hi[i],WHITE if i==0 else col)

    # A broad stone ramp bridges the 380 mm rise to the main hall's carpet.
    quad('East hall threshold',(12.82,1.53,5.55),(12.82,1.53,8.35),
         (14.90,1.15,8.35),(14.90,1.15,5.55),TILE)
    for z in (5.55,8.35):
        tri('East hall threshold',(12.82,1.15,z),(12.82,1.53,z),(14.90,1.15,z),CREAM)
    box('East portal head',(12.90,4.72,6.95),(.38,.14,2.80),TRIM)
    for z in (5.47,8.43):
        box('East portal stone frame',(12.92,3.05,z),(.36,3.84,.16),TRIM)
    roof=clipped_rect(13.4,11.2,2.95,10.52)
    # Line the opening around the dome and leave its vault visible from below.
    edge=[]
    for i,a in enumerate(roof):
        b=roof[(i+1)%len(roof)]
        count=ceil(((b[0]-a[0])**2+(b[2]-a[2])**2)**.5/.65)
        for j in range(count):
            t=j/count
            edge.append((a[0]*(1-t)+b[0]*t,a[1],a[2]*(1-t)+b[2]*t))
    inner=[]
    for x,y,z in edge:
        scale=9.38/(x*x+(z-6)**2)**.5
        inner.append((x*scale,y,6+(z-6)*scale))
    ring('Prayer hall roof',edge,inner,'#b6aa93')

    # Glazed door sets below the white beam, taller clear panes above.
    # Keep the centre leaves open on the east ramp and on the lake arcade.
    for sign in (-1,1):
        x=sign*12.90
        for za,zb in [(-2.72,5.55),(8.35,14.72)]:
            box('Clear architectural glazing',(x,2.98,(za+zb)/2),(.035,3.05,zb-za),'#b9dadb')
        box('Side gallery lintels',(x,4.96,6),(.60,.87,17.5),WHITE)
        box('Clear architectural glazing',(x,7.55,6),(.035,4.30,17.5),'#c5e4e9')
        box('Side gallery lintels',(x,9.91,6),(.72,.46,17.5),WHITE)
        for z in (-2.73,2.56,9.40,14.72):
            box('Side gallery piers',(x,5.64,z),(.45,8.21,.48),WHITE)
        for z in (-2.72,-.05,2.56,5.55,8.35,11.55,14.72):
            box('Door stiles',(x,3.01,z),(.07,3.0,.067),MULLION)
            box('High window mullions',(x,7.55,z),(.08,4.32,.065),MULLION)
        for y in (3.54,7.93):
            spans=[(-2.72,5.55),(8.35,14.72)] if y<4 else [(-2.72,14.72)]
            for za,zb in spans:
                box('Window transoms',(x,y,(za+zb)/2),(.08,.06,zb-za),MULLION)
    # Narrow vertical teal lights are inset between solid front elevation panels.
    for x,w in [(-9.4,2.24),(-6.24,1.59),(-2.84,3.30),(2.84,3.30),(6.24,1.59),(9.4,2.24)]:
        box('Qibla wall limestone',(x,5.45,16.82),(w,7.94,.35),WHITE)
    for x in (-7.8,-4.75,4.75,7.8):
        box('Tall turquoise lights',(x,5.10,16.73),(.80,6.47,.08),'#459395')
        for y in (2.64,3.71,4.78,5.85,6.92):
            box('Window transoms',(x,y,16.79),(.80,.045,.045),MULLION)
    box('Qibla wall lintel',(0,8.98,16.87),(21.6,1.03,.48),TRIM)
    # The projecting folded mihrab wall and chamfered corner fins are distinctive
    # on the lake-facing elevation.
    for sign in (-1,1):
        quad('Folded mihrab wall',(0,1.48,19.1),(sign*2.15,1.48,16.98),
             (sign*2.15,8.55,16.98),(0,8.14,19.1),WHITE if sign>0 else CREAM)
    tri('Mihrab coping',(-2.15,8.55,16.98),(2.15,8.55,16.98),(0,8.14,19.1),TRIM)
    for sign in (-1,1):
        for end in (-1,1):
            def pos(x,y,z):return (x*sign,y,6+end*z)
            lo=[pos(10.45,1.47,10.98),pos(12.06,1.47,10.08),pos(13.11,1.47,8.60)]
            hi=[pos(9.56,10.09,11.17),pos(12.27,10.09,9.66),pos(13.39,10.09,7.12)]
            quad('Folded concrete corner fins',lo[0],lo[1],hi[1],hi[0],WHITE)
            quad('Folded concrete corner fins',lo[1],lo[2],hi[2],hi[1],CREAM)
            # Central slit in the front corner piers.
            a,b=pos(11.54,1.68,10.5),pos(11.98,1.68,10.26)
            c,d=pos(11.98,7.08,10.26),pos(11.54,7.08,10.5)
            quad('Corner glazing',a,b,c,d,GLASS)

    # Pebble ballast shows through around the dome and on the rear prayer hall.
    # A quiet, irregular mineral tone follows the scale of the aggregate beds.
    def ballast(cx,cz,hx,hz,cut,height,under_dome):
        nx,nz=ceil(hx*2/.62),ceil(hz*2/.62)
        for i in range(nx):
            for j in range(nz):
                xa,xb=-hx+2*hx*i/nx,-hx+2*hx*(i+1)/nx
                za,zb=-hz+2*hz*j/nz,-hz+2*hz*(j+1)/nz
                if under_dome and max(xa*xa,xb*xb)+max(za*za,zb*zb)<9.80**2:continue
                poly=[(xa,za),(xa,zb),(xb,zb),(xb,za)]
                if cut:
                    for sx,sz in [(1,1),(1,-1),(-1,-1),(-1,1)]:
                        clipped=[]
                        for k,start in enumerate(poly):
                            end=poly[(k+1)%len(poly)]
                            d0=hx+hz-cut-start[0]*sx-start[1]*sz
                            d1=hx+hz-cut-end[0]*sx-end[1]*sz
                            if d0>=0:clipped.append(start)
                            if (d0>0 and d1<0) or (d0<0 and d1>0):
                                t=d0/(d0-d1)
                                clipped.append(tuple(a+(b-a)*t for a,b in zip(start,end)))
                        poly=clipped
                h=(i*73856093 ^ j*19349663 ^ (i*j+21)*83492791)%13
                wash=sin(xa*.83+za*.34)+.8*sin(za*.68-xa*.19)
                v=round((h-6)*.70+2.5*wash)
                col=f'#{166+v:02x}{154+v:02x}{134+v:02x}'
                points=[(cx+x,height,cz+z) for x,z in poly]
                for k in range(1,len(points)-1):
                    tri('Gravel ballast',points[0],points[k],points[k+1],col)
    ballast(0,6,13.37,11.17,2.95,10.524,True)
    ballast(0,-11.40,12.04,7.07,0,7.339,False)

    # Low flat-roofed prayer volume linking the main hall to the courtyard.
    rear_prayer_room(s)
    box('Flat roof soffit',(0,7.03,-11.4),(24.6,.32,14.72),SHADE)
    box('Flat-roof membrane',(0,7.25,-11.4),(24.2,.17,14.3),'#a29680')
    for sign in (-1,1):
        box('Roof parapets',(sign*12.16,7.45,-11.4),(.28,.65,14.6),WHITE)
        box('Roof parapets',(0,7.45,-11.4+sign*7.24),(24.4,.65,.26),WHITE)
        for z in [-5.6,-8.6,-11.6,-14.6,-17.6]:
            box('Rear colonnade',(sign*11.54,4.09,z),(.57,5.86,.52),WHITE)

    # The aerial shows a U-shaped low roof clasping the raised central block.
    for sign in (-1,1):
        box('Side gallery roof',(sign*15.02,7.10,-9.11),(5.45,.47,19.3),SHADE)
        ballast(sign*15.02,-9.11,2.70,9.61,0,7.339,False)
        for x in (12.34,17.72):
            box('Roof parapets',(sign*x,7.46,-9.11),(.18,.62,19.35),WHITE)
        for z in (-18.76,.54):
            box('Roof parapets',(sign*15.02,7.46,z),(5.54,.62,.18),WHITE)
        for z in (-17.8,-13.1,-8.4,-3.7,.3):
            box('Outer colonnade piers',(sign*17.46,4.0,z),(.48,5.69,.48),WHITE)
    # Main prayer-hall drum, alternating open louvres, and flared lower shell.
    def shell(name,prof,col,n=80):
        lathe(name,0,6,prof,col,n,capped=name.startswith('Finial'))
    shell('Circular drum plinth',[(10.51,9.84),(10.79,9.84),(10.91,9.67)],CREAM)
    shell('Clerestory glazing',[(10.89,9.52),(12.78,9.28)],SLATE)
    for k in range(60):
        a=k*2*pi/60
        x,z=cos(a),sin(a)
        s.beam('Clerestory mullions',(9.52*x,10.9,6+9.52*z),
               (9.29*x,12.80,6+9.29*z),.049,'#a6ada2',5)
    for y,r in [(10.95,9.68),(11.55,9.61),(12.16,9.52),(12.74,9.44)]:
        shell('Clerestory sunshades',[(y-.07,r-.12),(y-.04,r+.15),(y+.07,r+.17),(y+.13,r-.16)],TRIM)
    lower=[(12.84,9.29),(13.08,9.29),(13.42,9.04),(14,8.13),(14.65,7.08),(15.18,6.30),(15.53,5.88),(15.78,5.76)]
    shell('Flared dome skirt',lower,'#e2ddcf')
    # Fine radial standing seams on the gently curved skirt.
    for k in range(56):
        a=2*pi*k/56
        for (ya,ra),(yb,rb) in zip(lower[2:],lower[3:]):
            s.beam('Skirt standing seams',(ra*cos(a),ya+.012,6+ra*sin(a)),
                   (rb*cos(a),yb+.012,6+rb*sin(a)),.018,'#c3bdab',4)
    shell('Upper drum shadow reveal',[(15.76,5.74),(16.63,5.74)],'#6f7875')
    for y in [15.82,16.04,16.27,16.52]:
        shell('Upper drum mouldings',[(y-.055,5.76),(y,5.9),(y+.10,5.82)],CREAM)

    # Rhombic sheeting wraps the upper dome. Tapering diamond courses meet at
    # the cap; an inset sheet on each graphite-beige joint gives fine seams.
    n,rows=36,11
    def crown_point(i,j):
        phi=(j/rows)*pi/2
        r=5.77*cos(phi)
        return (r*cos(pi*i/n),16.6+6.58*sin(phi),6+r*sin(pi*i/n))
    def mix(a,b,t):
        return tuple(u*(1-t)+v*t for u,v in zip(a,b))
    patina=['#e8e4d5','#ece8db','#e4dfce','#eeeadd','#ebe5d3','#e7e2d1','#e9e5d8']
    for j in range(rows+1):
        for k in range(n):
            i=k*2+(j%2)
            outline=[]
            if j>0:outline.append(crown_point(i,j-1))
            outline.append(crown_point(i-1,j))
            if j<rows:outline.append(crown_point(i,j+1))
            outline.append(crown_point(i+1,j))
            # At the pole both equatorial vertices coincide; the band below closes it.
            if j==rows:continue
            center=tuple(sum(p[d] for p in outline)/len(outline) for d in range(3))
            inset=[mix(p,center,.045) for p in outline]
            for t,p in enumerate(outline):
                u=(t+1)%len(outline)
                quad('Dome diamond seams',p,outline[u],inset[u],inset[t],'#b7b09a')
                tri('Pearl aluminium diamond panels',inset[t],inset[u],center,patina[(k*13+j*5+k*j)%len(patina)])
    shell('Finial base',[(23.11,.28),(23.27,.25),(23.38,.13),(23.55,.08)],'#b69a64',32)
    shell('Finial beads',[(23.5,.07),(23.61,.14),(23.72,.09),(23.78,.046),(23.86,.092),(24.0,.045),(25.03,.008)],'#a89058',24)

    # Counts and omissions follow the overhead screenshot. The three rear
    # ranks continue across the entrance and turn down the service side.
    rows=[range(-7,6),range(-8,6),range(-8,6),(-6,-5,-4,5),
          (-5,5),(-5,5),(-5,5),(-4,4),(-3,3),(-3,3)]
    columns=set()
    for row,occupied in enumerate(rows):
        z=-30.95+row*4.88
        for col in occupied:
            x=col*5.08
            box('Canopy soffits',(x,4.78,z),(5.07,.28,4.87),CREAM)
            box('Canopy fascia',(x,5.01,z),(5.07,.21,4.87),WHITE)
            box('Canopy coping',(x,5.15,z),(4.90,.09,4.70),TRIM)
            box('Lantern grille',(x,5.48,z),(3.74,.58,3.61),'#657675')
            for dx in (-1.87,1.87):
                for dz in (-1.81,1.81):
                    box('Lantern drum piers',(x+dx,5.49,z+dz),(.19,.60,.19),TRIM)
            box('Lantern cornice',(x,5.83,z),(4.11,.16,3.98),TRIM)
            lathe('Arcade roof lanterns',x,z,[(5.91,1.66),(6.10,1.65),(6.46,1.52),
                  (6.82,1.27),(7.08,.91),(7.28,.49),(7.36,.02)],TRIM,24)
            s.lathe('Arcade downlights',x,z,[(4.624,.12),(4.643,.15)],'#ffefcf',12)
            for dx in (-2.54,2.54):
                for dz in (-2.44,2.44):
                    columns.add((round(x+dx,2),round(z+dz,2)))
    for x,z in sorted(columns):
        lathe('Flared arcade columns',x,z,[(1.15,.37),(1.38,.37),(1.57,.30),
              (2.35,.21),(3.92,.21),(4.38,.32),(4.64,.46)],WHITE,12)
        box('Arcade column capitals',(x,4.62,z),(.95,.17,.95),CREAM)

    # Broad low lakeside steps and their stone nosings.
    for i in range(3):
        box('Lake elevation stairs',(0,1.15+(i+1)*.055,20.47-i*.40),(21.4,(i+1)*.11,.43),CREAM)
